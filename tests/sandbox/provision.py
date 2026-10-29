"""Set up a fresh sandbox Home Assistant to look like the house board.

Runs against a Home Assistant that sandbox.sh reset just started on an empty config
(onboarding's user step still open). In order:
  1. onboarding: the admin user "Owner" (with a person);
  2. users "Jenn" (non-admin, with a person) and "Wall" (non-admin, the
     wall tablet's sign-in, like the house's "Clover");
  3. the calendars and to-do lists (Local Calendar / Local To-do standing in
     for iCloud and the rest), the Shopping list, and Family Hub itself;
  4. Family Hub's household settings, the Liquid Glass Tablet theme, the
     /family-hub dashboard, all from house_config.json;
  5. one board copy each for Wall (the Clover Tablet's settings) and Owner
     (the owner's phone's), so a fresh browser signed in as either opens like it;
  6. ignores the two Repairs notices that come from the sandbox itself.

Usage: <sandbox>/venv/bin/python -I -B provision.py <sandbox dir>
"""
from __future__ import annotations

import asyncio
import copy
import json
import re
import sys
from pathlib import Path

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sandbox_lib import CLIENT_ID, URL, WS, load_secrets, login, rest, sandbox_dir, save_state, token_from_code, wait_for_ha  # noqa: E402

HERE = Path(__file__).resolve().parent
HOUSE = json.loads((HERE / "house_config.json").read_text())


def _strip_sandbox_keys(value):
    if isinstance(value, dict):
        return {k: _strip_sandbox_keys(v) for k, v in value.items() if k != "sandbox_added" and not k.startswith("_")}
    if isinstance(value, list):
        return [_strip_sandbox_keys(v) for v in value]
    return value


async def flow(session, token, handler: str, *steps: dict) -> dict:
    """Run a config flow through its form steps; returns the final result."""
    result = await rest(session, token, "POST", "/api/config/config_entries/flow", {"handler": handler})
    for step in steps:
        if result.get("type") != "form":
            break
        result = await rest(session, token, "POST", f"/api/config/config_entries/flow/{result['flow_id']}", step)
    if result.get("type") == "form":
        raise RuntimeError(f"{handler} flow stopped at step {result.get('step_id')}: {result}")
    if result.get("type") != "create_entry":
        raise RuntimeError(f"{handler} flow ended with {result.get('type')}: {result.get('reason')}")
    return result


async def onboard_owner(session, secrets) -> dict:
    async with session.post(
        f"{URL}/api/onboarding/users",
        json={
            "client_id": CLIENT_ID,
            "name": "Owner",
            "username": "owner",
            "password": secrets["owner"],
            "language": "en",
        },
    ) as resp:
        if resp.status != 200:
            raise RuntimeError(f"onboarding failed: {resp.status} {await resp.text()}")
        code = (await resp.json())["auth_code"]
    return await token_from_code(session, code)


async def add_user(ws: WS, name: str, username: str, password: str, person: bool) -> str:
    user = (await ws.cmd("config/auth/create", name=name, group_ids=["system-users"], local_only=False))["user"]
    await ws.cmd("config/auth_provider/homeassistant/create", user_id=user["id"], username=username, password=password)
    if person:
        await ws.cmd("person/create", name=name, user_id=user["id"])
    return user["id"]


async def main() -> None:
    sandbox = sandbox_dir()
    secrets = load_secrets(sandbox)
    async with aiohttp.ClientSession() as session:
        await wait_for_ha(session)
        tokens = await onboard_owner(session, secrets)
        token = tokens["access_token"]
        async with WS(session, token) as ws:
            # Home Assistant 2026.10 treats the http: settings from YAML as a
            # trial that reverts (and restarts) after 5 minutes unless
            # confirmed. Confirm it, then drop the block from YAML: the
            # settings now live in .storage/http, and leaving the YAML would
            # raise a Repairs notice on every start.
            await ws.cmd("http/config/promote")
            yaml_path = sandbox / "config" / "configuration.yaml"
            yaml_path.write_text(re.sub(r"(?m)^http:\n(?:[ \t]+.*\n)+", "", yaml_path.read_text()))

            owner_id = (await ws.cmd("auth/current_user"))["id"]
            jenn_id = await add_user(ws, "Jenn", "jenn", secrets["jenn"], person=True)
            wall_id = await add_user(ws, "Wall", "wall", secrets["wall"], person=False)
            users = {"owner": owner_id, "jenn": jenn_id, "wall": wall_id}
            save_state(sandbox, users=users)
            print("users:", users)

            # Calendars and lists. Entity ids follow the names (slugified).
            for cal in HOUSE["calendars"]:
                await flow(session, token, "local_calendar", {"calendar_name": cal["name"]})
            for lst in HOUSE["todo_lists"]:
                await flow(session, token, "local_todo", {"todo_list_name": lst["name"]})
            await flow(session, token, "shopping_list", {})
            # Family Hub's wizard with chores, Grocy and the digest off (as the
            # house ran it), no calendars to monitor, no generated dashboard.
            await flow(
                session, token, "family_hub",
                {"setup_features": []},
                {"calendars": []},
                {},
                {"add_dashboard": False},
                {},
            )
            await asyncio.sleep(3)

            states = {s["entity_id"]: s for s in await ws.cmd("get_states")}
            wanted = [c["entity_id"] for c in HOUSE["calendars"]] + [t["entity_id"] for t in HOUSE["todo_lists"]] + [
                "todo.shopping_list", "weather.forecast_home", "input_boolean.board_private", "switch.family_hub_privacy_mode",
            ]
            missing = [e for e in wanted if e not in states]
            if missing:
                raise RuntimeError(f"entities missing after setup: {missing}")

            # Household settings: a full replace, so start from what the fresh
            # install holds and lay the house's values over it.
            current = (await ws.cmd("family_hub/get_settings"))["settings"] or {}
            settings = {**current, **_strip_sandbox_keys(copy.deepcopy(HOUSE["household_settings"]))}
            template = HOUSE["user_profile_template"]
            lists = {(t.get("role"), t["name"].split("_", 1)[1]): t["entity_id"] for t in HOUSE["todo_lists"] if t.get("role")}
            settings["userProfiles"] = {
                uid: {
                    **copy.deepcopy(template),
                    "remindersEntity": lists[(role, "Reminders")],
                    "wishlistEntity": lists[(role, "Wish List")],
                }
                for role, uid in users.items()
            }
            settings["memberUserIds"] = [users[r] for r in HOUSE["members"]]
            settings["kioskLoginEnabledUserIds"] = []
            await ws.cmd("family_hub/set_settings", settings=settings)

            # Themes: the presets Family Hub seeds, plus the tablet's copy of
            # Liquid Glass with larger text.
            themes = (await ws.cmd("theme_builder/list"))["themes"]
            spec = HOUSE["tablet_theme"]
            base = next(t for t in themes if t["id"] == spec["copy_of"])
            tablet = {**copy.deepcopy(base), "id": spec["id"], "name": spec["name"], "fonts": dict(spec["fonts"])}
            themes = [t for t in themes if t["id"] != spec["id"]] + [tablet]
            await ws.cmd("theme_builder/save", themes=themes)

            # The board's dashboard.
            dash = HOUSE["dashboard"]
            await ws.cmd("lovelace/dashboards/create", **dash["create"])
            await ws.cmd("lovelace/config/save", url_path=dash["create"]["url_path"], config=dash["config"])

        # Board copies, reported the way a card reports itself, so copy sync
        # sends any new browser of that user the same settings (fork issue
        # #5): Wall gets the Clover Tablet's, Owner gets the owner's phone's.
        for spec in HOUSE["copies"]:
            user_tokens = await login(session, spec["role"], secrets[spec["role"]])
            async with WS(session, user_tokens["access_token"]) as user_ws:
                await user_ws.cmd(
                    "family_hub/device_settings/report",
                    device_id=spec["device_id"],
                    device_name=spec["device_name"],
                    settings=spec["device_settings"],
                    instance_id=spec["instance_id"],
                    instance_settings=spec["instance_settings"],
                    instance_label=spec["instance_label"],
                    applied_seq=0,
                    instance_applied_seq=0,
                )

        # Repairs notices that belong to the sandbox, not the house (a venv
        # "Core" install; the http YAML just moved to storage). Ignored so the
        # Settings badge shows nothing the real board wouldn't.
        async with WS(session, token) as ws:
            for issue in (await ws.cmd("repairs/list_issues"))["issues"]:
                if (issue["domain"], issue["issue_id"]) in {("homeassistant", "deprecated_method"), ("http", "deprecated_yaml")}:
                    await ws.cmd("repairs/ignore_issue", domain=issue["domain"], issue_id=issue["issue_id"], ignore=True)
        print("provisioned")


if __name__ == "__main__":
    asyncio.run(main())

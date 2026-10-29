"""Shared helpers for the Family Hub sandbox scripts (see README.md).

Run with the sandbox's own Python (it has aiohttp, as Home Assistant does):
    <sandbox>/venv/bin/python -I -B tests/sandbox/provision.py <sandbox>

Talks only to the sandbox at 127.0.0.1:8123. Passwords come from
<sandbox>/secrets.json, which sandbox.sh reset writes outside the repo.
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import aiohttp

URL = "http://127.0.0.1:8123"
CLIENT_ID = f"{URL}/"
TZ = "America/New_York"


def sandbox_dir() -> Path:
    if len(sys.argv) < 2:
        sys.exit("usage: <script> <sandbox dir>")
    return Path(sys.argv[1]).resolve()


def load_secrets(sandbox: Path) -> dict:
    return json.loads((sandbox / "secrets.json").read_text())


def save_state(sandbox: Path, **values) -> None:
    """Non-secret ids the later steps need (user ids, device ids)."""
    path = sandbox / "state.json"
    state = json.loads(path.read_text()) if path.exists() else {}
    state.update(values)
    path.write_text(json.dumps(state, indent=2) + "\n")


def load_state(sandbox: Path) -> dict:
    path = sandbox / "state.json"
    return json.loads(path.read_text()) if path.exists() else {}


async def wait_for_ha(session: aiohttp.ClientSession, timeout: float = 600) -> None:
    """Until Home Assistant answers. /auth/providers needs no token (asking
    /api/ without one would log a failed sign-in): 200, or 400 before
    onboarding."""
    loop = asyncio.get_running_loop()
    end = loop.time() + timeout
    while loop.time() < end:
        try:
            async with session.get(f"{URL}/auth/providers") as resp:
                if resp.status in (200, 400):
                    return
        except aiohttp.ClientError:
            pass
        await asyncio.sleep(2)
    raise RuntimeError("Home Assistant did not come up")


async def token_from_code(session: aiohttp.ClientSession, code: str) -> dict:
    async with session.post(
        f"{URL}/auth/token",
        data={"grant_type": "authorization_code", "code": code, "client_id": CLIENT_ID},
    ) as resp:
        resp.raise_for_status()
        return await resp.json()


async def login(session: aiohttp.ClientSession, username: str, password: str) -> dict:
    """The same login flow the browser's sign-in page uses."""
    async with session.post(
        f"{URL}/auth/login_flow",
        json={"client_id": CLIENT_ID, "handler": ["homeassistant", None], "redirect_uri": CLIENT_ID},
    ) as resp:
        resp.raise_for_status()
        flow = await resp.json()
    async with session.post(
        f"{URL}/auth/login_flow/{flow['flow_id']}",
        json={"client_id": CLIENT_ID, "username": username, "password": password},
    ) as resp:
        resp.raise_for_status()
        result = await resp.json()
    if result.get("type") != "create_entry":
        raise RuntimeError(f"login failed for {username}: {result}")
    return await token_from_code(session, result["result"])


class WS:
    """Minimal Home Assistant websocket client: await ws.cmd(type, **data)."""

    def __init__(self, session: aiohttp.ClientSession, token: str):
        self._session = session
        self._token = token
        self._id = 0
        self._ws = None

    async def __aenter__(self):
        self._ws = await self._session.ws_connect(f"{URL}/api/websocket", max_msg_size=0)
        hello = await self._ws.receive_json()
        assert hello["type"] == "auth_required", hello
        await self._ws.send_json({"type": "auth", "access_token": self._token})
        ok = await self._ws.receive_json()
        if ok["type"] != "auth_ok":
            raise RuntimeError(f"websocket auth failed: {ok}")
        return self

    async def __aexit__(self, *exc):
        await self._ws.close()

    async def cmd(self, type_: str, **data):
        self._id += 1
        msg_id = self._id
        await self._ws.send_json({"id": msg_id, "type": type_, **data})
        while True:
            msg = await self._ws.receive_json()
            if msg.get("id") == msg_id and msg.get("type") == "result":
                if not msg.get("success"):
                    raise RuntimeError(f"{type_} failed: {msg.get('error')}")
                return msg.get("result")

    async def service(self, domain: str, service: str, entity_id: str | None = None, return_response: bool = False, **data):
        payload = {"domain": domain, "service": service, "service_data": data}
        if entity_id:
            payload["target"] = {"entity_id": entity_id}
        if return_response:
            payload["return_response"] = True
        return await self.cmd("call_service", **payload)


async def rest(session: aiohttp.ClientSession, token: str, method: str, path: str, body=None):
    async with session.request(
        method, f"{URL}{path}", json=body, headers={"Authorization": f"Bearer {token}"}
    ) as resp:
        text = await resp.text()
        if resp.status >= 400:
            raise RuntimeError(f"{method} {path} -> {resp.status}: {text}")
        return json.loads(text) if text else None

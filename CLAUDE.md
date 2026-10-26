# Instructions for AI assistants working in this repo

This is the household fork of [JVarhol/HA-Family-Hub](https://github.com/JVarhol/HA-Family-Hub) (a Home Assistant custom integration: family calendar, meals, lists) for the house at 1109 Shamrock Rd. **Branch `main` is what runs:** the house's Home Assistant Green installs it through HACS as a custom repository, so anything merged to `main` reaches the wall board at the next HACS update.

## Where decisions live

- **The plan and every owner decision:** [J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md) in the house repo, `bellamy1506/House-Modeling`. Sessions usually have both repos; read J008 before proposing anything.
- **What's built in Home Assistant:** [J006](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J006-home-assistant-automations.md) in the house repo.
- **The house repo's CLAUDE.md rules apply here too**, notably: explain any Home Assistant change before making it and build only after approval; the smart-home lock-in check; Eastern time; plain-word commit subjects.
- **Upstream's own docs** ([PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [DOCUMENTATION.md](DOCUMENTATION.md), `website/docs/`) describe the code. They were written for the upstream developer's machine: Windows paths, zips, and test harness notes there don't apply here.

## Who the owner is

Short on time and decision capacity; wants a durable, low-maintenance floor, not maximum features; not a coder. Jenn (household member) isn't technical. Two adults, no children: the kid features (chores, stars, rewards, goals, routines) and the recipe box are switched off (owner, 2026-10-25).

## Upstream policy (owner, 2026-10-25)

- `main` was forked at upstream v1.168.84 (commit `da0ae98`), reviewed 2026-10-25. Branch `upstream-1.168.84` marks that point (tag pushes are blocked in cloud sessions).
- **Nothing from upstream arrives on its own.** The house repo's Monday digest reports releases this fork hasn't taken, with a running verdict. Take an update only when the owner says so.
- **Taking an update:** add the remote (`git remote add upstream https://github.com/JVarhol/HA-Family-Hub`), fetch, merge the chosen release into a branch, and review the diff for new outbound network calls, storage format changes, and new dependencies. Open a PR that says in plain words what changes on the board. The owner approves the merge; back up Home Assistant before the HACS update. Then record the new reviewed version here and in J008.
- Upstream ships often (13 releases in 8 weeks) with no tests or CI in its repo, and one release broke HACS installs. Assume an update can break something.

## Changing the code

- **Edit the files Home Assistant serves.** The cards load from `custom_components/family_hub/card/` (and `panel/`), per the `*_path` lines in `__init__.py`. Same-named files at the top level of `custom_components/family_hub/` are unused copies, newer than the served ones; editing them changes nothing on the board (2026-10-26). Read code behavior from the served copies too.
- Keep house changes small and few: every change is a merge conflict when taking upstream updates. Prefer configuration in Home Assistant over code changes.
- Add a test for any behavior you change; upstream has none in the repo. Put tests under `tests/` and say in the PR how to run them.
- License is GPL-3.0; the repo stays public.
- Changes to `main` go through a PR, and the owner approves every merge, because `main` deploys to the house.
- Sessions run in a cloud container without the `gh` CLI; use the GitHub MCP tools against `bellamy1506/HA-Family-Hub-Clover`.

## Agent skills

### Issue tracker

GitHub Issues on this fork: code changes, upstream updates, and anything needing owner input about the integration. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults. See `docs/agents/triage-labels.md`.

### Domain docs

Single context, [CONTEXT.md](CONTEXT.md). See `docs/agents/domain.md`.

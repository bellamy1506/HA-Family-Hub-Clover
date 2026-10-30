# Instructions for AI assistants working in this repo

This is the household fork of [JVarhol/HA-Family-Hub](https://github.com/JVarhol/HA-Family-Hub) (a Home Assistant custom integration: family calendar, meals, lists) for the house at 1109 Shamrock Rd. **Branch `main` is what runs:** the house's Home Assistant Green installs it through HACS as a custom repository, so anything merged to `main` reaches the wall board at the next HACS update.

## Where decisions live

- **The plan and every owner decision:** [J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md) in the house repo, `bellamy1506/House-Modeling`. Sessions usually have both repos; read J008 before proposing anything.
- **What's built in Home Assistant:** [J006](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J006-home-assistant-automations.md) in the house repo.
- **The house repo's CLAUDE.md rules apply here too**, notably: explain any Home Assistant change before making it and build only after approval; the smart-home lock-in check; Eastern time; plain-word commit subjects.
- **Upstream's own docs** ([PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [DOCUMENTATION.md](DOCUMENTATION.md), `website/docs/`) describe the code. They were written for the upstream developer's machine: Windows paths, zips, and test harness notes there don't apply here.

## Who the owner is

Short on time and decision capacity; wants a durable, low-maintenance floor, not maximum features; not a coder. Jenn (household member) isn't technical. Two adults, no children: the kid features (chores, stars, rewards, goals, routines) and the recipe box are switched off (owner, 2026-10-25).

## Upstream: ideas only (owner, 2026-10-29)

- **This is the house's own project now.** Upstream is read for ideas, never merged. Direction and reasons: [docs/board-next/mission.md](docs/board-next/mission.md#own-project-owner-2026-10-29).
- History: `main` was forked at upstream v1.168.84 (commit `da0ae98`), reviewed 2026-10-25; branch `upstream-1.168.84` marks that point and `tests/upstream_base.txt` names it (the house-lines check compares against it). Upstream then rewrote about 23,000 lines of the week card in four days and renumbered its releases (2026.10.4 on 2026-10-28).
- **Borrowing an idea:** add the remote (`git remote add upstream https://github.com/JVarhol/HA-Family-Hub`), fetch, read the change, and rebuild or port only what's wanted, with tests, in a normal PR. Review anything ported for new outbound network calls, storage format changes, and new dependencies. Upstream has no tests or CI and one of its releases broke HACS installs, so never trust a piece of it untested.

## Changing the code

- **Edit the files Home Assistant serves.** The cards load from `custom_components/family_hub/card/` (and `panel/`), per the `*_path` lines in `__init__.py`. Same-named files at the top level of `custom_components/family_hub/` are unused copies, newer than the served ones; editing them changes nothing on the board (2026-10-26). Read code behavior from the served copies too.
- **Before working in the week calendar card** (the board), read [docs/agents/card-map.md](docs/agents/card-map.md): its load order, each view's renderer, the house changes, storage keys, and how to test it, including in a browser. Keep the map current when you change what it names; `tests/test_card_map.js` fails if a method it names is gone.
- Keep the code small and readable: every line here is the house's to keep working. Prefer configuration in Home Assistant over code, and removing unused code over working around it.
- **Technical calls and lean code (owner, 2026-10-30):** decide technical and basic questions yourself and write the reasoning down; bring the owner only what they'd notice on the wall or a phone, and they can veto. Follow lean-code principles and keep the code reasonably easy to change. A rare edge case that casual daily use is unlikely to hit within a year, and that wouldn't cause lasting trouble, gets a note (in the PR or a code comment) and no further effort.
- Add a test for any behavior you change; upstream has none in the repo. Put tests under `tests/`. Before every push run `bash tests/run_all.sh`; CI runs it on each PR. Merge a PR only when its Tests run is green.
- **Reviews** apply [CODING_STANDARDS.md](CODING_STANDARDS.md).
- License is GPL-3.0; the repo stays public.
- Changes to `main` go through a PR, and the owner approves every merge, because `main` deploys to the house.
- Sessions run in a cloud container without the `gh` CLI; use the GitHub MCP tools against `bellamy1506/HA-Family-Hub-Clover`.

## Agent skills

### Issue tracker

GitHub Issues on this fork: code changes, ideas borrowed from upstream, and anything needing owner input about the integration. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults. See `docs/agents/triage-labels.md`.

### Domain docs

Single context, [CONTEXT.md](CONTEXT.md). See `docs/agents/domain.md`.

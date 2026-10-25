# Issue tracker: GitHub Issues

Issues live in this fork's GitHub Issues: code changes, upstream updates, bugs seen on the board, and anything needing the owner's input about the integration. GitHub turns Issues off on new forks; the owner turns them on under Settings, General, Features, Issues.

Work that isn't about this code goes to the house repo, `bellamy1506/House-Modeling`: Home Assistant setup and automations (its issues and J006), physical house work (its TASKS.md), dated reminders (its `records/dates.csv`).

## Tools in this environment

No `gh` CLI in cloud sessions. Use the GitHub MCP tools (load with ToolSearch if deferred) against `bellamy1506/HA-Family-Hub-Clover`:

| Operation | Tool |
|---|---|
| Create, edit, label, close | `mcp__github__issue_write` |
| Read one issue and its comments | `mcp__github__issue_read` |
| List or search | `mcp__github__list_issues`, `mcp__github__search_issues` |
| Comment | `mcp__github__add_issue_comment` |

## Conventions

- **Title** in plain words for the owner: what will be true when it's done.
- **Body**: what and why, what's known, what's needed from the owner, and a done-when line. Link J008 when it touches a decision.
- **Owner input needed**: label `needs-info` and say exactly what the owner must answer or do.
- **Every comment** ends with the Claude Code attribution footer.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue as above.

## When a skill says "fetch the relevant ticket"

Read it with `mcp__github__issue_read`, including comments.

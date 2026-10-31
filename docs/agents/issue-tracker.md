# Issue tracker: GitHub Issues

Issues live in this fork's GitHub Issues: code changes, upstream updates, bugs seen on the board, and anything needing the owner's input about the integration. GitHub turns Issues off on new forks; the owner turns them on under Settings, General, Features, Issues.

Work that isn't about this code goes to the house repo, `bellamy1506/Clover-Home`: Home Assistant setup and automations (its issues and J006), physical house work (its TASKS.md), dated reminders (its `records/dates.csv`).

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

## Wayfinding operations

Used by `/wayfinder` (the owner starts it; it doesn't run on its own). The **map** is one issue; its **tickets** are child issues. This environment has no `gh`, so:

- **Map:** an issue labelled `wayfinder:map` (`mcp__github__issue_write`), body as the skill lays out: Destination, Notes, Decisions so far, Not yet specified, Out of scope. For the next board, the Destination comes from [docs/board-next/mission.md](../board-next/mission.md) and the route so far from [synthesis.md](../board-next/synthesis.md); link them, don't copy them.
- **Child ticket:** an issue with a `wayfinder:<type>` label (`research`, `prototype`, `grilling`, `task`), linked to the map as a GitHub sub-issue with `mcp__github__sub_issue_write`. Put `Part of #<map>` at the top of the body too, so it reads right anywhere.
- **Blocking:** no MCP tool sets GitHub's native dependencies here, so use the fallback: a `Blocked by: #<n>, #<n>` line at the top of the child's body. A ticket is unblocked when every issue on that line is closed.
- **Frontier:** the map's open sub-issues (`mcp__github__issue_read` on the map lists them; else search `"Part of #<map>" is:open`), minus any with an open blocker or an assignee; first in map order wins.
- **Claim:** assign the ticket to `bellamy1506` with `mcp__github__issue_write`, as the session's first write.
- **Resolve:** a resolution comment (`mcp__github__add_issue_comment`), close the issue with a state reason, then add a one-line pointer (gist + link) under the map's Decisions so far.
- **Hand-off (owner, 2026-10-31):** a session that finishes a ticket ends its last reply with a paste block for every other ticket a session can start now (open, unblocked, unclaimed), in map order, each in its own fenced block under a line giving the ticket's name and type. Blocked tickets are listed by name, each with what blocks it, and get no block.
  - **Session name first (owner, 2026-10-31):** the app names a new session from its opening words, so each block starts with the session's name right after the command:
    ```
    /wayfinder Board: event sheet (prototype). Map <map URL> ticket <ticket URL>
    ```
    The name is the map's short name (the house board map is "Board"), the ticket's topic in two to five words, and its type, under 40 characters so it fits a phone's session list. A session started this way sets its title to exactly that name with `set_session_title` (claude-code-remote) when it claims the ticket, if it has that tool.
- **Owner time:** grilling and prototype tickets need the owner live.
  - **Grilling sessions have no decision limit (owner, 2026-10-31):** answering questions is the point of grilling, so a grilling session asks every question its design tree needs, in rounds, however many that is. Several grilling tickets can be combined into one ticket for one session. The bar is yield, not count: never ask the owner a fact the agent can look up or a technical or basic call the agent can make, and never ask about something the owner wouldn't notice on the wall or a phone.
  - **Every other session** (prototype, research, task) puts at most one decision to the owner, per the house rule on decision load.

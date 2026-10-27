# Coding standards (house fork)

Read during review. Each rule is a judgement call that no automated check makes; the mechanical ones live in `tests/` and run through `bash tests/run_all.sh`. Terms are from [CONTEXT.md](CONTEXT.md); where the code lives is in [docs/agents/card-map.md](docs/agents/card-map.md).

## Saved state shown before data loads

When a change saves rendered state to show on the next open (a theme, a size, event shapes, anything painted before its data arrives), the saved state is a **stale copy**. Check that the change answers each case, in the code or in a test:

- **Privacy**: privacy mode on, and its state not yet known; discreet mode; a legend or type filter hiding some events. Nothing private is stored, and nothing is shown that the live board would hide.
- **Failure**: a fetch that errored or timed out; the card hidden, detached, or not laid out when saving (sizes read as zero).
- **Change of shape**: another view, a view switch, a dashboard config reload, another screen width or rotation, changed view settings, another set of calendars, a new day or month, a holiday background.
- **Data that loads first**: meals, reminders, weather, and the day header arrive before the calendars; the live copy wins over the saved one, whatever its count.
- **Interaction**: a stale copy can't be tapped into a wrong action; scroll positions survive.
- **Bounds**: storage is capped across the whole browser, not per copy or per page, and measured as written.
- **Cost**: saving runs once per real change, not on every redraw or poll; restoring reads before it writes.

## Tests

- A behavior change gets a test that fails without it. Show it failing first.
- Prefer a behavior check (the browser test drives the real card) over asserting on the card's source text; keep a source-text assertion for wiring the browser can't see, and expect it to need updating on a refactor.
- Visual changes: the browser test compares every box in the grid, not only the elements the change is about.

## House changes to upstream code

- New behavior goes in house-only methods, marked `// House fork:`, reached by as few one-line hooks into upstream code as possible. Each hook is a future merge conflict (see CLAUDE.md, upstream policy).
- A one-attribute or one-line edit to an upstream template beats deriving the same thing from rendered text, when the text has no reliable key.

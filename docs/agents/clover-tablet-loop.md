# Clover Tablet improvement loop (log)

Unattended overnight run to make the board better on the Clover Tablet (TCL NXTPAPER 14, 1200×800 CSS px at device pixel ratio 2, read from 6 to 12 ft). Small tested changes merge into `house/clover-tablet-loop`; one draft PR from there to `main` is the morning menu. Nothing merges into `main`.

- Start: 2026-10-28 23:19 EDT. Last new iteration: 03:45 EDT. Hard stop: 2026-10-29 04:20 EDT.
- Research: [docs/research/skylight-calendar.md](../research/skylight-calendar.md), [docs/research/wall-display-legibility.md](../research/wall-display-legibility.md).
- Screenshots: harness only (fake data), `docs/agents/clover-tablet-loop/shots/`.

## Audit at 1200×800 (harness, cream default theme, 2026-10-28)

What the tablet copy runs now (read-only from Home Assistant): Week view, 7 days, timeline off, default (household) theme, full top bar.

- **Timeline text is fixed at 11 px (titles) and 9 px (times and hour labels)** in Day view and in Week with the timeline on. It ignores the theme's event font size, which the other views follow. Day view, the closest thing to the "1 to 3 days in large text" default (Q13), has the smallest text on the board.
- **Agenda text is fixed at 13 px (titles), 11 px (times), 13 px (day names)**, also ignoring the theme.
- **Agenda doesn't dim past events**; Week does (`greyOutPastEvents`).
- **The first hour label is cut in half** at the top of every timeline (`.hour-label` sits 7 px above its line).
- **Empty meal slots** ("Tap to add breakfast", "lunch") take about a third of each column in Week and 3-day views. Which slots show is a household setting (meal blocks), not code.
- **Will and Work share the initial W** on every event badge and chip; only color tells them apart.
- **No current-time line** on timelines.
- **Today** is marked only by a thin outline and a colored date.
- 3 days (Week view, Days shown 3, Current day first) at the theme's default 14 px event text: roomy columns (about 320 px wide), lots of empty space below.

## Backlog (ranked: value ÷ (risk + upstream-merge cost))

Research shaping the ranking: at 1 CSS px ≈ 0.0099 in, comfortable reading needs text about 59 / 89 / 119 px tall at 6 / 9 / 12 ft (legibility note), so no text size makes titles readable across the room. From across the room the board can only offer glance cues: color by person, where "now" is, which day is today, how full a day is. Titles are for 2 to 6 ft. Skylight's equivalents: a rolling few days from today, an orange "now" bar, dimmed past events, person colors (Skylight note).

| # | Item | Value | Status |
|---|---|---|---|
| 1 | Timeline (Day, Week timeline) and Agenda text follow the theme's text sizes | high: Day view had the smallest text; lets a tablet theme raise every view's text | merged (01) |
| 2 | Current-time line on timelines (Skylight's "now" bar) | high: glanceable "where are we in the day" | merged (02) |
| 3 | Agenda dims past events, as Week does | medium | todo |
| 4 | First hour label no longer cut off | low, polish | todo |
| 5 | Today stands out from across the room | medium | todo |
| - | Skipped: per-person avatars/initials beyond the first letter (Will and Work both "W") | needs a config field and edits in four upstream templates; logged as a question | skipped |
| - | Skipped: hiding empty meal slots in code | the household's meal blocks setting already does it (proposal) | skipped |

## Iterations

### 01: timeline and Agenda text follow the theme's sizes (23:30 to 00:05)

- Day view and Week-with-timeline event titles were fixed at 11 px and times at 9 px; Agenda at 13 and 11 px. Now they use the theme's event size (14 px in the default theme; any theme can raise it). On the timeline the title comes first and the time under it; short events clamp the title to one line and the shortest hide the time, so nothing shows cut in half.
- Also: `tests/test_house_lines_clean.js` skips binary files (it read the first committed screenshot as text and failed).
- Shots: `shots/01-before-3day-timeline.png`, `shots/01-after-3day-timeline.png`, `shots/01-before-agenda.png`, `shots/01-after-agenda.png`, `shots/01-after-day-theme-20px.png`.
- Upstream-merge cost: none in upstream lines. One house CSS block appended before the card's main `</style>`; it overrides upstream's `.tl-event`, `.tl-time`, `.agenda-item-*` and `.agenda-day-*` rules, so an upstream restyle of those would need a look.

### 02: current-time line on today's timeline (23:35 to 23:50)

- A red line with a dot crosses today's timeline at the current time (Week with the timeline: today's column; Day view: every lane), under the events so it doesn't strike through a title. Hidden outside the hours the timeline shows. It moves with the board's 60 s redraw (under a pixel a minute, so no motion to speak of for the cats).
- The line's height lives in a stylesheet outside the grid, so the saved event shapes aren't rewritten every minute (checked in the test).
- Shots: `shots/01-after-3day-timeline.png` (before), `shots/02-after-3day-timeline.png`, `shots/02-after-day-evening.png`.
- Upstream-merge cost: one line at the end of `_renderGrid` (after the PR #14 hooks; the two source-text checks of its last lines now allow it); two new house methods; CSS in the house block, plus `.timeline > .tl-event { z-index: 2 }` over upstream's `.tl-event`.

## Open questions for the owner

## Setting proposals

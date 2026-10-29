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

| # | Item | Status |
|---|---|---|
| 1 | Timeline (Day, Week timeline) and Agenda text follow the theme's text sizes | todo |
| 2 | Current-time line on timelines | todo |
| 3 | First hour label no longer cut off | todo |
| 4 | Agenda dims past events, as Week does | todo |
| 5 | Today stands out from across the room | todo |

## Iterations

(none yet)

## Open questions for the owner

## Setting proposals

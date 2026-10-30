# Resting face prototype

For the map ticket [What does the resting face show, and how does it read from across the room?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/38), 2026-10-30. **Owner's pick: D, Next over four days** ("grossly nice", tuning to come). Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser (it opens on D). The bar switches the layout (A to D), the time of day (7:40 am, 3:10 pm, 8:50 pm) and the distance (Fit, 6 ft, 9 ft). The address's `#hash` holds the state, e.g. `#d-evening-9ft`; `-shot` in place of the distance draws the face alone at 1200×800 for screenshots. Pictures of every layout at all three times are in [shots/](shots/): `final-a.png` to `final-d.png`, and `round1-abc.png` for A to C before the first review's fixes.

## Layouts

| | Layout | What it does well | What it gives up | Reviews |
|---|---|---|---|---|
| A | Next, big: one large next line, the rest of today under it, a side rail with clock, weather, dinner and the coming days | The next thing reads from across the room; calmest | Barely shows the week; the rail is small text | Best from across the room, both rounds; 2nd in round 2 |
| B | Four days, today wide: closest to today's board | Most like a Skylight; the week at a glance | No lead line; Now and Next are small tags to hunt for | Round 1 would keep it; 3rd in round 2 |
| C | Today and tomorrow: a large clock, then two equal pages, the day that matters now in dark | Clearest evening hand-off; tomorrow always shown | The clock is the only large thing; flat lists; half the face empty at night | Last in both rounds |
| **D** | **Next over four days: A's next line across the top, B's four days below** | **The lead line plus the week** | **Busiest; the columns are close-up text** | **1st in round 2; the owner's pick** |

## Owner decisions (2026-10-30)

- **Layout D.**
- **From across the room the board has to be structurally clear, not readable:** you can see that things are coming up (their bars, places and colors), the way a month view shows there are items on a day before you can read them. Reading waits until you come closer. This replaces the "9 ft text" target the prototype was sized for, so D's sizes can come down where that buys room or calm.
- **Rain is stated, never turned into an instruction:** "Rain from 2 pm", not "take an umbrella".
- **To watch, not to build yet:** as the calendar fills, the top line could hold something that doesn't matter (a routine "At work") and draw the eye from something that does. Address it if it shows up in use.
- **Prototypes are archived** so liked parts are easy to pull later: see [the archive's index](../README.md).

## Calls made here (technical and basic; the owner can veto)

**What shows at rest**
- Date, a minute clock (no seconds), today's high and low with one weather icon.
- **Next:** the first of today's events that hasn't started. **Now:** events under way, with their end times.
- Work at rest says only "At work" and its hours, under Will's name. How much Work shows is the map's privacy question; this is the safe default meanwhile.
- **Needs you:** one fixed place, at most one item, amber bar plus words, up to three lines. When empty it says "Nothing needed today" in gray. Which conditions earn it is [What counts as "needs you" on the resting face?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/46).
- **Rain:** one line while today's forecast still has rain ahead in waking hours ("Rain from 2 pm", then "Rain until 9 pm"). The first review flagged a morning-only line vanishing while it was still raining, so it stays while it's true.
- **Meals:** dinner always; breakfast and lunch only when filled (owner, 2026-10-29).
- All-day events are a tinted bar at the top of their day.
- Finished events leave today's list.
- **Evening hand-off:** once today's last event has ended and it's after 6 pm, the face turns to tomorrow: its first event becomes Next, the day columns start at tomorrow, and today's dinner goes.
- Every row names its person in words beside its color (the first review: "I can't tell whose haircut it is"). A mark per person is the map's visual-language question.
- No buttons on the resting face in the first slice (read only, per the layout decision); touch comes with the sheets.

**How it behaves**
- Nothing moves at rest: no animation, no rotation, no paging. The minute clock and data updates are the only changes.
- Lists never cut a row in half: rows that don't fit drop from the end, and "+N more" says how many. The Next row is never dropped.
- The lead line keeps a long title on two lines at full size; a short title shrinks a little to stay on one line; only past two lines does it shrink, to a 64 px floor, then take a third line.

**Look**
- Light background (#F4F5F2), near-black text, every text color at least 7:1; weights 500 to 700, no thin type ([legibility research](../../docs/research/wall-display-legibility.md)).
- Roboto, the tablet's own font.
- Person colors from the Okabe-Ito color-blind-safe set, on bars and dots only, never as text color.

**Sizes.** On this tablet, text reads comfortably from about its CSS pixel size divided by 10, in feet (cap height at 20 arcmin), and at a stretch from size divided by 8: 84 px (D's lead line) from about 8½ ft, 44 px from about 4½ ft, 28 px from about 3 ft. Shapes and colored bars read from much farther than their words, which is what the owner's standard asks of the rest of the face.

## Reviews

Two blind first-time reviewers (Sonnet, high effort) judged screenshots only, at full size and at 25% for about 9 ft.
- **Round 1 (A to C):** A read best from across the room; it would keep B for seeing the week; C least (no Next marker, flat list). Fixed after it: names on every row, Now before Next, a Next mark in C, the lead line no longer cut short, the warning no longer clipped, Work shown once as "At work".
- **Round 2 (A to D):** ranked D, A, B, C. It found the Next row squeezed out of B and C by two Now rows; the fit now never drops it. Left for later tickets: "Nothing needed today" beside an errand that says to bring library books (noted on the "needs you" ticket), the clash line not saying whose events clash, and the gray Work bar reading as a different person from Will's blue.

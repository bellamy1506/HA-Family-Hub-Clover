# Resting face prototype (throwaway)

For the map ticket [What does the resting face show, and how does it read from across the room?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/38). Not house board code: `index.html` is one self-contained page with made-up data, kept on this branch as the record of what was tried. Build sessions take the decisions below and the owner's layout pick from the ticket, then rewrite it properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser. The bar switches the layout (A to D), the time of day (7:40 am, 3:10 pm, 8:50 pm) and the distance (Fit, 6 ft, 9 ft). The address's `#hash` holds the state, e.g. `#d-evening-9ft`; `-shot` in place of the distance draws the face alone at 1200×800 for screenshots.

## Layouts

- **A. Next, big:** one large next line, the rest of today under it, a side rail with clock, weather, dinner and the coming days.
- **B. Four days, today wide:** closest to today's board.
- **C. Today and tomorrow:** a large clock, then two equal pages; the day that matters now is the dark one.
- **D. Next over four days:** A's next line across the top, B's four days below. Added after the first blind review, which read A best from across the room and would keep B for the week.

## Calls made here (technical and basic; the owner can veto)

These hold whichever layout wins.

**What shows at rest**
- Date, a minute clock (no seconds), today's high and low with one weather icon.
- **Next:** the first of today's events that hasn't started. **Now:** events under way, with their end times.
- Work at rest says only "At work" and its hours, in Will's column color. How much Work shows is the map's privacy question; this is the safe default meanwhile.
- **Needs you:** one fixed place, at most one item, amber bar plus words, up to three lines. When empty it says "Nothing needed today" in gray. Which conditions earn it is [What counts as "needs you" on the resting face?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/46).
- **Bring:** one line while today's forecast still has rain or cold ahead in waking hours ("Umbrella: rain from 2 pm", then "Umbrella: rain until 9 pm"). The first review flagged the umbrella vanishing at 10 am while it was still raining, so it stays while it's still true.
- **Meals:** dinner always; breakfast and lunch only when filled (owner, 2026-10-29).
- All-day events are a tinted bar at the top of their day.
- Finished events leave today's list.
- **Evening hand-off:** once today's last event has ended and it's after 6 pm, the face turns to tomorrow (its first event becomes Next; tomorrow's dinner shows; today's dinner goes). A layout with day columns starts them at tomorrow.
- Every row names its person in words beside its color (the first review: "I can't tell whose haircut it is"). A mark per person is the map's visual-language question.
- No buttons on the resting face in the first slice (read only, per the layout decision); touch comes with the sheets.

**How it behaves**
- Nothing moves at rest: no animation, no rotation, no paging. The minute clock and data updates are the only changes.
- Lists never cut a row in half: rows that don't fit drop from the end, and "+N more" says how many.
- The lead line keeps a long title on two lines at full size; a short title shrinks a little to stay on one line; only past two lines does it shrink, to a 64 px floor, then take a third line.

**Look**
- Light background (#F4F5F2), near-black text, every text color at least 7:1; weights 500 to 700, no thin type ([legibility research](../../docs/research/wall-display-legibility.md)).
- Roboto, the tablet's own font.
- Person colors from the Okabe-Ito color-blind-safe set, on bars and dots only, never as text color.

**Sizes.** On this tablet, text reads comfortably from about its CSS pixel size divided by 10, in feet (cap height at 20 arcmin), and at a stretch from size divided by 8. So 92 px reads from about 9 ft, 60 px from 6 ft, 44 px from about 4½ ft. One line per layout gets the 9 ft size, the thing that layout leads with. Everything else is sized for 4 to 6 ft and up close, because 800 px of height holds only about seven lines at the 9 ft size.

## Reviews

Two blind first-time reviewers (Sonnet, high effort) judged screenshots only, at full size and at 25% for about 9 ft.
- **First (A to C):** A read best from across the room; it would keep B for seeing the week; C least (no Next marker, flat list). Its fixes are in the calls above: names on every row, Now before Next, a Next mark in C, the lead line no longer cut short, the warning no longer clipped, Work shown once as "At work".
- **Second (A to D):** ranked D, A, B, C. It found the Next row squeezed out of B and C by two Now rows; the fit now never drops the Next row. Left for later tickets: "Nothing needed today" beside an errand that says to bring library books (does an event's "bring" count as needing you?), the clash line not saying whose events clash, and the gray Work bar reading as a different person from Will's blue.

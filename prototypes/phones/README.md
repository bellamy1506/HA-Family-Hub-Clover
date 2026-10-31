# Phones prototype

For the map ticket [What do the phones show?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50), 2026-10-31. Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser. On a phone it fills the screen; on a computer it draws an iPhone (390×844) beside a description. The bar at the top switches the layout (A to D) and, under More on a phone, the time of day (7:40 am, 3:10 pm, 8:50 pm), whose phone (Will's or Jenn's: the new dots differ), light or dark, and text (Large is the Home Assistant app's Page Zoom at 150%, about 260 CSS px wide). Everything inside the phone can be tapped. The address's `#hash` holds the state, e.g. `#b-evening-jenn-dark-normal`; add `month` or `lists` to open on that tab and `shot` to draw the phone alone at 390×844 for screenshots. Pictures are in [shots/](shots/).

## Layouts

All four sit inside the Home Assistant app under its own top bar (it stays on the phones), with three tabs at the bottom and the + where today's board has it.

| | Layout | What it does well | What it gives up | Reviews |
|---|---|---|---|---|
| A | **Upcoming, one list:** today first (date, weather, needs-you, the wall's Next line, notes, today's events, dinner), then the next two weeks in one scroll with each day's name pinned while you read it | Today and the week in one thumb-scroll; nothing to learn; the Next line carries over from the wall | No at-a-glance shape of the week; a busy week makes a long list | |
| B | **One day at a time:** a strip of the next seven days with a dot per event, the chosen day below; tap or swipe to move | Which days are full is visible at once; one day reads cleanly | A tap per day to read the week; no Next line | |
| C | **The wall, pocket-size:** the Next line and needs-you band, today as a compact card, the next four days as small cards | Closest to the wall: the same lead line and the coming days at a glance | Small text in the day cards; a tap to read any day in full; not quite one screen | |
| D | **Month, day below:** the month as colored bars starting this week, the tapped day listed underneath | Planning ahead; what the phones open on today, done better | Today is below a large grid; no lead line | |

## Calls made here (technical and basic; the owner can veto)

**Getting around**
- Three tabs at the bottom: the layout's home view, Month, Lists (D swaps the first two). They sit in normal flow at the bottom of the card, not `position: fixed`, so Home Assistant's own padding for the home bar applies ([iPhone app research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)). The app's Labs tab bar isn't used.
- Home Assistant's own top bar stays (the research: don't hide it on phones).
- **Today** appears whenever you're away from today: a floating button once A's list scrolls past today, a Today button beside the strip (B) and the month (D, and the Month tab).
- The + sits bottom right, where today's board has it and where the walkthrough found it first. What it opens is [How does adding something on the house board feel?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49); the prototype's sheet is a stand-in.
- Settings: a gear at the top of the home view. What the page holds is the map's settings fog; the stand-in lists the rows already known to belong there (each adult's detail, Hidden by you, Guest mode).
- Tapping an event opens its sheet, a stand-in for [What does an event's sheet look like for changing and deleting?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45).
- B's strip and D's month also move by swipe, but every move has a visible button too (the first-time reviewer profile doesn't try swipes).

**What carries over from the resting face**
- The Next line (A and C) and its evening hand-off: after 6 pm with today's events done, it names tomorrow's first event, and B and D open on tomorrow. Today's dinner goes at the hand-off.
- The needs-you band, one place, at most one item, nothing when empty; the rain line, stated, never an instruction.
- Now rows say "until"; Will's work is a labeled block, "At work until 4:30", in a light tint of Will's color.
- All-day events as tinted bars at the top of their day; dinner always, breakfast and lunch only when filled.
- Every row names its person in words beside its color.
- Clashes by the decided rule, marked with the gray overlap glyph and the word "overlaps" on rows (the wall keeps the words for the sheet and the needs-you line).

**Phone-only**
- **Month for planning:** colored bars per event (up to three, then "+N"), never cut-off words; the grid starts on this week's Sunday with past days dimmed; the tapped day is listed underneath. The walkthrough's tiny truncated labels are gone.
- **The week starts today** in A, B and C.
- **New dots** on what the other person added or changed since you last opened the board on your phone, in the list rows, the strip's day and the month's day ([decided 2026-10-30](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)).
- **Finished events fold** into "Earlier today (N)" instead of vanishing, since a phone is where you check what time something was.
- **Notes tick off in place** and "Later (N)" opens in place; the Lists tab holds notes, the shopping list and house reminders until the map's lists question settles what lives there and whether the shopping list is the app's own To-do widget.
- Light and dark follow the phone's Home Assistant theme; type is built from one root size, so Page Zoom (and a later text-size setting) scales all of it.

**Not visible here, from the iPhone app research:** the board refreshes itself when shown again; pull to refresh is left alone; one `success` haptic for a saved change; Save at the top of phone sheets.

**Look:** Roboto, weights 500 and 700; text at least 7:1. Will's blue is a step darker (#005A8C) per the [marks research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864); Us stays green and a plan on both calendars gets a two-tone bar ("Game night", Fri Nov 6) until [How does each person and kind of event look on the house board?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57) decides the marks. Sheets slide in 280 ms by `transform`; the Today button fades in 200 ms; nothing else moves ([motion rules](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)).

## Reviews

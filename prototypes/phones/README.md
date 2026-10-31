# Phones prototype

For the map ticket [What do the phones show?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50), 2026-10-31. Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser (it opens on E, the owner's pick; Settings, the gear, has its Show days as switch). On a phone it fills the screen; on a computer it draws an iPhone (390×844) beside a description. The bar at the top switches the layout (A to E) and, under More on a phone, the time of day (7:40 am, 3:10 pm, 8:50 pm), whose phone (Will's or Jenn's: the new dots differ), light or dark, and text (Large is the Home Assistant app's Page Zoom at 150%, about 260 CSS px wide). Everything inside the phone can be tapped. The address's `#hash` holds the state, e.g. `#e-evening-jenn-dark-normal`; add `month` or `lists` to open on that tab and `shot` to draw the phone alone at 390×844 for screenshots. Pictures are in [shots/](shots/): `round1-*.png` for A to D as first reviewed, `round2-*.png` as reviewed in round 2 (with E), `final-b.png` and `final-e.png` after round 2's fixes, and `final-picked-e-and-setting.png` for the pick with its setting switched.

## Layouts

All four sit inside the Home Assistant app under its own top bar (it stays on the phones), with three tabs at the bottom and the + where today's board has it.

| | Layout | What it does well | What it gives up | Reviews |
|---|---|---|---|---|
| A | **Upcoming, one list:** today first (date, weather, needs-you, your next event, notes, today's events, dinner), then the days ahead in one scroll with each day's name pinned while you read it | Today and the week in one thumb-scroll; nothing to learn; the lead line carries over from the wall | No at-a-glance shape of the week; a busy week makes a long list | Round 1: owner 1st, first-time 2nd. Round 2: 3rd for both ("anything past tomorrow means scrolling"); best at large text |
| B | **One day at a time:** a strip of the next seven days with a dot per event, the chosen day below; tap or swipe to move | Which days are full is visible at once; one day reads cleanly | A tap per day to read the week; no lead line | Round 1: first-time 1st ("the closest to Skylight"), owner 2nd. Round 2: 1st for both ("the most predictable ... I never felt lost"); its missing lead line added after |
| C | **The wall, pocket-size:** the lead line and needs-you band, today as a compact card, the next four days as small cards | Closest to the wall: the same lead line and the coming days at a glance | Small text in the day cards; work hours left out of them; longer than one screen | Round 1: 3rd for both: "+N more" hid Saturday's overlap and the vet, and no settings anywhere. Not in round 2 |
| D | **Month, day below:** the month as colored bars starting this week, the tapped day listed underneath | Planning ahead; what the phones open on today, done better | Today is below a large grid; no lead line | Round 1: last for both: today sits below a grid of unlabeled bars, and large text fills the screen with the grid. Not in round 2 |
| E | **Upcoming with a week strip** (added in round 2): B's seven-day strip pinned at the top, A's list below; tap a day and the list jumps there, scroll and the strip follows | The week's shape and the reading in one view; any day one tap away | The strip takes about a seventh of the screen (a quarter at large text) | Round 2: 2nd for both ("close to first"); its week arrow and Today button landed in the wrong place, both fixed after |

## Calls made here (technical and basic; the owner can veto)

**Getting around**
- Three tabs at the bottom: the layout's home view, Month, Lists (D swaps the first two). They sit in normal flow at the bottom of the card, not `position: fixed`, so Home Assistant's own padding for the home bar applies ([iPhone app research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)). The app's Labs tab bar isn't used.
- Home Assistant's own top bar stays (the research: don't hide it on phones).
- **Today** appears whenever you're away from today: a floating button at the bottom left once A's list scrolls past today, a Today button beside the strip (B and E) and the month (D, and the Month tab). The strip's arrows move a week and keep the weekday; E's strip and Today jump instantly rather than scroll smoothly, so they land exactly on the day.
- The + sits bottom right, where today's board has it and where the walkthrough found it first. What it opens is [How does adding something on the house board feel?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49); the prototype's sheet is a stand-in.
- Settings: a gear at the top right of every tab (the first round missed it on C, Month and Lists). What the page holds is the map's settings fog; the stand-in lists the rows already known to belong there (each adult's detail, Hidden by you, Guest mode).
- Tapping an event opens its sheet, a stand-in for [What does an event's sheet look like for changing and deleting?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45).
- B's strip and D's month also move by swipe, but every move has a visible button too (the first-time reviewer profile doesn't try swipes).

**What carries over from the resting face**
- The lead line (A, C and E), but **on a phone it's yours:** "Your next" is the next event on your own calendars or Us, never your own work hours. The wall's household Next told Jenn's phone "Next · Will: 8:30 At work", which both reviewers called useless. The evening hand-off carries over: after 6 pm with today's events done, it reads "Your first tomorrow", and B and D open on tomorrow. Today's dinner goes at the hand-off.
- The needs-you band, nothing when empty; a house reminder there has a **Mark done** button with Undo, and stays until it's done, evenings included. **On a phone every item that qualifies shows** (usually none, at most two in practice: a reminder and a clash); the wall keeps one. The rain line, stated, never an instruction.
- Now rows say "until"; Will's work is a labeled block, "At work until 4:30", in a light tint of Will's color.
- All-day events as tinted bars at the top of their day; dinner always for today and tomorrow, further out only when planned (a column of "Not planned" was noise); breakfast and lunch only when filled.
- Every row names its person in words beside its color.
- Clashes by the decided rule, marked with the gray overlap glyph and the word "overlaps" on rows (the wall keeps the words for the sheet and the needs-you line).

**Phone-only**
- **Month for planning:** colored bars per event (up to three, then "+N"), never cut-off words, with a key under the grid; the grid starts on this week's Sunday with past days dimmed; the tapped day is listed underneath. The walkthrough's tiny truncated labels are gone.
- **The week starts today** in A, B and C.
- **New dots** on what the other person added or changed since you last opened the board on your phone, in the list rows, the strip's day and the month's day ([decided 2026-10-30](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)). On a phone the dot gets words: a line under the needs-you band, "4 new from Jenn since you last looked ›", opens the list of them, and each row says "new". Both first-round reviewers found the bare dot unexplained.
- **Finished events fold** into "Earlier today (N)" instead of vanishing, since a phone is where you check what time something was.
- **Notes and house reminders tick off in place, with Undo,** and untick with another tap after the Undo bar fades; "Later (N)" opens in place; the Lists tab holds notes, the shopping list and house reminders until the map's lists question settles what lives there and whether the shopping list is the app's own To-do widget.
- Light and dark follow the phone's Home Assistant theme; type is built from one root size, so Page Zoom (and a later text-size setting) scales all of it. At large text C's day cards go to one column, the strip slims, and the + gets smaller so it covers less.

**Not visible here, from the iPhone app research:** the board refreshes itself when shown again; pull to refresh is left alone; one `success` haptic for a saved change; Save at the top of phone sheets.

**Look:** Roboto, weights 500 and 700; text at least 7:1. Will's blue is a step darker (#005A8C) per the [marks research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864); Us stays green and a plan on both calendars gets a two-tone bar ("Game night", Fri Nov 6) until [How does each person and kind of event look on the house board?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57) decides the marks. Sheets slide in 280 ms by `transform`; the Today button fades in 200 ms; nothing else moves ([motion rules](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)).

## Reviews

**Round 1** (A to D, 2026-10-31): two blind reviewers drove the page in a browser at 390×844 with touch, eleven scenarios each, never seeing the code: a first-time, Jenn-like profile (Sonnet, high effort) and the owner's profile (Opus).
- **Rankings:** first-time B, A, C, D; owner A, B, C, D. Both put C and D last: C's "+N more" hid the very things they looked for (Saturday's overlap, the vet), and D's month put today below a grid of unlabeled bars.
- **Both found:** the new dot unexplained, with no answer anywhere to "what did the other person add?" (painful in every layout); "Next · Will: 8:30 At work" useless (on Jenn's phone it isn't hers; on Will's he knows he's going to work); settings missing on C and on the Month and Lists tabs; large text breaking D (the grid fills the screen) and B (the strip spills).
- **First-time only:** B is "the closest to Skylight"; A stopped at two weeks with a small link; "Later (2)" and "Earlier today (5)" made her pause.
- **Owner only:** A's Today button never appeared (a bug: it measured a pinned header that moves with the scroll); the furnace reminder vanished at 3:10 pm though still due; a tapped note ticked off with no undo.
- **Fixed for round 2:** everything above except "Later (2)", the owner's decided name, kept for the owner to judge. E added because the two reviewers split between A's list and B's strip.

**Round 2** (E, A and B, 2026-10-31): fresh blind reviewers, same two profiles, eleven scenarios.
- **Rankings:** both B, E, A. B: "every question I asked was answered by a tap, on one screen"; "the most predictable." E: "the best morning glance," let down by the two landing bugs. A: planning past tomorrow means scrolling or thinking of Month.
- **Fixed after:** E's arrow and Today now land exactly (they scrolled smoothly and re-measured mid-scroll); B gets "Your next"; an undone reminder stays on the front page at night beside the evening's clash; a done reminder can be unticked in Lists; a slimmer strip at large text; dinner rows only where they say something; "Mark done" in place of "Done".
- **Left as is, for the owner to see:** both rounds paused at "Later (2)" (the owner's decided name for old notes); "Your next" skipping your own work hours made the owner profile pause once ("is work ignored on purpose?" Yes: you know you're at work); no clash warning in the morning for tomorrow's overlap (the decided rule raises it after the evening hand-off; rows still say "overlaps").
- **Caveats:** headless Chromium at iPhone size, not Safari in the Home Assistant app; swipes simulated; Large is Page Zoom, not iOS Dynamic Type.

## Owner decision (2026-10-31)

- **E by default, with a setting to act like B.** The phones open on E: the seven-day strip over one scrolling list. A per-person setting turns that off, and the phone then shows one day at a time, as B does. In the owner's words: "I like E, but it can be the default with a setting toggle for 'Phone Continuous Scroll' or something like that, and when it's off it acts like B."
- Options put to the owner: B one day at a time (0.60, recommended), E the strip over one list (0.35), A one list (0.15), C or D (0.05).

**Calls made with the pick (technical and basic; the owner can veto):**
- The setting reads **Show days as: One scrolling list / One day at a time**, a two-way choice in the reader's words rather than an on/off switch with a technical name.
- It is **per person** and follows them to all their copies (both of a phone's addresses), through the house preferences service ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43)); browser storage isn't trusted with it. Phones only; the wall keeps its resting face.
- Everything else is shared by both modes: the strip, the top block (needs-you, what's new, your next), the Month and Lists tabs, the + and the gear. The home tab reads "Upcoming" in one mode and "Day" in the other; in the evening, one day at a time opens on tomorrow, while the list opens at its top, where "Your first tomorrow" leads.
- Built together, they share the strip and the day list, so the second mode costs little: E's list is B's day list repeated for each day.

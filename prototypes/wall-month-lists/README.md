# Wall Month and Lists prototype

For the map ticket [How do Month and Lists look on the wall, and how are they reached?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79), 2026-10-31. **Owner's pick: C's rail, much narrower, with A's Month and Lists; adding where things land, and one Tell Clover button** (2026-10-31; [below](#owner-decision-2026-10-31)). Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser (it opens on the pick). The bar switches the variant (Picked, then A to C as reviewed), the screen (Resting face, Month, Lists), the time of day (7:40 am, 3:10 pm, 8:50 pm) and the distance (Fit, 9 ft). Everything inside the wall can be tapped: the controls, days in Month, list items (they tick off, with Undo), the add boxes (a stand-in keyboard comes up, and its keys type). Left alone for a minute, Month and Lists go back to the resting face. The address's `#hash` holds the state, e.g. `#a-month-afternoon-fit`; `shot` anywhere in it draws the wall alone at 1200×800, `kbd` shows the keyboard, `sel4` opens a day in Month, `from11` opens C's columns at a day, `listCostco` picks a list in B and C, `later` opens the Later notes, and on the pick `listenGroceries` (or `listenday4`, `listenany`) opens the listening stand-in, with `typing` to type instead.

Pictures in [shots/](shots/): `final-picked.png` (the pick: the resting face at 3:10 pm and 8:50 pm, Month, a day opened from Month, Lists, and adding to a list), `final-picked-far.png` (C as reviewed beside the pick at 25%), `final-a.png` to `final-c.png` (each variant's resting face at 3:10 pm and 8:50 pm, Month, a day tapped from Month, and Lists, plus Lists while typing or B's house jobs), `final-far.png` (the three resting faces at 25%, about 9 ft), and `round1-a.png` to `round1-c.png` as the reviewers saw them, before the fixes below.

Starting points: the [resting face](../resting-face/README.md) (layout D) with the [marks pick](../marks/README.md) (E); the [phones prototype](../phones/README.md)'s Month and Lists; the [lists decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045).

## Variants

| | Ways in | Month | Lists | Does well | Gives up | Reviews |
|---|---|---|---|---|---|---|
| **A** | **Tabs along the bottom:** an 84 px bar with Upcoming, Month and Lists, the gear and the + at its right end; the phones' three words | Titles in the cells; a tapped day opens in a panel beside it | A column per list, all in view: Groceries, Costco, Notes, House jobs, each with its add box | The fewest touches, or tied for fewest, on every task; nothing to hunt for; labeled in words | About one row per day column at rest; a gray band across the bottom of the resting face | 1st for both |
| B | **Buttons in the corner:** Month and Lists beside the + at the bottom right; Month and Lists open full screen with Close and the gear | Bars only, as on the phones, with the chosen day listed beside the grid | One list at a time, large, picked from a column on the left | The resting face keeps its full height (the most rows of the three); the plainest buttons | Month can't say when the Pittsburgh trip is without tapping day by day; the loudest controls at rest, over the last two days' bottom row; Costco, Notes and house jobs each a touch further | 3rd for both |
| C | **A rail down the side:** a 108 px column with Upcoming, Month and Lists at the top, the + and the gear at the foot | A's grid with taller days (three items a day); a tapped day opens the four day columns from that day, with Back to today | Shopping wide with a button per AnyList list; house jobs over notes beside it | The quietest controls from across the room; the most per day in Month | Narrower day columns at rest, so more titles cut; tapping a day leaves Month; a step to reach Costco | 2nd for both |

Left out on purpose: controls that appear only after a first touch (Month and Lists must be one touch from the resting face, and the first-time profile won't look for hidden ones); swipes as the only way between screens; a count on the Lists control ([lists decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045)).

## Owner decision (2026-10-31)

**Picked: C's rail, much narrower, with A's Month and Lists.** In the owner's words: "I like the c sidebar, it just needs to be much narrower like skylights- you only need to see it when you're right in front of the tablet touching it." And on the +: "If the plus on the sidebar is meant to add to the calendar, then it should be on the calendar, not on the sidebar- same for lists." Then, asked three questions: **icons with small words** on the rail (1a), **one microphone button, Tell Clover, at the foot of the rail** (2b), and **tapping a day in Month opens it, with Add at the top of its panel** (3a).

So the wall works like this:
- **The rail:** 64 px (1.6 cm) down the left edge, pale, with small icons and words: Upcoming, Month and Lists at the top; Tell Clover and Settings at the foot. Only needed at the tablet, so it's sized for arm's length, not for across the room. No + on it.
- **Adding happens where it lands:** tap a day (or the small + beside its name) on the resting face, as the [adding pick](../adding/README.md#owner-decision-2026-10-31) has it; in Month, a tapped day opens in a panel whose first button, under the day's name, is "Add to Tue, Nov 3"; each list has its own "Add to Groceries". **Tell Clover** is for anything without picking a place first: speak, and the words go to Clover as they are, as "Hey Siri, Ask Clover" does, so Clover routes them ([J006, Ask Clover](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)): an add lands on the board (an event, a grocery, a note or a dinner), a question is answered, a device command runs. The echo shows what landed (with Undo), the answer, or what was done. The adds that start somewhere are held to that place (owner, 2026-10-31): **a list's Add always lands on that list.** Clover may still tidy the words and split several items ("milk, eggs and bread"), but it can't file them anywhere else, so "pizza" said there is a grocery, never a dinner. **A day's Add** (tapping the day on the resting face, or "Add to Tue, Nov 3" in Month) always lands on that day, with Clover working out the time. **In Guest mode, Tell Clover only adds to the board** (the board prefixes the line, as a day tap does), keeping the decided rule that visitors add and tick off only; device commands and questions wait for the household *(agent's call, 2026-10-31; the owner can veto)*. Every add listens, with Type instead, and answers in the echo.
- **Month and Lists are A's:** titles in the days, a tapped day in a panel beside the grid; every list side by side.
- **Back to the resting face** after a minute untouched, as decided.

**The sizes were the misread** (the owner asked whether this was a misunderstanding about sizes): the [delight research](../../docs/research/delight-and-discoverability.md) set about 1 cm (40 px) as the least for any control and about 2 cm (80 px) for things done standing in a hurry (the +, a day's add, ticks, Undo). The event sheet's prototype made "wall targets 80 px" a rule for everything, and this one went further: navigation got 2 cm too, every button was drawn as big as its touch area, and words went under the icons, so C's rail reached 108 px (2.7 cm). It also treated the controls as something to find from across the room; the owner's standard puts them with the words, for when you're at the tablet.

What was put to the owner first, kept for the record (the owner: "That was not a decision, we are discussing"):
- **A.** A as drawn (0.50), recommended. **B.** A's Month and Lists behind C's rail (0.30). **C.** A's Month and Lists behind B's corner buttons (0.12). **D.** C as drawn (0.08).

Then the three questions: the rail's buttons, **(a) icons with small words (0.6)**, (b) icons only (0.3), (c) words only (0.1); a general add on the wall, (a) none (0.55), **(b) one microphone button, Tell Clover, at the foot of the rail (0.35)**, (c) a + on the rail (0.10); tapping a day in Month, **(a) opens it, with Add at the top of its panel (0.65)**, (b) adds to it at once (0.25), (c) a small + in each day adds (0.10). The owner's answers in bold.

**Calls made with the pick (technical and basic; the owner can veto):**
- **Wall sizes, replacing "wall targets 80 px":** at least 40 px (1 cm) for anything; 56 px (1.4 cm) for buttons (Month's arrows and Today, Close, a day's Add); list adds and list rows 64 px (1.6 cm) tall, the whole row being the tick target; 80 px (2 cm) kept for Mark done and the echo's Undo. The rail's items are 62 by 70 px. Text keeps its decided sizes.
- **The rail's words are 13 px** so "Upcoming" fits 64 px; that reads from about 1.3 ft (the legibility rule: size divided by 10, in feet), i.e. standing at the tablet. A build session checks it on the tablet; if it's too small there, the rail goes to 72 px with 15 px words rather than dropping them.
- The rail is pale (#ECEEEA) with a 1 px edge, gray icons and words (#3D4347, over 7:1), the current item a near-black pill; Tell Clover's words take two lines.
- **Settings** opens from the rail's foot on the wall (its contents are still fog on the map); on the phones it stays the gear at the top right of every tab.
- The day panel's Add sits just under the day's name and date, above the events. Lists' adds show a small microphone, since they listen.
- **The echo sits at the top on the wall** (the adding pick), below the listening panel while that's open; Undo there is 80 px.
- The listening panel here is a stand-in; how it looks is the adding pick's, and how the wall hears is [the voice research's answer](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/83#issuecomment-6548719340) (the browser's own speech recognition in Fully, if [Does Fully let the house board's http page listen?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/85) says yes; else the keyboard's microphone key). It applies the same way to Tell Clover, Month's Add and the list adds; the wall has no + of its own now.

## Touches from the resting face

Counted by the reviewers for A to C as reviewed (the pick's Month and Lists are A's, so its counts are A's); typing a word and Enter count as one.

| Task | A | B | C |
|---|---|---|---|
| Anything the weekend of Nov 7 and 8? | 1 | 3 | 1 |
| When is the trip to Pittsburgh? | 1 | 2 to 5 | 1 |
| What's on Tuesday, Nov 3, and when? | 2 | 2 | 2 |
| Butter to Groceries, then paper plates to Costco | 5 | 6 | 6 |
| Tick off milk, then put it back | 3 | 3 | 3 |
| The furnace filter is done | 2 | 3 | 2 |
| The Later notes | 1 | 1 | 1 (3 before the fix) |
| Back to the resting face | 1 | 1 | 1 |
| What's on the Costco list? | 1 | 2 | 2 |

## Calls made here (technical and basic; the owner can veto)

**Getting there and back**
- The resting face's own control reads **Upcoming**, the phones' word for their first tab, so the wall and the phones share three words. Both reviewers would have said Home or Today; Today is wrong for four days, and Home is the alternative if Upcoming doesn't settle in.
- Left alone for a minute, Month and Lists go back to the resting face and the keyboard closes ([decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045)), with no warning. Both reviewers saw it happen and called it expected.
- **The gear** (where settings open is still fog on the map): A in the bar, B beside Close on Month and Lists only, C at the foot of the rail. **The +** (what it opens is [the adding ticket](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49)): A at the bar's right end, B in the corner, C at the foot of the rail.
- Tapping the **needs-you line** when it names a house job opens Lists at house jobs; a clash opens the event's sheet, as the [sheet decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45#issuecomment-6545490784) has it.
- In B, the lit corner button closes its screen when tapped again.

**Month**
- Five weeks from this week's Sunday, past days dimmed, ‹ › five weeks at a time, Today showing once you've paged away: the phones' rules. Weekends lightly shaded.
- **Titles in the cells** (A, C): the title up to a colon ("Trash night: bins to the curb" reads "Trash night"), two lines when the day has room and one when it's full, always ending on a whole word with "…", then "+N more". Never cut mid-word, as today's board does ("Offi…").
- **Work** is a thin strip in the person's color at the foot of a day, without words, and "Work" in the key: it's every weekday and routine. The owner reviewer read it once as a divider.
- Weather on the next 10 days (Skylight shows ten in Month), new dots on items, no clash mark (close-up detail; the day's rows have it).
- **A tapped day:** A's panel slides in on the side away from the day, as the event sheet does, and a tap outside only closes it; B's pane is always there, on today until you tap. Both end in "Add to Tue, Nov 3", a stand-in for the adding ticket.
- **Not drawn:** an event spanning days should be one bar across them. The made-up trip is two all-day events, and both reviewers read it as two entries.

**Lists**
- The decided order: shopping (each chosen AnyList list, in AnyList's order), Notes (today's, later days', then Later), house jobs. In C, house jobs sit above notes so they're never below the edge.
- **An add box at the top of each list,** so the keyboard (about the bottom 40% of the screen, inferred; a stand-in here) never covers it. Enter adds, keeps the box open, puts the item at the top highlighted, and the echo offers Undo.
- **House jobs have no add box:** they come from the house records, and the board only marks them done (J008 Q4 and Q15). The section reads "House jobs", not "House".
- Tap anywhere on a row to tick it: struck through, gone 2.5 seconds later, Undo in the echo for 10 seconds. Rows 80 px tall.
- **Later** folds to "Later (3) ›" and opens in place, as on the face and the phones; the face's Later line opens Lists with Later open and in view.
- A fade at the bottom of a list that goes on below.
- No "AnyList" labels on the lists (both reviewers read them as jargon); the board names AnyList only when it can't reach it.

**Look:** the marks pick and the resting face's sizes; controls #3D4347 on #E7EAE5 (about 8:1), the current one near-black; 80 px targets; panels slide in 280 ms by transform, the echo 180 ms.

## Reviews

One round: two blind reviewers (Sonnet, high effort) drove the page in a browser at 1200×800 with touch, ten scenarios in each variant, never seeing the code: the first-time, Jenn-like profile (A, B, C) and the owner's profile (C, B, A), per [reviewers.md](../../docs/board-next/reviewers.md).
- **Rankings:** both A, C, B. First-time: A "fewest touches, nothing to hunt for." Owner: A's Lists "yes, that's the shopping page"; C "best resting screen for calm"; B's Month "pretty, useless."
- **Both found:** B's bars-only Month can't answer "when is the trip to Pittsburgh?" without tapping day by day (first-time: blocker-ish); C's tapped day leaves Month ("Where did Month go?"); the extra touch for Costco in B and C; A's Groceries showed 6 of 11 with no sign of more; the Later notes below the edge in C (painful) and the last one clipped in A and B; C said "Nothing on the calendar" under the trip; "Upcoming" (both would say Home or Today); "AnyList" and the house-records line read as jargon; the trip shows as two entries.
- **First-time only:** "Today" and ‹ grayed out on Month looked broken; tapping B's lit Month button did nothing. **Owner only:** B's pills are the loudest controls at rest; wanted to mark the furnace filter done from the needs-you line; no way to bring back a ticked item once Undo fades.
- **Fixed after the review:** the "Nothing on the calendar" slip; a fade on lists that go on below; Later lands in view; Today hidden until you page away; B's lit button closes; the needs-you line opens house jobs; no "AnyList" labels or house-records line; "House jobs" for "House". Also found while picturing it: in A's evening face, the two rows the needs-you line names (never dropped) overflowed the shorter column and one was cut in half; all-day rows now drop before that happens.
- **Left as they are:** B's bars and C's tapped day, the variants' own ideas (the pick settles them); "Upcoming" (above); the new dot and the clash mark ([decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798); the event sheet says what they mean); "Later (3)" beside "+2 more" (decided names); no untick once Undo fades (AnyList keeps ticked items in its app; a house job reopens through the house assistant, [decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045)); the trip as two entries (a build call above).
- The fixes were checked by script and pictures, not by a second blind round. **Caveats:** headless Chromium, simulated touch and scrolling, a stand-in keyboard (both typed with keystrokes), the 25% copy standing in for 9 ft.

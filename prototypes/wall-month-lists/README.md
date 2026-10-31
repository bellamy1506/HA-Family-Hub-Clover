# Wall Month and Lists prototype

For the map ticket [How do Month and Lists look on the wall, and how are they reached?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79), 2026-10-31. **Waiting on the owner's pick.** Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser (it opens on A). The bar switches the variant (A to C), the screen (Resting face, Month, Lists), the time of day (7:40 am, 3:10 pm, 8:50 pm) and the distance (Fit, 9 ft). Everything inside the wall can be tapped: the controls, days in Month, list items (they tick off, with Undo), the add boxes (a stand-in keyboard comes up, and its keys type). Left alone for a minute, Month and Lists go back to the resting face. The address's `#hash` holds the state, e.g. `#a-month-afternoon-fit`; `shot` anywhere in it draws the wall alone at 1200×800, `kbd` shows the keyboard, `sel4` opens a day in Month, `from11` opens C's columns at a day, `listCostco` picks a list in B and C, and `later` opens the Later notes.

Pictures in [shots/](shots/): `final-a.png` to `final-c.png` (each variant's resting face at 3:10 pm and 8:50 pm, Month, a day tapped from Month, and Lists, plus Lists while typing or B's house jobs), `final-far.png` (the three resting faces at 25%, about 9 ft), and `round1-a.png` to `round1-c.png` as the reviewers saw them, before the fixes below.

Starting points: the [resting face](../resting-face/README.md) (layout D) with the [marks pick](../marks/README.md) (E); the [phones prototype](../phones/README.md)'s Month and Lists; the [lists decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045).

## Variants

| | Ways in | Month | Lists | Does well | Gives up | Reviews |
|---|---|---|---|---|---|---|
| **A** | **Tabs along the bottom:** an 84 px bar with Upcoming, Month and Lists, the gear and the + at its right end; the phones' three words | Titles in the cells; a tapped day opens in a panel beside it | A column per list, all in view: Groceries, Costco, Notes, House jobs, each with its add box | The fewest touches, or tied for fewest, on every task; nothing to hunt for; labeled in words | About one row per day column at rest; a gray band across the bottom of the resting face | 1st for both |
| B | **Buttons in the corner:** Month and Lists beside the + at the bottom right; Month and Lists open full screen with Close and the gear | Bars only, as on the phones, with the chosen day listed beside the grid | One list at a time, large, picked from a column on the left | The resting face keeps its full height (the most rows of the three); the plainest buttons | Month can't say when the Pittsburgh trip is without tapping day by day; the loudest controls at rest, over the last two days' bottom row; Costco, Notes and house jobs each a touch further | 3rd for both |
| C | **A rail down the side:** a 108 px column with Upcoming, Month and Lists at the top, the + and the gear at the foot | A's grid with taller days (three items a day); a tapped day opens the four day columns from that day, with Back to today | Shopping wide with a button per AnyList list; house jobs over notes beside it | The quietest controls from across the room; the most per day in Month | Narrower day columns at rest, so more titles cut; tapping a day leaves Month; a step to reach Costco | 2nd for both |

Left out on purpose: controls that appear only after a first touch (Month and Lists must be one touch from the resting face, and the first-time profile won't look for hidden ones); swipes as the only way between screens; a count on the Lists control ([lists decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045)).

## Touches from the resting face

Counted by the reviewers; typing a word and Enter count as one.

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

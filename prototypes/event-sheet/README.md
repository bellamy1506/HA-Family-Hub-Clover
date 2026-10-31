# Event sheet prototype

For the map ticket [What does an event's sheet look like for changing and deleting?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45), 2026-10-31. **Owner's pick: A, the live panel with arrows** (2026-10-31): "B may take less clicks but looking at it feels run-together." Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser and tap any event. The bar switches the sheet (A, B, C), the screen (Wall at 1200×800 behind the resting face, or Phone at 390×844 over a stand-in list; the phones' own design is [What do the phones show?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50)), a task to try, and Guest mode on the wall. Under the screen: a count of touches since the task started, and what the board would write to the calendar, and when. The address's `#hash` holds the state, e.g. `#a-wall-move`; `-shot` draws the screen alone at real size. Pictures of each sheet's states on the wall and the phone are in [shots/](shots/): `final-a.png` to `final-c.png`, taken after the review's fixes.

| | Sheet | What it does well | What it gives up | Reviews |
|---|---|---|---|---|
| **A** | **Live panel, arrows:** a panel slides in beside the event, on the side away from it. Day and time rows with ‹ › arrows (a day, or 15 minutes keeping the length, per tap); tap the day or time for a grid of big buttons; tap the title box to retype it. No Save: it saves when the panel closes. A repeating event asks "This one or All?" where you tapped, once. | You watch the event move on the board; every control in view; one predictable control (the [time research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/70#issuecomment-6537437929)'s lean) | 4 touches for the dentist; big jumps take the grid; a settings-panel feel ("arithmetic on time"); the panel covers two day columns | Owner profile 2nd, first-time 3rd; **the owner's pick** |
| B | **Quick picks:** a small card beside the event offers likely moves as buttons that name the result ("4:00 pm", "Wed", "Next Tue"); one tap moves it and closes the card. "Other day…" and "Other time…" open the same grids. A repeating event changes this one only; the echo offers "All Sundays too". | 2 touches for the dentist and for the trash night; closes itself; the safe default for repeats; Rename is a plain word | The chips guess which moves are common (others take 4 touches, as A's grid); changing a whole series hides in the echo for 10 seconds; the card covers the middle of the board | 1st for both reviewers |
| C | **Edit, then Save:** a card shows the event with Change and Delete; Change opens a form (title, day, starts, ends, all day) with Cancel and Save, the end moving with the start. Nothing changes until Save. A repeating event asks "This one or All?" on Save. | The most familiar (an iPhone, a Skylight); nothing moves under you; plain Change and Delete | 6 touches for the dentist; the repeat question comes after Save; on the wall it dims the board, on the phone it takes the screen | Owner profile 3rd, first-time 2nd |

## Owner decision (2026-10-31)

**Picked: A.** In the owner's words: "I like A, B may take less clicks but looking at it feels run-together." So the sheet is A's live panel: the day and time change by ‹ › arrows (a day, or 15 minutes keeping the length, per tap) with a grid of big buttons behind each; a repeating event asks "This one or All?" where you tapped, once per sheet; there's no Save, the change saving when the panel closes with Undo in the echo. That settles both of the time research's questions on its options A. The review fixes above are part of it: phone sheets hold their height, the title is a labeled box, the header follows the answer, and a tap outside only closes.

What was put to the owner, kept for the record:

**What's being decided:** which sheet opens when someone taps an event, on the wall and both phones. It settles the time research's two questions too (which controls change a time or day, and where "This one / All" goes for a repeating event).

- **A.** Sheet A, live panel with arrows; repeats ask in place. (0.20)
- **B.** Sheet B, quick picks; repeats change this one, the echo offers "All Sundays too". (0.45)
- **C.** Sheet C, edit then Save; repeats ask on Save. (0.10)
- **D.** Sheet B, but a repeating event asks "This one or All?" at the first tap, as A does. (0.25)

**Recommended then: B.** It takes 2 touches for the walkthrough's dentist move and the one-week trash move, against 4 for A and 6 for C, and both blind reviewers ranked it first. For a repeating event it defaults to the change that can't spread: one occurrence. It gives up A's live view of the event moving (the moved event is highlighted instead, and the echo names the day and time); a move the chips don't offer takes 4 touches, the same as A's grid; and changing a whole series means catching "All Sundays too" in the echo within 10 seconds, or doing it again or on the phone. D trades one more touch on every repeating change for asking first. **This reverses the time research's lean toward arrows (A, 0.55)** on the reviews' evidence: neither reviewer liked stepping through quarter hours, and both found B's named results faster to trust.

## What every sheet shares (technical calls; the owner can veto)

**Opening**
- Tapping any event opens its sheet: a row in a day column, an all-day bar, the Next line, or the "needs you" line (which opens the shared plan in the clash).
- The sheet names the person (Will, Jenn or Us), never the calendar; a repeating event says so ("Us · every Sunday").
- **Who added it**, when the board knows ([How can the board know who added an event or note?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/42)): one small gray line, "Added at the wall today, 12:40 pm". Nothing when it's unknown (iPhone adds).
- **A clash** shows as a line naming the other event and whose it is, "Overlaps Jenn's Dinner with friends, 7:00 to 9:00 pm"; tapping it opens that event. Fix the clash and the line and the board's overlap marks go at once.
- Opening a sheet doesn't clear a new dot; dots follow the decided rules ([marks](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)).

**Changing**
- Moving keeps the length: start and end move together, so the week card's bug ([Changing an event's start time on the board can turn it into a 23-hour event](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/73)) can't happen. Length changes on its own.
- Quarter hours only; the grids offer the next 14 days (Later for more) and the hours 6 am to 11 pm, then :00 :15 :30 :45 ([time-editing research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/70#issuecomment-6537437929)). Odd minutes stay with the phones' calendar apps.
- No native date or time pickers, no keyboard except for a title, no drag.
- One write per sheet: when it closes (A), when a choice is tapped (B), or on Save (C). The echo names what changed, the weekday and the date, with Undo for 10 seconds; Undo puts the calendar back exactly. Meanwhile the event just changed is highlighted, and a full day column drops other rows ("+N more") before it; on a phone the list scrolls to it.
- A repeating event offers only "This one" or "All" ([iCloud write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)). Where it's asked is part of the owner's pick above.
- If a phone changed the event since the board read it, the save is refused ([iCloud write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)) and the echo says "Not saved: Dentist was changed on a phone. The board shows that version now." Not drawn here.

**Deleting and hiding**
- **"Delete from the calendar"** and **"Hide from the board"** are named for what they do: Delete takes it off everyone's calendar, the phones included; Hide takes it off the board only, calendar untouched ([Hide](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536916622)). Hide is the last and smallest item.
- No "are you sure?": Delete happens at once and the echo offers Undo, naming what went.

**What the board can't change**: said where the buttons would be, never a silent gap ([delight research](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/house/board-next/docs/research/delight-and-discoverability.md) §2):
- **Jenn's Google calendar** (read only, [What kind of calendar account does Jenn have?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/40)): "This is on Jenn's Google calendar, which the board can only read. Change it in Google Calendar on Jenn's phone." Hide still works.
- **An iCloud invitation** (the write path refuses them, so the organizer hears about any answer or change): "Kim Alvarez invited Will. Answer or change it in Calendar on Will's iPhone, so Kim hears about it." Hide still works.
- **A calendar shown as a block** (Work): "Will shows work as a block. The details are on Will's phone." No Hide: the Hide work calendars switch covers it.
- **Guest mode at the wall** ([decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/68#issuecomment-6537655788)): every sheet reads "Guest mode is on. Changes are off at the wall. You can still add things and tick off notes." Each adult's own events open as just "Will, 3:30 to 4:30".
- If the write path ever stops working (a Home Assistant change), iCloud events fall back to the same state: "Change it in Calendar on Will's iPhone."

**Look and motion**
- Wall targets 80 px (about 2 cm on this tablet), phone targets 50 px.
- Animation only on `transform` and `opacity`: in 280 ms decelerating, out 200 ms; the echo 180 ms; under reduced motion, fades ([motion research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)). A build session runs the frame check on the pick.
- **Notes** (not drawn): a note's sheet follows the pick with what a note has: its words, its day (no time), "Later", and Clear ([notes](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536918104)).

## Touches per task

Counted by a script on the wall and the phone (the same on both), each from a fresh page; a typed title counts as one touch. Undo adds one touch anywhere.

| Task | A | B | C |
|---|---|---|---|
| 1. Move the dentist from 3:30 to 4:00 (the walkthrough's scenario 2) | 4 | 2 | 6 |
| 2. Delete the extra dentist (scenario 5) | 2 | 2 | 2 |
| 3. This Sunday's trash night to Monday, this week only | 4 | 2 | 6 |
| 6. Tonight's clash: open it from "needs you", move Date night to 9:00 | 5 | 4 | 6 |
| 7. Rename the vet visit | 3 | 4 | 4 |
| 4, 5. Jenn's call, Kim's invitation: learn it can't be changed here | 1 | 1 | 1 |

Today's week card: 10 or 11 for task 1, and task 2 can't be done at all ([walkthrough](../../docs/board-next/walkthrough-2026-10-29.md)).

## Reviews

Two blind reviewers (Sonnet, high effort) drove the page in a browser without seeing its code: the first-time, Jenn-like profile (wall, then phone) and the owner profile (phone, then wall), per [reviewers.md](../../docs/board-next/reviewers.md).
- **Rankings:** owner profile B, A, C; first-time profile B, C, A. Both: B "offers the likely answers", "the quick chips are literally the answer"; C "plain and honest" but slow; A fast for small nudges, slow for big ones.
- **Both found, fixed after the review (in every sheet unless named):**
  - On the phone, A's sheet shrank when the overlap line went away after the first tap, so a second tap in the same spot landed on the day arrow and moved the dentist to Wednesday. Bottom sheets now keep their height.
  - On the wall, the trash night moved into Monday's full column couldn't be seen; both trusted the echo alone. Full columns now drop rows from the end with "+N more", never the event just changed, and that event stays highlighted while the echo shows; on the phone the list scrolls to it.
  - A's title didn't look editable, and a long one was clipped: it's now a labeled box that wraps.
  - A's header kept saying "every Sunday" after "This one": it now says "this Sunday only". The question's buttons read "This one, this week only" and "All, every Sunday" (the first-time reviewer read "This one, Sun Nov 1" as the wrong day when moving to Monday).
  - B: "Other day or time…" took an extra touch and offered no 9:00 pm: "Other day…" and "Other time…" now sit on the card, with Length and All day under the time grid.
  - A tap behind A's open panel opened another event by accident: a tap outside now only closes.
  - The delete echo now names the day and time ("Deleted "Dentist", Tue, Nov 3, 3:00 pm"); the hide echo says how it comes back. A's "15 min per tap, keeps 1 hr" became "‹ › move it 15 min"; the minutes row names its hour.
- **Left as they are:** a confirm before Delete (both liked Undo instead); the new dot's meaning ([How does each person and kind of event look on the house board?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57)); phone sheets covering the event being changed ([What do the phones show?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50)); an "Open in Calendar" button for invitations (whether the Home Assistant iPhone app opens Apple's `calshow:` links is unverified; a build session can try it).
- One review round; the fixes were checked by script (every task in every sheet, the phone arrow staying put, the moved event visible), not by a second blind round.

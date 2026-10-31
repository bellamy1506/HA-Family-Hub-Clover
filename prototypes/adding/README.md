# Adding something prototype

For the map ticket [How does adding something on the house board feel?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49), 2026-10-31. Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser. The bar switches the way of adding (A to D), the screen (Wall at 1200×800 over the resting face, or Phone at 390×844 over the strip and list), a task to try, and "Clover doesn't answer". Above the screen: the task, a **Type the line for me** button and a count of touches since the task started; under it, what the board would write. Everything on the screen can be tapped. The keyboard is a drawn stand-in (the tablet's Android keyboard and the iPhone's, sizes inferred) so you can see what it covers; its keys type, or type on a computer's own keyboard. A stand-in Clover sorts the line the way the real one does ([J006, Ask Clover](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)). The address's `#hash` holds the state, e.g. `#a-wall-dentist`; `-shot` draws the screen alone at real size. Pictures are in [shots/](shots/).

Pictures: `round1-a.png` to `round1-d.png` as reviewed, `final-a.png` to `final-d.png` after the review's fixes. Each shows the gym task (the time guess is wrong): the wall with the line typed, then after Add; the phone the same.

| | Way | What it does well | What it gives up | Reviews |
|---|---|---|---|---|
| **A** | **One line, then the answer:** + (or tapping a day) drops one big box from the top on the wall, or just above the keyboard on a phone. Type, press Add; Clover files it at once. The box closes, the new thing lights up where it landed (a phone scrolls to it), and a dark answer bar (at the top on the wall, the bottom on a phone) says what landed where and what was guessed, with Undo, a one-tap fix for a likely wrong guess, and Change. | Fastest to read and do; nothing moves on the board but the new thing; the same answer bar as the decided event sheet, so one pattern to learn; the least to build | You read a bar rather than seeing the answer on the thing itself; on the wall the bar covers the Next line for 10 seconds | Owner profile 1st on both screens; first-time 3rd |
| B | **Clover's reading first:** the same box, with Clover's reading underneath as you type: what kind of thing, the day, the time, the list. Guessed parts are outlined in amber; tap any part to change it. Nothing lands until Add. | The most trusted: a wrong guess, an overlap or a replaced dinner shows before anything changes | A pause of about a second for the reading on every add, and a card to read each time; habituation (people learn to tap Add without reading, the capture research's warning); needs a second way of asking Clover ("read this, don't file it"), so two calls and twice the wait per add | 2nd for both |
| C | **It lands where you tapped:** tap a day and the box opens inside that day (+ opens it in today; a phone's day headings get a small +). Type, Add, and the new thing appears in place as an amber card naming what was guessed, with the one-tap fix (or Change) and Undo. Something for a day off the wall's four, or for a list, shows its card where you typed. | You see it on the board, in the day you meant, with the fix on it; the most Skylight-like; the easiest to spot from across the room | A narrow box in a narrow column on the wall; cards take room in a full day for 10 seconds; things for later days or lists land "where you typed", which needs explaining; the most layout to build | First-time 1st on both screens; owner 3rd (phone), 4th (wall), mostly for problems fixed after (below) |
| D | **Tell Clover, fix it in words:** + opens a short conversation beside the board (a full sheet on a phone). Clover answers each line with what it added and guessed, with Undo and the one-tap fix; to correct it, say so: "no, morning", "make it Wednesday", "undo that". Done closes it. | Corrections in plain words; several things one after another; friendly | It hides the board (half the wall, the whole phone) until Done, so you don't see it land; one more touch every time; corrections in words need a new house script, since Assist can't change an event | Last for both (owner 3rd on the wall) |


## What every way shares (technical and basic calls; the owner can veto)

**Getting there**
- **Wall:** a round + at the bottom right of the resting face, and tapping any day's column or name. The + joins Month and Lists wherever [How do Month and Lists look on the wall, and how are they reached?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79) puts them; this prototype doesn't place those.
- **Phones:** the + at the bottom right ([decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50#issuecomment-6543417361)); it adds to the day picked in the strip, if one is. C also puts a small + on each day's heading.
- A tapped or picked day is the default, said in a chip ("Adding to Mon, Nov 2, unless you say another day"); a day in the line wins.

**Asking nothing**
- One box, no fields, no pickers, no question, ever. Every add goes to Us ([Where do shared events live?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/41)), so "whose?" never needs asking; the capture research's one allowed question doesn't arise.
- Clover sorts the line by its own rules ([J006, Ask Clover](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)): a time makes an event on Us; groceries go to Jenn's AnyList Grocery list (Will's when named); a dish with a day is that day's dinner; "someday" goes to Later; anything else is a note, on the day given or today. Several things in one line ("milk, eggs, call the plumber") each land on their own.

**Saying back what landed, and what was guessed**
- The answer names the thing, where it went (Us, a note, a list, dinner, Later), the weekday and date, and the time, and says in words what was guessed: "Added **Dentist** to Us · Tue, Nov 3 · 3:00 to 4:00 pm. Guessed pm and 1 hour." A dinner says what it replaced ("was Lasagna"). An event that overlaps someone's says so ("Overlaps Jenn's Team call, 10:00 to 10:45 am"); nothing blocks the add.
- **What counts as guessed** (the board decides from the words typed, so it's predictable): no am or pm typed, the period; no end or length, the hour; no day typed or tapped, the day; a dish with a day but no word "dinner", that it's dinner. Clover's bare-hour rule, which the prototype's stand-in copies: 7 to 11 is morning, 12 to 6 afternoon or evening, and dinner, drinks, date or movie mean evening. *(Inferred from how Clover behaved in the 2026-10-31 tests; a build session writes the rule into Clover's prompt, after explaining it, so the board and Clover agree.)*
- **One-tap fix, only where one other reading is likely:** "6:00 am instead" for a guessed period; "A note instead" for a guessed dinner. Anything else: **Change** opens the decided [event sheet](../event-sheet/README.md) (a stand-in here), or **Undo** and retype.
- **Undo for 10 seconds,** as the event sheet's echo, one per item when several landed. After that, tap the thing to open its sheet.
- The thing just added lights up amber where it landed while the answer shows; a full day column never drops it ("+N more" drops others).

**When Clover doesn't answer**
- Loud, and the words are kept: "Clover didn't answer, so nothing was added. Your words are still here: press Add to try again." Never a silent failure, never a cheerful error ([capture research](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/house/board-next/docs/research/capture-friction.md) §4.1). The prototype waits 3 seconds; the board waits 15.

**How the board knows what Clover did** (technical; nothing the owner sees)
- The line goes to Clover through Home Assistant's Assist API (`conversation/process`, agent `conversation.claude_conversation`), the same path as "Hey Siri, Ask Clover", so the wall, the phones and voice read a line the same way. No second reader in the board (B's preview is the exception; see its row).
- **The answer is written from what actually landed, not from Clover's sentence.** The board already holds Us, Us notes, the AnyList lists and the meal plan; it notes them before sending and, when Clover answers, finds what's new or changed. So the answer can't claim something that didn't land. If Clover says it added something and nothing new appears within 10 seconds: "Clover says it added Dentist, but it isn't on the board yet."
- **Undo removes exactly that item:** an iCloud event through the house write path (found by time and title, never by UID alone, per [Can the house board change and delete iCloud events itself?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)); until the switch-over, `calendar.us` through Family Hub's own delete; a note by `todo.remove_item`; a grocery item through the AnyList integration; a dinner by writing the old one back. Assist itself can't delete an event, which is why Undo doesn't go back through Clover.
- **Edge case, noted only:** two adds at the same moment from two places could confuse which new item is whose. Rare in a two-adult house, and an Undo of the wrong one is itself undoable.
- **Who added it** is recorded at the board's call ([How can the board know who added an event or note?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/42)): "Added at the wall" or the person, shown in the event sheet.
- **Guest mode:** visitors add exactly the same way ([decided](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/68#issuecomment-6537655788)).

**The keyboard and the wait**
- The tablet's on-screen keyboard covers roughly the bottom 40% of the wall *(inferred; the drawn one is 330 of 800 px)*, so on the wall the box sits at the top (A, B), at the top of a day column (C), or just above the keyboard in a panel (D). On phones it sits just above the keyboard; the build keeps it there with `visualViewport`, since the Home Assistant app doesn't move fixed elements for the keyboard on its own *(inferred)*. Phone text is 17 px, because iOS zooms into a box under 16 px.
- **Dictation** is the keyboard's own microphone key (Gboard on the tablet, iOS dictation on the phones), so the page never asks for the microphone. Whether the tablet's keyboard has one is unchecked.
- **The wait:** "Clover is filing it…" with a spinner. Clover's real answer time with a tool call is **unmeasured** (the prototype uses 1.4 seconds; 2 to 4 seconds is a guess). A build session times it on the house before building; past about 3 seconds, A and C can show the line in place as "Filing…" so the screen doesn't sit still.

**Look and motion:** the decided rules: wall targets 72 to 84 px, phone 44 to 50 px; Roboto 500 and up; only `transform` and `opacity` move, 180 to 260 ms; under reduced motion, fades ([motion research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)).


## Touches per task

Counted by a script on the wall and the phone, each from a fresh page; the typed line counts as one touch, as do + (or the day) and Add. D needs one more touch everywhere to close it and see the board.

| Task | A | B | C | D |
|---|---|---|---|---|
| 1. Dentist Tuesday at 3 (`dentist tue 3`) | 3 | 3 | 3 | 3 + Done |
| 2. Call the vet, on Monday (tap Monday; on a phone, Monday in the strip, then +) | 3 wall, 4 phone | 3, 4 | 3 | 3, 4 + Done |
| 3. Gym tomorrow at 6, guessed 6 pm, fixed to 6 am | 4 | 4 (fixed before Add) | 4 | 4 + Done |
| 4. Milk, eggs and call the plumber, in one line | 3 | 3 | 3 | 3 + Done |
| 5. Tacos Monday, then undo it (Lasagna comes back) | 4 | 4 | 4 | 4 + Done |
| 6. Plumber Tuesday 10 to 12 (the answer names Jenn's overlapping call) | 3 | 3 | 3 | 3 + Done |
| 7. Someday: new couches (goes to Later) | 3 | 3 | 3 | 3 + Done |
| 8. Clover doesn't answer: nothing added, the words kept | 3 | 3 | 3 | 3 |

Fixing task 3 through Change and the event sheet's time grid instead of the one-tap fix takes 8 touches in A (Change, the time, 6 am, :00, Done); the other ways open the same sheet.

Today's week card: about 12 touches to add the dentist, with no answer saying it worked ([walkthrough](../../docs/board-next/walkthrough-2026-10-29.md)). The touch counts don't separate the four ways; what you see and trust does.


## Reviews

Two blind reviewers (Sonnet, high effort) drove the page in a browser without seeing its code, per [reviewers.md](../../docs/board-next/reviewers.md): the first-time, Jenn-like profile (wall, then phone) and the owner profile (phone, then wall).
- **Rankings:** first-time C, B, A, D on both screens ("the thing shows up on the board, in the day I tapped, with the fix on it. I never have to read a bar"); owner A, B, C, D on the phone and A, B, D, C on the wall ("A is the quickest and still says it back"; "B is better trust, but I pay a wait on every add"). Both put D last: it hides the board.
- **The wrong guess** (gym at 6 pm, meant 6 am) was noticed and fixed in one tap in every way. Both were surest in B (fixed before it landed) and C (the fix sits on the board), then A, then D.
- **Both found, fixed after the review:**
  - On the wall, A's and B's answer bar covered the dinner row, so "Tacos" couldn't be seen; the bar now sits at the top on the wall, and the dinner row lights up.
  - On a phone, the new thing was often off screen (A, B), or the list scrolled past it (C scrolled to the last of three cards, or to Monday when the card was at the top of today). Phones now scroll the first new thing into view under the strip, every way, and D's Done does too.
  - C's card was so tall it pushed real events into "+N more" (the vet vanished from Tuesday; tacos hid three of Monday's). The card is now about a third the height: the time and title, what was guessed, and one row of buttons.
  - The one-tap fix offered absurd times ("3:00 am instead" for the dentist, "10:00 pm instead" for the plumber). A period now counts as guessed only when the other reading falls between 6 am and 10 pm, and the button says what it does: "Make it 6:00 am". "Guessed 1 hour" is gone from the words, since the times already show the length.
  - B read the line happily even when Clover was down, then failed on Add; its reading now fails the same way, saying nothing can be added and the words are kept.
  - "Oil change sat 9", typed Saturday afternoon, landed this morning (and B warned it would overlap Will's earlier oil change); a weekday that's today at a time already past now means next week.
  - Small words stuck to titles ("And remind me to call the plumber", "Eggs to the shopping"); they're dropped now. The keyboard's label covered the failure message; it moved into the keyboard's bottom edge.
  - D rewrote its own history on Undo (the "Tacos" answer turned into "Lasagna again"); Undo now adds Clover's line below and leaves the earlier answer as it was.
- **Left as they are:**
  - **Everything added goes to Us, even "Will's dentist" or "Jenn dentist".** Both reviewers called this the thing they'd least trust. It's the owner's decision ([Where do shared events live?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/41)); the board can't write to Jenn's Google calendar at all ([What kind of calendar account does Jenn have?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/40)). Names typed stay in the title. Raised to the owner and noted on the map.
  - D's conversation covering the board: that's D.
  - "Note" for a to-do: the decided name. "Jenn's Grocery list": J006's rule and AnyList's own list name. "Later (N)" not opening: the wall's Lists is [its own ticket](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79).
  - The owner profile saw D's "make it Wednesday" take the dentist off. Not reproduced: typed the same way, it moves the dentist to Wednesday.
- One review round; the fixes were checked by script (every task in every way on both screens, 64 runs, all landing as expected), not by a second blind round.

## Owner decision

Waiting on the owner.


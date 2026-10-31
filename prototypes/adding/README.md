# Adding something prototype

For the map ticket [How does adding something on the house board feel?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49), 2026-10-31. Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser. The bar switches the way of adding (A to D), the screen (Wall at 1200×800 over the resting face, or Phone at 390×844 over the strip and list), a task to try, and "Clover doesn't answer". Above the screen: the task, a **Type the line for me** button and a count of touches since the task started; under it, what the board would write. Everything on the screen can be tapped. The keyboard is a drawn stand-in (the tablet's Android keyboard and the iPhone's, sizes inferred) so you can see what it covers; its keys type, or type on a computer's own keyboard. A stand-in Clover sorts the line the way the real one does ([J006, Ask Clover](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)). The address's `#hash` holds the state, e.g. `#a-wall-dentist`; `-shot` draws the screen alone at real size. Pictures are in [shots/](shots/).

<!-- VARIANTS -->

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


<!-- COUNTS -->

<!-- REVIEWS -->

# Board next: synthesis

2026-10-29. One ranked plan from five research lenses, a fresh-eyes walkthrough, checks against the real house, and the own-project decision. Read [mission.md](mission.md) first; this file serves its measures (capture, trust, at rest, no manual, comfort, floor).

Inputs: [the market](../research/family-display-ecosystem.md), [household coordination](../research/household-coordination.md), [capture](../research/capture-friction.md), [the board at rest](../research/calm-at-rest.md), [comfort and discoverability](../research/delight-and-discoverability.md), the earlier [Skylight](../research/skylight-calendar.md) and [legibility](../research/wall-display-legibility.md) notes, and the [walkthrough](walkthrough-2026-10-29.md). Index: [research-index.md](research-index.md).

## The answer

The board already looks like the thing Jenn wanted. It fails at the moments that build trust: adding something takes about 12 taps and gives no answer; what you add from the board can't be fixed from the board; the other person isn't told; the shopping button leads nowhere; and from across the room it shows the date, weather and dinner but not what's now, what's next, or what needs doing. Every lens arrived at the same three fixes from different directions:

1. **Capture answers back.** From wherever the thing came up, one sentence or one gesture puts it on the board, and the board says exactly what landed where, with an undo. (Market, capture, comfort.)
2. **The system does the noticing.** The board, not either adult, spots the unplanned dinner, the clash, the calendar that stopped syncing, and the thing the other person added. It says so quietly, in one place, and never nags. (Household coordination, calm, market.)
3. **At rest it answers three questions with no touch and no motion:** what's now, what's next, is there anything I need to do or bring. (Calm, legibility, walkthrough.)

Five lines from the lenses that the plan keeps whole, not averaged:

- The wall fails when one adult becomes the only one feeding it. (market)
- A shared board shares the load only when the system does the noticing and following up. (household)
- "It's handled" is only true when both adults trust the board to have it. (capture)
- The resting board earns every glance by never spending one. (calm)
- Comfort comes from safety and relief, not delight. (comfort)

## Broken today, on the real house

Checked in the sandbox and, read-only, on the house (2026-10-29). These come before anything new.

| # | What's wrong | Effect | Fix | Tier |
|---|---|---|---|---|
| B1 | **The add form starts on Will**, an iCloud calendar the board can add to but never change or delete | Anything added from the board is permanent there; a typo stays forever and the sheet doesn't say why | New events default to Us (both of you, fully editable); iCloud events say "This is on Will's iPhone calendar. Change it there." | 2 |
| B2 | **"Hide work calendars" doesn't hide Work.** Family Hub's own Settings > Calendars list was refilled (Will, Home, Us, Work) and overrides both dashboard copies; J006 says keep it empty | Guest mode turns the switch on for a sitter, and Work still shows | Empty that list again (a Home Assistant change: needs the owner's OK), then make the board read columns from one place so it can't recur | 1, then 2 |
| B3 | **The board's Shopping List opens a Grocy tab** ("Grocy isn't connected"); Add does nothing | The real list (`todo.shopping_list`) is six taps away in the sidebar among 12 oddly named lists | The button opens the real shopping list; Grocy wording goes | 2 |
| B4 | **Dead and misleading controls:** Recipe Box and Suggestions (recipes are off), "Suggest" on the wall's meal slot that actually saves, a Right Now card file that doesn't exist (a failed request on every open), "Delete theme" a tap away | Clutter, and labels that lie | Remove or relabel | 2 |
| B5 | **No answer after saving,** anywhere | "Did it work? I'll text him." | A short "On the board: Dentist, Tue Nov 3, 3:30 pm, on Us" with Undo | 2 |
| B6 | **Home Assistant's sidebar and top bar take a fifth of the wall** | It reads "computer," not "family calendar" | Kiosk Mode for the tablet's login (already decided, J008 step 6) | 1 |

## Where the lenses disagree, and the call

| Question | The pull each way | Call |
|---|---|---|
| How often may the board push to phones? | The market sells a daily evening brief; household research says one week-ahead a week; the house rule says as rarely as defensible | **One "week ahead" on Sunday evening, the same for both.** A daily brief only if the weekly one proves too little. Decision D4, queued |
| Should the wall take typing? | The market and Skylight say nobody types on the wall; the comfort lens wants a tap-the-day add; capture wants one rough line | **Tap the day, type one rough line,** parsed by the same Claude path as voice, echoed back. No long form. Phones and voice stay the main way in |
| Reveal detail as someone approaches (Apple HomeView does)? | Market: it's the new idea; calm: this tablet can't sense distance, only motion (cats included) | **No sensing.** The resting view must answer the across-the-room questions itself; touch reveals detail |
| Where do shared events live? | Apple's free capture tools write to iCloud; "tell the board" writes to Us; the board can't edit iCloud | **Now: two homes on purpose** (board and voice write to Us; phones' default can be a shared iCloud calendar). **Later: the board edits iCloud itself** (wave 4), and the question disappears. Decision D3, queued |
| How much joy? | Owner asked for "moments of joy"; research says delight decays and cheer erodes trust | **Joy that carries information:** the specific echo, a countdown to something you're looking forward to, a calm "Nothing needed today." No confetti, mascots, streaks or sounds |

## How to build it (decision D1)

The owner made this the house's own project (2026-10-29). The question is how to get from upstream's 26,000-line week card to a board built around the measures, while the house always has a working board.

- **A. Build a new house board in stages beside the current one** (confidence 0.70). First its resting face on the tablet, then its capture sheet, then its event sheet, then phone views; the current card stays as the detail view and fallback until each piece replaces it, then is retired. Each stage ships alone and is reversible by one setting.
  - Delivers: small, readable, tested code the house owns; every stage is visible on the wall within days; nothing big-bang.
  - Gives up: for a while two cards coexist, so a few fixes (B1, B3 to B5) land in the old card too, as small tier 2 changes, and some of that work is later retired.
- **B. Keep improving the current card** (0.20). Fix B1 to B6 and the top ideas inside upstream's card.
  - Delivers: the fastest fixes.
  - Gives up: every change sits in a 26,000-line file nobody else maintains; the resting view and capture sheet would be built into code we'd rather replace.
- **C. Rebuild the whole board at once** (0.10).
  - Delivers: one clean design.
  - Gives up: weeks without visible progress, and the largest regression risk on the wall.

**Recommendation: A.** It gets the household a better wall soonest, keeps a working board at every step, and turns "own project" into code sized for Claude sessions to keep working. The backend stays Family Hub's (settings, themes, copy sync, the calendar copy, the meal plan format) with house services added where needed (undo, who-added, editing iCloud); unused backend features (chores, rewards, goals, routines, recipes, Grocy, pantry, timers) come out once nothing depends on them.

## The plan, in waves

Ranked inside each wave by value for effort. Every Home Assistant change is explained first and built after approval; every code change is a tested PR into `house/board-next`, and nothing reaches `main` without the owner.

**Wave 0: fix what's broken** (B1 to B6 above). Small; days, not weeks.

**Wave 1: capture that answers back** (mostly Home Assistant scripts and phone settings)
1. Voice says back weekday, date, time, where, and what it guessed ("No time given, so it's a note on Thursday"); on failure the Shortcut says so and keeps the words. *Capture, trust.*
2. Undo everywhere: "tell the board, undo that," and an Undo on the board after every add, delete and clear. Events need a small house service around Family Hub's existing delete. *Trust.*
3. Rough entries are never refused: event, day note, proposed day, deadline, or a "Later" list; a dreaded "call the dentist" lands on a proposed 10-minute slot. *Capture, comfort.*
4. "Tell the board" in the iPhone share sheet, for any text. *Capture.*
5. The phones' default calendar points at a shared board calendar, so Apple's own add-from-a-screenshot, tapped dates and Siri all reach the wall (pending D3). *Capture.*
6. Later, only with a receipt: forward an email or flyer to the board. *Capture.*

**Wave 2: the system notices**
1. A calendar that stops syncing says so on its column ("updated Tue"), and the planned watchdog tells the owner once. *Trust, floor.*
2. A small dot on what the other person added since you last looked, cleared by a look or a day; no push. *Trust, two equal adults.*
3. A quiet clash mark when your plans overlap the other's. *Trust.*
4. A shared event shows once, in both colors, not twice. *Trust.*
5. Jenn's calendar in her column, each adult choosing titles, labeled blocks ("Work 9 to 5"), or hidden. *Two equal adults.* (Waiting on her account type.)

**Wave 3: the resting face** (the first piece of the new board)
1. The tablet's resting face: a large "Now / Next" line, today and the next three days with titles readable from 6 to 9 ft, dinner, weather. Evening hands the emphasis to tomorrow. After 3 minutes untouched it drifts back. *At rest.*
2. One "needs you" place, empty most days, at most one still line: a clash today, a house reminder due, dinner not planned by mid-afternoon (owner's choice), a birthday in 10 days with no note. *At rest, the system notices.*
3. Notes that act like the whiteboard: a note shows large until someone clears it, with no time attached; undated ideas live on "Later." *Capture, at rest.*
4. Symbols you read without reading: a fixed word-to-icon table (vet, dentist, flight, trash, birthday) and a distinct mark per person, which also fixes Will and Work both showing "W" (issue #31). *At rest, comfort.*
5. One automation owns the light: on and full at 6, dimmer at sunset, off at 11 or at Good night, motion detection off; no screensaver (J008 Q12, as one Home Assistant automation). *At rest, floor.*

**Wave 4: the rest of the new board**
1. Edit and delete for every calendar, including iCloud, through the house's own CalDAV write path. *Trust; resolves D3.*
2. The wall's capture sheet: tap the day, one line, echo, Undo. *Capture.*
3. Phone views: open on today's list, the week starting today, Month for planning; one plain Settings page (text size Small/Medium/Large; "When I walk up, show: Today / Week"). *No manual.*
4. The Sunday week-ahead for both (pending D4). *The system notices.*
5. Retire upstream's week card for the house, then remove the backend features nothing uses. *Floor.*

## Decisions

**Now:** D1 (above), and D2, the OK for the Home Assistant half of wave 0: empty Family Hub's Settings > Calendars list so "Hide work calendars" works again (B2), and set up Kiosk Mode on the tablet's login (B6, decided 2026-10-26).

**Queued, each with a default, asked when its wave arrives:**
- **D3, where shared events live:** A two homes now (0.6, default), B iCloud only once the board can edit it (0.3), C Us only (0.1).
- **D4, phone pushes about the calendar:** A one Sunday week-ahead for both (0.6, default), B a daily evening brief when tomorrow has something (0.25), C none beyond today's digest (0.15).
- **D5, screen off when nobody is home:** A off after 10 minutes empty, back on at the first arrival, Guest mode keeps it on (0.65, default), B always on in waking hours (0.25), C off whenever Fully sees no motion (0.10).
- **Dinner nudge in "needs you"** (wave 3): off by default.

## Moments of joy, honestly

Researched and kept: the moment the board says "it's handled" in specific words; a countdown to something you're looking forward to (Family Hub's countdown is already on, with nothing in it); a crisp tick when a note is cleared, and the house reminder's echo of when it's next due ("Filter: done. Next one in March"); a quiet "Nothing needed today"; the Sunday look at the week ahead. Researched and dropped: confetti, mascots, streaks, sounds, jokes about obligations, rotating photos, seasonal animations. Family Hub's holiday backgrounds (all off now) are still pictures, so they stay an option, not a plan.

## Not building

Kid features, rewards and gamification; a recipe system or Grocy; a photo frame or video screensaver; an inbox someone has to empty; invitations or accept/decline between the two of you; tallies of who did what; reading mailboxes or messages on our own; presence or face sensing; a second voice phrase; anything that only the owner can run or fix. Apple's new HomeView (announced 2026-10-13, $299, 7 in, ships 2026-11-13) has a calendar face; it doesn't change this plan, and is worth a look once owner reviews exist.

## How complete this is

This is complete for this round. Checked: the market (dedicated displays, smart displays, organizer and AI apps, self-hosted boards, owner forums), household coordination and mental-load research, capture behavior and channels on iOS and Home Assistant, ambient and calm display research, comfort and discoverability research, a fresh-eyes walkthrough as both adults on a sandbox mirroring the house, and the house's live board configuration. Bounded by: the mission's measures, two adults with no children, the hardware already bought, and owning the code. Excluded on purpose: new hardware, replacing Home Assistant, cloud assistants with lock-in, and features for children. Gaps: the shared web-search budget ran out partway through every lens, so some sources were read as abstracts (each note lists them); nothing was timed on the household's real phones; the walkthrough used Chromium at phone size, not iOS.

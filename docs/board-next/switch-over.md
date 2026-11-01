# Switch-over plan: from the week card to the house board

**Approved by the owner 2026-11-01**, with one change to the tablet step (1c), for [How does each copy move to the house board, and back if it fails?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99), on the [map](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37). The steps come from [What still depends on the week card, and what changes when it goes?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/96#issuecomment-6558258606) (its [checklist](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/week-card-dependencies/docs/research/week-card-dependencies.md) has every entity and line number). Approving this plan approves every Home Assistant and tablet change in it. Anything that has changed by the time a step runs is explained again.

Each Home Assistant or tablet change is set out as **Does**, **Gains**, **Costs**, and **Changes you could make**, each rated 0.00 (never) to 1.00 (should have been in the proposal).

## How it moves (owner, 2026-11-01)

- **Slice by slice, each deployed as soon as it's done.** Nothing waits for a later slice.
- **The phones move the same way.** Both phones, Jenn's included, get each slice's phone part when it's done. There's no trial week on Will's phone first.
- **Each change moves with the slice that needs it.** There's no single switch-over day:
  - the notes change goes with the notes slice;
  - Us moves to iCloud with the event sheet;
  - the week card retires with the last slice that still sends anyone to it.
- **No fallback switch.** If the house board fails, a session puts it right (see [If the house board fails](#if-the-house-board-fails)).

**Until the house board can do something, that thing opens the week card** where it would have been, on the wall and on the phones. The wall comes back to the house board after two minutes untouched.

Slices are numbered in build order. A slice that's done early goes up early, unless it needs an earlier one: Us needs the event sheet, and the notes change needs Lists.

## Every slice goes up the same way

| Step | Who |
|---|---|
| 1. Tests (`bash tests/run_all.sh`), the sandbox open-time check ([load time](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)), frame stats on the tablet ([motion](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)), and a code review | Agent |
| 2. Will approves the merge to `main`, and CI runs once on the final head | Will |
| 3. A full Home Assistant backup | Agent |
| 4. HACS update and restart, then the slice's Home Assistant and tablet steps below | Agent |
| 5. Right after: the wall's first content within 2 s, the open times each copy records, and no stutter. If another app is on the tablet's screen, the check waits; it never brings Fully to the front | Agent |
| 6. Records: J006 and J008, both glossaries, and the sandbox's copy of the house setup | Agent |

## Before slice 1, on its own: Jenn's Google calendar

**Who:**
- Will: the Google Cloud steps, from a checklist.
- Jenn: signs in, after agreeing.
- Agent: everything in Home Assistant.

**Does.** Connects Jenn's personal Google calendar through Home Assistant's official Google Calendar integration, with read and write access ([what to keep](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623), decision 8). The steps:
1. A Google Cloud project on Will's Google account, with the Calendar API turned on.
2. Its sign-in screen published. Unpublished, "your credentials will expire every 7 days" ([Home Assistant's docs](https://www.home-assistant.io/integrations/google/)).
3. Its credentials added to Home Assistant.
4. Jenn signs in with her Google account and allows calendar access, and Calendar access is set to read and write.
5. Jenn picks which of her calendars come in. The rest are turned off in Home Assistant.

Her calendars then show in her column on the week card, and as Jenn's on the house board, with titles until she chooses otherwise ([how much of Jenn's calendar shows](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357)).

**Gains.**
- Jenn's plans are on the wall weeks sooner.
- The house board is built and checked against her real calendar.
- Home Assistant can add and delete on her calendar, and the sheet can change her events once [the Google write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100) is built.

**Costs.**
- Google will likely warn during her sign-in that the app isn't verified, and she continues past the warning *(inferred)*.
- Either adult outside Guest mode can change her calendar from the board, with Undo.
- The sign-in is kept in Home Assistant and its backups.

**Changes you could make:**
- Start read only, and add write access when the sheet can use it. 0.20
- A separate Google calendar Jenn shares just for the house, so the board never touches her own. 0.10

## Before slice 1, beside it: Google Weather

**Who:**
- Will: the billing steps in Google Cloud, from a checklist.
- Agent: everything in Home Assistant.

**Does.** Adds Home Assistant's Google Weather integration for the board's weather, since the house forecast gives 6 days and no chance of rain ([card features](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/104#issuecomment-6564600586), decision 7). The steps:
1. In the Google Cloud project made for Jenn's calendar, turn on the Weather API.
2. Link a billing account, which needs a card, and cap the Weather API at 300 requests a day. That stays under the free 10,000 a month; Home Assistant uses about 150 a day *(inferred)*.
3. Make an API key that works only for the Weather API, and add it to Home Assistant.
4. The board reads only the new weather entity: hourly for the next 24 hours, daily after that. The house forecast stays for everything else in Home Assistant.

**Gains.**
- Month's full 10 days of weather, as Skylight shows.
- A chance of rain under each rainy day's icon on the face and the phones.

**Costs.**
- A card on a Google Cloud billing account. If the card lapses, the board's weather goes blank until it's renewed.
- The key is kept in Home Assistant and its backups.
- About 15 minutes of Will's time *(estimate)*.

**Changes you could make:**
- A $1 budget alert on the billing account as well, so any charge at all emails Will. 0.50
- The National Weather Service instead: no card or account, but 7 days. 0.15

## Slice 1: the resting face on the wall, Upcoming on the phones (read only)

**Code:**
- the face;
- the phones' Upcoming, read only;
- Guest mode as decided ([guests](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/68#issuecomment-6537655788));
- a weather icon on every day, and a chance of rain under rainy days once Google Weather is in ([card features](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/104#issuecomment-6564600586));
- person blocks with their color put back (1.5 times), each pick from the 12 stored by its name;
- the board refreshes the calendar copy itself;
- each copy records its open times and last errors in Home Assistant;
- Family Hub's 11 unused card files retire.

### 1a. A House board dashboard (agent)

**Does.** Adds a dashboard at `/house-board` holding only the house board. It's open to both adults and to the wall's Clover sign-in, and listed in the side menu. That settles the conflict between [the code layout](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169) (hidden) and [the iPhone app](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807) (a sidebar title). `/family-hub` stays as it is.

**Gains.** The house board gets its own address, with the week card untouched behind it.

**Costs.** One more side-menu entry until `/family-hub` goes.

**Changes you could make:**
- Hide it from the side menu. 0.05

### 1b. House board as everyone's default dashboard (agent; then Will and Jenn each close the app once)

**Does.** Sets the house board as the default in Settings > Dashboards > House board > Set as default, so "this dashboard is shown to all users when they open Home Assistant" ([Home Assistant's docs](https://www.home-assistant.io/dashboards/dashboards/)). This only works where a person's own choice is "Auto (use system settings)":
- Will checks his in Profile > Appearance > Dashboard.
- Jenn's has never been changed *(inferred)*.

Then each adult swipes the Home Assistant app closed once, so it doesn't reopen on its last page. The wall isn't affected, because it opens Fully's Start URL.

**Gains.** Both phones move with one setting. Jenn does nothing but close the app once.

**Costs.** The Overview and the other dashboards are a side-menu tap away instead of first.

**Changes you could make:**
- Each adult picks House board in their own profile instead. This was [the iPhone app research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)'s way, from before a household default was considered. 0.15

### 1c. The wall's Fully settings (agent, through Home Assistant's Fully Kiosk integration)

**Owner's change (2026-11-01):** the tablet is still used for other things, so nothing in this plan ever switches apps on it or brings Fully to the front. A refresh while the board is already on screen is fine after 5 minutes untouched.

**Does.**
1. Reads and records Fully's current settings, including the exact names of the Start URL and Auto Reload keys, from Fully's own settings list.
2. Sets the Start URL to the house board's full address, the one the page actually shows, so Fully recognizes it.
3. Sets Auto Reload on Idle to 5 minutes, and turns "Skip Auto Reload if Showing the Start URL" on.
4. Leaves every setting that brings Fully to the front, and Fully's own kiosk lock, as they are (off), and checks once, with another app open, that the idle reload stays inside Fully. If it ever brings Fully forward, the idle reload comes off, and the wall stays wherever it was left until someone taps back.
5. Presses Load Start URL only while Fully is already the app on screen.
6. Leaves Delete Cache on Auto Reload and Auto Reload on Screen On off ([load time](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)).

**Gains.** The wall shows the house board, and comes back to it from the week card after 5 minutes untouched. While it's already on the house board, nothing reloads. Another app in use on the tablet is never interrupted.

**Costs.** Someone who stops halfway through a week card form for 5 minutes loses it.

**Changes you could make:**
- 2 minutes instead of 5. 0.05 (the owner chose 5)

## Slice 2: adding, the echo and Undo

**Code:**
- tap a day or an empty dinner, then speak at the wall or type on a phone;
- Tell Clover on the rail;
- the echo, with its fix, Change and Undo;
- a repeat said in the line ("every Tuesday", "until June") lands as a repeat.

Undo on Home Assistant's Us uses Family Hub's own delete until Us moves.

### 2a. Fully's microphone (agent)

**Does.** Turns Enable Microphone Access on for good ([microphone test](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/85#issuecomment-6550433680)).

**Gains.** One tap, then speak.

**Costs.**
- The board can use the tablet's microphone. It listens only after someone taps.
- The words go to Google's speech service ([wall voice](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/83#issuecomment-6548719340)).

**Changes you could make:** none suggested.

### 2b. Clover's instructions (agent; the "Claude conversation" prompt)

**Does.** Adds two rules the adding design relies on ([adding](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/house/board-next/prototypes/adding/README.md)):
- An add started from a day, a dinner or a list stays there.
- The bare-hour rule: 7 to 11 is morning, 12 to 6 afternoon or evening, and dinner, drinks, date or movie mean evening.

**Gains.** The echo's "what was guessed" matches what Clover did.

**Costs.** Any prompt change can shift how Clover files other things, so the 10/31 voice tests run again after it.

**Changes you could make:** none suggested.

**Records:** the voice guide's line about fixing a wrong filing is rewritten, and Will reprints the sheet.

### 2c. Repeats in Clover's add (agent)

**Does.** Clover's Add event action (`script.board_add_event`) calls `calendar.create_event`, which can't take a repeat. It moves to a house action that can, and Clover's instructions gain the repeat words ([card features](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/104#issuecomment-6564600586), decision 8).

**Gains.** "Yoga every Tuesday at 6", said at the wall, lands as a repeating event, as Skylight's Repeats switch would make it.

**Costs.** A Home Assistant change to a script Clover relies on, so the 10/31 voice tests run again after it, with 2b's.

**Changes you could make:** none suggested.

## Slice 3: Month and Lists, notes, the dinner sheet

**Code:**
- the wall rail's Upcoming, Month and Lists, and the phones' tabs;
- Lists with AnyList, Notes and House;
- ticking notes off, and Later;
- the dinner sheet: the dish, ‹ › day, Every week, Clear, and an empty dinner tapped to add;
- weather on Month's 10 days.

### 3a. The notes change (agent, in one step)

**Does** ([what notes become](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536918104); [#96](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/96#issuecomment-6558258606) rows 15 to 17):
- Each open note loses its 9:00 time and its rollover marker in a single update.
- The note script adds a date with no time and no marker, and "someday" adds a note with no date.
- One line in Clover's instructions sends "someday" or "later" there.

**Gains.** Notes behave as decided: each shows from its day until cleared, and Later and "someday" work.

**Costs.** The week card, still reached for anything not yet built, shows a note a day early and never shows a "someday" note (accepted, owner 2026-11-01).

**Changes you could make:** none suggested.

## Slice 4: the event sheet, and Us moves to iCloud

**Code:**
- the event sheet: title, day and time, Repeats, Place, Details, Whose, Count down, "This one / All", Delete, and Hide, with the forecast for the event's hour and, on the phones, Open in Maps ([card features](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/104#issuecomment-6564600586));
- a shared plan on two calendars changed and deleted on every copy, invitations between Will and Jenn included;
- the iCloud write path as its own house command.

### 4a. The supervised iCloud check, first (agent, with Will watching)

**Does.** Runs the write path against a throwaway iCloud calendar Will makes, with made-up events ([iCloud editing](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295)):
- it changes, moves and deletes one-off and repeating events;
- it moves an event to Us and back;
- it adds a repeating event, and turns a one-off into a repeat and back;
- it moves and then deletes an invitation from Will to a Google address the household owns, and that copy is checked for Apple's update and cancellation. If Apple sends neither, invitations stay refused, and a shared plan from one says where to change it;
- then Will deletes the calendar.

**Gains.** The write path is proven on the real iCloud before it touches Us or Will's calendar.

**Costs.** About 15 minutes of Will's time *(estimate)*.

**Changes you could make:** none suggested.

### 4b. Us moves to iCloud (one session with both of you, about 20 minutes, *estimate*)

1. **Will, on his iPhone:**
   - Check Home isn't your default calendar for new events or invitations.
   - Look over Home's past events. Once it's shared, Jenn sees all of them, and that is the one step here that can't be undone.
   - Rename Home to Us.
   - Share it with Jenn's Apple Account, with Allow Editing on and Public Calendar off.
   - Turn Shared Calendar Changes off.
2. **Jenn, on her iPhone:**
   - Turn iCloud Calendar on and accept the invitation.
   - Keep Gmail as her default calendar.
   - Turn Shared Calendar Changes off.
3. **Agent:**
   - Reload the iCloud connection so `calendar.home` takes the name Us.
   - Take `calendar.us` off Assist.
   - Point `script.board_add_event` at `calendar.home`, and drop "Not for iCloud calendars" from its description.
   - If the week card still opens, drop its `calendar.us` column and put the renamed Home first.
4. **The two-minute check,** at the wall with both phones:
   1. Add a made-up event at the wall, and see it on both iPhones.
   2. Check that each iPhone alerts for it at its own Default Alert Time.
   3. Add one timed and one all-day event by voice, and check their hours.
   4. Undo each.

   If the alerts don't come, it's a fresh ticket on the map, since "Remind me" was dropped on the strength of them ([what to keep](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)).
5. **Agent:** remove the empty Local Calendar (`calendar.us`).

**Does.** Makes Us the shared iCloud calendar both iPhones show, where every board and Clover add lands ([shared events](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/41)).

**Gains.** Board adds show in both iPhones' own Calendar, with their own alerts. Undo and changes work on them.

**Costs.**
- Jenn sees Home's whole past (step 1 checks it first).
- Apple's change alerts are off on both phones, as you chose ([#65](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/65#issuecomment-6537654826)).
- Apple records every board add as Will's.

**Changes you could make:** none beyond [#41](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/41) and [#65](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/65).

## Slice 5: Settings and the rest, then the week card retires

**Code:**
- the house preferences service;
- Settings on the wall and the phones: text size, Guest mode, Show days as, how your calendars show, Weather beside events, Hidden by you, and the house setup;
- new dots;
- Hide;
- countdowns;
- the filter;
- print.

After this slice nothing sends anyone to the week card, so the week card retires in the same session.

### 5a. The week card retires (agent, one session)

1. Delete `automation.board_private_follows_guest_mode`, then `input_boolean.board_private`. The Hide work calendars tile goes with the dashboard.
2. Delete the `/family-hub` dashboard. Its House reminders page already lives in Lists (slice 3).
3. Take Family Hub's nine privacy and screensaver switches off Assist.
4. Clear Family Hub's reminders list option, so its 5-minute check stops reading Us notes.
5. Turn Fully's Auto Reload on Idle back off. The house board returns to its face by itself, inside Fully, and never switches apps.
6. Retire the week card's own card file, in a fork update.
7. Leave the per-copy entities, Family Hub's stored copy settings and its card files in place, unused. They go in the code cleanup, since there's no delete path and the card files come back at every start.
8. Rewrite the voice guide's Hide work calendars and Guest mode lines, and Will reprints the sheet.

**Does.** Removes the week card and everything only it used.

**Gains.**
- One board everywhere.
- Less for every dashboard to load.
- No leftover switches for Assist to trip over.

**Costs.** There's no going back to the week card except by reinstalling an older version.

**Changes you could make:**
- Hide `/family-hub` from the side menu for two weeks before deleting it. 0.15 (you chose no fallback period)

**Jenn's two weeks** (the map's done gate) start the day the week card retires.

## Slice 6, whenever it's ready: Jenn's events in the sheet

**Code.** [The Google write path](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100):
- Jenn's events get the full sheet, Repeats included.
- Whose moves events to and from her calendar.
- A plan Jenn invites Will to changes as one, Google's update reaching his copy.

Before it goes up, there's a supervised check on a throwaway Google calendar, explained first, with the repeat and invitation tests of 4a from her side. It holds up nothing above.

## If the house board fails

Tell a session (owner, 2026-11-01). With your okay:
- While `/family-hub` exists, the session points Fully's Start URL and the default dashboard back at it. Each is one setting.
- After the week card retires, it reinstalls the previous fork version through HACS.

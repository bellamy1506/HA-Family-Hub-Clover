# Family Hub, house fork

The vocabulary of this repo. Read it before working here. The house's wider vocabulary (owner, Jenn, task vs issue, the smart-home names) is in the house repo's [CONTEXT.md](https://github.com/bellamy1506/House-Modeling/blob/main/CONTEXT.md).

## The code and where it comes from

**Upstream**:
JVarhol/HA-Family-Hub, the original project by one developer.
_Avoid_: original repo, parent

**Fork**:
This repo; its `main` is what the house runs.
_Avoid_: our copy, clone

**Reviewed version**:
The upstream release last read and accepted for the house (now v1.168.84).
_Avoid_: current version, latest

**Take an update**:
Merging a chosen upstream release into the fork after review and owner approval.
_Avoid_: sync, pull, upgrade

**Verdict**:
The digest's running take-it, skip-it, or wait call on upstream releases not yet taken.
_Avoid_: recommendation, review

## On the wall

**Clover**:
The house's one name, for talking to it and for what it shows: you ask Clover, and the board is Clover's face (owner, 2026-10-30). Clover works out whether something is for the board, a question, or the rest of the house.
_Avoid_: the board or the house as something you talk to; Home Assistant, in conversation

**Board**:
What Clover shows on the wall tablet and on phones: the calendar, meals, notes and lists.
_Avoid_: Skylight, hub, kiosk

**Week card**:
Upstream's calendar card, the board until the house board replaces it.
_Avoid_: the card (ambiguous once there are two), Family Week Calendar

**House board**:
The house-owned card that replaces the week card on the wall and the phones.
_Avoid_: Board 2, new card, v2

**Resting face**:
What the board shows when nobody is touching it, read from across the room.
_Avoid_: screensaver, idle screen, home screen

**Capture**:
Anything getting onto the board, from wherever it came up: voice, a phone, a share, the wall.
_Avoid_: input, entry, data entry

**Echo**:
Clover's answer after a capture: what landed, where, and what was guessed, with a way to undo it.
_Avoid_: confirmation, toast, receipt

**Copy**:
One browser storage at one address, belonging to whoever last signed in on it; what Family Hub's code calls a "device". One phone can hold several (the owner's iPhone has one for home and one for Home Assistant Cloud), and a user's view settings and theme follow them between their copies, while each copy keeps its own name.
_Avoid_: device (except when quoting the code), browser, session

**View**:
Which calendar the board shows: Week (or what the Week button is set to show, Planner or Agenda), Month (or Split), or Day.
_Avoid_: layout, layout type, mode, variant

**Start view**:
The view family (Week or Month) a copy opens in and returns to when it wakes from the screensaver. The household's choice unless that copy has its own (the wall tablet opens in Week while the phones follow the household's Month).
_Avoid_: default view (that's the household setting), home view

**Settled**:
How the board looks once everything has loaded; "opens settled" means it looks that way from the first moment.
_Avoid_: loaded, stable

**Event shape**:
An event's place, size and color on the board without its words, shown from memory while the calendars load.
_Avoid_: placeholder, skeleton, blank pill

**Person column**:
One person's lane on the Week view; a person's first calendar is the column, more calendars show inside it.
_Avoid_: row, track

**Household list**:
The to-do list Family Hub always shows to everyone (`todo.us_notes` here); items with a due date appear on that day.
_Avoid_: shared list, family list

**Us calendar**:
The one shared calendar for the two of you: whatever the board or Clover adds lands here, and it shows on the wall and both iPhones (owner, 2026-10-30). It becomes a shared iCloud calendar at the switch-over; until then it's `calendar.us`, a Home Assistant calendar the iPhones don't show.
_Avoid_: Home calendar, the shared calendar (any calendar can be shared)

**Us notes**:
`todo.us_notes`, the shared notes that replaced the whiteboards; they tap off.

**House reminders**:
`todo.house_reminders`: maintenance reminders from the house repo's `records/dates.csv`, synced both ways; the repo stays the source.
_Avoid_: chores, tasks

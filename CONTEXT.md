# Family Hub, house fork

The vocabulary of this repo. Read it before working here. The house's wider vocabulary (owner, Jenn, task vs issue, the smart-home names) is in the house repo's [CONTEXT.md](https://github.com/bellamy1506/Clover-Home/blob/main/CONTEXT.md).

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

**Slice**:
One piece of the house board, put up on the wall and both phones as soon as it's built and checked. Until the house board can do something, that thing opens the week card (owner, 2026-11-01).
_Avoid_: phase, release, wave (the synthesis's build groups)

**Switch-over**:
The weeks in which the wall and both phones move from the week card to the house board, slice by slice, each change going with the slice that needs it; it ends when the week card retires (owner, 2026-11-01).
_Avoid_: switch-over day (there isn't one), cutover, launch

**v0.1**:
The house board's first build: all six slices up on the wall and both phones, house reminders reaching the board, and the week card retired (owner, 2026-11-01). A name for the work, not a version number in the code.
_Avoid_: release, launch, version 0.1

**Done gate**:
What the house board passes after v0.1: blind reviewers walk it, round after round, until they find nothing blocking or painful; then Jenn, after two weeks of daily use, would keep it over a Skylight (owner, 2026-11-01).
_Avoid_: acceptance test, sign-off

**Resting face**:
What the board shows when nobody is touching it, read from across the room.
_Avoid_: screensaver, idle screen, home screen

**Capture**:
Anything getting onto the board, from wherever it came up: voice, a phone, a share, the wall.
_Avoid_: input, entry, data entry

**Echo**:
Clover's answer after a capture or a change: what landed or changed, where, and what was guessed, with a way to undo it.
_Avoid_: confirmation, toast, receipt

**Event sheet**:
The panel that opens when you tap an event on the house board: its title, day and time to change in place (‹ › arrows, a grid behind each), how often it repeats, its place and details, whose it is, a Count down switch, Delete from the calendar, and Hide from the board last. It also gives the forecast for the event's hour, and on the phones a way to open its place in Maps. It saves when it closes, and the echo offers Undo (owner, 2026-10-31 and 11-01).
_Avoid_: popup, modal, dialog, edit form

**Details**:
An event's own notes, as its calendar keeps them; shown and changed in the event sheet beside its place (owner, 2026-11-01).
_Avoid_: notes (a note is an Us notes item), description

**Countdown**:
The quiet "Beach trip in 12 days" line for one event someone switched on in its sheet; the nearest shows on the resting face and atop the phones' Upcoming until the event starts (owner, 2026-11-01).
_Avoid_: timer, reminder

**Dinner sheet**:
The small panel that opens when you tap a dinner (or a breakfast or lunch): the dish to retype, ‹ › to move it a day, Every week, and Clear. A dinner moved onto a night that has one joins it, and both show (owner, 2026-11-01).
_Avoid_: meal editor, meal form

**Lists**:
The house board's screen for the household's AnyList shopping lists, the notes and the house jobs that are due. On the wall it opens from the rail down the left edge, beside Upcoming and Month; on the phones it's a tab (owner, 2026-10-31).
_Avoid_: to-do, shopping list (it's one part of Lists), checklist

**Tell Clover**:
The microphone button at the foot of the wall's rail: say anything, and Clover files it as an event, a grocery, a note or a dinner. Adding to one day or one list starts from that day or list instead (owner, 2026-10-31).
_Avoid_: the + (the wall has none of its own), voice button, Assist

**Settings**:
The house board's one page for what can be adjusted: the gear at the top right of every phone tab, and the foot of the wall's rail. Your own settings are on your phone; the wall holds only its own text size and the house setup (owner, 2026-11-01).
_Avoid_: preferences, options, admin, configuration

**House setup**:
The part of Settings either adult changes for everyone, at the wall or on a phone: each person's color, and each calendar's person, work flag and block words (owner, 2026-11-01).
_Avoid_: admin settings, configuration

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
The one shared calendar for the two of you: whatever the board or Clover adds lands here, and it shows on the wall and both iPhones (owner, 2026-10-30). It becomes a shared iCloud calendar when the event sheet's slice goes up; until then it's `calendar.us`, a Home Assistant calendar the iPhones don't show.
_Avoid_: Home calendar, the shared calendar (any calendar can be shared)

**Us notes**:
`todo.us_notes`, the shared notes that replaced the whiteboards; they tap off.

**Note**:
One item on Us notes. On the house board it has no time: it shows from its day (today if it has none) until someone clears it (owner, 2026-10-30).
_Avoid_: reminder, to-do

**Later**:
The quiet line under the notes that holds notes up more than 3 days and anything added as "someday"; tap it to see them (owner, 2026-10-30).
_Avoid_: someday list, backlog, archive, overdue

**House reminders**:
`todo.house_reminders`: the house jobs (maintenance and safety) from the house repo's `records/dates.csv`, synced both ways; the repo stays the source. Bills, taxes, insurance, warranties and project calls stay in the house's emails, off the board (owner, 2026-10-31).
_Avoid_: chores, tasks

**Shopping list**:
The household's shared AnyList lists. The house board shows them and adds to them, and so does "tell the board" (owner, 2026-10-31); Home Assistant's own Shopping list is retired.
_Avoid_: grocery list (one AnyList list's name), Grocy

**Lists**:
Where the shopping list, notes and house reminders gather: a tab on the phones, and on the wall one touch from the resting face (owner, 2026-10-31).
_Avoid_: More, To-do, the house tab

## Whose it is, and what the board notices

**Person**:
Will, Jenn, or Us. Every calendar belongs to one person, and the house board names and colors events by person, never by calendar; whether a calendar is work is kept only behind the scenes, for hiding (owner, 2026-10-30). Each person has one color, chosen in the house setup (owner, 2026-11-01). Changing whose an event is moves it to that person's calendar (owner, 2026-11-01).
_Avoid_: calendar group; a calendar's name when you mean whose it is

**Detail**:
How much of a calendar the house board shows: titles, a labeled block ("At work 8 to 5", never "Busy"), or nothing. Each adult sets it for their own calendars (owner, 2026-10-30).
_Avoid_: privacy level, busy blocks

**Shared plan**:
A plan both of you are in: on Us, or on both your calendars. When the same plan sits on two calendars, the house board shows it once, and changing or deleting it there changes every copy, an invitation between the two of you included (owner, 2026-11-01).
_Avoid_: joint event, duplicate

**Clash**:
A shared plan overlapping either person's own event, or one person booked twice on their own calendars (work doesn't count for that). Two people's separate plans at the same hour aren't a clash (owner, 2026-10-30).
_Avoid_: conflict, double-booking (that's only one kind)

**New dot**:
The small mark on something the other person added or changed since you last opened the board on your phone; on the wall, on anything added or changed in the last 24 hours (owner, 2026-10-30).
_Avoid_: badge, unread, notification

**Guest mode**:
The household switch, turned on from a phone, for when visitors are over. On the house board, shared plans keep their titles, each adult's own events show as blocks, Work hides, and anyone at the wall can only add things and tick notes off (owner, 2026-10-30). Home Assistant itself stays reachable at the wall.
_Avoid_: privacy mode (Family Hub's lock), Board private (the Hide work calendars switch Guest mode turns on; it retires with the week card)

**Hide**:
Taking one event off the house board everywhere, the wall and both phones, without changing its calendar. Only whoever hid it can bring it back (owner, 2026-10-30).
_Avoid_: delete, remove, mute

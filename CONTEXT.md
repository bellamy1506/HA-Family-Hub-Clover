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

**Board**:
The Family Hub dashboard on the wall tablet (and on phones); "tell the board" and "ask the board" are its Siri phrases.
_Avoid_: Skylight, hub, kiosk

**Copy**:
One browser storage at one address; what Family Hub's code calls a "device". One phone can hold several: the owner's iPhone has one for `http://192.168.4.58` and one for Home Assistant Cloud. One user's view settings and theme follow them between their copies (issue #5); the copy's name doesn't.
_Avoid_: device (except when quoting the code), browser, session

**Person column**:
One person's lane on the week view; a person's first calendar is the column, more calendars show inside it.
_Avoid_: row, track

**Household list**:
The to-do list Family Hub always shows to everyone (`todo.us_notes` here); items with a due date appear on that day.
_Avoid_: shared list, family list

**Us calendar**, **Us notes**:
The two shared Home Assistant lists that replaced the whiteboards: `calendar.us` for timed events, `todo.us_notes` for notes that tap off.

**House reminders**:
`todo.house_reminders`: maintenance reminders from the house repo's `records/dates.csv`, synced both ways; the repo stays the source.
_Avoid_: chores, tasks

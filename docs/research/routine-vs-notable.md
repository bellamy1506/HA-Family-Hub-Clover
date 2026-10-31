# Routine or notable: which event earns the Next line

Research note, 2026-10-30, for fork issue [#69](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/69) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). Question: what signals do calendar products and research use to tell routine events (work hours, a weekly class) from ones worth leading with, which of them can the house board read from Home Assistant, and what rule for the resting face's Next line is ready to adopt if a routine first item ("At work") starts drawing the eye from something that matters? The same signal may keep routine overlaps and repeats out of clash marks and new dots.

Sources: Home Assistant core at tag 2026.10.4 (the house's version) and the calendar libraries it uses, read on GitHub; vendor references; RFC 5545; two papers. Not repeated: calendars hold deviations, not routines (Davidoff et al. 2010, [household-coordination.md](household-coordination.md)); habituation ([calm-at-rest.md](calm-at-rest.md) 1.5). **[inference]** marks my judgement; **(unverified)** what I couldn't confirm.

## The answer

No calendar product I found sorts routine from notable by itself; they rely on structure (a separate type or calendar for routine context, like Google's working location) and on the user hiding things. The house board already has the structural signal: the work flag behind each labeled block. The second signal it can read everywhere is **series membership**: Home Assistant gives every occurrence of a repeating event the series' `uid` and a `recurrence_id`, while the repeat rule itself (`rrule`) never arrives from iCloud. So the candidate rule: an event is **routine** when its calendar is flagged work, or another occurrence with the same `uid` falls within 8 days of it (weekly or more often), unless this occurrence was moved or renamed. The Next line takes the first notable event still to come, else the first event. The same test keeps a repeating clash from being marked every week and keeps a known series from earning new dots as it scrolls into view. It fails on routines typed in one at a time (a shift rota), which a calendar flagged work fixes without code. Twelve made-up calendar cases check it before it ships.

## 1. Already built or decided

- **Next** is "the first of today's events that hasn't started"; after 6 pm with today done, tomorrow's first event ([resting face](../../prototypes/resting-face/README.md)). Routine items still show in the day columns.
- **Work flag** ([#61, question 3](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357)): Work shows as "At work 8 to 5" in Will's color, and its flag already keeps work out of one-person double-bookings.
- **Clash, new dot, hide** ([#61, questions 1 and 4](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)): the board's first-seen record is keyed by each occurrence's `uid` and `recurrence_id`; hidden events count for nothing.
- **The calendar copy** holds 42 days back and 80 ahead for every calendar a board has asked about, refreshed hourly (`calendar_cache_websocket_api.py`, `WINDOW_BEFORE`, `WINDOW_AFTER`).

## 2. What products and standards use

- **RFC 5545** has TRANSP ("whether or not an event is transparent to busy time searches"), CATEGORIES, PRIORITY (0 to 9, allowed on events), STATUS and CLASS, and RECURRENCE-ID for one occurrence of a series ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) 3.8.1.2, 3.8.1.9, 3.8.1.11, 3.8.2.7, 3.8.4.4).
- **Google** gives routine context its own types: `eventType` is `default`, `birthday` ("a special all-day event with an annual recurrence"), `focusTime`, `outOfOffice`, `workingLocation` or `fromGmail`; `originalStartTime` identifies an instance "even if the instance was moved" ([Events reference](https://developers.google.com/workspace/calendar/api/v3/reference/events), updated 2026-07-07). Working location events must be transparent ([guide](https://developers.google.com/workspace/calendar/api/guides/calendar-status), updated 2026-09-11).
- **Microsoft Graph** names the moved occurrence: `type` is `singleInstance`, `occurrence`, `exception` or `seriesMaster`; `showAs` includes `workingElsewhere`; `importance` is low, normal or high ([event resource](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0), updated 2026-04-20).
- **Next-event displays** filter by response and visibility, not routine (all fetched 2026-10-30). Fantastical's menu bar shows "your next event", minus declined, hidden items and unchecked calendars ([settings](https://flexibits.com/fantastical/help/settings)). MeetingBar can "filter all-day, declined, tentative, pending, or linkless events" ([README](https://github.com/leits/MeetingBar)). MagicMirror's wall calendar hides by the user's title words, private, ongoing and duplicate events, and counts yearly repeats ("X. Birthday") ([calendar module](https://docs.magicmirror.builders/modules/calendar.html)). Skylight has no Next panel ([skylight-calendar.md](skylight-calendar.md)).

**[inference]** The pattern: routine context gets its own lane (a type or a calendar), declined or hidden items drop, yearly repeats count as occasions, and a moved occurrence is its own thing.

## 3. What research adds

- From 98 surveyed university staff and 16 interviews: "location was entered mostly for non-recurring events" and "preparation reminders were more commonly used for non-recurring events than for recurring events"; routine family activities were recorded anyway "to provide 'a visual idea of the entire day'" (Tungare & Pérez-Quiñones 2008, [full text](https://ar5iv.arxiv.org/html/0809.3447)). **[inference]** People mark one-offs as needing attention and keep routines for the day's shape: routines belong in the columns, not the lead.
- Domestic routines are "unremarkable," and technology for the home should be "invisible in use" (Tolmie et al. 2002, CHI, [abstract only](https://dl.acm.org/doi/10.1145/503376.503448)).

## 4. What the board can read (Home Assistant 2026.10.4)

Each event read carries `start`, `end`, `summary`, `description`, `location`, `uid`, `recurrence_id`, `rrule` and, new in 2026.10.0, `status` (`confirmed` or `tentative`; cancelled events never arrive) (`calendar/__init__.py`, `CalendarEvent`; [entity docs](https://contributors.home-assistant.io/core/entities/calendar/)). No TRANSP, CATEGORIES, PRIORITY, CLASS, alarms, attendees, event type or change times.

| Signal | iCloud (Will, Work, Home; Us after the switch-over) | Local Calendar (Us today) | Google (Jenn) |
|---|---|---|---|
| `uid` shared by a series | yes (RFC 5545) | yes | iCalUID **(unverified on instances)** |
| `recurrence_id` on each occurrence of a series, none on one-offs | yes: `caldav` expands client-side and only series get one (`icalendar-searcher`, `_recurs`); lab-checked in [icloud-editing.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/icloud-editing/docs/research/icloud-editing.md) | yes (`ical`, `recur_adapter.py`) | yes, Google's instance id when `recurring_event_id` is set |
| `rrule` | **never** (`caldav/coordinator.py`, `_get_events`) | yes, on every occurrence (copied from the series) | Google omits `recurrence` on instances, so likely not **(unverified)** |
| `status` | if the event has STATUS | if set | always |
| Dropped before the board sees it | nothing | nothing | declined invitations; birthdays and working location (moved to their own entities); "free" events are kept by default (`google/calendar.py`, `_event_filter`) |

So the repeat rule is missing for every iCloud calendar. The portable signal is the **sibling**: another occurrence with the same `uid` on the same calendar. Comparing `recurrence_id` with `start` would also spot a moved occurrence, but its text differs by integration (`2026-11-03 09:00:00-05:00`, `20261103T090000`, `abc_20261103T140000Z`), so it's fragile **[inference]**.

## 5. A candidate rule

**Routine.** An event is routine when either:
1. its calendar is flagged work (it shows as a labeled block), or
2. another event with the same `uid` on the same calendar starts within 8 days of it (weekly or more often),

unless its start time of day or title differs from that nearest sibling's (moved or renamed this time). Events without a `uid` are notable. Biweekly, monthly and yearly repeats are notable.

**Next line.** Among the candidates (today's timed events not yet started and not hidden; tomorrow's after the evening hand-off), the first notable one; if none is notable, the first one. Nothing leaves the day columns.

**Clash marks** (same definition as #61) skip a clash between two routine events when the same pair also overlapped at the previous occurrence: a new weekly collision is marked its first week only, and "needs you" follows the marks.

**New dots.** First-seen is recorded across the calendar copy's 80 days, not just the days in view. A known series never counts as new; a new series dots its first visible occurrence only; a moved or renamed occurrence still counts as changed. **[inference]** Otherwise the wall's 4-day window would dot every routine, and every old one-off, the day it scrolls into view.

Size **[inference]**: the Next rule is about 40 to 60 lines of plain functions over events the board already has, plus a test file, with no backend change.

## 6. How it fails

- **Routines typed in one at a time** (a shift rota, like the prototype's "Work shift" on Jenn's own calendar) have no siblings, so they still lead. The fix without code: their own calendar, flagged work.
- **A weekly event that matters** never leads, though it stays in its column; the same goes for a weekly plan on Us (date night). A change to either is still caught as moved or renamed.
- **A new weekly series is routine from its first week**; its new dot covers that.
- **Moved to another day at the same time** isn't caught. Rare; no effort.
- **A one-off on Work** (an evening work dinner) stays folded into the block, as the detail decision already does.
- **A skipped occurrence** is invisible: the board can't announce an absence.
- **No copy yet** (after a restart): no siblings, so Next behaves as today. Every failure falls back to today's behavior.

## 7. Checking it before adopting

Three weeks of made-up calendars in Home Assistant's shape (Will and Work iCloud-style, without `rrule`; Us Local-style; Jenn Google-style) and a table of time and expected Next:

1. Mon 7:40, At work 8:30 and a one-off Dentist 3:00: Dentist.
2. Weekly Yoga 6 pm, one-off Vet 4 pm: Vet.
3. Only At work and weekly Yoga: At work (fallback).
4. This week's Yoga moved to 7 pm: Yoga leads.
5. This week's Yoga retitled "Yoga, bring mat": notable.
6. A yearly birthday dinner: notable.
7. A biweekly series: notable.
8. Daily "Cat meds 7:00": routine.
9. Jenn's shifts as separate one-offs: they lead (the known failure, kept so a fix shows).
10. No `uid`: notable.
11. 8:50 pm hand-off, tomorrow's At work and Dentist: Dentist.
12. A hidden Dentist: the next notable event, else the first.

Plus marks and dots: weekly date night over a weekly class marked its first week only; a one-off dinner over that class marked; an old series scrolling into view with no dot; a new daily series with one.

Then a private replay **[inference]**: in a session, run the function over the house's calendar copy for the past 42 days and list the mornings where today's Next and the rule's differ (output never committed; the repo is public). Adopt if the owner finds every difference an improvement.

## Implications for the house board

1. **Which rule the Next line follows once a routine lead shows up** (for the owner, at the map's Next-line fog, #37). Nothing is built until then.
   - **A.** Skip only labeled blocks (the work flag). Smallest; misses weekly classes and personal-calendar shifts. 0.25
   - **B.** Skip labeled blocks and anything repeating weekly or more often, unless moved or renamed (recommended). Catches both kinds of routine from what Home Assistant already sends; costs a sibling lookup and a test file. 0.45
   - **C.** B, plus routines learned from hand-typed repeats (same title and time in 2 of the last 3 weeks). Catches shift rotas, but it guesses, and a wrong guess pushes a one-off out of the lead. 0.10
   - **D.** No rule: move routines that lead wrongly onto a calendar flagged work. No code; someone has to notice and move them. 0.20

   B leads with the one-off thing on any day that has one and gives up leading with standing weekly appointments, while staying predictable and testable.
2. **Routine means the work flag or a weekly-or-more sibling by `uid`; never `rrule`, title words, location or status; no `uid` means notable** (technical call; the owner can veto). Title words miss most (#61, question 2, option D); location and status are too sparse.
3. **The sibling lookup reads the calendar copy (today ± 8 days)**, not only the live 4-day read, and a missing copy means "no siblings" (technical call; the owner can veto).
4. **New dots track series:** first-seen across the copy's 80 days; a known series never dots as it comes into view; a new series dots once (technical call; the owner can veto). This sharpens #61's first-seen call and holds whichever option 1 picks.
5. **A clash between two routine events is marked its first week only**, under B or C (technical call; the owner can veto).
6. **Build the twelve cases and the replay with the rule**, as a pure function in `house_board/` (technical call; the owner can veto).

## What this says not to do

- Don't read `rrule` (iCloud never sends it) or parse `recurrence_id` text (it differs by integration); compare siblings.
- Don't take routine events out of the day columns: they give the day its shape (Tungare & Pérez-Quiñones 2008).
- Don't add a per-event star, importance or "routine" switch: another setting nobody revisits (mission principle 5).
- Don't ask a model to judge importance per event: untestable and unpredictable on the wall.
- Don't key on title words; households name things too many ways.

## Gaps

- No repeating iCloud event has passed through the house's Home Assistant yet (J008: none of 11 recurred); a moved occurrence keeping the series' `uid` is checked only on Radicale.
- Google's iCalUID on instances and `rrule` on Google occurrences are unverified; check when Jenn's calendar connects.
- Tolmie et al. 2002 read as abstract only; research on learning family routines automatically wasn't reached. I found no study measuring how often a routine lead line misleads a household, or any tested rule for choosing one.
- Apple's own Up Next widget rules weren't found in Apple's documentation.
- How Jenn enters her shifts is unknown.

Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# The other Home Assistant calendar cards, against Calendar Card Pro

This is part 5 of the issue: a short look at the other calendar cards a household might run in Home Assistant instead of Calendar Card Pro (CCP), and anything none of the other reports covers. CCP itself is in the sibling notes: [features.md](features.md) (what it does), [code-data.md](code-data.md) and [code-ui.md](code-ui.md) (how), [theming.md](theming.md) (look). The market outside Home Assistant (Skylight, Hearth, Cozi and the rest) is in [skylight-calendar.md](../skylight-calendar.md) and [family-display-ecosystem.md](../family-display-ecosystem.md); this note doesn't repeat them. Dayline, the Home Assistant leave-by clock, is in the ecosystem note and isn't surveyed again.

Lines marked *(inferred)* are my own judgment, not something a source states.

## Answer

- **CCP is the most-watched Home Assistant calendar card by a wide margin:** 1.2k GitHub stars and a forum thread of 237 replies and 56,532 views. Next come Atomic Calendar Revive (677 stars), Week Planner Card (527 stars) and Daylight Calendar Card (289 stars, formerly "Skylight Calendar Card"). The single biggest audience, though, is a do-it-yourself Skylight build on Week Planner Card: one forum thread, 415 posts, 151,206 views.
- **The "Skylight-style family calendar" corner is crowded and young.** Daylight (January 2026), Week Planner Card Plus (a fork, January 2026), Beacon (an add-on, March 2026), Aurora (May 2026), Family Hub Card, Family Board Card and Home Calendar Card (October 2026, already 105 stars and in HACS's default list) all aim at a wall tablet. Most are one developer's project, a few months old, and changing weekly *(inferred from their release pages)*.
- **What the other cards do that CCP doesn't:**
  - a month view (built-in card, Atomic, Daylight, Home Calendar Card, Aurora);
  - a column per person (Home Calendar Card's Planner, Atomic's Planner, Family Board);
  - their own add and edit forms, including editing a Google event by replacing it (Daylight, Home Calendar Card);
  - to-dos beside events (Calendar & Tasks Card, Home Calendar Card, Family Board);
  - a night clock and photo screensaver (Home Calendar Card);
  - a tap on an event's place to open it in Maps (Week Planner, Daylight, Home Calendar Card);
  - the chance of rain per day (Home Calendar Card);
  - a "may be stale" warning after 30 minutes without fresh data (Daylight);
  - double-booking warnings and drag to move (Family Board);
  - going back to today after a while untouched (Family Board, Family Hub Card).
- **The house board's decisions already cover most of that,** and go past every card surveyed on Hide with Undo, new dots, clash rules, settings per person rather than per browser, editing iCloud events, and voice capture. Month, Lists, notes, dinners, the idle return and clashes are all decided ([map #37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)).
- **Flagged for the owner (they'd notice, nothing decides it, CCP doesn't do it):**
  1. tapping an event's place on a phone to open Maps;
  2. rain on the coming days at rest (the resting face shows only today's weather icon; the other day columns show high and low only);
  3. a column per person, which no resting-face layout tried and the week card being replaced has. I'd skip this one *(inferred)*.
- **Agent's calls found here:**
  - check whether declined invitations reach the board;
  - refetch a second time a few seconds after writing to iCloud;
  - pick a staleness threshold (Daylight uses 30 minutes);
  - tell [#100](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100) what "edit Google by replacing it" costs, as two cards document it.

## What was read, and what wasn't checked

**Method.**
- I found the cards three ways: web searches; HACS's default plugin list (`hacs/default`, file `plugin`), read 2026-11-01 for names containing calendar, agenda, planner, schedule, family and similar; and the Home Assistant forum's [calendar tag](https://community.home-assistant.io/tag/calendar).
- For each card I read its GitHub page, and its docs site where it has one (Atomic, Daylight).
- Star counts are from the GitHub pages on 2026-11-01.
- Forum counts are from each thread's Discourse JSON (`/t/<id>.json`), or from the tag listing where marked.

**Not checked:**
- **I installed and ran none of these cards, and saw no screenshots.** Everything here comes from READMEs, docs and forum posts, which are the authors' and users' claims.
- **HACS download counts.** GitHub's API (`api.github.com`) returned 403 to the fetch tool, so release download counts weren't read. Stars stand in for popularity, which is rough.
- **The HACS default list** was read through a fetch tool that summarizes long pages, so a card could be missing from my list. Integrations (Aurora, Annuals) are in a different list, which I didn't check.
- **Release years.** GitHub release pages show day and month only, so years are inferred from forum dates.
- **The built-in card.** What a tap on an event does in the built-in calendar card is inferred: it's taken to be the same Home Assistant event dialog CCP opens, which [CCP's docs](https://calendar-card-pro.alexpfau.com/features/actions) call "the one the Calendar panel shows". I didn't check which views the Calendar panel offers.
- **Docs I couldn't fully read.** Daylight's docs index lists pages I didn't open (month view, appearance, event styles). Atomic's Calendar mode and Styling pages weren't read, so "no weather" for Atomic means only that the Main, Event, Entity and Planner pages have no weather option.
- **Sources I didn't try.** Reddit and YouTube. No source was blocked, so the tablet and Firecrawl weren't needed.
- **Licenses.** Week Planner Card Plus states no license. Aurora's and Beacon's are MIT per their GitHub pages.

## 1. How popular each is

| Card | What it is | Stars (2026-11-01) | HACS default list | Latest release seen | Forum thread |
|---|---|---|---|---|---|
| **Calendar Card Pro** | Card | 1.2k | Yes | v5.0.0, 2026-10-31 | 237 replies, 56,532 views (tag listing) |
| Built-in calendar card | Part of Home Assistant | n/a | n/a | ships with Home Assistant | n/a |
| Atomic Calendar Revive | Card | 677 | Yes | v10.3.1, 2026-06-25 (betas to 2026-09-22) | none found |
| Week Planner Card | Card | 527 | Yes | v1.14.1, 25 Jan (year not shown) | "Family calendar": 290 posts, 79,265 views since 2024-03-14 |
| (DIY Skylight build on Week Planner Card) | A dashboard recipe | n/a | n/a | n/a | 415 posts, 151,206 views since 2025-02-09 |
| Week Planner Card Plus | Fork of Week Planner Card | 26 | No (custom repository) | not shown | 97 posts, 4,910 views since 2026-01-24 |
| TrashCard | Bin-day card | 384 | Yes | not shown | not looked for |
| Daylight Calendar Card | Card | 289 | Yes | v4.14.0, 26 Oct (2026 *(inferred)*) | 125 posts, 14,645 views since 2026-01-31 |
| Home Calendar Card | Card | 105 | Yes (since its October 2026 releases) | 1.17.1, 30 Oct (2026 *(inferred)*) | none found |
| Today Card | Card | 43 | Yes | not shown | not looked for |
| Aurora Calendar | Integration with its own card | 21 | not checked | not shown | 16 replies, 4,075 views since 2026-05-05 (tag listing) |
| Beacon | Add-on (its own app) | 17 | n/a | not shown | 5 posts, 896 views since 2026-03-30 |
| Calendar & Tasks Card | Card | 12 | Yes | not shown | 24 posts, 1,850 views since 2026-05-19 |
| Family Hub Card | Card | 10 | Yes | not shown | not looked for |
| Family Board Card | Card | 4 | Yes | v0.31 (README) | not looked for |
| Annuals | Integration with its own card | not read | in HACS's default integrations, per a search summary | not read | 67 posts, 2,736 views since 2026-07-12 |
| HA Family Hub (upstream of this fork) | Integration with 11 cards | not read | not checked | n/a | 3 posts, 1,276 views since 2026-09-19 |

Smaller cards found in the HACS list, read only for a line each: Calendar Card Plus (19 stars, a CarPlay-style list with a popup), Multiday Calendar Card (15, a read-only hour grid, one to seven days, `show_now_line`, "+N more"), Wall Clock Card (31, a wall-panel layout with an agenda), Calendar Week Card (6, a week hour grid with a now line), Calendar Week View (3, an agenda or hour grid with weather icons on timed events, adding behind `addEvents`), and JJ's Birthday Card (3, birthdays typed into the card, not read from a calendar). Event Reel Card and Lovelace Timeline Card turned up in searches but show device history, not calendars.

## 2. The cards

### Built-in calendar card

Home Assistant's own `type: calendar` card draws Month (`dayGridMonth`), Day (`dayGridDay`) or a seven-day list (`listWeek`, which "does show the next 7 days, not a calendar week"). It has no week view and no person, weather or filtering options ([docs](https://www.home-assistant.io/dashboards/calendar/)). It is what a household gets without HACS, and the card picker suggests it for any calendar entity from 2026.6 ([release notes](https://www.home-assistant.io/blog/2026/06/03/release-20266)).

- **Add button, back as a choice:** `show_add_event` (default off), with `add_event_style` (`below`, `on_top`, `header`) and `add_event_size`. Owners lost the old button in 2026.3 and asked for it back ([discussion #3153](https://github.com/orgs/home-assistant/discussions/3153), from 2026-03-12). The option came in [frontend PR #53055](https://github.com/home-assistant/frontend/pull/53055), merged to the development branch 2026-08-28. A forum user on 2026-09-26 still had it only in the development version ([thread](https://community.home-assistant.io/t/add-event-button-on-dashboard/1026209)), so it reaches releases from 2026.10 or later *(inferred)*.
- **Colors:** each calendar's color is set in its entity settings since 2026.2. Only Google fills one in by itself ([features.md §5](features.md#5-colors-labels-and-people)). Before that, "WTH can't I assign colors to calendars" drew 19 posts and 3,802 views ([tag listing](https://community.home-assistant.io/tag/calendar)).
- **Tapping an event** opens Home Assistant's event dialog, with Edit and Delete where the integration allows *(inferred, as above)*. The limits are the integrations', not the card's: Local Calendar can do everything, Google can add and delete, and CalDAV (iCloud) can only add ([CCP's table](https://calendar-card-pro.alexpfau.com/features/actions#what-each-integration-allows)).

### Atomic Calendar Revive

The oldest maintained card here, revived from the archived atomic_calendar ([repo](https://github.com/totaldebug/atomic-calendar-revive), MIT, [docs](https://docs.totaldebug.uk/atomic-calendar-revive/)). It has three modes: Event (a list, the default), Calendar (a month grid) and Planner (calendars side by side over `plannerDaysToShow` days, `plannerRollingWeek` to start today). It's a reading card built around many small switches. It can't add or edit.

- **Progress and time:** a progress bar with a moving icon (`showProgressBar`, on by default), relative time until an event (`showRelativeTime`), time remaining, and a line before the next event (`showCurrentEventLine`).
- **Hidden-event count:** `showHiddenText` says how many events a limit held back, and `softLimit` lets one or two extra show rather than cut a day.
- **Filtering:**
  - allow and block lists by title or location, per calendar, as regular expressions;
  - `titleReplace` rewrites;
  - `hideDuplicates` (same summary, start and end);
  - `showDeclined: false` hides declined invitations (Google only, per the option's text);
  - a time window per calendar (`startTimeFilter`, `endTimeFilter`).
- **Multi-day events:** split across their days with part numbers (`showMultiDay`, `showMultiDayEventParts`).
- **Other:** week numbers, a per-calendar font size and weight, and `hideCardIfNoEvents`. No weather option in the pages read.

### Week Planner Card, and the Week Planner Card Plus fork

A responsive grid of day boxes, one box per day with its events listed, over `days` days from `startingDay` (`today`, a weekday, or `month`) ([repo](https://github.com/FamousWolf/week-planner-card), MIT). It's read only: the author said on the forum that the card "only reads events through the Home Assistant API" ([thread](https://community.home-assistant.io/t/family-calendar/703986), 2024-03-17). It's the base of the forum's biggest DIY Skylight build ([thread](https://community.home-assistant.io/t/diy-family-calendar-skylight/844830)), which adds Browser Mod, Bubble Card, config-template-card, card-mod, Grocy and helper entities around it.

- **Weather per day:** condition, high and low (`showCondition`, `showTemperature`, `showLowTemperature`).
- **Show and hide:** a legend with show or hide per calendar (`legendToggle`), plus calendars that start hidden.
- **Merging and cutting:**
  - `combineSimilarEvents` merges events with the same time and title;
  - `maxDayEvents` cuts a day with a "More events" line;
  - `hideDaysWithoutEvents` drops empty days.
- **Tapping:** an event opens a details popup, and its place links out through `locationLink` (a maps URL).
- **Other:** arrows to page dates (`showNavigation`), multi-day modes, and Luxon formats.
- **DIY complaints:** a blank calendar from a variable typo, a script that wouldn't save, filters slow to apply, and editing or deleting "not straightforward" (thread, 2025-02). A builder wanted a legend without clickable filters because the family found filters "confusing" (2026-07 and 08, [page 21](https://community.home-assistant.io/t/diy-family-calendar-skylight/844830?page=21)).
- **Week Planner Card Plus** ([repo](https://github.com/randrcomputers/week-planner-card-plus), no license stated; [thread](https://community.home-assistant.io/t/week-planner-card-plus-and-ics-calendar-tools/978450)):
  - adds an Add and Edit dialog, opened by a tap on a day or an event;
  - adds a Skylight-style schedule view (`startHour`, `endHour`, `autoScroll`, `dimPastEvents`, `showCurrentTimeBoundary`);
  - adds "series-safe" repeat changes (this one, following, or all);
  - edits local `.ics` calendars through a companion integration;
  - says plainly that Google can add and delete but not edit, and CalDAV can usually only add.

### Daylight Calendar Card (formerly Skylight Calendar Card)

The card the HA Skylight builders moved to: "pretty much the perfect Skylight implementation" (forum, 2026-02-09) ([repo](https://github.com/superdingo101/daylight-calendar-card), MIT, [docs](https://docs.daylightcalendar.com), [thread](https://community.home-assistant.io/t/skylight-calendar-card-a-family-friendly-schedule-card/981221)). It has four views: Month; Week Compact (a column per day, no hours); Schedule (an hour grid, `show_current_time_bar` off by default); and Agenda.

- **Rolling days:** `rolling_days_week_compact` and `rolling_days_schedule` start at today. When following today, "the view advances at browser-local midnight, including on always-on dashboards" ([week view](https://docs.daylightcalendar.com/views/week.md)).
- **Combined calendars:** an event on several calendars becomes one chip when title, start, end and location match exactly, marked with bars, stripes or dots. Its color is the first calendar's, a neutral gray, or a set color ([combine calendars](https://docs.daylightcalendar.com/advanced/combine-calendars.md)).
- **Virtual calendars:** several entities grouped under one name, color and icon. This is the house's "every calendar belongs to a person".
- **Rules:** day badges, chips on days matching a calendar or words (a cake on birthdays, [day badges](https://docs.daylightcalendar.com/advanced/day-badges.md)), and event styles by keyword. A user's household gave badges "2 thumbs up" (2026-07-05).
- **Editing** ([event management](https://docs.daylightcalendar.com/configuration/event-management.md)):
  - its own forms for add, edit and delete;
  - repeats are created with a frequency;
  - deleting a repeat asks "This event only", "This and future events" or "All events";
  - `readonly_calendars`, and a "Cannot Modify" notice for events without a UID;
  - Google edits are "create-then-delete", so "the event's UID changes";
  - `location_links` adds "Open in Google Maps" and "Copy address".
- **Offline cache (v4.9.0):** "Failed refreshes leave the last-known-good data in place instead of blanking the card", and a "Calendar data may be stale" warning appears after 30 minutes without a successful refresh ([troubleshooting](https://docs.daylightcalendar.com/troubleshooting.md)). Since v4.9.1 it reloads at once on reconnecting.
- **Other:** dark mode, `past_event_mode` (none, muted, hide), and per-event custom colors kept in the browser.
- **Complaints:** the rename left owners on stale files until they reinstalled and cleared the browser cache ("it does not work anymore", 2026-07-02); "Getting my google calendar setup was a pain!" (2026-07-17); 24-hour time and date formats that didn't follow the language (2026-02).

### Home Calendar Card

The newest serious one, and the closest in intent to the house board ([repo](https://github.com/mimikm/Home-Calendar-Card), MIT, "Zero dependencies, one file"). Releases came almost daily from 1.12.0 (16 Oct) to 1.17.1 (30 Oct), and it joined HACS's default list in late October. It has four views: Agenda; Week ("7 columns, stacks on phones"); Month ("+N" past `max_events_per_day`); and Planner, "a column for each person" over 1 to 31 days, where tapping an empty box adds to that person's day.

- **People:** each calendar is linked to a `person` for a photo or initials, and `group` puts several calendars in one column and one toggle.
- **Weather:** current conditions in the header; each day gets an icon, high and low, and **rain chance**.
- **Countdowns:** chosen in `countdowns:`, plus automatic ones for birthdays, anniversaries and holidays.
- **Event types and icons:** types are stored as a `#tag` in the event's description (`#work`, `#holiday`, `#private`), "Typing `#holiday` etc. in Google or Apple Calendar also works". `icon_rules` pick icons from title words.
- **Private events:** `#private` or `private: true` shows only "Private" and the time, which the README notes "isn't a security feature".
- **Editing:**
  - add (title, type, repeat, calendar, all day, times, place, notes);
  - edit, where Google events are replaced by default (`edit_by_replace`). The README lists the cost: guests, reminders, Meet links and colors aren't copied, and repeating Google events can't be edited this way;
  - delete one, "This and following", or all.
- **To-dos:** a `todo_entity` panel grouped by person or due date, tick with Undo, "Done by" notes.
- **Wall tablet:**
  - `night_mode` on a schedule or entity, either a dim screen or a clock that drifts each minute against burn-in, woken by touch or a motion sensor;
  - a photo screensaver with clock, weather and next events, reset to today when it starts;
  - `keep_awake`;
  - a drag-and-resize layout designer with phone layouts (1.17.0).
- **Data:** a refetch every 5 minutes, chips remembered per browser, and "New events may take a few seconds to appear, especially with iCloud via CalDAV", after which the card refreshes again by itself.
- **Planned, not built:** voice entry, travel time.

### Calendar & Tasks Card

One sorted timeline of calendar events and to-do items ([repo](https://github.com/korova-sq/calendar-tasks-card), MIT, [thread](https://community.home-assistant.io/t/calendar-tasks-card-unified-agenda-for-events-and-todos/1010940)). The ecosystem note already lists its overdue and undated to-dos.

- **Sections:** Overdue in red (`overdue_days`), a "No Date" section, a Completed section.
- **Ticking:** checkboxes only when `allow_complete` is on.
- **Other:** a month toggle, weather per day, `include` and `exclude`, `filter_duplicates`, and an add button for events or tasks.
- **Pitfalls it documents:**
  - completing iCloud CalDAV to-dos fails inside Home Assistant core (a `sort_keys` error);
  - iPhone Reminders can take up to an hour to reach CalDAV;
  - the add form can't make repeats;
  - the author says not to rely on it alone for flights or medical appointments.

### Aurora Calendar

An integration that registers its own card, so "install once, configure once" with no separate resource ([repo](https://github.com/davidlop28/ha-aurora-calendar), MIT, [thread](https://community.home-assistant.io/t/aurora-calendar-family-calendar-integration-and-card/1009402)). It has five views (Month, Week, Biweek, Today, Next 7 Days), per-person colors taken from the calendars, weather mainly in Month, and drag-to-create in the week views ("needs UX polish"). It comes with 10 languages, most machine-assisted.

- **Complaints:**
  - the add dialog ignored Home Assistant's 12 or 24 hour and first-day settings while the calendar followed them (2026-10-10);
  - multi-day events showed midnight on the return day (2026-06).
- **Requests:** colors by keyword for people without their own calendar, and the current week pinned on top.

### Family Hub Card and Family Board Card

Two small family boards built on any `calendar.*` and `todo.*` entities.

- **Family Hub Card** ([repo](https://github.com/tempus2016/family-hub-card), MIT, 10 stars):
  - four views (Schedule, Week, Month, Day);
  - a tint per person, and "a shared calendar appears once in a neutral colour";
  - a meals calendar as a pill atop each day;
  - kid chores (richer with its TaskMate backend);
  - `confirm_window`, seconds to undo a tick before it's sent;
  - `return_to_today` after a timeout;
  - settings stored per device.
- **Family Board Card** ([repo](https://github.com/renespeaker/ha-family-board-card), MIT, 4 stars, v0.31):
  - six views, including a day view with people as columns on a shared time axis with a now line, and a "Now" view for wall tablets;
  - a now and next bar per person (`show_focus`);
  - a "day check" warning of double bookings, gaps between events (`gap_min`) and "nobody home";
  - `color_by` person, location or calendar;
  - add, edit and delete on writable calendars, with "this event only / this and following";
  - drag to move and resize single events;
  - `auto_return` after inactivity, and bigger touch targets in kiosk mode;
  - English and German only.

### Beacon

Not a card: an add-on that runs its own family "command center" app for wall tablets ([repo](https://github.com/asachs01/beacon), MIT, [thread](https://community.home-assistant.io/t/beacon-free-family-command-center-add-on/1000220)).

- **Calendar:** a weekly calendar color-coded by person, from Home Assistant calendars.
- **Lists:** shopping lists from AnyList, Home Assistant's shopping list or its own; to-dos.
- **Household extras:** a chore leaderboard, a meal plan bar, timers, media controls, a photo slideshow, 8 themes, and PIN profiles.
- **Voice and AI:** an MCP server with Assist sentences.
- **Complaint:** a spouse switched the kiosk into "kids display" mode by accident and couldn't get out (2026-09-27).

### Today Card, TrashCard and Annuals

Three narrow cards households pair with a calendar.

- **Today Card** ([repo](https://github.com/JonasDoebertin/ha-today-card), MIT):
  - one day as a plain list (`advance: 1` for tomorrow);
  - finished events hidden by default;
  - a calendar it can't reach is named rather than shown as an empty day;
  - its README warns that `combine_similar_events` "also merges separate events that happen to match", such as two people's "Busy" blocks.
- **TrashCard** ([repo](https://github.com/idaho/hassio-trash-card), Apache-2.0, 384 stars):
  - the next bin pickup from all-day events on a local calendar, matched by title patterns, with an icon and color per type;
  - `day_style: counter` for "in 2 days";
  - `drop_todayevents_from` (default `10:00:00`) hides the day's pickup once the truck has been.
- **Annuals** ([thread](https://community.home-assistant.io/t/annuals-more-than-just-a-birthday-holiday-tracker/1017120)): an integration and card for yearly events (birthdays, anniversaries, name days), with days until each and which occurrence it is, and ICS and vCard import.

## 3. Feature matrix against Calendar Card Pro

"Yes" means the card's own docs or README say so. "Part" is explained in the cell. "?" means not stated in what I read. The house column is the decided house board ([map #37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37) and the [prototype READMEs](../../../prototypes/README.md)). Rows where **CCP has No and the house has No** are the ones section 4 looks at.

| Feature | CCP v5 | Built-in | Atomic | Week Planner | Daylight | Home Cal. Card | Others that do it | House board (decided) |
|---|---|---|---|---|---|---|---|---|
| List of coming days | Yes (list) | Yes (7-day list) | Yes | Part (day boxes) | Yes (Agenda) | Yes (Agenda) | most | Yes (phones' Upcoming) |
| A column per day | Yes (columns) | No | No | Yes | Yes (Week Compact) | Yes (Week) | Family Board, Aurora | Yes (resting face, 4 days) |
| Hour grid with a now line | Yes (grid) | No | No | No (Plus fork: Yes) | Yes (Schedule, line off by default) | ? | Family Board, Multiday, Calendar Week Card | No (a gap in [features.md §18](features.md#18-first-pass-against-the-house-board)) |
| Month grid | No | Yes | Yes | Part (`days: month` as boxes) | Yes | Yes | Aurora, Family Hub Card | Yes |
| A column per person | No | No | Yes (Planner, per calendar) | No | No | Yes (Planner) | Family Board, the week card | No (layout D; person filter instead) |
| Starts today, rolling | Yes | Yes (list) | Yes | Yes | Yes | Yes | most | Yes |
| Color per calendar or person | Yes | Yes (entity color, 2026.2) | Yes | Yes | Yes | Yes | all | Yes (per person, 12 checked colors) |
| Person's picture | Yes | No | No | No | Part ("person entity integration") | Yes | Family Board, Family Hub Card | No (names in words, decided) |
| Shared event shown once | Yes | No | Part (removes the copy) | Yes (`combineSimilarEvents`) | Yes (marked by bars or dots) | ? | Calendar & Tasks, Today Card, Family Hub Card | Yes (Us green, both names) |
| Weather per day | Yes (icon, high; low and UV on request) | No | No | Yes | Yes | Yes | Calendar & Tasks, Aurora | Part (today's icon; other columns high and low only; Month 10 days) |
| Chance of rain per day | No | No | No | No | ? | Yes | | Part (today's "Rain from 2 pm" line only) |
| Weather beside a timed event | Yes | No | No | No | No | No | Calendar Week View | No (a gap in features.md §18) |
| Now marker | Yes | No | Yes (progress bar) | Part (a CSS class) | Yes (Schedule) | ? | Family Board | Yes (Now rows, Next band) |
| Finished events faded or gone | Yes | No | Yes | Yes (hide) | Yes | ? | Today Card | Yes |
| Countdowns | Yes (every event) | No | Yes (relative time) | No | ? | Yes (chosen, plus birthdays) | | Yes (chosen per event) |
| Birthday ages | Yes | No | No | No | No | ? (types, not ages) | Annuals | No (a gap in features.md §18) |
| Says how many it hid | Part (not in compact mode, hover only in grid) | n/a | Yes | Yes | ? | Yes (Month "+N") | Multiday | Yes ("+N more") |
| Tap for details | Yes | Yes *(inferred)* | Part (link or more-info) | Yes | Yes | Yes | most | Yes (event sheet) |
| Open the place in Maps | No | ? | Part (a location link) | Yes | Yes | Yes | Calendar Week View | No |
| Add an event | Yes (Home Assistant's dialog) | Yes (opt-in, 2026.10 or later) | No | No (Plus: Yes) | Yes | Yes | Aurora, Family Board, Calendar & Tasks | Yes (one line, voice at the wall) |
| Change or delete | Part (Home Assistant's dialog; no iCloud) | Part (same) | No | No (Plus: Yes) | Yes (Google by replacing) | Yes (Google by replacing) | Family Board | Yes (house write paths for iCloud and Google) |
| Make an event repeat | Yes (Home Assistant's dialog) | Yes (same) | No | No (Plus: Yes) | Yes | Yes | | No (dinners only: Every week) |
| Repeats: this and following | Part (Local Calendar only) | Part (same) | No | No (Plus: Yes) | Yes (delete) | Yes (delete) | Family Board | No ("This one / All", decided) |
| To-dos beside events | No | No | No | No | No | Yes | Calendar & Tasks, Family Board, Beacon | Yes (notes, Lists, house jobs) |
| Hide a calendar on screen | Yes (per browser) | No | No | Yes (legend) | ? | Yes (per browser) | | Yes (person filter, per person) |
| Hide one event | No | No | No | No | No | No | | Yes (Hide, with Undo) |
| Block text for a calendar | Yes (`replace_with`) | No | Yes (`titleReplace`) | Yes (`replaceTitleText`) | ? | Yes (`private`) | | Yes (detail per calendar, Guest mode) |
| Night clock or dimming | No | No | No | No | No | Yes | | Out of scope (a Home Assistant automation, J008 Q12) |
| Photo screensaver | No | No | No | No | No | Yes | Beacon, Wall Clock Card | No (decided against) |
| Back to today when idle | No (a Reset button) | No | No | No | ? | Part (screensaver resets) | Family Board, Family Hub Card | Yes (1 min, 5 min reload) |
| Last-known events when offline | Yes (24 h cache) | No | No | No | Yes | No | | Yes (the server's calendar copy drawn first, [#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)) |
| Says data is stale or failed | Yes (names the calendar) | No | No | No | Yes (after 30 min) | No | Today Card | Not decided (synthesis wave 2 only) |
| Clash or double-booking mark | No | No | No | No | No | No | Family Board ("day check") | Yes (clash rules) |
| New since you looked | No | No | No | No | No | No | | Yes (new dots) |
| Drag to move | No | No | No | No | No | No | Family Board, Aurora (create) | No (decided: no drag at first) |
| Voice adding | No | No | No | No | No | No (planned) | Beacon (Assist sentences) | Yes |
| Settings follow the person | No (per browser) | n/a | n/a | n/a | No (per browser) | No (per browser) | No (Family Hub Card: per device) | Yes (house preferences) |
| Week numbers | Yes | No | Yes | No | Yes | Yes | | No *(inferred: not used in a US household)* |
| Languages | 36 | Home Assistant's | Yes | Yes (`locale`) | Several | 7 | Aurora 10 | English *(inferred)* |

Sources for the CCP column: [features.md](features.md). For "Open the place in Maps", I found no maps link, `geo:` link or print stylesheet in CCP's `src/` at `75bf292` (searched for `maps.google`, `maps.apple`, `google.com/maps`, `geo:` and `@media print`). The location row is plain text ([features.md §2](features.md#2-what-an-event-shows)).

## 4. What a household would notice that CCP doesn't do and the decisions don't cover

### For the owner (they'd see it on the wall or a phone)

**F1. Tap an event's place on a phone to open it in Maps.**
- **Elsewhere:**
  - Week Planner Card (`locationLink`);
  - Daylight (`location_links`: "Open in Google Maps", "Copy address");
  - Home Calendar Card (the place "opens in Maps");
  - Calendar Week View (a Maps link);
  - Multiday Calendar Card embeds a map instead, which sends the place to Google or Nominatim when the popup opens, behind an opt-in.
- **CCP:** none (above).
- **House board:** the sheet shows the place and lets you change it ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623); CONTEXT "Event sheet"). Nothing decides what a tap on it does.
- **Who'd notice:** either adult, on a phone, on the way out. Apple's own Calendar does this, so its absence would read as a gap *(inferred)*.
- **Suggestion:** keep, as a plain link on the phones' sheet only. Nothing is sent until it's tapped, and there's no embedded map. On the wall it's dead weight, since nobody drives from the tablet *(inferred)*.
- **Not checked:** whether the Home Assistant iPhone app opens an Apple Maps link in Maps. The event sheet left Apple's `calshow:` links unverified the same way ([event sheet README](../../../prototypes/event-sheet/README.md#reviews)).

**F2. Rain on the coming days, at rest.**
- **Elsewhere:**
  - Home Calendar Card gives each day an icon, high and low, and the chance of rain;
  - Week Planner Card and Daylight give each day an icon;
  - CCP gives each day header a condition icon and the high by default, but no chance of rain ([features.md §6](features.md#6-weather));
  - Skylight shows forecast icons per day ([Skylight note](../skylight-calendar.md)).
- **House board:**
  - the resting face shows today's icon, high and low, plus the stated "Rain from 2 pm" line for today;
  - the other three day columns show only the high and the low (the column header in `prototypes/resting-face/index.html` draws `d.wx.hi` and `d.wx.lo` without the icon);
  - Month shows ten days of weather.
  - So "will it rain Saturday?" takes a touch.
- **Who'd notice:** anyone planning a day out, at the wall.
- **Suggestion:** keep, as a small condition icon in each day column's header, as CCP and Skylight do. Rain stays stated, never an instruction (owner, 2026-10-30). The icon is close-up detail, so it costs nothing from across the room *(inferred)*. The icon part is also a plain CCP-match gap for the issue's part 2; the chance of rain is what CCP lacks.

**F3. A column per person.**
- **Elsewhere:**
  - Home Calendar Card's Planner leads with it, and tapping an empty box adds to that person's day;
  - Atomic's Planner sets calendars side by side;
  - Family Board's day view puts people as columns on an hour axis;
  - the week card the house board replaces has person columns (CONTEXT, "Person column").
- **CCP:** none.
- **House board:** layout D (four day columns, a name on every row, Us in green) and a person filter in Month and Upcoming. None of the resting face's layouts A to D tried person lanes ([resting face README](../../../prototypes/resting-face/README.md#layouts)).
- **Who'd notice:** someone used to the week card's lanes.
- **Suggestion:** skip *(inferred)*. With two adults, names in words and one green for shared plans already answer "whose". Lanes would double the columns at 1200 px and halve each title's width. It's listed so the choice is made, not an accident.

### For the agent (technical, or nobody would choose)

**F4. Declined invitations.**
- Atomic hides declined events by default (`showDeclined: false`), for Google.
- CCP has no handling: nothing about attendees or declines in `src/`.
- The house board refuses to write to invitations and explains why in the sheet, but no decision says whether a declined one still shows.
- A household would notice a plan it declined sitting on the wall *(inferred)*.
- I couldn't check whether Home Assistant's CalDAV or Google integrations pass a decline on at all. A cheap test: decline one invitation on the throwaway calendars during the supervised checks of [#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39) and [#100](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100).

**F5. "Edit a Google event by replacing it" has a price; pass it to [#100](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100).**
- Daylight and Home Calendar Card both edit Google events by creating a new one and deleting the old, because the integration can't update.
- Their own docs list the costs:
  - "the event's UID changes";
  - guests, reminders, Meet links and colors aren't copied;
  - repeating Google events can't be edited this way.
- For the house the UID change matters more *(inferred)*: the new dot, Hide and the clash marks all key on `uid` ([marks research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038)). So a replaced event would light up as new and lose any Hide.
- That supports #100's own write path. Replacing is at most a fallback for one-off events Jenn organized, with no guests.

**F6. Refetch again a few seconds after writing to iCloud.**
- Home Calendar Card: "New events may take a few seconds to appear, especially with iCloud via CalDAV", and the card refreshes again by itself.
- The house echo lights the new item where it landed ([adding](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49#issuecomment-6548542552)). If the refetch right after the write misses it, the lit item could vanish and come back *(inferred)*.
- A second refetch about 5 seconds later costs one request. [code-data.md](code-data.md) covers CCP's refetch after a save; it does only the one.

**F7. When to say the data is stale.**
- Daylight warns "Calendar data may be stale" after 30 minutes without a successful refresh, while keeping the last good events.
- CCP names a failing calendar at once (after a 30 s timeout).
- Today Card names an unreachable calendar instead of drawing an empty day.
- The synthesis has "A calendar that stops syncing says so on its column" ([synthesis](../../board-next/synthesis.md), wave 2, item 1), but no closed decision on the map does.
- It's the agent's call, already listed in [features.md §18](features.md#18-first-pass-against-the-house-board). Daylight's 30 minutes is a data point beside CCP's 30 seconds.

### Also for the gap list (CCP does these, so they belong to part 2)

- **Making an event repeat.**
  - CCP, through Home Assistant's own dialog, whose "repeat rules ... stay Home Assistant's" ([actions](https://calendar-card-pro.alexpfau.com/features/actions)).
  - Daylight, Home Calendar Card and Week Planner Card Plus have repeat in their own forms.
  - The house board: dinners have Every week, but nothing decided makes an event repeat, neither the one-line add nor the sheet. Whether Clover turns "every Tuesday" into a repeat isn't recorded in the prototype READMEs.
- **"This and following" for a repeat.**
  - Home Assistant's own model has a "this and future" range, and CCP offers it for Local Calendar ("from one occurrence onward", `docs/features/actions.md:196`).
  - Daylight, Home Calendar Card, Family Board and the Plus fork all offer it.
  - The house decided "This one / All" ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39), [event sheet](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45#issuecomment-6545490784)). Ending a weekly class early from the board means deleting all of it, past weeks included *(inferred, if "All" deletes the whole series)*. Worth a sentence in part 2.

### Checked and already covered, so not flagged

- **Night mode and screensaver** (Home Calendar Card): the house's brightness schedule is a Home Assistant automation, out of the map's scope by decision (J008 Q12), and there's no photo screensaver by choice.
- **Double-booking warnings** (Family Board): the clash rules.
- **Drag to move** (Family Board, Aurora): decided against at first ([time research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/70#issuecomment-6537437929)).
- **Going back to today** (Family Board, Family Hub Card): decided (1 minute, 5-minute reload).
- **Undo before a tick lands** (Family Hub Card): Undo in the echo.
- **A legend that isn't a filter** (a DIY builder's family found filters "confusing"): names in words on every row.
- **Day badges and keyword icons** (Daylight, Home Calendar Card): the fixed word-to-icon table ([marks](../../../prototypes/marks/README.md)).
- **Bin day retiring after pickup** (TrashCard's `drop_todayevents_from`, CCP's `allday_expires_at`): the house's trash is a timed "Trash night" event in the prototypes, so finished events already leave *(inferred)*.
- **Per-event private** (Home Calendar Card's `#private`): Hide covers one event, and detail per calendar covers the rest. A surprise kept off the wall but still holding the time isn't covered, and is rare for two adults *(inferred)*.

## 5. What the field confirms about the house's choices *(inferred)*

- **Stale cached files are the commonest complaint after an update.** Daylight's rename left owners on old files until they reinstalled and cleared caches (2026-07); Aurora's first users hit "Custom element doesn't exist" (2026-05). The house serves its card from a folder versioned by its hash ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44)), which removes that class of trouble.
- **Pieced-together DIY boards break on small mistakes.** The DIY Skylight thread shows typos, missing helpers and slow filters across a stack of five or more custom cards. One card holding the whole board is the lean answer the market is moving to: Daylight, Home Calendar Card, Aurora's one install.
- **Home Calendar Card arrived at many of the house's own decisions independently:** a word-to-icon table, Undo on ticks, chosen countdowns, private as display only, "edit" honest about Google's limits. It keeps its choices per browser, and it lacks hide, new dots, clashes and iCloud editing.
- **Nothing here is worth lifting as code.** The house's constraint is seven plain ES modules with no library or build step (#44), and these cards are TypeScript or Lit builds or single large files that I didn't read. Ideas are free to take whatever the license. If code were ever wanted: MIT (most) and Apache-2.0 (TrashCard) both go into GPL-3.0 with their notices kept. Week Planner Card Plus states no license, so nothing from it.
- **One idea to keep in mind:** Home Calendar Card's `#tag` in an event's notes is a way any phone calendar app can mark an event with no new screen. If the house ever wants a phone to set a countdown or mark an event routine, a tag in the details is the no-code path. The cost is visible clutter in Apple's and Google's own event views.

## Sources

Fetched 2026-11-01 unless marked.

- Built-in card: https://www.home-assistant.io/dashboards/calendar/ ; https://www.home-assistant.io/integrations/calendar/ ; https://github.com/home-assistant/frontend/pull/53055 ; https://github.com/orgs/home-assistant/discussions/3153 ; https://community.home-assistant.io/t/add-event-button-on-dashboard/1026209 ; https://www.home-assistant.io/blog/2026/06/03/release-20266 ; https://www.home-assistant.io/integrations/caldav/ ; https://www.home-assistant.io/integrations/google/
- Calendar Card Pro: https://github.com/alexpfau/calendar-card-pro ; https://calendar-card-pro.alexpfau.com/features/actions ; source at `/tmp/ccp-src/repo`, commit `75bf292`
- Atomic Calendar Revive: https://github.com/totaldebug/atomic-calendar-revive ; https://github.com/totaldebug/atomic-calendar-revive/releases ; https://docs.totaldebug.uk/atomic-calendar-revive/ (main, event, entity and planner pages)
- Week Planner Card: https://github.com/FamousWolf/week-planner-card ; https://github.com/FamousWolf/week-planner-card/releases ; https://community.home-assistant.io/t/family-calendar/703986 ; https://community.home-assistant.io/t/diy-family-calendar-skylight/844830 (and `?page=21`)
- Week Planner Card Plus: https://github.com/randrcomputers/week-planner-card-plus ; https://community.home-assistant.io/t/week-planner-card-plus-and-ics-calendar-tools/978450
- Daylight Calendar Card: https://github.com/superdingo101/daylight-calendar-card ; https://github.com/superdingo101/daylight-calendar-card/releases ; https://docs.daylightcalendar.com/llms.txt ; https://docs.daylightcalendar.com/views/week.md ; https://docs.daylightcalendar.com/views/schedule.md ; https://docs.daylightcalendar.com/configuration/event-management.md ; https://docs.daylightcalendar.com/advanced/combine-calendars.md ; https://docs.daylightcalendar.com/advanced/day-badges.md ; https://docs.daylightcalendar.com/troubleshooting.md ; https://community.home-assistant.io/t/skylight-calendar-card-a-family-friendly-schedule-card/981221 (and `?page=6`)
- Home Calendar Card: https://github.com/mimikm/Home-Calendar-Card ; https://github.com/mimikm/Home-Calendar-Card/releases ; https://github.com/mimikm/Home-Calendar-Card/wiki
- Calendar & Tasks Card: https://github.com/korova-sq/calendar-tasks-card ; https://community.home-assistant.io/t/calendar-tasks-card-unified-agenda-for-events-and-todos/1010940
- Aurora Calendar: https://github.com/davidlop28/ha-aurora-calendar ; https://community.home-assistant.io/t/aurora-calendar-family-calendar-integration-and-card/1009402
- Family Hub Card: https://github.com/tempus2016/family-hub-card . Family Board Card: https://github.com/renespeaker/ha-family-board-card
- Beacon: https://github.com/asachs01/beacon ; https://community.home-assistant.io/t/beacon-free-family-command-center-add-on/1000220
- Today Card: https://github.com/JonasDoebertin/ha-today-card . TrashCard: https://github.com/idaho/hassio-trash-card . Annuals: https://community.home-assistant.io/t/annuals-more-than-just-a-birthday-holiday-tracker/1017120
- Smaller cards: https://github.com/xBourner/calendar-card-plus ; https://github.com/Uko/multiday-calendar-card ; https://github.com/TheLuXoR/calendar-week-card ; https://github.com/mswiszcz/calendar-week-view ; https://github.com/rkotulan/ha-wall-clock-card ; https://github.com/jansendejong/JJs-Birthday-Card ; https://github.com/oddhus/event-reel-card ; https://community.home-assistant.io/t/lovelace-timeline-card/958319
- Finding the cards: https://raw.githubusercontent.com/hacs/default/master/plugin ; https://community.home-assistant.io/tag/calendar (and `.json`, `?page=1`) ; https://community.home-assistant.io/t/wall-mounted-family-calendar-ha-dashboard/925630
- House: [map #37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37), [#100](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100), [CONTEXT.md](../../../CONTEXT.md), the [prototype READMEs](../../../prototypes/README.md), [switch-over.md](../../board-next/switch-over.md), [synthesis.md](../../board-next/synthesis.md), [parked.md](../../board-next/parked.md)

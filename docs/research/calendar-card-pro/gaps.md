Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro against the house board: what's covered, what's missing, and who decides

This note takes every feature in the sibling reports ([features.md](features.md), [code-ui.md](code-ui.md), [code-data.md](code-data.md), [community.md](community.md), [landscape.md](landscape.md), [theming.md](theming.md) and [borrow.md](borrow.md)) and sets it against the house board's decided spec. It classifies each one in one table, then writes each gap as an owner question (if the owner would notice it on the wall or a phone) or as the agent's call (if not). Calendar Card Pro (CCP below) is cited as `path:line` at commit `75bf292` (v5.0.0, MIT); its docs by URL. Anything marked *(inferred)* is my own judgment.

## Answer

- **96 items classified:** 24 covered, 22 better on the house board, 14 not wanted (decided out or parked), 36 gaps. The gaps come down to **8 owner questions** and **22 agent's calls**.
- **The decided board already matches or beats CCP on most of what a household sees:** Month, Lists, a shared plan shown once in Us's green, Hide with Undo, new dots, clashes, iCloud editing, voice adding, settings per person, "+N more" instead of silent caps, and fresher data (the server's copy first, a live ask every 60 s).
- **Owner questions, most important first:**
  1. What the board shows when a calendar can't be reached. CCP names it ("Couldn't load: Ben") and keeps its last events. The house spec records errors only in Home Assistant, so after a restart a failed calendar could look like a free day. This is the one to put to the owner now: it belongs to slice 1 and it was CCP's most repeated complaint.
  2. What Change and Delete do on a plan shown once from two calendars.
  3. Weather on the coming days: an icon on the face's three coming columns, and what Month shows.
  4. The forecast beside a timed event.
  5. A day drawn on an hour axis with a now line, which Skylight's Day view and CCP's new grid have.
  6. Tapping a place on a phone to open Maps.
  7. Making an event repeat from the board.
  8. How colorful the pale person blocks are.

  Per the map's rule, a research session puts at most one decision to the owner. The other seven fit one grilling session.
- **Checked here for the first time** (read-only, on the house's Home Assistant): the house's forecast (`weather.forecast_home`) gives **6 days** of daily forecasts and **48 hours** of hourly ones, with no chance of rain. So Month's decided "weather on the next 10 days" can't be met as is, and a daily chance of rain would need another source. Daily entries are stamped 17:00 UTC (noon or 1 pm in New York), so the UTC-midnight trap code-data.md feared doesn't apply to this entity.
- **Corrections to the researchers' candidates.** These are already decided: reduced motion (the event sheet fades), dropping person columns ([#98], the Planner layout), swipe on the phones (the phones README), and a multi-day trip as one bar in Month (a build call in the wall Month README). Birthday ages and declined invitations are agent's calls, not owner questions (section 4).

## What was read, and what couldn't be checked

**Read:** the seven reports in this folder; the map [#37] ("Decisions so far", "Not yet specified", "Out of scope"); the resolution comments of [#98], [#97] and [#44]; every prototype README in [`prototypes/`](../../../prototypes/); [CONTEXT.md](../../../CONTEXT.md); [switch-over.md](../../board-next/switch-over.md); the waves in [synthesis.md](../../board-next/synthesis.md); [skylight-calendar.md](../skylight-calendar.md). I spot-checked about 25 of the CCP line citations I reuse here against the clone at `75bf292`, with `sed` only. I ran nothing of CCP's.

**Live checks:** two read-only `weather.get_forecasts` calls on the house's Home Assistant (daily and hourly), 2026-11-01. Nothing was changed. The forecast numbers aren't copied here.

**Not checked:**
- whether Home Assistant's create-event passes a repeat rule to CalDAV;
- whether the Home Assistant iPhone app opens a `maps.apple.com` link in Maps;
- how Home Assistant's Google integration answers when its sign-in lapses (an error, or its last synced events). This decides whether a lapsed sign-in shows as a failure or as stale events;
- whether Google's integration drops declined invitations by itself;
- which other Home Assistant weather source has a chance of rain and 10 days. The Met.no docs page says its forecasts include a chance of rain, but the house's entity sends none;
- whether Skylight lets you make an event repeat on the device (the Skylight note covers repeating meals only);
- Safari and the wall's WebView for any CSS named here.

## How to read the table

- **Class:** **Covered** means a decision gives the same thing. **Better** means a decision goes further than CCP. **Not wanted** means decided out, or parked by the owner, with the place named. **Gap** means nothing decided covers it; "owner" or "agent" says who decides, with the question (Q) or call (A) number.
- **Who has it:** CCP's option or code, and other cards from [landscape.md](landscape.md) where they matter.
- Decision links are in the reference list at the end ([#38] and so on).

## 1. The classification

| # | Item (who has it) | Class | House board | Gap |
|---:|---|---|---|---|
| | **Views and getting around** | | | |
| 1 | A list of the coming days (CCP list view; the built-in card's 7-day list; Daylight and Home Calendar Card Agenda) | Better | The phones open on a seven-day strip over one scrolling list, day names pinned ([#50]). CCP has no sticky headers (code-ui.md §4) | |
| 2 | Day columns (CCP column view, `src/rendering/column.ts:358-393`; Week Planner; Daylight Week Compact) | Covered | Layout D: the Next band over four day columns ([#38]) | |
| 3 | An hour axis with a now line and an all-day band (CCP grid view, [grid view](https://calendar-card-pro.alexpfau.com/features/grid-view); Skylight Day and Week; Daylight Schedule; Week Planner Card Plus; Family Board) | Gap: owner | No hour axis anywhere. Now rows and the Next band answer "what's on now" | Q5 |
| 4 | A month grid (built-in card, Atomic, Daylight, Home Calendar Card, Aurora; CCP has none, `src/config/view.ts:299`, and its #239 is open) | Better | Wall Month and the phones' Month tab ([#79], [#50]) | |
| 5 | A column per person (Home Calendar Card and Atomic Planner, Family Board, the week card; CCP's #203 open) | Not wanted | Dropped: "the Planner layout (the filter covers by-person)" ([#98], calls) | |
| 6 | How many days, a rolling start, start-date expressions (`days_to_show`, `start_date`) | Covered | Four days from today with the evening hand-off ([resting face]); the phones' week starts today ([phones]); Month from this week's Sunday ([wall Month]) | |
| 7 | Paging arrows, Today, a date picker (CCP toolbar `navigation`) | Covered | Month's ‹ › by five weeks and Today; the strip's arrows by a week ([wall Month], [phones]). Month is the date picker | |
| 8 | Swipe to page (CCP plans it for v5.1, its #699; Skylight swipes dates) | Gap: agent | Phones: the strip and month move by swipe, every move also a button ([phones], "Getting around"). The wall's Month: not said | A20 |
| 9 | Switching views (CCP's List / Columns / Grid) | Covered | The wall's rail (Upcoming, Month, Lists) and the phones' tabs ([#79], [#50]) | |
| 10 | Silent caps (compact mode) and grid's `+N`, listed only on hover (`src/rendering/grid.ts:1003`) | Better | "+N more" says how many and never cuts a row ([resting face]); the phones scroll instead ([phones]) | |
| 11 | Reset for a shared screen (CCP toolbar `reset`) | Better | Back to the resting face after a minute untouched ([#76], [wall Month]); the filter clears when you leave the view ([#98], decision 10); idle reload after 5 minutes away from the board ([#99]) | |
| 12 | Week numbers and separators | Gap: agent | Not mentioned | A21 |
| 13 | The visual editor, the card picker, per-layout option blocks, height and spacing options, title templates (about 200 options) | Not wanted | Little to adjust, on the board's own Settings ([#87]); a few config keys, written by the agent ([#44]) | |
| 14 | 36 languages, right to left, hyphenation | Not wanted | English for two adults; no translation layer among #44's seven modules *(inferred)*, code-ui.md §7 | |
| | **What an event shows** | | | |
| 15 | Title size, color, line caps | Covered | Sizes retuned for across the room ([marks]); titles near-black at 7:1 or more ([#91]); Month titles end on a whole word ([wall Month]); the lead line's fit rules ([resting face]) | |
| 16 | Long titles scrolling sideways (`scroll_long_titles`) | Not wanted | Nothing moves at rest ([resting face]; [#72]) | |
| 17 | A person's picture, an emoji or an icon as a calendar's label (`src/utils/person-pictures.ts:78`) | Not wanted | Names in words. Reviewers rejected pictures and emoji as "a code to learn" ([marks], round 1) | |
| 18 | Icons by keyword; a Teams logo | Covered | A fixed word-to-icon table, gray, on rows ([#71], [#57]) | |
| 19 | A same-minute event reads "9:41", not "9:41 - 9:41" (`src/utils/format.ts:942-982`) | Gap: agent | Not specified | A8 |
| 20 | The place on an event | Covered | Place shown and changeable in the sheet; rows stay as decided ([#98], decision 5) | |
| 21 | Tap a place to open it in Maps (Week Planner `locationLink`, Daylight `location_links`, Home Calendar Card; CCP's #614 open) | Gap: owner | The sheet's Place is a text box; nothing decides what a tap does | Q6 |
| 22 | Details, with HTML tags stripped (`src/utils/format.ts:455-472`) | Gap: agent | Details shown and changeable in the sheet ([#98], decision 5). How Google's HTML is shown isn't said | A11 |
| 23 | An accent bar and a tint per calendar | Covered | A pale block in the person's color with a solid edge ([#57]), opaque, so overlaps never darken (theming.md §2.2, item 4) | |
| 24 | How colorful the pale tints look (CCP puts chroma back, `src/rendering/styles.ts:2892-2938`) | Gap: owner | The decided sRGB mix looks grayer; the starting three sit 0.79 to 1.18 apart at 9 ft against CCP's demo 0.98 to 1.49 (theming.md §2.1) | Q8 |
| 25 | Text in the calendar's color (CCP's `accent` ink) | Not wanted | Person colors on bars and blocks, never as text ([resting face], "Look"); titles near-black ([#91]) | |
| 26 | Finished events hidden or faded (`show_past_events`, `past_event_opacity`) | Better | They leave the face ([resting face]); the phones fold them into "Earlier today (N)" ([phones]); no fading below 7:1 (theming.md §2.3) | |
| 27 | Birthday ages from `YEAR=1976` in the notes (`src/utils/event-age.ts`, 182 lines) | Gap: agent | No birthdays calendar yet ([#37], Out of scope) | A21 |
| 28 | Order within a day (`src/utils/events.ts:1449-1482`, ties left to arrival) | Better | Start, end, title, then `uid`, fully determined ([#97]) | |
| 29 | Malformed events and bad ends (`src/utils/events.ts:731-806`) | Gap: agent | Not specified | A8 |
| 30 | A progress bar on an event under way | Gap: agent | Now rows say "until 4:30" ([resting face], [phones]) | A21 |
| 31 | Countdowns (CCP's on every event, `show_countdown`) | Better | Chosen per event in its sheet; the nearest one as one quiet line ([#98], decision 2). Counting by calendar date is A7 | |
| 32 | A Now mark ("Now ·" in green) | Covered | Now rows with their end times ([resting face], [phones]). CCP's emerald stays out: it sits beside Us's green (theming.md §2.3) | |
| 33 | A today tile | Covered | Month draws today's number dark (`prototypes/wall-month-lists/index.html:209`); the face's first column is today ([#38]) | |
| 34 | Empty days ("No events"), today kept when empty | Covered | The face draws its four days with every box reserved ([#97]); the phones say "Nothing else today" (phones prototype). An empty day must never hide a failure: Q1 | |
| 35 | Hide the card when nothing is coming | Not wanted | The board is the whole page, on its own dashboard ([#44]) | |
| | **Dates and times** | | | |
| 36 | 12- or 24-hour time; date order by language | Covered | "3:30 pm" throughout the prototypes; one language | |
| 37 | Week start and weekend days | Covered | Month from Sunday, weekends shaded ([wall Month]) | |
| 38 | Wording for multi-day times ("ends tomorrow at 0:30", "until Friday, Oct 23 at 17:00", `src/utils/format.ts:984-1062`) | Gap: agent | Not specified | A9 |
| 39 | Day math across clock changes; one time zone (`src/utils/format.ts:685-690`; `vitest.config.mjs:30-72`) | Gap: agent | Not specified. The house's clocks fell back today | A7 |
| | **All-day and multi-day events** | | | |
| 40 | All-day events as a pill | Covered | A tinted bar at the top of the day ([resting face]) | |
| 41 | Timed events crossing midnight shown on each day; an exact-midnight end adds no day; an event already running lands on the first day shown (`src/utils/grid.ts:1401-1460`; `src/utils/events.ts:916-921`) | Gap: agent | Not specified | A8 |
| 42 | A multi-day all-day event as one bar (`src/utils/grid.ts:1536-1573`) | Gap: agent | Month: "should be one bar across them", left as a build call ([wall Month], "Not drawn"). The face's columns: not said | A9 |
| 43 | An all-day item that retires at a set time (bin day, `allday_expires_at`) | Covered | Finished events leave ([resting face]); trash is a timed "Trash night" in the prototypes *(inferred, landscape.md §4)* | |
| | **Colors, people and shared plans** | | | |
| 44 | A color per calendar | Better | A color per person from 12 checked ones, redrawn for each background, bars 3:1 or more ([#91], [#92]); CCP's demo bars are 1.7 to 2.7:1 (theming.md §2.1) | |
| 45 | Colors read from Home Assistant's calendar entities (`accent_color: home-assistant`) | Not wanted | Every calendar belongs to a person and shows as that person ([#61]; theming.md §2.3) | |
| 46 | A shared event shown once with every calendar's label, in a color of its own (`filter_duplicates`, `duplicate_accent_color`) | Better | Once, in Us's green, with both names ([#61], [#57]); matched by `uid` and start first, never by place ([#66]), where CCP splits copies whose places differ (its #705). The finer points are A10 | |
| 47 | Several calendars as one person (Daylight's virtual calendars) | Covered | Every calendar belongs to Will, Jenn or Us ([#61]) | |
| 48 | Following Home Assistant's light or dark | Covered | The phones follow Home Assistant's light or dark ([phones], [#87]); the wall has its own light face. How to detect it is A15 | |
| 49 | Following any Home Assistant theme; see-through cards over a wallpaper | Not wanted | Parked: "More color schemes, if or when wanted" ([#37], Not yet specified, owner 2026-11-01); theming.md §2.3 | |
| 50 | Per-event custom colors (Daylight) | Not wanted | Events are colored by person, never by calendar ([CONTEXT.md](../../../CONTEXT.md), "Person") | |
| | **Weather** | | | |
| 51 | The forecast in each day's header, icon and high (CCP `weather → position: date`, `src/config/config.ts:147-157`; Skylight Week and Month; Week Planner; Daylight; Home Calendar Card) | Gap: owner | Phones: icon, high and low on every day (phones prototype). Month: icon and high (wall Month prototype). The face: today's icon, but its three coming columns show high and low only (`prototypes/resting-face/index.html:427`) | Q3 |
| 52 | A chance of rain per day (Home Calendar Card) | Gap: owner | Today's stated rain line only ([#38]); the house's forecast has no chance of rain (checked) | Q3 |
| 53 | Weather on Month's next 10 days (a build call, after Skylight's ten) | Gap: owner | The house's forecast reaches 6 days (checked) | Q3 |
| 54 | The forecast beside each timed event (CCP `position: event`; Skylight's product page; Calendar Week View) | Gap: owner | Not on the board | Q4 |
| 55 | Weather by subscription, keyed by local date and hour; night icons; UV (`src/utils/weather.ts:72-120`, `:350-388`) | Gap: agent | "Weather from Home Assistant directly" ([#43]) leaves the how open | A22, A21 |
| | **Filtering and hiding** | | | |
| 56 | Show or hide a calendar on screen (CCP chips or menu; Week Planner's legend) | Covered | A person filter in Month and the phones' Upcoming, cleared when you leave the view ([#98], decision 10) | |
| 57 | A filtered view always shows that it's filtered (`src/rendering/legend.ts:492-530`) | Gap: agent | The filter's look isn't specified | A13 |
| 58 | Titles rewritten to "Busy" or "Work"; rows hidden per calendar (`replace_with`) | Better | Each adult sets titles, a labeled block or nothing for their own; Work a labeled block ([#61]); Guest mode ([#68]) | |
| 59 | Allow and block lists by pattern; weekday filters; timed or all-day only | Covered | By other means: Hide for one event, Detail per calendar ([#61]) | |
| 60 | Hiding one event | Better | Hide, with Undo and "Hidden by you" ([#61]); no card surveyed has it (landscape.md §3) | |
| 61 | A rewritten title shown in full in the details dialog (features.md §7) | Better | In Guest mode a sheet shows only "Will, 3:30 to 4:30" ([event sheet]) | |
| 62 | Declined invitations (CCP can't hide them, its #27; Atomic hides Google's) | Gap: agent | No decision says whether they show | A18 |
| | **Acting on events** | | | |
| 63 | Tap an event for its details (Home Assistant's own dialog) | Better | The house's own event sheet ([#45], [#98]) | |
| 64 | Change and delete (by CCP's [table](https://calendar-card-pro.alexpfau.com/features/actions#what-each-integration-allows), CalDAV can only add and Google can't change) | Better | The iCloud write path ([#39]); the Google write path ([#100], slice 6) | |
| 65 | Change or delete a plan shown once from two calendars (CCP offers neither, `src/interaction/event-details.ts:97-104`) | Gap: owner | The sheet doesn't say | Q2 |
| 66 | No change from a failing calendar's day-old events (`src/interaction/event-details.ts:102-104`) | Gap: agent | iCloud refuses a save over a newer version ([#39]); Google and Home Assistant's local calendar have no such check | A3 |
| 67 | Adding an event (CCP's toolbar + opens Home Assistant's dialog) | Better | One line to Clover, tap a day, speak at the wall ([#49], [#79], [#85]) | |
| 68 | Making an event repeat (CCP through Home Assistant's dialog; Daylight, Home Calendar Card, Week Planner Card Plus in their forms) | Gap: owner | Dinners have Every week ([#98], decision 7); events have nothing | Q7 |
| 69 | "This and following" for a repeat | Not wanted | "This one / All" ([#39], [#45]) | |
| 70 | Changing a Google event by replacing it (Daylight, Home Calendar Card) | Gap: agent | The Google write path is open at [#100] | A19 |
| 71 | Drag to move (Family Board, Aurora) | Not wanted | "No drag at first" ([#70]), kept off at [#98] | |
| 72 | Hold actions; a tap action for the whole card | Not wanted | The sheet has no holds ([event sheet]); a tap opens what was tapped | |
| 73 | A refresh button and refresh on tap | Better | A live ask every 60 s, at once on return and reconnect ([#97], [#67]); pull to refresh left alone ([phones]) | |
| 74 | Every card refetching after a save (`src/interaction/calendar-changes.ts`) | Gap: agent | Not specified | A12 |
| 75 | Event names for keyboards and screen readers that include the day; the range announced after paging (`src/rendering/render.ts:681-685`; `src/rendering/toolbar.ts:660`) | Gap: agent | Not specified | A14 |
| 76 | Reduced motion (`src/rendering/styles.ts:946`) | Covered | Fades under reduced motion ([event sheet], "Look and motion"; [#72]) | |
| 77 | Touch targets bigger than the drawing; hover only on real pointers; tabular figures (`src/rendering/styles.ts:817-868`, `:1105-1121`, `:479`) | Gap: agent | Sizes are decided: 40, 56 and 80 px ([#37], Notes). The CSS techniques aren't | A15 |
| | **Loading, freshness and failures** | | | |
| 78 | Cached events on screen at once (CCP: `localStorage`, up to 24 h) | Better | The server's copy first, shared by every copy ([#97]) | |
| 79 | Refresh every 30 minutes, and on return only after 5 minutes away | Better | Every 60 s while shown, at once on return and reconnect ([#97], [#67]) | |
| 80 | A refresh that waits for the slowest calendar (`Promise.all`) | Better | Copy first, live answers compared per day, nothing jumps ([#97]) | |
| 81 | A calendar that fails is named on the card and keeps its last events (`src/rendering/render.ts:231-240`; Daylight warns after 30 minutes; Today Card names it) | Gap: owner | Errors are recorded in Home Assistant for sessions only ([#98], calls). The synthesis's "says so on its column" (wave 2, item 1) never became a decision | Q1, A1 |
| 82 | A hung request stopping every refresh (`src/config/constants.ts:77-84`) | Gap: agent | [#97] holds Next and needs-you until every calendar is in, with no timeout | A1 |
| 83 | An old answer over a newer one; a poll from before a save snapping an event back (`src/utils/events.ts:152-203`) | Gap: agent | Not specified | A2 |
| 84 | Home Assistant answering empty while it starts (CCP's #297; `src/utils/events.ts:522-527`) | Gap: agent | Not specified | A4 |
| 85 | Now and finished events flipping on time; the day rolling over on a screen that never sleeps (CCP's day key; Daylight "advances at browser-local midnight") | Gap: agent | "Recompute today" on return; the minute tick's day check isn't said | A6 |
| 86 | Redrawing on every Home Assistant state change (CCP renders again on every `hass`) | Gap: agent | "Nothing redrawn at rest but the minute and real changes" ([#72]) needs a gate | A5 |
| 87 | Leaks on a page that runs for weeks (CCP's #291 and #326) | Gap: agent | The 5-minute idle reload ([#99]) runs only away from the board | A16 |
| 88 | Taps failing on an Android tablet (CCP's #616, open) | Gap: agent | Not specified | A17 |
| 89 | Home Assistant updates breaking the card (CCP's editor, three times) | Covered | Its own controls in plain modules ([#44]) | |
| 90 | Stale card files after an update (Daylight's rename) | Covered | Served from a folder versioned by its hash ([#44]) | |
| | **Beyond CCP** | | | |
| 91 | To-dos beside events (Home Calendar Card, Calendar & Tasks; CCP's #305 open) | Better | Lists, notes and house jobs ([#76]) | |
| 92 | A night clock, dimming, a photo screensaver (Home Calendar Card, Beacon) | Not wanted | Brightness is a Home Assistant automation ([#37], Out of scope; J008 Q12); no photo screensaver ([synthesis](../../board-next/synthesis.md), Not building) | |
| 93 | Double-booking warnings (Family Board) | Better | Clash rules ([#61], [#66]) | |
| 94 | Back to today when idle (Family Board, Family Hub Card) | Covered | [wall Month]; [#99] | |
| 95 | Undo before a tick lands (Family Hub Card) | Covered | Undo in the echo ([#49]) | |
| 96 | New since you looked; voice adding; settings per person | Better | New dots ([#61]); speak at the wall ([#49], [#85]); house preferences per person ([#87], [#43]) | |

## 2. Owner questions

Each would be noticed on the wall or a phone. They're written for the owner in the house format; none has been asked. The standing rules weighed in each: never worse than a Skylight or another Home Assistant calendar; structurally clear from across the room, readable up close; controls are close-up detail; lean, low-maintenance code.

### Q1. What the board shows when a calendar can't be reached

**What's being decided:** when one person's calendar stops answering, what the wall and the phones show. Causes include a lapsed Google sign-in, iCloud being down, or Home Assistant restarting. Today the decisions record the error in Home Assistant for sessions only ([#98], calls). So the board would keep showing that person's last known events with no sign. And after a Home Assistant restart has emptied the copy, it could show an empty day that reads as free.

**Facts:**
- This was CCP's most repeated complaint: "No upcoming events" on wall tablets while a desktop was right (community.md §2 and §5).
- CCP v5 keeps the last events and names the calendar at the card's foot ("Couldn't load: Ben", `src/rendering/render.ts:231-240`; [performance](https://calendar-card-pro.alexpfau.com/features/performance#when-a-calendar-fails-to-load)).
- Daylight warns "Calendar data may be stale" after 30 minutes. Today Card names the calendar instead of drawing an empty day.
- The board already names AnyList when it can't reach it ([wall Month], Lists). The synthesis planned "says so on its column ('updated Tue')" (wave 2, item 1).

**Options:**
- **A.** Keep that calendar's last events. Once it hasn't answered for 10 minutes, add one quiet line in close-up text: "Jenn's calendar hasn't updated since 9:40 am". It goes on the wall under the date and weather, and on the phones at the top of Upcoming. It goes away as soon as the calendar answers. If nothing is kept for that calendar (after a restart), its days say "Jenn's calendar isn't loading" rather than looking free. **(0.55)**
- **B.** Keep the last events and say nothing on the board; a session or the house digest tells the owner. **(0.20)**
- **C.** A, plus that person's rows drawn paler until the calendar answers. **(0.10)**
- **D.** CCP's way: name it at once, after one failed ask. **(0.15)**

**Recommendation: A.**
- **It delivers:**
  - a free-looking day is never a silent failure;
  - the wall stays calm: one small line, only after 10 minutes, so a restart or a blip never shows it;
  - a failed calendar is treated the way the board already treats AnyList.
- **It gives up:**
  - from across the room the line can't be read, which the owner's standard accepts, since the events are still there;
  - about 15 lines of code, on top of A1's data side.
- **Why not the others:** B leaves a lapsed Google sign-in unseen until someone thinks to ask. D would show Home Assistant's own restarts on the wall. C adds a second visual state per person.

The 10 minutes is the agent's pick: long enough to ride out a Home Assistant restart *(inferred: a few minutes)*, well short of Daylight's 30.

### Q2. Change and Delete on a plan shown once from two calendars

**What's being decided:** when the board shows one plan found on two calendars (in Us's green with both names, [#61]), what the sheet's day and time arrows, Delete and Whose act on.

**Facts:**
- CCP offers neither change nor delete on such a row: "deleting one brings the row straight back from the other calendar, which reads as a failed delete" (`src/interaction/event-details.ts:97-101`).
- The decided sheet ([#45]) doesn't say.
- One copy may be an invitation, which the iCloud write path refuses ([#39]). Jenn's Google copy can be deleted through Home Assistant, but not changed until [#100] (borrow.md §13).

**Options:**
- **A.** Act on every copy the board can write, and have the echo name any it couldn't: "Deleted from Us. The invitation is still on Will's iPhone: answer it in Calendar there." Undo puts back every copy. **(0.45)**
- **B.** Act on one copy (Us's if there is one, else the tapper's own); a line in the sheet says the other copy is on the other person's calendar. **(0.20)**
- **C.** CCP's way: a merged plan offers no change or delete, only Hide, with the usual line saying where to change it. **(0.25)**
- **D.** Ask "Both / Only mine" in place, the way "This one / All" is asked. **(0.10)**

**Recommendation: A.**
- **It delivers:**
  - what you see once, you change once;
  - a delete never comes back from the other calendar;
  - it matches the owner's own choice that a plan on two calendars shows once.
- **It gives up:**
  - two writes per change, so a half-done case the echo has to explain;
  - Undo has to restore both copies;
  - about 20 more lines.
- **Why not the others:** C is the leanest and safest, but a shared dinner you can't move from the board is the kind of thing the week card's walkthrough found painful. D stacks a second question on repeats, which already ask "This one / All".

### Q3. Weather on the coming days

**What's being decided:** what weather the face's three coming day columns and Month show.

**Facts:**
- The face shows today's icon, high and low, plus the stated rain line ([#38]). Its three coming columns show high and low with no icon (`prototypes/resting-face/index.html:427`).
- The phones show an icon, high and low on every day heading (phones prototype), and the wall's Month shows an icon and high per day. Month's 10 days were a build call, after Skylight's ten ([wall Month]).
- CCP shows an icon and the high in every day header by default (`src/config/config.ts:147-157`). Skylight shows forecast icons on each day in Week and Month for ten days ([Skylight note](../skylight-calendar.md)). Home Calendar Card adds a chance of rain.
- Checked today: the house's forecast gives 6 days, condition, high, low and a rain amount, and no chance of rain.

**Options:**
- **A.** Add the condition icon to each coming day's header on the face, beside its high and low, as the phones, Month, CCP and Skylight do. Month shows weather on the days the forecast has (6). No chance of rain. **(0.50)**
- **B.** A, plus a second Home Assistant weather source with a chance of rain and a 10-day reach, chosen after a check: a "40%" under each rainy day, and Month's full 10 days. This is a Home Assistant change, explained first. **(0.20)**
- **C.** As decided: high and low only on the coming columns; Month shows its 6 days. **(0.20)**
- **D.** A, but the icon only on days with rain or snow. **(0.10)**

**Recommendation: A.**
- **It delivers:**
  - "will it rain Saturday?" answered at a glance at the wall;
  - weather drawn the same way on the wall's face, Month and the phones;
  - Skylight's Week view matched;
  - about 3 lines, since the icons already exist.
- **It gives up:**
  - three more small icons at rest (close-up detail);
  - days 7 to 10 in Month stay blank, so Month stays behind Skylight there. Daily forecasts past about a week are weak anyway *(inferred)*.
- **Why not B:** it would close that gap and add the percentage, but it's one more integration to keep working, and it could need an account.

### Q4. The forecast beside a timed event

**What's being decided:** whether the board shows the weather for the hour of an event, as CCP does with `weather → position: event` ([weather positions](https://calendar-card-pro.alexpfau.com/features/weather#weather-display-positions)) and as Skylight's product page claims ("at the time and location of your event", [Skylight note](../skylight-calendar.md)).

**Facts:** the house's hourly forecast covers 48 hours (checked), so this works for today and tomorrow. After that it falls back to the daily forecast, as CCP's does, and there's nothing past 6 days.

**Options:**
- **A.** No: the day's weather stays in the day headings and today's rain line. **(0.30)**
- **B.** In the event sheet only: one line, "Forecast at 3 pm: 61°, rain", for an event within the forecast's reach. **(0.45)**
- **C.** On the rows for today and tomorrow, an icon and temperature beside each timed event, as CCP does. **(0.10)**
- **D.** On the Next line only. **(0.15)**

**Recommendation: B.**
- **It delivers:** Skylight's claim, in the place you look at one event, with nothing added at rest; about 15 lines on A22's weather data.
- **It gives up:** you only see it after a tap.
- **Why not the others:** C crowds the columns the owner chose to keep calm. D puts a second icon on the one line that reads from across the room.

### Q5. A day drawn on an hour axis

**What's being decided:** whether any view draws a day on hours, with a line at the current time, so free time shows as space.

**Facts:**
- Skylight's Day view (a grid plus a list) and Week view (a grid) have an orange current-time bar, and one reviewer's favorite is Day view ([Skylight note](../skylight-calendar.md)).
- CCP's v5 headline is its grid view ([grid view](https://calendar-card-pro.alexpfau.com/features/grid-view)). A Reddit post asked for a card "that shows the gaps between events" (community.md).
- The decided board uses lists everywhere. Its Now rows and Next band answer "what's on now", and the times answer "when".
- CCP's grid is about 5,000 lines (code-ui.md §10). One day on hours, with overlaps side by side and no fitting passes, is about 150 to 200 plain lines *(inferred)*.

**Options:**
- **A.** No hour axis: lists, as decided. **(0.35)**
- **B.** A day you tap in Month (the wall's panel, and the day under the phones' Month) opens on an hour axis. It runs 6 am to 11 pm, the sheet's own hours ([event sheet]). Today gets a now line, all-day items sit in a band above, and overlaps sit side by side. The face and Upcoming stay as decided. **(0.40)**
- **C.** The phones' "One day at a time" mode draws its day on hours. **(0.15)**
- **D.** A week on hours, as a fourth item on the rail and the tabs. **(0.10)**

**Recommendation: B.**
- **It delivers:**
  - Skylight's Day view;
  - "are we free Saturday afternoon?" at a glance, in the one place you already go to look at a single day closely;
  - the decided face and Upcoming, and their calm, untouched.
- **It gives up:**
  - about 150 to 200 lines, 5 to 7% of the 3,000-line budget;
  - a second way of drawing a day, to keep working;
  - a taller day panel;
  - it comes with Month (slice 3) or later.
- **Why not A:** it is the lean answer and costs nothing, but leaves the one Skylight view the house has no answer to.

### Q6. Tapping a place on a phone to open Maps

**What's being decided:** whether an event's place can open in Maps.

**Facts:** Week Planner Card, Daylight and Home Calendar Card do this. CCP doesn't (its #614 is open), and nothing in `src/` builds a map link (landscape.md §3). Apple's own Calendar does it.

**Options:**
- **A.** On the phones, a small "Open in Maps" beside the sheet's Place box, opening Apple Maps. The wall keeps the Place box only. **(0.55)**
- **B.** As decided: the place is text, to read and to change, everywhere. **(0.25)**
- **C.** A, on the wall too. **(0.10)**
- **D.** A small map drawn in the sheet. It sends the place to a map service whenever a sheet opens. **(0.10)**

**Recommendation: A.**
- **It delivers:** what the iPhone's own Calendar does, on the way out the door. Nothing is sent anywhere until it's tapped. About 5 lines.
- **It gives up:** one more control in the phone sheet.
- **Why not C:** nobody drives from the tablet *(inferred)*.
- **Not checked:** whether the Home Assistant iPhone app hands a `maps.apple.com` link to Maps. It's a build check, like the sheet's unverified `calshow:` links ([event sheet]).

### Q7. Making an event repeat from the board

**What's being decided:** whether an event added or changed on the board can be made to repeat.

**Facts:**
- CCP makes repeats through Home Assistant's own dialog. Daylight, Home Calendar Card and Week Planner Card Plus have repeat in their forms (landscape.md §4).
- The house: dinners have Every week ([#98], decision 7). The event sheet has no repeat ([CONTEXT.md](../../../CONTEXT.md), "Event sheet"), and whether Clover turns "every Tuesday" into a repeat isn't recorded.
- Not checked: whether Home Assistant's create-event passes a repeat rule to CalDAV. The house's own iCloud write path could write one *(inferred)*.

**Options:**
- **A.** Repeats are made in the phones' own Calendar apps. The board shows them and changes them "This one / All", and the echo says so if a line asks for a repeat. **(0.30)**
- **B.** Clover understands "every Tuesday", every day, every 2 weeks, every month and every year in the one-line add. The echo says "every Tuesday", with Undo. Nothing new in the sheet. **(0.40)**
- **C.** B, plus an Every week switch in the event sheet like the dinner sheet's. **(0.20)**
- **D.** Skylight-style how often and until when, in the sheet. **(0.10)**

**Recommendation: B.**
- **It delivers:** "Yoga every Tuesday at 6", said at the wall, lands as a repeat. That matches the decided "one rough line, nothing asked" ([#49]), with no new control.
- **It gives up:**
  - a rule in Clover's instructions, with the voice tests run again, as slice 2's step 2b does;
  - a repeat rule through each write path;
  - turning an existing one-off into a repeat stays with the phones' Calendar apps.

### Q8. How colorful the pale person blocks are

**What's being decided:** whether the decided pale blocks keep their lightness but get their color back, as CCP's washes do (`src/rendering/styles.ts:2892-2938`; theming.md §2.2, idea 1).

**Facts:** theming.md measured, with the person-colors note's own method:
- the decided sRGB mix puts the starting three 0.79 to 1.18 apart on the 9 ft scale, with 4 pairs of the 12 under the 0.45 note line;
- chroma times 1.5 gives 1.15 to 1.78 apart and no pair under the line;
- titles and times keep their contrast. Picture: [theming-compare-blocks.png](shots/theming-compare-blocks.png), panels B and F.
- A first-time reviewer wanted "fuller fills that read at a distance like a Skylight's" ([person colors]).

**Options:**
- **A.** As decided: the 17% block mixed in sRGB. **(0.30)**
- **B.** The same lightness, with color put back (chroma times 1.5). **(0.45)**
- **C.** Chroma times 1.8, CCP's own factor (1.38 to 2.14 apart). **(0.10)**
- **D.** Decide it with "More color schemes", later. **(0.15)**

**Recommendation: B.**
- **It delivers:**
  - people told apart better from across the room, which is the owner's standard, Will and Us most of all;
  - the reviewer's Skylight-like fill without darker blocks;
  - no contrast moved.
- **It gives up:**
  - more color on the wall, where E was already the most;
  - the 0.45 note line needs recalibrating, and Month's 45% and 35% strips need their own check;
  - Safari is unmeasured;
  - a few lines in `theme.js`.

## 3. The agent's calls

Technical or basic; the owner wouldn't choose. Each is the agent's call with its reason, and the owner can veto. Sizes are plain lines *(inferred)*. borrow.md §§1 to 20 has the port details and the tests to port.

- **A1. A calendar that fails (the data side of Q1).**
  - Time each live ask out at 30 s, as CCP does (`src/config/constants.ts:77-84`, `withTimeout` at `src/utils/events.ts:2631-2638`). `hass.callApi` has no timeout of its own.
  - On failure, leave that calendar's copy events up and `put` nothing.
  - Back off after repeated failures: ask that calendar again after 1, 2, 4, then every 8 minutes, while the others keep their 60 s (CCP backs off the same way, `src/utils/events.ts:570-574`).
  - Treat a calendar entity that's `unavailable` as failed at once.
  - Release [#97]'s hold on Next and needs-you when the timeout passes, using the copy for the late calendar.
  - **Reason:** without a timeout, one hung iCloud request would hold Next and needs-you for good under #97's rule.
- **A2. The newest answer wins, and a write counter.** Each live ask carries a ticket. An answer older than the newest ask for that calendar, or one asked before the latest write, is neither drawn nor `put` (`src/utils/events.ts:152-203`, `:529`). **Reason:** without it, the 60 s poll can snap an event back just after the echo lit it.
- **A3. Saving only from fresh data.** The sheet saves to a Google or local calendar only if that calendar's last live ask succeeded. iCloud already refuses a save over a newer version ([#39]). Otherwise the sheet says "Can't save right now: Jenn's calendar isn't answering", with the words kept. **Reason:** CCP's rule (`src/interaction/event-details.ts:102-104`); Google and Home Assistant's local calendar have no If-Match.
- **A4. A second look before an empty answer replaces a full copy.** If a calendar answers empty for a range where the copy has events, ask once more before drawing or `put`ting it. **Reason:** Home Assistant can answer empty while starting (CCP's #297; `src/utils/events.ts:522-527`), and a `put` would blank that range on every copy.
- **A5. A `hass` gate.** Compare `hass.states[id]` by identity for exactly the entities the board reads, plus `hass.locale`, `hass.themes`, `hass.user` and `hass.connected`. Draw nothing when all are the same. About 10 lines. **Reason:** Home Assistant hands every card a new `hass` on every state change in the house. CCP gates only its measuring, at `src/calendar-card-pro.ts:2365-2387`.
- **A6. One minute tick with a day key.** Arm the tick from epoch milliseconds, at 1 s past each minute, never from local date fields. Local fields would freeze the clock for an hour on fall-back night (borrow.md §5). On each tick, and on return, compare a local day key, and redraw and re-ask when it changed. This replaces CCP's three timers, so the `setTimeout` cap is moot. **Reason:** Now, Next and the hand-off flip on time, and a midnight passed while hidden is noticed.
- **A7. One time zone, tested in real zones.**
  - Use the browser's zone, as CCP and Home Assistant's frontend default do.
  - Run the date checks under `America/New_York`, `Australia/Sydney` and `UTC` in `tests/run_all.sh`, with the two house nights (2026-11-01, 2027-03-14).
  - Countdowns count calendar dates (`src/utils/format.ts:195-232`, `:685-690`).
  - **Reason:** CI runs under UTC and the house is behind it, which is where CCP's day-early bug lived (its #28).
- **A8. Event-shape rules.**
  - Timed events are split at local midnights, every part timed, and an exact-midnight end adds no day.
  - An event already running lands on the first day shown (`src/utils/grid.ts:1401-1460`; `src/utils/events.ts:916-921`).
  - A zero-length event is kept as an instant, and a same-minute time reads once ("9:41").
  - A timed event with a bad end is kept at its start; an all-day event with a bad end is dropped; a malformed one costs one row, never the board (`src/utils/events.ts:731-806`).
  - **Reason:** each was a CCP bug with a test; none is something the owner would choose.
- **A9. Multi-day wording and bars.**
  - Use CCP's wording ("ends tomorrow at 12:30 am", "until Fri, Nov 6 at 5:00 pm", "All day, until Mon, Nov 9"; `src/utils/format.ts:984-1062`) in the house's 12-hour style.
  - Draw a multi-day all-day event as one bar in Month, as the wall Month README's build call already says ("should be one bar across them"), with `computeBannerPlacement`'s rule (`src/utils/grid.ts:1536-1573`).
  - On the face, the same rule across the columns it covers, marked where it runs past the fourth day.
  - **Reason:** this extends a settled rule (both reviewers read a two-part trip as two entries) to the other place it applies.
- **A10. Merging details.** Filter by Hide, Guest mode, work and past before merging, compare times as instants, and keep the list of contributing calendars on the merged row (`src/utils/events.ts:826-905`, `:1233-1262`). **Reason:** a hidden copy must never take the other person's with it, and Q2 needs the contributors.
- **A11. Details as text.** Drop tags, decode entities from a small table, and keep line breaks. CCP's `stripHtmlTags` joins lines (borrow.md §16). Write Details back only if someone changed them. **Reason:** Google sends HTML; opening a sheet must never flatten an event's own formatting.
- **A12. After any write.** Re-ask that calendar at once and again about 5 s later. The wall and phones are separate pages and catch up within 60 s. **Reason:** iCloud can take a few seconds to show a new event (Home Calendar Card's README, landscape.md F6). One re-ask could miss it, and the lit item would vanish and come back.
- **A13. A filter that shows it's on.** A hidden person's chip stays in place, grayed, while the filter is on (`src/rendering/legend.ts:492-530`). Filtering works on what's drawn, so turning it on or off asks nothing of Home Assistant. **Reason:** a filtered day must never read as free. [#98]'s clear-on-leave already limits how long it lasts.
- **A14. Names for screen readers and keyboards.** Each event's name includes its day (`src/rendering/render.ts:681-685`), and paging Month or the strip announces the new range in a polite live region (`src/rendering/toolbar.ts:660`). **Reason:** cheap, invisible, and two same-titled events on different days stay distinct.
- **A15. Small CSS, and dark mode from Home Assistant.**
  - `font-variant-numeric: tabular-nums` on the clock and times (`src/rendering/styles.ts:479`).
  - Hover only inside `@media (hover: hover)` (`:1105-1121`).
  - `minmax(0, 1fr)` with `min-width: 0` on the day columns (`src/rendering/column.ts:358-393`).
  - Invisible touch-target growth where a control is drawn small (`styles.ts:817-868`).
  - Dark phones key off `hass.themes.darkMode`, never `light-dark()` or `prefers-color-scheme`, which follow the phone's OS (theming.md §1.3).
  - **Reason:** each prevents a small visible fault: a jiggling clock, sticky hover on the tablet, a pushed-wide column, a dark theme on a light phone.
- **A16. No leaks on a page that runs for weeks.**
  - Unsubscribe the weather on disconnect, and never subscribe again per refresh.
  - Stop the tick while hidden or detached.
  - Drop answers that land after the card left.
  - Add one soak check per slice on the tablet: memory and Home Assistant's pending messages over a day, beside the frame-stats check ([#72]).
  - **Reason:** CCP's worst wall-tablet bugs (#291, "Reached 4096 pending messages"; #326) grew slowly. The idle reload doesn't run while the board is on screen ([#99]).
- **A17. Taps on the Android tablet.** One delegated `click` listener, `touch-action: manipulation`, no custom pointer recognizer, and a tap test on the wall tablet itself. **Reason:** CCP's #616 (taps that do nothing on an Android tablet) is open and sits in the wall tablet's class of device.
- **A18. Declined invitations.**
  - Decline one invitation on the throwaway calendars during the supervised checks of [#39] and [#100] and record what reaches the board.
  - If one shows, the decided per-event Hide is the remedy ([#61]), stated in the build spec.
  - **Reason:** Home Assistant's calendar events carry no response status (CCP's #27), so there's nothing for the owner to choose. Hide is already decided.
- **A19. Don't change Google events by replacing them.** Pass this to [#100]. Daylight's and Home Calendar Card's create-then-delete changes the event's UID and drops guests and reminders (landscape.md F5). On the board, a new UID would light a new dot, lose any Hide and reset clash marks, which all key on `uid` ([#66]).
- **A20. Swipe on Month.** On the wall and the phones, a sideways swipe on Month's grid pages it, and the ‹ › arrows stay. It's about 20 lines, checked on the tablet with A17. **Reason:** Skylight swipes dates and CCP plans it; the phones README already makes swipe a second way for the strip, and the first-time reviewer profile never relies on it.
- **A21. Not built, with a note for later.**
  - **Week numbers:** not used in a US household *(inferred)*.
  - **UV index:** nobody reads it on a family board.
  - **Progress bars:** "until 4:30" says it, and a bar would change at rest.
  - **Birthday ages from `YEAR=`:** nobody types the marker and there's no birthdays calendar ([#37], Out of scope). CCP's rule (`src/utils/event-age.ts`) is about 20 plain lines if a birthdays calendar arrives.
- **A22. Weather data.**
  - Subscribe with `weather/subscribe_forecast`, daily and hourly, and never poll.
  - Key daily entries by local date. Keep hourly ones as a sorted list, since two share the 1 am key on fall-back night.
  - Read `precipitation` too; the house's entity sends no chance of rain.
  - Use the entity's own `clear-night` condition for night icons.
  - Facts checked today: 6 daily entries stamped 17:00 UTC, 48 hourly ones. That bounds Q3 and Q4.

## 4. Corrections to the researchers' gap candidates

- **Reduced motion is already decided:** sheets fade under reduced motion ([event sheet], "Look and motion"). It is covered, not a gap (code-ui.md §11 listed it).
- **A column per person is decided out:** [#98]'s calls dropped "the Planner layout (the filter covers by-person)". landscape.md F3 asked for "an explicit choice"; it was made.
- **Swipe on phones is already a call** in the phones README. Only the wall's Month is open (A20).
- **One bar for a multi-day trip in Month is already a build call** in the wall Month README. Only the face's columns were open (A9).
- **Birthday ages and declined invitations go to the agent, not the owner.** No one would miss ages that need a marker nobody types. And for declines there's nothing to choose, since Home Assistant passes no response status and Hide is decided.
- **Month's 10 days of weather is now a known gap, not a check:** the house's forecast reaches 6 days (Q3).
- **The UTC-midnight forecast trap doesn't apply** to the house's entity, which stamps daily entries at 17:00 UTC.
- **A progress cue** is skipped (A21), as the researcher leaned.

## 5. What I could not check

Repeated from the top, with what each would change:
- **Home Assistant's Google integration with a lapsed sign-in.** If it keeps answering from its last sync, a lapsed sign-in looks like stale data, not a failure, and Q1's line needs the entity's state as well (A1).
- **Repeat rules through Home Assistant's create-event for CalDAV.** This decides whether Q7's B needs the house's own write path.
- **The iPhone app with a `maps.apple.com` link** (Q6).
- **Google and declined invitations** (A18).
- **A second weather source** with a chance of rain and 10 days (Q3's B).
- **Skylight's repeat on the device.** If it has none, Q7 isn't a Skylight-parity question.
- **Safari and the wall's WebView** for A15's CSS and Q8's colors.
- **Nothing of CCP was run.** Every behavior here comes from its code, comments, tests and docs.

## References

House decisions (map [#37], fork `bellamy1506/HA-Family-Hub-Clover`):

[#37]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37
[#38]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/38
[#39]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39#issuecomment-6512584295
[#43]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066
[#44]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169
[#45]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45#issuecomment-6545490784
[#49]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49#issuecomment-6548542552
[#50]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50#issuecomment-6543417361
[#57]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323
[#61]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61
[#66]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038
[#67]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807
[#68]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/68#issuecomment-6537655788
[#70]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/70#issuecomment-6537437929
[#71]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864
[#72]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054
[#76]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045
[#79]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79#issuecomment-6548787708
[#85]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/85#issuecomment-6550433680
[#87]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631
[#91]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184
[#92]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92#issuecomment-6557606569
[#97]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608
[#98]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623
[#99]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99#issuecomment-6561226253
[#100]: https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/100
[resting face]: ../../../prototypes/resting-face/README.md
[phones]: ../../../prototypes/phones/README.md
[marks]: ../../../prototypes/marks/README.md
[event sheet]: ../../../prototypes/event-sheet/README.md
[wall Month]: ../../../prototypes/wall-month-lists/README.md
[person colors]: ../../../prototypes/person-colors/README.md

- Map, decisions and plans: [#37], [CONTEXT.md](../../../CONTEXT.md), [switch-over.md](../../board-next/switch-over.md), [synthesis.md](../../board-next/synthesis.md), the prototype READMEs above, and [skylight-calendar.md](../skylight-calendar.md).
- Calendar Card Pro at `75bf292`: [github.com/alexpfau/calendar-card-pro](https://github.com/alexpfau/calendar-card-pro) (MIT), with docs at [calendar-card-pro.alexpfau.com](https://calendar-card-pro.alexpfau.com/): [grid view](https://calendar-card-pro.alexpfau.com/features/grid-view), [weather](https://calendar-card-pro.alexpfau.com/features/weather#weather-display-positions), [performance](https://calendar-card-pro.alexpfau.com/features/performance#when-a-calendar-fails-to-load), [actions](https://calendar-card-pro.alexpfau.com/features/actions#when-the-card-leaves-them-out), [event content](https://calendar-card-pro.alexpfau.com/features/event-content#birthday-ages-anniversary-counts), [multi-day events](https://calendar-card-pro.alexpfau.com/features/multi-day-events).
- The sibling reports in this folder, for every other card and source cited.
- Home Assistant: [Met.no integration](https://www.home-assistant.io/integrations/met/) (read 2026-11-01), and the house's `weather.forecast_home`, read with `weather.get_forecasts` on 2026-11-01.

## Verification

A skeptic's pass, 2026-11-01. I checked every row of the table, every owner question, and the agent's calls that overlap a decision. The sources were map [#37] ("Decisions so far", "Not yet specified", "Out of scope"), the [#98] resolution, every prototype README, [switch-over.md](../../board-next/switch-over.md) and [CONTEXT.md](../../../CONTEXT.md). Through them I also read the resolution comments of [#38], [#39], [#43], [#44], [#45], [#50], [#61], [#66], [#67], [#72], [#76], [#79], [#87], [#91], [#97] and [#99], and the research notes those comments link as their full findings. A row counts as confirmed only where I found the decision it names, or found none where it says none. I re-read four CCP citations at `75bf292` with `sed` (`src/config/view.ts:299`, `src/rendering/grid.ts:1003`, `src/rendering/render.ts:231-240`, `src/interaction/event-details.ts:97-104`) and found no `position: sticky` in `src/` with `grep`. All four hold. Nothing was run.

**Result:** 96 rows and 8 owner questions checked. Rows: 78 confirmed, 12 corrected, 6 refuted. Questions: 3 confirmed, 5 corrected, none refuted. The table has 34 gaps, not 36: four gap rows are already decided or recorded, and two "covered" rows aren't covered. Two agent's calls, A5 and A18, repeat calls already made.

### Refuted

1. **Row 62, declined invitations (A18): already decided.** [#66] (a technical call, not vetoed) adds a declined test invitation to [#39]'s supervised iCloud check, with Hide as the remedy meanwhile. Its note found that Home Assistant's Google integration already drops events the person declined, and CalDAV doesn't ([marks-over-time.md:40 and :70](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/marks-over-time/docs/research/marks-over-time.md)). So A18 repeats a decision. Its Google step is worth keeping only as a re-check, since that code was read on Home Assistant `dev`, not the house's 2026.10.4. Section 5's open item on Google and declined invitations has the same answer.
2. **Row 86, a `hass` gate (A5): already decided.** [#72]: "On `set hass`, do nothing unless the board's own entities changed, then replace only the parts whose data changed, in one animation frame; no timer redraws." A5 adds only which other keys to compare (locale, themes, user, connected).
3. **Row 74, asking again after a save (A12): decided for iCloud and for adds.** [#39], step 5: "After a save, refresh the entity and that calendar's server copy." The [adding README](../../../prototypes/adding/README.md) ("How the board knows what Clover did") has the board find what landed and, if it hasn't appeared within 10 seconds, say "Clover says it added Dentist, but it isn't on the board yet." Still open: sheet saves to Google and local calendars. A12's second ask at about 5 s must fit inside the decided 10 s.
4. **Row 24, how colorful the blocks are: already recorded, not undecided.** [#91] made "Blocks stay 17% everywhere" a technical call and measured the 0.45 note on those blocks. The [person colors] README turned down a reviewer's "fuller fills that read at a distance like a Skylight's" because "the pale 17% blocks were decided in the marks ticket", and the owner then moved Will to Cornflower ([#92]). Q8 is still a fair question, but as a revisit (see Q8 below).
5. **Row 43, an all-day item that retires at a set time: not covered.** No decision covers it, and the "Trash night" evidence is prototype data, which is always made up ([prototypes README](../../../prototypes/README.md)). The decided rule is that finished events leave ([resting face]), so an all-day item stays until its day ends. Reclassify as a gap and the agent's call: a note, nothing built *(inferred: rare and harmless)*.
6. **Row 89, Home Assistant updates breaking the card: not covered.** [#44] avoids a library and a visual editor. But its own layout note lists Home Assistant internals as a risk (dashboard resource registration "uses internals and already fails quietly", [house-board-layout.md:126](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md)). The board draws icons with Home Assistant's `ha-icon` ([marks]), and [#39] asks for the release notes of any Home Assistant release that touches CalDAV to be read before taking it. No decision sets a check before a Home Assistant update. The only remedy decided is "tell a session" ([switch-over.md](../../board-next/switch-over.md#if-the-house-board-fails)). Reclassify as a gap and the agent's call, for example running the board in the sandbox on a new Home Assistant release before the house takes it *(inferred)*. The mission's floor measure ("it keeps working through reboots, updates and months of neglect", [mission](../../board-next/mission.md)) asks for it.

### Corrected

**Owner questions:**
- **Q1 (row 81): whether to show it is settled; only how is open.** The plan the owner chose at D1 lists "A calendar that stops syncing says so on its column ('updated Tue')" as a floor item ([synthesis](../../board-next/synthesis.md), wave 2, item 1). The mission's trust measure says "nothing vanishes" ([mission](../../board-next/mission.md)). The owner's needs-you answer says "A stale board is a separate signal, not this line's job" ([#61, question 2](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536913728)). And the board already names AnyList when it can't reach it ([#76], [wall Month]). So option B, nothing on the board, would reverse the plan: drop it, or label it as a reversal. B's "the house digest tells the owner" also sits badly with [#99] decision 4, where the owner turned down alerts when the board itself fails *(inferred: a different failure, the same preference)*. The gap in the map's decisions is real, and Q1 is still the right one to ask now.
- **Q3 (rows 51 to 53): option A gives up a recorded call.** "Weather on the next 10 days" is in [#79]'s resolution as part of the Month the owner picked (a call the owner can veto), not only a build note. The question should say that A cuts it to 6 days because the house's forecast stops there, and that B is the way to keep it.
- **Q5 (row 3): option B changes two recorded views.** A tapped Month day opens "in a panel beside the grid" as a list ([#79], A's Month), and the phones' Month has "the tapped day listed underneath" ([#50]). B redraws both on an hour axis. The question should say it changes them, not only that it adds something.
- **Q7 (row 68): option B costs more than a rule in Clover's instructions.** `script.board_add_event` takes a title, a start, an optional end and notes, and nothing for a repeat (house repo [J006, Built in Home Assistant](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md#built-in-home-assistant), Board voice, Add event). B also needs that script, or a new one, to take a repeat rule: a Home Assistant change, explained first.
- **Q8 (row 24): frame it as a revisit.** It revisits [#91]'s "Blocks stay 17% everywhere" treatment and the 0.45 note line. The owner's [#92] picks rest on both: the 12 with their four noted pairs, and Cornflower for Will. Its main benefit, "Will and Us most of all", is what Cornflower already bought (0.50 apart before, 0.79 now). Lightness doesn't change, so the owner's "pale block" ([#57]) stands. Keep it for the owner, and say all of this in the question.

**Table rows:**
- **Rows 11 and 87 (A16): the idle reload ends at slice 5.** [switch-over.md](../../board-next/switch-over.md), step 5a.5, turns Fully's Auto Reload on Idle back off when the week card retires. After that the reset is the board's own one-minute return ([#87], calls), and no reload runs at all, so A16's soak check matters more.
- **Row 78: worse after a restart while a calendar is failing.** The server's copy is "in memory only; a restart empties it" ([load-time.md:163](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md), [#97]'s note). CCP's browser cache would still show up to a day of that calendar. The house board would show nothing for it. Q1's "isn't loading" line covers this case.
- **Row 80: Next and needs-you do wait for the slowest calendar.** [#97] holds them "until all calendars are in", which is CCP's `Promise.all` for those two. Better for the day columns only; A1's timeout fixes the rest.
- **Row 64: changing Google events is decided, not yet possible.** [#98] decision 8 wants it; whether it can be done is open at [#100] (slice 6). Until then the sheet says where to change it ([event sheet]).
- **Row 94: covered on the wall only.** [#87], calls: "When you walk up, the wall shows the resting face." On the phones, [#67] recomputes today on return and [#50] gives a Today button, but nothing says a phone left on another week comes back to today. Small; the agent's call.
- **Rows 39 and 41 (A7, A8): narrower than "not specified".** [#44]'s layout note gives `when.js` "events past midnight, the 1 Nov clock change" and runs the browser check in `America/New_York` ([house-board-layout.md:23 and :55](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/board-layout/docs/board-next/house-board-layout.md)). A7's other zones and A8's edge rules add to that.
- **Row 77 (A15): tabular figures are decided.** [#72]: "tabular figures for times". The other techniques stay with A15.
- **Row 88 (A17): one tap listener is decided.** [#44]'s layout: "one tap listener for the whole card". Still open: `touch-action` and a tap test on the wall tablet.
- **Rows 14 and 72: no decision named.** Translations and hold actions are left out by inference, not by a decision. Nothing a household would notice; they are agent's calls.

### Confirmed

- **Gaps with no covering decision:** rows 3, 8 (the wall's Month only), 12, 19, 21, 22, 27, 29, 30, 38, 42 (the face only), 51 (the face's three coming columns), 52, 53, 54, 55, 57, 65, 66 (Google and local calendars only), 68, 70, 75, 81, 82, 83, 84 and 85 (midnight passing on a wall that never sleeps; the return case is [#67]'s). I searched every source above for each.
- **Covered and better, with the decision relied on:** 1 ([#50]; no sticky headers in CCP's `src/`), 2 ([#38]), 4 ([#79], [#50]; `src/config/view.ts:299` lists only list, column and grid), 6 ([resting face], [phones], [wall Month]), 7 and 9 ([#79], [#50]), 10 ([resting face]; `src/rendering/grid.ts:1003` names the hidden events only in a `title` attribute), 15 ([#91], [wall Month], [resting face]), 18 ([#71], [#57]), 20 ([#98] decision 5), 23 ([#57], [#91]), 26 ([resting face], [phones]), 28 ([#97]'s note, [load-time.md:193](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/load-time/docs/research/load-time.md): "by start, end, title and `uid`"), 31 ([#98] decision 2), 32 and 33 ([resting face]; `prototypes/wall-month-lists/index.html:209`), 34 ("Nothing else today", `prototypes/phones/index.html:507`), 36 and 37 (a stronger source: [#87], calls, "Sunday-first weeks, the 12-hour clock and °F", fixed with no setting), 40 ([resting face]), 44 ([#91]: bars from 3:1 to 7.5:1; [#92]), 46 ([#61] question 1 calls; `uid` and start first, [#66]), 47 ([#61] question 3), 48 ([phones]; [#37], Not yet specified), 56 ([#98] decision 10), 58 ([#61] question 3, [#68]), 59 ([#61] question 4 calls: Hide asks "This one / All", so a whole series can go), 60 ([#61]), 61 ([event sheet], Guest mode and blocks), 63 ([#45]), 67 ([#49], [#79]), 73 ([#67]: "becomes visible again or reconnects"; [#97]), 76 ([#72], [event sheet]), 79 ([#97]), 90 ([#44]), 91 ([#76]), 93 ([#61], [#66]), 95 ([#49]; [wall Month], Lists), 96 ([#61], [#49], [#85], [#87]).
- **Not wanted, with the decision relied on:** 5 ([#98], calls: the Planner layout dropped), 13 ([#87]: "little"), 16 ([resting face]: nothing moves at rest; [#72]), 17 ([#57]: names in words; [marks], round 1), 25 ([resting face], Look; [#91]), 35 ([#44]), 45 ([#61] question 3; [#87]), 49 ([#37], Not yet specified, owner 2026-11-01), 50 ([CONTEXT.md](../../../CONTEXT.md), Person), 69 ([#39]: "This and following" gets a note only), 71 ([#70]; [#98], calls), 92 ([#37], Out of scope; [synthesis](../../board-next/synthesis.md), Not building; [#87], calls). A night clock has no decision of its own; the parked "More color schemes" is where an evening face would go *(inferred)*.
- **Owner questions that reopen nothing:** Q2 (no decision says what the sheet does on a plan shown once; [#45], [#61] question 1 and [#98] decision 9 are silent), Q4 ([#38]'s stated rain line is untouched), Q6 ([#98] decision 5 makes Place changeable text; a Maps link adds to it).

### What this pass could not check

- The house's forecast facts (6 daily entries, 48 hourly, no chance of rain): not re-run here.
- Whether Home Assistant 2026.10.4's Google integration drops declined events as `dev` does ([#66]'s note read `dev`).
- Anything about Skylight beyond [skylight-calendar.md](../skylight-calendar.md).
- The sibling reports' own findings, except where a row here cites them.
- The rest of section 5, still unchecked.

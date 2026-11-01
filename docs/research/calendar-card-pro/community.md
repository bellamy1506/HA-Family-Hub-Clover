Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro: what its users praise and complain about

Companion to [features.md](features.md), [code-data.md](code-data.md), [code-ui.md](code-ui.md) and [theming.md](theming.md) in this folder. Code is cited as `path:line` at CCP commit 75bf292 (v5.0.0). "Forum #N" is post N of the card's [Home Assistant community thread][forum]. Lines marked *(inferred)* are my judgment, not something a source says.

## Answer

- **Praised most:** the look ("such a beautiful, clean card that my family uses every day", [forum #149][f149]), setup without YAML since the v3 visual editor ([forum #135][f135]), an author who answers fast when active, and one function above all: **hiding the copy of an event that sits on two people's calendars** ([#33][i33], 7 thumbs up; "I love this feature", same thread).
- **Complained about most:** the card showing **"No upcoming events" or last week's dates on a wall tablet or the phone app** while a desktop browser was right ([#192][i192], [#265][i265], [#297][i297], [#271][i271], [forum #45][f45], [forum #158][f158]). It ran from spring 2025 to March 2026. The author first blamed browser caches. The real causes were in the card: it drew before Home Assistant's connection was ready, it kept an empty answer for 30 minutes, and a calendar that failed looked like an empty one. Fixed in v3.2.0, v3.5.0 and v5.0.0.
- **Wall tablets crashed** on v3.1.0. A forecast subscription leaked two copies per refresh until the phone app failed with "Reached 4096 pending messages" ([#291][i291], open five months). A build shipped with Lit's development code, and on Fully Kiosk tablets memory spikes got Home Assistant itself killed ([#326][i326]). Both were fixed in v3.2.0. One touch bug is still open: tap to expand does nothing on an Android tablet ([#616][i616]).
- **Home Assistant updates broke the card's editor three times** ([#214][i214], [forum #234][f234], [#338][i338]). The repo also went quiet twice: no release from June 2025 to March 2026, then none from March to August 2026. Users asked if it was abandoned ([#297][i297], [#338][i338]). The author's own words: "Last year did not leave me the time this card deserved" (`docs/RELEASE_NOTES.md:417`).
- **The Home Assistant calendar pitfalls behind the bugs:**
  - all-day dates read as UTC, which put events a day early west of UTC, the house's side ([#28][i28], fixed in v1.0.2);
  - countdowns a day short, fixed in three passes from v3.4 to v4.2 ([#344][i344]);
  - multi-day all-day events that began before the window vanished ([#16][i16]);
  - a Google calendar created in another time zone ([#43][i43]);
  - one Home Assistant release that broke every card's events ([#283][i283]).
  
  Several "bugs" were data that Home Assistant's calendar API never carries: declined invitations ([#27][i27]), Google event colors ([#52][i52]), Outlook categories ([forum #156][f156]), attendees ([#604][i604]), and Apple Contacts birthdays ([forum #240][f240]). iCloud through CalDAV was called slow, about 3 s against 0.5 s for the built-in card ([forum #231][f231], no reply).
- **Top requests:**
  - **Shipped:** days side by side ([#14][i14], the most requested, shipped in v4.0 after 17 months), add an event ([#45][i45], v5.0), a color for shared events ([#151][i151], the most commented, v4.2 and v5.0), tap for details ([#241][i241], v5.0) and an hour grid ([#339][i339], v5.0, partly).
  - **Still open:** a month grid ([#239][i239]), to-dos beside events ([#305][i305]), a column per person ([#203][i203]), swipe to page ([#699][i699], planned for v5.1) and tappable locations ([#614][i614]).
- **Direction:** v5 "changes what Calendar Card Pro is" (`docs/RELEASE_NOTES.md:9`). It turns a read-only agenda into a calendar you act on: grid, toolbar, and add, change and delete through Home Assistant's own dialogs. That reverses the author's 2025 line, "Doing one thing great is better than doing many things ok, IMO" ([forum #64][f64]). One maintainer, working in bursts.
- **For the house board** *(inferred)*:
  - **Already decided ahead of CCP** on what CCP's users asked for and didn't get: Month, Lists, a shared plan shown once in Us's green with both names, and a sheet per event.
  - **Lessons to carry:**
    - never let a failed or slow calendar look like an empty day;
    - leak nothing on a page that runs for weeks;
    - plain click handling for Android touch;
    - countdowns by calendar date;
    - expect declined invitations to keep showing.
  - Details are in [section 7](#7-what-this-means-for-the-house-board-inferred).

## Sources and how far they were read

| Source | Size (2026-11-01) | How read |
|---|---|---|
| [GitHub issues][issues] | about 265 issues, 35 open, 90 labeled bug | Lists sorted by comments, by reactions, and the bug label by comments (two pages); searches for recurring, CalDAV/iCloud/Nextcloud, time zone, tablet/kiosk/slow/performance; about 35 threads opened in full |
| GitHub Discussions | none | The tab doesn't exist (404); the repo shows Code, Issues, Pull requests, Actions, Projects |
| [Releases][releases] and `docs/RELEASE_NOTES.md` | 28 tags in the clone, v2.1.2 (2025-03-26) to v5.0.0 (2026-10-31); older tags not fetched | Release page reactions; release notes read from the clone |
| [Forum thread][forum] | 247 posts, about 56,500 views, 2025-03-14 to 2026-11-01 | All 12 pages read through summaries, key posts opened one by one |
| Reddit r/homeassistant | see below | Titles and counts only; posts and comments blocked |
| Repo page | 1.2k stars, 103 forks, 1 open PR | [Repo page][repo] |

Release dates come from the clone's tags: v3.1.0 2025-06-22, v3.2.0 2026-03-27, v3.3.0 2026-08-07, v4.0.0 2026-08-18, v4.1.0 2026-09-02, v4.2.0 2026-09-12, v5.0.0 2026-10-31. The release page shows the most reactions on v4.0.0 (2 thumbs up, 6 hearts).

**Reddit, what was reached:** a public-web search listed these r/homeassistant posts. I could read only their titles, dates, scores and opening lines. Bodies and comments were blocked (see section 8).
- "CALENDAR CARD PRO v4 RELEASED!", 2026-08-18, 384 points, 54 comments ([post][r-v4]). The largest Reddit thread on the card.
- "calendar card pro - non basta ram o è un piccolo bug?" ("not enough RAM, or a small bug?"), 2026-02-23, 4 comments ([post][r-ram]). Same weeks as the memory reports in [#324][i324] and [#326][i326].
- "Calendar card that shows the gaps between events?", 2025-08-13 ([post][r-gaps]): "all the calendar cards I've explored (calendar card pro, atomic, etc.) all seem to stack" events. This is the demand v5's hour grid later met *(inferred)*.
- Rival family-board cards posted in the same months ("Skylight Family Calendar" card, 2026-03-20, [post][r-sky]; "Multiday Calendar Card", 2026-09-04, [post][r-multi]). They belong to the other-cards report, not this one.

## 1. What users praise

- **Looks, out of the box.** The forum's most common reply is a compliment on the design: "DANG! This looks amazing!!!" ([forum #77][f77]), "very well designed and visually beautiful" ([forum #49][f49]), "It does look really good!" ([forum #12][f12]). A Lemmy user picked it for a Kindle status screen because font sizes are plain options, with no card-mod needed ([Lemmy post][lemmy]).
- **Family use.** "such a beautiful, clean card that my family uses every day" ([forum #149][f149]). Several build Skylight-like family walls with it ([forum #200][f200]: "I am starting to try and create a nice family view (skylight like)"; [forum #237][f237], [forum #238][f238]: a finished 27-inch wall display).
- **Easy setup.** "Super easy to work with" ([forum #62][f62]). The v3 visual editor ("No more YAML editing!", [forum #135][f135]) answered early complaints about YAML.
- **Duplicate filtering for couples.** "only show an event on both of our calendars once" ([#33][i33]). It shipped twelve days after the request, and the owner's announcement drew 6 hearts. The follow-ups ([#151][i151]) wanted the shared event marked as shared.
- **Text replacement for privacy.** Showing "Busy" on a shared calendar ([#212][i212]): the options "work like a charm".
- **The author's responsiveness, when active.** A first translation PR within a day ([forum #9][f9]). Fixes in hours in the first months: the day-early bug fixed the same day ([#28][i28]), the editor's weather picker in three days ([#214][i214]). Contributed fixes cherry-picked with credit ([#297][i297], [#339][i339]: "an outstanding contribution").
- **v4 and v5 polish.** The v4 Reddit post is the card's biggest (384 points). Users thanked the author for the horizontal layout ([forum #242][f242]). The time-grid contributor said the hour axis was "their spouse's explicit request" ([#339][i339]).

## 2. What users complain about most

Ranked by how many separate threads raise it *(inferred ranking)*.

1. **Empty or stale card on tablets and the app.** See [section 5](#5-tablets-and-wall-panels). The single biggest theme across both venues.
2. **Theme and styling.** "Shame it does not use the same css that other core and custom cards do" ([forum #2][f2]); "Until you do it's a total nonstarter for me" ([forum #17][f17]). Many styling asks were answered with card-mod snippets ([forum #43][f43], [forum #133][f133], [forum #189][f189]) or "not possible" ([forum #169][f169], [forum #178][f178], [forum #198][f198]). v5 made the accent follow the theme's primary color by default (`docs/RELEASE_NOTES.md:20`).
3. **The whole card was one tap target until v5.** No per-event tap, no tappable location or link ([forum #5][f5], [forum #108][f108], [forum #179][f179]: "will come at some point, but I am not working on it currently"). Per-event details came in v5.0 ([#241][i241]). Links are still open ([#614][i614]).
4. **Home Assistant releases breaking the editor.** The entity picker in the 2025.5 beta ([#214][i214]), dropdowns in 2026.3 ([forum #234][f234], fixed v3.2.0), and all text fields in 2026.5, when Home Assistant removed `ha-textfield` ([#338][i338], three months to a fix). Each came from the card using Home Assistant's internal form elements.
5. **Quiet periods.** "is anyone monitoring the repo", and the user was considering another card ([#297][i297], 2025-11-24). "It's been 4 months since the last update with no fix, looks like development has halted" ([#338][i338], 2026-07-23). The weather leak waited five months ([#291][i291]).
6. **Data Home Assistant doesn't give.** Declined invitations, Google colors, Outlook categories, attendees, Apple birthdays, Google Tasks (section 4). Users read these as card bugs. The author's answer was always the same: "as long as the cal integrations don't support it, there is no way to show it in my calendar card" ([#27][i27]).
7. **Fragile configuration.**
   - Clearing a number field in the editor saved an empty string, which blanked a calendar or the whole card ([#327][i327], `docs/RELEASE_NOTES.md:690`).
   - A stray `-` in the entity list replaced the card with a red error box (`docs/RELEASE_NOTES.md:562`).
   - Styling broke above four or five calendars ([#292][i292], [#293][i293]).
8. **12-hour time and local formats.** "For family acceptance I need to have 12H" ([forum #76][f76], answered by an existing option). Dates and weekday names showed in English ([#169][i169]). The v4 notes admit a twelve-hour clock was "handed to 33 of the 64 languages" wrongly (`docs/RELEASE_NOTES.md:421`).

## 3. Top feature requests, and whether they shipped

| Request | Weight | Outcome | Links |
|---|---|---|---|
| Days side by side (column view) | 13 thumbs up, top by reactions; "the most-requested thing in this project's history" (`docs/RELEASE_NOTES.md:417`) | Shipped v4.0.0, 2026-08-18, 17 months after asking | [#14][i14], [#253][i253], [#263][i263] |
| Add an event from the card | 10 thumbs up; "Many people use fully kiosk and can't go to the side bar" | Shipped v5.0.0: a toolbar + opens Home Assistant's own new-event dialog, not a custom form | [#45][i45] |
| Filter duplicates across calendars | 7 thumbs up | Shipped v2.2, 2025-03-28 | [#33][i33], [#101][i101] |
| A shared event shows as shared | 18 comments, the most commented issue | v4.2.0: every calendar's label on the merged row plus `duplicate_accent_color`; v5.0.0: the text can follow it. The author refused a color per combination of people: "It works for two calendars and falls apart above that." | [#151][i151] |
| Multi-day events on every day they cover | 9 comments | `split_multiday_events`, v2.4 (April 2025) | [#108][i108], [forum #56][f56] |
| Tap an event for its details | 6 comments, asked from the first day ([forum #3][f3]) | Shipped v5.0.0, with Edit and Delete "wherever the calendar's integration allows them" (`docs/RELEASE_NOTES.md:65`) | [#241][i241], [#117][i117], [#604][i604] |
| Hour grid (time axis, now-line) | A contributor's full fork with 215 tests | v5.0.0 grid view; one-day step, swipe, scroll to now and copy location left out | [#339][i339], [forum #73][f73], [forum #232][f232] |
| Hide private details on a shared calendar | 8 comments | `replace_with` per calendar, v4.1.0 | [#212][i212] |
| Weather beside events | 6 comments | v3.0.0 | [#107][i107] |
| Week numbers | 5 comments | v2.1 | [#17][i17] |
| Show today even when empty; hide the card when empty | forum asks | Hide when empty v3.5.0; `show_empty_today` v5.0.0 | [#286][i286], [forum #190][f190] |
| Templates (title, start date) | forum asks | Title templates v3.5.0; start date anchors v3.5.0; templates elsewhere still open | [forum #81][f81], [#311][i311] |
| Month grid | 4 thumbs up plus three "me too"; a variant "four weeks that always start on the most recent Monday" | **Open**, labeled as an epic, no promise | [#239][i239], [#624][i624], [forum #233][f233] |
| To-dos and reminders beside events (CalDAV reminders, Google Tasks, Apple Reminders) | 4 comments; "was hoping this would make it in to v5" | **Open**, no owner comment; earlier "My card does not support to-do" ([forum #172][f172]) | [#305][i305] |
| A column per person | 3 thumbs up, three requests merged | **Open** | [#203][i203] |
| Swipe left or right to page | Filed by the author | **Planned for v5.1** | [#699][i699] |
| Tappable locations and links | several | **Open** | [#614][i614], [forum #107][f107], [forum #177][f177] |
| Filter by time of day | | Grid only, through its hours; **open** for list and column | [#346][i346], [forum #104][f104] |
| Hide declined invitations | 7 comments | **Not possible**: no status in Home Assistant's events | [#27][i27], [forum #10][f10] |
| Use Google's event colors | 6 comments | **Not possible**: the integration doesn't fetch them | [#52][i52], [forum #119][f119] |

## 4. Recurring bugs and the Home Assistant calendar pitfalls behind them

| Pitfall | Integration and place | Cause | Fixed | Links |
|---|---|---|---|---|
| All-day event shows the day before | Google; MDT, UTC-4, US Central | `new Date("2025-03-17")` is UTC midnight, the previous evening west of UTC | v1.0.2, same day | [#28][i28], [#43][i43], [forum #11][f11] |
| All-day events a day off on one calendar only | Google calendar created in Pacific time, viewed in Central | The calendar's own time zone differs from Home Assistant's | User changed the calendar's zone, plus v1.0.2 | [#43][i43] |
| Multi-day all-day event missing | Google | It started before the visible range and was filtered out | v1.1.0 | [#16][i16] |
| Countdown one day short | Local Calendar, Europe/London | Milliseconds from now, rounded, so it lost a day after midday. Fixed for all-day, then regressed on split multi-day rows, then fixed for timed events | v3.4.0, v3.6.0, v4.2.0 | [#344][i344], `docs/RELEASE_NOTES.md:280`, `:572` |
| Week numbers wrong one date in seven | All, outside UTC | Day gaps measured in milliseconds across a clock change | v4.0.0 | `docs/RELEASE_NOTES.md:517` |
| Week break between Sunday and Monday on a Sunday-start week; weekend wrong in Israel | Asia/Jerusalem | ISO numbering is Monday-based; weekend taken from language, not country | v5.0.0 | [#621][i621] |
| Declined recurring invitation still shows | iOS calendar through CalDAV; Google tested too | Home Assistant's events carry no response status | Not fixable in a card | [#27][i27], [forum #10][f10] |
| Colors, categories, attendees missing | Google, Outlook | Not in `calendar.get_events`. Outlook categories show only on the entity's state, which holds only the next event. The only color Home Assistant keeps per calendar is set by Google, "only on first add, and only from 2026.2" | Not fixable | [#52][i52], [forum #126][f126], [forum #156][f156], [#604][i604], `docs/RELEASE_NOTES.md:310` |
| Apple birthdays missing | iCloud | Contacts birthdays aren't an iCloud calendar Home Assistant can read | Not fixable | [forum #240][f240] |
| Tasks missing | Google Tasks, CalDAV reminders, Apple Reminders | They are to-do entities, not calendar events | Open request | [forum #171][f171], [#305][i305] |
| Every event gone after an update | An Outlook.com calendar, judging by its entity name; Home Assistant 2025.9.1 | A Home Assistant regression; 2025.9.2 fixed it | Home Assistant | [#283][i283] |
| Editor and system choke with four calendars | Nextcloud CalDAV, Raspberry Pi | "Connection pool is full" in the CalDAV integration, per one user; unconfirmed | Closed after v3.2.0 | [#324][i324] |
| iCloud slow, about 3 s, or "losing all the info" | iCloud through CalDAV | Unknown; no reply | Not answered | [forum #231][f231] |
| One malformed event blanked every calendar | CalDAV, ICS, Google or third-party | Events missing a start or end threw inside duplicate filtering | v4.0.0 | `docs/RELEASE_NOTES.md:503` |
| A failed calendar shown as "no upcoming events", and the card hid itself | Any | Failure returned zero events; an empty answer was cached during an outage | v3.5.0 | `docs/RELEASE_NOTES.md:629`, `:631` |
| Same holiday on two regional calendars not merged | Regional holiday calendars | Duplicates match on title, start, end **and location** (`src/utils/events.ts:2104-2119`) | Open; the author will make location optional | [#705][i705] |

**Recurring events:** the issue search found no bug in how repeats are expanded. The only repeat-related report is the declined invitation above *(inferred: Home Assistant expands repeats before a card sees them, so cards rarely meet the repeat rule)*.

## 5. Tablets and wall panels

- **"No upcoming events" on the wall, right everywhere else.**
  - The reports: a Fully Kiosk wall tablet showed only today with no events while the phone and desktop showed five days ([forum #158][f158]). The same happened on a Samsung tablet and in Fully ([#265][i265]), and in the phone app ([forum #45][f45]). Shared Google all-day events stayed stale after reloads ([forum #163][f163]).
  - The author's first answers: "This is a caching issue that I can't fully prevent", closed not planned ([#192][i192]), and "Clear browser cache or try in a private window" ([#265][i265]).
  - The fix came from a contributor and shipped five months after that report ([#297][i297], v3.2.0):
    - retry when `hass` arrives late;
    - refresh on becoming visible;
    - keep an empty answer 15 seconds, not 30 minutes.
  - **v5.0.0 then:**
    - draws the last events at once, up to 24 hours old (`docs/RELEASE_NOTES.md:142`);
    - gives each calendar 30 seconds, after a calendar that never answered had stopped all refreshing (`:220`);
    - refreshes on time, where before it ran at twice its interval (`:219`);
    - names a failed calendar on the card and keeps its last events.
- **Crashes on long-running dashboards.**
  - [#291][i291]: on wall tablets the phone app eventually crashed with "Client unable to keep up with pending messages. Reached 4096 pending messages". Each refresh added two forecast subscriptions and none was ever dropped, because the code treated a Promise as the unsubscribe function.
  - [#326][i326]: dashboards crashed every 20 to 30 minutes on desktops, Android tablets and an iPhone. On a Fully tablet, CPU and RAM spikes got Home Assistant killed for lack of memory: "As soon as I removed the card from the dashboard the crashing stopped." Causes: Lit development code shipped in the release, plus the forecast leak.
  - Both were fixed in v3.2.0 (`docs/RELEASE_NOTES.md:843`, `:869`).
  - v5 fixed one more: a card on a dashboard tab that is switched away could restart its own timers while detached (`docs/RELEASE_NOTES.md:185`).
- **Touch.**
  - [#616][i616], **open**: tap to expand works with a mouse and in the iOS app but not on an Android tablet's touchscreen. The reporter suspects `pointercancel` from the v4 gesture code; their workaround is `touch-action: manipulation`. The author couldn't reproduce it in emulation and says v5 doesn't target it: "I can't call it fixed."
  - A second finger could take over a hold (fixed in v5).
  - A card with no actions still behaved like a button (fixed in v5).
- **Old browsers.** An error only on a Fire tablet, whose Amazon WebView 84 can't be replaced ([forum #22][f22]). Raw code on an iPad 2 ([forum #58][f58]). The author suggested Fully Kiosk or clearing caches.
- **Wall tablets asked for:**
  - silent refreshes without a loading screen ([#148][i148], shipped in v3.2.0 as a small spinner);
  - a way to add events without the sidebar ([#45][i45]);
  - a reset button for a shared screen (shipped in v5, `docs/RELEASE_NOTES.md:78`);
  - start expanded on wide screens and compact on phones ([#260][i260], open).
- **Speed fixes the author found himself.**
  - One card load asked for the same events three or four times (v4.0.0, `docs/RELEASE_NOTES.md:489`).
  - A color lookup forced hundreds of layouts per refresh (v3.4.0, `:706`).
  - Calendars were loaded one after another; seven at 150 ms each took about a second to the first event, and now about 160 ms (v5.0.0, `:145`).

## 6. The author on the card's direction

- **At launch (March 2025):** a list card built for speed after "performance issues when implementing them with button-card" ([forum #1][f1]). Tested with CalDAV and Google. On horizontal and month views and popups: "Doing one thing great is better than doing many things ok, IMO" ([forum #64][f64], 2025-03-28). Priorities: "Bugfix > feature > convenience" ([forum #206][f206]). He often said no to styling and convenience options ([forum #178][f178]: "That's why I don't plan on implementing this").
- **The gap and the return:** no release from v3.1.0 (2025-06-22) to v3.2.0 (2026-03-27). The v4.0.0 notes apologize: "Last year did not leave me the time this card deserved, and some of you waited a lot longer than you should have for it" (`docs/RELEASE_NOTES.md:417`). v4 was "560 commits" (`:419`). The shallow clone holds 509 commits from August and October 2026 alone. The repo now carries an `AGENTS.md` for AI coding agents and a test suite *(inferred: the burst is partly agent-assisted)*.
- **v5 (released 2026-10-31):**
  - **Framing:** "This one changes what Calendar Card Pro is. ... v5 brings grid view to your calendar and makes the card something you can act on", answering "more than twenty feature requests, some of them open since March 2025", and "truly polished on release day rather than soon after" (`docs/RELEASE_NOTES.md:9`, [release][rel-v5]).
  - **Forum announcement** ([forum #247][f247]): "v5 came out last night". The toolbar is his favorite part. The toolbar and tap-to-open are off by default.
  - **Writing goes through Home Assistant's own dialogs.** The author called it "a deliberate design line": staying read-only, "crossing it is one decision, not two" ([#45][i45]). "Writing is gated by the integration, not by the card" ([#604][i604]). Edit and Delete appear only where the calendar allows them, and can be turned off on a wall tablet (`docs/RELEASE_NOTES.md:65`).
  - **Left open on purpose:** a one-day step, swipe, scroll to now, copy a location, links in locations, attendees, a month grid, to-dos. Several are marked "do not close" in the notes (`docs/RELEASE_NOTES.md:233-256`). Swipe is planned for v5.1 ([#699][i699]).
- **Outside view:** a German video review was given first access to v5 (`docs/guide/whats-new.md:11`). Not watched here.

## 7. What this means for the house board *(inferred)*

All of this section is my judgment, set against the [map's decisions](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37). Nothing here is a new owner decision. Items the owner would notice are marked **for the owner**; the rest are the agent's call.

- **Where the decided board already gives what CCP's users waited for or still lack:**
  - A Month view on the wall and phones ([#239][i239] is still open).
  - Lists beside the calendar ([#305][i305] is still open).
  - A shared plan shown once, in Us's green with both names. CCP users spent 18 months getting there through [#33][i33] and [#151][i151].
  - Per-person titles, blocks or nothing. This is what [#212][i212] asked for.
  - An event sheet with change and delete ([#45][i45], [#241][i241] only in v5).
  - Adding by tapping a day ([#45][i45]'s "can't go to the side bar").
- **Never let a failure look like an empty day.** This was CCP's most repeated complaint, and it hit wall tablets hardest. The board's decided freshness rules are the core fix ([#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97#issuecomment-6558650608)): the server's copy first, a live ask every 60 s, and again when shown. A calendar that fails should keep its last events and say so quietly, as CCP v5 does (already a gap candidate in [code-ui.md](code-ui.md)). The owner would notice a wrong empty day on the wall, so this is worth a line in the build spec.
- **A board that runs for weeks must not leak.** Two of CCP's worst bugs grew slowly on wall tablets (forecast subscriptions, development code). For the board this means:
  - unsubscribe what is subscribed;
  - never re-subscribe on each refresh;
  - stop timers when hidden or detached;
  - a soak check on the tablet: memory and Home Assistant's pending messages over a day, within the [motion research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/72#issuecomment-6537563054)'s tablet check.
  
  The decided 5-minute idle reload ([#99](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99#issuecomment-6561226253)) caps a page leak but not a server-side one: an orphaned subscription floods Home Assistant's side, so cleanup still matters.
- **Touch on the Android tablet.** [#616][i616] is the same device class as the wall tablet. A plain delegated `click` (as [code-ui.md](code-ui.md) already recommends) with `touch-action: manipulation` avoids CCP's custom pointer code.
- **Fewer Home Assistant internals, fewer breakages.** CCP's editor broke three times because it used Home Assistant's internal form elements. The board's plain modules with its own controls ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44)) avoid that, as long as they keep away from `ha-*` elements whose API isn't public.
- **Dates.** The house is west of UTC, exactly where CCP's day-early bug lived. Countdowns must count calendar dates, not rounded hours ([#344][i344]), since countdowns stay ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)). Week math must survive a clock change. Both are in [code-data.md](code-data.md)'s pitfall list.
- **Merging shared plans.** CCP's match on title, start, end and location splits a plan whose copies differ only in location ([#705][i705]). The board's decided order, `uid` and start before title and times ([#66](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66#issuecomment-6537455038)), should not include location.
- **For the owner, if it shows up: declined invitations will probably still show.** [#27][i27] shows the CalDAV integration passes a declined repeat through with no status. iCloud reaches Home Assistant through CalDAV, so an invitation one adult declined on an iPhone will likely still sit on the board. I didn't check whether Home Assistant's Google integration drops declined events itself. A per-event Hide is already decided ([#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536916622)), which covers the occasional case.
- **iCloud may be slow to answer** ([forum #231][f231]). That is one more reason for the decided "server copy first" path and for drawing each calendar as it answers.
- **Swipe on phones.** CCP's author files swipe as "the natural gesture on a touch screen" ([#699][i699]). The phone's decided layout pages by a seven-day strip ([#50](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50#issuecomment-6543417361)). Whether a sideways swipe moves the week is a phone detail the owner would notice. It is a keep-or-skip for the phone build, not for this note.
- **Don't depend on CCP.** One maintainer with a nine-month gap and a v5 that changed its defaults: borrowing ideas and tested code, as #103 plans, is safer than running CCP beside the board.

## 8. What I could not check

- **Reddit bodies and comments.** Every route was blocked:
  - WebFetch can't open reddit.com, and WebSearch refuses the domain.
  - Firecrawl doesn't support the site.
  - The agent-reach Reddit read got a "blocked by network security" page; its public-web search returned titles once, then hit a rate limit of about an hour.
  - One read-only `reach` job on the wall tablet (recipe `reach`, `reddit read 1vry89a`) got HTTP 403, as its reference notes predicted. The screen stayed off throughout (focus `NotificationShade`), no DevTools port was left open, and no file was left on the tablet.
  
  So the v4 thread's 54 comments are unread. Its title, date, score and comment count come from search results.
- **GitHub Discussions** don't exist for this repo.
- **Forum pages were read through a summarizing fetch**, one page at a time. Posts quoted here were opened one by one, but a few posts in the middle pages (for example 63, 146, 183, 202, 211) were missing from those summaries.
- **Reaction counts** come from issue pages where shown. The issue lists show comment counts, not reactions, so "top by reactions" uses GitHub's own sort order.
- **Root causes** are the author's or the reporter's statements in the threads. I didn't run CCP or reproduce any bug (its code is untrusted and was only read).
- **The forum thread's view count** (about 56,500) and reply count (237 on the tag page, 247 post numbers in the thread) disagree slightly *(inferred: post numbers also count deleted or hidden posts, which matches the gaps above)*.
- **One mirror page** (the Lemmy post) carried a line of text addressed to AI tools. It was ignored.
- Not watched: the German video review of v5.

[forum]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711
[issues]: https://github.com/alexpfau/calendar-card-pro/issues
[releases]: https://github.com/alexpfau/calendar-card-pro/releases
[rel-v5]: https://github.com/alexpfau/calendar-card-pro/releases/tag/v5.0.0
[repo]: https://github.com/alexpfau/calendar-card-pro
[lemmy]: https://piefed.jeena.net/post/136157
[r-v4]: https://www.reddit.com/r/homeassistant/comments/1vry89a/calendar_card_pro_v4_released/
[r-ram]: https://www.reddit.com/r/homeassistant/comments/1rcit29/
[r-gaps]: https://www.reddit.com/r/homeassistant/comments/1mpc1zw/calendar_card_that_shows_the_gaps_between_events/
[r-sky]: https://www.reddit.com/r/homeassistant/comments/1ryxsxu/custom_card_skylight_family_calendar_a/
[r-multi]: https://www.reddit.com/r/homeassistant/comments/1w72bqu/multiday_calendar_card_for_home_assistant/
[f1]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/1
[f2]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/2
[f3]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/3
[f5]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/5
[f9]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/9
[f10]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/10
[f11]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/11
[f12]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/12
[f17]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/17
[f22]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/22
[f43]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/43
[f45]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/45
[f49]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/49
[f56]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/56
[f58]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/58
[f62]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/62
[f64]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/64
[f73]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/73
[f76]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/76
[f77]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/77
[f81]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/81
[f104]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/104
[f107]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/107
[f108]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/108
[f119]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/119
[f126]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/126
[f133]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/133
[f135]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/135
[f149]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/149
[f156]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/156
[f158]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/158
[f163]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/163
[f169]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/169
[f171]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/171
[f172]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/172
[f177]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/177
[f178]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/178
[f179]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/179
[f189]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/189
[f190]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/190
[f198]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/198
[f200]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/200
[f206]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/206
[f231]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/231
[f232]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/232
[f233]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/233
[f234]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/234
[f237]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/237
[f238]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/238
[f240]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/240
[f242]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/242
[f247]: https://community.home-assistant.io/t/calendar-card-pro-a-beautiful-high-performance-calendar-card-for-home-assistant/863711/247
[i14]: https://github.com/alexpfau/calendar-card-pro/issues/14
[i16]: https://github.com/alexpfau/calendar-card-pro/issues/16
[i17]: https://github.com/alexpfau/calendar-card-pro/issues/17
[i27]: https://github.com/alexpfau/calendar-card-pro/issues/27
[i28]: https://github.com/alexpfau/calendar-card-pro/issues/28
[i33]: https://github.com/alexpfau/calendar-card-pro/issues/33
[i43]: https://github.com/alexpfau/calendar-card-pro/issues/43
[i45]: https://github.com/alexpfau/calendar-card-pro/issues/45
[i52]: https://github.com/alexpfau/calendar-card-pro/issues/52
[i101]: https://github.com/alexpfau/calendar-card-pro/issues/101
[i107]: https://github.com/alexpfau/calendar-card-pro/issues/107
[i108]: https://github.com/alexpfau/calendar-card-pro/issues/108
[i117]: https://github.com/alexpfau/calendar-card-pro/issues/117
[i148]: https://github.com/alexpfau/calendar-card-pro/issues/148
[i151]: https://github.com/alexpfau/calendar-card-pro/issues/151
[i169]: https://github.com/alexpfau/calendar-card-pro/issues/169
[i192]: https://github.com/alexpfau/calendar-card-pro/issues/192
[i203]: https://github.com/alexpfau/calendar-card-pro/issues/203
[i212]: https://github.com/alexpfau/calendar-card-pro/issues/212
[i214]: https://github.com/alexpfau/calendar-card-pro/issues/214
[i239]: https://github.com/alexpfau/calendar-card-pro/issues/239
[i241]: https://github.com/alexpfau/calendar-card-pro/issues/241
[i253]: https://github.com/alexpfau/calendar-card-pro/issues/253
[i260]: https://github.com/alexpfau/calendar-card-pro/issues/260
[i263]: https://github.com/alexpfau/calendar-card-pro/issues/263
[i265]: https://github.com/alexpfau/calendar-card-pro/issues/265
[i271]: https://github.com/alexpfau/calendar-card-pro/issues/271
[i283]: https://github.com/alexpfau/calendar-card-pro/issues/283
[i286]: https://github.com/alexpfau/calendar-card-pro/issues/286
[i291]: https://github.com/alexpfau/calendar-card-pro/issues/291
[i292]: https://github.com/alexpfau/calendar-card-pro/issues/292
[i293]: https://github.com/alexpfau/calendar-card-pro/issues/293
[i297]: https://github.com/alexpfau/calendar-card-pro/issues/297
[i305]: https://github.com/alexpfau/calendar-card-pro/issues/305
[i311]: https://github.com/alexpfau/calendar-card-pro/issues/311
[i324]: https://github.com/alexpfau/calendar-card-pro/issues/324
[i326]: https://github.com/alexpfau/calendar-card-pro/issues/326
[i327]: https://github.com/alexpfau/calendar-card-pro/issues/327
[i338]: https://github.com/alexpfau/calendar-card-pro/issues/338
[i339]: https://github.com/alexpfau/calendar-card-pro/issues/339
[i344]: https://github.com/alexpfau/calendar-card-pro/issues/344
[i346]: https://github.com/alexpfau/calendar-card-pro/issues/346
[i604]: https://github.com/alexpfau/calendar-card-pro/issues/604
[i614]: https://github.com/alexpfau/calendar-card-pro/issues/614
[i616]: https://github.com/alexpfau/calendar-card-pro/issues/616
[i621]: https://github.com/alexpfau/calendar-card-pro/issues/621
[i624]: https://github.com/alexpfau/calendar-card-pro/issues/624
[i699]: https://github.com/alexpfau/calendar-card-pro/issues/699
[i705]: https://github.com/alexpfau/calendar-card-pro/issues/705

Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro: everything a household would notice

This is the feature inventory for Calendar Card Pro (CCP), v5.0.0, at commit `75bf292` (MIT). It lists what a person using the card sees or can do, grouped as the issue asks, with each feature's option name, default and documentation page. Code is cited as `path:line` at that commit. The two sibling notes cover how it is built: [code-data.md](code-data.md) (fetching, caching, events, weather) and [code-ui.md](code-ui.md) (rendering, layout, editor). Section 18 is a first pass against the house board; the full gap list is that issue's own work.

## Answer

- **CCP is one Home Assistant card with three layouts and about 200 options.** The configuration reference has about 160 card options, plus 21 per calendar and 17 weather sub-options ([reference](https://calendar-card-pro.alexpfau.com/reference/configuration)). The three layouts are a **list** (days stacked, the default), **columns** (one per day) and, new in v5, a **grid** with days on an hour axis (07:00 to 22:00 by default), a green line at the current time, and an all-day band.
- **v5.0.0 came out on 2026-10-31, the day before this note, and made the card something you act on.** It added an optional toolbar: arrows to page through dates, a date picker, a List / Columns / Grid switcher, a show or hide chip for each calendar, refresh, add, and a Reset button for shared screens. A tap on an event opens Home Assistant's own event dialog, with Edit and Delete where the calendar allows them.
- **What a family would notice most:**
  - a color and a face (a person's Home Assistant picture) for each calendar;
  - an event on two people's calendars shown once, with both faces, in a color of its own;
  - a soft tile on today's date;
  - "Now ·" in green on an event under way;
  - countdowns ("tomorrow", "in 3 days") and progress bars;
  - the forecast in each day header and beside each event;
  - ages on birthdays from a `YEAR=1976` note in the description;
  - finished events faded;
  - cached events on screen as soon as a dashboard opens;
  - a calendar that fails to load named at the foot of the card ("Couldn't load: Ben"), with its last events still shown.
- **What it can't do, and where the decided house board already goes further** *(inferred)*:
  - It writes only through Home Assistant's dialogs. By CCP's own table, a CalDAV calendar (so iCloud) can be added to but never edited or deleted from the card ([actions](https://calendar-card-pro.alexpfau.com/features/actions#what-each-integration-allows)).
  - It has no month view, lists, notes, meals, voice adding, "new since you looked" marks or clash marks.
  - It remembers choices per browser, not per person.
  - Grid's `+N` block lists the events it hides only on mouse hover (`src/rendering/grid.ts:1003`), so on a touch tablet they can't be reached.
  - Compact mode and narrow layouts hide events and days without saying so.
- **Gaps to put to the owner, because they'd notice them on the wall** *(inferred)*:
  - a day or week drawn on an hour axis with a now line, which Skylight's Day view also has;
  - the forecast beside each timed event;
  - birthday ages.
- **Gaps that are the agent's call** *(inferred)*: naming a calendar that failed to load, the same-minute "9:41" rule, the wording for multi-day times, and accessible names for events.

## What was read, and what wasn't checked

**Read:** `README.md`; every page under `docs/guide`, `docs/features` and `docs/reference`; `docs/RELEASE_NOTES.md` (v5.0.0 in full, the rest by heading); `docs/guide/whats-new.md` in full; and `src/config/config.ts` (`DEFAULT_CONFIG` at `src/config/config.ts:16` to `:198`) and `src/config/constants.ts` for the defaults. I also read the source wherever a doc claim needed checking, as cited. I spot-checked the live site's home page and [configuration reference](https://calendar-card-pro.alexpfau.com/reference/configuration) against the repo, and their defaults match. I took release dates from the repo's tags (the [GitHub releases page](https://github.com/alexpfau/calendar-card-pro/releases) shows day and month only).

**Not checked:**
- I didn't run the card, its build or its tests (the source is untrusted). Everything visual here comes from the docs and the code, not from seeing it draw.
- I didn't open the screenshots in `.github/img/` or watch the German [video review](https://youtu.be/ptXdis8WHXo).
- The integration table (which calendars allow Add, Edit and Delete) is CCP's claim. I didn't check it against Home Assistant's docs. It does agree with the house's own finding at [#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39) that the CalDAV integration can't change iCloud events.
- The clone's history starts at v2.1.2 (2025-03-26), so v1.x comes only from `docs/guide/whats-new.md`.
- User praise and complaints, and other cards, are other parts of the issue and aren't covered here.

**How to read the tables:** "Option" is the YAML key, with `→` for a nested key. "Default" is the shipped value, with the column or grid value where it differs. Docs links go to the live site.

## 1. Views and layouts

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| List view | Days stacked; a date column on the left (weekday, day number, month) beside each day's events | `view: list` | the default | [usage](https://calendar-card-pro.alexpfau.com/guide/usage) |
| Column view | One column per day; empty days and split multi-day events on by default. Too narrow for every column at `min_day_width`, it turns into a list | `view: column`; `column → min_day_width`, `min_days_to_show`, `min_days_fallback` | `140` px; `days_to_show`; `list` (or `cramp`) | [column view](https://calendar-card-pro.alexpfau.com/features/column-view) |
| Grid view | Days as columns on a shared hour axis; each event placed at its start and as tall as it lasts | `view: grid` | | [grid view](https://calendar-card-pro.alexpfau.com/features/grid-view) |
| Grid hours | Which hours are drawn; an event wholly outside them isn't drawn at all; one partly outside is clipped with a dashed edge. A bad value resets both bounds | `time_grid → start_time`, `end_time` | `07:00`, `22:00` (`24:00` allowed) | [choosing the hours](https://calendar-card-pro.alexpfau.com/features/grid-view#choosing-the-hours-the-card-shows) |
| Grid scale | Height of an hour; under a fixed `height` the axis squeezes to fit instead of scrolling | `time_grid → hour_height` | `48px` | [how tall an hour is](https://calendar-card-pro.alexpfau.com/features/grid-view#how-tall-an-hour-is) |
| Grid ruling and labels | Rules every 15, 20, 30 or 60 minutes; labels every 30, 60, 120 or 180 minutes, counted from midnight; gutter width; labels can be turned off | `slot_minutes`, `axis_label_minutes`, `axis_width`, `show_axis_labels` | `60`, `60`, `max-content`, `true` | [ruling the axis](https://calendar-card-pro.alexpfau.com/features/grid-view#ruling-the-axis) |
| Grid rules | Four families of line (between columns, under the date row, under the all-day band, across the hours), each with a width and color | `day_separator_*`, `day_header_separator_*`, `allday_band_line_*`, `hour_line_*` | `1px`, `1px`, `2px`, `1px`, half-strength divider gray | same |
| Grid overlaps | An event starting at least half an hour inside a longer one is drawn on top of it, slightly indented (like Google and macOS); events starting together sit side by side; or every overlap as lanes (like Outlook) | `time_grid → overlap_layout` | `cascade` (or `columns`) | [overlapping events](https://calendar-card-pro.alexpfau.com/features/grid-view#overlapping-events) |
| Grid crowding | Past this many side by side, the rest fold into a narrow `+N` strip whose titles show only on hover (`src/rendering/grid.ts:998` to `:1003`); a tap on it is a tap on the card | `time_grid → max_simultaneous_events` | `3` | [how many fit](https://calendar-card-pro.alexpfau.com/features/grid-view#how-many-fit-side-by-side) |
| Grid all-day band | A band between the dates and the hours; a multi-day event is one banner across its days, its ends rounded where it really starts or ends and squared with an arrow where it runs off the card; banners beyond the cap are dropped | `time_grid → allday_band_max_rows` | `3` | [all-day events](https://calendar-card-pro.alexpfau.com/features/grid-view#all-day-events) |
| Grid on a narrow card | Sheds a day at a time, always keeping today; dropped days aren't marked; below the floor, a list or cramped columns that scroll sideways | `time_grid → min_day_width`, `min_days_to_show`, `min_days_fallback` | `100` px (three days fit at 383 px), `1`, `list` | [fitting narrow cards](https://calendar-card-pro.alexpfau.com/features/grid-view#fitting-narrow-cards) |
| Grid weekend shading | A faint tint down weekend columns, joined across a Saturday and Sunday | `time_grid → weekend_background_color` | 4% of the theme's text color | [shading the weekend](https://calendar-card-pro.alexpfau.com/features/grid-view#shading-the-weekend) |
| Grid's own defaults | Fourteen shared options start differently in grid: filled blocks, empty days and past events kept, locations hidden, 12 px titles, text in each calendar's color, full-width progress bar | inside `time_grid:` | see table | [different defaults](https://calendar-card-pro.alexpfau.com/features/grid-view#options-that-start-from-a-different-default) |
| How many days | Days drawn; each layout may have its own count, and the card loads the longest once, so switching loads nothing | `days_to_show` (also in `list:`, `column:`, `time_grid:`) | `3` (`src/config/config.ts:21`) | [days per layout](https://calendar-card-pro.alexpfau.com/features/core-settings#showing-a-different-number-of-days-in-each-layout) |
| Start date | Fixed date or an expression: `today+7`, `start_of_week`, `saturday`, `monday+1w`; English keywords; a bad one falls back to today | `start_date` | today | [start date](https://calendar-card-pro.alexpfau.com/features/start-date-offset#start-date-configuration) |
| Height | Fixed or capped content height; list and columns scroll, grid compresses its axis | `height`, `max_height` | `auto`, `none` | [dimensions](https://calendar-card-pro.alexpfau.com/features/layout-appearance#card-dimensions-scrolling) |
| Per-layout settings | Blocks that override shared options for one layout; options that decide what loads (`entities`, `start_date`, `weather`, refresh) stay shared | `list:`, `column:`, `time_grid:` | inherit | [per-view options](https://calendar-card-pro.alexpfau.com/features/core-settings#per-view-options) |
| Compact and expand (list only) | Show the first N events or days until a tap expands; per-calendar limits; "complete days" never cuts a day part way. **Nothing on the card says events were held back** | `compact_events_to_show`, `compact_days_to_show`, `compact_events_complete_days`, `tap_action: expand` | unset, unset, `false` | [compact mode](https://calendar-card-pro.alexpfau.com/features/core-settings#compact-mode-event-limits) |
| Week numbers and separators | ISO or simple week-number pills; rules between days, weeks and months (month beats week beats day); in columns, vertical rules | `show_week_numbers`, `show_current_week_number`, `day_separator_width`, `week_separator_width`, `month_separator_width` | off, `true`, `0px` each | [week numbers](https://calendar-card-pro.alexpfau.com/features/layout-appearance#week-numbers-visual-separators) |
| Spacing | Between days, between a day's events (each then gets its own box and bar), inside each event, around the card | `day_spacing`, `event_gap`, `event_spacing`, `additional_card_spacing` | `10px` (grid `1px`), `0px`, `4px`, `0px` | [gaps between events](https://calendar-card-pro.alexpfau.com/features/layout-appearance#gaps-between-events) |
| Card title | A heading, which can be a Home Assistant template (`{{ now().strftime(...) }}`, a sensor, the next event); briefly empty on first paint | `title`, `title_font_size`, `title_color` | none | [title templates](https://calendar-card-pro.alexpfau.com/features/title-templates) |
| Card picker | From Home Assistant 2026.6, picking a `calendar.*` in the By entity tab offers CCP as List, Columns or Time Grid, already pointed at it (`src/config/config.ts:1447` to `:1497`) | none | three days | [usage](https://calendar-card-pro.alexpfau.com/guide/usage#adding-the-card-to-your-dashboard) |
| Example stories | Six complete cards to copy: Family Hub (wall tablet), Family Agenda, Now & Next, Today & Tomorrow, Birthdays & Holidays, Bin Day | none | none | [examples](https://calendar-card-pro.alexpfau.com/reference/examples) |

The [Family Hub story](https://calendar-card-pro.alexpfau.com/guide/family-calendar) is the closest to the house: a 1280 by 800 kitchen tablet in grid view, 7 days, `hour_height: 36px` so 07:00 to 22:00 fits without scrolling, toolbar with color chips and Reset, a face per person, shared plans in gold, weather in each date header, and `kiosk-mode` to hide Home Assistant's header. Its phone copy shows List with 3 days.

## 2. What an event shows

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Title | The event's summary; size, color, line cap with "..." | `event_font_size`, `event_color`, `title_max_lines` | `14px` (grid `12px`), theme text, `0` (no cap) | [events display](https://calendar-card-pro.alexpfau.com/features/event-content#calendar-events-display) |
| Scrolling long titles | A title too wide stays on one line and scrolls sideways, visible titles starting together, 45 px a second, 0.6 s pauses (`src/config/constants.ts:200` to `:215`); stops under reduced motion and off screen | `scroll_long_titles` | `false` | [scrolling titles](https://calendar-card-pro.alexpfau.com/features/event-content#scrolling-long-titles) |
| Calendar label | Text, emoji, an `mdi:` icon, an image, a person's picture, or the calendar's own Home Assistant icon, inline before the title | per calendar `label` | none | [labels](https://calendar-card-pro.alexpfau.com/features/core-settings#choosing-how-a-label-is-read) |
| Time row | Clock icon, then start and end. An event that starts and ends in the same minute reads `9:41`, not `9:41 - 9:41` (`src/utils/format.ts:942` to `:982`) | `show_time`, `show_end_time`, `time_font_size`, `time_icon_size`, `time_color`, `time_max_lines` | `true`, `true`, `12px`, `14px`, secondary text, `0` | [time and location](https://calendar-card-pro.alexpfau.com/features/event-content#time-location-information) |
| Location row | Map-pin icon and the place; Microsoft Teams meetings get the Teams logo automatically, in any language Teams writes (`src/utils/format.ts:340`); a per-calendar icon; country names can be stripped | `show_location`, `location_icon`, `remove_location_country`, `location_max_lines` | `true` (grid `false`), map marker, `false`, `0` | [location icon](https://calendar-card-pro.alexpfau.com/features/event-content#the-location-icon) |
| Description row | The event's notes, HTML tags stripped and entities decoded (`src/utils/format.ts:464`), line cap | `show_description`, `description_max_lines` | `false`, `0` | [descriptions](https://calendar-card-pro.alexpfau.com/features/event-content#event-description-display) |
| Weather row | The forecast for the event's start hour (section 6) | `weather → position: event` | off (`date` only) | [weather](https://calendar-card-pro.alexpfau.com/features/weather) |
| Accent bar | A colored bar with rounded ends beside each event; touching untinted events share one line that changes color between calendars | `vertical_line_width` | `2px` | [visual styling](https://calendar-card-pro.alexpfau.com/features/layout-appearance#visual-styling-colors) |
| Background tint | A wash of the calendar color behind each event | `event_background_opacity` | `0` (grid `20`) | same |
| Finished events | Hidden, or shown faded (contents only; the bar and fill stay) | `show_past_events`, `past_event_opacity` | `false` (grid `true`), `60` | [past events](https://calendar-card-pro.alexpfau.com/features/event-content#past-events-display) |
| Birthday ages | `YEAR=1976` (or `YEAR:1976`) in the description appends `(50)` to the title in 2026, counting up every year; the marker never shows; nothing to switch on; suppressed on a replaced title (`src/utils/event-age.ts:56` to `:178`) | none | always on | [ages](https://calendar-card-pro.alexpfau.com/features/event-content#birthday-ages-anniversary-counts) |
| Order in a day | All-day first; all-day events on the same day by calendar order, then alphabetically; timed events by start (`src/utils/events.ts:1449` to `:1482`) | none | none | [v2.2.1 notes](https://calendar-card-pro.alexpfau.com/RELEASE_NOTES) |
| Grid blocks reveal more as they grow | The title shows once a full row fits, then the time, then location and the rest. The time row gives up its clock icon, then a line, then the end time, never a cut-off clock. A short block's title shrinks a pixel at a time to a 10 px floor, keeping every label | none | none | [what a block shows](https://calendar-card-pro.alexpfau.com/features/grid-view#what-a-block-shows) |
| Bad event ends | A timed event with no end, or an end before its start, shows at its start; an all-day one is dropped | none | none | [time and location](https://calendar-card-pro.alexpfau.com/features/event-content#time-location-information) |
| Icon alignment | Where the small row icons sit when a row wraps | `event_icon_vertical_alignment` | `top` | [spacing](https://calendar-card-pro.alexpfau.com/features/layout-appearance#spacing-alignment) |

## 3. Date and time formats

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| 12 or 24 hour | Follows the Home Assistant profile's time format unless forced | `time_24h` | `system` (`src/config/config.ts:120`) | [event column](https://calendar-card-pro.alexpfau.com/reference/configuration#event-column) |
| Two-digit hours | `09:00` rather than `9:00` | `time_two_digit_hours` | `false` | same |
| Date order | `17. Mar` (German, Croatian), `Mar 17` (English, Hungarian), `17 Mar` (others), chosen by language (`src/translations/localize.ts:202`) | `language` | Home Assistant's | [v1.2 notes](https://calendar-card-pro.alexpfau.com/guide/whats-new) |
| Date column | Weekday name, large day number, month name; sizes and colors, weekend and today variants | `weekday_font_size`, `day_font_size`, `month_font_size`, `show_month`, `weekend_*_color`, `today_*_color` | `14px`, `26px`, `12px`, `true` | [date column](https://calendar-card-pro.alexpfau.com/features/layout-appearance#date-column-customization) |
| Week start | Follows the Home Assistant profile, then its language (Sunday for English) | `first_day_of_week` | `system` | [week numbers](https://calendar-card-pro.alexpfau.com/features/layout-appearance#week-numbers-visual-separators) |
| Weekend days | From Home Assistant's country (Friday and Saturday in Israel, Sunday in India), then its language | none | country | [weekdays only](https://calendar-card-pro.alexpfau.com/features/core-settings#showing-a-calendar-on-weekdays-only) |
| Multi-day timed wording | "22:30, ends tomorrow at 0:30"; "9:00 until Friday, Oct 23 at 17:00"; started earlier: "ends today at 15:00" (`src/utils/format.ts:984` to `:1050`) | none | none | [multi-day](https://calendar-card-pro.alexpfau.com/features/multi-day-events) |
| Multi-day all-day wording | "All day, until Monday, Jun 29", "All day, ends tomorrow" (`src/utils/format.ts:1062`) | `show_multiday_allday_time` | `true` | [hiding the time row](https://calendar-card-pro.alexpfau.com/features/event-content#hiding-the-time-row) |
| Countdown wording | "in 20 minutes" later today, "tomorrow" for the next date, "in 3 days", "in a month" by local calendar dates, so counts never skip a day (`src/utils/format.ts:195`) | `show_countdown` | `false` | [countdowns](https://calendar-card-pro.alexpfau.com/features/event-content#countdown-display) |
| Month heading (toolbar) | The month the first day on screen falls in, month bold and year regular, short form ("Nov 2026") where narrow; the exact range is its tooltip and what a screen reader hears (`src/utils/paging.ts:248`, `:378`) | `toolbar → navigation` | on with the toolbar | [paging](https://calendar-card-pro.alexpfau.com/features/layout-appearance#paging-through-dates) |
| Clock changes | Grid draws an event in the repeated autumn hour by its real length, and a 23- or 25-hour day fills one column | none | none | [repeated DST hour](https://calendar-card-pro.alexpfau.com/features/grid-view#events-in-the-repeated-dst-hour) |

## 4. All-day and multi-day events

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| All-day pill | Draws "all day" as a rounded pill around the title (as Google and Apple do) or on the time row; four shapes; each calendar's color, the row's text color, or one color | `allday_badge`, `allday_badge_style`, `allday_badge_color` | `off`, `subtle`, `accent` | [all-day badge](https://calendar-card-pro.alexpfau.com/features/event-content#the-all-day-badge) |
| All-day time rows | Hide "All day" on one-day events; separately keep or hide the end date on multi-day ones | `show_single_allday_time`, `show_multiday_allday_time` | `true`, `true` | [hiding the time row](https://calendar-card-pro.alexpfau.com/features/event-content#hiding-the-time-row) |
| All-day details | Hide location, description or countdown on all-day events only | `show_location_allday`, `show_description_allday`, `show_countdown_allday` | `true` each | [event content](https://calendar-card-pro.alexpfau.com/features/event-content) |
| Split across days | A multi-day event on every day it covers: timed first and last days keep their times, middle days read as all-day. A timed event ending exactly at midnight gets no row on the next date | `split_multiday_events` (per calendar too) | `false` (columns `true`; grid splits by itself) | [multi-day events](https://calendar-card-pro.alexpfau.com/features/multi-day-events) |
| Unsplit | Shown once, on its first day in the window, with its whole span in words | same, `false` | default in list | same |
| Already under way | An event that began before the window shows on the window's first day (v1.1) | none | none | [what's new](https://calendar-card-pro.alexpfau.com/guide/whats-new) |
| Retire during the day | An all-day event counts as past from a set time on its last day (bin day gone after the truck); only while past events are hidden, and only at the next repaint | per calendar `allday_expires_at` | midnight | [retiring all-day events](https://calendar-card-pro.alexpfau.com/features/core-settings#retiring-all-day-events-during-the-day) |
| Kind of event | Keep all, only timed, or only all-day; listing a calendar twice splits it into two styles | `event_type` | `all` | [separating all-day](https://calendar-card-pro.alexpfau.com/features/core-settings#separating-all-day-from-timed-events) |
| Grid banners | Title only, the calendar color as their fill, no bar; continuation arrows; up to 3 rows | `time_grid → allday_band_max_rows` | `3` | [all-day events](https://calendar-card-pro.alexpfau.com/features/grid-view#all-day-events) |

## 5. Colors, labels and people

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Calendar color | The accent bar, the tint and the pill; card-wide or per calendar; `home-assistant` follows the color set on the calendar entity in Home Assistant (2026.2 and later; only Google fills it in by itself) | `accent_color` | the theme's primary color, `#03a9f4` if none (`src/config/config.ts:44`) | [colors from Home Assistant](https://calendar-card-pro.alexpfau.com/features/core-settings#using-the-colors-from-home-assistant) |
| Title color | The title's own color, per calendar | per calendar `color` | `event_color` | [entity options](https://calendar-card-pro.alexpfau.com/features/core-settings#available-options-for-entity-configuration-objects) |
| Text in the calendar's color | `accent` in any of five color options tints that text with the calendar color mixed toward the theme text, for contrast (CCP reports 2.3:1 to 7.4:1 on a coral block) | `event_color`, `time_color`, `location_color`, `description_color`, `progress_bar_color` | theme colors (grid: `accent`) | [calendar colors](https://calendar-card-pro.alexpfau.com/features/event-content#event-text-in-calendar-colors) |
| A person's face | `label: person.anna` shows that person's Home Assistant picture before each event, kept current; carries their name for screen readers; no picture, no label (`src/utils/person-pictures.ts:78`) | per calendar `label` | none | [a person's picture](https://calendar-card-pro.alexpfau.com/features/core-settings#showing-a-persons-picture) |
| Calendar icon from Home Assistant | `label: home-assistant` shows the calendar entity's own icon | per calendar `label` | none | [following the icon](https://calendar-card-pro.alexpfau.com/features/core-settings#following-the-icon-from-home-assistant) |
| Icons by keyword | One calendar listed several times with allowlists, each with its own icon or color; the first match wins with `filter_duplicates` | `label`, `allowlist`, `blocklist` | none | [mapping icons](https://calendar-card-pro.alexpfau.com/features/core-settings#mapping-icons-onto-events-by-keyword) |
| Shared events | An event on two or more calendars (same title, start, end and location) drawn once, with every calendar's label (both faces) | `filter_duplicates` | `false` | [duplicates](https://calendar-card-pro.alexpfau.com/features/core-settings#filtering-duplicate-events) |
| Shared color | A merged event's accent in its own color (gold in the Family Hub story) | `duplicate_accent_color` | none (first calendar's) | [labeling shared events](https://calendar-card-pro.alexpfau.com/features/core-settings#labeling-coloring-shared-events) |
| Weekend and today colors | Separate colors for weekend and today's weekday, number and month | `weekend_*_color`, `today_*_color` | inherit | [weekend styling](https://calendar-card-pro.alexpfau.com/features/event-content#weekend-day-styling) |
| Theme | Follows the Home Assistant theme and light or dark mode; card-mod classes (`today`, `tomorrow`, `weekend`, `past-event`, `.fetch-error`) | `background_color` | `--ha-card-background` | [theming](https://calendar-card-pro.alexpfau.com/features/theming) |

## 6. Weather

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Source | Any Home Assistant `weather.*` entity, through its forecast subscription (`src/utils/weather.ts:372`) | `weather → entity` | none | [weather](https://calendar-card-pro.alexpfau.com/features/weather) |
| Where | In the day header, beside each event, both, or nowhere | `weather → position` | `date` | [positions](https://calendar-card-pro.alexpfau.com/features/weather#weather-display-positions) |
| Day header | Condition icon and high; low and UV index on request; UV only above a threshold | `date → show_conditions`, `show_high_temp`, `show_low_temp`, `show_uv_index`, `uv_index_threshold` | `true`, `true`, `false`, `false`, `0` | [options](https://calendar-card-pro.alexpfau.com/features/weather#weather-configuration-options) |
| Beside an event | The forecast for the event's start hour: icon and temperature; in columns and grid a row of its own reading `21° · Partly cloudy` | `event → show_conditions`, `show_temp`, `show_uv_index`, `max_lines` | `true`, `true`, `false`, `0` | [column layout](https://calendar-card-pro.alexpfau.com/features/weather#weather-in-the-column-layout) |
| Beyond the hourly forecast | Timed events past the hourly horizon (about two days) use that day's daily forecast; all-day events always do | `event → daily_forecast_fallback` | `true` | [options](https://calendar-card-pro.alexpfau.com/features/weather#weather-configuration-options) |
| Night icons | A clear hour shows a moon at night, by the forecast's `is_daytime`, else 18:00 to 06:00 (`src/utils/weather.ts:248` to `:267`) | none | none | [positions](https://calendar-card-pro.alexpfau.com/features/weather#weather-display-positions) |
| Condition words | Home Assistant's own translations of the 15 conditions, in the card's language | none | none | [column layout](https://calendar-card-pro.alexpfau.com/features/weather#weather-in-the-column-layout) |
| Range | Days past the daily forecast show nothing; CCP advises four or five grid days | none | none | [grid layout](https://calendar-card-pro.alexpfau.com/features/weather#weather-in-the-grid-layout) |

There is no "rain from 2 pm" line, no daily summary and no warnings: only icons, temperatures and UV.

## 7. Filtering and hiding

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Allowlist and blocklist | Regular expressions per calendar; both apply ("these, except those") | `allowlist`, `blocklist` | none | [filtering by name](https://calendar-card-pro.alexpfau.com/features/core-settings#filtering-by-event-name) |
| Which field | Filter on title, location or description (a `#family` marker, Google Tasks' URL) | `filter_field` | `title` | [location or description](https://calendar-card-pro.alexpfau.com/features/core-settings#matching-the-location-or-description-instead) |
| Weekdays or weekends | A calendar on weekdays only, or weekends only | `days_of_week` | every day | [weekdays only](https://calendar-card-pro.alexpfau.com/features/core-settings#showing-a-calendar-on-weekdays-only) |
| Rewrite what it says | Replace or remove text in one field; with no pattern, the whole field ("Busy", "Work"), so a work calendar shows that someone's busy, not what with | `replace_field`, `replace_pattern`, `replace_with` | `title`, none, none | [text replacement](https://calendar-card-pro.alexpfau.com/features/core-settings#text-replacement) |
| Hide rows per calendar | Time, location or description off for one calendar | `show_time`, `show_location`, `show_description` | card values | [entity options](https://calendar-card-pro.alexpfau.com/features/core-settings#available-options-for-entity-configuration-objects) |
| Hide a calendar on this device | The toolbar's filter: a menu of checkboxes or a color chip per calendar; nothing is refetched; the menu button carries a dot while any is hidden | `toolbar → legend` | `menu` (or `chips`, `false`) | [showing and hiding](https://calendar-card-pro.alexpfau.com/features/layout-appearance#showing-hiding-calendars) |
| Hide the whole card | Gone when nothing is coming up on its own days; never for a failed calendar | `hide_when_empty` | `false` | [events display](https://calendar-card-pro.alexpfau.com/features/event-content#calendar-events-display) |
| Finished events | See section 2 | `show_past_events` | `false` | |

There is no hide for one event, no "Hidden by you" and no guest mode. The dialog shows an event as stored, so a title rewritten to "Busy" shows in full if `event_tap_action: details` is on ([actions](https://calendar-card-pro.alexpfau.com/features/actions#event-details)).

## 8. Empty days

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Show empty days | Days with nothing get a "✓ No events" row; off, they're skipped and a later day takes the place | `show_empty_days` | `false` (columns and grid `true`) | [events display](https://calendar-card-pro.alexpfau.com/features/event-content#calendar-events-display) |
| Today even if empty | Keeps today's row when other empty days are hidden | `show_empty_today` | `false` | [today when empty](https://calendar-card-pro.alexpfau.com/features/event-content#showing-today-when-it-is-empty) |
| Own wording | Replaces "No events" (and drops the ✓), never translated | `empty_day_text` | "No events" (`src/translations/languages/en.json:13`) | [custom text](https://calendar-card-pro.alexpfau.com/features/event-content#custom-empty-day-text) |
| Color | Drawn at 60% strength by default; a past empty day fades like finished events | `empty_day_color` | theme text | same |
| Nothing at all | One "No events" row on the range's first date | none | none | same |

## 9. Today and now markers

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Today tile | A soft tile in the theme color behind today's number, the number a deeper shade; in columns and grid every number keeps the tile's height so headers stay level | `today_indicator` | `tile` (`src/config/config.ts:70`) | [date tile](https://calendar-card-pro.alexpfau.com/features/layout-appearance#the-date-tile) |
| Other today marks | Dot, pulsing dot, glow, any `mdi:` icon, emoji, image or text ("KW 34"); position and size in list | `today_indicator`, `today_indicator_color`, `today_indicator_size`, `today_indicator_position` | theme color, `6px`, `15% 50%` | [today indicator](https://calendar-card-pro.alexpfau.com/features/layout-appearance#today-indicator) |
| Now mark (list, columns) | An event under way gets a filled clock, "Now ·" before its time, and the time in green; timed events only; appears and goes at the exact start and end (`src/calendar-card-pro.ts:1693`) | `show_now_indicator`, `now_color` | `true`, `#34d399` | [now indicator](https://calendar-card-pro.alexpfau.com/features/event-content#the-now-indicator) |
| Now line (grid) | A line across today's column only at the current time, with a dot at the edge, over block color and under text; hidden outside the drawn hours; moves each minute (`src/config/constants.ts:146`) | `time_grid → show_now_line`, `now_color` | `true`, `#34d399` | [now line](https://calendar-card-pro.alexpfau.com/features/grid-view#the-now-line) |
| "Now" in any language | The word comes from the browser (`Intl.RelativeTimeFormat`, `src/translations/dayjs.ts:82`) | none | none | [now indicator](https://calendar-card-pro.alexpfau.com/features/event-content#the-now-indicator) |
| Today and tomorrow classes | `today`, `tomorrow`, `future-day` on each day for card-mod | none | none | [theming](https://calendar-card-pro.alexpfau.com/features/theming) |

## 10. Progress bars and countdowns

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Countdown | On every upcoming event: clock units later today, "tomorrow", then "in 3 days", "in a month"; gone once it starts. On every event, not chosen per event | `show_countdown`, `show_countdown_allday` | `false`, `true` | [countdowns](https://calendar-card-pro.alexpfau.com/features/event-content#countdown-display) |
| Countdown placement | On the time row after a middot (list, columns); after the time on a tall enough grid block; split rows count to their own day | none | none | [progress and countdown](https://calendar-card-pro.alexpfau.com/features/column-view#progress-bar-countdown) |
| Progress bar | On events under way, how much has passed; multi-day events fill over the whole span; never on the same event as a countdown | `show_progress_bar` | `false` | [progress bars](https://calendar-card-pro.alexpfau.com/features/event-content#progress-bar-display) |
| Bar look | Color (or `accent`), height, width: 60 px on the list time row, 80% of a column on its own row, full width in grid | `progress_bar_color`, `progress_bar_height`, `progress_bar_width` | secondary text (grid `accent`), `0.75em`, per layout | same |

## 11. Interactions

### Card tap and hold

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Tap on the card | Any Home Assistant action (`more-info`, `navigate`, `url`, `perform-action`, `toggle`, `assist`, `fire-dom-event`) or the card's own `expand` and `refresh` | `tap_action` | `none` | [available actions](https://calendar-card-pro.alexpfau.com/features/actions#available-actions) |
| Hold | The same choices; a hold is 500 ms and draws a disc under the finger (`src/config/constants.ts:58`, `src/interaction/feedback.ts:22`) | `hold_action` | `none` | same |
| Refresh as an action | Reloads every calendar now; the corner spinner turns at least once, then a green check or a red alert | `tap_action` or `hold_action: refresh` | none | [refresh from a tap or hold](https://calendar-card-pro.alexpfau.com/features/actions#refreshing-from-a-tap-or-hold) |
| Feedback | Home Assistant's ripple on the card; a wash over a tapped event; haptics only for actions Home Assistant runs | none | none | [actions](https://calendar-card-pro.alexpfau.com/features/actions) |

### Tapping an event, editing and deleting

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Event details | A tap opens Home Assistant's own event dialog (full description, place, how it repeats) in every layout, all-day banners included; empty-day rows and `+N` aren't tap targets | `event_tap_action: details` | `none` | [tapping an event](https://calendar-card-pro.alexpfau.com/features/actions#tapping-an-event) |
| Edit and Delete | Offered in that dialog where the calendar's integration allows; for a repeating event Home Assistant asks which occurrences; the card refetches after a save | `allow_event_edit`, `allow_event_delete` (only narrow) | `true`, `true` | [editing and deleting](https://calendar-card-pro.alexpfau.com/features/actions#editing-deleting-events) |
| Withheld | No Edit or Delete on a merged shared event, a failing calendar's cached events, an event without a unique ID, or (Edit only) one stored without an end (`src/interaction/event-details.ts:115`) | none | none | [when the card leaves them out](https://calendar-card-pro.alexpfau.com/features/actions#when-the-card-leaves-them-out) |
| Add button | A + in the toolbar opens Home Assistant's new-event dialog with the first writable calendar chosen and today (or the first day on screen) as the date (`src/interaction/add-event.ts:89`); only shown when a calendar accepts new events | `toolbar → add_event` | `true` with the toolbar | [add event button](https://calendar-card-pro.alexpfau.com/features/actions#add-event-button) |
| Every card updates | After a save, every CCP card on the page showing that calendar refetches (`src/interaction/calendar-changes.ts:24`, `:66`) | none | none | [Home Assistant's own dialogs](https://calendar-card-pro.alexpfau.com/features/actions#home-assistants-own-dialogs) |
| Fallback | If Home Assistant's dialog code can't load in 10 s (`src/interaction/ha-calendar-dialogs.ts:42`), details open the calendar's more-info and add opens the Calendar panel | none | none | same |

What each integration allows, by CCP's table ([source](https://calendar-card-pro.alexpfau.com/features/actions#what-each-integration-allows)):

| Integration | Add | Edit | Delete |
|---|---|---|---|
| Local Calendar | Yes | Yes | Yes |
| Google Calendar | Yes | No | Yes |
| CalDAV (iCloud) | Yes | No | No |
| Read-only feeds | No | No | No |

### The toolbar

`toolbar: { show: true }` adds two rows: the commands (filter, add, view switcher, reset, refresh), then the month with its arrows. Each control is a gray pill, 36 px tall in the top row and 24 px in the month row, each answering a 44 px press. Defaults are at `src/config/config.ts:182` to `:190` ([header toolbar](https://calendar-card-pro.alexpfau.com/features/layout-appearance#header-toolbar)).

| Control | What it does | Option | Default |
|---|---|---|---|
| Paging | ‹ › move by the days on screen; a house button returns home and fills green for a moment; the month opens the browser's date picker; away from home, finished events show and `hide_when_empty` is off; 16 recent pages kept in memory only | `navigation` | `true` |
| View switcher | List, Columns, Grid, as words or pictograms by width; a layout that won't fit is dimmed; each browser remembers its choice per card setup (50 kept) until the card is edited | `view_switcher` | `true` |
| Calendar filter | Section 7 | `legend` | `menu` |
| Reset | For a shared screen: one press brings back the home days, the set layout, every calendar and a collapsed card; hidden while there's nothing to undo; shows a check | `reset` | `false` |
| Refresh | Reloads now; its icon turns while loading, then a green check or red alert | `refresh` | `true` |
| Add | See above | `add_event` | `true` |

In the editor's preview and in dashboard edit mode, nothing in the toolbar works and events aren't tap targets, so arranging a dashboard can't change a calendar ([actions](https://calendar-card-pro.alexpfau.com/features/actions#home-assistants-own-dialogs)). The card never goes back by itself: a layout or hidden calendar stays until Reset, an edit or (for a page) a reload.

## 12. The visual editor

([editor](https://calendar-card-pro.alexpfau.com/features/editor))

- **Panels and preview:** nine panels (Calendars, Layout, Time Range & Content, Card & Header, Day Header, Events, Separators, Weather, Actions & Refresh) with a live preview. Options appear only when they apply.
- **Search and Customized only:** a search box finds any option by name or YAML key ([search](https://calendar-card-pro.alexpfau.com/features/editor#search-customized-only)). "Customized only" hides everything left at its default.
- **Two layout choices:** **Card Displays** (the layout the card opens with) and **Editing Settings For** (All Layouts, List, Columns or Grid), which edits one layout's block without switching the card ([options for the selected view](https://calendar-card-pro.alexpfau.com/features/editor#options-for-the-selected-view)). Each layout shows its effective values and has its own Reset.
- **Per calendar:** a panel for each calendar, with **Duplicate** to list a calendar twice (one calendar can't be picked twice otherwise) and **Remove** ([per-calendar panels](https://calendar-card-pro.alexpfau.com/features/editor#per-calendar-panels-actions)). The label control picks text, an icon or an image, with a person picker and "Follow Home Assistant".
- **Upgrades:** a one-time choice when an older card's settings are ambiguous ([upgrading](https://calendar-card-pro.alexpfau.com/features/editor#upgrading-a-card-from-before-v5)). Retired options are removed on save, and older names are mapped (`src/config/config.ts:285`).
- **Warnings:** under Title for a bad template, and for compact settings that do nothing.
- **Loading:** the editor is a second file, loaded only when opened ([v4.0](https://calendar-card-pro.alexpfau.com/guide/whats-new)).

## 13. Languages

| Feature | What it does | Option | Default | Docs |
|---|---|---|---|---|
| Card languages | 36 (`src/translations/languages/`, Korean added in v5); follows Home Assistant's language, falls back to English. The card's own strings are few: day and month names, "all day", "until", "ends today", "No events", "Couldn't load:" (`src/translations/languages/en.json:2` to `:16`) | `language` | Home Assistant's | [contributing](https://calendar-card-pro.alexpfau.com/contributing#adding-translations) |
| Editor languages | 12 (English plus 11 files in `src/rendering/editor/translations/`), string by string fallback to English | none | none | same |
| Borrowed words | "Now", relative times and condition names come from the browser and Home Assistant; the date picker and Home Assistant's dialogs speak their own language, not the card's | none | none | [now indicator](https://calendar-card-pro.alexpfau.com/features/event-content#the-now-indicator) |
| Right to left | Bars, arrows, title scrolling and grid wrapping follow text direction (v3.2) | none | none | [what's new](https://calendar-card-pro.alexpfau.com/guide/whats-new) |
| Hyphenation | Long compound words wrap with hyphens (titles, locations; not weather words) | none | none | same |

## 14. Accessibility

What CCP itself claims and the code shows. Nothing was tested with a screen reader.

- **Keyboard:** with `details`, each event is a button reached with Tab and opened with Enter or Space, described by its day, so two same-titled events on different days differ (`src/rendering/render.ts:683`, `src/rendering/grid.ts:886`). The card stays in the Tab order for its own `tap_action` ([where you can tap](https://calendar-card-pro.alexpfau.com/features/actions#where-you-can-tap)).
- **Grid blocks:** they keep the full event (title, people, times) in their accessible name even when the visible text is clipped or empty (`src/rendering/grid-accessibility.ts:1`, [short titles](https://calendar-card-pro.alexpfau.com/features/grid-view#short-timed-titles)).
- **Pictures:** a person's picture carries their name; icon and emoji labels are skipped as decoration.
- **Toolbar:** the switcher and chips are toggles with `aria-pressed` (`src/rendering/toolbar.ts:526`, `src/rendering/legend.ts:520`). The date range is announced after each page (`aria-live`, `src/rendering/toolbar.ts:660`). There is a focus ring in the theme's primary color, every control has a 44 px press area, and controls are named with Home Assistant's own words.
- **Motion:** reduced motion stops title scrolling and the Reset fade (`src/rendering/styles.ts:946`, `:2114`). Title scrolling is off by default.
- **Contrast:** text in the calendar's color is mixed toward the theme's text color. The default now line is a "quiet" 1.9:1 on white by the code's own comment (`src/config/config.ts:97` to `:102`).
- **Loading and errors:** the loading spinner and the failed-calendar line are `role="status"` (`src/rendering/render.ts:194`, `:235`).

## 15. Refresh and loading a user would see

([performance](https://calendar-card-pro.alexpfau.com/features/performance))

| Behavior | What a person sees | Option or constant | Value |
|---|---|---|---|
| Cached first | On opening a dashboard, the last loaded events (up to 24 hours old) draw at once, then are swapped for fresh ones | `src/config/constants.ts:34` | 24 h |
| Refetch on appearing | A background refetch whenever the card appears, unless data is under 5 s old | `refresh_on_navigate` (`src/config/constants.ts:26`) | `true`, 5 s |
| Regular refresh | Counted from the last load; cards showing the same calendars and dates share one cache (v5 fixed a bug that made it twice as long) | `refresh_interval` | `30` min (`src/config/constants.ts:19`) |
| Back to the tab | Refetch when a hidden tab is shown again after 5 minutes (`src/calendar-card-pro.ts:2872` to `:2889`) | `src/config/constants.ts:75` | 5 min |
| All at once | Every calendar requested in parallel; a load takes as long as the slowest (CCP: about 160 ms, not about a second, for seven calendars) | none | none |
| Slow or failed calendar | Counts as failed after 30 s; named at the foot ("Couldn't load: Ben") in the theme's error color; its last events stay up to 24 h; retried after 1, 2, 4, 8 minutes and so on, up to `refresh_interval` | `src/config/constants.ts:41`, `:84` | 60 s first retry, 30 s timeout |
| Nothing cached | "Loading calendar events..." text, only when there's nothing to draw (`src/rendering/render.ts:255`) | none | none |
| Refreshing with events on screen | A small spinner in the corner (or the toolbar's refresh icon turns); events stay put | none | none |
| On time without a fetch | The Now mark, finished events leaving, and `hide_when_empty` update at the exact start or end of an event; the grid's now line every minute; an all-day expiry or past empty day waits for the next repaint | none | none |
| After a change | A save in either dialog refetches every card on the page showing that calendar | none | none |
| Empty answers | A calendar that returns nothing is cached only 15 s (`src/utils/events.ts:523`) | `src/config/constants.ts:28` | 15 s |

## 16. What is new in v5.0.0

Released 2026-10-31, answering "more than twenty feature requests, some of them open since March 2025" ([release notes](https://calendar-card-pro.alexpfau.com/RELEASE_NOTES)).

**Changes that alter an existing card:**
- the today tile is on by default (`today_indicator: false` for the old look);
- calendar colors without a setting follow the theme's primary color, no longer a fixed blue;
- the Now mark is on by default;
- the accent bar is its own element (`.event-accent-bar`), so card-mod rules on `.event` borders stop reaching it.

**New:**
- **Grid view:** the hour axis, overlaps drawn on top or as lanes, `+N`, the now line, the all-day band with shaped banners, four families of rules, weekend shading, a narrow fallback, and its own defaults.
- **The toolbar:** paging and the date picker, the List / Columns / Grid switcher, the calendar filter (menu or chips), refresh, add, and Reset.
- **Days per layout:** a different `days_to_show` in each layout.
- **Events from the card:** add, open, edit and delete through Home Assistant's dialogs, with `allow_event_edit` and `allow_event_delete`.
- **Smaller additions:**
  - the today tile, the Now mark and `show_empty_today`;
  - the theme accent and rounded bars;
  - `event_gap`, and `accent` as a text color;
  - `scroll_long_titles` and `past_event_opacity`;
  - weekends taken from Home Assistant's country;
  - per-calendar splitting in column view;
  - night icons from `is_daytime`.
- **Loading:** cached events first, parallel fetches, failed calendars named with retries.
- **Also:** Korean, six example stories, and a rebuilt editor workspace (Card Displays and Editing Settings For).

**Fixes worth knowing** ([what's new](https://calendar-card-pro.alexpfau.com/guide/whats-new#latest-release-v5-0)):
- Refresh ran at twice `refresh_interval`, and a calendar that never answered could stop refreshes altogether.
- "No upcoming events" became "No events", and past empty days now fade.
- A zero-length event read `9:41 - 9:41`.
- A card with no actions still acted like a button.
- A second finger could steal a hold.
- A card switched off screen could restart its timers.

## 17. Version history highlights

Dates are from the repo's tags; v1.x is from `docs/guide/whats-new.md`. There is a nine-month pause between v3.1 (June 2025) and v3.2 (March 2026), then nine releases from August to October 2026 *(inferred: the project is very active right now)*.

| Version | Date | Highlights |
|---|---|---|
| v1.0 | January 2025 | First release: several calendars with their own colors, compact and expandable, caching. Fixed all-day events landing on the wrong day west of UTC |
| v1.1, v1.2 | early 2025 | Follows Home Assistant's language; ongoing multi-day events on every day with "Ends today"; dates ordered by language; 24 languages |
| v2.0 | early 2025 | Rewritten on `ha-card` (card-mod and themes work); per-calendar accents, backgrounds and labels; custom start date; max height with scrolling |
| v2.1 | by 2025-03-26 (v2.1.2) | Week numbers and separators; per-calendar event limits; fixed height |
| v2.2 | 2025-03-28 | Blocklist and allowlist; duplicate filter; country removal; icon and image labels. v2.2.1 sorts same-day all-day events alphabetically |
| v2.3 | 2025-04-02 | Countdowns; weekend colors; relative start dates; hyphenation |
| v2.4 | 2025-04-07 | Today indicator (dot, pulse, glow, icon); today colors; progress bars; split multi-day events; finer compact controls |
| v3.0 | 2025-05-04 | Visual editor; weather; time format detection; renamed options |
| v3.1 | 2025-06-22 | Bulgarian; a `tomorrow` class |
| v3.2 | 2026-03-27 | Descriptions; UV index; icon alignment; label icon color; right to left; events stay during refresh with a small spinner |
| v3.3 to v3.5 | 2026-08-07 to 08-10 | More languages and Home Assistant 2026.5 editor fixes; all-day countdown control; daily weather fallback; `hide_when_empty`; empty-day text; `start_of_week` and weekday start dates; templated titles; card-picker suggestions; a failed calendar no longer looks empty |
| v3.6 | 2026-08-14 | Documentation site; a stray `-` in `entities` no longer breaks the card |
| v4.0 | 2026-08-18 | Column view; rebuilt editor with search and per-layout settings; editor split off (41% smaller); duplicate requests removed; line caps per field; weather in columns; week-number and clock-format fixes |
| v4.1 | 2026-09-02 | All-day pill; Home Assistant calendar colors and icons; a person's picture as a label; `event_type`; `allday_expires_at`; `days_of_week`; birthday ages; Teams icon; `filter_field`; text replacement |
| v4.2 | 2026-09-12 | A shared event shows every calendar's label; `duplicate_accent_color`; countdowns follow calendar dates; blocklist and allowlist both apply |
| v5.0 | 2026-10-31 | Section 16 |

## 18. First pass against the house board

This is all *(inferred)*: a quick check against the decisions in [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37), the prototype READMEs and [CONTEXT.md](../../../CONTEXT.md), to seed the issue's gap list.

**Already matched or beaten by a decision:**
- **Colors and faces:** a color per person. Names in words beat faces, since reviewers rejected pictures as "a code to learn" ([marks](../../../prototypes/marks/README.md)).
- **Shared events:** a plan on two calendars shows once, in Us's green with both names. This is CCP's `filter_duplicates` plus `duplicate_accent_color`, decided independently.
- **Work:** shown as a labeled block, like `replace_with: Work`.
- **Countdowns:** chosen per event in its sheet, quieter than CCP's countdown on every event.
- **Paging:** Month's ‹ › and Today, and the phones' strip, cover CCP's paging.
- **Filter:** the person filter in Month and Upcoming covers CCP's calendar filter.
- **Reset:** the wall's 5-minute idle reload covers CCP's Reset.
- **Event sheet:** place and details are shown and changed in the sheet. For iCloud the house write path edits and deletes, which CCP can't.
- **Lists:** CCP's compact cut shows nothing, while the board's "+N more" says how many.
- **Motion:** the motion rules (no motion at rest, reduced motion) beat `scroll_long_titles`.
- **Beyond CCP entirely:** month, lists, notes, dinners, voice adding, new dots, clashes, Hide with Undo, and settings per person rather than per browser.

**Gaps to put to the owner** (they'd notice them on the wall or a phone):
1. **An hour-axis day or week with a now line.** CCP's grid and Skylight's Day view both draw "time slots" with a current-time bar ([Skylight note](../skylight-calendar.md)). The decided resting face uses day columns as lists, with Now and Next. Keep-or-skip: perhaps as a Day view opened from a tapped day, not the resting face.
2. **The forecast beside each timed event.** Skylight's product page claims this too. The board has a daily high and low and a stated rain line.
3. **Ages on birthdays from `YEAR=` in the description.** Cheap (`src/utils/event-age.ts`, about 180 lines with comments). The map notes there's no birthdays calendar yet.

**Gaps that are the agent's call** (match them; the owner wouldn't choose):
- Name a calendar that failed to load, keep its last events, and retry with backoff (section 15).
- Show a zero-length event's time once.
- Use CCP's multi-day wording rules.
- Treat an all-day event's end date as exclusive, and keep a timed event with a bad end.
- Give each event an accessible name that includes its day.
- Repaint at the next event boundary rather than polling.
- After any write, refresh every copy on the page.

**Where CCP is weaker, so not to copy:**
- `+N` reachable only by hover.
- Compact mode and dropped narrow days unmarked.
- The quiet 1.9:1 default now line.
- The dialog showing a privacy-rewritten title in full.
- Choices lost whenever the card's configuration changes.

## Sources

- Calendar Card Pro repository, commit `75bf292` (2026-10-31), [github.com/alexpfau/calendar-card-pro](https://github.com/alexpfau/calendar-card-pro), MIT ([LICENSE](https://github.com/alexpfau/calendar-card-pro/blob/main/LICENSE), [NOTICE](https://github.com/alexpfau/calendar-card-pro/blob/main/NOTICE): Lit BSD-3-Clause, Home Assistant frontend Apache-2.0 patterns).
- Documentation site, [calendar-card-pro.alexpfau.com](https://calendar-card-pro.alexpfau.com/): [configuration reference](https://calendar-card-pro.alexpfau.com/reference/configuration), [features](https://calendar-card-pro.alexpfau.com/features/editor), [example stories](https://calendar-card-pro.alexpfau.com/reference/examples), [release notes](https://calendar-card-pro.alexpfau.com/RELEASE_NOTES), [what's new](https://calendar-card-pro.alexpfau.com/guide/whats-new).
- [GitHub releases](https://github.com/alexpfau/calendar-card-pro/releases) (v5.0.0 marked Latest, 31 Oct).

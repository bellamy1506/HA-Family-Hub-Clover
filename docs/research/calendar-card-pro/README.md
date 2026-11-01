# Calendar Card Pro and the other Home Assistant calendar cards

Research for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103), 2026-11-01, on the [map](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37). The owner asked for it: "I don't want to be worse than other calendars running through home assistant either", with the reports kept in full for build sessions.

Source read: [Calendar Card Pro](https://calendar-card-pro.alexpfau.com/) v5.0.0 at commit `75bf292` ([source](https://github.com/alexpfau/calendar-card-pro), MIT, released 2026-10-31). Ten agents researched it: six researchers, then a gap analysis, a borrow list, and a skeptic for each of those two. Each skeptic's corrections are appended to the report it checked, under "Verification".

## Answer

- **The decided house board already matches or beats Calendar Card Pro (CCP) on most things.** Out of 96 features and items classified, it beats CCP and every other card surveyed on:
  - Hide with Undo, new dots and clashes;
  - per-person settings;
  - editing iCloud events (CCP can only add to CalDAV calendars);
  - voice, Month, Lists, and "+N more".
- **About 34 gaps remain after the skeptic's corrections.** Eight would show on the wall or a phone, so they go to the owner:
  - the first (what shows when a calendar can't be reached) was asked with this research;
  - the other seven go to the grilling ticket [Which Home Assistant calendar card features does the house board take on?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/104).
  - The rest are the agent's calls, listed in [gaps.md](gaps.md) as A1 to A22 and noted as build items.
- **Borrow about 20 small rules and functions, roughly 250 plain lines,** mostly for slice 1 ([borrow.md](borrow.md)). Nearly every one is a bug CCP shipped and then fixed, so its release notes and tests are worth as much as its code. Lit, the build, the editor, the 36 languages and the hour grid stay out.
- **Its users' most repeated complaint is the one to design against:** a wall tablet showing "No upcoming events" or an old week while a desktop browser was right. Long-running tablets also crashed from a weather subscription leak ([community.md](community.md)).
- **New fact, read today:** the house's forecast (`weather.forecast_home`) gives 6 daily days and 48 hourly hours, with no chance of rain. So the 10 days of weather decided for Month can't be met as is ([gaps.md](gaps.md), Q3).

## The reports

| Report | What it covers |
|---|---|
| [features.md](features.md) | Everything CCP does that a person would notice, about 200 options, grouped; what's new in v5 |
| [code-ui.md](code-ui.md) | Its structure, Lit, rendering and redraws, layout CSS, taps, editor, languages, bundle size, tests; what ports to plain modules |
| [code-data.md](code-data.md) | Fetching, caching, refresh, all-day, multi-day and repeating events, time zones, merging, filtering, errors, weather; compared with the house board's data path |
| [community.md](community.md) | GitHub issues and releases and the Home Assistant forum: praise, complaints, requests, wall-tablet bugs, Home Assistant calendar pitfalls |
| [landscape.md](landscape.md) | Atomic Calendar Revive, Week Planner Card, Daylight, and the Skylight-style family cards: a feature matrix |
| [theming.md](theming.md) | How CCP colors calendars, light and dark, its example looks, and what they mean for the house board's colors; pictures in [shots/](shots/) |
| [gaps.md](gaps.md) | Every feature classified against the decided house board (covered, better, not wanted, gap), the owner questions, the agent's calls A1 to A22 |
| [borrow.md](borrow.md) | What to borrow, with file and line, port size, slice and tests; what not to borrow; the license steps for MIT code in the GPL-3.0 fork |

## What the skeptics corrected

- **Already decided, not gaps:**
  - declined invitations, at #66 and #39's supervised check;
  - the redraw gate, at #72;
  - asking again after an iCloud save, at #39;
  - tabular figures, at #72;
  - one tap listener, at #44;
  - the time-zone and clock-change checks, at #44.
- **Reclassified as gaps, both the agent's calls:**
  - an all-day item such as trash night has no decision;
  - nothing checks the house board before a Home Assistant update, though CCP's editor broke three times on updates and the house board uses `ha-icon`.
- **Q8 (how colorful the blocks are)** reopens #91's 17% blocks and the 0.45 note line. Q5 (a day on hours) changes the tapped-day panel decided at #79 and #50, rather than only adding to it.
- **In borrow.md:**
  - Don't copy CCP's `stripHtmlTags` as written, because it joins lines at `<br>`.
  - Arm the minute tick from epoch time, never local date fields, or the clock freezes for an hour on the fall-back night.
  - Write the navigate event as a `CustomEvent`. CCP's idiom comes from Home Assistant's frontend, which is Apache-2.0.
  - A NOTICE file must copy CCP's whole MIT license.

## Not read

- Reddit post bodies and comments: blocked from here and from the wall tablet. Only titles and scores were seen.
- GitHub's API, so there are no HACS download counts; stars were used instead.
- A German video review of v5.
- Safari: the iPhones and the wall tablet weren't measured.

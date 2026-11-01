# What still depends on the week card, and what changes when it goes

Research note, 2026-11-01, for fork issue [#96](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/96) on the map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37). It feeds the switch-over plan, [How does each copy move to the house board, and back if it fails?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/99). This note lists the steps; it doesn't take any. Nothing in Home Assistant, on the tablet or on the phones was changed.

**Sources:**
- The fork's `main` at `eee6eb9`, the code the house runs.
- The house's Home Assistant, read only through the connector on 2026-11-01: dashboards, automations, scripts, helpers, Assist exposure, Family Hub's options and stored settings, the list of copies.
- The house repo `bellamy1506/Clover-Home` at `a93a9ea`.
- The decisions linked in each row.

Code is cited as file and line range on `main`. *(inferred)* marks a judgment the sources don't state.

## The answer

**One dashboard runs the week card:** `/family-hub`. Four copies open it: the tablet's, through Fully's Start URL; two on the owner's iPhone; and one opened once on 10/25 with no user recorded. **Jenn's iPhone has no copy:** no copy has recorded her user since copies began recording users on 10/26, so her phone has nothing to retire. She only picks the house board.

Around the dashboard, these depend on the week card:
- Board private and its automation.
- The note script's 9:00 time and rollover marker.
- Family Hub's rollover, which runs on its option `reminders_todo_entity`.
- The Local Calendar `calendar.us` and the event script that writes to it.
- Nine Family Hub switches exposed to Assist.
- 60 per-copy entities.
- 12 Family Hub card files that Home Assistant loads for its dashboards.
- Records in both repos: the voice guide, its printed copy, J006, J008, both glossaries, and the fork's sandbox.

**Missing from #96's list, and order-setting:**
1. **The rollover marker must go when a note loses its time.** Otherwise Family Hub's poller turns a past date-only note back into a timed one at 12:00 am.
2. **The week card can't show the new notes.** It shows a date-only note a day early and never shows an undated (someday) one. While rollover runs, notes never get old enough for Later. So the notes change belongs to the day the last copy leaves the week card.
3. **Deleting Board private while `/family-hub` still serves as a fallback** makes that board show Work always, Guest mode included.
4. **Two calendars named Us.** Renaming iCloud's Home to Us gives Assist two calendars with that name until `calendar.us` comes off.
5. **The week card's own adds go to `calendar.us`.** After Us moves, a copy sent back to the week card adds to a dead calendar unless its columns change.
6. **Some leftovers can't be removed by hand.** Per-copy settings have no delete path, and Family Hub registers its card files again at every start. They stay until the code cleanup.
7. **The planned house reminders sync is shaped for the week card:** 9:00 times, past-due items moved to today. That would break needs-you's "up to 3 days past due" rule.

## Checklist

Grouped by when each step happens; #99 sets the actual order and the fallback.

**Columns:**
- **Who:** *Agent* means a session acting through Home Assistant. *Will* and *Jenn* mean each adult on their own iPhone. *Wall* means someone at the tablet.
- **Explain first:** a Home Assistant or tablet change that is explained to the owner before it's made.

| # | Moving part | What it does today | At the switch-over | Who | Explain first | Undo | Waits for |
|---|---|---|---|---|---|---|---|
| **Before any copy moves** | | | | | | | |
| 1 | Fork `main` with the house board, installed through HACS | Runs the week card only (`main` `eee6eb9`) | Install, after a backup | Agent, after the owner approves the merge | Yes | Reinstall the previous commit | The house board's first slices; CI green |
| 2 | Dashboard `/house-board` | Doesn't exist; the dashboards are `map` and `family-hub` | Create it: one panel view with the house board card, open to non-admins, a sidebar title ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169), [#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)). `/family-hub` stays as it is | Agent | Yes | Delete it | 1 |
| 3 | Fully's Enable Microphone Access (`microphoneAccess`) | Off; the test put it back off ([#85](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/85#issuecomment-6550433680)) | On, and left on | Agent (`fully_kiosk.set_config`) | Yes | Turn it off | The wall's listening piece |
| **The wall moves** | | | | | | | |
| 4 | Fully's Start URL | `http://192.168.4.58/family-hub` (J006); the page shown is `/family-hub/family-hub` (`sensor.clover_tablet_current_page`) | Point it at `/house-board`, then press Load start URL (`button.clover_tablet_load_start_url`) | Agent | Yes | Set it back: this is the wall's fallback | 2, 3, and the slices #99 requires |
| 5 | Fully's Auto Reload on Idle | Not recorded anywhere | Read its value first. The house board goes back to its resting face after a minute ([#79](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79#issuecomment-6548787708)) and refreshes itself ([#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)), so it isn't needed. A reload costs a fresh open, which is [#97](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/97)'s question | Agent (Claude control on the tablet) | Only if changed | One setting | 4 |
| **The phones move** | | | | | | | |
| 6 | The owner's week card copies (entities `will_*`, `iphone_*` and `iphone_*_2`) | Two copies are his user, at home and through Cloud, last opened 10/29 and 10/30. A third opened once on 10/25 with no user recorded | Profile > Dashboard: House board, not "Auto". Then force-close the app once ([#67](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/67#issuecomment-6537438807)) | Will | No (his own profile setting) | Pick Family Hub again, force-close | 2, the phone layout, refresh on return |
| 7 | Jenn's iPhone | Has the app (`device_tracker.jenns_iphone`), but no copy records her user. The 10/25 copy in row 6 might be hers *(inferred; can't be told)* | The same Profile > Dashboard step; nothing to retire | Jenn | No | Back to "Auto" | As 6 |
| 8 | Phone Home Screen icons, widgets and Open Page actions pointing at `/family-hub` | None recorded. Ask Clover goes through Assist and doesn't depend on the board | Each adult checks; repoint any to `/house-board` with Open Page | Will, Jenn | No | Easy | 6, 7 |
| **Us moves to iCloud** (together with the iCloud write path, [#41](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/41)) | | | | | | | |
| 9 | iCloud's Home calendar (`calendar.home`) | Shows as the board's Home column; create only (`supported_features` 1) | **Owner:** check Home isn't his default for events and invitations, then look over its past events. Rename it Us, share it to Jenn's Apple Account with Allow Editing on and Public off. **Jenn:** turn iCloud Calendar on, accept, keep Gmail as default. **Both:** Shared Calendar Changes off ([#65](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/65#issuecomment-6537369708), [owner](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/65#issuecomment-6537654826)) | Will, Jenn | No | Renaming back and unsharing are easy. **One-way:** once shared, Jenn has seen the calendar's whole past | The write path built and checked ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)); the house board's echo with Undo; the wall on the house board |
| 10 | Two calendars named Us | `calendar.us` is "Us" and exposed to Assist. After the rename, `calendar.home` is "Us" too, once CalDAV reloads | In one step: reload the CalDAV entry so `calendar.home` takes the name, and take `calendar.us` off Assist. Clover's prompt names "the Us calendar" and needs no other change | Agent | Yes | Easy | 9 |
| 11 | `script.board_add_event` | Adds to `calendar.us`. Its description says "Not for iCloud calendars" | Target `calendar.home`, and drop that phrase from the description | Agent | Yes | Easy | 10 |
| 12 | The two-minute check | — | A made-up event added at the wall, both phones looked at, then Undo. Add one timed and one all-day voice add: the script sends local times with no offset, so check they land at the right hour *(inferred risk)* | Wall, Will, Jenn, agent | No | — | 9 to 11 |
| 13 | `calendar.us` (Local Calendar) | Empty: no events from Aug 2026 to Feb 2027 (read today) | Remove the Local Calendar entry. Family Hub's own cleanup then touches only its notification settings, which are empty (`__init__.py` 742–810) | Agent | Yes | Re-add an empty Local Calendar; nothing is stored in it | 12, and 14 if the week card is still a fallback |
| 14 | The week card's columns: two copies in `/family-hub` | Will, Home, Us (`calendar.us`), Work. Its add form starts on the first column it can change and delete, so today that's Us (card 24338–24358) | If the week card stays a fallback after Us moves: drop the `calendar.us` column, and rename Home to Us and put it first. Its adds then land on the iCloud Us, but it can't fix or undo them there; it can only add to iCloud ([J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md#built-in-home-assistant)). Otherwise retire `/family-hub` now (row 22) | Agent | Yes | Easy; the config is mirrored in the fork's `tests/sandbox/house_config.json` | 9 |
| **The notes change** ([#61 Q5](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536918104)) | | | | | | | |
| 15 | Open notes in `todo.us_notes` | 0 open today. Each note added by voice or the board is due at 9:00 and carries `<!--rollover:1-->` | One `todo.update_item` per note: `due_date` set to its day, and the description without the marker. **Both changes together:** a past date-only note that keeps the marker gets re-timed to 12:00 am by the poller (row 18) | Agent | Yes | An agent puts back the 9:00 time and the marker; nothing else is lost | The house board's notes and Later; no copy still on the week card. The week card shows a date-only note a day early and an undated one never (card 9744–9775). Its own planners read the code the same way ([reminders research](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J008-research/reminders-and-calendars.md), lines 129–130) |
| 16 | `script.board_add_note` | Sets `due_datetime` to the day at 09:00 and adds the marker | Set `due_date` instead, with no marker. Accept "someday" for Later: a note with no date | Agent | Yes | Easy | Same step as 15 |
| 17 | Clover's prompt (the "Claude conversation" subentry) | "Anything else to remember … goes on with the Board add note script" | One line so that "someday" or "later" reaches the script's someday | Agent | Yes | Easy | 16 |
| 18 | Family Hub's rollover | Every 5 minutes the notification poller reads the list in the option `reminders_todo_entity` (`todo.us_notes`). It moves each marked note left on a past day to today, keeping its time (`__init__.py` 10418–10566, 10795–10850). A date-only due counts as midnight, because Home Assistant's `parse_datetime` reads "2026-11-02" as 00:00 (checked by running ciso8601, which it calls first) | Once the markers are gone, rollover moves nothing. Then clear the option so the poller stops reading the list; it no longer pushes (every profile has reminders off) but logs a warning for each due note. Every week card open sets the option again (card 9870–9879), so clear it only after the last copy leaves | Agent (Family Hub's options) | Yes | Set it back | 15, and no week card open anywhere |
| **Board private and the privacy lock** ([#87](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631)) | | | | | | | |
| 19 | `automation.board_private_follows_guest_mode` | On. Guest mode on or off turns Board private on or off. Nothing else reads Board private | Delete it first | Agent | Yes | Recreate it from J006 and this note | `/family-hub` retired, or its private copy and tile removed; the house board's Guest mode hiding Work at the wall |
| 20 | `input_boolean.board_private` and the "Hide work calendars" tile | Off. It switches between the two conditional copies of the week card | Delete it after 19. If `/family-hub` is still there, Home Assistant reads the missing switch as "unknown", which isn't "on". So the copy with Work always shows and the tile reads unavailable (HA frontend `validate-condition.ts`, `checkStateCondition`) | Agent | Yes | Recreate the helper | 19 |
| 21 | Family Hub's privacy lock: `switch.family_hub_privacy_mode`, plus each copy's "Participates in privacy mode" and "Screensaver enabled" switches | Off, and no PINs are set. All 9 are exposed to Assist, so "turn on privacy mode" would lock the week card | Leave them off, and take them off Assist when the week card retires. The house board ignores the lock | Agent | Yes | Easy | 22 |
| **The week card retires** | | | | | | | |
| 22 | `/family-hub` dashboard | Page 1: the two week cards and the tile. Page 2: House reminders (`todo.house_reminders`, empty until the sync is built) | Delete it, or first hide it from the sidebar for the fallback period (#99). House reminders move to the house board's Lists, House section ([#76](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/76#issuecomment-6546575045)) | Agent | Yes | Recreate it from the sandbox mirror | #99's fallback period; the house board's Lists; 19 and 20 in the same step |
| 23 | Per-copy settings and copy sync: 4 copies with 15 entities each (`*_family_hub_*`, `*_device_name`, `*_this_device_s_theme`, the two switches), plus their records in Family Hub's device settings store | Each copy keeps its own view settings and theme, synced per user | Leave them dormant. There is no delete command (`device_settings_websocket_api.py` 307–848), and Family Hub doesn't let Home Assistant delete its devices. Disable the entities if wanted; the code cleanup removes them. Don't delete the store | Agent | Yes, if disabled | Re-enable | 22 |
| 24 | The 12 Family Hub card files, each registered as a dashboard resource, the week card's 27,022 lines among them | Loaded with every dashboard, `/house-board` included *(inferred from how Home Assistant loads resources)* | Nothing by hand: Family Hub registers them again at every start (`__init__.py` 12192–12262, 12586–12680). They leave with the code cleanup (out of scope on the map). Their load cost is #97's question | — | — | — | Code cleanup |
| **Records** | | | | | | | |
| 25 | House repo: [VOICE-GUIDE.md](https://github.com/bellamy1506/Clover-Home/blob/main/VOICE-GUIDE.md) and its printed copy, `print/voice-guide.pdf` | Line 48 points Jenn to the "Hide work calendars" button. Line 55 says Guest mode "hides work calendars on the kitchen board" | Rewrite both when the wall moves, since that's what Jenn sees. Then run `tools/printables.py` and reprint | Agent | No | Easy | 4, 20 |
| 26 | House repo: J006, J008 and CONTEXT.md | J006: the Family Hub board table, Board private paragraph, Board voice rows, tablet Start URL and board settings. J008: plan item 2 and Q7/Q17. CONTEXT.md: Board, Us calendar, Us notes, Board private | Update in the same session as each step | Agent | No | Easy | Each step |
| 27 | House repo: the reminders sync design ([reminders research §6](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J008-research/reminders-and-calendars.md), J008 build step 4; not built) | Shaped for the week card: 9:00 times, past-due items moved to today, `todo.house_reminders` as `reminders_entity` | Keep each reminder's real due date; a date is fine. The house board counts days past due for needs-you (shown up to 3 days, [#61 Q2](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536913728)), and moving an item to today hides that. Never make it the reminders entity, or rollover applies | Agent | No (design) | Easy | Before build step 4 |
| 28 | Fork: CONTEXT.md, and the sandbox mirror (`tests/sandbox/house_config.json`, `provision.py`, `seed.py`) | They mirror today's house: Board private, `calendar.us`, notes with the rollover marker | Update them to the new house, so the tests run against what's live | Agent; changing `tests/` needs the owner's approval | No | Easy | Each step |

**No step needed** (these continue as they are):
- **Guest mode** (`input_boolean.guest_mode`). The house board reads it, as do the lights, thermostat and trip automations, the house status script, the HomeKit Bridge and Assist.
- **The calendar copy** (`calendar_cache`). The house board reuses it ([#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43#issuecomment-6512554066)). It holds whichever calendars the boards ask about, in memory only, so `calendar.us` drops out by itself after a restart (`calendar_cache.py` 1–15, 76–78).
- **The meal plan format,** with `script.board_set_meal` and `script.whats_for_dinner`.
- **The settings blob.** It must never be written while any copy runs the week card. The week card writes the whole blob on open and drops keys it doesn't know (#43). The house board keeps its own settings in the house preferences service, so this rule needs no step: it simply lapses after row 22.
- **Assist's built-in list commands on Us notes.** They add notes with no date, which the week card never showed and the house board will.

## Order constraints

1. Rows 1 and 2 come before any copy moves. Row 3 comes before the wall moves, because one tap, then speak is non-negotiable ([#49](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49#issuecomment-6548542552)).
2. **Us moves only with the iCloud write path, and only once the wall shows the house board.** The week card can't change or delete iCloud events, so a wall still showing it would lose Undo on what it adds. The rename, reload, Assist change and script change (9 to 11, plus 14 if the fallback stays) are one step. Then the two-minute check, then removing `calendar.us`.
3. **Notes change only when no copy shows the week card** (15 to 18). The week card misplaces date-only notes and hides undated ones. While rollover runs, Later stays empty on the house board. Each note's time and marker go in the same update; the script and the prompt change in the same step. The option is cleared last.
4. **Board private retires after the house board's Guest mode works at the wall.** The automation goes before the helper. Both go when `/family-hub` retires, or once its private copy and tile are gone.
5. `/family-hub` retires after #99's fallback period and after the house board's Lists has its House section. Per-copy settings, the privacy switches and the card files go dormant then. None is deleted by hand.
6. Records change in the same session as each step. The voice guide and its printed copy change when the wall changes what Jenn sees.

Undo: every step is one setting or a small config change, except sharing Us with Jenn (row 9). That's why the look over Home's past comes first.

## Not checked

- Fully's Start URL comes from J006 and the current-page sensor, not from Fully's own settings. Auto Reload on Idle wasn't read.
- Each person's default dashboard. It's stored per user, so the connector can't read it.
- Whom the 10/25 copy belongs to.
- Phone widgets and Open Page actions.
- That Home Assistant loads Family Hub's card files on every dashboard *(inferred)*.
- How CalDAV handles the event script's times without an offset; row 12 checks it.

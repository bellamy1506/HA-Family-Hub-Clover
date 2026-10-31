# Guests at the wall: what Home Assistant can enforce, and what a visitor should see

Research note, 2026-10-30, for fork issue [#68](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/68) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). Question: the wall is signed in to Home Assistant as one non-admin user, "Clover", shared by both adults and any visitor. What can Home Assistant enforce for that user, what does Family Hub's privacy lock do, what do comparable displays show and allow a guest, and what do households expect a wall calendar to reveal and allow?

Sources: Home Assistant core at tag `2026.10.4` (what the house runs) and the frontend's `dev` branch; this repo's served code at `house/board-next` `a2ab472`; vendor help pages; papers read in full unless marked. Not repeated from [backend-reuse.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/backend-reuse/docs/research/backend-reuse.md): any user who isn't read-only controls every entity, and how to read the privacy switch. **[inference]** marks my judgement; **(unverified)** what I couldn't confirm. Nothing in Home Assistant or on any device was changed.

## The answer

Home Assistant can't enforce a guest policy on a shared sign-in. Its per-user levers are admin or not (Clover already isn't) and a hidden Read Only group that blocks every change, including the wall's adds; per-user dashboard, panel or entity permissions don't exist and aren't on the roadmap. "Admin only" hides a dashboard or panel from every non-admin without protecting the data. Family Hub's privacy lock is a curtain: it blanks events and dated notes in the browser, leaves meals and lists, and any signed-in user can lift it without the PIN. Other products are curtains too: Google's Guest Mode lets guests switch it off; HomeView and Echo Show show personal items only to a recognized person; Skylight and Hearth gate changes with a PIN. Household research fits: no logins at home, spouses with full rights, visitors allowed harmless actions but not settings or deletions. So Guest mode should be a curtain drawn in the card with plain rules, plus closing the doors on the wall (the sidebar, the profile page, Assist answers) that show a guest more than the board does.

## 0. Already built or decided

- Clover and Jenn are non-admin; the owner is admin. All four calendars are exposed to Assist ([J006](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J006-home-assistant-automations.md)).
- `input_boolean.guest_mode` blocks every away and trip rule; `automation.board_private_follows_guest_mode` switches `input_boolean.board_private` ("Hide work calendars", a tile on the board) with it (J006), which on the house board hides every calendar flagged work ([#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357)).
- Hide: only the hider's "Hidden by you" list brings an event back, and Hide goes wherever change and delete go ([#61, question 4](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536916622)). The wall's sign-in can't name who acted ([#42](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/42)).
- Kiosk Mode for the wall (J008 step 6, owner 2026-10-26; low priority 2026-10-30) hides the top bar on the board and leaves a Menu button to Overview, "where the bar and menu still show."

## 1. What Home Assistant can enforce for the wall's user

### 1.1 The model

- Three system groups (`auth/const.py`); admin and users share the policy `{entities: True}`, read-only is `{entities: {all: {read: True}}}` (`auth/permissions/system_policies.py`). Admin adds only `is_admin`, which gates configuration.
- Non-admin already keeps Clover out of Settings, dashboard editing, the user list and admin-only commands (`@require_admin`).
- The engine accepts per-entity and per-area policies, but no API creates a group: `auth/auth_store.py` loads custom groups only from `.storage/auth`, so it means hand-editing storage, unsupported.
- Permissions "only work if your code checks them" ([contributor docs](https://contributors.home-assistant.io/core/internals/permissions/)). Entity services and the calendar's create, update and delete check (`helpers/service.py`, `calendar/__init__.py`); `todo/item/move` doesn't; Family Hub's commands check nothing of the kind.

### 1.2 The Read Only group

- **No UI sets it.** The user editor offers only Administrator on or off and every save writes `group_ids: [admin or users]` (frontend `dialog-user-detail.ts`, `_updateEntry`). An admin can set it only with `config/auth/update` (`components/config/auth.py`), and the next save of that user in Settings > People puts them back in Users **[inference from the code; not run]**.
- **It blocks** every entity service and calendar write, so a read-only Clover couldn't add an event or note, tick one off or set a meal. **It doesn't block** reordering to-do items or any custom command that doesn't check.

### 1.3 Dashboards and panels hide; they don't protect

- A dashboard's `require_admin` ([docs](https://www.home-assistant.io/dashboards/dashboards/)) applies to Jenn too, and reading a dashboard's configuration has no admin check; only save and delete do (`lovelace/websocket.py`).
- Since core [#162742](https://github.com/home-assistant/core/pull/162742) and frontend [#29572](https://github.com/home-assistant/frontend/pull/29572) (merged 2026-02-23), built-in panels (Calendar, To-do, Logbook, History, Energy) can be made admin-only (`frontend/update_panel`). Again for every non-admin at once, and the data still answers any user.

### 1.4 What a guest can reach from the wall today

- **The sidebar** shows on the wall (J006: "no Settings in its sidebar"). Its Calendar panel lists every calendar, Work included, with titles, whatever `board_private` says; Map, Logbook and History show where people are and when they came and went **[inference from the code; Clover's exact panels unverified]**.
- **Entity states:** every calendar's state carries its current or next event's title, location and description (`CalendarEntity.state_attributes`), sent to every signed-in user.
- **The profile page:** any signed-in user can mint a long-lived access token (`auth/long_lived_access_token` needs only `ws_require_user()`). Whether one minted at the wall works away from home depends on Clover's "Local access only," which J006 doesn't record (unverified).
- **Assist:** with all four calendars exposed, a question to the full assistant at the wall can read Work back **[inference]**.
- **Kiosk Mode** as decided is tidiness, not privacy: Overview keeps the sidebar. But [Kiosk Mode](https://github.com/NemesisRE/kiosk-mode)'s options can be Jinja templates for one user (`user_settings`), and `ignore_disable_km` blocks the `?disable_km` bypass (README, fetched 2026-10-30; v15.0.0 for 2026.10.1 and up). A template on `guest_mode` could hide the sidebar and Menu button for Clover only during a visit; browser-side, but with no address bar on the wall it closes the casual path **[inference]**.

### 1.5 Roadmap

The latest roadmap post ([2025-05-09](https://www.home-assistant.io/blog/2025/05/09/roadmap-2025h1/)) lists "Enhanced privacy controls for users, guests, and public access," unranked. Paul ("piitaya"), answering for the project in the [2026.2 release thread](https://community.home-assistant.io/t/2026-2-home-sweet-overview/982992?page=27) (2026-02-11): "fine permissions to choose entity access for each user is not something on the roadmap"; "Public access, better support for wall tablet, guest mode, is definitely something that may come in the future." (Forum post; his role unverified.) A request for per-user sidebars (frontend [#30024](https://github.com/home-assistant/frontend/issues/30024), 2026-03-06) was closed "not planned" the same day.

## 2. What Family Hub's privacy lock does

From `card/family-week-calendar-card.js`, `switch.py`, `chores_websocket_api.py` and `const.py`:

- **Hides** every event (`_privacyEventsFor`) and every to-do item with a due date, Us notes included (`_privacyReminders`), on each copy that takes part; saved event shapes; titles in the board's answers (`_quiet`). A lock badge sits on the card; the grid stays usable.
- **Doesn't hide** meals (`_getMealForDay` has no check), undated notes, the shopping list, weather, or anything outside the card. The data stays in the browser: "the real data was there the whole time."
- **On:** anyone, from the More menu (`privacy_mode/set` is ungated "in either direction").
- **Off:** a kiosk PIN from an admin or a holder of `can_toggle_privacy_mode` (`disable_with_pin`), or no PIN at all through `switch.family_hub_privacy_mode` or `privacy_mode/set`: "Toggle privacy mode off with the toggle entity doesn't require validation" (`const.py`). The wall's own user can do either.

A curtain with its key hanging beside it **[inference]**.

## 3. What comparable shared displays show and allow a guest

| Product | A visitor sees | A visitor can do |
|---|---|---|
| **Google Guest Mode** (Nest displays) | "Your device won't show personal results, like your calendar entries or contacts, until you turn the mode off"; a guest icon shows; "You or your guests can easily turn it on and off" ([Google, 2021-01-13](https://blog.google/products/assistant/introducing-guest-mode)). Otherwise, "Anyone near the device can find or act on" personal results ([help](https://support.google.com/assistant/answer/7684543)) | Everything else; "You can't delete, cancel, or modify an event... using your voice" ([help](https://support.google.com/googlenest/answer/7029002)) |
| **Amazon Echo Show 15** | The household's shared calendar; "personal reminders, calendar events... or personal notes" only when opt-in Visual ID recognizes the person ([Amazon, 2021-09-28](https://press.aboutamazon.com/2021/9/amazon-introduces-echo-show-15-to-help-keep-families-organized-connected-and-entertained)) | "view and update your household's shared calendar" |
| **Apple HomeView** (ships 2026-11-13) | Calendar only with that person's iPhone on the Wi-Fi, recently unlocked, and their face recognized ([apple.com/homeview](https://www.apple.com/homeview/), fetched 2026-10-30) | "control smart home accessories... all without accessing anyone's personal information" |
| **Skylight Calendar** | "everyone's schedules in one place" ([help](https://skylight.zendesk.com/hc/en-us/articles/48778850390171-Calendar-Features), 2026-04-06); no hiding found | Parental Lock, a 4-digit PIN "to restrict access to adding or modifying events or tasks," each chosen separately, asked again after 1 to 10 idle minutes ([help](https://skylight.zendesk.com/hc/en-us/articles/36835387462555-General-Settings), 2026-10-22) |
| **Hearth Display** | Privacy Mode swaps the calendar for a wallpaper, for "when having guests over" ([blog](https://hearthdisplay.com/blogs/hearth-at-home/kid-interactions-can-be-personalized)), optionally after idle minutes ([help](https://hearth.zendesk.com/hc/en-us/articles/40375165009171-Privacy-Mode-Timeout)) | Display Lock "prevents interaction... until your passcode is entered," a 4-digit code adults share "verbally"; Privacy and Sleep Mode still work while locked ([help](https://hearth.zendesk.com/hc/en-us/articles/45419967099923-Display-Lock), via Firecrawl after WebFetch was refused) |

**[inference]** Assistants split shared from personal and show personal items only to a recognized person; family displays show everything and gate changes. None resists a determined guest. The common floor: a visitor sees the shared plan, uses harmless things, and can't reach settings.

## 4. What research says hosts and visitors expect

- **No logins inside the home:** "Within the home, family calendars need to remove any access restrictions that would require family members to login or request access" (Neustaedter, Brush & Greenberg 2009, *ACM TOCHI*, 44 households, [full text](https://grouplab.cpsc.ucalgary.ca/grouplab/uploads/Publications/Publications/2009-CalendarCrucial.TOCHI.pdf)). 29 of 37 home calendars hung on the fridge or kitchen wall; "Anyone can look at it." The only guest worry recorded was looks: one calendar "would embarrass her if guests saw it," and several were unfit for outside eyes because "they were messy."
- **Rights follow the relationship:** in 425 survey responses, averaged over 22 capabilities, 93.5% would always give a spouse access, 18.1% a visiting family member, 10.3% a babysitter; people were widely permissive only for lights and music, "which do not have much potential to cause harm." Proposed defaults: visitors act only while in the house; nobody deletes logs; administrative features for spouses only (He et al. 2018, USENIX Security, [full text](https://www.usenix.org/system/files/conference/usenixsecurity18/sec18-he.pdf)).
- **Common spaces run on trust:** in 7 households over a month, the most common reason for no access controls was "trusting each other enough," with no need felt in "household common spaces." One mother wanted guests and the nanny to control things only "while they were physically present": "I certainly don't want them having admin control." Per-user options risk "increasing the access gap" between the primary user and everyone else (Zeng & Roesner 2019, USENIX Security, [full text](https://www.usenix.org/system/files/sec19-zeng.pdf)).
- **Not settings:** "you don't want them to be able to switch settings around" (Park et al. 2023, SOUPS, 32 power users, [full text](https://www.usenix.org/system/files/soups2023-park.pdf)).
- **People misjudge what a shared device shows:** users "often have an inadequate understanding of what data their smart speakers makes available to all users" (Huang, Obada-Obieh & Beznosov 2020, CHI, 26 people; [summary](https://lersse.ece.ubc.ca/?p=696) only).

**[inference]** An open shared surface is what households expect. What's sensitive is each adult's own items (Work, health, money) and destructive acts. A visitor should do the useful, harmless things (read the shared plan, add a note, tick one off), not settings, deletes or hides. A house-sitter, the longest guest, needs the notes, the shopping list and adds.

## 5. Implications for the house board

1. **Guest mode is a curtain the card draws, described that way** (technical call; the owner can veto). The house board reads `guest_mode` from `hass.states` and applies its rules in the card; settings and J006 say "on the board," never "private" or "locked." No backend, no PIN.
2. **Don't port Family Hub's privacy lock** (technical call; the owner can veto). Guest mode, the work switch and each adult's detail do its job; the lock, its PINs and per-copy opt-out retire with the week card ([parked.md](../board-next/parked.md) parks the kiosk PIN).
3. **Work stays hidden while either switch is on** (technical call; the owner can veto). With `board_private` or `guest_mode` on, work-flagged calendars are hidden, so tapping the tile off mid-visit can't show Work. The follow automation then becomes redundant; retiring it is a Home Assistant change, explained first.
4. **Guest mode is switched from a phone, not the wall** (technical call; the owner can veto). It also stops the thermostat's and lights' away rules, so a guest switching it off at the wall could set the house to Away with a sitter inside. While it's on, the wall shows a small "Guest mode" mark, like Google's guest icon.
5. **At the wall, Hide belongs to the household** (technical call; the owner can veto, since it fills a gap in the decided Hide rule). "Whoever hid it" is unknown on the shared sign-in, so a hide made at the wall shows in both adults' "Hidden by you" on their phones, and the wall has no hidden list for a visitor to open.
6. **In Guest mode, the wall's typed path only captures** (technical call; the owner can veto). It calls the board's add scripts, not the full assistant, so a guest can't type a question and have Work read back.
7. **Close the back doors during a visit** (technical call; the owner can veto, and it needs the usual Home Assistant approval). Kiosk Mode, already chosen for the wall, with `user_settings` for Clover: hide the sidebar and Menu button while `guest_mode` is on, and set `ignore_disable_km`. That puts the Calendar panel, Map, Logbook, History and the token page out of a guest's reach without touching Jenn's phone. Also check Clover's "Local access only" and, if nothing signs in as Clover from outside, turn it on.
8. **What Guest mode shows and allows** (for the owner, at the privacy and who-may-change-what fog on #37). Being decided: while Guest mode is on, what the wall shows a visitor and what a visitor can do there. Phones never change.
   - **A. Shared plan, personal blocks** (0.60). Us plans and notes keep titles; each adult's own events show as a block with name and times ("Will, 3 to 5"); Work hidden as now; no clash marks or new dots; meals, weather, lists and house reminders as usual. Anyone can add an event or note and tick notes off; change, delete, Hide and settings are off.
   - **B. Work hidden, nothing else** (0.20). Today's behavior, change and delete included.
   - **C. Lists only** (0.12). Calendars hidden; meals, notes, lists and weather show; adding allowed.
   - **D. Curtain until touched** (0.08). A clock and weather face; a tap shows the normal board, like Hearth's Privacy Mode.

   Recommendation: **A.** It follows the products' split of shared from personal and the research's line that visitors do harmless things, not settings or deletions, and it keeps the board useful to a sitter. A dinner guest sees that Will is out from 3 to 5, not why. It gives up your own titles at the wall during a visit, and fixes then happen on a phone. B leaves every title and the delete button to visitors; C hides your return from a sitter; D gives up the resting face, and one tap undoes it.

## 6. What this says not to do

- Don't call anything on the board "private," "locked" or "secure"; it's display only, and Home Assistant's own pages and Assist see every calendar.
- Don't build a PIN lock or keep Family Hub's: four digits said aloud, one more thing to tend, and any signed-in user can lift it.
- Don't make Clover read-only (it stops the wall's adds, and the next edit in Settings > People undoes it) or add a guest login (someone has to sign the tablet in and out).
- Don't make the Calendar, Logbook or History panels admin-only to hide them from guests: Jenn loses them too.
- Don't add per-person or per-guest permission settings (Zeng & Roesner 2019).
- Don't rely on Guest mode for anything that must stay secret; keep that off the house calendars (as with Work, which holds no patient details, J006).

## Gaps

- Not checked on the house: Clover's sidebar panels, Clover's "Local access only," and whether Fully Kiosk's URL lists catch navigation inside Home Assistant. The Read Only reset and panel settings were read from code, not run.
- Amazon's help returned 503, so Echo Show facts come from its 2021 launch release. HomeView isn't shipping yet. Shared iPads not researched.
- No study found of what visitors expect a host's wall calendar to show. Huang et al. 2020 read only as a summary; Geeng & Roesner 2019 and the bystander studies (Yao et al. 2019, Marky et al. 2020) not read.

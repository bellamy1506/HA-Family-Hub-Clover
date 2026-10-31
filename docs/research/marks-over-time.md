# Marks over time: how shipped calendars mark changes, clashes and duplicates, and how those marks wear

Research note, 2026-10-30, for [#66](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/66). It tunes two decisions already made in [#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61): the new dot, the clash rules and the shared plan shown once ([question 1](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)), and "needs you" ([question 2](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536913728)). It reopens neither. It doesn't repeat [family-display-ecosystem.md](family-display-ecosystem.md), [household-coordination.md](household-coordination.md) or the habituation findings in [calm-at-rest.md](calm-at-rest.md) §1.3 to 1.5.

## Answer

Shipped calendars almost never mark a change on the event itself. Apple sends a notification per change to a shared calendar and keeps it in a Calendar Inbox until someone taps OK; Google emails changes if a person asks; Cozi pushes new events by default and changes only in its paid tier; TimeTree gathers changes in an Activity tab; Skylight added a push for new events on 2026-10-28. None documents a mark on the item that clears itself, so the board's dot has no direct precedent, and its tuning comes from how other marks wear: per-change messages become "a meaningless stream" people switch off; marks are heeded about as often as they're right; and repeats, more than volume or time, wear people down. Shipped clash rules are narrower than "any overlap": all-day and Free events don't block by default, and back-to-back events are "adjacent," not conflicts. For one event on two calendars, Google and Apple show every copy; the products that merge match exact title and times, some adding location, none fuzzily. The decided rules hold. The tuning is at their edges: dots skip feeds and first sight, a phone dot gets a ceiling, tiny overlaps don't clash, and a month in, the household counts how often the marks were right.

**[inference]** marks my judgement; **(unverified)**, claims not confirmed at a primary source. Forum posts are evidence of experience only. Firecrawl opened two pages WebFetch couldn't (Apple's design guidelines, a Chrome Web Store listing). Home Assistant's code was read on its `dev` branch (2026.12.0.dev), 2026-10-30.

## 1. "Added or changed by someone else": how products mark it, and for how long

| Product | What marks it | How long | Off switch, and experience |
|---|---|---|---|
| Apple Calendar (shared iCloud) | A notification per change: "When someone modifies a shared calendar, you're notified of the change" ([Apple](https://help.apple.com/ipod-touch/10/en.lproj/iph7613c4fb.html)). Each lands in the Calendar Inbox | Until someone taps OK on it; an iPad offers "OK all," an iPhone didn't, per a user ([Apple Community](https://discussions.apple.com/thread/255801960), 2024-10-14) | Settings > Notifications > Calendar > Shared Calendar Changes, or per calendar, "Show Changes." With four family calendars: "a meaningless stream of endless notifications," 69 "Me too" ([Apple Community](https://discussions.apple.com/thread/254541955), 2023-01-09) |
| Google Calendar | Nothing on the event; optional emails per calendar for categories such as "Changed events" | One email per change | Each person's own: "Your specific settings don't affect the notifications of others" ([Google](https://support.google.com/calendar/answer/37242), fetched 2026-10-30) |
| Outlook | No mark found for changes to a shared calendar | | |
| Cozi | New events notify their attendees by default ([Cozi](https://www.cozi.com/?p=26713), 2018-01-11); change notices are paid (Gold), sent per change by whoever edits ([Cozi](https://www.cozi.com/blog/introducing-calendar-change-notifications-cozi-gold/), 2013-09-11) | One message | New-event notices can be turned off |
| TimeTree | An Activity list of "new events, updates, and comments," with a small display on opening the app that is "not displayed if there is no new activity" ([TimeTree](https://timetreeapp.com/intl/en/newsroom/2023-08-29/new-calendar-activity), 2023-08-29); one of four tabs since the redesign, with emoji reactions ([TimeTree](https://timetreeapp.com/intl/en/newsroom/2026-01-13/renewal-timetree-newsroom), 2026-01-13) | Not documented | Under More |
| Skylight | "when someone uses Skylight to add an event to your Calendar, you can get a Notification" ([Skylight](https://skylight.zendesk.com/hc/en-us/articles/57806291759259--Feature-Notifications-For-New-Events), 2026-10-28); new events only | One push | Not documented |
| FamilyWall, Hearth, Echo Show | Nothing documented | | |

Two shipped details bear on the dot's timing:

- **"Seen" after a dwell.** Outlook can "Wait n seconds before marking item as read" ([Microsoft](https://support.microsoft.com/en-US/Outlook/use-and-configure-the-reading-pane-to-preview-messages-in-outlook)); third-party guides put the default at 5 seconds (unverified).
- **Accuracy over insistence.** Apple's guidelines: "Keep badges up to date... You don't want people to think there are new notifications available, only to find that they've already viewed them all," and "If you send multiple notifications for the same thing... people may turn off all notifications from your app" ([Apple HIG, Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications), fetched 2026-10-30).

Research on change awareness agrees with the dot's shape. The first thing a returning person needs is "Is anything different since I last looked at the work?", answered "in a very lightweight fashion," with details on request; the authors warn of "an after image cluttered with change marks" and suggest showing a change's age by fading ([Tam & Greenberg 2006](https://cspages.ucalgary.ca/~tam/research/2006/ChangeAwareness-IJHCS06.pdf), *IJHCS* 64, full text).

**[inference]** Shipped products sit at two poles: a message per change that lasts until acknowledged, or nothing. The board's dot sits between, closest to an email client's unread mark.

## 2. Which overlaps count as a clash

- **Outlook** shows a banner on a meeting request "If you have a conflict or an adjacent meeting" ([Kansas State IT](https://support.ksu.edu/TDClient/30/Portal/KB/ArticleDet?ID=252)); Exchange counts the two separately ([AdjacentMeetingCount](https://learn.microsoft.com/en-us/exchange/client-developer/web-service-reference/adjacentmeetingcount)). New all-day events default to Free (several third-party sources; Microsoft's page doesn't say). Only this year did Microsoft make invites that "conflict with scheduled Out of Office time" or "Busy All Day events" easier to see (roadmap [RM567888](https://mc.merill.net/message/RM567888), published 2026-07-17, launched August 2026). Calendly, reading Outlook, treats Busy, Tentative, Away and Working elsewhere as unavailable and Free as available ([Calendly](https://calendly.com/help/how-to-manage-busy-vs-free-calendar-settings), updated 2026-08-20).
- **Apple:** "By default, the Calendar app sets the status as free during all-day events and busy during all other events" (Apple Community specialist, [2023-03-15](https://discussions.apple.com/thread/254712006)). No conflict mark for ordinary overlaps documented. Declined invitations are hidden, not removed: "To see events you've declined, tap Calendars, then turn on Show Declined Events" ([Apple](https://help.apple.com/ipod-touch/7/en.lproj/iph82c5721ca.html)).
- **Google:** an event's transparency says "Whether the event blocks time on the calendar"; the default is "equivalent to setting Show me as to Busy" ([Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/events)). All-day events default to Free, per scheduling vendors ([Schedulista](https://support.schedulista.com/en/articles/365834-why-does-my-google-appointment-not-block-out-time-in-schedulista); Calendly, above). No conflict mark on the grid documented.
- **Fantastical's** Calendar Mirroring (2026-06-23) makes "Include all-day events" and "Include timed events with Free status" separate opt-ins ([Flexibits](https://flexibits.com/fantastical/help/calendar-mirroring)).
- **Family products** (Cozi, TimeTree, FamilyWall, Skylight, Hearth, Echo Show): no conflict marks documented.

**What Home Assistant passes the board.** The Google integration drops events the person declined, cancelled events, birthdays and working-location events, and keeps events marked Free, since calendars set up in the UI default to `ignore_availability: True` (core [`google/calendar.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/google/calendar.py) `_event_filter`, and `google/__init__.py`). The CalDAV integration drops only cancelled events; nothing in it reads attendee responses or Free/Busy (core [`caldav/coordinator.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/caldav/coordinator.py)). A calendar event reaching the board has no Free/Busy field. **[inference]** So Jenn's declined invitations vanish, but Will's declined iCloud invitations may reach the board (unverified), and "Free" can't be honored on any calendar.

## 3. One event on two calendars

- **Google** shows a separate block per copy; an extension exists to merge them because "These can clutter up your calendar and make it hard to read." It draws one event with "strips with all the individual calendars' colors" ([Chrome Web Store](https://chromewebstore.google.com/detail/leoimkcbknpkpgoddcmbilnbkgmpjbkj), about 2,000 users, updated 2026-02-10).
- **Apple:** "An event can be assigned to one calendar only," and a user saw one event "3 times which is really annoying" ([Apple Community](https://discussions.apple.com/thread/255572097), 2024-04-11).
- **BusyCal's** "Combine Identical Events": titles the same, start and end the same, on different calendars; "Identical events can have different notes, locations, tags or alarms"; "Combined events do not behave or appear differently. This is deliberate." Which copy shows follows calendar order ([BusyCal](https://www.busymac.com/docs/busycal/133794-combine-identical-events)). Its FAQ: duplicates are "usually because the event genuinely exists on both calendars" ([BusyCal](https://www.busymac.com/docs/faqs/155263-why-do-i-see-duplicate-events-from-a-shared-calendar)).
- **Fantastical** combines events with the same "time, name, and location," with "a color visual" for the calendars and the details listing each one ([Flexibits](https://flexibits.com/blog/?p=2834), 2022-10-04).
- **Calendar Card Pro** (Home Assistant): a duplicate is when "title, start, end and location all match"; the merged row shows every calendar's label ([docs](https://calendar-card-pro.alexpfau.com/features/core-settings)).
- **Family products:** nothing documented.
- **No product documents fuzzy matching or matching by ID.** An invitation's copies share one identifier, which Google says "is used to uniquely identify events accross [sic] calendaring systems," and which all occurrences of a repeating event share ([Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/events)). Home Assistant passes it as `uid` from both Google (`ical_uuid`) and CalDAV.

## 4. How marks wear over months

- **Per-change messages get switched off.** Apple's stream above (69 "Me too"); Apple's own warning that repeats make people "turn off all notifications."
- **Marks are heeded about as often as they're right.** With alarms 25%, 50% or 75% genuine, about 90% of 138 people "match their response rates to the expected probability of true alarms" ([Bliss, Gilson & Deaton 1995](https://stars.library.ucf.edu/scopus1990/1980), *Ergonomics* 38(11), abstract). Experience: a false "conflict" on a Google calendar: "there is no conflict and I just ignore it and carry on" ([Calendly community](https://community.calendly.com/how-do-i-40/conflict-coming-up-on-the-email-confirmation-there-is-no-conflict-5279), 2026-01-23).
- **Repeats wear people down; time alone doesn't.** Across 112 primary care clinicians over 3.5 years, accepting an alert tracked repeated alerts and work complexity, "but not with the amount of work"; acceptance of reminders dropped 30% for each additional reminder in a visit, and there was no "desensitization over time for a newly deployed alert" ([Ancker et al. 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/), *BMC Med Inform Decis Mak* 17:36, abstract).
- **One mark pulls the first tap.** With one app badged on a home screen, about 1,009 people picked it first far more often (WhatsApp 79.7% vs 38.2%) ([Bartoli & Benedetto 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9246170/), *PLOS ONE*; one exposure).
- **Home displays fade into the background over months.** Over a 12-month trial, "smart energy monitors gradually become 'backgrounded' within normal household routines and practices" ([Hargreaves, Nye & Burgess 2013](https://ueaeprints.uea.ac.uk/id/eprint/41902/), *Energy Policy* 52, 11 follow-up interviews, abstract).

**[inference]** The board's marks can wear three ways: by being wrong (false clashes, near-duplicates read as clashes), by repeating (a weekly clash the couple already settled; your own adds dotted on the wall), and by becoming the board's normal look (many dots at once). Accuracy and rarity are the levers, and both can be counted a month in.

## Implications for the house board

The decided rules match shipped practice: all-day events out of clashes, exact matching for a shared plan (BusyCal's rule), a mark on the item rather than a message per change. These tune the edges.

1. **Phone dot: a visit counts after 5 seconds with the board on screen, and a dot lapses 7 days after the change even unseen.** Five seconds follows Outlook's dwell and puts a number on the decided "few seconds." The ceiling keeps a phone that hasn't opened the board for weeks from opening to a board covered in dots (Tam & Greenberg's clutter); a change that old has likely been seen on the wall or talked about **[inference]**. (technical call; the owner can veto)
2. **Dots only for news.** No dot for work-flagged calendars or labeled blocks (a synced work meeting isn't something the other person did); none on events that have ended; none on a calendar's first sight (connecting Jenn's Google calendar, reconnecting one, or a lost first-seen record records everything silently, so the wall doesn't light up for a day); a change to a whole repeating series dots its next occurrence only. The wall's 24 hours stays: it spans one evening and one morning glance **[inference]**, and nothing found argues for another number. (technical call; the owner can veto)
3. **Clashes ignore tiny overlaps.** Overlaps of 15 minutes or less don't clash, and events that only touch never do. Outlook keeps "adjacent" apart from conflicts, and quick-capture end times are often a default length rather than a real end **[inference]**. (technical call; the owner can veto)
4. **Clashes come from events, not drawn blocks.** "At work 8 to 5" may cover a lunch gap under an hour; a shared plan in that gap isn't a clash. (technical call; the owner can veto)
5. **Check declined invitations once.** Add one step to the supervised iCloud check already planned ([#39](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/39)): decline a test invitation and see whether it reaches the board. If it does, note it in the card map; the fix belongs in Home Assistant's CalDAV integration, and Hide covers the rare case meanwhile. Events marked Free can't be read anywhere; all-day exclusion covers most of them. (technical call; the owner can veto)
6. **Shared plan: add one exact test first.** Same `uid` and same start is the same plan, whatever the titles say; then the decided title-and-times rule. No fuzzy matching: merging two different plans hides one, which costs more trust than seeing one twice **[inference]**. (technical call; the owner can veto)
7. **A clash you've already settled, repeating.** Repeats are what wear marks down (Ancker et al.), so a weekly clash both of you have accepted would teach both to skip clash marks, true ones included. (for the owner, at a one-month review of marks, a new fog on the map)
   - **A** Leave it: the mark stays until an event moves or is hidden (0.25).
   - **B** Add "Fine as is" to a clashing event's sheet, silencing that pair, this time or the series, for both of you (0.25).
   - **C** Decide at the one-month review: build B only if a settled clash repeated during the month (0.40).
   - **D** Clash marks show only while new, like dots (0.10).
   Recommendation: **C**. It builds nothing until the house shows the need; the cost is a month of possibly repeated marks, which the review will count.

### What to check with both adults after a month

1. **Clash marks:** how many, and for each, was it real (needed a word), a duplicate, or already settled? If fewer than about 3 in 4 were real, tighten (the threshold in idea 3, or #61's option B, shared-plan clashes only) **[inference]**.
2. **"Needs you":** did it ever name a clash that wasn't one? Any is too many on the resting face.
3. **Wall dots:** on a typical day, how many? Did one ever tell either of you something you didn't know? Did your own adds' dots confuse anyone?
4. **Phone dots:** does each of you open the board on the phone at all? If Jenn rarely does, the wall carries "new" and phone dots matter little.
5. **Shared plans:** anything shown twice that was one plan, or, worse, two plans shown as one?
6. **Anything either of you wanted to switch off,** and the settled-clash question (idea 7).

## What this says not to do

- **No push, email or inbox item per change.** That is Apple's "meaningless stream"; the map already leaves phone notifications to the house digest.
- **No mark that waits to be acknowledged one by one,** like the Calendar Inbox's OK on each change.
- **No count badge ("3 new") on the resting face.** A badge pulls the first tap (Bartoli & Benedetto); the wall shouldn't pull.
- **Don't widen clashes** to all-day events or to events that only touch; shipped rules leave both out.
- **Don't fuzzy-match or merge silently.** No shipped product documents it, and a wrong merge hides a plan.
- **Don't vary the marks' look to beat habituation;** rarity does that calmly ([calm-at-rest.md](calm-at-rest.md) §1.5).

## Gaps

- **No study of change or clash marks in homes over months.** The wear evidence is borrowed (clinical alerts, laboratory alarms, energy monitors, a one-screen badge test); Ancker, Bliss and Hargreaves were read as abstracts.
- **Undocumented:** clashes and duplicates on Skylight, Hearth, Echo Show and FamilyWall; Google's conflict display; TimeTree's Activity lifetime; Outlook's default dwell.
- **Forum or vendor based:** Apple's Inbox behavior, the all-day Free defaults for Apple and Google, the false-conflict quote.
- **Home Assistant:** declined iCloud invitations through CalDAV are unverified (idea 5). Code was read on `dev`, not the house's 2026.10.4; `dev` also adds an event `status` (confirmed or tentative), release not checked.
- **A month is early for backgrounding** (Hargreaves: within 12 months); the review catches errors and repeats, not slow fading.

# Wall board walkthrough, 2026-10-29

Reviewer: a first-time user playing the two people who live here. Tablet (wall) and iPhone-sized screens, local practice copy. Screenshots are in /home/user/ha-sandbox/review/shots/ (file names below are in that folder).

## 1. First impressions

**Up close (tablet, 01-wall.png, 14-wall-rest-week.png).** The wall opens on a four-day week starting today: Thursday the 29th has a bright blue header with weather (61/44), then Fri, Sat, Sun. Each day shows three meal slots (Breakfast / Lunch / Dinner), then an hour-by-hour timeline with colored event blocks. Coloured pills across the top give per-person counts (Will 3, Jenn 3, Home 4, Us 2, Work 2, Events 14, Reminders 3). It is pretty and reads as a "family calendar" straight away. Today's column is clearly the one to look at.

**What I learned in 5 seconds:** the date, the weather, that tonight is salmon, rice and green beans, that Yoga is at 6 and "Plan holiday travel" at 7:30. I could not tell what is happening NOW or NEXT: the current time is a thin red line, easy to miss, and the morning hours of today are scrolled out of view (the timeline starts partway down, so "Office hours" and "Call the plumber" are not visible on today's column at all). I could not tell what to bring or do: the "bring the new insurance card" note on the dentist is only visible if you tap in. Reminders (the bell items) show only as small dashed blocks with a time and no readable words ("9:00 AM" in a tiny dashed pill).

**Across the room (14-wall-rest-small.png, 25% size, about 9 ft):** I can read the day numbers (29, 30, 31, 1), the weather temperatures, "Dinner" dish names (Salmon, rice and green beans; Pizza night; Pancakes; Lasagna), and the green "Halloween: candy bowl by the door" bar. I cannot read any event title in the timeline (Yoga, Office hours, Plan holiday travel, Oil change are all blurry smudges); only the colors and the shapes of long blocks are visible. Tonight's time-of-day items, the thing a person most wants from across the room, are the least legible. The big Home Assistant sidebar (Overview, Map, Activity, History...) takes the left fifth of the wall and screams "this is a computer", not a family calendar. Event text is very small relative to meal and header text.

## 2. Scenario log

Tap counts include opening the form, typing fields, and saving. Typing on a real phone keyboard would add effort.

### 1. Walk past the wall
No touching. Learned: date, weather, dinner, evening events. Missed: what's now/next, anything to bring, any reminder text. Inner voice: "Is it a good day? ...I guess dinner is salmon." Severity: annoying (the at-rest view does not answer "what's next"). Shots: 01-wall.png, 14-wall-rest-week.png, 14-wall-rest-small.png.

### 2. Dentist, next Tuesday 3:30 pm, then change to 4:00 (owner, phone)
Opened on a month grid (a dark or light calendar with tiny truncated labels like "Offi..."). Steps: tap the round "+" button at the bottom right (1), tap "Calendar Entry" (2), form opens titled "New Event" (see 04-owner-form-a.png). It defaults to calendar "Will", today's date, 7:00 PM to 8:00 PM. Type the title (3), set the date to Nov 3 using a date field (about 3 taps on a real phone), set start 3:30 PM and end (about 4 more taps on pickers), scroll down past "Remind me" chips, "Also for" checkboxes, "Attach a checklist", "Notes" to find Save (05-owner-form-bottom.png, 06-owner-form-save.png), tap Save (about 12 taps total). It saved with no confirmation message: the form just closed and the month grid looked the same except a counter changed from "Events 51" to "Events 52" (07-after-save.png). I had to scroll the page and find the 3rd of November to see it, and the day cell only shows "Den... +3 more". The new event is not shown on today's view.

**Changing it to 4:00 pm: I could not.** Tapping the event opens a sheet that shows the title, the calendar chip ("Will"), "When: Tuesday, Nov 3 - 3:30 PM - 4:30 PM", reminder chips, and tickboxes (10-tap-event.png, 11-tap-when.png). Tapping the title, the time, or holding the event does nothing. There is no Edit button, no Delete button, no drag that changes the time (I also tried drag in the tablet's "Edit" mode, 26-after-drag.png; it did nothing). The only way to "fix" it is to add a second Dentist event at 4:00 and leave the wrong one in place. On Tuesday the 3rd the board now shows two "Dentist" entries (3:00 and 3:30, plus the vet at 4:00), which I made worse by trying. Inner voice (owner): "I just want to move it by half an hour. Why can't I?" Severity: **blocker**.

### 3. Dinner with friends, Saturday 7 pm, for both (Jenn, phone)
Same "+" then "Calendar Entry" form (20-jenn-form.png). Jenn would pick the calendar from a dropdown that defaults to "Will" (not her own name), with choices Will / Jenn / Home / Us / Work. "Us" is the right one; nothing says that "Us" means "both of us". There is also an "Also for" row of checkboxes (Jenn, Home, Us, Work) which duplicates the same idea: it is unclear whether to use the dropdown, the checkboxes, or both. Date default is today (Thursday), so she has to change it to Saturday. About 10 taps. When saved, the event appeared on Sat the 31st in yellow-gold ("Us" color) next to "Date night: dinner and a movie" at the same 7 pm (21-jenn-after.png, 22-jenn-sat.png). **Two things at 7 pm on the same night are shown side by side with no clash warning**, and I realised my practice data already had a "Date night" at that time. There is no way for the owner to "notice" the new item: no notification, no "new" badge, no sound, no message on the board saying "Jenn added this". Inner voice (Jenn): "Did it work? Will he even see it? I'll text him." Severity: painful.

### 4. Vet card, Nov 12 at 9:15 am, at the wall tablet (Jenn)
Tap "+" (1), "Calendar Entry" (2), type title (3), set date to Nov 12 (date field with a tiny calendar icon plus a second 17-July calendar icon button next to it: two icons for one thing) (about 3), set start 9:15 AM and end (about 3), scroll to Save (1), Save (1). About 12 taps. The tablet form is large and readable (23-wall-form.png, 24-wall-filled-bottom.png). I noticed a wrinkle: the form always starts at 8 PM - 9 PM "tonight", not a sensible morning time, so every time must be changed. Nothing confirms the save. The wall stays on this week so the new card is not visible; she'd have to press the right arrow three times to find November 12 (the tablet's week arrows move only about four days at a time). In the month view it appears as "Kitt..." (a truncated title). Inner voice (Jenn): "Okay, I think it's in. I'd have to go find it to be sure." Severity: annoying.

### 5. A mistake, and trying to change/delete Will's and Work events
I added the extra Dentist by accident (see scenario 2). **There is no way to delete it** from the board: the sheet has no delete or edit button, for either person, on either screen size, on any calendar. I tried: tapping the title, the "When" line, holding the event for 1.3 seconds, double tapping, tablet "Edit" mode (which only makes meal slots drag-and-drop), the "More" menu (Templates, Print, Shopping List, Daily Digest, Privacy Mode), and Home Assistant's own Calendar page (its event popup is also read-only, with no delete). The only edits possible are the small tick boxes ("Also for", "Remind me") on the sheet, which silently change which calendars an event appears on. That tick-box row on a work event is the one thing here that could cause real harm: one slip and a Work meeting shows on the Home column. For Work events specifically nothing is protected or marked "read-only" either; the sheet looks identical to Will's. Inner voice (owner): "So I have a calendar I can add to but never fix?" Severity: **blocker**.

### 6. Meals and shopping (owner, wall then phone)
*Dinner:* On the wall, I tapped "Tap to add dinner" on Saturday (a clearly labelled empty slot, good). On the wall the form was titled "Edit Dinner - Saturday, Oct 31" and, because I was signed in as the wall user, the primary button said "Suggest", with the note "You can suggest a meal for this day - someone who can edit the menu decides whether it goes on" (37-meal-tap.png). I typed "Tacos", tapped Suggest. It put "Tacos" straight on Saturday's dinner anyway (visible a moment later), so the word "Suggest" and the explanation were wrong or at least confusing. On the owner's phone the same slot offered "Clear / Cancel / Save" and a "Who's cooking: Not set" chip (39-owner-meal-sheet.png); typing "Tacos" and Save worked and it appeared on Tuesday 27th's dinner after I accidentally picked the wrong slot, because the phone's week list starts on Sunday the 25th (past days) and my tap list found the first empty dinner slot, not tonight's. This is partly my test method but also shows that "This week" on the phone starts in the past, showing last Sunday above today. Three nights of dinner: each is tap-slot, type name, Save = 3 taps plus typing; fine and quick. The Pick a Recipe button and "More options" are unnecessary clutter for a typed name.
*Shopping list:* On the wall, "More" then "Shopping List" opens a panel (42-wall-shopping.png). It defaults to a "Grocy List" tab with an error-like message: "Grocy isn't connected yet - set it up under Settings > Devices & Services > Family Hub > Configure > Grocy." I typed Milk and tapped Add; **nothing happened** (no item appeared, and no message), and the other tab, "This Week's Meals", says "No Grocy-imported recipes are planned for this week yet" (43-after-add-milk.png, 43-meals-tab.png). So on the board the shopping list simply doesn't work. Meanwhile, in the phone's Home Assistant sidebar > To-do lists there is a perfectly good "Shopping list" (46-shopping-native.png) with Eggs, Coffee beans, etc.; I added "Milk" and "Cat litter" there (it already had Milk and Cat litter, so it now shows duplicates; nothing warns). Finding it required: sidebar (1), "To-do lists" (2), the list picker at the top, which lists 12 lists with names like "Jenn_Wish List", "Wall_Reminders", "Owner_Reminders", "Family Hub Chores" (the default and empty), "Meal plan" and "Family Meal Templates" (45-todo-lists-menu.png) (3), "Shopping list" (4), then Add item. Inner voice (owner, in the store): "Which one of these twelve lists is the real one?" Severity: **painful** for the board's shopping button (a dead end), annoying for the list picker.

### 7. Leave a note (Jenn at the wall; owner clears it)
No "note" button. The closest is "+" then "Reminder" (47-reminder-form.png): fields are Title, a "List" dropdown (Family), Date, "Notify at" (defaults to 8:00 PM tonight), a "Roll over to next day if not completed" tickbox, and a long italic paragraph that begins "Saved as a to-do in Home Assistant, not an event on your calendar... Needs the Family Hub integration installed to actually notify; set reminder notify devices under Settings." That paragraph is jargon and a little alarming. I typed "Package on the porch" and saved (about 4 taps; 48-reminder-saved-fast.png). It appeared on today as a small dashed 8:00 PM pill, and the Reminders pill count went from 3 to 4. Reminders appear mixed in with events with just a small bell. The owner, on the phone, saw "8:00 PM Package on the porch" at the bottom of today's list, tapped it, and the sheet had "Save changes" and "✅ Mark done" (49-owner-note-sheet.png). Mark done: 3 taps; it cleared after the next screen refresh (59-owner-after-done.png). Notes: it is scheduled for 8 PM, which makes it look like a note for tonight at 8, not a "now" message; nobody is told it exists. Inner voice (Jenn): "I just want a sticky note. Why is this a to-do with a time?" Severity: painful for the concept (no real sticky note), nit for the clearing flow, which was good.

### 8. Look ahead: next weekend, next month, clashes
*Next weekend (phone):* the phone opens on a month grid; every cell is tiny and labels are truncated to three or four letters ("Offi...", "Wor...", "Gym"). Day cells beyond two or three events say "+2 more". You cannot read the weekend at a glance. I tapped a day to see its list below ("Saturday, October 31": All day Halloween, 9 AM Oil change, 9 AM Order more cat food and litter, 7 PM Dinner with friends, 7 PM Date night; 22-jenn-sat.png). That works and is readable. The "Go to this week" button next to each date jumps to a week list (28-owner-week-phone.png), a nice tall list per day with weather, meals, and events with a tiny initial for who. It starts on Sunday, the 1st of the next week after tapping a day in the next week, so it needs scrolling to find a day. 
*Next month:* swiping left on the month grid moved to November (50-owner-swipe.png). Nice, discoverable, no arrows needed on a phone. The counters at the top (Will 15, Jenn 33, Work 32) switch to the new month; no hint what they are for. 
*Clashes:* on Tue Nov 3 there's Dentist 3:00, Dentist 3:30 (mine), and the vet at 4:00; on Sat Oct 31 two things at 7:00 PM. In the wall's timeline they overlap as stacked columns, visibly squeezed (26-after-drag.png shows the 3:00 / 3:30 / 4:00 boxes overlapping), but nothing flags "these clash" and on the phone's month grid you cannot see times at all. Inner voice (owner): "Am I double booked on the 3rd? I'd have to open the day to find out." Severity: annoying.

### 9. Make it yours (owner, wall)
The gear icon (top left of the calendar) opens Settings (51-wall-settings.png, 52-settings-calendars.png) with tabs "General" / "Users", a "This device" name box with "Identify" and a tiny "Save" button next to it, a collapsed "CALENDARS" section, then "Use global theme (Theme Builder)" with Off/On, a theme dropdown, "This device's theme", "Cancel" and "Save". Everything useful is hidden under the collapsed "Calendars" bar: Default view (Week/Month), "Layout ideas" (Week / Portrait / Agenda / Two-Week Ahead) each with a plain-English line, then "Days shown in Week view", "Rows", "Show hours of the day (timeline)", "Timeline range", "Calendar top bar style (Normal / Minimal / Title only / Hidden)". I could not find a "text size" control anywhere. The nearest are Portrait ("bigger text for a tall screen") and the number of days shown (fewer days = wider columns). Trying the "Agenda" layout idea: tap it, tap Save (about 6 taps); the board changed to seven narrow day columns (53-wall-agenda.png), which made the text worse (words broke letter by letter: "Offi / ce / hou / rs") and the layout I'd picked called "Agenda" ("a scrolling list") was not a list at all. Something went wrong or the preset does not do what it says. Separate "Theme Builder" in the sidebar offers 12 themes (Soft, Slate, Meadow, VaultTek, Midnight, Blossom, Liquid Glass, ... Liquid Glass Tablet) with colour swatches and a "Delete theme" button; an owner who "hates digging" would be alarmed by "Delete theme". Also notable: I had to go through six settings sections to change what the wall shows when you walk up, and I could not tell whether "Default view" is the "walk-up" screen. Inner voice (owner): "I just want bigger text and 'today' on top." Severity: painful.

### 10. Wander (Jenn)
Discovered by accident: swiping the month grid changes month; "More" > "Daily Digest" is a nice summary card, "Due today: Call the plumber about the slow kitchen drain; On the menu today: Salmon, rice and green beans" (54-jenn-digest.png), which is exactly the walk-past information the wall itself fails to give. Also found: the tiny house icon tab beside "Family Hub" opens "House reminders" (furnace filter in 3 days, smoke/CO detectors in 2 weeks; 48-owner-house-reminders.png), good content but behind an unlabelled icon. "Print", "Templates", "Privacy Mode" are in "More". "Recipe Box" and "Suggestions" buttons open a recipe manager with "Add from Grocy", "Import from a link", "Select" (41-wall-suggestions.png), a feature that isn't relevant to a household that only types dinner names, and "Suggestions" opens the same recipe box titled "Recipe Box", a label mismatch. The "Hide work calendars: Off" lock tile at the bottom of every screen is mysterious; I couldn't tap it on the phone (another element covered it).
Wanted but not there: see section 5.

## 3. Verdicts

**Owner.**
- Would love: the calm picture of the week with weather and dinner on each day; one calendar for four sources, colour coded; the swipe between months; "Mark done" on a reminder; the Daily Digest.
- Would tolerate: the date/time form (twelve-ish taps); the very busy top bar; finding the shopping list in the sidebar.
- Would hate: no way to edit or delete an event, anywhere; a shopping button that silently does nothing; the settings maze with no text size; the Home Assistant sidebar and top bar on the wall; the "nothing confirms it saved" feeling.

**Jenn.**
- Would love: the colours, the weather, the weekly dinners, the big friendly "+" button, the "Mark done" feeling.
- Would tolerate: picking "Us" from a dropdown that starts on "Will".
- Would hate: forms that start at 8 PM tonight, "Reminder" jargon paragraphs, no confirmation, no way to fix a typo, and having to text the owner to say "I added it". She'd give up at the first mistake.

## 4. Would Jenn pick this over a Skylight?

**No, not yet.** The look is competitive (colour, weather, meals, per-person colours). But a Skylight lets you tap an event, change it or delete it, add a chore, and have the other person see it with a photo or a notification; here a wrong entry is permanent, the one-tap "note" doesn't exist, the shopping button is dead, and you need a manual to know that "Us" means both of you. The first time she makes a typo she will have no way to fix it, and the second time she will stop adding things. If edit/delete, a working shopping list, and a readable at-rest view arrived, it would be a "maybe": it already beats a Skylight on meals and on household reminders.

## 5. Expected but missing; found by accident

**Expected but missing**
- Edit or delete an event (blocker).
- Any message or sound confirming "saved".
- A "new" marker so the owner sees what Jenn added; a way to tell the owner about a change.
- A true sticky note (message without a time), shown big on the wall.
- A "Now / Next" strip on the wall: next event, what to bring.
- A visible clash warning.
- A text size control (or an obvious "bigger" button).
- A working shopping list from the board (and a dedicated button on the phone).
- Defaults that make sense: the calendar picker set to the signed-in person; new-event time near now or a morning slot; the date following the day you are looking at.
- A "today" button on the phone's month grid and a "home" screen that opens on today's list.
- A way to see another person's day (tap their name pill to filter): the pills with counts look tappable, but I never confirmed what they do.

**Found by accident**
- Swipe the month grid to change months.
- "More" > "Daily Digest" (exactly the glance the wall lacks).
- The house icon tab = house reminders (filter, smoke detectors).
- Settings > Calendars > "Layout ideas".
- Tapping an empty meal slot is the quickest way to plan dinner.
- Sidebar > To-do lists has the real shopping list.

## 6. Moments that felt good
- Opening the wall: colourful, weather icons, today's blue header, one glance gives a "home" feeling.
- "Tap to add dinner": a literal instruction right where it's needed, three taps to plan a meal.
- The day panel on the phone below the month grid: big, readable cards with the time and a coloured background per person.
- "Mark done" on the reminder: clear, one tap, gone.
- The owner's phone dark theme (auto dark) looked polished.
- The week list on the phone ("Next Week", per-day meal and weather header with person initials on each event).
- The Daily Digest card.

## 7. Confusing words and labels
- **"Calendar Entry"** (in the + menu) vs **"Calendar Event"** (inside the form) vs "Events": call it "Event" everywhere.
- **"Reminder"**: it's a to-do with a time, not a calendar item; the long explanation talks about "integration", "notify devices", "Home Assistant's own To-do UI". Call it "To-do with an alert" or just "Reminder" and drop the paragraph.
- **"Also for" and the "Calendar" dropdown**: two ways to say who it's for. Call it "Whose is this?" with Will / Jenn / Both / House.
- **"Us"**: say "Both of us".
- **"Meal Block", "Meal Suggestion", "Recipe"** in the + menu: three kinds of dinner thing; use "Dinner idea" or just tap the slot.
- **"Suggest"** button and the explanation "someone who can edit the menu decides whether it goes on": on the wall it went straight on, so use "Save".
- **"Suggestions"** and **"Recipe Box"** top buttons open the same panel.
- **"Hide work calendars: Off" with a padlock**: unclear what it protects or does; call it "Show Work" or "Privacy: show work events".
- **"Grocy"**: unknown word (the shopping panel's tabs "Grocy List" and "This Week's Meals"; "Grocy isn't connected yet"). Call it "Shopping list".
- **"Layout ideas - this device only (tap one to fill in the fields below, then Save)"**, **"Week button shows"**, **"Calendar top bar style"**, **"Minimal / Title only / Hidden"**: owner-hostile; offer "Text size: S / M / L" and "When I walk up show: Today / Week".
- **"This device" with a code like "Chrome-Linux_dev-mvu4..." and "Identify"**: jargon.
- **"Use global theme (Theme Builder)"** and **"Liquid Glass Tablet"** theme names.
- **"Roll over to next day if not completed"**: say "Repeat tomorrow if not done".
- **"+2 more"** in a day cell: ok, but with no hint it can be tapped.
- **"Go to this week →"**: the button on a phone day list; it actually opens a week list starting at the Sunday of the selected day, so it should read "Open this week" or "Show week".
- **"Events 53" and "Reminders 3"** pills: they look like filters.
- **"Family Hub Chores"** (empty default list), **"Owner_Reminders"**, **"Wall_Wish List"**, **"Jenn_Wish List"**: raw list names with underscores.
- **"5m, 10m, 15m, 30m, 1h, 2h, 1d"** reminder chips with two pre-ticked on every event (10m and 30m): unexplained, and the footnote "Needs the Family Hub integration installed to actually notify" is developer language.
- **"Not set"** under "Who's cooking" with a thumbs-up icon.

## 8. Top 10 changes by impact

1. Let anyone tap an event and change its time/title or delete it, with an "Are you sure?" on delete. Right now a typo is forever.
2. Make the shopping list on the board work: put one big "Shopping list" button that opens the real list, add items in one tap, tick them off in the store; drop the Grocy wording and remove the duplicate list.
3. Give the wall a "Now and next" strip at rest: today's next three things in big type, with notes like "bring the insurance card", a bigger text option, and hide the Home Assistant sidebar and top bar on the wall.
4. Say "Saved" (a short banner) after every add, and show a "new" marker for something added by the other person since you last looked; ideally send the owner a phone alert for items Jenn adds to "Us".
5. Make smart defaults: start on the signed-in person, the day you are looking at, and a sensible time (not 8 PM tonight); one "Who is it for?" choice with Will / Jenn / Both / House.
6. Add a real sticky note ("Note for Will") that shows large on the wall until someone taps "Got it", instead of using a timed to-do with a jargon paragraph.
7. Warn about clashes (same time, two events) with a small red dot, and show times on the month grid on the phone.
8. Put text size and "what the wall shows when I walk up" at the very top of Settings in plain words (Small/Medium/Large; Today/Week/Month), and make layout presets (like "Agenda") do what they say instead of squashing text letter by letter.
9. Clean the menus: one + menu with "Event, To-do/Reminder, Dinner" only; hide Recipe Box/Suggestions/Templates/Grocy until needed; fix the "Suggest" button on dinner so it saves.
10. Make the phone open on today's list with a "Today" button and a clear week view (starting today, not last Sunday); rename the unlabeled house icon tab "House" and tidy the twelve to-do lists to a handful of friendly names.

## 9. Caveats
- Data is made up and everything loaded instantly; real Wi-Fi delays and "did it save?" worries would be worse.
- Both "phones" are Chromium with an iPhone-sized screen; real iOS pickers (the date and time wheels), the real keyboard (covering the Save button), and the Home Assistant app's frame would add taps and surprises. My tap counts used direct field entry, so real counts are higher.
- No real notifications or sounds were possible, so "will the owner notice" can only be judged by what's on screen.
- The wall tablet is signed in as a limited user ("Wall"), which may explain the "Suggest" wording on dinner and could also be why edit/delete are missing for it; but the owner is an admin and still had no edit or delete anywhere, so I treat it as real.
- The practice copy has an empty or unconnected Grocy, no real weather feed (weather icons showed, but may be made up), and the default theme on the wall changed between my sessions (light on the wall, dark on the owner's tablet/phone): a quirk of the practice copy or of per-person themes.
- I did not verify what the person-count pills (Will 3, Jenn 3...) do when tapped, and a covering tile stopped me from testing "Hide work calendars".
- A mis-tap on the phone's week list put one "Tacos" on Tuesday 27 Oct instead of the intended evening; practice data only.
- The practice data already had a 7 pm "Date night" and a 4 pm "Vet" on the days I used, so clashes I describe were partly of my own making.

## 10. Checked afterwards (not part of the reviewer's walk)

Added by the session that ran the review, from the sandbox and the real house (read-only), 2026-10-29 evening.

- **Edit and delete do exist, on the Us calendar.** An Us event's sheet has "Edit event" and "Delete event". Will, Home and Work have neither, because on the house they're iCloud calendars, which Home Assistant can add to but not change. The reviewer's blocker is real in practice for a different reason: **the add form starts on Will**, the first column, so anything added from the board lands on a calendar the board can never change or delete, and the sheet doesn't say why. The same is true on the real house.
- **"Hide work calendars" can't hide Work on the real house either.** Family Hub's own Settings > Calendars list holds Will, Home, Us and Work again; that list overrides both dashboard copies, so the switch (and Guest mode, which flips it) has no effect. The house repo's J006 says to keep that list empty.
- **The Right Now card never loads on the real house:** its file is registered as a dashboard resource but isn't in the installed build.
- The wall's meal slot saying "Suggest" is real on the house too: the tablet signs in as a user who isn't an admin.

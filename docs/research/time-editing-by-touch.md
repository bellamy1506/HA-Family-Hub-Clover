# Changing a time or day by touch, on the wall and on a phone

Research note, 2026-10-30, for fork issue [#70](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/70) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)), feeding the event sheet prototype, [#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45). Question: which touch controls change an event's time or day fastest and with the fewest mistakes, at the 14-inch wall tablet and on an iPhone; what other calendars do; and how native `input type="time"` and `type="date"` behave in the Home Assistant iPhone app and in Fully Kiosk's Android WebView.

Not repeated here: target sizes, undo over confirm, change in place ([delight-and-discoverability.md](delight-and-discoverability.md) §1.9, §2); rough-text capture and the echo ([capture-friction.md](capture-friction.md)); the iCloud write path ([icloud-editing.md](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/icloud-editing/docs/research/icloud-editing.md)). **[inference]** marks my judgement or arithmetic; **(unverified)** marks what no primary source or device confirmed. Nothing was tried on the Clover Tablet or a real iPhone.

## The answer

Put two rows on the event sheet: the day, with ‹ › arrows that move the event a day per tap, and the time, with ‹ › arrows that move the whole event 15 minutes per tap, length kept. Tapping the day or time opens a grid of big buttons (the next two weeks; the hours, then :00 :15 :30 :45), so any change is two taps with no wheel, dial or keyboard. Changes show at once and save when the sheet closes, with Undo in the echo. The dentist moves from 3:30 to 4:00 in 4 touches and to the next day in 3, against 10 or 11 today, on the wall and the phone alike. Native pickers are the wrong base: iOS gives web pages 1-minute wheels (WebKit ignores `step`), Android WebView opens a system clock dialog about 4.5 cm across with Clear beside Set, and today's form loses the event's length when only the start changes. Dragging on the timeline is fastest on paper but least reliable on an upright screen at 40 px an hour; leave it out of the first sheet. A repeating event asks "This one / All" once, at the first change.

## 1. What's built today

- The week card's event sheet has an inline edit form (for calendars that allow changes): title, a native date input, native start and end time inputs, location, Save (`_renderEventInfoEditForm`, `card/family-week-calendar-card.js`).
- **Start and end are set separately.** Changing only the start makes the 3:30 to 4:30 dentist 4:00 to 4:30. If the new start reaches the old end, the code assumes the event runs past midnight and moves the end to the next day (`if (endTimeVal <= startTimeVal)`): a 3:30 to 4:00 event moved to 4:30 becomes 23.5 hours long **[inference from the code; not run]**.
- **A cleared field fails silently:** an empty start or end makes Save return without a word. Both native pickers have a button that empties the field (section 2). It also sends no `recurrence_id` (as icloud-editing.md §1 found for Delete).
- The timeline draws 40 CSS px an hour (`PX_PER_HOUR = 40`). At 0.252 mm per CSS px ([wall-display-legibility.md](wall-display-legibility.md) §1), a quarter hour is 10 px, about 2.5 mm, on the wall **[arithmetic]**.
- **Home Assistant's own editor** keeps the length when a new start passes the end ("Event end was adjusted to prevent negative duration") and asks after Update, for repeats: "Only this event" or "This and all future events" ([`dialog-calendar-event-editor.ts`](https://github.com/home-assistant/frontend/blob/dev/src/panels/calendar/dialog-calendar-event-editor.ts), dev branch, read 2026-10-30).

## 2. Native pickers in the two web views

**iPhone (Home Assistant app, WKWebView, Safari's engine).**
- WebKit shows **wheels for time** and **a month calendar for date**, each in a popover with Reset and Done, kept as a popover even on iPhone ([`WKDateTimeInputControl.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKDateTimeInputControl.mm), [`WKDatePickerPopoverController.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKDatePickerPopoverController.mm), main, read 2026-10-30; iOS 27 may differ, unverified).
- **No quarter hours.** Nothing sets `minuteInterval`. [WebKit bug 215090](https://bugs.webkit.org/show_bug.cgi?id=215090), "Support the step property of the input field with type datetime-local and time," filed 2020-08-03, is still NEW (last modified 2025-12-19). So 3:30 to 4:00 is 30 rows on the minute wheel plus one on the hour wheel.
- Apple's guidance asks for the opposite: "Consider providing less granularity when specifying minutes... quarter-hour intervals", and its compact picker confirms edits by "tapping outside the view" ([HIG, Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers), last changed 2023-06-05, read through its JSON).
- Reset empties the field, which today's Save then silently ignores.

**Wall (Fully Kiosk, Android 14).** Fully renders with the Android WebView the system provides and can't choose another engine ([Fully FAQ](https://www.fully-kiosk.com/docs/de/faq/badweb), German, undated, translated); the tablet ships Android 14 ([GSMArena](https://m.gsmarena.com/tcl_nxtpaper_14-ampp-13296.php)). Chromium's picker code ([`InputDialogContainer.java`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/public/android/java/src/org/chromium/content/browser/picker/InputDialogContainer.java), main, read 2026-10-30):
- `type="time"` with any step of a minute or more opens the system clock dial at 1-minute resolution; `step="900"` changes nothing.
- `type="date"` falls back to the system calendar dialog in WebView (the code comment names WebView).
- Every dialog has Set, Cancel and **Clear**, which empties the value.
- The system dial ([`RadialTimePickerView.java`](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/widget/RadialTimePickerView.java), AOSP main) moves from hour to minutes by itself and gives each 5-minute mark 14 of 360 degrees against 4 for other minutes ("more than 3 times easier to get"), so 4:00 is two taps. **In landscape** (`res/values-land/dimens_material.xml`) the dial is 180 dp across with 14 sp numbers, and calendar days are 46 by 32 dp.
- **[inference]** Here 1 dp is 1 CSS px, so on the wall the dial is about 4.5 cm, an hour about 9 mm of arc, a 5-minute mark about 4 mm, day cells about 12 by 8 mm, all under the delight note's 2 cm for standing actions, in the system's theme, not the board's. TCL may restyle it (unverified).

**Usable?** On the wall, barely; on the iPhone, slowly. **Neither honors 15-minute steps.**

## 3. The controls against the evidence

| Control | Evidence | Wall | Phone |
|---|---|---|---|
| Wheels | Android wheels beat a dial on the first try; the dial was "significantly faster" after a few ([Skogstrøm et al., NordiCHI 2018](https://doi.org/10.1145/3240167.3240233), abstract). A custom date spinner was slowest of three, 13.25 s against 6.31 s for drop-downs, least liked, "too high" sensitivity ([Romikaitytė et al., CHIRA 2022](https://www.scitepress.org/Papers/2022/115778/115778.pdf), 277 people, read in full). Apple replaced alarm wheels with typing in iOS 14 and restored them in iOS 15 ([iMore, 2021-06-08](https://www.imore.com/ios-15-brings-ios-13-style-time-and-date-picker-back)). | Not offered | iOS's only web time picker, 1-minute rows |
| Clock dial | Faster once learned (Skogstrøm). Material: "often used for setting an alarm or calendar event" ([docs](https://github.com/material-components/material-components-android/blob/master/docs/components/TimePicker.md)). | The WebView's dialog | Not offered |
| Stepper | For "fields that have one commonly entered value" and small changes; "Avoid this GUI control for values with large variability"; long press repeats ([NN/g, Zhou, 2018-11-11](https://www.nngroup.com/articles/input-steppers/)). | Good: big arrows, result shown each tap | Good |
| Quick chips | No study found. NN/g: "For a limited number of date options, provide a list" ([Li, 2017-01-22](https://www.nngroup.com/articles/date-input/)). | Good if few | Good |
| Grid of times or days | Same NN/g advice; calendar pickers for dates "within less than a year" (Li). On phones, typed text was fastest and a calendar view slowest and most error-prone (Türkcan and Onay Durdu 2018, via Romikaitytė). | Two taps for any quarter hour | Good |
| Drag on the timeline | Finger drags are slower than mouse or stylus, from friction ([Cockburn et al., IJHCS 2012](https://hdl.handle.net/1880/50826), abstract). Standing at an upright surface against a flat one: drags 5% slower, 14.8% of drops failed against 9.9%, shoulder fatigue 7.0 against 3.9, contact harder to keep "especially in the lower part" ([Pedersen and Hornbæk, NordiCHI 2012](https://www.kasperhornbaek.dk/papers/NordiCHI2012_VerticalHorisontal.pdf), 16 people, read in full). | Risky: 2.5 mm per quarter hour, finer than a fingertip lands (7 to 12 mm, delight note) | Day and week views only |
| Rough text or voice | Typing beats pickers for far dates (Li). Siri moves events ("move my 3 p.m. meeting to 4 p.m.") and asks which when several match ([BGR](https://www.bgr.com/2289613/things-siri-can-do-with-phone-calendar/), [iMore](https://www.imore.com/how-to-use-calendar-with-siri), via search). | Keyboard covers the board | Voice fits; no edit path yet |

**[inference]** Moving an event is a few-times-a-month act, so nearly every use is a first use. That favors controls that show their result before you commit (arrows, grids, named chips) over ones that reward practice (dials) or care (wheels, drag).

## 4. What the products do

- **Apple Calendar** ([iPhone User Guide, iOS 27](https://support.apple.com/guide/iphone/create-and-edit-events-in-calendar-iph3d110f84/ios)): "touch and hold the event, then drag it to a new time, or adjust the grab points" in Day or Week view; otherwise "Tap the event, then tap Edit." Repeats ask on save (wording seen only in Apple Community posts).
- **Google Calendar** (Android help, [create](https://support.google.com/calendar/answer/72143?co=GENIE.Platform%3DAndroid), [repeating](https://support.google.com/calendar/answer/37115?co=GENIE.Platform%3DAndroid)): "drag and drop it to a new time and date"; repeats ask after Save, "This event" or "All events" (this one and all after it).
- **Fantastical** ([iOS help](https://flexibits.com/fantastical-ios/help/editing-events-and-tasks)): tap and hold to drag, white handles for length, or Edit.
- **Skylight** ([The Calendar Tab](https://skylight.zendesk.com/hc/en-us/articles/36625171368987-The-Calendar-Tab), updated 2026-10-28): tap the event, the edit button, "press the date and time boxes and adjust as needed," Save; an "All day" box; delete "cannot be undone." No drag documented.

**[inference]** All pair a drag shortcut with a full form; none documents quick moves in the sheet. The drag is what doesn't transfer to a wall.

## 5. Tap counts

The dentist, Tuesday 3:30 to 4:30, a one-off on Us. Counts include opening the sheet and saving or closing it. A repeating event adds one tap ("This one / All") everywhere.

| Candidate | 3:30 to 4:00 | To the next day |
|---|---|---|
| Today's form, wall (dial dialogs; start and end both changed) | 11 | 6 |
| Today's form, iPhone (wheels; start and end both changed) | 10, with 3 wheel spins | 6 |
| Native inputs, end following start | 6 to 7 | 5 to 6 |
| **Arrows, saved on close** | **4** (open, ›, ›, close) | **3** |
| Chips naming the result ("4:00", "Wed"), applying and closing | 2 | 2 |
| Grid behind the time or day | 4 to 5 | 3 |
| Drag on the wall timeline | 1 long press, a 5 mm drag | 1 drag about 7 cm sideways |
| Typed in the sheet | 4 to 6, keyboard up | 4 to 8 |
| Voice ("move the dentist to 4") | none; not built | none; not built |

## 6. All-day, multi-day, and "This one / All"

- **All-day** is one switch or box everywhere above; Home Assistant moves both ends to midnight. All-day ends are exclusive (today's card adds a day), so show "through Saturday" and store Sunday **[inference]**.
- **Multi-day** shows as one bar (Skylight help); here it's mostly all-day trips and visits **[inference]**.
- **Repeating:** Apple, Google and Home Assistant ask after Save; a sheet without Save must ask earlier **[inference]**. Decided: Hide asks "This one / All" ([#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61)); the iCloud path offers only those, and its "All" edits the whole series, past occurrences included, unlike Google's and Home Assistant's "all after". A note only: moving every Tuesday also moves past Tuesdays on the board.

## Implications for the house board

1. **The controls that change a time or day** (for the owner, at [#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45)), the same on the wall and the phones:
   - **A. Arrows:** day ‹ › one day per tap, time ‹ › 15 minutes per tap (long press repeats); tapping the day or time opens a grid. Confidence 0.55.
   - **B. Chips naming the result:** a few nearby times and days ("4:00", "4:30", "Wed", "Next Tue") that apply at once, plus the same grids. Confidence 0.30.
   - **C. Today's native pickers,** with the traps in item 8 fixed. Confidence 0.10.
   - **D. Drag on the wall's timeline** as the main way. Confidence 0.05.
   - Recommendation: **A.** One predictable control that shows its result each tap; a mistake is one step, undone by the other arrow; nearby moves take 3 or 4 touches, any quarter hour or day in two weeks 4 or 5. It gives up one or two taps against B on the commonest moves, whose chips guess which moves are common (no data found).
2. **Moving keeps the length** (technical call; the owner can veto). Start and end move together; length changes on its own ("for 1 hr" on the time row, or under More).
3. **Show at once, save on close, Undo in the echo** (technical call; the owner can veto). No Save button for time and day: the event moves on the board behind the sheet, and one write happens when the sheet closes (the HIG's "tapping outside the view"). The echo names weekday and date: "Dentist moved to 4:00 pm, Tue Nov 3. Undo."
4. **The grids** (technical call; the owner can veto). Days: the next 14 as buttons with weekday and date, today and tomorrow named, "Later" for a month. Times: hours 6 am to 11 pm, then :00 :15 :30 :45. Odd minutes stay with the phones' calendar apps.
5. **Where "This one / All" sits** (for the owner, at [#45](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45)):
   - **A. Ask at the first change, in place:** the first tap swaps the row for "This one (Tue Nov 3)" and "All (every Tuesday)"; the answer holds for that sheet. Confidence 0.60.
   - **B. Change this one; offer "All Tuesdays too" in the echo.** Confidence 0.30.
   - **C. A This one / All switch at the top,** set to This one. Confidence 0.10.
   - Recommendation: **A.** It asks only for repeating events, when it matters, in the words decided for Hide, for one tap per sheet. It gives up B's zero-tap common case, which would hide "All" in an echo that fades in seconds.
6. **All-day and multi-day** (technical call; the owner can veto). An "All day" switch on the time row; switching it off restores the old time, or 9:00 for an hour. A "Through" row with arrows only for all-day events, shown inclusive. Timed multi-day events stay with the phones.
7. **One sheet for wall and phone** (technical call; the owner can veto); on the phone the day and time rows sit low, within thumb reach.
8. **No native date or time inputs in the house board; fix the week card's form meanwhile** (technical call; the owner can veto): move the end with the start, and say something when a field is empty. Small tier 2 fixes with tests.
9. **No drag in the first sheet** (technical call; the owner can veto). If added later: wall only, between day columns (about 7 cm targets), after a long press, with a live time label and 30-minute snapping; never the only way.
10. **Voice moves later** (technical call; the owner can veto). The edit service capture-friction.md item 7 proposes for voice undo can take "move the dentist to 4", finding the one event meant and echoing weekday and date.

## What this says not to do

- **Don't count on `step` for quarter hours;** neither web view honors it.
- **Don't make dragging the wall's main way to move things,** or raise a keyboard there to change a time.
- **Don't move start and end separately by default.**
- **Don't label a chip "Tomorrow" for an event that isn't today;** name the day it lands on.
- **Don't let Clear, Reset, an empty field or a closed sheet lose a change without a word.**

## Gaps

- **Not tried on the devices:** the TCL's dialog styling, the popover in the Home Assistant app, typed digits in WebKit's wheels. WebKit and Chromium were read on main, not shipped versions.
- **Abstracts or summaries only:** Skogstrøm 2018 (no sample size or error rates), Cockburn 2012, Türkcan and Onay Durdu 2018. Baymard's date picker research is paywalled; Material 3's pages need a browser (its Android docs were read instead).
- **No study of chips or steppers for times, and no data on how far household events move.** The tap counts are counts, not timings.
- **Unconfirmed on primary pages:** Apple's iPhone wording for repeating saves; Skylight's picker style or any drag.
- **The 23.5-hour case** was read in the code, not run.

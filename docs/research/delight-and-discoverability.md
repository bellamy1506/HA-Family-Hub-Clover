# Delight and discoverability: the hand on the glass

Research note, 2026-10-29. Question: how do the best consumer interfaces make everyday chores comfortable, sometimes pleasant, and make every capability findable at the moment it's needed without tutorials, manuals or hidden gestures; and what does that mean for a shared kitchen-wall calendar board (1200 x 800 CSS px touch tablet plus iPhones) used by two adults? Lens: comfort, small earned joys, and never being lost. Companion to [skylight-calendar.md](skylight-calendar.md) and [wall-display-legibility.md](wall-display-legibility.md), which this note doesn't repeat.

Lines marked **[inference]** are my own judgement, not something a source states. Where I saw only an abstract, a summary or a search snippet, the line says so. Apple's Human Interface Guidelines (HIG) pages carry no date; they were read on 2026-10-29.

## 0. What the board does today (read from the served card, 2026-10-29)

The findings below are judged against these, all read in `custom_components/family_hub/card/family-week-calendar-card.js`, not tried on the tablet:

- **Add:** the + button opens a modal form: calendar (first person preselected), title, date (the selected day), time (next whole hour, one hour long), reminders at 10 and 30 min preticked, location, notes, a checklist, "Also for" (`_openAddEvent`). With an empty title, Save does nothing and says nothing (`_saveAddEvent`: `if (!entity || !title) return;`).
- **Tapping empty space** in the grid does nothing; only an element with `data-event-id` responds ([card-map.md](../agents/card-map.md#rendering)).
- **Delete:** a browser `window.confirm`: "Delete "X"? This can't be undone here...". After OK the event goes, the popup closes, and no message or undo follows. On a calendar that can't delete (the iCloud calendars are add-only, J008), the Delete row is hidden without a word (`_wireEventInfoDeleteButton`).
- **"This one or all?"** choices (a reminder override, a weekly meal) are OK/Cancel confirms whose text says "OK - update ... all", "Cancel - only this one".
- **Toast:** `_showToast(message, isError)`: text only, 2.2 s (4.5 s for errors), no action button.
- **Title-only top bar** (on for the tablet, [clover-tablet-loop.md](../agents/clover-tablet-loop.md)): the arrows and view switcher are hidden; "swipe still pages"; Settings moves into the + menu.

## 1. Findings by mechanism

### 1.1 Bridge the two gulfs: signifiers, feedback, mapping

- Norman's two gulfs: **execution** ("taking action to accomplish a specific goal") and **evaluation** ("understanding the state of the system"). Bridges: visible system status, and designs that match what people already know (Whitenton, NN/g, 2018-03-11, https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/).
- "Forget affordances: what people need, and what design must provide, are signifiers": a signifier is "some signal ... that can be interpreted meaningfully" (Norman, *Interactions* 15(6), 2008, https://jnd.org/signifiers-not-affordances/).
- Norman and Tognazzini on Apple's drift: the old Mac let you "discover what actions are possible ... receive unambiguous feedback ... and have the power to reverse that action"; now "obscure gestures that are beyond even the developer's ability to remember" and "great features that most people don't realize exist". People "tend to blame themselves for the shortcomings of their devices" (*Fast Company*, 2015-11-10, https://www.fastcompany.com/3053406/how-apple-is-giving-design-a-bad-name ; read through Firecrawl, since direct fetch was refused; only the opening sections were visible).
- Gestures: "How is anyone to know, first, that this magical gesture exists"; "Accidental activation is common in gestural interfaces"; undo is "one of the most brilliant inventions ... largely forgotten" (Norman and Nielsen, *Interactions* 17(5), 2010-05-28, https://jnd.org/gestural-interfaces-a-step-backwards-in-usability/).
- Apple's own rule: custom gestures must be discoverable and "Not the only way to perform an important action"; "Use shortcut gestures to supplement standard gestures, not replace them" (HIG, Gestures, https://developer.apple.com/design/human-interface-guidelines/gestures). NN/g: hiding key actions behind a swipe "prevents users from discovering them" (Li, 2017-02-12, https://www.nngroup.com/articles/contextual-swipe/).
- **[inference]** Two board gaps sit right here: paging by swipe only under the title-only bar (a hidden gesture), and the Delete row that vanishes on iCloud events (no signifier for *why* nothing is offered, so the gulf of execution is silent). A missing control with no explanation reads as "I'm doing it wrong", the self-blame Norman and Tognazzini describe.

### 1.2 Safe to try: undo instead of "are you sure?"

- Raskin: people habituate to confirmations, so warnings fail when they matter; he proposed universal undo, "every action should be undoable" (*The Humane Interface*, Addison-Wesley, 2000; via https://en.wikipedia.org/wiki/The_Humane_Interface and Garfinkel's review, *Salon*, 2000-06-01, https://www.salon.com/2000/06/01/undo/). The Raskin Center's summary: "If all actions are reversible, users can explore freely" (undated, https://www.raskincenter.org/rchi/core-principles).
- "Never use a warning when you mean undo"; "The more in-your-face the warning is, the faster we'll want to get away from it." Gmail's immediate inline undo is the praised case; Google Calendar's warning-without-undo the criticised one (Aza Raskin, *A List Apart*, 2007-07, https://alistapart.com/article/neveruseawarning).
- Nielsen: reserve confirmations for serious, irreversible actions; "if you cry wolf too many times, people will stop paying attention"; label buttons with outcomes, not Yes/No; "go to great lengths to provide undo" (NN/g, 2018-02-18, https://www.nngroup.com/articles/confirmation-dialog/).
- Apple: "Avoid displaying alerts for common, undoable actions, even when they're destructive"; "Avoid using OK as the default button title unless the alert is purely informational"; button titles should describe the result (HIG, Alerts, https://developer.apple.com/design/human-interface-guidelines/alerts). Undo "can also help people explore and experiment safely as they learn a new interface" (HIG, Undo and redo).
- Getting out of trouble "encourages exploration, which facilitates learning and discovery of features" (Rosala, NN/g, 2020-11-29, https://www.nngroup.com/articles/user-control-and-freedom/).
- Material Design's snackbar: a brief message with at most one action, such as Undo, that times out, never for critical information, one at a time (M3 guidelines outline, https://m3.material.io/components/snackbar/guidelines; outline only).
- **[inference]** On a shared wall, undo is what makes the board feel safe for Jenn and a house-sitter to touch: nothing they do can lose the owner's data. The board's OK/Cancel confirm for "this one or all" breaks Apple's and Nielsen's labelling rule twice: OK and Cancel each mean a different *action*, and Cancel doesn't cancel.

### 1.3 Modes and modal forms

- Raskin: a mode is a state where the same input does different things; prefer modeless designs, or quasimodes held only while a key is held (Wikipedia summary above). "The ideal interface is one that users do not notice while they are using it" (Raskin Center).
- Modals "interrupt the user's workflow", "block the content in the background" and "cause users to forget what they were doing"; justified for irreversible errors or input needed to continue; place choices in the content where possible (Fessenden, NN/g, 2017-04-23, https://www.nngroup.com/articles/modal-nonmodal-dialog/).
- **[inference]** The add form covers the very week the person is placing the event into. A sheet that leaves the target day visible, and fields changed in place on the event itself, keep context.

### 1.4 Learning without tutorials

- The paradox of the active user: people "never read manuals"; they start at once to get the task done; "design for the way users actually behave" (Nielsen, 1998-10-04, on Carroll and Rosson 1987, https://www.nngroup.com/articles/paradox-of-the-active-user/).
- Measured: 70 people, four iPhone apps with card-deck tutorials. Readers' success 91% vs skippers' 94% (n.s.); task time no different; readers rated tasks *harder* (4.92 vs 5.49 of 7, p = 0.047). Advice: improve the UI first; if help is needed, make it contextual (Kendrick, NN/g, 2020-03-08, https://www.nngroup.com/articles/mobile-tutorials/).
- **Push vs pull revelations:** push help (launch tips) "isn't relevant to the users' goals" and is "often ignored ... because they get in the way"; pull help appears in the flow it explains and is "less likely to be ignored because they provide timely information" (Kendrick, NN/g, 2020-12-13, https://www.nngroup.com/articles/help-and-documentation/).
- Coach marks: users "dismiss them quickly and do not read thoroughly"; chains of hints make the app seem complicated; show one hint at the moment it applies (Harley, NN/g, 2014-02-16, https://www.nngroup.com/articles/mobile-instructional-overlay/).
- Apple: understanding "simply by experiencing it" is the ideal; if onboarding is needed, make it "fast, fun, and optional"; prefer "context-specific tips"; "Provide reasonable default settings" (HIG, Onboarding). For tips: one or two sentences; a feature needing more than three actions is too complex for a tip; show a tip only "if someone might benefit"; pace multiple tips "for example, once every 24 hours"; no promotion (HIG, Offering help, the TipKit guidance).
- Empty states: say what the space is for and why it's empty, teach the feature as a "pull" hint, and give a direct path (a button) to fill it (Kaplan, NN/g, 2021-09-19, https://www.nngroup.com/articles/empty-state-interface-design/). Apple: "Provide clear next steps on any blank screens" (HIG, Writing).
- Progressive disclosure works only if it's "obvious how users progress from the primary to the secondary disclosure levels" and the first level holds what's used most (Nielsen, 2006-12-03, https://www.nngroup.com/articles/progressive-disclosure/).
- Recognition over recall: "Recognition is easier than recall because it involves more cues"; gestures depend on recall and need signifiers or tips; label icons (Budiu, NN/g, 2024-01-15, https://www.nngroup.com/articles/recognition-and-recall/).
- Defaults: most people never change them, so the default *is* the experience; prefill the predictable value (Nielsen, 2005-09-25, https://www.nngroup.com/articles/the-power-of-defaults/).
- **[inference]** The board's biggest discoverability gap is off-screen: the capture paths that matter most ("Hey Siri, tell the board", forwarding an email) leave no trace on the wall. A pull revelation at the moment of adding is where to show them.

### 1.5 Forgiving input

- Slips happen on autopilot. Prevent them with constraints, suggestions, good defaults, and **forgiving formatting**: accept what people naturally type and tidy it (Laubheimer, NN/g, 2015-08-23, https://www.nngroup.com/articles/slips/). Postel's law for UX: be "tolerant of any of the various actions the user could take or any input they might provide" (Laws of UX, undated, https://lawsofux.com/postels-law/).
- Horvitz's mixed-initiative principles, from a system (LookOut) that read emails and proposed calendar entries: minimise "the cost of poor guesses"; "A preference for 'doing less' but doing it correctly under uncertainty"; when LookOut couldn't find a confident day and time, "rather than making a poor guess" it opened the right week view. It waited, then "evaporate[d]" with an apology if ignored, "an intuitive, courteous butler" (Horvitz, CHI 1999, pp. 159-166, https://erichorvitz.com/chi99horvitz.pdf).
- Consumer practice: Fantastical takes an event "the way you would speak it" ("Haircut tomorrow at Quick Cuts 10am alert 30 minutes"), with "at", "with", "/calendar" keywords (Flexibits help, undated, https://flexibits.com/fantastical/help/adding-events-and-tasks). Things accepts "Tom", "Sat", "Wed 8pm" (Cultured Code, undated, https://culturedcode.com/things/features/).
- Family calendars: in a month-long field trial with four families, handwriting on sticky notes mattered because it "lets Kayla and her family freely format notes to fit their personal style"; guideline 1 was "Support Simple and Flexible Interaction" (Neustaedter, Brush and Greenberg, Graphics Interface 2007, https://grouplab.cpsc.ucalgary.ca/grouplab/uploads/Publications/Publications/2007-LinkFieldTrial.GI.pdf).
- **[inference]** "Dentist tue 3" should land as *something*: if the parser is sure, a timed event; if not, Horvitz's "do less, correctly" (an entry on Tuesday with the time field open), never a refusal and never a silent no-op like today's empty-title Save.

### 1.6 Feedback in the small: microinteractions and timing

- Saffer's anatomy: trigger, rules, feedback, loops and modes (*Microinteractions*, O'Reilly, 2013; table of contents at https://www.oreilly.com/library/view/microinteractions/9781449342760/ ; the book itself not read). Norman's foreword: "The details are what control the moment to moment experience"; an error message with no remedy: "Of what use is an error message that provides no remedy?" (jnd.org, 2013-06-02, https://jnd.org/microinteractions-my-foreword/).
- Response limits: 0.1 s feels instantaneous; 1 s keeps the flow of thought; 10 s is the limit of attention, beyond which show progress (Nielsen, 1993, updated 2014, https://www.nngroup.com/articles/response-times-3-important-limits/).
- Apple: feedback should "match the significance of the information to the way it's delivered"; put status "near the items it describes"; "don't warn people when data loss is the expected result of their action"; "confirm that a significant action or task has completed" (HIG, Feedback).
- **[inference]** A calendar save that reaches iCloud in 1 to 3 s needs an instant local sign (the event appears where it will be, marked pending) and then a quiet settle. A 2.2 s toast is too short to hold an Undo; Material and Gmail use several seconds.

### 1.7 Emotion: why comfort comes before joy

- Positive affect makes people "more tolerant of minor difficulties"; stress and anxiety "focus the mind" into tunnel vision, so "good human-centered design practices are most essential for tasks or situations that are stressful" (Norman, "Emotion & Design: Attractive things work better", *Interactions* 9(4), 2002, https://jnd.org/emotion-design-attractive-things-work-better/). Norman's later visceral, behavioural and reflective levels (*Emotional Design*, 2004) were seen only through secondary summaries (https://en.wikipedia.org/wiki/Emotional_Design).
- Walter's hierarchy, bottom up: functional, reliable, usable, pleasurable (*Designing for Emotion*, A Book Apart, 2011). NN/g's reading: **surface delight** is local (animation, microcopy, sound), "often gimmicky and risky if the underlying product is weak"; **deep delight** comes once all four levels hold; "a product can be delightful only if it is usable" (Fessenden, NN/g, 2017-03-05, https://www.nngroup.com/articles/theory-user-delight/).
- Changuel (product manager at Google, Spotify and Microsoft) defines deep delight as meeting a functional and an emotional need together (Gmail Smart Compose: "reduced cognitive load, confidence, and reassurance"); surface delight "fades just as quickly" (newsletter, 2025-06-03, https://nesrinechanguel.substack.com/p/getting-started-with-product-delight ; book summary, Thiga, 2025-09-23, https://www.media.thiga.co/en/product-delight-key-takeaways). I found no Google *research study* behind the surface/deep split; the terms trace to Walter.
- **Kano:** attractive qualities ("delighters") don't hurt when absent and please when present, but drift: "a cup holder in a car may be today's delighter, but tomorrow it will be expected" (University of Cambridge IfM, ©2016, https://www.ifm.eng.cam.ac.uk/research/dmg/tools-and-techniques/kano-model/). Kano's hypothesised life cycle runs indifferent, attractive, one-dimensional, must-be (Kano 2001, "Life Cycle and Creation of Attractive Quality", 4th QMOD conference; seen via an abstract snippet and Witell, Löfgren and Gustafsson, QMOD 2008, https://ep.liu.se/ecp/033/048/ecp0803348.pdf, which notes empirical work is sparse). A reviewer of Things 3, an app "full of little delights": "that initial sense of awe wore off after a few days of use" (MacStories, 2017-05, https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/).
- **Peak-end:** cold-water trials, 60 s at 14 °C versus the same 60 s plus 30 s more as the water warmed to 15 °C; a significant majority chose to repeat the *longer* one (Kahneman, Fredrickson, Schreiber and Redelmeier, *Psychological Science* 4(6), 1993, pp. 401-405; abstract read from the scanned PDF). For design: negative peaks are remembered vividly, end on a good note, don't blame the user for a failure (Kane, NN/g, 2018-12-30, https://www.nngroup.com/articles/peak-end-rule/).
- **[inference]** For an obligation nobody enjoys, the peak is the worst moment (a confusing form, a vanished event) and the end is the moment after Save. So the joy worth designing is a clean finish: the thing visibly in place and the mind released. Surface delight decays (Kano, Things) and deep delight (relief) doesn't, because the need recurs every time.

### 1.8 Celebration, games and tone with adults

- Asana, the best-known adult celebration, made it **opt-in** and "occasional" (Asana blog, 2016-03-22, https://asana.com/inside-asana/new-celebrations-the-narwhal); a later guide gives the switch, My Settings > Display (Zapier, undated, https://zapier.com/blog/asana-celebrations/).
- Duolingo's own account of the streak leans on loss aversion and admits "the fear of losing a streak could prevent learners from even attempting one", and breaking one feels "quite demotivating" (Duolingo blog, 2022-01-31, https://blog.duolingo.com/how-duolingo-streak-builds-habit/). A qualitative study (nine years of forum posts plus 15 interviews) found users who "become too fixated on gamification and get distracted from learning" (Hadi Mogavi et al., L@S 2022, https://arxiv.org/abs/2203.16175; abstract only).
- Tone, measured: 100 US adults rated paired copy. Casual, conversational, moderately enthusiastic copy did best; humour won friendliness but lost trust for an insurer ("The friendliness kind of takes away some of the credibility"), and some found it "corny"; trust explained about 52% of willingness to recommend, friendliness about 8% (Moran, NN/g, 2016-08-07, https://www.nngroup.com/articles/tone-voice-users/).
- Style guides agree. Mailchimp: tone adapts to the reader ("You wouldn't want to use the same tone of voice with someone who's scared or upset"); "forced humor can be worse than none"; "If you're unsure, keep a straight face"; "It's always more important to be clear than entertaining" (©2023, https://styleguide.mailchimp.com/voice-and-tone/). Apple: "Avoid the temptation to be too cute or clever"; "oops!" and "uh-oh" "can sound insincere"; "avoid blame"; label buttons with verbs ("'Send' often works better than 'Let's do it!'") (HIG, Writing). Walter: "when the situation is serious, the funny business stops"; "Blocking a busy user's workflow is always a bad idea"; Clippy is the "anti-inspiration" (book summary, 2016-03-31, https://manassaloi.com/booksummaries/2016/03/31/designing-for-emotion-arron-walter.html).
- **[inference]** What adults find patronising, from these sources: praise for trivial acts, mascots, jokes about chores they resent, and guilt for not using the product. None of the sources found studies that directly.

### 1.9 Touch on a wall

- Minimum target 1 cm x 1 cm, from Parhi, Karlson and Bederson's 9.2 mm (single taps) and 9.6 mm (serial taps); about 2 mm between targets; bigger for important actions and hurried contexts (Target's primary buttons were about 2 cm) (Harley, NN/g, 2019-05-05, https://www.nngroup.com/articles/touch-target-size/; Parhi et al., MobileHCI 2006, https://dx.doi.org/10.1145/1152215.1152260, abstract only).
- Hoober: touch accuracy "varies from 7 mm at the center of the screen to 12 mm at the corners"; people "prefer to touch the center"; make whole rows tappable; design about 20% larger (UXmatters, 2017-07-10, https://www.uxmatters.com/mt/archives/2017/07/design-for-fingers-touch-and-people-part-3.php).
- Apple's default control is 44 x 44 pt, minimum 28 x 28 pt; about 12 pt padding around bezelled controls, 24 pt around unbezelled ones (HIG, Accessibility). WCAG 2.5.5 (AAA): 44 x 44 CSS px, for tremor, large fingers and one-handed use (W3C, https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).
- Standing at a mounted screen: a 10-student study at Kanazawa found 20 mm buttons "enough in practice" (10 mm hurt visibility) and an optimum of 1124 to 1251 mm height at a 44 to 68 degree tilt; Japan's JIS Z8519 puts vertical touch screens below shoulder height (*Applied Ergonomics*, 2019; via ScienceDaily, 2019-09-19, https://www.sciencedaily.com/releases/2019/09/190919093940.htm). Search snippets of other studies said vertical touch causes more arm fatigue than horizontal (not read).
- **[inference]** On this board, 1 cm = 39.7 CSS px (100.85 CSS px/in, from the legibility note). So: about 40 px minimum for anything, about 80 px (2 cm) for the actions people use standing (+, a day's add, check-offs, Undo), and nothing essential in the corners. The board hangs flat (vertical, outside the study's tilt optimum), which argues for short touch sessions and the primary actions in the middle band, between elbow and shoulder height of the shorter adult.

### 1.10 A shared, walk-up screen

- Households share devices and accounts widely, and phones too, even though people call them personal; trust and convenience drive it (Matthews et al., CHI 2016, https://research.google/pubs/pub44670/; abstract only). Sharing is commonest for devices in shared rooms (Brush and Inkpen, UbiComp 2007, as reported by citing work; not read).
- The LINC trial again: "If there's no colors on there I don't worry about the day. If there's a color on there I know"; one mother coloured laundry grey "because she said it wasn't fun"; families barely used automated reminders because they looked at the calendar daily; a change log mattered mainly for changes made away from home (GI 2007, above).
- **[inference]** Safe walk-up use needs three things the sources point to: no login or account switching at the wall (Kiosk Mode is already planned, J008 step 6), every action reversible, and no state left behind (a half-filled form or a changed view) that surprises the next person.

### 1.11 Comfort for obligations nobody wants

- Task aversiveness is among the strongest and most consistent predictors of procrastination (Steel, *Psychological Bulletin* 133(1), 2007, pp. 65-94, meta-analysis of 691 correlations, https://ucalgary.scholaris.ca/items/d0dea740-4751-4e9a-84da-2d8ad446830d/full; abstract).
- Fogg: "Simplicity is a function of your scarcest resource at that moment"; "scale back the target behavior so it is easier to do" (©2026, https://behaviormodel.org/ability/).
- **The "it's handled" relief is real and comes from the plan, not the doing.** Making a specific plan for an unfulfilled goal "eliminated the various activation and interference effects" that open goals otherwise cause (Masicampo and Baumeister, *JPSP* 101(4), 2011, pp. 667-683, https://doi.org/10.1037/a0024192; abstract via search snippets). Plans that fix when and where ("implementation intentions") had d = .65 on goal attainment across 94 tests (Gollwitzer and Sheeran, *Advances in Experimental Social Psychology* 38, 2006, pp. 69-119; via secondary summaries).
- The mental load of a household is cognitive labour: anticipating needs, identifying options, deciding, and monitoring; in 35 couples, women did more of it, especially anticipation and monitoring (Daminger, *American Sociological Review* 84(4), 2019, pp. 609-633; abstract via search results).
- Calm technology moves information between the periphery and the centre; "Less is more, when less bandwidth provides more calmness" (Weiser and Brown, Xerox PARC, 1995-12-21, https://calmtech.com/papers/designing-calm-technology.html).
- **[inference]** Comfort for a dreaded entry means: the fewest decisions at the moment of capture (what and roughly when), a neutral tone (no cheer about a colonoscopy), and an immediate, specific echo of where it landed. Monitoring then belongs to the board, not to a person.

## 2. Pattern library for the board's common actions

Each action: the comfortable version, the discoverable version, and one candidate small joy. All **[inference]** from section 1.

**Add an event**
- *Comfortable:* tap the day (or the hour) where it goes; a sheet opens with that day, time and person already set and one field first, "What?", which accepts rough text ("dentist tue 3") and shows what it understood before saving. Everything else (place, notes, reminders, checklist) sits under "More". On phones, voice and forwarding stay the main path.
- *Discoverable:* the + stays, and the day itself is a target (the LINC "drop it on the day" and Things "drag the + where it goes" idea, done as a tap). The sheet carries one pull hint: "You can also say 'Hey Siri, tell the board ...'".
- *Small joy:* the event appears in place at once with a brief settle (feedback that also shows mapping), and a plain line: "On the board. On your phone in a minute." The relief is the joy; no confetti.

**Change or delete one**
- *Comfortable:* tap the event; its time and title change in place; Delete happens at once and offers "Undo" for several seconds. Repeats ask "Just this one" or "Every week" as two labelled buttons.
- *Discoverable:* where the board can't change an event (iCloud is add-only, Jenn's Google is read-only), say so where the buttons would be: "This is on [name]'s iPhone calendar. Change it there." Never a silent gap.
- *Small joy:* none: keep it quiet. Changes are often bad news.

**Check off a note ("Us" notes, house reminders)**
- *Comfortable:* the whole row is the target; a tap ticks it; it moves to a visible "Done" group, which doubles as undo.
- *Discoverable:* the Done group shows; a tap on it unticks.
- *Small joy:* a crisp, short tick (under about 300 ms, only on the hand's own action). For a house reminder, the echo says it's logged and when it next comes up ("Filter: done. Next one in March"), which hands the monitoring to the house.

**Plan a meal**
- *Comfortable:* tap the dinner slot on a day; type a dish or pick one of the recent dinners (recognition over recall).
- *Discoverable:* an empty slot reads "Dinner?" and is itself the button (an empty state that acts).
- *Small joy:* none: keep it quiet.

**Add to the shopping list**
- *Comfortable:* the entry field is always there; after Enter it stays ready for the next item; voice ("tell the board, add milk") works today.
- *Discoverable:* past items offered as suggestions while typing.
- *Small joy:* none: keep it quiet.

**Find a setting**
- *Comfortable:* almost nothing needs setting at the wall; the defaults are the household's choices.
- *Discoverable:* one labelled Settings control, not tucked inside the + (which means "add"); a setting worth changing in the moment is offered where it applies (for example, a view switch on the view itself).
- *Small joy:* none.

**Recover from a mistake**
- *Comfortable:* every common action reversible for several seconds through one labelled Undo; ticked items stay in Done; nothing asks "are you sure?" except an action that truly can't be undone.
- *Discoverable:* the Undo appears at the moment of need and names what it undoes ("Undo delete 'Dentist'"); no shake, no hidden history.
- *Small joy:* none added; not losing anything is the joy.

## 3. Implications for this board

Ranked by value for effort. "Serves" uses the mission's measures (capture, trust, at rest, no manual, comfort, floor). Tiers follow the mission's cost ladder (as revised 2026-10-29): 1 settings and Home Assistant configuration, 2 changes inside the existing cards, 3 new house-owned cards beside them, 4 a house-owned board. "Owning" is what it costs to keep working, since upstream is no longer merged. Every item is **[inference]** applying the cited evidence; check each against the fresh-eyes walkthrough before building. If the synthesis chooses a tier 4 board, items 1 to 10 and 13 to 14 are requirements for it rather than separate work.

1. **Say why a control is missing.** On events the board can't change or delete, replace the hidden Delete row with one line naming where to change it.
   - Serves: no manual, trust. Tier 2 (one branch in `_wireEventInfoDeleteButton` and the edit path). Owning: none.
   - Evidence: signifiers (Norman 2008); the gulf of execution (Whitenton 2018); self-blame (Norman and Tognazzini 2015). Matters most because most events will be iCloud ones.
2. **Two labelled buttons instead of OK/Cancel** for "this one or all" and the meal-replace prompt.
   - Serves: comfort, trust, no manual. Tier 2 (a small house dialog helper, about four call sites). Owning: low; one helper with a test.
   - Evidence: Apple HIG, Alerts ("Avoid using OK"); Nielsen 2018 (outcome labels).
3. **Tap where it goes.** A tap on an empty day, hour or meal slot opens the add sheet with that day, time and person set.
   - Serves: capture, no manual. Tier 2 (a hook in the grid's delegated click, plus `_openAddEvent` taking a prefill). Owning: low; it touches the shapes code's day units, so add a browser check.
   - Evidence: mapping and direct manipulation (Norman); defaults (Nielsen 2005); LINC's drop-on-the-day and Things' Magic Plus.
4. **Do it, then offer Undo, instead of "can't be undone" confirms** for deleting an "Us" event, clearing a note, or replacing a meal. The toast takes an action and stays about 8 s when it has one. Undoing a delete re-creates the event from the details the popup already holds; skip recurring events at first.
   - Serves: trust, comfort, no manual. Tier 2 (`_showToast` gains an action; a re-create call). Owning: low to moderate; the re-create path needs tests per calendar type.
   - Evidence: Raskin 2000; Aza Raskin 2007; Nielsen 2018; Apple HIG, Alerts and Undo; Material snackbar; Rosala 2020.
5. **Lists: keep Done visible and make the whole row a tap.** On the wall's to-do cards, `hide_completed: false` and `item_tap_action: toggle`; editing stays one tap away for phones.
   - Serves: trust, comfort. Tier 1 (card YAML; check the current dashboard config first, and explain the change before making it). Owning: none.
   - Evidence: Home Assistant To-do card options (https://www.home-assistant.io/dashboards/todo-list/, read 2026-10-29); Hoober 2017 (whole rows); user control and freedom (Rosala 2020).
6. **Echo every capture: what landed where.** The Assist scripts' replies and the board's toast say the title, day, time and column ("Dentist, Tuesday 3 pm, on your column"), never just "Done".
   - Serves: capture, trust, comfort. Tier 1 for the Assist replies (Home Assistant script change: explain and get approval first, per the house rules; record in J006); tier 2 for the board's toast text. Owning: none.
   - Evidence: the gulf of evaluation (Whitenton 2018); plan making closes the loop (Masicampo and Baumeister 2011); Horvitz 1999 (memory of recent interactions).
7. **Paging that shows itself.** With the title-only bar, show small previous/next and Today controls when the board is touched (they fade at rest); swipe stays as the shortcut.
   - Serves: no manual, at rest. Tier 2 (CSS on `top-bar-title-only`, plus a touched-state class). Owning: none.
   - Evidence: Apple HIG, Gestures; Norman and Nielsen 2010; Li 2017; the mission's "calm at rest, rich on approach".
8. **Empty states that teach and act.** An empty day reads "Nothing yet" with a tap target to add; an empty dinner slot reads "Dinner?"; an empty "Us" notes list says it's for anything the two of you need to remember, with the voice phrase. Small and quiet, so the resting board stays calm.
   - Serves: no manual, capture. Tier 2 (text in existing empty-state elements; `_shapeKeepText` if they're plain labels). Owning: none.
   - Evidence: Kaplan 2021; Apple HIG, Writing; Kendrick 2020 (pull revelations).
9. **Touch-target pass.** About 80 CSS px (2 cm) for standing actions (+, day add, ticks, Undo, popup close), at least 40 px (1 cm) for everything, about 2 mm (8 px) gaps, nothing essential in the corners. Outside the board: mount so the middle band sits between the shorter adult's elbow and shoulder.
   - Serves: comfort, no manual. Tier 2 (CSS) plus outside the board (mount height, J008 "Before mounting"). Owning: none.
   - Evidence: Harley 2019; Parhi et al. 2006; Hoober 2017; Apple HIG; WCAG 2.5.5; Kanazawa 2019; JIS Z8519.
10. **Never ignore input silently.** An empty-title Save gets a field-level note; a rough or partial entry is kept as typed (an all-day entry, or the time field left open) rather than refused.
    - Serves: capture, trust. Tier 2. Owning: none.
    - Evidence: Laubheimer 2015; Horvitz 1999 ("doing less but doing it correctly"); Apple HIG, Writing (error messages near the problem, no blame).
11. **One-field add sheet that takes rough text**, with a live "understood as" preview and the rest under "More": the mission's capture sheet.
    - Serves: capture, comfort. Tier 3 (a house-owned capture card; the date-and-time parser is the cost: keep it small, tested, and the same rules as the voice path). Owning: moderate (parser edge cases, Eastern time, DST).
    - Evidence: Laubheimer 2015; Horvitz 1999; Fantastical and Things; LINC (flexible entry); Steel 2007 (aversiveness); Fogg (scarcest resource). Ranked below 3 and 10 because the Skylight note found wall typing is rare; most capture will come by phone and voice.
12. **One quiet copy pass** for the dozen most-seen messages: verbs on buttons, the reader's words, no "oops", no blame, a remedy in every error ("Couldn't reach the iPhone calendar. It'll retry in a minute").
    - Serves: comfort, trust. Tier 2 (through the card's `_t` fallbacks, only where the house sees them). Owning: low.
    - Evidence: Mailchimp; Apple HIG, Writing; Moran 2016; Norman's foreword (errors need a remedy).
13. **Pull tips, at most one a day, never at rest**, for the invisible things: the voice phrase and email forwarding (shown in the add sheet), "tap the day to add" (shown on a first + use), Undo (shown on a first delete). Each retires once used; about five in total.
    - Serves: no manual, capture. Tier 2 (a small tip helper with a "seen" flag per tip in browser storage). Owning: low, but it can drift into nagging: cap it.
    - Evidence: Apple HIG, Offering help (once every 24 hours, one or two sentences, only if useful); Kendrick 2020; Harley 2014.
14. **A written restraint rule for delight** (in the mission or CODING_STANDARDS): motion only in answer to a touch, under about 300 ms, never on the resting board; nothing random, counted or scored; no sound by default; joy only where it carries information (where it landed, when it's next due).
    - Serves: comfort, at rest, floor. Outside the board (a rule). Owning: none.
    - Evidence: Kano life cycle and the Things reviewer; Asana's opt-in "occasional"; Duolingo's own streak caveat; Weiser and Brown 1995; Raskin's locus of attention; Changuel ("fades just as quickly").

## 4. What this lens says not to do

- **No tutorials, tours, coach-mark chains or "what's new" overlays,** on the wall or the phones. Tutorial readers did no better and found tasks harder (Kendrick 2020).
- **No hidden gesture as the only way** to page, delete, edit or reach Settings: no long-press-only, no swipe-only, no shake (Apple HIG, Gestures; Norman and Nielsen 2010).
- **No "are you sure?"** on routine actions that can be undone; no OK/Cancel that means two different actions (Apple HIG, Alerts; Nielsen 2018; Raskin).
- **No confetti, mascots, streaks, points, badges, random celebrations, or sound by default.** They decay into noise (Kano), and streaks run on loss aversion, the opposite of "it's handled" (Duolingo 2022). The mission already rules out gamification; this lens agrees on comfort grounds.
- **No jokes, cheer or guilt about obligations.** No "You haven't added anything this week!", no confirmshaming, no "oops" (Mailchimp; Apple HIG, Writing; Moran 2016).
- **No silent failures:** no Save that does nothing, no control that vanishes without a word (Norman's foreword; Whitenton 2018).
- **No pushed help or animation on the resting board;** help appears only in the flow it explains (Kendrick 2020; Weiser and Brown 1995).
- **No modal form that shows every field up front** or demands anything beyond "what" (Fessenden 2017; Nielsen 2006).
- **No per-person login or account picker at the wall** (Matthews et al. 2016; Kiosk Mode as planned).
- **No placeholder text as the only label,** and no unlabelled icon for a rare action (Budiu 2024).

## 5. The sentence the synthesis must not lose

The comfort that makes two busy adults *want* to add the dentist comes from safety and relief, not from delight: every action visible where the hand already is, every result shown at once, every mistake one tap to undo, and the only joy the board needs is the moment it says "it's handled."

## Gaps

- The web-search budget ran out partway; later sources were reached only by fetching known URLs. Not reached: research on "interaction blindness" at public displays, the iOS swipe-revealed-widgets study (HAL blocked the fetch), and any study of household wall touchscreens specifically. Touch figures come from phones, tablets and kiosks.
- No Google *study* of delight was found. The surface/deep split traces to Walter (2011) through NN/g (2017) and Changuel (2025), with no sample or method published in what was read.
- Read only through tables of contents, abstracts, snippets or secondary summaries: Saffer's *Microinteractions* (so no claim here rests on its later chapters), Norman's *Emotional Design* levels, Kano 1984 and 2001, Masicampo and Baumeister 2011, Gollwitzer and Sheeran 2006, Daminger 2019, Parhi et al. 2006, Matthews et al. 2016, Brush and Inkpen 2007, the Kanazawa study, and the arm-fatigue studies. The Kahneman 1993 PDF is a scan; only the abstract was legible (the commonly quoted 69% share wasn't checked).
- No direct study of what adults find patronising was found; section 1.8's list is inference from tone research and style guides.
- Things 3's completion animation and Apple Weather's ambient design weren't documented in sources reached (TechCrunch, 2021-06-07, confirms only that the backgrounds reflect real conditions), so neither is used as evidence here.
- Board behaviour in section 0 was read in the served card's source, not tried on the tablet; the To-do card's current settings on the dashboard weren't checked (no Home Assistant access in this task).

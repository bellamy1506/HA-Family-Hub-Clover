# Event icons and person marks from across the room

Research note, 2026-10-30, for fork issue [#71](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)), feeding the prototype [#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57). Question: how big icons and small marks must be at 6 and 9 ft; which person marks survive color blindness; how to draw one event for two people; which keyword tables and icon licenses to borrow; how many icons a day carries; how the new dot, clash mark and "Later (N)" line should look.

Builds on [wall-display-legibility.md](wall-display-legibility.md) and doesn't repeat it. Same device: 1200 x 800 CSS px, about 100.85 CSS px per inch, so 1 arcmin is 2.11 px at 6 ft and 3.17 px at 9 ft. **[inference]** marks my arithmetic or judgement; **(unverified)** what I couldn't confirm.

## The answer

Symbols need about twice the visual angle of letters, so icons in the day columns are close-up detail like the titles beside them; only the Next line is big enough to carry one across the room. A row icon about 1.2 times its title's font size reads from the same distance as the title. Color can't say "whose" alone: in the Okabe-Ito trio, Jenn's vermillion and Us's green have nearly the same lightness and sit close for red-green color-blind eyes, and at 9 ft the 9 px bars are at the eye's limit for seeing color at all. So: two person colors, not three; Us and every shared plan drawn in both, as a two-tone bar; names stay in words; bars wider and Will's blue a step darker. Icons come from Home Assistant's own Material Design Icons (Apache-2.0, already served, GPL-3.0-compatible), monochrome, one per event at most, from a short table of out-of-routine words, which keeps a day column near one icon. The new dot, clash mark and Later line stay ink-gray shapes, the lowest thing the eye ranks, so the face from across the room doesn't change.

## 1. Already built or decided

- Persons Will, Jenn, Us; Work shows as "At work 8 to 5" in Will's color ([#61 q3](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357)). A shared plan shows once, "in both colors with both names, or as Us"; new dot and clash mark are close-up detail ([q1](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)); "Later (N)" is a quiet line ([q5](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536918104)).
- Layout D ([prototype](../../prototypes/resting-face/README.md)): titles 28 px (34 px today), time lines 22 px, bars 9 px wide (16 px on the Next band), Next line 84 px; Will #0072B2, Jenn #D55E00, Us #009E73 on #F4F5F2; each row names its person after a small colored pip.
- The owner, in [#31](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/31): "Can we use emojis or icons optionally instead? Or otherwise delineate without soulless letters?"

## 2. How big an icon must be

- **Whole signs:** icon highway signs were seen from much farther than text signs at every age, though comprehension varied by icon ([Kline et al. 1990](https://trid.trb.org/View/352013)); standard symbols were identified at about twice the distance of text, and icons designed to survive blur did better still ([Kline & Fuchs 1993](https://trid.trb.org/View/372771)). These compare equal-size signs: one icon fills the space several small words share.
- **Per unit of height, symbols need more angle.** Thresholds averaged 10.5 arcmin for symbols against 4.19 for letter lines ([Gordon & Boyle 1977](https://trid.trb.org/View/60314)). FHWA's in-vehicle icon guidelines, from ISO/TR 7239, set symbols at 41 arcmin minimum and 85 optimum, text at 16 and 24, and cite ISO 3461-1's minimum symbol of 1/100 of viewing distance, 34 arcmin ([FHWA-RD-03-065 ch. 3](https://www.fhwa.dot.gov/publications/research/safety/03065/03.cfm), 2004). Icons under 0.7 degree "resulted in significantly raised search times" ([Lindberg & Näsänen 2003](https://www.sciencedirect.com/science/article/pii/S0141938203000350), abstract).

Icon box in CSS px on the wall tablet **[inference]**:

| Criterion | 3 ft | 6 ft | 9 ft |
|---|---|---|---|
| Threshold, about half identify it (10.5') | 11 | 22 | 33 |
| ISO 3461-1 minimum (34') | 36 | 73 | 109 |
| FHWA minimum (41'), about Lindberg's 0.7° | 43 | 87 | 130 |
| FHWA optimum (85') | 90 | 180 | 269 |

**[inference]** A 28 px title reads from about 3 ft (the prototype's size/10 rule). A 34 px icon box, 1.2 em of it, meets the ISO minimum at 2.8 ft: it reads where its title does. At 9 ft it is at threshold, a blob. The 84 px Next line meets the ISO minimum to 6.9 ft and FHWA's to 5.8 ft, the one place an icon is recognizable from across the room; nothing reaches 109 to 130 px at 9 ft without crowding out the week. The drawn glyph is about 20 of an icon's 24 units.

**Survive blur.** WCAG warns thin lines render fainter than their CSS color ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)). Outline sets draw 2-unit strokes, 2.8 px in a 34 px box, under 1 arcmin at 9 ft **[inference]**. Filled glyphs with few parts hold up; Material Design Icons are mostly filled.

## 3. Person marks that survive color blindness

WCAG 1.4.1: shape or text can back up color; a lightness difference counts only at 3:1, and a hue difference needs another cue "regardless of the contrast ratio" ([Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).

**The trio, simulated** **[inference: my computation]**, with the Machado, Oliveira & Fernandes 2009 dichromacy model ([matrices](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html), severity 1.0, linear sRGB), CIEDE2000 difference (higher is more different):

| Pair | Normal | Protan | Deutan | Tritan | Lightness ratio, normal (protan) |
|---|---|---|---|---|---|
| Will, Jenn | 50 | 50 | 57 | 66 | 1.34 (1.06) |
| Will, Us | 38 | 38 | 35 | **12** | 1.52 |
| Jenn, Us | 54 | **18** | **21** | 63 | **1.13** |
| Jenn, needs-you amber | 22 | 18 | **13** | 16 | 1.72 |

Will and Jenn stay far apart for every type; Us is the weak member, near Jenn for red-green types (about 1 in 12 men) and near Will for tritans. In grayscale Jenn and Us nearly match (1.13:1), correcting the legibility note's "still separate in greyscale". Jenn's vermillion and the needs-you amber are close for deutans (13); the band's fixed, full-width place keeps them apart.

**Small marks lose blue-yellow for everyone.** The fovea's center has no blue cones over about 18 arcmin ([Davies & Morland 2003](https://bjo.bmj.com/content/87/6/742)), seen as tritan-like confusions for small fields since [Willmer & Wright 1945](https://www.doi.org/10.1038/156119A0). So the tritan column approximates anyone looking at a small mark **[inference]**.

**Thin bars barely show hue at 9 ft.** Color acuity tops out at 11 to 12 cycles per degree ([Mullen 1985](https://pmc.ncbi.nlm.nih.gov/articles/PMC1193381)), so a stripe under about 2.6 arcmin can't be told by hue: 5.5 px at 6 ft, 8.2 px at 9 ft **[inference]**. D's 9 px bars are 2.8 arcmin at 9 ft; 14 px is 4.4. Will's blue darkened to about #005A8C lifts the Will and Jenn lightness ratio to 1.91 (1.36 for protans) at 6.75:1 on the background, so they stay apart where hue fails **[inference]**.

**What the eye ranks first.** At a glance, random hue hides shape differences but not the reverse, and random lightness hides hue ([Healey 1999 course notes](https://healey.csc.ncsu.edu/publications/15832.pdf), summarizing Callaghan). Across the room only lightness and large color areas can say whose.

**The cues** **[inference]**: names in words need no learning but read only up close. Initials need a 51 to 63 px cap at 9 ft and are the owner's "soulless letters". A shape or icon per person needs 109 px or more at 9 ft and is an arbitrary mapping guests must learn. An emoji per person adds full color that fights the person colors and looks different on each device. A lane per person would work from afar, but D is day columns. A two-tone bar for shared plans reads from afar if its halves are blocks, and two colors for two people needs no learning.

**One event, two people.** Cozi shows "the color dots of the first two attendees" with a "+", and gives all-family events the color assigned to "All" ([Cozi, 2024-05-07](https://www.cozi.com/blog/mobile-month-makeover/)); Yuvomi blends assignees in a 135° gradient "in equal segments" ([v0.65.20](https://newreleases.io/project/github/ulsklyc/yuvomi/release/v0.65.20), date unverified); Skylight's drawing wasn't found. A two-tone bar from Will's and Jenn's colors uses the strongest pair in every simulation. Top half one color, bottom half the other: stripes a few px wide fall under the color acuity limit at 9 ft and fuse into a muddy third color **[inference from Mullen]**.

## 4. Keyword tables to borrow, and licenses

- **Google Calendar** has shown "illustrations of everyday events like dinner, drinks and yoga" since 2014 ([Workspace Updates, 2014-11-03](https://workspaceupdates.googleblog.com/2014/11/new-google-calendar-app.html)), in 30 languages since 2015 ([9to5Google](https://9to5google.com/2015/10/16/calendar-illustrations-now-in-30-languages-as-google-introduces-12-new-designs/)). No official list; a 2017 to 2018 [gist](https://gist.github.com/hephyr/2e8c3ea97b3de40998d1001ea29b96b3) maps about 60 (dentist: "dentist, dentistry, dental"; oilchange: "oil change, car service"; repair: "handyman, electrician, DIY"), and a maintained [US list](https://github.com/mifran/google-calendar-image-keyword) adds birthday, doctor, flight and plumber but no vet, trash or recycling (unverified). A leisure table; Google's art, full color, one banner per event, phone apps only.
- **Outlook:** "add the word call, meeting, or coffee in the Title to add a charm" ([Microsoft](https://support.microsoft.com/en-us/outlook/training/10-top-outlook-mobile-tips)); one charm per event.
- **MDI's own aliases:** each of the 7,447 icons in MDI 7.4.47, the version Home Assistant's frontend pins, carries aliases: tooth "dentist", airplane "flight", trash-can "garbage-can", cake-variant "birthday-cake", paw "pets" ([MaterialDesign-SVG meta.json](https://github.com/Templarian/MaterialDesign-SVG), [frontend package.json](https://github.com/home-assistant/frontend/blob/dev/package.json), read 2026-10-30).
- **Comprehension:** safety symbols must reach 85% correct with under 5% critical confusions (ANSI Z535.3, via [CPSC](https://www.cpsc.gov/s3fs-public/CPSC%20Gather%20Consumer%20Feedback%20-%20Final%20Report%20with%20CPSC%20Staff%20Statement%20-%20REDACTED%20and%20CLEARED.pdf)). A calendar icon sits beside its title, so a misread costs little, but conventional pictures beat invented ones **[inference]**.

**Licenses.** MDI icons: Apache-2.0, "GPL friendly", no attribution required ([Pictogrammers](https://pictogrammers.com/docs/general/license/)). Material Symbols: Apache-2.0 ([Google](https://github.com/google/material-design-icons)). Phosphor and Tabler: MIT. Lucide: ISC, plus MIT for Feather's icons. The FSF lists Apache-2.0 as "compatible with version 3 of the GNU GPL" and Expat (MIT) and ISC as GPL-compatible ([FSF](https://www.gnu.org/licenses/license-list.html)): all fit. Home Assistant's `ha-icon` fetches MDI from its own static path and caches it ([ha-icon.ts](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-icon.ts)): no new dependency, no outside call.

**Starter table** (whole words in the title, any case, first match wins; every name exists in MDI 7.4.47):

| Words | Icon |
|---|---|
| vet, veterinarian | `mdi:paw` |
| dentist, dental | `mdi:tooth` |
| doctor, dr, physical, checkup | `mdi:stethoscope` |
| eye exam, optometrist | `mdi:glasses` |
| flu shot, vaccine, booster | `mdi:needle` |
| pharmacy, prescription | `mdi:pill` |
| flight, airport | `mdi:airplane` |
| trip, vacation, travel | `mdi:bag-suitcase` |
| trash, garbage | `mdi:trash-can` |
| recycling | `mdi:recycle` |
| birthday, bday | `mdi:cake-variant` |
| anniversary, wedding, party | `mdi:party-popper` |
| haircut | `mdi:content-cut` |
| oil change, car service, tires | `mdi:car-wrench` |
| plumber, electrician, handyman, hvac, repair | `mdi:wrench` |

Left out on purpose: work, gym, yoga, meetings (routine) and meals (the dinner line shows them).

## 5. How many icons before they're noise

- Search slows as targets resemble nontargets and as nontargets differ among themselves ([Duncan & Humphreys 1989](https://www.doi.org/10.1037/0033-295x.96.3.433), via summaries). An icon is a landmark while most rows have none; on every row icons become varied distractors **[inference]**.
- Clutter measures predicted how long people took to find a symbol on a map, and color variability added to clutter ([Rosenholtz, Li & Nakano 2007](https://www.doi.org/10.1167/7.2.17), via summaries). Colored icons would also hide the shape-only marks below (Callaghan).
- Google and Outlook stop at one per event. Road signs allow six services per general service sign and don't mix symbol and word service legends on one sign ([MUTCD 2I.02, 2I.03](https://mutcd.fhwa.dot.gov/htm/2009/part2/part2i.htm)): a ceiling for drivers at speed.
- **[inference]** With at most 3 events per day cell (legibility note), "most rows without one" means about one icon per column. A narrow table gets there without a per-day cap; if columns fill up, trim the table.

## 6. The new dot, the clash mark and "Later (N)"

- **Invisible across the room, plain at arm's length** **[inference]**: shape-only ink marks rank lowest. A 10 px dot is 11 arcmin at 2.5 ft, easy to see, and 3.2 arcmin at 9 ft, a speck like a bold period.
- **Not amber, red or a person color.** A unique hue pops out however many other items there are (Healey), so an amber or red dot would pull the eye across the room; amber is the needs-you signal and only 2.06:1 on this background, under WCAG 1.4.11's 3:1. A person-colored dot would read as the name pip.
- **Clash:** no conventional picture means "overlaps in time". A Venn-intersection glyph (`mdi:set-center`) at the time line's size, with the words where they're read: the event's sheet ("Overlaps Jenn's dinner") and, today, the needs-you line. The word "overlaps" is clearer but costs about 85 px of a 230 px column **[inference]**.
- **Later (N)** reads like "+N more": 22 px, weight 600, #464C50, plus "›" to say it opens. No count bubble: bubbles read as unread badges, and the board never nags.

## Implications for the house board

1. **How Us and shared plans are drawn** (for the owner, at #57):
   - **A.** A two-tone bar, Will's color over Jenn's, for Us and every shared plan, labeled as #61 decided (recommended). 0.55
   - **B.** Green for Us; two-tone only for a plan on both people's calendars. 0.15
   - **C.** One color for every shared plan, the green darkened to differ from Jenn's in lightness. 0.20
   - **D.** A neutral dark gray for Us. 0.10

   A uses the pair that stays apart for every type of color vision and gives one meaning one look; it gives up a household color of its own.
2. **The mark per person besides color** (for the owner, at #57, answering #31):
   - **A.** The name in words, as now (recommended). 0.55
   - **B.** A monochrome icon each of you picks on rows; names on the Next line and in sheets. 0.25
   - **C.** An emoji each. 0.10
   - **D.** Initials in a colored chip. 0.10

   A needs no learning for Jenn, guests or a house-sitter, and no mark says whose from 9 ft anyway; color does that. It gives up the warmth a picture might add.
3. **Event icons** (for the owner, at #57):
   - **A.** The fixed table, on rows and on the Next line (recommended). 0.40
   - **B.** Rows only. 0.35
   - **C.** None. 0.25

   A puts a recognizable picture on the one line big enough to carry it across the room (a plane before "Flight") and small ones on rows up close; it gives up a little calm on the Next line.
4. **Bars 14 px wide; Will's blue about #005A8C; the colored name pips dropped,** the bar carrying color and the word carrying identity (technical call; the owner can veto).
5. **Work's labeled block** in the all-day style: a light tint of Will's color with a solid Will-blue edge, so routine hours recede by lightness while staying Will's (technical call; the owner can veto).
6. **Icons:** `ha-icon` with MDI, #464C50, box about 1.2 em of the title, top right of the row, one per event, whole-word match on the title, table in code with no setting, notes included; an unknown name renders nothing, so a typo fails quietly (technical call; the owner can veto).
7. **New dot:** a solid #16191B circle about 0.45 em of the time line (about 10 px on the wall), before the time (technical call; the owner can veto).
8. **Clash mark:** `mdi:set-center` at the time line's size, #464C50, after the time and name (technical call; the owner can veto).
9. **Later (N):** styled as "+N more" with "›" (technical call; the owner can veto).
10. **Sizes in em,** so the marks carry over to the phones ([#50](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50)); the standalone prototype page inlines the few MDI paths it uses with an Apache-2.0 notice (technical call; the owner can veto).

## What this says not to do

- No emoji or multicolor icons, and not Google's illustration art (no license to it).
- Don't expect icons, initials or shapes to say whose from across the room.
- Don't color the new dot or clash mark amber, red or a person's color.
- Don't draw shared plans with thin stripes; they fuse at distance.
- Don't make row icons smaller than the title's font; they'd read later than the words.
- No per-day icon cap in code and no keyword setting; keep the table narrow.

## Gaps

- ISO 3461-1, ISO/TR 7239, ISO 7001, ISO 9186, ISO 9241-303 and ISO/IEC 11581 weren't read (paywalled); their numbers come through FHWA-RD-03-065 and secondary sources.
- Kline et al., Lindberg & Näsänen, Rosenholtz et al. and Duncan & Humphreys were read as abstracts or summaries.
- The symbol sizes come from road signs and car displays; familiar household pictures may read somewhat smaller (unverified).
- The color numbers model full dichromats on an ideal sRGB screen, not the matte panel; most color-blind people see smaller shifts. A grayscale phone photo of the panel at 9 ft is a cheap check.
- Google's keyword lists are community extractions; no study of icons on family calendars was found.

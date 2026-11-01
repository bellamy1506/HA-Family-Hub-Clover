# Person colors: the 12 to choose from, any color, and other looks

Research note, 2026-11-01, for fork issue [#91](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91) (map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)). It follows the owner's decision on [#87](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87) (2026-10-31): each person's color becomes a choice, first from 12 fixed, pre-checked colors, then, as an optional further step, any color; a color close to another person's is allowed and gets a plain note under the swatch ("Hard to tell from Jenn's across the room"); nothing is blocked.

**Reading used:** the owner's "should the case color scheme change" is read as the board's base color scheme: its background and text colors (the wall's light look, the phones' light or dark Home Assistant theme, and any look added later). Correct this if it meant something else.

**Basis (owner, 2026-11-01): neither Will nor Jenn is color-blind.** The 12, the number behind the note and the free-choice rules are designed for normal color vision. Color-blind and gray simulations are reported for information only (a visitor or house-sitter might be color-blind, and the wall tablet has a gray screen mode); they never remove a color or trigger the note. The earlier choices made for color blindness, the Okabe-Ito starting set and Will's blue darkened a step to differ from Jenn's in lightness ([#71](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864)), were for a color blindness nobody in the house has. They cost nothing in normal vision and needn't be undone.

Picture: [person-colors.png](person-colors.png) (the 12 as bars and blocks on the wall's light background and a dark phone, the pairs that get the note, today's three, eight free picks, and the simulated rows). Made-up labels only; the picture's notes name a color where the board's Settings would name the person.

Lines marked *(inferred)* are my arithmetic or judgement, not something a source states.

## Answer

- **Twelve can't all be far apart, so the note does the work.** The blocks are 17% tints, and mixing that pale mutes lightness differences almost completely: a deep and a light shade of one hue make nearly the same block. So the 12 have to be 12 hues, and 12 calm hues crowd each other. In every search, the 12th color landed within 0.39 to 0.40 of another on the scale below; at most 10 of the proposed 12 are all clear of each other. Each household uses only three at once, so a note on close pairs is enough.
- **The proposed 12** (Blue, Sky, Cornflower, Indigo, Lilac, Plum, Rose, Rust, Vermillion, Leaf, Forest, Green) keep today's three (Will #005A8C, Jenn #D55E00, Us #007A5A), stay out of the needs-you amber and the alarm reds, and pass every text and contrast check on light and dark. Four pairs among them get the note: Forest and Green, Leaf and Forest, Blue and Sky, Sky and Cornflower.
- **The number behind the note:** how different two people's blocks are at 9 ft, by a published model of color difference for small marks on ordinary screens ([Szafir 2018](https://par.nsf.gov/servlets/purl/10074616)). Today Will's and Us's blocks score 0.50, Will's and Jenn's 1.13. A color gets the note below 0.45.
- **Any color works the same way.** The board keeps each person's color as picked and works out its bar and block for whatever background it's drawn on: same hue and colorfulness, lightness moved just enough to stand out (at least 3:1 on light, 4.5:1 on dark, never past 7.5:1 so it doesn't read as text). A too-pale pick is shown a shade darker, a near-black one a shade lighter, and a gray one gets a note.
- **A change of look never needs the colors picked again.** On a dark phone each color stands off the background as far as it does on the wall (Will's blue turns a lighter blue, Jenn's vermillion stays nearly the same), which keeps the 12 as far apart on the phone as on the wall. That's the one owner decision below. All 12 also hold up on all 12 of Family Hub's own themes; those themes' gray text doesn't (2.4 to 3.8:1 on blocks), so the board sets its own text colors on blocks.
- **Found on the way:** the gray used for times and names on blocks today (#464C50) is only 6.0 to 6.6:1 on the decided blocks, under the board's 7:1 rule. #3A3E41 fixes it on light, #B5B5B5 on dark.
- **Shipped calendars:** Skylight, Apple Calendar and Google Calendar all allow any color now; Hearth's public pages say only that each person picks a favorite. None of them warns when two people's colors are close or checks contrast. The note would be a way past a Skylight.

## 1. Where color carries meaning

From the decided marks ([#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323), [README](../../prototypes/marks/README.md)) and every prototype's CSS (`prototypes/*/index.html`, grepped 2026-11-01).

**Person colors (Will, Jenn, Us):**

| Where | How it's drawn |
|---|---|
| Event block, resting face and phones | 17% tint of the person's color with a solid edge (0.3 em) |
| Work's labeled block, all-day items | 8% tint (13% in the split versions), so routine hours fall back |
| Next band | a 20 px bar in full color, the one colored mark that reads farthest |
| Wall Month ([#79](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/79#issuecomment-6548787708)) | titles on a 17% tint with a 5 px edge; all-day 9%; a multi-day strip at 45%; the bars-only grid in full color, all-day at 35% |
| Phones Month and rows | full-color bars and the same blocks; Work at 12% in the phones prototype |
| Event sheet | the event's bar; a striped bar (color and its 45% tint) for a labeled block |
| Shared plans | one green for Us and every plan on both calendars |

**Colors already taken by other meanings** (person colors stay clear of these):

| Meaning | Colors |
|---|---|
| Needs you, look here, just landed, a guess | amber: the needs-you band #FFF0C7 with a 12 px #E69F00 edge (dark #3A2E0E with #FFE9B0 text); the lit "just landed" item #FFF0C7 ringed #E69F00; a guessed part #8A4B00, #FFD27A in the dark echo; a fresh list item #FFF3CC; an overdue house job #743F00 |
| Now, recording, destructive | red: the week card's now line #E03131 (the house board has no now line so far); the listening mic #B3261E; Delete #A3260F on #FBE9E5 |
| Text and the small marks | near-black #16191B (text, the new dot, today's date chip, the selected day's ring); gray #464C50 (times, names, icons, the clash mark, Later, a note's ring); #3D4347 (the rail, Lists); #5A6064 for done items; lines #CDD2CC and #D5D9D3 |
| Nobody's | gray: a neutral gray Us was rejected because it "reads as nobody's" ([marks README](../../prototypes/marks/README.md#mark-languages)) |
| Weather, in the clock corner | sun in the needs-you amber; rain drops #0072B2, close to Will's blue (difference 0.19 on the scale in section 3). The fixed corner keeps them apart from events; no change *(technical call; the owner can veto)* |
| Selection and surfaces | selected event #E2E7E0 ringed in ink; the echo is an ink bar with light text; background #F4F5F2 |

**Likely next uses** *(inferred)*: a color swatch per person in Settings (where the note lives), whose a note or list item is (reviewers noted notes name no owner), "N new from Jenn" on phones, a night look on the wall (the legibility research suggests a dimmed or dark look at night), and any Family Hub or Home Assistant theme the board is shown under. The derivation in section 4 covers all of them; none needs a new color.

So person colors keep out of: amber and yellow (needs you), scarlet red (now, recording, Delete), gray and near-black (text, the small marks, "nobody's").

## 2. The 12

Measured on the wall's background #F4F5F2. "Bar" is the color's contrast against the background; "block" is the 17% tint; "ink" is near-black #16191B on the block. Dark versions are for Home Assistant's dark background #111111 by the rule in section 4. "Nearest" is the two closest on the 9 ft scale (section 3); under 0.45 gets the note.

| Name | Color | OKLCH L, C, h | Bar | Block | Ink on block | Dark bar | Dark block | Nearest |
|---|---|---|---|---|---|---|---|---|
| Blue (Will) | `#005A8C` | 0.45, 0.11, 243 | 6.8:1 | `#CBDBE1` | 12.4:1 | `#59A1D8` 6.8:1 | `#1D2933` | Sky 0.41, Indigo 0.46 |
| Sky | `#0091C8` | 0.62, 0.13, 234 | 3.3:1 | `#CBE4EB` | 13.3:1 | `#0084B7` 4.5:1 | `#0E252D` | Blue 0.41, Cornflower 0.42 |
| Cornflower | `#4385E4` | 0.62, 0.16, 258 | 3.4:1 | `#D6E2F0` | 13.4:1 | `#397BD9` 4.5:1 | `#182333` | Sky 0.42, Indigo 0.47 |
| Indigo | `#3944A9` | 0.44, 0.16, 273 | 7.5:1 | `#D4D7E6` | 12.3:1 | `#889DFF` 7.5:1 | `#252939` | Blue 0.46, Plum 0.47 |
| Lilac | `#A86DD5` | 0.64, 0.16, 309 | 3.3:1 | `#E7DEED` | 13.5:1 | `#9D62C9` 4.5:1 | `#291F30` | Rose 0.45, Plum 0.52 |
| Plum | `#8D2875` | 0.46, 0.16, 339 | 7.1:1 | `#E2D2DD` | 12.2:1 | `#E57AC6` 7.1:1 | `#352330` | Indigo 0.47, Lilac 0.52 |
| Rose | `#CD677B` | 0.64, 0.13, 9 | 3.3:1 | `#EDDDDE` | 13.5:1 | `#C05C70` 4.5:1 | `#2F1E21` | Lilac 0.45, Rust 0.51 |
| Rust | `#923716` | 0.46, 0.13, 39 | 6.9:1 | `#E3D5CD` | 12.3:1 | `#E58261` 6.9:1 | `#35241F` | Vermillion 0.46, Rose 0.51 |
| Vermillion (Jenn) | `#D55E00` | 0.62, 0.17, 48 | 3.5:1 | `#EFDBC9` | 13.2:1 | `#CC5A00` 4.5:1 | `#311D0E` | Rust 0.46, Rose 0.59 |
| Leaf | `#548C03` | 0.58, 0.16, 132 | 3.7:1 | `#D9E3C9` | 13.3:1 | `#528A00` 4.5:1 | `#1C260E` | Forest 0.39, Green 0.60 |
| Forest | `#286209` | 0.44, 0.13, 138 | 6.8:1 | `#D1DCCA` | 12.5:1 | `#6DAA58` 6.8:1 | `#212B1D` | Green 0.39, Leaf 0.39 |
| Green (Us) | `#007A5A` | 0.51, 0.11, 167 | 4.9:1 | `#CBE0D8` | 12.8:1 | `#2D9270` 4.9:1 | `#162721` | Forest 0.39, Sky 0.49 |

How the set was made *(inferred, my computation)*:
- **Why 12 hues, not six hues in a deep and a light shade.** I tried that first. A deep and a light shade of one hue score 2 to 3 apart as blocks by CIEDE2000, the standard color difference, where 2 is about one just-noticeable difference ([CSS Color 4](https://www.w3.org/TR/css-color-4/#gamut-mapping): "using deltaE2000, one JND is 2"). Mixing 17% color into the background keeps the hue and drops most of the lightness difference, so the shades would look like one color.
- **A search, then names.** Candidates were every hue in 3° steps at OKLCH lightness 0.44 to 0.66, colorfulness up to 0.16 (about Jenn's vermillion, 0.17, to match the board's calm look), bar 3.2:1 to 7.5:1, kept away from the amber, the red and the grays. With today's three fixed, each step added the candidate farthest from everything chosen. Then I named and kept the result. Raising colorfulness to 0.18 changed nothing that matters (the 12th still landed at 0.40).
- **What it shows.** The first six added stay 0.5 or more apart; from the tenth on, every new color lands under 0.45 from an old one. Ten of these 12 (all but Sky and Forest) are all at least 0.45 apart; Sky and Forest each sit close to two neighbors, and they cause all four noted pairs. No yellow, ochre, scarlet or gray is offered: those are taken.
- **Today's three stay as decided.** Blue and Green (0.50) is the closest pair of the three and gets no note.

**Color-blind and gray, information only** (Viénot 1999 for red and green blindness, Brettel 1997 for blue blindness, full severity, as the [DaltonLens review](https://daltonlens.org/opensource-cvd-simulation/) recommends; run with its Python package): among the 66 pairs of blocks, 23 fall under 0.45 for red-blind eyes, 20 for green-blind, 21 for blue-blind, and 63 in gray. For today's three, Blue and Green fall to 0.43 for red- or green-blind eyes and 0.13 for blue-blind, and Vermillion and Green to 0.43 for red-blind. In gray, nearly every pair of pale blocks looks the same (17% tints barely differ in lightness), so whose rests on the names and the edges. The simulated rows are in the picture.

## 3. "Too close" and "too faint": the numbers

**The scale.** Szafir's crowdsourced studies on ordinary screens ([IEEE TVCG 24(1), 2018](https://par.nsf.gov/servlets/purl/10074616), Fig. 3) fit how big a color difference must be for half of viewers to notice it between two marks of a given size, in CIELAB units, for a mark `s` degrees across: lightness 5.095 + 0.80/s, red-green 5.089 + 2.69/s, blue-yellow 6.786 + 3.20/s. Small marks need bigger differences, blue-yellow fades fastest, and lightness holds best, which matches the [icons research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864) finding that small marks lose blue-yellow for everyone. A block row on the wall is about 60 px tall, 0.3° at 9 ft *(inferred from the marks prototype's 26 to 28 px titles over a 20 px time line)*. Divide each CIELAB difference between two blocks by those sizes at s = 0.3 and combine them: 1.0 means half of viewers would notice any difference at all between two blocks that size side by side.

**The threshold: a note below 0.45** *(technical call; the owner can veto)*. Today's blocks score Will and Jenn 1.13, Jenn and Us 1.06, Will and Us 0.50, and the reviews and the owner judged Will and Us apart from across the room ([#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323)). 0.45 is 90% of that weakest accepted pair: today's three never trigger it, and among the 12 it marks only the four pairs of near neighbors. Read it as a ranking calibrated against the house's own colors, not a law: Szafir's points are a conservative stand-in for long blocks (the paper's own bar results show elongated marks need less), and every block also has a full-color edge and a name *(inferred)*.

The check, for the note under a swatch:
- **Close to another person's:** the scale above, between the two blocks on the wall's look, under 0.45: "Hard to tell from Jenn's across the room."
- **Close to a meaning color:** the bar within 15 CIEDE2000 of the needs-you amber #E69F00 or the now-line red #E03131: "Close to the amber that means needs you" or "Close to the red of the now line." Of the 12, the nearest are Rose, Rust and Vermillion at 17 from the red and Vermillion at 22 from the amber. 15 sits just under those, about seven just-noticeable differences *(inferred)*.
- **Reads as gray:** OKLCH colorfulness under 0.06 (the 12 are 0.10 and up): "Reads as gray, which on the board means nobody's."

**Too faint and too dark are fixed, not noted.** A bar must stand off its background by at least 3:1, WCAG's minimum for graphics needed to understand content ([WCAG 2.2, 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast)); Jenn's vermillion is 3.5:1 today. A paler pick is shown a shade darker until it reaches 3:1, with "Shown a shade darker so it stands out" under the swatch. Above 7.5:1 a bar starts to read as the near-black of text and the new dot, so a darker pick is shown a shade lighter. 7.5 sits just above the darkest of the 12 (Indigo 7.46:1).

**Text on blocks.** The board's rule is every text color at least 7:1 ([resting face](../../prototypes/resting-face/README.md#calls-made-here-technical-and-basic-the-owner-can-veto), [legibility](wall-display-legibility.md#6-contrast)). Near-black titles pass on every block (12.2:1 and up on light, 11:1 and up on dark). The gray used for times and names, #464C50, is 7.96:1 on the plain background but 6.0 to 6.6:1 on the 12 blocks, 6.1 on Will's and 6.3 on Us's today. On blocks use #3A3E41, 7.1:1 or more on any block the rules in section 4 can make on the wall; on dark, #B5B5B5 (Home Assistant's own #9B9B9B gets 5.2 to 5.7:1) *(technical call; the owner can veto)*.

## 4. Any color: how the board turns it into a bar, a block and a dark version

What's stored per person is the color as picked, nothing per look *(technical call; the owner can veto)*. Whenever a color or the look changes, the board works out:

1. **From the pick:** its hue and colorfulness in OKLCH (the perceptual color space CSS uses; [CSS Color 4](https://www.w3.org/TR/css-color-4/#ok-lab)), and how far it stands off the wall's background #F4F5F2 as a contrast ratio, held between 3:1 and 7.5:1. That ratio is measured against #F4F5F2 for good, even if the wall's background later changes, so it's a fixed property of the person's color.
2. **The bar, for the background in use:** the same hue and colorfulness, with lightness moved until the bar stands off that background by the stored ratio: darker than a light background, lighter than a dark one, and at least 4.5:1 on dark. Where a screen can't show that much colorfulness at that lightness, colorfulness is reduced, hue and lightness kept: the gamut mapping in [CSS Color 4](https://www.w3.org/TR/css-color-4/#css-gamut-mapping).
3. **The block:** 17% of the bar mixed into the background, as the prototypes do now (`color-mix(in srgb, ...)`); Work and all-day 8%, Month strips 45% and 35%. On dark, 17% reads about as strongly as on light, a little stronger (block against background 1.44 on #111111, 1.26 on the wall, on the scale in section 3), so one percentage serves both.
4. **The notes** in section 3, computed on the wall's look.

Eight free picks are in the picture. Yellow #FFD400 becomes #A98B00 on the wall (3.0:1) and notes both "a shade darker" and "close to the amber"; pastel pink #F7B2C8 becomes #BC7B91; near-black navy #141B3A becomes #444E71 and is close to Will's; gray #8A8A8A stays gray with its note; hot magenta #FF00AA needs no change; teal #00A396 is close to Us's; ochre is close to the amber; scarlet #E2241B is close to the red.

Code size *(inferred)*: about 60 lines of plain JavaScript (OKLCH and CIELAB conversions, the contrast ratio, one binary search), run only when a color or the look changes, setting CSS variables; tested in Node against the 12 on both looks.

## 5. Dark phones and other looks

The phones follow Home Assistant's light or dark theme ([phones](../../prototypes/phones/README.md)). Home Assistant's dark theme is page #111111, cards #1C1C1C, text #E1E1E1, secondary text #9B9B9B ([frontend source](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/color.globals.ts)).

**The rule in section 4 on dark** (picture, second row): each color stands off the dark background by the same ratio as on the wall, at least 4.5:1. Deep colors become their light versions (Will's #005A8C becomes #59A1D8, Plum becomes pink #E57AC6); colors that were already light stay close to the pick (Jenn's #D55E00 becomes #CC5A00). The 12 stay as far apart as on the wall: on #111111 no pair falls under 0.45 (closest Blue and Sky 0.45); on #1C1C1C two do (Blue and Indigo 0.39, Forest and Green 0.448). The phones prototype's dark colors (Will #56B4E9, Jenn #F08A4B, Us #3DBE97) were the same idea by hand.

Why mirror rather than change as little as possible *(inferred, my computation)*: lifting each color only until it reaches 4.5:1 keeps the light colors exactly as picked but piles every deep color up at the same lightness, and the blues and greens bunch together (Cornflower and Indigo 0.27, Blue and Sky 0.28). Apple's guidance points the same way: "the color palette in Dark Mode includes dimmer background colors and brighter foreground colors," and these colors "aren't necessarily inversions of their light counterparts" ([HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)). Google's Material system lifts its main color from tone 40 on light to tone 80 on dark, and puts containers at 90 and 30 ([material-color-utilities](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts)).

**Every Family Hub theme** (the 12 themes in Theme Builder, `_seed_themes` in `custom_components/family_hub/__init__.py`; the board reads them, [#43](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/43)), with the 12 derived for each theme's card color and checked against that theme's own text colors:

| Look | Block background | Bars | Text on blocks | Theme's gray text on blocks | Pairs under 0.45 |
|---|---|---|---|---|---|
| House board wall | `#F4F5F2` | 3.3 to 7.5:1 | 12.2:1 | 6.0:1 (#464C50) | 4 |
| Home Assistant dark page | `#111111` | 4.5 to 7.5:1 | 11.1:1 | 5.2:1 | 0 |
| Home Assistant dark card | `#1C1C1C` | 4.5 to 7.5:1 | 9.5:1 | 4.5:1 | 2 |
| HA Light (card) | `#FFFFFF` | 3.3 to 7.5:1 | 12.2:1 | 3.7:1 | 6 |
| Soft | `#F5F3F0` | 3.3 to 7.5:1 | 7.4:1 | 2.4:1 | 4 |
| Slate | `#F7F9FA` | 3.3 to 7.5:1 | 8.7:1 | 2.6:1 | 6 |
| Meadow | `#FBFDF7` | 3.3 to 7.5:1 | 8.2:1 | 2.7:1 | 6 |
| Blossom | `#FFFAFA` | 3.3 to 7.5:1 | 9.0:1 | 2.6:1 | 6 |
| Liquid Glass (card over its backdrop) | `#F9FAFC` | 3.3 to 7.5:1 | 11.0:1 | 3.4:1 | 6 |
| Midnight | `#1A1D29` | 4.5 to 7.5:1 | 9.7:1 | 3.8:1 | 4 |
| VaultTek (green text) | `#122019` | 4.5 to 7.5:1 | 9.8:1 | 3.2:1 | 4 |
| Liquid Glass Dark | `#141926` | 4.5 to 7.5:1 | 11.5:1 | 5.3:1 | 5 |

What it shows: the person colors survive every theme with no re-picking; every bar meets its floor. Whiter backgrounds pull two more pairs just under the line (Rust and Vermillion, Blue and Indigo, about 0.43). The themes' gray text fails 7:1 on blocks everywhere, and Soft's main text barely clears it, so the board can't take text colors from a theme as is (section 6).

**The wall tablet's own modes, information only.** The TCL NXTPAPER 14 has a NXTPAPER key that switches the screen between modes ([TCL](https://us.tcl.com/products/nxtpaper-14)): Regular, Color Paper ("resembles a color e-ink display with muted colors") and Ink Paper ("emulates a traditional grayscale e-ink screen") ([Thurrott review](https://www.thurrott.com/mobile/android/342238/tcl-nxtpaper-14-review)). Which mode the wall uses isn't recorded. Muted colors would pull every pair closer, and Ink Paper is the gray row in the picture; Regular keeps the colors as measured *(inferred)*.

## 6. Adding a look later: what each look must supply, and what it's checked against

For any new or custom look (scope added by the owner, 2026-11-01). Rules, not a design.

**Stored once, never per look:** each person's color as picked. Everything else about a person's color is worked out per look (section 4). Picking a new look never touches anyone's color.

**Each look supplies:**
- The block background (what events sit on) and the page background. Light or dark follows from the block background (WCAG luminance under 0.18 is dark).
- Ink (titles) and soft ink (times, names). If its soft ink fails on blocks, the board uses its own (#3A3E41 on light, #B5B5B5 on dark) on blocks only.
- Its own versions of the meaning colors, set by hand: the needs-you band, edge and text; the "just landed" ring; the red for now, recording and Delete; the gray for icons, the clash mark and Later; lines; the selection ring. Apple asks the same of apps: a custom color must "supply light and dark variants, and an increased contrast option for each" ([HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)).
- Nothing else. Tint strengths (17%, 8%, 45%, 35%), the floors (3:1 light, 4.5:1 dark), the 7.5:1 ceiling and the 0.45 note line are the same in every look.

**A look is checked against** (a test run when it's added; Node, with the 12 as fixtures) *(technical call; the owner can veto)*:
1. The block background is very light or very dark: OKLCH lightness at least 0.90 or at most 0.25. In between, near-black or near-white text can't keep 7:1 on every block while the bars keep their contrast *(inferred: computed on neutral backgrounds; 0.85 and 0.30 are the edges)*.
2. Ink and soft ink at least 7:1 on the worst block the rules can make there (a bar at 7.5:1, 17%, every hue).
3. Each of the 12 reaches its contrast (none stuck under the floor).
4. The meaning colors: the needs-you band text at least 7:1 on its fill (today 15.6:1 light, 11.1:1 dark); every one of the 12 at least 15 CIEDE2000 from the look's amber and red; the look's grays colorless (OKLCH colorfulness under 0.02) while every person color stays at 0.06 or more.
5. A report, not a failure: which of the 12 fall under 0.45 apart on that look.

## 7. What shipped calendars do

| | Colors offered | Any color? | Keeping people apart |
|---|---|---|---|
| **Skylight** | Each profile has a color; "swipe left and right on the color menu to set your Profile color to one of the preset colors" (count not stated) ([help](https://skylight.zendesk.com/hc/en-us/articles/42814221359003-Change-a-Profile-Picture-and-Profile-Color)) | Yes since 2025-10-29: "a completely custom color with our new color picker," with a hex box ([feature post](https://skylight.zendesk.com/hc/en-us/articles/42815603725979--Feature-Customize-Your-Profile-Picture-and-Color)) | "Events from the same person or calendar appear in the same color" ([help](https://skylight.zendesk.com/hc/en-us/articles/360032743912-How-do-I-change-the-color-of-my-profiles)); a setting "to display shared events with multiple Profile colors" ([Calendar Settings](https://skylight.zendesk.com/hc/en-us/articles/36835449004315-Calendar-Settings)); the app has Light, Dark and Device themes ([App Theme](https://skylight.zendesk.com/hc/en-us/articles/53610180938779-App-Theme)). No warning about close colors found. |
| **Hearth** | "Everyone chooses their favorite color" at setup ([blog](https://hearthdisplay.com/blogs/hearth-at-home/make-the-most-of-organization-with-color-coding)); it "shows up on events, to-dos, and routines" ([features](https://hearthdisplay.com/pages/features)) | Not stated publicly | Events assigned to a person take that person's color ([blog](https://hearthdisplay.com/blogs/hearth-at-home/customize-your-family-s-calendar-on-your-hearth-display)); shared events not described |
| **Apple Calendar** | Per calendar, not per event. iPhone: "choose a color"; "for some calendar accounts, such as Google, the color is set by the server" ([iPhone guide](https://support.apple.com/guide/iphone/use-multiple-calendars-iph3d1110d4/ios)) | Mac: "Click a preset color ... or choose Custom Color" ([Mac guide](https://support.apple.com/guide/calendar/change-a-calendars-name-or-color-icl1030/mac)); iPhone's guide shows no custom option | A calendar's color "changes the color of all of its events" (same guide); iCloud.com changes "appear on every device" ([iCloud guide](https://support.apple.com/guide/icloud/create-and-edit-a-calendar-mmfbbb2cf9/icloud)). Apple's system colors each come in light, dark and two increased-contrast versions ([HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)). |
| **Google Calendar** | Calendars: "select a color or click Add to choose a custom color" ([Learning Center](https://support.google.com/a/users/answer/9323423?hl=en)); events: 24 default colors since June 2026, up from 11 ([Workspace Updates, 2026-06-17](https://workspaceupdates.googleblog.com/2026/06/custom-event-colors-in-google-calendar.html)) | Yes: a custom picker since 2012 ([2012 post](https://workspaceupdates.googleblog.com/2012/08/custom-color-picker-in-google-calendar.html)); a calendar's color can be any hex through the API ([calendarList](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList)); "up to 200 custom colors for individual events" (2026 post) | Two color sets, "Modern (with white text)" and "Classic (with black text)", changeable only on a light background ([help](https://support.google.com/calendar/answer/15619910?hl=en)). No warning about close colors found. |

All four tell people apart by color plus a name or picture, and all let people pick freely (Hearth unconfirmed). None found checks whether two people's colors look alike, or whether text stays readable on a custom color.

## Calls made here (technical and basic; the owner can veto)

- The proposed 12, as a starting point for the owner's pick by eye.
- The note's number: the 9 ft scale on the two blocks, on the wall's look, under 0.45. Close to a meaning color: under 15 CIEDE2000 to the amber or the red. Gray: colorfulness under 0.06.
- Bars at least 3:1 on light and 4.5:1 on dark, at most 7.5:1; a pick outside is shown adjusted, with a line saying so.
- Each person's color stored as picked; bars and blocks worked out per look; 17% blocks on every look, mixed in sRGB as now.
- Soft text on blocks #3A3E41 on light, #B5B5B5 on dark.
- Amber, scarlet red and gray stay reserved; the 12 offer none of them.
- The weather icons keep their amber sun and blue rain in the clock corner.

## For the owner: how colors look on a dark phone

**What's being decided:** when a phone is in dark mode, what each person's color turns into. You'll see it every time you open the board on a phone at night.

- **A. Mirror the wall** (recommended, 0.60): each color stands off the dark background as far as it does on the wall, at least 4.5:1. Deep colors turn into their light versions (Will's blue becomes a lighter blue), colors that are already light stay nearly as picked (Jenn's vermillion barely changes). The 12 stay as far apart as on the wall.
- **B. Change as little as possible** (0.20): keep each color as picked unless it would sink into the dark, then lighten it just enough. Closest to the wall's colors, but Will's blue, Indigo and the dark greens end up the same lightness, and the blues and greens bunch together (two pairs at 0.27 and 0.28).
- **C. One bright pastel of each** (0.15): every color at the same high lightness, as Google's Material design does. Even and calm, but lightness no longer helps tell people apart *(inferred)*.
- **D. Exactly the wall's colors** (0.05): Will's blue is 2.5:1 on the dark background, under WCAG's 3:1 for graphics, so his events would sink into the background.

**Recommendation: A.** It delivers the same separation on the phone as on the wall with no extra work for anyone, keeps every color recognizably the same hue, and follows how Apple and Google handle dark mode. It gives up an exact match: Will's blue and the other deep colors look noticeably lighter on a dark phone than on the wall. The picture's second row shows A for all 12.

## How it was checked

A throwaway Python script outside the repo (numpy, colour-science 0.4.7, DaltonLens-Python): WCAG 2.x contrast and relative luminance; OKLab and OKLCH with CSS Color 4 style gamut mapping; CIEDE2000 via colour-science; Szafir's size scale at 0.3°; Viénot 1999 (protan, deutan) and Brettel 1997 (tritan) at full severity; gray as equal luminance. Candidate search: greedy, farthest-first, today's three fixed. The picture was drawn as HTML and rendered with Playwright's Chromium.

## Gaps

- Szafir's model was fit on small points and bars on white, not pale blocks on #F4F5F2 or dark backgrounds; the 0.45 line is calibrated against today's three, not measured on the wall. A cheap check: photograph the wall from 9 ft with two noted colors side by side.
- Nothing was measured on the tablet itself. Its reduced-blue-light panel and Color Paper mode shift colors by amounts TCL doesn't publish.
- Skylight's preset count, Hearth's color details and Apple's iPhone presets aren't in their public help. Google's calendar (not event) preset count isn't stated in the pages read.
- Paul Tol's color-scheme notes (personal.sron.nl) weren't reachable from this session; the host has to be allowed in the session's network settings.
- The simulations model full color blindness on an ideal screen; most color-blind people see smaller shifts.

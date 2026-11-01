# Person colors prototype

For the map ticket [Which 12 colors does each person choose from, and which does each start with?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92), 2026-11-01. **Waiting on the owner's pick.** Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser. The bar switches the set (A to C) and the view: **Wall** (the resting face with the starting three), **Wall, all 12** (one event in each of the 12, in hue order), **Phones** (light, then a dark phone drawn two ways), **Settings** (People and colors on a phone, live: tapping a color changes it everywhere on the page), **A B C at 9 ft** and **Will's start**. Fit or 9 ft for the walls. The address's `#hash` holds the state, e.g. `#a-colors-fit-w9-openwill` (set A, Settings, Will on the 10th color, his picker open); `shot` anywhere in it drops the page's own text for screenshots.

Starting points: the [person colors research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184) ([full note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/person-colors/docs/research/person-colors.md)), the [marks prototype](../marks/README.md) (layout D with E's pale blocks and green Us), the [phones prototype](../phones/README.md), and the [settings decision](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631). The page redoes the research's color math in plain JavaScript (WCAG contrast, OKLCH, CIELAB, CIEDE2000, Szafir's 9 ft scale) and reproduces its numbers exactly: today's Will and Jenn 1.13, Jenn and Us 1.06, Will and Us 0.50; A's four noted pairs; the dark versions.

## The wall tablet's screen mode (checked first)

Read over ADB on 2026-11-01, changing nothing: the tablet is in **Regular** mode. Color Paper (`tct_ink_mode_color_activated`) and Ink Paper (`tct_ink_mode_paper_activated`) are both off, there's no grayscale, Night Light or saturation change, and TCL's color temperature setting is on (`tct_color_temperature_activated` 1; its level wasn't read). So the wall shows colors as measured here, give or take that warmth. The tablet's NXTPAPER key switches modes (a press opens NXTPAPER mode, a long press switches Color Paper and Regular), so a stray press would mute the board's colors until it's pressed again.

## Sets tried

| | The 12 | Pairs that get the note | Does well | Gives up |
|---|---|---|---|---|
| **A** The proposed 12 | Rose #CD677B, Rust #923716, **Vermillion #D55E00** (Jenn), Leaf #548C03, Forest #286209, **Green #007A5A** (Us), Sky #0091C8, **Blue #005A8C** (Will), Cornflower #4385E4, Indigo #3944A9, Lilac #A86DD5, Plum #8D2875 | 4: Leaf and Forest 0.39, Forest and Green 0.39, Sky and Blue 0.41, Sky and Cornflower 0.42 | The research's set: the 12 calm hues farthest apart with today's three kept | Four blues and three greens; about four look alike from across the room |
| B Teal and brown | A with Teal #3595A4 and Brown #9C7A47 in place of Sky and Forest | 2: Green and Teal 0.40, Vermillion and Brown 0.43 | Half as many noted pairs; one blue and one green fewer | Brown's block is a drab beige near the board's grays; Teal reads between Us's green and Will's blue |
| C Softer | A's 12 at 60% of their colorfulness, each as far off the wall as before | 25, Will and Us (0.32) among them | Dustier and calmer | Will and Us blur; nearly every swatch in the picker gets a warning; Jenn's turns a dull terracotta |

B's brown was nudged from #977342 to #9C7A47 so it doesn't land a hair under the line beside Rust. A search with colorfulness up to 0.26 found a 12 with no noted pairs at all, but five of its colors were magentas, pinks and purples and two were electric; it wasn't drawn.

## Will's starting color

Both reviewers found Will's and Us's blocks the hardest of the starting three to tell apart from across the room (0.50 on the 9 ft scale, just over the 0.45 line). From A's 12, two other blues keep Will a blue and move him off Us's green: **Indigo** 0.92 from Us, 1.14 from Jenn; **Cornflower** 0.79 and 1.18. Today's Blue is 0.50 and 1.13. The **Will's start** view (picture `final-will.png`) shows all three at 9 ft and full size. Lilac and Plum score higher still (1.15, 1.20) but would make Will purple.

## Calls made here (technical and basic; the owner can veto)

- **Dark phones: mirror.** Each color stands off the dark background as far as it does on the wall, at least 4.5:1 (the research's rule). Neither reviewer could see a difference from "minimal" (keep each color unless it sinks below 4.5:1); the numbers favor mirror, which keeps the 12 as far apart on a dark phone as on the wall, where minimal bunches the blues (Cornflower and Indigo 0.27, Blue and Sky 0.28). The Phones view still shows both.
- **Swatches are small blocks:** each color is drawn in Settings the way the board draws events, a pale block with a solid edge, not a solid dot, so a choice is judged as it'll be seen.
- **More colors is the phone's own color picker** (an HTML color input): no picker to build or keep working. Whether the wall's WebView in Fully opens one is unchecked *(Android WebView has lacked it before)*; if it doesn't, More colors stays on the phones and the wall offers the 12.
- **Words** (both reviewers misread round 1's): under a swatch in the picker, "Jenn's" when it's another person's color and "Hard to tell from Jenn's" when it's close (was "Like Jenn's", read as a good match). Under a person's row, the decided "Hard to tell from Jenn's across the room."; "Too pale to see well on the wall, so the board draws it a shade darker."; "Dark enough to look like text, so the board draws it a shade lighter."; "Could be mistaken for the board's yellow alerts."; "Could be mistaken for the board's red Delete button."; "Reads as gray, which on the board means nobody's." For Us: "the Us color". Plain text, no marker (a marker in amber would itself look like an alert).
- **Text on blocks** uses the research's darker gray, #3A3E41 on light and #B5B5B5 on dark, so times and names pass 7:1 on every block.

## Reviews

Blind reviewers (Sonnet, high effort) judged the pictures only, without the code or what the colors meant: a first-time Jenn-like profile and the owner's.

- **Round 1** (pictures as now, except `round1-a-settings.png` and `round1-notes.png`, and the phones had a status-bar gap): both picked **A**. Both rejected **C** (Will and Us "a blur" at 9 ft; "the picker flags almost everything") and **B** (Brown "drab" or "muddy"; Teal close to Us's green and Will's blue). Both couldn't tell mirror from minimal on the dark phones ("I'd take the simpler one"). Both found "Like Us" and "Like Jenn's" cryptic (the first-time reviewer read "Like Us" as a nice match, the opposite of its meaning), and "the amber that means needs you" and "Shown a shade darker" baffling. Both found Will and Us the closest of the three from afar ("separable, but only barely"; "both read as grey-green"). Both said about four of the 12 are redundant from across the room (Blue, Sky and Cornflower; Leaf, Forest and Green) and suggested 8 to 10. Fixed after it: the words above, the phones' top gap, and the Will's start view added.
- **Not changed here:** the first-time reviewer wanted fuller fills that read at a distance like a Skylight's; the pale 17% blocks were decided in [the marks ticket](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323), so a stronger Will is offered through his starting color instead. Cutting to 8 to 10 colors goes against the owner's 12 ([settings](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/87#issuecomment-6551496631)); it's offered to the owner as an option, not made.

## Pictures

In [shots/](shots/): `final-a-wall.png` and `final-c-wall.png` (the starting three; B starts as A), `final-a-wall-far.png` and `final-c-wall-far.png` (the same at about 9 ft), `final-a-twelve.png` to `final-c-twelve.png` (one event in each of the 12), `final-compare-far.png` (the three sets' 12 at 9 ft), `final-a-phones.png` to `final-c-phones.png` (light, dark mirror, dark minimal), `final-a-settings.png` to `final-c-settings.png` (Will's picker), `final-notes.png` (Will on Forest, Jenn on a bright yellow from More colors), `final-will.png` (Will in Blue, Indigo and Cornflower); `round1-a-settings.png` and `round1-notes.png` (the wording the reviewers misread).

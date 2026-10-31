# Marks, icons and sizes prototype

For the map ticket [How does each person and kind of event look on the house board?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57), 2026-10-31. **Owner's pick: E, color blocks with a green Us** (2026-10-31, "the best of the options given"). Not house board code: `index.html` is one self-contained page with made-up data, kept as the record of what was tried. Build sessions rewrite the pick properly in `custom_components/family_hub/house_board/` per [How is the house board's code laid out?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44).

Open `index.html` in a browser (it opens on E). The bar switches the marks (A to E), the time of day (7:40 am, 3:10 pm, 8:50 pm), the distance (Fit, 6 ft, 9 ft), color vision (Color, Red-green, Gray) and Wall or Phone. The address's `#hash` holds the state, e.g. `#b-evening-9ft-redgreen-wall`; `shot` anywhere in it draws the face alone at full size for screenshots.

Pictures in [shots/](shots/), each round's kept: `final-compare.png` (all five at 3:10 pm), `final-a.png` to `final-e.png` (each at the three times), `final-far.png` (all five at 25%, about 9 ft), `final-vision.png` (each in color, red-green color blindness and gray), `final-phones.png` (the same rows on a phone); `round1-*.png` the same for round 1, whose B, C and D differed (below). The final pictures are round 2 plus E, with C's plan on both calendars named "Will, Jenn" rather than "Us".

Starting points: the [resting face prototype](../resting-face/README.md) (layout D), the [icons and marks research](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/71#issuecomment-6537416864), and the rules decided in [What does the board notice, show and hide?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61).

## Mark languages

The layout, sizes and small marks are the same in all five; only how whose and what kind are drawn changes.

| | Marks | Us and shared plans | Whose, besides color | Event icons | Does well | Gives up |
|---|---|---|---|---|---|---|
| A | Bars and names | Two-tone bar, Will over Jenn | Name in words | Gray, on rows and the Next line | Calmest; nothing to learn | Whose is a thin bar from across the room |
| B | Color blocks | Block split Will and Jenn | Name in words | Gray, rows only | Whose and how full a day is, from across the room | More color on the wall; the split block looks busy |
| C | Green for Us | One darker green for Us and every shared plan | Name in words | Gray, on rows and the Next line | Shared plans pop from across the room; one color per meaning | Green and Jenn's vermillion converge for red-green color blindness |
| D | Names with emoji | Two-tone bar; both emoji | Name in words, the person's emoji leading each title | Gray, rows only | Warmth; answers "soulless letters" without a code to learn | Busiest; emoji push titles to a second line, so a full day drops a row sooner |
| **E** | **Color blocks, green for Us** (the owner's pick) | One darker green block for Us and every shared plan | Name in words | Gray, rows only | B from across the room, C's one color per block | C's color-blindness catch; the most color on the wall |

**Round 1** (pictures `round1-*.png`): A and B as above, but B's blocks were darker and taller; C was **a picture each** (a person's own monochrome icon in a colored circle instead of the name; a darker green for Us; no event icons), D was **emoji** (an emoji per person instead of the name, emoji event icons, today's green for Us). Both reviewers rejected C's and D's person marks as a code to learn, so round 2 put names back, kept a picture only beside them (D), made C the green Us on its own, and made B's blocks lighter and tighter. E was added after round 2's review.

Left out on purpose: initials in a chip (the owner's "soulless letters", [#31](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/31)) and a neutral gray for Us (reads as nobody's).

## Sizes, retuned (technical call; the owner can veto)

The owner's standard (2026-10-30): from across the room the face is structurally clear, not readable. So the shapes that say "something's coming, roughly when, whose" got bigger, and words that only read up close came down, which freed room for notes and Later.

| Part | D as picked | Retuned | What it carries from about 9 ft |
|---|---|---|---|
| Next line | 84 px | 84 px | The one line that reads from there |
| Next band's bar | 16 px | 20 px | Whose the next thing is |
| "Next · Will" | 30 px | 28 px | Up close |
| Clock | 60 px | 60 px | Reads from about 6 ft |
| Date, weather, rain | 30, 40, 26 px | 24, 32, 24 px, stacked under the clock | Up close; stacked so the Next line keeps its width |
| Needs-you line | 44 px words, 70 px band | 34 px words, 58 px band | The amber band's shape; words up close |
| Day names | 34 px | 30 px | Up close; a column's place says which day |
| Event bars | 9 px | 14 px (15 in the first column) | Whose (color) and how full a day is (how many) |
| Titles | 34 px first column, 28 px others | 28, 26 px | Up close |
| Time lines | 26, 22 px | 21, 20 px | Up close |
| Names on rows | 14 to 16 px after a colored pip | 20 to 21 px, no pip | Up close; the bar carries the color |
| Notes | none | 26 px, open circle | Up close |
| Dinner | 32, 26 px | 26, 22 px | Up close |
| Gap between rows | 8 px | 10 px | Keeps bars apart |

What it frees: at 3:10 pm the first column now holds two notes, Later and all four of the day's events besides the Next line, where D as picked held three events and "+1 more" with no notes. Text reads comfortably from about its size divided by 10, in feet: 26 to 28 px titles from about 2½ to 3 ft, standing at the wall.

## Calls made here (technical and basic; the owner can veto)

- **Colors:** Will #005A8C (a step darker than #0072B2, so Will and Jenn differ in lightness where hue fails), Jenn #D55E00; in C and E, Us #007A5A. Text stays near-black on tints, every pairing over 10:1. Blocks (B, E) are a 17% tint with a thinner edge and 7 px between rows, so they drop no more rows than bars do; Work and all-day items 8 to 13%.
- **Work's labeled block and all-day items:** a pale tint of the person's color with their bar, "8:30 to 4:30 · Will · At work", so routine hours fall back. Shared all-day items split the tint.
- **Icons:** Material Design Icons (the set Home Assistant serves), gray #464C50, 1.2 times the title's size at the row's right; 0.9 times the line's size before the title on the Next line. From a fixed word table (vet, dentist, flight, travel, trash, birthday, haircut, oil change), first match wins; routine words (work, gym, yoga) and meals have none.
- **New dot:** solid near-black, half the time line's size, before the time; after the words on a note.
- **Clash mark:** `mdi:set-center` (two overlapping rings), gray, after the name. The words are in the needs-you line (today, or tomorrow after the evening hand-off) and, later, the event's sheet.
- **Notes:** at the top of the first column with an open circle (tap it to clear), "Later (3) ›" under them; a note for a later day sits at the top of its day.
- **Never dropped:** besides the Next line, the rows the needs-you line names stay when a column is full.
- **Sizes in em** of the title, so the same rows drop onto the phones at phone size (Phone view); how the phones are laid out is [What do the phones show?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/50).
- **A plan on both your calendars** shows once and names you both ("Will, Jenn") in every version; it takes Us's look, two-tone or green.
- **License:** the page inlines 9 MDI paths (MDI 7.4.47, icons under Apache-2.0); the house board will use Home Assistant's own `ha-icon`.

## Reviews

Blind reviewers (Sonnet, high effort) judged the pictures only, at full size and at 25% for about 9 ft. None had seen the code or knew what the marks meant.

- **Round 1** (A to D as in `round1-*.png`; a first-time Jenn-like profile and the owner's): both put **B** first from across the room ("whose and how busy at a glance") and **A's names in words** first up close. Both rejected C's pictures and D's emoji in place of names as a code to learn; D's house emoji on a dinner out and tree on "At work" read as contradictions. The owner profile found A's split bars "muddy two-tone blobs" at 25% and liked a green Us; the first-time profile found B's taller blocks pushed rows (one a clash) behind "+1 more", and C's picture circles clipped. Fixed after it: names back in C and D, B lighter and tighter (it now drops no more rows than A), the clipping, and the made-up data (the Next line was Will's at every time; Yoga moved so 3:10 pm shows Jenn's).
- **Round 2** (A to D as in the final pictures, before E; first-time profile): kept **C** ("one color per meaning, Us is never a two-tone mix, and it's calm"), **B** a close second, would borrow B's fill into C; take down **D** (emoji crowd the titles; Saturday morning hides Dinner with friends). E is that suggestion and wasn't reviewed on its own.
- **Found in every round, not changed here:** nobody could say what the **new dot** means cold, and the **clash mark** was guessed as "shared" or "together" until the evening's needs-you line said "overlaps". Both are decided as close-up detail ([#61 q1](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536911798)); the event's sheet says what they mean ([sheet ticket](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/45)). Also noted for later tickets: undated notes under "Tomorrow" after the evening hand-off read as due tomorrow; notes name no owner; Jenn's "Work shift" beside Will's "At work 8:30 to 4:30" reads as two wordings for one thing (Jenn's labeled block, once her calendar is connected, would fix it).

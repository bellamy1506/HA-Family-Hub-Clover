# Wall display legibility at 6 to 12 feet

Research note, 2026-10-29. Question: how big, how heavy, how contrasty and how coloured must text on the wall board be so it reads from 6, 9 and 12 ft? The board is a 14.3-inch 3:2 matte panel, 2400 x 1600 device px, shown as 1200 x 800 CSS px at devicePixelRatio 2.

Lines marked **[inference]** are my own arithmetic or judgement, not something a source states.

## 1. The screen: how big is one CSS pixel?

- 3:2 diagonal factor = sqrt(3² + 2²) = sqrt(13) = 3.6056.
- Width = 14.3 x 3 / 3.6056 = **11.898 in**. Height = 14.3 x 2 / 3.6056 = **7.932 in**.
- Physical density = 2400 / 11.898 = **201.7 device px/in** (1600 / 7.932 gives the same).
- At DPR 2, one CSS px = 2 device px, so **100.85 CSS px/in**.
- **1 CSS px = 0.00992 in = 0.252 mm.** (The brief's 0.01025 in / 0.26 mm is about 3% high; it would correspond to ~97.6 CSS px/in. The numbers below use 0.00992 in.)
- The whole board is 800 CSS px = 7.93 in tall. That fixed height is the real constraint at 12 ft (see section 4).

## 2. What the sources say about size

| Source | Rule | Measured on |
|---|---|---|
| MIL-STD-1472F 5.2.1.6.4.1 (electronic displays) | Black-and-white characters at least **16 arcmin**, **20 arcmin preferred**; *coloured* characters at least **21 arcmin**, **30 arcmin preferred**, at the greatest viewing distance | character height |
| MIL-STD-1472F 5.2.1.5.6.6 | Where colour must be perceived accurately: small characters at least 20 arcmin; isolated colour symbols at least **30 arcmin, preferably 45 arcmin** | symbol major dimension |
| Human-factors handbook chapter (Taylor & Francis) | 20 to 22 arcmin "assures legibility"; 16 to 18 arcmin may be acceptable depending on contrast; FAA suggests height of 1/200 of viewing distance (about 17 arcmin) | character height |
| Legge & Bigelow 2011, J. Vision | Critical print size for normal vision is about **0.2 deg = 12 arcmin x-height** (range 0.15 to 0.3 deg); critical size is at least 2x the acuity limit; fluent reading from 0.2 to 2 deg | x-height |
| ADA 2010 Standards, Table 703.5.5 (signs mounted 40 to 70 in high) | **5/8 in** at under 72 in viewing distance, plus **1/8 in per foot** beyond 72 in | uppercase "I" (cap height) |
| Sign-industry rule of thumb (WMU digital-signage guidance, Signs.com) | about **1 in of letter height per 10 ft** | letter (cap) height |
| W3C low-vision task force thread | Standards are unclear whether ~22 arcmin means body, cap or x-height; the reading changes x-height by ~45% | — |

Sources: MIL-STD-1472F text, https://www.denix.osd.mil/soh/denix-files/sites/21/2016/03/02_MIL-STD-1472F-Human-Engineering.pdf ; handbook chapter, https://www.taylorfrancis.com/books/e/9781315098128/chapters/10.1201/b22361-52 (seen via search snippet only) ; Legge & Bigelow, https://pmc.ncbi.nlm.nih.gov/articles/PMC3428264 ; ADA 2010 Standards 703.5, https://www.access-board.gov/ada/ ; WMU, https://wmich.edu/digital-accessibility/digital-signage ; Signs.com, https://www.signs.com/blog/?p=16381 ; W3C thread, https://lists.w3.org/Archives/Public/public-low-vision-a11y-tf/2019Sep/0041.html

Formula: height = 2 x distance x tan(angle / 2). 1 arcmin at 6 / 9 / 12 ft = 0.0209 / 0.0314 / 0.0419 in.

ADA check **[inference]**: the ADA table works out to 29.8 arcmin at 6 ft (5/8 in), 31.8 at 9 ft (1 in), 32.8 at 12 ft (1-3/8 in). So the ADA sign rule sits right at MIL-STD's "coloured, preferred" 30 arcmin. 1 in per 10 ft is about 28.6 arcmin.

## 3. Minimum sizes for this board

Cap height is what the standards measure. x-height is what Legge & Bigelow measure. CSS `font-size` is neither: for a typical UI sans (Roboto, San Francisco, Segoe) cap height is about 0.70 to 0.72 em and x-height about 0.52 em, so **font-size ~ cap height / 0.71 ~ x-height / 0.52** **[inference: typical font metrics, check the actual font]**. The card's font stack is `inherit` / `-apple-system, ...`, so the rendered font depends on the browser.

### (a) Readable: event titles, times, meal names

Target: cap height 20 arcmin (MIL-STD preferred, handbook 20 to 22), which gives x-height about 14 arcmin, just above the 12 arcmin critical print size for 20/20 eyes. **[inference]** A 20/40 viewer's critical size roughly doubles (Legge & Bigelow: critical size tracks acuity, ≥2x acuity), so for 20/40 or older eyes "comfortable" is nearer the glanceable row below.

| Distance | Cap height | Cap in CSS px | x-height (14') | approx. CSS font-size |
|---|---|---|---|---|
| 6 ft | 0.42 in | **42 px** | 0.29 in / 30 px | ~59 px |
| 9 ft | 0.63 in | **63 px** | 0.44 in / 44 px | ~89 px |
| 12 ft | 0.84 in | **85 px** | 0.59 in / 59 px | ~119 px |

Absolute floor (16 arcmin cap, MIL-STD minimum, monochrome text only): 34 / 51 / 68 CSS px cap at 6 / 9 / 12 ft (0.34 / 0.50 / 0.67 in).

### (b) Glanceable: day names, "Today", the one thing you must catch walking past

Target: cap height 30 arcmin. This is MIL-STD's preferred size for **coloured** text and matches the ADA sign table. Use it for any text drawn *in* a person's colour.

| Distance | Cap height | Cap in CSS px | ADA 703.5.5 cap | approx. CSS font-size |
|---|---|---|---|---|
| 6 ft | 0.63 in | **63 px** | 0.625 in / 63 px | ~89 px |
| 9 ft | 0.94 in | **95 px** | 1.0 in / 101 px | ~134 px |
| 12 ft | 1.26 in | **127 px** | 1.375 in / 139 px | ~179 px |

Colour swatches (person dot, event bar), MIL-STD 30 / 45 arcmin: 63 / 95 px at 6 ft, 95 / 143 px at 9 ft, 127 / 190 px at 12 ft along their long side. A full-width event bar meets this easily; a small dot does not.

## 4. What this means for a 1200 x 800 board  [inference]

- At **6 ft** the readable tier (~59 px font, ~75 px line) fits about 10 lines in 800 px. A week grid is workable if each cell carries few items.
- At **9 ft** the readable tier fits about 7 lines. A 7-day grid with readable titles does not fit; a "today + next" view does.
- At **12 ft** even one readable line is ~119 px font. Only glance content works: day name, a count, one next event, a colour bar. Detailed reading needs walking closer.
- Design for the distance people actually read from (likely 6 to 9 ft), and make the 12 ft view answer one question ("anything today?").

## 5. Weight and font

- Avoid thin weights. Apple HIG: "avoid Ultralight, Thin, and Light font weights, which can be difficult to see"; prefer Regular, Medium, Semibold or Bold. https://developer.apple.com/design/human-interface-guidelines/typography
- WCAG 1.4.3 Understanding: fonts with extraordinarily thin strokes are harder to read, and anti-aliasing renders thin fonts fainter than their nominal colour. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Stroke ratios: ADA 703.5.7 stroke 10% to 30% of cap height; MIL-STD-1472F 5.2.1.6.4.2 stroke 1/12 to 1/6 of character height. Regular (400) is at the thin end; **Medium/Semibold (500 to 600) for distance text [inference]**.
- ADA 703.5.4: uppercase "O" width at least 55% of height (no condensed faces). MIL-STD-1472F 5.2.1.6.4.3: sans serif when reading quickly; mixed case, not all caps; font must separate l/1 and Z/2.

## 6. Contrast

- WCAG 1.4.3 (AA): 4.5:1 for text, 3:1 for "large" text (24 CSS px, or 18.5 px bold). WCAG derives 4.5:1 from 20/40 vision and 7:1 (1.4.6, AAA) from 20/80. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- The "large text" relief assumes desk distance. At 6 to 12 ft, even 60 px text subtends only ~14 to 20 arcmin, which is small text in angular terms. **Use 7:1 for all text on the board, and never below 4.5:1 [inference]**.
- Coloured text is the weak spot: saturated person-colours on white often fall under 4.5:1. Put names and titles in near-black/near-white, carry the colour in a bar, chip or dot next to them. MIL-STD-1472F 5.2.1.5.6.6 also asks for at least 1:5 contrast on colour-coded characters.
- ADA 703.5.1: characters and background shall have a **non-glare finish** and contrast as much as possible. The matte panel already meets the finish part.

## 7. Light or dark background

- Dobres et al. 2016 (Ergonomics): dark text on light background read at glance faster than light on dark: thresholds 85 ms vs 119 ms, in a dim (~23 lux) room; legibility thresholds rose with age. https://pmc.ncbi.nlm.nih.gov/articles/PMC5213401
- Piepenbrock et al.: positive-polarity (dark on light) advantage held for both younger and older adults (seen via search abstract, not read in full).
- **[inference]** Light background by day. At night a bright white panel lights the room; a dimmed light theme or a dark theme with heavier weight and larger size is a fair trade there. Dark-on-light also reduces the halo that light text gets on dark under a matte diffuser.

## 8. How much to show per day

- Glanceable displays (Matthews, Forlizzi, Rohrbach, UC Berkeley EECS-2006-113): four principles — match expectations, use abstraction (show only the essential bits), make visuals distinct, keep consistency (do not move or recolour things). https://www2.eecs.berkeley.edu/Pubs/TechRpts/2006/EECS-2006-113.html
- Cowan 2001 (BBS): short-term capacity is about **4 chunks**, not 7. https://pubmed.ncbi.nlm.nih.gov/11515286/
- **[inference]** Show at most **3 events per day cell** plus a "+N more" line, and at most ~4 items in any glance region. Put time first, short title, no secondary text.

## 9. Colour by person

- Colour-blind viewers: about **1 in 12 men** have colour-vision deficiency; red/green confusion is most common. https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness
- WCAG 1.4.1: colour is not the only visual means of conveying information. https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- MIL-STD-1472F 5.14.3.3.7: do not code solely by colour; colour-filled symbols beat colour outlines. 5.2.1.5.6.1: use colour consistently and sparingly; one colour per category. 5.4.1.4.5: no more than five colours (controls).
- Okabe & Ito, Color Universal Design: do not convey information in colour only; label directly instead of a legend; thicker lines and bigger marks help; avoid red/green of similar brightness, and dark red on black. https://jfly.uni-koeln.de/color/ . Their 8-colour CVD-safe set (hex as published by secondary references, e.g. https://cmap-docs.readthedocs.io/en/latest/catalog/qualitative/okabeito:okabeito/): #E69F00 orange, #56B4E9 sky blue, #009E73 bluish green, #F0E442 yellow, #0072B2 blue, #D55E00 vermillion, #CC79A7 reddish purple, #000000.
- **[inference] For two adults plus "both/household":** 3 colours, e.g. Okabe-Ito blue #0072B2, vermillion #D55E00, and bluish green #009E73 (or neutral grey for household). They differ in lightness as well as hue, so they still separate in greyscale. Pair each with a redundant cue: initial letter or name on the chip, and/or position (each person's own lane). Keep the palette to 5 or fewer in total.

## 10. Summary numbers

| | 6 ft | 9 ft | 12 ft |
|---|---|---|---|
| Readable cap height (20') | 42 px / 0.42 in | 63 px / 0.63 in | 85 px / 0.84 in |
| Readable font-size (approx.) | ~59 px | ~89 px | ~119 px |
| Glanceable / coloured cap (30') | 63 px / 0.63 in | 95 px / 0.94 in | 127 px / 1.26 in |
| ADA 703.5.5 cap | 63 px / 0.625 in | 101 px / 1.0 in | 139 px / 1.375 in |
| Floor (16', monochrome) | 34 px | 51 px | 68 px |

Contrast 7:1 target, 4.5:1 floor. Weight 500 to 600, no thin weights. ≤3 events per day cell. 3 person colours from Okabe-Ito, always with a letter, name or lane.

## Gaps

- ISO 9241-303 and FAA HF-STD-001B were not read (paywalled / PDF over the fetch limit). MIL-STD-1472F stands in for them.
- Piepenbrock et al. and the Taylor & Francis chapter were seen via abstracts or snippets only.
- Font metrics (cap 0.71 em) are typical values, not measured on the board's actual font. Check with a ruler on the panel: the 6 ft readable cap should measure ~10.6 mm.

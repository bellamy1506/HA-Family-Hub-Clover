Research note, 2026-11-01, for [What does Calendar Card Pro do that the house board must match, and what can it borrow?](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/103).

# Calendar Card Pro: theming and color

Scope: theming and color only (the owner, 2026-11-01: "The examples on the linked website were also useful for color theming considerations too"). Features, code, the data path, the community and the other cards are in their own notes in this folder. Calendar Card Pro (CCP below) was read at commit `75bf292` (v5.0.0, MIT); code is cited as `path:line` in [its repository](https://github.com/alexpfau/calendar-card-pro) at that commit, and nothing of it was run. Lines marked *(inferred)* are my arithmetic or judgment, not something a source states. Theming is open on the map ("More color schemes", [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37)), not on the frontier, so this note decides nothing.

## Answer

- **CCP's model:** one color per calendar, spent three ways: a full-strength bar, a see-through tint (none in its list and column views, 20% in its grid), and, if asked, text in a darker or lighter "ink" mixed from the color and the theme's text color. Everything else comes from Home Assistant's theme variables, and it follows light and dark mode without ever detecting it, by mixing toward theme colors that flip on their own.
- **Same idea as the house board, looser rules.** CCP checks nothing: any color goes, and the colors in its own family examples draw bars at 1.7 to 2.7:1 on a white card, under WCAG's 3:1 for graphics; the house's bars are 3:1 or more and its text 7:1 or more. Keep the house's rules.
- **Where the house board looks worse: duller blocks.** Mixing a deep color into the wall's off-white in sRGB, as decided, loses most of its colorfulness, so the house's pale blocks look grayish beside CCP's clean pastels, and from about 9 ft its starting three sit 0.79 to 1.18 apart on the person-colors scale where CCP's three demo people sit 0.98 to 1.49. CCP's own fix fits the house: keep the block's lightness and put the color back (OKLCH chroma times 1.5). That gives the starting three 1.15 to 1.78 apart on the wall, leaves no pair of the 12 under the 0.45 note line on the wall or a dark phone (the wall has four now), and moves no text contrast *(inferred, my computation; checked in Chromium)*. It puts more color on the wall, so it's a choice for the owner later.
- **Two technical lessons.** Dark phones should key off Home Assistant's own dark-mode flag, never the browser's `light-dark()` or `prefers-color-scheme`, which can follow the phone instead of Home Assistant (CCP shipped that bug). And the derived colors are best computed in the board's JavaScript, as the person-colors note already plans: Chromium's results differ from the CSS spec's in two places tested here, and Safari wasn't tested.
- **For "More color schemes":** CCP shows a look can be very few values if everything else is mixed from them. The one example look worth offering later is a dark wall face for the evening, with CCP's dark grid as the reference. The see-through card over a wallpaper, which most of CCP's dark pictures use, doesn't suit a wall read from across the room.

## 1. How Calendar Card Pro colors things

### 1.1 Where a calendar's color comes from

- **`accent_color`**, per calendar or for the whole card: any CSS color, a theme variable, or `home-assistant`. Unset, it is the theme's primary color, `var(--primary-color, #03a9f4)` (`src/config/config.ts:44`), so a calendar nobody colored takes the theme's accent. The Now & Next story shows the result: every bar is the theme's amber, and nothing says whose ([picture](shots/theming-dark-phone.png)).
- **`home-assistant`** reads the color Home Assistant 2026.2 and later keeps for each calendar entity, fetched once per page with `config/entity_registry/list` and read from `options.calendar.color` (`src/utils/entity-colors.ts:218`, `:235`). Theme names such as `blue` become `var(--blue-color)` (`:108`, `:152`). Only Google Calendar fills a color in, and only when a calendar is first added; Local, CalDAV and ICS calendars start with none ([Using the Colors From Home Assistant](https://calendar-card-pro.alexpfau.com/features/core-settings#using-the-colors-from-home-assistant)).
- **Order:** a calendar's own color, then its `home-assistant` color, then the card's (`src/utils/events.ts:2179`).
- **Shared plans:** with duplicates merged, `duplicate_accent_color` recolors a plan found on two or more calendars: its bar, tint and all-day badge (`src/rendering/presentation.ts:116`). The family stories set it to the Family calendar's gold, "so gold means the family wherever the event lives" ([Gold Means the Whole Family](https://calendar-card-pro.alexpfau.com/guide/family-calendar#gold-means-the-whole-family)).
- Per calendar there is also `color` (its titles) and `label_icon_color` (its icon).

### 1.2 How one color is spent

| Part | How it's drawn | Default | Where |
|---|---|---|---|
| Bar beside each event | the color at full strength, its own element `.event-accent-bar` | 2 px wide (`vertical_line_width`) | `src/config/config.ts:45`; [Theming](https://calendar-card-pro.alexpfau.com/features/theming) |
| Event block | the color at `event_background_opacity` percent, **see-through** (`rgba()` or `color-mix(... transparent)`), laid over whatever is behind | 0 in list and column, 20 in grid; the stories use 12 and 15 | `src/config/config.ts:90`, `src/config/view.ts:1232`, `src/utils/helpers.ts:56` to `:71`, `src/rendering/presentation.ts:129` |
| Title, time, place, notes | the theme's text colors, unless set to `accent`: then a "readable shade" mixed 45% color into `--primary-text-color` in OKLCH with chroma times 2.2 (30% in sRGB on older browsers) | text colors in list and column; `accent` in grid | `src/rendering/accent-text.ts:41`, `:131`; `src/rendering/styles.ts:1624` to `:1650`; `src/config/view.ts:1233` to `:1237` |
| Progress bar | the raw color | theme's gray | `src/rendering/accent-text.ts:41` to `:47` |
| All-day pill or badge | a 14% wash and the same ink, plus a thin ring "because a crisp edge survives a tinted ground where an area wash cannot"; a filled pill gets black or white text by the color's OKLCH lightness (above or below 0.55) | wash, in the calendar's color | `src/rendering/styles.ts:2502` to `:2525`, `:2923` to `:2953` |
| Today's date | a 25% wash of the theme's primary color with the digits in its ink: "a wash strong enough to read as a mark across a room" | on, since v5 | `src/rendering/styles.ts:1420` to `:1470` |
| Now | emerald `#34d399`: the grid's now line raw, a running event's time through the ink | on | `src/config/config.ts:102`, `src/rendering/styles.ts:1655` to `:1695` |
| Calendar chips (key and filter) | a 24% tint of each calendar's color; a hidden calendar's chip turns gray | when the toolbar's legend is chips | `src/rendering/styles.ts:1008` |
| Toolbar | "a neutral gray pill, so the toolbar never competes with the events"; color only on the control being pressed | gray, 8% of the text color | `src/rendering/styles.ts:697`; [Header Toolbar](https://calendar-card-pro.alexpfau.com/features/layout-appearance#header-toolbar) |
| Weekend, grid rules | 4% of the text color; the theme's divider at half strength | grid only | [Configuration](https://calendar-card-pro.alexpfau.com/reference/configuration) |
| Finished events | their words at 60% opacity; tints and bars not dimmed | 60 | `src/config/config.ts:91`; [Theming](https://calendar-card-pro.alexpfau.com/features/theming#past-event-opacity) |

Why the text ink exists, in the code's words: "The raw accent is not a text color." Text drawn in the raw calendar color measured 2.16:1 (blue) and 2.32:1 (coral) on their own blocks in the light theme and 1.89:1 (purple) in the dark one (`src/rendering/accent-text.ts:55` to `:60`). CCP models this on macOS Calendar: "the bar is the accent at full strength, the block is the accent at low opacity, and the text is a third, more legible color derived from it" ([Event Text in Calendar Colors](https://calendar-card-pro.alexpfau.com/features/event-content#event-text-in-calendar-colors)).

Why chroma is "put back": mixing a color toward white, black or the theme's text color drains its colorfulness along with its lightness, so CCP takes the lightness from the mix and multiplies the chroma back up, 2.2 for inks and 1.8 for washes, with CSS relative color syntax (`oklch(from ... l calc(c * 1.8) h)`, Chrome 122, Firefox 133, Safari 18 and later) (`src/rendering/styles.ts:2892` to `:2938`).

### 1.3 How it follows Home Assistant themes and dark mode

An unstyled card takes its colors from eight theme variables ([Colors From Your Theme](https://calendar-card-pro.alexpfau.com/features/theming#colors-from-your-theme)): `--primary-color` (default accent, today, hover), `--primary-text-color`, `--secondary-text-color`, `--divider-color`, `--ha-card-background` then `--card-background-color`, `--primary-background-color`, `--ha-card-border-radius` and `--error-color`. Most reach the card through an option whose default names the variable, written as an inline style, so a theme change flows through, and a card-mod rule needs `!important` to beat it.

There is no dark-mode switch anywhere. Inks mix toward `--primary-text-color` and washes toward the card background, both of which flip when the theme does, so "the same declaration darkens the accent on one and lightens it on the other" (`src/rendering/accent-text.ts:70` to `:74`). The Grid View page shows the same unstyled card on Home Assistant's default light and dark themes ([picture](shots/theming-light-dark.png)).

**A pitfall CCP shipped and fixed.** Its all-day badge once used CSS `light-dark()`, and "the badge tracked the OPERATING SYSTEM": "A dark HA theme under a light OS ... got the light theme's ink", a maroon "barely separable from the row"; nothing caught it because its screenshot harness forced dark mode (`src/rendering/styles.ts:2854` to `:2866`). Its toolbar still uses `light-dark()`, with a comment that "Home Assistant sets the page's color-scheme from its dark mode" (`:715` to `:733`), so CCP's own comments disagree. Home Assistant's frontend settles it: it writes `<meta name="color-scheme">` as `dark` in dark mode, `light` for the default theme, and `dark light` for other themes in light mode ([`themes-mixin.ts`](https://github.com/home-assistant/frontend/blob/dev/src/state/themes-mixin.ts), read 2026-11-01), and `dark light` leaves the choice to the device. So both comments are partly right, and only Home Assistant's own flag, `hass.themes.darkMode` (set in the same file), is reliable.

### 1.4 What it exposes for restyling

CSS custom properties, mostly written inline per card or per event: `--calendar-card-event-accent-bar-color`, `--calendar-card-line-width-vertical`, `--calendar-card-accent-ink` and `--calendar-card-accent-ink-source`, `--calendar-card-past-event-opacity`, `--calendar-card-today-indicator-color` and `-ink`, `--calendar-card-now-ink`, `--calendar-card-toolbar-fill` (`-hover`, `-pressed`), `--calendar-card-toolbar-selected`, `--calendar-card-legend-color`, `--calendar-card-grid-weekend`, six `--calendar-card-weather-*` properties, and `--badge-ink`, `--badge-wash`, `--badge-solid` on all-day pills. Plus state classes for card-mod (`today`, `tomorrow`, `weekend`, `past-event`, `event-now` and more) ([Card-Mod Examples](https://calendar-card-pro.alexpfau.com/features/theming#card-mod-examples)).

### 1.5 The example palettes and looks

Every example picture on the site was opened in Chromium and looked at (29 pictures across the home page, the six stories, and the core settings, event content, grid, column, weather and layout pages). The site has a light and dark switch, but it changes only the documentation's own pages: the pictures are fixed PNGs and stay the same (checked by loading the Grid View page in both). The one light and dark pair is the Grid View page's.

| Story or page | Palette | Look |
|---|---|---|
| Family Hub, Family Agenda, Today & Tomorrow | Anna `#ff6c92` pink, Ben `#03a9f4` light blue, Leo `#66bb6a` green, Family and shared plans `#ffb74d` gold, trash `#b388ff` lilac, work `#90a4ae` blue-gray ("quieter than his own blue on purpose") | Home Assistant light, white card; 20% grid tints, 15% column, 12% agenda; text in each calendar's ink ([wall](shots/theming-family-hub-wall.png), [agenda and shared](shots/theming-list-tint-and-bars.png)) |
| Bin Day | `#78909c`, `#f9a825`, `#1e88e5`, `#43a047` | light; outline pills ([pills](shots/theming-allday-pills.png)) |
| Birthdays & Holidays | `#f06292`, `#26a69a` | see-through dark card over a wallpaper |
| Now & Next | none set, so all the theme's amber | see-through dark card over a wallpaper ([picture](shots/theming-dark-phone.png)) |
| Grid, column, week-number, today and weather pages | a blue, a pink, an orange, a green; the older default `#03a9f4` and `#e67c73` | Home Assistant light, Home Assistant dark (card `#1C1C1C`), and the see-through dark card over a purple-to-red wallpaper with an amber primary ([picture](shots/theming-wallpaper-look.png)) |

The palettes are Material Design's light tones (300 to 400), bright and pale. So three looks in all: Home Assistant's default light, its default dark, and an unnamed custom wallpaper theme. No high-contrast, e-ink or night look.

My reimplementation of CCP's color math reproduces its pictures: the 20% blocks in the Family Hub picture sample as `#CDEEFD`, `#FFE2E9`, `#E0F1E1` and `#FFF1DB`, exactly what the formula gives for Ben, Anna, Leo and Family on a white card, and the dark grid's blue block as `#173847`, also exact.

## 2. Against the house board's color model

The house's model, from [#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323), [#91](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184), [#92](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92#issuecomment-6557606569), the [person-colors note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/person-colors/docs/research/person-colors.md) and the [marks](../../../prototypes/marks/README.md) and [person-colors](../../../prototypes/person-colors/README.md) prototypes: each person's color kept as picked and redrawn for each background (bar between 3:1 and 7.5:1 on light, at least 4.5:1 on dark, mirrored on dark phones); a pale 17% block mixed into the background in sRGB with a solid edge; one green for Us and every shared plan; near-black titles and gray times at 7:1 or more; amber, scarlet and gray reserved for meanings; a note when two people's colors are close (under 0.45 on the 9 ft scale); structurally clear from across the room, readable up close; judged in normal color vision.

### 2.1 Side by side

Numbers are mine *(inferred)*, using the person-colors note's own method, which reproduces its figures exactly (1.13, 1.06, 0.50, and Cornflower's 0.79 and 1.18). CCP's are for its Family Hub colors on Home Assistant's current defaults (light card `#FFFFFF`, text `#141414` and `#5E5E5E`; dark card `#1C1C1C`, text `#E1E1E1` and `#9B9B9B`; from the frontend's [color](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/color.globals.ts) and [core](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/core.globals.ts) files, read 2026-11-01).

| | Calendar Card Pro | House board, decided |
|---|---|---|
| Color source | per calendar; any color; theme's primary if unset | per person; 12 checked, then any, with a note when close; stored as picked |
| Bar on light | 1.7:1 (gold) to 2.7:1, all under WCAG's 3:1 | 3:1 to 7.5:1 (Cornflower 3.4, Vermillion 3.5, Green 4.9) |
| Bar on dark | the same color: 6.3 to 9.9:1 | redrawn (mirror): 4.5 to 7.5:1 |
| Block | 20% see-through tint (grid) | 17% opaque mix into the background |
| Blocks apart at 9 ft, light | Anna and Ben 1.49, Anna and Leo 1.46, Ben and Leo 0.98; gold Family 0.83 to 1.53 from them | Cornflower and Vermillion 1.18, Vermillion and Green 1.06, Cornflower and Green 0.79 |
| Blocks apart at 9 ft, dark | Anna and Ben 1.72, Anna and Leo 1.88, Ben and Leo 1.24 | Cornflower and Vermillion 1.55, Vermillion and Green 1.36, Cornflower and Green 1.02 |
| Titles on blocks | theme text (15:1 or more) in list; calendar ink in grid, 6.0 to 7.5:1 light, 6.9 to 7.3:1 dark | near-black, 12:1 or more |
| Times on blocks | theme gray, 5.3 to 5.8:1 (on Home Assistant's earlier `#727272`, 3.9 to 4.4:1); ink in grid | `#3A3E41`, 7:1 or more |
| Shared plans | one color for the family (gold) | one color for Us (green) |
| Work | a separate gray calendar color | the person's color at 8% with a label |
| Light and dark | follows the theme by mixing toward its colors | wall light; phones follow Home Assistant's light or dark |
| Close colors | never checked | a plain note under the swatch |

### 2.2 Ideas that fit

1. **Put the color back in the pale blocks** *(inferred; owner-visible)*. CCP's two-step recipe for its washes, a mix for lightness and then chroma multiplied back up, applied to the house's own decided block: `oklch(from color-mix(in srgb, <bar> 17%, <background>) l calc(c * 1.5) h)`. Lightness is untouched, so every contrast the person-colors note checked stays where it was; only colorfulness rises. Measured with the note's scale on the 12:

   | | Starting three apart (Cornflower and Green, Cornflower and Vermillion, Vermillion and Green) | Pairs of the 12 under 0.45 | Titles, times on blocks |
   |---|---|---|---|
   | Wall, decided | 0.79, 1.18, 1.06 | 4 | 12.2:1, 7.4:1 or more |
   | Wall, chroma times 1.5 | 1.15, 1.78, 1.61 | 0 | 12.2:1, 7.4:1 or more |
   | Wall, chroma times 1.8 (CCP's own factor) | 1.38, 2.14, 1.94 | 0 | 12.1:1, 7.4:1 or more |
   | Dark phone, decided | 1.02, 1.55, 1.36 | 0 | 11.0:1, 7.0:1 or more |
   | Dark phone, chroma times 1.5 | 1.60, 2.24, 2.08 | 0 | 11.1:1, 7.1:1 or more |

   Chromium 153 drew the expression exactly as computed (`#D1E3F7`, `#F6D9BD`, `#C2E3D7` for the three on the wall). Only Sky on a dark phone runs past what a screen can show at times 1.5 and has to be toned down. The closest block to the needs-you band, Vermillion, stays well clear of it (1.01 on the scale, was 1.07). What it gives up: more color on the wall, where E was already "the most color on the wall" ([marks README](../../../prototypes/marks/README.md#mark-languages)); and the 0.45 note line, calibrated on today's blocks, would need recalibrating. It would also answer the first-time reviewer who "wanted fuller fills that read at a distance like a Skylight's" ([person-colors README](../../../prototypes/person-colors/README.md#reviews)) without making the blocks less pale. The 45% and 35% Month strips would need their own check. Picture: [theming-compare-blocks.png](shots/theming-compare-blocks.png), panels B and F.
   Tried and rejected on the way: mixing the block itself in OKLCH (CCP's first step) helped the wall but on a dark phone evened out lightness and pushed four pairs of the 12 under 0.45 (Blue and Sky 0.29).
2. **Times and names in a dark shade of the person's color** *(inferred; owner-visible)*. CCP's ink recipe at 40% (color into the board's near-black, chroma times 2.2) reaches 7.6:1 or more on every one of the 12 blocks, decided or with the chroma step, so it passes the house's 7:1 rule; CCP's own 45% leaves Sky a hair under 7:1 on the wall. Titles stay near-black, as the [legibility research](../wall-display-legibility.md) advises; this would color only the small line under them, up close. Picture: panel C.
3. **Fewer hand-picked values per look** *(inferred; technical)*. CCP mixes its weekend shade (4% of the text color), grid rules (the divider at half strength) and toolbar fill (8% of the text color) from theme colors. The house's lines (`#CDD2CC`, `#D5D9D3`), weekend shading in Month and the rail's grays could be mixed from the look's ink and background the same way, so a new look supplies less (section 3).
4. **Opaque blocks, kept.** CCP's see-through tints darken where blocks overlap, so it draws a backdrop under every raised block to hide the one beneath (`src/rendering/styles.ts:5054` onward). The house's blocks are mixed into a known background and never have this problem; keep them so.
5. **Dark from Home Assistant's flag** *(technical)*: `hass.themes.darkMode`, not `light-dark()` or `prefers-color-scheme` (section 1.3). The phones prototype switches light and dark by hand; the build needs the flag.
6. **One color for shared plans** is the same idea as the green Us, already decided. CCP's choice of gold for it would sit inside the house's needs-you amber; the house's green avoids that.
7. **A person filter drawn as small tinted blocks.** CCP's chips are a 24% tint with the color as a key and a switch. The house's person filter in Month and Upcoming ([#98](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/98#issuecomment-6559117623)) can reuse the picker's swatch style, the same pale block with its edge, so there's one way a person's color is shown *(inferred)*.

### 2.3 Ideas that don't fit

- **The theme's primary as a fallback color.** Every calendar belongs to a person ([#61](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/61#issuecomment-6536915357)), so there is never an uncolored one, and a theme accent would say "nobody's".
- **Home Assistant's per-calendar color as the source.** It is per calendar, and a person can have several (their own, a work one); reading it would split a person into several colors. The reverse, writing each person's color into their calendars, is listed for the owner below.
- **Any color unchecked, and bright pastel bars.** CCP's demo bars fail 3:1; the house's floor and note stay.
- **Titles in color.** CCP's grid titles are 6.0 to 7.5:1 on light; the house's 7:1 rule and its legibility research keep titles near-black.
- **See-through tints and wallpaper looks** on the wall: contrast can't be known through a see-through card, overlaps darken, and a wallpaper adds shapes that compete with the across-the-room structure *(inferred)*.
- **A public restyling surface** (CSS variables for card-mod): the board is the house's own card and the owner isn't a coder; lean code says no.
- **Emerald for "now".** It sits beside Us's green; if the house ever draws a now line, it stays the reserved red *(inferred)*.
- **A gray Work calendar.** The house rejected gray as "nobody's" and draws Work in the person's color at 8%.
- **Dimming finished events by opacity.** CCP's own docs warn that "full opacity is not a contrast guarantee"; lowering opacity drops text under the house's 7:1. Past days in Month are dimmed by the house's own rules.

### 2.4 Where the house board would look worse than CCP

1. **Duller, closer blocks** (2.1): the clearest gap, and owner-visible. The chroma step closes it.
2. **Less color in the words up close.** CCP's grid ties every line of text to its block's color; the house's text is near-black and gray. Legibility favors the house (12:1 against 6.0 to 7.5:1); the look favors CCP. Idea 2 is the middle path.
3. **No following arbitrary Home Assistant themes.** CCP adapts to any theme with no setup; the house board offers its own light face and Home Assistant's light or dark. This is deliberate (every look is checked), and it only shows if someone changes Home Assistant's theme.

Where it would look better: bars that clear 3:1, times at 7:1 instead of 4 to 6:1, a warning for colors that look alike, meaning colors kept apart from person colors, and no darkening where blocks overlap.

## 3. For "More color schemes"

**What a look supplies.** CCP's whole look is the eight theme variables in 1.3; everything else is mixed from them. The person-colors note's list ([section 6](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/person-colors/docs/research/person-colors.md#6-adding-a-look-later-what-each-look-must-supply-and-whats-checked-against)) asks each look for the block and page backgrounds, ink and soft ink, and its own hand-set meaning colors (needs-you band, edge and text, the just-landed ring, the red, the grays, lines, the selection ring). CCP's examples suggest that list can shrink *(inferred)*: supply the backgrounds, ink, soft ink, and the look's amber and red; mix the rest (lines, grays, the selection ring, the needs-you band's fill from its amber) and keep the note's checks as the guard, setting a value by hand only where a check fails. Two checks to add from CCP's experience: the block background is solid, never see-through; and light or dark comes from Home Assistant's flag, never the device.

**Looks CCP's examples suggest:**

| Look | From CCP | For the house *(inferred)* |
|---|---|---|
| Dark wall face for the evening | Home Assistant dark ([picture](shots/theming-light-dark.png)) | Worth offering later. The [legibility research](../wall-display-legibility.md#7-light-or-dark-background) already calls a dimmed light face or a dark face with heavier type "a fair trade" at night, and the [calm-at-rest research](../calm-at-rest.md) plans evening dimming. The mirror rule already makes it: the starting three 1.02 to 1.55 apart on `#111111`, 1.60 to 2.24 with the chroma step. Dark text reads faster by day, so evening only. |
| Follow the Home Assistant theme | the default everywhere | Possible, but only where the note's checks pass, with the board's own text on blocks (Family Hub's themes' gray text fails on blocks, per the note). Low value while Home Assistant runs its default themes. |
| See-through card over a wallpaper | most of the dark pictures ([picture](shots/theming-wallpaper-look.png)) | Not for the wall. On a phone it would need the effective background behind every block, unknowable over a photo. |
| Plain white card | Home Assistant light | No gain: whiter backgrounds pull two more of the 12 under the note line (person-colors note, section 5). |
| Brighter, pastel look | the Material palettes | Not a new look: the chroma step gives the colorfulness without changing anyone's color or failing 3:1. |

## Owner-visible choices for later (not asked here)

- How colorful the pale blocks are: as decided, or with CCP's chroma step (more color on the wall, people easier to tell apart from across the room). Picture panels A, B, E, F.
- Times and names on blocks in gray, as decided, or in a dark shade of the person's color. Panel C.
- Whether the wall gets a dark face in the evening, beyond dimming.
- Whether the board should ever follow a Home Assistant theme, or offer only its own looks.
- Whether each person's color should also be written to their calendars in Home Assistant (2026.2 or later), so Home Assistant's own Calendar page matches the board. That is a Home Assistant change, explained first if wanted.

## Calls made here (technical; the owner can veto)

- Dark phones read `hass.themes.darkMode`; nothing keys off `light-dark()` or `prefers-color-scheme`.
- Derived colors are computed in the board's JavaScript with each color's hue held, as the person-colors note plans, rather than copied from CCP's CSS. Two reasons, tested in Chromium 153: a CSS `color-mix(in oklch, ...)` toward the wall's off-white kept the color's hue, though CSS Color 4 treats a hue as "powerless" only at chroma 0.000004 or less ([§9.4](https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch)) and the wall's `#F4F5F2` has 0.0041, so by the spec the hue would drift toward green; and an ink past what the screen can show was clipped (`#8A0500`) rather than toned down (`#732F00`). Safari, which the iPhones use, may differ.
- Blocks stay opaque mixes.

## What couldn't be checked

- Safari and the wall's WebView: WebKit isn't installed here, and nothing was measured on the tablet.
- The 9 ft scale was fit on small marks on white screens; for more colorful blocks the gain is the model's prediction. The person-colors note's cheap check applies: photograph the wall from 9 ft.
- Which Home Assistant version the house runs (for 2026.2's calendar colors and the current text colors used above).
- Which theme draws CCP's wallpaper pictures; the docs don't name it.
- CCP's numbers are my reimplementation of its CSS, not its running code; they match the pixels sampled from its pictures.

## Pictures

In [shots/](shots/). The first six show Calendar Card Pro's own pictures with its made-up families, from its MIT-licensed docs ([calendar-card-pro.alexpfau.com](https://calendar-card-pro.alexpfau.com/), images served from the repository's `.github/img/`), rendered in Chromium with a caption naming the page; credit Alex Pfau and the Calendar Card Pro contributors.

- `theming-family-hub-wall.png`: the Family Hub wall tablet in grid view, light.
- `theming-light-dark.png`: the same unstyled grid on Home Assistant light and dark.
- `theming-list-tint-and-bars.png`: the Family Agenda list (12% tints, ink titles, gray work) and shared events in gold with bars only.
- `theming-wallpaper-look.png`: the see-through dark card over a wallpaper.
- `theming-dark-phone.png`: Now & Next with every bar in the theme's amber, and a week list in calendar inks.
- `theming-allday-pills.png`: all-day pills and badges, light and dark, and outline pills.
- `theming-compare-blocks.png`: drawn for this note, not CCP's: made-up events labeled by color, the house's decided blocks against the chroma step and the person-tinted times, beside CCP's Family Hub colors, each with a 25% copy for about 9 ft.

## How it was checked

CCP's docs and source read with grep and sed at `75bf292`; every example picture opened in Chromium (Playwright) from the live site, in its light and dark modes; colors computed by a throwaway Python script outside the repo (WCAG contrast, OKLab and OKLCH with chroma reduction to stay on screen, CIELAB, the person-colors note's Szafir 9 ft scale at 0.3°), checked against the note's published numbers and against pixels sampled from CCP's pictures; the key CSS expressions rendered in Chromium 153 and read back.

## Sources

- Calendar Card Pro docs: [Theming & Card-Mod](https://calendar-card-pro.alexpfau.com/features/theming), [Layout & Appearance](https://calendar-card-pro.alexpfau.com/features/layout-appearance#visual-styling-colors), [Event Content](https://calendar-card-pro.alexpfau.com/features/event-content#event-text-in-calendar-colors), [Core Settings](https://calendar-card-pro.alexpfau.com/features/core-settings#using-the-colors-from-home-assistant) and [shared events](https://calendar-card-pro.alexpfau.com/features/core-settings#labeling-coloring-shared-events), [Grid View](https://calendar-card-pro.alexpfau.com/features/grid-view), [Column View](https://calendar-card-pro.alexpfau.com/features/column-view), [Configuration](https://calendar-card-pro.alexpfau.com/reference/configuration), [Example Stories](https://calendar-card-pro.alexpfau.com/reference/examples), [Family Hub](https://calendar-card-pro.alexpfau.com/guide/family-calendar), [Family Agenda](https://calendar-card-pro.alexpfau.com/guide/one-calendar-many-purposes), [Now & Next](https://calendar-card-pro.alexpfau.com/guide/now-and-next), [Bin Day](https://calendar-card-pro.alexpfau.com/guide/bin-day), [Birthdays & Holidays](https://calendar-card-pro.alexpfau.com/guide/birthdays-and-holidays), [Today & Tomorrow](https://calendar-card-pro.alexpfau.com/guide/today-and-tomorrow). All opened 2026-11-01.
- Calendar Card Pro source at `75bf292`: `src/config/config.ts`, `src/config/view.ts`, `src/rendering/accent-text.ts`, `src/rendering/styles.ts`, `src/rendering/presentation.ts`, `src/utils/helpers.ts`, `src/utils/entity-colors.ts`, `src/utils/events.ts`; docs under `docs/`.
- Home Assistant frontend, `dev` branch, read 2026-11-01: [`src/state/themes-mixin.ts`](https://github.com/home-assistant/frontend/blob/dev/src/state/themes-mixin.ts), [`src/common/dom/apply_themes_on_element.ts`](https://github.com/home-assistant/frontend/blob/dev/src/common/dom/apply_themes_on_element.ts), [`color.globals.ts`](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/color.globals.ts), [`semantic.globals.ts`](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/semantic.globals.ts), [`core.globals.ts`](https://github.com/home-assistant/frontend/blob/dev/src/resources/theme/color/core.globals.ts).
- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/): powerless hues (§4.4.1, §9.4), color-mix.
- [WCAG 2.2, 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast).
- House decisions and research: map [#37](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/37) (Decisions so far; Not yet specified, "More color schemes"), [#57](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/57#issuecomment-6543420323), [#91](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/91#issuecomment-6551826184), [#92](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/92#issuecomment-6557606569), the [person-colors note](https://github.com/bellamy1506/HA-Family-Hub-Clover/blob/research/person-colors/docs/research/person-colors.md), the [marks](../../../prototypes/marks/README.md) and [person-colors](../../../prototypes/person-colors/README.md) prototype READMEs, [wall-display-legibility.md](../wall-display-legibility.md), [calm-at-rest.md](../calm-at-rest.md).

// Owns: the board's two looks, and the colors each person's plans are drawn in.
// Leaves alone: where those colors go on the page (the views), and Family Hub's themes.
// Tested by: tests/test_house_board_theme.js
//
// A person's color is stored as picked: one of the 12 by name, or any other
// color as "#RRGGBB". It's worked out again for each look, so a new look never
// means picking colors again (#91, #92).

// ---- The 12, in the picker's order, and each person's starting pick (#92) ----
export const COLORS = {
  Rose: "#CD677B", Rust: "#923716", Vermillion: "#D55E00", Leaf: "#548C03",
  Forest: "#286209", Green: "#007A5A", Sky: "#0091C8", Blue: "#005A8C",
  Cornflower: "#4385E4", Indigo: "#3944A9", Lilac: "#A86DD5", Plum: "#8D2875",
};
export const STARTING = { Will: "Cornflower", Jenn: "Vermillion", Us: "Green" };
const BY_NAME = new Map(Object.entries(COLORS).map(([name, hex]) => [name.toLowerCase(), hex]));

// ---- The board's two looks (#91 section 6 lists what a look supplies) ----
// light: the wall's face, and phones in Home Assistant's light theme. dark:
// phones in its dark theme, on its dark page. ink is titles; soft is times,
// names and the low; mark is the gray of icons, the clash mark and Later (the
// new dot is ink); blockText is times and names on blocks, 7:1 on every block.
const LOOKS = {
  light: {
    bg: "#F4F5F2", ink: "#16191B", soft: "#464C50", mark: "#464C50", line: "#CDD2CC",
    needs: "#FFF0C7", needsEdge: "#E69F00", needsText: "#16191B", blockText: "#3A3E41",
  },
  dark: {
    bg: "#111111", ink: "#E1E1E1", soft: "#B5B5B5", mark: "#B5B5B5", line: "#2D3337",
    needs: "#3A2E0E", needsEdge: "#E69F00", needsText: "#FFE9B0", blockText: "#B5B5B5",
  },
};
const WALL = LOOKS.light.bg;

// Which look a copy draws: the wall is always light; a phone follows Home
// Assistant's own flag, never the device's (call A15).
export const lookFor = (hass, wall) => (!wall && hass?.themes?.darkMode ? "dark" : "light");

// A look as CSS declarations for the card's :host, e.g. "--hb-bg: #F4F5F2;".
export function lookCss(look) {
  const { blockText, ...v } = LOOKS[look];
  const name = (key) => "--hb-" + key.replace(/[A-Z]/g, (ch) => "-" + ch.toLowerCase());
  return `color-scheme: ${look}; ` + Object.entries(v).map(([key, value]) => `${name(key)}: ${value};`).join(" ");
}

// ---- Color arithmetic: sRGB, WCAG contrast, OKLCH (CSS Color 4) ----
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const hex = (c) => "#" + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const lum = (c) => { const [r, g, b] = c.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

function oklch(c) {
  const [r, g, b] = c.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

// Back to sRGB. Where the screen can't show that much color at that lightness,
// chroma drops until it fits, lightness and hue kept (#91, after CSS Color 4).
function fromOklch(L, C, h) {
  const at = (c) => {
    const a = c * Math.cos(h), b = c * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  };
  const fits = (c) => at(c).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let lo = 0, hi = C;
  if (fits(C)) lo = C;
  else for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
  return at(lo).map((v) => gam(Math.min(1, Math.max(0, v))));
}

const isDark = (bg) => lum(bg) < 0.18;

// The pick's hue and chroma, lightness moved until it stands off bg by ratio:
// at least ratio, or just under it when ratio is the 7.5:1 ceiling. Judged as
// drawn (rounded to #RRGGBB), so a limit holds to the last digit.
function standOff(pick, bg, ratio, ceiling) {
  const [, C, h] = oklch(pick), dark = isDark(bg);
  const drawn = (L) => rgb(hex(fromOklch(L, C, h)));
  let near = oklch(bg)[0], far = dark ? 1 : 0;
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2;
    if (contrast(drawn(mid), bg) < ratio) near = mid;
    else far = mid;
  }
  return drawn(ceiling ? near : far);
}

// A bar stands off the wall by 3:1 to 7.5:1, so it shows yet doesn't read as
// text; a pick outside that is drawn a shade darker or lighter. Every other
// look mirrors the wall's stand-off, at least 4.5:1 on dark (#91). Returns
// sRGB already rounded to what's drawn.
function barFor(pick, bg) {
  const k = contrast(pick, rgb(WALL)), held = Math.min(7.5, Math.max(3, k));
  if (!isDark(bg)) return k === held && hex(bg) === WALL ? pick : standOff(pick, bg, held, k > 7.5);
  return standOff(pick, bg, Math.max(4.5, held), k > 7.5);
}

// One of the 12 by name, in any case; else "#RRGGBB" as picked; else a plain
// gray, the board's color for nobody's, so a typo can't break the face.
function pickHex(pick) {
  const named = BY_NAME.get(String(pick).toLowerCase());
  return named || (/^#[0-9a-f]{6}$/i.test(pick) ? pick : "#8A8A8A");
}

// color-mix(in srgb, c share, bg)
const mix = (c, bg, share) => c.map((v, i) => v * share + bg[i] * (1 - share));

// A block is the bar mixed into the background, with its chroma then put back
// at 1.5 times, lightness and hue kept.
// Rule from Calendar Card Pro (MIT), src/rendering/styles.ts:2892-2938 at 75bf292.
function tint(bar, bg, share) {
  const [L, C, h] = oklch(mix(bar, bg, share));
  return hex(fromOklch(L, C * 1.5, h));
}

// A person's colors in a look ("light" or "dark"). block is an event's;
// faint is Work's labeled block and all-day items, so routine hours fall back.
// pale (a calendar quiet over an hour) draws the bar and both blocks at half
// strength; the text stays, still 7:1 on the paler blocks.
export function personColors(pick, look, pale = false) {
  const bg = rgb(LOOKS[look].bg);
  let bar = barFor(rgb(pickHex(pick)), bg);
  if (pale) bar = rgb(hex(mix(bar, bg, 0.5)));
  return { bar: hex(bar), block: tint(bar, bg, 0.17), faint: tint(bar, bg, 0.08), text: LOOKS[look].blockText };
}

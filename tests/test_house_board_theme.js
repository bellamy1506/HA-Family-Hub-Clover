// House board: theme.js, the board's two looks and the 12 person colors.
// Expected values come from the decisions and their measurements, never from
// theme.js: the person-colors research table (#91, #92), Chromium 153 drawing
// oklch(from color-mix(...) l calc(c * 1.5) h) (theming.md, idea 1), and the
// WCAG contrast formula written out here.
const assert = require("assert");
const {
  COLORS, STARTING, personColors, lookCss, lookFor,
} = require("../custom_components/family_hub/house_board/theme.js");

// ---- Color arithmetic for the checks (WCAG 2.x, CIELAB D65, Szafir 2018) ----
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (hex) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function lab(hex) {
  const [r, g, b] = rgb(hex).map(lin);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
// How far apart two blocks look at 9 ft (marks 0.3 degrees across); the person-colors note's scale.
const SZ = [5.095 + 0.8 / 0.3, 5.089 + 2.69 / 0.3, 6.786 + 3.2 / 0.3];
const apart = (p, q) => { const A = lab(p), B = lab(q); return Math.hypot(...A.map((v, i) => (v - B[i]) / SZ[i])); };
// Hex colors equal within rounding: each channel within 1 of 255.
function near(actual, expected, what) {
  assert.match(actual, /^#[0-9A-F]{6}$/, `${what}: ${actual} is not #RRGGBB`);
  const off = rgb(actual).map((v, i) => Math.abs(v - rgb(expected)[i]) * 255);
  assert.ok(Math.max(...off) <= 1.01, `${what}: ${actual}, expected ${expected} within rounding`);
}

const WALL = "#F4F5F2";
const DARK = "#111111";

// ---- The 12 by name, and each person's starting pick (#92) ----
// Name, the pick, its bar on a dark phone (the research table, #91 section 2).
const TWELVE = [
  ["Rose", "#CD677B", "#C05C70"], ["Rust", "#923716", "#E58261"], ["Vermillion", "#D55E00", "#CC5A00"],
  ["Leaf", "#548C03", "#528A00"], ["Forest", "#286209", "#6DAA58"], ["Green", "#007A5A", "#2D9270"],
  ["Sky", "#0091C8", "#0084B7"], ["Blue", "#005A8C", "#59A1D8"], ["Cornflower", "#4385E4", "#397BD9"],
  ["Indigo", "#3944A9", "#889DFF"], ["Lilac", "#A86DD5", "#9D62C9"], ["Plum", "#8D2875", "#E57AC6"],
];
assert.deepStrictEqual(Object.entries(COLORS), TWELVE.map(([name, pick]) => [name, pick]), "the 12, in the picker's order");
assert.deepStrictEqual(STARTING, { Will: "Cornflower", Jenn: "Vermillion", Us: "Green" });

// Every name resolves in both looks: the wall keeps the pick, a dark phone mirrors it.
for (const [name, pick, darkBar] of TWELVE) {
  near(personColors(name, "light").bar, pick, `${name} on the wall`);
  near(personColors(name, "dark").bar, darkBar, `${name} on a dark phone`);
}
// A stored name is read in any case, so a hand-typed config still works.
near(personColors("cornflower", "light").bar, "#4385E4", "lower-case name");

// ---- Blocks: the 17% mix, then chroma times 1.5 (#104, decision 6) ----
// Work's labeled block and all-day items take the paler 8% tint, stepped too.
// Expected: Chromium 153 drawing oklch(from color-mix(in srgb, <bar> 17%, <bg>) l calc(c * 1.5) h).
const DRAWN = {
  light: { Will: ["#D1E3F7", "#E3EDF4"], Jenn: ["#F6D9BD", "#F5E8D9"], Us: ["#C2E3D7", "#DDEDE5"] },
  dark: { Will: ["#12233B", "#121A25"], Jenn: ["#371A01", "#23160A"], Us: ["#0C2920", "#101C18"] },
};
for (const look of ["light", "dark"]) {
  for (const [who, [block, faint]] of Object.entries(DRAWN[look])) {
    const c = personColors(STARTING[who], look);
    near(c.block, block, `${who}'s block, ${look}`);
    near(c.faint, faint, `${who}'s work block, ${look}`);
  }
}
// The starting three apart at 9 ft, as #104 measured them with the step.
const blocks = (look) => ["Will", "Jenn", "Us"].map((who) => personColors(STARTING[who], look).block);
for (const [look, [willJenn, jennUs, willUs]] of [["light", [1.78, 1.61, 1.15]], ["dark", [2.24, 2.08, 1.6]]]) {
  const [w, j, u] = blocks(look);
  assert.ok(Math.abs(apart(w, j) - willJenn) < 0.02, `Will and Jenn on ${look}: ${apart(w, j)}`);
  assert.ok(Math.abs(apart(j, u) - jennUs) < 0.02, `Jenn and Us on ${look}: ${apart(j, u)}`);
  assert.ok(Math.abs(apart(w, u) - willUs) < 0.02, `Will and Us on ${look}: ${apart(w, u)}`);
}
// ---- Contrast: text on blocks at 7:1, bars 3:1 to 7.5:1 (#91, #92) ----
// The board's own text grays on blocks: #3A3E41 on light, #B5B5B5 on dark (#92).
assert.strictEqual(personColors("Rose", "light").text, "#3A3E41");
assert.strictEqual(personColors("Rose", "dark").text, "#B5B5B5");
for (const [look, bg, floor] of [["light", WALL, 3], ["dark", DARK, 4.5]]) {
  for (const [name] of TWELVE) {
    const c = personColors(name, look);
    for (const fill of [c.block, c.faint]) {
      assert.ok(contrast(c.text, fill) >= 7, `${name}'s times and names on ${fill}, ${look}: ${contrast(c.text, fill)}`);
    }
    const k = contrast(c.bar, bg);
    assert.ok(k >= floor && k <= 7.5, `${name}'s bar on ${look}: ${k}`);
  }
}

// ---- Paler: a quiet calendar's plans (#120's call) ----
// The block's fill and bar at half strength, its text kept at 7:1. Expected:
// Chromium 153 drawing color-mix(in srgb, <bar> 50%, <bg>), then that bar's blocks as above.
const PALE = {
  light: { Will: ["#9CBDEB", "#E2ECF4", "#ECF1F2"], Jenn: ["#E4AA79", "#F5E7D7", "#F4EFE5"], Us: ["#7AB8A6", "#DBECE4", "#E8F1EB"] },
  dark: { Will: ["#254675", "#121A26", "#11151B"], Jenn: ["#6E3608", "#24160A", "#1A130E"], Us: ["#1F5240", "#101D19", "#111715"] },
};
for (const look of ["light", "dark"]) {
  for (const [who, [bar, block, faint]] of Object.entries(PALE[look])) {
    const c = personColors(STARTING[who], look, true);
    near(c.bar, bar, `${who}'s pale bar, ${look}`);
    near(c.block, block, `${who}'s pale block, ${look}`);
    near(c.faint, faint, `${who}'s pale work block, ${look}`);
  }
  for (const [name] of TWELVE) {
    const c = personColors(name, look, true);
    assert.strictEqual(c.text, personColors(name, look).text, `${name}'s pale text, ${look}`);
    for (const fill of [c.block, c.faint]) assert.ok(contrast(c.text, fill) >= 7, `${name}'s pale text on ${look}`);
  }
}

// ---- Any other color is kept as picked (#104's calls), redrawn per look (#91) ----
// Hot magenta already stands off the wall well: the wall draws it as picked.
assert.strictEqual(personColors("#FF00AA", "light").bar, "#FF00AA");
assert.strictEqual(personColors("#ff00aa", "light").bar, "#FF00AA", "a picker's lower-case hex");
// Too pale or too dark: a shade darker or lighter. Expected: #91's eight free picks.
near(personColors("#FFD400", "light").bar, "#A98B00", "yellow, a shade darker");
near(personColors("#F7B2C8", "light").bar, "#BC7B91", "pastel pink, a shade darker");
near(personColors("#141B3A", "light").bar, "#444E71", "near-black navy, a shade lighter");
for (const pick of ["#FFD400", "#F7B2C8", "#141B3A", "#FFFFFF", "#000000", "#FF00AA"]) {
  for (const [look, bg, floor] of [["light", WALL, 3], ["dark", DARK, 4.5]]) {
    const c = personColors(pick, look), k = contrast(c.bar, bg);
    assert.ok(k >= floor && k <= 7.5, `${pick}'s bar on ${look}: ${k}`);
    assert.ok(contrast(c.text, c.block) >= 7, `${pick}'s block text on ${look}`);
  }
}
// Something that is neither one of the 12 nor #RRGGBB draws in a plain gray,
// the board's color for nobody's, rather than breaking the face.
for (const junk of ["Cornflour", "", null, undefined, "#12345", "red", "constructor"]) {
  assert.strictEqual(personColors(junk, "light").bar, "#8A8A8A", `${junk} on the wall`);
}

// The step leaves no close pair among the 12, on the wall or a dark phone (#104).
for (const look of ["light", "dark"]) {
  const all = TWELVE.map(([name]) => [name, personColors(name, look).block]);
  for (const [i, [p, a]] of all.entries()) {
    for (const [q, b] of all.slice(i + 1)) assert.ok(apart(a, b) >= 0.45, `${p} and ${q} on ${look}: ${apart(a, b)}`);
  }
}

// ---- The two looks as CSS custom properties ----
const vars = (look) => Object.fromEntries(lookCss(look).split(";").filter((d) => d.trim()).map((d) => d.split(":").map((s) => s.trim())));
const light = vars("light"), dark = vars("dark");
// The wall's light face (resting face and marks READMEs, #91's table of meanings).
assert.deepStrictEqual(
  [light["--hb-bg"], light["--hb-ink"], light["--hb-soft"], light["--hb-mark"], light["--hb-needs"], light["--hb-needs-edge"]],
  ["#F4F5F2", "#16191B", "#464C50", "#464C50", "#FFF0C7", "#E69F00"]);
// A dark phone sits on Home Assistant's dark page, with the needs-you band's dark colors (#91).
assert.deepStrictEqual([dark["--hb-bg"], dark["--hb-needs"], dark["--hb-needs-text"]], ["#111111", "#3A2E0E", "#FFE9B0"]);
assert.strictEqual(light["color-scheme"], "light");
assert.strictEqual(dark["color-scheme"], "dark");
for (const [look, v] of [["light", light], ["dark", dark]]) {
  assert.deepStrictEqual(Object.keys(v).sort(), Object.keys(light).sort(), `${look} sets every property`);
  // Every text color at 7:1 or more: titles, times, Later, the needs-you words.
  for (const name of ["--hb-ink", "--hb-soft", "--hb-mark"]) {
    assert.ok(contrast(v[name], v["--hb-bg"]) >= 7, `${name} on ${look}: ${contrast(v[name], v["--hb-bg"])}`);
  }
  assert.ok(contrast(v["--hb-needs-text"], v["--hb-needs"]) >= 7, `needs-you words on ${look}`);
  // Titles on every block, pale ones included.
  for (const [name] of TWELVE) {
    for (const pale of [false, true]) {
      const c = personColors(name, look, pale);
      for (const fill of [c.block, c.faint]) assert.ok(contrast(v["--hb-ink"], fill) >= 7, `titles on ${name}, ${look}`);
    }
  }
}

// ---- Which look: the wall is always light; a phone follows Home Assistant's own flag (call A15) ----
const hass = (darkMode) => ({ themes: { darkMode } });
assert.strictEqual(lookFor(hass(true), true), "light", "the wall stays light");
assert.strictEqual(lookFor(hass(true), false), "dark");
assert.strictEqual(lookFor(hass(false), false), "light");
assert.strictEqual(lookFor({}, false), "light", "no themes yet");

console.log("house board theme: all checks passed");

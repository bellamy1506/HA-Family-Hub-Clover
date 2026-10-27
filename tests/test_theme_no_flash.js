// House fork test: the board opens straight into its theme, with no flash of
// the card's plain default look first (2026-10-26).
// Run: node tests/test_theme_no_flash.js   (no dependencies)
//
// Settings loaded before the theme list, so _resolveTheme couldn't find the
// copy's theme and fell back to the cream default until _fetchGlobalThemes
// arrived. Now the themes in use are remembered from the last list and used
// until it loads, so the normal path runs (holiday backgrounds included).
// Checks card/family-week-calendar-card.js, the copy Home Assistant serves,
// by running the real method bodies. The browser test covers it end to end.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);

function methodBody(name, params = "") {
  let start = src.indexOf(`\n${name}(${params}) {\n`);
  if (start < 0) start = src.indexOf(`\nasync ${name}(${params}) {\n`);
  assert.ok(start >= 0, `${name} not found`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) return src.slice(open + 1, i);
  }
  throw new Error(`${name} has no end`);
}

let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
const DARK = { id: "liquidglassdark", colors: { bg: "#0b1020" }, fonts: {}, cardOpacity: 55, glassBlur: 18 };
const LIGHT = { id: "liquidglass", colors: { bg: "#eef3f8" }, fonts: {} };
const defaults = { colors: { bg: "#fbf7e5" }, fonts: {} };
const proto = {
  _defaultTheme: () => defaults,
  _getSettings: () => ({ useGlobalTheme: true, globalThemeId: "liquidglass" }),
};
proto._rememberGlobalThemes = new Function(methodBody("_rememberGlobalThemes"));
proto._rememberedGlobalTheme = new Function("id", methodBody("_rememberedGlobalTheme", "id"));
proto._resolveTheme = new Function("settings", methodBody("_resolveTheme", "settings"));
const card = (over) => Object.assign(Object.create(proto), over);
const settings = { useGlobalTheme: true, globalThemeId: "liquidglass", theme: null };

// Remembering: the copy's own theme and the household's, nothing else.
store = {};
card({ _getDeviceThemeOverride: () => "liquidglassdark", _globalThemes: [DARK, LIGHT, { id: "other" }] })._rememberGlobalThemes();
assert.deepStrictEqual(Object.keys(store).sort(), ["familyHubGlobalThemeLocal:liquidglass", "familyHubGlobalThemeLocal:liquidglassdark"]);
store = {};
card({ _getDeviceThemeOverride: () => "__default__", _globalThemes: [DARK, LIGHT] })._rememberGlobalThemes();
assert.deepStrictEqual(Object.keys(store), ["familyHubGlobalThemeLocal:liquidglass"], "__default__ isn't a theme id");

// Resolving before the list loads: the remembered theme, not the default.
store = { "familyHubGlobalThemeLocal:liquidglassdark": JSON.stringify(DARK) };
const early = card({ _getDeviceThemeOverride: () => "liquidglassdark", _globalThemes: undefined })._resolveTheme(settings);
assert.strictEqual(early.colors.bg, "#0b1020", "remembered theme used before the list loads");
assert.strictEqual(early.cardOpacity, 55);
// Nothing remembered yet (first open ever): the default, as before.
store = {};
assert.strictEqual(card({ _getDeviceThemeOverride: () => "liquidglassdark", _globalThemes: undefined })._resolveTheme(settings).colors.bg, "#fbf7e5");
// List loaded without the theme (deleted) or failed (empty): the default, as before.
store = { "familyHubGlobalThemeLocal:liquidglassdark": JSON.stringify(DARK) };
assert.strictEqual(card({ _getDeviceThemeOverride: () => "liquidglassdark", _globalThemes: [] })._resolveTheme(settings).colors.bg, "#fbf7e5");
// A remembered entry under the wrong id is ignored.
store = { "familyHubGlobalThemeLocal:liquidglassdark": JSON.stringify(LIGHT) };
assert.strictEqual(card({ _getDeviceThemeOverride: () => "liquidglassdark", _globalThemes: undefined })._resolveTheme(settings).colors.bg, "#fbf7e5");

// Wiring: remembered after each successful list; no early return left in
// _applySizeVars (it skipped holiday backgrounds).
assert.ok(methodBody("_fetchGlobalThemes").includes("this._globalThemesError = false;\nthis._rememberGlobalThemes();"));
assert.ok(!src.includes("_themeListPending"), "old early-return guard removed");

console.log("theme no flash: all checks passed");

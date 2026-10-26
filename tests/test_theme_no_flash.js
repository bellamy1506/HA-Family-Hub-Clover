// House fork test: the board opens straight into its theme, with no flash of
// the card's plain default look first (2026-10-26).
// Run: node tests/test_theme_no_flash.js   (no dependencies)
//
// On open, _fetchSettings re-applied the theme before the theme list had
// loaded, so _resolveTheme fell back to the plain cream look until
// _fetchGlobalThemes arrived. Checks card/family-week-calendar-card.js, the
// copy Home Assistant serves, by running the real method bodies.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);

function methodBody(name, params = "") {
  const start = src.indexOf(`\n${name}(${params}) {\n`);
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

// _themeListPending: true only while a wanted global theme can't resolve yet.
const pending = new Function("settings", methodBody("_themeListPending", "settings"));
const card = (override, globalThemes, error) => ({
  _getDeviceThemeOverride: () => override,
  _globalThemes: globalThemes,
  _globalThemesError: error,
});
const household = { useGlobalTheme: true, globalThemeId: "liquidglass" };
const plain = { useGlobalTheme: false, globalThemeId: "" };
assert.strictEqual(pending.call(card("liquidglassdark", undefined, false), plain), true, "override, list not loaded");
assert.strictEqual(pending.call(card("", undefined, false), household), true, "household theme, list not loaded");
assert.strictEqual(pending.call(card("liquidglassdark", [], false), plain), false, "list loaded");
assert.strictEqual(pending.call(card("liquidglassdark", undefined, true), plain), false, "list failed: fall back as before");
assert.strictEqual(pending.call(card("__default__", undefined, false), household), false, "own look needs no list");
assert.strictEqual(pending.call(card("", undefined, false), plain), false, "no global theme wanted");

// _applySizeVars while pending: the cached look stays, nothing resolves to
// the default, and the cache isn't overwritten.
const set = {};
let cacheWrites = 0;
let resolved = 0;
let scrollLock = 0;
const applying = {
  _getSettings: () => household,
  _sizeVars: () => ({ minHeight: "42px", padding: "6px 20px" }),
  style: { setProperty: (k, v) => { set[k] = v; }, removeProperty: () => {} },
  _themeListPending: () => true,
  _applyCachedThemeVarsIfAny: () => { set["--fc-bg"] = "#0b1020"; return true; },
  _resolveTheme: () => { resolved++; return { colors: { bg: "#fbf7e5" } }; },
  _applyScrollLock: () => { scrollLock++; },
};
const realCache = global.window;
global.window = { __familyHubThemeCache: { set: () => { cacheWrites++; } } };
new Function(methodBody("_applySizeVars")).call(applying);
global.window = realCache;
assert.strictEqual(set["--fc-bg"], "#0b1020", "cached background kept");
assert.strictEqual(resolved, 0, "theme not resolved to the default");
assert.strictEqual(cacheWrites, 0, "cache not overwritten");
assert.strictEqual(scrollLock, 1, "scroll lock still applied");

console.log("theme no flash: all checks passed");

// House fork test for the "Title only" calendar top bar style.
// Run: node tests/test_title_only_top_bar.js   (no dependencies)
//
// Checks card/family-week-calendar-card.js: the copy Home Assistant serves
// (see card_path in __init__.py). The top-level copy of the same name is unused.
// The card is one large browser file, so this checks the pieces that make the
// style work: the getter's logic (run for real against a stub `this`), and the
// settings button, the host attribute, the save path, and the CSS that hides
// everything except the month/week label.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);

function methodBody(name) {
  const start = src.indexOf(`\n${name}() {\n`);
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

// Getter: on only when this device stored "on", and never under the shared static layout.
const getter = new Function(methodBody("_getTopBarTitleOnly"));
const stub = (stored, staticLayout) => ({
  _getStaticLayoutAcrossDevices: () => staticLayout,
  _getScopedSettingItem: (key) => {
    assert.strictEqual(key, "familyCalendarTopBarTitleOnlyLocal");
    return stored;
  },
});
assert.strictEqual(getter.call(stub("on", false)), true);
assert.strictEqual(getter.call(stub("off", false)), false);
assert.strictEqual(getter.call(stub(null, false)), false);
assert.strictEqual(getter.call(stub("on", true)), false);

// Settings button, active-state read, save, and host attribute.
assert.ok(src.includes('data-value="title_only">Title only</button>'), "settings button");
assert.ok(src.includes('this._getTopBarTitleOnly() ? "title_only"'), "active state");
assert.ok(src.includes('this._setScopedSettingItem("familyCalendarTopBarTitleOnlyLocal", topBarTitleOnly ? "on" : "off")'), "save");
assert.ok(src.includes('if (this._getTopBarTitleOnly()) this.setAttribute("top-bar-title-only", "");'), "host attribute");

// CSS: hides the side buttons, arrows, and jump-to-week toggle; the label is not hidden.
const hideRule = src.match(/:host\(\[top-bar-title-only\]\)[^{]*\{ display: none; \}/);
assert.ok(hideRule, "hide rule");
for (const sel of [".week-nav-side", ".nav-arrow", ".week-shortcuts-toggle", ".week-shortcuts"]) {
  assert.ok(hideRule[0].includes(sel), `hides ${sel}`);
}
assert.ok(!/top-bar-title-only\]\) \.week-label/.test(src), "label stays visible");
assert.ok(src.includes(":host([top-bar-title-only]) .add-fab-settings"), "Settings reachable from + menu");

console.log("title-only top bar: all checks passed");

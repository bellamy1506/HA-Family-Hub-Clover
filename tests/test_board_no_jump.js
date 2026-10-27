// House fork test: the board opens at its settled size and title, with no
// jump when the calendars answer (2026-10-26).
// Run: node tests/test_board_no_jump.js   (no dependencies)
//
// On open the grid drew before any events, then grew when they arrived, and
// the title said "This Week" over the Month view until then. Checks
// card/family-week-calendar-card.js, the copy Home Assistant serves, by
// running the real method bodies. The browser test covers it end to end.
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
const proto = {
  _getPeople: () => [{ entity: "calendar.work" }, { entity: "calendar.home" }],
  _instanceScopedStorageKey: (k) => `${k}__inst_i1`,
  _privacyModeEffectiveLocked: () => false,
};
proto._shapeCalendars = new Function(methodBody("_shapeCalendars"));
proto._gridHeightKey = new Function(methodBody("_gridHeightKey"));
proto._holdGridSize = new Function(methodBody("_holdGridSize"));
const el = (inner) => ({ style: { minHeight: "" }, querySelector: (sel) => (sel === ".month-cells" ? inner || null : null) });
const card = (grid, viewMode, eventsFor, over = {}) => Object.assign(Object.create(proto), {
  _root: { querySelector: (sel) => (sel === ".grid" ? grid : null) }, _viewMode: viewMode, _eventsViewMode: eventsFor,
}, over);

// The key includes the calendar set: the full board and its "Hide work
// calendars" copy share one URL path, so they'd otherwise share a height.
const KEY = "familyHubGridHeightLocal:split:calendar.home,calendar.work__inst_i1";
assert.strictEqual(card(el(), "split")._gridHeightKey(), KEY);
assert.notStrictEqual(card(el(), "split", undefined, { _getPeople: () => [{ entity: "calendar.home" }] })._gridHeightKey(), KEY);

// Before this view's events arrive: held at last time's height.
store = { [KEY]: "568" };
let g = el();
card(g, "split", undefined)._holdGridSize();
assert.strictEqual(g.style.minHeight, "568px", "held at the remembered height");
// Month views hold the cells, so their six rows share the height.
const cells = el();
g = el(cells);
card(g, "split", undefined)._holdGridSize();
assert.strictEqual(cells.style.minHeight, "568px", "month cells held");
assert.strictEqual(g.style.minHeight, "");
// Nothing remembered: no hold. Events in, or privacy mode on: released.
store = {};
g = el(); card(g, "split", undefined)._holdGridSize();
assert.strictEqual(g.style.minHeight, "");
store = { [KEY]: "568" };
g = el(); g.style.minHeight = "568px"; card(g, "split", "split")._holdGridSize();
assert.strictEqual(g.style.minHeight, "", "released once events are in");
g = el(); card(g, "split", undefined, { _privacyModeEffectiveLocked: () => true })._holdGridSize();
assert.strictEqual(g.style.minHeight, "", "no hold while privacy mode is on");
// Holding never writes.
store = { [KEY]: "568" };
card(el(), "split", undefined)._holdGridSize();
card(el(), "split", "split")._holdGridSize();
assert.deepStrictEqual(store, { [KEY]: "568" }, "_holdGridSize only reads");

// Wiring: the height is remembered only after a successful fetch, every grid
// render holds, and the title is set as soon as the view is known.
assert.ok(/this\._holdGridSize\(\);\s*$/.test(methodBody("_renderGrid")), "_renderGrid ends with _holdGridSize");
assert.ok(src.includes("Object.assign(this._events, newEvents);\nthis._eventsViewMode = this._viewMode;"), "_fetchEvents records which view its events are for");
assert.ok(methodBody("_fetchEvents").includes("if (!Object.keys(newErrors).length) this._recordSettledLayout();"), "remembered only after a fetch with no errors");
assert.ok(methodBody("_recordSettledLayout").includes("localStorage.setItem(this._gridHeightKey(), String(height));"));
assert.ok(
  /this\._viewMode = s\.defaultView === "month" \? this\._getMonthViewVariant\(\) : this\._getWeekViewVariant\(\);\n\/\/[^\n]*\n(\/\/[^\n]*\n)*this\._updateNavLabel\(\);/.test(src),
  "title set right after the view is chosen on open",
);

console.log("board no jump: all checks passed");

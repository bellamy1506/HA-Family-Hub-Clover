// House fork test: the board opens at its settled size and title, with no
// jump when the calendars answer (2026-10-26).
// Run: node tests/test_board_no_jump.js   (no dependencies)
//
// On open the grid drew before any events, then grew when they arrived
// (month cells fill with pills), and the title said "This Week" over the
// Month view until then. Checks card/family-week-calendar-card.js, the copy
// Home Assistant serves, by running the real method bodies.
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

let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
const hold = new Function(methodBody("_holdGridSize"));
const gridEl = (height, inner) => ({ style: { minHeight: "" }, getBoundingClientRect: () => ({ height }), querySelector: (sel) => (sel === ".month-cells" ? inner || null : null) });
const card = (grid, viewMode, eventsFor) => ({
  _root: { querySelector: (sel) => (sel === ".grid" ? grid : null) },
  _viewMode: viewMode,
  _eventsViewMode: eventsFor,
  _instanceScopedStorageKey: (k) => `${k}__inst_i1`,
});
const KEY = "familyHubGridHeightLocal:split__inst_i1";

// Before this view's events arrive: held at last time's height.
store = { [KEY]: "568" };
let g = gridEl(304);
hold.call(card(g, "split", undefined));
assert.strictEqual(g.style.minHeight, "568px", "held at the remembered height");
assert.strictEqual(store[KEY], "568", "pre-events height not remembered");

// Nothing remembered yet (first open): no hold, as before.
store = {};
g = gridEl(304);
hold.call(card(g, "split", undefined));
assert.strictEqual(g.style.minHeight, "", "no hold without a remembered height");
assert.ok(!(KEY in store));

// After this view's events arrive: hold released, settled height remembered.
store = { [KEY]: "568" };
g = gridEl(600);
g.style.minHeight = "568px";
hold.call(card(g, "split", "split"));
assert.strictEqual(g.style.minHeight, "", "hold released");
assert.strictEqual(store[KEY], "600", "settled height remembered");

// Switching to another view before its events arrive doesn't overwrite
// that view's remembered height with an empty one.
store = { "familyHubGridHeightLocal:planner__inst_i1": "700" };
g = gridEl(200);
hold.call(card(g, "planner", "split"));
assert.strictEqual(g.style.minHeight, "700px");
assert.strictEqual(store["familyHubGridHeightLocal:planner__inst_i1"], "700");

// Month views hold the cells themselves: their six rows share the held
// height, so the day panel below doesn't move when pills arrive.
store = { "familyHubGridHeightLocal:split__inst_i1": "420" };
const cells = gridEl(200);
g = gridEl(500, cells);
hold.call(card(g, "split", undefined));
assert.strictEqual(cells.style.minHeight, "420px", "cells held");
assert.strictEqual(g.style.minHeight, "", "grid itself not held");
cells.style.minHeight = "420px";
const cellsLoaded = gridEl(430);
cellsLoaded.style.minHeight = "420px";
hold.call(card(gridEl(560, cellsLoaded), "split", "split"));
assert.strictEqual(cellsLoaded.style.minHeight, "", "cells released");
assert.strictEqual(store["familyHubGridHeightLocal:split__inst_i1"], "430", "cells height remembered");

// Wiring: every grid render ends with the hold, events record their view,
// and the title is set as soon as the view is known on open.
const renderGrid = methodBody("_renderGrid");
assert.ok(/this\._holdGridSize\(\);\s*$/.test(renderGrid), "_renderGrid ends with _holdGridSize");
assert.ok(
  src.includes("Object.assign(this._events, newEvents);\nthis._eventsViewMode = this._viewMode;"),
  "_fetchEvents records which view its events are for",
);
assert.ok(
  /this\._viewMode = s\.defaultView === "month" \? this\._getMonthViewVariant\(\) : this\._getWeekViewVariant\(\);\n\/\/[^\n]*\n(\/\/[^\n]*\n)*this\._updateNavLabel\(\);/.test(src),
  "title set right after the view is chosen on open",
);

console.log("board no jump: all checks passed");

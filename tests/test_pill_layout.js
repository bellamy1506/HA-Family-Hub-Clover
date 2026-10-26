// House fork test: placeholder pills (owner, 2026-10-26). Before the
// calendars answer, month cells and the split view's day panel show last
// time's pills in their colors and places with blank text; only the text
// waits. Only shapes and colors are stored, never titles or times.
// Run: node tests/test_pill_layout.js   (no dependencies)
//
// Checks card/family-week-calendar-card.js, the copy Home Assistant serves,
// by running the real method bodies.
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
const method = (name, params = "") => new Function(...params.split(",").map((p) => p.trim()).filter(Boolean), methodBody(name, params));

let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};

const proto = {
  _getPeople: () => [{ entity: "calendar.work" }, { entity: "calendar.home" }],
  _instanceScopedStorageKey: (k) => `${k}__inst_i1`,
  _dateKey: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  _privacyModeEffectiveLocked: () => false,
  _viewMode: "split",
  _eventsViewMode: "split",
};
for (const [name, params] of [
  ["_pillLayoutKey", ""], ["_readPillLayout", ""], ["_writePillLayout", "cells"],
  ["_pillLayoutForRender", ""], ["_placeholderPillsHtml", "entry, allPast"], ["_placeholderDetailHtml", "styles"],
]) proto[name] = method(name, params);
const card = (over = {}) => Object.assign(Object.create(proto), over);

// Key: per copy and per set of calendars, so the "Hide work calendars"
// copy of the card keeps its own layout.
const key = card()._pillLayoutKey();
assert.strictEqual(key, "familyHubPillLayoutLocal:calendar.home,calendar.work__inst_i1");
assert.notStrictEqual(card({ _getPeople: () => [{ entity: "calendar.home" }] })._pillLayoutKey(), key);

// When to record and when to show.
assert.deepStrictEqual(
  (({ record, show }) => ({ record, show }))(card()._pillLayoutForRender()),
  { record: true, show: false }, "events in: record");
store = { [key]: JSON.stringify({ "2026-10-23": { p: [["background:#7ec9d9", ""]], m: 0 } }) };
const before = card({ _eventsViewMode: undefined })._pillLayoutForRender();
assert.strictEqual(before.show, true, "before events: show");
assert.strictEqual(before.record, false);
assert.ok(before.cells["2026-10-23"], "remembered cells read");
const locked = card({ _eventsViewMode: undefined, _privacyModeEffectiveLocked: () => true })._pillLayoutForRender();
assert.deepStrictEqual([locked.record, locked.show], [false, false], "privacy mode: neither");
const filtered = card({ _legendFilterKeys: ["will"] })._pillLayoutForRender();
assert.strictEqual(filtered.record, false, "legend filter: don't record a partial layout");
assert.strictEqual(card({ _eventTypeFilter: ["event"] })._pillLayoutForRender().record, false);

const unchosen = card({ _viewMode: undefined, _eventsViewMode: undefined })._pillLayoutForRender();
assert.strictEqual(unchosen.record, false, "nothing recorded before the view is known");

// Placeholders: same classes and colors, blank text, "+N more" kept.
const html = card()._placeholderPillsHtml({ p: [["background:#7ec9d9;color:#111", "r<"], ["background:#b07ed9", ">p"]], m: 2 }, false);
assert.ok(html.includes('class="mc-pill fh-pill-placeholder mc-reminder-pill mc-continue-prev" style="background:#7ec9d9;color:#111">&nbsp;</div>'), html);
assert.ok(html.includes('class="mc-pill fh-pill-placeholder mc-continue-next past" style="background:#b07ed9">&nbsp;</div>'), html);
assert.ok(html.endsWith('<div class="mc-more">+2 more</div>'));
assert.ok(card()._placeholderPillsHtml({ p: [["background:#fff", ""]], m: 0 }, true).includes(" past\""), "a past day greys");
assert.strictEqual(card()._placeholderPillsHtml({ p: [['background:#fff" onclick="x', ""], ["<b>", ""]], m: 0 }, false), "", "unsafe styles dropped");
const detail = card()._placeholderDetailHtml(["background:#7ec9d9", 'x"y']);
assert.strictEqual((detail.match(/class="msd-item event fh-pill-placeholder"/g) || []).length, 1, "one safe detail row");
assert.ok(!detail.includes('data-event-id'), "placeholder rows open nothing");

// Writing merges by day, keeps a day's panel rows, and prunes old days.
const today = new Date();
const day = (offset) => { const d = new Date(today); d.setDate(d.getDate() + offset); return proto._dateKey(d); };
store = { [key]: JSON.stringify({ [day(0)]: { p: [], m: 0, d: ["background:#fff"] }, [day(-200)]: { p: [], m: 0 } }) };
card()._writePillLayout({ [day(0)]: { p: [["background:#9ed97e", ""]], m: 0 }, [day(1)]: { p: [], m: 0 } });
const saved = JSON.parse(store[key]);
assert.deepStrictEqual(saved[day(0)], { p: [["background:#9ed97e", ""]], m: 0, d: ["background:#fff"] });
assert.ok(saved[day(1)], "new day kept");
assert.ok(!saved[day(-200)], "old day pruned");
assert.ok(!JSON.stringify(saved).match(/summary|BAR|Flight/), "no text stored");

// Wiring in the two builders.
const cells = methodBody("_buildMonthCellsHtml", "selectedDateKey");
assert.ok(cells.includes("const pillLayout = this._pillLayoutForRender();"), "cells builder reads the layout");
assert.ok(cells.includes("if (pillLayout.record) pillLayout.cells[dateKey] = "), "cells builder records");
assert.ok(cells.includes("if (!dayEvents.length && pillLayout.show && pillLayout.cells[dateKey]) pillsHtml = this._placeholderPillsHtml("), "cells builder shows");
assert.ok(cells.includes("if (pillLayout.record) this._writePillLayout(pillLayout.cells);"), "cells builder writes");
const panel = methodBody("_buildMonthSplitDetailHtml", "dateKey");
assert.ok(panel.includes("this._placeholderDetailHtml("), "day panel shows placeholders");
assert.ok(panel.includes("this._writePillLayout({ [dateKey]: { d:"), "day panel records its rows");

console.log("pill layout: all checks passed");

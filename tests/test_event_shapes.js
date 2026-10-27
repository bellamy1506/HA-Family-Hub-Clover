// House fork test: event shapes (owner, 2026-10-26). In every layout, before
// the calendars answer, each day shows last time's pills, cards and rows in
// place with blank text; only the text waits.
// Run: node tests/test_event_shapes.js   (no dependencies)
//
// Covers the rules and the wiring in card/family-week-calendar-card.js, the
// copy Home Assistant serves. The DOM work (blanking, sizes, restoring, live
// meals and scroll) is covered in every layout by tests/browser/test_board_open.js.
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

global.window = { innerWidth: 402 };
const proto = {
  _getPeople: () => [{ entity: "calendar.work" }, { entity: "calendar.home" }],
  _instanceScopedStorageKey: (k) => `${k}__inst_i1`,
  _privacyModeEffectiveLocked: () => false,
  _privacyModeEffectiveApplied: false,
  _viewMode: "split",
  _eventsViewMode: undefined,
};
for (const name of ["_shapeMode", "_shapeStoreKey", "_shapeCalendars", "_shapeEventLike", "_shapeKeepText", "_shapeKeepLive"]) proto[name] = new Function(methodBody(name));
const card = (over = {}) => Object.assign(Object.create(proto), over);

// Key: per copy, view, screen width, and set of calendars.
assert.strictEqual(card()._shapeStoreKey(), "familyHubShapesLocal:split:402:calendar.home,calendar.work__inst_i1");
assert.notStrictEqual(card({ _getPeople: () => [{ entity: "calendar.home" }] })._shapeStoreKey(), card()._shapeStoreKey());
assert.notStrictEqual(card({ _viewMode: "planner" })._shapeStoreKey(), card()._shapeStoreKey());

// When to show.
assert.strictEqual(card()._shapeMode(), "show", "before events, privacy known off: show");
assert.strictEqual(card({ _eventsViewMode: "planner" })._shapeMode(), "show", "switched view, its events not in yet");
assert.strictEqual(card({ _eventsViewMode: "split" })._shapeMode(), "none", "events in");
assert.strictEqual(card({ _privacyModeEffectiveApplied: undefined })._shapeMode(), "none", "privacy state not known yet");
assert.strictEqual(card({ _privacyModeEffectiveLocked: () => true, _privacyModeEffectiveApplied: true })._shapeMode(), "none", "privacy mode on");
assert.strictEqual(card({ _viewMode: undefined })._shapeMode(), "none", "view not chosen yet");

// Event elements: meal pills don't count as calendar events.
const eventLike = card()._shapeEventLike();
for (const sel of [".event", ".tl-event", ".all-day-chip", ".agenda-item:not(.mc-meal-pill)", ".mc-pill:not(.mc-meal-pill)", ".msd-item:not(.mc-meal-pill)"]) assert.ok(eventLike.includes(sel), sel);

// Privacy: only plain labels keep their text; ids and other attributes go.
const keep = card()._shapeKeepText();
for (const label of [".mc-date", ".num", ".hour-label", ".planner-day-number", ".agenda-day-date", ".mc-more"]) assert.ok(keep.includes(label), label);
for (const content of [".summary", ".time", ".menu-text", ".tl-summary", ".agenda-item-summary", ".msd-item-summary", ".custody-badge"]) assert.ok(!keep.includes(content), `${content} text is blanked`);
const blank = methodBody("_blankShape", "unit");
assert.ok(blank.includes('if (a.name !== "class" && a.name !== "style" && a.name !== "data-date") el.removeAttribute(a.name);'), "only class, style, data-date kept");
assert.ok(blank.includes('node.textContent = "\\u00a0";'), "text replaced by a blank");

// Restoring keeps the live day header and meal blocks, and the scroll.
const keepLive = card()._shapeKeepLive();
for (const sel of [".day-header", ".menu-blocks", ".person-lane-header", ".agenda-day-header", ".planner-mobile-day-header"]) assert.ok(keepLive.includes(sel), sel);
const settle = methodBody("_settleShapes");
assert.ok(settle.includes("slot.replaceWith(live[i])"), "live parts put back");
assert.ok(settle.includes("n.scrollTop = top"), "scroll carried over");
assert.ok(settle.includes("if (!firstOpen && unit.querySelector(this._shapeEventLike())) return;"), "after a view switch, days with real events keep them");

// Recording: only after a successful fetch, never while privacy mode is on
// or a filter hides some events; bounded storage.
const record = methodBody("_recordSettledLayout");
assert.ok(methodBody("_fetchEvents").includes("if (!Object.keys(newErrors).length) this._recordSettledLayout();"));
assert.ok(record.includes("this._privacyModeEffectiveLocked()) return;"));
assert.ok(record.includes("(this._legendFilterKeys || []).length || (this._eventTypeFilter || []).length) return;"));
assert.ok(record.includes("near(-45)") && record.includes("near(45)"), "±45 days");
assert.ok(record.includes("if (size > 150000) break;"), "about 150 KB per layout");
assert.ok(record.includes("index.slice(4).forEach((k) => localStorage.removeItem(k));"), "at most 4 layouts per copy");

// Wiring: every grid render settles shapes, then holds the size; shapes are
// drawn once privacy mode is known; every view's day unit is tagged.
assert.ok(/this\._settleShapes\(\);\nthis\._holdGridSize\(\);\s*$/.test(methodBody("_renderGrid")), "_renderGrid ends with _settleShapes, _holdGridSize");
assert.ok(methodBody("_fetchPrivacyModeState").includes('if (this._root && this._shapeMode() === "show") this._renderGrid();'));
for (const tag of [
  'data-fh-unit="cell|${dateKey}"',
  'data-fh-unit="detail|${dateKey}"',
  'data-fh-unit="day|${dateKey}"',
  'data-fh-unit="planner|${this._dateKey(dayStart)}|${person.entity}"',
  'data-fh-unit="planner-m|${this._dateKey(dayStart)}"',
  'data-fh-unit="lane|${this._dateKey(dayStart)}|${person ? person.entity : "family"}"',
  'data-fh-unit="agenda|${this._dateKey(dayStart)}"',
]) assert.ok(src.includes(tag), `unit tagged: ${tag}`);

console.log("event shapes: all checks passed");

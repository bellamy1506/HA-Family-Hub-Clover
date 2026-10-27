// House fork test: event shapes (owner, 2026-10-26). In every layout, before
// the calendars answer, each day shows last time's pills, cards and rows in
// place with blank text; only the text waits.
// Run: node tests/test_event_shapes.js   (no dependencies)
//
// Covers the rules and the wiring in card/family-week-calendar-card.js, the
// copy Home Assistant serves. The DOM work (blanking, sizes, restoring, live
// meals and scroll) is covered in every layout by tests/browser/test_board_open.js.
const assert = require("assert");

const { src, methodBody } = require("./lib/card_source");

global.window = { innerWidth: 402 };
const proto = {
  _getPeople: () => [{ entity: "calendar.work" }, { entity: "calendar.home" }],
  _instanceScopedStorageKey: (k) => `${k}__inst_i1`,
  _privacyModeEffectiveLocked: () => false,
  _privacyModeEffectiveApplied: false,
  _viewMode: "split",
  _eventsViewMode: undefined,
  _deviceSettingsSnapshot: () => ({}),
  _isDiscreetMode: () => false,
};
for (const name of ["_shapeMode", "_shapeLayoutKey", "_shapeCalendars", "_shapeEventLike", "_shapeKeepText", "_shapeKeepLive"]) proto[name] = new Function(methodBody(name));
const card = (over = {}) => Object.assign(Object.create(proto), over);

// Key: per copy, view, screen width, set of calendars, and view settings
// (see test_board_no_jump.js for each part).
assert.ok(card()._shapeLayoutKey().startsWith("familyHubShapesLocal:split:402:calendar.home,calendar.work:"));
assert.notStrictEqual(card({ _viewMode: "planner" })._shapeLayoutKey(), card()._shapeLayoutKey());

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

// Privacy: only a few plain labels keep their text, matched on the element
// itself (not an ancestor), so names, badges and birthday marks are blanked
// too; day headers and dates come back live instead.
const keep = card()._shapeKeepText();
assert.deepStrictEqual(keep.split(", "), [".hour-label", ".mc-more", ".msd-empty", ".agenda-empty", ".planner-mobile-empty", ".planner-mobile-person-name"]);
assert.ok(card({ _isDiscreetMode: () => true })._shapeLayoutKey().endsWith(":discreet__inst_i1"), "discreet mode has its own layouts, so names saved before it never show");
assert.ok(methodBody("_blankShape", "unit").includes("const keepText = src.matches(keep);"), "kept only by the element's own class");
const blank = methodBody("_blankShape", "unit");
assert.ok(blank.includes('if (a.name !== "class" && a.name !== "style" && a.name !== "data-date") el.removeAttribute(a.name);'), "only class, style, data-date kept");
assert.ok(blank.includes('node.textContent = "\\u00a0";'), "text replaced by a blank");

// Restoring keeps the live day header and meal blocks, and the scroll.
assert.deepStrictEqual(card()._shapeKeepLive(), [".mc-date", ".day-header", ".menu-blocks", ".person-lane-header", ".agenda-day-header", ".planner-mobile-day-header"], "live parts");
const settle = methodBody("_settleShapes");
assert.ok(settle.includes("slot.replaceWith(live[i][j])"), "live parts put back, per kind");
assert.ok(settle.includes("n.scrollTop = scrolls[i]"), "timeline scroll carried over");
assert.ok(settle.includes('unit.querySelectorAll(".mc-meal-pill").forEach((m) => m.remove());') && settle.includes("list.prepend(meal);") && settle.includes("unit.classList.contains(listClass) ? unit"), "live meals put back whatever their count, including when the unit is the list (split day panel)");
assert.ok(settle.includes("this._shapesRestored = plan.length;"), "counts restored days for the size hold");
assert.ok(settle.includes("if (!firstOpen && range && date >= range[0] && date < range[1]) return;"), "after a view switch, days the fetched events cover stay as rendered");
assert.ok(src.includes("this._eventsRange = Object.keys(newErrors).length ? undefined : [this._dateKey(start), this._dateKey(end)];"), "fetch records its date range, only when nothing errored");
assert.ok(src.includes("this._events = {};\n// House fork: no events now, so none are \"in\" (see _shapeMode).\nthis._eventsViewMode = undefined;\nthis._eventsRange = undefined;"), "a config reload clears it");

// Recording: only after a successful fetch, never while privacy mode is on
// or a filter hides some events; bounded storage.
const record = methodBody("_recordSettledLayout");
assert.ok(methodBody("_fetchEvents").includes("if (!Object.keys(newErrors).length) this._recordSettledLayout();"));
assert.ok(record.includes("!this.isConnected || !grid.getClientRects().length"), "never saved while hidden or detached");
assert.ok(record.includes('const drawn = key + (this.getAttribute("style") || "") + grid.innerHTML;'), "signature is the board as drawn (meals, weather, theme)");
assert.ok(record.includes("if (signature === this._shapeLayoutSignature && index.includes(key)) return;"), "not re-saved when unchanged and still stored");
assert.ok(record.includes("JSON.stringify(stored[k]).length"), "size measured as written");
assert.ok(record.includes("this._privacyModeEffectiveLocked()) return;"));
assert.ok(record.includes("(this._legendFilterKeys || []).length || (this._eventTypeFilter || []).length) return;"));
assert.ok(record.includes("near(-45)") && record.includes("near(45)"), "±45 days");
assert.ok(record.includes("if (size > 150000) break;"), "about 150 KB per layout");
assert.ok(record.includes('const indexKey = "familyHubShapesIndexLocal";'), "one index for the whole browser");
assert.ok(record.includes("index.slice(4).forEach((k) => localStorage.removeItem(k));"), "at most 4 layouts in this browser");

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

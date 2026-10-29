// House fork test for the per-copy "Start view" (Clover Tablet loop, 2026-10-29).
// Run: node tests/test_start_view.js   (no dependencies)
//
// The household's defaultView picks which view family (Week or Month) every
// copy opens in. familyCalendarStartViewLocal lets one copy (the wall tablet)
// open in the other family without changing every phone: "household" (or
// nothing stored) keeps the household's choice; "week" or "month" override it
// for this copy only. The variant within the family stays the copy's own.
//
// Checks card/family-week-calendar-card.js, the copy Home Assistant serves.
// Runs the real method bodies against a stub `this`.
const assert = require("assert");

const { src, methodBody } = require("./lib/card_source");

const KEY = "familyCalendarStartViewLocal";

// _startViewFamily: the copy's choice, else the household's.
const family = new Function(methodBody("_startViewFamily"));
const stub = (stored, defaultView, staticLayout = false) => ({
  _getStaticLayoutAcrossDevices: () => staticLayout,
  _getSettings: () => ({ defaultView }),
  _getScopedSettingItem: (key) => {
    assert.strictEqual(key, KEY);
    return stored;
  },
});
for (const household of ["week", "month"]) {
  assert.strictEqual(family.call(stub("week", household)), "week", `week over household ${household}`);
  assert.strictEqual(family.call(stub("month", household)), "month", `month over household ${household}`);
  for (const stored of ["household", null, "", "day", "planner", "split", "WEEK"]) {
    assert.strictEqual(family.call(stub(stored, household)), household, `${JSON.stringify(stored)} follows household ${household}`);
  }
  // The shared static layout has no field for it: the household decides.
  assert.strictEqual(family.call(stub(household === "week" ? "month" : "week", household, true)), household, "static layout");
}
// Anything but "month" in the household setting is the Week family, as upstream reads it.
assert.strictEqual(family.call(stub(null, undefined)), "week");
assert.strictEqual(family.call(stub(null, "planner")), "week");
// A storage error reads as nothing stored.
assert.strictEqual(family.call({ ...stub(null, "month"), _getScopedSettingItem: () => { throw new Error("blocked"); } }), "month");

// Registry entry, matching const.py's DEVICE_SETTINGS_FIELDS by hand.
const registryBody = methodBody("_deviceSettingsFieldRegistry");
const registry = new Function("return (function(){" + registryBody + "}).call({ _t: (k, d) => d });")();
assert.deepStrictEqual(registry[KEY], { type: "enum", choices: ["household", "week", "month"], default: "household", scope: "instance", label: "Start view" });

// The startup choice and the screensaver's reset both use it; nothing else
// reads defaultView to pick the opening view.
const startLine = 'this._viewMode = this._startViewFamily() === "month" ? this._getMonthViewVariant() : this._getWeekViewVariant();';
assert.ok(methodBody("async _initFirstLoad").includes(startLine), "first open uses the copy's start view");
assert.ok(
  methodBody("_resetToDefaultView").includes('const mode = this._startViewFamily() === "month" ? this._getMonthViewVariant() : this._getWeekViewVariant();'),
  "waking from the screensaver returns to the copy's start view",
);
assert.ok(!/s\.defaultView === "month" \? this\._getMonthViewVariant\(\)/.test(src), "no startup path left on the household setting alone");

// First open, run for real: the copy's start view and its own variant.
const init = methodBody("async _initFirstLoad");
const pick = init.slice(init.indexOf("if (!this._viewMode) {"), init.indexOf("this._refreshAllData();"));
const opens = (stored, defaultView, week = "week", month = "month") => {
  const self = {
    ...stub(stored, defaultView),
    _getWeekViewVariant: () => week,
    _getMonthViewVariant: () => month,
    _updateNavLabel: () => {},
    _startViewFamily: family,
  };
  new Function(pick).call(self);
  return self._viewMode;
};
assert.strictEqual(opens("week", "month"), "week", "household Month, copy Week: opens in Week");
assert.strictEqual(opens("household", "month"), "month", "household Month, copy household: opens in Month");
assert.strictEqual(opens(null, "month", "week", "split"), "split", "nothing stored: household family, copy's variant");
assert.strictEqual(opens("month", "week", "planner", "split"), "split", "copy Month over household Week, copy's variant");
assert.strictEqual(opens("week", "month", "agenda"), "agenda", "copy Week, copy's Week variant");

console.log("start view: all checks passed");

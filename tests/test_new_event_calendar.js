// House fork test: the add form starts on the first column whose calendar
// the board can change and delete afterwards (wave 0, B1), not on the
// first column (Will, an iCloud calendar it can only add to, J008).
// Run: node tests/test_new_event_calendar.js   (no dependencies)
//
// Runs the real _newEventCalendar against stub calendar states, and checks
// its one-line hook in _openAddEvent. The browser side is the "New event"
// checks in tests/browser/test_board_open.js.
const assert = require("assert");

const { methodBody } = require("./lib/card_source");

const pick = new Function("people", methodBody("_newEventCalendar", "people"));
const people = ["calendar.wills_calendar", "calendar.home", "calendar.us", "calendar.work"].map((entity) => ({ entity }));
const card = (features) => ({
  _hass: { states: Object.fromEntries(Object.entries(features).map(([e, f]) => [e, { attributes: { supported_features: f } }])) },
});

// Home Assistant's calendar features: create 1, delete 2, update 4.
assert.strictEqual(pick.call(card({ "calendar.wills_calendar": 1, "calendar.home": 1, "calendar.us": 7, "calendar.work": 1 }), people), "calendar.us", "the house: Us");
assert.strictEqual(pick.call(card({ "calendar.wills_calendar": 3, "calendar.home": 5, "calendar.us": 7 }), people), "calendar.us", "delete or update alone isn't enough");
assert.strictEqual(pick.call(card({ "calendar.home": 6, "calendar.us": 7 }), people), "calendar.home", "the first that can change and delete");
assert.strictEqual(pick.call(card({ "calendar.wills_calendar": 1, "calendar.us": 1 }), people), "calendar.wills_calendar", "none can: the first column");
assert.strictEqual(pick.call(card({}), people), "calendar.wills_calendar", "no states yet: the first column");
assert.strictEqual(pick.call({}, people), "calendar.wills_calendar", "no Home Assistant yet: the first column");
assert.strictEqual(pick.call(card({ "calendar.us": "7" }), people), "calendar.us", "a feature number given as text");
assert.strictEqual(pick.call(card({}), []), "", "no columns: nothing");

// Wiring: after the calendar list is drawn, before "Also for" reads it.
const open = methodBody("_openAddEvent", "tab");
const hook = open.indexOf("select.value = this._newEventCalendar(this._getPeople());");
assert.ok(hook > open.indexOf("select.innerHTML = this._getPeople()"), "set after the options are drawn");
assert.ok(hook < open.indexOf("this._renderAddEventPeopleField();"), "set before \"Also for\" is drawn");

console.log("new event calendar: all checks passed");

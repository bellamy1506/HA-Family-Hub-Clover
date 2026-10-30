// House fork test: an event the board can't change or delete says where to
// change it, naming its calendar (wave 0, B1b), instead of losing its Edit
// and Delete rows without a word. Run: node tests/test_outside_board.js
//
// Runs the real _outsideBoardText against stubs, and checks the one-line
// hook in _openEventInfo. The browser side (the line shows on Will's and
// Work's events, where Edit would be, and not on Us) is the "Event sheet"
// check in tests/browser/test_board_open.js.
const assert = require("assert");

const { methodBody } = require("./lib/card_source");

const text = new Function("detail", methodBody("_outsideBoardText", "detail"));
const card = (names, discreet = false) => ({
  _hass: { states: Object.fromEntries(Object.entries(names).map(([e, n]) => [e, { attributes: { friendly_name: n } }])) },
  _isDiscreetMode: () => discreet,
});
const tail = ", outside the board. Change or delete it in the app it came from.";
const say = (c, entity, personName) => text.call(c, { calendarEntity: entity, personName });

const house = card({ "calendar.wills_calendar": "Will’s Calendar", "calendar.home": "Home", "calendar.work": "Work" });
assert.strictEqual(say(house, "calendar.wills_calendar", "Will"), `This event is in Will’s Calendar${tail}`, "a name that says calendar");
assert.strictEqual(say(house, "calendar.home", "Home"), `This event is in the Home calendar${tail}`, "a name that doesn't");
assert.strictEqual(say(card({}), "calendar.x", "Jenn"), `This event is in the Jenn calendar${tail}`, "no state: the column's name");
assert.strictEqual(say(card({ "calendar.x": "Family calendar" }), "calendar.x", "F"), `This event is in Family calendar${tail}`, "any case of calendar");
assert.strictEqual(say(card({ "calendar.home": "Home" }, true), "calendar.home", ""), `This event is in a calendar${tail}`, "discreet mode names no one");
assert.strictEqual(say(card({}), "calendar.x", ""), `This event is in a calendar${tail}`, "no name at all");
assert.ok(!/CalDAV|iCloud|integration|entity/i.test(say(house, "calendar.home", "Home")), "no jargon");

// The rule: no line while the board can change or delete it.
const explain = methodBody("async _explainUnchangeableEvent", "id, detail");
assert.ok(explain.includes("if (detail.uid && (support.supported || support.updateSupported)) return;"), "only for events it can neither change nor delete");
assert.ok(explain.includes('content.querySelector(".event-info-edit-row, .event-info-people-row")'), "placed where Edit would be");
// Wiring: one line in upstream's _openEventInfo, for calendar events only.
assert.ok(methodBody("_openEventInfo", "id").includes("if (!detail.isReminder) this._explainUnchangeableEvent(id, detail);"), "_openEventInfo asks");

console.log("outside board: all checks passed");

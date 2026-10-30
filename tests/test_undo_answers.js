// House fork test: after the board adds, deletes or clears something it
// says what happened, with an Undo where undo is possible (wave 0, B5).
// Run: node tests/test_undo_answers.js   (no dependencies)
//
// Runs the real wording helpers, _undoForDelete and _repeatInstance against stubs, and
// checks the one-line hooks in upstream code. The browser side (every
// answer appears, its Undo is tappable and puts things back, nothing asks
// first) is the "Undo" checks in tests/browser/test_board_open.js.
const assert = require("assert");

const { methodBody } = require("./lib/card_source");

const fn = (name, params) => new Function(...(params ? params.split(", ") : []), methodBody(name, params));
const card = {
  _dateKey: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  _houseDay: fn("_houseDay", "d"),
  _houseTime: fn("_houseTime", "d"),
  _houseWhen: fn("_houseWhen", "start, end, allDay"),
  _calendarFeatures: fn("_calendarFeatures", "entity"),
  _undoForDelete: fn("_undoForDelete", "detail"),
};
const at = (day, h, m = 0, month = 10) => new Date(2026, month, day, h, m);

// Words: "Tue Nov 3, 3:30 pm"; on the hour without ":00"; noon and midnight.
assert.strictEqual(card._houseWhen(at(3, 15, 30), at(3, 16, 30), false), "Tue Nov 3, 3:30 pm");
assert.strictEqual(card._houseWhen(at(31, 19, 0, 9), at(31, 20, 0, 9), false), "Sat Oct 31, 7 pm");
assert.strictEqual(card._houseTime(at(3, 12)), "12 pm");
assert.strictEqual(card._houseTime(at(3, 0, 5)), "12:05 am");
assert.strictEqual(card._houseTime(at(3, 9, 15)), "9:15 am");
// All day: one day, or a span (the end is the next midnight).
assert.strictEqual(card._houseWhen(at(31, 0, 0, 9), at(1, 0), true), "Sat Oct 31, all day");
assert.strictEqual(card._houseWhen(at(31, 0, 0, 9), at(3, 0), true), "Sat Oct 31 to Mon Nov 2");
// Timed across days.
assert.strictEqual(card._houseWhen(at(30, 20, 0, 9), at(1, 14), false), "Fri Oct 30, 8 pm to Sun Nov 1, 2 pm");

// Undo of a delete: re-created from the calendar's own copy.
const raw = { uid: "u1", summary: "Dentist", description: "Bring the card\n\n<!--reminder:10,30-->", location: "Main St", start: { dateTime: "2026-11-03T15:30:00-05:00" }, end: { dateTime: "2026-11-03T16:30:00-05:00" } };
const withCalendar = (features, events) => Object.assign(Object.create(card), {
  _hass: { states: { "calendar.us": { attributes: { supported_features: features } } }, callService: async (...args) => calls.push(args) },
  _events: { "calendar.us": events },
  _fetchEvents: () => calls.push(["fetch"]),
});
let calls = [];
const detail = { calendarEntity: "calendar.us", uid: "u1" };
let undo = withCalendar(7, [raw])._undoForDelete(detail);
assert.strictEqual(typeof undo, "function", "an editable calendar's event can come back");
(async () => {
  assert.strictEqual(await undo(), "Back on the board: Dentist");
  assert.deepStrictEqual(calls[0], ["calendar", "create_event", { summary: "Dentist", description: raw.description, location: "Main St", start_date_time: raw.start.dateTime, end_date_time: raw.end.dateTime }, { entity_id: "calendar.us" }], "with its notes, reminder mark, place and times");
  calls = [];
  undo = withCalendar(7, [{ uid: "u1", summary: "Holiday", start: { date: "2026-10-31" }, end: { date: "2026-11-01" } }])._undoForDelete(detail);
  await undo();
  assert.deepStrictEqual(calls[0][2], { summary: "Holiday", start_date: "2026-10-31", end_date: "2026-11-01" }, "an all-day event");
  // No Undo, so upstream's confirm still asks: a repeat, an add-only
  // calendar, an event not among those fetched.
  assert.strictEqual(withCalendar(7, [{ ...raw, rrule: "FREQ=WEEKLY" }])._undoForDelete(detail), null, "a repeating event");
  assert.strictEqual(withCalendar(7, [{ ...raw, recurrence_id: "20261103T153000" }])._undoForDelete(detail), null, "one of a repeat");
  assert.strictEqual(withCalendar(6, [raw])._undoForDelete(detail), null, "a calendar the board can't add to");
  assert.strictEqual(withCalendar(7, [])._undoForDelete(detail), null, "not fetched");
  assert.strictEqual(withCalendar(7, [raw])._undoForDelete({ calendarEntity: "calendar.us", uid: null }), null, "no uid");

  // Undo of an add: only where this person may delete, on a calendar that can.
  const added = methodBody("_answerEventAdded", "entity, data");
  assert.ok(added.includes("if (!this._canDeleteEvent() || !(this._calendarFeatures(entity) & 2)) {"), "Undo of an add needs delete");
  assert.ok(added.includes("!before.has(ev.uid)"), "never the twin that was already there");

  // Wiring: one line each in upstream's code.
  assert.ok(methodBody("async _saveAddEvent").includes("this._answerEventAdded(entity, data);\nthis._closeAddEvent();"), "add form, event");
  assert.ok(methodBody("async _saveAddReminder").includes("this._answerReminderAdded(entityId, title, data.due_datetime);\nthis._closeAddEvent();"), "add form, reminder");
  const del = methodBody("async _wireEventInfoDeleteButton", "id, detail");
  assert.ok(del.includes("const undo = this._undoForDelete(detail);\nconst repeat = this._repeatInstance(detail);\nconst which = repeat ? await this._askWhichRepeat(btn, !!repeat.recurrence_id) : null;\nif (repeat && !which) return;\nif (\n!undo && !repeat && !window.confirm("), "a delete that can be undone doesn't ask; a repeat asks which");
  assert.ok(del.includes("...(which === \"one\" ? { recurrence_id: repeat.recurrence_id } : {}),"), "this one: its recurrence_id");
  assert.ok(del.includes("this._answerEventDeleted(detail, undo, which);\nawait this._fetchEvents();"), "event deleted");
  // Which occurrence of a repeat: by uid and start.
  const instance = fn("_repeatInstance", "detail");
  const sameStart = fn("_sameStart", "ev, start, allDay");
  const weekly = (day) => ({ uid: "w1", summary: "Yoga", rrule: "FREQ=WEEKLY", recurrence_id: `202611${String(day).padStart(2, "0")}T180000`, start: { dateTime: `2026-11-${String(day).padStart(2, "0")}T18:00:00` } });
  const holder = (events) => ({ _events: { "calendar.us": events }, _sameStart: sameStart, _dateKey: card._dateKey });
  const at6 = (day) => ({ calendarEntity: "calendar.us", uid: "w1", start: new Date(2026, 10, day, 18), allDay: false });
  assert.strictEqual(instance.call(holder([weekly(3), weekly(10)]), at6(10)).recurrence_id, "20261110T180000", "the occurrence tapped");
  assert.deepStrictEqual(instance.call(holder([weekly(3)]), at6(17)), { uid: "w1" }, "a repeat not fetched at that time: series only");
  assert.strictEqual(instance.call(holder([{ ...raw, uid: "w1" }]), at6(3)), null, "a one-off isn't a repeat");
  assert.ok(methodBody("_renderEventInfoRemindSection", "id").includes("await this._markReminderDone(detail.todoUid, detail.calendarEntity);\n// House fork: wave 0 (B5), see _answerReminderDone.\nthis._answerReminderDone(detail);"), "reminder done");
  assert.ok(methodBody("async _saveEditor").includes("this._clearMealWithUndo(dateKey, blockIndex);"), "meal cleared");
  assert.ok(!methodBody("async _saveEditor").includes("\nthis._removeMealPlan(dateKey, blockIndex);"), "only through the house method");
  console.log("undo answers: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

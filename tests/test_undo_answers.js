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
  _quiet: (text) => text,
  _sayJoined: fn("_sayJoined", "head, parts"),
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
  assert.ok(methodBody("async _eventsBeforeAdd", "entity, data").includes("if (!this._canDeleteEvent() || !(this._calendarFeatures(entity) & 2)) return null;"), "Undo of an add needs delete");
  assert.ok(methodBody("async _answerEventAdded", "entity, data, before").includes("if (fresh.length === 1) made = fresh[0];"), "exactly the one this add made");

  // Wiring: one line each in upstream's code.
  const addEvent = methodBody("async _saveAddEvent");
  assert.ok(addEvent.indexOf("const undoBase = await this._eventsBeforeAdd(entity, data);") < addEvent.indexOf('await this._hass.callService("calendar", "create_event"'), "what's there is noted before the create");
  assert.ok(addEvent.includes("this._answerEventAdded(entity, data, undoBase);\nthis._closeAddEvent();"), "add form, event");
  const addReminder = methodBody("async _saveAddReminder");
  assert.ok(addReminder.indexOf("const remindersBefore = await this._remindersBefore(entityId, title, data.due_datetime);") < addReminder.indexOf('await this._hass.callService("todo", "add_item"'), "what's there is noted before the add");
  assert.ok(addReminder.includes("this._answerReminderAdded(entityId, title, data.due_datetime, remindersBefore);\nthis._closeAddEvent();"), "add form, reminder");
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
  assert.ok(methodBody("_renderEventInfoRemindSection", "id").includes("const markedDone = await this._markReminderDone(detail.todoUid, detail.calendarEntity);\n// House fork: wave 0 (B5), see _answerReminderDone.\nthis._answerReminderDone(detail, markedDone);"), "reminder done, only when it worked");

  // Undo of an add: exactly the one this add made, else no Undo.
  const answerAdded = new (Object.getPrototypeOf(async () => {}).constructor)("entity, data, before", methodBody("async _answerEventAdded", "entity, data, before"));
  const addData = { summary: "Dentist", start_date_time: "2026-11-03 15:30:00", end_date_time: "2026-11-03 16:30:00" };
  const twinsNow = (uids) => async () => uids.map((uid) => ({ uid }));
  for (const [what, now, offered] of [["one new", ["old", "new"], true], ["none new", ["old"], false], ["two new: can't tell", ["old", "n1", "n2"], false]]) {
    const toasts = [];
    const c = Object.assign(Object.create(card), {
      _addedTimes: fn("_addedTimes", "data"), _columnName: () => "Us", _eventsLike: twinsNow(now),
      _showUndoToast: (text, undo) => toasts.push({ text, undo }),
    });
    await answerAdded.call(c, "calendar.us", addData, new Set(["old"]));
    assert.strictEqual(toasts[0].text, "On the board: Dentist, Tue Nov 3, 3:30 pm, on Us");
    assert.strictEqual(typeof toasts[0].undo === "function", offered, `Undo offered: ${what}`);
  }
  const noBase = [];
  await answerAdded.call(Object.assign(Object.create(card), { _addedTimes: fn("_addedTimes", "data"), _columnName: () => "Us", _showUndoToast: (t, u) => noBase.push(u) }), "calendar.us", addData, null);
  assert.strictEqual(noBase[0], undefined, "nothing noted before the create: no Undo");

  // One answer for what a calendar can do: the sheet's cached answer first.
  const features = fn("_calendarFeatures", "entity");
  const states = { "calendar.us": { attributes: { supported_features: 7 } } };
  assert.strictEqual(features.call({ _hass: { states } }, "calendar.us"), 7, "no answer yet: the state");
  assert.strictEqual(features.call({ _hass: { states }, _calendarDeleteSupport: { "calendar.us": { supported: false, updateSupported: false, createSupported: true } } }, "calendar.us"), 1, "the sheet's answer wins");
  const AsyncFn = Object.getPrototypeOf(async () => {}).constructor;
  const ask = new AsyncFn("entityId", methodBody("async _getCalendarDeleteSupport", "entityId"));
  for (const [unavailable, cached] of [[true, false], [false, true]]) {
    const c = { _hass: { connection: { sendMessagePromise: async () => ({ supported: true, update_supported: true, create_supported: true, unavailable }) } } };
    const r = await ask.call(c, "calendar.us");
    assert.strictEqual(!!(c._calendarDeleteSupport && c._calendarDeleteSupport["calendar.us"]), cached, `${unavailable ? "a calendar still starting isn't" : "a known answer is"} kept`);
    assert.strictEqual(r.createSupported, true, "create is part of the answer");
  }

  // Discreet and privacy mode: titles go, and so do empty parts.
  const quiet = fn("_quiet", "text");
  assert.strictEqual(quiet.call({ _isDiscreetMode: () => true, _privacyModeEffectiveLocked: () => false }, "Dentist"), "");
  assert.strictEqual(quiet.call({ _isDiscreetMode: () => false, _privacyModeEffectiveLocked: () => true }, "Dentist"), "");
  assert.strictEqual(quiet.call({ _isDiscreetMode: () => false, _privacyModeEffectiveLocked: () => false }, "Dentist"), "Dentist");
  assert.strictEqual(card._sayJoined("Deleted", ["", "Thu Oct 29, 6 pm", "from Person 3"]), "Deleted: Thu Oct 29, 6 pm, from Person 3");
  assert.strictEqual(card._sayJoined("Back on the board", [""]), "Back on the board");
  assert.ok(methodBody("async _saveEditor").includes("this._clearMealWithUndo(dateKey, blockIndex);"), "meal cleared");
  assert.ok(!methodBody("async _saveEditor").includes("\nthis._removeMealPlan(dateKey, blockIndex);"), "only through the house method");
  console.log("undo answers: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

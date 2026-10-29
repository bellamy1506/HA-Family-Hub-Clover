// House fork test: Agenda dims events that have ended, as Week view already
// does when "Grey out past events" (greyOutPastEvents) is on (Clover Tablet
// loop, 2026-10-29). Run: node tests/test_agenda_past.js   (no dependencies)
//
// Runs the real _agendaPastClass against a stub `this` with the clock at
// 3 pm, and checks _renderAgendaGrid's item template calls it. The browser
// side (the class reaches the rows and dims them) is the "Agenda: past"
// check in tests/browser/test_board_open.js.
const assert = require("assert");

const { src, methodBody } = require("./lib/card_source");

const pastClass = new Function("eventId", "dayEnd", methodBody("_agendaPastClass", "eventId, dayEnd"));
const at = (h, day = 27) => new Date(2026, 9, day, h, 0, 0);
const NOW = at(15).getTime();
const realNow = Date.now;
Date.now = () => NOW;
try {
  const details = {
    morning: { start: at(9), end: at(10), allDay: false, isReminder: false },
    evening: { start: at(19), end: at(20), allDay: false, isReminder: false },
    endsNow: { start: at(14), end: at(15), allDay: false, isReminder: false },
    running: { start: at(14), end: at(16), allDay: false, isReminder: false },
    allDayToday: { start: at(0), end: at(0, 28), allDay: true, isReminder: false },
    reminderDue: { start: at(14), end: new Date(at(14).getTime() + 60000), allDay: false, isReminder: true },
    reminderLater: { start: at(18), end: new Date(at(18).getTime() + 60000), allDay: false, isReminder: true },
    // A trip from yesterday to tomorrow, listed under yesterday: that day is over.
    tripYesterday: { start: at(0, 26), end: at(0, 29), allDay: true, isReminder: false },
    tripToday: { start: at(0, 26), end: at(0, 29), allDay: true, isReminder: false },
  };
  const stub = (grey) => ({ _getSettings: () => ({ greyOutPastEvents: grey }), _eventDetails: details });
  const todayEnd = at(0, 28);
  const on = stub(true);
  assert.strictEqual(pastClass.call(on, "morning", todayEnd), " past", "a 9 am event has ended at 3 pm");
  assert.strictEqual(pastClass.call(on, "evening", todayEnd), "", "a 7 pm event hasn't");
  assert.strictEqual(pastClass.call(on, "endsNow", todayEnd), " past", "one ending at 3 pm has ended");
  assert.strictEqual(pastClass.call(on, "running", todayEnd), "", "one still running isn't dimmed");
  assert.strictEqual(pastClass.call(on, "allDayToday", todayEnd), "", "today's all-day event stays until the day is over");
  assert.strictEqual(pastClass.call(on, "reminderDue", todayEnd), " past", "a reminder whose time has passed");
  assert.strictEqual(pastClass.call(on, "reminderLater", todayEnd), "", "a reminder still to come");
  assert.strictEqual(pastClass.call(on, "tripYesterday", at(0, 27)), " past", "an earlier day is dimmed whole, as in Week");
  assert.strictEqual(pastClass.call(on, "tripToday", todayEnd), "", "the same trip under today isn't");
  assert.strictEqual(pastClass.call(on, "unknown", todayEnd), "", "no details, no class");
  const off = stub(false);
  for (const id of Object.keys(details)) assert.strictEqual(pastClass.call(off, id, todayEnd), "", `setting off: ${id} not dimmed`);
} finally {
  Date.now = realNow;
}

// Wiring: one attribute in upstream's Agenda item template.
const agenda = methodBody("_renderAgendaGrid");
assert.ok(agenda.includes('`<div class="agenda-item event${this._agendaPastClass(it.id, dayEnd)}" data-event-id="${it.id}"'), "Agenda item template adds the class");
// .event.past dims it (opacity 0.45), as Week's events.
assert.ok(/\n\.event\.past[^{]*\{ opacity: 0\.45; \}/.test(src), ".event.past dims");
// The house fades Agenda's finished events less (owner, 2026-10-29).
assert.ok(/\n\.agenda-item\.event\.past \{ opacity: 0\.6; \}/.test(src), "Agenda fades to 0.6");

console.log("agenda past events: all checks passed");

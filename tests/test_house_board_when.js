// House board test: when.js, days and times.
// Run: node tests/test_house_board_when.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// New York is home and behind UTC, where a date read as UTC lands a day
// early; Sydney is ahead of UTC and changes clocks in the other half of the
// year; UTC is where CI runs and where day math that assumes 24-hour days
// always passes. Expected wall times come from Intl (tests/lib/wall_clock.js),
// and expected days from arithmetic on the day keys themselves. The house's
// two nights: the clocks fell back on 2026-11-01 and spring forward on
// 2027-03-14. Cases ported from Calendar Card Pro's tests are named where
// they appear (MIT, commit 75bf292; rewritten, not copied).
const assert = require("assert");
const { ZONE, wall } = require("./lib/wall_clock");
const {
  parseDay, dayKey, startOfDay, addDays, dayDiff, cleanEvents, splitByDay, timeWords, shortTimeWords, dayWords, dateTimeWords, multiDayWords,
} = require("../custom_components/family_hub/house_board/when.js");

// The key n days on, counted in UTC, where no day is 23 or 25 hours long.
const keyPlus = (key, n) => new Date(Date.parse(key) + n * 86400000).toISOString().slice(0, 10);
// Every day from September 2026 to May 2027: both of New York's clock
// changes and both of Sydney's.
const YEAR = Array.from({ length: 243 }, (_, i) => keyPlus("2026-09-01", i));
const local = (y, m, d, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s);

// ---- Local dates (borrow item 1) ----

// A day key reads as local midnight, never as UTC midnight
// (tests/all-day-parse.dst.test.ts:53, :67).
for (const key of YEAR) {
  const day = parseDay(key);
  assert.deepStrictEqual([wall(day).key, wall(day).time], [key, "00:00"], `parseDay ${key}`);
  assert.strictEqual(dayKey(day), key, `dayKey ${key}`);
  // Adding days lands on local midnight across every clock change
  // (tests/grid-geometry.dst.test.ts:157-186).
  for (const n of [1, -1, 7]) {
    const moved = addDays(day, n);
    assert.deepStrictEqual([wall(moved).key, wall(moved).time], [keyPlus(key, n), "00:00"], `addDays ${key} ${n}`);
  }
  // Whole calendar days, however long the days in between.
  assert.strictEqual(dayDiff(day, parseDay(keyPlus(key, 1))), 1, `dayDiff ${key} +1`);
  assert.strictEqual(dayDiff(parseDay(keyPlus(key, 30)), day), -30, `dayDiff ${key} -30`);
}
if (ZONE !== "UTC") {
  assert.notStrictEqual(parseDay("2026-11-01").getTime(), new Date("2026-11-01").getTime(), "a UTC parse differs here");
}

// startOfDay keeps the local date, late at night and on the 25-hour day.
for (const at of [local(2026, 11, 1, 23, 59), local(2026, 11, 1, 1, 30), local(2027, 3, 14, 3, 30)]) {
  assert.deepStrictEqual([wall(startOfDay(at)).key, wall(startOfDay(at)).time], [wall(at).key, "00:00"], `startOfDay ${at}`);
}

// Day counts across the house's two nights: a plain division of the
// milliseconds gives 1 for the first.
assert.strictEqual(dayDiff(local(2027, 3, 13, 23), local(2027, 3, 15, 9, 30)), 2, "across spring forward");
assert.strictEqual(dayDiff(local(2026, 10, 31, 23), local(2026, 11, 2, 0, 30)), 2, "across fall back");
assert.strictEqual(dayDiff(local(2026, 11, 3, 0, 1), local(2026, 11, 3, 23, 59)), 0, "same day");
// Local dates win where the UTC date differs (tests/countdown-calendar-days.dst.test.ts:43, :51):
// 9 pm on Nov 3 is already Nov 4 in UTC from New York.
assert.strictEqual(dayDiff(local(2026, 11, 3, 21), parseDay("2026-11-04")), 1, "late evening to tomorrow");
assert.strictEqual(dayDiff(local(2026, 11, 3, 1), parseDay("2026-11-03")), 0, "early morning, Sydney's yesterday in UTC");

// The day key the minute tick compares (borrow item 5; the tick is the card's).
for (const iso of ["2026-11-01T01:30:00-04:00", "2026-11-01T01:30:00-05:00", "2027-03-14T03:30:00-04:00",
  "2026-10-04T03:30:00+11:00", "2027-04-04T02:30:00+10:00", "2027-04-04T02:30:00+11:00", "2026-11-04T02:00:00Z"]) {
  assert.strictEqual(dayKey(new Date(iso)), wall(new Date(iso)).key, `dayKey ${iso}`);
}
assert.strictEqual(dayKey(local(2026, 11, 1, 23, 59, 1)), "2026-11-01", "a tick before midnight");
assert.strictEqual(dayKey(local(2026, 11, 2, 0, 0, 1)), "2026-11-02", "the tick after it sees a new day");
const asleep = new Date(local(2026, 11, 1, 22, 30).getTime() + 3 * 3600000);
assert.strictEqual(dayKey(asleep), wall(asleep).key, "one tick after three hours asleep");
assert.notStrictEqual(dayKey(asleep), "2026-11-01", "it sees the new day");

// ---- One bad event costs one row (borrow item 3) ----

const timed = (summary, start, end) => ({ summary, start: { dateTime: start }, end: end === undefined ? undefined : end === null ? null : { dateTime: end } });
const allDay = (summary, start, end) => ({ summary, start: { date: start }, end: { date: end } });
const good = timed("Dentist", "2026-11-03T15:30:00-05:00", "2026-11-03T16:30:00-05:00");
const titles = (events) => events.map((e) => e.summary);

// A missing end keeps the event as an instant at its start (tests/malformed-event-payload.test.ts:109).
for (const end of [undefined, null]) {
  const [kept] = cleanEvents([timed("Call the vet", "2026-11-03T09:41:00-05:00", end)]);
  assert.deepStrictEqual(kept.end, { dateTime: "2026-11-03T09:41:00-05:00" }, `end ${end}`);
}
// A backwards end becomes an instant; the event as fetched is untouched and
// kept beside the copy, for writing back later (tests/bad-event-end.test.ts:136).
const backwards = timed("Pick up Max", "2026-11-03T12:00:00-05:00", "2026-11-03T11:00:00-05:00");
const [repaired] = cleanEvents([backwards]);
assert.deepStrictEqual(repaired.end, { dateTime: "2026-11-03T12:00:00-05:00" });
assert.strictEqual(repaired.source, backwards, "the copy points at the event as fetched");
assert.deepStrictEqual(backwards.end, { dateTime: "2026-11-03T11:00:00-05:00" }, "the original is untouched");
assert.notStrictEqual(repaired, backwards);
// The fall-back event only looks backwards on the clock: 1:30 am EDT to
// 1:15 am EST is 45 minutes, and is left alone (tests/bad-event-end.test.ts:165).
const fallBack = timed("Night feed", "2026-11-01T01:30:00-04:00", "2026-11-01T01:15:00-05:00");
assert.strictEqual(cleanEvents([fallBack])[0], fallBack);

// Each of these is dropped, and only it (tests/malformed-event-payload.test.ts:120, :150;
// tests/bad-event-end.test.ts:197).
const dropped = {
  "an end that isn't an object": { ...good, end: "2026-11-03T16:30:00-05:00" },
  "no start": { summary: "No start", end: good.end },
  "a start that isn't an object": { ...good, start: "2026-11-03" },
  "a title that isn't text": { ...good, summary: 42 },
  "a place that isn't text": { ...good, location: { street: "Elm" } },
  "details that aren't text": { ...good, description: ["x"] },
  "a start that can't be read": timed("Bad start", "soon", "2026-11-03T16:30:00-05:00"),
  "an end there but unreadable": timed("Bad end", "2026-11-03T15:30:00-05:00", "later"),
  "a timed start with an all-day end": { summary: "Mixed", start: good.start, end: { date: "2026-11-04" } },
  "an all-day event with no end": { summary: "Open", start: { date: "2026-11-03" } },
  "an all-day event with a timed end": { summary: "Mixed", start: { date: "2026-11-03" }, end: good.end },
  "an all-day end on its start": allDay("Zero days", "2026-11-03", "2026-11-03"),
  "an all-day end before its start": allDay("Backwards", "2026-11-04", "2026-11-03"),
  "an impossible date": allDay("June 31", "2026-06-31", "2026-07-01"),
  "a date not written in full": allDay("Short", "2026-11-3", "2026-11-04"),
  "nothing at all": null,
};
for (const [why, bad] of Object.entries(dropped)) {
  assert.deepStrictEqual(titles(cleanEvents([good, bad, good])), ["Dentist", "Dentist"], why);
}
// Kept as they are: a one-day all-day event (tests/bad-event-end.test.ts:226),
// and empty optional text (tests/malformed-event-payload.test.ts:190).
const oneDay = allDay("Trash night", "2026-11-03", "2026-11-04");
const plain = { ...good, description: null, location: undefined };
assert.deepStrictEqual(cleanEvents([oneDay, plain]), [oneDay, plain]);
assert.strictEqual(cleanEvents([good])[0], good, "a good event is the same object");

// ---- Each event's share of each day (borrow items 8 and 11) ----

const at = (key, h, min = 0) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, h, min);
};
const span = (summary, from, to) => timed(summary, from.toISOString(), to.toISOString());
// Each part as [day, wall start, wall end, all-day], read through Intl.
const shape = (parts) => parts.map((p) => [p.day, `${wall(p.start).key} ${wall(p.start).time}`, `${wall(p.end).key} ${wall(p.end).time}`, p.allDay]);
const week = (key) => [parseDay(key), addDays(parseDay(key), 7)];

for (const key of YEAR) {
  const next = keyPlus(key, 1);
  // An end at exactly midnight stays on its day, also on every day a clock
  // changes; a minute past makes a second part
  // (tests/multiday-midnight.dst.test.ts:74, :87; tests/grid-geometry.dst.test.ts:283).
  assert.deepStrictEqual(shape(splitByDay(span("Late show", at(key, 22), parseDay(next)), ...week(key))),
    [[key, `${key} 22:00`, `${next} 00:00`, false]], `midnight end ${key}`);
  assert.deepStrictEqual(shape(splitByDay(span("Late show", at(key, 22), at(next, 0, 1)), ...week(key))),
    [[key, `${key} 22:00`, `${next} 00:00`, false], [next, `${next} 00:00`, `${next} 00:01`, false]], `a minute past ${key}`);
  // An all-day event covers its own day only: it ends at the midnight after
  // it, and the end date is the day after (borrow item 11).
  assert.deepStrictEqual(shape(splitByDay(allDay("Trash night", key, next), ...week(key))),
    [[key, `${key} 00:00`, `${next} 00:00`, true]], `all-day ${key}`);
}

// The 25-hour day: a whole-day timed event is one part, as long as the day is.
const longDay = splitByDay(span("Clocks back", parseDay("2026-11-01"), parseDay("2026-11-02")), ...week("2026-11-01"));
assert.deepStrictEqual(shape(longDay), [["2026-11-01", "2026-11-01 00:00", "2026-11-02 00:00", false]]);
assert.strictEqual(longDay[0].end - longDay[0].start, parseDay("2026-11-02") - parseDay("2026-11-01"));
// Overnight across the fall-back night.
assert.deepStrictEqual(shape(splitByDay(span("Overnight", at("2026-10-31", 22), at("2026-11-01", 2)), ...week("2026-10-31"))), [
  ["2026-10-31", "2026-10-31 22:00", "2026-11-01 00:00", false],
  ["2026-11-01", "2026-11-01 00:00", "2026-11-01 02:00", false],
]);
// Middle days run midnight to midnight and stay timed.
assert.deepStrictEqual(shape(splitByDay(span("Conference", at("2027-03-12", 20), at("2027-03-15", 10)), ...week("2027-03-12"))), [
  ["2027-03-12", "2027-03-12 20:00", "2027-03-13 00:00", false],
  ["2027-03-13", "2027-03-13 00:00", "2027-03-14 00:00", false],
  ["2027-03-14", "2027-03-14 00:00", "2027-03-15 00:00", false],
  ["2027-03-15", "2027-03-15 00:00", "2027-03-15 10:00", false],
]);
// Bounded to the days shown: an event already running lands on the first day
// shown, and nothing outside them is drawn (tests/grid-daily-coverage.test.ts:212, :260).
const shown = [parseDay("2026-11-03"), parseDay("2026-11-05")];
assert.deepStrictEqual(shape(splitByDay(span("Trip", at("2026-11-02", 20), at("2026-11-07", 9)), ...shown)), [
  ["2026-11-03", "2026-11-03 00:00", "2026-11-04 00:00", false],
  ["2026-11-04", "2026-11-04 00:00", "2026-11-05 00:00", false],
]);
assert.deepStrictEqual(splitByDay(span("Before", at("2026-11-02", 20), parseDay("2026-11-03")), ...shown), [], "ends as the days start");
assert.deepStrictEqual(splitByDay(span("After", parseDay("2026-11-05"), at("2026-11-05", 9)), ...shown), [], "starts as they end");
assert.deepStrictEqual(shape(splitByDay(allDay("Visit", "2026-10-30", "2026-11-09"), ...shown)), [
  ["2026-11-03", "2026-11-03 00:00", "2026-11-04 00:00", true],
  ["2026-11-04", "2026-11-04 00:00", "2026-11-05 00:00", true],
]);
assert.deepStrictEqual(splitByDay(allDay("Gone", "2026-11-01", "2026-11-03"), ...shown), [], "all-day, ended");
// A zero-length event is kept as an instant on its day, if that day is shown
// (tests/zero-duration-events.test.ts:190).
const reminder = span("Call the vet", at("2026-11-03", 9, 41), at("2026-11-03", 9, 41));
assert.deepStrictEqual(shape(splitByDay(reminder, ...shown)), [["2026-11-03", "2026-11-03 09:41", "2026-11-03 09:41", false]]);
assert.deepStrictEqual(splitByDay(reminder, parseDay("2026-11-04"), parseDay("2026-11-06")), []);
// Every part points at the event it came from.
const trip = span("Trip", at("2026-11-02", 20), at("2026-11-07", 9));
assert.ok(splitByDay(trip, ...shown).every((p) => p.event === trip));

// An all-day event stays on today's list until midnight after its last day
// (tests/allday-expiry.test.ts:174, :181): a part is finished once its end
// has passed.
const [today] = splitByDay(allDay("Book fair", "2026-11-03", "2026-11-04"), ...shown);
assert.ok(today.end > at("2026-11-03", 23, 59), "kept late in the day");
assert.ok(today.end <= parseDay("2026-11-04"), "gone at midnight");

// ---- Words ----

assert.strictEqual(dateTimeWords(at("2026-11-03", 15, 30)), "Tue Nov 3, 3:30 pm");
assert.strictEqual(dayWords(at("2027-03-14", 12)), "Sun Mar 14");
const clock = { "0:00": "12:00 am", "0:30": "12:30 am", "9:05": "9:05 am", "12:00": "12:00 pm", "13:00": "1:00 pm", "23:59": "11:59 pm" };
for (const [hm, words] of Object.entries(clock)) {
  const [h, min] = hm.split(":").map(Number);
  assert.strictEqual(timeWords(at("2026-11-03", h, min)), words, hm);
}
// The short form for spans and "until", where am or pm is plain: "8:30 to 4:30".
assert.deepStrictEqual([[8, 30], [16, 30], [0, 5], [12, 0]].map(([h, min]) => shortTimeWords(at("2026-11-03", h, min))), ["8:30", "4:30", "12:05", "12:00"]);
// Against Intl, every day of the year and both readings of fall-back's 1:30 am.
for (const key of YEAR) {
  const instant = new Date(`${key}T13:05:00Z`);
  assert.strictEqual(dateTimeWords(instant), wall(instant).words, `words ${key}`);
}
for (const iso of ["2026-11-01T01:30:00-04:00", "2026-11-01T01:30:00-05:00", "2027-03-14T03:00:00-04:00"]) {
  assert.strictEqual(dateTimeWords(new Date(iso)), wall(new Date(iso)).words, `words ${iso}`);
}

// Multi-day wording, as seen on now's day (call A9, from Calendar Card Pro's
// src/utils/format.ts:984-1093).
const morning = at("2026-11-03", 8);
const words = (event, now = morning) => multiDayWords(event, now);
assert.strictEqual(words(span("Late show", at("2026-11-03", 22, 30), at("2026-11-04", 0, 30))), "10:30 pm, ends tomorrow at 12:30 am");
assert.strictEqual(words(span("Conference", at("2026-11-03", 9), at("2026-11-06", 17))), "9:00 am until Fri Nov 6 at 5:00 pm");
assert.strictEqual(words(span("Conference", at("2026-11-02", 9), at("2026-11-06", 17))), "until Fri Nov 6 at 5:00 pm", "started before today");
assert.strictEqual(words(span("Night shift", at("2026-11-02", 22), at("2026-11-03", 7))), "ends today at 7:00 am");
assert.strictEqual(words(span("Overnight", at("2026-11-02", 20), at("2026-11-04", 0, 30))), "ends tomorrow at 12:30 am");
assert.strictEqual(words(span("Weekend away", at("2026-11-06", 18), at("2026-11-08", 15))), "6:00 pm until Sun Nov 8 at 3:00 pm", "later this week");
// Near midnight, today is now's day.
const lateShow = span("Late show", at("2026-11-03", 22, 30), at("2026-11-04", 0, 30));
assert.strictEqual(words(lateShow, at("2026-11-03", 23, 59)), "10:30 pm, ends tomorrow at 12:30 am");
assert.strictEqual(words(lateShow, at("2026-11-04", 0, 10)), "ends today at 12:30 am");
// Across the house's two nights.
assert.strictEqual(words(span("Party", at("2026-10-31", 21), at("2026-11-01", 1, 30)), at("2026-10-31", 10)), "9:00 pm, ends tomorrow at 1:30 am");
assert.strictEqual(words(span("Party", at("2027-03-13", 23), at("2027-03-14", 3, 30)), at("2027-03-13", 10)), "11:00 pm, ends tomorrow at 3:30 am");
// All-day: the last day, not the exclusive end date.
assert.strictEqual(words(allDay("Grandma visits", "2026-11-03", "2026-11-10")), "All day, until Mon Nov 9");
assert.strictEqual(words(allDay("Grandma visits", "2026-11-01", "2026-11-04")), "All day, ends today");
assert.strictEqual(words(allDay("Grandma visits", "2026-11-03", "2026-11-05")), "All day, ends tomorrow");
// Within one day, the face says it its own way.
for (const [why, event] of Object.entries({
  "same day": span("Dentist", at("2026-11-03", 15, 30), at("2026-11-03", 16, 30)),
  "ends at midnight": span("Late show", at("2026-11-03", 22), parseDay("2026-11-04")),
  "an instant": span("Call the vet", at("2026-11-03", 9, 41), at("2026-11-03", 9, 41)),
  "the 25-hour day": span("Clocks back", parseDay("2026-11-01"), parseDay("2026-11-02")),
  "one all-day day": allDay("Trash night", "2026-11-03", "2026-11-04"),
})) {
  assert.strictEqual(words(event), null, why);
}

console.log(`house board when (${ZONE}): all checks passed`);

// Owns: days and times, which day an event falls on, and the words for when.
// Leaves alone: fetching, drawing, and the clock itself (now is passed in).
// Tested by: tests/test_house_board_when.js, rerun in three zones by run_all.sh
//
// Days are local days in the browser's own zone (call A7). Events have Home
// Assistant's calendar shape: start and end are each { dateTime } (an instant
// with its offset) or { date } ("2026-11-03"; an all-day end is exclusive).

// ---- Local dates (borrow item 1) ----
// Rule from Calendar Card Pro (MIT), src/utils/format.ts:496-510, :685-690 and src/utils/grid.ts:266-282 at 75bf292.
// Never new Date("2026-11-03"), which reads the day as UTC midnight, and never
// step days by 86,400,000 ms, since a clock change makes a day 23 or 25 hours.

export function parseDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Local midnight n days after date's day.
export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// Whole calendar days from one date's day to another's; negative if earlier.
export function dayDiff(from, to) {
  const day = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day(to) - day(from)) / 86400000);
}

// ---- One bad event costs one row (borrow item 3) ----
// Adapted from Calendar Card Pro (MIT; see NOTICE): src/utils/events.ts:731-806 at 75bf292.
// Run on every calendar's answer before anything else reads it: whatever an
// integration sends, a throw later would blank the whole board. Drops what
// can't be placed. A timed event with a missing or backwards end becomes an
// instant at its start, as a copy whose `source` is the event as fetched:
// write back from that, never from the copy. Ends are compared as instants,
// so a fall-back event (1:30 am EDT to 1:15 am EST) is left alone.
export function cleanEvents(events) {
  const isObject = (value) => value !== null && typeof value === "object";
  const realDay = (key) => typeof key === "string" && dayKey(parseDay(key)) === key;
  return events.flatMap((event) => {
    if (!isObject(event) || !isObject(event.start)) return [];
    if (event.end != null && !isObject(event.end)) return [];
    const { start } = event;
    const end = event.end || {};
    const texts = [start.date, start.dateTime, end.date, end.dateTime, event.summary, event.location, event.description];
    if (texts.some((value) => value != null && typeof value !== "string")) return [];
    if (start.dateTime) {
      const startMs = Date.parse(start.dateTime);
      if (start.date || end.date || !Number.isFinite(startMs)) return [];
      if (end.dateTime) {
        const endMs = Date.parse(end.dateTime);
        if (!Number.isFinite(endMs)) return [];
        if (endMs >= startMs) return [event];
      }
      return [{ ...event, end: { dateTime: start.dateTime }, source: event.source || event }];
    }
    return realDay(start.date) && realDay(end.date) && !end.dateTime && end.date > start.date ? [event] : [];
  });
}

// ---- Each event's share of each day (borrow items 8 and 11) ----
// Adapted from Calendar Card Pro (MIT; see NOTICE): src/utils/grid.ts:1401-1460 at 75bf292.
// The parts of one event (from cleanEvents) on each local day from `from` up
// to `to`, both local midnights, as { day, start, end, allDay, event }:
// - timed events are cut at local midnights, and every part stays timed, a
//   middle day running midnight to midnight;
// - an end at exactly midnight adds no day, and a zero-length event is kept
//   as an instant on its day;
// - an event already running lands on the first day shown;
// - an all-day event covers the days before its end date, and each part ends
//   at the midnight after its day: a part has finished once its end has
//   passed (rule from src/utils/events.ts:983-1009, :1137-1145).
export function splitByDay(event, from, to) {
  const parts = [];
  if (!event.start.dateTime) {
    const first = parseDay(event.start.date);
    const end = parseDay(event.end.date);
    for (let day = first < from ? from : first; day < end && day < to; day = addDays(day, 1)) {
      parts.push({ day: dayKey(day), start: day, end: addDays(day, 1), allDay: true, event });
    }
    return parts;
  }
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  if (end.getTime() === start.getTime()) {
    return start >= from && start < to ? [{ day: dayKey(start), start, end, allDay: false, event }] : [];
  }
  for (let day = startOfDay(start < from ? from : start); day < end && day < to; day = addDays(day, 1)) {
    const next = addDays(day, 1);
    parts.push({ day: dayKey(day), start: start > day ? start : day, end: end < next ? end : next, allDay: false, event });
  }
  return parts;
}

// ---- Words, in the house's 12-hour style ----

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "3:30 pm"
export function timeWords(date) {
  const h = date.getHours();
  return `${h % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

// "4:30", for spans and "until", where am or pm is plain: "8:30 to 4:30".
export const shortTimeWords = (date) => timeWords(date).slice(0, -3);

// "Tue Nov 3"
export function dayWords(date) {
  return `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// "Tue Nov 3, 3:30 pm"
export function dateTimeWords(date) {
  return `${dayWords(date)}, ${timeWords(date)}`;
}

// Rule from Calendar Card Pro (MIT), src/utils/format.ts:984-1093 at 75bf292 (call A9).
// How an event that runs past its first day ends, seen on now's day:
// "10:30 pm, ends tomorrow at 12:30 am", "until Fri Nov 6 at 5:00 pm" (it
// started before today), "All day, until Mon Nov 9". Null for an event
// within one day, including one that ends at exactly midnight.
export function multiDayWords(event, now) {
  const when = (date) => {
    const days = dayDiff(now, date);
    return days === 0 ? "ends today" : days === 1 ? "ends tomorrow" : `until ${dayWords(date)}`;
  };
  if (!event.start.dateTime) {
    const last = addDays(parseDay(event.end.date), -1);
    return dayDiff(parseDay(event.start.date), last) > 0 ? `All day, ${when(last)}` : null;
  }
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  if (end <= start || dayKey(start) === dayKey(new Date(end - 1))) return null;
  const ends = `${when(end)} at ${timeWords(end)}`;
  if (start < startOfDay(now)) return ends;
  // "until" reads on from a time; "ends tomorrow" is a sentence of its own.
  return `${timeWords(start)}${ends.startsWith("until") ? " " : ", "}${ends}`;
}

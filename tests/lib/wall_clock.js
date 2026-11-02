// House board test helper: what a wall clock in this process's time zone reads
// at an instant, from Intl with an explicit timeZone, never from the Date
// getters the code under test uses (borrow.md, item 2). run_all.sh sets the
// zone with TZ when it reruns the date checks.
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const numbers = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
});
const names = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE, hour12: true, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});
const parts = (format, instant) => Object.fromEntries(format.formatToParts(instant).map((p) => [p.type, p.value]));

// { key: "2026-11-01", time: "01:30", words: "Sun Nov 1, 1:30 am" }
function wall(instant) {
  const n = parts(numbers, instant);
  const w = parts(names, instant);
  return {
    key: `${n.year}-${n.month}-${n.day}`,
    time: `${n.hour}:${n.minute}`,
    words: `${w.weekday} ${w.month} ${w.day}, ${w.hour}:${w.minute} ${w.dayPeriod.toLowerCase()}`,
  };
}

module.exports = { ZONE, wall };

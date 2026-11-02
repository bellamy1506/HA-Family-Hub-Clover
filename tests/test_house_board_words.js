// House board test: words.js, the words the face and Upcoming both show.
// Run: node tests/test_house_board_words.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// Made-up calendars and forecasts only. Times are local wall times built with
// new Date(y, m - 1, d, h, min), so one expected answer holds in every zone;
// the fall-back night's hours are instants, and their expected words come
// from Intl (tests/lib/wall_clock.js), never from the code under test.
const assert = require("assert");
const { quietWords, rainWords, chanceWords } = require("../custom_components/family_hub/house_board/words.js");
const { wall } = require("./lib/wall_clock.js");

const HOUR = 3600000;
const nov = (d, h = 0, min = 0) => new Date(2026, 10, d, h, min);
const NOW = nov(3, 10); // Tue Nov 3, 10:00 am

// ---- The quiet line (#103, owner), and a calendar with nothing kept ----
{
  const quiet = (name, since, kept = true) => ({ entity: "calendar.x", name, since, failingSince: nov(3, 9, 41), kept });
  assert.strictEqual(quietWords(quiet("Jenn's calendar", nov(3, 9, 40)), NOW), "Jenn's calendar hasn't updated since 9:40 am");
  assert.strictEqual(quietWords(quiet("The Us calendar", nov(3, 9, 40)), NOW), "The Us calendar hasn't updated since 9:40 am");
  // An answer on another day names the day, so it can't read as this morning.
  assert.strictEqual(quietWords(quiet("Will's work calendar", nov(2, 21, 40)), NOW), "Will's work calendar hasn't updated since Mon Nov 2, 9:40 pm");
  // No live answer on this page (#117's finding): the events shown are the
  // server's copy, of unknown age, so no time is claimed.
  assert.strictEqual(quietWords(quiet("Jenn's calendar", null), NOW), "Jenn's calendar isn't updating");
  // Nothing kept: its days say so instead of looking free.
  assert.strictEqual(quietWords(quiet("Jenn's calendar", null, false), NOW), "Jenn's calendar isn't loading");
}

// ---- The rain line: stated, never an instruction (the resting face README) ----
// An hour is rainy when its condition is (icons.js's isRainy, #120's call).
const hours = (from, conditions) => conditions.map((condition, i) => ({ at: new Date(+from + i * HOUR), condition, temperature: 50, rain: null }));
const weather = (hourly) => ({ condition: "cloudy", daily: null, hourly });
{
  // Today from 6 am: dry, then rain from 2 pm to 9 pm, then dry.
  const day = weather(hours(nov(3, 6), [..."ssssssss", ..."rrrrrrr", "s", "s", "s"].map((k) => (k === "r" ? "rainy" : "sunny"))));
  assert.strictEqual(rainWords(day, nov(3, 7, 40)), "Rain from 2 pm", "morning: when it starts");
  assert.strictEqual(rainWords(day, nov(3, 13, 59)), "Rain from 2 pm");
  assert.strictEqual(rainWords(day, nov(3, 14)), "Rain until 9 pm", "under way: when it stops");
  assert.strictEqual(rainWords(day, nov(3, 15, 10)), "Rain until 9 pm");
  assert.strictEqual(rainWords(day, nov(3, 20, 59)), "Rain until 9 pm", "it stays while it's true");
  assert.strictEqual(rainWords(day, nov(3, 21)), null, "gone once it stops");

  // Every rainy kind counts; hail and a 90% chance on a cloudy hour don't.
  for (const condition of ["pouring", "lightning-rainy", "snowy-rainy"]) {
    assert.strictEqual(rainWords(weather(hours(nov(3, 9), ["sunny", condition, "sunny"])), NOW), "Rain until 11 am", condition);
  }
  const notRain = hours(nov(3, 9), ["sunny", "hail", "cloudy", "snowy"]);
  notRain[2].rain = 90;
  assert.strictEqual(rainWords(weather(notRain), NOW), null, "hail, a cloudy 90% and snow aren't rain");

  // Waking hours end at 10 pm: rain that starts later isn't today's line.
  const night = weather(hours(nov(3, 18), ["sunny", "sunny", "sunny", "sunny", "rainy", "rainy"]));
  assert.strictEqual(rainWords(night, nov(3, 19)), null, "rain from 10 pm is tonight's, not the day's");
  const late = weather(hours(nov(3, 18), ["sunny", "sunny", "sunny", "rainy", "rainy", "rainy"]));
  assert.strictEqual(rainWords(late, nov(3, 19)), "Rain from 9 pm");
  // Rain already under way says when it stops, even past midnight.
  assert.strictEqual(rainWords(late, nov(3, 22, 30)), "Rain until 12 am");
  // A run to the forecast's last hour stops at that hour's end.
  assert.strictEqual(rainWords(weather(hours(nov(3, 9), ["rainy", "rainy"])), NOW), "Rain until 11 am");

  // Hours that have passed are skipped: a forecast is kept until the next.
  assert.strictEqual(rainWords(weather(hours(nov(3, 6), ["sunny", "rainy", "sunny", "sunny", "sunny"])), NOW), null, "7 am's rain is over");
  // No weather, no hourly forecast yet, an empty one: no line.
  assert.strictEqual(rainWords(null, NOW), null);
  assert.strictEqual(rainWords(weather(null), NOW), null);
  assert.strictEqual(rainWords(weather([]), NOW), null);
  // A half-hour start, should a forecast give one, keeps its minutes.
  assert.strictEqual(rainWords(weather(hours(nov(3, 11, 30), ["rainy", "sunny"])), NOW), "Rain from 11:30 am");
}

// The fall-back night: the hours are instants an hour apart, so New York has
// two 1 am hours. Rain under way at 12:30 am for three hours stops at the
// fourth hour's start, whatever the wall clock calls it.
{
  const midnight = new Date(2026, 10, 1);
  const night = weather(hours(midnight, ["rainy", "rainy", "rainy", "sunny", "sunny"]));
  const end = wall(new Date(+midnight + 3 * HOUR)).time; // "02:00" in New York, "03:00" elsewhere
  const h = Number(end.slice(0, 2));
  assert.strictEqual(rainWords(night, new Date(+midnight + HOUR / 2)), `Rain until ${h % 12 || 12} ${h < 12 ? "am" : "pm"}`);
}

// ---- The chance of rain under a rainy day, when the weather gives one (#104 decision 2) ----
{
  assert.strictEqual(chanceWords({ condition: "rainy", high: 55, low: 44, rain: 80 }), "80%");
  assert.strictEqual(chanceWords({ condition: "pouring", high: 55, low: 44, rain: 39.6 }), "40%");
  assert.strictEqual(chanceWords({ condition: "rainy", high: 55, low: 44, rain: null }), null, "the house forecast gives none");
  assert.strictEqual(chanceWords({ condition: "sunny", high: 60, low: 41, rain: 80 }), null, "only under a rainy day");
  assert.strictEqual(chanceWords(undefined), null, "a day past the forecast's reach");
  assert.strictEqual(chanceWords(null), null);
}

console.log("house board words: all checks passed");

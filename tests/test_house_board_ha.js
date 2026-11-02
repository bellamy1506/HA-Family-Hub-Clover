// House board test: ha.js (the calendars, lists, weather, switches and
// reports), against tests/lib/fake_hass.js.
// Run: node tests/test_house_board_ha.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// Everything here is made up. Times are counted on the fake's clock, which
// only moves when a check moves it. Cases ported from Calendar Card Pro's
// tests are named where they appear (MIT, commit 75bf292; rewritten, not
// copied).
const assert = require("assert");
const { wall } = require("./lib/wall_clock");
const { fakeHass } = require("./lib/fake_hass.js");
const { report, watch } = require("../custom_components/family_hub/house_board/ha.js");

const T0 = "2026-11-02T08:00:00-05:00";
const local = (y, m, d, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s);
// The key n days on, counted in UTC, where no day is 23 or 25 hours long.
const keyPlus = (key, n) => new Date(Date.parse(key) + n * 86400000).toISOString().slice(0, 10);
const S = 1000;
const MIN = 60 * S;
const ev = (summary, start, end, more = {}) => ({ summary, start: { dateTime: start }, end: { dateTime: end }, ...more });
const DENTIST = ev("Dentist", "2026-11-03T15:30:00-05:00", "2026-11-03T16:30:00-05:00", { uid: "a1" });
const SOCCER = ev("Soccer", "2026-11-04T17:00:00-05:00", "2026-11-04T18:00:00-05:00", { uid: "a2" });
const BOOK_CLUB = ev("Book club", "2026-11-05T19:00:00-05:00", "2026-11-05T21:00:00-05:00", { uid: "a3" });
// A to-do item as todo/item/subscribe sends it in core 2026.10.4: every field, null when empty.
const item = (uid, summary, more = {}) => ({ summary, uid, status: "needs_action", due: null, description: null, completed: null, ...more });

const CONFIG = {
  people: { Will: { color: "Cornflower", users: ["user-will"] }, Jenn: { color: "Vermillion", users: ["user-jenn"] }, Us: { color: "Green" } },
  calendars: [
    { entity: "calendar.will", person: "Will" },
    { entity: "calendar.jenn", person: "Jenn", work: true, detail: "block", label: "At work" },
    { entity: "calendar.us", person: "Us" },
  ],
};

// A board watching a fake, with every snapshot it was handed. `next` plans
// each calendar's first asks: { "calendar.will": [plan, ...] }.
function start({ next = {}, ...options }, config = CONFIG) {
  const fake = fakeHass({ now: T0, ...options });
  for (const [entity, plans] of Object.entries(next)) plans.forEach((plan) => fake.next(entity, plan));
  const seen = [];
  const board = watch(fake.hass, config, (snapshot) => seen.push(snapshot), fake.clock);
  const last = () => seen[seen.length - 1];
  const cal = (entity) => last().calendars.find((c) => c.entity === entity);
  const titles = (entity) => cal(entity).events && cal(entity).events.map((e) => e.summary);
  const at = (ms) => new Date(Date.parse(T0) + ms);
  return { fake, board, seen, last, cal, titles, at };
}

async function main() {
  // ---- The snapshot, before anything answers ----
  {
    const t = start({ calendars: { "calendar.will": { never: true }, "calendar.jenn": { never: true }, "calendar.us": { never: true } } });
    assert.strictEqual(t.seen.length, 1, "one snapshot at once, before anything answers");
    assert.strictEqual(t.last().days, 42, "the calendars are asked for today and the 41 days after");
    assert.deepStrictEqual(t.last().calendars, [
      { entity: "calendar.will", person: "Will", work: false, detail: "titles", label: null, events: null, answeredAt: null, failingSince: null },
      { entity: "calendar.jenn", person: "Jenn", work: true, detail: "block", label: "At work", events: null, answeredAt: null, failingSince: null },
      { entity: "calendar.us", person: "Us", work: false, detail: "titles", label: null, events: null, answeredAt: null, failingSince: null },
    ]);
    const { lists, weather, guestMode, boardPrivate } = t.last();
    assert.deepStrictEqual({ lists, weather, guestMode, boardPrivate }, { lists: { notes: null, meals: null, house: null }, weather: null, guestMode: false, boardPrivate: false }, "no lists, weather or switches named: nothing known, both off");
    t.board.stop();
  }

  // ---- The server's calendar copy shows before live answers ----
  {
    const t = start({
      calendars: { "calendar.will": { events: [DENTIST, SOCCER], after: 2 * S }, "calendar.jenn": { never: true }, "calendar.us": { never: true } },
      copy: { "calendar.will": [DENTIST], "calendar.us": [] },
    });
    const get = t.fake.sentOf("family_hub/calendar_cache/get");
    assert.strictEqual(get.length, 1, "the copy is asked for once");
    assert.deepStrictEqual(get[0].entity_ids, ["calendar.will", "calendar.jenn", "calendar.us"]);
    assert.deepStrictEqual(t.fake.asked.map((a) => a.entity), ["calendar.will", "calendar.jenn", "calendar.us"], "every calendar is asked live at once too");
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Dentist"], "the copy's events show first");
    assert.deepStrictEqual(t.cal("calendar.us").events, [], "a copy can hold an empty calendar");
    assert.strictEqual(t.cal("calendar.jenn").events, null, "a calendar the copy doesn't hold has nothing yet");
    assert.strictEqual(t.cal("calendar.will").answeredAt, null, "the copy isn't a live answer");
    t.board.stop();
  }

  // ---- Live answers replace the copy and go back with put ----
  {
    // One bad event costs one row: it's left out of the snapshot, but the
    // answer goes back exactly as Home Assistant gave it.
    const BROKEN = { summary: "Broken", start: { dateTime: "not a time" }, end: { dateTime: "2026-11-03T10:00:00-05:00" } };
    const t = start({
      calendars: { "calendar.will": { events: [DENTIST, SOCCER, BROKEN], after: 2 * S }, "calendar.jenn": [BOOK_CLUB], "calendar.us": [] },
      copy: { "calendar.will": [DENTIST], "calendar.jenn": [BOOK_CLUB], "calendar.us": [] },
    });
    await t.fake.clock.advance(0);
    const shown = t.seen.length;
    assert.deepStrictEqual(t.fake.sentOf("family_hub/calendar_cache/put"), [], "answers that match the copy aren't sent back");
    assert.deepStrictEqual(t.cal("calendar.jenn").answeredAt, t.at(0), "a live answer is noted");
    await t.fake.clock.advance(2 * S);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Dentist", "Soccer"], "the live answer replaces the copy");
    assert.strictEqual(t.seen.length, shown + 1, "one new snapshot for it");
    const puts = t.fake.sentOf("family_hub/calendar_cache/put");
    const asked = t.fake.asked[0];
    assert.deepStrictEqual(puts, [
      { type: "family_hub/calendar_cache/put", start: asked.start, end: asked.end, calendars: { "calendar.will": [DENTIST, SOCCER, BROKEN] } },
    ], "the whole answer goes back unchanged, for the range asked");
    // Asked again 60 s after each answer landed, never while one is out
    // (borrow item 4: arming from the ask doubled CCP's interval).
    const settled = t.seen.length;
    await t.fake.clock.advance(70 * S);
    assert.strictEqual(t.seen.length, settled, "the same answers again give no snapshot");
    assert.deepStrictEqual(t.fake.asked.filter((a) => a.entity === "calendar.will").map((a) => a.at - Date.parse(T0)), [0, 62 * S]);
    assert.deepStrictEqual(t.fake.asked.filter((a) => a.entity === "calendar.us").map((a) => a.at - Date.parse(T0)), [0, 60 * S]);
    assert.strictEqual(t.fake.sentOf("family_hub/calendar_cache/put").length, 1, "the same answer again isn't sent again");
    t.board.stop();
  }

  // ---- A failure keeps the last events and is never put ----
  // (tests/event-fetch-resilience.test.ts:190, :258)
  {
    const t = start({
      calendars: { "calendar.will": [DENTIST], "calendar.jenn": [BOOK_CLUB], "calendar.us": [] },
      copy: { "calendar.jenn": [BOOK_CLUB] },
      next: { "calendar.jenn": [{ fail: "Server error" }] },
    });
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(t.titles("calendar.jenn"), ["Book club"], "a failed calendar keeps the copy's events");
    assert.deepStrictEqual(t.cal("calendar.jenn").failingSince, t.at(0), "failing since its first failure");
    assert.strictEqual(t.cal("calendar.jenn").answeredAt, null);
    const putFor = (entity) => t.fake.sentOf("family_hub/calendar_cache/put").filter((m) => m.calendars[entity]);
    assert.strictEqual(putFor("calendar.will").length, 1, "an answer is put");
    assert.strictEqual(putFor("calendar.jenn").length, 0, "the failure is never put");
    assert.strictEqual(t.cal("calendar.will").failingSince, null, "the others aren't failing");

    // Will answers, then fails twice, then answers again.
    t.fake.next("calendar.will", { fail: "Server error" });
    t.fake.next("calendar.will", { events: "Internal error" }); // not a list: a failure too
    const shown = t.seen.length;
    await t.fake.clock.advance(60 * S);
    assert.deepStrictEqual(t.cal("calendar.will").failingSince, t.at(60 * S));
    assert.deepStrictEqual(t.cal("calendar.will").answeredAt, t.at(0), "the last answer stays noted");
    assert.deepStrictEqual(t.titles("calendar.will"), ["Dentist"], "its last live events stay");
    await t.fake.clock.advance(60 * S); // the next ask, a minute after the first failure
    assert.deepStrictEqual(t.cal("calendar.will").failingSince, t.at(60 * S), "a second failure keeps the first time");
    await t.fake.clock.advance(120 * S); // backed off: two minutes after the second
    assert.strictEqual(t.cal("calendar.will").failingSince, null, "cleared once it answers");
    assert.deepStrictEqual(t.cal("calendar.will").answeredAt, t.at(240 * S));
    assert.ok(t.seen.length > shown, "failing and recovering each give a snapshot");
    assert.strictEqual(putFor("calendar.will").length, 1, "nothing new to send for Will");
    assert.strictEqual(putFor("calendar.jenn").length, 0, "Jenn's answers matched the copy");
    t.board.stop();
  }

  // ---- An unavailable calendar has failed, without waiting to ask ----
  {
    const u = start({ calendars: { "calendar.will": [DENTIST], "calendar.jenn": [], "calendar.us": [] }, states: { "calendar.us": "unavailable" } });
    await u.fake.clock.advance(0);
    assert.deepStrictEqual(u.fake.asked.map((a) => a.entity), ["calendar.will", "calendar.jenn"], "an unavailable calendar isn't asked");
    assert.deepStrictEqual(u.cal("calendar.us").failingSince, u.at(0));
    u.board.stop();
  }

  // ---- A calendar that never answers is given up after 30 s and backs off,
  // and the others keep their minute (tests/event-fetch-resilience.test.ts:151) ----
  {
    const t = start({ calendars: { "calendar.will": [DENTIST], "calendar.jenn": { never: true }, "calendar.us": [] } });
    await t.fake.clock.advance(29 * S);
    assert.strictEqual(t.cal("calendar.jenn").failingSince, null, "still waiting at 29 s");
    await t.fake.clock.advance(1 * S);
    assert.deepStrictEqual(t.cal("calendar.jenn").failingSince, t.at(30 * S), "given up at 30 s");
    await t.fake.clock.advance(30 * MIN);
    const times = (entity) => t.fake.asked.filter((a) => a.entity === entity).map((a) => (a.at - Date.parse(T0)) / S);
    // Each wait counts from the give-up: 30 s, then 1, 2, 4 and 8 minutes, and 8 after that.
    assert.deepStrictEqual(times("calendar.jenn"), [0, 90, 240, 510, 1020, 1530]);
    assert.deepStrictEqual(times("calendar.will"), Array.from({ length: 31 }, (_, i) => i * 60), "Will kept his minute");
    t.board.stop();
  }

  // ---- One empty answer doesn't empty a full copy; two do (call A4;
  // the house's form of tests/event-cache-lifecycle.test.ts:92) ----
  {
    const t = start({
      calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] },
      copy: { "calendar.will": [DENTIST, SOCCER], "calendar.jenn": [BOOK_CLUB] },
      next: { "calendar.jenn": [[], [BOOK_CLUB, SOCCER]] },
    });
    const putFor = (entity) => t.fake.sentOf("family_hub/calendar_cache/put").filter((m) => m.calendars[entity]);
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Dentist", "Soccer"], "one empty answer is held back");
    assert.deepStrictEqual(putFor("calendar.will"), [], "and not put");
    assert.deepStrictEqual(t.cal("calendar.will").answeredAt, t.at(0), "it still answered");
    assert.strictEqual(t.cal("calendar.will").failingSince, null, "an empty answer isn't a failure");
    await t.fake.clock.advance(60 * S);
    assert.deepStrictEqual(t.cal("calendar.will").events, [], "a second empty answer empties it");
    assert.deepStrictEqual(putFor("calendar.will").map((m) => m.calendars["calendar.will"]), [[]], "and is put");
    assert.deepStrictEqual(t.titles("calendar.jenn"), ["Book club", "Soccer"], "events after one empty answer replace as usual");
    // Emptied, a later empty answer is just the same again.
    await t.fake.clock.advance(60 * S);
    assert.deepStrictEqual(putFor("calendar.will").length, 1);
    t.board.stop();
  }

  // ---- An older answer never overwrites a newer one ----
  {
    // The copy, landing after a live answer, is older than it.
    const t = start({ calendars: { "calendar.will": [SOCCER], "calendar.jenn": [], "calendar.us": [] }, copy: { "calendar.will": [DENTIST] }, copyAfter: 500 });
    await t.fake.clock.advance(1 * S);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Soccer"], "a late copy doesn't replace a live answer");
    t.board.stop();
  }
  {
    // An ask given up at 30 s answers at 100 s, after the next ask (at 90 s)
    // answered: the newer answer wins when the older settles last
    // (tests/update-events-race.test.ts:136).
    const t = start({ calendars: { "calendar.will": [SOCCER], "calendar.jenn": [], "calendar.us": [] }, next: { "calendar.will": [{ events: [DENTIST], after: 100 * S }] } });
    await t.fake.clock.advance(95 * S);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Soccer"]);
    await t.fake.clock.advance(10 * S);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Soccer"], "the late answer is dropped");
    assert.deepStrictEqual(t.fake.sentOf("family_hub/calendar_cache/put").filter((m) => m.calendars["calendar.will"]).map((m) => m.calendars["calendar.will"]), [[SOCCER]], "and never put");
    t.board.stop();
  }

  // ---- After stop, nothing late lands (borrow item 6) ----
  {
    const t = start({
      calendars: { "calendar.will": { events: [SOCCER], after: 5 * S }, "calendar.jenn": { fail: "Server error", after: 2 * S }, "calendar.us": [] },
      copy: { "calendar.will": [DENTIST] },
      copyAfter: 1 * S,
    });
    await t.fake.clock.advance(0); // Us answers and its next ask is armed
    const shown = t.seen.length;
    const puts = t.fake.sentOf("family_hub/calendar_cache/put").length;
    t.board.stop();
    await t.fake.clock.advance(30 * MIN);
    assert.strictEqual(t.seen.length, shown, "no snapshot after stop");
    assert.strictEqual(t.fake.sentOf("family_hub/calendar_cache/put").length, puts, "nothing put after stop");
    assert.strictEqual(t.fake.asked.length, 3, "no ask after stop");
    assert.strictEqual(t.fake.clock.pending(), 0, "no timer left running");
    t.board.setHass(t.fake.setState("calendar.will", "on"));
    assert.strictEqual(t.seen.length, shown, "nor after a new hass");
  }

  // ---- After stop, every subscription is ended (borrow item 6) ----
  {
    const NOTE = item("n1", "Call the vet");
    const empty = { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] };
    const config = { ...CONFIG, weather: "weather.google_weather", lists: { notes: "todo.us_notes", meals: "todo.meal_plan" } };
    // The meal plan isn't held, so it's refused and asked again in a minute.
    const t = start({ calendars: empty, states: { "weather.google_weather": "sunny" }, todos: { "todo.us_notes": [NOTE] }, forecasts: { "weather.google_weather": { daily: [], hourly: [] } } }, config);
    await t.fake.clock.advance(0);
    const shown = t.seen.length;
    t.board.stop();
    // Home Assistant can still push until it answers the unsubscribe.
    t.fake.pushItems("todo.us_notes", []);
    t.fake.pushForecast("weather.google_weather", "daily", [{ datetime: "2026-11-03T12:00:00Z", condition: "rainy" }]);
    await t.fake.clock.advance(5 * MIN);
    assert.strictEqual(t.seen.length, shown, "nothing lands after stop");
    assert.deepStrictEqual(t.fake.subscriptions.map((s) => s.closed), [true, true, true, true], "every subscription ended");
    assert.strictEqual(t.fake.subscriptions.length, 4, "the refused one isn't asked again");
    assert.strictEqual(t.fake.clock.pending(), 0, "no timer left running");
    // Answers that come only after stop: a subscription is ended at once, and
    // a refusal isn't asked again.
    const late = start({ calendars: empty, todos: { "todo.us_notes": [NOTE] } }, { ...CONFIG, lists: { notes: "todo.us_notes", meals: "todo.meal_plan" } });
    late.board.stop();
    await late.fake.clock.advance(5 * MIN);
    assert.deepStrictEqual(late.fake.subscriptions.map((s) => s.closed), [true, true], "a late subscription is ended at once");
    assert.strictEqual(late.fake.subscriptions.length, 2, "a late refusal isn't asked again");
    assert.strictEqual(late.seen.length, 1, "and neither draws anything");
    // The connection drops as the board stops: an unsubscribe that fails
    // stays quiet (an unhandled rejection would end this run).
    const dropped = start({ calendars: empty, todos: { "todo.us_notes": [NOTE] } }, { ...CONFIG, lists: { notes: "todo.us_notes" } });
    await dropped.fake.clock.advance(0);
    dropped.fake.lose();
    dropped.board.stop();
    await dropped.fake.clock.advance(MIN);
  }

  // ---- The hass gate (borrow item 7; call A5) ----
  {
    const config = { ...CONFIG, weather: "weather.forecast_home", lists: { notes: "todo.us_notes" }, guest_mode: "input_boolean.guest_mode", board_private: "input_boolean.board_private" };
    const t = start({ calendars: { "calendar.will": [DENTIST], "calendar.jenn": [], "calendar.us": [] }, states: { "sensor.porch_motion": "off", "weather.forecast_home": "sunny", "input_boolean.guest_mode": "off" } }, config);
    await t.fake.clock.advance(0);
    const count = () => t.seen.length;
    const before = count();
    t.board.setHass(t.fake.hass);
    t.board.setHass(t.fake.setState("sensor.porch_motion", "on"));
    t.board.setHass(t.fake.change({ states: { ...t.fake.hass.states } }));
    // A list's items come by subscription, so its count changing alone is no news.
    t.board.setHass(t.fake.setState("todo.us_notes", "2"));
    assert.strictEqual(count(), before, "an unrelated change, a list's count, or none, gives no snapshot");
    for (const [entity, state] of [["calendar.will", "on"], ["weather.forecast_home", "rainy"], ["input_boolean.guest_mode", "on"], ["input_boolean.board_private", "on"]]) {
      const was = count();
      t.board.setHass(t.fake.setState(entity, state));
      assert.strictEqual(count(), was + 1, `${entity} changing gives one snapshot`);
    }
    for (const key of ["themes", "locale", "user", "connected"]) {
      const was = count();
      t.board.setHass(t.fake.change({ [key]: key === "connected" ? false : { ...t.fake.hass[key] } }));
      assert.strictEqual(count(), was + 1, `a new ${key} gives one snapshot`);
    }
    // The next ask reads the newest hass: Us gone unavailable fails without asking.
    t.board.setHass(t.fake.change({ connected: true }));
    t.board.setHass(t.fake.setState("calendar.us", "unavailable"));
    const asks = t.fake.asked.length;
    await t.fake.clock.advance(60 * S);
    assert.deepStrictEqual(t.fake.asked.slice(asks).map((a) => a.entity), ["calendar.will", "calendar.jenn"]);
    assert.deepStrictEqual(t.cal("calendar.us").failingSince, t.at(60 * S));
    t.board.stop();
  }

  // ---- The to-do lists: each one's items as Home Assistant sends them ----
  {
    const NOTE = item("n1", "Call the vet", { due: "2026-11-02" });
    const NOTE_2 = item("n2", "Return the library books");
    const DINNER = item("m1", "Tacos", { due: "2026-11-02", description: '{"block":2}' });
    // A house reminder as the sync writes it (#127): the label, its real day, its ID first in the description.
    const REMINDER = item("h1", "Test the porch light timer", { due: "2026-10-30", description: "R990" });
    const config = { ...CONFIG, lists: { notes: "todo.us_notes", meals: "todo.meal_plan", house: "todo.house_reminders" } };
    const t = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] }, todos: { "todo.us_notes": [NOTE], "todo.meal_plan": [DINNER], "todo.house_reminders": [] } }, config);
    assert.deepStrictEqual(t.fake.subscriptions.map((s) => s.msg), [
      { type: "todo/item/subscribe", entity_id: "todo.us_notes" },
      { type: "todo/item/subscribe", entity_id: "todo.meal_plan" },
      { type: "todo/item/subscribe", entity_id: "todo.house_reminders" },
    ], "one subscription per list named");
    assert.deepStrictEqual(t.last().lists, { notes: null, meals: null, house: null }, "nothing known before a list answers");
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(t.last().lists, { notes: [NOTE], meals: [DINNER], house: [] }, "items as sent; an empty House reminders list is a known empty list: nothing due");
    const shown = t.seen.length;
    const TICKED = { ...NOTE, status: "completed", completed: "2026-11-02T08:05:00-05:00" };
    t.fake.pushItems("todo.us_notes", [TICKED, NOTE_2]);
    assert.deepStrictEqual(t.last().lists.notes, [TICKED, NOTE_2], "a change arrives");
    assert.strictEqual(t.seen.length, shown + 1, "in one snapshot");
    t.fake.pushItems("todo.us_notes", [TICKED, NOTE_2]); // Home Assistant pushes on every write of the list
    t.fake.pushItems("todo.us_notes", null);
    assert.strictEqual(t.seen.length, shown + 1, "the same items again, or no list, give no snapshot");
    t.fake.pushItems("todo.us_notes", [NOTE_2]);
    assert.deepStrictEqual(t.last().lists.notes, [NOTE_2], "an item goes");
    t.fake.pushItems("todo.house_reminders", [REMINDER]);
    assert.deepStrictEqual(t.last().lists.house, [REMINDER], "a reminder comes due");
    t.fake.pushItems("todo.house_reminders", []);
    assert.deepStrictEqual(t.last().lists, { notes: [NOTE_2], meals: [DINNER], house: [] }, "done and cleared: nothing due again, the other lists untouched");
    t.board.stop();
  }

  // ---- A refused subscription is asked again a minute later ----
  // Home Assistant refuses one while it's still starting after a restart, or
  // for an entity it doesn't know, and the wall may not reload for weeks.
  {
    const NOTE = item("n1", "Call the vet");
    const t = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] }, todos: { "todo.us_notes": [NOTE] } }, { ...CONFIG, lists: { notes: "todo.us_notes" } });
    t.fake.refuse("todo.us_notes"); // its answer comes on the fake clock, so this lands first
    await t.fake.clock.advance(59 * S);
    assert.strictEqual(t.last().lists.notes, null, "refused: nothing known yet");
    assert.strictEqual(t.fake.subscriptions.length, 1, "not asked again yet");
    await t.fake.clock.advance(1 * S);
    assert.strictEqual(t.fake.subscriptions.length, 2, "asked again at a minute");
    assert.deepStrictEqual(t.last().lists.notes, [NOTE], "and its items arrive");
    t.board.stop();
  }

  // ---- The weather by subscription, daily and hourly (borrow item 10) ----
  // Google Weather (#109): 10 days, each stamped 7 am local written in UTC,
  // and 24 hours from the hour under way, each with a chance of rain. Its
  // hours here run through the night the clocks fell back, so New York sees
  // two 1 am hours. The house forecast (#109; gaps.md call A22): 6 days
  // stamped 17:00 UTC, which is the next day in Sydney, and no chance of rain.
  {
    const HOUR = 60 * MIN;
    const iso = (ms) => new Date(ms).toISOString().replace(".000Z", "Z");
    const DAILY = Array.from({ length: 10 }, (_, i) => ({ datetime: `2026-11-${String(i + 1).padStart(2, "0")}T12:00:00Z`, condition: i === 1 ? "rainy" : "sunny", temperature: 60 - i, templow: 40 + i, precipitation_probability: i === 1 ? 80 : 0, precipitation: 0 }));
    const HOURLY = Array.from({ length: 24 }, (_, i) => ({ datetime: iso(Date.parse("2026-11-01T04:00:00Z") + i * HOUR), condition: "cloudy", temperature: 45 + (i % 5), precipitation_probability: i * 4, is_daytime: false }));
    const config = { ...CONFIG, weather: "weather.google_weather" };
    // Given out of order, the newest hour first.
    const t = start({ now: "2026-11-01T00:30:00-04:00", calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] }, states: { "weather.google_weather": "cloudy" }, forecasts: { "weather.google_weather": { daily: DAILY, hourly: [...HOURLY].reverse() } } }, config);
    assert.deepStrictEqual(t.fake.subscriptions.map((s) => s.msg), [
      { type: "weather/subscribe_forecast", entity_id: "weather.google_weather", forecast_type: "daily" },
      { type: "weather/subscribe_forecast", entity_id: "weather.google_weather", forecast_type: "hourly" },
    ]);
    assert.deepStrictEqual(t.last().weather, { condition: "cloudy", daily: null, hourly: null }, "the weather now, before its forecasts arrive");
    await t.fake.clock.advance(0);
    const { daily, hourly } = t.last().weather;
    const days = DAILY.map((d) => wall(new Date(d.datetime)).key);
    assert.deepStrictEqual(Object.keys(daily), days, "each day on its local day, in order");
    assert.deepStrictEqual(daily[days[1]], { condition: "rainy", high: 59, low: 41, rain: 80 }, "a rainy day with its chance of rain");
    assert.deepStrictEqual(daily[days[0]], { condition: "sunny", high: 60, low: 40, rain: 0 });
    assert.deepStrictEqual(hourly.map((h) => h.at.toISOString()), HOURLY.map((h) => new Date(h.datetime).toISOString()), "every hour kept, in time order, the repeated 1 am too");
    assert.deepStrictEqual(hourly[2], { at: new Date("2026-11-01T06:00:00Z"), condition: "cloudy", temperature: 47, rain: 8 });
    t.board.stop();

    const HOUSE_DAILY = Array.from({ length: 6 }, (_, i) => ({ datetime: `2026-11-${String(i + 2).padStart(2, "0")}T17:00:00+00:00`, condition: "partlycloudy", temperature: 55, templow: 41, precipitation: 0.4 }));
    const HOUSE_HOURLY = Array.from({ length: 48 }, (_, i) => ({ datetime: `${iso(Date.parse("2026-11-02T13:00:00Z") + i * HOUR).slice(0, 19)}+00:00`, condition: "rainy", temperature: 50, precipitation: 0.2 }));
    const h = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] }, states: { "weather.forecast_home": "rainy" }, forecasts: { "weather.forecast_home": { daily: HOUSE_DAILY, hourly: HOUSE_HOURLY } } }, { ...CONFIG, weather: "weather.forecast_home" });
    await h.fake.clock.advance(0);
    const house = h.last().weather;
    assert.deepStrictEqual(Object.keys(house.daily), HOUSE_DAILY.map((d) => wall(new Date(d.datetime)).key), "the house forecast's days on their local days");
    assert.deepStrictEqual(Object.values(house.daily)[0], { condition: "partlycloudy", high: 55, low: 41, rain: null }, "no chance of rain given: none");
    assert.strictEqual(house.hourly.length, 48);
    assert.deepStrictEqual(house.hourly[0], { at: new Date("2026-11-02T13:00:00Z"), condition: "rainy", temperature: 50, rain: null });
    h.board.stop();
  }

  // ---- An unavailable weather entity is no weather (#109) ----
  // A Google Weather outage turns the entity unavailable within 15 minutes,
  // then may push one null forecast; a board subscribing then gets null.
  {
    const DAY = { datetime: "2026-11-02T12:00:00Z", condition: "sunny", temperature: 58, templow: 41, precipitation_probability: 10 };
    const config = { ...CONFIG, weather: "weather.google_weather" };
    const empty = { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] };
    const t = start({ calendars: empty, states: { "weather.google_weather": "sunny" }, forecasts: { "weather.google_weather": { daily: [DAY, { condition: "sunny" }, { datetime: "soon", condition: "rainy" }, null], hourly: null } } }, config);
    await t.fake.clock.advance(0);
    const key = wall(new Date(DAY.datetime)).key;
    const today = { [key]: { condition: "sunny", high: 58, low: 41, rain: 10 } };
    assert.deepStrictEqual(t.last().weather.daily, today, "an entry that can't be placed costs only itself");
    assert.strictEqual(t.last().weather.hourly, null, "a null forecast on subscribing: none yet");
    t.board.setHass(t.fake.setState("weather.google_weather", "unavailable"));
    assert.strictEqual(t.last().weather, null, "unavailable: no weather");
    const shown = t.seen.length;
    t.fake.pushForecast("weather.google_weather", "daily", null);
    assert.strictEqual(t.seen.length, shown, "a null forecast gives no snapshot");
    t.board.setHass(t.fake.setState("weather.google_weather", "cloudy"));
    assert.deepStrictEqual(t.last().weather, { condition: "cloudy", daily: today, hourly: null }, "back: the last forecast until a new one comes");
    t.board.setHass(t.fake.setState("weather.google_weather", "unknown"));
    assert.strictEqual(t.last().weather, null, "unknown: no weather");
    t.board.stop();
    const missing = start({ calendars: empty }, config);
    assert.strictEqual(missing.last().weather, null, "named, but missing from Home Assistant: no weather");
    missing.board.stop();
  }

  // ---- A copy's report goes out once, and a failing one stays quiet (#111, #115) ----
  {
    const t = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] } });
    await t.fake.clock.advance(0);
    const reports = () => t.fake.sentOf("family_hub/copy_report");
    assert.deepStrictEqual(reports(), [], "the board sends none by itself: what to report is the card's");
    const shown = t.seen.length;
    const OPENED = { copy: "k3f9q2", label: "home, iPhone", open: [1180, 2410] };
    assert.strictEqual(await report(t.fake.hass, OPENED), undefined);
    assert.deepStrictEqual(reports(), [{ type: "family_hub/copy_report", ...OPENED }], "one message, as given");
    // Each of these resolves quietly: refused for a broken rule, a Family Hub
    // without the command, a callWS that throws, a dropped connection.
    const FAILED = { copy: "k3f9q2", label: "home, iPhone", error: "TypeError: day is undefined" };
    t.fake.commands["family_hub/copy_report"] = () => Promise.reject({ code: "invalid_format", message: "label too long" });
    await report(t.fake.hass, FAILED);
    delete t.fake.commands["family_hub/copy_report"];
    await report(t.fake.hass, FAILED);
    await report({ ...t.fake.hass, callWS: () => { throw new Error("not connected"); } }, FAILED);
    t.fake.lose();
    await report(t.fake.hass, FAILED);
    assert.strictEqual(reports().length, 4, "each sent once, never again");
    assert.strictEqual(t.seen.length, shown, "and nothing shows on the board");
    t.board.stop();
  }

  // ---- Guest mode and Board private: whether each switch is on ----
  {
    const config = { ...CONFIG, guest_mode: "input_boolean.guest_mode", board_private: "input_boolean.board_private" };
    const t = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] }, states: { "input_boolean.guest_mode": "on", "input_boolean.board_private": "off" } }, config);
    const switches = () => [t.last().guestMode, t.last().boardPrivate];
    assert.deepStrictEqual(switches(), [true, false], "Guest mode on, Board private off");
    t.board.setHass(t.fake.setState("input_boolean.guest_mode", "off"));
    t.board.setHass(t.fake.setState("input_boolean.board_private", "on"));
    assert.deepStrictEqual(switches(), [false, true], "each turned the other way");
    t.board.setHass(t.fake.setState("input_boolean.board_private", "unavailable"));
    assert.deepStrictEqual(switches(), [false, false], "a switch that isn't on is off");
    t.board.stop();
    const missing = start({ calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] } }, config);
    assert.deepStrictEqual([missing.last().guestMode, missing.last().boardPrivate], [false, false], "named, but missing from Home Assistant: off");
    missing.board.stop();
  }

  // ---- The range asked: local midnight today, for 42 days ----
  // The house's two nights included: 2026-11-01 began on summer time in New
  // York, and 2027-03-14 springs forward there.
  for (const [now, today] of [[local(2026, 11, 1, 23, 59, 30), "2026-11-01"], [local(2027, 3, 14, 12), "2027-03-14"], [local(2026, 11, 3, 0, 0, 10), "2026-11-03"]]) {
    const t = start({ now, calendars: { "calendar.will": [], "calendar.jenn": [], "calendar.us": [] } });
    await t.fake.clock.advance(0);
    const day = (iso) => [wall(new Date(iso)).key, wall(new Date(iso)).time];
    const get = t.fake.sentOf("family_hub/calendar_cache/get")[0];
    for (const range of [get, ...t.fake.asked, ...t.fake.sentOf("family_hub/calendar_cache/put")]) {
      assert.deepStrictEqual([day(range.start), day(range.end)], [[today, "00:00"], [keyPlus(today, 42), "00:00"]], `range at ${now}`);
    }
    // After midnight, the next ask moves on a day.
    await t.fake.clock.advance(24 * 60 * MIN);
    const moved = t.fake.asked[t.fake.asked.length - 1];
    assert.deepStrictEqual([day(moved.start), day(moved.end)], [[keyPlus(today, 1), "00:00"], [keyPlus(today, 43), "00:00"]], `a day after ${now}`);
    t.board.stop();
  }

  // ---- An answer over about 1 MB is drawn but not put ----
  {
    const LONG = ev("Planning day", "2026-11-04T09:00:00-05:00", "2026-11-04T17:00:00-05:00", { description: "x".repeat(1000 * 1000) });
    const t = start({ calendars: { "calendar.will": [LONG], "calendar.jenn": [DENTIST], "calendar.us": [] } });
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(t.titles("calendar.will"), ["Planning day"]);
    assert.deepStrictEqual(t.fake.sentOf("family_hub/calendar_cache/put").flatMap((m) => Object.keys(m.calendars)), ["calendar.jenn", "calendar.us"]);
    t.board.stop();
  }

  // ---- A new card on the same page keeps what the page knew ----
  // Home Assistant builds a new card on every reconnect (#110). A Home
  // Assistant restart empties the server's copy, so the page's own memory
  // is what keeps a failing calendar's events, and the time it began failing.
  {
    const copy = { "calendar.will": [DENTIST], "calendar.jenn": [BOOK_CLUB] };
    const t = start({ calendars: { "calendar.will": [DENTIST], "calendar.jenn": { fail: "Server error" }, "calendar.us": [] }, copy });
    await t.fake.clock.advance(5 * MIN);
    t.board.stop();
    delete copy["calendar.jenn"]; // Home Assistant restarted: the copy is empty for Jenn
    copy["calendar.will"] = [SOCCER]; // and another board sent Will's newer events
    t.fake.calendars["calendar.will"] = { never: true };
    const seen = [];
    const board = watch(t.fake.hass, CONFIG, (snapshot) => seen.push(snapshot), t.fake.clock);
    const cal = (entity) => seen[seen.length - 1].calendars.find((c) => c.entity === entity);
    assert.deepStrictEqual(cal("calendar.jenn").events.map((e) => e.summary), ["Book club"], "Jenn's last events stay");
    assert.deepStrictEqual(cal("calendar.jenn").failingSince, t.at(0), "and the time she began failing");
    assert.deepStrictEqual(cal("calendar.will").answeredAt, t.at(5 * MIN), "the last answer stays noted");
    await t.fake.clock.advance(0);
    assert.deepStrictEqual(cal("calendar.will").events.map((e) => e.summary), ["Soccer"], "the server's copy still beats the page's memory");
    assert.deepStrictEqual(cal("calendar.jenn").events.map((e) => e.summary), ["Book club"]);
    assert.deepStrictEqual(cal("calendar.jenn").failingSince, t.at(0));
    board.stop();
  }

  console.log("house board ha: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

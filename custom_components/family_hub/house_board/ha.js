// Owns: every call to Home Assistant, and the snapshot the board draws from.
// Leaves alone: what the board shows and says, and the page itself.
// Tested by: tests/test_house_board_ha.js, against tests/lib/fake_hass.js
//
// Calendars (#97): the server's calendar copy first (calendar_cache.py), then
// each calendar live over REST, a minute after its last answer, for as long
// as the card is on the page. Changed live answers go back to the copy. No
// subscriptions: iCloud's changes would come up to 15 minutes late.
// Lists and weather by subscription: Home Assistant pushes a list's items
// whenever it's written, and each forecast hourly (borrow item 10). The
// weather now and the two switches are read from hass.states.
// Reports (#111): report() sends one copy's open times and last error.

import { addDays, cleanEvents, dayKey, startOfDay } from "./when.js";

/**
 * The card's config, from the /house-board dashboard. Later tickets add to it here.
 * @typedef {object} BoardConfig
 * @property {Object<string, PersonConfig>} people  by name: "Will", "Jenn", "Us"
 * @property {CalendarConfig[]} calendars  every calendar the board reads, each one a person's
 * @property {string} [weather]  a weather entity: "weather.google_weather", or the house
 *   forecast "weather.forecast_home"
 * @property {{ notes?: string, meals?: string, house?: string }} [lists]  to-do entities
 * @property {string} [guest_mode]  the Guest mode input_boolean
 * @property {string} [board_private]  the Board private input_boolean
 * @property {string} [wall_user]  the wall's Home Assistant user id
 * @property {string} [week_card]  the week card's address, "/family-hub"
 */

/**
 * @typedef {object} PersonConfig
 * @property {string} color  one of the 12 colors by name, "Cornflower"
 * @property {string[]} [users]  the Home Assistant user ids who are this person
 */

/**
 * @typedef {object} CalendarConfig
 * @property {string} entity  "calendar.will"
 * @property {string} person  a name in people
 * @property {boolean} [work]  a work calendar, kept behind the scenes for hiding; default false
 * @property {"titles"|"block"|"none"} [detail]  how much shows; default "titles"
 * @property {string} [label]  a block's words, "At work"
 */

/**
 * What the board draws from. onChange gets a new one after every change. Later slices add to it here.
 * @typedef {object} Snapshot
 * @property {number} days  the calendars cover this many days from local midnight today
 *   (42: today and the 41 after). Count it from your own `now`, since a snapshot can be hours old at rest.
 * @property {CalendarState[]} calendars  one per calendar in the config, in its order
 * @property {{ notes: ListItem[]|null, meals: ListItem[]|null, house: ListItem[]|null }} lists
 *   each list in config.lists: null until it first answers, or when the config names none.
 *   `[]` is a known empty list; for House reminders, nothing due.
 * @property {Weather|null} weather  null when the config names none, or while its entity is
 *   unavailable, unknown or missing (how an outage shows, #109)
 * @property {boolean} guestMode  Guest mode is on; false when the config names none or it's missing
 * @property {boolean} boardPrivate  Board private is on; likewise
 */

/**
 * One calendar, with its config's defaults filled in.
 * @typedef {object} CalendarState
 * @property {string} entity
 * @property {string} person
 * @property {boolean} work
 * @property {"titles"|"block"|"none"} detail
 * @property {string|null} label
 * @property {object[]|null} events  in Home Assistant's calendar shape, through when.js's
 *   cleanEvents. null until the server's copy or a live answer gives some, so `[]` is a
 *   known empty calendar. A failing calendar keeps its last events, for as long as the page is open.
 * @property {Date|null} answeredAt  its last live answer on this page; null before the first
 * @property {Date|null} failingSince  when its asks began failing: an error, an answer that
 *   isn't a list, no answer in 30 s, or its entity unavailable or missing. null once it answers.
 */

/**
 * One to-do item, exactly as Home Assistant's todo/item/subscribe sends it (fields
 * it leaves empty are absent). The meal plan's are for meals.js's readMealPlan.
 * @typedef {object} ListItem
 * @property {string} uid
 * @property {string} summary
 * @property {"needs_action"|"completed"} status
 * @property {string} [due]  a day, "2026-11-03", or a date-time with its offset. A house
 *   reminder's is its real date, read as a house date (#127); an undated must has none.
 * @property {string} [description]  a meal's packed JSON; a house reminder's ID on its first line
 */

/**
 * The weather, with each forecast kept until the next arrives: read days and hours from your
 * own `now`. Temperatures are in Home Assistant's unit.
 * @typedef {object} Weather
 * @property {string} condition  now: the entity's state, "sunny", "clear-night"
 * @property {Object<string, WeatherDay>|null} daily  by local day key, "2026-11-03", in order;
 *   null until the first forecast. Google gives 10 days, the house forecast 6; a day not there has none.
 * @property {WeatherHour[]|null} hourly  in time order, from the hour under way when it came
 *   (Google gives 24, the house forecast 48); null until the first forecast.
 *
 * @typedef {object} WeatherDay
 * @property {string|null} condition  "rainy"; icons.js draws it and says whether it's rainy
 * @property {number|null} high
 * @property {number|null} low
 * @property {number|null} rain  the chance of rain, in percent; null when the entity gives none
 *
 * @typedef {object} WeatherHour
 * @property {Date} at  the hour's start
 * @property {string|null} condition
 * @property {number|null} temperature
 * @property {number|null} rain  as for a day
 */

/**
 * Starts reading what the board shows. onChange runs once at once,
 * with what this page already knows (nothing, on a fresh page), then after
 * every change. The card stops it when it leaves the page; Home Assistant
 * builds a new card on each reconnect, which starts it again.
 * @param {object} hass  Home Assistant's own hass object
 * @param {BoardConfig} config
 * @param {(snapshot: Snapshot) => void} onChange
 * @param {{ now(): number, setTimeout(fn: Function, ms: number): any, clearTimeout(id: any): void }} [clock]  for tests
 * @returns {{ setHass(hass: object): void, stop(): void }}
 */
export function watch(hass, config, onChange, clock = realClock) {
  if (!pages.has(hass.connection)) pages.set(hass.connection, new Map());
  const known = pages.get(hass.connection);
  const cals = (config.calendars || []).map((c) => {
    if (!known.has(c.entity)) known.set(c.entity, { events: null, json: null, doubt: false, answeredAt: null, failingSince: null });
    return {
      entity: c.entity,
      about: { entity: c.entity, person: c.person, work: Boolean(c.work), detail: c.detail || "titles", label: c.label || null },
      kept: known.get(c.entity), // what this page knows of it
      heard: false, // a live answer reached this card
      failures: 0, // in a row
      timer: null,
    };
  });
  // The entities whose state the board reads, from its config. The lists'
  // items come by subscription, so a list's own state (its count) isn't one.
  const ids = [...cals.map((c) => c.entity), config.weather, config.guest_mode, config.board_private].filter(Boolean);
  const items = {}; // each list's last items, by its name in LISTS
  const forecasts = {}; // the weather's last daily and hourly, as the snapshot gives them
  const ends = []; // what stop() undoes for each subscription
  let stopped = false;
  const emit = () =>
    onChange({
      days: DAYS,
      calendars: cals.map(({ about, kept }) => ({ ...about, events: kept.events, answeredAt: kept.answeredAt, failingSince: kept.failingSince })),
      lists: Object.fromEntries(LISTS.map((name) => [name, items[name] || null])),
      weather: weatherFrom(hass.states[config.weather], forecasts),
      guestMode: isOn(config.guest_mode),
      boardPrivate: isOn(config.board_private),
    });
  const isOn = (entity) => hass.states[entity]?.state === "on";
  const now = () => new Date(clock.now());
  const hold = (cal, raw, json = JSON.stringify(raw)) => {
    cal.kept.json = json; // as Home Assistant sent them
    cal.kept.events = cleanEvents(raw);
  };

  // One calendar's live ask. The next is armed once it settles: a minute
  // on, or after repeated failures 1, 2, 4, then every 8 minutes (call A1).
  // An unavailable entity has failed without asking.
  function ask(cal) {
    const range = askedRange(now());
    const { entity } = cal;
    const path = `calendars/${entity}?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`;
    const state = hass.states[entity];
    withTimeout(new Promise((resolve) => resolve(state && state.state !== "unavailable" ? hass.callApi("GET", path) : null)), clock)
      .then((raw) => stopped || (Array.isArray(raw) ? landed(cal, raw, range) : failed(cal)), () => stopped || failed(cal))
      .finally(() => {
        if (!stopped) cal.timer = clock.setTimeout(() => ask(cal), cal.failures ? BACKOFF[Math.min(cal.failures, BACKOFF.length) - 1] : EVERY);
      });
  }

  function failed(cal) {
    cal.failures++;
    if (cal.kept.failingSince) return;
    cal.kept.failingSince = now();
    emit();
  }

  // A live answer. An empty one over held events waits for the next ask to
  // agree before it's drawn or put (call A4), so one blank answer can't
  // empty the day on every copy of the board.
  function landed(cal, raw, range) {
    const { kept } = cal;
    const first = !cal.heard;
    const recovered = kept.failingSince !== null;
    kept.doubt = !raw.length && kept.events?.length > 0 && !kept.doubt;
    const json = JSON.stringify(raw);
    const changed = !kept.doubt && json !== kept.json;
    cal.heard = true;
    kept.answeredAt = now();
    kept.failingSince = null;
    cal.failures = 0;
    // A changed answer goes back to the server's copy as it came, unless
    // it's so big the message could drop the board's connection.
    if (changed) {
      hold(cal, raw, json);
      if (json.length < PUT_LIMIT) hass.callWS({ type: "family_hub/calendar_cache/put", ...range, calendars: { [cal.entity]: raw } }).catch(() => {});
    }
    if (changed || first || recovered) emit();
  }

  // The server's copy, for each calendar it holds that this card hasn't
  // heard live yet. It beats the page's memory: another board may have sent
  // newer events since.
  hass
    .callWS({ type: "family_hub/calendar_cache/get", entity_ids: cals.map((c) => c.entity), ...askedRange(now()) })
    .then((result) => {
      if (stopped) return;
      const found = (result && result.calendars) || {};
      for (const cal of cals) if (Array.isArray(found[cal.entity]) && !cal.heard) hold(cal, found[cal.entity]);
      emit();
    }, () => {});
  cals.forEach(ask);

  // One subscription, for a list or a forecast. take(event) keeps what it
  // can use and says whether it did; a push the
  // same as the last gives no snapshot. A refused subscription (Home
  // Assistant still starting, or an entity it doesn't know) is asked again a
  // minute later, since the wall may not reload for weeks.
  function follow(msg, take) {
    let last = null;
    let timer = null;
    ends.push(() => clock.clearTimeout(timer));
    const start = () =>
      hass.connection.subscribeMessage((event) => {
        const json = JSON.stringify(event);
        if (stopped || json === last || !take(event)) return;
        last = json;
        emit();
      }, msg).then(
        (unsub) => {
          const end = () => unsub().catch(() => {});
          if (stopped) end();
          else ends.push(end);
        },
        () => {
          if (!stopped) timer = clock.setTimeout(start, EVERY);
        },
      );
    start();
  }
  for (const name of LISTS) {
    const entity = (config.lists || {})[name];
    if (entity) follow({ type: "todo/item/subscribe", entity_id: entity }, (event) => Array.isArray(event.items) && (items[name] = event.items));
  }
  for (const type of config.weather ? FORECASTS : []) {
    const msg = { type: "weather/subscribe_forecast", entity_id: config.weather, forecast_type: type };
    follow(msg, (event) => Array.isArray(event.forecast) && (forecasts[type] = readForecast(type, event.forecast)));
  }
  emit();
  return {
    // Home Assistant hands the card a new hass on every state change in the
    // house. Only the board's own entities and a few keys give a snapshot
    // (borrow item 7, call A5); the next asks use the newest hass either way.
    setHass(next) {
      const prev = hass;
      hass = next;
      if (!stopped && (KEYS.some((key) => next[key] !== prev[key]) || ids.some((id) => next.states[id] !== prev.states[id]))) emit();
    },
    // Nothing that answers later lands: no snapshot, no put, no next ask,
    // and every subscription ends.
    stop() {
      stopped = true;
      for (const cal of cals) clock.clearTimeout(cal.timer);
      for (const end of ends) end();
    },
  };
}

/**
 * Sends one copy's report to Family Hub (`family_hub/copy_report`, #115), where a
 * session reads it. What to measure and when is the card's. A failure is
 * never seen: it resolves either way, and nothing is sent again.
 * @param {object} hass
 * @param {{ copy: string, label: string, open?: [number, number|null], error?: string }} fields
 *   copy: this copy's own id, 1 to 40 characters; label: where and what, up to 40, "home, iPhone";
 *   open: first content and all live, in ms from performance.now(), each 0 to 600,000, or all live null;
 *   error: the last error's text, cut to 300 by the server. A field out of bounds loses the whole report.
 * @returns {Promise<void>}
 */
export function report(hass, fields) {
  return new Promise((resolve) => resolve(hass.callWS({ type: "family_hub/copy_report", ...fields }))).then(
    () => {},
    () => {},
  );
}

// What each page knows of each calendar, by its Home Assistant connection
// (one for the page's life). Home Assistant builds a new card on every
// reconnect (#110), and a restart empties the server's copy, so this is
// what keeps a failing calendar's last events until the page reloads.
const pages = new WeakMap();

// Today and the days after it that the calendars are asked for.
const DAYS = 42;
const LISTS = ["notes", "meals", "house"]; // the snapshot's names for config.lists
const FORECASTS = ["daily", "hourly"];
const NO_WEATHER = new Set(["unavailable", "unknown"]);
const KEYS = ["locale", "themes", "user", "connected"];
const EVERY = 60 * 1000;
const TIMEOUT = 30 * 1000;
const PUT_LIMIT = 1000 * 1000; // characters, as the week card has it
const BACKOFF = [1, 2, 4, 8].map((minutes) => minutes * EVERY);

// Rule from Calendar Card Pro (MIT), src/utils/events.ts:2631-2638 at 75bf292:
// hass.callApi has no time limit of its own, and an ask that never settles
// would keep its calendar from ever being asked again.
function withTimeout(promise, clock) {
  let timer;
  const limit = new Promise((_, reject) => {
    timer = clock.setTimeout(() => reject(new Error("no answer in 30 s")), TIMEOUT);
  });
  return Promise.race([promise, limit]).finally(() => clock.clearTimeout(timer));
}

// From local midnight today, as the ISO strings Home Assistant takes.
function askedRange(now) {
  const from = startOfDay(now);
  return { start: from.toISOString(), end: addDays(from, DAYS).toISOString() };
}

// The weather now and its forecasts, or null while its entity is unavailable
// or missing: that's how a Google Weather outage shows (#109).
function weatherFrom(state, forecasts) {
  if (!state || NO_WEATHER.has(state.state)) return null;
  return { condition: state.state, daily: forecasts.daily || null, hourly: forecasts.hourly || null };
}

// A forecast in the snapshot's shape, each entry placed by the instant in its
// datetime (borrow item 10). Daily entries are keyed by their local day,
// where Google's 7 am stamps and the house forecast's 17:00 UTC ones both
// land. Hourly ones stay a list in time order: the night the clocks fall
// back has two 1 am hours. An entry with no time costs only itself.
function readForecast(type, list) {
  const placed = list
    .map((f) => ({ at: new Date(f && typeof f.datetime === "string" ? f.datetime : NaN), f }))
    .filter(({ at }) => !isNaN(at))
    .sort((a, b) => a.at - b.at);
  const rain = (f) => num(f.precipitation_probability);
  const condition = (f) => f.condition ?? null;
  if (type === "hourly") return placed.map(({ at, f }) => ({ at, condition: condition(f), temperature: num(f.temperature), rain: rain(f) }));
  return Object.fromEntries(placed.map(({ at, f }) => [dayKey(at), { condition: condition(f), high: num(f.temperature), low: num(f.templow), rain: rain(f) }]));
}
const num = (value) => (typeof value === "number" ? value : null);

const realClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

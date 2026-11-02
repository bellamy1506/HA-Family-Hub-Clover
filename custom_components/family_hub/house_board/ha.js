// Owns: every call to Home Assistant, and the snapshot the board draws from.
// Leaves alone: what the board shows and says, and the page itself.
// Tested by: tests/test_house_board_ha.js, against tests/lib/fake_hass.js
//
// Calendars (#97): the server's calendar copy first (calendar_cache.py), then
// each calendar live over REST, a minute after its last answer, for as long
// as the card is on the page. Changed live answers go back to the copy. No
// subscriptions: iCloud's changes would come up to 15 minutes late.

import { addDays, cleanEvents, startOfDay } from "./when.js";

/**
 * The card's config, from the /house-board dashboard. Later tickets add to it here.
 * @typedef {object} BoardConfig
 * @property {Object<string, PersonConfig>} people  by name: "Will", "Jenn", "Us"
 * @property {CalendarConfig[]} calendars  every calendar the board reads, each one a person's
 * @property {string} [weather]  a weather entity, "weather.forecast_home"
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
 * What the board draws from. onChange gets a new one after every change. Later tickets add to it here.
 * @typedef {object} Snapshot
 * @property {number} days  the calendars cover this many days from local midnight today
 *   (42: today and the 41 after). Count it from your own `now`, since a snapshot can be hours old at rest.
 * @property {CalendarState[]} calendars  one per calendar in the config, in its order
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
 * Starts reading the calendars for the board. onChange runs once at once,
 * with nothing loaded, then after every change; the card stops it when it
 * leaves the page, and Home Assistant builds a new card on each reconnect.
 * @param {object} hass  Home Assistant's own hass object
 * @param {BoardConfig} config
 * @param {(snapshot: Snapshot) => void} onChange
 * @param {{ now(): number, setTimeout(fn: Function, ms: number): any, clearTimeout(id: any): void }} [clock]  for tests
 * @returns {{ setHass(hass: object): void, stop(): void }}
 */
export function watch(hass, config, onChange, clock = realClock) {
  const cals = (config.calendars || []).map((c) => ({
    shown: {
      entity: c.entity,
      person: c.person,
      work: Boolean(c.work),
      detail: c.detail || "titles",
      label: c.label || null,
      events: null,
      answeredAt: null,
      failingSince: null,
    },
    json: null, // the events held, as Home Assistant sent them
    failures: 0, // in a row
    doubt: false, // the last answer was empty over held events
    timer: null,
  }));
  // The entities the board reads, from its config.
  const lists = Object.values(config.lists || {});
  const ids = [...cals.map((c) => c.shown.entity), config.weather, ...lists, config.guest_mode, config.board_private].filter(Boolean);
  let stopped = false;
  const emit = () => onChange({ days: DAYS, calendars: cals.map((c) => ({ ...c.shown })) });
  const now = () => new Date(clock.now());
  const hold = (cal, raw, json = JSON.stringify(raw)) => {
    cal.json = json;
    cal.shown.events = cleanEvents(raw);
  };

  // One calendar's live ask. The next is armed once it settles: a minute
  // on, or after repeated failures 1, 2, 4, then every 8 minutes (call A1).
  // An unavailable entity has failed without asking.
  function ask(cal) {
    const range = askedRange(now());
    const { entity } = cal.shown;
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
    if (cal.shown.failingSince) return;
    cal.shown.failingSince = now();
    emit();
  }

  // A live answer. An empty one over held events waits for the next ask to
  // agree before it's drawn or put (call A4), so one blank answer can't
  // empty the day on every copy of the board.
  function landed(cal, raw, range) {
    const first = cal.shown.answeredAt === null;
    const recovered = cal.shown.failingSince !== null;
    cal.doubt = !raw.length && cal.shown.events?.length > 0 && !cal.doubt;
    const json = JSON.stringify(raw);
    const changed = !cal.doubt && json !== cal.json;
    cal.shown.answeredAt = now();
    cal.shown.failingSince = null;
    cal.failures = 0;
    // A changed answer goes back to the server's copy as it came, unless
    // it's so big the message could drop the board's connection.
    if (changed) {
      hold(cal, raw, json);
      if (json.length < PUT_LIMIT) hass.callWS({ type: "family_hub/calendar_cache/put", ...range, calendars: { [cal.shown.entity]: raw } }).catch(() => {});
    }
    if (changed || first || recovered) emit();
  }

  // The server's copy, for each calendar it holds that hasn't answered live.
  hass
    .callWS({ type: "family_hub/calendar_cache/get", entity_ids: cals.map((c) => c.shown.entity), ...askedRange(now()) })
    .then((result) => {
      if (stopped) return;
      const found = (result && result.calendars) || {};
      for (const cal of cals) if (Array.isArray(found[cal.shown.entity]) && cal.shown.answeredAt === null) hold(cal, found[cal.shown.entity]);
      emit();
    }, () => {});
  cals.forEach(ask);
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
    // Nothing that answers later lands: no snapshot, no put, no next ask.
    stop() {
      stopped = true;
      for (const cal of cals) clock.clearTimeout(cal.timer);
    },
  };
}

// Today and the days after it that the calendars are asked for.
const DAYS = 42;
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

const realClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

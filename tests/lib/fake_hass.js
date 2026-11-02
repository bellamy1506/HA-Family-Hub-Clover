// House board test helper: a stand-in for Home Assistant's `hass` object, in
// its own shape (callApi, callWS, connection.sendMessagePromise and
// subscribeMessage, states, user, themes, locale, connected), with a clock the
// test moves by hand. An ES module, so the browser page can load it too.
// Every answer comes from data the test gives; it is made up.
//
//   const fake = fakeHass({ now: "2026-11-02T08:00:00-05:00",
//     calendars: { "calendar.will": [event, ...] },   // what each live ask answers
//     copy: { "calendar.will": [event, ...] } });      // the server's calendar copy
//   watch(fake.hass, config, onChange, fake.clock);
//   await fake.clock.advance(0);                       // let answers due now land
//
// A calendar's answer can also be a plan, for every ask (set it in
// `calendars`) or for the next one only (`fake.next(entity, plan)`):
//   { events, after: 2000 }  answers late, by the fake clock
//   { fail: "Server error" } fails (with `after` too, if wanted)
//   { never: true }          never answers
// `events` may be anything, to answer with something that isn't a list.
// `watch` asks at once, so plan a first ask before starting the board.
//
// Subscriptions: `todos: { "todo.us_notes": [item, ...] }` and
// `forecasts: { "weather.home": { daily: [...], hourly: [...] } }` are what
// Home Assistant holds. A subscription answers on the fake clock, then pushes
// what's held at once, as Home Assistant does. An entity or forecast type not
// held is refused; `fake.refuse(entity)` refuses its next subscription only.
// `fake.pushItems(entity, items)` and `fake.pushForecast(entity, type, list)`
// push at once to every open subscription, and keep it for later ones.
// `family_hub/copy_report` answers null; `fake.lose()` drops the connection.
// fake.calendars and fake.copy are the objects given; change them as the
// test goes. Each fake is one page: its own connection, so ha.js's memory
// of a page never leaks between fakes.

// Lets every promise chain waiting on a settled promise run on (50 turns:
// ha.js's chains are a few deep).
async function settle() {
  for (let i = 0; i < 50; i++) await null;
}

// A clock with timers that run only when the test moves it.
export function fakeClock(start) {
  let now = new Date(start).getTime();
  let timers = [];
  let lastId = 0;
  return {
    now: () => now,
    setTimeout(fn, ms) {
      timers.push({ id: ++lastId, at: now + Math.max(0, ms || 0), fn });
      return lastId;
    },
    clearTimeout(id) {
      timers = timers.filter((t) => t.id !== id);
    },
    pending: () => timers.length,
    // Moves time on by ms, running each timer when its time comes, in order.
    async advance(ms) {
      const end = now + ms;
      await settle();
      for (;;) {
        const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
        if (!due) break;
        timers = timers.filter((t) => t !== due);
        now = due.at;
        due.fn();
        await settle();
      }
      now = end;
      await settle();
    },
  };
}

const copyOf = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

export function fakeHass({ now, calendars = {}, copy = {}, copyAfter = 0, states = {}, todos = {}, forecasts = {} } = {}) {
  const clock = fakeClock(now);
  const asked = []; // every live ask: { entity, start, end, at }
  const sent = []; // every websocket message the board sent
  const queued = {}; // one-off plans by calendar
  const subscriptions = []; // { msg, callback, closed }
  const refusals = {}; // one-off refused subscriptions, counted by entity
  let lost = false; // fake.lose(): the connection dropped
  const LOST = 3; // home-assistant-js-websocket's ERR_CONNECTION_LOST

  // After `ms` on the fake clock, settle with what `make` gives (or throws).
  const later = (ms, make) =>
    new Promise((resolve, reject) =>
      clock.setTimeout(() => {
        try {
          resolve(make());
        } catch (err) {
          reject(err);
        }
      }, ms),
    );

  function callApi(method, path) {
    const url = new URL(path, "http://fake/api/");
    const entity = decodeURIComponent(url.pathname.replace("/api/calendars/", ""));
    asked.push({ entity, start: url.searchParams.get("start"), end: url.searchParams.get("end"), at: clock.now() });
    const given = (queued[entity] || []).shift() || calendars[entity] || [];
    const plan = Array.isArray(given) ? { events: given } : given;
    if (plan.never) return new Promise(() => {});
    return later(plan.after, () => {
      if (plan.fail) throw new Error(plan.fail);
      return copyOf(plan.events);
    });
  }

  // Websocket commands by type; a test may add more.
  const commands = {
    "family_hub/calendar_cache/get": (msg) =>
      later(copyAfter, () => ({
        calendars: Object.fromEntries(msg.entity_ids.filter((id) => copy[id]).map((id) => [id, copyOf(copy[id])])),
      })),
    "family_hub/calendar_cache/put": () => Promise.resolve({}),
    "family_hub/copy_report": () => Promise.resolve(null),
  };
  function callWS(msg) {
    sent.push(copyOf(msg));
    if (lost) return Promise.reject(LOST);
    const command = commands[msg.type];
    return command ? command(msg) : Promise.reject({ code: "unknown_command", message: `Unknown command ${msg.type}` });
  }

  // What Home Assistant would push first for a subscription, or undefined.
  function held(msg) {
    if (msg.type === "todo/item/subscribe" && msg.entity_id in todos) return { items: copyOf(todos[msg.entity_id]) };
    const types = forecasts[msg.entity_id];
    if (msg.type === "weather/subscribe_forecast" && types && msg.forecast_type in types) return { type: msg.forecast_type, forecast: copyOf(types[msg.forecast_type]) };
  }
  const push = (match, event) => subscriptions.filter((s) => !s.closed && match(s.msg)).forEach((s) => s.callback(copyOf(event)));

  const connection = {
    sendMessagePromise: callWS,
    // Resolves to an unsubscribe that, like Home Assistant's, returns a
    // promise and ends the subscription only once the server answers (on the
    // fake clock), so a push can still come in between.
    subscribeMessage(callback, msg) {
      const sub = { msg: copyOf(msg), callback, closed: false };
      subscriptions.push(sub);
      return later(0, () => {
        const event = held(msg);
        const refused = refusals[msg.entity_id] > 0;
        if (refused) refusals[msg.entity_id]--;
        if (refused || event === undefined) {
          sub.closed = true;
          throw { code: "invalid_entity_id", message: `Not subscribed: ${msg.entity_id}` };
        }
        clock.setTimeout(() => sub.closed || callback(event), 0);
        return () =>
          later(0, () => {
            if (lost) throw LOST;
            sub.closed = true;
          });
      });
    },
  };

  const stateOf = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes });
  const fake = {
    clock,
    calendars, // change them as the test goes
    copy,
    asked,
    sent,
    commands,
    subscriptions,
    // Every message of one type the board sent.
    sentOf: (type) => sent.filter((m) => m.type === type),
    // Plans the next ask of one calendar.
    next(entity, plan) {
      (queued[entity] = queued[entity] || []).push(plan);
    },
    // The connection drops: what's sent from now on, websocket messages and
    // unsubscribes, rejects as a request out when the socket closes does.
    lose() {
      lost = true;
    },
    refuse(entity) {
      refusals[entity] = (refusals[entity] || 0) + 1;
    },
    pushItems(entity, items) {
      todos[entity] = items;
      push((m) => m.type === "todo/item/subscribe" && m.entity_id === entity, { items });
    },
    pushForecast(entity, type, forecast) {
      (forecasts[entity] = forecasts[entity] || {})[type] = forecast;
      push((m) => m.type === "weather/subscribe_forecast" && m.entity_id === entity && m.forecast_type === type, { type, forecast });
    },
    // A new hass object with one entity's state changed, as Home Assistant
    // hands a card after every state change. The other state objects stay.
    setState(entity, state, attributes) {
      return fake.change({ states: { ...fake.hass.states, [entity]: stateOf(entity, state, attributes) } });
    },
    // A new hass object with some of its keys replaced.
    change(keys) {
      fake.hass = { ...fake.hass, ...keys };
      return fake.hass;
    },
    hass: {
      callApi,
      callWS,
      connection,
      connected: true,
      states: {
        ...Object.fromEntries(Object.keys(calendars).map((id) => [id, stateOf(id, "off")])),
        ...Object.fromEntries(Object.entries(states).map(([id, state]) => [id, stateOf(id, state)])),
      },
      user: { id: "user-will", name: "Will", is_admin: true },
      themes: { darkMode: false, theme: "default", default_theme: "default", themes: {} },
      locale: { language: "en", number_format: "language", time_format: "12" },
    },
  };
  return fake;
}

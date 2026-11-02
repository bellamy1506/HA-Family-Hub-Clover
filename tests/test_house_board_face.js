// House board test: face.js, the wall's resting face.
// Run: node tests/test_house_board_face.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// Made-up household only. Snapshots are built by hand in ha.js's shape. Times
// are local wall times built with new Date(y, m - 1, d, h, min), so one
// expected answer holds in every zone; expected words are written out here,
// never computed the way face.js computes them.
const assert = require("assert");
const { faceModel, faceHtml } = require("../custom_components/family_hub/house_board/face.js");
const { personColors } = require("../custom_components/family_hub/house_board/theme.js");
const { icon, weatherIcon } = require("../custom_components/family_hub/house_board/icons.js");

const MINUTE = 60000;
const nov = (d, h = 0, min = 0) => new Date(2026, 10, d, h, min);
const timed = (summary, start, end, more = {}) => ({ summary, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, ...more });
const allDay = (summary, from, to) => ({ summary, start: { date: from }, end: { date: to } });
const cal = (entity, person, events, more = {}) => ({
  entity, person, work: false, detail: "titles", label: null, events, answeredAt: nov(3, 7), failingSince: null, ...more,
});
const item = (uid, summary, more = {}) => ({ uid, summary, status: "needs_action", due: null, description: null, completed: null, ...more });
const CONFIG = { people: { Will: { color: "Cornflower" }, Jenn: { color: "Vermillion" }, Us: { color: "Green" } } };

// The week from Tue Nov 3: Will at work Tuesday and Wednesday, a dentist and
// yoga Tuesday afternoon, Mom visiting Wednesday to Friday, a date night that
// overlaps Jenn's book club on Wednesday, and Will's trip from Friday.
function household(more = {}) {
  return {
    days: 42,
    calendars: [
      cal("calendar.will", "Will", [
        timed("Dentist", nov(3, 15, 30), nov(3, 16, 30)),
        timed("Oil change", nov(5, 9), nov(5, 10)),
        timed("Conference trip", nov(6, 9), nov(8, 17)),
      ]),
      cal("calendar.jenn", "Jenn", [
        timed("Yoga", nov(3, 17), nov(3, 18)),
        timed("Book club", nov(4, 19, 30), nov(4, 21)),
        timed("Haircut", nov(6, 17, 30), nov(6, 18, 30)),
      ]),
      cal("calendar.us", "Us", [
        timed("Plan holiday travel", nov(3, 19, 30), nov(3, 20, 15)),
        allDay("Mom visiting", "2026-11-04", "2026-11-07"),
        timed("Date night", nov(4, 19), nov(4, 21, 30)),
      ]),
      cal("calendar.work", "Will", [
        timed("Clinic", nov(3, 8, 30), nov(3, 12)),
        timed("Clinic", nov(3, 13), nov(3, 16, 30)),
        timed("Clinic", nov(4, 8, 30), nov(4, 16, 30)),
      ], { work: true, detail: "block", label: "At work" }),
    ],
    lists: { notes: [], meals: [], house: [item("r1", "Furnace filter check", { due: "2026-11-03" })] },
    weather: null,
    guestMode: false,
    boardPrivate: false,
    ...more,
  };
}
const rows = (day) => day.rows.map((r) => [r.time, r.who, r.title]);

// ---- Morning, 7:40 am: Next is Will's work; today's column holds the rest ----
{
  const model = faceModel(household(), CONFIG, nov(3, 7, 40));
  assert.deepStrictEqual(model.lead, { label: "Next · Will", time: "8:30 am", what: "At work", pick: "Cornflower", pale: false });
  assert.deepStrictEqual(model.days.map((d) => d.name), ["Today", "Wed 4", "Thu 5", "Fri 6"]);
  assert.deepStrictEqual(rows(model.days[0]), [
    ["3:30 pm", "Will", "Dentist"],
    ["5:00 pm", "Jenn", "Yoga"],
    ["7:30 pm", "Us", "Plan holiday travel"],
  ], "the Next plan isn't repeated in its column");
  assert.deepStrictEqual(rows(model.days[1]), [
    ["All day, until Fri Nov 6", "Us", "Mom visiting"],
    ["8:30 to 4:30", "Will", "At work"],
    ["7:00 pm", "Us", "Date night"],
    ["7:30 pm", "Jenn", "Book club"],
  ], "all-day items first; Work's labeled block reads its hours");
  assert.deepStrictEqual(rows(model.days[2]), [["All day, until Fri Nov 6", "Us", "Mom visiting"], ["9:00 am", "Will", "Oil change"]]);
  assert.deepStrictEqual(rows(model.days[3]), [
    ["All day, until Fri Nov 6", "Us", "Mom visiting"],
    ["9:00 am until Sun Nov 8 at 5:00 pm", "Will", "Conference trip"],
    ["5:30 pm", "Jenn", "Haircut"],
  ], "a trip says when it ends (call A9)");
  // Marks: icons from the word table, the clash mark, blocks and all-day items faint.
  const wed = model.days[1].rows;
  assert.deepStrictEqual(wed.map((r) => [r.allDay, r.faint, r.clash, r.icon, r.pick]), [
    [true, true, false, null, "Green"],
    [false, true, false, null, "Cornflower"],
    [false, false, true, null, "Green"],
    [false, false, true, null, "Vermillion"],
  ]);
  assert.deepStrictEqual(model.days[0].rows.map((r) => r.icon), ["tooth", null, "bag-suitcase"]);
  assert.ok(model.days.flatMap((d) => d.rows).every((r) => r.now === false && r.pale === false), "nothing under way at 7:40");
}

// ---- 3:10 pm: work under way leads today's column; the dentist is Next ----
{
  const model = faceModel(household(), CONFIG, nov(3, 15, 10));
  assert.deepStrictEqual(model.lead, { label: "Next · Will", time: "3:30 pm", what: "Dentist", pick: "Cornflower", pale: false }, "no icon on the Next line");
  assert.deepStrictEqual(model.days[0].rows.map((r) => [r.now, r.time, r.who, r.title]), [
    [true, "until 4:30", "Will", "At work"],
    [false, "5:00 pm", "Jenn", "Yoga"],
    [false, "7:30 pm", "Us", "Plan holiday travel"],
  ], "Now rows first, with their end");
  // Finished plans leave today's list: at 6:10 pm only the travel planning is left.
  const evening = faceModel(household(), CONFIG, nov(3, 18, 10));
  assert.deepStrictEqual(evening.lead.what, "Plan holiday travel");
  assert.deepStrictEqual(evening.days[0].rows, []);
  assert.strictEqual(evening.days[0].name, "Today", "no hand-off while a plan is still to come");
}

// ---- 8:50 pm: today is done, so the face turns to tomorrow ----
{
  const model = faceModel(household(), CONFIG, nov(3, 20, 50));
  assert.deepStrictEqual(model.lead, { label: "Tomorrow · Will", time: "8:30 am", what: "At work", pick: "Cornflower", pale: false });
  assert.deepStrictEqual(model.days.map((d) => d.name), ["Tomorrow", "Thu 5", "Fri 6", "Sat 7"]);
  assert.deepStrictEqual(rows(model.days[0]), [
    ["All day, until Fri Nov 6", "Us", "Mom visiting"],
    ["7:00 pm", "Us", "Date night"],
    ["7:30 pm", "Jenn", "Book club"],
  ]);
  assert.deepStrictEqual(rows(model.days[3]), [["until Sun Nov 8 at 5:00 pm", "Will", "Conference trip"]], "a part carried on from Friday reads as its end");
  // Nothing at all tomorrow: the band says so.
  const quiet = household();
  quiet.calendars = quiet.calendars.map((c) => ({ ...c, events: c.events.filter((e) => (e.start.date ? e.start.date < "2026-11-04" : new Date(e.start.dateTime) < nov(4))) }));
  assert.deepStrictEqual(faceModel(quiet, CONFIG, nov(3, 20, 50)).lead, { label: "", time: "", what: "Nothing tomorrow", pick: null, pale: false });
  // Under way, with nothing after it: a Now row, and nothing else today.
  const eight = faceModel(quiet, CONFIG, nov(3, 20));
  assert.deepStrictEqual([eight.lead.what, rows(eight.days[0])], ["Nothing else today", [["until 8:15", "Us", "Plan holiday travel"]]]);
}

// ---- Needs you: the wall shows the first item and "+N more" (#61 question 2) ----
{
  assert.deepStrictEqual(faceModel(household(), CONFIG, nov(3, 7, 40)).needs, { words: "Furnace filter check", more: 0 });
  // After the hand-off, tomorrow's clash comes first, then the reminder.
  const evening = faceModel(household(), CONFIG, nov(3, 20, 50));
  assert.deepStrictEqual(evening.needs, { words: "Tomorrow 7:30 pm: Date night (Us) overlaps Book club (Jenn)", more: 1 });
  // The rows the line names are never dropped when their column is full.
  assert.deepStrictEqual(evening.days[0].rows.map((r) => [r.title, r.keep]), [["Mom visiting", false], ["Date night", true], ["Book club", true]]);
  assert.ok(evening.days.slice(1).flatMap((d) => d.rows).every((r) => !r.keep));
  // Nothing qualifies: no line at all, and the space goes to the columns.
  const calm = faceModel(household({ lists: { notes: [], meals: [], house: [] } }), CONFIG, nov(3, 7, 40));
  assert.strictEqual(calm.needs, null);
  assert.ok(calm.days.flatMap((d) => d.rows).every((r) => !r.keep));
}

// ---- Next and needs-you wait until every calendar has answered or timed out (#97) ----
{
  const waiting = household();
  waiting.calendars[2] = { ...waiting.calendars[2], answeredAt: null }; // Us: the server's copy only, so far
  const held = faceModel(waiting, CONFIG, nov(3, 7, 40));
  assert.strictEqual(held.lead, null, "Next's box stays, empty");
  assert.strictEqual(held.needs, null);
  const settled = faceModel(household(), CONFIG, nov(3, 7, 40));
  assert.deepStrictEqual(held.days, settled.days, "the columns draw what's known, and the Next plan waits for its band");
  // Timed out counts as in: the band and the line come back.
  waiting.calendars[2] = { ...waiting.calendars[2], failingSince: nov(3, 7, 30) };
  assert.deepStrictEqual(faceModel(waiting, CONFIG, nov(3, 7, 40)).lead, settled.lead);
  assert.deepStrictEqual(faceModel(waiting, CONFIG, nov(3, 7, 40)).needs, settled.needs);
}

// ---- A quiet calendar (#103, owner): named after 10 minutes, paler after an hour ----
{
  const failing = household();
  failing.calendars[1] = { ...failing.calendars[1], answeredAt: nov(3, 9, 40), failingSince: nov(3, 9, 41) };
  const at = (min) => faceModel(failing, CONFIG, new Date(+nov(3, 9, 41) + min * MINUTE));
  const yoga = (model) => model.days[0].rows.find((r) => r.title === "Yoga");
  assert.deepStrictEqual(at(9).today.quiet, [], "9 minutes: no line yet");
  assert.deepStrictEqual(at(11).today.quiet, ["Jenn's calendar hasn't updated since 9:40 am"], "under the date and weather");
  assert.strictEqual(yoga(at(11)).pale, false, "her plans keep their color for the first hour");
  assert.deepStrictEqual(at(61).today.quiet, ["Jenn's calendar hasn't updated since 9:40 am"]);
  assert.strictEqual(yoga(at(61)).pale, true, "an hour: her plans pale");
  assert.ok(at(61).days[0].rows.filter((r) => r.who !== "Jenn").every((r) => !r.pale), "only hers");
  assert.ok(at(61).days.every((d) => d.missing.length === 0), "her last events are kept, so no day says it isn't loading");

  // Nothing kept (a restart emptied the server's copy): her days say so instead of looking free.
  const empty = household();
  empty.calendars[1] = { ...empty.calendars[1], events: null, answeredAt: null, failingSince: nov(3, 9, 41) };
  const model = faceModel(empty, CONFIG, nov(3, 9, 42));
  assert.deepStrictEqual(model.days.map((d) => d.missing), Array(4).fill(["Jenn's calendar isn't loading"]));
  assert.deepStrictEqual(model.today.quiet, [], "said on her days, not twice");
}

// ---- Weather: an icon beside each day's high and low, the chance under a rainy day (#104) ----
{
  const hour = (h, condition) => ({ at: nov(3, h), condition, temperature: 50, rain: null });
  const weather = {
    condition: "cloudy",
    daily: {
      "2026-11-03": { condition: "sunny", high: 58.4, low: 41, rain: 10 },
      "2026-11-04": { condition: "rainy", high: 55, low: 44, rain: 80 },
      "2026-11-05": { condition: "pouring", high: 52, low: 40, rain: null }, // the house forecast gives no chance
      // Friday is past the forecast's reach.
      "2026-11-07": { condition: "cloudy", high: 60, low: 45, rain: 20 },
    },
    hourly: [6, 7, 8, 9, 10, 11, 12, 13].map((h) => hour(h, "cloudy")).concat([14, 15, 16, 17, 18, 19, 20].map((h) => hour(h, "rainy")), [hour(21, "cloudy")]),
  };
  const morning = faceModel(household({ weather }), CONFIG, nov(3, 7, 40));
  assert.deepStrictEqual(morning.today, { date: "Tue Nov 3", weather: { condition: "sunny", high: "58°", low: "41°" }, rain: "Rain from 2 pm", quiet: [] });
  assert.deepStrictEqual(morning.days.map((d) => d.weather), [
    { condition: "sunny", high: "58°", low: "41°", chance: null },
    { condition: "rainy", high: "55°", low: "44°", chance: "80%" },
    { condition: "pouring", high: "52°", low: "40°", chance: null },
    null,
  ]);
  assert.strictEqual(faceModel(household({ weather }), CONFIG, nov(3, 15, 10)).today.rain, "Rain until 9 pm");
  // After the hand-off the columns move on a day; Saturday has weather again.
  assert.deepStrictEqual(faceModel(household({ weather }), CONFIG, nov(3, 20, 50)).days.map((d) => d.weather && d.weather.condition), ["rainy", "pouring", null, "cloudy"]);
  // No weather entity, or it's unavailable: no weather anywhere.
  const none = faceModel(household(), CONFIG, nov(3, 7, 40));
  assert.deepStrictEqual([none.today.weather, none.today.rain], [null, null]);
  assert.ok(none.days.every((d) => d.weather === null));
}

// ---- Notes as they fall (switch-over plan, Slice 1): open notes on their day, no Later line ----
{
  const notes = [
    item("n1", "Buy cat litter"), // no day: today
    item("n2", "Call about the gutter quote", { due: "2026-11-01" }), // past its day: the week card's rollover keeps it on today
    item("n3", "Sign the permission form", { due: nov(3, 9).toISOString() }), // a week card note with its 9:00 time
    item("n4", "Change the smoke alarm batteries", { due: "2026-11-05" }),
    item("n5", "Return library books", { status: "completed" }),
    item("n6", "Renew passports", { due: "2026-11-20" }), // past the four columns: not until slice 3's Later
  ];
  const snapshot = household({ lists: { notes, meals: [], house: [] } });
  assert.deepStrictEqual(faceModel(snapshot, CONFIG, nov(3, 7, 40)).days.map((d) => d.notes), [
    ["Buy cat litter", "Call about the gutter quote", "Sign the permission form"], [], ["Change the smoke alarm batteries"], [],
  ]);
  // After the hand-off they sit at the top of tomorrow's column: still open
  // tomorrow morning, they'd show on today's then (the call in face.js).
  assert.deepStrictEqual(faceModel(snapshot, CONFIG, nov(3, 20, 50)).days.map((d) => d.notes), [
    ["Buy cat litter", "Call about the gutter quote", "Sign the permission form"], ["Change the smoke alarm batteries"], [], [],
  ]);
  // The notes list not answered yet, or not named: no notes.
  assert.ok(faceModel(household({ lists: { notes: null, meals: null, house: null } }), CONFIG, nov(3, 7, 40)).days.every((d) => d.notes.length === 0));
}

// ---- Meals: dinner always; breakfast and lunch only when filled (owner, 2026-10-29) ----
{
  const meal = (uid, summary, due, block) => item(uid, summary, { due, description: JSON.stringify({ block }) });
  const meals = [
    meal("m1", "Salmon, rice and green beans", "2026-11-03", 2),
    meal("m2", "Out for date night", "2026-11-04", 2),
    meal("m3", "Pancakes", "2026-11-05", 0),
  ];
  assert.deepStrictEqual(faceModel(household({ lists: { notes: [], meals, house: [] } }), CONFIG, nov(3, 7, 40)).days.map((d) => d.meals), [
    [{ slot: "Dinner", meal: "Salmon, rice and green beans" }],
    [{ slot: "Dinner", meal: "Out for date night" }],
    [{ slot: "Breakfast", meal: "Pancakes" }, { slot: "Dinner", meal: "Not planned" }],
    [{ slot: "Dinner", meal: "Not planned" }],
  ]);
  // Before the meal list answers, dinner's box is kept, empty.
  assert.deepStrictEqual(faceModel(household({ lists: { notes: [], meals: null, house: [] } }), CONFIG, nov(3, 7, 40)).days[0].meals, [{ slot: "Dinner", meal: "" }]);
}

// ---- The markup: text stays text, and the parts the card redraws one at a time ----
{
  const hostile = '<img src=x onerror="alert(1)">';
  const snapshot = household({ lists: { notes: [item("n1", "<script>alert(2)</script>")], meals: [item("m1", '"><b>bold</b>', { due: "2026-11-03", description: '{"block":2}' })], house: [] } });
  snapshot.calendars[0].events.push(timed(hostile, nov(3, 11), nov(3, 11, 30)));
  const out = String(faceHtml(faceModel(snapshot, CONFIG, nov(3, 7, 40))));
  for (const bad of ["<img", "<script", "<b>"]) assert.ok(!out.includes(bad), `${bad} comes out as text`);
  assert.ok(out.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"), "the title is still shown");
  assert.ok(out.includes("&lt;script&gt;alert(2)&lt;/script&gt;") && out.includes("&quot;&gt;&lt;b&gt;bold&lt;/b&gt;"));

  // Each part is a leaf the card can compare and replace on its own (#72):
  // the clock ticks alone.
  const parts = [...out.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(parts, ["lead", "clock", "today", "needs", "day-0", "day-1", "day-2", "day-3"]);
  assert.strictEqual((out.match(/data-fit/g) || []).length, 4, "each column's list is the card's to fit, with +N more");
  assert.strictEqual((out.match(/data-shrink/g) || []).length, 1, "the Next line is the card's to shrink");
}
{
  // After the hand-off: the clash's two rows are kept, and the line counts the rest.
  const out = String(faceHtml(faceModel(household(), CONFIG, nov(3, 20, 50))));
  assert.strictEqual((out.match(/data-keep/g) || []).length, 2);
  assert.ok(out.includes("Tomorrow 7:30 pm: Date night (Us) overlaps Book club (Jenn)") && out.includes("+1 more"));
  assert.ok(out.includes(String(icon("set-center", "overlaps"))), "the clash mark, named for a screen reader");
  // 3:10 pm: Now leads its row; colors come from theme.js, work's block faint.
  const now = String(faceHtml(faceModel(household(), CONFIG, nov(3, 15, 10))));
  assert.match(now, />Now</);
  const jenn = personColors("Vermillion", "light");
  const will = personColors("Cornflower", "light");
  assert.ok(now.includes(`--bar: ${jenn.bar}; --fill: ${jenn.block}; --text: ${jenn.text}`), "Yoga in Jenn's block");
  assert.ok(now.includes(`--bar: ${will.bar}; --fill: ${will.faint};`), "At work in Will's faint block");
  assert.ok(now.includes(String(icon("tooth"))) === false, "the dentist is on the Next line, which has no icon");
  assert.ok(now.includes(String(icon("bag-suitcase"))), "an icon at a row's right");
  // A quiet hour pales Jenn's blocks.
  const failing = household();
  failing.calendars[1] = { ...failing.calendars[1], answeredAt: nov(3, 13), failingSince: nov(3, 14) };
  const pale = String(faceHtml(faceModel(failing, CONFIG, nov(3, 15, 10))));
  assert.ok(pale.includes(`--fill: ${personColors("Vermillion", "light", true).block};`));
  assert.ok(pale.includes("Jenn&#39;s calendar hasn&#39;t updated since 1:00 pm"));
}
{
  // Held: Next's box is drawn empty and needs-you takes no room.
  const waiting = household();
  waiting.calendars[2] = { ...waiting.calendars[2], answeredAt: null };
  const out = String(faceHtml(faceModel(waiting, CONFIG, nov(3, 7, 40))));
  assert.match(out, /<div class="lead" data-part="lead"><\/div>/);
  assert.match(out, /<div class="needs" data-part="needs"><\/div>/);
  // Weather, the rain line and the chance; notes with their open circle; dinner.
  const weather = { condition: "rainy", daily: { "2026-11-04": { condition: "rainy", high: 55, low: 44, rain: 80 } }, hourly: [{ at: nov(3, 14), condition: "rainy", temperature: 50, rain: 70 }] };
  const full = String(faceHtml(faceModel(household({ weather, lists: { notes: [item("n1", "Buy cat litter")], meals: null, house: [] } }), CONFIG, nov(3, 7, 40))));
  assert.ok(full.includes(String(weatherIcon("rainy"))) && full.includes("55°") && full.includes("80%") && full.includes("Rain from 2 pm"));
  assert.match(full, /class="ring"><\/span><span class="tt">Buy cat litter</);
  assert.match(full, />Dinner</);
  assert.match(full, />7:40<small>am<\/small></, "the minute clock");
}

// ---- At rest: the same input gives the same model, and only the minute moves (#72) ----
{
  const snapshot = household();
  const model = faceModel(snapshot, CONFIG, nov(3, 9));
  assert.deepStrictEqual(faceModel(snapshot, CONFIG, nov(3, 9)), model);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(model)), model, "plain data the card can compare: no Dates, no plans");
  assert.strictEqual(String(faceHtml(model)), String(faceHtml(faceModel(snapshot, CONFIG, nov(3, 9)))));
  // Every minute of a quiet hour changes the clock and nothing else.
  for (let min = 1; min < 60; min++) {
    const later = faceModel(snapshot, CONFIG, nov(3, 9, min));
    assert.deepStrictEqual({ ...later, clock: "" }, { ...model, clock: "" }, `9:${min}`);
    assert.strictEqual(later.clock, `9:${String(min).padStart(2, "0")} am`);
  }
  // And its markup differs only inside the clock's part.
  const a = String(faceHtml(model));
  const b = String(faceHtml(faceModel(snapshot, CONFIG, nov(3, 9, 1))));
  assert.notStrictEqual(a, b);
  assert.strictEqual(a.replace(">9:00<small>", ">X<small>"), b.replace(">9:01<small>", ">X<small>"));
  // The snapshot isn't changed by drawing it.
  assert.deepStrictEqual(snapshot, household());
}

// ---- Guest mode at the wall: each adult's own plans are blocks, Work hides, shared plans keep titles ----
{
  const model = faceModel(household({ guestMode: true }), CONFIG, nov(3, 7, 40));
  assert.deepStrictEqual(model.lead, { label: "Next · Will", time: "3:30 to 4:30", what: "", pick: "Cornflower", pale: false }, "a block reads as its name and hours");
  assert.deepStrictEqual(model.days[0].rows.map((r) => [r.time, r.who, r.title, r.faint, r.icon]), [
    ["5:00 to 6:00", "Jenn", null, true, null],
    ["7:30 pm", "Us", "Plan holiday travel", false, "bag-suitcase"],
  ]);
  assert.ok(!String(faceHtml(model)).includes("Dentist") && !String(faceHtml(model)).includes("Yoga"), "no hidden title anywhere");
}

console.log("house board face: all checks passed");

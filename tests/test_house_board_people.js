// House board test: people.js, whose each plan is and how it shows.
// Run: node tests/test_house_board_people.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// Made-up plans only. Snapshots are built by hand in ha.js's shape, with the
// fields #118 adds (lists, guestMode, boardPrivate). Times are local wall
// times built with new Date(y, m - 1, d, h, min), so one expected answer holds
// in every zone; expected values are written out here, never computed the way
// people.js computes them. 2026-11-01 is the night the clocks fell back.
const assert = require("assert");
const { readPlans } = require("../custom_components/family_hub/house_board/people.js");
const { icon } = require("../custom_components/family_hub/house_board/icons.js");

const MINUTE = 60000;
const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
// A local time in November 2026.
const nov = (d, h = 0, min = 0) => local(2026, 11, d, h, min);
const NOW = nov(3, 10); // Tue Nov 3, 10:00 am
const timed = (summary, start, end, more = {}) => ({ summary, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, ...more });
const allDay = (summary, from, to, more = {}) => ({ summary, start: { date: from }, end: { date: to }, ...more });
const cal = (entity, person, events, more = {}) => ({
  entity, person, work: false, detail: "titles", label: null, events, answeredAt: NOW, failingSince: null, ...more,
});
const snap = (calendars, more = {}) => ({
  days: 42, calendars, lists: { notes: null, meals: null, house: null }, guestMode: false, boardPrivate: false, weather: null, ...more,
});
// A plan's times as local Dates, whatever spelling its start and end use.
const when = (plan) => [plan.start, plan.end].map((t) => (t.dateTime ? new Date(t.dateTime) : t.date));
const titles = (board) => board.plans.map((p) => p.title);

// ---- Every calendar is a person's; each calendar shows titles, a labeled block, or nothing ----
{
  const work = cal("calendar.work", "Will", [
    timed("Standup", nov(3, 8, 30), nov(3, 9)),
    timed("Clinic", nov(3, 9), nov(3, 12)),
    timed("Clinic", nov(3, 13), nov(3, 16, 30)), // a 60-minute lunch gap keeps one block
    timed("Clinic", nov(4, 8), nov(4, 12)),
    timed("Clinic", nov(4, 13, 1), nov(4, 17)), // a 61-minute gap splits it
    allDay("Conference", "2026-11-06", "2026-11-07"),
  ], { work: true, detail: "block", label: "At work" });
  const dentistEvent = timed("Dentist", nov(3, 15, 30), nov(3, 16, 30));
  const board = readPlans(snap([
    cal("calendar.will", "Will", [dentistEvent]),
    cal("calendar.jenn", "Jenn", [timed("Book club", nov(3, 19), nov(3, 21))], { detail: "none" }),
    cal("calendar.us", "Us", null), // not answered yet: nothing to show, nothing thrown
    work,
  ]), NOW, true);

  // Sorted by start, all-day first on its day. Jenn's calendar shows nothing.
  assert.deepStrictEqual(titles(board), [null, "Dentist", null, null, null], "Jenn's nothing, Work's blocks, Will's titles");
  const [day3, dentist, day4am, day4pm, conference] = board.plans;
  assert.deepStrictEqual(when(day3), [nov(3, 8, 30), nov(3, 16, 30)], "Work's Tuesday is one block, 8:30 to 4:30");
  assert.deepStrictEqual(when(day4am), [nov(4, 8), nov(4, 12)], "a gap over an hour splits it");
  assert.deepStrictEqual(when(day4pm), [nov(4, 13, 1), nov(4, 17)], "the afternoon block");
  assert.deepStrictEqual(when(conference), ["2026-11-06", "2026-11-07"], "an all-day event on a block calendar stays all day");
  for (const block of [day3, day4am, day4pm, conference]) {
    assert.deepStrictEqual([block.person, block.who, block.title, block.label, block.work], ["Will", "Will", null, "At work", true], "Work shows as Will's labeled block");
  }
  assert.strictEqual(conference.allDay, true);
  assert.strictEqual(day3.allDay, false);
  // The block keeps the events behind it, as fetched.
  assert.deepStrictEqual(day3.sources.map((s) => [s.entity, s.event.summary]), [["calendar.work", "Standup"], ["calendar.work", "Clinic"], ["calendar.work", "Clinic"]]);

  assert.deepStrictEqual([dentist.person, dentist.who, dentist.title, dentist.label, dentist.work, dentist.allDay], ["Will", "Will", "Dentist", null, false, false]);
  assert.deepStrictEqual(when(dentist), [nov(3, 15, 30), nov(3, 16, 30)]);
  assert.strictEqual(dentist.sources.length, 1);
  assert.strictEqual(dentist.sources[0].entity, "calendar.will");
  assert.strictEqual(dentist.sources[0].event, dentistEvent, "the event as fetched, for writing back");
}

// A block that runs past midnight is a block on each day.
{
  const board = readPlans(snap([
    cal("calendar.work", "Will", [timed("Night shift", nov(3, 22), nov(4, 2))], { work: true, detail: "block", label: "At work" }),
  ]), NOW, true);
  assert.deepStrictEqual(board.plans.map(when), [[nov(3, 22), nov(4, 0)], [nov(4, 0), nov(4, 2)]], "cut at local midnight");
}

// ---- A plan on two calendars shows once, as Us with both names ----
// Matched by uid and start first, then by title (ignoring case, punctuation
// and spacing) with the same start and end, compared as instants
// (#61 question 1, #66; borrow item 12).

// The same instant spelled with another UTC offset, as another integration might send it.
const spelled = (date, offsetMinutes) => {
  const shifted = new Date(date.getTime() + offsetMinutes * MINUTE).toISOString().slice(0, 19);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return `${shifted}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};
{
  const board = readPlans(snap([
    cal("calendar.will", "Will", [
      timed("Dinner w/ Sam", nov(4, 19), nov(4, 21), { uid: "dinner-1" }),
      timed("Parent-teacher night", nov(5, 18), nov(5, 19)),
      timed("Gym", nov(6, 7), nov(6, 8)), // a near match: Jenn's ends later, so both show
      timed("Standup", nov(9, 9), nov(9, 9, 15), { uid: "standup" }),
      timed("Standup", nov(10, 9), nov(10, 9, 15), { uid: "standup" }), // a repeat: same uid, its own start
      allDay("Anniversary", "2026-11-07", "2026-11-08"),
      timed("Anniversary", nov(7, 0), nov(8, 0)), // timed at midnight is not the all-day one
    ]),
    cal("calendar.jenn", "Jenn", [
      timed("Dinner with Sam and Alex", nov(4, 19), nov(4, 22), { uid: "dinner-1" }), // same uid and start; ends later
      { summary: "  parent teacher NIGHT! ", start: { dateTime: spelled(nov(5, 18), -300) }, end: { dateTime: spelled(nov(5, 19), 600) } },
      timed("Gym", nov(6, 7), nov(6, 8, 30)),
      allDay("anniversary", "2026-11-07", "2026-11-08"),
    ]),
  ]), NOW, true);
  assert.deepStrictEqual(titles(board), ["Dinner w/ Sam", "Parent-teacher night", "Gym", "Gym", "Anniversary", "Anniversary", "Standup", "Standup"]);
  const [dinner, meeting, gymWill, gymJenn, anniversary, midnight] = board.plans;
  for (const shared of [dinner, meeting, anniversary]) {
    assert.deepStrictEqual([shared.person, shared.who], ["Us", "Will, Jenn"], `${shared.title} is shared`);
    assert.deepStrictEqual(shared.sources.map((s) => s.entity), ["calendar.will", "calendar.jenn"], "both calendars kept behind it");
  }
  assert.deepStrictEqual(when(dinner), [nov(4, 19), nov(4, 22)], "a merged plan runs to its latest end, so an ended copy can't end it");
  assert.strictEqual(anniversary.allDay, true);
  assert.deepStrictEqual([midnight.allDay, midnight.who], [false, "Will"]);
  assert.deepStrictEqual([gymWill.who, gymJenn.who], ["Will", "Jenn"], "near matches show twice");
}

// An Us copy makes the plan Us; both Us calendars are Us; two of one person's calendars stay that person's.
{
  const board = readPlans(snap([
    cal("calendar.will", "Will", [timed("Movie", nov(4, 20), nov(4, 22)), timed("Haircut", nov(5, 12), nov(5, 13))]),
    cal("calendar.work", "Will", [timed("Haircut", nov(5, 12), nov(5, 13)), timed("Review", nov(5, 15), nov(5, 16))], { work: true, detail: "block", label: "At work" }),
    cal("calendar.us", "Us", [timed("movie", nov(4, 20), nov(4, 22)), timed("Brunch", nov(8, 10), nov(8, 11))]),
    cal("calendar.home", "Us", [timed("Brunch", nov(8, 10), nov(8, 11)), timed("Vet", nov(9, 9), nov(9, 10))]),
  ]), NOW, true);
  const plan = (title) => board.plans.find((p) => p.title === title);
  assert.deepStrictEqual([plan("Movie").person, plan("Movie").who], ["Us", "Us"], "on Us and Will's: Us");
  assert.deepStrictEqual([plan("Brunch").person, plan("Brunch").who, plan("Brunch").sources.length], ["Us", "Us", 2], "calendar.us and the iCloud Us are one person");
  assert.deepStrictEqual([plan("Vet").person, plan("Vet").who], ["Us", "Us"]);
  // A plan on Will's own calendar and on Work shows once, as Will's, with its title;
  // Work's block is drawn from Work's other events.
  assert.deepStrictEqual([plan("Haircut").who, plan("Haircut").work, plan("Haircut").sources.length], ["Will", false, 2]);
  const blocks = board.plans.filter((p) => p.title === null);
  assert.deepStrictEqual(blocks.map(when), [[nov(5, 15), nov(5, 16)]], "Work's block leaves out the shown haircut");
}

// Filter first, then merge: a copy that doesn't show can't take the other with it.
{
  const board = readPlans(snap([
    cal("calendar.jenn", "Jenn", [timed("Lunch", nov(4, 12), nov(4, 13))], { detail: "none" }),
    cal("calendar.will", "Will", [timed("Lunch", nov(4, 12), nov(4, 13))]),
  ]), NOW, true);
  assert.deepStrictEqual(board.plans.map((p) => [p.title, p.who]), [["Lunch", "Will"]]);
}

// ---- Guest mode at the wall, and Board private ----
// Guest mode, at the wall only: shared plans keep their titles, each adult's
// own events become blocks with name and times, Work hides (#68). Board
// private hides Work too, on every copy, as the week card's switch does.
{
  const calendars = () => [
    cal("calendar.will", "Will", [
      timed("Dentist", nov(4, 15), nov(4, 16)),
      timed("Pick up parcel", nov(4, 16, 30), nov(4, 17)),
      timed("Dinner w/ Sam", nov(4, 19), nov(4, 21)),
    ]),
    cal("calendar.jenn", "Jenn", [timed("Dinner w/ Sam", nov(4, 19), nov(4, 21)), allDay("Spa day", "2026-11-05", "2026-11-06")]),
    cal("calendar.work", "Will", [timed("Clinic", nov(4, 8), nov(4, 12)), timed("Date night", nov(6, 19), nov(6, 22))], { work: true, detail: "block", label: "At work" }),
    cal("calendar.us", "Us", [timed("Date night", nov(6, 19), nov(6, 22))]),
  ];
  const show = (board) => board.plans.map((p) => [p.title, p.who, p.label]);
  const everything = [
    [null, "Will", "At work"], ["Dentist", "Will", null], ["Pick up parcel", "Will", null], ["Dinner w/ Sam", "Will, Jenn", null],
    ["Spa day", "Jenn", null], ["Date night", "Us", null],
  ];

  // Guest mode at the wall.
  const guests = readPlans(snap(calendars(), { guestMode: true }), NOW, true);
  assert.deepStrictEqual(show(guests), [
    [null, "Will", null], ["Dinner w/ Sam", "Will, Jenn", null], [null, "Jenn", null], ["Date night", "Us", null],
  ], "shared plans keep titles, own events are blocks, Work is gone");
  assert.deepStrictEqual(when(guests.plans[0]), [nov(4, 15), nov(4, 17)], "Will's afternoon is one block, 3 to 5");
  assert.strictEqual(guests.plans[2].allDay, true, "Jenn's all-day item stays all day, untitled");
  assert.deepStrictEqual(guests.plans[3].sources.map((s) => s.entity), ["calendar.us"], "a hidden Work copy doesn't take the Us plan with it");
  // The titles stay out of every field a view might draw; the events behind stay for the card.
  assert.doesNotMatch(JSON.stringify(guests.plans.map(({ sources, start, end, ...shown }) => shown)), /Dentist|parcel|Spa|Clinic/);

  // Off at the wall, and on a phone either way: titles, and Work as its block.
  for (const [more, wall] of [[{}, true], [{ guestMode: true }, false], [{}, false]]) {
    const board = readPlans(snap(calendars(), more), NOW, wall);
    assert.deepStrictEqual(show(board), everything, `guest ${!!more.guestMode}, wall ${wall}`);
    assert.deepStrictEqual(board.plans.at(-1).sources.map((s) => s.entity), ["calendar.work", "calendar.us"]);
  }

  // Board private hides Work at the wall and on the phones; titles stay.
  for (const wall of [true, false]) {
    const board = readPlans(snap(calendars(), { boardPrivate: true }), NOW, wall);
    assert.deepStrictEqual(show(board), everything.slice(1), `board private, wall ${wall}`);
  }
}

// ---- Icons: the fixed word table (#71's starter table) ----
// Whole words in the title, any case, first row wins; gray icons.js names only.
{
  const cases = [
    ["Vet: the cat's checkup", "paw"], // vet's row comes before the doctor's
    ["Veterinarian", "paw"], ["DENTIST", "tooth"], ["Dental cleaning", "tooth"],
    ["Dr. Rivera", "stethoscope"], ["Doctor", "stethoscope"], ["Physical", "stethoscope"], ["Annual checkup", "stethoscope"],
    ["Eye exam", "glasses"], ["Optometrist", "glasses"],
    ["Flu shot", "needle"], ["Covid vaccine", "needle"], ["Booster", "needle"],
    ["Pharmacy pickup", "pill"], ["Prescription refill", "pill"],
    ["Flight to Denver", "airplane"], ["Airport run", "airplane"],
    ["Trip to the lake", "bag-suitcase"], ["Vacation", "bag-suitcase"], ["Travel day", "bag-suitcase"],
    ["Trash night", "trash-can"], ["Garbage", "trash-can"], ["Recycling", "recycle"],
    ["Sam's birthday", "cake-variant"], ["Sam's bday", "cake-variant"],
    ["Anniversary", "party-popper"], ["Wedding", "party-popper"], ["Party at Alex's", "party-popper"],
    ["Haircut", "content-cut"],
    ["Oil change", "car-wrench"], ["Car service", "car-wrench"], ["Snow tires on", "car-wrench"],
    ["Plumber", "wrench"], ["Electrician", "wrench"], ["Handyman", "wrench"], ["HVAC tune-up", "wrench"], ["Dishwasher repair", "wrench"],
    // Whole words only, and routine words have none.
    ["Birthdays", null], ["Tripod hunt", null], ["Oil painting", null], ["Eye drops", null], ["Drive", null],
    ["Work", null], ["Gym", null], ["Yoga", null], ["Dinner", null], ["", null],
  ];
  const board = readPlans(snap([cal("calendar.will", "Will", cases.map(([title], i) => timed(title, nov(4, 0, i), nov(4, 0, i + 1))))]), NOW, true);
  assert.deepStrictEqual(board.plans.map((p) => [p.title, p.icon]), cases);
  for (const [, name] of cases) if (name) assert.notStrictEqual(String(icon(name)), "", `icons.js draws ${name}`);

  // No icon on a block: a labeled one, or Guest mode's, which would say what the title hid.
  const blocks = readPlans(snap([
    cal("calendar.will", "Will", [timed("Dentist", nov(4, 15), nov(4, 16))]),
    cal("calendar.work", "Will", [timed("Flight to Denver", nov(5, 8), nov(5, 11))], { work: true, detail: "block", label: "At work" }),
  ], { guestMode: true }), NOW, false);
  assert.deepStrictEqual(blocks.plans.map((p) => [p.title, p.icon]), [["Dentist", "tooth"], [null, null]]);
  const guests = readPlans(snap([cal("calendar.will", "Will", [timed("Dentist", nov(4, 15), nov(4, 16))])], { guestMode: true }), NOW, true);
  assert.deepStrictEqual(guests.plans.map((p) => [p.title, p.icon]), [[null, null]]);
}

// ---- Clashes (#61 question 1, tuned by #66) ----
// A shared plan overlapping either person's own timed event, work included;
// or one person booked twice on their own calendars, work left out. Two
// people's separate plans aren't a clash, all-day events never clash, and an
// overlap of 15 minutes or less, or plans that only touch, isn't one. Clashes
// come from the events, not the drawn block.
{
  const board = readPlans(snap([
    cal("calendar.will", "Will", [
      timed("Call with Sam", nov(4, 20, 45), nov(4, 21, 30)), // 15 minutes into Date night: not a clash
      timed("Dentist", nov(5, 10), nov(5, 11)), // inside clinic hours: not a clash
      timed("Haircut", nov(5, 15), nov(5, 16)),
      timed("Errand", nov(6, 9), nov(6, 10)), // beside Jenn's errand: two people, not a clash
      timed("Lunch w/ Alex", nov(7, 12), nov(7, 13)),
    ]),
    cal("calendar.will2", "Will", [timed("Pick up parcel", nov(5, 15, 30), nov(5, 16, 30))]), // Will twice
    cal("calendar.jenn", "Jenn", [
      timed("Book club", nov(4, 20, 44), nov(4, 22)), // 16 minutes into Date night: a clash
      timed("Errand", nov(6, 9, 30), nov(6, 10, 30)),
      timed("Lunch w/ Alex", nov(7, 12), nov(7, 13)), // shared with Will's copy
      timed("Run", nov(7, 12, 30), nov(7, 13, 30)), // 30 minutes into that shared lunch: a clash
    ]),
    cal("calendar.work", "Will", [
      timed("Clinic", nov(5, 9), nov(5, 12)), timed("Clinic", nov(5, 13), nov(5, 17)), // one block, a lunch gap at noon
    ], { work: true, detail: "block", label: "At work" }),
    cal("calendar.us", "Us", [
      timed("Date night", nov(4, 19), nov(4, 21)),
      timed("Brunch", nov(9, 10), nov(9, 11)), timed("Walk", nov(9, 11), nov(9, 12)), // they only touch: not a clash
      timed("Lunch", nov(5, 12), nov(5, 13)), // in Work's lunch gap: not a clash
      timed("Pharmacy", nov(5, 16, 30), nov(5, 17, 30)), // 30 minutes into Work's afternoon: a clash
      timed("Dinner", nov(8, 18), nov(8, 20)), timed("Concert", nov(8, 19), nov(8, 22)), // both of you twice
      allDay("Open house", "2026-11-05", "2026-11-06"),
    ]),
  ]), NOW, true);
  const named = (plan) => plan.title ?? `${plan.label} (${plan.who})`;
  const clashes = Object.fromEntries(board.plans.map((p) => [named(p), p.clashes.map(named)]));
  assert.deepStrictEqual(clashes, {
    "Date night": ["Book club"], "Call with Sam": [], "Book club": ["Date night"], "Brunch": [], "Walk": [],
    "Open house": [], "At work (Will)": ["Pharmacy"], "Dentist": [], "Lunch": [],
    "Haircut": ["Pick up parcel"], "Pick up parcel": ["Haircut"], "Pharmacy": ["At work (Will)"],
    "Errand": [], "Lunch w/ Alex": ["Run"], "Run": ["Lunch w/ Alex"],
    "Dinner": ["Concert"], "Concert": ["Dinner"],
  });
  // Both errands are listed under one key above; check each has none.
  for (const plan of board.plans.filter((p) => p.title === "Errand")) assert.deepStrictEqual(plan.clashes, []);
  // Hidden copies count for nothing: Work hidden by Guest mode, and a calendar shown as nothing.
  const guests = readPlans(snap([
    cal("calendar.work", "Will", [timed("Clinic", nov(5, 13), nov(5, 17))], { work: true, detail: "block", label: "At work" }),
    cal("calendar.jenn", "Jenn", [timed("Run", nov(5, 16), nov(5, 17))], { detail: "none" }),
    cal("calendar.us", "Us", [timed("Pharmacy", nov(5, 16, 30), nov(5, 17, 30))]),
  ], { guestMode: true }), NOW, true);
  assert.deepStrictEqual(guests.plans.map((p) => [p.title, p.clashes.length]), [["Pharmacy", 0]]);
}

// ---- Needs you (#61 question 2) ----
// A clash today, or tomorrow's once the evening hand-off turns the board to
// tomorrow (after 6 pm, once today's last timed plan has ended); then each
// house reminder that's due, oldest first. The wall drops a reminder more than
// 3 days past due; the phones keep it until it's done. Nothing when nothing qualifies.
{
  const calendars = () => [
    cal("calendar.will", "Will", [timed("Dentist", nov(3, 15), nov(3, 16)), timed("Call with Sam", nov(4, 9, 30), nov(4, 10, 30))]),
    cal("calendar.jenn", "Jenn", [timed("Book club", nov(3, 20, 30), nov(3, 22)), allDay("Spa day", "2026-11-03", "2026-11-04")]),
    cal("calendar.us", "Us", [timed("Date night", nov(3, 19), nov(3, 21)), timed("Breakfast out", nov(4, 9), nov(4, 10))]),
  ];
  const needs = (board) => board.needs.map((n) => n.words);
  const at = (h, min = 0) => readPlans(snap(calendars()), nov(3, h, min), true);

  // Morning: today's clash, named with both people; tomorrow's waits.
  assert.deepStrictEqual(needs(at(10)), ["Today 8:30 pm: Date night (Us) overlaps Book club (Jenn)"]);
  assert.strictEqual(at(10).handOff, false);
  const [clash] = at(10).needs;
  assert.deepStrictEqual([clash.kind, clash.plans.map((p) => p.title), clash.at], ["clash", ["Date night", "Book club"], nov(3, 20, 30)]);
  // 6:30 pm: Date night hasn't ended, so no hand-off yet.
  assert.deepStrictEqual([at(18, 30).handOff, needs(at(18, 30))], [false, ["Today 8:30 pm: Date night (Us) overlaps Book club (Jenn)"]]);
  // 10:30 pm: today's timed plans are done (Jenn's all-day item doesn't hold it), so tomorrow's clash leads.
  assert.deepStrictEqual([at(22, 30).handOff, needs(at(22, 30))], [true, ["Tomorrow 9:30 am: Breakfast out (Us) overlaps Call with Sam (Will)"]]);
  // A day with nothing left after 6 pm hands off at 6, and not before.
  const quiet = (h) => readPlans(snap([cal("calendar.us", "Us", [timed("Lunch", nov(3, 12), nov(3, 13))])]), nov(3, h), true);
  assert.deepStrictEqual([quiet(17).handOff, quiet(18).handOff], [false, true]);
  // Nothing qualifies: nothing.
  assert.deepStrictEqual(quiet(10).needs, []);

  // Guest mode at the wall names a block by person and times.
  const guests = readPlans(snap(calendars(), { guestMode: true }), nov(3, 10), true);
  assert.deepStrictEqual(needs(guests), ["Today 8:30 pm: Date night (Us) overlaps Jenn, 8:30 pm to 10:00 pm"]);
  // A labeled block by its label.
  const work = readPlans(snap([
    cal("calendar.work", "Will", [timed("Clinic", nov(3, 9), nov(3, 17))], { work: true, detail: "block", label: "At work" }),
    cal("calendar.us", "Us", [timed("Pharmacy", nov(3, 16), nov(3, 17))]),
  ]), nov(3, 10), false);
  assert.deepStrictEqual(needs(work), ["Today 4:00 pm: At work (Will) overlaps Pharmacy (Us)"]);
}

// House reminders: due today or past due, until done (#127's list). 2026-10-31
// to Nov 3 runs across the night the clocks fell back.
{
  const house = [
    { uid: "r1", summary: "Furnace filter check", status: "needs_action", due: "2026-10-31", description: "R001" }, // 3 days past due
    { uid: "r2", summary: "Smoke alarm test", status: "needs_action", due: "2026-10-30" }, // 4 days past due
    { uid: "r3", summary: "Gutters", status: "completed", due: "2026-11-03" }, // done
    { uid: "r4", summary: "Water heater flush", status: "needs_action", due: "2026-11-03" }, // due today
    { uid: "r5", summary: "Dryer vent", status: "needs_action", due: "2026-11-05" }, // not due yet
    { uid: "r6", summary: "Fire extinguisher", status: "needs_action" }, // a must with no date
    { uid: "r7", summary: "Sump pump", status: "needs_action", due: nov(2, 9).toISOString() }, // a date and time
    { uid: "r8", summary: "Junk", status: "needs_action", due: "soon" },
  ];
  const clashing = [cal("calendar.us", "Us", [timed("Date night", nov(3, 19), nov(3, 21)), timed("Concert", nov(3, 20), nov(3, 22))])];
  const lists = { notes: null, meals: null, house };
  const read = (wall) => readPlans(snap(clashing, { lists }), NOW, wall).needs.map((n) => [n.kind, n.words, n.daysPast]);
  assert.deepStrictEqual(read(false), [
    ["clash", "Today 8:00 pm: Date night (Us) overlaps Concert (Us)", undefined],
    ["reminder", "Smoke alarm test", 4], ["reminder", "Furnace filter check", 3], ["reminder", "Sump pump", 1],
    ["reminder", "Water heater flush", 0], ["reminder", "Fire extinguisher", null],
  ], "the phones: every one until done, the clash first");
  assert.deepStrictEqual(read(true), [
    ["clash", "Today 8:00 pm: Date night (Us) overlaps Concert (Us)", undefined],
    ["reminder", "Furnace filter check", 3], ["reminder", "Sump pump", 1],
    ["reminder", "Water heater flush", 0], ["reminder", "Fire extinguisher", null],
  ], "the wall: 3 days past due stays, 4 leaves");
  const furnace = readPlans(snap([], { lists }), NOW, true).needs[0];
  assert.strictEqual(furnace.item, house[0], "the item as Home Assistant sent it, for Mark done later");
  // No list yet, or no list configured: nothing.
  assert.deepStrictEqual(readPlans(snap([], { lists: { notes: null, meals: null, house: null } }), NOW, true).needs, []);
  assert.deepStrictEqual(readPlans(snap([], { lists: undefined }), NOW, true).needs, []);
}

// ---- Quiet calendars (#103, owner) ----
// A calendar failing 10 minutes gets the quiet line, which names its person
// (and "work calendar" for a work one, since "Work" never shows on its own);
// after an hour its own plans pale, and nobody else's. With nothing kept, it
// is listed at once, so its days can say it isn't loading.
{
  const ago = (minutes) => new Date(NOW.getTime() - minutes * MINUTE);
  const read = (failing, more = {}, wall = true) => readPlans(snap([
    cal("calendar.will", "Will", [timed("Dentist", nov(3, 15), nov(3, 16)), timed("Lunch w/ Alex", nov(4, 12), nov(4, 13))]),
    cal("calendar.jenn", "Jenn", [timed("Book club", nov(3, 20), nov(3, 22)), timed("Lunch w/ Alex", nov(4, 12), nov(4, 13))], {
      answeredAt: ago(failing + 1), failingSince: ago(failing),
    }),
    cal("calendar.work", "Will", [timed("Clinic", nov(4, 8), nov(4, 11))], { work: true, detail: "block", label: "At work", ...more.work }),
    cal("calendar.us", "Us", more.us === undefined ? [] : more.us.events, more.us),
  ], more.snapshot), NOW, wall);
  const pale = (board) => board.plans.map((p) => [p.title ?? p.label, p.who, p.pale]);

  const at9 = read(9);
  assert.deepStrictEqual(at9.quiet, [], "9 minutes: no line yet");
  assert.deepStrictEqual(pale(at9).filter(([, , isPale]) => isPale), []);

  const at11 = read(11);
  assert.deepStrictEqual(at11.quiet, [{ entity: "calendar.jenn", name: "Jenn's calendar", since: ago(12), failingSince: ago(11), kept: true }], "11 minutes: the line");
  assert.deepStrictEqual(pale(at11).filter(([, , isPale]) => isPale), [], "but nothing pales before an hour");

  const at61 = read(61);
  assert.deepStrictEqual(at61.quiet.map((q) => q.name), ["Jenn's calendar"]);
  assert.deepStrictEqual(pale(at61), [
    ["Dentist", "Will", false], ["Book club", "Jenn", true], ["At work", "Will", false], ["Lunch w/ Alex", "Will, Jenn", false],
  ], "61 minutes: only Jenn's own plans pale; a shared plan Will's calendar still answers for doesn't");

  // A failing work calendar reads as its person's work calendar, and its block pales.
  const work = read(0, { work: { answeredAt: null, failingSince: ago(61) } });
  assert.deepStrictEqual(work.quiet.map((q) => [q.name, q.since, q.kept]), [["Will's work calendar", null, true]], "since is null when no answer reached this page");
  assert.deepStrictEqual(pale(work).filter(([, , isPale]) => isPale), [["At work", "Will", true]]);
  // Hidden calendars aren't named: Work in Guest mode at the wall.
  assert.deepStrictEqual(read(0, { work: { failingSince: ago(61) }, snapshot: { guestMode: true } }).quiet, []);

  // Nothing kept: listed at once, so its days say it isn't loading. Not failing yet: still loading, nothing to say.
  const us = read(0, { us: { events: null, answeredAt: null, failingSince: ago(1) } });
  assert.deepStrictEqual(us.quiet.map((q) => [q.name, q.kept]), [["The Us calendar", false]]);
  assert.deepStrictEqual(read(0, { us: { events: null, answeredAt: null } }).quiet, []);
}

console.log("house board people: all checks passed");

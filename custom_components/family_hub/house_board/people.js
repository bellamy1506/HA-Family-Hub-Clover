// Owns: whose each plan is and how it shows: persons, detail, shared plans,
//   Guest mode, icons, clashes, what needs you, and quiet calendars.
// Leaves alone: fetching (ha.js), colors and pictures (theme.js, icons.js), and where a view draws a plan.
// Tested by: tests/test_house_board_people.js, rerun in three zones by run_all.sh

import { addDays, dayDiff, parseDay, splitByDay, startOfDay, timeWords } from "./when.js";

/**
 * What the face and Upcoming draw from: readPlans gives one for each copy and moment.
 * @typedef {object} Board
 * @property {Plan[]} plans  every plan that shows on this copy, by start, all-day first on its
 *   day. Ended plans stay; a view drops them by `end`. For days, `splitByDay(plan, from, to)`.
 * @property {Need[]} needs  the needs-you line, in order: clashes by when they begin, then house
 *   reminders oldest first. Empty when nothing qualifies. The wall shows the first; the phones all.
 * @property {Quiet[]} quiet  calendars to name in the quiet line, in the config's order
 * @property {boolean} handOff  the evening hand-off has turned the board to tomorrow: it's after
 *   6 pm and today's last timed plan has ended. Needs-you then holds tomorrow's clashes.
 *
 * One thing on the board: an event (its copies on several calendars shown once), or one block.
 * @typedef {object} Plan
 * @property {{ dateTime: string } | { date: string }} start  Home Assistant's shape, so when.js's
 * @property {{ dateTime: string } | { date: string }} end    splitByDay and multiDayWords take a plan as they take an event
 * @property {boolean} allDay
 * @property {string} person  whose color: "Will", "Jenn" or "Us" (every shared plan is Us)
 * @property {string} who  the name in words: "Will", "Us", or "Will, Jenn" for a plan on both calendars
 * @property {string|null} title  the event's title; null for a block
 * @property {string|null} label  a block's words, "At work"; null for a titled plan and for a
 *   Guest mode block, which reads as its name and times ("Will, 3:00 pm to 5:00 pm")
 * @property {boolean} work  every calendar behind it is a work calendar
 * @property {string|null} icon  an icons.js name from the word table, "tooth"; null for none and for every block
 * @property {boolean} pale  every calendar behind it has been failing an hour: draw it paler
 * @property {Plan[]} clashes  the plans it clashes with, by start; empty for none
 * @property {{ entity: string, event: object }[]} sources  the calendars behind it and each one's
 *   event as fetched: write back from these, never from the plan
 *
 * One item for the needs-you line.
 * @typedef {object} Need
 * @property {"clash"|"reminder"} kind
 * @property {string} words  the line, naming the people: "Today 8:30 pm: Date night (Us) overlaps
 *   Book club (Jenn)"; a reminder's label, "Furnace filter check"
 * @property {Plan[]} [plans]  a clash's two plans, the earlier first
 * @property {Date} [at]  when a clash begins
 * @property {object} [item]  a reminder's to-do item as Home Assistant sent it ({ uid, summary, status, due? })
 * @property {number|null} [daysPast]  a reminder's days past due: 0 for today; null for a must with no date
 *
 * A calendar that isn't answering, for the quiet line.
 * @typedef {object} Quiet
 * @property {string} entity
 * @property {string} name  how the line names it: "Jenn's calendar", "Will's work calendar", "The Us calendar"
 * @property {Date|null} since  its last answer on this page ("hasn't updated since 9:40 am"); null when none came
 * @property {Date} failingSince
 * @property {boolean} kept  false when nothing was kept, so its days should say it "isn't loading", not look free
 */

const US = "Us"; // the shared person: every shared plan shows as Us
const MINUTE = 60000;
// The icons research's starter table (#71): whole words in the title, any
// case, first row wins. Routine words (work, gym, yoga) and meals have none.
const ICONS = {
  paw: ["vet", "veterinarian"],
  tooth: ["dentist", "dental"],
  stethoscope: ["doctor", "dr", "physical", "checkup"],
  glasses: ["eye exam", "optometrist"],
  needle: ["flu shot", "vaccine", "booster"],
  pill: ["pharmacy", "prescription"],
  airplane: ["flight", "airport"],
  "bag-suitcase": ["trip", "vacation", "travel"],
  "trash-can": ["trash", "garbage"],
  recycle: ["recycling"],
  "cake-variant": ["birthday", "bday"],
  "party-popper": ["anniversary", "wedding", "party"],
  "content-cut": ["haircut"],
  "car-wrench": ["oil change", "car service", "tires"],
  wrench: ["plumber", "electrician", "handyman", "hvac", "repair"],
};
const BLOCK_GAP = 60 * MINUTE; // a gap over an hour splits a labeled block (#61, question 3)
const CLASH = 15 * MINUTE; // an overlap of 15 minutes or less isn't a clash (#66)
const QUIET = 10 * MINUTE; // a calendar failing this long is named (#103, owner)
const PALE = 60 * MINUTE; // and its plans pale after this long
const EVENING = 18; // the evening hand-off starts at 6 pm
const WALL_DAYS = 3; // the wall shows a house reminder until 3 days past due (#61 question 2)

/**
 * The board's plans for one copy at one moment.
 * @param {object} snapshot  ha.js's Snapshot: calendars, lists.house, guestMode, boardPrivate, days
 * @param {Date} now
 * @param {boolean} wall  whether this copy is the wall (Guest mode and the reminder cutoff apply there)
 * @returns {Board}
 */
export function readPlans(snapshot, now, wall) {
  const from = startOfDay(now);
  const to = addDays(from, snapshot.days);
  // Guest mode works at the wall only (#87). Work hides while it or Board
  // private is on (#68); Family Hub's privacy lock isn't honored (#87).
  const guest = wall && snapshot.guestMode;
  const hideWork = guest || snapshot.boardPrivate;
  const visible = snapshot.calendars.filter((c) => c.detail !== "none" && !(c.work && hideWork));
  // A calendar failing 10 minutes, or failing with nothing kept, is named in
  // the quiet line; after an hour its own plans pale (#103, owner).
  const failing = (c, limit) => !!c.failingSince && now - c.failingSince >= limit;
  const quiet = visible.filter((c) => failing(c, QUIET) || (failing(c, 0) && !c.events)).map((c) => ({
    entity: c.entity,
    name: `${c.person === US ? "The Us" : `${c.person}'s`} ${c.work ? "work " : ""}calendar`,
    since: c.answeredAt,
    failingSince: c.failingSince,
    kept: !!c.events,
  }));
  // Filter first, then merge, so a copy that doesn't show can't take another with it (call A10).
  const plans = [];
  const blocks = [];
  for (const copies of samePlans(visible.filter((c) => c.events))) {
    const plan = toPlan(copies, guest, (c) => failing(c, PALE));
    (plan.title === null && !plan.allDay ? blocks : plans).push(plan);
  }
  // The times behind each timed plan, [start, end] in ms; a block's are its events'.
  const pieces = new Map(plans.filter((p) => !p.allDay).map((p) => [p, [[ms(p.start), ms(p.end)]]]));
  plans.push(...joinBlocks(blocks, from, to, pieces));
  plans.sort((a, b) => ms(a.start) - ms(b.start) || b.allDay - a.allDay);
  const clashes = findClashes(plans, pieces);
  // The evening hand-off: after 6 pm, once today's last timed plan has ended,
  // the board turns to tomorrow (the resting face README).
  const tomorrow = addDays(from, 1);
  const handOff = now.getHours() >= EVENING && !plans.some((p) => pieces.has(p) && ms(p.end) > +now && ms(p.start) < +tomorrow);
  // Needs you (#61 question 2): today's clashes still to come, or tomorrow's
  // after the hand-off, by when they begin; then the house reminders.
  const until = +addDays(from, handOff ? 2 : 1);
  const needs = clashes.flatMap(({ plans: [a, b], overlaps }) => {
    const hit = overlaps.find(([start, end]) => end > +now && start < until);
    if (!hit) return [];
    const at = new Date(hit[0]);
    const words = `${dayDiff(now, at) > 0 ? "Tomorrow" : "Today"} ${timeWords(at)}: ${named(a)} overlaps ${named(b)}`;
    return [{ kind: "clash", words, plans: [a, b], at }];
  });
  needs.sort((a, b) => a.at - b.at);
  needs.push(...dueReminders(snapshot.lists?.house, now, wall));
  return { plans, needs, quiet, handOff };
}

// Rule from Calendar Card Pro (MIT), src/utils/events.ts:826-905 and :2104-2118 at 75bf292 (borrow item 12).
// The copies of each plan, grouped: the same uid and start, or the same title
// (ignoring case, punctuation and spacing) with the same start and end, never
// by place (#66). Times compare as instants, so two spellings of one time match.
function samePlans(calendars) {
  const groups = [];
  const byKey = new Map();
  for (const c of calendars) {
    for (const event of c.events) {
      const start = event.start.date ?? Date.parse(event.start.dateTime);
      const end = event.end.date ?? Date.parse(event.end.dateTime);
      const title = (event.summary ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
      const keys = [event.uid && `uid ${event.uid} ${start}`, title && `title ${title} ${start} ${end}`].filter(Boolean);
      let group = keys.map((key) => byKey.get(key)).find(Boolean);
      if (!group) groups.push((group = []));
      group.push({ c, event });
      for (const key of keys) byKey.set(key, group);
    }
  }
  return groups;
}

// One plan from its copies. A plan on Us, or on two people's calendars, is
// Us's. It keeps its title if any copy's calendar shows titles, unless Guest
// mode makes one adult's own plan a block. It runs to its latest end, so an
// ended copy can't end it, and pales only when every copy's calendar is quiet.
function toPlan(copies, guest, pale) {
  const persons = [...new Set(copies.map(({ c }) => c.person))];
  const shared = persons.includes(US) || persons.length > 1;
  const titled = (shared || !guest) && copies.find(({ c }) => c.detail === "titles");
  const title = titled ? titled.event.summary ?? "" : null;
  const first = copies[0];
  return {
    start: first.event.start,
    end: copies.map(({ event }) => event.end).reduce((a, b) => (ms(b) > ms(a) ? b : a)),
    allDay: !first.event.start.dateTime,
    person: shared ? US : persons[0],
    who: persons.includes(US) ? US : persons.join(", "),
    title,
    label: titled ? null : first.c.label,
    work: copies.every(({ c }) => c.work),
    icon: title === null ? null : iconFor(title),
    pale: copies.every(({ c }) => pale(c)),
    sources: copies.map(({ c, event }) => ({ entity: c.entity, event: event.source || event })),
  };
}

// A day's block events on one calendar become one span; a gap over an hour
// splits it. Timed only: an all-day event on a block calendar stays itself.
function joinBlocks(blocks, from, to, pieces) {
  const days = new Map();
  for (const plan of blocks) {
    for (const part of splitByDay(plan, from, to)) {
      const key = `${plan.sources[0].entity}|${part.day}`;
      if (!days.has(key)) days.set(key, []);
      days.get(key).push({ plan, start: +part.start, end: +part.end });
    }
  }
  const spans = [];
  for (const day of days.values()) {
    day.sort((a, b) => a.start - b.start);
    let span = null;
    for (const piece of day) {
      if (span && piece.start - span.end <= BLOCK_GAP) {
        span.end = Math.max(span.end, piece.end);
        span.pieces.push(piece);
      } else spans.push((span = { start: piece.start, end: piece.end, pieces: [piece] }));
    }
  }
  return spans.map((span) => {
    const plan = {
      ...span.pieces[0].plan,
      start: { dateTime: new Date(span.start).toISOString() },
      end: { dateTime: new Date(span.end).toISOString() },
      sources: [...new Set(span.pieces.map((p) => p.plan))].flatMap((p) => p.sources),
    };
    pieces.set(plan, span.pieces.map((p) => [p.start, p.end]));
    return plan;
  });
}

// Two timed plans clash when someone is in both and they overlap by more than
// 15 minutes. A shared plan has everyone in it; between one person's own
// plans, work doesn't count (#61 question 1, #66). Gives each pair once,
// earlier first, with the overlaps as [start, end] in ms.
function findClashes(plans, pieces) {
  const pairs = [];
  for (const plan of plans) plan.clashes = [];
  const timed = plans.filter((p) => pieces.has(p));
  timed.forEach((a, i) => {
    for (const b of timed.slice(i + 1)) {
      if (ms(b.start) >= ms(a.end)) break;
      if (!(a.person === US || b.person === US || (a.person === b.person && !a.work && !b.work))) continue;
      const overlaps = pieces.get(a)
        .flatMap(([s1, e1]) => pieces.get(b).map(([s2, e2]) => [Math.max(s1, s2), Math.min(e1, e2)]))
        .filter(([s, e]) => e - s > CLASH);
      if (!overlaps.length) continue;
      a.clashes.push(b);
      b.clashes.push(a);
      pairs.push({ plans: [a, b], overlaps });
    }
  });
  return pairs;
}

// A plan in the needs-you line: "Date night (Us)", "At work (Will)", or a
// Guest mode block as "Jenn, 8:30 pm to 10:00 pm".
function named(plan) {
  if (plan.title !== null) return `${plan.title} (${plan.who})`;
  if (plan.label) return `${plan.label} (${plan.who})`;
  return `${plan.who}, ${timeWords(new Date(ms(plan.start)))} to ${timeWords(new Date(ms(plan.end)))}`;
}

// House reminders due today or past due and not done (#127), oldest first,
// undated musts last. The wall drops one more than 3 days past due; the
// phones keep it until it's done. A due that can't be read drops out.
function dueReminders(items, now, wall) {
  return (items || [])
    .filter((item) => item.status !== "completed")
    .map((item) => ({ kind: "reminder", words: item.summary, item, daysPast: item.due ? dayDiff(dueDay(item.due), now) : null }))
    .filter(({ daysPast }) => daysPast === null || (daysPast >= 0 && (!wall || daysPast <= WALL_DAYS)))
    .sort((a, b) => (b.daysPast ?? -1) - (a.daysPast ?? -1));
}

// A due day is a house date: "2026-11-01" is that local day, never UTC's (#127).
const dueDay = (due) => (/^\d{4}-\d{2}-\d{2}$/.test(due) ? parseDay(due) : new Date(due));

function iconFor(title) {
  const words = ` ${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  return Object.keys(ICONS).find((name) => ICONS[name].some((word) => words.includes(` ${word} `))) ?? null;
}

// An event time in milliseconds; a day as its local midnight.
const ms = (time) => (time.dateTime ? Date.parse(time.dateTime) : parseDay(time.date).getTime());

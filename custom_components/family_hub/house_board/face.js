// Owns: the wall's resting face: what it holds at a moment (faceModel) and its markup (faceHtml).
// Leaves alone: fetching (ha.js), whose each plan is (people.js), fitting rows and the rail (the card).
// Tested by: tests/test_house_board_face.js, rerun in three zones by run_all.sh
//
// Layout D with look E (#38, #57): the Next band over four day columns and one
// needs-you line. The model is plain data, the same for the same input, so the
// card can compare it, and faceHtml marks each part the card may replace alone (#72).

import { html } from "./html.js";
import { icon, weatherIcon } from "./icons.js";
import { mealsForDay, readMealPlan } from "./meals.js";
import { readPlans } from "./people.js";
import { personColors } from "./theme.js";
import { chanceWords, quietWords, rainWords } from "./words.js";
import { addDays, dayKey, dayWords, multiDayWords, shortTimeWords, splitByDay, startOfDay, timeWords } from "./when.js";

const COLUMNS = 4;
const WALL = "light"; // the face is the wall's, and the wall is always light (theme.js's lookFor)

/**
 * @typedef {object} FaceModel
 * @property {Lead|null} lead  the Next band; null while held (#97), its box kept empty
 * @property {string} clock  "3:10 pm"
 * @property {{ date: string, weather: { condition: string, high: string, low: string }|null,
 *   rain: string|null, quiet: string[] }} today  under the clock: "Tue Nov 3", "58°", "Rain from 2 pm",
 *   and a line per quiet calendar that kept its events
 * @property {{ words: string, more: number }|null} needs  the first item and how many more; null when
 *   nothing needs you (the space goes to the columns) and while held
 * @property {Day[]} days  four columns, from today, or from tomorrow after the hand-off
 *
 * @typedef {object} Lead
 * @property {string} label  "Next · Will", "Tomorrow · Us"; "" when nothing's next
 * @property {string} time  "3:30 pm"; a Guest mode block's "3:00 to 5:00"; ""
 * @property {string} what  "Dentist", "At work", "" for a Guest mode block, "Nothing else today"
 * @property {string|null} pick  the person's color as picked, for theme.js
 * @property {boolean} pale
 *
 * @typedef {object} Day
 * @property {string} name  "Today", "Tomorrow", "Wed 4"
 * @property {{ condition: string, high: string, low: string, chance: string|null }|null} weather
 * @property {string[]} missing  "Jenn's calendar isn't loading", for a calendar that kept nothing
 * @property {string[]} notes  open notes
 * @property {Row[]} rows  all-day items first, then by start; today's Now rows lead
 * @property {{ slot: string, meal: string }[]} meals  dinner always ("Not planned"), others when filled
 *
 * @typedef {object} Row
 * @property {string|null} time  "3:30 pm", "8:30 to 4:30", "until 4:30" on a Now row,
 *   "All day, until Fri Nov 6"; null for a one-day all-day item
 * @property {boolean} now  under way
 * @property {string} who  "Will", "Us", "Will, Jenn"
 * @property {string|null} title  its title, or a block's label; null for a Guest mode block
 * @property {string|null} icon  an icons.js name
 * @property {boolean} faint  a block or an all-day item, drawn paler so routine hours fall back
 * @property {boolean} allDay
 * @property {boolean} clash
 * @property {boolean} keep  the needs-you line names it: the card's fit never drops it
 * @property {string|null} pick
 * @property {boolean} pale
 */

/**
 * What the resting face holds at one moment.
 * @param {object} snapshot  ha.js's Snapshot
 * @param {object} config  ha.js's BoardConfig, for its people's colors
 * @param {Date} now
 * @returns {FaceModel}
 */
export function faceModel(snapshot, config, now) {
  const board = readPlans(snapshot, now, true);
  const pick = (person) => config.people?.[person]?.color ?? null;
  // After the evening hand-off the columns start at tomorrow (the resting face README).
  const first = addDays(startOfDay(now), board.handOff ? 1 : 0);
  const next = board.plans.find((p) => !p.allDay && startOf(p) > now && startOf(p) < addDays(first, 1));
  // Next and needs-you wait until every calendar has answered or timed out,
  // so a late answer can't swap them (#97). The Next plan stays out of its
  // column meanwhile, so nothing jumps when the band fills.
  const held = snapshot.calendars.some((c) => !c.answeredAt && !c.failingSince);
  const lead = held ? null : next
    ? { label: `${board.handOff ? "Tomorrow" : "Next"} · ${next.who}`, time: leadTime(next), what: next.title ?? next.label ?? "", pick: pick(next.person), pale: next.pale }
    : { label: "", time: "", what: board.handOff ? "Nothing tomorrow" : "Nothing else today", pick: null, pale: false };
  // The wall shows the first item and counts the rest; the rows it names stay.
  const needs = held || !board.needs.length ? null : { words: board.needs[0].words, more: board.needs.length - 1 };
  const kept = new Set((needs && board.needs[0].plans) || []);
  // A quiet calendar is named under the date and weather; one that kept
  // nothing says so on each of its days instead (#103, owner).
  const quiet = (keptEvents) => board.quiet.filter((q) => q.kept === keptEvents).map((q) => quietWords(q, now));
  const missing = quiet(false);
  const daily = snapshot.weather?.daily || {};
  const weatherOn = (day) => {
    const w = daily[dayKey(day)];
    return w ? { condition: w.condition, high: degrees(w.high), low: degrees(w.low), chance: chanceWords(w) } : null;
  };
  const todays = weatherOn(now);
  const today = {
    date: dayWords(now),
    weather: todays && { condition: todays.condition, high: todays.high, low: todays.low },
    rain: rainWords(snapshot.weather, now),
    quiet: quiet(true),
  };
  // Open notes sit on their day; one with no day, or past it, on the first
  // column (the week card's rollover keeps them on today until slice 3).
  // After the hand-off that's tomorrow's: a note has no time and stays until
  // cleared, so one still open tomorrow morning would show there anyway.
  const firstKey = dayKey(first);
  const noteDay = ({ due }) => {
    const key = !due ? firstKey : /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : dayKey(new Date(due));
    return key < firstKey ? firstKey : key;
  };
  const notes = (snapshot.lists?.notes || []).filter((n) => n.status !== "completed");
  // Dinner always, other meals when filled; dinner's box kept until the list
  // answers. Slots are the default three until the household settings are read.
  const mealPlan = snapshot.lists?.meals && readMealPlan(snapshot.lists.meals);
  const mealsOn = (key) => (mealPlan
    ? mealsForDay(mealPlan, null, key).filter((m) => m.meal || /dinner/i.test(m.slot)).map((m) => ({ slot: m.slot, meal: m.meal ? m.meal.name : "Not planned" }))
    : [{ slot: "Dinner", meal: "" }]);
  const days = Array.from({ length: COLUMNS }, (_, i) => {
    const day = addDays(first, i);
    const key = dayKey(day);
    const parts = board.plans
      .flatMap((plan) => splitByDay(plan, day, addDays(day, 1)))
      .filter((part) => part.end > now && part.event !== next)
      .sort((a, b) => b.allDay - a.allDay);
    return {
      name: i ? `${dayWords(day).slice(0, 3)} ${day.getDate()}` : board.handOff ? "Tomorrow" : "Today",
      weather: weatherOn(day),
      missing,
      notes: notes.filter((n) => noteDay(n) === key).map((n) => n.summary),
      rows: parts.map((part) => row(part, now, pick, kept.has(part.event))),
      meals: mealsOn(key),
    };
  });
  return { lead, clock: timeWords(now), today, needs, days };
}

function row(part, now, pick, keep) {
  const plan = part.event;
  return {
    time: partTime(part, now),
    now: !plan.allDay && part.start <= now,
    who: plan.who,
    title: plan.title ?? plan.label,
    icon: plan.icon,
    faint: plan.allDay || plan.title === null,
    allDay: plan.allDay,
    clash: plan.clashes.length > 0,
    keep,
    pick: pick(plan.person),
    pale: plan.pale,
  };
}

// A row's time line: "3:30 pm"; a block's "8:30 to 4:30"; a Now row's
// "until 4:30"; a plan that runs past its day says when it ends (call A9).
function partTime(part, now) {
  const plan = part.event;
  if (plan.allDay) return multiDayWords(plan, now);
  const start = startOf(plan);
  const end = new Date(plan.end.dateTime);
  const ends = +part.end === +end;
  if (part.start <= now) return ends ? `until ${shortTimeWords(end)}` : carriedOn(plan, now);
  if (+part.start !== +start) return carriedOn(plan, now);
  if (!ends) return multiDayWords(plan, now);
  return plan.title === null ? `${shortTimeWords(start)} to ${shortTimeWords(end)}` : timeWords(start);
}

// The lead line's time: its start, or a Guest mode block's hours, "3:00 to 5:00".
function leadTime(plan) {
  const start = startOf(plan);
  return plan.title === null && !plan.label ? `${shortTimeWords(start)} to ${shortTimeWords(new Date(plan.end.dateTime))}` : timeWords(start);
}

// A part carried on from an earlier day reads as its end only, "until Sun Nov 8 at 5:00 pm".
const carriedOn = (plan, now) => multiDayWords({ start: { dateTime: new Date(0).toISOString() }, end: plan.end }, now);

const degrees = (t) => (Number.isFinite(t) ? `${Math.round(t)}°` : "");
const startOf = (plan) => new Date(plan.start.dateTime);

/**
 * The face's markup, for the card's shadow root. Its leaf parts carry
 * data-part ("lead", "clock", "today", "needs", "day-0" to "day-3"), so the
 * card can replace only those whose markup changed. Each column's list is
 * data-fit (rows that don't fit drop from the end as "+N more", never one
 * marked data-keep), and the Next line is data-shrink: both the card's, which
 * can measure. The card's 64 px rail sits over the face's left edge.
 * @param {FaceModel} model
 */
export function faceHtml(model) {
  const { lead, today, needs } = model;
  return html`${STYLE}<div class="face">
<div class="band">${leadHtml(lead)}<div class="side"><div class="clock" data-part="clock">${small(model.clock)}</div><div class="today" data-part="today"><div class="date">${today.date}</div><div class="wx">${today.weather ? html`${weatherIcon(today.weather.condition)}<span>${today.weather.high}</span><span class="lo">${today.weather.low}</span>` : ""}</div><div class="rain">${today.rain ? html`${weatherIcon("rainy")}${today.rain}` : ""}</div>${today.quiet.map((q) => html`<div class="quiet">${q}</div>`)}</div></div></div>
<div class="needs" data-part="needs">${needs ? html`<div><span class="words">${needs.words}</span>${needs.more ? html`<span class="more">+${needs.more} more</span>` : ""}</div>` : ""}</div>
<div class="cols">${model.days.map(dayHtml)}</div>
</div>`;
}

function leadHtml(lead) {
  if (!lead) return html`<div class="lead" data-part="lead"></div>`;
  const bar = lead.label ? personColors(lead.pick, WALL, lead.pale).bar : "transparent";
  return html`<div class="lead" data-part="lead" style="--bar: ${bar}"><div><div class="label">${lead.label}</div><div class="line" data-shrink="64">${lead.time ? html`<span class="t">${small(lead.time)}</span>` : ""}${lead.what}</div></div></div>`;
}

function dayHtml(day, i) {
  const w = day.weather;
  return html`<div class="col" data-part="day-${i}">
<div class="hd"><span class="dn">${day.name}</span>${w ? html`<span class="wi">${weatherIcon(w.condition)}</span><span class="hl">${w.high} <span class="lo">${w.low}</span></span><span class="chance">${w.chance}</span>` : ""}</div>
<div class="list" data-fit>${day.missing.map((m) => html`<div class="missing">${m}</div>`)}${day.notes.map((n) => html`<div class="note"><span class="ring"></span><span class="tt">${n}</span></div>`)}${day.rows.map(rowHtml)}</div>
<div class="meals">${day.meals.map((m) => html`<div class="meal"><span class="slot">${m.slot}</span><span class="name">${m.meal}</span></div>`)}</div>
</div>`;
}

function rowHtml(r) {
  const c = personColors(r.pick, WALL, r.pale);
  const marks = html`<span class="who">${r.who}</span>${r.clash ? icon("set-center", "overlaps") : ""}`;
  const body = r.allDay
    ? html`<div class="tt">${r.title}${marks}</div>${r.time ? html`<div class="tm">${r.time}</div>` : ""}`
    : html`<div class="tm">${r.now ? html`<b class="now">Now</b>` : ""}${r.time}${marks}</div>${r.title ? html`<div class="tt">${r.title}</div>` : ""}`;
  return html`<div class="ev${r.allDay ? " allday" : ""}"${r.keep ? html` data-keep` : ""} style="--bar: ${c.bar}; --fill: ${r.faint ? c.faint : c.block}; --text: ${c.text}"><div>${body}</div>${r.icon ? html`<span class="ico">${icon(r.icon)}</span>` : ""}</div>`;
}

// "7:40 am" with its am or pm drawn smaller, as the prototypes do.
function small(words) {
  const m = /^(.*) ([ap]m)$/.exec(words);
  return m ? html`${m[1]}<small>${m[2]}</small>` : words;
}

// The marks README's retuned sizes, one text size (Standard; the setting is
// slice 5's). Colors are the look's, from the card's :host (theme.js).
const STYLE = html`<style>
.face { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; gap: 14px; padding: 24px 32px 22px 88px;
  overflow: hidden; background: var(--hb-bg); color: var(--hb-ink); font-weight: 500; font-variant-numeric: tabular-nums; }
.face * { box-sizing: border-box; }
.face svg { flex: none; color: var(--hb-mark); }
.face small { font-size: .5em; font-weight: 600; margin-left: .08em; }
.face .line, .face .tt, .face .words, .face .name { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.face .band { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 22px; align-items: start; }
.face .lead { display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 22px; min-height: 122px; }
.face .lead::before { content: ""; border-radius: 10px; background: var(--bar, transparent); }
.face .label { font-size: 28px; font-weight: 700; color: var(--hb-soft); }
.face .line { font-size: 84px; font-weight: 700; line-height: 1.04; letter-spacing: -.01em; -webkit-line-clamp: 3; }
.face .line .t { margin-right: .26em; }
.face .side, .face .today { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
.face .clock { font-size: 60px; font-weight: 700; line-height: 1; }
.face .date { font-size: 24px; font-weight: 600; color: var(--hb-soft); }
.face .wx, .face .rain { display: flex; align-items: center; gap: 8px; min-height: 1.2em; white-space: nowrap; }
.face .wx { font-size: 32px; font-weight: 700; }
.face .rain { font-size: 24px; font-weight: 600; }
.face .lo { color: var(--hb-soft); font-weight: 600; }
.face .quiet { font-size: 20px; font-weight: 600; color: var(--hb-soft); max-width: 18em; }
.face .needs:empty { display: none; }
.face .needs > div { min-height: 58px; display: flex; align-items: center; gap: 16px; padding: 6px 24px; font-size: 34px; font-weight: 600; line-height: 1.15;
  background: var(--hb-needs); color: var(--hb-needs-text); border-left: 12px solid var(--hb-needs-edge); border-radius: 6px 14px 14px 6px; }
.face .words { flex: 1; }
.face .more { font-size: .7em; white-space: nowrap; }
.face .cols { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.45fr 1fr 1fr 1fr; grid-template-rows: minmax(0, 1fr); }
.face .col { display: flex; flex-direction: column; gap: 10px; min-width: 0; min-height: 0; overflow: hidden; padding: 0 16px; border-left: 2px solid var(--hb-line); font-size: 26px; }
.face .col:first-child { border-left: 0; padding-left: 0; font-size: 28px; }
.face .hd { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; grid-template-rows: auto 18px; column-gap: 6px; align-items: center; }
.face .dn { font-size: 30px; font-weight: 700; white-space: nowrap; overflow: hidden; }
.face .wi { font-size: 26px; display: flex; }
.face .hl { font-size: 22px; font-weight: 600; white-space: nowrap; }
.face .chance { grid-area: 2 / 2; justify-self: center; font-size: 16px; font-weight: 600; color: var(--hb-soft); }
.face .list { flex: 1 1 auto; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 7px; }
.face .missing { font-size: .76em; font-weight: 600; color: var(--hb-soft); }
.face .note { display: flex; align-items: flex-start; gap: .4em; font-size: .93em; font-weight: 600; line-height: 1.15; }
.face .ring { flex: none; width: .82em; height: .82em; margin-top: .14em; border: .11em solid var(--hb-mark); border-radius: 50%; }
.face .ev { flex: none; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: .3em; align-items: start; padding: .03em .3em .05em .42em;
  background: var(--fill); border-left: .3em solid var(--bar); border-radius: .25em; }
.face .tm { font-size: .76em; font-weight: 600; line-height: 1.35; color: var(--text); }
.face .tt { font-weight: 600; line-height: 1.15; }
.face .allday .tt { font-size: .8em; padding: .12em 0; }
.face .who { margin-left: .45em; font-weight: 600; color: var(--text); }
.face .who + svg { font-size: 1.15em; margin-left: .35em; vertical-align: -.24em; }
.face .now { font-weight: 700; color: var(--hb-ink); background: var(--hb-bg); border-radius: .35em; padding: 0 .4em; margin-right: .4em; }
.face .ico { display: flex; font-size: 1.2em; margin-top: .05em; }
.face .meals { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
.face .meal { border-top: 2px solid var(--hb-line); padding-top: 6px; font-size: 22px; font-weight: 600; line-height: 1.15; }
.face .col:first-child .meal { font-size: 26px; }
.face .slot { display: block; font-size: 18px; font-weight: 700; color: var(--hb-soft); }
</style>`;

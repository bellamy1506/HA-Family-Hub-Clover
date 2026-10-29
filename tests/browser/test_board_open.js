// House fork browser test: in every layout, the board opens settled. Theme,
// size, and every event pill, card and row are already in their final
// places, sizes and colors before the calendars answer; only the event text
// waits. Meals and weather that loaded first stay; the timeline keeps its
// scroll; nothing shows while privacy mode is on; a failed calendar fetch
// doesn't erase the remembered layout; no event text is stored.
// Debug Info lists how long each step of the open took. With the server's
// copy of the calendars, text shows at once and each calendar's live answer
// replaces it.
// (owner, 2026-10-26)
//
// Run: node tests/browser/test_board_open.js   (ONLY=<text> for a subset)
// Needs Playwright with Chromium (the project's, or a Claude Code cloud
// session's preinstalled one); skips (exit 0) without it.
//
// Loads the served card (card/family-week-calendar-card.js) into
// harness.html with a fake Home Assistant whose calendars answer after
// CAL ms (one answer per calendar, counted in window.__calAnswered). The
// clock is fixed at 3 pm so the timeline scrolls.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

// Playwright from the project, else where Claude Code cloud sessions keep
// it. FH_REQUIRE_PLAYWRIGHT=1 (set in CI) fails instead of skipping.
let chromium;
const loadErrors = [];
for (const where of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
  try {
    ({ chromium } = require(where));
    break;
  } catch (e) {
    loadErrors.push(`${where}: ${e.message.split("\n")[0]}`);
  }
}
if (!chromium) {
  console.log(`board open (browser): skipped, Playwright not installed (${loadErrors.join("; ")})`);
  process.exit(process.env.FH_REQUIRE_PLAYWRIGHT ? 1 : 0);
}

const CAL = 1500;
const CALENDARS = 4;
const harness = fs.readFileSync(path.join(__dirname, "harness.html"), "utf8");
const card = fs.readFileSync(
  path.join(__dirname, "..", "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);
const EVENT_LIKE = ".event, .tl-event, .all-day-chip, .agenda-item:not(.mc-meal-pill), .mc-pill:not(.mc-meal-pill), .msd-item:not(.mc-meal-pill)";

const STABLE = [
  { name: "Month (split), phone", query: "view=month&month=split", width: 402 },
  { name: "Month (plain), phone", query: "view=month&month=month", width: 402 },
  { name: "Planner, phone", query: "view=week&week=planner", width: 402 },
  { name: "Planner, tablet", query: "view=week&week=planner", width: 1024 },
  { name: "Week, tablet", query: "view=week&week=week", width: 1024 },
  { name: "Week with timeline, tablet", query: "view=week&week=week&timeline=on", width: 1024 },
  { name: "Agenda, phone", query: "view=week&week=agenda", width: 402 },
  // Switching views: days already showing events keep them (with text).
  { name: "Day (switched to), tablet", query: "view=week&week=week", width: 1024, switchTo: "day" },
  { name: "Month (switched to from Planner), phone", query: "view=week&week=planner&month=month", width: 402, switchTo: "month" },
];

function snapshot(eventLike) {
  const el = window.__el;
  const grid = el && el.shadowRoot && el.shadowRoot.querySelector(".grid");
  if (!grid) return null;
  const items = [...grid.querySelectorAll(eventLike)].map((n) => {
    const r = n.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bg: getComputedStyle(n).backgroundColor, text: n.textContent.replace(/\u00a0/g, "").trim() };
  });
  // Every box in the grid except inside event elements (whose own box is in
  // items): headers, meals, day panels, rows. Inline text runs are skipped,
  // since blank text is narrower than real text.
  const boxes = [...grid.querySelectorAll("*")]
    .filter((n) => getComputedStyle(n).display !== "inline" && !(n.parentElement && n.parentElement.closest(eventLike)))
    .map((n) => {
      const r = n.getBoundingClientRect();
      return { k: (n.getAttribute("class") || n.tagName).split(" ")[0], x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
  const today = grid.querySelector(".day-col.today");
  return {
    gridH: Math.round(grid.getBoundingClientRect().height),
    items,
    boxes,
    scrolls: [...grid.querySelectorAll(".events")].map((e) => e.scrollTop),
    todayText: today ? today.textContent : "",
    meals: [...grid.querySelectorAll(".mc-meal-pill")].map((m) => { const r = m.getBoundingClientRect(); return `${m.textContent.trim()}@${Math.round(r.x)},${Math.round(r.y)}`; }),
    fcBg: el.style.getPropertyValue("--fc-bg"),
    bgImage: el.style.getPropertyValue("--fc-bg-image").slice(0, 60),
    answered: window.__calAnswered || 0,
  };
}

function gridText() {
  const grid = window.__el && window.__el.shadowRoot && window.__el.shadowRoot.querySelector(".grid");
  return grid ? grid.textContent : "";
}

async function withPage(browser, width, date, fn, height = 874) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.route("http://fh.test/**", (route) => {
    if (route.request().url().includes("card.js")) return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: card });
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: harness });
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(date || "2026-10-27T15:00:00"));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await fn(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await context.close();
  }
}

// Opens the board; with switchTo, waits for the first view's events, then
// switches. Returns the number of calendar answers that means "all in".
async function open(page, query, switchTo) {
  await page.goto(`http://fh.test/harness.html?${query}&cal=${CAL}`);
  await page.waitForFunction(() => window.__el && window.__el._viewMode);
  if (!switchTo) return CALENDARS;
  await page.waitForFunction((n) => (window.__calAnswered || 0) >= n, CALENDARS);
  await page.waitForTimeout(300);
  await page.evaluate((mode) => {
    window.__el._viewMode = mode;
    window.__el._renderGrid();
    window.__el._fetchEvents();
  }, switchTo);
  return CALENDARS * 2;
}

async function settle(page, calls) {
  await page.waitForFunction((n) => (window.__calAnswered || 0) >= n, calls);
  await page.waitForTimeout(300);
}

// Second open, measured just before and just after the calendars answer.
async function beforeAndAfter(page, query, switchTo) {
  const calls = await open(page, query, switchTo);
  await page.waitForTimeout(CAL / 2);
  const before = await page.evaluate(snapshot, EVENT_LIKE);
  await settle(page, calls);
  const after = await page.evaluate(snapshot, EVENT_LIKE);
  assert.ok(before.answered < calls, "measured before the calendars answered");
  return { before, after };
}

function assertStable(before, after, { allowText = false } = {}) {
  assert.ok(after.items.length > 0, "the scenario has events");
  assert.strictEqual(before.items.length, after.items.length, `same number of event elements (${before.items.length} vs ${after.items.length})`);
  before.items.forEach((b, i) => {
    const a = after.items[i];
    for (const k of ["x", "y", "w", "h"]) assert.ok(Math.abs(b[k] - a[k]) <= 1, `element ${i} ${k}: ${b[k]} before, ${a[k]} after`);
    assert.strictEqual(b.bg, a.bg, `element ${i} color`);
    if (!allowText) assert.strictEqual(b.text, "", `element ${i} has no text before the calendars answer: "${b.text}"`);
  });
  assert.ok(Math.abs(before.gridH - after.gridH) <= 1, `grid height ${before.gridH} before, ${after.gridH} after`);
  assert.deepStrictEqual(before.scrolls, after.scrolls, "timeline scroll unchanged");
  assert.strictEqual(before.boxes.length, after.boxes.length, `same number of boxes in the grid (${before.boxes.length} vs ${after.boxes.length})`);
  before.boxes.forEach((b, i) => {
    const a = after.boxes[i];
    assert.strictEqual(b.k, a.k, `box ${i}: .${b.k} before, .${a.k} after`);
    for (const k of ["x", "y", "w", "h"]) assert.ok(Math.abs(b[k] - a[k]) <= 1, `box ${i} (.${b.k}) ${k}: ${b[k]} before, ${a[k]} after`);
  });
}

const CHECKS = [
  ...STABLE.map((s) => ({
    name: s.name, width: s.width,
    run: async (page) => {
      const calls = await open(page, s.query, s.switchTo); // first open remembers
      await settle(page, calls);
      const { before, after } = await beforeAndAfter(page, s.query, s.switchTo);
      assertStable(before, after, { allowText: !!s.switchTo });
      const stored = await page.evaluate(() => Object.values(localStorage).join(" "));
      assert.ok(!stored.includes("SECRET"), "no event text stored");
      return `${after.items.length} event elements stable`;
    },
  })),
  {
    name: "Week, meals load before calendars", width: 1024,
    run: async (page) => {
      await settle(page, await open(page, "view=week&week=week"));
      const { before } = await beforeAndAfter(page, "view=week&week=week");
      assert.ok(before.todayText.includes("Tacos tonight"), "today's meal shows before the calendars answer");
      return "meal visible before calendars";
    },
  },
  ...[["Month (split) with meals, phone", "view=month&month=split&meals=all", 402], ["Agenda with meals, phone", "view=week&week=agenda&meals=all", 402]].map(([name, q, width]) => ({
    name: `${name}: meals load before calendars`, width,
    run: async (page) => {
      await settle(page, await open(page, q));
      const { before, after } = await beforeAndAfter(page, q);
      const meals = (x) => x.meals.join("|");
      assert.ok(before.meals.length > 0 && before.meals.every((m) => m.includes("Tacos tonight")), `meals before the calendars answer: ${meals(before)}`);
      assert.strictEqual(meals(before), meals(after), "every meal (cell and day panel) shows before the calendars answer");
      assertStable(before, after);
      return `${before.meals.length} meals visible, nothing moved`;
    },
  })),
  {
    name: "Month (split), a meal added since the last open shows before calendars", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split&meals=all&nomeal=1"));
      const calls = await open(page, "view=month&month=split&meals=all");
      await page.waitForTimeout(CAL / 2);
      const text = await page.evaluate(() => window.__el.shadowRoot.querySelector(".grid").textContent);
      assert.ok(text.includes("Tacos tonight"), "the new meal shows before the calendars answer");
      await settle(page, calls);
      return "new meal visible before calendars";
    },
  },
  {
    name: "Planner, phone: person names show while waiting", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=week&week=planner"));
      const calls = await open(page, "view=week&week=planner");
      await page.waitForTimeout(CAL / 2);
      const names = await page.evaluate(() => [...window.__el.shadowRoot.querySelectorAll(".planner-mobile-person-name")].map((n) => n.textContent.trim()));
      assert.ok(names.length > 0 && names.every((n) => n.length > 0), `names before the calendars answer: ${JSON.stringify(names)}`);
      await settle(page, calls);
      return `${names.length} names shown`;
    },
  },
  {
    name: "Switching Month to Week: no ghost events on days already known empty", width: 1024,
    run: async (page) => {
      // Last time, day +3 had four events in Week; since then they were deleted.
      await settle(page, await open(page, "view=week&week=week"));
      const { before, after } = await beforeAndAfter(page, "view=month&month=month&week=week&drop=1", "week");
      assertStable(before, after, { allowText: true });
      return `${after.items.length} event elements, none stale`;
    },
  },
  {
    name: "A layout isn't saved while the card is hidden", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      const calls = await open(page, "view=month&month=split");
      await page.evaluate(() => { window.__el.style.display = "none"; });
      await settle(page, calls);
      const { before, after } = await beforeAndAfter(page, "view=month&month=split");
      assertStable(before, after);
      return "layout survived a hidden fetch";
    },
  },
  {
    name: "A failed calendar fetch keeps the remembered layout", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      await settle(page, await open(page, "view=month&month=split&fail=1"));
      const { before, after } = await beforeAndAfter(page, "view=month&month=split");
      assertStable(before, after);
      return "layout survived a failed fetch";
    },
  },
  {
    name: "Privacy mode on: nothing shown", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      await open(page, "view=month&month=split&privacy=on");
      for (const t of [100, 400, CAL / 2]) {
        await page.waitForTimeout(t === 100 ? 100 : t - 100);
        const s = await page.evaluate(snapshot, EVENT_LIKE);
        assert.strictEqual(s.items.length, 0, `no event shapes at ${t} ms with privacy mode on`);
      }
      return "no shapes while privacy mode is on";
    },
  },
  // Theme: no cream flash. On Halloween the card swaps in its own background;
  // the first open of the day (last session was the day before) must show it
  // from the start too.
  ...[["2026-10-27T15:00:00", "2026-10-27T15:00:00", "theme"], ["2026-10-30T15:00:00", "2026-10-31T15:00:00", "theme, first open on Halloween"]].map(([day1, day2, label]) => ({
    name: `Liquid Glass Dark ${label}: no flash`, width: 402, date: day1,
    run: async (page) => {
      const q = "view=month&month=split&theme=liquidglassdark";
      await settle(page, await open(page, q));
      await page.clock.setFixedTime(new Date(day2));
      await page.goto(`http://fh.test/harness.html?${q}&cal=${CAL}`);
      await page.waitForFunction(() => window.__el && window.__el._viewMode);
      const early = await page.evaluate(snapshot, EVENT_LIKE);
      await settle(page, CALENDARS);
      const settled = await page.evaluate(snapshot, EVENT_LIKE);
      assert.strictEqual(settled.fcBg, "#0b1020", "settled on the theme");
      assert.strictEqual(early.fcBg, settled.fcBg, `background ${early.fcBg} early, ${settled.fcBg} settled`);
      assert.strictEqual(early.bgImage, settled.bgImage, `background image "${early.bgImage}" early, "${settled.bgImage}" settled`);
      return `background ${early.fcBg}${day2.includes("10-31") ? ", Halloween image from the start" : ""}`;
    },
  })),
  // Debug Info lists how long each step of the open took (owner, 2026-10-26).
  {
    name: "Debug Info shows the open timing", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      const text = await page.evaluate(() => {
        const root = window.__el.shadowRoot;
        root.querySelector(".settings-debug-btn").click();
        return root.querySelector(".debug-content").innerText;
      });
      const steps = ["Card file ran", "Home Assistant connected", "Settings loaded", "Event people loaded", "Permissions loaded", "Calendars asked", "Will answered", "Home answered", "Us answered", "Work answered", "All calendars live"];
      const at = {};
      for (const m of text.matchAll(/^ {2}(.+): (\d+)/gm)) at[m[1]] = Number(m[2]);
      for (const s of steps) assert.ok(s in at, `"${s}" listed in:\n${text.slice(0, 600)}`);
      assert.ok(text.startsWith("Open timing on fh.test"), "timing comes first, with the address");
      // The setup steps run one after another; the calendars answer in any order.
      const order = ["Card file ran", "Home Assistant connected", "Settings loaded", "Event people loaded", "Permissions loaded", "Calendars asked", "All calendars live"].map((s) => at[s]);
      assert.deepStrictEqual([...order].sort((a, b) => a - b), order, `steps in order: ${order.join(", ")}`);
      for (const s of steps.filter((x) => x.endsWith("answered"))) assert.ok(at[s] >= at["Calendars asked"] && at[s] <= at["All calendars live"], `${s} between asked and shown`);
      assert.ok(at["All calendars live"] - at["Calendars asked"] >= CAL, "the calendar wait is counted");
      assert.ok(!text.includes("not drawn yet"), "marked done once events drew");
      return `${steps.length} steps, calendars ${at["All calendars live"] - at["Calendars asked"]} ms`;
    },
  },
  // The server's copy (calendar_cache.py, owner 2026-10-26): text right
  // away, each calendar's live answer replacing it, and back to the server.
  {
    name: "Server copy: text right away, then live", width: 402,
    run: async (page) => {
      await open(page, "view=month&month=split&cache=1");
      await page.waitForTimeout(CAL / 2);
      const early = await page.evaluate(gridText);
      assert.ok(early.includes("CACHED dentist") && !early.includes("SECRET"), `the copy shows before the calendars answer: ${early.slice(0, 200)}`);
      await settle(page, CALENDARS);
      const late = await page.evaluate(gridText);
      assert.ok(late.includes("SECRET dentist") && !late.includes("CACHED"), "live events replace the copy");
      const puts = await page.evaluate(() => window.__cachePuts || []);
      assert.strictEqual(puts.length, 1, "one copy sent back");
      assert.deepStrictEqual(Object.keys(puts[0].calendars).sort(), ["calendar.home", "calendar.us", "calendar.wills_calendar", "calendar.work"]);
      assert.ok(puts[0].calendars["calendar.wills_calendar"].every((e) => e.summary.startsWith("SECRET")), "the live events, not the copy");
      return "copy first, then live, then sent back";
    },
  },
  {
    name: "Server copy: each calendar replaces it as it answers", width: 402,
    run: async (page) => {
      await open(page, "view=month&month=split&cache=1&slow=calendar.wills_calendar");
      await page.waitForFunction(() => (window.__calAnswered || 0) >= 3);
      await page.waitForTimeout(300);
      const mid = await page.evaluate(gridText);
      assert.ok(mid.includes("SECRET trash night"), "Home's live answer is showing");
      assert.ok(mid.includes("CACHED dentist") && !mid.includes("SECRET dentist"), "Will still shows the copy");
      await settle(page, CALENDARS);
      const late = await page.evaluate(gridText);
      assert.ok(late.includes("SECRET dentist") && !late.includes("CACHED"), "then Will's live answer");
      return "three columns live while Will waits";
    },
  },
  {
    name: "Server copy: never while privacy mode is on", width: 402,
    run: async (page) => {
      await open(page, "view=month&month=split&cache=1&privacy=on");
      await page.waitForTimeout(CAL / 2);
      assert.ok(!(await page.evaluate(gridText)).includes("CACHED"), "nothing from the copy");
      return "nothing shown";
    },
  },
  {
    name: "Server copy: waits until privacy mode is known", width: 402,
    run: async (page) => {
      // The copy answers after the device report (which sets the privacy
      // overlay) but before privacy mode itself is known.
      await open(page, "view=month&month=split&cache=1&privacydelay=500&cachedelay=150");
      await page.waitForTimeout(300);
      assert.ok(!(await page.evaluate(gridText)).includes("CACHED"), "not before privacy mode is known");
      await page.waitForTimeout(600);
      assert.ok((await page.evaluate(gridText)).includes("CACHED dentist"), "then the copy");
      return "held until privacy known";
    },
  },
  {
    name: "Server copy: the 60 s poll never swaps live events for it", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split&cache=1"));
      // Started, not awaited: look while the poll's calendars are out.
      await page.evaluate(() => { window.__el._fetchEvents(); });
      await page.waitForTimeout(CAL / 2);
      const text = await page.evaluate(gridText);
      assert.ok(text.includes("SECRET dentist") && !text.includes("CACHED"), "live events stay");
      return "live events stay";
    },
  },
  {
    name: "Server copy: a failing calendar doesn't bring it back each poll", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split&cache=1&fail=1"));
      await page.evaluate(() => { window.__el._fetchEvents(); });
      await page.waitForTimeout(CAL / 2);
      assert.ok(!(await page.evaluate(gridText)).includes("CACHED"), "the copy stays away");
      await page.waitForTimeout(CAL);
      const puts = await page.evaluate(() => window.__cachePuts || []);
      assert.strictEqual(puts.length, 0, "failed calendars aren't sent back");
      return "no copy on the poll";
    },
  },
  {
    name: "Server copy: sent back only when a calendar changed", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split&cache=1"));
      await page.evaluate(() => window.__el._fetchEvents());
      await page.waitForTimeout(300);
      const puts = await page.evaluate(() => window.__cachePuts || []);
      assert.strictEqual(puts.length, 1, `one send for two unchanged checks (${puts.length})`);
      return "one send";
    },
  },
  // Wall tablet (1200x800): timeline, Agenda and Split's day list text follow
  // the theme's event text size, as the other views do, instead of fixed
  // 9-13 px (Clover Tablet loop, 2026-10-28 and 2026-10-29). A one-hour event
  // still shows its title, and no half-cut time.
  ...[["Day", "view=week&week=week&timeline=on", "day"], ["Week timeline", "view=week&week=week&timeline=on", null], ["Agenda", "view=week&week=agenda", null], ["Split", "view=month&month=split", null]].flatMap(([where, query, switchTo]) => [20, 14].map((size) => ({
    name: `Tablet text: ${where} follows the theme's event size (${size}px)`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `${query}&theme=liquidglassdark&eventfont=${size}&hdr=0`, switchTo));
      await page.waitForTimeout(400);
      const found = await page.evaluate(() => {
        const grid = window.__el.shadowRoot.querySelector(".grid");
        const px = (n) => (n ? parseFloat(getComputedStyle(n).fontSize) : 0);
        const ev = grid.querySelector(".tl-event, .agenda-item.event, .msd-item.event");
        const title = ev.querySelector(".tl-summary, .agenda-item-summary, .msd-item-summary");
        const time = ev.querySelector(".tl-time, .agenda-item-time, .msd-item-time");
        const box = ev.getBoundingClientRect();
        const line = title.getClientRects()[0];
        const t = time.getBoundingClientRect();
        const hidden = getComputedStyle(time).display === "none";
        return { title: px(title), time: px(time), date: px(grid.querySelector(".msd-date")), titleShows: !!line && line.top >= box.top && line.top + px(title) <= box.bottom + 1, timeWhole: hidden || t.bottom <= box.bottom + 1, timeShown: !hidden, h: Math.round(box.height) };
      });
      assert.strictEqual(found.title, size, `title at the theme's ${size}px (${found.title})`);
      assert.ok(found.time >= Math.min(11, size * 0.8), `time at least 0.8 of it (${found.time})`);
      assert.ok(found.titleShows, `the title's first line shows in a ${found.h}px event`);
      assert.ok(found.timeWhole, `the time shows whole or not at all in a ${found.h}px event`);
      if (where === "Agenda" || where === "Split") assert.ok(found.timeShown, `${where} shows the time`);
      if (where === "Split") assert.ok(found.date >= size, `the day's date at least the event size (${found.date})`);
      return `title ${found.title}px, time ${found.time}px${found.timeShown ? "" : " (hidden)"}`;
    },
  }))),
  // A line across today's timeline at the current time, as Skylight's "now"
  // bar (Clover Tablet loop, 2026-10-28). Only today; moves with the clock;
  // the saved shapes aren't rewritten as it moves.
  ...[["Week timeline", "view=week&week=week&timeline=on", null, 1], ["Day", "view=week&week=week&timeline=on", "day", 4]].map(([where, query, switchTo, lines]) => ({
    name: `Now line: ${where} shows the current time on today only`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `${query}&hdr=0`, switchTo));
      await page.waitForTimeout(400);
      const read = () => page.evaluate(() => {
        const grid = window.__el.shadowRoot.querySelector(".grid");
        return [...grid.querySelectorAll(".fh-now-line")].map((n) => {
          const unit = n.closest("[data-fh-unit]");
          const tl = n.closest(".timeline");
          return { unit: unit && unit.dataset.fhUnit.split("|")[1], top: Math.round(n.getBoundingClientRect().top - tl.getBoundingClientRect().top), shown: n.getClientRects().length > 0 };
        });
      });
      const at3 = await read();
      assert.strictEqual(at3.length, lines, `${lines} line(s) (${JSON.stringify(at3)})`);
      assert.ok(at3.every((l) => l.unit === "2026-10-27" && l.shown), `only on today: ${JSON.stringify(at3)}`);
      assert.ok(at3.every((l) => Math.abs(l.top - 280) <= 1), `3 pm is 7 hours below 8 am at 40 px an hour: ${JSON.stringify(at3)}`);
      const sig = await page.evaluate(() => window.__el._shapeLayoutSignature);
      assert.ok(sig, "the shapes were saved");
      await page.clock.setFixedTime(new Date("2026-10-27T15:30:00"));
      await page.evaluate(() => window.__el._fetchEvents());
      await page.waitForTimeout(CAL + 600);
      const at330 = await read();
      assert.ok(at330.length === lines && at330.every((l) => Math.abs(l.top - 300) <= 1), `moves to 3:30: ${JSON.stringify(at330)}`);
      assert.strictEqual(await page.evaluate(() => window.__el._shapeLayoutSignature), sig, "saved shapes not rewritten as it moves");
      await page.clock.setFixedTime(new Date("2026-10-27T23:00:00"));
      await page.evaluate(() => window.__el._fetchEvents());
      await page.waitForTimeout(CAL + 600);
      assert.ok((await read()).every((l) => !l.shown), "hidden after the last hour shown");
      return `${lines} line(s), at 280 then 300 px`;
    },
  })),
  // The first hour label on every timeline shows whole: it sat 7 px above
  // its line, outside the scrolling box, so in Week it was cut right under
  // the last meal slot (Clover Tablet loop, 2026-10-29). The other labels,
  // the hour lines and the events stay where they were.
  ...[["Day", "day", 4, 0], ["Week timeline, meal slots above", null, 7, 7], ["Week timeline, 3 days, meal slots above", null, 3, 3]].map(([where, switchTo, timelines, withMeals]) => ({
    name: `First hour label: ${where} shows it whole`, width: 1200, height: 800,
    run: async (page) => {
      if (timelines === 3) await page.addInitScript(() => { localStorage.setItem("familyCalendarWeekDayCountLocal", "3"); localStorage.setItem("familyCalendarCurrentDayFirstLocal", "on"); });
      await settle(page, await open(page, "view=week&week=week&timeline=on&hdr=0", switchTo));
      await page.waitForTimeout(400);
      const found = await page.evaluate(() => {
        const grid = window.__el.shadowRoot.querySelector(".grid");
        return [...grid.querySelectorAll(".events")].filter((e) => e.querySelector(".timeline")).map((box) => {
          box.scrollTop = 0;
          const tl = box.querySelector(".timeline");
          const t = tl.getBoundingClientRect().top;
          const rows = [...tl.querySelectorAll(":scope > .hour-row")];
          const labels = rows.map((r) => r.querySelector(".hour-label").getBoundingClientRect());
          const ev = tl.querySelector(":scope > .tl-event");
          const first = rows[0].querySelector(".hour-label");
          const hit = window.__el.shadowRoot.elementFromPoint(labels[0].left + labels[0].width / 2, labels[0].top + 1);
          const above = [...box.parentElement.children].filter((n) => n !== box && n.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING);
          return {
            uncovered: hit === first,
            mealsAbove: above.filter((n) => /meal|Tap to add|Tacos/i.test(n.className + " " + n.textContent) && n.getBoundingClientRect().bottom <= labels[0].top).length > 0,
            visibleTop: Math.round(box.getBoundingClientRect().top + box.clientTop),
            firstTop: Math.round(labels[0].top),
            firstInRow: Math.round(labels[0].bottom - rows[0].getBoundingClientRect().top) <= 40,
            otherOffsets: labels.slice(1).map((l, i) => Math.round(l.top - rows[i + 1].getBoundingClientRect().top)),
            rowTops: rows.map((r) => Math.round(r.getBoundingClientRect().top - t)),
            eventOff: ev ? Math.round(ev.getBoundingClientRect().top - t) - parseFloat(ev.style.top) : 0,
            pads: [getComputedStyle(tl).marginTop, getComputedStyle(tl).paddingTop, getComputedStyle(box).paddingTop].join(" "),
          };
        });
      });
      assert.strictEqual(found.length, timelines, `${timelines} timeline(s)`);
      for (const f of found) {
        assert.ok(f.firstTop >= f.visibleTop, `first label top ${f.firstTop} not above the visible top ${f.visibleTop}`);
        assert.ok(f.firstInRow, "first label inside its hour");
        assert.ok(f.uncovered, "nothing (a meal slot, the column edge) covers the first label's top");
        // top: -7px from inside the row's 1 px top border: 6 px above it.
        assert.ok(f.otherOffsets.length > 0 && f.otherOffsets.every((o) => o === -6), `other labels still where upstream puts them: ${f.otherOffsets}`);
        assert.ok(f.rowTops.every((top, i) => top === i * 40), `hour lines 40 px apart from the top: ${f.rowTops}`);
        assert.ok(Math.abs(f.eventOff) <= 1, `events on their hours (${f.eventOff})`);
        assert.strictEqual(f.pads, "0px 0px 0px", "timeline not moved down (margin, padding, box padding)");
      }
      assert.strictEqual(found.filter((f) => f.mealsAbove).length >= withMeals, true, `meal slots above the timeline in ${withMeals} column(s): ${found.map((f) => f.mealsAbove)}`);
      return `${found.length} timeline(s), first label at the visible top + ${found[0].firstTop - found[0].visibleTop}px`;
    },
  })),
  {
    name: "Now line: none without the timeline", width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, "view=week&week=week&hdr=0"));
      assert.strictEqual(await page.evaluate(() => window.__el.shadowRoot.querySelectorAll(".fh-now-line").length), 0);
      return "none";
    },
  },
  // Week view: today's header is filled with the theme's accent, as Planner
  // already marks today, so today reads from across the room (Clover Tablet
  // loop, 2026-10-28). Other days stay plain.
  ...[["default theme", ""], ["dark theme", "&theme=liquidglassdark"]].map(([which, theme]) => ({
    name: `Today: Week fills today's header (${which})`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `view=week&week=week&hdr=0${theme}`));
      const found = await page.evaluate(() => {
        const el = window.__el;
        const probe = document.createElement("div");
        el.shadowRoot.appendChild(probe);
        const color = (v) => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
        const accent = color("--fc-accent"), accentText = color("--fc-accent-text");
        probe.remove();
        return [...el.shadowRoot.querySelectorAll(".grid .day-col")].map((col) => {
          const h = col.querySelector(".day-header");
          return { today: col.classList.contains("today"), bg: getComputedStyle(h).backgroundColor, name: getComputedStyle(h.querySelector(".name")).color, num: getComputedStyle(h.querySelector(".num")).color, accent, accentText };
        });
      });
      const today = found.filter((d) => d.today);
      assert.strictEqual(today.length, 1, "one today");
      const t = today[0];
      assert.ok(t.bg === t.accent && t.name === t.accentText && t.num === t.accentText, `today's header in accent: ${JSON.stringify(t)}`);
      assert.ok(found.filter((d) => !d.today).every((d) => d.bg !== t.accent), "other days plain");
      return `today ${t.bg}`;
    },
  })),
  // Week view: the temperature next to each day's date reads at 4.5:1 or
  // better against its column, light and dark themes alike (Clover Tablet
  // loop, 2026-10-29: Liquid Glass's light teal measured 2.3:1 on the wall
  // tablet). Today's stays in the accent's text color on the accent fill.
  ...[["default theme", ""], ["Liquid Glass", "liquidglass"], ["HA Light", "halight"], ["Liquid Glass Dark", "liquidglassdark"], ["Midnight", "midnight"]].map(([which, theme]) => ({
    name: `Weather: Week temperatures read at 4.5:1 (${which})`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `view=week&week=week&hdr=0&wx=1${theme ? `&theme=${theme}` : ""}`));
      await page.waitForTimeout(400);
      const found = await page.evaluate(() => {
        const el = window.__el;
        // Colors as [r, g, b, a] in 0-255, a 0-1; color-mix computes to color(srgb ...).
        const parse = (c) => {
          let m = c.match(/^rgba?\(([^)]+)\)/);
          if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
          m = c.match(/^color\(srgb ([^)]+)\)/);
          if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
          throw new Error(`unparsed color ${c}`);
        };
        const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
        // The column's background as painted: its own and its ancestors'
        // backgrounds, down to the first opaque one (ha-card, the theme's bg).
        const backdrop = (n) => {
          const layers = [];
          for (let x = n; x; x = x.parentElement || (x.getRootNode() && x.getRootNode().host)) {
            const c = parse(getComputedStyle(x).backgroundColor);
            if (c[3] > 0) layers.push(c);
            if (c[3] >= 1) break;
          }
          return layers.reverse().reduce((under, top) => over(top, under), [255, 255, 255, 1]);
        };
        const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
        const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
        return [...el.shadowRoot.querySelectorAll(".grid .day-col")].map((col) => {
          const t = col.querySelector(".wx-temp");
          if (!t) return { today: col.classList.contains("today"), missing: true };
          const bg = backdrop(t);
          const own = parse(getComputedStyle(t).color);
          const fg = over([own[0], own[1], own[2], own[3] * parseFloat(getComputedStyle(t).opacity)], bg);
          const accentText = parse(getComputedStyle(col.querySelector(".day-header .num")).color);
          return { today: col.classList.contains("today"), ratio: Math.round(ratio(fg, bg) * 100) / 100, fg: fg.slice(0, 3).map(Math.round), bg: bg.slice(0, 3).map(Math.round), todayOk: own.slice(0, 3).every((v, i) => Math.abs(v - accentText[i]) < 1) };
        });
      });
      assert.ok(found.length === 7 && found.every((d) => !d.missing), `a temperature in every day's header: ${JSON.stringify(found)}`);
      const others = found.filter((d) => !d.today);
      const low = others.filter((d) => d.ratio < 4.5);
      assert.ok(!low.length, `every other day's temperature at 4.5:1 or better: ${low.length ? `${low[0].ratio}:1, rgb(${low[0].fg}) on rgb(${low[0].bg})` : ""}`);
      assert.ok(found.filter((d) => d.today).every((d) => d.todayOk), "today's temperature keeps the accent's text color");
      return `${others[0].ratio}:1, rgb(${others[0].fg}) on rgb(${others[0].bg})`;
    },
  })),
  // Agenda dims events that have ended, as Week does with "Grey out past
  // events" on (Clover Tablet loop, 2026-10-29). At 3 pm the 9 am dentist is
  // dimmed, the 7 pm trash night isn't; with the setting off, nothing is.
  ...[["on", ""], ["off", "&grey=off"]].map(([grey, param]) => ({
    name: `Agenda: past events dimmed (setting ${grey})`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `view=week&week=agenda&hdr=0${param}`));
      const rows = await page.evaluate(() => [...window.__el.shadowRoot.querySelectorAll(".grid .agenda-item.event")].map((n) => ({
        title: n.querySelector(".agenda-item-summary").textContent.trim(), past: n.classList.contains("past"), opacity: getComputedStyle(n).opacity,
      })));
      const row = (text) => rows.find((r) => r.title.includes(text));
      const dentist = row("dentist"), trash = row("trash night");
      assert.ok(dentist && trash, `rows found: ${JSON.stringify(rows)}`);
      if (grey === "on") {
        assert.ok(dentist.past && dentist.opacity === "0.45", `9 am dimmed: ${JSON.stringify(dentist)}`);
        assert.ok(!trash.past && trash.opacity === "1", `7 pm not: ${JSON.stringify(trash)}`);
        assert.deepStrictEqual(rows.filter((r) => r.past).map((r) => r.title), [dentist.title], "only the 9 am one");
      } else {
        assert.ok(rows.every((r) => !r.past && r.opacity === "1"), `none dimmed: ${JSON.stringify(rows.filter((r) => r.past))}`);
      }
      return `${rows.filter((r) => r.past).length} of ${rows.length} dimmed`;
    },
  })),
  // Start view (Clover Tablet loop, 2026-10-29): the household opens in
  // Month; one copy (the wall tablet) can open in Week instead, in its own
  // Week variant, without changing the household. "household" keeps Month.
  ...[["week", "week", ".day-col"], ["household", "month", ".month-cell"], ["month", "month", ".month-cell"]].map(([start, mode, unit]) => ({
    name: `Start view: household Month, copy ${start}`, width: 1200, height: 800,
    run: async (page) => {
      await settle(page, await open(page, `view=month&week=week&month=month&start=${start}&hdr=0`));
      const seen = await page.evaluate((u) => ({ mode: window.__el._viewMode, units: window.__el.shadowRoot.querySelectorAll(`.grid ${u}`).length }), unit);
      assert.strictEqual(seen.mode, mode, `opens in ${mode}`);
      assert.ok(seen.units > 0, `${unit} drawn`);
      return `opens in ${seen.mode}`;
    },
  })),
  // Debug Info closes from anywhere in it, and from outside it (owner,
  // 2026-10-26: the close button scrolled away under Home Assistant's bar).
  {
    name: "Debug Info: close button stays reachable", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      const openPanel = () => page.evaluate(() => window.__el.shadowRoot.querySelector(".settings-debug-btn").click());
      const isOpen = () => page.evaluate(() => window.__el.shadowRoot.querySelector(".debug-overlay").classList.contains("open"));
      await openPanel();
      const spot = await page.evaluate(() => {
        const root = window.__el.shadowRoot;
        const box = root.querySelector(".debug-box");
        box.scrollTop = box.scrollHeight;
        const r = root.querySelector(".debug-close").getBoundingClientRect();
        const header = parseInt(getComputedStyle(window.__el).getPropertyValue("--fh-header-offset"), 10) || 0;
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const hit = root.elementFromPoint(x, y);
        return { x, y, top: r.top, header, scrolled: box.scrollTop > 0, hit: !!(hit && hit.closest(".debug-close")), boxTop: box.getBoundingClientRect().top };
      });
      assert.ok(spot.scrolled, "the panel scrolls");
      assert.ok(spot.header > 0 && spot.boxTop >= spot.header, `the panel starts below the top bar (${spot.boxTop} vs ${spot.header})`);
      assert.ok(spot.hit && spot.top >= spot.header, `the close button is visible and on top after scrolling (top ${spot.top})`);
      await page.mouse.click(spot.x, spot.y);
      assert.ok(!(await isOpen()), "the close button closes it");
      await openPanel();
      await page.mouse.click(200, 400);
      assert.ok(await isOpen(), "a tap inside the panel leaves it open");
      await page.mouse.click(3, 400);
      assert.ok(!(await isOpen()), "a tap outside closes it");
      return "closes after scrolling and from outside";
    },
  },
  // Every popup, not just Debug Info: filled until it scrolls, its close
  // button stays visible, on top, and below Home Assistant's bar.
  // On the phone, and on the wall tablet with and without Home Assistant's
  // top bar (Fully Kiosk may hide it).
  ...[["phone", 402, ""], ["tablet", 1200, ""], ["tablet, no top bar", 1200, "&hdr=0"]].map(([where, width, bar]) => ({
    name: `Every popup: close button stays reachable (${where})`, width,
    run: async (page) => {
      await settle(page, await open(page, `view=month&month=split${bar}`));
      const results = await page.evaluate(() => {
        const el = window.__el;
        const root = el.shadowRoot;
        const header = parseInt(getComputedStyle(el).getPropertyValue("--fh-header-offset"), 10) || 0;
        const out = [];
        root.querySelectorAll(".modal-overlay").forEach((overlay) => {
          const box = overlay.querySelector(".modal-box");
          const close = box && box.querySelector(":scope > .modal-close");
          if (!close) return;
          const name = [...overlay.classList].find((c) => c !== "modal-overlay");
          root.querySelectorAll(".modal-overlay.open").forEach((o) => o.classList.remove("open"));
          el._openModal(overlay);
          const filler = document.createElement("div");
          filler.style.height = "3000px";
          box.appendChild(filler);
          box.scrollTop = 0;
          const b0 = box.getBoundingClientRect();
          const c0 = close.getBoundingClientRect();
          box.scrollTop = box.scrollHeight;
          const b = box.getBoundingClientRect();
          const c = close.getBoundingClientRect();
          const hit = root.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
          out.push({
            name, scrolled: box.scrollTop > 0, boxTop: Math.round(b.top), closeTop: Math.round(c.top),
            onTop: !!(hit && hit.closest(".modal-close") === close), inside: c.top >= b.top - 1 && c.bottom <= b.bottom + 1,
            startTop: Math.round(c0.top - b0.top), startRight: Math.round(b0.right - c0.right),
          });
          filler.remove();
          overlay.classList.remove("open");
        });
        return { header, out };
      });
      const { header, out } = results;
      assert.ok((bar ? header === 0 : header > 0) && out.length >= 20, `${out.length} popups checked, top bar ${header}px`);
      const bad = out.filter((r) => !(r.scrolled && r.onTop && r.inside && r.boxTop >= header && r.closeTop >= header));
      assert.deepStrictEqual(bad, [], `every close button stays reachable after scrolling: ${JSON.stringify(bad)}`);
      const moved = out.filter((r) => !["grocy-recipe-viewer-overlay", "fh-step-editor-overlay"].includes(r.name) && (Math.abs(r.startTop - 10) > 1 || Math.abs(r.startRight - 10) > 1));
      assert.deepStrictEqual(moved, [], `each close button starts where it always sat, 10px in from the corner: ${JSON.stringify(moved)}`);
      return `${out.length} popups`;
    },
  })),
  {
    name: "Every popup: the + button doesn't cover it", width: 402,
    run: async (page) => {
      await settle(page, await open(page, "view=month&month=split"));
      const fabShown = () => page.evaluate(() => { const f = window.__el.shadowRoot.querySelector(".add-event-fab"); return !!f && getComputedStyle(f).display !== "none" && f.getClientRects().length > 0; });
      assert.ok(await fabShown(), "the + button shows on the board");
      const names = await page.evaluate(() => [...window.__el.shadowRoot.querySelectorAll(".modal-overlay")].map((o) => [...o.classList].find((c) => c !== "modal-overlay")));
      const covered = [];
      for (const name of names) {
        await page.evaluate((n) => window.__el._openModal(window.__el.shadowRoot.querySelector("." + n)), name);
        await page.waitForTimeout(50);
        if (await fabShown()) covered.push(name);
        await page.evaluate((n) => window.__el.shadowRoot.querySelector("." + n).classList.remove("open"), name);
        await page.waitForTimeout(50);
      }
      assert.deepStrictEqual(covered, [], "hidden while each popup is open");
      assert.ok(await fabShown(), "back once they close");
      return `${names.length} popups`;
    },
  },
];

(async () => {
  let failures = 0;
  // ONLY=<text> runs just the checks whose name contains it.
  const only = process.env.ONLY;
  for (const check of CHECKS.filter((c) => !only || c.name.includes(only))) {
    // One browser per check keeps memory flat over a full run.
    const browser = await chromium.launch();
    try {
      let note;
      await withPage(browser, check.width, check.date, async (page) => { note = await check.run(page); }, check.height);
      console.log(`  ok   ${check.name}: ${note}`);
    } catch (e) {
      failures++;
      console.log(`  FAIL ${check.name}: ${e.message.split("\n")[0]}`);
    } finally {
      await browser.close();
    }
  }
  if (failures) {
    console.log(`board open (browser): ${failures} failed`);
    process.exit(1);
  }
  console.log("board open (browser): all checks passed");
})();

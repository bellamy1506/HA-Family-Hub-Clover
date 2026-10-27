// House fork browser test: in every layout, the board opens settled. Theme,
// size, and every event pill, card and row are already in their final
// places, sizes and colors before the calendars answer; only the event text
// waits. Meals and weather that loaded first stay; the timeline keeps its
// scroll; nothing shows while privacy mode is on; a failed calendar fetch
// doesn't erase the remembered layout; no event text is stored.
// (owner, 2026-10-26)
//
// Run: node tests/browser/test_board_open.js   (ONLY=<text> for a subset)
// Needs Playwright with Chromium. Skips (exit 0) when Playwright isn't
// installed; in a Claude Code cloud session use
//   NODE_PATH=/opt/node-tools/node_modules node tests/browser/test_board_open.js
//
// Loads the served card (card/family-week-calendar-card.js) into
// harness.html with a fake Home Assistant whose calendars answer after
// CAL ms (one answer per calendar, counted in window.__calAnswered). The
// clock is fixed at 3 pm so the timeline scrolls.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  console.log("board open (browser): skipped, Playwright not installed");
  process.exit(0);
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
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bg: getComputedStyle(n).backgroundColor, text: n.textContent.replace(/ /g, "").trim() };
  });
  const today = grid.querySelector(".day-col.today");
  return {
    gridH: Math.round(grid.getBoundingClientRect().height),
    items,
    scrolls: [...grid.querySelectorAll(".events")].map((e) => e.scrollTop),
    todayText: today ? today.textContent : "",
    fcBg: el.style.getPropertyValue("--fc-bg"),
    bgImage: el.style.getPropertyValue("--fc-bg-image").slice(0, 60),
    answered: window.__calAnswered || 0,
  };
}

async function withPage(browser, width, date, fn) {
  const context = await browser.newContext({ viewport: { width, height: 874 } });
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
      const calls = await open(page, q);
      await page.waitForTimeout(CAL / 2);
      const text = await page.evaluate(() => window.__el.shadowRoot.querySelector(".grid").textContent);
      assert.ok(text.includes("Tacos tonight"), "today's meal shows before the calendars answer");
      await settle(page, calls);
      return "meal visible before calendars";
    },
  })),
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
];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  // ONLY=<text> runs just the checks whose name contains it.
  const only = process.env.ONLY;
  for (const check of CHECKS.filter((c) => !only || c.name.includes(only))) {
    try {
      let note;
      await withPage(browser, check.width, check.date, async (page) => { note = await check.run(page); });
      console.log(`  ok   ${check.name}: ${note}`);
    } catch (e) {
      failures++;
      console.log(`  FAIL ${check.name}: ${e.message.split("\n")[0]}`);
    }
  }
  await browser.close();
  if (failures) {
    console.log(`board open (browser): ${failures} failed`);
    process.exit(1);
  }
  console.log("board open (browser): all checks passed");
})();

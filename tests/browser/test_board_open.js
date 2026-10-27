// House fork browser test: in every layout, the board opens settled. Event
// pills, cards and rows are already in their final places, sizes and colors
// before the calendars answer; only their text waits. No event text is
// stored. (owner, 2026-10-26)
//
// Run: node tests/browser/test_board_open.js
// Needs Playwright with Chromium. Skips (exit 0) when Playwright isn't
// installed; in a Claude Code cloud session use
//   NODE_PATH=/opt/node-tools/node_modules node tests/browser/test_board_open.js
//
// Loads the served card (card/family-week-calendar-card.js) into
// harness.html with a fake Home Assistant whose calendars answer after
// CAL ms, opens it once so it can remember, then opens it again and compares
// the event elements just before and just after the calendars answer.
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
const harness = fs.readFileSync(path.join(__dirname, "harness.html"), "utf8");
const card = fs.readFileSync(
  path.join(__dirname, "..", "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);
const EVENT_LIKE = ".event, .tl-event, .all-day-chip, .agenda-item, .mc-pill, .msd-item";

const SCENARIOS = [
  { name: "Month (split), phone", query: "view=month&month=split", width: 402 },
  { name: "Month (plain), phone", query: "view=month&month=month", width: 402 },
  { name: "Planner, phone", query: "view=week&week=planner", width: 402 },
  { name: "Planner, tablet", query: "view=week&week=planner", width: 1024 },
  { name: "Week, tablet", query: "view=week&week=week", width: 1024 },
  { name: "Week with timeline, tablet", query: "view=week&week=week&timeline=on", width: 1024 },
  { name: "Agenda, phone", query: "view=week&week=agenda", width: 402 },
  // Switching views: days already showing events keep them (with text);
  // the rest fill in from remembered shapes.
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
  return { gridH: Math.round(grid.getBoundingClientRect().height), items, answered: window.__calAnswered || 0 };
}

async function open(page, scenario) {
  await page.goto(`http://fh.test/harness.html?${scenario.query}&cal=${CAL}`);
  await page.waitForFunction(() => window.__el && window.__el._viewMode);
  if (scenario.switchTo) {
    await page.waitForFunction(() => (window.__calAnswered || 0) >= 4);
    await page.waitForTimeout(300);
    await page.evaluate((mode) => {
      const el = window.__el;
      el._viewMode = mode;
      el._renderGrid();
      el._fetchEvents();
    }, scenario.switchTo);
  }
}

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const scenario of SCENARIOS) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: 874 } });
    await context.route("http://fh.test/**", (route) => {
      const url = route.request().url();
      if (url.includes("card.js")) return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: card });
      return route.fulfill({ contentType: "text/html; charset=utf-8", body: harness });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => { console.log(`  page error: ${e.message}`); failures++; });
    try {
      const calls = scenario.switchTo ? 8 : 4; // one answer per calendar per fetch
      await open(page, scenario); // first open: remembers the layout
      await page.waitForFunction((n) => (window.__calAnswered || 0) >= n, calls);
      await page.waitForTimeout(300);
      await open(page, scenario); // second open
      await page.waitForTimeout(CAL / 2);
      const before = await page.evaluate(snapshot, EVENT_LIKE);
      await page.waitForFunction((n) => (window.__calAnswered || 0) >= n, calls);
      await page.waitForTimeout(300);
      const after = await page.evaluate(snapshot, EVENT_LIKE);
      assert.ok(before.answered < calls, "measured before the calendars answered");
      assert.ok(after.items.length > 0, "the scenario has events");
      assert.strictEqual(before.items.length, after.items.length, `same number of event elements (${before.items.length} vs ${after.items.length})`);
      before.items.forEach((b, i) => {
        const a = after.items[i];
        for (const k of ["x", "y", "w", "h"]) assert.ok(Math.abs(b[k] - a[k]) <= 1, `element ${i} ${k}: ${b[k]} before, ${a[k]} after`);
        assert.strictEqual(b.bg, a.bg, `element ${i} color`);
        if (!scenario.switchTo) assert.strictEqual(b.text, "", `element ${i} has no text before the calendars answer: "${b.text}"`);
      });
      assert.ok(Math.abs(before.gridH - after.gridH) <= 1, `grid height ${before.gridH} before, ${after.gridH} after`);
      const stored = await page.evaluate(() => Object.values(localStorage).join(" "));
      assert.ok(!stored.includes("SECRET"), "no event text stored");
      console.log(`  ok   ${scenario.name}: ${after.items.length} event elements stable`);
    } catch (e) {
      failures++;
      console.log(`  FAIL ${scenario.name}: ${e.message}`);
    }
    await context.close();
  }
  await browser.close();
  if (failures) {
    console.log(`board open (browser): ${failures} failed`);
    process.exit(1);
  }
  console.log("board open (browser): all checks passed");
})();

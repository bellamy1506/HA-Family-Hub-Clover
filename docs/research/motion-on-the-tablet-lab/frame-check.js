// Frame and layout-shift check at the Clover Tablet's size, with the CPU slowed.
// Usage:
//   node frame-check.js <url | harness:<query>> [--throttle 4] [--ms 8000] [--tap x,y] [--swipe] [--theme dark]
//   harness:<query> loads tests/browser/harness.html (the served week card, fake Home Assistant).
// Reports, from page load until --ms: layout shifts (CLS sum and the elements that moved),
// long animation frames (over 50 ms), main-thread frame gaps (rAF intervals over 25 ms),
// slowest input-to-paint (Event Timing), and the fonts the page loaded.
// Chromium only: WebKit has no LayoutShift or long-animation-frame entries.
"use strict";
const fs = require("fs");
const path = require("path");
let pw;
for (const where of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { pw = require(where); break; } catch (e) { } }
if (!pw) { console.log("frame-check: skipped, Playwright not installed"); process.exit(0); }

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : dflt; };
const target = args[0];
const throttle = Number(opt("throttle", 4));
const ms = Number(opt("ms", 8000));
const tap = opt("tap", null);

function observers() {
  const r = window.__fc = { shifts: [], loaf: [], events: [], gaps: [], frames: 0 };
  const obs = (type, fn, extra) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...(extra || {}) }); } catch (e) { } };
  const name = (n) => !n ? "?" : (n.nodeType === 1 ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + (n.className && typeof n.className === "string" ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".") : "") : "#text");
  obs("layout-shift", (e) => { if (!e.hadRecentInput) r.shifts.push({ t: Math.round(e.startTime), v: e.value, from: (e.sources || []).map((s) => name(s.node)).slice(0, 3) }); });
  obs("long-animation-frame", (e) => r.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), block: Math.round(e.blockingDuration || 0) }));
  obs("event", (e) => ["pointerdown", "pointerup", "click", "keydown"].includes(e.name) && r.events.push({ n: e.name, d: e.duration, delay: Math.round(e.processingStart - e.startTime) }), { durationThreshold: 16 });
  let last = 0;
  const loop = (t) => { if (last) { r.frames++; if (t - last > 25) r.gaps.push(Math.round(t - last)); } last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

(async () => {
  const browser = await pw.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: "America/New_York" });
  let url = target;
  if (target.startsWith("harness:")) {
    const root = path.join(__dirname, "..", "..", "..");
    const harness = fs.readFileSync(path.join(root, "tests", "browser", "harness.html"), "utf8");
    const card = fs.readFileSync(path.join(root, "custom_components", "family_hub", "card", "family-week-calendar-card.js"), "utf8");
    await context.route("http://fh.test/**", (route) => route.request().url().includes("card.js")
      ? route.fulfill({ contentType: "text/javascript; charset=utf-8", body: card })
      : route.fulfill({ contentType: "text/html; charset=utf-8", body: harness }));
    url = "http://fh.test/harness.html?" + target.slice("harness:".length);
  }
  await context.addInitScript(observers);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "load" }).catch((e) => console.log("load:", e.message));
  if (tap) { await page.waitForTimeout(Math.min(3000, ms / 2)); const [x, y] = tap.split(",").map(Number); await page.touchscreen.tap(x, y); }
  if (args.includes("--swipe")) { await page.waitForTimeout(1000); await cdp.send("Input.synthesizeScrollGesture", { x: 600, y: 500, yDistance: -800, speed: 2400, gestureSourceType: "touch" }); }
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
  const r = await page.evaluate(() => Object.assign({}, window.__fc, { fonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight) }));
  const cls = r.shifts.reduce((s, e) => s + e.v, 0);
  const out = {
    target, throttle, ms,
    cls: Math.round(cls * 1000) / 1000,
    shifts: r.shifts.slice(0, 6).map((s) => `${s.t}ms ${s.v.toFixed(3)} ${s.from.join(",")}`),
    longFrames: r.loaf.length, longestFrame: Math.max(0, ...r.loaf.map((e) => e.d)), blocking: r.loaf.reduce((s, e) => s + e.block, 0),
    rafFrames: r.frames, gapsOver25: r.gaps.length, worstGap: Math.max(0, ...r.gaps),
    slowestInput: r.events.length ? r.events.reduce((a, e) => (e.d > a.d ? e : a)) : null,
    fonts: [...new Set(r.fonts)].slice(0, 8),
  };
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();

// Runs motion-lab.html's tests in Chromium at the Clover Tablet's size with the CPU slowed.
// Usage: node run-lab.js [throttle=4] [test ...]
// Needs Playwright (a Claude Code cloud session keeps it in /opt/node-tools).
"use strict";
const path = require("path");
let pw;
for (const where of ["playwright", "/opt/node-tools/node_modules/playwright"]) { try { pw = require(where); break; } catch (e) { } }
if (!pw) { console.log("Playwright not found"); process.exit(0); }
const args = process.argv.slice(2);
const throttle = Number(args[0]) || 4;
const tests = args.slice(1).length ? args.slice(1) : ["idle", "xform", "xform-busy", "top", "top-busy", "height", "blur", "toast",
  "render-full", "render-patch", "shift", "shift-reserved", "scroll", "tap"];
const url = "file://" + path.join(__dirname, "motion-lab.html");

(async () => {
  const browser = await pw.chromium.launch();
  for (const t of tests) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await page.goto(url + "#p=" + t);
    if (t === "scroll") {
      await page.waitForTimeout(5000);
      for (let i = 0; i < 3; i++) {
        await cdp.send("Input.synthesizeScrollGesture", { x: 600, y: 600, yDistance: -1500, speed: 3000, gestureSourceType: "touch" });
        await page.waitForTimeout(1500);
      }
    }
    if (t === "tap") {
      await page.waitForTimeout(5000);
      for (let i = 0; i < 4; i++) { await page.touchscreen.tap(190, 100); await page.waitForTimeout(1000); }
    }
    await page.waitForFunction(() => window.__result, null, { timeout: 60000 });
    const r = await page.evaluate(() => window.__result);
    console.log(JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();

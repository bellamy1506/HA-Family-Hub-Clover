// Family Hub sandbox: checks the sandbox board works in a real browser, and
// saves screenshots. Not part of the test suite (it needs the sandbox running,
// see README.md); the name avoids the suite's test_* glob.
//
//   node tests/sandbox/verify_board.js [SANDBOX_DIR]
//
// Checks, as the household would use it:
//   1. Owner at the wall tablet's size (1200x800 CSS px, DPR 2, touch) and a
//      phone's (390x844, DPR 3, touch): the board opens with the owner's copy's
//      settings (Liquid Glass Dark, Title only, Month = Split).
//   2. Owner adds an event through the board's own + > Calendar Entry form;
//      it's in Home Assistant and still on the board after a reload; then Owner
//      deletes it from the event's own popup, and it's gone after a reload.
//   3. A fresh browser signed in as Wall opens like the Clover Tablet after
//      one reload (Week, 4 days from today, timeline, Liquid Glass Tablet).
//   4. Jenn on a phone, and the "Hide work calendars" tile.
// Screenshots go to SANDBOX_DIR/shots (outside the repo: board pictures stay
// out of this public repo, even with made-up data).
const path = require("path");
process.env.SANDBOX_DIR = path.resolve(process.argv[2] || process.env.SANDBOX_DIR || "/home/user/ha-sandbox");
const { openBoard, board, reload, shot, TZ, SHOTS } = require("./board_browser");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

function easternDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// A brand-new browser, signed in through Home Assistant's own page.
async function signIn(device, user) {
  const opened = await openBoard({ user, device, fresh: true });
  opened.page.on("pageerror", (e) => console.log(`  page error (${user}): ${(e && (e.stack || e.message)) || JSON.stringify(e)}`.slice(0, 300)));
  return opened;
}

const boardText = (page) => board(page).evaluate((el) => el.shadowRoot.textContent);

// In Month (Split) a day can hide events behind "+N more"; tapping the day
// lists them all on the right, as a person would.
async function showDay(page, day) {
  const cell = board(page).locator(`[data-fh-unit="cell|${day}"]`);
  if (await cell.count()) {
    await cell.first().tap();
    await page.waitForTimeout(800);
  }
}

async function apiEvents(page, entity, startDay, endDay) {
  return page.evaluate(
    async ({ entity, startDay, endDay }) => {
      const hass = document.querySelector("home-assistant").hass;
      return hass.callApi("GET", `calendars/${entity}?start=${startDay}T00:00:00&end=${endDay}T23:59:59`);
    },
    { entity, startDay, endDay }
  );
}

async function main() {
  const title = `Sandbox check ${Date.now().toString(36)}: pick up the cake`;
  const tomorrow = easternDate(1);
  try {
    // 1. Owner, tablet size. The first open reports the new copy and is sent
    // the owner's settings; they show from the next open.
    const owner = await signIn("tablet", "owner");
    await reload(owner.page);
    const ownerTheme = await owner.page.evaluate(() => localStorage.getItem("familyHubDeviceThemeOverrideLocal"));
    check("Owner's new copy gets the owner's phone theme", ownerTheme === "liquidglassdark", ownerTheme);
    await shot(owner.page, "owner-tablet");

    // 2. Add an event through the board's own form.
    const card = board(owner.page);
    await card.locator(".add-event-fab").tap();
    await card.locator(".add-fab-calendar").tap();
    await card.locator(".add-event-calendar-select").selectOption({ label: "Us" });
    await card.locator(".add-event-title").fill(title);
    await card.locator(".add-event-date").fill(tomorrow);
    await card.locator(".add-event-start-time").fill("18:00");
    await card.locator(".add-event-end-time").fill("18:30");
    await shot(owner.page, "owner-tablet-add-form");
    await card.locator(".add-event-save").tap();
    await owner.page.waitForTimeout(3000);
    let events = await apiEvents(owner.page, "calendar.us", tomorrow, tomorrow);
    check("Added event is in Home Assistant", events.some((e) => e.summary === title), `${events.length} on Us tomorrow`);
    await showDay(owner.page, tomorrow);
    check("Added event shows on the board", (await boardText(owner.page)).includes(title));
    await reload(owner.page);
    await showDay(owner.page, tomorrow);
    check("Added event still on the board after a reload", (await boardText(owner.page)).includes(title));
    await shot(owner.page, "owner-tablet-added");

    // Delete it from the event's own popup (it asks to confirm).
    owner.page.on("dialog", (d) => d.accept());
    await card.locator(`[data-event-id]`).filter({ hasText: title }).first().tap();
    const del = card.locator(".event-info-delete-btn");
    await del.waitFor({ timeout: 10000 });
    // The button starts disabled ("Checking...") until the calendar's
    // delete support comes back.
    for (let i = 0; i < 20 && !(await del.isEnabled()); i++) await owner.page.waitForTimeout(250);
    await shot(owner.page, "owner-tablet-event-popup");
    await del.tap();
    await owner.page.waitForTimeout(3000);
    events = await apiEvents(owner.page, "calendar.us", tomorrow, tomorrow);
    check("Deleted event is gone from Home Assistant", !events.some((e) => e.summary === title));
    await reload(owner.page);
    await showDay(owner.page, tomorrow);
    check("Deleted event is gone from the board after a reload", !(await boardText(owner.page)).includes(title));

    // An iCloud stand-in (Will) offers no Delete or Edit, as on the house.
    const dentist = await apiEvents(owner.page, "calendar.wills_calendar", easternDate(0), easternDate(7));
    const dentistDay = (dentist.find((e) => e.summary === "Dentist") || {}).start;
    if (dentistDay) await showDay(owner.page, (dentistDay.dateTime || dentistDay.date).slice(0, 10));
    const willEvent = card.locator("[data-event-id]").filter({ hasText: "Dentist" }).first();
    if (await willEvent.count()) {
      await willEvent.tap();
      await owner.page.waitForTimeout(2000);
      const hidden = await card.locator(".event-info-delete-row").evaluate((el) => getComputedStyle(el).display === "none");
      check("Will's events (iCloud stand-in) have no Delete", hidden);
      await shot(owner.page, "owner-tablet-icloud-popup");
    } else {
      check("Will's events (iCloud stand-in) have no Delete", false, "no Dentist event in view");
    }

    // "Hide work calendars": the tile swaps in the copy without Work.
    await owner.page.evaluate(() => document.querySelector("home-assistant").hass.callService("input_boolean", "turn_on", { entity_id: "input_boolean.board_private" }));
    await owner.page.waitForTimeout(1500);
    await reload(owner.page);
    const legend = await board(owner.page).evaluate((el) => el.shadowRoot.textContent);
    check("Hide work calendars: board drawn", legend.length > 0, /Work \d/.test(legend) ? "Work column still listed" : "Work column hidden");
    await shot(owner.page, "owner-tablet-work-hidden");
    await owner.page.evaluate(() => document.querySelector("home-assistant").hass.callService("input_boolean", "turn_off", { entity_id: "input_boolean.board_private" }));
    await owner.context.close();

    // Owner, phone size.
    const ownerPhone = await signIn("phone", "owner");
    await reload(ownerPhone.page);
    await shot(ownerPhone.page, "owner-phone");
    check("Owner phone: board drawn", (await boardText(ownerPhone.page)).length > 0);
    await ownerPhone.context.close();

    // 3. Wall, tablet size: one reload after sign-in.
    const wall = await signIn("tablet", "wall");
    await reload(wall.page);
    const wallState = await board(wall.page).evaluate((el) => ({
      days: el.shadowRoot.querySelectorAll(".day-col").length,
      firstIsToday: !!el.shadowRoot.querySelector(".day-col")?.classList.contains("today"),
      timeline: el.shadowRoot.querySelectorAll(".timeline").length,
      nowLine: el.shadowRoot.querySelectorAll(".fh-now-line").length,
      theme: localStorage.getItem("familyHubDeviceThemeOverrideLocal"),
    }));
    check("Wall opens in Week with 4 days", wallState.days === 4, `${wallState.days} day columns`);
    check("Wall: today first", wallState.firstIsToday);
    check("Wall: timeline and now line", wallState.timeline > 0 && wallState.nowLine === 1, `${wallState.timeline} timelines, ${wallState.nowLine} now line`);
    check("Wall: Liquid Glass Tablet theme", wallState.theme === "liquidglasstablet", wallState.theme);
    await shot(wall.page, "wall-tablet");
    await wall.context.close();

    // 4. Jenn, phone size (household defaults: she has no copy yet, as on the house).
    const jenn = await signIn("phone", "jenn");
    await shot(jenn.page, "jenn-phone");
    check("Jenn phone: board drawn", (await boardText(jenn.page)).includes("Jenn"));
    await jenn.context.close();
  } catch (e) {
    check("ran to the end", false, String(e).split("\n")[0]);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(failed.length ? `${failed.length} failed` : "all checks passed");
  console.log(`screenshots: ${SHOTS}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

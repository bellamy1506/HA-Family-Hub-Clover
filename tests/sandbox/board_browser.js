// Family Hub sandbox: open the board in Chromium the way a household member
// would, for small scripts. Each person and device keeps its own browser
// profile under SANDBOX_DIR/profiles, so a sign-in, the board's per-copy
// settings and anything typed into its storage last between scripts, like
// one real phone or tablet does. sandbox.sh reset wipes the profiles.
//
// In a script:
//   const sb = require("/home/user/HA-Family-Hub-Clover/tests/sandbox/board_browser.js");
//   const { context, page } = await sb.openBoard({ user: "jenn", device: "phone" });
//   await sb.board(page).locator(".add-event-fab").tap();
//   await sb.shot(page, "jenn-add-menu");
//   await context.close();
//
// From a shell (sign in if needed, open the board, save a screenshot):
//   node tests/sandbox/board_browser.js jenn phone jenn-board
//
// Devices: "tablet" is the Clover Tablet (1200x800 CSS px, DPR 2, touch),
// "phone" an iPhone-sized screen (390x844, DPR 3, touch, mobile). Times are
// drawn in Eastern time (timezoneId), as on the house; this container's own
// clock is UTC.
const fs = require("fs");
const path = require("path");

let chromium;
for (const where of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
  try {
    ({ chromium } = require(where));
    break;
  } catch (e) {}
}
if (!chromium) throw new Error("Playwright not found (set NODE_PATH=/opt/node-tools/node_modules)");

const SANDBOX = path.resolve(process.env.SANDBOX_DIR || "/home/user/ha-sandbox");
const SHOTS = path.join(SANDBOX, "shots");
const URL = "http://127.0.0.1:8123";
const BOARD = `${URL}/family-hub/family-hub`;
const TZ = "America/New_York";
const DEVICES = {
  tablet: { viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2, hasTouch: true, timezoneId: TZ, locale: "en-US" },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, timezoneId: TZ, locale: "en-US" },
};

const secrets = () => JSON.parse(fs.readFileSync(path.join(SANDBOX, "secrets.json"), "utf8"));

// The visible copy of the board (the dashboard holds two; one is hidden).
const board = (page) => page.locator("family-week-calendar-card").filter({ visible: true }).first();

async function boardReady(page, settleMs = 4000) {
  await board(page).locator(".grid").waitFor({ timeout: 30000 });
  await page.waitForTimeout(settleMs);
}

// Sign in on Home Assistant's own sign-in page if it shows; then wait for the
// board. Returns once the board has drawn.
async function signInIfAsked(page, user) {
  const name = page.locator('input[name="username"]');
  const first = await Promise.race([
    name.waitFor({ timeout: 30000 }).then(() => "login"),
    board(page).locator(".grid").waitFor({ timeout: 30000 }).then(() => "board"),
  ]);
  if (first === "login") {
    await name.fill(user);
    await page.locator('input[name="password"]').fill(secrets()[user]);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/family-hub\//, { timeout: 30000 });
  }
  await boardReady(page);
}

// Opens the board for `user` ("owner", "jenn" or "wall") on `device`.
// fresh: true uses a throwaway profile (a brand-new browser) instead.
async function openBoard({ user, device = "tablet", fresh = false, url = BOARD, headless = true } = {}) {
  const options = DEVICES[device];
  if (!options) throw new Error(`device must be one of ${Object.keys(DEVICES).join(", ")}`);
  let context;
  if (fresh) {
    const browser = await chromium.launch({ headless });
    context = await browser.newContext(options);
    context.on("close", () => browser.close().catch(() => {}));
  } else {
    const dir = path.join(SANDBOX, "profiles", `${user}-${device}`);
    fs.mkdirSync(dir, { recursive: true });
    context = await chromium.launchPersistentContext(dir, { ...options, headless });
  }
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(url);
  await signInIfAsked(page, user);
  return { context, page };
}

async function reload(page) {
  await page.reload();
  await boardReady(page);
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

module.exports = { openBoard, board, boardReady, reload, shot, DEVICES, BOARD, URL, TZ, SANDBOX, SHOTS, secrets };

if (require.main === module) {
  const [user, device = "tablet", name = `${user}-${device}`] = process.argv.slice(2);
  if (!user) {
    console.log("usage: node board_browser.js <owner|jenn|wall> [tablet|phone] [screenshot name]");
    process.exit(2);
  }
  (async () => {
    const { context, page } = await openBoard({ user, device });
    console.log(await shot(page, name));
    await context.close();
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

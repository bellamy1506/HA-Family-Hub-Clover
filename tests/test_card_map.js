// House fork test: docs/agents/card-map.md stays true. Every `_method` it
// names must still exist in the served card, so the map can't silently rot.
// Run: node tests/test_card_map.js   (no dependencies)
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const map = fs.readFileSync(path.join(root, "docs", "agents", "card-map.md"), "utf8");
const card = fs.readFileSync(path.join(root, "custom_components", "family_hub", "card", "family-week-calendar-card.js"), "utf8");

const named = new Set([...map.matchAll(/`(_[A-Za-z][A-Za-z0-9]*)(?:\([^`]*\))?`/g)].map((m) => m[1]));
const notMethods = new Set(["_eventDetails", "_globalThemes", "_viewMode", "_eventsViewMode"]); // fields
const missing = [...named].filter((n) => !notMethods.has(n) && !new RegExp(`\\n(async )?${n}\\(`).test(card));
assert.ok(named.size > 40, `map names ${named.size} methods`);
assert.deepStrictEqual(missing, [], `methods named in card-map.md but not in the served card: ${missing.join(", ")}`);
for (const field of notMethods) assert.ok(card.includes(`this.${field}`), `field ${field} still used`);
for (const file of ["copy_sync.py", "device_settings_websocket_api.py", "const.py"]) {
  assert.ok(fs.existsSync(path.join(root, "custom_components", "family_hub", file)), file);
}
for (const t of map.matchAll(/`(tests\/[A-Za-z0-9_/.]+)`/g)) assert.ok(fs.existsSync(path.join(root, t[1])), `${t[1]} exists`);

console.log(`card map: all ${named.size} names checked`);

// House fork test: a Settings save leaves the household's column list
// (Settings > Calendars, settings.people) empty when it was empty and the
// rows weren't changed in Settings (wave 0, B2). Otherwise this copy's own
// columns were copied into it, overriding every copy's columns, and "Hide
// work calendars" stopped hiding Work (on the house, 2026-10-29).
// Run: node tests/test_settings_columns.js   (no dependencies)
//
// Runs the real _rememberColumnsAtOpen and _columnsUnedited against a stub
// `this` whose _syncPeopleDraftFromDom reads fake rows, and checks the two
// one-line hooks. The browser side is the "Settings save" checks in
// tests/browser/test_board_open.js.
const assert = require("assert");

const { methodBody } = require("./lib/card_source");

const remember = new Function("settings", methodBody("_rememberColumnsAtOpen", "settings"));
const unedited = new Function(methodBody("_columnsUnedited"));
const rows = (...names) => names.map((name) => ({ entity: `calendar.${name.toLowerCase()}`, name, color: "#7ec9d9", countdown: false, badges: [], remindersEntity: "" }));

function card(dom) {
  return {
    _settingsPeopleDraft: [{ entity: "calendar.will", name: "Will", additionalRemindersEntities: [] }],
    _dom: dom,
    _syncPeopleDraftFromDom() { this._settingsPeopleDraft = JSON.parse(JSON.stringify(this._dom)); },
    _rememberColumnsAtOpen: remember,
    _columnsUnedited: unedited,
  };
}
const saveSees = (c) => { c._syncPeopleDraftFromDom(); return c._columnsUnedited(); };

// Empty household list, nothing changed: Save keeps it empty.
let c = card(rows("Will", "Home", "Us", "Work"));
const draft = c._settingsPeopleDraft;
c._rememberColumnsAtOpen({ people: [] });
assert.strictEqual(c._settingsPeopleDraft, draft, "opening Settings leaves the draft as it was");
assert.strictEqual(saveSees(c), true, "unchanged rows: the list stays empty");

// A column renamed, removed or added in Settings: it's saved.
for (const [what, after] of [["renamed", rows("Willy", "Home", "Us", "Work")], ["removed", rows("Will", "Home", "Us")], ["added", rows("Will", "Home", "Us", "Work", "Jenn")]]) {
  c = card(rows("Will", "Home", "Us", "Work"));
  c._rememberColumnsAtOpen({ people: [] });
  c._dom = after;
  assert.strictEqual(saveSees(c), false, `a column ${what}: saved`);
}

// The household already has its own list: saved as always.
c = card(rows("Will", "Us"));
c._rememberColumnsAtOpen({ people: rows("Will", "Us") });
assert.strictEqual(saveSees(c), false, "the household's own list is saved as edited");
// Never opened (no snapshot): nothing kept back.
assert.strictEqual(card(rows("Will"))._columnsUnedited(), false, "no snapshot, no guard");

// Wiring: one line each in upstream's _openSettings and _saveSettings.
assert.ok(/this\._renderPeopleSettings\(this\._settingsPeopleDraft\);\n\/\/ House fork: wave 0 \(B2\), see _rememberColumnsAtOpen\.\nthis\._rememberColumnsAtOpen\(settings\);/.test(methodBody("_openSettings")), "_openSettings notes the rows once drawn");
assert.ok(/this\._syncPeopleDraftFromDom\(\);[\s\S]*const people = this\._columnsUnedited\(\) \? \[\] : this\._settingsPeopleDraft\n/.test(methodBody("async _saveSettings")), "_saveSettings keeps the list empty");

console.log("settings columns: all checks passed");

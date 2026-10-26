// House fork test for the card side of copy sync (fork issue #5).
// Run: node tests/test_copy_sync_card.js   (no dependencies)
//
// Checks card/family-week-calendar-card.js, the copy Home Assistant serves.
// Runs the real method bodies against a stub `this` and a fake localStorage.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js"),
  "utf8",
);

function methodBody(name, isAsync, params = "") {
  const start = src.indexOf(`\n${isAsync ? "async " : ""}${name}(${params}) {\n`);
  assert.ok(start >= 0, `${name} not found`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) return src.slice(open + 1, i);
  }
  throw new Error(`${name} has no end`);
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};

(async () => {
  // The report carries this copy's applied push seqs (#6).
  store = {
    familyHubDeviceSettingsAppliedSeqLocal: "2",
    "familyHubDeviceSettingsAppliedSeqLocal__inst_inst-1": "5",
  };
  const sent = [];
  const reporter = {
    _hass: { user: { id: "u1" }, connection: { sendMessagePromise: async (m) => { sent.push(m); return {}; } } },
    _getSettings: () => ({}),
    _getDeviceId: () => "dev-1",
    _getCardInstanceId: () => "inst-1",
    _instanceScopedStorageKey: (k) => `${k}__inst_inst-1`,
    _deviceSettingsSnapshot: () => ({}),
    _getDeviceName: () => "iPhone",
    _getCardInstanceLabel: () => "family-hub",
    _applyPrivacyParticipatesDeviceState: () => {},
  };
  await new AsyncFunction(methodBody("_reportDeviceSettings", true)).call(reporter);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].applied_seq, 2);
  assert.strictEqual(sent[0].instance_applied_seq, 5);

  store = {};
  sent.length = 0;
  await new AsyncFunction(methodBody("_reportDeviceSettings", true)).call(reporter);
  assert.strictEqual(sent[0].applied_seq, 0, "no seq stored yet reads as 0");
  assert.strictEqual(sent[0].instance_applied_seq, 0);

  // After applying a push, the copy reports what it now holds (#6).
  let reports = 0;
  const applier = {
    _fetchSettings: async () => {},
    _applySizeVars: () => {},
    _fetchEvents: () => {},
    _fetchCountdown: () => {},
    _reportDeviceSettings: () => { reports++; },
  };
  await new AsyncFunction(methodBody("_applyPushedDeviceSettingsLive", true)).call(applier);
  assert.strictEqual(reports, 1, "reports after applying a push");

  // First open checks for queued settings only after the report lands, so a
  // brand-new copy picks up the settings its first report queued (#7).
  assert.ok(
    src.includes("this._reportDeviceSettings().then(() => this._checkPendingDeviceSettings());"),
    "pending check waits for the first report",
  );
  assert.strictEqual(src.split("this._checkPendingDeviceSettings();").length - 1, 0, "no unsequenced pending check");
  // _reportDeviceSettings is async, so .then works even when it returns early.
  assert.ok(src.includes("\nasync _reportDeviceSettings() {\n"));

  // The theme override is a tracked device-scoped field (#8)...
  const THEME = "familyHubDeviceThemeOverrideLocal";
  const registry = new Function(methodBody("_deviceSettingsFieldRegistry")).call({ _t: (k, d) => d });
  assert.deepStrictEqual(
    { type: registry[THEME].type, max_length: registry[THEME].max_length, default: registry[THEME].default, scope: registry[THEME].scope },
    { type: "text", max_length: 100, default: "", scope: "device" },
  );
  assert.strictEqual(registry.familyHubDeviceCustomNameLocal.scope, "device", "name stays a device field");

  // ...whose three kinds of value survive report (read) and push (write).
  const card = {
    _deviceSettingsFieldRegistry: () => registry,
    _getScopedSettingItem: () => null,
    _setScopedSettingItem: () => { throw new Error("theme is not instance-scoped"); },
  };
  const read = new Function("key", "field", methodBody("_readDeviceSettingField", false, "key, field"));
  const write = new Function("settings", "instanceId", methodBody("_writePushedScopeSettings", false, "settings, instanceId"));
  for (const value of ["", "__default__", "liquidglassdark", "ha:Dark"]) {
    store = {};
    write.call(card, { [THEME]: value }, null);
    assert.strictEqual(store[THEME], value, `push writes ${JSON.stringify(value)}`);
    assert.strictEqual(read.call(card, THEME, registry[THEME]), value, `report reads ${JSON.stringify(value)}`);
  }
  store = {};
  assert.strictEqual(read.call(card, THEME, registry[THEME]), "", "never set reads as household theme");
  write.call(card, { [THEME]: "x".repeat(101) }, null);
  assert.ok(!(THEME in store), "over-long value is not written");

  // The theme picker reports right away, so a change follows without a Save.
  assert.ok(
    /localStorage\.setItem\("familyHubDeviceThemeOverrideLocal", deviceThemeSelect\.value \|\| ""\);\n\} catch \(e\) \{\n\}\nthis\._applySizeVars\(\);\n\/\/ [^\n]*\nthis\._reportDeviceSettings\(\);/.test(src),
    "theme picker reports",
  );

  console.log("copy sync card: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

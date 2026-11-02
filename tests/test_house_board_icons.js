// House board: icons.js, the board's icon pictures drawn inline.
// Expected names come from the icons research's starter table (#71) and Home
// Assistant frontend 20260930.5's src/data/weather.ts (weatherIcons), never from icons.js.
const assert = require("assert");
const { icon, weatherIcon, isRainy } = require("../custom_components/family_hub/house_board/icons.js");

// The event icons (starter table, docs/research/icons-and-marks.md section 4) and the clash mark.
const EVENT_ICONS = [
  "paw", "tooth", "stethoscope", "glasses", "needle", "pill", "airplane", "bag-suitcase",
  "trash-can", "recycle", "cake-variant", "party-popper", "content-cut", "car-wrench", "wrench",
];
const PATH = /^<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="M[0-9MLHVCSQTAZmlhvcsqtaz., -]+"\/><\/svg>$/;
for (const name of [...EVENT_ICONS, "set-center"]) {
  assert.match(String(icon(name)), PATH, `${name} draws one inline picture`);
}
const pictures = new Set([...EVENT_ICONS, "set-center"].map((name) => String(icon(name))));
assert.strictEqual(pictures.size, 16, "every icon is its own picture");

// A name it doesn't hold draws nothing, so a typo fails quietly (#71, call 6).
for (const name of ["no-such-icon", "", undefined, null, "constructor", "__proto__", "toString"]) {
  assert.strictEqual(String(icon(name)), "", `${name} draws nothing`);
}

// With words, a picture is announced as an image; the words come out as text.
const said = String(icon("set-center", 'Overlaps "Dinner" <b>'));
assert.match(said, /role="img" aria-label="Overlaps &quot;Dinner&quot; &lt;b&gt;"/);
assert.doesNotMatch(said, /aria-hidden/);

// ---- Weather: one picture per Home Assistant condition, as Home Assistant draws it ----
const WEATHER = {
  "clear-night": "weather-night", cloudy: "weather-cloudy", exceptional: "alert-circle-outline",
  fog: "weather-fog", hail: "weather-hail", lightning: "weather-lightning",
  "lightning-rainy": "weather-lightning-rainy", partlycloudy: "weather-partly-cloudy",
  pouring: "weather-pouring", rainy: "weather-rainy", snowy: "weather-snowy",
  "snowy-rainy": "weather-snowy-rainy", sunny: "weather-sunny", windy: "weather-windy",
  "windy-variant": "weather-windy-variant",
};
for (const [condition, name] of Object.entries(WEATHER)) {
  assert.match(String(icon(name)), PATH, `${name} draws one inline picture`);
  assert.strictEqual(String(weatherIcon(condition)), String(icon(name)), `${condition} draws ${name}`);
}
assert.strictEqual(new Set(Object.values(WEATHER).map((name) => String(icon(name)))).size, 15);
assert.match(String(weatherIcon("rainy", "Rain")), /role="img" aria-label="Rain"/);
for (const condition of ["unavailable", "unknown", undefined, "constructor"]) {
  assert.strictEqual(String(weatherIcon(condition)), "", `${condition} draws nothing`);
}

// A rainy day: rain, pouring, thunder with rain, or rain and snow (#120's call).
const RAINY = ["rainy", "pouring", "lightning-rainy", "snowy-rainy"];
for (const condition of Object.keys(WEATHER)) {
  assert.strictEqual(isRainy(condition), RAINY.includes(condition), condition);
}
assert.strictEqual(isRainy(undefined), false);

console.log("house board icons: all checks passed");

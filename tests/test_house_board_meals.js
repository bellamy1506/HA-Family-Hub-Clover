// House board test: meals.js, reading the meal plan's packed to-do format.
// Run: node tests/test_house_board_meals.js   (no dependencies)
// Rerun in three zones: run_all.sh runs this file again under TZ=America/New_York, Australia/Sydney and UTC.
//
// The rules are the week card's _getMealForDay and _getBlocksForDay, in
// card/family-week-calendar-card.js, as the backend note describes them
// (docs/research/backend-reuse.md, section 2, on branch research/backend-reuse).
// Days are keys, so a weekday read in the wrong zone shows up here.
const assert = require("assert");
const { readMealPlan, mealsForDay } = require("../custom_components/family_hub/house_board/meals.js");

let n = 0;
// A to-do item as todo.get_items returns it; `data` is the packed description.
const item = (summary, due, data) => ({
  uid: `m${++n}`, summary, status: "needs_action", due,
  description: data === undefined ? undefined : typeof data === "string" ? data : JSON.stringify(data),
});
const HOUSE = { blocks: ["Breakfast", "Lunch", "Dinner"] };
// What shows on a day, as "slot: name (kind)".
const shows = (items, day, settings = HOUSE) =>
  mealsForDay(readMealPlan(items), settings, day).map(({ slot, meal }) => `${slot}: ${meal ? `${meal.name} (${meal.kind})` : "-"}`);
const dinner = (items, day) => shows(items, day)[2];

// ---- Planned meals ----
assert.deepStrictEqual(shows([item("Tacos", "2026-11-03", { block: 2, cook: "Will" })], "2026-11-03"),
  ["Breakfast: -", "Lunch: -", "Dinner: Tacos (planned)"]);
assert.strictEqual(dinner([item("Tacos", "2026-11-03T18:00:00", { block: 2 })], "2026-11-03"), "Dinner: Tacos (planned)", "a due time");
assert.strictEqual(dinner([item("Tacos", undefined, { block: 2 })], "2026-11-03"), "Dinner: -", "no due date");
const done = { ...item("Tacos", "2026-11-03", { block: 2 }), status: "completed" };
assert.strictEqual(dinner([done], "2026-11-03"), "Dinner: Tacos (planned)", "a checked-off meal still shows");
// Typed by hand in Home Assistant's to-do app: plain text, or nothing, is the first slot.
assert.strictEqual(shows([item("Oatmeal", "2026-11-03", "with berries")], "2026-11-03")[0], "Breakfast: Oatmeal (planned)");
assert.strictEqual(shows([item("Oatmeal", "2026-11-03")], "2026-11-03")[0], "Breakfast: Oatmeal (planned)");
// The meal carries its uid, its own day and everything stored, unknown keys too.
const [, , { meal }] = mealsForDay(readMealPlan([item("Soup", "2026-11-03", { block: 2, cook: "Jenn", houseNote: "x" })]), HOUSE, "2026-11-03");
assert.deepStrictEqual(meal, { uid: `m${n}`, name: "Soup", day: "2026-11-03", kind: "planned", data: { block: 2, cook: "Jenn", houseNote: "x" } });
const plain = mealsForDay(readMealPlan([item("Oatmeal", "2026-11-03", "with berries")]), HOUSE, "2026-11-03")[0].meal;
assert.deepStrictEqual(plain.data, { description: "with berries" });
// Two planned for one slot: the later in the list wins, as in the week card.
assert.strictEqual(dinner([item("Tacos", "2026-11-03", { block: 2 }), item("Pizza", "2026-11-03", { block: 2 })], "2026-11-03"), "Dinner: Pizza (planned)");
// A slot the day doesn't have shows nowhere.
assert.deepStrictEqual(shows([item("Snack", "2026-11-03", { block: 5 })], "2026-11-03"), ["Breakfast: -", "Lunch: -", "Dinner: -"]);

// ---- Leftovers ----
const roast = item("Roast", "2026-11-03", { block: 2, leftoverDates: ["2026-11-05", "2026-11-04", "Nov 6", 7] });
assert.strictEqual(dinner([roast], "2026-11-04"), "Dinner: Roast (leftover)");
assert.strictEqual(dinner([roast], "2026-11-05"), "Dinner: Roast (leftover)");
assert.strictEqual(dinner([roast], "2026-11-06"), "Dinner: -", "a malformed date is dropped");
assert.strictEqual(shows([roast], "2026-11-04")[1], "Lunch: -", "same slot only");
const [, , { meal: leftover }] = mealsForDay(readMealPlan([roast]), HOUSE, "2026-11-04");
assert.strictEqual(leftover.day, "2026-11-03", "a leftover names the day it was cooked");
// Older data: spanDays, the next days in a row, across a month end and the clock change.
const chili = item("Chili", "2026-10-31", { block: 2, spanDays: 3 });
assert.deepStrictEqual(["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"].map((day) => dinner([chili], day)),
  ["Dinner: Chili (planned)", "Dinner: Chili (leftover)", "Dinner: Chili (leftover)", "Dinner: -"]);
const both = item("Chili", "2026-10-31", { block: 2, spanDays: 3, leftoverDates: ["2026-11-04"] });
assert.deepStrictEqual(["2026-11-01", "2026-11-04"].map((day) => dinner([both], day)), ["Dinner: -", "Dinner: Chili (leftover)"],
  "leftoverDates replace spanDays");

// ---- Weekly repeats ----
const tuesday = item("Pasta", "2026-11-03", { block: 2, recur: "weekly" });
assert.deepStrictEqual(["2026-10-27", "2026-11-03", "2026-11-09", "2026-11-10", "2027-03-16"].map((day) => dinner([tuesday], day)),
  ["Dinner: -", "Dinner: Pasta (planned)", "Dinner: -", "Dinner: Pasta (weekly)", "Dinner: Pasta (weekly)"],
  "only forward from its own week, only on its weekday");
const [, , { meal: weekly }] = mealsForDay(readMealPlan([tuesday]), HOUSE, "2026-11-10");
assert.strictEqual(weekly.day, "2026-11-03", "a repeat names its anchor's day");
// The latest anchor on or before the day wins.
const tacoTuesday = item("Tacos", "2026-10-20", { block: 2, recur: "weekly" });
assert.strictEqual(dinner([tuesday, tacoTuesday], "2026-10-27"), "Dinner: Tacos (weekly)");
assert.strictEqual(dinner([tuesday, tacoTuesday], "2026-11-10"), "Dinner: Pasta (weekly)");

// ---- Which rule wins: planned, then leftover, then weekly ----
const soup = item("Soup", "2026-11-10", { block: 2 });
const stew = item("Stew", "2026-11-09", { block: 2, leftoverDates: ["2026-11-10"] });
assert.strictEqual(dinner([tuesday, stew, soup], "2026-11-10"), "Dinner: Soup (planned)");
assert.strictEqual(dinner([tuesday, stew], "2026-11-10"), "Dinner: Stew (leftover)");
assert.strictEqual(dinner([tuesday], "2026-11-10"), "Dinner: Pasta (weekly)");

// ---- A day's slots (the household settings' block keys) ----
const slots = (settings, day) => mealsForDay(readMealPlan([]), settings, day).map((s) => s.slot);
assert.deepStrictEqual(slots(undefined, "2026-11-03"), ["Breakfast", "Lunch", "Dinner"], "the week card's default");
assert.deepStrictEqual(slots({ blocks: [] }, "2026-11-07"), [], "no slots");
// Breakfast joins at the front on Saturday and Sunday, if no slot is a breakfast already.
const weekend = { blocks: ["Lunch", "Dinner"], weekendBreakfast: true };
assert.deepStrictEqual(["2026-11-06", "2026-11-07", "2026-11-08"].map((day) => slots(weekend, day).join()),
  ["Lunch,Dinner", "Breakfast,Lunch,Dinner", "Breakfast,Lunch,Dinner"]);
assert.deepStrictEqual(slots({ ...weekend, blocks: ["Big breakfast", "Dinner"] }, "2026-11-07"), ["Big breakfast", "Dinner"]);
// Weekday extras, then this date's, skipping names already there, at most ten.
const extras = { blocks: ["Lunch", "Dinner"], weekdayBlocks: { 2: ["Snack", "dinner"] }, dateBlocks: { "2026-11-03": ["Cake", "snack"] } };
assert.deepStrictEqual(slots(extras, "2026-11-03"), ["Lunch", "Dinner", "Snack", "Cake"]);
assert.deepStrictEqual(slots(extras, "2026-11-04"), ["Lunch", "Dinner"]);
const many = { blocks: ["A", "B", "C", "D", "E", "F"], weekdayBlocks: { 2: ["G", "H"] }, dateBlocks: { "2026-11-03": ["I", "J", "K", "L"] } };
assert.strictEqual(slots(many, "2026-11-03").join(""), "ABCDEFGHIJ");
// A meal is in a slot by position, as stored.
assert.strictEqual(shows([item("Cake", "2026-11-03", { block: 3 })], "2026-11-03", extras)[3], "Cake: Cake (planned)");

console.log(`house board meals (${Intl.DateTimeFormat().resolvedOptions().timeZone}): all checks passed`);

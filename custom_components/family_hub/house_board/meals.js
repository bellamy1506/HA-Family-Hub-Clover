// Owns: reading the meal plan's packed to-do format: a day's slots, and the
// meal in each (planned, then leftover, then weekly repeat).
// Leaves alone: fetching the list, writing meals, and how they look.
// Tested by: tests/test_house_board_meals.js
//
// Rewritten from the week card's _fetchMealPlan, _getMealForDay and
// _getBlocksForDay (card/family-week-calendar-card.js). Each meal is an item
// on a Home Assistant to-do list: its summary is the dish, its due date the
// day, and its description a JSON object whose `block` is the slot's position
// in that day's slot list. Days are "2026-11-03" keys counted in UTC, where
// every day is 24 hours, so nothing here depends on the time zone.

const DEFAULT_SLOTS = ["Breakfast", "Lunch", "Dinner"];
const isKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const keyPlus = (key, n) => new Date(Date.parse(key) + n * 86400000).toISOString().slice(0, 10);
const weekday = (key) => new Date(Date.parse(key)).getUTCDay();

// The stored object; text that isn't a JSON object is the meal's note.
function unpack(description) {
  if (!description) return {};
  try {
    const data = JSON.parse(description);
    if (data && typeof data === "object") return data;
  } catch (e) {
    // Typed by hand: plain text.
  }
  return { description };
}

// The plan, from the items todo.get_items returns, for mealsForDay.
export function readMealPlan(items) {
  const plan = { planned: {}, leftovers: [], weekly: [] };
  for (const item of items) {
    const day = (item.due || "").slice(0, 10);
    if (!isKey(day)) continue;
    const data = unpack(item.description);
    const meal = { uid: item.uid, name: item.summary, day, data };
    const slot = typeof data.block === "number" ? data.block : 0;
    // Two for one day and slot: the later wins, as in the week card.
    (plan.planned[day] ||= {})[slot] = meal;
    // Leftovers: the days picked, or for older data the next spanDays - 1 days.
    let dates = Array.isArray(data.leftoverDates) ? data.leftoverDates.filter(isKey) : [];
    if (!dates.length && typeof data.spanDays === "number" && data.spanDays > 1) {
      dates = Array.from({ length: data.spanDays - 1 }, (_, i) => keyPlus(day, i + 1));
    }
    if (dates.length) plan.leftovers.push({ meal, slot, dates });
    if (data.recur === "weekly") plan.weekly.push({ meal, slot, weekday: weekday(day) });
  }
  return plan;
}

// The day's slots in order, each with what shows in it or null:
// [{ slot: "Dinner", meal: { uid, name, day, kind, data } }]. `kind` says why:
// "planned" for this day, a "leftover" of the meal cooked on `day`, or a
// "weekly" repeat of the meal planned on `day`. `data` is the stored object,
// every key kept. `settings` holds the household settings' block keys as the
// week card normalizes them: blocks, weekendBreakfast, weekdayBlocks, dateBlocks.
export function mealsForDay(plan, settings, day) {
  return slotsForDay(settings || {}, day).map((slot, i) => ({ slot, meal: mealIn(plan, day, i) }));
}

function mealIn(plan, day, slot) {
  const planned = plan.planned[day]?.[slot];
  if (planned) return { ...planned, kind: "planned" };
  const leftover = plan.leftovers.find((l) => l.slot === slot && l.dates.includes(day));
  if (leftover) return { ...leftover.meal, kind: "leftover" };
  // A weekly repeat runs forward from its own week; the latest one wins.
  let anchor = null;
  for (const w of plan.weekly) {
    if (w.slot !== slot || w.weekday !== weekday(day) || w.meal.day > day) continue;
    if (!anchor || w.meal.day > anchor.day) anchor = w.meal;
  }
  return anchor && { ...anchor, kind: "weekly" };
}

function slotsForDay(settings, day) {
  const slots = Array.isArray(settings.blocks) ? settings.blocks.slice() : DEFAULT_SLOTS.slice();
  const wd = weekday(day);
  if (slots.length && settings.weekendBreakfast && (wd === 0 || wd === 6) && !slots.some((s) => /breakfast/i.test(s))) {
    slots.unshift("Breakfast");
  }
  // Every-weekday extras, then this date's, skipping names already there, at most ten.
  for (const name of [...(settings.weekdayBlocks?.[wd] || []), ...(settings.dateBlocks?.[day] || [])]) {
    if (slots.length < 10 && !slots.some((s) => s.toLowerCase() === name.toLowerCase())) slots.push(name);
  }
  return slots;
}

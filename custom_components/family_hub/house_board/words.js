// Owns: the words the face and Upcoming both show about quiet calendars and rain:
//   the quiet line, "isn't loading", the rain line, and a rainy day's chance.
// Leaves alone: where a view puts them, and which calendars are quiet (people.js).
// Tested by: tests/test_house_board_words.js, rerun in three zones by run_all.sh

import { isRainy } from "./icons.js";
import { dateTimeWords, dayDiff, timeWords } from "./when.js";

const HOUR = 3600000;
const WAKING_END = 22; // the rain line looks ahead to 10 pm, the end of waking hours

/**
 * A quiet calendar's sentence (#103, owner), from people.js's Quiet:
 * "Jenn's calendar hasn't updated since 9:40 am", or since "Mon Nov 2, 9:40 pm"
 * on another day; "Jenn's calendar isn't updating" when no live answer came on
 * this page; "Jenn's calendar isn't loading" when nothing was kept.
 * @param {{ name: string, since: Date|null, kept: boolean }} quiet
 * @param {Date} now
 * @returns {string}
 */
export function quietWords(quiet, now) {
  if (!quiet.kept) return `${quiet.name} isn't loading`;
  if (!quiet.since) return `${quiet.name} isn't updating`;
  const when = dayDiff(quiet.since, now) === 0 ? timeWords(quiet.since) : dateTimeWords(quiet.since);
  return `${quiet.name} hasn't updated since ${when}`;
}

/**
 * The rain line, stated and never an instruction (the resting face README):
 * "Rain until 9 pm" while an hour of rain is under way, "Rain from 2 pm" when
 * it starts later today before 10 pm, or null. An hour is rainy by its
 * condition (icons.js's isRainy), not by its chance.
 * @param {object|null} weather  ha.js's Weather, or null
 * @param {Date} now
 * @returns {string|null}
 */
export function rainWords(weather, now) {
  const hours = (weather?.hourly || []).filter((h) => +h.at + HOUR > +now);
  const rainy = (h) => isRainy(h.condition);
  if (hours[0] && hours[0].at <= now && rainy(hours[0])) {
    const dry = hours.find((h) => !rainy(h));
    return `Rain until ${hourWords(dry ? dry.at : new Date(+hours.at(-1).at + HOUR))}`;
  }
  const wakingEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), WAKING_END);
  const next = hours.find((h) => rainy(h) && h.at < wakingEnd);
  return next ? `Rain from ${hourWords(next.at)}` : null;
}

/**
 * The chance of rain under a rainy day (#104 decision 2): "40%", or null for
 * a dry day, a day with no chance given (the house forecast), or no day.
 * @param {object|null|undefined} day  ha.js's WeatherDay
 * @returns {string|null}
 */
export function chanceWords(day) {
  return day && isRainy(day.condition) && Number.isFinite(day.rain) ? `${Math.round(day.rain)}%` : null;
}

// "2 pm", or "11:30 am" off the hour.
const hourWords = (date) => (date.getMinutes() ? timeWords(date) : timeWords(date).replace(":00", ""));

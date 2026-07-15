// src/services/streak.js
// A streak is one consecutive local-calendar-day check-in on the Today page.
// Existing saved-entry dates are merged in so upgrading does not erase history.
import { listEntries } from "./affirmationEngine";

const CHECKIN_KEY = "dearself.streak.checkins.v2";

const ymd = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromYmd = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const readCheckins = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKIN_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((day) => fromYmd(day)) : [];
  } catch {
    return [];
  }
};

const entryDays = () =>
  listEntries()
    .map((entry) => (entry?.iso ? new Date(entry.iso) : null))
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .map(ymd);

const allRecordedDays = () => new Set([...readCheckins(), ...entryDays()]);

const writeCheckins = (days) => {
  try {
    localStorage.setItem(
      CHECKIN_KEY,
      JSON.stringify([...new Set(days)].sort()),
    );
  } catch {
    // Storage may be unavailable in private browsing; the UI can still continue.
  }
};

export function getStreak(referenceDate = new Date()) {
  const days = allRecordedDays();
  const todayKey = ymd(referenceDate);

  // A current streak must include today.
  if (!days.has(todayKey)) return 0;

  let count = 0;
  let cursor = fromYmd(todayKey);

  while (cursor && days.has(ymd(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }

  return count;
}

export function recordDailyCheckin(referenceDate = new Date()) {
  const todayKey = ymd(referenceDate);
  const checkins = readCheckins();
  const alreadyRecorded = checkins.includes(todayKey);

  if (!alreadyRecorded) writeCheckins([...checkins, todayKey]);

  return {
    value: getStreak(referenceDate),
    isNewDay: !alreadyRecorded,
    day: todayKey,
  };
}

// Backward-compatible alias for older builds and imported backups.
export const recordDailyVisit = recordDailyCheckin;

export function getRecordedStreakDays() {
  return [...allRecordedDays()].sort();
}
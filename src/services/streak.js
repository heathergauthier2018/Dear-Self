// Computes the current consecutive-day journaling streak.
// Rules:
// - Streak counts *calendar days* with at least one saved entry.
// - Must include *today* to be non-zero.
// - Breaks on any missed day.
// - Only shows once it reaches 2+ days (the UI component hides <2).
import { listEntries } from './affirmationEngine';

const ymd = (d) => {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const addDays = (d, delta) => {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
};

export function getStreak() {
  const items = listEntries();
  if (!Array.isArray(items) || items.length === 0) return 0;

  // Build a Set of unique YYYY-MM-DD that have at least one entry
  const daysWithEntries = new Set(
    items
      .map((e) => (e?.iso ? new Date(e.iso) : null))
      .filter(Boolean)
      .map((d) => ymd(d))
  );

  let streak = 0;
  let cursor = new Date(); // today (local time)

  // If no entry today, streak is zero by definition
  if (!daysWithEntries.has(ymd(cursor))) return 0;

  // Count back from today while days are present
  while (daysWithEntries.has(ymd(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

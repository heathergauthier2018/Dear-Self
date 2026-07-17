// src/services/affirmationEngine.js
import affirmations from "../data/affirmations";

/* ------------------------------------------------------------------ */
/* Storage keys                                                       */
/* ------------------------------------------------------------------ */
const KEYS = {
  prefs: "dearself.userprefs",
  entries: "dearself.entries",
  today: "dearself.today",
  favorites: "dearself.favorites",
  affirmationSequence: "dearself.affirmations.sequence.v1",
};

/* ------------------------------------------------------------------ */
/* Public images helper (served from /public/images)                  */
/* ------------------------------------------------------------------ */
export const DEFAULT_PAPER_KEY = "romantic2";
const PUBLIC = process.env.PUBLIC_URL || "";
export const imageUrl = (name) => `${PUBLIC}/images/${name}`;

/** Ensure prefs object has a selected paper key. */
export function ensureDefaultPaper(prefs = {}) {
  if (!prefs.selectedPaperKey) {
    prefs.selectedPaperKey = DEFAULT_PAPER_KEY;
  }
  return prefs;
}

/* ------------------------------------------------------------------ */
/* Safe JSON helpers                                                  */
/* ------------------------------------------------------------------ */
function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage may be unavailable in private browsing or when its quota is full.
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* User Prefs                                                         */
/* ------------------------------------------------------------------ */
const DEFAULT_PREFS = {
  brandTheme: "sage",
  headerFont: "merriweather",
  siteBg: "#FAF9F6",
  bgTexture: "none",
  siteWidth: "950px",
  cardDensity: "cozy",
  motion: "low",
  compactUI: false,
  navOrder: ["today", "past", "favorites", "settings"],
  cardOrder: "affirmation-first",
  showCategoryChip: true,
  dateFormat: "long",
  pastDefaultRange: "all",
  timeZone:
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
  undoMs: 4000,
  selectedPaperKey: DEFAULT_PAPER_KEY,
};

export function getUserPrefs() {
  const prefs = safeRead(KEYS.prefs, DEFAULT_PREFS);
  return ensureDefaultPaper({ ...DEFAULT_PREFS, ...prefs });
}

export function setUserPrefs(patch) {
  const next = { ...getUserPrefs(), ...patch };
  ensureDefaultPaper(next);
  safeWrite(KEYS.prefs, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Entries API                                                        */
/* ------------------------------------------------------------------ */
export function listEntries() {
  const list = safeRead(KEYS.entries, []);
  return Array.isArray(list)
    ? list.map((entry) => ({
        id: entry.id,
        iso: entry.iso,
        content: entry.content ?? "",
        style: {
          themeKey: entry.style?.themeKey,
          imageSrc: entry.style?.imageSrc,
          fontFamily: entry.style?.fontFamily,
          fontColor: entry.style?.fontColor,
          dateColor: entry.style?.dateColor,
          fontSize: entry.style?.fontSize,
          bold: !!entry.style?.bold,
          italic: !!entry.style?.italic,
        },
      }))
    : [];
}

export function addEntry(content = "", style = {}) {
  const prefs = getUserPrefs();
  const themeKey =
    style.themeKey ?? prefs.selectedPaperKey ?? DEFAULT_PAPER_KEY;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    iso: new Date().toISOString(),
    content: String(content || ""),
    style: {
      themeKey,
      imageSrc: style.imageSrc ?? imageUrl(`${themeKey}.png`),
      fontFamily: style.fontFamily || "Merriweather",
      fontColor: style.fontColor || "#2B2B2B",
      dateColor: style.dateColor || style.fontColor || "#2B2B2B",
      fontSize: Number(style.fontSize) || 20,
      bold: !!style.bold,
      italic: !!style.italic,
    },
  };

  const list = listEntries();
  list.push(entry);
  safeWrite(KEYS.entries, list);

  const today = safeRead(KEYS.today, {});
  safeWrite(KEYS.today, { ...today, lastSavedIso: entry.iso });
  return entry;
}

export function removeEntry(id) {
  const list = listEntries().filter((entry) => entry.id !== id);
  safeWrite(KEYS.entries, list);
  return true;
}

export function updateEntry(id, patch = {}) {
  const list = listEntries();
  const index = list.findIndex((entry) => entry.id === id);
  if (index < 0) return false;

  const previous = list[index];
  list[index] = {
    ...previous,
    content:
      patch.content !== undefined
        ? String(patch.content)
        : previous.content,
    style: {
      ...previous.style,
      ...(patch.style || {}),
    },
  };

  safeWrite(KEYS.entries, list);
  return true;
}

/* ------------------------------------------------------------------ */
/* Favorites API (for Affirmations)                                   */
/* ------------------------------------------------------------------ */
export function listFavorites() {
  const favorites = safeRead(KEYS.favorites, []);
  return Array.isArray(favorites) ? favorites : [];
}

// Back-compatible alias for older imports.
export const listFavoriteItems = (...args) => listFavorites(...args);

export function toggleFavorite(item) {
  const favorites = listFavorites();
  const id = item?.id || `${item?.date || ""}-${item?.text || ""}`;
  const index = favorites.findIndex(
    (favorite) => (favorite.id || favorite.text) === (id || item?.text),
  );

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push({
      id,
      text: item?.text || item?.affirmation || "",
      challenge: item?.challenge || "",
      category: item?.category || item?.theme || "Daily",
      addedIso: new Date().toISOString(),
    });
  }

  safeWrite(KEYS.favorites, favorites);
  return favorites;
}

export function removeFavorite(target) {
  const favorites = listFavorites();
  const id =
    typeof target === "string"
      ? target
      : target?.id || `${target?.date || ""}-${target?.text || ""}`;

  const next = favorites.filter(
    (favorite) => (favorite.id || favorite.text) !== (id || target?.text),
  );
  safeWrite(KEYS.favorites, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Personalized full-library sequence                                 */
/* ------------------------------------------------------------------ */

/** Return the device's local calendar date as YYYY-MM-DD. */
function ymd(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const libraryById = new Map(affirmations.map((item) => [item.id, item]));
const libraryIds = affirmations.map((item) => item.id);

function randomIndex(maxExclusive) {
  if (maxExclusive <= 1) return 0;

  // crypto.getRandomValues gives each local profile a genuinely independent
  // order. Math.random remains a safe functional fallback for older browsers.
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let value;
    do {
      crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);
    return value % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function shuffled(values, avoidFirstId = null) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  // When a new full-library cycle begins, avoid immediately showing the same
  // affirmation that ended the previous cycle.
  if (result.length > 1 && result[0] === avoidFirstId) {
    const swapIndex = 1 + randomIndex(result.length - 1);
    [result[0], result[swapIndex]] = [result[swapIndex], result[0]];
  }

  return result;
}

function isValidSequence(sequence) {
  return (
    sequence &&
    Array.isArray(sequence.order) &&
    sequence.order.length > 0 &&
    Number.isInteger(sequence.index) &&
    sequence.index >= 0 &&
    sequence.index < sequence.order.length &&
    typeof sequence.lastShownDate === "string"
  );
}

/**
 * Preserve a user's existing order when the content library changes. Invalid
 * and removed IDs are discarded; newly added IDs are shuffled into the end.
 */
function reconcileSequence(sequence) {
  if (!isValidSequence(sequence)) return null;

  const currentId = sequence.order[sequence.index];
  const seen = new Set();
  const validOrder = sequence.order.filter((id) => {
    if (!libraryById.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const missing = shuffled(libraryIds.filter((id) => !seen.has(id)));
  const order = [...validOrder, ...missing];
  const currentIndex = order.indexOf(currentId);

  if (!order.length || currentIndex < 0) return null;

  return {
    version: 1,
    order,
    index: currentIndex,
    lastShownDate: sequence.lastShownDate,
    cycle: Number.isInteger(sequence.cycle) ? sequence.cycle : 1,
  };
}

function createSequence(dateKey, avoidFirstId = null, cycle = 1) {
  return {
    version: 1,
    order: shuffled(libraryIds, avoidFirstId),
    index: 0,
    lastShownDate: dateKey,
    cycle,
  };
}

function advanceSequence(sequence, dateKey) {
  if (sequence.index < sequence.order.length - 1) {
    return {
      ...sequence,
      index: sequence.index + 1,
      lastShownDate: dateKey,
    };
  }

  const previousId = sequence.order[sequence.index];
  return createSequence(dateKey, previousId, (sequence.cycle || 1) + 1);
}

function cardFromItem(item, dateKey) {
  return {
    // A content-based ID remains stable across dates and future account sync.
    id: `affirmation-${item.id}`,
    affirmationId: item.id,
    date: dateKey,
    text: item.affirmation,
    affirmation: item.affirmation,
    challenge: item.challenge,
    category: item.category,
  };
}

function savedTodayCard(saved, dateKey) {
  if (!saved?.text || !saved?.challenge) return null;

  return {
    id: saved.id || `day-${dateKey}`,
    affirmationId: saved.affirmationId,
    date: dateKey,
    text: saved.text,
    affirmation: saved.text,
    challenge: saved.challenge,
    category: saved.category || "Daily",
  };
}

function persistTodayCard(card, previousSaved = {}) {
  safeWrite(KEYS.today, {
    ...previousSaved,
    id: card.id,
    affirmationId: card.affirmationId,
    ymd: card.date,
    text: card.text,
    challenge: card.challenge,
    category: card.category,
  });
}

/**
 * Return today's pair without consuming content for missed days.
 *
 * - First visit: create and store a personalized shuffled full-library order.
 * - Same local date: continue showing the same pair.
 * - Any later local date: advance exactly ONE position, regardless of how many
 *   calendar days passed while Dear Self was not opened.
 * - Earlier date (for example, the device clock moved backward): do not
 *   advance or rewind the sequence.
 */
export function ensureTodayAffirmation(referenceDate = new Date()) {
  const dateKey = ymd(referenceDate);
  const saved = safeRead(KEYS.today, null);

  // Preserve the exact pair already shown today, including the legacy eight-
  // item engine's pair on the day this upgrade is installed.
  if (saved?.ymd === dateKey) {
    const existing = savedTodayCard(saved, dateKey);
    if (existing) return existing;
  }

  let sequence = reconcileSequence(
    safeRead(KEYS.affirmationSequence, null),
  );

  if (!sequence) {
    sequence = createSequence(dateKey);
  } else if (dateKey > sequence.lastShownDate) {
    // Deliberately advance only once. Three missed days do not consume three
    // unseen affirmations.
    sequence = advanceSequence(sequence, dateKey);
  }

  const item = libraryById.get(sequence.order[sequence.index]);
  if (!item) {
    // Defensive recovery if local storage was manually edited or corrupted.
    sequence = createSequence(dateKey);
  }

  const resolvedItem = libraryById.get(sequence.order[sequence.index]);
  const card = cardFromItem(resolvedItem, dateKey);

  safeWrite(KEYS.affirmationSequence, sequence);
  persistTodayCard(card, saved || {});
  return card;
}

/**
 * Kept for backward compatibility. Normal calls never replace today's pair.
 * Passing true is an explicit developer/admin action that advances once while
 * remaining on the same calendar date.
 */
export function regenerateToday(force = false, referenceDate = new Date()) {
  if (!force) return ensureTodayAffirmation(referenceDate);

  const dateKey = ymd(referenceDate);
  const saved = safeRead(KEYS.today, {});
  let sequence = reconcileSequence(
    safeRead(KEYS.affirmationSequence, null),
  );

  if (!sequence) {
    sequence = createSequence(dateKey);
  } else {
    sequence = advanceSequence(sequence, dateKey);
  }

  const item = libraryById.get(sequence.order[sequence.index]);
  const card = cardFromItem(item, dateKey);

  safeWrite(KEYS.affirmationSequence, sequence);
  persistTodayCard(card, { ...saved, regenerated: true });
  return card;
}

/** Useful for account export/sync and for QA without exposing mutable state. */
export function getAffirmationSequenceState() {
  const sequence = reconcileSequence(
    safeRead(KEYS.affirmationSequence, null),
  );
  return sequence
    ? {
        ...sequence,
        order: [...sequence.order],
      }
    : null;
}

/* ------------------------------------------------------------------ */
/* Convenience: migrate any old image paths to public/                */
/* ------------------------------------------------------------------ */
(function migrateImagePathsOnce() {
  try {
    const list = listEntries();
    let changed = false;

    const fix = (src) => {
      if (!src) return src;
      if (
        /\/images\//.test(src) &&
        !/^https?:/.test(src) &&
        !src.startsWith(PUBLIC)
      ) {
        return src;
      }
      return src;
    };

    const fixed = list.map((entry) => {
      const themeKey = entry.style?.themeKey || DEFAULT_PAPER_KEY;
      const imageSrc =
        entry.style?.imageSrc || imageUrl(`${themeKey}.png`);
      const corrected = fix(imageSrc) || imageUrl(`${themeKey}.png`);
      if (corrected !== entry.style?.imageSrc) changed = true;
      return { ...entry, style: { ...entry.style, imageSrc: corrected } };
    });

    if (changed) safeWrite(KEYS.entries, fixed);

    const prefs = getUserPrefs();
    if (!prefs.selectedPaperKey) {
      setUserPrefs({ selectedPaperKey: DEFAULT_PAPER_KEY });
    }
  } catch {
    // Ignore migration failures so the journal can still open.
  }
})();
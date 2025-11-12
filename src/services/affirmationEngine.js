// src/services/affirmationEngine.js

// ---- Default journal look (first-run seeding) -----------------------------
import romantic2 from '../images/romantic2.png';

// Local storage keys
const PREFS_KEY = 'dearself.userprefs.v1';
const FAV_KEY   = 'dearself.favorites.v1';
const TODAY_KEY = 'dearself.today.v1';
const ENTRY_KEY = 'dearself.entries.v2'; // versioned shape for style-aware entries

// Default canvas style + site prefs (used on first run)
export const DEFAULT_STYLE = {
  themeKey: 'romantic2',
  imageSrc: romantic2,
  fontFamily: 'Merriweather',
  fontColor: '#2B2B2B',
  dateColor: '#2B2B2B',
  bold: false,
  italic: false,
  fontSize: 18,
};

export const DEFAULT_PREFS = {
  // optional site-wide flavor (matches your theme.css choices)
  headerFont: 'header-merriweather',
  bgTexture: 'linen',
  theme: 'sage',
  motion: 'standard',
  cardDensity: 'cozy',

  // used by JournalEntry as the initial paper choice
  selectedPaperKey: 'romantic2',

  // the journal canvas look for first run
  journalStyle: DEFAULT_STYLE,
};

/* =========================
   User Preferences (merge-safe, seeds defaults)
   ========================= */
export function getUserPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');

    // Merge with defaults so missing fields never break rendering
    const merged = {
      ...DEFAULT_PREFS,
      ...raw,
      journalStyle: {
        ...DEFAULT_STYLE,
        ...(raw.journalStyle || raw.style || {}),
      },
      // prefer explicit selectedPaperKey if present; else take from style
      selectedPaperKey:
        raw.selectedPaperKey ||
        (raw.journalStyle && raw.journalStyle.themeKey) ||
        DEFAULT_PREFS.selectedPaperKey,
    };

    // Seed storage on true first run
    if (!raw || Object.keys(raw).length === 0) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFS));
    return DEFAULT_PREFS;
  }
}

export function setUserPrefs(patch) {
  const current = getUserPrefs(); // already merged with defaults
  const next = {
    ...current,
    ...(patch || {}),
  };

  // Always keep journalStyle merged with defaults
  if (patch && patch.journalStyle) {
    next.journalStyle = {
      ...DEFAULT_STYLE,
      ...(current.journalStyle || {}),
      ...(patch.journalStyle || {}),
    };
  }

  // Keep selectedPaperKey in sync if caller passed a new themeKey
  if (next.journalStyle?.themeKey && !next.selectedPaperKey) {
    next.selectedPaperKey = next.journalStyle.themeKey;
  }

  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

/* =========================
   Daily Affirmation (keeps prior API names)
   ========================= */
const AFFIRMATIONS = [
  {
    text: 'I inhale peace. I exhale what no longer serves me.',
    challenge: 'Breathe deeply 3 times and repeat the affirmation aloud with each breath.',
    category: 'Calm & Grounding',
  },
  {
    text: 'I am allowed to be proud of who I am becoming.',
    challenge: 'Celebrate a recent win out loud — even if only to yourself in the mirror.',
    category: 'Self-Compassion',
  },
  {
    text: 'Small steps still move me forward.',
    challenge: 'Pick one tiny task and do it for 2 minutes right now.',
    category: 'Momentum',
  },
  {
    text: 'My voice matters, and I use it with kindness.',
    challenge: 'Send a supportive message to someone who needs to hear it.',
    category: 'Connection',
  },
];

function _readToday() {
  try { return JSON.parse(localStorage.getItem(TODAY_KEY)) || null; }
  catch { return null; }
}
function _writeToday(obj) {
  localStorage.setItem(TODAY_KEY, JSON.stringify(obj));
}

// Ensure there is a selection for today
export function ensureTodayAffirmation() {
  const todayStr = new Date().toDateString();
  const existing = _readToday();
  if (existing && existing.date === todayStr) return existing;

  // pick deterministic by day index
  const idx = Math.abs(todayStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AFFIRMATIONS.length;
  const pick = { ...AFFIRMATIONS[idx], date: todayStr, id: `day-${todayStr}` };
  _writeToday(pick);
  return pick;
}

export function regenerateToday() {
  const todayStr = new Date().toDateString();
  const i = Math.floor(Math.random() * AFFIRMATIONS.length);
  const pick = { ...AFFIRMATIONS[i], date: todayStr, id: `day-${todayStr}-${i}` };
  _writeToday(pick);
  return pick;
}

/* =========================
   Favorites (keeps prior API names)
   ========================= */
function _readFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch { return []; }
}
function _writeFavs(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

export function listFavorites() { return _readFavs(); }
// Some older code referenced this name too:
export function listFavoriteItems() { return _readFavs(); }

/** Normalize & toggle favorite so Favorites page always has text/challenge/category/date */
export function toggleFavorite(item) {
  // Normalize what we store so Favorites can reliably render fields
  const normalized = {
    id: item?.id || `fav-${(item?.date || '')}-${(item?.text || item?.affirmation || '').slice(0, 30)}`,
    text: item?.text || item?.affirmation || '',     // affirmation text
    challenge: item?.challenge || '',                // challenge text
    category: item?.category || item?.theme || '',   // e.g., Calm & Grounding
    date: item?.date || new Date().toDateString(),
  };

  const favs = _readFavs();
  const i = favs.findIndex(f => (f.id || f.text) === (normalized.id || normalized.text));
  if (i >= 0) {
    favs.splice(i, 1); // unfavorite
  } else {
    favs.unshift({ ...normalized, favAt: new Date().toISOString() });
  }
  _writeFavs(favs);
  return favs;
}

export function removeFavorite(idOrText) {
  const favs = _readFavs().filter(f => (f.id || f.text) !== idOrText);
  _writeFavs(favs);
}

/* =========================
   Entries v2 (style-aware)
   ========================= */
function _readEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRY_KEY)) || []; }
  catch { return []; }
}
function _writeEntries(list) {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(list));
}

/**
 * addEntry(content, style)
 * style = {
 *   themeKey, imageSrc,
 *   fontFamily, fontColor, fontSize (number),
 *   bold, italic, dateColor
 * }
 */
export function addEntry(content, style = {}) {
  const list = _readEntries();
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const now = new Date();

  // Merge the passed style with current defaults/prefs, so entries always have complete style
  const prefs = getUserPrefs();
  const mergedStyle = {
    ...DEFAULT_STYLE,
    ...(prefs.journalStyle || {}),
    ...(style || {}),
  };

  const entry = {
    id,
    iso: now.toISOString(),
    content: content || '',
    style: {
      themeKey:   mergedStyle.themeKey || null,
      imageSrc:   mergedStyle.imageSrc || null,
      fontFamily: mergedStyle.fontFamily || 'Merriweather',
      fontColor:  mergedStyle.fontColor || '#2B2B2B',
      fontSize:   Number(mergedStyle.fontSize || 18),
      bold:       !!mergedStyle.bold,
      italic:     !!mergedStyle.italic,
      dateColor:  mergedStyle.dateColor || mergedStyle.fontColor || '#2B2B2B',
    },
  };

  list.unshift(entry);
  _writeEntries(list);
  return entry;
}

export function listEntries() {
  return _readEntries();
}

export function updateEntry(id, patch) {
  const list = _readEntries();
  const i = list.findIndex(e => e.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch, style: { ...(list[i].style || {}), ...(patch.style || {}) } };
  _writeEntries(list);
  return list[i];
}

export function removeEntry(id) {
  const list = _readEntries().filter(e => e.id !== id);
  _writeEntries(list);
}

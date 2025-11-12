// src/services/affirmationEngine.js

/* ------------------------------------------------------------------ */
/* Storage keys                                                       */
/* ------------------------------------------------------------------ */
const KEYS = {
  prefs: 'dearself.userprefs',
  entries: 'dearself.entries',
  today: 'dearself.today',
  favorites: 'dearself.favorites',
};

/* ------------------------------------------------------------------ */
/* Public images helper (served from /public/images)                  */
/* ------------------------------------------------------------------ */
export const DEFAULT_PAPER_KEY = 'romantic2';
const PUBLIC = process.env.PUBLIC_URL || '';
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
  } catch {
    // ignore quota / private mode errors
  }
}

/* ------------------------------------------------------------------ */
/* User Prefs                                                         */
/* ------------------------------------------------------------------ */
const DEFAULT_PREFS = {
  brandTheme: 'sage',
  headerFont: 'merriweather',
  siteBg: '#FAF9F6',
  bgTexture: 'none',
  siteWidth: '950px',
  cardDensity: 'cozy',
  motion: 'low',
  compactUI: false,
  navOrder: ['today', 'past', 'favorites', 'settings'],
  cardOrder: 'affirmation-first',
  showCategoryChip: true,
  // confirmRegenerate and weekStart removed per request
  dateFormat: 'long',
  pastDefaultRange: 'all',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
  undoMs: 4000,
  selectedPaperKey: DEFAULT_PAPER_KEY,
};

export function getUserPrefs() {
  const p = safeRead(KEYS.prefs, DEFAULT_PREFS);
  return ensureDefaultPaper({ ...DEFAULT_PREFS, ...p });
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
    ? list.map((e) => ({
        id: e.id,
        iso: e.iso,
        content: e.content ?? '',
        style: {
          themeKey: e.style?.themeKey,
          imageSrc: e.style?.imageSrc,
          fontFamily: e.style?.fontFamily,
          fontColor: e.style?.fontColor,
          dateColor: e.style?.dateColor,
          fontSize: e.style?.fontSize,
          bold: !!e.style?.bold,
          italic: !!e.style?.italic,
        },
      }))
    : [];
}

export function addEntry(content = '', style = {}) {
  const prefs = getUserPrefs();
  const themeKey = style.themeKey ?? prefs.selectedPaperKey ?? DEFAULT_PAPER_KEY;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    iso: new Date().toISOString(),
    content: String(content || ''),
    style: {
      themeKey,
      imageSrc: style.imageSrc ?? imageUrl(`${themeKey}.png`),
      fontFamily: style.fontFamily || 'Merriweather',
      fontColor: style.fontColor || '#2B2B2B',
      dateColor: style.dateColor || style.fontColor || '#2B2B2B',
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
  const list = listEntries().filter((e) => e.id !== id);
  safeWrite(KEYS.entries, list);
  return true;
}

export function updateEntry(id, patch = {}) {
  const list = listEntries();
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return false;

  const prev = list[i];
  const merged = {
    ...prev,
    content: patch.content !== undefined ? String(patch.content) : prev.content,
    style: {
      ...prev.style,
      ...(patch.style || {}),
    },
  };
  list[i] = merged;
  safeWrite(KEYS.entries, list);
  return true;
}

/* ------------------------------------------------------------------ */
/* Favorites API (for Affirmations)                                   */
/* ------------------------------------------------------------------ */
export function listFavorites() {
  const favs = safeRead(KEYS.favorites, []);
  return Array.isArray(favs) ? favs : [];
}

// Back-compat alias for older imports
export const listFavoriteItems = (...args) => listFavorites(...args);

export function toggleFavorite(item) {
  const favs = listFavorites();
  const id = item?.id || `${item?.date || ''}-${item?.text || ''}`;
  const idx = favs.findIndex((f) => (f.id || f.text) === (id || item?.text));
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push({
      id,
      text: item?.text || item?.affirmation || '',
      challenge: item?.challenge || '',
      category: item?.category || item?.theme || 'Daily',
      addedIso: new Date().toISOString(),
    });
  }
  safeWrite(KEYS.favorites, favs);
  return favs;
}

/** Explicit remover to satisfy components importing removeFavorite */
export function removeFavorite(target) {
  const favs = listFavorites();
  const id =
    typeof target === 'string'
      ? target
      : target?.id || `${target?.date || ''}-${target?.text || ''}`;

  const next = favs.filter((f) => (f.id || f.text) !== (id || target?.text));
  safeWrite(KEYS.favorites, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Today Card (Affirmation + Challenge)                               */
/* ------------------------------------------------------------------ */
function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const AFFIRMATIONS = [
  'I honor my progress, no matter the pace.',
  'I choose compassion for myself today.',
  'I am allowed to take up space and dream boldly.',
  'I am safe to grow at my own rhythm.',
  'My voice matters—gentle and strong.',
  'I create calm through small, loving actions.',
  'I show up for myself with courage.',
  'Little by little, I rewrite my story.',
];

const CHALLENGES = [
  'Take 5 slow breaths and write one thing you’re grateful for.',
  'Set a 10-minute timer and tidy a tiny corner.',
  'Drink a full glass of water and write how your body feels.',
  'Message someone “thinking of you” and jot their reply.',
  'Step outside for 2 minutes; describe one detail you notice.',
  'Say “no” to one non-essential thing today; reflect on it.',
  'Write one boundary you kept this week.',
  'Celebrate a tiny win in three sentences.',
];

function seededPick(seed, arr) {
  let x = seed % 2147483647;
  x = (x * 48271) % 2147483647;
  return arr[x % arr.length];
}

function buildTodayCard(today = new Date()) {
  const s = Number(ymd(today).replace(/-/g, ''));
  const text = seededPick(s, AFFIRMATIONS);
  const challenge = seededPick(s * 17, CHALLENGES);
  return {
    id: `day-${ymd(today)}`,
    date: ymd(today),
    text,
    affirmation: text,
    challenge,
    category: 'Daily',
  };
}

export function ensureTodayAffirmation() {
  const todayKey = ymd(new Date());
  const saved = safeRead(KEYS.today, null);
  if (saved && saved.ymd === todayKey && saved.text && saved.challenge) {
    return {
      id: `day-${todayKey}`,
      date: todayKey,
      text: saved.text,
      affirmation: saved.text,
      challenge: saved.challenge,
      category: saved.category || 'Daily',
    };
  }
  const next = buildTodayCard(new Date());
  safeWrite(KEYS.today, {
    ymd: todayKey,
    text: next.text,
    challenge: next.challenge,
    category: next.category,
  });
  return next;
}

export function regenerateToday(force = false) {
  const next = buildTodayCard(new Date());
  safeWrite(KEYS.today, {
    ymd: ymd(new Date()),
    text: next.text,
    challenge: next.challenge,
    category: next.category,
    regenerated: true,
    force,
  });
  return next;
}

/* ------------------------------------------------------------------ */
/* Convenience: migrate any old image paths to public/                 */
/* ------------------------------------------------------------------ */
(function migrateImagePathsOnce() {
  try {
    const list = listEntries();
    let changed = false;
    const fix = (src) => {
      if (!src) return src;
      if (/\/images\//.test(src) && !/^https?:/.test(src) && !src.startsWith(PUBLIC)) {
        return src;
      }
      return src;
    };

    const fixed = list.map((e) => {
      const themeKey = e.style?.themeKey || DEFAULT_PAPER_KEY;
      const imageSrc = e.style?.imageSrc || imageUrl(`${themeKey}.png`);
      const corrected = fix(imageSrc) || imageUrl(`${themeKey}.png`);
      if (corrected !== e.style?.imageSrc) changed = true;
      return { ...e, style: { ...e.style, imageSrc: corrected } };
    });

    if (changed) safeWrite(KEYS.entries, fixed);

    const prefs = getUserPrefs();
    if (!prefs.selectedPaperKey) {
      setUserPrefs({ selectedPaperKey: DEFAULT_PAPER_KEY });
    }
  } catch {
    // ignore
  }
})();

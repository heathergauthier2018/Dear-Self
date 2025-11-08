// src/utils/prefs.js
const PREFS_KEY = 'dearself.userprefs.v1';

// ---- Defaults (safe, pretty) ----
const DEFAULTS = {
  // Branding & look
  brandTheme: 'sage',         // 'sage' | 'blush' | 'midnight'
  headerFont: 'merriweather', // new ids, e.g., 'playfair', 'inter', ...
  siteBg: '#FAF9F6',
  bgTexture: 'none',          // 'none' | 'paper' | 'dots'
  siteWidth: '950px',
  cardDensity: 'cozy',        // 'cozy' | 'snug'
  compactUI: false,
  motion: 'low',              // 'off' | 'low' | 'standard'

  // Nav
  landingPage: 'today',
  navVisible: { today: true, past: true, favorites: true, settings: true },
  navOrder: ['today', 'past', 'favorites', 'settings'],

  // Daily card
  cardOrder: 'affirmation-first',
  showCategoryChip: true,
  confirmRegenerate: false,
  heartStyle: 'emoji',        // 'emoji' | 'icon'

  // Favorites
  favLayout: 'grid',
  favSort: 'newest',
  favShowTags: true,

  // Past entries
  dateFormat: 'long',         // 'long' | 'medium' | 'short'
  weekStart: 0,               // 0 Sun, 1 Mon
  pastDefaultRange: 'all',

  // Locale/time/reminders
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
  undoMs: 7000,
  uiSounds: false,
  showTips: true,

  // Reminders (local only)
  remindersOn: false,
  reminderTime: '09:00',
  reminderDays: [1,2,3,4,5],  // weekdays
  reminderEmailOn: false,
  reminderSmsOn: false,
  email: '',
  phone: '',
  smsConsent: false,
  quietStart: '21:00',
  quietEnd: '07:00',
};

// ---- helpers ----
function deepMerge(base, patch) {
  const out = { ...base };
  for (const k in patch || {}) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---- public API ----
export function loadPrefs() {
  let p = DEFAULTS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) p = deepMerge(DEFAULTS, JSON.parse(raw) || {});
  } catch { /* ignore */ }

  // Migrate old headerFont values ('serif'/'sans') to new ids
  if (p.headerFont === 'serif') p.headerFont = 'merriweather';
  if (p.headerFont === 'sans')  p.headerFont = 'inter';

  return p;
}

export function savePrefs(patch) {
  const next = deepMerge(loadPrefs(), patch || {});
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  applyPrefsToDOM(next);
  return next;
}

export function applyPrefsToDOM(prefs = loadPrefs()) {
  const b = document.body;

  // ---- Theme palette class (theme-*) ----
  Array.from(b.classList).filter(c => c.startsWith('theme-')).forEach(c => b.classList.remove(c));
  b.classList.add(`theme-${prefs.brandTheme || DEFAULTS.brandTheme}`);

  // ---- Header font class (header-*) ----
  Array.from(b.classList).filter(c => c.startsWith('header-')).forEach(c => b.classList.remove(c));

  // migrate again defensively
  let headerFont = prefs.headerFont || DEFAULTS.headerFont;
  if (headerFont === 'serif') headerFont = 'merriweather';
  if (headerFont === 'sans')  headerFont = 'inter';
  b.classList.add(`header-${headerFont}`);

  // ---- CSS custom properties & attributes ----
  if (prefs.siteBg)     b.style.setProperty('--site-bg', prefs.siteBg);
  if (prefs.siteWidth)  b.style.setProperty('--site-width', prefs.siteWidth);

  b.setAttribute('data-card-density', prefs.cardDensity || DEFAULTS.cardDensity);
  b.setAttribute('data-motion', prefs.motion || DEFAULTS.motion);
  b.setAttribute('data-bg-texture', prefs.bgTexture || DEFAULTS.bgTexture);
  b.setAttribute('data-heart-style', prefs.heartStyle || DEFAULTS.heartStyle);

  return prefs;
}

// src/utils/prefs.js
export const PREFS_KEY = "dearself.userprefs.v1";

export const DEFAULT_PREFS = {
  brandTheme: "sage",
  headerFont: "merriweather",
  siteBg: "#FAF9F6",
  bgTexture: "none",
  textureTone: "neutral",
  textureStrength: "whisper",
  siteWidth: "950px",
  cardDensity: "cozy",
  compactUI: false,
  motion: "low",
  landingPage: "today",
  navVisible: { today: true, past: true, favorites: true, settings: true },
  navOrder: ["today", "past", "favorites", "settings"],
  dateFormat: "long",
  timeZone:
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
  undoMs: 7000,
  selectedWritingSpaceKey: "quiet-linen",
};

function deepMerge(base, patch) {
  const out = { ...base };
  for (const key in patch || {}) {
    const value = patch[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? deepMerge(out[key] || {}, value)
        : value;
  }
  return out;
}

const normalize = (prefs) => {
  const next = deepMerge(DEFAULT_PREFS, prefs || {});
  if (next.headerFont === "serif") next.headerFont = "merriweather";
  if (next.headerFont === "sans") next.headerFont = "inter";
  if (!next.navOrder.includes(next.landingPage)) next.landingPage = "today";
  return next;
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return normalize(raw ? JSON.parse(raw) : DEFAULT_PREFS);
  } catch {
    return normalize(DEFAULT_PREFS);
  }
}

export function savePrefs(patch) {
  const next = normalize(deepMerge(loadPrefs(), patch || {}));
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  applyPrefsToDOM(next);
  return next;
}

export function resetPrefs() {
  const next = normalize(DEFAULT_PREFS);
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  applyPrefsToDOM(next);
  return next;
}

export function applyPrefsToDOM(prefs = loadPrefs()) {
  const body = document.body;
  [...body.classList]
    .filter((name) => name.startsWith("theme-"))
    .forEach((name) => body.classList.remove(name));
  body.classList.add(`theme-${prefs.brandTheme || DEFAULT_PREFS.brandTheme}`);
  [...body.classList]
    .filter((name) => name.startsWith("header-"))
    .forEach((name) => body.classList.remove(name));
  body.classList.add(`header-${prefs.headerFont || DEFAULT_PREFS.headerFont}`);
  body.classList.toggle("compact-ui", prefs.cardDensity === "snug");
  body.style.setProperty("--site-bg", prefs.siteBg || DEFAULT_PREFS.siteBg);
  body.style.setProperty(
    "--site-width",
    prefs.siteWidth || DEFAULT_PREFS.siteWidth,
  );
  body.setAttribute(
    "data-card-density",
    prefs.cardDensity || DEFAULT_PREFS.cardDensity,
  );
  body.setAttribute("data-motion", prefs.motion || DEFAULT_PREFS.motion);
  body.setAttribute(
    "data-bg-texture",
    prefs.bgTexture || DEFAULT_PREFS.bgTexture,
  );
  body.setAttribute(
    "data-texture-tone",
    prefs.textureTone || DEFAULT_PREFS.textureTone,
  );
  body.setAttribute(
    "data-texture-strength",
    prefs.textureStrength || DEFAULT_PREFS.textureStrength,
  );

  const strength = prefs.textureStrength === "visible" ? 0.22 : 0.09;
  const themedRgb = {
    blush: "206, 107, 128",
    sage: "92, 148, 122",
    midnight: "43, 76, 153",
  }[prefs.brandTheme] || "112, 91, 76";
  const textureRgb =
    prefs.textureTone === "theme" ? themedRgb : "112, 91, 76";
  body.style.setProperty(
    "--texture-ink",
    `rgba(${textureRgb}, ${strength})`,
  );
  return prefs;
}
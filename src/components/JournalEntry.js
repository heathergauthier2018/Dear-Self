// src/components/JournalEntry.js
import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import '../styles/theme.css';

import {
  ensureTodayAffirmation,
  addEntry,
  getUserPrefs,
  setUserPrefs,
  toggleFavorite,
  listFavorites,
  listEntries, // ← needed for streak computation
} from '../services/affirmationEngine';

// ✅ use the existing utils component
import StreakBadge from '../utils/StreakBadge.js';

/* ——— helpers ——— */
const stripAffPrefix = (s = '') =>
  s.replace(/^\s*.*?Affirmation\s*\d+\s*:\s*/i, '').replace(/^\[|\]$/g, '').trim();
const stripChalPrefix = (s = '') =>
  s.replace(/^\s*.*?Challenge\s*\d+\s*:\s*/i, '').replace(/^\[|\]$/g, '').trim();
const themeOf = (a = {}) => a.category ?? a.theme ?? 'Daily';

/* ——— Journal font options ——— */
const FONT_OPTIONS = [
  { label: 'Inter (Sans)', value: 'Inter' },
  { label: 'Poppins (Sans)', value: 'Poppins' },
  { label: 'Montserrat (Sans)', value: 'Montserrat' },
  { label: 'Raleway (Sans)', value: 'Raleway' },
  { label: 'Josefin Sans (Sans)', value: 'Josefin Sans' },
  { label: 'Quicksand (Sans)', value: 'Quicksand' },
  { label: 'Nunito (Sans)', value: 'Nunito' },
  { label: 'Merriweather (Serif)', value: 'Merriweather' },
  { label: 'Lora (Serif)', value: 'Lora' },
  { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville' },
  { label: 'Crimson Pro', value: 'Crimson Pro' },
  { label: 'Caveat (Handwritten)', value: 'Caveat' },
  { label: 'Patrick Hand (Hand)', value: 'Patrick Hand' },
  { label: 'Handlee (Hand)', value: 'Handlee' },
  { label: 'Indie Flower (Hand)', value: 'Indie Flower' },
  { label: 'Shadows Into Light', value: 'Shadows Into Light' },
  { label: 'Great Vibes (Script)', value: 'Great Vibes' },
  { label: 'Sacramento (Script)', value: 'Sacramento' },
  { label: 'Courier Prime (Mono)', value: 'Courier Prime' },
];

/* ——— Palette ——— */
const COLORS = [
  '#111111', '#2B2B2B', '#4A4A4A',
  '#334155', '#475569',
  '#1D4ED8', '#2563EB', '#0EA5E9',
  '#6D28D9', '#9333EA',
  '#0F766E', '#10B981', '#65A30D', '#3F6212',
  '#7CA982', '#90A8A1',
  '#B91C1C', '#E11D48', '#F43F5E',
  '#EA580C', '#F59E0B',
  '#8B5E3C', '#A26A3C',
  '#F5AFC6', '#E9D5FF', '#C7D2FE', '#A7F3D0', '#D1FAE5', '#FDE68A', '#FECACA', '#BBD7C5',
];

/* ——— Theme thumbs loader ——— */
const buildImageMap = () => {
  const map = {};
  try {
    const req = require.context('../images', false, /\.(png|jpg|jpeg|gif|svg)$/);
    req.keys().forEach((k) => { const f = k.replace('./',''); map[f] = req(k); });
  } catch(_) {}
  try {
    const mods = import.meta.glob('../images/*.{png,jpg,jpeg,gif,svg}', { eager: true });
    Object.entries(mods).forEach(([p,mod]) => { const f = p.split('/').pop(); map[f] = mod.default || mod; });
  } catch(_) {}
  return map;
};
const SRC_IMAGE_MAP = buildImageMap();
const fromPublic = (name) => `${process.env.PUBLIC_URL || ''}/images/${name}`;
const IMG = (name) => SRC_IMAGE_MAP[name] || fromPublic(name);

const THEMES = {
  seasonal1: IMG('seasonal1.png'), seasonal2: IMG('seasonal2.png'), seasonal3: IMG('seasonal3.png'),
  seasonal4: IMG('seasonal4.png'), seasonal5: IMG('seasonal5.png'), seasonal6: IMG('seasonal6.png'),
  seasonal7: IMG('seasonal7.png'),
  nature1: IMG('nature1.png'), nature2: IMG('nature2.png'), nature3: IMG('nature3.png'), nature4: IMG('nature4.png'),
  nature5: IMG('nature5.png'), nature6: IMG('nature6.png'), nature7: IMG('nature7.png'), nature8: IMG('nature8.png'),
  nature9: IMG('nature9.png'), nature10: IMG('nature10.png'), nature11: IMG('nature11.png'), nature12: IMG('nature12.png'),
  whimsical1: IMG('whimsical1.png'), whimsical2: IMG('whimsical2.png'), whimsical3: IMG('whimsical3.png'),
  whimsical4: IMG('whimsical4.png'), whimsical5: IMG('whimsical5.png'), whimsical6: IMG('whimsical6.png'),
  whimsical7: IMG('whimsical7.png'), whimsical8: IMG('whimsical8.png'), whimsical9: IMG('whimsical9.png'),
  minimal1: IMG('minimal1.png'), minimal2: IMG('minimal2.png'), minimal3: IMG('minimal3.png'),
  minimal4: IMG('minimal4.png'), minimal5: IMG('minimal5.png'), minimal6: IMG('minimal6.png'),
  night1: IMG('night1.png'), night2: IMG('night2.png'), night3: IMG('night3.png'),
  night4: IMG('night4.png'), night5: IMG('night5.png'), night6: IMG('night6.png'),
  romantic1: IMG('romantic1.png'), romantic2: IMG('romantic2.png'), romantic3: IMG('romantic3.png'),
  romantic4: IMG('romantic4.png'), romantic5: IMG('romantic5.png'), romantic6: IMG('romantic6.png'),
  coquette1: IMG('coquette1.png'), coquette2: IMG('coquette2.png'), coquette3: IMG('coquette3.png'),
  coquette4: IMG('coquette4.png'), coquette5: IMG('coquette5.png'), coquette6: IMG('coquette6.png'),
  coquette7: IMG('coquette7.png'), coquette8: IMG('coquette8.png'),
  florals1: IMG('florals1.png'), florals2: IMG('florals2.png'), florals3: IMG('florals3.png'),
  florals4: IMG('florals4.png'), florals5: IMG('florals5.png'),
};

const THEME_GROUPS = [
  { key: 'coquette', label: 'Coquette' },
  { key: 'florals', label: 'Florals' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'nature', label: 'Nature' },
  { key: 'night', label: 'Night' },
  { key: 'romantic', label: 'Romantic' },
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'whimsical', label: 'Whimsical' },
];

/* Baseline text styles */
const canvasStyles = {
  date: {
    textAlign: 'right',
    fontSize: 'clamp(14px, 1.9vw, 20px)',
    textShadow: '0 1px 0 rgba(255,255,255,.6)',
    fontWeight: 700,
  },
  textarea: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    lineHeight: 1.6,
    fontSize: 'clamp(14px, 1.9vw, 20px)',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
};

/* ——— Streak helpers (local) ——— */
const dkey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/** Returns the length of the current consecutive-day streak.
 * Chain must end at today (if you’ve saved today) or at yesterday (if not yet).
 * Any missed day breaks the streak.
 */
function computeStreak(entries = []) {
  const days = new Set(entries.map(e => dkey(new Date(e.iso))));
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

  const start =
    days.has(dkey(today)) ? new Date(today) :
    days.has(dkey(yesterday)) ? new Date(yesterday) : null;

  if (!start) return 0;

  let streak = 0;
  const cursor = new Date(start);
  while (days.has(dkey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function JournalEntry() {
  const [prefs, setPrefs] = useState(() => getUserPrefs() || {});
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || e.key.includes('dearself.userprefs')) setPrefs(getUserPrefs() || {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [card] = useState(() => ensureTodayAffirmation());
  const [favs, setFavs] = useState(() => listFavorites());
  const themeTag = themeOf(card);
  const isFav = favs.some((f) => (f.id || f.text) === (card.id || card.text));

  const [selectedTheme, setSelectedTheme] = useState({ key: 'romantic2', src: THEMES['romantic2'] });
  const [fontFamily, setFontFamily] = useState('Merriweather');
  const [fontColor, setFontColor] = useState('#2B2B2B');
  const [fontSize, setFontSize] = useState(20);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [entryText, setEntryText] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  // 🔥 streak state
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(computeStreak(listEntries()));
  }, []);

  useEffect(() => {
    const p = getUserPrefs() || {};
    if (!p.selectedPaperKey) {
      const seeded = { ...p, selectedPaperKey: 'romantic2' };
      setUserPrefs(seeded); setPrefs(seeded);
      setSelectedTheme({ key: 'romantic2', src: THEMES['romantic2'] });
    } else if (THEMES[p.selectedPaperKey]) {
      setSelectedTheme({ key: p.selectedPaperKey, src: THEMES[p.selectedPaperKey] });
    }
  }, []);

  const onToggleFav = () => {
    const after = toggleFavorite({ ...card, id: card.id || `${card.date}-${card.text}` });
    setFavs(after);
  };

  const handleSave = () => {
    addEntry(entryText, {
      themeKey: selectedTheme?.key,
      imageSrc: selectedTheme?.src || null,
      fontFamily, fontColor, fontSize, bold: isBold, italic: isItalic, dateColor: fontColor,
    });
    // Recompute streak right after save
    setStreak(computeStreak(listEntries()));
    setSavedToast(true); setTimeout(() => setSavedToast(false), 1800); setEntryText('');
  };

  const heartOff = '🤍';
  const heartOn = '❤️';
  const activeGroup = (selectedTheme.key || '').split(/[0-9]/)[0] || 'romantic';

  return (
    <div className="page-wrap" style={{ maxWidth: 860, margin: '0 auto', paddingInline: 14 }}>
      {/* ===== Affirmation Card (white) ===== */}
      <section className="card shadow-md" style={{ background: '#fff', maxWidth: 860, margin: '0 auto' }}>
        <h1 className="brand-subtitle page-title" style={{ textAlign: 'center', marginTop: 0 }}>Dear Self</h1>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <div className="affirmation-line">
            <strong>Affirmation:</strong> {stripAffPrefix(card.text || card.affirmation || '')}
          </div>
          <div className="challenge-line">
            <strong>Challenge:</strong>{' '}
            <span className="challenge-text">{stripChalPrefix(card.challenge || '')}</span>
          </div>
        </div>

        {/* Footer: chip on the left, tools (streak + heart) on the right */}
        <div className="card-footer" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {(prefs?.showCategoryChip ?? true) && <span className="chip">{themeTag}</span>}
          </div>

          <div className="card-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* 🔥 now lives on the right with the tools; component hides itself if < 2 */}
            <StreakBadge value={streak} />

            <button
              className={`fav-btn ${isFav ? 'active' : ''}`}
              onClick={onToggleFav}
              aria-label="Favorite"
              title="Favorite"
            >
              {isFav ? heartOn : heartOff}
            </button>
          </div>
        </div>
      </section>

      <h2 className="brand-subtitle" style={{ textAlign: 'center', margin: '12px 0 8px' }}>
        Reflect in your journal
      </h2>

      {/* ===== Journal Card (white, image fills fully) ===== */}
      <section className="journal-card shadow-md" style={{ background: '#fff', maxWidth: 860, margin: '0 auto', padding: 0 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* Paper image fills entire card */}
          {selectedTheme?.src && (
            <img
              src={selectedTheme.src}
              alt={selectedTheme.key}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}

          {/* Overlay clipped to image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            {/* Date */}
            <div
              style={{
                position: 'absolute',
                left: '7%',
                right: '7%',
                top: '4%',
                ...canvasStyles.date,
                color: fontColor,
                fontFamily,
              }}
            >
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>

            {/* Textarea */}
            <textarea
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="Write to yourself..."
              className="journal-textarea"
              style={{
                position: 'absolute',
                left: '7%',
                right: '7%',
                top: 'calc(5% + 44px)',
                bottom: '8%',
                ...canvasStyles.textarea,
                color: fontColor,
                fontFamily,
                fontWeight: isBold ? 700 : 400,
                fontStyle: isItalic ? 'italic' : 'normal',
                fontSize: `${fontSize}px`,
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== Customizer (white) ===== */}
      <section className="customizer shadow-md" style={{ background: '#fff', maxWidth: 860, margin: '12px auto 0' }}>
        <div className="topbar">
          <button className="primary" onClick={handleSave}>Save Entry</button>
        </div>

        <div className="row gap">
          <label className="field" style={{ minWidth: 240 }}>
            <span>Journal Font</span>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              {FONT_OPTIONS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
            </select>
          </label>

          <label className="field" style={{ minWidth: 180 }}>
            <span>Font Size</span>
            <select value={String(fontSize)} onChange={(e) => setFontSize(Number(e.target.value))}>
              {[16,18,20,22,24,26,28,30].map(n => (<option key={n} value={n}>{n}px</option>))}
            </select>
          </label>

          <div className="toggle-field">
            <label className={`pill ${isBold ? 'active' : ''}`}>
              <input type="checkbox" checked={isBold} onChange={(e) => setIsBold(e.target.checked)} /> Bold
            </label>
            <label className={`pill ${isItalic ? 'active' : ''}`}>
              <input type="checkbox" checked={isItalic} onChange={(e) => setIsItalic(e.target.checked)} /> Italic
            </label>
          </div>
        </div>

        <div className="colors" style={{ marginTop: 10 }}>
          <span className="field" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Font Color</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch ${fontColor === c ? 'selected' : ''}`}
                onClick={() => setFontColor(c)}
                style={{ background: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="tabs">
            {THEME_GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`tab ${activeGroup === g.key ? 'active' : ''}`}
                onClick={() => {
                  const first = Object.keys(THEMES).find((k) => k.startsWith(g.key));
                  if (first) {
                    setSelectedTheme({ key: first, src: THEMES[first] });
                    const p = getUserPrefs() || {};
                    setUserPrefs({ ...p, selectedPaperKey: first });
                    setPrefs({ ...p, selectedPaperKey: first });
                  }
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="thumb-grid">
            {Object.entries(THEMES)
              .filter(([key]) => key.startsWith(activeGroup))
              .map(([key, src]) => (
                <button
                  type="button"
                  key={key}
                  className={`thumb ${selectedTheme.key === key ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTheme({ key, src });
                    const p = getUserPrefs() || {};
                    setUserPrefs({ ...p, selectedPaperKey: key });
                    setPrefs({ ...p, selectedPaperKey: key });
                  }}
                  title={key}
                >
                  <img src={src} alt={key} />
                  <span className="thumb-label">{key}</span>
                </button>
              ))}
          </div>
        </div>
      </section>

      {savedToast && (
        <div className="undo-bar" role="status" aria-live="polite" style={{ background: '#14532d' }}>
          <span>Saved!</span>
        </div>
      )}
    </div>
  );
}

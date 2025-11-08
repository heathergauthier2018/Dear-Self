// src/components/JournalEntry.js
import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import '../styles/theme.css';

import {
  ensureTodayAffirmation,
  regenerateToday,
  addEntry,
  getUserPrefs,
  setUserPrefs,
  toggleFavorite,
  listFavorites
} from '../services/affirmationEngine';

/* ——— helpers ——— */
const stripAffPrefix = (s = '') =>
  s.replace(/^\s*.*?Affirmation\s*\d+\s*:\s*/i, '').replace(/^\[|\]$/g, '').trim();
const stripChalPrefix = (s = '') =>
  s.replace(/^\s*.*?Challenge\s*\d+\s*:\s*/i, '').replace(/^\[|\]$/g, '').trim();
const themeOf = (a = {}) => a.category ?? a.theme ?? 'Daily';

/* ——— Journal font options (aligned with Settings). 
      If a family isn’t loaded in index.html, it’ll gracefully fall back. ——— */
const FONT_OPTIONS = [
  // Sans / modern
  { label: 'Inter (Sans)',            value: 'Inter' },
  { label: 'Poppins (Sans)',          value: 'Poppins' },
  { label: 'Montserrat (Sans)',       value: 'Montserrat' },
  { label: 'Raleway (Sans)',          value: 'Raleway' },
  { label: 'Josefin Sans (Sans)',     value: 'Josefin Sans' },
  { label: 'Quicksand (Sans)',        value: 'Quicksand' },
  { label: 'Nunito (Sans)',           value: 'Nunito' },

  // Serif / editorial
  { label: 'Merriweather (Serif)',    value: 'Merriweather' },
  { label: 'Lora (Serif)',            value: 'Lora' },
  { label: 'Playfair Display (Serif)',value: 'Playfair Display' },
  { label: 'Cormorant Garamond',      value: 'Cormorant Garamond' },
  { label: 'Cinzel',                  value: 'Cinzel' },
  { label: 'Libre Baskerville',       value: 'Libre Baskerville' },
  { label: 'Crimson Pro',             value: 'Crimson Pro' },

  // Handwritten / Display
  { label: 'Caveat (Handwritten)',    value: 'Caveat' },
  { label: 'Patrick Hand (Hand)',     value: 'Patrick Hand' },
  { label: 'Handlee (Hand)',          value: 'Handlee' },
  { label: 'Indie Flower (Hand)',     value: 'Indie Flower' },
  { label: 'Shadows Into Light',      value: 'Shadows Into Light' },
  { label: 'Great Vibes (Script)',    value: 'Great Vibes' },
  { label: 'Sacramento (Script)',     value: 'Sacramento' },

  // Monospace (nice contrast option)
  { label: 'Courier Prime (Mono)',    value: 'Courier Prime' },
];

/* ——— Expanded, de-duplicated color palette ———
   Curated across neutrals, pastels, warms, cools, and muted tones.
   (Spaced to avoid near-duplicates.) */
const COLORS = [
  // Neutrals
  '#111111', '#2B2B2B', '#4A4A4A',

  // Cool greys / slate
  '#334155', '#475569',

  // Blues
  '#1D4ED8', // royal blue
  '#2563EB', // bright azure
  '#0EA5E9', // light cyan

  // Purples
  '#6D28D9', // violet
  '#9333EA', // orchid

  // Teals & Greens
  '#0F766E', // deep teal
  '#10B981', // emerald
  '#65A30D', // olive-lime
  '#3F6212', // moss

  // Muted greens (journal-friendly)
  '#7CA982', // soft sage green
  '#90A8A1', // eucalyptus grey-green

  // Warm reds / pinks
  '#B91C1C', // deep red
  '#E11D48', // raspberry
  '#F43F5E', // rose

  // Oranges / Gold
  '#EA580C', // warm orange
  '#F59E0B', // amber

  // Browns
  '#8B5E3C', // chestnut
  '#A26A3C', // caramel

  // Pastels (light & legible on white art)
  '#F5AFC6', // pastel blush pink
  '#E9D5FF', // pastel lavender
  '#C7D2FE', // periwinkle
  '#A7F3D0', // mint
  '#D1FAE5', // seafoam
  '#FDE68A', // butter
  '#FECACA', // soft peachy pink
  '#BBD7C5', // pale sage
];

/* ——— groups shown as tabs ——— */
const THEME_GROUPS = [
  { key: 'coquette', label: 'Coquette' },
  { key: 'florals',  label: 'Florals'  },
  { key: 'minimal',  label: 'Minimal'  },
  { key: 'nature',   label: 'Nature'   },
  { key: 'night',    label: 'Night'    },
  { key: 'romantic', label: 'Romantic' },
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'whimsical',label: 'Whimsical'},
];

/* ===========================================================
   Robust image resolver (src/images/* if bundled, else public/images/*)
   =========================================================== */
const buildImageMap = () => {
  const map = {};
  try {
    const req = require.context('../images', false, /\.(png|jpg|jpeg|gif|svg)$/);
    req.keys().forEach((k) => {
      const filename = k.replace('./', '');
      map[filename] = req(k);
    });
  } catch (_) {}
  try {
    const mods = import.meta.glob('../images/*.{png,jpg,jpeg,gif,svg}', { eager: true });
    Object.entries(mods).forEach(([path, mod]) => {
      const filename = path.split('/').pop();
      map[filename] = mod.default || mod;
    });
  } catch (_) {}
  return map;
};

const SRC_IMAGE_MAP = buildImageMap();
const fromPublic = (name) => `${process.env.PUBLIC_URL || ''}/images/${name}`;
const IMG = (name) => SRC_IMAGE_MAP[name] || fromPublic(name);

/* ——— all theme thumbnails ——— */
const THEMES = {
  // Seasonal
  seasonal1: IMG('seasonal1.png'),
  seasonal2: IMG('seasonal2.png'),
  seasonal3: IMG('seasonal3.png'),
  seasonal4: IMG('seasonal4.png'),
  seasonal5: IMG('seasonal5.png'),
  seasonal6: IMG('seasonal6.png'),
  seasonal7: IMG('seasonal7.png'),

  // Nature
  nature1: IMG('nature1.png'),
  nature2: IMG('nature2.png'),
  nature3: IMG('nature3.png'),
  nature4: IMG('nature4.png'),
  nature5: IMG('nature5.png'),
  nature6: IMG('nature6.png'),
  nature7: IMG('nature7.png'),
  nature8: IMG('nature8.png'),
  nature9: IMG('nature9.png'),
  nature10: IMG('nature10.png'),
  nature11: IMG('nature11.png'),
  nature12: IMG('nature12.png'),

  // Whimsical
  whimsical1: IMG('whimsical1.png'),
  whimsical2: IMG('whimsical2.png'),
  whimsical3: IMG('whimsical3.png'),
  whimsical4: IMG('whimsical4.png'),
  whimsical5: IMG('whimsical5.png'),
  whimsical6: IMG('whimsical6.png'),
  whimsical7: IMG('whimsical7.png'),
  whimsical8: IMG('whimsical8.png'),
  whimsical9: IMG('whimsical9.png'),

  // Minimal
  minimal1: IMG('minimal1.png'),
  minimal2: IMG('minimal2.png'),
  minimal3: IMG('minimal3.png'),
  minimal4: IMG('minimal4.png'),
  minimal5: IMG('minimal5.png'),
  minimal6: IMG('minimal6.png'),

  // Night
  night1: IMG('night1.png'),
  night2: IMG('night2.png'),
  night3: IMG('night3.png'),
  night4: IMG('night4.png'),
  night5: IMG('night5.png'),
  night6: IMG('night6.png'),

  // Romantic
  romantic1: IMG('romantic1.png'),
  romantic2: IMG('romantic2.png'),
  romantic3: IMG('romantic3.png'),
  romantic4: IMG('romantic4.png'),
  romantic5: IMG('romantic5.png'),
  romantic6: IMG('romantic6.png'),

  // Coquette
  coquette1: IMG('coquette1.png'),
  coquette2: IMG('coquette2.png'),
  coquette3: IMG('coquette3.png'),
  coquette4: IMG('coquette4.png'),
  coquette5: IMG('coquette5.png'),
  coquette6: IMG('coquette6.png'),
  coquette7: IMG('coquette7.png'),
  coquette8: IMG('coquette8.png'),

  // Florals
  florals1: IMG('florals1.png'),
  florals2: IMG('florals2.png'),
  florals3: IMG('florals3.png'),
  florals4: IMG('florals4.png'),
  florals5: IMG('florals5.png'),
};

export default function JournalEntry() {
  /* ===== prefs (for chip + confirm) ===== */
  const [prefs, setPrefs] = useState(() => getUserPrefs() || {});
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || e.key.includes('dearself.userprefs')) {
        setPrefs(getUserPrefs() || {});
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* ===== Load / show today's card ===== */
  const [card, setCard] = useState(() => ensureTodayAffirmation());
  const themeTag = themeOf(card);
  const [favs, setFavs] = useState(() => listFavorites());
  const isFav = favs.some(f => (f.id || f.text) === (card.id || card.text));

  /* ===== Journal state (visual) ===== */
  const [selectedTheme, setSelectedTheme] = useState({ key: 'whimsical3', src: THEMES['whimsical3'] });
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontColor, setFontColor]   = useState('#2B2B2B');
  const [fontSize, setFontSize]     = useState(20);
  const [isBold, setIsBold]         = useState(false);
  const [isItalic, setIsItalic]     = useState(false);

  const [entryText, setEntryText]   = useState('');
  const [savedToast, setSavedToast] = useState(false);

  /* ===== Apply saved prefs once (load selected paper) ===== */
  useEffect(() => {
    const p = getUserPrefs() || {};
    if (p.selectedPaperKey && THEMES[p.selectedPaperKey]) {
      setSelectedTheme({ key: p.selectedPaperKey, src: THEMES[p.selectedPaperKey] });
    }
    setUserPrefs({ ...p }); // merge-safe in your service
    setPrefs(p);
  }, []);

  /* ===== Actions ===== */
  const onRegenerate = () => {
    const p = getUserPrefs() || prefs;
    if (p?.confirmRegenerate) {
      const ok = window.confirm('Regenerate today’s affirmation and challenge?');
      if (!ok) return;
    }
    setCard(regenerateToday());
  };

  const onToggleFav = () => {
    const after = toggleFavorite({
      ...card,
      id: card.id || `${card.date}-${card.text}`,
    });
    setFavs(after);
  };

  const handleSave = () => {
    addEntry(entryText, {
      themeKey: selectedTheme?.key,
      imageSrc: selectedTheme?.src || null,
      fontFamily,
      fontColor,
      fontSize,
      bold: isBold,
      italic: isItalic,
      dateColor: fontColor
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
    setEntryText('');
  };

  /* ===== Render ===== */
  const heartOff = '🤍';
  const heartOn  = '❤️';
  const activeGroup = (selectedTheme.key || '').split(/[0-9]/)[0] || 'whimsical';

  return (
    <div className="page-wrap">
      {/* ===== Affirmation Card ===== */}
      <section className="card shadow-md">
        <h1 className="brand-subtitle page-title" style={{ textAlign: 'center', marginTop: 0 }}>
          Dear Self
        </h1>

        <div className="card-body" style={{ textAlign: 'center' }}>
          <div className="affirmation-line">
            <strong>Affirmation:</strong>{' '}
            {stripAffPrefix(card.text || card.affirmation || '')}
          </div>
          <div className="challenge-line">
            <strong>Challenge:</strong>{' '}
            <span className="challenge-text">{stripChalPrefix(card.challenge || '')}</span>
          </div>
        </div>

        <div className="card-footer">
          {(prefs?.showCategoryChip ?? true) && <span className="chip">{themeTag}</span>}
          <div className="card-actions">
            <button className="link-button" onClick={onRegenerate}>Regenerate</button>
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

      {/* ===== Reflect heading (restored) ===== */}
      <h2 className="brand-subtitle" style={{ textAlign: 'center', margin: '0 0 8px' }}>
        Reflect in your journal
      </h2>

      {/* ===== Journal Canvas ===== */}
      <section className="journal-card shadow-md">
        <div className="journal-canvas">
          {selectedTheme?.src && (
            <img className="journal-img" src={selectedTheme.src} alt={selectedTheme.key} />
          )}

          <div className="journal-overlay">
            <div className="journal-topline">
              <div
                className="journal-date"
                style={{
                  color: fontColor,
                  fontFamily: fontFamily,
                  fontWeight: 700
                }}
              >
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>

            <textarea
              className="journal-textarea"
              placeholder="Write to yourself…"
              value={entryText}
              onChange={e => setEntryText(e.target.value)}
              style={{
                color: fontColor,
                fontFamily,
                fontWeight: isBold ? 700 : 400,
                fontStyle: isItalic ? 'italic' : 'normal',
                fontSize: `${fontSize}px`,
                lineHeight: 1.6
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== Customizer ===== */}
      <section className="customizer shadow-md">
        <div className="topbar">
          <button className="primary" onClick={handleSave}>Save Entry</button>
        </div>

        <div className="row gap">
          <label className="field" style={{ minWidth: 240 }}>
            <span>Journal Font</span>
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>

          <label className="field" style={{ minWidth: 180 }}>
            <span>Font Size</span>
            <select
              value={String(fontSize)}
              onChange={e => setFontSize(Number(e.target.value))}
            >
              {[16,18,20,22,24,26,28,30].map(n => <option key={n} value={n}>{n}px</option>)}
            </select>
          </label>

          <div className="toggle-field">
            <label className={`pill ${isBold ? 'active' : ''}`}>
              <input type="checkbox" checked={isBold} onChange={e => setIsBold(e.target.checked)} />
              Bold
            </label>
            <label className={`pill ${isItalic ? 'active' : ''}`}>
              <input type="checkbox" checked={isItalic} onChange={e => setIsItalic(e.target.checked)} />
              Italic
            </label>
          </div>
        </div>

        {/* Font Color swatches */}
        <div className="colors" style={{ marginTop: 10 }}>
          <span className="field" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Font Color
          </span>
          <div className="swatches">
            {COLORS.map(c => (
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

        {/* Theme Groups */}
        <div style={{ marginTop: 18 }}>
          <div className="tabs">
            {THEME_GROUPS.map(g => (
              <button
                key={g.key}
                type="button"
                className={`tab ${activeGroup === g.key ? 'active' : ''}`}
                onClick={() => {
                  const first = Object.keys(THEMES).find(k => k.startsWith(g.key));
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

          {/* Thumbs filtered by current group */}
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

      {/* Toast */}
      {savedToast && (
        <div className="undo-bar" role="status" aria-live="polite" style={{ background:'#14532d' }}>
          <span>Saved!</span>
        </div>
      )}
    </div>
  );
}

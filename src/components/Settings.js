// src/components/Settings.js
import React, { useEffect, useMemo, useState } from 'react';
import '../styles/theme.css';
import { loadPrefs, savePrefs, applyPrefsToDOM } from '../utils/prefs';

const THEME_OPTIONS = [
  { id: 'sage', label: 'Sage' },
  { id: 'blush', label: 'Blush' },
  { id: 'midnight', label: 'Midnight' },
];

const HEADER_FONTS = [
  // Serifs
  { id: 'merriweather', label: 'Merriweather (Serif)' },
  { id: 'playfair',     label: 'Playfair Display (Serif)' },
  { id: 'lora',         label: 'Lora (Serif)' },
  { id: 'cormorant',    label: 'Cormorant Garamond (Serif)' },
  { id: 'cinzel',       label: 'Cinzel (Classic Serif)' },
  { id: 'librebask',    label: 'Libre Baskerville (Serif)' },
  { id: 'crimson',      label: 'Crimson Pro (Serif)' },
  // Sans / modern
  { id: 'inter',        label: 'Inter (Sans)' },
  { id: 'montserrat',   label: 'Montserrat (Sans)' },
  { id: 'poppins',      label: 'Poppins (Sans)' },
  { id: 'raleway',      label: 'Raleway (Sans)' },
  { id: 'josefin',      label: 'Josefin Sans (Art-Deco Sans)' },
  { id: 'quicksand',    label: 'Quicksand (Soft Sans)' },
  { id: 'nunito',       label: 'Nunito (Rounded Sans)' },
  // Display / Script
  { id: 'bebas',        label: 'Bebas Neue (Display)' },
  { id: 'abril',        label: 'Abril Fatface (Display)' },
  { id: 'greatvibes',   label: 'Great Vibes (Script)' },
  { id: 'sacramento',   label: 'Sacramento (Script)' },
];

const WIDTHS = [
  { label: 'Narrow (840px)', value: '840px' },
  { label: 'Standard (950px)', value: '950px' },
  { label: 'Wide (1100px)', value: '1100px' },
];

const MOTION = [
  { id: 'off', label: 'Off' },
  { id: 'low', label: 'Subtle' },
  { id: 'standard', label: 'Lively' },
];

// The only tabs we support (always visible)
const NAV_KEYS = ['today', 'past', 'favorites', 'settings'];

const DATE_FORMATS = [
  { id: 'long',   sample: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
  { id: 'medium', sample: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
  { id: 'short',  sample: new Date().toLocaleDateString(undefined) },
];

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
  'America/Chicago','America/New_York','America/Denver','America/Los_Angeles','Europe/London'
];

export default function Settings() {
  const base = useMemo(() => loadPrefs(), []);
  const [prefs, setPrefs] = useState(base);

  useEffect(() => { applyPrefsToDOM(prefs); }, []);

  // Dispatch a small event so App.js can react (reorder nav immediately)
  const broadcast = () => window.dispatchEvent(new Event('dearself:prefs'));

  const save = (patch) => {
    const next = savePrefs(patch);
    setPrefs(next);
    applyPrefsToDOM(next);
    broadcast();
  };

  const moveNav = (key, dir) => {
    const arr = [...prefs.navOrder];
    const i = arr.indexOf(key);
    if (i < 0) return;
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    save({ navOrder: arr });
  };

  return (
    <div className="page-wrap">
      <section className="card shadow-md" style={{ background: '#FFF9F1' }}>
        <h1 className="brand-subtitle page-title" style={{ textAlign: 'center', marginTop: 0 }}>Settings</h1>

        <div style={{ display: 'grid', gap: 16, marginTop: 8 }}>

          {/* Branding & Look */}
          <fieldset className="fav-card" style={{ background: '#fff' }}>
            <legend><strong>Branding & Look</strong></legend>
            <div className="row" style={{ gap: 16, alignItems: 'center' }}>
              <label className="field" style={{ minWidth: 200 }}>
                <span>Theme</span>
                <select
                  value={prefs.brandTheme}
                  onChange={e => save({ brandTheme: e.target.value })}
                >
                  {THEME_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>

              <label className="field" style={{ minWidth: 200 }}>
                <span>Header Font</span>
                <select
                  value={prefs.headerFont || 'merriweather'}
                  onChange={e => save({ headerFont: e.target.value })}
                >
                  {HEADER_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>

              <label className="field" style={{ minWidth: 220 }}>
                <span>Background Color</span>
                <input
                  type="color"
                  value={prefs.siteBg}
                  onChange={e => save({ siteBg: e.target.value })}
                  style={{ width: 64, height: 40, padding: 0, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
              </label>

              <label className="field" style={{ minWidth: 180 }}>
  <span>Texture</span>
  <select
  value={prefs.bgTexture}
  onChange={e => save({ bgTexture: e.target.value })}
>
  <option value="none">None</option>
  <option value="diagonal">Diagonal</option>
  <option value="dots">Soft Dots</option>
  <option value="grid">Grid</option>
  <option value="linen">Linen</option>
  <option value="plaid">Plaid</option>
</select>


</label>


              <label className="field" style={{ minWidth: 200 }}>
                <span>Page Width</span>
                <select
                  value={prefs.siteWidth}
                  onChange={e => save({ siteWidth: e.target.value })}
                >
                  {WIDTHS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </label>

              <label className="field" style={{ minWidth: 180 }}>
                <span>UI Density</span>
                <select
                  value={prefs.cardDensity}
                  onChange={e => save({ cardDensity: e.target.value })}
                >
                  <option value="cozy">Cozy</option>
                  <option value="snug">Snug</option>
                </select>
              </label>

              <label className="field" style={{ minWidth: 160 }}>
                <span>Motion</span>
                <select
                  value={prefs.motion}
                  onChange={e => save({ motion: e.target.value })}
                >
                  {MOTION.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>

              <label className="pill" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.compactUI}
                  onChange={e => save({ compactUI: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Compact mode
              </label>
            </div>
          </fieldset>

          {/* Navigation & Layout */}
          <fieldset className="fav-card" style={{ background: '#fff' }}>
            <legend><strong>Navigation & Layout</strong></legend>

            {/* Removed: Default landing page + Tabs visibility */}
            <div>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Tabs order</span>
              <div style={{ display: 'grid', gap: 8 }}>
                {prefs.navOrder.map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ minWidth: 120 }}>{k}</code>
                    <button className="pill" onClick={() => moveNav(k, 'up')}>↑</button>
                    <button className="pill" onClick={() => moveNav(k, 'down')}>↓</button>
                  </div>
                ))}
              </div>
              <small style={{ opacity:.7, display:'block', marginTop:8 }}>
                The first tab becomes your default landing page.
              </small>
            </div>
          </fieldset>

          {/* Daily Card (non-journal) */}
          <fieldset className="fav-card" style={{ background: '#fff' }}>
            <legend><strong>Daily Card</strong></legend>
            <div className="row" style={{ gap: 16, alignItems: 'center' }}>
              <label className="field" style={{ minWidth: 220 }}>
                <span>Order</span>
                <select
                  value={prefs.cardOrder}
                  onChange={e => save({ cardOrder: e.target.value })}
                >
                  <option value="affirmation-first">Affirmation then Challenge</option>
                  <option value="challenge-first">Challenge then Affirmation</option>
                </select>
              </label>

              <label className="pill" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.showCategoryChip}
                  onChange={e => save({ showCategoryChip: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Show category chip
              </label>

              <label className="pill" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.confirmRegenerate}
                  onChange={e => save({ confirmRegenerate: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Confirm before regenerate
              </label>

              {/* Removed: Heart style control; we use emoji by default */}
            </div>
          </fieldset>

          {/* Past Entries */}
          <fieldset className="fav-card" style={{ background: '#fff' }}>
            <legend><strong>Past Entries</strong></legend>
            <div className="row" style={{ gap: 16, alignItems: 'center' }}>
              <label className="field" style={{ minWidth: 240 }}>
                <span>Date format</span>
                <select
                  value={prefs.dateFormat}
                  onChange={e => save({ dateFormat: e.target.value })}
                >
                  {DATE_FORMATS.map(df => <option key={df.id} value={df.id}>{df.sample}</option>)}
                </select>
              </label>

              <label className="field" style={{ minWidth: 180 }}>
                <span>Week starts on</span>
                <select
                  value={prefs.weekStart}
                  onChange={e => save({ weekStart: Number(e.target.value) })}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </select>
              </label>

              <label className="field" style={{ minWidth: 220 }}>
                <span>Default range</span>
                <select
                  value={prefs.pastDefaultRange}
                  onChange={e => save({ pastDefaultRange: e.target.value })}
                >
                  <option value="all">All time</option>
                  <option value="30d">Last 30 days</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </label>
            </div>
          </fieldset>

          {/* Locale, Time & Feedback */}
          <fieldset className="fav-card" style={{ background: '#fff' }}>
            <legend><strong>Locale, Time & Feedback</strong></legend>
            <div className="row" style={{ gap: 16, alignItems: 'center' }}>
              <label className="field" style={{ minWidth: 260 }}>
                <span>Time zone</span>
                <select
                  value={prefs.timeZone}
                  onChange={e => save({ timeZone: e.target.value })}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </label>

              <label className="field" style={{ minWidth: 200 }}>
                <span>Undo duration</span>
                <select
                  value={String(prefs.undoMs)}
                  onChange={e => save({ undoMs: Number(e.target.value) })}
                >
                  <option value="4000">4 seconds</option>
                  <option value="7000">7 seconds</option>
                  <option value="10000">10 seconds</option>
                </select>
              </label>

              
            </div>
          </fieldset>

          <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
            <small style={{ opacity: .7 }}>
              Dear Self • Settings save locally on this device.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}

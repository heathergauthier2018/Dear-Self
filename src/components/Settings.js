// src/components/Settings.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/theme.css";
import "../styles/Settings.css";
import {
  applyPrefsToDOM,
  DEFAULT_PREFS,
  loadPrefs,
  resetPrefs,
  savePrefs,
} from "../utils/prefs";

const THEMES = [
  { id: "blush", label: "Blush", colors: ["#f0c9d1", "#ce6b80"] },
  { id: "sage", label: "Sage", colors: ["#a4c3b4", "#5c947a"] },
  { id: "midnight", label: "Midnight", colors: ["#657ab8", "#1f3a77"] },
];

const HEADER_FONTS = [
  ["merriweather", "Merriweather"],
  ["playfair", "Playfair Display"],
  ["lora", "Lora"],
  ["cormorant", "Cormorant Garamond"],
  ["cinzel", "Cinzel"],
  ["librebask", "Libre Baskerville"],
  ["crimson", "Crimson Pro"],
  ["inter", "Inter"],
  ["montserrat", "Montserrat"],
  ["poppins", "Poppins"],
  ["raleway", "Raleway"],
  ["josefin", "Josefin Sans"],
  ["quicksand", "Quicksand"],
  ["nunito", "Nunito"],
  ["bebas", "Bebas Neue"],
  ["abril", "Abril Fatface"],
  ["greatvibes", "Great Vibes"],
  ["sacramento", "Sacramento"],
].map(([id, label]) => ({ id, label }));

const BACKDROPS = [
  { id: "warm-ivory", label: "Warm Ivory", color: "#FAF9F6" },
  { id: "blush-mist", label: "Blush Mist", color: "#FBF2F3" },
  { id: "sage-wash", label: "Sage Wash", color: "#F1F6F1" },
  { id: "moonlit-blue", label: "Moonlit Blue", color: "#F0F3FA" },
  { id: "soft-lavender", label: "Soft Lavender", color: "#F5F1F8" },
];

const TEXTURES = [
  { id: "none", label: "Smooth" },
  { id: "linen", label: "Fine Linen" },
  { id: "paper", label: "Handmade Paper" },
  { id: "grid", label: "Graph Paper" },
  { id: "dots", label: "Dot Grid" },
  { id: "plaid", label: "Soft Plaid" },
];
const NAV_META = {
  today: { label: "Today", mark: "01" },
  past: { label: "Past Entries", mark: "02" },
  favorites: { label: "Favorites", mark: "03" },
  settings: { label: "Settings", mark: "04" },
};

const DEAR_SELF_PREFIX = "dearself.";

export default function Settings() {
  const initial = useMemo(() => loadPrefs(), []);
  const [prefs, setPrefs] = useState(initial);
  const [notice, setNotice] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    applyPrefsToDOM(prefs);
  }, []);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const announce = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2200);
  };

  const broadcast = () => window.dispatchEvent(new Event("dearself:prefs"));

  const save = (patch) => {
    const next = savePrefs(patch);
    setPrefs(next);
    applyPrefsToDOM(next);
    broadcast();
    announce("Preferences saved");
  };

  const moveNav = (key, direction) => {
    const next = [...prefs.navOrder];
    const from = next.indexOf(key);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    save({ navOrder: next });
  };

  const exportBackup = () => {
    const data = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(DEAR_SELF_PREFIX))
        data[key] = localStorage.getItem(key);
    }
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), data },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dear-self-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    announce("Journal backup created");
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.data || typeof parsed.data !== "object") throw new Error();
      Object.entries(parsed.data).forEach(([key, value]) => {
        if (key.startsWith(DEAR_SELF_PREFIX) && typeof value === "string")
          localStorage.setItem(key, value);
      });
      const next = loadPrefs();
      setPrefs(next);
      applyPrefsToDOM(next);
      broadcast();
      announce("Backup restored");
    } catch {
      announce("That backup could not be restored");
    } finally {
      event.target.value = "";
    }
  };

  const restoreAppearance = () => {
    const next = savePrefs({
      brandTheme: DEFAULT_PREFS.brandTheme,
      headerFont: DEFAULT_PREFS.headerFont,
      siteBg: DEFAULT_PREFS.siteBg,
      bgTexture: DEFAULT_PREFS.bgTexture,
      textureTone: DEFAULT_PREFS.textureTone,
      textureStrength: DEFAULT_PREFS.textureStrength,
      siteWidth: DEFAULT_PREFS.siteWidth,
      cardDensity: DEFAULT_PREFS.cardDensity,
      compactUI: DEFAULT_PREFS.compactUI,
      motion: DEFAULT_PREFS.motion,
    });
    setPrefs(next);
    applyPrefsToDOM(next);
    broadcast();
    announce("Appearance restored");
  };

  const clearAllData = () => {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(DEAR_SELF_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    const next = resetPrefs();
    setPrefs(next);
    applyPrefsToDOM(next);
    broadcast();
    setConfirmClear(false);
    announce("Journal data cleared");
  };

  return (
    <main className="page-wrap settings-page">
      <section className="settings-shell">
        <header className="settings-header">
          <span>Make it feel like mine</span>
          <h1 className="page-title">Settings</h1>
          <p>A few thoughtful details, chosen by you.</p>
        </header>

        <section
          className="settings-preview"
          aria-label="Current appearance preview"
        >
          <div
            className="settings-preview__paper"
            data-preview-texture={prefs.bgTexture}
            data-texture-tone={prefs.textureTone}
            data-texture-strength={prefs.textureStrength}
            style={{ backgroundColor: prefs.siteBg }}
          >
            <span className="page-title">Dear Self</span>
            <strong>Little by little, day by day.</strong>
            <div>
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="settings-preview__copy">
            <span>Live preview</span>
            <h2>Your journal, your way</h2>
            <p>Theme, type, and texture update as you choose them.</p>
            <small>Changes save automatically on this device.</small>
          </div>
        </section>

        <section className="settings-section">
          <header>
            <span>01</span>
            <div>
              <h2>Appearance</h2>
              <p>
                Choose the colors and details that make the journal feel
                personal.
              </p>
            </div>
          </header>
          <div className="settings-theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={prefs.brandTheme === theme.id ? "active" : ""}
                onClick={() => save({ brandTheme: theme.id })}
                aria-pressed={prefs.brandTheme === theme.id}
              >
                <span
                  style={{
                    "--swatch-one": theme.colors[0],
                    "--swatch-two": theme.colors[1],
                  }}
                />
                <strong>{theme.label}</strong>
              </button>
            ))}
          </div>
          <div className="settings-fields settings-fields--appearance">
            <label>
              <span>Heading font</span>
              <select
                value={prefs.headerFont}
                onChange={(event) => save({ headerFont: event.target.value })}
              >
                {HEADER_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="settings-color">
              <span>Custom backdrop color</span>
              <div>
                <input
                  type="color"
                  value={prefs.siteBg}
                  onChange={(event) => save({ siteBg: event.target.value })}
                />
                <code>{prefs.siteBg.toUpperCase()}</code>
              </div>
            </label>
          </div>

          <div className="settings-backdrops" aria-label="Backdrop color">
            <span>Journal backdrop</span>
            <div>
              {BACKDROPS.map((backdrop) => (
                <button
                  key={backdrop.id}
                  type="button"
                  className={
                    prefs.siteBg.toLowerCase() === backdrop.color.toLowerCase()
                      ? "active"
                      : ""
                  }
                  onClick={() => save({ siteBg: backdrop.color })}
                  aria-pressed={
                    prefs.siteBg.toLowerCase() === backdrop.color.toLowerCase()
                  }
                >
                  <i style={{ "--backdrop-color": backdrop.color }} />
                  {backdrop.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-textures" aria-label="Background texture">
            <span>Backdrop texture</span>
            <div>
              {TEXTURES.map((texture) => (
                <button
                  key={texture.id}
                  type="button"
                  data-texture={texture.id}
                  className={prefs.bgTexture === texture.id ? "active" : ""}
                  onClick={() => save({ bgTexture: texture.id })}
                  aria-pressed={prefs.bgTexture === texture.id}
                >
                  <i style={{ "--swatch-bg": prefs.siteBg }} />
                  {texture.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-texture-details">
            <fieldset>
              <legend>Texture tone</legend>
              <button
                type="button"
                className={prefs.textureTone === "neutral" ? "active" : ""}
                onClick={() => save({ textureTone: "neutral" })}
              >
                Neutral
              </button>
              <button
                type="button"
                className={prefs.textureTone === "theme" ? "active" : ""}
                onClick={() => save({ textureTone: "theme" })}
              >
                Theme-tinted
              </button>
            </fieldset>
            <fieldset>
              <legend>Texture strength</legend>
              <button
                type="button"
                className={prefs.textureStrength === "whisper" ? "active" : ""}
                onClick={() => save({ textureStrength: "whisper" })}
              >
                Whisper
              </button>
              <button
                type="button"
                className={prefs.textureStrength === "visible" ? "active" : ""}
                onClick={() => save({ textureStrength: "visible" })}
              >
                Visible
              </button>
            </fieldset>
          </div>
        </section>

        <section className="settings-section">
          <header>
            <span>02</span>
            <div>
              <h2>Navigation</h2>
              <p>Arrange your journal and choose where it opens.</p>
            </div>
          </header>
          <div className="settings-navigation">
            <div className="settings-nav-list">
              {prefs.navOrder.map((key, index) => (
                <div className="settings-nav-row" key={key}>
                  <span className="settings-nav-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>{NAV_META[key].label}</strong>
                  <div>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveNav(key, "up")}
                      aria-label={`Move ${NAV_META[key].label} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === prefs.navOrder.length - 1}
                      onClick={() => moveNav(key, "down")}
                      aria-label={`Move ${NAV_META[key].label} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <label className="settings-opening">
              <span>Open Dear Self on</span>
              <select
                value={prefs.landingPage}
                onChange={(event) => save({ landingPage: event.target.value })}
              >
                {prefs.navOrder.map((key) => (
                  <option key={key} value={key}>
                    {NAV_META[key].label}
                  </option>
                ))}
              </select>
              <small>This does not change the tab order.</small>
            </label>
          </div>
        </section>

        <section className="settings-section settings-section--data">
          <header>
            <span>03</span>
            <div>
              <h2>Your Data</h2>
              <p>Protect your private journal or begin again.</p>
            </div>
          </header>
          <div className="settings-data-actions">
            <button type="button" onClick={exportBackup}>
              <strong>Export journal backup</strong>
              <span>Downloads a private Dear Self JSON backup.</span>
            </button>
            <button type="button" onClick={() => importRef.current?.click()}>
              <strong>Import journal backup</strong>
              <span>Restores from a Dear Self JSON backup.</span>
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              onChange={importBackup}
              hidden
            />
            <button type="button" onClick={restoreAppearance}>
              <strong>Reset appearance</strong>
              <span>Restore the original visual preferences only.</span>
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => setConfirmClear(true)}
            >
              <strong>Clear all journal data</strong>
              <span>Permanently remove everything stored by Dear Self.</span>
            </button>
          </div>
        </section>

        <footer className="settings-footer">
          Dear Self · Your journal stays locally on this device.
        </footer>
      </section>

      {notice && (
        <div className="settings-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          {notice}
        </div>
      )}
      {confirmClear && (
        <div
          className="settings-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-title"
        >
          <div>
            <span>One last pause</span>
            <h2 id="clear-title">Clear your entire journal?</h2>
            <p>
              This permanently removes entries, favorites, your signature, and
              preferences. Export a backup first if you may want them later.
            </p>
            <footer>
              <button type="button" onClick={() => setConfirmClear(false)}>
                Keep my journal
              </button>
              <button type="button" className="danger" onClick={clearAllData}>
                Clear everything
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
// src/components/PastEntries.js
import React, { useEffect, useMemo, useState } from 'react';
import '../styles/theme.css';
import html2canvas from 'html2canvas';
import {
  listEntries,
  removeEntry,
  updateEntry, // merges by id
} from '../services/affirmationEngine';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const keyFromLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

const keyFromDateInput = (yyyy_mm_dd) => yyyy_mm_dd || '';

const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (d) =>
  d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

/* ------------------------------------------------------------------ */
/* Font list + Colors (mirror JournalEntry.js)                         */
/* ------------------------------------------------------------------ */
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

/* Safe text/date areas (match Today page geometry) */
const SAFE = {
  left: '7%',
  right: '7%',
  topDate: '5%',
  topText: 'calc(5% + 34px)',
  bottom: '8%',
};

/* Download & Trash icons */
const DownloadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3v10m0 0l-4-4m4 4l4-4M5 21h14a2 2 0 002-2v-3M3 16v3a2 2 0 002 2"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);
const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 6l.7-1.4A2 2 0 0 1 10.4 3h3.2a2 2 0 0 1 1.7.6L16 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="6" y="6" width="12" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 10v7M14 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* Raw restore (if ever needed) */
const RAW_ENTRIES_KEY = 'dearself.entries';
const restoreEntryRaw = (entry) => {
  try {
    const list = JSON.parse(localStorage.getItem(RAW_ENTRIES_KEY) || '[]');
    const i = list.findIndex((x) => x.id === entry.id);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    localStorage.setItem(RAW_ENTRIES_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------ */
/* Pagination helpers                                                  */
/* ------------------------------------------------------------------ */
const PAGE_SIZE_KEY = 'pastEntries.pageSize';
const PAGE_SIZE_OPTIONS = [12, 24, 50, 75, 100];

/** Compact, windowed numeric pager */
function Pager({ page, setPage, totalPages, totalItems, pageSize, setPageSize }) {
  if (totalPages <= 1) return null;

  const go = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const btn = {
    minWidth: 34, height: 34, borderRadius: 8,
    border: '1px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', fontWeight: 700, padding: '0 8px'
  };
  const btnDisabled = { opacity: .45, cursor: 'default' };
  const active = { background: '#eaf3ec', borderColor: '#cfe5d8' };

  return (
    <nav style={{
      maxWidth: 1050, margin: '16px auto 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ ...btn }} disabled={page === 1} onClick={() => go(1)} aria-label="First">{'«'}</button>
        <button style={{ ...btn, ...(page === 1 ? btnDisabled : {}) }} disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous">{'‹'}</button>

        {start > 1 && (
          <>
            <button style={btn} onClick={() => go(1)}>1</button>
            <span style={{ padding: '0 4px', color: '#888' }}>…</span>
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            style={{ ...btn, ...(p === page ? active : {}) }}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            <span style={{ padding: '0 4px', color: '#888' }}>…</span>
            <button style={btn} onClick={() => go(totalPages)}>{totalPages}</button>
          </>
        )}

        <button style={{ ...btn, ...(page === totalPages ? btnDisabled : {}) }} disabled={page === totalPages} onClick={() => go(page + 1)} aria-label="Next">{'›'}</button>
        <button style={{ ...btn }} disabled={page === totalPages} onClick={() => go(totalPages)} aria-label="Last">{'»'}</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#6b7280' }}>
          {totalItems.toLocaleString()} entries • page {page} of {totalPages}
        </span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            style={{ height: 36, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 10px', background: '#fff' }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function PastEntries() {
  // Pagination / filters / view
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState('Newest');
  const [themeFilter, setThemeFilter] = useState('all');
  const [items, setItems] = useState(() => listEntries());
  const [view, setView] = useState('grid'); // grid | list

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 12; // default 12
  });
  const setPageSize = (n) => {
    setPageSizeState(n);
    localStorage.setItem(PAGE_SIZE_KEY, String(n));
    setPage(1);
  };

  // Snackbar for delete message
  const [undo, setUndo] = useState(null); // { entry, timeout }
  // Optimistic delete in-flight
  const [pendingDelete, setPendingDelete] = useState(null); // { id, entry, timeoutId }

  // Viewer / Editor
  const [viewer, setViewer] = useState(null);   // entry
  const [editing, setEditing] = useState(null); // { ...entry, _work:{fontFamily,fontColor,keepColor}, _text }

  // keep in sync if another tab changes
  useEffect(() => {
    const onStorage = () => setItems(listEntries());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Whenever view or sort changes, reset to page 1
  useEffect(() => { setPage(1); }, [view, sort]);

  /* --------- Filter/Sort --------- */
  const filtered = useMemo(() => {
    let list = [...items];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => String(e.content || '').toLowerCase().includes(q));
    }

    if (themeFilter !== 'all') {
      list = list.filter((e) => (e.style?.themeKey || '').startsWith(themeFilter));
    }

    if (date) {
      const wantedKey = keyFromDateInput(date);
      list = list.filter((e) => keyFromLocalDate(new Date(e.iso)) === wantedKey);
    }

    switch (sort) {
      case 'Oldest':
        list.sort((a, b) => +new Date(a.iso) - +new Date(b.iso));
        break;
      case 'ThemeAZ':
        list.sort(
          (a, b) =>
            (a.style?.themeKey || '').localeCompare(b.style?.themeKey || '') ||
            +new Date(b.iso) - +new Date(a.iso)
        );
        break;
      case 'ThemeZA':
        list.sort(
          (a, b) =>
            (b.style?.themeKey || '').localeCompare(a.style?.themeKey || '') ||
            +new Date(b.iso) - +new Date(a.iso)
        );
        break;
      default:
        list.sort((a, b) => +new Date(b.iso) - +new Date(a.iso));
    }
    return list;
  }, [items, query, themeFilter, date, sort]);

  // Hide any card that's pending deletion (optimistic)
  const visible = pendingDelete
    ? filtered.filter((e) => e.id !== pendingDelete.id)
    : filtered;

  // ---- Real pagination slice (numeric pages) ----
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageSlice = visible.slice(startIdx, startIdx + pageSize);

  const grouped = useMemo(() => {
    const map = new Map();
    pageSlice.forEach((e) => {
      const d = new Date(e.iso);
      const mk = monthKey(d);
      if (!map.has(mk)) map.set(mk, { label: monthLabel(d), entries: [] });
      map.get(mk).entries.push(e);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([, v]) => v);
  }, [pageSlice]);

  /* --------- Delete / Undo (Optimistic) --------- */
  const onDelete = (id) => {
    // If another delete is pending, commit it first (avoid overlap)
    if (pendingDelete?.timeoutId) {
      clearTimeout(pendingDelete.timeoutId);
      removeEntry(pendingDelete.id);
      setPendingDelete(null);
    }

    const entry = items.find((i) => i.id === id);
    if (!entry) return;

    // start optimistic flow: hide now; commit after prefs.undoMs (default 4000)
    const undoMs = Number(JSON.parse(localStorage.getItem('dearself.prefs') || '{}')?.undoMs ?? 4000);
    const timeoutId = setTimeout(() => {
      removeEntry(id);
      setItems(listEntries());
      setPendingDelete(null);
      setUndo(null);
    }, undoMs);

    setPendingDelete({ id, entry, timeoutId });

    if (undo?.timeout) clearTimeout(undo.timeout);
    const uiTimeout = setTimeout(() => setUndo(null), undoMs);
    setUndo({ entry, timeout: uiTimeout });
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.timeoutId) clearTimeout(pendingDelete.timeoutId);
    if (undo?.timeout) clearTimeout(undo.timeout);
    setPendingDelete(null);
    setUndo(null);
  };

  /* --------- Viewer / Editor --------- */
  const openViewer = (e) => setViewer(e);
  const closeViewer = () => setViewer(null);

  const openEditor = (e) => {
    const s = e.style || {};
    setEditing({
      ...e,
      _text: String(e.content || ''),
      _work: {
        fontFamily: s.fontFamily || 'Inter',
        fontColor: s.fontColor ?? '#2B2B2B',
        keepColor: true,
      },
    });
  };
  const closeEditor = () => setEditing(null);

  // Save: when changing font color, also set dateColor (the requested fix)
  const saveEditor = () => {
    if (!editing) return;
    const chosen = editing._work.keepColor ? '__KEEP__' : editing._work.fontColor;
    const nextFontColor =
      chosen === '__KEEP__' ? (editing.style?.fontColor || '#2B2B2B') : chosen;

    const patch = {
      content: editing._text,
      style: {
        ...(editing.style || {}),
        fontFamily: editing._work.fontFamily,
        fontColor: nextFontColor,
        dateColor:
          chosen === '__KEEP__'
            ? (editing.style?.dateColor ?? editing.style?.fontColor ?? '#2B2B2B')
            : chosen, // keep date in sync with selected font color
      },
    };
    updateEntry(editing.id, patch);
    setItems(listEntries());
    setEditing(null);
  };

  /* --------- Composite Download (html2canvas) --------- */
  const makeCompositeNode = (e) => {
    const s = e.style || {};
    const node = document.createElement('div');
    node.style.position = 'fixed';
    node.style.left = '-10000px';
    node.style.top = '0';
    node.style.width = '1024px';
    node.style.height = '1536px'; // 2:3
    node.style.borderRadius = '12px';
    node.style.overflow = 'hidden';
    node.style.background = '#f7f3eb';

    node.innerHTML = `
      <div style="position:relative;width:100%;height:100%;">
        ${
          s.imageSrc
            ? `<img src="${s.imageSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;border-radius:12px;"/>`
            : ''
        }
        <div style="
          position:absolute;left:${SAFE.left};right:${SAFE.right};top:${SAFE.topDate};
          font-family:${s.fontFamily || 'Inter'};
          color:${s.dateColor || s.fontColor || '#2B2B2B'};
          font-weight:700;font-size:42px;line-height:1.25;text-align:right;">
          ${new Date(e.iso).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <div style="
          position:absolute;left:${SAFE.left};right:${SAFE.right};top:${SAFE.topText};bottom:${SAFE.bottom};
          font-family:${s.fontFamily || 'Inter'};
          color:${s.fontColor || '#2B2B2B'};
          font-weight:${s.bold ? 700 : 400};
          font-style:${s.italic ? 'italic' : 'normal'};
          font-size:${Number(s.fontSize) || 20}px;
          line-height:1.6;white-space:pre-wrap;overflow:auto;overflow-wrap:anywhere;word-break:break-word;">
          ${String(e.content || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;
    document.body.appendChild(node);
    return node;
  };

  const downloadPNG = async (e) => {
    const node = makeCompositeNode(e);
    try {
      const canvas = await html2canvas(node, { backgroundColor: null, useCORS: true, scale: 1 });
      const link = document.createElement('a');
      link.download = 'journal-page.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      node.remove();
    }
  };

  /* --------- Card Preview --------- */
  const CardPreview = ({ e, compact }) => {
    const s = e.style || {};
    const d = new Date(e.iso);
    const fam = s.fontFamily || 'Inter';
    const color = s.fontColor || '#2B2B2B';
    const dateColor = s.dateColor || color;
    const firstLine = String(e.content ?? 'Dear Self').split('\n')[0];

    return (
      <div className={`pe-card ${compact ? 'compact' : ''}`}>
        <div
          className={`pe-frame ${compact ? 'banner' : 'thumb'}`}
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => openViewer(e)}
          title="Open"
        >
          {/* strict 2:3 canvas with background-image to keep borders even */}
          <div
            className="pe-thumbCanvas"
            style={{
              backgroundImage: s.imageSrc ? `url("${s.imageSrc}")` : 'none',
            }}
          />
          {/* Date (top-right) */}
          <div
            className="pe-date--thumb"
            style={{
              fontFamily: fam,
              color: dateColor,
            }}
          >
            {d.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {/* First line (below, left) */}
          <div
            className="pe-snippet--thumb"
            style={{
              fontFamily: fam,
              color,
              fontWeight: s.bold ? 700 : 600,
              fontStyle: s.italic ? 'italic' : 'normal',
            }}
          >
            {firstLine}
          </div>
        </div>

        {/* Actions: Copy • Edit • Download • Trash */}
        <div className="pe-actions">
          <button
            className="link-button pe-copy"
            onClick={() => navigator.clipboard.writeText(String(e.content || ''))}
          >
            Copy
          </button>
          <button className="link-button pe-edit" onClick={() => openEditor(e)}>
            Edit
          </button>
          <button
            className="icon-button pe-download"
            onClick={() => downloadPNG(e)}
            title="Download"
            aria-label="Download"
          >
            <DownloadIcon />
          </button>
          <button
            className="icon-only pe-delete"
            onClick={() => onDelete(e.id)}
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-wrap">
      <section className="card shadow-md" style={{ background: '#FFF9F1' }}>
        <h1 className="brand-subtitle page-title" style={{ textAlign: 'center', marginTop: 0 }}>
          Past Entries
        </h1>
        <div style={{ textAlign: 'center', marginTop: -8, color: '#a98b94' }}>Little by little, day by day.</div>

        {/* Controls */}
        <div className="row gap" style={{ margin: '12px 0 10px', alignItems: 'center' }}>
          <input
            placeholder="Search entries..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            style={{ height: 40, flex: '1 1 260px', padding: '0 12px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ height: 40, minWidth: 160, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          >
            <option value="Newest">Newest first</option>
            <option value="Oldest">Oldest first</option>
            <option value="ThemeAZ">Theme (A→Z)</option>
            <option value="ThemeZA">Theme (Z→A)</option>
          </select>

          <select
            value={themeFilter}
            onChange={(e) => {
              setThemeFilter(e.target.value);
              setPage(1);
            }}
            style={{ height: 40, minWidth: 140, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          >
            <option value="all">All themes</option>
            <option value="coquette">Coquette</option>
            <option value="florals">Florals</option>
            <option value="minimal">Minimal</option>
            <option value="nature">Nature</option>
            <option value="night">Night</option>
            <option value="romantic">Romantic</option>
            <option value="seasonal">Seasonal</option>
            <option value="whimsical">Whimsical</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            style={{ height: 40, width: 160, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          />

          <button
            type="button"
            onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
            className="pill"
            style={{ marginLeft: 'auto' }}
          >
            {view === 'grid' ? 'List View' : 'Grid View'}
          </button>

          {/* Per-page selector (top-right) */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              style={{ height: 36, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 10px', background: '#fff' }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="empty-cta empty-cta--tricolor">
            <h3 className="empty-cta__title">No entries yet</h3>
            <p className="empty-cta__line">
              Your journal is waiting. Little by little starts today—reflect on your challenge,
              your feelings, or what your heart is ready to say.
            </p>
            <a className="empty-cta__btn empty-cta__btn--tri empty-cta__plain" href="/">✍️ Head to Today</a>
          </div>
        )}

        {/* Grouped months for THIS PAGE ONLY */}
        {grouped.map((group) => (
          <div key={group.label}>
            <h2 className="pe-month" data-themed="1">{group.label}</h2>
            <div className={view === 'grid' ? 'pe-grid' : 'pe-list'}>
              {group.entries.map((e) => (
                <CardPreview key={e.id} e={e} compact={view === 'list'} />
              ))}
            </div>
          </div>
        ))}

        {/* Bottom pager */}
        <Pager
          page={safePage}
          setPage={setPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </section>

      {/* Undo snackbar */}
      {undo && (
        <div className="undo-bar" role="status" aria-live="polite">
          <span>Deleted.</span>
          <button className="undo-btn" onClick={undoDelete}>Undo</button>
        </div>
      )}

      {/* VIEWER modal */}
      {viewer && (
        <div className="pe-modal" role="dialog" aria-modal="true" onClick={closeViewer}>
          <div className="pe-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="pe-modal__top" style={{ justifyContent: 'flex-end' }}>
              <button className="pill" onClick={closeViewer}>Close</button>
            </div>
            <div className="pe-modal__canvasWrap">
              <div className="pe-modal__canvas" style={{ position: 'relative' }}>
                {viewer.style?.imageSrc ? <img src={viewer.style.imageSrc} alt="" /> : <div className="pe-img pe-img--blank" />}

                {/* Date */}
                <div
                  style={{
                    position: 'absolute',
                    left: SAFE.left, right: SAFE.right, top: '5%',
                    color: viewer.style?.dateColor || viewer.style?.fontColor || '#2B2B2B',
                    fontFamily: viewer.style?.fontFamily || 'Inter',
                    fontWeight: 700, fontSize: 22, lineHeight: 1.25,
                    textAlign: 'right',
                  }}
                >
                  {new Date(viewer.iso).toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>

                {/* Body */}
                <div
                  style={{
                    position: 'absolute',
                    left: SAFE.left, right: SAFE.right, top: 'calc(5% + 34px)', bottom: SAFE.bottom,
                    overflow: 'auto', overflowWrap: 'anywhere', wordBreak: 'break-word', boxSizing: 'border-box',
                    color: viewer.style?.fontColor || '#2B2B2B',
                    fontFamily: viewer.style?.fontFamily || 'Inter',
                    fontWeight: viewer.style?.bold ? 700 : 400,
                    fontStyle: viewer.style?.italic ? 'italic' : 'normal',
                    fontSize: (Number(viewer.style?.fontSize) || 18) + 'px',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left',
                  }}
                >
                  {String(viewer.content || '')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR modal */}
      {editing && (
        <div className="pe-modal" role="dialog" aria-modal="true" onClick={closeEditor}>
          <div className="pe-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="pe-modal__top" style={{ gap: 10 }}>
              {/* Font family */}
              <select
                value={editing._work.fontFamily}
                onChange={(e) =>
                  setEditing((ed) => ({ ...ed, _work: { ...ed._work, fontFamily: e.target.value } }))
                }
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Keep color toggle */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={editing._work.keepColor}
                  onChange={(e) =>
                    setEditing((ed) => ({ ...ed, _work: { ...ed._work, keepColor: e.target.checked } }))
                  }
                />
                Keep current color
              </label>

              {/* Compact horizontal color picker when NOT keeping color */}
              {!editing._work.keepColor && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>Font Color</span>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      gap: 6,
                      maxWidth: 'min(560px, 48vw)',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      padding: '6px 8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                    }}
                  >
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`swatch ${editing._work.fontColor === c ? 'selected' : ''}`}
                        onClick={() => setEditing((ed) => ({ ...ed, _work: { ...ed._work, fontColor: c } }))}
                        style={{ background: c, width: 24, height: 24, flex: '0 0 auto' }}
                        aria-label={`Select color ${c}`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="pill" onClick={closeEditor}>Cancel</button>
                <button className="primary" onClick={saveEditor}>Save</button>
              </div>
            </div>

            <div className="pe-modal__canvasWrap">
              <div className="pe-modal__canvas" style={{ position: 'relative' }}>
                {editing.style?.imageSrc ? <img src={editing.style.imageSrc} alt="" /> : <div className="pe-img pe-img--blank" />}

                {/* LIVE date preview uses the same color as the body when keepColor=false */}
                <div
                  style={{
                    position: 'absolute',
                    left: SAFE.left, right: SAFE.right, top: '5%',
                    color: editing._work.keepColor
                      ? (editing.style?.dateColor || editing.style?.fontColor || '#2B2B2B')
                      : editing._work.fontColor,
                    fontFamily: editing._work.fontFamily,
                    fontWeight: 700, fontSize: 22, lineHeight: 1.25, textAlign: 'right',
                  }}
                >
                  {new Date(editing.iso).toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>

                {/* Editable body */}
                <textarea
                  className="pe-editor-textarea pe-body--full"
                  value={editing._text}
                  onChange={(e) => setEditing((ed) => ({ ...ed, _text: e.target.value }))}
                  placeholder="Write to yourself…"
                  style={{
                    position: 'absolute',
                    left: SAFE.left, right: SAFE.right, top: SAFE.topText, bottom: SAFE.bottom,
                    resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                    overflow: 'auto', overflowWrap: 'anywhere', wordBreak: 'break-word', boxSizing: 'border-box',
                    fontFamily: editing._work.fontFamily,
                    color: editing._work.keepColor
                      ? (editing.style?.fontColor || '#2B2B2B')
                      : editing._work.fontColor,
                    fontWeight: editing.style?.bold ? 700 : 400,
                    fontStyle: editing.style?.italic ? 'italic' : 'normal',
                    fontSize: (Number(editing.style?.fontSize) || 18) + 'px',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/Favorites.js
import React, { useEffect, useMemo, useState } from 'react';
import '../styles/theme.css';
import {
  listFavoriteItems,
  removeFavorite,
  toggleFavorite,
} from '../services/affirmationEngine';

/* ---------------- Icons (match PastEntries) ---------------- */
const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 6l.7-1.4A2 2 0 0 1 10.4 3h3.2a2 2 0 0 1 1.7.6L16 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="6" y="6" width="12" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 10v7M14 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ---------------- Pagination helpers ---------------- */
const PAGE_SIZE_KEY = 'favorites.pageSize';
const PAGE_SIZE_OPTIONS = [12, 24, 50, 75, 100];

function Pager({ page, setPage, totalPages, totalItems, pageSize, setPageSize }) {
  if (totalPages <= 1) return null;

  const go = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const nums = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const btn = {
    minWidth: 34, height: 34, borderRadius: 8,
    border: '1px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', fontWeight: 700, padding: '0 8px'
  };
  const disabled = { opacity: .45, cursor: 'default' };
  const active = { background: '#eaf3ec', borderColor: '#cfe5d8' };

  return (
    <nav style={{
      maxWidth: 1050, margin: '16px auto 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={btn} disabled={page === 1} onClick={() => go(1)} aria-label="First">{'«'}</button>
        <button style={{ ...btn, ...(page === 1 ? disabled : {}) }} disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous">{'‹'}</button>

        {start > 1 && (
          <>
            <button style={btn} onClick={() => go(1)}>1</button>
            <span style={{ padding: '0 4px', color: '#888' }}>…</span>
          </>
        )}
        {nums.map((n) => (
          <button
            key={n}
            style={{ ...btn, ...(n === page ? active : {}) }}
            onClick={() => go(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        {end < totalPages && (
          <>
            <span style={{ padding: '0 4px', color: '#888' }}>…</span>
            <button style={btn} onClick={() => go(totalPages)}>{totalPages}</button>
          </>
        )}

        <button style={{ ...btn, ...(page === totalPages ? disabled : {}) }} disabled={page === totalPages} onClick={() => go(page + 1)} aria-label="Next">{'›'}</button>
        <button style={btn} disabled={page === totalPages} onClick={() => go(totalPages)} aria-label="Last">{'»'}</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#6b7280' }}>
          {totalItems.toLocaleString()} favorites • page {page} of {totalPages}
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

/* ---------------- Fixed category list ---------------- */
const CATEGORIES = [
  'Growth',
  'Connection',
  'Positivity',
  'Confidence',
  'Mindfulness',
  'Self-Love',
  'Motivation',
  'Healing',
  'Intuition',
  'Peace',
  'Gratitude',
  'Reflection',
];

/* ---------------- Component ---------------- */
export default function Favorites() {
  const [items, setItems] = useState([]);

  // View toggle
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  // Filters / Sort
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState('Newest'); // 'Newest' | 'Oldest' | 'CategoryAZ' | 'CategoryZA'

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 12;
  });
  const setPageSize = (n) => {
    setPageSizeState(n);
    localStorage.setItem(PAGE_SIZE_KEY, String(n));
    setPage(1);
  };

  // Undo state
  const [undo, setUndo] = useState(null); // { item }
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    setItems(listFavoriteItems());
  }, []);

  const refresh = () => setItems(listFavoriteItems());

  // reset page when view/sort/filter changes
  useEffect(() => { setPage(1); }, [view, sort, categoryFilter, pageSize]);

  const tsOf = (it) => {
    const t = it.addedAt || it.iso || it.savedAt || it.timestamp;
    const n = +new Date(t || 0);
    return Number.isFinite(n) ? n : 0;
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (categoryFilter !== 'all') {
      list = list.filter(
        (it) => String(it.category || '').toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    switch (sort) {
      case 'Oldest':
        list.sort((a, b) => tsOf(a) - tsOf(b));
        break;
      case 'CategoryAZ':
        list.sort(
          (a, b) =>
            String(a.category || '').localeCompare(String(b.category || '')) ||
            tsOf(b) - tsOf(a)
        );
        break;
      case 'CategoryZA':
        list.sort(
          (a, b) =>
            String(b.category || '').localeCompare(String(a.category || '')) ||
            tsOf(b) - tsOf(a)
        );
        break;
      default: // Newest
        list.sort((a, b) => tsOf(b) - tsOf(a));
    }
    return list;
  }, [items, categoryFilter, sort]);

  // Pagination slice
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageSlice = filtered.slice(startIdx, startIdx + pageSize);

  // Remove (allows rapid consecutive removes)
  const onRemove = (item) => {
    if (timer) clearTimeout(timer);
    removeFavorite(item.id || item.text);
    refresh();
    setUndo({ item });
    const t = setTimeout(() => setUndo(null), 5000); // 5s to undo
    setTimer(t);
  };

  const onUndo = () => {
    if (!undo) return;
    if (timer) clearTimeout(timer);
    toggleFavorite(undo.item); // re-add
    refresh();
    setUndo(null);
  };

  return (
    <div className="page-wrap">
      {/* Local styles to fix pill width & pin trash bottom-right */}
      <style>{`
        .fav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .fav-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fav-card {
          position: relative; /* for absolute actions */
          background: #fff;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 14px 14px 38px; /* extra bottom padding so actions don't overlap */
        }
        .fav-card.compact {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px 16px;
        }
        .fav-lines {
          display: grid;
          gap: 6px;
        }
        .fav-actions-abs {
          position: absolute;
          right: 10px;
          bottom: 8px; /* always bottom-right */
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .fav-trash, .fav-trash:hover, .fav-trash:active, .fav-trash:focus {
          background: transparent !important;
          box-shadow: none !important;
          color: inherit !important;
          border: none !important;
          outline: none !important;
        }
        .fav-chip {
          display: inline-flex;      /* prevents stretch */
          width: max-content;        /* shrink-wrap pill */
          max-width: 100%;
          align-self: flex-start;
          background: var(--chip-bg, #e6f4ef);
          color: var(--chip-text, #0f5132);
          font-weight: 600;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 999px;
        }
      `}</style>

      <section className="card shadow-md" style={{ background: '#FFF9F1' }}>
        <h2 className="brand-subtitle page-title" style={{ marginTop: 0, textAlign: 'center' }}>
          Favorites
        </h2>

        {/* Controls */}
        <div className="row gap" style={{ margin: '12px 0 10px', alignItems: 'center' }}>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ height: 40, minWidth: 180, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            style={{ height: 40, minWidth: 180, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb' }}
          >
            <option value="Newest">Newest first</option>
            <option value="Oldest">Oldest first</option>
            <option value="CategoryAZ">Category (A→Z)</option>
            <option value="CategoryZA">Category (Z→A)</option>
          </select>

          {/* View toggle */}
          <button
            type="button"
            onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
            className="pill"
            style={{ marginLeft: 'auto' }}
          >
            {view === 'grid' ? 'List View' : 'Grid View'}
          </button>

          {/* Per-page (top-right) */}
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

        {filtered.length === 0 ? (
          <p style={{ padding: '8px 0 16px' }}>No favorites yet. Tap the heart on Today to save one.</p>
        ) : (
          <div className={view === 'grid' ? 'fav-grid' : 'fav-list'}>
            {pageSlice.map((it) => (
              <article
                key={it.id || it.text}
                className={`fav-card ${view === 'list' ? 'compact' : ''}`}
              >
                <div className="fav-lines">
                  {it.category ? <span className="fav-chip">{it.category}</span> : null}
                  <p className="fav-line" style={{ margin: 0 }}>
                    <strong>Affirmation:</strong> {it.text || '—'}
                  </p>
                  <p className="fav-line" style={{ margin: 0 }}>
                    <strong>Challenge:</strong> {it.challenge || '—'}
                  </p>
                </div>

                {/* Absolute bottom-right actions for BOTH views */}
                <div className="fav-actions-abs">
                  <button
                    className="icon-only fav-trash"
                    onClick={() => onRemove(it)}
                    title="Remove"
                    aria-label="Remove"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 6,
                      borderRadius: 8,
                      lineHeight: 0,
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

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
          <span>Favorite removed.</span>
          <button className="undo-btn" onClick={onUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}

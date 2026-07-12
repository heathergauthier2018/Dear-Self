// src/components/Favorites.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/theme.css";
import {
  listFavoriteItems,
  removeFavorite,
  toggleFavorite,
} from "../services/affirmationEngine";

const SORT_KEY = "favorites.sort";
const PAGE_SIZE_KEY = "favorites.pageSize";
const PAGE_SIZE_OPTIONS = [9, 18, 27];

const timestampOf = (item) => {
  const value =
    item.addedIso || item.addedAt || item.iso || item.savedAt || item.timestamp;
  const timestamp = Number(new Date(value || 0));
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const savedDate = (item) => {
  const timestamp = timestampOf(item);
  if (!timestamp) return "Saved for later";
  return `Saved ${new Date(timestamp).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
};

function Pager({ page, setPage, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="favorites-pager" aria-label="Favorite pages">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
      >
        ← Previous
      </button>
      <span>
        {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
      >
        Next →
      </button>
    </nav>
  );
}

export default function Favorites() {
  const publicPath = process.env.PUBLIC_URL || "";
  const [items, setItems] = useState(() => listFavoriteItems());
  const [query, setQuery] = useState("");
  const [sort, setSortState] = useState(
    () => localStorage.getItem(SORT_KEY) || "Newest",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 9;
  });
  const [pendingRemovals, setPendingRemovals] = useState([]);
  const [toast, setToast] = useState("");
  const undoTimer = useRef(null);
  const toastTimer = useRef(null);

  const refresh = () => setItems(listFavoriteItems());

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === "dearself.favorites") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(undoTimer.current);
      window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const setSort = (value) => {
    setSortState(value);
    localStorage.setItem(SORT_KEY, value);
    setPage(1);
  };

  const setPageSize = (value) => {
    setPageSizeState(value);
    localStorage.setItem(PAGE_SIZE_KEY, String(value));
    setPage(1);
  };

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = items.filter((item) => {
      if (!needle) return true;
      return [item.text, item.challenge, item.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    next.sort((a, b) =>
      sort === "Oldest"
        ? timestampOf(a) - timestampOf(b)
        : timestampOf(b) - timestampOf(a),
    );
    return next;
  }, [items, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const copyFavorite = async (item) => {
    const text = [
      item.text,
      item.challenge ? `A gentle challenge: ${item.challenge}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      showToast("Saved words copied");
    } catch {
      showToast("Couldn’t copy—please try again");
    }
  };

  const removeItem = (item) => {
    removeFavorite(item.id || item.text);
    refresh();
    setPendingRemovals((current) => [...current, item]);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setPendingRemovals([]), 5000);
  };

  const undoAll = () => {
    pendingRemovals.forEach((item) => toggleFavorite(item));
    window.clearTimeout(undoTimer.current);
    setPendingRemovals([]);
    refresh();
    showToast("Deletion undone");
  };

  const hasFavorites = items.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <main className="page-wrap favorites-page">
      <section className="favorites-shell">
        <header className="favorites-header">
          <span>Words I’m keeping</span>
          <h1 className="page-title">Favorites</h1>
          <p>Little reminders worth returning to.</p>
        </header>

        {hasFavorites && (
          <section className="favorites-toolbar" aria-label="Find saved words">
            <img
              className="favorites-toolbar__frame"
              src={`${publicPath}/images/past-entries-toolbar-frame.png`}
              alt=""
              aria-hidden="true"
            />
            <label className="favorites-search">
              <span>Search my saved words</span>
              <span className="favorites-search__field">
                <input
                  type="search"
                  value={query}
                  placeholder="A word, thought, or phrase…"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </span>
            </label>

            <label className="favorites-sort">
              <span>Arrange</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="Newest">Newest saved</option>
                <option value="Oldest">Oldest saved</option>
              </select>
            </label>

            <label className="favorites-show">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <span className="favorites-count">
              {filtered.length}{" "}
              {filtered.length === 1 ? "saved favorite" : "saved favorites"}
            </span>
          </section>
        )}

        {!hasFavorites ? (
          <section className="favorites-empty" aria-live="polite">
            <span className="favorites-empty__kicker">
              Your keepsake collection
            </span>
            <h2>Nothing tucked away yet</h2>
            <p>
              When today’s words feel worth holding onto, tap the heart beside
              them.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/today")}
            >
              Return to Today
            </button>
          </section>
        ) : !hasResults ? (
          <section className="favorites-no-results" aria-live="polite">
            <h2>No saved words match that search</h2>
            <p>Try another word or return to your full keepsake collection.</p>
            <button type="button" onClick={() => setQuery("")}>
              Clear search
            </button>
          </section>
        ) : (
          <>
            <section
              className={`favorites-grid ${visible.length === 1 ? "favorites-grid--single" : ""}`}
              aria-label="Saved favorites"
            >
              {visible.map((item, index) => (
                <article
                  key={item.id || item.text}
                  className={`favorites-note favorites-note--${(index % 3) + 1}`}
                >
                  <button
                    type="button"
                    className="favorites-note__copy-surface"
                    onClick={() => copyFavorite(item)}
                    aria-label="Copy this saved favorite"
                  >
                    <blockquote>{item.text || "—"}</blockquote>

                    {item.challenge && (
                      <span className="favorites-note__challenge">
                        <span>A gentle challenge</span>
                        <span>{item.challenge}</span>
                      </span>
                    )}
                  </button>

                  <footer>
                    <small>{savedDate(item)}</small>
                    <div className="favorites-note__actions">
                      <button type="button" onClick={() => copyFavorite(item)}>
                        Copy
                      </button>
                      <button type="button" onClick={() => removeItem(item)}>
                        Unfavorite
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </section>

            <Pager page={safePage} setPage={setPage} totalPages={totalPages} />
          </>
        )}
      </section>

      {pendingRemovals.length > 0 && (
        <div className="favorites-undo" role="status" aria-live="polite">
          <span>
            {pendingRemovals.length === 1
              ? "Favorite removed"
              : `${pendingRemovals.length} favorites removed`}
          </span>
          <button type="button" onClick={undoAll}>
            {pendingRemovals.length === 1 ? "Undo" : "Undo all"}
          </button>
        </div>
      )}

      {toast && (
        <div className="favorites-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
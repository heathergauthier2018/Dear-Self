// src/components/PastEntries.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/theme.css";
import "../styles/PastEntries.css";
import html2canvas from "html2canvas";
import {
  listEntries,
  removeEntry,
  updateEntry, // merges by id
} from "../services/affirmationEngine";
import PAPERS from "../utils/paperImages";
import { savePrefs } from "../utils/prefs";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const keyFromLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const keyFromDateInput = (yyyy_mm_dd) => yyyy_mm_dd || "";

const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

/* ------------------------------------------------------------------ */
/* Font list + Colors (mirror JournalEntry.js)                         */
/* ------------------------------------------------------------------ */
const FONT_OPTIONS = [
  { label: "Inter (Sans)", value: "Inter" },
  { label: "Poppins (Sans)", value: "Poppins" },
  { label: "Montserrat (Sans)", value: "Montserrat" },
  { label: "Raleway (Sans)", value: "Raleway" },
  { label: "Josefin Sans (Sans)", value: "Josefin Sans" },
  { label: "Quicksand (Sans)", value: "Quicksand" },
  { label: "Nunito (Sans)", value: "Nunito" },
  { label: "Merriweather (Serif)", value: "Merriweather" },
  { label: "Lora (Serif)", value: "Lora" },
  { label: "Playfair Display (Serif)", value: "Playfair Display" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "Cinzel", value: "Cinzel" },
  { label: "Libre Baskerville", value: "Libre Baskerville" },
  { label: "Crimson Pro", value: "Crimson Pro" },
  { label: "Caveat (Handwritten)", value: "Caveat" },
  { label: "Patrick Hand (Hand)", value: "Patrick Hand" },
  { label: "Handlee (Hand)", value: "Handlee" },
  { label: "Indie Flower (Hand)", value: "Indie Flower" },
  { label: "Shadows Into Light", value: "Shadows Into Light" },
  { label: "Great Vibes (Script)", value: "Great Vibes" },
  { label: "Sacramento (Script)", value: "Sacramento" },
  { label: "Courier Prime (Mono)", value: "Courier Prime" },
];

const COLORS = [
  "#111111",
  "#2B2B2B",
  "#4A4A4A",
  "#334155",
  "#475569",
  "#1D4ED8",
  "#2563EB",
  "#0EA5E9",
  "#6D28D9",
  "#9333EA",
  "#0F766E",
  "#10B981",
  "#65A30D",
  "#3F6212",
  "#7CA982",
  "#90A8A1",
  "#B91C1C",
  "#E11D48",
  "#F43F5E",
  "#EA580C",
  "#F59E0B",
  "#8B5E3C",
  "#A26A3C",
  "#F5AFC6",
  "#E9D5FF",
  "#C7D2FE",
  "#A7F3D0",
  "#D1FAE5",
  "#FDE68A",
  "#FECACA",
  "#BBD7C5",
];

/* Safe text/date areas (match Today page geometry) */
const SAFE = {
  left: "7%",
  right: "7%",
  topDate: "5%",
  topText: "calc(5% + 34px)",
  bottom: "8%",
};

/* Download & Trash icons */
const DownloadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3v10m0 0l-4-4m4 4l4-4M5 21h14a2 2 0 002-2v-3M3 16v3a2 2 0 002 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="3" rx="1" />
    <rect x="2.5" y="8.5" width="15" height="3" rx="1" />
    <rect x="2.5" y="14" width="15" height="3" rx="1" />
  </svg>
);
const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 6h18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 6l.7-1.4A2 2 0 0 1 10.4 3h3.2a2 2 0 0 1 1.7.6L16 6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <rect
      x="6"
      y="6"
      width="12"
      height="14"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M10 10v7M14 10v7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* Raw restore (if ever needed) */
const RAW_ENTRIES_KEY = "dearself.entries";
const restoreEntryRaw = (entry) => {
  try {
    const list = JSON.parse(localStorage.getItem(RAW_ENTRIES_KEY) || "[]");
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
const PAGE_SIZE_KEY = "pastEntries.pageSize";
const PAGE_SIZE_OPTIONS = [9, 18, 27];

const themeLabel = (themeKey = "") => {
  const currentPaper = PAPERS.find((paper) => paper.id === themeKey);
  if (currentPaper) return currentPaper.name;
  const cleaned = String(themeKey)
    .replace(/\.png$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\d+$/g, "")
    .trim();
  return cleaned
    ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Journal paper";
};

const viewerSafeArea = (themeKey = "") => {
  const key = String(themeKey).toLowerCase();
  if (/botanical|nature|floral/.test(key)) {
    return {
      left: "20%",
      right: "10%",
      dateTop: "7.2%",
      textTop: "17%",
      bottom: "10%",
    };
  }
  if (/night|moon|whimsical/.test(key)) {
    return {
      left: "16%",
      right: "11%",
      dateTop: "7.2%",
      textTop: "16%",
      bottom: "11%",
    };
  }
  return {
    left: "13%",
    right: "10%",
    dateTop: "7.2%",
    textTop: "15%",
    bottom: "10%",
  };
};

const escapeHTML = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const splitIntoPages = (text, fontSize = 18) => {
  const limit = Math.max(900, Math.floor(2100 * (18 / Math.max(10, fontSize))));
  const tokens = String(text || "").match(/\S+\s*/g) || [];
  const pages = [];
  let page = "";
  tokens.forEach((token) => {
    if (page && page.length + token.length > limit) {
      pages.push(page.trimEnd());
      page = token;
    } else {
      page += token;
    }
  });
  if (page || pages.length === 0) pages.push(page.trimEnd());
  return pages;
};

/** Compact, windowed numeric pager */
function Pager({
  page,
  setPage,
  totalPages,
  totalItems,
  pageSize,
  setPageSize,
}) {
  if (totalPages <= 1) return null;

  const go = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const btn = {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    padding: "0 8px",
  };
  const btnDisabled = { opacity: 0.45, cursor: "default" };
  const active = { background: "#eaf3ec", borderColor: "#cfe5d8" };

  return (
    <nav
      style={{
        maxWidth: 1050,
        margin: "16px auto 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          style={{ ...btn }}
          disabled={page === 1}
          onClick={() => go(1)}
          aria-label="First"
        >
          {"«"}
        </button>
        <button
          style={{ ...btn, ...(page === 1 ? btnDisabled : {}) }}
          disabled={page === 1}
          onClick={() => go(page - 1)}
          aria-label="Previous"
        >
          {"‹"}
        </button>

        {start > 1 && (
          <>
            <button style={btn} onClick={() => go(1)}>
              1
            </button>
            <span style={{ padding: "0 4px", color: "#888" }}>…</span>
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            style={{ ...btn, ...(p === page ? active : {}) }}
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            <span style={{ padding: "0 4px", color: "#888" }}>…</span>
            <button style={btn} onClick={() => go(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          style={{ ...btn, ...(page === totalPages ? btnDisabled : {}) }}
          disabled={page === totalPages}
          onClick={() => go(page + 1)}
          aria-label="Next"
        >
          {"›"}
        </button>
        <button
          style={{ ...btn }}
          disabled={page === totalPages}
          onClick={() => go(totalPages)}
          aria-label="Last"
        >
          {"»"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#6b7280" }}>
          {totalItems.toLocaleString()} entries • page {page} of {totalPages}
        </span>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
          }}
        >
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            style={{
              height: 36,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "0 10px",
              background: "#fff",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
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
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("Newest");
  const [themeFilter, setThemeFilter] = useState("all");
  const [items, setItems] = useState(() => listEntries());
  const [view, setView] = useState("grid"); // grid | list

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 9; // balanced three-column default
  });
  const setPageSize = (n) => {
    setPageSizeState(n);
    localStorage.setItem(PAGE_SIZE_KEY, String(n));
    setPage(1);
  };

  // Shared feedback and multi-entry optimistic deletion.
  const [undo, setUndo] = useState(null);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Viewer / Editor
  const [viewer, setViewer] = useState(null); // entry
  const [editing, setEditing] = useState(null); // { ...entry, _work:{fontFamily,fontColor,keepColor}, _text }
  const viewerBodyRef = useRef(null);

  const showToast = (message, tone = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // keep in sync if another tab changes
  useEffect(() => {
    const onStorage = () => setItems(listEntries());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Whenever view or sort changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [view, sort]);

  // If the paper collection changes, never leave the archive stuck on a retired filter.
  useEffect(() => {
    if (
      themeFilter !== "all" &&
      !PAPERS.some((paper) => paper.id === themeFilter)
    ) {
      setThemeFilter("all");
      setPage(1);
    }
  }, [themeFilter]);

  /* --------- Filter/Sort --------- */
  const filtered = useMemo(() => {
    let list = [...items];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) =>
        String(e.content || "")
          .toLowerCase()
          .includes(q),
      );
    }

    if (themeFilter !== "all") {
      list = list.filter((e) => (e.style?.themeKey || "") === themeFilter);
    }

    if (date) {
      const wantedKey = keyFromDateInput(date);
      list = list.filter(
        (e) => keyFromLocalDate(new Date(e.iso)) === wantedKey,
      );
    }

    switch (sort) {
      case "Oldest":
        list.sort((a, b) => +new Date(a.iso) - +new Date(b.iso));
        break;
      case "ThemeAZ":
        list.sort(
          (a, b) =>
            (a.style?.themeKey || "").localeCompare(b.style?.themeKey || "") ||
            +new Date(b.iso) - +new Date(a.iso),
        );
        break;
      case "ThemeZA":
        list.sort(
          (a, b) =>
            (b.style?.themeKey || "").localeCompare(a.style?.themeKey || "") ||
            +new Date(b.iso) - +new Date(a.iso),
        );
        break;
      default:
        list.sort((a, b) => +new Date(b.iso) - +new Date(a.iso));
    }
    return list;
  }, [items, query, themeFilter, date, sort]);

  // Hide any card that's pending deletion (optimistic)
  const pendingDeleteIds = new Set(pendingDeletes.map((pending) => pending.id));
  const visible = filtered.filter((entry) => !pendingDeleteIds.has(entry.id));

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
    if (pendingDeletes.some((pending) => pending.id === id)) return;
    const entry = items.find((i) => i.id === id);
    if (!entry) return;

    const undoMs = Number(
      JSON.parse(localStorage.getItem("dearself.userprefs.v1") || "{}")
        ?.undoMs ?? 7000,
    );
    const timeoutId = setTimeout(() => {
      removeEntry(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setPendingDeletes((current) =>
        current.filter((pending) => pending.id !== id),
      );
    }, undoMs);

    setPendingDeletes((current) => [...current, { id, entry, timeoutId }]);

    if (undo?.timeout) clearTimeout(undo.timeout);
    const uiTimeout = setTimeout(() => setUndo(null), undoMs + 150);
    setUndo({ timeout: uiTimeout });
  };

  const undoDelete = () => {
    if (pendingDeletes.length === 0) return;
    pendingDeletes.forEach((pending) => clearTimeout(pending.timeoutId));
    if (undo?.timeout) clearTimeout(undo.timeout);
    setPendingDeletes([]);
    setUndo(null);
    showToast("Deletion undone");
  };

  /* --------- Viewer / Editor --------- */
  const openViewer = (e) => setViewer(e);
  const closeViewer = () => setViewer(null);

  const viewerIndex = viewer
    ? visible.findIndex((entry) => entry.id === viewer.id)
    : -1;
  const previousViewerEntry = viewerIndex > 0 ? visible[viewerIndex - 1] : null;
  const nextViewerEntry =
    viewerIndex >= 0 && viewerIndex < visible.length - 1
      ? visible[viewerIndex + 1]
      : null;

  useEffect(() => {
    if (!viewer) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft" && previousViewerEntry)
        setViewer(previousViewerEntry);
      if (event.key === "ArrowRight" && nextViewerEntry)
        setViewer(nextViewerEntry);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewer, previousViewerEntry, nextViewerEntry]);

  useEffect(() => {
    setExportOpen(false);
    if (viewerBodyRef.current) viewerBodyRef.current.scrollTop = 0;
  }, [viewer?.id]);

  const openEditor = (e) => {
    const s = e.style || {};
    setEditing({
      ...e,
      _text: String(e.content || ""),
      _work: {
        fontFamily: s.fontFamily || "Inter",
        fontColor: s.fontColor ?? "#2B2B2B",
        keepColor: true,
      },
    });
  };
  const closeEditor = () => {
    if (editing && editing._text !== String(editing.content || "")) {
      const discard = window.confirm("Discard the changes to this entry?");
      if (!discard) return;
    }
    setEditing(null);
  };

  useEffect(() => {
    if (!editing) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  // Save: when changing font color, also set dateColor (the requested fix)
  const saveEditor = () => {
    if (!editing) return;
    const chosen = editing._work.keepColor
      ? "__KEEP__"
      : editing._work.fontColor;
    const nextFontColor =
      chosen === "__KEEP__" ? editing.style?.fontColor || "#2B2B2B" : chosen;

    const patch = {
      content: editing._text,
      style: {
        ...(editing.style || {}),
        fontFamily: editing._work.fontFamily,
        fontColor: nextFontColor,
        dateColor:
          chosen === "__KEEP__"
            ? (editing.style?.dateColor ??
              editing.style?.fontColor ??
              "#2B2B2B")
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
    const node = document.createElement("div");
    node.style.position = "fixed";
    node.style.left = "-10000px";
    node.style.top = "0";
    node.style.width = "1024px";
    node.style.height = "1536px"; // 2:3
    node.style.borderRadius = "12px";
    node.style.overflow = "hidden";
    node.style.background = "#f7f3eb";

    node.innerHTML = `
      <div style="position:relative;width:100%;height:100%;">
        ${
          s.imageSrc
            ? `<img src="${s.imageSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;border-radius:12px;"/>`
            : ""
        }
        <div style="
          position:absolute;left:${SAFE.left};right:${SAFE.right};top:${SAFE.topDate};
          font-family:${s.fontFamily || "Inter"};
          color:${s.dateColor || s.fontColor || "#2B2B2B"};
          font-weight:700;font-size:42px;line-height:1.25;text-align:right;">
          ${new Date(e.iso).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div style="
          position:absolute;left:${SAFE.left};right:${SAFE.right};top:${SAFE.topText};bottom:${SAFE.bottom};
          font-family:${s.fontFamily || "Inter"};
          color:${s.fontColor || "#2B2B2B"};
          font-weight:${s.bold ? 700 : 400};
          font-style:${s.italic ? "italic" : "normal"};
          font-size:${Number(s.fontSize) || 20}px;
          line-height:1.6;white-space:pre-wrap;overflow:auto;overflow-wrap:anywhere;word-break:break-word;">
          ${String(e.content || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br/>")}
        </div>
      </div>
    `;
    document.body.appendChild(node);
    return node;
  };

  const downloadPNG = async (e) => {
    const node = makeCompositeNode(e);
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        useCORS: true,
        scale: 1,
      });
      const link = document.createElement("a");
      link.download = "journal-page.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      node.remove();
    }
  };

  const downloadText = (entry) => {
    const dateLabel = new Date(entry.iso).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const blob = new Blob(
      [
        `${dateLabel}\n${themeLabel(entry.style?.themeKey)}\n\n${String(entry.content || "")}`,
      ],
      {
        type: "text/plain;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dear-self-${new Date(entry.iso).toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    showToast("Text file downloaded");
  };

  const printEntryPDF = (entry) => {
    const printWindow = window.open("", "_blank", "width=900,height=900");
    if (!printWindow) {
      showToast("Please allow pop-ups to export a PDF", "error");
      return;
    }

    const s = entry.style || {};
    const safe = viewerSafeArea(s.themeKey);
    const fontSize = Number(s.fontSize) || 18;
    const pages = splitIntoPages(entry.content, fontSize);
    const fullDate = new Date(entry.iso).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const image = escapeHTML(s.imageSrc || "");
    const family = escapeHTML(s.fontFamily || "Georgia");
    const bodyColor = escapeHTML(s.fontColor || "#2B2B2B");
    const dateColor = escapeHTML(s.dateColor || s.fontColor || "#2B2B2B");
    const pageMarkup = pages
      .map(
        (pageText, index) => `
      <section class="journal-page">
        ${image ? `<img class="paper" src="${image}" alt="">` : ""}
        <div class="entry-date" style="left:${safe.left};right:${safe.right};top:${safe.dateTop};color:${dateColor}">
          ${index === 0 ? escapeHTML(fullDate) : "Continued"}
        </div>
        <div class="entry-body" style="left:${safe.left};right:${safe.right};top:${safe.textTop};bottom:${safe.bottom};color:${bodyColor};font-family:'${family}',serif;font-size:${fontSize}px;font-weight:${s.bold ? 700 : 400};font-style:${s.italic ? "italic" : "normal"}">
          ${escapeHTML(pageText).replace(/\n/g, "<br>")}
        </div>
        <span class="page-number">${index + 1} / ${pages.length}</span>
      </section>`,
      )
      .join("");

    printWindow.document
      .write(`<!doctype html><html><head><title>Dear Self entry</title><style>
      *{box-sizing:border-box}html,body{margin:0;background:#eee}body{font-family:Georgia,serif}
      .journal-page{position:relative;width:8in;height:12in;margin:18px auto;background:#f8f2e9;overflow:hidden;break-after:page;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .paper{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
      .entry-date,.entry-body{position:absolute}.entry-date{text-align:right;font-weight:700;font-size:18px;line-height:1.3}
      .entry-body{line-height:${Number(s.lineHeight) || 1.6};white-space:normal;overflow:hidden;overflow-wrap:anywhere}
      .page-number{position:absolute;bottom:3%;left:0;right:0;text-align:center;font-size:11px;color:rgba(80,60,50,.55)}
      @page{size:8in 12in;margin:0}@media print{html,body{background:white}.journal-page{margin:0;box-shadow:none}}
    </style></head><body>${pageMarkup}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`);
    printWindow.document.close();
    setExportOpen(false);
    showToast("Choose “Save as PDF” in the print window");
  };

  const copyEntry = async (entry) => {
    try {
      await navigator.clipboard.writeText(String(entry.content || ""));
      showToast("Copied to clipboard");
    } catch {
      showToast("Couldn’t copy—please try again", "error");
    }
  };

  const clearArchiveFilters = () => {
    setQuery("");
    setDate("");
    setThemeFilter("all");
    setPage(1);
  };

  const writeOnPaper = (paperId) => {
    if (paperId) savePrefs({ selectedWritingSpaceKey: paperId });
    window.location.assign("/today");
  };

  /* --------- Card Preview --------- */
  const CardPreview = ({ e, compact }) => {
    const s = e.style || {};
    const d = new Date(e.iso);
    const fam = s.fontFamily || "Inter";
    const color = s.fontColor || "#2B2B2B";
    const dateColor = s.dateColor || color;
    const excerpt = String(e.content ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const isBlank = excerpt.length === 0;
    const paperName = themeLabel(s.themeKey);

    return (
      <article className={`pe-card ${compact ? "compact" : ""}`}>
        <div
          className={`pe-frame ${compact ? "banner" : "thumb"}`}
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => openViewer(e)}
          title="Open entry"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openViewer(e);
            }
          }}
        >
          {/* strict 2:3 canvas with background-image to keep borders even */}
          <div
            className="pe-thumbCanvas"
            style={{
              backgroundImage: s.imageSrc ? `url("${s.imageSrc}")` : "none",
            }}
          />
          <span className="pe-theme-label">{paperName}</span>
          {/* Date (top-right) */}
          <div
            className="pe-date--thumb"
            style={{
              fontFamily: fam,
              color: dateColor,
              left: viewerSafeArea(s.themeKey).left,
              right: viewerSafeArea(s.themeKey).right,
            }}
          >
            {d.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <small className="pe-time--thumb">
              {d.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </small>
          </div>

          {/* First line (below, left) */}
          <div
            className="pe-snippet--thumb"
            style={{
              fontFamily: fam,
              color,
              fontWeight: s.bold ? 700 : 600,
              fontStyle: s.italic ? "italic" : "normal",
              left: viewerSafeArea(s.themeKey).left,
              right: viewerSafeArea(s.themeKey).right,
              top: viewerSafeArea(s.themeKey).textTop,
            }}
          >
            {isBlank ? (
              <span className="pe-blank-label">Blank entry</span>
            ) : (
              excerpt
            )}
          </div>
        </div>

        {/* Actions: Copy • Edit • Download • Trash */}
        <div className="pe-actions">
          <button className="link-button pe-copy" onClick={() => copyEntry(e)}>
            Copy
          </button>
          <button className="link-button pe-edit" onClick={() => openEditor(e)}>
            Edit
          </button>
          <button
            className="icon-button pe-download"
            onClick={() => printEntryPDF(e)}
            title="Export PDF"
            aria-label="Export PDF"
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
      </article>
    );
  };

  const archiveHasEntries = items.some(
    (entry) => !pendingDeleteIds.has(entry.id),
  );
  const selectedEmptyPaper =
    PAPERS.find((paper) => paper.id === themeFilter) || PAPERS[0];
  const onlyPaperFilterIsActive =
    themeFilter !== "all" && !query.trim() && !date;
  const publicPath = process.env.PUBLIC_URL || "";

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="page-wrap archive-page">
      <section className="archive-shell">
        <header className="archive-header">
          <span className="archive-kicker">My private collection</span>
          <h1 className="brand-subtitle page-title">Past Entries</h1>
          <p>Little by little, day by day.</p>
        </header>

        {/* Controls */}
        <div className="row gap archive-toolbar">
          <img
            className="archive-toolbar__frame"
            src={`${publicPath}/images/past-entries-toolbar-frame.png`}
            alt=""
            aria-hidden="true"
          />
          <label className="archive-control archive-control--search">
            <span>Search my pages</span>
            <input
              className="archive-search"
              placeholder="A word, thought, or phrase…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="archive-control">
            <span>Arrange</span>
            <select
              aria-label="Sort entries"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="Newest">Newest first</option>
              <option value="Oldest">Oldest first</option>
              <option value="ThemeAZ">Paper (A→Z)</option>
              <option value="ThemeZA">Paper (Z→A)</option>
            </select>
          </label>

          <label className="archive-control">
            <span>Paper</span>
            <select
              aria-label="Filter by paper"
              value={themeFilter}
              onChange={(e) => {
                setThemeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All papers</option>
              {PAPERS.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.name}
                </option>
              ))}
            </select>
          </label>

          <label className="archive-control">
            <span>Date</span>
            <input
              type="date"
              aria-label="Filter entries by date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <div className="archive-control archive-control--view">
            <span>View</span>
            <div
              className="archive-view-switch"
              role="group"
              aria-label="Entry layout"
            >
              <button
                type="button"
                className={view === "grid" ? "is-active" : ""}
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                title="Grid view"
              >
                <GridIcon />
              </button>
              <button
                type="button"
                className={view === "list" ? "is-active" : ""}
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                title="List view"
              >
                <ListIcon />
              </button>
            </div>
          </div>

          <label className="archive-control archive-control--count">
            <span>Show</span>
            <select
              aria-label="Entries per page"
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <section className="archive-empty" aria-live="polite">
            <div
              className={`archive-empty__papers ${themeFilter === "all" ? "archive-empty__papers--collection" : ""}`}
              aria-hidden="true"
            >
              {(themeFilter === "all"
                ? PAPERS.slice(0, 3)
                : [selectedEmptyPaper]
              ).map((paper) => (
                <img
                  key={paper.id}
                  src={`${publicPath}/images/${paper.src}`}
                  alt=""
                />
              ))}
            </div>

            {!archiveHasEntries ? (
              <>
                <span className="archive-empty__eyebrow">A new beginning</span>
                <h3>Your first page is waiting</h3>
                <p>
                  This is where your reflections, letters, and little pieces of
                  each day will gather.
                </p>
                <div className="archive-empty__actions">
                  <button
                    type="button"
                    className="archive-empty__primary"
                    onClick={() => writeOnPaper(PAPERS[0]?.id)}
                  >
                    Begin my first entry
                  </button>
                </div>
              </>
            ) : onlyPaperFilterIsActive ? (
              <>
                <span className="archive-empty__eyebrow">
                  An unwritten page
                </span>
                <h3>No {selectedEmptyPaper.name} pages yet</h3>
                <p>
                  Your collection has no entries written on{" "}
                  {selectedEmptyPaper.name}—at least, not yet.
                </p>
                <div className="archive-empty__actions">
                  <button
                    type="button"
                    className="archive-empty__secondary"
                    onClick={() => {
                      setThemeFilter("all");
                      setPage(1);
                    }}
                  >
                    View all papers
                  </button>
                  <button
                    type="button"
                    className="archive-empty__primary"
                    onClick={() => writeOnPaper(selectedEmptyPaper.id)}
                  >
                    Write on {selectedEmptyPaper.name}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="archive-empty__eyebrow">
                  The pages are still here
                </span>
                <h3>Nothing matches just yet</h3>
                <p>
                  Try another date, paper, or search phrase to find the entry
                  you’re looking for.
                </p>
                <div className="archive-empty__actions">
                  <button
                    type="button"
                    className="archive-empty__primary"
                    onClick={clearArchiveFilters}
                  >
                    Clear filters
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* Grouped months for THIS PAGE ONLY */}
        {grouped.map((group) => (
          <section key={group.label} className="archive-month-group">
            <h2 className="pe-month" data-themed="1">
              <span>
                {group.label}{" "}
                <small>
                  · {group.entries.length}{" "}
                  {group.entries.length === 1 ? "entry" : "entries"}
                </small>
              </span>
            </h2>
            <div className={view === "grid" ? "pe-grid" : "pe-list"}>
              {group.entries.map((e) => (
                <CardPreview key={e.id} e={e} compact={view === "list"} />
              ))}
            </div>
          </section>
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
      {undo && pendingDeletes.length > 0 && (
        <div className="undo-bar" role="status" aria-live="polite">
          <span>
            {pendingDeletes.length === 1
              ? "Entry deleted"
              : `${pendingDeletes.length} entries deleted`}
          </span>
          <button className="undo-btn" onClick={undoDelete}>
            {pendingDeletes.length > 1 ? "Undo all" : "Undo"}
          </button>
        </div>
      )}

      {toast && (
        <div
          className={`archive-toast archive-toast--${toast.tone}`}
          role="status"
          aria-live="polite"
        >
          <span className="archive-toast__mark" aria-hidden="true">
            ✓
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* VIEWER modal */}
      {viewer && (
        <div
          className="pe-modal pe-viewer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-viewer-title"
          onClick={closeViewer}
        >
          <div
            className="pe-modal__panel pe-viewer__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pe-modal__top pe-viewer__toolbar">
              <div className="pe-viewer__identity">
                <span id="entry-viewer-title">
                  {themeLabel(viewer.style?.themeKey)}
                </span>
                <small>
                  Saved{" "}
                  {new Date(viewer.iso).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </small>
              </div>
              <div className="pe-viewer__actions">
                <button
                  className="pill"
                  onClick={() => {
                    const entry = viewer;
                    closeViewer();
                    openEditor(entry);
                  }}
                >
                  Edit
                </button>
                <div className="pe-export">
                  <button
                    className="pill"
                    onClick={() => setExportOpen((open) => !open)}
                    aria-expanded={exportOpen}
                  >
                    Export
                  </button>
                  {exportOpen && (
                    <div className="pe-export__menu">
                      <button
                        type="button"
                        onClick={() => printEntryPDF(viewer)}
                      >
                        <strong>Save as PDF</strong>
                        <small>Includes every page</small>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadText(viewer)}
                      >
                        <strong>Download text</strong>
                        <small>Simple editable backup</small>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExportOpen(false);
                          downloadPNG(viewer);
                        }}
                      >
                        <strong>Page image</strong>
                        <small>Visible page only</small>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="pill pe-viewer__close"
                  onClick={closeViewer}
                  aria-label="Close entry"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="pe-modal__canvasWrap">
              <div
                className="pe-modal__canvas"
                style={{ position: "relative" }}
              >
                {viewer.style?.imageSrc ? (
                  <img src={viewer.style.imageSrc} alt="" />
                ) : (
                  <div className="pe-img pe-img--blank" />
                )}

                {/* Date */}
                <div
                  style={{
                    position: "absolute",
                    left: viewerSafeArea(viewer.style?.themeKey).left,
                    right: viewerSafeArea(viewer.style?.themeKey).right,
                    top: viewerSafeArea(viewer.style?.themeKey).dateTop,
                    color:
                      viewer.style?.dateColor ||
                      viewer.style?.fontColor ||
                      "#2B2B2B",
                    fontFamily: viewer.style?.fontFamily || "Inter",
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1.25,
                    textAlign: "right",
                  }}
                >
                  {new Date(viewer.iso).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                {/* Body */}
                <div
                  ref={viewerBodyRef}
                  className="pe-viewer__body"
                  style={{
                    position: "absolute",
                    left: viewerSafeArea(viewer.style?.themeKey).left,
                    right: viewerSafeArea(viewer.style?.themeKey).right,
                    top: viewerSafeArea(viewer.style?.themeKey).textTop,
                    bottom: viewerSafeArea(viewer.style?.themeKey).bottom,
                    overflow: "auto",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    boxSizing: "border-box",
                    color: viewer.style?.fontColor || "#2B2B2B",
                    fontFamily: viewer.style?.fontFamily || "Inter",
                    fontWeight: viewer.style?.bold ? 700 : 400,
                    fontStyle: viewer.style?.italic ? "italic" : "normal",
                    fontSize:
                      Math.max(
                        9,
                        (Number(viewer.style?.fontSize) || 18) * 0.7,
                      ) + "px",
                    lineHeight: viewer.style?.lineHeight || 1.6,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                  }}
                >
                  {String(viewer.content || "")}
                </div>
              </div>
            </div>
            <div className="pe-viewer__navigation" aria-label="Browse entries">
              <button
                type="button"
                disabled={!previousViewerEntry}
                onClick={() => setViewer(previousViewerEntry)}
              >
                ← Previous
              </button>
              <span>
                {viewerIndex + 1} of {visible.length}
              </span>
              <button
                type="button"
                disabled={!nextViewerEntry}
                onClick={() => setViewer(nextViewerEntry)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR modal */}
      {editing && (
        <div
          className="pe-modal pe-editor-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Edit journal entry"
          onClick={closeEditor}
        >
          <div
            className="pe-modal__panel pe-editor__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pe-modal__top pe-editor__toolbar"
              style={{ gap: 10 }}
            >
              {/* Font family */}
              <select
                value={editing._work.fontFamily}
                onChange={(e) =>
                  setEditing((ed) => ({
                    ...ed,
                    _work: { ...ed._work, fontFamily: e.target.value },
                  }))
                }
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Keep color toggle */}
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={editing._work.keepColor}
                  onChange={(e) =>
                    setEditing((ed) => ({
                      ...ed,
                      _work: { ...ed._work, keepColor: e.target.checked },
                    }))
                  }
                />
                Keep current color
              </label>

              {/* Compact horizontal color picker when NOT keeping color */}
              {!editing._work.keepColor && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Font Color</span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      gap: 6,
                      maxWidth: "min(560px, 48vw)",
                      overflowX: "auto",
                      overflowY: "hidden",
                      padding: "6px 8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                    }}
                  >
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`swatch ${editing._work.fontColor === c ? "selected" : ""}`}
                        onClick={() =>
                          setEditing((ed) => ({
                            ...ed,
                            _work: { ...ed._work, fontColor: c },
                          }))
                        }
                        style={{
                          background: c,
                          width: 24,
                          height: 24,
                          flex: "0 0 auto",
                        }}
                        aria-label={`Select color ${c}`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className="pe-editor__actions"
                style={{ marginLeft: "auto", display: "flex", gap: 8 }}
              >
                <button className="pill" onClick={closeEditor}>
                  Cancel
                </button>
                <button className="primary" onClick={saveEditor}>
                  Save changes
                </button>
              </div>
            </div>

            <div className="pe-modal__canvasWrap pe-editor__canvasWrap">
              <div
                className="pe-modal__canvas"
                style={{ position: "relative" }}
              >
                {editing.style?.imageSrc ? (
                  <img src={editing.style.imageSrc} alt="" />
                ) : (
                  <div className="pe-img pe-img--blank" />
                )}

                {/* LIVE date preview uses the same color as the body when keepColor=false */}
                <div
                  style={{
                    position: "absolute",
                    left: viewerSafeArea(editing.style?.themeKey).left,
                    right: viewerSafeArea(editing.style?.themeKey).right,
                    top: viewerSafeArea(editing.style?.themeKey).dateTop,
                    color: editing._work.keepColor
                      ? editing.style?.dateColor ||
                        editing.style?.fontColor ||
                        "#2B2B2B"
                      : editing._work.fontColor,
                    fontFamily: editing._work.fontFamily,
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1.25,
                    textAlign: "right",
                  }}
                >
                  {new Date(editing.iso).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                {/* Editable body */}
                <textarea
                  className="pe-editor-textarea pe-body--full"
                  value={editing._text}
                  onChange={(e) =>
                    setEditing((ed) => ({ ...ed, _text: e.target.value }))
                  }
                  placeholder="Write to yourself…"
                  style={{
                    position: "absolute",
                    left: viewerSafeArea(editing.style?.themeKey).left,
                    right: viewerSafeArea(editing.style?.themeKey).right,
                    top: viewerSafeArea(editing.style?.themeKey).textTop,
                    bottom: viewerSafeArea(editing.style?.themeKey).bottom,
                    resize: "none",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    overflow: "auto",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    boxSizing: "border-box",
                    fontFamily: editing._work.fontFamily,
                    color: editing._work.keepColor
                      ? editing.style?.fontColor || "#2B2B2B"
                      : editing._work.fontColor,
                    fontWeight: editing.style?.bold ? 700 : 400,
                    fontStyle: editing.style?.italic ? "italic" : "normal",
                    fontSize:
                      Math.max(
                        9,
                        (Number(editing.style?.fontSize) || 18) * 0.7,
                      ) + "px",
                    lineHeight: editing.style?.lineHeight || 1.6,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
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
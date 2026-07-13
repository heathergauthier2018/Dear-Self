// src/components/JournalEntry.js
import React, { useEffect, useMemo, useRef, useState } from "react";

import "../styles/App.css";
import "../styles/theme.css";

import {
  ensureTodayAffirmation,
  addEntry,
  updateEntry,
  toggleFavorite,
  listFavorites,
} from "../services/affirmationEngine";

import { loadPrefs, savePrefs } from "../utils/prefs";

import StreakBadge from "../utils/StreakBadge.js";
import { getStreak, recordDailyVisit } from "../services/streak.js";

function SignaturePad() {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [tool, setTool] = useState("pen");
  const [penPosition, setPenPosition] = useState({
    x: 0,
    y: 0,
    visible: false,
  });

  const configureBrush = (context, canvas, activeTool = tool) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / Math.max(1, rect.width);

    context.lineCap = "round";
    context.lineJoin = "round";

    if (activeTool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 11 * scale;
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "#5b463b";
      context.lineWidth = 1.25 * scale;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const saved = localStorage.getItem("dearself.signature.v1");
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      const context = canvas.getContext("2d");
      configureBrush(context, canvas, "pen");

      if (saved) {
        const image = new Image();
        image.onload = () => {
          context.globalCompositeOperation = "source-over";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        };
        image.src = saved;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const movePen = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setPenPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      visible: true,
    });
  };

  const beginDrawing = (event) => {
    event.preventDefault();
    movePen(event);

    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const { x, y } = point(event);

    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);

    configureBrush(context, canvas, tool);
    context.beginPath();
    context.moveTo(x, y);

    if (tool === "eraser") {
      context.lineTo(x + 0.01, y + 0.01);
      context.stroke();
    }
  };

  const draw = (event) => {
    movePen(event);
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const events = event.nativeEvent.getCoalescedEvents?.() || [
      event.nativeEvent,
    ];

    configureBrush(context, canvas, tool);

    events.forEach((nextEvent) => {
      const { x, y } = point(nextEvent);
      context.lineTo(x, y);
      context.stroke();
    });
  };

  const finishDrawing = (event) => {
    if (!drawingRef.current) return;

    drawingRef.current = false;

    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");

    context.closePath();
    context.globalCompositeOperation = "source-over";

    localStorage.setItem(
      "dearself.signature.v1",
      canvas.toDataURL(),
    );
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, canvas.width, canvas.height);

    localStorage.removeItem("dearself.signature.v1");
    setTool("pen");
  };

  const toggleTool = () => {
    setTool((current) => (current === "pen" ? "eraser" : "pen"));
  };

  return (
    <div className={`diary-signature-pad is-${tool}`}>
      <canvas
        ref={canvasRef}
        aria-label={
          tool === "eraser"
            ? "Erase part of your journal signature"
            : "Write your name in the journal"
        }
        onPointerEnter={movePen}
        onPointerLeave={() => {
          drawingRef.current = false;
          setPenPosition((current) => ({
            ...current,
            visible: false,
          }));
        }}
        onPointerDown={beginDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <img
        className={`diary-signature-pen ${
          penPosition.visible && tool === "pen" ? "visible" : ""
        }`}
        src={`${process.env.PUBLIC_URL || ""}/images/pen-cursor.png`}
        alt=""
        aria-hidden="true"
        style={{ left: `${penPosition.x}px`, top: `${penPosition.y}px` }}
      />

      <span
        className={`diary-signature-eraser-cursor ${
          penPosition.visible && tool === "eraser" ? "visible" : ""
        }`}
        aria-hidden="true"
        style={{ left: `${penPosition.x}px`, top: `${penPosition.y}px` }}
      />

      <div className="diary-signature-actions">
        <button
          type="button"
          className={tool === "eraser" ? "active" : ""}
          onClick={toggleTool}
          aria-pressed={tool === "eraser"}
        >
          {tool === "eraser" ? "Pen" : "Eraser"}
        </button>

        <button type="button" onClick={clearSignature}>
          Clear
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

const stripAffPrefix = (value = "") =>
  value
    .replace(/^\s*.*?Affirmation\s*\d+\s*:\s*/i, "")
    .replace(/^\[|\]$/g, "")
    .trim();

const stripChalPrefix = (value = "") =>
  value
    .replace(/^\s*.*?Challenge\s*\d+\s*:\s*/i, "")
    .replace(/^\[|\]$/g, "")
    .trim();

/* =========================================================
   DIARY ASSETS
========================================================= */

const DIARY_IMAGES = {
  sage: {
    open: "sage-open-journal.png",
    closed: "sage-closed-journal.png",
  },
  blush: {
    open: "blush-open-journal.png",
    closed: "blush-closed-journal.png",
  },
  midnight: {
    open: "midnight-open-journal.png",
    closed: "midnight-closed-journal.png",
  },
};

const WRITING_SPACES = [
  {
    key: "quiet-linen",
    name: "Quiet Linen",
    mood: "Clean, calm, and timeless.",
  },
  {
    key: "botanical-calm",
    name: "Botanical Calm",
    mood: "Soft greenery for peaceful reflection.",
  },
  {
    key: "moonlit-reflection",
    name: "Moonlit Reflection",
    mood: "A gentle evening space for deeper thoughts.",
  },
  {
    key: "letter-to-me",
    name: "Letter to Myself",
    mood: "Warm, personal, and heartfelt.",
  },
];

const getWritingSpace = (key) =>
  WRITING_SPACES.find((space) => space.key === key) || WRITING_SPACES[0];

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Poppins", value: "Poppins" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Raleway", value: "Raleway" },
  { label: "Josefin Sans", value: "Josefin Sans" },
  { label: "Quicksand", value: "Quicksand" },
  { label: "Nunito", value: "Nunito" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Lora", value: "Lora" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "Cinzel", value: "Cinzel" },
  { label: "Libre Baskerville", value: "Libre Baskerville" },
  { label: "Crimson Pro", value: "Crimson Pro" },
  { label: "Caveat", value: "Caveat" },
  { label: "Patrick Hand", value: "Patrick Hand" },
  { label: "Handlee", value: "Handlee" },
  { label: "Indie Flower", value: "Indie Flower" },
  { label: "Shadows Into Light", value: "Shadows Into Light" },
  { label: "Great Vibes", value: "Great Vibes" },
  { label: "Sacramento", value: "Sacramento" },
  { label: "Courier Prime", value: "Courier Prime" },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

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

/* =========================================================
   COMPONENT
========================================================= */

export default function JournalEntry() {
  const [appPrefs, setAppPrefs] = useState(() => loadPrefs());

  const [card, setCard] = useState(() => ensureTodayAffirmation());
  const [favorites, setFavorites] = useState(() => listFavorites());

  const initialPaperKey = loadPrefs().selectedWritingSpaceKey || "quiet-linen";

  const [selectedSpace, setSelectedSpace] = useState(() =>
    getWritingSpace(initialPaperKey),
  );

  const [fontFamily, setFontFamily] = useState("Merriweather");
  const [fontSearch, setFontSearch] = useState("Merriweather");
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [fontColor, setFontColor] = useState("#2B2B2B");
  const [fontSize, setFontSize] = useState(20);
  const [fontSizeInput, setFontSizeInput] = useState("20");
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const [entryText, setEntryText] = useState("");
  const [savedEntryId, setSavedEntryId] = useState(null);

  const [isLocked, setIsLocked] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  const [toastMessage, setToastMessage] = useState("");
  const savedToastTimer = useRef(null);

  const initialVisit = useRef(null);
  if (!initialVisit.current) initialVisit.current = recordDailyVisit();

  const [streak, setStreak] = useState(initialVisit.current.value);
  const [showStreak, setShowStreak] = useState(
    initialVisit.current.isNewDay && initialVisit.current.value >= 2,
  );
  const streakTimer = useRef(null);

  const activeTheme = ["sage", "blush", "midnight"].includes(
    appPrefs.brandTheme,
  )
    ? appPrefs.brandTheme
    : "sage";

  const diaryImages = DIARY_IMAGES[activeTheme];

  const publicPath = process.env.PUBLIC_URL || "";

  const openDiarySrc = `${publicPath}/images/${diaryImages.open}`;
  const closedDiarySrc = `${publicPath}/images/${diaryImages.closed}`;
  const paperSrc = `${publicPath}/images/${selectedSpace.key}.png`;

  const affirmation = stripAffPrefix(card.text || card.affirmation || "");

  const challenge = stripChalPrefix(card.challenge || "");

  const isFavorite = useMemo(
    () =>
      favorites.some(
        (favorite) =>
          favorite.id === card.id ||
          (!favorite.id &&
            favorite.date === card.date &&
            favorite.text === card.text),
      ),
    [favorites, card],
  );

  /* =======================================================
     LISTEN FOR SETTINGS/THEME CHANGES
  ======================================================= */

  useEffect(() => {
    const refreshPrefs = () => {
      setAppPrefs(loadPrefs());
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "dearself.userprefs.v1") {
        refreshPrefs();
      }
    };

    window.addEventListener("dearself:prefs", refreshPrefs);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("dearself:prefs", refreshPrefs);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!showStreak) return undefined;
    if (streakTimer.current) window.clearTimeout(streakTimer.current);
    streakTimer.current = window.setTimeout(() => setShowStreak(false), 4200);
    return () => {
      if (streakTimer.current) window.clearTimeout(streakTimer.current);
    };
  }, [showStreak, streak]);

  useEffect(() => {
    let midnightTimer;

    const refreshDailyState = () => {
      const visit = recordDailyVisit();
      const nextCard = ensureTodayAffirmation();

      setCard(nextCard);
      setFavorites(listFavorites());
      setSavedEntryId(null);
      setStreak(visit.value);

      if (visit.isNewDay && visit.value >= 2) setShowStreak(true);
    };

    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      );

      midnightTimer = window.setTimeout(() => {
        refreshDailyState();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    };

    const refreshWhenReturning = () => {
      if (!document.hidden) refreshDailyState();
    };

    scheduleMidnightRefresh();
    window.addEventListener("focus", refreshWhenReturning);
    document.addEventListener("visibilitychange", refreshWhenReturning);

    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener("focus", refreshWhenReturning);
      document.removeEventListener("visibilitychange", refreshWhenReturning);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (savedToastTimer.current) {
        window.clearTimeout(savedToastTimer.current);
      }
    };
  }, []);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleFavorite = () => {
    const nextFavorites = toggleFavorite({
      ...card,
      id: card.id || `${card.date}-${card.text}`,
    });

    setFavorites(nextFavorites);
  };

  const handleSpaceChange = (space) => {
    setSelectedSpace(space);

    const next = savePrefs({
      selectedWritingSpaceKey: space.key,
    });

    setAppPrefs(next);

    window.dispatchEvent(new Event("dearself:prefs"));
  };

  const showJournalMessage = (message, duration = 1800) => {
    setToastMessage(message);

    if (savedToastTimer.current) {
      window.clearTimeout(savedToastTimer.current);
    }

    savedToastTimer.current = window.setTimeout(() => {
      setToastMessage("");
    }, duration);
  };

  const getEntryStyle = () => ({
    themeKey: selectedSpace.key,
    writingSpace: selectedSpace.key,
    imageSrc: paperSrc,
    fontFamily,
    fontColor,
    dateColor: fontColor,
    fontSize,
    bold: isBold,
    italic: isItalic,
  });

  const saveCurrentEntry = () => {
    if (!entryText.trim()) {
      showJournalMessage("This page is still waiting for your words.", 2600);
      return false;
    }

    const style = getEntryStyle();

    if (savedEntryId) {
      const updated = updateEntry(savedEntryId, {
        content: entryText,
        style,
      });

      if (!updated) {
        const newEntry = addEntry(entryText, style);
        setSavedEntryId(newEntry.id);
      }
    } else {
      const newEntry = addEntry(entryText, style);
      setSavedEntryId(newEntry.id);
    }

    const nextStreak = getStreak();
    setStreak(nextStreak);
    showJournalMessage("Your entry has been saved.");
    return true;
  };

  const handleClaspClick = () => {
    if (isLocked) {
      setIsLocked(false);
      return;
    }

    if (!saveCurrentEntry()) return;
    setActiveTool(null);
    setIsLocked(true);
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* =======================================================
     CLOSED JOURNAL
  ======================================================= */

  if (isLocked) {
    return (
      <main className={`diary-experience diary-experience--${activeTheme}`}>
        <header className="diary-page-heading">
          <h1 className="page-title">Today</h1>
          <p>Your thoughts are safely tucked away.</p>
        </header>

        <section className="closed-diary-stage">
          <img
            className="closed-diary-image"
            src={closedDiarySrc}
            alt={`${activeTheme} closed journal`}
          />

          <button
            type="button"
            className="closed-diary-lock-hitbox"
            onClick={handleClaspClick}
            aria-label="Unlock journal and continue writing"
            title="Unlock journal"
          />
        </section>

        <div className="closed-diary-status">
          <button
            type="button"
            className="closed-diary-open-button"
            onClick={handleClaspClick}
          >
            Unlock and continue writing
          </button>
        </div>

        {showStreak && (
          <div className="diary-streak-float">
            <StreakBadge value={streak} />
          </div>
        )}

        {toastMessage && (
          <div className="diary-save-toast" role="status">
            {toastMessage}
          </div>
        )}
      </main>
    );
  }

  /* =======================================================
     OPEN JOURNAL
  ======================================================= */

  return (
    <main
      className={`diary-experience diary-experience--${activeTheme}`}
      data-testid="daily-moment-root"
    >
      <header className="diary-page-heading">
        <h1 className="page-title">Today</h1>
      </header>

      {showStreak && (
        <div className="diary-streak-float">
          <StreakBadge value={streak} />
        </div>
      )}

      <section className="open-diary-workspace">
        {/* Left-side tools */}
        <aside className="diary-tool-rail" aria-label="Journal tools">
          <img
            className="diary-tool-rail__frame"
            src={`${publicPath}/images/diary-toolbar-frame.png`}
            alt=""
            aria-hidden="true"
          />
          <button
            type="button"
            className={activeTool === "paper" ? "active" : ""}
            aria-label="Choose journal paper"
            title="Paper"
            onClick={() =>
              setActiveTool(activeTool === "paper" ? null : "paper")
            }
          >
            <span className="diary-tool-emblem" aria-hidden="true">
              <img
                className="diary-tool-emblem__icon diary-tool-emblem__icon--paper"
                src={`${publicPath}/images/diary-icon-paper.png`}
                alt=""
              />
            </span>
          </button>

          <button
            type="button"
            className={activeTool === "style" ? "active" : ""}
            aria-label="Choose writing type"
            title="Type"
            onClick={() =>
              setActiveTool(activeTool === "style" ? null : "style")
            }
          >
            <span className="diary-tool-emblem" aria-hidden="true">
              <img
                className="diary-tool-emblem__icon diary-tool-emblem__icon--type"
                src={`${publicPath}/images/diary-icon-type.png`}
                alt=""
              />
            </span>
          </button>

          <button
            type="button"
            className={activeTool === "ink" ? "active" : ""}
            aria-label="Choose ink color"
            title="Ink"
            onClick={() => setActiveTool(activeTool === "ink" ? null : "ink")}
          >
            <span className="diary-tool-emblem" aria-hidden="true">
              <img
                className="diary-tool-emblem__icon diary-tool-emblem__icon--ink"
                src={`${publicPath}/images/diary-icon-ink.png`}
                alt=""
              />
            </span>
          </button>

          <button
            type="button"
            className={`diary-favorite-tool ${isFavorite ? "active" : ""}`}
            onClick={handleFavorite}
            aria-label={
              isFavorite
                ? "Remove affirmation from favorites"
                : "Favorite this affirmation"
            }
            title={isFavorite ? "Remove favorite" : "Favorite affirmation"}
          >
            <span className="diary-tool-emblem" aria-hidden="true">
              <img
                className="diary-tool-emblem__icon diary-tool-emblem__icon--heart"
                src={`${publicPath}/images/heart-doodle-v2.png?v=3`}
                alt=""
              />
            </span>
          </button>
        </aside>

        {activeTool && (
          <section className="diary-tool-panel">
            <button
              type="button"
              className="diary-tool-panel__close"
              onClick={() => setActiveTool(null)}
              aria-label="Close journal tools"
            >
              ×
            </button>

            {activeTool === "paper" && (
              <>
                <h2>Writing Space</h2>

                <div className="diary-paper-options">
                  {WRITING_SPACES.map((space) => (
                    <button
                      key={space.key}
                      type="button"
                      className={`diary-paper-option ${
                        selectedSpace.key === space.key ? "active" : ""
                      }`}
                      onClick={() => handleSpaceChange(space)}
                    >
                      <img
                        src={`${publicPath}/images/${space.key}.png`}
                        alt=""
                      />

                      <span>{space.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTool === "style" && (
              <>
                <h2>Writing Style</h2>

                <label className="diary-control-field">
                  <span>Font</span>

                  <div className="diary-combobox diary-font-combobox">
                    <input
                      type="text"
                      value={fontSearch}
                      onFocus={() => setIsFontMenuOpen(true)}
                      onChange={(event) => {
                        setFontSearch(event.target.value);
                        setIsFontMenuOpen(true);
                      }}
                      onBlur={() => {
                        const exactFont = FONT_OPTIONS.find(
                          (font) =>
                            font.value.toLowerCase() ===
                            fontSearch.trim().toLowerCase(),
                        );
                        if (exactFont) {
                          setFontFamily(exactFont.value);
                          setFontSearch(exactFont.label);
                        } else {
                          setFontSearch(fontFamily);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") setIsFontMenuOpen(true);
                        if (event.key === "Escape") setIsFontMenuOpen(false);
                      }}
                      role="combobox"
                      aria-label="Writing font"
                      aria-expanded={isFontMenuOpen}
                      aria-controls="diary-font-menu"
                    />

                    <button
                      type="button"
                      className="diary-combobox__toggle"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsFontMenuOpen((open) => !open)}
                      aria-label="Show font choices"
                      aria-expanded={isFontMenuOpen}
                    >
                      <span aria-hidden="true" />
                    </button>

                    {isFontMenuOpen && (
                      <div
                        id="diary-font-menu"
                        className="diary-combobox__menu diary-combobox__menu--fonts"
                        role="listbox"
                      >
                        {FONT_OPTIONS.filter(
                          (font) =>
                            font.label
                              .toLowerCase()
                              .includes(fontSearch.trim().toLowerCase()) ||
                            fontSearch === fontFamily,
                        ).map((font) => (
                          <button
                            key={font.value}
                            type="button"
                            role="option"
                            aria-selected={fontFamily === font.value}
                            style={{ fontFamily: font.value }}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setFontFamily(font.value);
                              setFontSearch(font.label);
                              setIsFontMenuOpen(false);
                            }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                <label className="diary-control-field">
                  <span>Size</span>

                  <div className="diary-combobox diary-size-combobox">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={fontSizeInput}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setFontSizeInput(nextValue);

                        if (/^\d{1,2}(?:\.\d)?$/.test(nextValue)) {
                          const nextSize = Number(nextValue);
                          if (nextSize >= 8 && nextSize <= 72) {
                            setFontSize(nextSize);
                          }
                        }
                      }}
                      onBlur={() => {
                        const nextSize = Number(fontSizeInput);
                        const safeSize = Number.isFinite(nextSize)
                          ? Math.min(
                              72,
                              Math.max(8, Math.round(nextSize * 2) / 2),
                            )
                          : 20;
                        setFontSize(safeSize);
                        setFontSizeInput(String(safeSize));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") setIsSizeMenuOpen(true);
                        if (event.key === "Escape") setIsSizeMenuOpen(false);
                      }}
                      role="combobox"
                      aria-label="Writing font size in pixels"
                      aria-expanded={isSizeMenuOpen}
                      aria-controls="diary-font-size-menu"
                      placeholder="Type a size"
                    />

                    <button
                      type="button"
                      className="diary-combobox__toggle"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsSizeMenuOpen((open) => !open)}
                      aria-label="Show common font sizes"
                      aria-expanded={isSizeMenuOpen}
                    >
                      <span aria-hidden="true" />
                    </button>

                    {isSizeMenuOpen && (
                      <div
                        id="diary-font-size-menu"
                        className="diary-combobox__menu diary-combobox__menu--sizes"
                        role="listbox"
                      >
                        {FONT_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            role="option"
                            aria-selected={fontSize === size}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setFontSize(size);
                              setFontSizeInput(String(size));
                              setIsSizeMenuOpen(false);
                            }}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                <div className="diary-style-buttons">
                  <button
                    type="button"
                    className={isBold ? "active" : ""}
                    onClick={() => setIsBold((value) => !value)}
                  >
                    Bold
                  </button>

                  <button
                    type="button"
                    className={isItalic ? "active" : ""}
                    onClick={() => setIsItalic((value) => !value)}
                  >
                    Italic
                  </button>
                </div>
              </>
            )}

            {activeTool === "ink" && (
              <>
                <h2>Ink Color</h2>

                <div className="diary-ink-options">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={fontColor === color ? "selected" : ""}
                      style={{ backgroundColor: color }}
                      onClick={() => setFontColor(color)}
                      aria-label={`Use ink color ${color}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Physical diary */}
        <div className="open-diary-stage">
          <img
            className="open-diary-image"
            src={openDiarySrc}
            alt={`${activeTheme} open journal`}
          />

          <SignaturePad />

          {isFavorite && (
            <img
              className="diary-drawn-heart"
              src={`${publicPath}/images/heart-doodle-v2.png?v=3`}
              alt="Favorited"
            />
          )}

          {/* Handwritten message on inside cover */}
          <section className="diary-left-message">
            <div className="diary-left-message__greeting">Dear Self,</div>

            <p
              className="diary-left-message__affirmation"
              data-testid="daily-moment-text"
            >
              {affirmation}
            </p>

            <p className="diary-left-message__challenge-intro">
              Today, I’ll gently challenge myself to...
            </p>

            <p className="diary-left-message__challenge">{challenge}</p>
          </section>

          {/* Selected journal artwork fitted to right page */}
          <section className="diary-right-page">
            <img
              className="diary-paper-artwork"
              src={paperSrc}
              alt={selectedSpace.name}
            />

            <div
              className="diary-entry-date"
              style={{
                color: fontColor,
                fontFamily,
              }}
            >
              {formattedDate}
            </div>

            <textarea
              className="diary-entry-textarea"
              value={entryText}
              onChange={(event) => setEntryText(event.target.value)}
              placeholder="Write to yourself..."
              spellCheck="true"
              style={{
                color: fontColor,
                fontFamily,
                fontWeight: isBold ? 700 : 400,
                fontStyle: isItalic ? "italic" : "normal",
                fontSize: `${fontSize}px`,
              }}
            />
          </section>

          {/* Invisible button over the physical open clasp */}
          <button
            type="button"
            className="open-diary-clasp-hitbox"
            onClick={handleClaspClick}
            aria-label="Save entry and lock journal"
            title="Save and lock journal"
          />
        </div>
      </section>

      <p className="diary-lock-instruction">
        Fasten the clasp when you are finished writing.
      </p>

      {toastMessage && (
        <div className="diary-save-toast" role="status">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
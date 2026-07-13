// src/App.js
import React, { useEffect, useMemo, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import "./styles/App.css";
import "./styles/theme.css";
import JournalEntry from "./components/JournalEntry";
import PastEntries from "./components/PastEntries";
import Favorites from "./components/Favorites";
import Settings from "./components/Settings";
import { applyPrefsToDOM, loadPrefs } from "./utils/prefs";

const TAB_META = {
  today: { label: "Today", path: "/today", element: <JournalEntry /> },
  past: {
    label: "Past Entries",
    path: "/past-entries",
    element: <PastEntries />,
  },
  favorites: { label: "Favorites", path: "/favorites", element: <Favorites /> },
  settings: { label: "Settings", path: "/settings", element: <Settings /> },
};

function AppShell() {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  useEffect(() => {
    applyPrefsToDOM(prefs);
  }, []);
  useEffect(() => {
    const update = () => setPrefs(loadPrefs());
    const storage = (event) => {
      if (event.key === "dearself.userprefs.v1") update();
    };
    window.addEventListener("dearself:prefs", update);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("dearself:prefs", update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const order = useMemo(
    () =>
      (prefs.navOrder || Object.keys(TAB_META)).filter((key) => TAB_META[key]),
    [prefs.navOrder],
  );
  const landingPath = TAB_META[prefs.landingPage]?.path || "/today";
  return (
    <>
      <nav className="app-nav">
        {order.map((key) => (
          <NavLink key={key} to={TAB_META[key].path} end>
            {TAB_META[key].label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to={landingPath} replace />} />
        {Object.entries(TAB_META).map(([key, meta]) => (
          <Route key={key} path={meta.path} element={meta.element} />
        ))}
        <Route path="*" element={<Navigate to={landingPath} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <AppShell />
      </div>
    </Router>
  );
}
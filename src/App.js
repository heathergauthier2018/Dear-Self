// src/App.js
import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import './styles/App.css';
import './styles/theme.css';

import JournalEntry from './components/JournalEntry';
import PastEntries from './components/PastEntries';
import Favorites from './components/Favorites';
import Settings from './components/Settings';

import { loadPrefs, applyPrefsToDOM } from './utils/prefs';

const TAB_META = {
  today:     { label: 'Today',        path: '/today',        element: <JournalEntry /> },
  past:      { label: 'Past Entries', path: '/past-entries', element: <PastEntries /> },
  favorites: { label: 'Favorites',    path: '/favorites',    element: <Favorites /> },
  settings:  { label: 'Settings',     path: '/settings',     element: <Settings /> },
};

function AppShell() {
  const [prefs, setPrefs] = useState(() => loadPrefs());

  // Apply CSS variables/classes once
  useEffect(() => { applyPrefsToDOM(prefs); }, []);

  // Listen for settings updates (Settings.js dispatches 'dearself:prefs')
  useEffect(() => {
    const onPrefs = () => setPrefs(loadPrefs());
    const onStorage = (e) => { if (e.key === 'dearself.userprefs.v1') setPrefs(loadPrefs()); };
    window.addEventListener('dearself:prefs', onPrefs);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('dearself:prefs', onPrefs);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const order = useMemo(() => prefs.navOrder || ['today','past','favorites','settings'], [prefs]);

  const firstTabPath = TAB_META[order[0]]?.path || '/today';

  return (
    <>
      {/* Theme-aware top nav */}
      <nav className="app-nav">
        {order.map(key => {
          const meta = TAB_META[key];
          return (
            <NavLink key={key} to={meta.path} end>
              {meta.label}
            </NavLink>
          );
        })}
      </nav>

      <Routes>
        {/* Default landing: redirect root to first tab */}
        <Route path="/" element={<Navigate to={firstTabPath} replace />} />
        {order.map(key => {
          const meta = TAB_META[key];
          return <Route key={key} path={meta.path} element={meta.element} />;
        })}
        {/* Fallback: anything unknown -> first tab */}
        <Route path="*" element={<Navigate to={firstTabPath} replace />} />
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

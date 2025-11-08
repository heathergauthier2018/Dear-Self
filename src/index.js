import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';

/**
 * Initialize theme before React mounts to avoid a light/dark flash.
 */
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : false;
    document.body.classList.toggle('dark-mode', isDark);
  } catch {
    // no-op if localStorage is unavailable
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals();

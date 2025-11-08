// src/components/Favorites.js
import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import { listFavoriteItems, removeFavorite, toggleFavorite } from '../services/affirmationEngine';
import { useNavigate } from 'react-router-dom';

export default function Favorites() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);

  // Undo state
  const [undo, setUndo] = useState(null); // { id, item }
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    setItems(listFavoriteItems());
  }, []);

  const refresh = () => setItems(listFavoriteItems());

  const onRemove = (item) => {
    removeFavorite(item.id || item.text);
    refresh();
    if (timer) clearTimeout(timer);
    setUndo({ id: item.id, item });
    setTimer(setTimeout(() => setUndo(null), 7000)); // 7s to undo
  };

  const onUndo = () => {
    if (!undo) return;
    if (timer) clearTimeout(timer);
    // Re-add the normalized favorite (toggleFavorite expects a single item object)
    toggleFavorite(undo.item);
    refresh();
    setUndo(null);
  };

  return (
    <div className="page-wrap">
      <section className="card shadow-md" style={{ background: '#FFF9F1' }}>
        <h2 className="brand-subtitle page-title" style={{ marginTop: 0, textAlign: 'center' }}>
          Favorites
        </h2>

        {items.length === 0 ? (
          <p style={{ padding: '8px 0 16px' }}>No favorites yet. Tap the heart on Today to save one.</p>
        ) : (
          <div className="fav-list">
            {items.map((it) => (
              <article key={it.id || it.text} className="fav-card">
                {it.category ? <span className="chip" style={{ marginBottom: 8 }}>{it.category}</span> : null}
                <p className="fav-line">
                  <strong>Affirmation:</strong> {it.text || '—'}
                </p>
                <p className="fav-line">
                  <strong>Challenge:</strong> {it.challenge || '—'}
                </p>
                <div className="fav-actions">
                  <button className="btn-danger" onClick={() => onRemove(it)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="row" style={{ marginTop: 16 }}>
          <button className="primary" onClick={() => nav('/')}>← Back to Today</button>
        </div>
      </section>

      {/* Undo snackbar */}
      {undo && (
        <div className="undo-bar">
          <span>Favorite removed.</span>
          <button className="undo-btn" onClick={onUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}

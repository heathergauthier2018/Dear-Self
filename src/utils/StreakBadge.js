// src/utils/StreakBadge.js
import React, { useEffect, useRef, useState } from 'react';

/**
 * StreakBadge
 * - Visible only when value >= 2 (returns null otherwise).
 * - Pops quickly on each increment.
 * - On the FIRST threshold crossing (1 -> 2), adds a brief glow.
 *
 * Props:
 *   value: number
 *   compact?: boolean
 */
export default function StreakBadge({ value = 0, compact = false }) {
  // Hooks must always run, even if we later render null
  const [pop, setPop] = useState(false);
  const [firstGlow, setFirstGlow] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    // If hidden, skip all animation logic
    if (value < 2) {
      prev.current = value;
      setPop(false);
      setFirstGlow(false);
      return;
    }

    const was = prev.current;
    const now = value;
    prev.current = now;

    const justReached = was < 2 && now >= 2;   // first time becoming visible
    const increased   = now >= 2 && now > was; // subsequent increments

    if (!(justReached || increased)) return;

    setPop(true);
    if (justReached) setFirstGlow(true);

    const t = setTimeout(() => {
      setPop(false);
      if (justReached) setFirstGlow(false);
    }, justReached ? 520 : 300);

    return () => clearTimeout(t);
  }, [value]);

  // Only render when value >= 2
  if (value < 2) return null;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: compact ? '6px 10px' : '7px 12px',
    borderRadius: 999,
    border: '1px solid #ffd8a8',
    background: '#fff4e5',
    color: '#8a5a00',
    fontWeight: 800,
    fontSize: compact ? 13 : 14,
    lineHeight: 1,
    transform: pop ? 'scale(1.08)' : 'scale(1)',
    transition: 'transform 180ms ease, box-shadow 220ms ease',
    boxShadow: firstGlow ? '0 10px 28px rgba(245, 158, 11, .35)' : 'none',
    userSelect: 'none',
  };

  const flameStyle = {
    fontSize: compact ? 14 : 16,
    filter: pop ? 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' : 'none',
    transform: pop ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'transform 180ms ease',
  };

  const numberStyle = {
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.2,
  };

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${value} day streak`}
      title={`${value} day streak`}
      style={baseStyle}
    >
      <span aria-hidden="true" style={flameStyle}>🔥</span>
      <span style={numberStyle}>{value}</span>
      <span aria-hidden="true">days</span>
    </span>
  );
}

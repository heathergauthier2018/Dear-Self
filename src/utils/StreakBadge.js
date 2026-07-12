// src/utils/StreakBadge.js
import React from "react";

/** A short-lived celebration shown only when a new daily check-in is earned. */
export default function StreakBadge({ value = 0 }) {
  if (value < 2) return null;

  return (
    <div
      className="streak-celebration"
      role="status"
      aria-live="polite"
      aria-label={`${value} day streak. ${value} days of showing up for yourself.`}
    >
      <span className="streak-celebration__flame" aria-hidden="true">
        <img
          className="streak-celebration__flame-art"
          src={`${process.env.PUBLIC_URL || ""}/images/dear-self-streak-flame.png`}
          alt=""
        />
      </span>

      <span className="streak-celebration__copy">
        <strong>{value} days</strong>
        <small>of showing up for yourself</small>
      </span>
    </div>
  );
}
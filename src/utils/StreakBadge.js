// src/utils/StreakBadge.js
import React from "react";

/** Celebration or persistent compact indicator for consecutive check-ins. */
export default function StreakBadge({ value = 0, variant = "celebration" }) {
  if (value < 1) return null;

  const compact = variant === "compact";
  const rotatingEncouragements = [
    "Keep showing up",
    "Your rhythm is taking root",
    "Small steps, beautifully kept",
    "You kept your promise today",
    "Another day of choosing you",
  ];

  const milestoneEncouragements = {
    7: "One week of choosing you",
    14: "Two weeks, beautifully kept",
    30: "A month of showing up",
    50: "Fifty days, softly strong",
    100: "One hundred days—remarkable",
    365: "A year of choosing you",
  };

  const encouragement =
    value === 1
      ? "A beautiful beginning"
      : milestoneEncouragements[value] ||
        rotatingEncouragements[(value - 2) % rotatingEncouragements.length];

  return (
    <div
      className={`streak-celebration${compact ? " streak-celebration--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${value} day streak. ${encouragement}.`}
    >
      <span className="streak-celebration__flame" aria-hidden="true">
        <img
          className="streak-celebration__flame-art"
          src={`${process.env.PUBLIC_URL || ""}/images/dear-self-streak-flame.png`}
          alt=""
        />
      </span>

      <span className="streak-celebration__copy">
        <strong>{value} day streak</strong>
        <small>{encouragement}</small>
      </span>
    </div>
  );
}
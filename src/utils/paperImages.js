// src/utils/paperImages.js
// Simple 3-tab grouping that matches your folder of images.
const make = (key, label, items) => ({ key, label, items });

const list = (prefix, from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const n = from + i;
    return {
      label: `${prefix} ${n}`,
      src: `${prefix.toLowerCase()}${n}.png`,
    };
  });

// --- groups ---
// Minimalist & Professional: your "minimal*.png"
const minimalItems = [
  ...list("minimal", 1, 6),
];

// Whimsical: your "whimsical*.png"
const whimsicalItems = [
  ...list("whimsical", 1, 10),
];

// Soft & Elegant: mix of coquette + florals + romantic
const softElegantItems = [
  ...list("coquette", 1, 8),
  ...list("florals", 1, 5),
  ...list("romantic", 1, 6),
];

export const THEME_GROUPS = {
  minimal: make("minimal", "Minimalist & Professional", minimalItems),
  whimsical: make("whimsical", "Whimsical", whimsicalItems),
  soft: make("soft", "Soft & Elegant", softElegantItems),
};

// helper for an initial paper
export const getDefaultPaper = () => whimsicalItems[0]?.src || "whimsical1.png";

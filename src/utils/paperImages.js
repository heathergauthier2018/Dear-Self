// src/utils/paperImages.js

const PAPERS = [
  {
    id: "quiet-linen",
    name: "Quiet Linen",
    description: "Clean, calm, and timeless.",
    src: "quiet-linen.png",
  },

  {
    id: "botanical-calm",
    name: "Botanical Calm",
    description: "Soft greenery for peaceful reflection.",
    src: "botanical-calm.png",
  },

  {
    id: "moonlit-reflection",
    name: "Moonlit Reflection",
    description: "A gentle evening space for deeper thoughts.",
    src: "moonlit-reflection.png",
  },

  {
    id: "letter-to-me",
    name: "Letter to Myself",
    description: "Warm, personal, and heartfelt.",
    src: "letter-to-me.png",
  },
];

export default PAPERS;

export const getDefaultPaper = () => PAPERS[0].src;
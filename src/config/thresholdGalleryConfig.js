export const THRESHOLD_STORAGE_KEY = "dearself.threshold.latest";

export const THRESHOLD_DOORS = [
  {
    id: "one-minute",
    label: "One Minute",
    ariaLabel: "Choose a one minute experience",
    className: "threshold-gallery__door--one-minute",
    destination: "/today",
  },
  {
    id: "few-minutes",
    label: "A Few Minutes",
    ariaLabel: "Choose an experience lasting a few minutes",
    className: "threshold-gallery__door--few-minutes",
    destination: "/today",
  },
  {
    id: "stay-awhile",
    label: "I Want to Stay Awhile",
    ariaLabel: "Choose a longer stay awhile experience",
    className: "threshold-gallery__door--stay-awhile",
    destination: "/today",
  },
];

const SUPPORT_PROMPTS = {
  Quiet: "What might become clearer if I gave myself one quiet minute?",
  Encouragement: "What is one kind thing I need to hear today?",
  Perspective: "What might soften if I looked at this with gentler eyes?",
  "A small challenge": "What is one small, brave choice I can make today?",
  Rest: "What would rest look like if I did not have to earn it?",
  "A gentle prompt": "What truth feels ready to be written softly?",
  "Space to write": "What wants a little space on the page today?",
  Grounding: "What can I notice right here, right now?",
  Reassurance: "What can I allow to be enough for this moment?",
  Inspiration: "What small possibility still feels alive in me?",
  "An affirmation": "What words would I most like to carry with me today?",
  "I'm not sure yet": "What would feel kindest for the next few minutes?",
};

function naturalList(values) {
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

export function readLatestCheckIn() {
  try {
    const raw = localStorage.getItem("dearself.gentleCheckIn.latest");
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

export function buildMirrorMessage(checkIn) {
  const feelings = Array.isArray(checkIn?.feelings)
    ? checkIn.feelings.filter(Boolean).slice(0, 3)
    : [];
  const support = Array.isArray(checkIn?.support)
    ? checkIn.support.find((item) => SUPPORT_PROMPTS[item])
    : null;

  return {
    reassurance: feelings.length
      ? `I can make room for feeling ${naturalList(feelings)} and still be gentle with myself.`
      : "I am allowed to arrive exactly as I am.",
    prompt:
      SUPPORT_PROMPTS[support] ||
      "What would be one tiny, kind choice for me today?",
  };
}

export function saveThresholdChoice(door, checkIn) {
  try {
    localStorage.setItem(
      THRESHOLD_STORAGE_KEY,
      JSON.stringify({
        duration: door.id,
        label: door.label,
        selectedAt: new Date().toISOString(),
        checkIn: checkIn || null,
      }),
    );
  } catch {
    // The experience remains usable when storage is unavailable.
  }
}
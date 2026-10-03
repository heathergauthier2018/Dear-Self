const COLLECTIONS_KEY = "dearself.archive.collections.v1";

export const CONTENT_TYPES = Object.freeze({
  JOURNAL: "journal-entry",
  ONE_MINUTE: "one-minute-note",
  GUIDED: "guided-reflection",
  LETTER: "letter",
  KEEPSAKE: "keepsake",
  REFLECTION: "periodic-reflection",
});

export const SYSTEM_COLLECTIONS = Object.freeze([
  {
    id: "all",
    label: "All Reflections",
    description: "Every piece you have chosen to keep.",
    type: null,
  },
  {
    id: "journal-pages",
    label: "Journal Pages",
    description: "The full pages written in your Dear Self journal.",
    type: CONTENT_TYPES.JOURNAL,
  },
  {
    id: "one-minute-notes",
    label: "One-Minute Notes",
    description: "Small moments when you chose to meet yourself.",
    type: CONTENT_TYPES.ONE_MINUTE,
  },
  {
    id: "guided-reflections",
    label: "Guided Reflections",
    description: "Responses that began with a gentle prompt.",
    type: CONTENT_TYPES.GUIDED,
  },
  {
    id: "letters",
    label: "Letters to Myself",
    description: "Words written across time and versions of you.",
    type: CONTENT_TYPES.LETTER,
  },
  {
    id: "keepsakes",
    label: "Keepsakes",
    description: "Promises, hopes, victories, and things worth remembering.",
    type: CONTENT_TYPES.KEEPSAKE,
  },
  {
    id: "reflections",
    label: "Monthly & Seasonal",
    description: "The chapters and seasons you have lived through.",
    type: CONTENT_TYPES.REFLECTION,
  },
]);

const safeRead = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("dearself:archive"));
    return true;
  } catch {
    return false;
  }
};

export function normalizeArchiveItem(entry = {}) {
  return {
    ...entry,
    type: entry.type || CONTENT_TYPES.JOURNAL,
    title: entry.title || "",
    updatedIso: entry.updatedIso || entry.iso,
    personalCollectionIds: Array.isArray(entry.personalCollectionIds)
      ? [...new Set(entry.personalCollectionIds.filter(Boolean))]
      : [],
    metadata:
      entry.metadata && typeof entry.metadata === "object"
        ? entry.metadata
        : {},
  };
}

export function listPersonalCollections() {
  const collections = safeRead(COLLECTIONS_KEY, []);
  return Array.isArray(collections) ? collections : [];
}

export function createPersonalCollection({ name, description = "" }) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;

  const collection = {
    id: `collection-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName.slice(0, 60),
    description: String(description || "").trim().slice(0, 180),
    createdIso: new Date().toISOString(),
  };
  safeWrite(COLLECTIONS_KEY, [...listPersonalCollections(), collection]);
  return collection;
}

export function updatePersonalCollection(id, patch = {}) {
  const collections = listPersonalCollections();
  const index = collections.findIndex((collection) => collection.id === id);
  if (index < 0) return false;
  collections[index] = {
    ...collections[index],
    ...(patch.name !== undefined
      ? { name: String(patch.name).trim().slice(0, 60) }
      : {}),
    ...(patch.description !== undefined
      ? { description: String(patch.description).trim().slice(0, 180) }
      : {}),
  };
  return safeWrite(COLLECTIONS_KEY, collections);
}

export function deletePersonalCollection(id) {
  return safeWrite(
    COLLECTIONS_KEY,
    listPersonalCollections().filter((collection) => collection.id !== id),
  );
}

export function getSystemCollectionForType(type) {
  return SYSTEM_COLLECTIONS.find((collection) => collection.type === type);
}

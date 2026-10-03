import {
  CONTENT_TYPES,
  createPersonalCollection,
  deletePersonalCollection,
  listPersonalCollections,
  normalizeArchiveItem,
} from "./archiveStorage";

describe("archive storage", () => {
  beforeEach(() => localStorage.clear());

  test("treats an existing journal entry as a journal page without losing it", () => {
    const legacy = {
      id: "legacy-1",
      iso: "2026-07-22T10:00:00.000Z",
      content: "Something I want to remember.",
      style: { themeKey: "sage" },
    };

    expect(normalizeArchiveItem(legacy)).toMatchObject({
      ...legacy,
      type: CONTENT_TYPES.JOURNAL,
      personalCollectionIds: [],
      metadata: {},
    });
  });

  test("creates a personal collection as a reference container", () => {
    const collection = createPersonalCollection({
      name: "Things I’m Learning",
      description: "Reflections I want to revisit",
    });

    expect(collection.name).toBe("Things I’m Learning");
    expect(listPersonalCollections()).toEqual([collection]);
  });

  test("deleting a personal collection only removes the collection", () => {
    const collection = createPersonalCollection({ name: "Hard Days" });
    const entry = normalizeArchiveItem({
      id: "entry-1",
      content: "I made it through.",
      personalCollectionIds: [collection.id],
    });

    expect(deletePersonalCollection(collection.id)).toBe(true);
    expect(listPersonalCollections()).toEqual([]);
    expect(entry.content).toBe("I made it through.");
  });
});

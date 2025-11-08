// src/utils/probeImages.js
// Dynamically discover images in /public/images by probing common prefixes.

const PUBLIC_IMAGES = `${process.env.PUBLIC_URL || ''}/images`;

/**
 * Probes /images/<prefix><n>.png for n=1..max and resolves to the list that load.
 * Returns: Promise<string[]> of file names (e.g., ["whimsical1.png", "whimsical2.png"])
 */
export function probeByPrefix(prefix, max = 20) {
  const tryOne = (n) =>
    new Promise((resolve) => {
      const file = `${prefix}${n}.png`;
      const url = `${PUBLIC_IMAGES}/${file}`;
      const img = new Image();
      img.onload = () => resolve(file);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const tasks = Array.from({ length: max }, (_, i) => tryOne(i + 1));
  return Promise.all(tasks).then((results) => results.filter(Boolean));
}

/**
 * Probes multiple groups and returns a map: { GroupName: [files...] }
 * groupsConfig: { [groupLabel]: { prefix: string, max?: number } }
 */
export async function probeGroups(groupsConfig) {
  const entries = await Promise.all(
    Object.entries(groupsConfig).map(async ([label, cfg]) => {
      const files = await probeByPrefix(cfg.prefix, cfg.max ?? 20);
      return [label, files];
    })
  );

  // Remove empty groups
  return entries.reduce((acc, [label, files]) => {
    if (files.length) acc[label] = files;
    return acc;
  }, {});
}

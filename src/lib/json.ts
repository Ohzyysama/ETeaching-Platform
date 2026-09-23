/** Defensive parsers for the JSON arrays stored in text columns. */

export function parseImages(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** annotations: array aligned with images (null for unannotated photos). */
export function parseAnnotations(json: string): (string | null)[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : null)) : [];
  } catch {
    return [];
  }
}

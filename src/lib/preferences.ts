export const MAX_PREFERENCES = 10;
export const MAX_PREFERENCE_LENGTH = 50;

export const sanitizePreferenceValue = (value: string): string => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PREFERENCE_LENGTH);
};

export const sanitizePreferencesList = (items?: string[] | null): string[] => {
  if (!Array.isArray(items)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    if (result.length >= MAX_PREFERENCES) return;
    const cleaned = sanitizePreferenceValue(item);
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });

  return result;
};

export const arePreferencesEqual = (a?: string[] | null, b?: string[] | null): boolean => {
  const first = sanitizePreferencesList(a ?? []);
  const second = sanitizePreferencesList(b ?? []);

  if (first.length !== second.length) return false;
  return first.every((item, index) => item.toLowerCase() === second[index].toLowerCase());
};

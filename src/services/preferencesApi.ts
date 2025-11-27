import { apiClient, extractData } from "@/lib/api-client";

export interface PreferenceOption {
  value: string;
  label: string;
}

export const PREFERENCE_OPTIONS_QUERY_KEY = ["preferences", "options"] as const;

const normalizeOption = (option: any): PreferenceOption | null => {
  if (!option || typeof option !== "object") return null;
  const rawValue = (option as Record<string, unknown>).value;
  const rawLabel = (option as Record<string, unknown>).label;
  const value = typeof rawValue === "string" ? rawValue.trim() : String(rawValue ?? "").trim();
  const label = typeof rawLabel === "string" ? rawLabel.trim() : String(rawLabel ?? value).trim();
  if (!value) return null;
  return { value, label: label || value };
};

export const fetchPreferenceOptions = async (): Promise<PreferenceOption[]> => {
  const res = await apiClient.get("/preferences/options");
  const payload = extractData<unknown>(res);

  const rawOptions = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.options)
      ? (payload as any).options
      : [];

  const seen = new Set<string>();
  const normalized: PreferenceOption[] = [];
  rawOptions.forEach((option) => {
    const normalizedOption = normalizeOption(option);
    if (!normalizedOption) return;
    const key = normalizedOption.value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(normalizedOption);
  });

  return normalized;
};

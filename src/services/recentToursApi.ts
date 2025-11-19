import { apiClient } from "@/lib/api-client";
import type { PublicTour } from "@/services/publicApi";

export interface RecentTourRecord {
  tour: PublicTour;
  viewed_at?: string | null;
  view_count?: number | null;
  [key: string]: unknown;
}

export type RecentToursResponse = {
  data: RecentTourRecord[];
};

const normalizeRecentList = (payload: unknown): RecentTourRecord[] => {
  if (Array.isArray(payload)) {
    return payload as RecentTourRecord[];
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as RecentTourRecord[];
    if (Array.isArray(record.recent)) return record.recent as RecentTourRecord[];
  }
  return [];
};

const parseViewedAt = (value: string | null | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function fetchRecentTours(): Promise<RecentTourRecord[]> {
  const res = await apiClient.get("/recent-tours");
  const payload = res.data as RecentToursResponse | RecentTourRecord[] | Record<string, unknown>;
  const recent = normalizeRecentList(payload);
  return recent
    .slice()
    .sort((a, b) => parseViewedAt(b.viewed_at) - parseViewedAt(a.viewed_at));
}

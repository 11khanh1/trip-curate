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

export async function fetchRecentTours(): Promise<RecentTourRecord[]> {
  const res = await apiClient.get("/recent-tours");
  const payload = res.data as RecentToursResponse | RecentTourRecord[] | Record<string, unknown>;

  if (Array.isArray(payload)) {
    return payload as RecentTourRecord[];
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) {
      return payload.data as RecentTourRecord[];
    }
    if (Array.isArray((payload as { recent?: unknown }).recent)) {
      return (payload as { recent: RecentTourRecord[] }).recent;
    }
  }

  return [];
}

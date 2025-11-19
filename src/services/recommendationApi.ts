import { apiClient, extractData } from "@/lib/api-client";
import type { PublicTour } from "./publicApi";

export type RecommendationReason =
  | "ml_collaborative_filtering"
  | "content_match"
  | "popular"
  | "shared_tags"
  | "same_destination"
  | "same_type"
  | string;

export interface RecommendationItem {
  tour_id: string;
  score?: number | null;
  reasons?: RecommendationReason[];
  tour?: PublicTour | null;
}

export interface RecommendationMeta {
  generated_at?: string;
  count?: number;
  base_tour_id?: string | number | null;
  has_personalized_signals?: boolean;
  personalized_results?: boolean;
  [key: string]: unknown;
}

export interface RecommendationResponse {
  data: RecommendationItem[];
  meta?: RecommendationMeta;
}

const normalizeRecommendationPayload = (payload: unknown): RecommendationResponse => {
  if (!payload || typeof payload !== "object") {
    return { data: [] };
  }

  const record = payload as Record<string, unknown>;
  let data: RecommendationItem[] = [];
  if (Array.isArray(record.data)) {
    data = record.data as RecommendationItem[];
  } else if (record.data && typeof record.data === "object" && Array.isArray((record.data as { data?: unknown }).data)) {
    data = ((record.data as { data?: RecommendationItem[] }).data ?? []) as RecommendationItem[];
  } else if (Array.isArray(record.recommendations)) {
    data = record.recommendations as RecommendationItem[];
  } else if (Array.isArray(record.items)) {
    data = record.items as RecommendationItem[];
  } else if (Array.isArray(record.records)) {
    data = record.records as RecommendationItem[];
  }

  let meta: RecommendationMeta | undefined;
  if (record.meta && typeof record.meta === "object") {
    meta = record.meta as RecommendationMeta;
  } else {
    const additional = record.additional;
    if (additional && typeof additional === "object") {
      const additionalRecord = additional as Record<string, unknown>;
      if (additionalRecord.meta && typeof additionalRecord.meta === "object") {
        meta = additionalRecord.meta as RecommendationMeta;
      }
    }
  }

  return { data, meta };
};

export const fetchPersonalizedRecommendations = async (limit = 10): Promise<RecommendationResponse> => {
  const response = await apiClient.get("/recommendations", {
    params: { limit },
  });
  const payload = extractData<unknown>(response);
  return normalizeRecommendationPayload(payload);
};

export const fetchSimilarRecommendations = async (
  tourId: string | number,
  limit = 8,
): Promise<RecommendationResponse> => {
  const response = await apiClient.get(`/recommendations/similar/${tourId}`, {
    params: { limit },
  });
  const payload = extractData<unknown>(response);
  return normalizeRecommendationPayload(payload);
};

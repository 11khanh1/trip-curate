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

export interface RecommendationResponse {
  data: RecommendationItem[];
  meta?: {
    generated_at?: string;
    count?: number;
    base_tour_id?: string | number | null;
    [key: string]: unknown;
  };
}

export const fetchPersonalizedRecommendations = async (limit = 10): Promise<RecommendationResponse> => {
  const response = await apiClient.get("/recommendations", {
    params: { limit },
  });
  const payload = extractData<RecommendationResponse>(response);
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta,
  };
};

export const fetchSimilarRecommendations = async (
  tourId: string | number,
  limit = 8,
): Promise<RecommendationResponse> => {
  const response = await apiClient.get(`/recommendations/similar/${tourId}`, {
    params: { limit },
  });
  const payload = extractData<RecommendationResponse>(response);
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta,
  };
};

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "./publicApi";

export interface ReviewUserSummary {
  id?: string | number;
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

export interface ReviewBookingSummary {
  id?: string | number;
  code?: string | null;
  tour_id?: string | number;
  tour_schedule_id?: string | number;
  [key: string]: unknown;
}

export interface ReviewScheduleSummary {
  id?: string | number;
  tour_id?: string | number;
  start_date?: string | null;
  end_date?: string | null;
  title?: string | null;
  [key: string]: unknown;
}

export interface TourReview {
  id: string | number;
  rating: number;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: ReviewUserSummary | null;
  booking?: ReviewBookingSummary | null;
  tour_schedule?: ReviewScheduleSummary | null;
  [key: string]: unknown;
}

export interface ReviewListMeta {
  average?: number | null;
  count?: number | null;
}

export interface TourReviewListResponse {
  reviews: Paginated<TourReview>;
  rating?: ReviewListMeta;
}

export interface ReviewQueryParams {
  per_page?: number;
  page?: number;
}

export async function fetchTourReviews(
  tourId: string | number,
  params: ReviewQueryParams = {},
): Promise<TourReviewListResponse> {
  const res = await apiClient.get(`/tours/${tourId}/reviews`, { params });
  const payload = res.data;

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload as TourReviewListResponse;
  }

  return payload as TourReviewListResponse;
}

export interface CreateReviewPayload {
  booking_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  message: string;
  review: TourReview;
}

export async function createReview(payload: CreateReviewPayload): Promise<ReviewResponse> {
  const res = await apiClient.post("/reviews", payload);
  return res.data as ReviewResponse;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export async function updateReview(reviewId: string | number, payload: UpdateReviewPayload): Promise<ReviewResponse> {
  const res = await apiClient.put(`/reviews/${reviewId}`, payload);
  return res.data as ReviewResponse;
}

export interface DeleteReviewResponse {
  message: string;
}

export async function deleteReview(reviewId: string | number): Promise<DeleteReviewResponse> {
  const res = await apiClient.delete(`/reviews/${reviewId}`);
  return res.data as DeleteReviewResponse;
}

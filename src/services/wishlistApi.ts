import { apiClient, extractData } from "@/lib/api-client";
import type { AutoPromotion, CancellationPolicy, TourType } from "@/services/publicApi";

export interface WishlistTourPackage {
  id: string;
  name: string;
  adult_price: number;
  child_price: number;
  [key: string]: unknown;
}

export interface WishlistTourSchedule {
  id: string;
  start_date: string | null;
  end_date: string | null;
  seats_total: number | null;
  seats_available: number | null;
  season_price: number | null;
  [key: string]: unknown;
}

export interface WishlistTour {
  id: string;
  title: string;
  type?: TourType | null;
  destination: string | null;
  duration: number | null;
  base_price: number | null;
  price_after_discount?: number | null;
  priceAfterDiscount?: number | null;
  season_price?: number | null;
  child_age_limit?: number | null;
  requires_passport?: boolean | null;
  requires_visa?: boolean | null;
  cancellation_policies?: CancellationPolicy[] | null;
  media?: Array<string | Record<string, unknown>>;
  policy?: string | null;
  itinerary?: Array<string | Record<string, unknown>> | null;
  average_rating?: number | null;
  rating_average?: number | null;
  rating_count?: number | null;
  packages?: WishlistTourPackage[] | null;
  schedules?: WishlistTourSchedule[] | null;
  categories?: Array<Record<string, unknown>> | null;
  partner?: Record<string, unknown> | null;
  status?: string;
  available?: boolean;
  auto_promotion?: AutoPromotion | null;
  autoPromotion?: AutoPromotion | null;
  [key: string]: unknown;
}

export interface WishlistItem {
  id: string;
  tour_id: string;
  added_at: string;
  available: boolean;
  status: string;
  tour: WishlistTour;
  [key: string]: unknown;
}

export interface WishlistResponse {
  items: WishlistItem[];
}

export interface WishlistAddResponse {
  message: string;
  item: WishlistItem;
}

export interface WishlistCompareResponse {
  tours: WishlistTour[];
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await apiClient.get("/wishlist");
  const data = extractData<WishlistResponse>(res);
  return Array.isArray(data.items) ? data.items : [];
}

export async function addWishlistItem(tourId: string): Promise<WishlistItem> {
  if (!tourId?.trim()) {
    throw new Error("tourId is required to add wishlist item");
  }
  const res = await apiClient.post("/wishlist", { tour_id: tourId });
  const data = extractData<WishlistAddResponse>(res);
  if (!data.item) {
    throw new Error("Không thể thêm tour vào danh sách yêu thích.");
  }
  return data.item;
}

export async function removeWishlistItem(wishlistId: string): Promise<void> {
  if (!wishlistId?.trim()) {
    throw new Error("wishlistId is required to remove wishlist item");
  }
  await apiClient.delete(`/wishlist/${wishlistId}`);
}

export async function compareWishlistTours(tourIds: string[]): Promise<WishlistTour[]> {
  if (!Array.isArray(tourIds) || tourIds.length === 0) {
    throw new Error("Vui lòng chọn ít nhất 1 tour để so sánh.");
  }
  if (tourIds.length > 2) {
    throw new Error("Chỉ có thể so sánh tối đa 2 tour.");
  }
  const payload = { tour_ids: tourIds };
  const res = await apiClient.post("/wishlist/compare", payload);
  const data = extractData<WishlistCompareResponse>(res);
  if (!Array.isArray(data.tours)) {
    return [];
  }
  return data.tours;
}

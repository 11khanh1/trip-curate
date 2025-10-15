import { apiClient, extractData } from "@/lib/api-client";

// ----- Home -----

export interface HomeCategory {
  id: string | number;
  name: string;
  slug?: string;
  tours_count?: number;
}

export type PromotionDiscountType = "percent" | "percentage" | "fixed" | string;

export interface HomePromotion {
  id: string | number;
  code: string;
  discount_type: PromotionDiscountType;
  value: number;
  max_usage?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
}

export interface PublicTourSchedule {
  id?: string | number;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  season_price?: number | null;
  capacity?: number | null;
  slots_available?: number | null;
  [key: string]: unknown;
}

export interface PublicTourPartner {
  id?: string | number;
  company_name?: string;
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PublicTourCategory {
  id?: string | number;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

export interface PublicTour {
  id?: string | number;
  uuid?: string;
  title?: string;
  name?: string;
  destination?: string;
  description?: string | null;
  policy?: string | null;
  itinerary?: Array<string | Record<string, unknown>> | null;
  thumbnail_url?: string | null;
  gallery?: string[] | null;
  media?: string[] | null;
  base_price?: number | null;
  season_price?: number | null;
  duration?: number | string | null;
  status?: string;
  bookings_count?: number;
  reviews_count?: number | null;
  average_rating?: number | null;
  tags?: string[] | null;
  partner?: PublicTourPartner | null;
  categories?: PublicTourCategory[];
  schedules?: PublicTourSchedule[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface HomeResponse {
  categories?: HomeCategory[];
  promotions?: HomePromotion[];
  trending?: PublicTour[];
  recommended?: PublicTour[];
}

export interface HomeParams {
  categories_limit?: number;
  promotions_limit?: number;
  trending_limit?: number;
}

export async function fetchHome(params: HomeParams = {}): Promise<HomeResponse> {
  const res = await apiClient.get("/home", { params });
  return extractData<HomeResponse>(res);
}

export async function fetchHighlightCategories(limit?: number): Promise<HomeCategory[]> {
  const res = await apiClient.get("/home/highlight-categories", {
    params: limit ? { limit } : undefined,
  });
  return extractData<HomeCategory[]>(res);
}

export async function fetchActivePromotions(limit?: number): Promise<HomePromotion[]> {
  const res = await apiClient.get("/promotions/active", {
    params: limit ? { limit } : undefined,
  });
  return extractData<HomePromotion[]>(res);
}

export interface TrendingToursParams {
  limit?: number;
  days?: number;
}

export async function fetchTrendingTours(params: TrendingToursParams = {}): Promise<PublicTour[]> {
  const res = await apiClient.get("/tours/trending", { params });
  return extractData<PublicTour[]>(res);
}

// ----- Search suggestions -----

export interface SearchSuggestion {
  id: string | number;
  title?: string;
  destination?: string | null;
}

export interface SearchSuggestionResponse {
  suggestions: SearchSuggestion[];
}

export async function fetchSearchSuggestions(keyword: string): Promise<SearchSuggestionResponse> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { suggestions: [] };
  }
  const res = await apiClient.get("/search/suggestions", {
    params: { keyword: trimmed },
  });
  return extractData<SearchSuggestionResponse>(res);
}

// ----- Tours listing / detail -----

export type TourStatusFilter = "approved" | "pending" | "rejected" | "all";

export type TourSortOption =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc";

export interface ToursQueryParams {
  status?: TourStatusFilter;
  partner_id?: string | number;
  destination?: string;
  search?: string;
  category_id?: string | number | Array<string | number>;
  tags?: string[];
  price_min?: number;
  price_max?: number;
  duration_min?: number;
  duration_max?: number;
  start_date?: string;
  sort?: TourSortOption;
  page?: number;
  per_page?: number;
}

export interface Paginated<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

const buildQueryString = (params: ToursQueryParams = {}) => {
  const searchParams = new URLSearchParams();

  const appendValue = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return;
      searchParams.append(key, trimmed);
      return;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      searchParams.append(key, String(value));
      return;
    }
    if (typeof value === "boolean") {
      searchParams.append(key, value ? "1" : "0");
    }
  };

  if (params.status && params.status !== "approved") {
    appendValue("status", params.status);
  } else if (params.status === "approved") {
    appendValue("status", "approved");
  }

  appendValue("partner_id", params.partner_id);
  appendValue("destination", params.destination);
  appendValue("search", params.search);

  const category = params.category_id;
  if (Array.isArray(category)) {
    category.forEach((value) => appendValue("category_id[]", value));
  } else {
    appendValue("category_id", category);
  }

  const tags = params.tags;
  if (Array.isArray(tags)) {
    tags.forEach((tag) => appendValue("tags[]", tag));
  }

  appendValue("price_min", params.price_min);
  appendValue("price_max", params.price_max);
  appendValue("duration_min", params.duration_min);
  appendValue("duration_max", params.duration_max);
  appendValue("start_date", params.start_date);
  appendValue("sort", params.sort);
  appendValue("page", params.page);
  appendValue("per_page", params.per_page);

  return searchParams.toString();
};

export async function fetchTours(params: ToursQueryParams = {}): Promise<Paginated<PublicTour>> {
  const queryString = buildQueryString(params);
  const url = queryString.length > 0 ? `/tours?${queryString}` : "/tours";
  const res = await apiClient.get(url);
  return extractData<Paginated<PublicTour>>(res);
}

export async function fetchTourDetail(id: string | number): Promise<PublicTour> {
  const res = await apiClient.get(`/tours/${id}`);
  return extractData<PublicTour>(res);
}

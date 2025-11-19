import { apiClient } from "@/lib/api-client";
import type { Booking, BookingStatus } from "@/services/bookingApi";
import type { PromotionDiscountType } from "@/services/publicApi";

export interface PartnerProfile {
  id?: string | number;
  company_name?: string | null;
  tax_code?: string | null;
  address?: string | null;
  business_type?: string | null;
  description?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  invoice_company_name?: string | null;
  invoice_tax_code?: string | null;
  invoice_address?: string | null;
  invoice_email?: string | null;
  invoice_vat_rate?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export type UpdatePartnerProfilePayload = Partial<{
  company_name: string | null;
  tax_code: string | null;
  address: string | null;
  business_type: string | null;
  description: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  invoice_company_name: string | null;
  invoice_tax_code: string | null;
  invoice_address: string | null;
  invoice_email: string | null;
  invoice_vat_rate: number | null;
}>;

export type PartnerBookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface PartnerBooking extends Booking {
  status?: PartnerBookingStatus | BookingStatus;
}

export interface PartnerBookingListQuery {
  status?: PartnerBookingStatus | "all";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PartnerBookingListResponse {
  data: PartnerBooking[];
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
  raw?: unknown;
}

export type PartnerPromotionType = "auto" | "voucher";

export interface PartnerPromotionTourSummary {
  id: string | number;
  title?: string | null;
  destination?: string | null;
  code?: string | number | null;
}

export interface PartnerPromotion {
  id: string | number;
  code?: string | null;
  type: PartnerPromotionType;
  tour_id?: string | number | null;
  tour_ids?: Array<string | number>;
  tours?: PartnerPromotionTourSummary[] | null;
  discount_type: PromotionDiscountType;
  value: number;
  max_usage?: number | null;
  usage_count?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  auto_apply?: boolean | null;
  auto_issue_on_cancel?: boolean | null;
  discount_amount?: number | null;
  [key: string]: unknown;
}

export interface PartnerPromotionPayload {
  type: PartnerPromotionType;
  discount_type: PromotionDiscountType;
  value: number;
  tour_ids: Array<string | number>;
  max_usage?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  auto_issue_on_cancel?: boolean | null;
}

const normalizePartnerBooking = (payload: unknown): PartnerBooking | null => {
  if (!payload || typeof payload !== "object") return null;

  if ("booking" in payload && (payload as { booking?: unknown }).booking) {
    const nested = (payload as { booking: unknown }).booking;
    return (typeof nested === "object" && nested !== null ? nested : payload) as PartnerBooking;
  }

  if ("data" in payload && (payload as { data?: unknown }).data) {
    const data = (payload as { data: unknown }).data;
    return (typeof data === "object" && data !== null ? data : payload) as PartnerBooking;
  }

  return payload as PartnerBooking;
};

const normalizePartnerBookingList = (payload: unknown): PartnerBookingListResponse => {
  if (!payload || typeof payload !== "object") {
    return { data: [], raw: payload };
  }

  if (Array.isArray(payload)) {
    return { data: payload as PartnerBooking[], raw: payload };
  }

  const candidate = payload as Record<string, unknown>;
  const dataField = candidate.data ?? candidate.bookings ?? candidate.results ?? candidate.items;

  if (Array.isArray(dataField)) {
    return {
      data: dataField as PartnerBooking[],
      meta: (candidate.meta as Record<string, unknown>) ?? undefined,
      links: (candidate.links as Record<string, unknown>) ?? undefined,
      raw: payload,
    };
  }

  return {
    data: [],
    meta: (candidate.meta as Record<string, unknown>) ?? undefined,
    links: (candidate.links as Record<string, unknown>) ?? undefined,
    raw: payload,
  };
};

export async function fetchPartnerBookings(
  params: PartnerBookingListQuery = {},
): Promise<PartnerBookingListResponse> {
  const query = { ...params };
  if (query.status === "all") {
    delete query.status;
  }
  const res = await apiClient.get("/partner/bookings", { params: query });
  return normalizePartnerBookingList(res.data);
}

export async function fetchPartnerBookingDetail(id: string | number): Promise<PartnerBooking | null> {
  const res = await apiClient.get(`/partner/bookings/${id}`);
  return normalizePartnerBooking(res.data);
}

export interface UpdatePartnerBookingStatusPayload {
  status: PartnerBookingStatus;
  note?: string;
  payment_status?: string;
}

export interface PartnerBookingMutationResult {
  booking: PartnerBooking | null;
  message?: string | null;
  raw?: unknown;
}

export async function updatePartnerBookingStatus(
  id: string | number,
  payload: UpdatePartnerBookingStatusPayload,
): Promise<PartnerBookingMutationResult> {
  const res = await apiClient.patch(`/partner/bookings/${id}/status`, payload);
  const normalized = normalizePartnerBooking(res.data);
  const message =
    typeof res.data === "object" && res.data !== null && "message" in res.data
      ? (res.data as { message?: string | null }).message ?? null
      : null;

  return {
    booking: normalized,
    message,
    raw: res.data,
  };
}

const normalizePromotionList = (payload: unknown): PartnerPromotion[] => {
  if (Array.isArray(payload)) {
    return payload as PartnerPromotion[];
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray((payload as { data?: unknown }).data)) {
      return (payload as { data: PartnerPromotion[] }).data;
    }
    if (Array.isArray((payload as { promotions?: unknown }).promotions)) {
      return (payload as { promotions: PartnerPromotion[] }).promotions;
    }
  }
  return [];
};

export interface PartnerPromotionListQuery {
  type?: PartnerPromotionType | "all";
  tour_id?: string | number;
}

export async function fetchPartnerPromotions(
  query: PartnerPromotionListQuery = {},
): Promise<PartnerPromotion[]> {
  const params: Record<string, string | number> = {};
  if (query.type && query.type !== "all") {
    params.type = query.type;
  }
  if (query.tour_id) {
    params.tour_id = query.tour_id;
  }
  const res = await apiClient.get("/partner/promotions", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return normalizePromotionList(res.data);
}

export async function createPartnerPromotion(
  payload: PartnerPromotionPayload,
): Promise<PartnerPromotion> {
  const res = await apiClient.post("/partner/promotions", payload);
  if (res.data && typeof res.data === "object" && "promotion" in res.data) {
    return (res.data as { promotion: PartnerPromotion }).promotion;
  }
  return res.data as PartnerPromotion;
}

export async function updatePartnerPromotion(
  id: string | number,
  payload: PartnerPromotionPayload,
): Promise<PartnerPromotion> {
  const res = await apiClient.put(`/partner/promotions/${id}`, payload);
  if (res.data && typeof res.data === "object" && "promotion" in res.data) {
    return (res.data as { promotion: PartnerPromotion }).promotion;
  }
  return res.data as PartnerPromotion;
}

export async function deletePartnerPromotion(id: string | number): Promise<void> {
  await apiClient.delete(`/partner/promotions/${id}`);
}

export type RefundRequestStatus =
  | "pending"
  | "await_partner"
  | "await_customer_confirm"
  | "completed"
  | "rejected"
  | string;

export interface RefundProof {
  id?: string | number;
  url?: string;
  filename?: string | null;
  mime_type?: string | null;
}

export interface PartnerRefundRequest {
  id: string | number;
  booking_id: string | number;
  booking_code?: string | null;
  tour_title?: string | null;
  customer_name?: string | null;
  amount?: number | null;
  currency?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  reason?: string | null;
  customer_message?: string | null;
  partner_message?: string | null;
  status?: RefundRequestStatus;
  note?: string | null;
  proofs?: RefundProof[] | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

const normalizePartnerRefundRequests = (payload: unknown): PartnerRefundRequest[] => {
  if (Array.isArray(payload)) {
    return payload as PartnerRefundRequest[];
  }
  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.data)) {
      return candidate.data as PartnerRefundRequest[];
    }
    if (Array.isArray(candidate.requests)) {
      return candidate.requests as PartnerRefundRequest[];
    }
  }
  return [];
};

export interface PartnerRefundRequestQuery {
  status?: string;
  tour_id?: string | number;
}

export async function fetchPartnerRefundRequests(
  query: PartnerRefundRequestQuery = {},
): Promise<PartnerRefundRequest[]> {
  const params: Record<string, string> = {};
  if (query.status && query.status !== "all") {
    params.status = String(query.status);
  }
  if (query.tour_id) {
    params.tour_id = String(query.tour_id);
  }
  const res = await apiClient.get("/partner/refund-requests", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return normalizePartnerRefundRequests(res.data);
}

export interface PartnerRefundRequestStatusPayload {
  status: "await_customer_confirm" | "rejected";
  partner_message?: string;
  proof?: File | Blob | null;
}

export async function updatePartnerRefundRequestStatus(
  id: string | number,
  payload: PartnerRefundRequestStatusPayload,
): Promise<PartnerRefundRequest> {
  const formData = new FormData();
  formData.append("status", payload.status);
  if (payload.partner_message) {
    formData.append("partner_message", payload.partner_message);
  }
  if (payload.proof) {
    formData.append("proof", payload.proof);
  }
  const res = await apiClient.post(`/partner/refund-requests/${id}/status`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res.data && typeof res.data === "object" && "refund_request" in res.data) {
    return (res.data as { refund_request: PartnerRefundRequest }).refund_request;
  }
  return res.data as PartnerRefundRequest;
}

const extractProfile = (payload: unknown): PartnerProfile => {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;
  if (record.partner) return extractProfile(record.partner);
  if (record.profile) return extractProfile(record.profile);
  if (record.data) return extractProfile(record.data);
  return payload as PartnerProfile;
};

export async function fetchPartnerProfile(): Promise<PartnerProfile> {
  const res = await apiClient.get("/partner/profile");
  return extractProfile(res.data);
}

export interface UpdatePartnerProfileResponse {
  message?: string;
  profile: PartnerProfile;
}

export async function updatePartnerProfile(
  payload: UpdatePartnerProfilePayload,
): Promise<UpdatePartnerProfileResponse> {
  const res = await apiClient.put("/partner/profile", payload);
  const profile = extractProfile(res.data);
  return {
    message: res.data?.message ?? "Cập nhật hồ sơ thành công",
    profile,
  };
}

export interface PartnerDashboardResponse {
  range_days?: number;
  totals?: {
    tours?: {
      total?: number;
      approved?: number;
      pending?: number;
      rejected?: number;
    };
    active_promotions?: number;
    bookings?: number;
  };
  bookings?: {
    by_status?: Record<string, number>;
    range?: {
      bookings?: number;
      paid_bookings?: number;
      revenue?: number;
    };
  };
  revenue?: {
    overall?: number;
    range?: number;
    daily?: Array<{
      date: string;
      revenue: number;
      bookings: number;
    }>;
  };
  upcoming_departures?: Array<{
    id: string | number;
    tour_title?: string | null;
    start_date?: string | null;
    seats_total?: number | null;
    seats_available?: number | null;
    booked_passengers?: number | null;
  }>;
  recent_bookings?: Array<{
    id: string | number;
    status?: string | null;
    payment_status?: string | null;
    total_price?: number | null;
    booking_date?: string | null;
    customer_name?: string | null;
    tour?: {
      title?: string | null;
      name?: string | null;
      destination?: string | null;
    } | null;
  }>;
}

export async function fetchPartnerDashboard(range = 30): Promise<PartnerDashboardResponse> {
  const normalizedRange = Math.max(1, Math.min(180, range));
  const res = await apiClient.get("/partner/dashboard", {
    params: { range: normalizedRange },
  });
  if (res.data && typeof res.data === "object" && "data" in res.data) {
    return (res.data as { data: PartnerDashboardResponse }).data;
  }
  return res.data as PartnerDashboardResponse;
}

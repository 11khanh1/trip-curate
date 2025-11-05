import { apiClient } from "@/lib/api-client";
import type { Booking } from "@/services/bookingApi";

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

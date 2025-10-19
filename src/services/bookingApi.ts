import { apiClient } from "@/lib/api-client";
import type {
  Paginated,
  PublicTour,
  PublicTourPackage,
  PublicTourSchedule,
} from "@/services/publicApi";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired" | "completed" | string;
export type BookingPaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed" | string;

export interface BookingContact {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface BookingReviewSummary {
  id?: string | number;
  rating?: number;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BookingPassenger {
  id?: string | number;
  type?: "adult" | "child" | "infant" | string;
  full_name?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  document_number?: string | null;
  nationality?: string | null;
  [key: string]: unknown;
}

export interface BookingPayment {
  id?: string | number;
  amount?: number;
  currency?: string | null;
  method?: string | null;
  provider?: string | null;
  status?: "success" | "pending" | "failed" | string;
  order_code?: string | null;
  transaction_id?: string | null;
  invoice_number?: string | null;
  transaction_code?: string | null;
  paid_at?: string | null;
  refunded_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  meta?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface Booking {
  id: string | number;
  code?: string;
  uuid?: string;
  status?: BookingStatus;
  payment_status?: BookingPaymentStatus;
  payment_method?: "offline" | "sepay" | string;
  total_amount?: number;
  total_price?: number;
  currency?: string | null;
  total_adults?: number;
  total_children?: number;
  adults?: number;
  children?: number;
  booking_date?: string | null;
  booked_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
  payment_url?: string | null;
  payment_id?: string | number | null;
  can_cancel?: boolean;
  contact?: BookingContact | null;
  notes?: string | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tour?: PublicTour | null;
  package?: PublicTourPackage | null;
  schedule?: PublicTourSchedule | null;
  passengers?: BookingPassenger[];
  payments?: BookingPayment[];
  review?: BookingReviewSummary | null;
  [key: string]: unknown;
}

export interface BookingQueryParams {
  status?: string;
  page?: number;
  per_page?: number;
}

export type BookingListResponse = Paginated<Booking>;

const normalizePaginated = <T>(payload: any): Paginated<T> => {
  if (!payload || typeof payload !== "object") {
    return { data: [] };
  }
  const data = Array.isArray(payload.data) ? (payload.data as T[]) : [];

  return {
    data,
    meta: payload.meta,
    links: payload.links,
  };
};

export async function fetchBookings(params: BookingQueryParams = {}): Promise<BookingListResponse> {
  const sanitizedParams = {
    ...params,
    status: params.status && params.status !== "all" ? params.status : undefined,
  };
  const res = await apiClient.get("/bookings", { params: sanitizedParams });
  return normalizePaginated<Booking>(res.data);
}

export async function fetchBookingDetail(id: string | number): Promise<Booking> {
  const res = await apiClient.get(`/bookings/${id}`);
  const payload = res.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: Booking }).data;
    return data;
  }
  return payload as Booking;
}

export interface CreateBookingPassengerInput {
  type: "adult" | "child" | string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  document_number?: string;
  nationality?: string;
}

export interface CreateBookingPayload {
  tour_id: string;
  schedule_id: string;
  package_id: string;
  adults: number;
  children?: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes?: string;
  payment_method: "offline" | "sepay";
  passengers: CreateBookingPassengerInput[];
}

export interface CreateBookingResponse {
  message?: string;
  booking: Booking;
  payment_id?: string | number | null;
  payment_url?: string | null;
}

export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResponse> {
  const res = await apiClient.post("/bookings", payload);
  const data = res.data;
  if (data && typeof data === "object" && "data" in data && "booking" in data.data) {
    return data.data as CreateBookingResponse;
  }
  return data as CreateBookingResponse;
}

export interface CancelBookingResponse {
  message: string;
}

export async function cancelBooking(id: string | number) {
  const res = await apiClient.post(`/bookings/${id}/cancel`);
  return res.data as CancelBookingResponse;
}

export interface SepayReturnQuery {
  order_code: string;
  status: string;
  signature: string;
  [key: string]: string;
}

export interface SepayReturnResponse {
  status?: string;
  payment_id?: string | number;
  booking_id?: string | number;
  message?: string;
  [key: string]: unknown;
}

export async function verifySepayReturn(params: SepayReturnQuery): Promise<SepayReturnResponse> {
  const res = await apiClient.get("/payments/sepay/return", { params });
  return res.data as SepayReturnResponse;
}

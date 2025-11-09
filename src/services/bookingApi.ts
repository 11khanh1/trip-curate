import { apiClient } from "@/lib/api-client";
import type {
  Paginated,
  PublicTour,
  PublicTourPackage,
  PublicTourSchedule,
  PromotionDiscountType,
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
  refund_amount?: number | null;
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

export interface BookingPromotion {
  id?: string | number;
  code?: string | null;
  discount_type?: PromotionDiscountType | string | null;
  value?: number | null;
  discount_amount?: number | null;
  description?: string | null;
  [key: string]: unknown;
}

export type RefundRequestStatus =
  | "pending"
  | "await_partner"
  | "await_customer_confirm"
  | "completed"
  | "rejected"
  | string;

export interface RefundProofFile {
  id?: string | number;
  url?: string;
  filename?: string | null;
  mime_type?: string | null;
}

export interface BookingRefundRequest {
  id: string | number;
  booking_id: string | number;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  customer_message?: string | null;
  partner_message?: string | null;
  status?: RefundRequestStatus;
  note?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  proofs?: RefundProofFile[] | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface BookingInvoice {
  id?: string | number;
  number?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  delivery_method?: "download" | "email" | string | null;
  file_url?: string | null;
  emailed_at?: string | null;
  issued_at?: string | null;
  status?: string | null;
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
  paymentUrl?: string | null;
  paymentQrUrl?: string | null;
  payment_qr_url?: string | null;
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
  discount_total?: number | null;
  promotions?: BookingPromotion[] | null;
  refund_requests?: BookingRefundRequest[] | null;
  invoice?: BookingInvoice | null;
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
  promotion_code?: string;
}

export interface CreateBookingResponse {
  message?: string;
  booking: Booking;
  payment_id?: string | number | null;
  payment_url?: string | null;
  paymentUrl?: string | null;
  paymentQrUrl?: string | null;
  payment_qr_url?: string | null;
  promotions?: BookingPromotion[] | null;
  discount_total?: number | null;
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
  refund?: {
    rate?: number | null;
    amount?: number | null;
    policy_days_before?: number | null;
    [key: string]: unknown;
  } | null;
}

export async function cancelBooking(id: string | number) {
  const res = await apiClient.post(`/bookings/${id}/cancel`);
  return res.data as CancelBookingResponse;
}

export interface BookingPaymentIntentPayload {
  method?: "offline" | "sepay" | string;
  [key: string]: unknown;
}

export interface BookingPaymentIntentResponse {
  booking?: Booking;
  payment_url?: string | null;
  paymentUrl?: string | null;
  payment_qr_url?: string | null;
  paymentQrUrl?: string | null;
  url?: string | null;
  payment_id?: string | number | null;
  paymentId?: string | number | null;
  message?: string | null;
  [key: string]: unknown;
}

export async function initiateBookingPayment(
  id: string | number,
  payload: BookingPaymentIntentPayload = {},
): Promise<BookingPaymentIntentResponse> {
  const res = await apiClient.post(`/bookings/${id}/pay`, payload);
  const data = res.data;
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data: BookingPaymentIntentResponse }).data;
    return nested;
  }
  return data as BookingPaymentIntentResponse;
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

export interface BookingPaymentStatusResponse {
  booking_id?: string | number;
  status?: string;
  message?: string | null;
  payment?: (BookingPayment & { method?: string | null }) | null;
  [key: string]: unknown;
}

export async function fetchBookingPaymentStatus(
  id: string | number,
): Promise<BookingPaymentStatusResponse> {
  const res = await apiClient.get(`/bookings/${id}/payment-status`);
  return res.data as BookingPaymentStatusResponse;
}

export interface CreateRefundRequestPayload {
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch: string;
  customer_message: string;
  amount?: number;
  currency?: string;
}

export async function createRefundRequest(
  bookingId: string | number,
  payload: CreateRefundRequestPayload,
): Promise<BookingRefundRequest> {
  const res = await apiClient.post(`/bookings/${bookingId}/refund-request`, payload);
  if (res.data && typeof res.data === "object" && "refund_request" in res.data) {
    return (res.data as { refund_request: BookingRefundRequest }).refund_request;
  }
  return res.data as BookingRefundRequest;
}

const normalizeRefundRequestList = (payload: unknown): BookingRefundRequest[] => {
  if (Array.isArray(payload)) return payload as BookingRefundRequest[];
  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;
    if (Array.isArray(candidate.data)) {
      return candidate.data as BookingRefundRequest[];
    }
    if (Array.isArray(candidate.requests)) {
      return candidate.requests as BookingRefundRequest[];
    }
  }
  return [];
};

export interface RefundRequestQueryParams {
  status?: string;
}

export async function fetchRefundRequests(
  params: RefundRequestQueryParams = {},
): Promise<BookingRefundRequest[]> {
  const query =
    params.status && params.status !== "all" ? { status: params.status } : undefined;
  const res = await apiClient.get("/refund-requests", { params: query });
  return normalizeRefundRequestList(res.data);
}

export async function confirmRefundRequest(id: string | number): Promise<BookingRefundRequest> {
  const res = await apiClient.post(`/refund-requests/${id}/confirm`);
  if (res.data && typeof res.data === "object" && "refund_request" in res.data) {
    return (res.data as { refund_request: BookingRefundRequest }).refund_request;
  }
  return res.data as BookingRefundRequest;
}

export interface InvoiceRequestPayload {
  customer_name: string;
  customer_tax_code: string;
  customer_address: string;
  customer_email?: string;
  delivery_method: "download" | "email";
}

export async function requestInvoice(
  bookingId: string | number,
  payload: InvoiceRequestPayload,
): Promise<BookingInvoice> {
  const res = await apiClient.post(`/bookings/${bookingId}/invoice-request`, payload);
  if (res.data && typeof res.data === "object" && "invoice" in res.data) {
    return (res.data as { invoice: BookingInvoice }).invoice;
  }
  return res.data as BookingInvoice;
}

export async function fetchBookingInvoice(bookingId: string | number): Promise<BookingInvoice | null> {
  const res = await apiClient.get(`/bookings/${bookingId}/invoice`);
  if (res.data && typeof res.data === "object" && "invoice" in res.data) {
    return (res.data as { invoice: BookingInvoice }).invoice;
  }
  return (res.data as BookingInvoice) ?? null;
}

export async function downloadBookingInvoice(bookingId: string | number): Promise<Blob> {
  const res = await apiClient.get(`/bookings/${bookingId}/invoice/download`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

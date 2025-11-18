import { apiClient, extractData } from "@/lib/api-client";

// --- Types ---

export interface DashboardMetrics {
  visits_24h?: number;
  new_registrations?: number;
  new_users?: number;
  bookings?: number;
  tour_bookings?: number;
  conversion_rate?: number;
  [key: string]: unknown;
}

export interface DashboardOperations {
  pending_orders?: number;
  orders_pending?: number;
  support_requests?: number;
  pending_support?: number;
  pending_partners?: number;
  partners_pending?: number;
  [key: string]: unknown;
}

export interface DashboardBooking {
  id?: string | number;
  customer_name?: string;
  customer?: string;
  tour_name?: string;
  tour?: string;
  amount?: number;
  revenue?: string | number;
  booked_at?: string;
  time?: string;
  [key: string]: unknown;
}

export interface DashboardTrafficSource {
  channel?: string;
  name?: string;
  sessions?: number | string;
  value?: number | string;
  change?: string;
  delta?: string;
  [key: string]: unknown;
}

export interface DashboardKpi {
  title: string;
  label?: string;
  value: string;
  note?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DashboardResponse {
  metrics?: DashboardMetrics;
  operations?: DashboardOperations;
  recent_bookings?: DashboardBooking[];
  bookings?: DashboardBooking[];
  traffic_sources?: DashboardTrafficSource[];
  traffic?: DashboardTrafficSource[];
  kpis?: DashboardKpi[];
  key_metrics?: DashboardKpi[];
  raw?: unknown;
  [key: string]: unknown;
}

// Users
export interface AdminUser {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
  total_bookings?: number;
  orders_count?: number;
  status?: "active" | "locked" | "disabled" | string;
  [key: string]: unknown;
}

export interface AdminUsersParams {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// Partners
export type PartnerStatus = "pending" | "approved" | "rejected";

export interface AdminPartner {
  id: string | number;
  company_name: string;
  business_type?: string | null;
  tax_code?: string | null;
  address?: string | null;
  description?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status?: PartnerStatus | string;
  approved_at?: string | null;
  created_at?: string | null;
  stats?: {
    tours_count?: number;
    bookings_count?: number;
  };
  tours_count?: number;
  bookings_count?: number;
  user?: {
    id?: string | number;
    status?: string;
    name?: string | null;
    full_name?: string | null;
    email?: string | null;
    mail?: string | null;
    phone?: string | null;
    phone_number?: string | null;
  } | null;
  [key: string]: unknown;
}

export interface AdminPartnersParams {
  status?: PartnerStatus | string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PartnerUpdatePayload {
  company_name?: string;
  business_type?: string | null;
  tax_code?: string | null;
  address?: string | null;
  description?: string | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: PartnerStatus;
}

// Tours
export type AdminTourStatus = "pending" | "approved" | "rejected";

export interface AdminTour {
  id: string;
  name: string;
  code?: string;
  slug?: string;
  status?: AdminTourStatus | string;
  partner?: AdminPartner;
  partner_id?: string | number;
  price?: number;
  currency?: string;
  location?: string;
  category?: string;
  duration?: string | number | null;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
  thumbnail_url?: string | null;
  tags?: string[];
  media?: string[];
  itinerary?: unknown;
  type?: string | null;
  child_age_limit?: number | null;
  requires_passport?: boolean | null;
  requires_visa?: boolean | null;
  schedules?: AdminTourSchedule[];
  packages?: AdminTourPackage[];
  cancellation_policies?: AdminTourCancellationPolicy[];
  categories?: AdminTourCategory[];
  [key: string]: unknown;
}

export interface AdminTourParams {
  status?: AdminTourStatus | string;
  search?: string;
  partner_id?: string | number;
  page?: number;
  per_page?: number;
}

// Categories
export interface AdminCategory {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  [key: string]: unknown;
}

export interface CategoryPayload {
  name: string;
  slug?: string | null;
  parent_id?: string | null;
}

// Promotions
export interface AdminPromotion {
  id: string | number;
  code: string;
  discount_type: "percent" | "percentage" | "fixed" | string;
  value: number;
  max_usage?: number;
  valid_from?: string;
  valid_to?: string;
  is_active?: boolean;
  used?: number;
  [key: string]: unknown;
}

export interface PromotionPayload {
  code: string;
  discount_type: "percent" | "percentage" | "fixed";
  value: number;
  max_usage?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
}

export interface PromotionUpdatePayload {
  discount_type?: "percent" | "percentage" | "fixed";
  value?: number;
  max_usage?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
}

// Staff
export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  last_login_at?: string;
  [key: string]: unknown;
}

export interface StaffPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  status?: "active" | "inactive" | "suspended";
}

export interface StaffUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  status?: "active" | "inactive" | "suspended";
}

// --- API helpers ---

export async function fetchAdminDashboard(): Promise<DashboardResponse> {
  const res = await apiClient.get("/admin/dashboard");
  const data = extractData<DashboardResponse>(res);
  data.raw = res.data;
  return data;
}

export async function fetchAdminUsers(params: AdminUsersParams = {}): Promise<PaginatedResponse<AdminUser>> {
  const res = await apiClient.get("/admin/users", { params });
  return extractPaginated<AdminUser>(res);
}

export async function fetchAdminUser(id: string | number): Promise<AdminUser> {
  const res = await apiClient.get(`/admin/users/${id}`);
  return extractData<AdminUser>(res);
}

export type AdminUserStatus = "active" | "inactive";

export async function patchAdminUserStatus(id: string | number, status: AdminUserStatus) {
  const res = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return extractData(res);
}

export async function fetchAdminPartners(params: AdminPartnersParams = {}): Promise<PaginatedResponse<AdminPartner>> {
  const query: Record<string, unknown> = {};

  if (params.page !== undefined) query.page = params.page;
  if (params.per_page !== undefined) query.per_page = params.per_page;
  if (params.status !== undefined && params.status !== "") query.status = params.status;

  if (params.search !== undefined) {
    const trimmed = params.search?.trim();
    if (trimmed) {
      query.search = trimmed;
    }
  }

  const res = await apiClient.get("/admin/partners", { params: query });
  return extractPaginated<AdminPartner>(res);
}

export interface AdminPartnerDetail {
  partner: AdminPartner;
  stats?: {
    tours_count?: number;
    bookings_count?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function fetchAdminPartner(id: string | number): Promise<AdminPartnerDetail> {
  const res = await apiClient.get(`/admin/partners/${id}`);
  return extractData<AdminPartnerDetail>(res);
}

const sanitizeOptionalString = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function updateAdminPartner(id: string | number, payload: PartnerUpdatePayload) {
  const body: Record<string, unknown> = {};

  if (payload.company_name !== undefined) {
    const companyName = sanitizeOptionalString(payload.company_name);
    body.company_name = companyName ?? null;
  }
  if (payload.business_type !== undefined) {
    body.business_type = sanitizeOptionalString(payload.business_type) ?? null;
  }
  if (payload.tax_code !== undefined) {
    body.tax_code = sanitizeOptionalString(payload.tax_code) ?? null;
  }
  if (payload.address !== undefined) {
    body.address = sanitizeOptionalString(payload.address) ?? null;
  }
  if (payload.description !== undefined) {
    body.description = sanitizeOptionalString(payload.description) ?? null;
  }
  if (payload.contact_name !== undefined) {
    body.contact_name = sanitizeOptionalString(payload.contact_name);
  }
  if (payload.contact_email !== undefined) {
    body.contact_email = sanitizeOptionalString(payload.contact_email);
  }
  if (payload.contact_phone !== undefined) {
    body.contact_phone = sanitizeOptionalString(payload.contact_phone);
  }
  if (payload.status !== undefined) {
    body.status = payload.status;
  }

  const res = await apiClient.patch(`/admin/partners/${id}`, body);
  return extractData(res);
}

export interface AdminTourSchedule {
  id?: string | number;
  start_date?: string;
  end_date?: string;
  seats_total?: number | null;
  seats_available?: number | null;
  season_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AdminTourPackage {
  id?: string | number;
  name?: string | null;
  description?: string | null;
  adult_price?: number | null;
  child_price?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AdminTourCancellationPolicy {
  id?: string | number;
  days_before?: number | null;
  refund_rate?: number | null;
  description?: string | null;
  [key: string]: unknown;
}

export interface AdminTourCategory {
  id?: string | number;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
}

export interface AdminTourDetail extends AdminTour {
  schedules?: AdminTourSchedule[];
}

export async function fetchAdminTours(params: AdminTourParams = {}): Promise<PaginatedResponse<AdminTour>> {
  const query: Record<string, unknown> = {};

  if (params.page !== undefined) query.page = params.page;
  if (params.per_page !== undefined) query.per_page = params.per_page;

  if (params.status !== undefined) {
    const status = String(params.status).trim();
    if (status.length > 0) {
      query.status = status;
    }
  }

  if (params.partner_id !== undefined && params.partner_id !== null && params.partner_id !== "") {
    query.partner_id = params.partner_id;
  }

  if (params.search !== undefined) {
    const trimmed = params.search?.toString().trim();
    if (trimmed) {
      query.search = trimmed;
    }
  }

  const res = await apiClient.get("/admin/tours", { params: query });
  return extractPaginated<AdminTour>(res);
}

export async function fetchAdminTour(id: string | number): Promise<AdminTourDetail> {
  const res = await apiClient.get(`/admin/tours/${id}`);
  return extractData<AdminTourDetail>(res);
}

export async function updateAdminTourStatus(id: string, status: AdminTourStatus) {
  const res = await apiClient.patch(`/admin/tours/${id}/status`, { status });
  return extractData(res);
}



export async function fetchAdminCategories(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<AdminCategory>> {
  const res = await apiClient.get("/admin/categories", { params });
  return extractPaginated<AdminCategory>(res);
}

export async function createAdminCategory(payload: CategoryPayload) {
  const body: Record<string, unknown> = {
    name: payload.name,
    parent_id: payload.parent_id ?? null,
  };
  const slug = payload.slug?.trim();
  if (slug) {
    body.slug = slug;
  }
  const res = await apiClient.post("/admin/categories", body);
  return extractData(res);
}

export async function updateAdminCategory(id: string | number, payload: CategoryPayload) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.parent_id !== undefined) body.parent_id = payload.parent_id ?? null;
  if (payload.slug !== undefined) {
    const slug = payload.slug?.trim();
    body.slug = slug && slug.length > 0 ? slug : null;
  }
  const res = await apiClient.put(`/admin/categories/${id}`, body);
  return extractData(res);
}

export async function deleteAdminCategory(id: string | number) {
  const res = await apiClient.delete(`/admin/categories/${id}`);
  return extractData(res);
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

function extractPaginated<T>(res: any): PaginatedResponse<T> {
  const json = res?.data ?? res;
  if (!json) return { data: [] };
  if (Array.isArray(json)) return { data: json };
  return {
    data: Array.isArray(json.data) ? (json.data as T[]) : [],
    links: json.links,
    meta: json.meta,
  };
}

export async function fetchAdminPromotions(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<AdminPromotion>> {
  const res = await apiClient.get("/admin/promotions", { params });
  return extractPaginated<AdminPromotion>(res);
}

export async function createAdminPromotion(payload: PromotionPayload) {
  const res = await apiClient.post("/admin/promotions", payload);
  return extractData(res);
}

export async function updateAdminPromotion(id: string | number, payload: PromotionUpdatePayload) {
  const res = await apiClient.put(`/admin/promotions/${id}`, payload);
  return extractData(res);
}

export async function deleteAdminPromotion(id: string | number) {
  const res = await apiClient.delete(`/admin/promotions/${id}`);
  return extractData(res);
}

export async function fetchAdminStaff(params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<AdminStaff>> {
  const res = await apiClient.get("/admin/staff", { params });
  return extractPaginated<AdminStaff>(res);
}

export async function createAdminStaff(payload: StaffPayload) {
  const body: Record<string, unknown> = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    password: payload.password,
    password_confirmation: payload.password_confirmation,
  };
  if (payload.status) {
    body.status = payload.status;
  }
  const res = await apiClient.post("/admin/staff", body);
  return extractData(res);
}

export async function updateAdminStaff(id: string, payload: StaffUpdatePayload) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined) body.phone = payload.phone ?? null;
  if (payload.password !== undefined) body.password = payload.password;
  if (payload.password_confirmation !== undefined) {
    body.password_confirmation = payload.password_confirmation;
  }
  if (payload.status !== undefined) body.status = payload.status;
  const res = await apiClient.put(`/admin/staff/${id}`, body);
  return extractData(res);
}

export async function deleteAdminStaff(id: string) {
  const res = await apiClient.delete(`/admin/staff/${id}`);
  return extractData(res);
}

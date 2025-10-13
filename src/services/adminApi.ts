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
export interface AdminPartner {
  id: string | number;
  company_name: string;
  tax_code?: string | null;
  address?: string | null;
  status?: "pending" | "approved" | "rejected" | string;
  user?: {
    id: string | number;
    name: string;
    email: string;
    phone?: string | null;
    status?: string;
  };
  stats?: {
    tours_count?: number;
    bookings_count?: number;
  };
  tours_count?: number;
  bookings_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface PartnerPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  tax_code?: string | null;
  address?: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface PartnerUpdatePayload {
  company_name?: string;
  tax_code?: string | null;
  address?: string | null;
  status?: "pending" | "approved" | "rejected";
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
  const res = await apiClient.get("/api/admin/dashboard");
  const data = extractData<DashboardResponse>(res);
  data.raw = res.data;
  return data;
}

export async function fetchAdminUsers(params: AdminUsersParams = {}): Promise<PaginatedResponse<AdminUser>> {
  const res = await apiClient.get("/api/admin/users", { params });
  return extractPaginated<AdminUser>(res);
}

export async function fetchAdminUser(id: string | number): Promise<AdminUser> {
  const res = await apiClient.get(`/api/admin/users/${id}`);
  return extractData<AdminUser>(res);
}

export type AdminUserStatus = "active" | "inactive";

export async function patchAdminUserStatus(id: string | number, status: AdminUserStatus) {
  const res = await apiClient.patch(`/api/admin/users/${id}/status`, { status });
  return extractData(res);
}

export async function fetchAdminPartners(params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<AdminPartner>> {
  const res = await apiClient.get("/api/admin/partners", { params });
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
  const res = await apiClient.get(`/api/admin/partners/${id}`);
  return extractData<AdminPartnerDetail>(res);
}

export async function createAdminPartner(payload: PartnerPayload) {
  const res = await apiClient.post("/api/admin/partners", payload);
  return extractData(res);
}

export async function updateAdminPartner(id: string | number, payload: PartnerUpdatePayload) {
  const res = await apiClient.put(`/api/admin/partners/${id}`, payload);
  return extractData(res);
}

export async function fetchAdminCategories(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<AdminCategory>> {
  const res = await apiClient.get("/api/admin/categories", { params });
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
  const res = await apiClient.post("/api/admin/categories", body);
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
  const res = await apiClient.put(`/api/admin/categories/${id}`, body);
  return extractData(res);
}

export async function deleteAdminCategory(id: string | number) {
  const res = await apiClient.delete(`/api/admin/categories/${id}`);
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
  const res = await apiClient.get("/api/admin/promotions", { params });
  return extractPaginated<AdminPromotion>(res);
}

export async function createAdminPromotion(payload: PromotionPayload) {
  const res = await apiClient.post("/api/admin/promotions", payload);
  return extractData(res);
}

export async function updateAdminPromotion(id: string | number, payload: PromotionUpdatePayload) {
  const res = await apiClient.put(`/api/admin/promotions/${id}`, payload);
  return extractData(res);
}

export async function deleteAdminPromotion(id: string | number) {
  const res = await apiClient.delete(`/api/admin/promotions/${id}`);
  return extractData(res);
}

export async function fetchAdminStaff(params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<AdminStaff>> {
  const res = await apiClient.get("/api/admin/staff", { params });
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
  const res = await apiClient.post("/api/admin/staff", body);
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
  const res = await apiClient.put(`/api/admin/staff/${id}`, body);
  return extractData(res);
}

export async function deleteAdminStaff(id: string) {
  const res = await apiClient.delete(`/api/admin/staff/${id}`);
  return extractData(res);
}

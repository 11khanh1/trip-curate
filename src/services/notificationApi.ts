import { apiClient } from "@/lib/api-client";

export interface NotificationPayload {
  id: string | number;
  type?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at?: string | null;
}

export interface NotificationListResponse {
  data: NotificationPayload[];
  meta?: Record<string, unknown>;
  notifications_enabled?: boolean;
}

export interface UnreadCountResponse {
  unread: number;
}

export interface NotificationToggleResponse {
  notifications_enabled: boolean;
}

export type NotificationAudience = "customer" | "partner" | "admin";

const normalizeAudience = (
  role?: string | null,
  fallback: NotificationAudience = "customer",
): NotificationAudience => {
  if (!role) return fallback;
  const normalized = role.toLowerCase();
  if (normalized.includes("partner")) return "partner";
  if (normalized.includes("admin")) return "admin";
  return "customer";
};

export const resolveNotificationAudience = normalizeAudience;

interface FetchNotificationsParams {
  page?: number;
  per_page?: number;
  audience?: NotificationAudience;
}

export async function fetchNotifications(
  params: FetchNotificationsParams = { per_page: 20 },
): Promise<NotificationListResponse> {
  const res = await apiClient.get("/notifications", { params });
  const payload = res.data as NotificationListResponse | NotificationPayload[];
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
    return payload;
  }
  return { data: [] };
}

export async function fetchUnreadCount(
  audience?: NotificationAudience,
): Promise<UnreadCountResponse> {
  const res = await apiClient.get("/notifications/unread-count", {
    params: audience ? { audience } : undefined,
  });
  return (res.data as UnreadCountResponse) ?? { unread: 0 };
}

export async function markNotificationRead(id: string | number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(audience?: NotificationAudience): Promise<void> {
  await apiClient.post("/notifications/read-all", audience ? { audience } : undefined);
}

export async function toggleNotifications(
  enabled: boolean,
  audience?: NotificationAudience,
): Promise<NotificationToggleResponse> {
  const res = await apiClient.post("/notifications/toggle", { enabled, audience });
  if (res.data && typeof res.data === "object" && "notifications_enabled" in res.data) {
    return res.data as NotificationToggleResponse;
  }
  return { notifications_enabled: enabled };
}

export async function fetchNotificationSettings(
  audience?: NotificationAudience,
): Promise<NotificationToggleResponse> {
  try {
    const res = await apiClient.get("/notifications/settings", {
      params: audience ? { audience } : undefined,
    });
    if (res.data && typeof res.data === "object" && "notifications_enabled" in res.data) {
      return res.data as NotificationToggleResponse;
    }
  } catch {
    // Endpoint optional; fall back to enabled = true
  }
  return { notifications_enabled: true };
}

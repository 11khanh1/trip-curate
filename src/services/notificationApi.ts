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

interface FetchNotificationsParams {
  page?: number;
  per_page?: number;
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

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const res = await apiClient.get("/notifications/unread-count");
  return (res.data as UnreadCountResponse) ?? { unread: 0 };
}

export async function markNotificationRead(id: string | number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}

export async function toggleNotifications(
  enabled: boolean,
): Promise<NotificationToggleResponse> {
  const res = await apiClient.post("/notifications/toggle", { enabled });
  if (res.data && typeof res.data === "object" && "notifications_enabled" in res.data) {
    return res.data as NotificationToggleResponse;
  }
  return { notifications_enabled: enabled };
}

export async function fetchNotificationSettings(): Promise<NotificationToggleResponse> {
  try {
    const res = await apiClient.get("/notifications/settings");
    if (res.data && typeof res.data === "object" && "notifications_enabled" in res.data) {
      return res.data as NotificationToggleResponse;
    }
  } catch {
    // Endpoint optional; fall back to enabled = true
  }
  return { notifications_enabled: true };
}

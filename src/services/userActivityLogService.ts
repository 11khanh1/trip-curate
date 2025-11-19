const STORAGE_KEY = "user_activity_logs";
const MAX_ENTRIES = 1000;

type UserActivityAction =
  | "tour_view"
  | "wishlist_add"
  | "cart_add"
  | "booking_created"
  | "booking_cancelled"
  | "review_submitted";

export interface UserActivityLogInput {
  action: UserActivityAction;
  userId?: string | number | null;
  tourId?: string | number | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export interface UserActivityLogEntry {
  id: string;
  action: UserActivityAction;
  user_id?: string;
  tour_id?: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

const readLogs = (): UserActivityLogEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserActivityLogEntry[]) : [];
  } catch {
    return [];
  }
};

export const getUserActivityLogs = (): UserActivityLogEntry[] => {
  return readLogs();
};

export const logUserActivity = ({
  action,
  userId,
  tourId,
  metadata,
  occurredAt,
}: UserActivityLogInput) => {
  if (typeof window === "undefined") return;
  try {
    const entry: UserActivityLogEntry = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      action,
      user_id:
        userId !== undefined && userId !== null ? String(userId) : undefined,
      tour_id:
        tourId !== undefined && tourId !== null ? String(tourId) : undefined,
      metadata,
      occurred_at:
        occurredAt && occurredAt.trim().length > 0
          ? occurredAt
          : new Date().toISOString(),
    };

    const current = readLogs();
    const next = [...current, entry];
    if (next.length > MAX_ENTRIES) {
      next.splice(0, next.length - MAX_ENTRIES);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Không thể ghi user_activity_logs:", error);
  }
};

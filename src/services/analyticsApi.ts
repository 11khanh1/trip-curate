import { apiClient } from "@/lib/api-client";
import { getOrCreateDeviceId } from "@/lib/device-id";

export interface AnalyticsEventPayload {
  event_name: string;
  entity_type?: string;
  entity_id?: string | number | null;
  occurred_at?: string;
  device_id?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AnalyticsBatchPayload {
  events: AnalyticsEventPayload[];
}

export const postAnalyticsEvents = async (events: AnalyticsEventPayload[]) => {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  const deviceId = getOrCreateDeviceId();
  const enrichedEvents = events.map((event) => {
    const occurredAt =
      event.occurred_at && event.occurred_at.trim().length > 0
        ? event.occurred_at
        : new Date().toISOString();
    const entityId =
      typeof event.entity_id === "number" || typeof event.entity_id === "string"
        ? event.entity_id
        : undefined;
    return {
      ...event,
      occurred_at: occurredAt,
      device_id: event.device_id ?? deviceId,
      entity_id: entityId,
    };
  });

  const payload: AnalyticsBatchPayload = {
    events: enrichedEvents.slice(0, 50),
  };

  const batchSize = payload.events.length;

  try {
    const response = await apiClient.post("/analytics/events", payload, {
      headers: {
        "X-Device-Id": deviceId,
      },
    });
    console.info("[analytics] events sent", {
      status: response.status,
      count: batchSize,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status === "number"
        ? ((error as { response?: { status?: number } }).response?.status as number)
        : undefined;
    console.error("[analytics] events failed", {
      status,
      count: batchSize,
      message: error instanceof Error ? error.message : "Unknown analytics error",
    });
    throw error;
  }
};

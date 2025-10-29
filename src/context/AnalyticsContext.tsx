import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { postAnalyticsEvents, type AnalyticsEventPayload } from "@/services/analyticsApi";
import { getOrCreateDeviceId } from "@/lib/device-id";

type TrackOptions = {
  immediate?: boolean;
};

export interface AnalyticsEventInput extends Omit<AnalyticsEventPayload, "device_id" | "session_id"> {
  device_id?: string;
  session_id?: string;
}

interface AnalyticsContextValue {
  trackEvent: (event: AnalyticsEventInput, options?: TrackOptions) => void;
  flushQueue: () => Promise<void>;
  deviceId: string;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

const MAX_BATCH_SIZE = 50;
const AUTO_FLUSH_INTERVAL = 5_000;
const QUEUE_THRESHOLD = 20;

const createSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [sessionId] = useState(createSessionId);
  const queueRef = useRef<AnalyticsEventPayload[]>([]);
  const isFlushingRef = useRef(false);

  const flushQueue = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (queueRef.current.length === 0) return;

    isFlushingRef.current = true;
    const batch = queueRef.current.splice(0, MAX_BATCH_SIZE);
    try {
      await postAnalyticsEvents(batch);
    } catch (error) {
      queueRef.current = [...batch, ...queueRef.current];
      console.error("Không thể gửi analytics events:", error);
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const enqueueEvent = useCallback(
    (event: AnalyticsEventInput, options?: TrackOptions) => {
      if (!event.event_name || event.event_name.trim().length === 0) return;
      const normalizedEvent: AnalyticsEventPayload = {
        ...event,
        event_name: event.event_name.trim(),
        device_id: event.device_id ?? deviceId,
        session_id: event.session_id ?? sessionId,
      };
      queueRef.current.push(normalizedEvent);

      if (options?.immediate || queueRef.current.length >= QUEUE_THRESHOLD) {
        flushQueue().catch((error) => {
          console.error("flushQueue immediate error:", error);
        });
      }
    },
    [deviceId, flushQueue, sessionId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushQueue().catch(() => undefined);
      }
    };
    const handleBeforeUnload = () => {
      flushQueue().catch(() => undefined);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [flushQueue]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      flushQueue().catch(() => undefined);
    }, AUTO_FLUSH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [flushQueue]);

  const contextValue = useMemo<AnalyticsContextValue>(
    () => ({
      trackEvent: enqueueEvent,
      flushQueue,
      deviceId,
      sessionId,
    }),
    [deviceId, enqueueEvent, flushQueue, sessionId],
  );

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalyticsContext phải được sử dụng trong AnalyticsProvider");
  }
  return context;
};

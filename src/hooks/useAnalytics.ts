import { useAnalyticsContext, type AnalyticsEventInput } from "@/context/AnalyticsContext";

interface TrackOptions {
  immediate?: boolean;
}

export const useAnalytics = () => {
  const { trackEvent, flushQueue, deviceId, sessionId } = useAnalyticsContext();

  const logEvent = (event: AnalyticsEventInput, options?: TrackOptions) => {
    trackEvent(event, options);
  };

  return {
    trackEvent: logEvent,
    flushQueue,
    deviceId,
    sessionId,
  };
};

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const PERSONALIZED_QUERY_KEY = ["personalized-recommendations"];

export const useRecommendationRealtimeRefresh = (delayMs = 3_500) => {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (typeof window === "undefined") return;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: PERSONALIZED_QUERY_KEY });
    }, delayMs);
  }, [delayMs, queryClient]);

  return scheduleRefresh;
};


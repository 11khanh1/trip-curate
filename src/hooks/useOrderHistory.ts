import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

import { fetchBookings, type BookingListResponse, type BookingQueryParams } from "@/services/bookingApi";

const DEFAULT_PARAMS: BookingQueryParams = {
  per_page: 5,
};

type QueryKey = ["order-history", BookingQueryParams];

export const useOrderHistory = (
  params: BookingQueryParams = {},
  options?: Omit<UseQueryOptions<BookingListResponse, unknown, BookingListResponse, QueryKey>, "queryKey" | "queryFn">,
): UseQueryResult<BookingListResponse> => {
  const mergedParams = { ...DEFAULT_PARAMS, ...params };

  return useQuery({
    queryKey: ["order-history", mergedParams],
    queryFn: () => fetchBookings(mergedParams),
    staleTime: 60 * 1000,
    ...options,
  });
};


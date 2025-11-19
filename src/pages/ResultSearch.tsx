import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Sparkles, TrendingUp, Wallet, MapPin } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import {
  FilterSidebarKlook,
  type SearchFilterState,
  type QuickDateFilter,
} from "@/components/search/FilterSidebar";
import { ActivityCardKlook } from "@/components/search/ActivityCard";
import { ResultsHeader } from "@/components/search/ResultsHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { fetchTours, type PublicTour, type TourSortOption, type ToursQueryParams } from "@/services/publicApi";
import { getTourStartingPrice } from "@/lib/tour-utils";

const PER_PAGE = 12;
const DEFAULT_TOUR_IMAGE = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop";

const sortOptions = [
  { value: "recommended", label: "Gợi ý hàng đầu" },
  { value: "popular", label: "Phổ biến" },
  { value: "most_booked", label: "Đặt nhiều nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "top_rated", label: "Ưa thích nhất" },
  { value: "newest", label: "Mới cập nhật" },
  { value: "recent", label: "Mới nhất" },
  { value: "price_low", label: "Giá thấp đến cao" },
  { value: "price_high", label: "Giá cao đến thấp" },
];

const sortMapping: Record<string, TourSortOption | undefined> = {
  recommended: undefined,
  popular: "popular",
  most_booked: "most_booked",
  rating: "rating",
  top_rated: "top_rated",
  newest: "newest",
  recent: "recent",
  price_low: "price_low",
  price_high: "price_high",
};

const PRICE_RANGE_DEFAULT: [number, number] = [0, 10_000_000];

const parseNumberParam = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const createDefaultFilters = (params?: URLSearchParams): SearchFilterState => {
  const priceMin = parseNumberParam(params?.get("price_min"));
  const priceMax = parseNumberParam(params?.get("price_max"));
  const quickDateParam = params?.get("departure");
  const quickDate =
    quickDateParam === "today" || quickDateParam === "tomorrow" ? quickDateParam : null;
  const destinations = params
    ? Array.from(new Set(params.getAll("destinations[]").map((value) => value.trim()))).filter(
        (value) => value.length > 0,
      )
    : [];
  const customDestination = params?.get("destination") ?? "";
  const departureDate = params?.get("departure_date") ?? null;
  const startDate = params?.get("start_date") ?? null;
  const durationMin = parseNumberParam(params?.get("duration_min"));
  const durationMax = parseNumberParam(params?.get("duration_max"));

  return {
    quickDate,
    priceRange: [
      priceMin ?? PRICE_RANGE_DEFAULT[0],
      priceMax ?? PRICE_RANGE_DEFAULT[1],
    ] as [number, number],
    destinations,
    customDestination: customDestination ?? "",
    departureDate: departureDate && departureDate.trim().length > 0 ? departureDate : null,
    startDate: startDate && startDate.trim().length > 0 ? startDate : null,
    durationRange: [durationMin, durationMax],
  };
};

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveTourRating = (tour: PublicTour): number | null => {
  const candidates = [
    tour.average_rating,
    tour.rating_average,
    (tour as Record<string, unknown>)?.rating,
    (tour as Record<string, unknown>)?.ratingAverage,
  ];
  for (const candidate of candidates) {
    const parsed = coerceNumber(candidate);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
};

const resolveReviewCount = (tour: PublicTour): number | null => {
  const candidates = [
    tour.rating_count,
    tour.reviews_count,
    (tour as Record<string, unknown>)?.reviewsCount,
    (tour as Record<string, unknown>)?.review_count,
  ];
  for (const candidate of candidates) {
    const parsed = coerceNumber(candidate);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }
  return null;
};

const resolveBookingCount = (tour: PublicTour): number | null => {
  const parsed = coerceNumber(tour.bookings_count);
  if (parsed !== null && parsed >= 0) return parsed;
  const fallback = (tour as Record<string, unknown>)?.bookingsCount;
  const parsedFallback = coerceNumber(fallback);
  return parsedFallback !== null && parsedFallback >= 0 ? parsedFallback : null;
};

const formatDateLabel = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("vi-VN");
};

const resolveTourImage = (tour: PublicTour): string => {
  const pickFirstString = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    return null;
  };

  const pickFromArray = (items?: unknown): string | null => {
    if (!Array.isArray(items)) return null;
    for (const entry of items) {
      const candidate = pickFirstString(entry);
      if (candidate) return candidate;
    }
    return null;
  };

  const candidates: Array<string | null> = [
    pickFirstString(tour.thumbnail_url),
    pickFirstString((tour as Record<string, unknown>)?.thumbnail),
    pickFromArray(tour.media),
    pickFromArray(tour.gallery),
  ];

  const raw = candidates.find((value) => typeof value === "string" && value.length > 0);
  if (!raw) return DEFAULT_TOUR_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  const baseURL = apiClient.defaults.baseURL ?? "";
  if (!baseURL) return raw;
  const normalizedBase = baseURL.replace(/\/api\/?$/, "/");
  return `${normalizedBase}${raw.startsWith("/") ? raw.slice(1) : raw}`;
};

const mapTourToActivityCard = (tour: PublicTour) => {
  const title = tour.title ?? tour.name ?? "Tour du lịch";
  const location = tour.destination ?? tour.partner?.company_name ?? "Việt Nam";
  const image = resolveTourImage(tour);
  const price = getTourStartingPrice(tour);
  const identifier = (tour.id ?? tour.uuid ?? tour.slug ?? tour.name) as string | undefined;
  const href =
    identifier && typeof identifier === "string" && identifier.trim().length > 0
      ? `/activity/${encodeURIComponent(identifier)}`
      : undefined;
  const category =
    tour.categories && tour.categories.length > 0
      ? tour.categories[0]?.name ?? "Tour"
      : tour.partner?.company_name ?? "Tour";
  const bookingCount = resolveBookingCount(tour);
  const rating = resolveTourRating(tour) ?? 4.9;
  const reviews = resolveReviewCount(tour) ?? bookingCount ?? 0;
  const bookedCount =
    bookingCount && bookingCount > 0 ? `${bookingCount.toLocaleString("vi-VN")} lượt đặt` : undefined;
  const upcomingSchedule = getUpcomingScheduleDate(tour);

  return {
    image,
    category,
    location,
    title,
    bookingType: upcomingSchedule
      ? `Khởi hành ${upcomingSchedule.toLocaleDateString("vi-VN")}`
      : undefined,
    rating,
    reviews,
    booked: bookedCount,
    price,
    discount: undefined,
    href,
  };
};

const getUpcomingScheduleDate = (tour: PublicTour): Date | null => {
  if (!Array.isArray(tour.schedules) || tour.schedules.length === 0) return null;
  const validDates = tour.schedules
    .map((schedule) => schedule?.start_date)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return validDates[0] ?? null;
};

const QUICK_DATE_LABELS: Record<QuickDateFilter, string> = {
  today: "Khởi hành hôm nay",
  tomorrow: "Khởi hành ngày mai",
};

type PaginationMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
};

const ResultSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = (searchParams.get("keyword") ?? "").trim();

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>(() => {
    const sortParam = searchParams.get("sort");
    if (!sortParam) return "recommended";
    const matched = Object.entries(sortMapping).find(([, apiValue]) => apiValue === sortParam);
    return matched?.[0] ?? "recommended";
  });
  const [page, setPage] = useState(() => {
    const pageParam = Number(searchParams.get("page"));
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  });
  const [filters, setFilters] = useState<SearchFilterState>(() => createDefaultFilters(searchParams));

  const handleFiltersChange = useCallback(
    (patch: Partial<SearchFilterState>) => {
      setFilters((prev) => {
        const next: SearchFilterState = {
          ...prev,
          ...patch,
        };
        if (patch.priceRange) {
          next.priceRange = [...patch.priceRange] as [number, number];
        }
        if (patch.destinations) {
          const normalized = patch.destinations
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
          next.destinations = Array.from(new Set(normalized));
        }
        if (patch.durationRange) {
          next.durationRange = [...patch.durationRange] as [number | null, number | null];
        }
        return next;
      });
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
    setPage(1);
    if (searchParams.get("keyword")) {
      const params = new URLSearchParams(searchParams);
      params.delete("keyword");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.priceRange[0],
    filters.priceRange[1],
    filters.quickDate,
    filters.destinations,
    filters.customDestination,
    filters.departureDate,
    filters.startDate,
    filters.durationRange[0],
    filters.durationRange[1],
  ]);

  const queryPayload = useMemo(() => {
    const [priceMin, priceMax] = filters.priceRange;
    const [durationMin, durationMax] = filters.durationRange;
    const trimmedDestination = filters.customDestination.trim();
    const normalizedDestinations = filters.destinations
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const payload: ToursQueryParams = {
      status: "approved",
      search: keyword.length > 0 ? keyword : undefined,
      destination: trimmedDestination.length > 0 ? trimmedDestination : undefined,
      destinations: normalizedDestinations.length > 0 ? normalizedDestinations : undefined,
      departure: filters.quickDate ?? undefined,
      departure_date: filters.departureDate ?? undefined,
      start_date: filters.startDate ?? undefined,
      price_min: priceMin > PRICE_RANGE_DEFAULT[0] ? priceMin : undefined,
      price_max: priceMax < PRICE_RANGE_DEFAULT[1] ? priceMax : undefined,
      duration_min: durationMin ?? undefined,
      duration_max: durationMax ?? undefined,
      sort: sortMapping[sortBy],
      page,
      per_page: PER_PAGE,
    };
    return payload;
  }, [filters, keyword, page, sortBy]);

  const toursQuery = useQuery({
    queryKey: ["public-tours-search", queryPayload],
    queryFn: () => fetchTours(queryPayload),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const toursData = toursQuery.data?.data ?? [];
  const metaRecord = (toursQuery.data?.meta ?? {}) as Record<string, unknown>;
  const metaCurrentPage = coerceNumber(metaRecord.current_page);
  const metaLastPage = coerceNumber(metaRecord.last_page);
  const metaPerPage = coerceNumber(metaRecord.per_page) ?? PER_PAGE;
  const metaTotal = coerceNumber(metaRecord.total);

  useEffect(() => {
    if (toursQuery.isFetching) return;
    if (metaCurrentPage && metaCurrentPage !== page) {
      setPage(metaCurrentPage);
    }
  }, [metaCurrentPage, page, toursQuery.isFetching]);

  const totalResults = metaTotal ?? toursData.length;
  const currentPage = metaCurrentPage ?? page;
  const lastPage = metaLastPage ?? Math.max(1, Math.ceil(Math.max(totalResults, 1) / metaPerPage));
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const paginationRange = useMemo<(number | "ellipsis")[]>(() => {
    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const range: (number | "ellipsis")[] = [1];
    const siblings = 1;
    const start = Math.max(2, currentPage - siblings);
    const end = Math.min(lastPage - 1, currentPage + siblings);

    if (start > 2) range.push("ellipsis");
    for (let i = start; i <= end; i += 1) range.push(i);
    if (end < lastPage - 1) range.push("ellipsis");
    range.push(lastPage);
    return range;
  }, [currentPage, lastPage]);

  const handleSortChange = useCallback(
    (value: string) => {
      setSortBy(value);
      setPage(1);
      const params = new URLSearchParams(searchParams);
      const mappedSort = sortMapping[value];
      if (mappedSort) {
        params.set("sort", mappedSort);
      } else {
        params.delete("sort");
      }
      params.set("page", "1");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!Number.isFinite(nextPage)) return;
      const clamped = Math.min(Math.max(1, Math.trunc(nextPage)), lastPage);
      if (clamped === page) return;
      setPage(clamped);
      const params = new URLSearchParams(searchParams);
      params.set("page", String(clamped));
      setSearchParams(params, { replace: true });
    },
    [lastPage, page, searchParams, setSearchParams],
  );

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (keyword.length > 0) {
      chips.push(`Từ khóa: "${keyword}"`);
    }
    const [priceMin, priceMax] = filters.priceRange;
    const isPriceFiltered =
      priceMin > PRICE_RANGE_DEFAULT[0] || priceMax < PRICE_RANGE_DEFAULT[1];
    if (isPriceFiltered) {
      chips.push(
        `Giá: ₫${priceMin.toLocaleString("vi-VN")} - ₫${priceMax.toLocaleString("vi-VN")}`,
      );
    }
    if (filters.destinations.length > 0) {
      chips.push(`Điểm đến: ${filters.destinations.join(", ")}`);
    }
    const trimmedCustomDestination = filters.customDestination.trim();
    if (trimmedCustomDestination.length > 0) {
      chips.push(`Điểm đến: ${trimmedCustomDestination}`);
    }
    if (filters.departureDate) {
      chips.push(`Khởi hành: ${formatDateLabel(filters.departureDate)}`);
    }
    if (filters.startDate) {
      chips.push(`Từ ngày: ${formatDateLabel(filters.startDate)}`);
    }
    if (filters.durationRange[0] !== null) {
      chips.push(`Tối thiểu: ${filters.durationRange[0]} ngày`);
    }
    if (filters.durationRange[1] !== null) {
      chips.push(`Tối đa: ${filters.durationRange[1]} ngày`);
    }
    if (filters.quickDate) {
      chips.push(QUICK_DATE_LABELS[filters.quickDate]);
    }
    return chips;
  }, [filters, keyword]);

  const sortedTours = useMemo(() => {
    if (!toursData.length) return toursData;
    if (sortBy === "price_low" || sortBy === "price_high") {
      const clone = [...toursData];
      clone.sort((a, b) => {
        const priceA = getTourStartingPrice(a);
        const priceB = getTourStartingPrice(b);
        return priceA - priceB;
      });
      return sortBy === "price_low" ? clone : clone.reverse();
    }
    return toursData;
  }, [toursData, sortBy]);

  const mappedActivities =
    sortedTours.length > 0 ? sortedTours.map(mapTourToActivityCard) : [];

  const priceStats = useMemo(() => {
    const prices = toursData
      .map((tour) => getTourStartingPrice(tour))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!prices.length) return null;
    prices.sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const avg = Math.round(prices.reduce((acc, value) => acc + value, 0) / prices.length);
    return { min, max, avg };
  }, [toursData]);

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <TravelHeader />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-white to-white" />
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[2fr,1fr] lg:items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Khám phá trải nghiệm
                </div>
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                  {keyword.length > 0 ? `Tour & hoạt động: ${keyword}` : "Tất cả tour và hoạt động nổi bật"}
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">
                  {toursQuery.isLoading
                    ? "Đang tải dữ liệu tour phù hợp..."
                    : `Tìm thấy ${totalResults.toLocaleString("vi-VN")} lựa chọn được cập nhật liên tục từ đối tác VietTravel. Tinh chỉnh bộ lọc để khám phá đúng hành trình của bạn.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="outline" className="border-primary/40 bg-white/70 text-primary">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-primary/20 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <MapPin className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Kết quả</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {totalResults.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-xs text-muted-foreground">Trải nghiệm đang mở đặt chỗ</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Giá từ</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {priceStats ? `₫ ${priceStats.min.toLocaleString("vi-VN")}` : "Đang cập nhật"}
                  </p>
                  <p className="text-xs text-muted-foreground">Mức giá thấp nhất hiện có</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Trung bình</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {priceStats ? `₫ ${priceStats.avg.toLocaleString("vi-VN")}` : "Đang cập nhật"}
                  </p>
                  <p className="text-xs text-muted-foreground">Giá trung bình của các tour</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:hidden" />

          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24`}>
            <FilterSidebarKlook
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </aside>

          <section className="flex-1 min-w-0 space-y-6">
            <ResultsHeader
              totalResults={totalResults}
              selectedFilters={activeFilters.length}
              sortValue={sortBy}
              sortOptions={sortOptions}
              keyword={keyword.length > 0 ? keyword : undefined}
              onSortChange={handleSortChange}
              onClearFilters={handleResetFilters}
            />

            {toursQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-[360px] rounded-xl" />
                ))}
              </div>
            ) : mappedActivities.length === 0 ? (
              <div className="rounded-xl border px-6 py-12 text-center text-muted-foreground">
                Không tìm thấy tour phù hợp với tiêu chí hiện tại
                {keyword.length > 0 ? ` cho từ khóa "${keyword}"` : ""}. Vui lòng chỉnh sửa bộ lọc và thử lại.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {mappedActivities.map((activity, index) => (
                    <ActivityCardKlook key={`${activity.title}-${index}`} {...activity} />
                  ))}
                </div>

                {lastPage > 1 ? (
                  <Pagination className="w-full justify-center">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (isFirstPage) return;
                            handlePageChange(currentPage - 1);
                          }}
                          className={isFirstPage ? "pointer-events-none opacity-50" : undefined}
                          aria-disabled={isFirstPage}
                          tabIndex={isFirstPage ? -1 : undefined}
                        />
                      </PaginationItem>
                      {paginationRange.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={item === currentPage}
                              onClick={(event) => {
                                event.preventDefault();
                                handlePageChange(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (isLastPage) return;
                            handlePageChange(currentPage + 1);
                          }}
                          className={isLastPage ? "pointer-events-none opacity-50" : undefined}
                          aria-disabled={isLastPage}
                          tabIndex={isLastPage ? -1 : undefined}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-full bg-background/95 p-2 shadow-lg backdrop-blur">
          <Button variant="outline" className="flex-1" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Bộ lọc
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Lên đầu trang
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResultSearch;

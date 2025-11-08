import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  fetchHighlightCategories,
  fetchTours,
  fetchTrendingTours,
  type HomeCategory,
  type PublicTour,
} from "@/services/publicApi";
import { apiClient } from "@/lib/api-client";
import { getTourPriceInfo } from "@/lib/tour-utils";

const PER_PAGE = 50;

const fallbackTours = [
  {
    id: "fallback-1",
    title: "Khám phá vịnh Hạ Long trong ngày",
    location: "Quảng Ninh",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 3560,
    bookingsCount: 46800,
    price: 990000,
    duration: "1 ngày",
    category: "Tour",
    features: ["Đón tại khách sạn", "Hướng dẫn viên", "Buffet hải sản"],
    isPopular: true,
  },
  {
    id: "fallback-2",
    title: "Combo nghỉ dưỡng Phú Quốc 3N2Đ",
    location: "Phú Quốc",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    rating: 4.8,
    reviewCount: 2410,
    bookingsCount: 32500,
    price: 3250000,
    duration: "3 ngày",
    category: "Combo nghỉ dưỡng",
    features: ["Resort 5*", "Vé tham quan", "Xe đưa đón sân bay"],
    isPopular: true,
  },
  {
    id: "fallback-3",
    title: "Trải nghiệm văn hóa bản địa ở Sa Pa",
    location: "Lào Cai",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 1820,
    bookingsCount: 18200,
    price: 790000,
    duration: "2 ngày",
    category: "Trải nghiệm",
    features: ["Hướng dẫn viên", "Ẩm thực địa phương", "Xe đưa đón"],
  },
  {
    id: "fallback-4",
    title: "Vé vào VinWonders Nha Trang",
    location: "Nha Trang",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 4320,
    bookingsCount: 47800,
    price: 880000,
    duration: "Trong ngày",
    category: "Công viên giải trí",
    features: ["Cáp treo", "Show biểu diễn", "Ẩm thực"],
  },
];

const DEFAULT_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=600&fit=crop";

const normalizeDuration = (duration?: number | string | null) => {
  if (duration === null || duration === undefined) return "Linh hoạt";
  if (typeof duration === "number") {
    if (!Number.isFinite(duration)) return "Linh hoạt";
    if (duration <= 0) return "Trong ngày";
    if (duration === 1) return "1 ngày";
    return `${duration} ngày`;
  }
  const trimmed = duration.toString().trim();
  return trimmed.length > 0 ? trimmed : "Linh hoạt";
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
    (tour as Record<string, unknown> | undefined)?.averageRating,
    (tour as Record<string, unknown> | undefined)?.rating,
  ];
  for (const candidate of candidates) {
    const parsed = coerceNumber(candidate);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const resolveReviewCount = (tour: PublicTour): number | null => {
  const candidates = [
    tour.rating_count,
    tour.reviews_count,
    (tour as Record<string, unknown> | undefined)?.reviewsCount,
    (tour as Record<string, unknown> | undefined)?.review_count,
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
  const fromMeta = (tour as Record<string, unknown> | undefined)?.bookingsCount;
  const parsedMeta = coerceNumber(fromMeta);
  return parsedMeta !== null && parsedMeta >= 0 ? parsedMeta : null;
};

const mapTourToCard = (tour: PublicTour) => {
  const title = tour.title ?? tour.name ?? "Tour chưa đặt tên";
  const location = tour.destination ?? tour.partner?.company_name ?? "Việt Nam";
  const resolveTourImage = () => {
    const candidates: Array<string | null | undefined> = [
      tour.thumbnail_url,
      (tour as Record<string, unknown>)?.thumbnail as string | undefined,
      Array.isArray(tour.media) ? tour.media[0] : undefined,
      Array.isArray(tour.gallery) ? tour.gallery[0] : undefined,
    ];
    const raw = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    if (!raw) return DEFAULT_TOUR_IMAGE;
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const base = apiClient.defaults.baseURL ?? "";
    if (!base) return trimmed;
    const normalizedBase = base.replace(/\/api\/?$/, "/");
    return `${normalizedBase}${trimmed.startsWith("/") ? trimmed.slice(1) : trimmed}`;
  };
  const image = resolveTourImage();
  const priceInfo = getTourPriceInfo(tour);
  const price = priceInfo.price;
  const category =
    tour.categories && tour.categories.length > 0
      ? tour.categories[0]?.name ?? "Tour"
      : tour.partner?.company_name ?? "Tour";

  const firstSchedule = tour.schedules?.[0];
  const scheduleLabel =
    firstSchedule?.start_date && !Number.isNaN(new Date(firstSchedule.start_date).getTime())
      ? `Khởi hành ${new Date(firstSchedule.start_date).toLocaleDateString("vi-VN")}`
      : undefined;

  const features = [
    scheduleLabel ?? "Lịch trình linh hoạt",
    tour.partner?.user?.name ? `Đối tác: ${tour.partner.user.name}` : "Hỗ trợ 24/7",
    "Miễn phí huỷ trong 24h",
  ];

  const fallbackId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tour-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  const rating = resolveTourRating(tour);
  const reviewCount = resolveReviewCount(tour);
  const bookingsCount = resolveBookingCount(tour);
  const promotionLabel =
    priceInfo.autoPromotion?.description ??
    (priceInfo.autoPromotion?.code ? `Mã ${priceInfo.autoPromotion.code}` : undefined) ??
    (typeof priceInfo.discountPercent === "number" && priceInfo.discountPercent > 0
      ? `Giảm ${Math.round(priceInfo.discountPercent)}%`
      : undefined);

  return {
    id: String(tour.id ?? tour.uuid ?? fallbackId),
    title,
    location,
    image,
    rating,
    reviewCount,
    bookingsCount,
    price,
    originalPrice: priceInfo.originalPrice,
    discount:
      typeof priceInfo.discountPercent === "number" ? Math.round(priceInfo.discountPercent) : undefined,
    promotionLabel,
    duration: normalizeDuration(tour.duration),
    category,
    features,
    isPopular: true,
  };
};

const buildCategoryTabs = (categories: HomeCategory[] | undefined) => {
  const base = [{ id: "all", label: "Tất cả" }];
  if (!categories || categories.length === 0) return base;
  return base.concat(
    categories.map((category) => ({
      id: String(category.id),
      label: category.name ?? "Danh mục",
    })),
  );
};

const AllActivities = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);

  const highlightCategoriesQuery = useQuery({
    queryKey: ["public-highlight-categories"],
    queryFn: () => fetchHighlightCategories(12),
    staleTime: 10 * 60 * 1000,
  });

  const categoryTabs = useMemo(
    () => buildCategoryTabs(highlightCategoriesQuery.data),
    [highlightCategoriesQuery.data],
  );

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const trendingToursQuery = useQuery({
    queryKey: ["public-tours-trending", { limit: PER_PAGE, days: 60 }],
    queryFn: () => fetchTrendingTours({ limit: PER_PAGE, days: 60 }),
    enabled: activeCategory === "all",
    staleTime: 2 * 60 * 1000,
  });

  const toursQuery = useQuery({
    queryKey: ["public-tours", activeCategory, page],
    queryFn: () =>
      fetchTours({
        status: "approved",
        page,
        per_page: PER_PAGE,
        ...(activeCategory !== "all" ? { category_id: activeCategory } : {}),
        sort: "created_desc",
      }),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    enabled: activeCategory !== "all",
  });

  const isLoading = activeCategory === "all" ? trendingToursQuery.isLoading : toursQuery.isLoading;
  const toursData =
    activeCategory === "all"
      ? trendingToursQuery.data ?? []
      : toursQuery.data?.data ?? [];
  const toursMeta =
    activeCategory === "all" ? undefined : toursQuery.data?.meta ?? {};

  const mappedTours = toursData.length > 0 ? toursData.map(mapTourToCard) : fallbackTours;

  const currentPage =
    activeCategory === "all"
      ? 1
      : Number(((toursMeta?.current_page as number | undefined) ?? page)) || 1;
  const lastPage =
    activeCategory === "all"
      ? 1
      : Number(
          (toursMeta?.last_page as number | undefined) ??
            (toursData.length === 0
              ? 1
              : Math.ceil(
                  ((toursMeta?.total as number | undefined) ?? PER_PAGE) / PER_PAGE,
                )),
        ) || 1;
  const totalResults =
    activeCategory === "all"
      ? toursData.length
      : Number((toursMeta?.total as number | undefined) ?? toursData.length) || toursData.length;
  const rangeStart =
    activeCategory === "all"
      ? totalResults === 0 ? 0 : 1
      : Number(
          (toursMeta?.from as number | undefined) ??
            (totalResults === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1),
        ) || 0;
  const rangeEnd =
    activeCategory === "all"
      ? totalResults
      : Number(
          (toursMeta?.to as number | undefined) ??
            (totalResults === 0 ? 0 : Math.min(totalResults, currentPage * PER_PAGE)),
        ) || 0;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;
  const shouldRenderPagination = activeCategory !== "all" && totalResults > 0;

  const paginationRange = useMemo<(number | "ellipsis")[]>(() => {
    const totalPages = Math.max(1, lastPage);
    const current = Math.min(Math.max(1, currentPage), totalPages);
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const range: (number | "ellipsis")[] = [1];
    const siblings = 1;
    const start = Math.max(2, current - siblings);
    const end = Math.min(totalPages - 1, current + siblings);

    if (start > 2) {
      range.push("ellipsis");
    }

    for (let i = start; i <= end; i += 1) {
      range.push(i);
    }

    if (end < totalPages - 1) {
      range.push("ellipsis");
    }

    range.push(totalPages);
    return range;
  }, [currentPage, lastPage]);

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value);
  };

  const handlePageChange = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(nextPage)), lastPage);
    if (clamped === page) return;
    setPage(clamped);
  };

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />

      <main className="container mx-auto px-4 py-8">
        {/* === PHẦN TABS CHÍNH ĐÃ BỊ XÓA === */}

        <>
          <h1 className="text-4xl font-bold text-foreground mb-8">Danh sách hoạt động</h1>

          <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="mb-8">
            <TabsList className="bg-background border-b w-full justify-start rounded-none h-auto p-0 overflow-x-auto">
              {categoryTabs.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 data-[state=active]:bg-transparent whitespace-nowrap"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-[420px] rounded-xl" />
              ))}
            </div>
          ) : mappedTours.length === 0 ? (
            <div className="mb-12 rounded-xl border px-6 py-12 text-center text-muted-foreground">
              Không tìm thấy tour phù hợp theo bộ lọc hiện tại.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {mappedTours.map((activity) => (
                  <TourCard key={activity.id} {...activity} />
                ))}
              </div>

              {shouldRenderPagination ? (
                <div className="flex flex-col gap-4 px-2 pb-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <span>
                    Hiển thị {rangeStart}-{rangeEnd} trên tổng {totalResults} tour
                  </span>
                  <Pagination className="w-auto gap-2 md:mx-0 md:justify-end">
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
                                handlePageChange(item as number);
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
                </div>
              ) : null}
            </>
          )}
        </>
      </main>

      <Footer />
    </div>
  );
};

export default AllActivities;

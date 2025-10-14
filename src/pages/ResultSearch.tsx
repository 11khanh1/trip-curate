import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { TabNavigation } from "@/components/search/TabNavigation";
import { FilterSidebarKlook } from "@/components/search/FilterSidebar";
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
import { fetchTours, type PublicTour, type TourSortOption } from "@/services/publicApi";

const PER_PAGE = 12;

const sortOptions = [
  { value: "popular", label: "Phổ biến" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "new", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao xuống thấp" },
];

const sortMapping: Record<string, TourSortOption | undefined> = {
  popular: "created_desc",
  rating: "created_desc",
  new: "created_desc",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
};

const normalizePrice = (tour: PublicTour) => {
  if (typeof tour.base_price === "number" && Number.isFinite(tour.base_price)) {
    return Math.max(0, tour.base_price);
  }
  if (typeof tour.season_price === "number" && Number.isFinite(tour.season_price)) {
    return Math.max(0, tour.season_price);
  }
  const schedulePrice = tour.schedules?.find(
    (schedule) => typeof schedule.season_price === "number" && Number.isFinite(schedule.season_price),
  )?.season_price;
  if (typeof schedulePrice === "number") {
    return Math.max(0, schedulePrice);
  }
  return 0;
};

const mapTourToActivityCard = (tour: PublicTour) => {
  const title = tour.title ?? tour.name ?? "Tour du lịch";
  const location = tour.destination ?? tour.partner?.company_name ?? "Việt Nam";
  const image =
    (tour.thumbnail_url && tour.thumbnail_url.length > 0 ? tour.thumbnail_url : undefined) ??
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop";
  const price = normalizePrice(tour);
  const category =
    tour.categories && tour.categories.length > 0
      ? tour.categories[0]?.name ?? "Tour"
      : tour.partner?.company_name ?? "Tour";
  const bookedCount =
    tour.bookings_count && tour.bookings_count > 0
      ? `${tour.bookings_count.toLocaleString("vi-VN")} lượt đặt`
      : undefined;

  return {
    image,
    category,
    location,
    title,
    bookingType: tour.schedules?.[0]?.start_date
      ? `Khởi hành ${new Date(tour.schedules[0].start_date!).toLocaleDateString("vi-VN")}`
      : undefined,
    rating: 4.8,
    reviews: tour.bookings_count ?? 1200,
    booked: bookedCount,
    price,
    discount: undefined,
  };
};

const ResultSearch = () => {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get("keyword") ?? "").trim();

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [page, setPage] = useState(1);

  const toursQuery = useQuery({
    queryKey: ["public-tours-search", keyword, sortBy, page],
    queryFn: () =>
      fetchTours({
        status: "approved",
        search: keyword || undefined,
        page,
        per_page: PER_PAGE,
        sort: sortMapping[sortBy],
      }),
    enabled: keyword.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const toursData = toursQuery.data?.data ?? [];
  const toursMeta = toursQuery.data?.meta ?? {};

  const currentPage = Number(toursMeta.current_page ?? page) || 1;
  const totalResults = Number(toursMeta.total ?? toursData.length) || toursData.length;
  const lastPage =
    Number(toursMeta.last_page ?? (totalResults > 0 ? Math.ceil(totalResults / PER_PAGE) : 1)) || 1;
  const rangeStart =
    Number(toursMeta.from ?? (totalResults === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1)) || 0;
  const rangeEnd =
    Number(toursMeta.to ?? (totalResults === 0 ? 0 : Math.min(totalResults, currentPage * PER_PAGE))) ||
    0;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

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

    if (start > 2) range.push("ellipsis");
    for (let i = start; i <= end; i += 1) range.push(i);
    if (end < totalPages - 1) range.push("ellipsis");
    range.push(totalPages);
    return range;
  }, [currentPage, lastPage]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(nextPage)), lastPage);
    if (clamped === page) return;
    setPage(clamped);
  };

  const activeFilters = useMemo(
    () => (keyword.length > 0 ? [`Từ khóa: "${keyword}"`] : []),
    [keyword],
  );

  const mappedActivities =
    toursData.length > 0 ? toursData.map(mapTourToActivityCard) : [];

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <TravelHeader />
      <TabNavigation />

      <header className="border-b bg-gradient-to-r from-orange-100 via-white to-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Kết quả tìm kiếm cho
            </p>
            <h1 className="text-3xl font-bold text-foreground">
              {keyword.length > 0 ? keyword : "Tour & Hoạt động"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {toursQuery.isLoading
                ? "Đang tải dữ liệu tour phù hợp..."
                : `Tìm thấy ${totalResults} tour phù hợp với tiêu chí của bạn. Sử dụng bộ lọc để tinh chỉnh kết quả nhanh hơn.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="bg-white/70 border border-orange-200 text-orange-600">
                  {filter}
                </Badge>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
            <div className="flex items-center gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={sortBy === option.value ? "default" : "outline"}
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
            </Button>
          </div>

          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24`}>
            <FilterSidebarKlook />
          </aside>

          <section className="flex-1 min-w-0 space-y-6">
            <ResultsHeader
              totalResults={totalResults}
              selectedFilters={activeFilters.length}
              sortValue={sortBy}
              sortOptions={sortOptions}
              onSortChange={handleSortChange}
            />

            {toursQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-[360px] rounded-xl" />
                ))}
              </div>
            ) : mappedActivities.length === 0 ? (
              <div className="rounded-xl border px-6 py-12 text-center text-muted-foreground">
                Không tìm thấy tour phù hợp với từ khóa "{keyword}". Vui lòng thử lại với từ khóa khác.
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

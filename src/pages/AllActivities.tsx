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
  type HomeCategory,
  type PublicTour,
} from "@/services/publicApi";

const PER_PAGE = 12;

const fallbackTours = [
  {
    id: "fallback-1",
    title: "Khám phá vịnh Hạ Long trong ngày",
    location: "Quảng Ninh",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 3560,
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
    price: 880000,
    duration: "Trong ngày",
    category: "Công viên giải trí",
    features: ["Cáp treo", "Show biểu diễn", "Ẩm thực"],
  },
];

const regions = [
  { id: "1", name: "VIỆT NAM", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop", url: "/regions/vietnam" },
  { id: "2", name: "NHẬT BẢN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=100&h=100&fit=crop", url: "/regions/japan" },
  { id: "3", name: "SINGAPORE", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop", url: "/regions/singapore" },
  { id: "4", name: "THÁI LAN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop", url: "/regions/thailand" },
];

const destinations = [
  { id: "1", name: "Sapa", subtitle: "Trải nghiệm mùa mây", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&h=100&fit=crop" },
  { id: "2", name: "Thượng Hải", subtitle: "Thành phố không ngủ", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&h=100&fit=crop" },
  { id: "3", name: "Tokyo", subtitle: "Văn hóa & công nghệ", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop" },
  { id: "4", name: "Hà Nội", subtitle: "Phố cổ nghìn năm", image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=100&h=100&fit=crop" },
];

const landmarks = [
  { id: "1", name: "Cung điện Grand", location: "Thái Lan", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop" },
  { id: "2", name: "Núi Phú Sĩ", location: "Nhật Bản", image: "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=100&h=100&fit=crop" },
  { id: "3", name: "Tokyo Disney Resort", location: "Nhật Bản", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=100&h=100&fit=crop" },
  { id: "4", name: "Bà Nà Hills", location: "Việt Nam", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop" },
];

const exploreCategories = [
  {
    id: "1",
    icon: "🎯",
    title: "Các hoạt động nền trải nghiệm",
    items: ["Tour & Trải nghiệm", "Tour trong ngày", "Massage & Spa", "Hoạt động ngoài trời", "Trải nghiệm văn hóa", "Thể thao dưới nước", "Du thuyền", "Vé tham quan"],
  },
  {
    id: "2",
    icon: "🏨",
    title: "Chỗ ở",
    items: ["Khách sạn", "Homestay", "Resort"],
  },
  {
    id: "3",
    icon: "🚌",
    title: "Các lựa chọn di chuyển",
    items: ["Xe sân bay", "Thuê xe tự lái", "Vé tàu cao tốc", "Xe buýt liên tỉnh"],
  },
  {
    id: "4",
    icon: "📱",
    title: "Sản phẩm du lịch thiết yếu",
    items: ["WiFi và SIM", "Bảo hiểm du lịch", "Thẻ thành viên"],
  },
];

const mainTabs = [
  { id: "activities", label: "Các hoạt động nổi bật" },
  { id: "regions", label: "Khu vực phổ biến" },
  { id: "destinations", label: "Điểm đến phổ biến" },
  { id: "landmarks", label: "Địa danh phổ biến" },
  { id: "explore", label: "Khám phá VietTravel" },
];

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

const mapTourToCard = (tour: PublicTour) => {
  const title = tour.title ?? tour.name ?? "Tour chưa đặt tên";
  const location = tour.destination ?? tour.partner?.company_name ?? "Việt Nam";
  const image =
    (tour.thumbnail_url && tour.thumbnail_url.length > 0 ? tour.thumbnail_url : undefined) ??
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=600&fit=crop";
  const price = normalizePrice(tour);
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

  return {
    id: String(tour.id ?? tour.uuid ?? fallbackId),
    title,
    location,
    image,
    rating: 4.8,
    reviewCount: tour.bookings_count ?? 1500,
    price,
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
  const [activeMainTab, setActiveMainTab] = useState("activities");
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
  });

  const toursData = toursQuery.data?.data ?? [];
  const toursMeta = toursQuery.data?.meta ?? {};

  const mappedTours =
    toursData.length > 0 ? toursData.map(mapTourToCard) : fallbackTours;

  const currentPage = Number(toursMeta.current_page ?? page) || 1;
  const lastPage =
    Number(toursMeta.last_page ?? (toursData.length === 0 ? 1 : Math.ceil((toursMeta.total as number | undefined ?? PER_PAGE) / PER_PAGE))) ||
    1;
  const totalResults = Number(toursMeta.total ?? toursData.length) || toursData.length;
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
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-8">
          <TabsList className="bg-background border-b w-full justify-start rounded-none h-auto p-0">
            {mainTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 data-[state=active]:bg-transparent"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeMainTab === "activities" && (
          <>
            <h1 className="text-4xl font-bold text-foreground mb-8">Các hoạt động nổi bật</h1>

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

            {toursQuery.isLoading ? (
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

                {totalResults > 0 ? (
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
                  </div>
                ) : null}
              </>
            )}
          </>
        )}

        {activeMainTab === "regions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {regions.map((region) => (
              <div
                key={region.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
              >
                <img src={region.image} alt={region.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-muted-foreground">{region.subtitle}</p>
                  <h3 className="font-semibold text-foreground">{region.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "destinations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
              >
                <img src={destination.image} alt={destination.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-muted-foreground">{destination.subtitle}</p>
                  <h3 className="font-semibold text-foreground">{destination.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "landmarks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {landmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
              >
                <img src={landmark.image} alt={landmark.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-foreground">{landmark.name}</h3>
                  <p className="text-xs text-muted-foreground">{landmark.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "explore" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {exploreCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllActivities;

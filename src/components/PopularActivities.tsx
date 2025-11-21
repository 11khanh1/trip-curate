import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TourCard from "./TourCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrendingTours, type PublicTour } from "@/services/publicApi";
import { apiClient } from "@/lib/api-client";
import { getTourPriceInfo, buildPromotionLabel } from "@/lib/tour-utils";

interface PopularActivitiesProps {
  tours?: PublicTour[];
}

const DEFAULT_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop";

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

const featureFromSchedule = (tour: PublicTour) => {
  const firstSchedule = tour.schedules?.[0];
  if (firstSchedule?.start_date) {
    const date = new Date(firstSchedule.start_date);
    if (!Number.isNaN(date.getTime())) {
      return `Khởi hành ${date.toLocaleDateString("vi-VN")}`;
    }
  }
  if (tour.bookings_count && tour.bookings_count > 0) {
    return `${tour.bookings_count.toLocaleString("vi-VN")} lượt đặt`;
  }
  return "Xác nhận tức thời";
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
  const fallback = (tour as Record<string, unknown> | undefined)?.bookingsCount;
  const parsedFallback = coerceNumber(fallback);
  return parsedFallback !== null && parsedFallback >= 0 ? parsedFallback : null;
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

  const features = [
    featureFromSchedule(tour),
    tour.partner?.user?.name ? `Đối tác: ${tour.partner.user.name}` : "Hỗ trợ 24/7",
    "Miễn phí huỷ trong 24h",
  ];

  const id =
    tour.id ??
    tour.uuid ??
    `tour-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  const rating = resolveTourRating(tour);
  const reviewCount = resolveReviewCount(tour);
  const bookingsCount = resolveBookingCount(tour);

  return {
    id: String(id),
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
    promotionLabel: buildPromotionLabel(priceInfo),
    duration: normalizeDuration(tour.duration),
    category,
    features,
    isPopular: true,
  };
};

const POPULAR_LIMIT = 12;

const PopularActivities = ({ tours }: PopularActivitiesProps) => {
  const shouldFetch = !tours;
  const trendingQuery = useQuery({
    queryKey: ["public-tours-trending", { limit: POPULAR_LIMIT }],
    queryFn: () => fetchTrendingTours({ limit: POPULAR_LIMIT, days: 60 }),
    enabled: shouldFetch,
    staleTime: 2 * 60 * 1000,
  });

  const data = tours ?? trendingQuery.data ?? [];
  const isLoading = shouldFetch ? trendingQuery.isLoading : false;
  const activities = data.length > 0 ? data.map(mapTourToCard) : [];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Các hoạt động nổi bật</h2>
          <Link to="/activities">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              Xem tất cả
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[440px] rounded-xl" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-white/90 px-6 py-16 text-center text-sm text-muted-foreground shadow-inner">
            <p className="font-medium text-foreground">Chưa có tour nổi bật để hiển thị</p>
            <p className="mt-2 text-muted-foreground">
              Dữ liệu sẽ xuất hiện ngay khi hệ thống trả về các tour thịnh hành từ API.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity) => (
              <div key={activity.id} className="h-full">
                <TourCard {...activity} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularActivities;

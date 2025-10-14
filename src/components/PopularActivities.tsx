import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TourCard from "./TourCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicTour } from "@/services/publicApi";

interface PopularActivitiesProps {
  tours?: PublicTour[];
  isLoading?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop";

const fallbackActivities = [
  {
    id: "placeholder-1",
    title: "Khám phá Việt Nam",
    location: "Hà Nội",
    image: FALLBACK_IMAGE,
    rating: 4.8,
    reviewCount: 1240,
    price: 890000,
    duration: "2-3 ngày",
    category: "Tour",
    features: ["Miễn phí huỷ", "Xác nhận tức thời", "Hướng dẫn viên"],
    isPopular: true,
  },
  {
    id: "placeholder-2",
    title: "Combo du lịch biển",
    location: "Nha Trang",
    image: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 980,
    price: 1250000,
    duration: "3 ngày 2 đêm",
    category: "Combo nghỉ dưỡng",
    features: ["Resort 5*", "Vé tham quan", "Ăn sáng buffet"],
    isPopular: true,
  },
  {
    id: "placeholder-3",
    title: "Trải nghiệm văn hoá bản địa",
    location: "Đà Lạt",
    image: "https://images.unsplash.com/photo-1526481280695-3c469b17b2cc?w=800&h=600&fit=crop",
    rating: 4.9,
    reviewCount: 1560,
    price: 590000,
    duration: "1 ngày",
    category: "Trải nghiệm",
    features: ["Chụp ảnh miễn phí", "Hướng dẫn viên", "Xe đưa đón"],
  },
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
    (schedule) =>
      typeof schedule.season_price === "number" && Number.isFinite(schedule.season_price),
  )?.season_price;
  if (typeof schedulePrice === "number") return Math.max(0, schedulePrice);
  return 0;
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

const mapTourToCard = (tour: PublicTour) => {
  const title = tour.title ?? tour.name ?? "Tour chưa đặt tên";
  const location = tour.destination ?? tour.partner?.company_name ?? "Việt Nam";
  const image =
    (tour.thumbnail_url && tour.thumbnail_url.length > 0 ? tour.thumbnail_url : undefined) ??
    FALLBACK_IMAGE;
  const price = normalizePrice(tour);
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

  return {
    id: String(id),
    title,
    location,
    image,
    rating: 4.7,
    reviewCount: tour.bookings_count ?? 1250,
    price,
    duration: normalizeDuration(tour.duration),
    category,
    features,
    isPopular: true,
  };
};

const PopularActivities = ({ tours, isLoading }: PopularActivitiesProps) => {
  const activities =
    tours && tours.length > 0 ? tours.map(mapTourToCard) : fallbackActivities;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[440px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
// FIXED: Removed the incorrect import of TourCardProps
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { fetchTrendingTours, PublicTour } from "@/services/publicApi";
import { apiClient } from "@/lib/api-client";

// ====================================================================================
// TYPE DEFINITION & HELPER FUNCTIONS
// ====================================================================================

// FIXED: Defined TourCardProps directly in this file
export type TourCardProps = {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  duration: string;
  category: string;
  features: string[];
  isPopular?: boolean;
};

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

const mapTourToCard = (tour: PublicTour): TourCardProps => {
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
    rating: tour.rating_average ?? tour.average_rating ?? 4.7,
    reviewCount: tour.rating_count ?? tour.reviews_count ?? tour.bookings_count ?? 1250,
    price,
    duration: normalizeDuration(tour.duration),
    category,
    features,
    isPopular: true,
  };
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================
const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateItemQuantity, removeItem } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }),
    [],
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const totalSelectedAmount = useMemo(
    () => selectedItems.reduce((total, item) => total + item.totalPrice, 0),
    [selectedItems],
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const handleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => removeItem(id));
    setSelectedIds(new Set());
  };

  const handleCheckout = () => {
    if (selectedItems.length !== 1) {
        alert("Vui lòng chỉ chọn 1 tour để tiến hành thanh toán.");
        return;
    }
    const item = selectedItems[0];
    const params = new URLSearchParams({
      tourId: item.tourId,
      packageId: item.packageId,
      adults: String(item.adultCount),
      children: String(item.childCount),
      cartItemId: item.id,
    });
    if (item.scheduleId) {
      params.set("scheduleId", item.scheduleId);
    }
    navigate(`/bookings/new?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TravelHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_1fr] lg:items-start">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Tất cả ({items.length} dịch vụ)
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xoá dịch vụ đã chọn
                </Button>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                    <p className="mt-4 font-semibold text-foreground">Giỏ hàng của bạn đang trống</p>
                    <p className="text-sm text-muted-foreground">Khám phá và thêm các hoạt động yêu thích!</p>
                    <Button asChild className="mt-4">
                        <Link to="/activities">Khám phá ngay</Link>
                    </Button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => handleSelect(item.id)}
                        className="mt-1"
                      />
                      <img
                        src={item.thumbnail ?? "https://via.placeholder.com/150"}
                        alt={item.tourTitle}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-foreground">{item.tourTitle}</h3>
                        <p className="text-sm text-muted-foreground">{item.packageName}</p>
                        {item.scheduleTitle && <p className="text-sm text-muted-foreground">Khởi hành: {item.scheduleTitle}</p>}
                        <div className="flex items-center gap-6 pt-2">
                           <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Người lớn:</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, { adults: Math.max(1, item.adultCount - 1), children: item.childCount })}><Minus className="h-3 w-3" /></Button>
                                <span className="w-5 text-center font-medium">{item.adultCount}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, { adults: item.adultCount + 1, children: item.childCount })}><Plus className="h-3 w-3" /></Button>
                           </div>
                          <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Trẻ em:</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, { adults: item.adultCount, children: Math.max(0, item.childCount - 1) })}><Minus className="h-3 w-3" /></Button>
                                <span className="w-5 text-center font-medium">{item.childCount}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, { adults: item.adultCount, children: item.childCount + 1 })}><Plus className="h-3 w-3" /></Button>
                           </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-foreground">{formatter.format(item.totalPrice)}</p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                const params = new URLSearchParams({
                                  tab: "packages",
                                  cartItemId: item.id,
                                  packageId: item.packageId,
                                  adults: String(item.adultCount),
                                  children: String(item.childCount),
                                });
                                if (item.scheduleId) {
                                  params.set("scheduleId", item.scheduleId);
                                }
                                navigate(`/activity/${item.tourId}?${params.toString()}`);
                              }}
                          >
                              Sửa
                          </Button>                            
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removeItem(item.id)}>Xoá</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng cộng ({selectedIds.size} dịch vụ)</span>
                  <span className="font-semibold text-foreground">{formatter.format(totalSelectedAmount)}</span>
                </div>
                 
              </CardContent>
              <CardFooter>
                 <Button
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={selectedIds.size !== 1}
                    onClick={handleCheckout}
                 >
                    Thanh toán
                </Button>
              </CardFooter>
            </Card>
             {selectedIds.size !== 1 && (
                <p className="text-xs text-center text-muted-foreground">Vui lòng chọn 1 dịch vụ để tiến hành thanh toán.</p>
            )}
          </div>
        </div>

        <RecommendedTours />

      </main>
      <Footer />
    </div>
  );
};

// Component con để fetch và hiển thị các tour trending
const RecommendedTours = () => {
    const { data: tours, isLoading } = useQuery<PublicTour[]>({
        queryKey: ["public-tours-trending", { limit: 4 }],
        queryFn: () => fetchTrendingTours({ limit: 4, days: 60 }),
        staleTime: 5 * 60 * 1000,
    });

    const activities = useMemo(() => (tours ?? []).map(mapTourToCard), [tours]);

    return (
        <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Thường Được Đặt Với</h2>
                <Link to="/activities">
                    <Button variant="ghost" className="text-primary hover:text-primary/80">
                        Xem tất cả
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-[440px] rounded-xl" />
                    ))
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="h-full">
                            <TourCard {...activity} />
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default CartPage;

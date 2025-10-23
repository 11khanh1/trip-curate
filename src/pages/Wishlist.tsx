import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  compareWishlistTours,
  fetchWishlist,
  removeWishlistItem,
  type WishlistItem,
  type WishlistTour,
} from "@/services/wishlistApi";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  Scale,
  Star,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, getTourStartingPrice } from "@/lib/tour-utils";
import { Users } from "lucide-react";

const resolveImageFromTour = (tour: WishlistTour) => {
  const candidates: Array<unknown> = [
    (tour as Record<string, unknown>).thumbnail,
    (tour as Record<string, unknown>).thumbnail_url,
    Array.isArray(tour.media) ? tour.media[0] : undefined,
    Array.isArray((tour as Record<string, unknown>).gallery)
      ? (tour as Record<string, unknown>).gallery?.[0]
      : undefined,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const value = candidate.trim();
      if (/^https?:\/\//i.test(value)) return value;
      const base = apiClient.defaults.baseURL ?? "";
      if (!base) return value;
      const normalizedBase = base.replace(/\/api\/?$/, "/");
      return `${normalizedBase}${value.startsWith("/") ? value.slice(1) : value}`;
    }
  }
  return "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?w=900&h=600&fit=crop";
};

const formatDuration = (duration: number | null | undefined) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    if (duration <= 0) return "Trong ngày";
    if (duration === 1) return "1 ngày";
    return `${duration} ngày`;
  }
  return "Linh hoạt";
};

const formatAddedAt = (raw: string) => {
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.warn("Không thể định dạng thời gian thêm wishlist:", error);
    return null;
  }
};

const normalizeRating = (tour: WishlistTour) => {
  if (typeof tour.rating_average === "number") return tour.rating_average;
  if (typeof tour.average_rating === "number") return tour.average_rating;
  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const safeString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const firstNonEmptyString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const candidate = safeString(value);
    if (candidate) return candidate;
  }
  return undefined;
};

const extractArray = (record: Record<string, unknown> | undefined, key: string): unknown[] =>
  Array.isArray(record?.[key]) ? (record?.[key] as unknown[]) : [];

const readRecordString = (
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined => safeString(record?.[key]);

const readRecordNumber = (
  record: Record<string, unknown> | undefined,
  key: string,
): number | undefined => {
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const formatScheduleDate = (raw: string | undefined): string | null => {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

type WishlistStatusBadge = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

const WishlistPage = () => {
  const { currentUser } = useUser();
  const wishlistQueryKey = ["wishlist", currentUser?.id != null ? String(currentUser.id) : "guest"] as const;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [comparedTours, setComparedTours] = useState<WishlistTour[]>([]);

  const {
    data: wishlistItems,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<WishlistItem[]>({
    queryKey: wishlistQueryKey,
    queryFn: fetchWishlist,
    enabled: Boolean(currentUser?.id),
  });

  const removeMutation = useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã xoá khỏi danh sách yêu thích",
        description: "Tour đã được cập nhật trong danh sách của bạn.",
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Không thể xoá tour khỏi wishlist.";
      toast({
        title: "Thao tác thất bại",
        description: message,
        variant: "destructive",
      });
    },
  });

  const compareMutation = useMutation({
    mutationFn: compareWishlistTours,
    onSuccess: (tours) => {
      setComparedTours(tours);
      toast({
        title: "Đã chuẩn bị bảng so sánh",
        description: "So sánh chi tiết đã sẵn sàng phía dưới.",
      });
    },
    onError: (err) => {
      setComparedTours([]);
      const message =
        err instanceof Error ? err.message : "Không thể so sánh các tour đã chọn. Vui lòng thử lại.";
      toast({
        title: "So sánh thất bại",
        description: message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!currentUser) {
      setSelectedTourIds([]);
      setComparedTours([]);
    }
  }, [currentUser]);

  const handleToggleTour = (tourId: string) => {
    if (!tourId) return;
    setSelectedTourIds((prev) => {
      if (prev.includes(tourId)) {
        const next = prev.filter((id) => id !== tourId);
        if (next.length < 2) {
          setComparedTours([]);
        }
        return next;
      }
      if (prev.length >= 2) {
        toast({
          title: "Chỉ chọn tối đa 2 tour",
          description: "Bỏ chọn một tour trước khi thêm tour mới vào danh sách so sánh.",
        });
        return prev;
      }
      return [...prev, tourId];
    });
  };

  const handleCompare = () => {
    if (selectedTourIds.length !== 2) {
      toast({
        title: "Chọn 2 tour để so sánh",
        description: "Vui lòng chọn đúng 2 tour trong danh sách yêu thích.",
      });
      return;
    }
    compareMutation.mutate(selectedTourIds);
  };

  const handleRemove = (itemId: string, tourId: string) => {
    if (!itemId) return;
    removeMutation.mutate(itemId);
    setSelectedTourIds((prev) => {
      if (!tourId) return prev;
      const next = prev.filter((id) => id !== tourId);
      if (next.length < 2) {
        setComparedTours([]);
      }
      return next;
    });
  };

  const hasItems = (wishlistItems?.length ?? 0) > 0;

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(wishlistItems)) return [];
    return wishlistItems.map((item) => {
      const tourRecord = isRecord(item.tour) ? item.tour : undefined;
      const packages = extractArray(tourRecord, "packages");
      const schedules = extractArray(tourRecord, "schedules");
      const categories = extractArray(tourRecord, "categories");
      const categoryCandidate =
        categories.length > 0 && isRecord(categories[0])
          ? (categories[0] as Record<string, unknown>)
          : undefined;
      const partnerRecord = isRecord(tourRecord?.["partner"])
        ? (tourRecord?.["partner"] as Record<string, unknown>)
        : undefined;
      const partnerUserRecord = isRecord(partnerRecord?.["user"])
        ? (partnerRecord?.["user"] as Record<string, unknown>)
        : undefined;

      const partnerName = firstNonEmptyString(
        readRecordString(partnerUserRecord, "name"),
        readRecordString(partnerRecord, "company_name"),
        readRecordString(partnerRecord, "name"),
        readRecordString(partnerRecord, "display_name"),
      );

      const resolvedCategory =
        firstNonEmptyString(
          readRecordString(categoryCandidate, "name"),
          readRecordString(categoryCandidate, "title"),
          readRecordString(categoryCandidate, "label"),
          tourRecord?.["category"],
        ) ?? partnerName ?? "Tour";

      const priceValue = tourRecord ? getTourStartingPrice(tourRecord) : 0;
      const priceLabel = formatCurrency(priceValue);

      const firstSchedule = schedules.find((entry) => isRecord(entry) && readRecordString(entry as Record<string, unknown>, "start_date"));
      const firstScheduleStart =
        isRecord(firstSchedule) ? readRecordString(firstSchedule as Record<string, unknown>, "start_date") : undefined;
      const scheduleStartLabel = formatScheduleDate(firstScheduleStart ?? undefined);

      const features = [
        scheduleStartLabel ? `Khởi hành ${scheduleStartLabel}` : null,
        partnerName ? `Đối tác: ${partnerName}` : null,
        "Miễn phí huỷ trong 24h",
      ].filter((value): value is string => Boolean(value));

      const bookingCount =
        readRecordNumber(tourRecord, "bookings_count") ??
        readRecordNumber(tourRecord, "orders_count") ??
        readRecordNumber(tourRecord, "purchases_count") ??
        undefined;

      const normalizedStatus = safeString(item.status)?.toLowerCase();

      const statusText = (() => {
        if (item.available === false) return "Tạm thời hết chỗ";
        if (!normalizedStatus) return "Trạng thái đang cập nhật";
        if (["active", "published", "approved"].includes(normalizedStatus)) return "Đang mở đặt chỗ";
        if (["pending", "processing"].includes(normalizedStatus)) return "Đang chờ duyệt";
        if (["draft"].includes(normalizedStatus)) return "Đang cập nhật";
        if (["inactive", "archived", "disabled"].includes(normalizedStatus)) return "Ngưng cung cấp";
        return `Trạng thái: ${safeString(item.status) ?? "Đang cập nhật"}`;
      })();

      let statusBadge: WishlistStatusBadge | null = null;
      if (item.available === false) {
        statusBadge = { label: "Hết chỗ", variant: "destructive" };
      } else if (normalizedStatus && ["active", "published", "approved"].includes(normalizedStatus)) {
        statusBadge = { label: "Có thể đặt", variant: "default" };
      } else if (normalizedStatus && ["pending", "processing"].includes(normalizedStatus)) {
        statusBadge = { label: "Chờ duyệt", variant: "secondary" };
      } else if (normalizedStatus && ["draft"].includes(normalizedStatus)) {
        statusBadge = { label: "Đang cập nhật", variant: "outline" };
      }

      const isPopular =
        Boolean(tourRecord?.["is_popular"]) ||
        (typeof bookingCount === "number" && bookingCount >= 100);

      const bookingLabel =
        typeof bookingCount === "number" && bookingCount > 0
          ? bookingCount >= 1000
            ? `${Math.round(bookingCount / 1000)}K+ Đã đặt`
            : `${bookingCount.toLocaleString("vi-VN")} lượt đặt`
          : null;

      return {
        itemId: item.id,
        tourId: item.tour_id,
        title: item.tour?.title ?? "Tour chưa có tiêu đề",
        destination: item.tour?.destination ?? "Đang cập nhật",
        duration: formatDuration(item.tour?.duration ?? null),
        image: resolveImageFromTour(item.tour),
        priceLabel,
        priceValue,
        status: item.status,
        statusText,
        statusBadge,
        available: item.available,
        addedAt: formatAddedAt(item.added_at),
        rating: normalizeRating(item.tour),
        ratingCount: item.tour?.rating_count ?? null,
        bookingCount,
        bookingLabel,
        packagesCount: packages.length,
        schedulesCount: schedules.length,
        category: resolvedCategory,
        features,
        partnerName,
        isPopular,
        raw: item,
      };
    });
  }, [wishlistItems]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TravelHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="uppercase text-xs tracking-wide font-semibold">Wishlist</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mt-1">Danh sách yêu thích của bạn</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Lưu trữ các tour đã thích, so sánh nhanh giữa hai lựa chọn và tiếp tục đặt khi sẵn sàng.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button onClick={() => navigate("/activities")} className="bg-orange-500 hover:bg-orange-600">
              Khám phá tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {!currentUser ? (
          <Card className="border-dashed border-primary/40 bg-white/60">
            <CardHeader>
              <CardTitle>Đăng nhập để xem Wishlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Vui lòng đăng nhập để đồng bộ danh sách yêu thích của bạn.</p>
              <p>Nhấn vào nút tài khoản ở góc trên bên phải để tiếp tục.</p>
            </CardContent>
          </Card>
        ) : null}

        {currentUser ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-[340px] rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <Card className="bg-red-50 border border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Không thể tải danh sách yêu thích</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-red-700">
                  {error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."}
                </CardContent>
              </Card>
            ) : !hasItems ? (
              <Card className="border-dashed bg-white">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <Heart className="h-12 w-12 text-primary/40" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Danh sách yêu thích còn trống</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Lưu lại các tour yêu thích để dễ dàng so sánh và đặt ngay khi sẵn sàng.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/activities")}>
                    Bắt đầu khám phá
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Đã chọn <span className="font-semibold text-foreground">{selectedTourIds.length}</span> / 2 tour để so sánh.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Chọn tối đa 2 tour mà bạn muốn đặt lên bàn cân.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTourIds([]);
                        setComparedTours([]);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Bỏ chọn
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={selectedTourIds.length !== 2 || compareMutation.isPending}
                      onClick={handleCompare}
                    >
                      {compareMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang so sánh
                        </>
                      ) : (
                        <>
                          <Scale className="mr-2 h-4 w-4" />
                          So sánh tour
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {normalizedItems.map((item) => {
                    const isSelected = selectedTourIds.includes(item.tourId);
                    const statusClass =
                      item.available === false
                        ? "text-amber-600"
                        : item.statusText.toLowerCase().includes("ngưng")
                        ? "text-gray-600"
                        : "text-emerald-600";
                    const locationLine = [item.partnerName, item.destination]
                      .filter((value): value is string => Boolean(value))
                      .join(" • ");
                    return (
                      <Card
                        key={item.itemId}
                        className="overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="relative">
                          <Link to={`/activity/${item.tourId}`} className="block overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-52 w-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                            />
                          </Link>
                          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
                            {item.isPopular ? (
                              <Badge className="bg-gradient-orange text-white">
                                Phổ biến
                              </Badge>
                            ) : null}
                            {item.statusBadge ? (
                              <Badge variant={item.statusBadge.variant} className="backdrop-blur bg-white/90 text-slate-700">
                                {item.statusBadge.label}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="absolute left-4 bottom-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleTour(item.tourId)}
                              className="h-5 w-5 rounded-full border-white bg-white shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 bg-white/85 text-red-500 hover:bg-white"
                            onClick={() => handleRemove(item.itemId, item.tourId)}
                            disabled={removeMutation.isPending}
                          >
                            {removeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className="h-4 w-4 fill-current" />
                            )}
                          </Button>
                        </div>
                        <div className="space-y-4 px-5 py-5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{locationLine || item.destination}</span>
                          </div>
                          <Link
                            to={`/activity/${item.tourId}`}
                            className="text-lg font-semibold leading-snug text-foreground hover:text-primary"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{item.duration}</span>
                          </div>
                          {item.features.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {item.features.slice(0, 3).map((feature, index) => (
                                <span
                                  key={`${item.itemId}-feature-${index}`}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-1 text-amber-500">
                              <Star className="h-4 w-4" />
                              {typeof item.rating === "number" ? (
                                <>
                                  <span className="font-semibold">{item.rating.toFixed(1)}</span>
                                  {item.ratingCount ? (
                                    <span className="text-muted-foreground">
                                      ({item.ratingCount.toLocaleString()})
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">Chưa có đánh giá</span>
                              )}
                            </span>
                            {item.bookingLabel ? (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {item.bookingLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between border-t border-dashed pt-4">
                            <span className="text-sm text-muted-foreground">Từ</span>
                            <span className="text-2xl font-semibold text-primary">{item.priceLabel}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${statusClass}`}>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{item.statusText}</span>
                          </div>
                        </div>
                        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-slate-50 px-5 py-3">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleToggleTour(item.tourId)}
                            disabled={compareMutation.isPending}
                            className="rounded-full"
                          >
                            {isSelected ? "Đã chọn so sánh" : "Chọn để so sánh"}
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="rounded-full">
                            <Link to={`/activity/${item.tourId}`}>
                              Xem chi tiết
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {compareMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-6 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tạo bảng so sánh...</span>
                  </div>
                ) : null}

                {comparedTours.length > 0 ? (
                  <section className="space-y-6 rounded-2xl border border-primary/30 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <Scale className="h-5 w-5" />
                        <span className="text-lg font-semibold">So sánh 2 tour đã chọn</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tập trung vào các thông tin giá, lịch khởi hành và chính sách để đưa ra lựa chọn phù hợp nhất.
                      </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      {comparedTours.map((tour) => {
                        const tourId = String(tour.id ?? tour.uuid ?? tour.tour_id ?? "");
                        const image = resolveImageFromTour(tour);
                        const startingPrice = getTourStartingPrice(tour as any);
                        const priceLabel = formatCurrency(startingPrice);
                        const hasOriginal =
                          typeof tour.season_price === "number" &&
                          Number.isFinite(tour.season_price) &&
                          tour.season_price > (startingPrice ?? 0);
                        const originalLabel = hasOriginal ? formatCurrency(tour.season_price) : null;
                        const tourRating = normalizeRating(tour);
                        const tourStatus = tour.status ?? "Đang cập nhật";
                        const itinerary =
                          Array.isArray(tour.itinerary) && tour.itinerary.length > 0
                            ? tour.itinerary.slice(0, 3).map((item, index) => {
                                if (typeof item === "string") return item;
                                if (item && typeof item === "object") {
                                  const textCandidate = [
                                    (item as Record<string, unknown>).title,
                                    (item as Record<string, unknown>).name,
                                    (item as Record<string, unknown>).description,
                                  ].find((value) => typeof value === "string" && value.trim());
                                  if (typeof textCandidate === "string") {
                                    return textCandidate.trim();
                                  }
                                }
                                return `Hoạt động nổi bật #${index + 1}`;
                              })
                            : ["Đang cập nhật"];
                        const policySnippet =
                          typeof tour.policy === "string" && tour.policy.trim().length > 0
                            ? tour.policy.trim()
                            : "Chưa có chính sách chi tiết.";

                        const packagesCount = tour.packages?.length ?? 0;
                        const schedulesCount = tour.schedules?.length ?? 0;

                        return (
                          <Card
                            key={tourId}
                            className="overflow-hidden border border-primary/10 shadow-sm transition hover:shadow-lg"
                          >
                            <div className="relative h-48 w-full overflow-hidden">
                              <img src={image} alt={tour.title ?? "Tour"} className="h-full w-full object-cover" />
                              <Badge
                                className="absolute left-4 top-4 uppercase"
                                variant={tour.available === false ? "destructive" : "secondary"}
                              >
                                {tour.available === false ? "Không khả dụng" : tourStatus}
                              </Badge>
                            </div>
                            <CardContent className="space-y-4 p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {tour.title ?? "Tour chưa đặt tên"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {tour.destination ?? "Điểm đến đang cập nhật"}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                                  {tourRating ? (
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Star className="h-4 w-4" />
                                      <span className="font-semibold">{tourRating.toFixed(1)}</span>
                                      {tour.rating_count ? (
                                        <span className="text-xs text-muted-foreground">
                                          ({tour.rating_count.toLocaleString()} đánh giá)
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <span className="text-xs">Chưa có đánh giá</span>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-xl bg-primary/5 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm text-muted-foreground">Giá từ</span>
                                  <div className="flex flex-col items-end">
                                    <span className="text-xl font-semibold text-primary">{priceLabel}</span>
                                    {originalLabel ? (
                                      <span className="text-xs text-muted-foreground line-through">
                                        {originalLabel}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{tour.destination ?? "Đang cập nhật"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatDuration(tour.duration ?? null)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {schedulesCount > 0
                                      ? `${schedulesCount} lịch khởi hành`
                                      : "Lịch khởi hành đang cập nhật"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">{packagesCount} gói dịch vụ</Badge>
                                  <Badge variant="secondary">{schedulesCount} lịch khởi hành</Badge>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Chính sách nổi bật</p>
                                <p className="text-sm text-muted-foreground line-clamp-3">{policySnippet}</p>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Lịch trình nổi bật</p>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                  {itinerary.map((step, index) => (
                                    <li key={`${tourId}-itinerary-${index}`} className="flex items-start gap-2">
                                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-slate-50/80 px-5 py-3">
                              <Button asChild size="sm">
                                <Link to={`/activity/${tourId}`}>Xem chi tiết</Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleToggleTour(tourId)}
                              >
                                Bỏ khỏi so sánh
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, Loader2, Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
// FIXED: Removed the incorrect import of TourCardProps
import TourCard from "@/components/TourCard";
import CollectionTourCard from "@/components/CollectionTourCard";
import PersonalizedRecommendations from "@/components/recommendations/PersonalizedRecommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { fetchTrendingTours, type PublicTour, type CancellationPolicy } from "@/services/publicApi";
import { addWishlistItem, type WishlistItem } from "@/services/wishlistApi";
import { apiClient } from "@/lib/api-client";
import { getTourStartingPrice } from "@/lib/tour-utils";
import { useToast } from "@/hooks/use-toast";

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
  const price = getTourStartingPrice(tour);
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

const formatTourTypeLabel = (type?: string | null) => {
  if (!type) return null;
  const normalized = type.toString().trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "domestic") return "Loại tour: Nội địa";
  if (normalized === "international") return "Loại tour: Quốc tế";
  return `Loại tour: ${type}`;
};

const summarizeDocumentRequirements = (requiresPassport?: boolean | null, requiresVisa?: boolean | null) => {
  const needsPassport = requiresPassport === true;
  const needsVisa = requiresVisa === true;
  if (!needsPassport && !needsVisa) {
    return "Giấy tờ: Không yêu cầu hộ chiếu/visa";
  }
  const pieces: string[] = [];
  if (needsPassport) pieces.push("hộ chiếu");
  if (needsVisa) pieces.push("visa");
  return `Giấy tờ bắt buộc: ${pieces.join(" & ")}`;
};

const summarizeCancellationPolicies = (policies?: CancellationPolicy[] | null) => {
  if (!Array.isArray(policies) || policies.length === 0) {
    return "Chính sách hủy: Theo điều khoản chung";
  }
  return `Chính sách hủy: ${policies.length} mục`;
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================
const CartPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const wishlistQueryKey = ["wishlist", currentUser?.id != null ? String(currentUser.id) : "guest"] as const;
  const { items, updateItemQuantity, removeItem, isLoading: isCartLoading, isSyncing, error } =
    useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wishlistTourIds, setWishlistTourIds] = useState<Set<string>>(() => new Set());
  const [pendingWishlistTourId, setPendingWishlistTourId] = useState<string | null>(null);

  const syncWishlistFromCache = useCallback(() => {
    const cached = queryClient.getQueryData<WishlistItem[]>(wishlistQueryKey);
    setWishlistTourIds(() => {
      if (!Array.isArray(cached)) {
        return new Set<string>();
      }
      const next = new Set<string>();
      cached.forEach((entry) => {
        if (entry && "tour_id" in entry) {
          next.add(String(entry.tour_id));
        }
      });
      return next;
    });
  }, [queryClient, wishlistQueryKey]);

  useEffect(() => {
    if (!currentUser) {
      setWishlistTourIds(new Set());
      return;
    }
    syncWishlistFromCache();
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.query?.queryKey?.[0] === "wishlist" &&
        event.query?.queryKey?.[1] === wishlistQueryKey[1]
      ) {
        syncWishlistFromCache();
      }
    });
    return unsubscribe;
  }, [currentUser, queryClient, syncWishlistFromCache, wishlistQueryKey]);

  const addToWishlistMutation = useMutation<WishlistItem, unknown, string>({
    mutationFn: (tourId: string) => addWishlistItem(tourId),
    onMutate: (tourId) => {
      setPendingWishlistTourId(String(tourId));
    },
    onSuccess: (item, tourId) => {
      setWishlistTourIds((prev) => {
        const next = new Set(prev);
        next.add(String(item.tour_id ?? tourId));
        return next;
      });
      queryClient.setQueryData<WishlistItem[]>(wishlistQueryKey, (previous) => {
        const existing = Array.isArray(previous) ? previous : [];
        const filtered = existing.filter((entry) => entry.id !== item.id);
        return [item, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã lưu vào yêu thích",
        description: "Bạn có thể xem lại tour này trong mục Wishlist.",
      });
    },
    onError: (err) => {
      const description =
        err instanceof Error && err.message
          ? err.message
          : "Không thể lưu tour vào danh sách yêu thích.";
      toast({
        title: "Thao tác thất bại",
        description,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPendingWishlistTourId(null);
    },
  });

  const handleSaveToWishlist = useCallback(
    (tourId: string) => {
      if (!tourId) return;
      if (!currentUser) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Đăng nhập để lưu tour vào danh sách yêu thích.",
          variant: "destructive",
        });
        return;
      }
      const normalizedId = String(tourId);
      if (wishlistTourIds.has(normalizedId)) {
        toast({
          title: "Tour đã được lưu",
          description: "Tour này đã có trong danh sách yêu thích của bạn.",
        });
        return;
      }
      addToWishlistMutation.mutate(tourId);
    },
    [addToWishlistMutation, currentUser, toast, wishlistTourIds],
  );

  useEffect(() => {
    const validIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      if (!changed && next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [items]);

  const handleActionError = useCallback(
    (err: unknown, fallback: string) => {
      const description =
        err instanceof Error && err.message ? err.message : fallback;
      toast({
        title: "Không thể thực hiện thao tác",
        description,
        variant: "destructive",
      });
    },
    [toast],
  );

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
    if (isSyncing || isCartLoading) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isSyncing || isCartLoading) return;
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (isSyncing || selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await removeItem(id);
      }
      setSelectedIds(new Set());
    } catch (err) {
      handleActionError(err, "Không thể xoá các dịch vụ đã chọn.");
    }
  };

  const handleQuantityChange = async (
    itemId: string,
    payload: { adults: number; children: number },
  ) => {
    if (isSyncing) return;
    try {
      await updateItemQuantity(itemId, payload);
    } catch (err) {
      handleActionError(err, "Không thể cập nhật số lượng vé.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (isSyncing) return;
    try {
      await removeItem(itemId);
    } catch (err) {
      handleActionError(err, "Không thể xoá dịch vụ khỏi giỏ hàng.");
    }
  };

  const handleCheckout = () => {
    if (isSyncing) return;
    if (selectedItems.length !== 1) {
      toast({
        title: "Vui lòng chọn một dịch vụ",
        description: "Chỉ khi chọn đúng một dịch vụ, bạn mới có thể tiến hành thanh toán.",
        variant: "destructive",
      });
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
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Không thể tải giỏ hàng</AlertTitle>
                <AlertDescription>
                  {error.message || "Đã xảy ra lỗi khi đồng bộ giỏ hàng. Vui lòng thử lại."}
                </AlertDescription>
              </Alert>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={isCartLoading || isSyncing || items.length === 0}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Tất cả ({items.length} dịch vụ)
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || isSyncing}
                  className="text-red-600 hover:text-red-700"
                >
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Xoá dịch vụ đã chọn
                </Button>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {isCartLoading ? (
                  <div className="space-y-6 p-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <Skeleton className="mt-1 h-5 w-5 rounded-md" />
                        <Skeleton className="h-24 w-24 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                    <p className="mt-4 font-semibold text-foreground">Giỏ hàng của bạn đang trống</p>
                    <p className="text-sm text-muted-foreground">
                      Khám phá và thêm các hoạt động yêu thích!
                    </p>
                    <Button asChild className="mt-4">
                      <Link to="/activities">Khám phá ngay</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const typeLabel = formatTourTypeLabel(item.tourType);
                      const childLimitLabel =
                        typeof item.childAgeLimit === "number" && Number.isFinite(item.childAgeLimit)
                          ? `Giới hạn trẻ em: ≤ ${item.childAgeLimit} tuổi`
                          : null;
                      const documentLabel = summarizeDocumentRequirements(item.requiresPassport, item.requiresVisa);
                      const cancellationLabel = summarizeCancellationPolicies(item.cancellationPolicies);
                      const features = [
                        typeLabel,
                        item.packageName ? `Gói: ${item.packageName}` : null,
                        item.scheduleTitle ? `Khởi hành: ${item.scheduleTitle}` : null,
                        `Người lớn: ${item.adultCount}`,
                        item.childCount > 0 ? `Trẻ em: ${item.childCount}` : null,
                        childLimitLabel,
                        documentLabel,
                        cancellationLabel,
                      ].filter((value): value is string => Boolean(value));
                      const normalizedTourId = String(item.tourId);
                      const isWishlisted = wishlistTourIds.has(normalizedTourId);
                      const isSavingWishlist = pendingWishlistTourId === normalizedTourId;

                      return (
                        <CollectionTourCard
                          key={item.id}
                          className="border border-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
                          href={`/activity/${item.tourId}`}
                          image={item.thumbnail ?? "https://via.placeholder.com/400x300"}
                          title={item.tourTitle}
                          category={item.packageName ?? "Gói dịch vụ"}
                          location={item.scheduleTitle ?? "Lịch khởi hành linh hoạt"}
                          duration={null}
                          rating={null}
                          ratingCount={null}
                          priceLabel={formatter.format(item.totalPrice)}
                          features={features}
                          topLeftOverlay={
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => handleSelect(item.id)}
                              className="h-5 w-5 rounded-full border-white bg-white shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                              disabled={isSyncing}
                            />
                          }
                          topRightOverlay={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-white/80 text-red-500 hover:bg-white"
                              disabled={isSyncing}
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          footerContent={
                            <div className="flex flex-col gap-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                  <span className="text-sm text-muted-foreground">Người lớn</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isSyncing}
                                      onClick={() =>
                                        handleQuantityChange(item.id, {
                                          adults: Math.max(1, item.adultCount - 1),
                                          children: item.childCount,
                                        })
                                      }
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center font-semibold">{item.adultCount}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isSyncing}
                                      onClick={() =>
                                        handleQuantityChange(item.id, {
                                          adults: item.adultCount + 1,
                                          children: item.childCount,
                                        })
                                      }
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                  <span className="text-sm text-muted-foreground">Trẻ em</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isSyncing}
                                      onClick={() =>
                                        handleQuantityChange(item.id, {
                                          adults: item.adultCount,
                                          children: Math.max(0, item.childCount - 1),
                                        })
                                      }
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center font-semibold">{item.childCount}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isSyncing}
                                      onClick={() =>
                                        handleQuantityChange(item.id, {
                                          adults: item.adultCount,
                                          children: item.childCount + 1,
                                        })
                                      }
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant={isWishlisted ? "secondary" : "outline"}
                                  size="sm"
                                  disabled={isSyncing || isWishlisted || isSavingWishlist}
                                  onClick={() => handleSaveToWishlist(item.tourId)}
                                  className={
                                    isWishlisted ? "border-primary bg-primary/10 text-primary" : undefined
                                  }
                                >
                                  {isSavingWishlist ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Đang lưu
                                    </>
                                  ) : isWishlisted ? (
                                    <>
                                      <Heart className="mr-2 h-4 w-4 fill-current" />
                                      Đã lưu
                                    </>
                                  ) : (
                                    <>
                                      <Heart className="mr-2 h-4 w-4" />
                                      Lưu yêu thích
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isSyncing}
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
                                  Sửa lựa chọn
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={isSyncing}
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  Xoá khỏi giỏ
                                </Button>
                              </div>
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
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
                  <span>Tổng cộng ({selectedItems.length} dịch vụ)</span>
                  <span className="font-semibold text-foreground">{formatter.format(totalSelectedAmount)}</span>
                </div>
                 
              </CardContent>
              <CardFooter>
                 <Button
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={selectedItems.length !== 1 || isSyncing}
                    onClick={handleCheckout}
                 >
                    Thanh toán
                </Button>
              </CardFooter>
            </Card>
             {selectedItems.length !== 1 && (
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
  const { currentUser } = useUser();
  const { data: tours, isLoading } = useQuery<PublicTour[]>({
    queryKey: ["public-tours-trending", { limit: 6 }],
    queryFn: () => fetchTrendingTours({ limit: 6, days: 60 }),
    staleTime: 5 * 60 * 1000,
  });

  const activities = useMemo(() => (tours ?? []).map(mapTourToCard), [tours]);
  const displayedActivities = activities.slice(0, 4);

  if (currentUser) {
    return (
      <PersonalizedRecommendations
        className="mt-16"
        limit={6}
        fallbackTours={tours ?? []}
      />
    );
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Gợi ý nổi bật</h2>
        <Link to="/activities">
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            Xem tất cả
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[440px] rounded-xl" />
            ))
          : displayedActivities.map((activity) => (
              <div key={activity.id} className="h-full">
                <TourCard {...activity} />
              </div>
            ))}
      </div>
    </section>
  );
};

export default CartPage;

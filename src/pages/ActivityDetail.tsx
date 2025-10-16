import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import {
  Star,
  MapPin,
  Heart,
  ChevronRight,
  Calendar,
  Users,
  Check,
  AlertCircle,
  Info,
  Shield,
  Phone,
  Mail,
  ChevronLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import TourCard from "@/components/TourCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchTourDetail, fetchTrendingTours, type PublicTour } from "@/services/publicApi";

type ActivityPackage = {
  id: string;
  name?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  includes: string[];
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  slotsAvailable?: number | null;
};

type RelatedActivity = {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  category: string;
  isPopular?: boolean;
  features: string[];
};

interface ActivityDetailView {
  id: string;
  title: string;
  locationName?: string;
  region?: string;
  category?: string;
  tourType?: string;
  pickupType?: string;
  rating?: number | null;
  reviewCount?: number | null;
  bookedCount?: number | null;
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  duration?: string | number | null;
  images: string[];
  highlights: string[];
  description?: string | null;
  packages: ActivityPackage[];
  termsAndConditions: Array<{ title: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  importantNotes: Array<{ title: string; items: string[] }>;
  addOns: Array<{
    id: string;
    title: string;
    description?: string;
    price?: number;
    image?: string;
  }>;
  location?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number } | null;
  };
  relatedActivities: RelatedActivity[];
  reviews: Array<{
    id: string;
    author?: string;
    rating?: number;
    date?: string;
    comment?: string;
  }>;
  itinerary?: string[];
  policySummary: string[];
  partner?: {
    companyName?: string;
    contactName?: string;
    email?: string | null;
    phone?: string | null;
  };
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1529651737248-dad5eeb48697?auto=format&fit=crop&w=1600&q=80";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const generateFallbackId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toRelatedActivity = (tour: PublicTour): RelatedActivity => {
  const images = [
    tour.thumbnail_url,
    ...(Array.isArray(tour.media) ? tour.media : []),
    ...(Array.isArray(tour.gallery) ? tour.gallery : []),
  ].filter(Boolean) as string[];

  const price = tour.base_price ?? tour.season_price ?? 0;
  const originalPrice = tour.season_price ?? undefined;
  const discount =
    originalPrice && price && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  return {
    id: String(tour.id ?? tour.uuid ?? generateFallbackId()),
    title: tour.title ?? tour.name ?? "Tour nổi bật",
    location: tour.destination ?? "Đang cập nhật",
    image: images[0] ?? FALLBACK_IMAGE,
    rating: tour.average_rating ?? 4.5,
    reviewCount: tour.reviews_count ?? 0,
    price: price ?? 0,
    originalPrice: originalPrice ?? undefined,
    discount,
    duration:
      typeof tour.duration === "number"
        ? `${tour.duration} giờ`
        : tour.duration ?? "Đang cập nhật",
    category: tour.categories?.[0]?.name ?? "Tour du lịch",
    isPopular: true,
    features: Array.isArray(tour.tags) && tour.tags.length > 0 ? tour.tags.slice(0, 3) : [],
  };
};

const normalizeTourDetail = (
  tour?: PublicTour | null,
  relatedTours: PublicTour[] = [],
): ActivityDetailView | null => {
  if (!tour) return null;

  const id = String(tour.id ?? tour.uuid ?? "");
  const rawImages = [
    tour.thumbnail_url,
    ...(Array.isArray(tour.media) ? tour.media : []),
    ...(Array.isArray(tour.gallery) ? tour.gallery : []),
  ].filter(Boolean) as string[];

  const uniqueImages = Array.from(new Set(rawImages));
  if (uniqueImages.length === 0) {
    uniqueImages.push(FALLBACK_IMAGE);
  }

  const itineraryItems = Array.isArray(tour.itinerary)
    ? tour.itinerary
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const title =
              "title" in item && typeof item.title === "string" ? item.title : "";
            const desc =
              "description" in item && typeof item.description === "string"
                ? item.description
                : "";
            const combined = [title, desc].filter(Boolean).join(": ").trim();
            return combined || null;
          }
          return null;
        })
        .filter((entry): entry is string => Boolean(entry && entry.trim()))
    : [];

  const packages: ActivityPackage[] = Array.isArray(tour.schedules)
    ? tour.schedules.map((schedule, index) => ({
        id: String(schedule?.id ?? `${id}-schedule-${index}`),
        name: schedule?.title ?? `Lịch trình ${index + 1}`,
        price: schedule?.season_price ?? tour.base_price ?? null,
        originalPrice: tour.season_price ?? null,
        includes: [],
        startDate: schedule?.start_date ?? null,
        endDate: schedule?.end_date ?? null,
        capacity: schedule?.capacity ?? null,
        slotsAvailable: schedule?.slots_available ?? null,
      }))
    : [];

  const highlights =
    Array.isArray(tour.tags) && tour.tags.length > 0
      ? (tour.tags.filter(Boolean) as string[])
      : itineraryItems.slice(0, 3);

  const policyLines = tour.policy
    ? tour.policy
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const policySummary = policyLines.slice(0, 5);

  const partnerInfo = (() => {
    if (!tour.partner) return undefined;
    const candidate = {
      companyName: tour.partner.company_name ?? undefined,
      contactName: tour.partner.user?.name ?? undefined,
      email: tour.partner.user?.email ?? null,
      phone: tour.partner.user?.phone ?? null,
    };
    const hasInfo = Object.values(candidate).some(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    return hasInfo ? candidate : undefined;
  })();

  const termsAndConditions = tour.policy
    ? [
        {
          title: "Chính sách",
          content: tour.policy,
        },
      ]
    : [];

  const importantNotes =
    itineraryItems.length > 0
      ? [
          {
            title: "Lịch trình dự kiến",
            items: itineraryItems,
          },
        ]
      : policyLines.length > 0
      ? [
          {
            title: "Lưu ý",
            items: policyLines,
          },
        ]
      : [];

  const relatedActivities = relatedTours
    .filter((related) => String(related.id ?? related.uuid ?? "") !== id)
    .map(toRelatedActivity)
    .slice(0, 3);

  return {
    id,
    title: tour.title ?? tour.name ?? "Tour chưa có tên",
    locationName: tour.destination ?? undefined,
    region: tour.destination ?? undefined,
    category: tour.categories?.[0]?.name,
    tourType: tour.categories?.[0]?.name,
    pickupType: undefined,
    rating: tour.average_rating ?? null,
    reviewCount: tour.reviews_count ?? null,
    bookedCount: tour.bookings_count ?? null,
    price: tour.base_price ?? tour.season_price ?? null,
    originalPrice: tour.season_price ?? null,
    discount: null,
    duration: typeof tour.duration === "number" ? `${tour.duration} giờ` : tour.duration,
    images: uniqueImages,
    highlights,
    description: tour.description ?? null,
    packages,
    termsAndConditions,
    faqs: [],
    importantNotes,
    addOns: [],
    location: tour.destination
      ? {
          name: tour.destination,
          address: tour.destination,
          coordinates: null,
        }
      : undefined,
    relatedActivities,
    reviews: [],
    itinerary: itineraryItems,
    policySummary,
    partner: partnerInfo,
  };
};

const ActivityDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <TravelHeader />
    <main className="container mx-auto px-4 py-6 space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

const ActivityDetail = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const {
    data: tourDetail,
    isLoading: isTourLoading,
    isError: isTourError,
    error: tourError,
  } = useQuery({
    queryKey: ["tour-detail", id],
    queryFn: () => fetchTourDetail(String(id)),
    enabled: Boolean(id),
  });

  const { data: trendingTours } = useQuery({
    queryKey: ["trending-tours", { limit: 6 }],
    queryFn: () => fetchTrendingTours({ limit: 6 }),
  });

  const activity = useMemo(
    () => normalizeTourDetail(tourDetail, trendingTours ?? []),
    [tourDetail, trendingTours],
  );

  useEffect(() => {
    setSelectedImage(0);
  }, [activity?.id]);

  const displayPrice = useMemo(() => {
    if (!activity) return null;
    const prices = activity.packages
      .map((pkg) => (typeof pkg.price === "number" ? pkg.price : null))
      .filter((price): price is number => price !== null);
    if (prices.length > 0) {
      return Math.min(...prices);
    }
    return typeof activity.price === "number" ? activity.price : null;
  }, [activity]);

  const images = activity?.images ?? [];
  const totalImages = images.length;
  const previewLimit = 5;
  const safeSelectedIndex =
    totalImages > 0 ? Math.min(selectedImage, Math.max(0, totalImages - 1)) : 0;
  const mainImage = images[safeSelectedIndex] ?? images[0] ?? FALLBACK_IMAGE;
  const previewItems = useMemo(() => {
    if (images.length === 0) return [];
    if (images.length <= previewLimit) {
      return images.map((image, index) => ({ image, index }));
    }
    const mapped = images.map((image, index) => ({ image, index }));
    const items = mapped.slice(0, previewLimit);
    if (safeSelectedIndex >= previewLimit && mapped[safeSelectedIndex]) {
      items[previewLimit - 1] = mapped[safeSelectedIndex];
    }
    const seen = new Set<number>();
    return items.filter((item) => {
      if (seen.has(item.index)) return false;
      seen.add(item.index);
      return true;
    });
  }, [images, safeSelectedIndex]);
  const hasMoreImages = totalImages > previewLimit;

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <TravelHeader />
        <main className="container mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertTitle>Không tìm thấy tour</AlertTitle>
            <AlertDescription>Thiếu mã tour hợp lệ trong đường dẫn.</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (isTourLoading) {
    return <ActivityDetailSkeleton />;
  }

  if (isTourError) {
    const message =
      tourError instanceof Error
        ? tourError.message
        : "Đã xảy ra lỗi khi tải thông tin tour. Vui lòng thử lại sau.";
    return (
      <div className="min-h-screen bg-background">
        <TravelHeader />
        <main className="container mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertTitle>Không thể tải tour</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <TravelHeader />
        <main className="container mx-auto px-4 py-6">
          <Alert>
            <AlertTitle>Tour đang được cập nhật</AlertTitle>
            <AlertDescription>
              Chúng tôi chưa có đủ thông tin cho tour này. Vui lòng quay lại sau.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const hasHighlights = activity.highlights.length > 0;
  const hasPackages = activity.packages.length > 0;
  const hasImportantNotes = activity.importantNotes.length > 0;
  const hasTerms = activity.termsAndConditions.length > 0;
  const hasFaqs = activity.faqs.length > 0;
  const hasReviews = activity.reviews.length > 0;
  const hasLocation = Boolean(activity.location?.name || activity.location?.address);
  const locationCoords = activity.location?.coordinates;
  const hasRelated = activity.relatedActivities.length > 0;
  const ratingValue = typeof activity.rating === "number" ? activity.rating : null;
  const reviewCount = typeof activity.reviewCount === "number" ? activity.reviewCount : null;
  const bookedCount = typeof activity.bookedCount === "number" ? activity.bookedCount : null;
  const durationLabel = activity.duration ? String(activity.duration) : null;
  const breadcrumbLocation = activity.locationName ?? "Chi tiết tour";
  const itineraryItems = activity.itinerary ?? [];
  const policySummary = activity.policySummary;
  const hasPolicySummary = policySummary.length > 0;
  const partner = activity.partner;
  const quickInfoItems = [
    activity.locationName
      ? { icon: MapPin, label: "Điểm đến", value: activity.locationName }
      : null,
    durationLabel ? { icon: Calendar, label: "Thời lượng", value: durationLabel } : null,
    ratingValue !== null
      ? { icon: Star, label: "Đánh giá", value: `${ratingValue.toFixed(1)}/5` }
      : null,
    bookedCount !== null
      ? { icon: Users, label: "Đã đặt", value: `${bookedCount.toLocaleString()}+ khách` }
      : null,
  ].filter(
    (item): item is { icon: typeof MapPin; label: string; value: string } => Boolean(item),
  );
  const hasQuickInfo = quickInfoItems.length > 0;
  const openGallery = (index: number) => {
    setSelectedImage(index);
    setIsGalleryOpen(true);
  };
  const closeGallery = () => setIsGalleryOpen(false);
  const goPrevImage = () => {
    if (totalImages <= 1) return;
    setSelectedImage((prev) => (prev - 1 + totalImages) % totalImages);
  };
  const goNextImage = () => {
    if (totalImages <= 1) return;
    setSelectedImage((prev) => (prev + 1) % totalImages);
  };

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />

      <main className="container mx-auto px-4 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/activities">Hoạt động</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbLocation}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{activity.title}</h1>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {activity.category && (
                    <Badge variant="outline" className="text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      {activity.category}
                    </Badge>
                  )}
                  {durationLabel && (
                    <Badge variant="outline" className="text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {durationLabel}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {(ratingValue !== null || reviewCount !== null) && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold ml-1">
                          {ratingValue !== null ? `${ratingValue.toFixed(1)}/5` : "Chưa có đánh giá"}
                        </span>
                      </div>
                      {reviewCount !== null && (
                        <span className="text-sm text-muted-foreground">
                          {reviewCount.toLocaleString()} đánh giá
                        </span>
                      )}
                    </div>
                  )}
                  {bookedCount !== null && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{bookedCount.toLocaleString()}+ đã đặt</span>
                    </div>
                  )}
                  {activity.locationName && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.locationName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden group">
                  <img
                    src={mainImage}
                    alt={activity.title}
                    onClick={() => openGallery(safeSelectedIndex)}
                    className="w-full h-[400px] object-cover cursor-zoom-in transition-transform group-hover:scale-[1.01]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {previewItems.map(({ image, index }) => (
                    <button
                      key={`${index}-${image}`}
                      onClick={() => setSelectedImage(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-colors ${
                        safeSelectedIndex === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${activity.title} ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
                {totalImages > 0 && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openGallery(safeSelectedIndex)}>
                      {hasMoreImages ? `Thư viện ảnh (${totalImages})` : "Thư viện ảnh"}
                    </Button>
                  </div>
                )}
              </div>

              
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger
                  value="packages"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Các gói dịch vụ
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Về dịch vụ này
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Những điều cần lưu ý
                </TabsTrigger>
                <TabsTrigger
                  value="terms"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Điều khoản
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Đánh giá
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="prose max-w-none">
                  {activity.description ? (
                    <p className="text-foreground">{activity.description}</p>
                  ) : (
                    <p className="text-muted-foreground">Thông tin chi tiết sẽ được cập nhật sớm.</p>
                  )}
                  {itineraryItems.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-lg font-semibold text-foreground">Lịch trình nổi bật</h4>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {itineraryItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="packages" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    {hasPackages ? (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Vui lòng chọn ngày & gói dịch vụ</h3>
                            <Button variant="link" className="text-primary p-0">
                              Xóa tất cả
                            </Button>
                          </div>
                          <Button variant="outline" className="w-full mb-4 justify-start text-primary">
                            <Calendar className="mr-2 h-4 w-4" />
                            Xem trạng thái dịch vụ
                          </Button>

                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Loại gói dịch vụ</p>
                            <div className="flex flex-wrap gap-2">
                              {activity.packages.map((pkg) => {
                                const discount =
                                  pkg.originalPrice &&
                                  pkg.price &&
                                  pkg.originalPrice > pkg.price
                                    ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
                                    : null;
                                return (
                                  <Button
                                    key={pkg.id}
                                    variant="outline"
                                    className="relative rounded-full border-2 hover:border-primary"
                                  >
                                    {discount !== null && (
                                      <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs"
                                      >
                                        Giảm {discount}%
                                      </Badge>
                                    )}
                                    {pkg.name}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-4 space-y-4">
                            {activity.packages.map((pkg) => (
                              <div key={`${pkg.id}-details`} className="border rounded-lg p-4 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                                  {typeof pkg.price === "number" && (
                                    <span className="font-semibold text-primary">
                                      ₫ {pkg.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {(pkg.startDate || pkg.endDate || pkg.capacity || pkg.slotsAvailable) && (
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {pkg.startDate && (
                                      <p>Ngày bắt đầu: {formatDate(pkg.startDate) ?? pkg.startDate}</p>
                                    )}
                                    {pkg.endDate && (
                                      <p>Ngày kết thúc: {formatDate(pkg.endDate) ?? pkg.endDate}</p>
                                    )}
                                    {pkg.capacity && <p>Sức chứa: {pkg.capacity} khách</p>}
                                    {pkg.slotsAvailable && <p>Còn trống: {pkg.slotsAvailable}</p>}
                                  </div>
                                )}
                                {pkg.includes.length > 0 && (
                                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                    {pkg.includes.map((item, index) => (
                                      <li key={index}>{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Số lượng</p>
                            <div className="flex flex-col gap-3">
                              {["Người lớn", "Trẻ em (5-8)"].map((label) => (
                                <div key={label} className="flex items-center justify-between p-4 rounded-lg border">
                                  <span className="font-medium">{label}</span>
                                  <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                                      -
                                    </Button>
                                    <span className="w-8 text-center font-semibold">0</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                                      +
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-baseline gap-2">
                            {displayPrice !== null ? (
                              <span className="text-3xl font-bold">₫ {displayPrice.toLocaleString()}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Liên hệ để biết giá chi tiết.
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vui lòng hoàn tất các bước yêu cầu để chuyển đến bước tiếp theo.
                          </p>

                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50">
                              Thêm vào giỏ hàng
                            </Button>
                            <Button className="flex-1 bg-orange-500 hover:bg-orange-600">Đặt ngay</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Chưa có gói dịch vụ nào khả dụng cho tour này. Vui lòng quay lại sau hoặc liên hệ để được tư vấn.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <div className="prose max-w-none space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Thông tin chi tiết</h3>
                  {activity.description ? (
                    <p className="text-foreground">{activity.description}</p>
                  ) : (
                    <p className="text-muted-foreground">Thông tin về dịch vụ sẽ được cập nhật sớm.</p>
                  )}
                  <p className="text-foreground">
                    Dịch vụ của chúng tôi cam kết mang đến trải nghiệm tốt nhất với đội ngũ chuyên nghiệp,
                    lịch trình linh hoạt và sự hỗ trợ tận tâm trong suốt chuyến đi.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                {hasImportantNotes ? (
                  <div className="space-y-6">
                    {activity.importantNotes.map((note, index) => (
                      <div key={index}>
                        <div className="flex items-start gap-3 mb-3">
                          <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <h4 className="font-semibold text-foreground text-lg">{note.title}</h4>
                        </div>
                        <ul className="space-y-2 ml-8">
                          {note.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có lưu ý cụ thể cho tour này.</p>
                )}
              </TabsContent>

              <TabsContent value="terms" className="mt-6">
                {hasTerms ? (
                  <div className="space-y-6">
                    {activity.termsAndConditions.map((term, index) => (
                      <div key={index}>
                        <h4 className="font-semibold text-foreground mb-2">{term.title}</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{term.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Điều khoản sẽ được cập nhật và thông báo trước khi bạn xác nhận đặt dịch vụ.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {hasReviews ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-foreground">
                          {ratingValue !== null ? ratingValue.toFixed(1) : "5.0"}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                ratingValue !== null && i < Math.round(ratingValue)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {reviewCount !== null && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reviewCount.toLocaleString()} đánh giá
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      {activity.reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold">{review.author}</span>
                                  {review.date && (
                                    <span className="text-sm text-muted-foreground">{review.date}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        review.rating && i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-muted-foreground">{review.comment}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có đánh giá cho tour này. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {hasLocation && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Địa điểm</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          {activity.location?.name ?? "Đang cập nhật"}
                        </h4>
                        {activity.location?.address && (
                          <p className="text-muted-foreground flex items-start gap-2">
                            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{activity.location.address}</span>
                          </p>
                        )}
                      </div>
                      {locationCoords ? (
                        <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                          <iframe
                            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.086097468119!2d${locationCoords.lng}!3d${locationCoords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM1BMIS4!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                          Đang cập nhật bản đồ địa điểm.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {hasFaqs && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Câu hỏi thường gặp</h2>
                <div className="space-y-4">
                  {activity.faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6 lg:self-start">
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card className="w-full shadow-xl">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      {displayPrice !== null ? (
                        <span className="text-3xl font-bold">
                          ₫ {displayPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Giá sẽ được cập nhật trong thời gian sớm nhất.
                        </span>
                      )}
                    </div>

                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base py-6">
                      Chọn các gói dịch vụ
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {hasQuickInfo && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Thông tin nhanh</h3>
                    <div className="space-y-3">
                      {quickInfoItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="font-medium text-foreground">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasPolicySummary && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Chính sách nổi bật
                    </h3>
                    <ul className="space-y-2">
                      {policySummary.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1 text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {partner && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">Nhà cung cấp</h3>
                      {partner.companyName && (
                        <p className="text-sm text-muted-foreground">{partner.companyName}</p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {partner.contactName && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span>{partner.contactName}</span>
                        </div>
                      )}
                      {partner.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{partner.phone}</span>
                        </div>
                      )}
                      {partner.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="break-all">{partner.email}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full">
                      Liên hệ đối tác
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg text-foreground">Cần hỗ trợ thêm?</h3>
                  <p className="text-sm text-muted-foreground">
                    Đội ngũ TripCurate luôn sẵn sàng giúp bạn lên kế hoạch và giải đáp mọi thắc mắc.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Hotline: 1900 636 789</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="break-all">support@tripcurate.vn</span>
                    </div>
                  </div>
                  <Button className="w-full">Trò chuyện với chúng tôi</Button>
                </CardContent>
              </Card>
            </div>

            {activity.addOns && activity.addOns.length > 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Thêm vào trải nghiệm của bạn
                  </h3>
                  <div className="space-y-3">
                    {activity.addOns.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex gap-3 p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                      >
                        {addon.image && (
                          <img
                            src={addon.image}
                            alt={addon.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">{addon.title}</h4>
                          {addon.description && (
                            <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                          )}
                          {typeof addon.price === "number" && (
                            <p className="text-sm font-semibold text-primary mt-1">
                              ₫ {addon.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {hasRelated && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Bạn có thể sẽ thích</h2>
              <Link to="/activities" className="text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activity.relatedActivities.map((related) => (
                <TourCard key={related.id} {...related} />
              ))}
            </div>
          </div>
        )}
      </main>

    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
  <DialogContent className="max-w-7xl w-full p-0 border-none bg-transparent shadow-none">
    {/* ADDED: Thêm lại background để giao diện đẹp hơn */}
    <div className="flex h-[90vh] flex-col overflow-hidden rounded-lg  text-white ">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h3 className="font-semibold truncate pr-4">{activity.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 flex-shrink-0"
          onClick={closeGallery}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* FIXED: Thêm class "min-h-0" vào đây để sửa lỗi co giãn */}
      <div className="relative flex-1 px-16 py-4 min-h-0">
        {totalImages > 1 && (
          <button
            type="button"
            onClick={goPrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 z-10"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="relative flex h-full w-full items-center justify-center">
          <img
            src={activity.images[safeSelectedIndex] ?? mainImage}
            alt={`${activity.title} ${safeSelectedIndex + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90">
            {safeSelectedIndex + 1} / {totalImages}
          </div>
        </div>

        {totalImages > 1 && (
          <button
            type="button"
            onClick={goNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 z-10"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {activity.images.length > 0 && (
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex justify-center">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {activity.images.map((image, index) => (
                <button
                  key={`${index}-${image}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md transition focus:outline-none ${
                    safeSelectedIndex === index
                      ? "ring-2 ring-white shadow-lg"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${activity.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
      <Footer />
    </div>
  );
};

export default ActivityDetail;

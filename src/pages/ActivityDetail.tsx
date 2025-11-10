import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import {
  Star,
  MapPin,
  Heart,
  ChevronRight,
  Calendar,
  Users,
  AlertCircle,
  Info,
  Shield,
  Phone,
  Mail,
  ChevronLeft,
  Clock,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
// Thêm import cho component Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TourCard from "@/components/TourCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  fetchTourDetail,
  fetchTrendingTours,
  type AutoPromotion,
  type CancellationPolicy,
  type PublicTour,
  type PublicTourSchedule,
  type TourType,
} from "@/services/publicApi";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRecommendationRealtimeRefresh } from "@/hooks/useRecommendationRealtimeRefresh";
import { applyAutoPromotionToPrice, getTourPriceInfo, getTourStartingPrice } from "@/lib/tour-utils";
import { addWishlistItem, removeWishlistItem, type WishlistItem } from "@/services/wishlistApi";
import {
  fetchTourReviews,
  type TourReview,
  type TourReviewListResponse,
} from "@/services/reviewApi";
import SimilarTourRecommendations from "@/components/recommendations/SimilarTourRecommendations";


// ====================================================================================
// CÁC TYPE VÀ HÀM HỖ TRỢ (GIỮ NGUYÊN)
// ====================================================================================
type ActivityPackage = {
  id: string;
  name?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  adultPrice?: number | null;
  childPrice?: number | null;
  packageId?: string | null;
  isActive?: boolean;
  includes: string[];
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  slotsAvailable?: number | null;
  seatsTotal?: number | null;
  minParticipants?: number | null;
};

type RelatedActivity = {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  bookingsCount?: number | null;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  category: string;
  isPopular?: boolean;
  features: string[];
  promotionLabel?: string | null;
};

interface ActivityDetailView {
  id: string;
  title: string;
  locationName?: string;
  region?: string;
  category?: string;
  tourType?: string;
  tourClassification?: TourType | null;
  pickupType?: string;
  rating?: number | null;
  reviewCount?: number | null;
  bookedCount?: number | null;
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  promotionLabel?: string | null;
  autoPromotion?: AutoPromotion | null;
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
  itinerary?: Array<string | { title?: string; description?: string; time?: string }>;
  policySummary: string[];
  childAgeLimit?: number | null;
  requiresPassport?: boolean | null;
  requiresVisa?: boolean | null;
  cancellationPolicies?: CancellationPolicy[] | null;
  partner?: {
    companyName?: string;
    contactName?: string;
    email?: string | null;
    phone?: string | null;
  };
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529651737248-dad5eeb48697?auto=format&fit=crop&w=1600&q=80";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const generateFallbackId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const parseFloatOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parseIntOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parseBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
  }
  return null;
};

const parseScheduleNumber = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};


const resolveTourTypeLabel = (type?: TourType | string | null) => {
  if (!type) return null;
  const normalized = type.toString().trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "domestic") return "Tour nội địa";
  if (normalized === "international") return "Tour quốc tế";
  return type.toString();
};

const toIdString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const collectReviewTourIds = (review: TourReview): string[] => {
  const identifiers = new Set<string>();
  const pushId = (value: unknown) => {
    const id = toIdString(value);
    if (id) identifiers.add(id);
  };

  if (review.booking) {
    pushId(review.booking.tour_id);
    const bookingRecord = review.booking as Record<string, unknown>;
    pushId(bookingRecord?.["tourId"]);
    pushId(bookingRecord?.["tour_uuid"]);
    const bookingTour = bookingRecord?.["tour"] as Record<string, unknown> | undefined;
    pushId(bookingTour?.["id"]);
    pushId(bookingTour?.["uuid"]);
  }

  if (review.tour_schedule) {
    pushId(review.tour_schedule.tour_id);
    const scheduleRecord = review.tour_schedule as Record<string, unknown>;
    pushId(scheduleRecord?.["tour_uuid"]);
  }

  const reviewRecord = review as Record<string, unknown>;
  pushId(reviewRecord?.["tour_id"]);
  pushId(reviewRecord?.["tourId"]);
  pushId(reviewRecord?.["tour_uuid"]);

  return Array.from(identifiers);
};

const formatDocumentRequirement = (requiresPassport?: boolean | null, requiresVisa?: boolean | null) => {
  const needsPassport = requiresPassport === true;
  const needsVisa = requiresVisa === true;
  if (!needsPassport && !needsVisa) return "Không yêu cầu hộ chiếu hoặc visa";
  const pieces: string[] = [];
  if (needsPassport) pieces.push("Hộ chiếu");
  if (needsVisa) pieces.push("Visa");
  return `Bắt buộc: ${pieces.join(" & ")}`;
};

const formatChildAgeLimit = (limit?: number | null) => {
  if (typeof limit === "number" && Number.isFinite(limit)) {
    if (limit <= 0) return "Không áp dụng";
    return `Trẻ em ≤ ${limit} tuổi`;
  }
  return "Theo từng gói dịch vụ";
};

const formatRefundRate = (rate?: number | null) => {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "Theo quy định";
  const normalized = rate > 1 ? rate : rate * 100;
  return `${Math.round(normalized)}%`;
};

const formatCancellationWindow = (days?: number | null) => {
  if (typeof days !== "number" || !Number.isFinite(days)) return "Linh hoạt";
  if (days <= 0) return "Trong ngày khởi hành";
  return `Trước ${days} ngày`;
};

const extractPagination = (meta?: Record<string, unknown>) => {
  if (!meta) {
    return { current: undefined as number | undefined, last: undefined as number | undefined };
  }
  const rawCurrent = (meta as Record<string, unknown>).current_page ?? (meta as Record<string, unknown>).currentPage;
  const rawLast = (meta as Record<string, unknown>).last_page ?? (meta as Record<string, unknown>).lastPage;
  return {
    current: parseIntOrNull(rawCurrent ?? undefined) ?? undefined,
    last: parseIntOrNull(rawLast ?? undefined) ?? undefined,
  };
};

const extractReviewsFromPage = (page: unknown): TourReview[] => {
  if (!page || typeof page !== "object") return [];
  const record = page as Record<string, unknown>;
  const reviewsField = record.reviews;
  if (Array.isArray(reviewsField)) {
    return reviewsField as TourReview[];
  }
  if (reviewsField && typeof reviewsField === "object") {
    const data = (reviewsField as Record<string, unknown>).data;
    if (Array.isArray(data)) {
      return data as TourReview[];
    }
  }
  const candidates = [
    record.data,
    record.items,
    record.results,
    record.list,
    record.entries,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as TourReview[];
    }
  }
  return [];
};

const extractRatingMetaFromPage = (page: unknown): { average?: number | null; count?: number | null } | null => {
  if (!page || typeof page !== "object") return null;
  const record = page as Record<string, unknown>;
  const ratingField = record.rating;
  if (ratingField && typeof ratingField === "object") {
    return ratingField as { average?: number | null; count?: number | null };
  }
  const reviewsField = record.reviews;
  if (reviewsField && typeof reviewsField === "object") {
    const nestedRating = (reviewsField as Record<string, unknown>).rating;
    if (nestedRating && typeof nestedRating === "object") {
      return nestedRating as { average?: number | null; count?: number | null };
    }
  }
  return null;
};

const resolveErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybeResponse = (error as Record<string, unknown>).response;
    if (maybeResponse && typeof maybeResponse === "object") {
      const message = (maybeResponse as Record<string, unknown>).data;
      if (message && typeof message === "object" && typeof (message as Record<string, unknown>).message === "string") {
        return String((message as Record<string, unknown>).message);
      }
    }
    if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
      return String((error as { message?: unknown }).message);
    }
  }
  return "Đã có lỗi xảy ra, vui lòng thử lại.";
};

const toRelatedActivity = (tour: PublicTour): RelatedActivity => {
  const images = [
    tour.thumbnail_url,
    ...(Array.isArray(tour.media) ? tour.media : []),
    ...(Array.isArray(tour.gallery) ? tour.gallery : []),
  ].filter(Boolean) as string[];

  const priceInfo = getTourPriceInfo(tour);
  const price =
    typeof priceInfo.price === "number" && Number.isFinite(priceInfo.price)
      ? Math.max(0, Math.round(priceInfo.price))
      : getTourStartingPrice(tour);
  const seasonPrice =
    typeof tour.season_price === "number" && Number.isFinite(tour.season_price)
      ? Math.max(0, tour.season_price)
      : undefined;
  const originalPrice =
    typeof priceInfo.originalPrice === "number" && Number.isFinite(priceInfo.originalPrice)
      ? Math.max(0, Math.round(priceInfo.originalPrice))
      : seasonPrice && seasonPrice > price
      ? seasonPrice
      : undefined;
  const discount =
    typeof priceInfo.discountPercent === "number" && priceInfo.discountPercent > 0
      ? priceInfo.discountPercent
      : typeof originalPrice === "number" && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;
  const promotionLabel =
    typeof discount === "number" && discount > 0
      ? `Giảm ${discount}%`
      : typeof priceInfo.autoPromotion?.description === "string" &&
        priceInfo.autoPromotion.description.trim().length > 0
      ? priceInfo.autoPromotion.description.trim()
      : null;

  const ratingValue =
    parseFloatOrNull(tour.rating_average ?? undefined) ??
    parseFloatOrNull(tour.average_rating ?? undefined) ??
    parseFloatOrNull((tour as Record<string, unknown>)?.rating ?? undefined);
  const reviewCountValue =
    parseIntOrNull(tour.rating_count ?? undefined) ??
    parseIntOrNull(tour.reviews_count ?? undefined) ??
    parseIntOrNull((tour as Record<string, unknown>)?.reviewsCount ?? undefined);
  const bookingsCountValue =
    parseIntOrNull(tour.bookings_count ?? undefined) ??
    parseIntOrNull((tour as Record<string, unknown>)?.bookingsCount ?? undefined);

  return {
    id: String(tour.id ?? tour.uuid ?? generateFallbackId()),
    title: tour.title ?? tour.name ?? "Tour nổi bật",
    location: tour.destination ?? "Đang cập nhật",
    image: images[0] ?? FALLBACK_IMAGE,
    rating: ratingValue,
    reviewCount: reviewCountValue,
    bookingsCount: bookingsCountValue,
    price,
    originalPrice,
    discount,
    promotionLabel,
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
  const priceInfo = getTourPriceInfo(tour);
  const autoPromotion = priceInfo.autoPromotion ?? null;
  const adjustPriceWithPromotion = (
    value: number | null | undefined,
    fallbackOriginal?: number | null,
  ) => {
    const result = applyAutoPromotionToPrice(value, autoPromotion);
    const finalPrice =
      typeof result.finalPrice === "number" && Number.isFinite(result.finalPrice)
        ? result.finalPrice
        : typeof value === "number"
        ? value
        : null;
    const derivedOriginal =
      result.originalPrice ??
      (typeof fallbackOriginal === "number" &&
      typeof finalPrice === "number" &&
      fallbackOriginal > finalPrice
        ? fallbackOriginal
        : null);
    const discountPercent =
      result.discountPercent ??
      (typeof derivedOriginal === "number" &&
      typeof finalPrice === "number" &&
      derivedOriginal > finalPrice
        ? Math.round(((derivedOriginal - finalPrice) / derivedOriginal) * 100)
        : null);
    return {
      price: typeof finalPrice === "number" ? Math.round(finalPrice) : finalPrice,
      originalPrice:
        typeof derivedOriginal === "number" ? Math.round(derivedOriginal) : derivedOriginal,
      discountPercent,
    };
  };

  const rawTourType =
    typeof tour.type === "string" && tour.type.trim().length > 0 ? tour.type.trim() : null;
  const childAgeLimit = parseIntOrNull(
    tour.child_age_limit ??
      (tour as Record<string, unknown>)?.childAgeLimit ??
      (tour as Record<string, unknown>)?.child_age_limit,
  );
  const requiresPassport =
    parseBooleanOrNull((tour as Record<string, unknown>)?.requires_passport) ??
    parseBooleanOrNull((tour as Record<string, unknown>)?.requiresPassport);
  const requiresVisa =
    parseBooleanOrNull((tour as Record<string, unknown>)?.requires_visa) ??
    parseBooleanOrNull((tour as Record<string, unknown>)?.requiresVisa);
  const rawCancellationPolicies = Array.isArray(tour.cancellation_policies)
    ? (tour.cancellation_policies as unknown[])
    : Array.isArray((tour as Record<string, unknown>)?.cancellationPolicies)
    ? ((tour as Record<string, unknown>)?.cancellationPolicies as unknown[])
    : [];
  const cancellationPolicies = rawCancellationPolicies.filter(
    (entry): entry is CancellationPolicy => Boolean(entry) && typeof entry === "object",
  );
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

const basePriceValue = parseFloatOrNull(tour.base_price);
const seasonPriceValue = parseFloatOrNull(tour.season_price);

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

  const packages: ActivityPackage[] = (() => {
    if (Array.isArray(tour.packages) && tour.packages.length > 0) {
      return tour.packages.map((pkg, index) => {
        const adultPrice = parseFloatOrNull(
          pkg?.adult_price ?? (pkg as Record<string, unknown>)?.adultPrice ?? pkg?.price ?? null,
        );
        const childPrice = parseFloatOrNull(
          pkg?.child_price ?? (pkg as Record<string, unknown>)?.childPrice ?? null,
        );
        const effectivePrice = adultPrice ?? childPrice ?? basePriceValue ?? null;
        const adjustedPrice = adjustPriceWithPromotion(effectivePrice, seasonPriceValue ?? null);
        return {
          id: String(pkg?.id ?? `${id}-package-${index}`),
          packageId: String(pkg?.id ?? `${id}-package-${index}`),
          name: pkg?.name ?? `Gói dịch vụ ${index + 1}`,
          price: adjustedPrice.price ?? effectivePrice,
          originalPrice:
            adjustedPrice.originalPrice ?? (typeof seasonPriceValue === "number" ? seasonPriceValue : null),
          adultPrice: adjustedPrice.price ?? adultPrice ?? null,
          childPrice: childPrice ?? null,
          isActive: pkg?.is_active ?? true,
          includes: [],
          startDate: null,
          endDate: null,
          capacity: null,
          slotsAvailable: null,
        };
      });
    }
    if (Array.isArray(tour.schedules)) {
      return tour.schedules.map((schedule, index) => {
        const schedulePrice = parseFloatOrNull(
          schedule?.season_price ??
            (schedule as Record<string, unknown>)?.price ??
            (schedule as Record<string, unknown>)?.price_from ??
            null,
        );
        const adjustedSchedulePrice = adjustPriceWithPromotion(
          schedulePrice ?? basePriceValue ?? null,
          seasonPriceValue ?? null,
        );
        return {
          id: String(schedule?.id ?? `${id}-schedule-${index}`),
          name: schedule?.title ?? `Lịch trình ${index + 1}`,
          price: adjustedSchedulePrice.price ?? schedulePrice ?? basePriceValue ?? null,
          originalPrice:
            adjustedSchedulePrice.originalPrice ?? (typeof seasonPriceValue === "number" ? seasonPriceValue : null),
          includes: [],
          startDate: schedule?.start_date ?? null,
          endDate: schedule?.end_date ?? null,
          capacity:
            parseScheduleNumber(
              schedule?.capacity,
              (schedule as Record<string, unknown>)?.capacity,
              schedule?.seats_total,
              (schedule as Record<string, unknown>)?.seats_total,
              (schedule as Record<string, unknown>)?.seatsTotal,
            ) ?? null,
          seatsTotal:
            parseScheduleNumber(
              schedule?.seats_total,
              (schedule as Record<string, unknown>)?.seats_total,
              (schedule as Record<string, unknown>)?.seatsTotal,
              (schedule as Record<string, unknown>)?.capacity,
            ) ?? null,
          slotsAvailable:
            parseScheduleNumber(
              schedule?.slots_available,
              (schedule as Record<string, unknown>)?.slots_available,
              (schedule as Record<string, unknown>)?.slotsAvailable,
              (schedule as Record<string, unknown>)?.seats_available,
            ) ?? null,
          minParticipants:
            parseScheduleNumber(
              schedule?.min_participants,
              (schedule as Record<string, unknown>)?.min_participants,
              (schedule as Record<string, unknown>)?.minParticipants,
            ) ?? null,
        };
      });
    }
    return [];
  })();

  const sortedPackages =
    packages.length > 1
      ? [...packages].sort((a, b) => {
          const priceA =
            (a.adultPrice ?? a.price ?? Number.POSITIVE_INFINITY) || Number.POSITIVE_INFINITY;
          const priceB =
            (b.adultPrice ?? b.price ?? Number.POSITIVE_INFINITY) || Number.POSITIVE_INFINITY;
          return priceA - priceB;
        })
      : packages;

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

  const basePriceCandidate =
    basePriceValue ??
    sortedPackages[0]?.adultPrice ??
    sortedPackages[0]?.price ??
    seasonPriceValue ??
    null;
  const adjustedActivityPrice = adjustPriceWithPromotion(basePriceCandidate, seasonPriceValue ?? null);
  const finalActivityPrice =
    adjustedActivityPrice.price ??
    (typeof basePriceCandidate === "number" ? basePriceCandidate : null);
  const finalOriginalPrice =
    adjustedActivityPrice.originalPrice ??
    (typeof seasonPriceValue === "number" &&
    typeof finalActivityPrice === "number" &&
    seasonPriceValue > finalActivityPrice
      ? seasonPriceValue
      : null);
  const activityDiscount =
    adjustedActivityPrice.discountPercent ??
    priceInfo.discountPercent ??
    (typeof finalOriginalPrice === "number" &&
    typeof finalActivityPrice === "number" &&
    finalOriginalPrice > finalActivityPrice
      ? Math.round(((finalOriginalPrice - finalActivityPrice) / finalOriginalPrice) * 100)
      : null);
  const activityPromotionLabel =
    typeof activityDiscount === "number" && activityDiscount > 0
      ? `Giảm ${activityDiscount}%`
      : typeof autoPromotion?.description === "string" && autoPromotion.description.trim().length > 0
      ? autoPromotion.description.trim()
      : autoPromotion?.code
      ? `Mã ${autoPromotion.code}`
      : null;

  return {
    id,
    title: tour.title ?? tour.name ?? "Tour chưa có tên",
    locationName: tour.destination ?? undefined,
    region: tour.destination ?? undefined,
    category: tour.categories?.[0]?.name,
    tourType: resolveTourTypeLabel(rawTourType) ?? tour.categories?.[0]?.name,
    tourClassification: rawTourType,
    pickupType: undefined,
    rating: tour.rating_average ?? tour.average_rating ?? null,
    reviewCount: tour.rating_count ?? tour.reviews_count ?? null,
    bookedCount: tour.bookings_count ?? null,
    price: finalActivityPrice,
    originalPrice: finalOriginalPrice ?? null,
    discount: activityDiscount ?? null,
    promotionLabel: activityPromotionLabel,
    autoPromotion,
    duration: typeof tour.duration === "number" ? `${tour.duration} giờ` : tour.duration,
    images: uniqueImages,
    highlights,
    description: tour.description ?? null,
    packages: sortedPackages,
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
    itinerary: tour.itinerary,
    policySummary,
    childAgeLimit,
    requiresPassport,
    requiresVisa,
    cancellationPolicies: cancellationPolicies.length > 0 ? cancellationPolicies : null,
    partner: partnerInfo,
  };
};

const ActivityDetailSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <TravelHeader />
    <main className="container mx-auto flex-grow px-4 py-6 space-y-6">
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

const MAX_TRAVELLERS = 15;
const CHILD_PRICE_RATIO = 0.75;
const TAB_QUERY_KEY = "tab";
const ACTIVITY_TAB_VALUES = ["overview", "packages", "details", "notes", "terms", "reviews"] as const;
const VALID_TAB_SET = new Set<string>(ACTIVITY_TAB_VALUES);

const ActivityDetail = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get(TAB_QUERY_KEY);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { currentUser } = useUser();
  const { trackEvent } = useAnalytics();
  const scheduleRecommendationRefresh = useRecommendationRealtimeRefresh();
  const queryClient = useQueryClient();
  const hasLoggedViewRef = useRef(false);

  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const wishlistQueryKey = ["wishlist", currentUser?.id != null ? String(currentUser.id) : "guest"] as const;

  const cartItemIdParam = searchParams.get("cartItemId");
  const packageIdParam = searchParams.get("packageId");
  const scheduleIdParam = searchParams.get("scheduleId");
  const adultsParam = searchParams.get("adults");
  const childrenParam = searchParams.get("children");

  useEffect(() => {
    setEditingCartItemId(cartItemIdParam ?? null);
  }, [cartItemIdParam]);

  useEffect(() => {
    if (packageIdParam) {
      setSelectedPackageId(packageIdParam);
    }
  }, [packageIdParam]);

  useEffect(() => {
    if (scheduleIdParam !== null) {
      const trimmed = scheduleIdParam.trim();
      setSelectedScheduleId(trimmed.length ? trimmed : null);
    }
  }, [scheduleIdParam]);

  useEffect(() => {
    if (adultsParam) {
      const parsed = Number.parseInt(adultsParam, 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        setAdultCount(parsed);
      }
    }
  }, [adultsParam]);

  useEffect(() => {
    if (childrenParam) {
      const parsed = Number.parseInt(childrenParam, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        setChildCount(parsed);
      }
    }
  }, [childrenParam]);


  const addWishlistMutation = useMutation<WishlistItem, unknown, string>({
    mutationFn: (tourId: string) => addWishlistItem(tourId),
    onSuccess: (item) => {
      setIsWishlisted(true);
      setWishlistItemId(item.id);
      queryClient.setQueryData<WishlistItem[]>(wishlistQueryKey, (previous) => {
        if (!previous) return [item];
        const filtered = previous.filter((entry) => entry.id !== item.id);
        return [item, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã thêm vào yêu thích",
        description: "Bạn có thể xem lại tour này trong mục Wishlist.",
      });
      const entityId = resolvedTourEntityId ?? (item.tour_id ? String(item.tour_id) : null);
      if (entityId) {
        trackEvent(
          {
            event_name: "wishlist_add",
            entity_type: "tour",
            entity_id: entityId,
            metadata: {
              source: "activity_detail",
              wishlist_item_id: item.id,
            },
          },
          { immediate: true },
        );
        scheduleRecommendationRefresh();
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể thêm vào wishlist",
        description: resolveErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const removeWishlistMutation = useMutation<void, unknown, string>({
    mutationFn: (id: string) => removeWishlistItem(id),
    onSuccess: (_, removedId) => {
      setIsWishlisted(false);
      setWishlistItemId(null);
      queryClient.setQueryData<WishlistItem[]>(wishlistQueryKey, (previous) =>
        (previous ?? []).filter((entry) => entry.id !== removedId),
      );
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã xoá khỏi yêu thích",
        description: "Tour đã được gỡ khỏi danh sách Wishlist.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể xoá khỏi wishlist",
        description: resolveErrorMessage(error),
        variant: "destructive",
      });
    },
  });

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

  const acceptableTourIds = useMemo(() => {
    const ids = new Set<string>();
    if (id) ids.add(String(id));
    if (tourDetail?.id !== undefined && tourDetail?.id !== null) ids.add(String(tourDetail.id));
    if (tourDetail?.uuid) ids.add(String(tourDetail.uuid));
    return Array.from(ids);
  }, [id, tourDetail?.id, tourDetail?.uuid]);

const activity = useMemo(
  () => normalizeTourDetail(tourDetail, trendingTours ?? []),
  [tourDetail, trendingTours],
);


const resolvedTourEntityId = useMemo(() => {
  const candidates: Array<unknown> = [tourDetail?.uuid, tourDetail?.id, activity?.id, id];
  const candidate = candidates.find(
    (value) => typeof value === "string" || typeof value === "number",
  );
  return candidate !== undefined && candidate !== null ? String(candidate) : null;
}, [activity?.id, id, tourDetail?.id, tourDetail?.uuid]);

useEffect(() => {
  if (!tourDetail) return;
  if (hasLoggedViewRef.current) return;
  if (!resolvedTourEntityId) return;
  trackEvent(
    {
      event_name: "tour_view",
      entity_type: "tour",
      entity_id: resolvedTourEntityId,
      metadata: {
        source: "activity_detail",
      },
    },
    { immediate: true },
  );
  hasLoggedViewRef.current = true;
}, [resolvedTourEntityId, tourDetail, trackEvent]);

  const tourTypeDisplay = useMemo(
    () => resolveTourTypeLabel(activity?.tourClassification ?? activity?.tourType ?? null),
    [activity?.tourClassification, activity?.tourType],
  );

  const documentRequirementLabel = useMemo(
    () => formatDocumentRequirement(activity?.requiresPassport, activity?.requiresVisa),
    [activity?.requiresPassport, activity?.requiresVisa],
  );

  const childAgeLimitLabel = useMemo(
    () => formatChildAgeLimit(activity?.childAgeLimit),
    [activity?.childAgeLimit],
  );

  const cancellationSummaryLabel = useMemo(() => {
    if (activity?.cancellationPolicies && activity.cancellationPolicies.length > 0) {
      return `${activity.cancellationPolicies.length} chính sách hủy áp dụng`;
    }
    return "Theo điều kiện từng gói dịch vụ";
  }, [activity?.cancellationPolicies]);

  useEffect(() => {
    if (!activity?.id || !currentUser) {
      setIsWishlisted(false);
      setWishlistItemId(null);
      return;
    }
    const cached = queryClient.getQueryData<WishlistItem[]>(wishlistQueryKey);
    if (Array.isArray(cached)) {
      const matched = cached.find(
        (entry) => String(entry.tour_id) === String(activity.id ?? ""),
      );
      setIsWishlisted(Boolean(matched));
      setWishlistItemId(matched?.id ?? null);
    } else {
      setIsWishlisted(false);
      setWishlistItemId(null);
    }
  }, [activity?.id, currentUser, queryClient, wishlistQueryKey]);
  const schedules = tourDetail?.schedules ?? [];

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<TourReviewListResponse, Error>({
    queryKey: ["tour-reviews", id ? String(id) : ""],
    queryFn: ({ pageParam = 1 }) =>
      fetchTourReviews(String(id), {
        page: typeof pageParam === "number" ? pageParam : 1,
        per_page: 5,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = extractPagination(
        (lastPage?.reviews?.meta as Record<string, unknown> | undefined) ?? undefined,
      );
      if (!pagination.current || !pagination.last) return undefined;
      if (pagination.current >= pagination.last) return undefined;
      return pagination.current + 1;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });

  const allReviews = useMemo(() => {
    if (!reviewsData?.pages) return [];
    return reviewsData.pages.flatMap((page) => extractReviewsFromPage(page));
  }, [reviewsData?.pages]);

  const tourReviews = useMemo(() => {
    if (acceptableTourIds.length === 0) return allReviews;
    const acceptableSet = new Set(acceptableTourIds);
    return allReviews.filter((review) => {
      const identifiers = collectReviewTourIds(review);
      if (identifiers.length === 0) return true;
      return identifiers.some((identifier) => acceptableSet.has(identifier));
    });
  }, [acceptableTourIds, allReviews]);

  const ratingSummary = useMemo(() => {
    if (!reviewsData?.pages || reviewsData.pages.length === 0) return null;
    const pageWithRating = reviewsData.pages.find((page) => extractRatingMetaFromPage(page));
    return extractRatingMetaFromPage(pageWithRating ?? reviewsData.pages[0]) ?? null;
  }, [reviewsData?.pages]);

  const ratingAverage =
    parseFloatOrNull(ratingSummary?.average ?? undefined) ??
    (typeof activity?.rating === "number" ? activity.rating : null);

  const ratingCount =
    parseIntOrNull(ratingSummary?.count ?? undefined) ??
    (typeof activity?.reviewCount === "number" ? activity.reviewCount : null);

  const derivedReviewStats = useMemo(() => {
    if (tourReviews.length === 0) {
      return { average: null as number | null, count: 0 };
    }
    const numericRatings = tourReviews
      .map((review) => parseFloatOrNull(review.rating ?? undefined))
      .filter((value): value is number => value !== null);
    if (numericRatings.length === 0) {
      return { average: null as number | null, count: 0 };
    }
    const sum = numericRatings.reduce((acc, value) => acc + value, 0);
    return {
      average: sum / numericRatings.length,
      count: numericRatings.length,
    };
  }, [tourReviews]);

  const ratingValue = derivedReviewStats.average ?? ratingAverage ?? null;
  const reviewCount = derivedReviewStats.count > 0 ? derivedReviewStats.count : ratingCount ?? null;

  const detailReviews = useMemo(() => {
    if (!tourDetail?.reviews) return [];
    return extractReviewsFromPage(tourDetail.reviews);
  }, [tourDetail?.reviews]);

  const combinedReviews = useMemo(() => {
    const merged = [...tourReviews, ...detailReviews];
    if (merged.length === 0) return [];
    const seen = new Set<string>();
    const result: TourReview[] = [];
    merged.forEach((review) => {
      if (!review) return;
      const key =
        review.id !== undefined && review.id !== null
          ? String(review.id)
          : `${review.user?.id ?? "anon"}-${review.created_at ?? review.updated_at ?? Math.random()}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(review);
    });
    return result;
  }, [tourReviews, detailReviews]);

  const selectedSchedule = useMemo(
    () =>
      schedules.find((schedule) => String(schedule?.id) === selectedScheduleId) ??
      (schedules.length > 0 ? schedules[0] : null),
    [schedules, selectedScheduleId],
  );

  const selectedScheduleMinParticipants = useMemo(() => {
    if (!selectedSchedule) return null;
    const value = parseScheduleNumber(
      selectedSchedule?.min_participants,
      (selectedSchedule as Record<string, unknown>)?.min_participants,
      (selectedSchedule as Record<string, unknown>)?.minParticipants,
    );
    return typeof value === "number" ? Math.max(1, Math.trunc(value)) : null;
  }, [selectedSchedule]);

  const selectedScheduleSeatsTotal = useMemo(() => {
    if (!selectedSchedule) return null;
    const value = parseScheduleNumber(
      selectedSchedule?.seats_total,
      (selectedSchedule as Record<string, unknown>)?.seats_total,
      (selectedSchedule as Record<string, unknown>)?.seatsTotal,
      (selectedSchedule as Record<string, unknown>)?.capacity,
    );
    return typeof value === "number" ? Math.max(0, Math.trunc(value)) : null;
  }, [selectedSchedule]);

  const selectedScheduleSlotsAvailable = useMemo(() => {
    if (!selectedSchedule) return null;
    const value = parseScheduleNumber(
      selectedSchedule?.slots_available,
      (selectedSchedule as Record<string, unknown>)?.slots_available,
      (selectedSchedule as Record<string, unknown>)?.slotsAvailable,
      (selectedSchedule as Record<string, unknown>)?.seats_available,
    );
    return typeof value === "number" ? Math.max(0, Math.trunc(value)) : null;
  }, [selectedSchedule]);
  const seatsAvailability = selectedScheduleSlotsAvailable ?? null;
  const seatsCapacity = selectedScheduleSeatsTotal ?? null;
  const isEditingCartItem = Boolean(editingCartItemId);

  useEffect(() => {
    setSelectedImage(0);
  }, [activity?.id]);

  useEffect(() => {
    if (activity?.packages.length) {
      const availableIds = new Set(activity.packages.map((pkg) => pkg.id));
      const cheapestPackage = activity.packages.reduce<{
        id: string | null;
        price: number;
      }>(
        (best, pkg) => {
          const price = pkg.adultPrice ?? pkg.price ?? Number.POSITIVE_INFINITY;
          if (price < best.price) {
            return { id: pkg.id, price };
          }
          return best;
        },
        { id: activity.packages[0]?.id ?? null, price: Number.POSITIVE_INFINITY },
      );

      setSelectedPackageId((prev) => {
        if (prev && availableIds.has(prev)) {
          return prev;
        }
        return cheapestPackage.id;
      });
    } else {
      setSelectedPackageId(null);
    }
  }, [activity?.packages]);

  // Tự động chọn lịch trình đầu tiên khi có dữ liệu
  useEffect(() => {
    if (scheduleIdParam) return;
    if (Array.isArray(tourDetail?.schedules) && tourDetail.schedules.length > 0) {
      const firstAvailableScheduleId = String(tourDetail.schedules[0]?.id ?? "");
      setSelectedScheduleId(firstAvailableScheduleId);
    } else {
      setSelectedScheduleId(null);
    }
  }, [scheduleIdParam, tourDetail?.schedules]);

  useEffect(() => {
    if (!tabFromQuery) return;
    const normalizedTab = tabFromQuery.toLowerCase();
    if (!VALID_TAB_SET.has(normalizedTab)) return;
    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
      if (normalizedTab === "packages") {
        tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [tabFromQuery, activeTab]);

  const selectedPackage = useMemo(
    () => activity?.packages.find((pkg) => pkg.id === selectedPackageId) ?? activity?.packages[0],
    [activity?.packages, selectedPackageId],
  );

  const adultUnitPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    const rawAdultPrice = selectedPackage.adultPrice ?? selectedPackage.price ?? null;
    if (typeof rawAdultPrice === "number" && Number.isFinite(rawAdultPrice)) {
      return Math.max(0, rawAdultPrice);
    }
    return 0;
  }, [selectedPackage]);

  const childUnitPrice = useMemo(() => {
    if (adultUnitPrice <= 0) return 0;
    const computed = Math.round(adultUnitPrice * CHILD_PRICE_RATIO);
    return Math.max(0, computed);
  }, [adultUnitPrice]);
  const { mutate: addToWishlist, isPending: isAddingWishlist } = addWishlistMutation;
  const { mutate: removeFromWishlist, isPending: isRemovingWishlist } = removeWishlistMutation;
  const isWishlistMutating = isAddingWishlist || isRemovingWishlist;

  const handleWishlistToggle = useCallback(() => {
    if (!activity?.id) {
      toast({
        title: "Không thể lưu tour",
        description: "Thông tin tour chưa sẵn sàng. Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm tour vào danh sách yêu thích.",
        variant: "destructive",
      });
      return;
    }

    if (isWishlistMutating) return;

    if (isWishlisted) {
      const cached = queryClient.getQueryData<WishlistItem[]>(wishlistQueryKey) ?? [];
      const targetId =
        wishlistItemId ?? cached.find((entry) => String(entry.tour_id) === String(activity.id))?.id ?? null;
      if (!targetId) {
        toast({
          title: "Không thể xoá khỏi wishlist",
          description: "Không tìm thấy tour trong danh sách yêu thích. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }
      removeFromWishlist(targetId);
      return;
    }

    addToWishlist(String(activity.id));
  }, [
    activity?.id,
    addToWishlist,
    currentUser,
    isWishlisted,
    isWishlistMutating,
    queryClient,
    removeFromWishlist,
    toast,
    wishlistItemId,
    wishlistQueryKey,
  ]);

  const formatPriceLabel = (value: number) => {
    if (value <= 0) return "Liên hệ";
    return `₫ ${value.toLocaleString("vi-VN")}`;
  };

  const displayPrice = useMemo(() => {
    const candidates: number[] = [];
    if (adultUnitPrice > 0) {
      candidates.push(adultUnitPrice);
    }
    if (activity) {
      const packageCandidates = activity.packages
        .map((pkg) => {
          const candidate =
            pkg.adultPrice ?? pkg.price ?? (typeof pkg.childPrice === "number" ? pkg.childPrice : null);
          return typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0
            ? candidate
            : null;
        })
        .filter((value): value is number => value !== null);
      if (packageCandidates.length > 0) {
        candidates.push(Math.min(...packageCandidates));
      }
      if (typeof activity.price === "number" && Number.isFinite(activity.price) && activity.price > 0) {
        candidates.push(activity.price);
      }
    }
    if (candidates.length === 0) return null;
    return Math.min(...candidates);
  }, [activity, adultUnitPrice]);

  const showOriginalPrice =
    typeof activity?.originalPrice === "number" &&
    displayPrice !== null &&
    activity.originalPrice > displayPrice;

  const priceBadgeLabel = useMemo(() => {
    if (typeof activity?.discount === "number" && activity.discount > 0) {
      return `Giảm ${activity.discount}%`;
    }
    if (activity?.promotionLabel) {
      return activity.promotionLabel;
    }
    return null;
  }, [activity?.discount, activity?.promotionLabel]);

  const savingsAmount =
    showOriginalPrice && displayPrice !== null && typeof activity?.originalPrice === "number"
      ? activity.originalPrice - displayPrice
      : null;

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    if (searchParams.get(TAB_QUERY_KEY) === nextTab) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(TAB_QUERY_KEY, nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectPackageClick = () => {
    handleTabChange("packages");
    tabsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

  const safeAdultCount = useMemo(() => Math.max(1, Math.min(MAX_TRAVELLERS, adultCount)), [adultCount]);
  const safeChildCount = useMemo(
    () => Math.max(0, Math.min(MAX_TRAVELLERS - safeAdultCount, childCount)),
    [childCount, safeAdultCount],
  );
  useEffect(() => {
    if (safeAdultCount !== adultCount) setAdultCount(safeAdultCount);
  }, [adultCount, safeAdultCount]);
  useEffect(() => {
    if (safeChildCount !== childCount) setChildCount(safeChildCount);
  }, [childCount, safeChildCount]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return null;
    return safeAdultCount * adultUnitPrice + safeChildCount * childUnitPrice;
  }, [selectedPackage, safeAdultCount, safeChildCount, adultUnitPrice, childUnitPrice]);

  const totalTravellers = safeAdultCount + safeChildCount;
  const meetsMinimumParticipants =
    selectedScheduleMinParticipants === null || totalTravellers >= selectedScheduleMinParticipants;
  const exceedsAvailableSeats =
    seatsAvailability !== null && Number.isFinite(seatsAvailability) && totalTravellers > seatsAvailability;


  const incrementAdults = () => setAdultCount((prev) => Math.min(MAX_TRAVELLERS, prev + 1));
  const decrementAdults = () => setAdultCount((prev) => Math.max(1, prev - 1));
  const incrementChildren = () =>
    setChildCount((prev) => Math.min(MAX_TRAVELLERS - safeAdultCount, prev + 1));
  const decrementChildren = () => setChildCount((prev) => Math.max(0, prev - 1));

  const handleAddToCart = async () => {
    if (!activity || !selectedPackage) {
      toast({
        title: "Chưa thể thêm vào giỏ",
        description: "Vui lòng chọn gói dịch vụ phù hợp trước khi thêm vào giỏ hàng.",
        variant: "destructive",
      });
      return;
    }
    if (schedules.length > 0 && !selectedScheduleId) {
      toast({
        title: "Chưa chọn lịch khởi hành",
        description: "Bạn cần chọn lịch khởi hành cụ thể trước khi thêm vào giỏ hàng.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm dịch vụ vào giỏ hàng.",
        variant: "destructive",
      });
      return;
    }

    if (selectedScheduleMinParticipants !== null && totalTravellers < selectedScheduleMinParticipants) {
      toast({
        title: "Chưa đủ số khách tối thiểu",
        description: `Lịch khởi hành này yêu cầu tối thiểu ${selectedScheduleMinParticipants} khách.`,
        variant: "destructive",
      });
      return;
    }
    if (exceedsAvailableSeats && seatsAvailability !== null) {
      toast({
        title: "Vượt quá số chỗ còn lại",
        description: `Lịch khởi hành này hiện chỉ còn ${seatsAvailability} chỗ trống.`,
        variant: "destructive",
      });
      return;
    }

    const scheduleTitle =
      selectedSchedule?.title ??
      (selectedSchedule?.start_date
        ? new Date(selectedSchedule.start_date).toLocaleDateString("vi-VN")
        : undefined);

    const computedTotal =
      totalPrice !== null
        ? totalPrice
        : safeAdultCount * adultUnitPrice + safeChildCount * childUnitPrice;
    const perAdultOriginal =
      typeof selectedPackage.originalPrice === "number" && selectedPackage.originalPrice > 0
        ? selectedPackage.originalPrice
        : adultUnitPrice;
    const perChildOriginal =
      typeof selectedPackage.childPrice === "number" && selectedPackage.childPrice > 0
        ? selectedPackage.childPrice
        : childUnitPrice;
    const rawOriginalTotal = perAdultOriginal * safeAdultCount + perChildOriginal * safeChildCount;
    const originalTotalPrice =
      rawOriginalTotal > computedTotal ? Math.round(rawOriginalTotal) : null;

    try {
      await addItem({
        tourId: activity.id,
        tourTitle: activity.title,
        packageId: selectedPackage.packageId ?? selectedPackage.id,
        packageName: selectedPackage.name,
        scheduleId: selectedScheduleId ?? undefined,
        scheduleTitle,
        thumbnail: activity.images[0] ?? null,
        minParticipants: selectedScheduleMinParticipants ?? undefined,
        slotsAvailable: seatsAvailability ?? undefined,
        seatsTotal: seatsCapacity ?? undefined,
        adultCount: safeAdultCount,
        childCount: safeChildCount,
        adultPrice: adultUnitPrice,
        childPrice: childUnitPrice,
        originalTotalPrice,
        promotionLabel: priceBadgeLabel ?? null,
      });

      toast({
        title: isEditingCartItem ? "Giỏ hàng đã được cập nhật" : "Đã thêm vào giỏ hàng",
        description: isEditingCartItem
          ? "Chúng tôi đã cập nhật gói dịch vụ trong giỏ hàng của bạn."
          : "Bạn có thể xem lại các hoạt động trong giỏ hàng để đặt sau.",
      });

      if (resolvedTourEntityId) {
        trackEvent(
          {
            event_name: "cart_add",
            entity_type: "tour",
            entity_id: resolvedTourEntityId,
            metadata: {
              source: isEditingCartItem ? "cart_detail" : "activity_detail",
              package_id: selectedPackage.packageId ?? selectedPackage.id,
              schedule_id: selectedScheduleId ?? undefined,
              adults: safeAdultCount,
              children: safeChildCount,
            },
          },
          { immediate: true },
        );
        scheduleRecommendationRefresh();
      }

      if (isEditingCartItem) {
        navigate("/cart");
      }
    } catch (error) {
      const description =
        error instanceof Error && error.message
          ? error.message
          : "Không thể thêm dịch vụ vào giỏ hàng. Vui lòng thử lại.";
      toast({
        title: "Thao tác không thành công",
        description,
        variant: "destructive",
      });
    }
  };

  const handleBookNow = () => {
    if (!activity || !selectedPackage) return;
    if (selectedScheduleMinParticipants !== null && totalTravellers < selectedScheduleMinParticipants) {
      toast({
        title: "Chưa đủ số khách tối thiểu",
        description: `Lịch khởi hành này yêu cầu tối thiểu ${selectedScheduleMinParticipants} khách.`,
        variant: "destructive",
      });
      return;
    }
    if (exceedsAvailableSeats && seatsAvailability !== null) {
      toast({
        title: "Vượt quá số chỗ còn lại",
        description: `Lịch khởi hành này hiện chỉ còn ${seatsAvailability} chỗ trống.`,
        variant: "destructive",
      });
      return;
    }
    const params = new URLSearchParams({
      tourId: activity.id,
      packageId: selectedPackage.packageId ?? selectedPackage.id,
      adults: String(safeAdultCount),
      children: String(safeChildCount),
    });
    if (selectedScheduleId) {
      params.set("scheduleId", selectedScheduleId);
    }
    navigate(`/bookings/new?${params.toString()}`);
  };

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <TravelHeader />
        <main className="container mx-auto flex-grow px-4 py-6">
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
      <div className="flex min-h-screen flex-col bg-background">
        <TravelHeader />
        <main className="container mx-auto flex-grow px-4 py-6">
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
      <div className="flex min-h-screen flex-col bg-background">
        <TravelHeader />
        <main className="container mx-auto flex-grow px-4 py-6">
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
  const hasReviews = combinedReviews.length > 0;
  const hasLocation = Boolean(activity.location?.name || activity.location?.address);
  const locationCoords = activity.location?.coordinates ?? null;
  const locationNameCandidate =
    activity.location?.name ??
    activity.locationName ??
    tourDetail?.destination ??
    activity.partner?.companyName ??
    "";
  const hasRelated = activity.relatedActivities.length > 0;
  const bookedCount = typeof activity.bookedCount === "number" ? activity.bookedCount : null;
  const durationLabel = activity.duration ? String(activity.duration) : null;
  const breadcrumbLocation = activity.locationName ?? "Chi tiết tour";
  const itineraryItems = activity.itinerary ?? [];
  const policySummary = activity.policySummary;
  const hasPolicySummary = policySummary.length > 0;
  const partner = activity.partner;
  const serviceHighlights = (() => {
    if (policySummary.length > 0) {
      return policySummary.slice(0, 3);
    }
    if (hasPackages) {
      const includeHighlights = activity.packages
        .flatMap((pkg) => pkg.includes)
        .filter((item): item is string => Boolean(item?.trim()));
      if (includeHighlights.length > 0) {
        return includeHighlights.slice(0, 3);
      }
    }
    return ["Hủy miễn phí 24 giờ", "Xác nhận trong 24 giờ", "Nhóm nhỏ linh hoạt"];
  })();

  const serviceTimeline = (() => {
    if (!Array.isArray(itineraryItems) || itineraryItems.length === 0) {
      return [];
    }

    return itineraryItems.map((entry, index) => {
      if (typeof entry === "string") {
        const text = entry.trim();
        return {
          time: null,
          title: text.length > 0 ? text : `Hoạt động ${index + 1}`,
          description: undefined,
        };
      }
      if (entry && typeof entry === "object") {
        const time =
          typeof entry.time === "string" && entry.time.trim().length > 0
            ? entry.time.trim()
            : null;
        const title =
          typeof entry.title === "string" && entry.title.trim().length > 0
            ? entry.title.trim()
            : `Hoạt động ${index + 1}`;
        const description =
          typeof entry.description === "string" && entry.description.trim().length > 0
            ? entry.description.trim()
            : undefined;
        return { time, title, description };
      }
      return {
        time: null,
        title: `Hoạt động ${index + 1}`,
        description: undefined,
      };
    });
  })();

  const hasServiceTimeline = serviceTimeline.length > 0;
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
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex-grow px-4 py-6">
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
          {/* CỘT NỘI DUNG BÊN TRÁI */}
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
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-pressed={isWishlisted}
                    aria-label={isWishlisted ? "Bỏ yêu thích tour" : "Thêm tour vào yêu thích"}
                    disabled={isWishlistMutating}
                    onClick={handleWishlistToggle}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
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

            <Tabs value={activeTab} onValueChange={handleTabChange} ref={tabsRef} className="w-full">
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
                        {itineraryItems.slice(0, 5).map((item, index) => (
                           <li key={index}>{typeof item === 'string' ? item : item.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 grid gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Yêu cầu khi tham gia</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span>Loại tour</span>
                        <span className="font-medium text-foreground">
                          {tourTypeDisplay ?? "Đang cập nhật"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span>Độ tuổi trẻ em</span>
                        <span className="font-medium text-foreground">
                          {childAgeLimitLabel}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span>Giấy tờ cần chuẩn bị</span>
                        <span className="font-medium text-foreground">
                          {documentRequirementLabel}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span>Chính sách hủy</span>
                        <span className="font-medium text-foreground">
                          {cancellationSummaryLabel}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  {activity.cancellationPolicies && activity.cancellationPolicies.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Chi tiết chính sách hủy</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                          Hoàn tiền dựa trên thời gian hủy trước ngày khởi hành. Vui lòng tham khảo bảng
                          dưới đây để biết mức hoàn cụ thể.
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full min-w-[420px] border-collapse text-left">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="px-4 py-2 font-medium">Thời gian hủy</th>
                                <th className="px-4 py-2 font-medium">Tỷ lệ hoàn</th>
                                <th className="px-4 py-2 font-medium">Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {activity.cancellationPolicies.map((policy, index) => (
                                <tr key={`${policy.days_before ?? "policy"}-${index}`} className="bg-white">
                                  <td className="px-4 py-2">
                                    {formatCancellationWindow(parseIntOrNull(policy.days_before ?? undefined))}
                                  </td>
                                  <td className="px-4 py-2">
                                    {formatRefundRate(parseFloatOrNull(policy.refund_rate ?? undefined))}
                                  </td>
                                  <td className="px-4 py-2 text-slate-600">
                                    {policy.description ? policy.description : "Không có mô tả"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="packages" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    {hasPackages ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                           <h3 className="text-lg font-semibold text-foreground">Vui lòng chọn gói dịch vụ</h3>
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
                                   variant={selectedPackageId === pkg.id ? "default" : "outline"}
                                   onClick={() => setSelectedPackageId(pkg.id)}
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

                        {/* ==================================================================================== */}
                        {/* THAY THẾ LỊCH BẰNG DROPDOWN */}
                        {/* ==================================================================================== */}
                        {schedules.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-muted-foreground">Chọn ngày khởi hành</p>
                              <Select
                                value={selectedScheduleId ?? ""}
                                onValueChange={setSelectedScheduleId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn một lịch trình có sẵn" />
                                </SelectTrigger>
                                <SelectContent>
                                  {schedules.map((schedule) => {
                                    if (!schedule?.id) return null;
                                    const date = formatDate(schedule.start_date);
                                    const availabilityValue = parseScheduleNumber(
                                      schedule?.slots_available,
                                      (schedule as Record<string, unknown>)?.slots_available,
                                      (schedule as Record<string, unknown>)?.slotsAvailable,
                                      (schedule as Record<string, unknown>)?.seats_available,
                                    );
                                    const seatsValue = parseScheduleNumber(
                                      schedule?.seats_total,
                                      (schedule as Record<string, unknown>)?.seats_total,
                                      (schedule as Record<string, unknown>)?.seatsTotal,
                                      (schedule as Record<string, unknown>)?.capacity,
                                    );
                                    const minValue = parseScheduleNumber(
                                      schedule?.min_participants,
                                      (schedule as Record<string, unknown>)?.min_participants,
                                      (schedule as Record<string, unknown>)?.minParticipants,
                                    );
                                    const tokens = [
                                      schedule.title,
                                      date ? `- ${date}` : null,
                                      typeof availabilityValue === "number"
                                        ? typeof seatsValue === "number"
                                          ? `• Còn ${Math.max(0, Math.trunc(availabilityValue))}/${Math.max(
                                              0,
                                              Math.trunc(seatsValue),
                                            )} chỗ`
                                          : `• Còn ${Math.max(0, Math.trunc(availabilityValue))} chỗ`
                                        : null,
                                      typeof minValue === "number"
                                        ? `• Tối thiểu ${Math.max(1, Math.trunc(minValue))} khách`
                                        : null,
                                    ].filter(Boolean);
                                    return (
                                      <SelectItem key={schedule.id} value={String(schedule.id)}>
                                        {tokens.join(" ")}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        {selectedSchedule && (
                          <div className="grid gap-2 py-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                                Số khách tối thiểu
                              </p>
                              <p className="text-sm font-semibold text-foreground">
                                {selectedScheduleMinParticipants !== null
                                  ? `${selectedScheduleMinParticipants} khách`
                                  : "Đang cập nhật"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                                Số chỗ còn lại
                              </p>
                              <p className="text-sm font-semibold text-foreground">
                                {seatsAvailability !== null
                                  ? seatsCapacity !== null
                                    ? `${Math.max(0, seatsAvailability)}/${Math.max(0, seatsCapacity)} chỗ`
                                    : `${Math.max(0, seatsAvailability)} chỗ`
                                  : seatsCapacity !== null
                                  ? `Sức chứa ${Math.max(0, seatsCapacity)} chỗ`
                                  : "Đang cập nhật"}
                              </p>
                            </div>
                          </div>
                        )}
                        {!meetsMinimumParticipants && selectedScheduleMinParticipants !== null && (
                          <Alert variant="destructive" className="border-dashed border-destructive/40 bg-destructive/5">
                            <AlertTitle className="text-sm font-semibold">Chưa đủ số khách tối thiểu</AlertTitle>
                            <AlertDescription className="text-sm">
                              Lịch khởi hành này yêu cầu ít nhất {selectedScheduleMinParticipants} khách. Vui lòng tăng số
                              lượng hành khách trước khi tiếp tục.
                            </AlertDescription>
                          </Alert>
                        )}
                        {exceedsAvailableSeats && seatsAvailability !== null && (
                          <Alert className="border-dashed border-amber-300 bg-amber-50">
                            <AlertTitle className="text-sm font-semibold text-amber-700">
                              Vượt quá số chỗ còn lại
                            </AlertTitle>
                            <AlertDescription className="text-sm text-amber-800">
                              Hiện chỉ còn {seatsAvailability} chỗ cho lịch khởi hành này. Vui lòng giảm số lượng hoặc
                              chọn lịch khác.
                            </AlertDescription>
                          </Alert>
                        )}
                        <Separator />

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Số lượng hành khách</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div>
                                  <p className="font-medium text-foreground">Người lớn</p>
                                  <p className="text-xs text-muted-foreground">Từ 12 tuổi trở lên</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                                  <span className="min-w-[90px] text-right font-semibold text-foreground">
                                    {formatPriceLabel(adultUnitPrice)}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={decrementAdults}>
                                      -
                                    </Button>
                                    <span className="w-6 text-center text-base font-semibold text-foreground">
                                      {safeAdultCount}
                                    </span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={incrementAdults}>
                                      +
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div>
                                  <p className="font-medium text-foreground">Trẻ em</p>
                                  <p className="text-xs text-muted-foreground">Từ 2 đến 11 tuổi</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                                  <span className="min-w-[90px] text-right font-semibold text-foreground">
                                    {formatPriceLabel(childUnitPrice)}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={decrementChildren}>
                                      -
                                    </Button>
                                    <span className="w-6 text-center text-base font-semibold text-foreground">
                                      {safeChildCount}
                                    </span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={incrementChildren}>
                                      +
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                        <Separator />

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Tạm tính</p>
                          {totalPrice !== null ? (
                            <p className="text-3xl font-bold text-foreground">
                              ₫ {totalPrice.toLocaleString("vi-VN")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Liên hệ để nhận báo giá chi tiết cho gói dịch vụ này.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              variant="outline"
                              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                              size="lg"
                              onClick={handleAddToCart}
                              disabled={!selectedPackage || !meetsMinimumParticipants || exceedsAvailableSeats}
                            >
                              {isEditingCartItem ? "Xác nhận" : "Thêm vào giỏ hàng"}
                            </Button>
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600"
                              size="lg"
                              onClick={handleBookNow}
                              disabled={!selectedPackage || !meetsMinimumParticipants || exceedsAvailableSeats}
                            >
                              Đặt ngay
                            </Button>
                          </div>
                          <p className="text-center text-xs text-muted-foreground">
                            Bạn sẽ được chuyển tới trang điền thông tin hành khách và thanh toán.
                          </p>
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
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-5xl font-bold text-foreground">
                        {ratingValue !== null ? ratingValue.toFixed(1) : "—"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const isFilled = ratingValue !== null && index < Math.round(ratingValue);
                            return (
                              <Star
                                key={index}
                                className={`h-4 w-4 ${isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            );
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reviewCount !== null
                            ? `${reviewCount.toLocaleString()} đánh giá`
                            : "Chưa có đánh giá"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="border border-primary/20 bg-primary/5">
                    <AlertTitle className="font-semibold text-foreground">Cách gửi đánh giá</AlertTitle>
                    <AlertDescription className="text-sm text-muted-foreground">
                      Sau khi hoàn thành tour, hãy vào mục <strong>Đơn của tôi</strong> để chia sẻ cảm nhận.
                      Đánh giá chỉ áp dụng cho các booking đã hoàn tất và thuộc về bạn.
                    </AlertDescription>
                  </Alert>

                  {isReviewsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : hasReviews ? (
                    <div className="space-y-4">
                      {combinedReviews.map((review) => {
                        const value = parseFloatOrNull(review.rating ?? undefined) ?? 0;
                        const displayDate = formatDate(review.created_at ?? review.updated_at ?? null);
                        const isOwner =
                          Boolean(currentUser) &&
                          review.user?.id !== undefined &&
                          String(review.user.id) === String(currentUser?.id);
                        return (
                          <Card key={review.id}>
                            <CardContent className="p-6 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {review.user?.name ?? "Ẩn danh"}
                                  </p>
                                  {displayDate && (
                                    <p className="text-xs text-muted-foreground">{displayDate}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, starIndex) => {
                                    const filled = starIndex < Math.round(value);
                                    return (
                                      <Star
                                        key={starIndex}
                                        className={`h-4 w-4 ${
                                          filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                        }`}
                                      />
                                    );
                                  })}
                                  <span className="ml-2 text-sm font-medium text-foreground">
                                    {value.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line ">
                                {review.comment && review.comment.trim().length > 0
                                  ? review.comment
                                  : "Người dùng không để lại nội dung."}
                              </p>
                              {(review.booking?.code || review.tour_schedule?.start_date) && (
                                <div className="text-xs text-muted-foreground">
                                  {review.booking?.code && <span>Mã booking: {review.booking.code}</span>}
                                  {review.tour_schedule?.start_date && (
                                    <span className="ml-2">
                                      Khởi hành {formatDate(review.tour_schedule.start_date)}
                                    </span>
                                  )}
                                </div>
                              )}
                              {isOwner && <Badge variant="secondary">Đánh giá của bạn</Badge>}
                            </CardContent>
                          </Card>
                        );
                      })}
                      {hasNextPage && (
                        <div className="flex justify-center pt-2">
                          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                            {isFetchingNextPage ? "Đang tải..." : "Xem thêm đánh giá"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có đánh giá cho tour này. Sau khi hoàn thành tour, hãy truy cập mục <strong>Đơn của tôi</strong> để gửi cảm nhận đầu tiên.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <SimilarTourRecommendations
              tourId={tourDetail?.id ?? tourDetail?.uuid ?? activity?.id ?? null}
              baseTourTitle={activity?.title}
              limit={6}
            />

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
                    <div className="space-y-1">
                      {showOriginalPrice && (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-base text-muted-foreground line-through">
                            ₫ {activity?.originalPrice?.toLocaleString("vi-VN")}
                          </span>
                          {priceBadgeLabel && (
                            <Badge variant="destructive" className="text-xs font-semibold uppercase">
                              {priceBadgeLabel}
                            </Badge>
                          )}
                        </div>
                      )}
                      {displayPrice !== null ? (
                        <div className="flex items-end gap-2">
                          <span className="text-sm text-muted-foreground">Chỉ từ</span>
                          <span className="text-3xl font-bold text-primary">
                            ₫ {displayPrice.toLocaleString("vi-VN")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Giá sẽ được cập nhật trong thời gian sớm nhất.
                        </span>
                      )}
                      {savingsAmount !== null && savingsAmount > 0 && (
                        <p className="text-xs font-medium text-emerald-600">
                          Tiết kiệm ₫ {savingsAmount.toLocaleString("vi-VN")} so với giá gốc
                        </p>
                      )}
                    </div>
                      <Button
                        onClick={handleSelectPackageClick}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base py-6"
                      >
                        Chọn các gói dịch vụ
                      </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Chi tiết gói dịch vụ</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật nhanh về những gì bạn sẽ trải nghiệm
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={handleSelectPackageClick}
                    aria-label="Xem chi tiết gói dịch vụ"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {serviceHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serviceHighlights.map((feature, index) => (
                        <Badge
                          key={`${feature}-${index}`}
                          variant="outline"
                          className="rounded-full border-dashed px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">Lịch trình</h4>
                      {hasServiceTimeline && (
                        <span className="text-xs text-muted-foreground">
                          {serviceTimeline.length} điểm dừng
                        </span>
                      )}
                    </div>

                    {hasServiceTimeline ? (
                      <div className="relative pl-5">
                        <div className="absolute left-[6px] top-2 bottom-4 w-0.5 bg-border" />
                        {serviceTimeline.map((item, index) => (
                          <div key={`${item.title}-${index}`} className="relative pb-6 last:pb-0">
                            <span className="absolute left-[-7px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm" />
                            <div className="ml-4 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.time && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    <Clock className="h-3.5 w-3.5" />
                                    {item.time}
                                  </span>
                                )}
                                <span className="font-medium text-sm text-foreground">{item.title}</span>
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Lịch trình chi tiết sẽ được cập nhật sớm. Vui lòng xem thêm trong mục gói dịch vụ.
                      </p>
                    )}
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
                    Đội ngũ của chúng tôi luôn sẵn sàng giúp bạn lên kế hoạch và giải đáp mọi thắc mắc.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Hotline: 1900 636 789</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="break-all">support@example.com</span>
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
        <div className="flex h-[90vh] flex-col overflow-hidden rounded-lg  text-white">
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

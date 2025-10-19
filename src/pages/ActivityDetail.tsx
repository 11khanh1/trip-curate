import { useEffect, useMemo, useState, useRef, useCallback, FormEvent } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchTourDetail, fetchTrendingTours, type PublicTour, type PublicTourSchedule } from "@/services/publicApi";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import {
  createReview,
  deleteReview,
  fetchTourReviews,
  type TourReview,
  type TourReviewListResponse,
  updateReview,
} from "@/services/reviewApi";
import {
  fetchBookings,
  type Booking,
  type BookingListResponse,
  type BookingReviewSummary,
} from "@/services/bookingApi";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


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
  itinerary?: Array<string | { title?: string; description?: string; time?: string }>;
  policySummary: string[];
  partner?: {
    companyName?: string;
    contactName?: string;
    email?: string | null;
    phone?: string | null;
  };
}

type EditableReview = Pick<TourReview, "id" | "rating" | "comment">;

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
    rating: tour.rating_average ?? tour.average_rating ?? 4.5,
    reviewCount: tour.rating_count ?? tour.reviews_count ?? 0,
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

  const packages: ActivityPackage[] =
    Array.isArray(tour.packages) && tour.packages.length > 0
      ? tour.packages.map((pkg, index) => ({
          id: String(pkg?.id ?? `${id}-package-${index}`),
          packageId: String(pkg?.id ?? `${id}-package-${index}`),
          name: pkg?.name ?? `Gói dịch vụ ${index + 1}`,
          price: pkg?.adult_price ?? pkg?.child_price ?? tour.base_price ?? null,
          originalPrice: tour.season_price ?? null,
          adultPrice: pkg?.adult_price ?? null,
          childPrice: pkg?.child_price ?? null,
          isActive: pkg?.is_active ?? true,
          includes: [],
          startDate: null,
          endDate: null,
          capacity: null,
          slotsAvailable: null,
        }))
      : Array.isArray(tour.schedules)
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
    rating: tour.rating_average ?? tour.average_rating ?? null,
    reviewCount: tour.rating_count ?? tour.reviews_count ?? null,
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
    itinerary: tour.itinerary,
    policySummary,
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
  const queryClient = useQueryClient();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [editingReview, setEditingReview] = useState<EditableReview | null>(null);

  const resetReviewForm = useCallback(() => {
    setSelectedBookingId("");
    setReviewRating(5);
    setReviewComment("");
    setEditingReview(null);
  }, []);

  const closeReviewDialog = useCallback(() => {
    setIsReviewDialogOpen(false);
    resetReviewForm();
  }, [resetReviewForm]);

  const invalidateReviewData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tour-reviews", id] });
    queryClient.invalidateQueries({ queryKey: ["user-bookings", "completed", currentUser?.id] });
  }, [queryClient, id, currentUser?.id]);

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: (response) => {
      toast({
        title: "Đánh giá đã được ghi nhận",
        description: response?.message ?? "Cảm ơn bạn đã chia sẻ trải nghiệm.",
      });
      invalidateReviewData();
      closeReviewDialog();
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể gửi đánh giá",
        description: resolveErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: (input: { reviewId: string | number; payload: { rating?: number; comment?: string } }) =>
      updateReview(input.reviewId, input.payload),
    onSuccess: (response) => {
      toast({
        title: "Đánh giá đã được cập nhật",
        description: response?.message ?? "Chúng tôi đã ghi nhận thay đổi của bạn.",
      });
      invalidateReviewData();
      closeReviewDialog();
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể cập nhật đánh giá",
        description: resolveErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string | number) => deleteReview(reviewId),
    onSuccess: (response) => {
      toast({
        title: "Đã xóa đánh giá",
        description: response?.message ?? "Đánh giá của bạn đã được gỡ bỏ.",
      });
      invalidateReviewData();
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể xóa đánh giá",
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

  const { data: completedBookingsData } = useQuery<BookingListResponse>({
    queryKey: ["user-bookings", "completed", currentUser?.id],
    queryFn: () => fetchBookings({ status: "completed", per_page: 50 }),
    enabled: Boolean(currentUser),
    staleTime: 60 * 1000,
  });

  const activity = useMemo(
    () => normalizeTourDetail(tourDetail, trendingTours ?? []),
    [tourDetail, trendingTours],
  );
  const schedules = tourDetail?.schedules ?? [];

  const bookingsForTour = useMemo(() => {
    if (!completedBookingsData?.data || acceptableTourIds.length === 0) return [];
    return completedBookingsData.data.filter((booking) => {
      const identifiers: Array<string | number | null | undefined> = [
        booking.tour?.id,
        booking.tour?.uuid,
        (booking as Record<string, unknown>)?.tour_id as string | number | undefined,
      ];
      return identifiers.some(
        (value) => value !== undefined && value !== null && acceptableTourIds.includes(String(value)),
      );
    });
  }, [completedBookingsData?.data, acceptableTourIds]);

  const reviewableBookings = useMemo(
    () => bookingsForTour.filter((booking) => !booking.review),
    [bookingsForTour],
  );

  const existingReviewEntry = useMemo(
    () => bookingsForTour.find((booking) => Boolean(booking.review)),
    [bookingsForTour],
  );

  const existingReview: BookingReviewSummary | null = existingReviewEntry?.review ?? null;
  const existingReviewBookingId = existingReviewEntry ? String(existingReviewEntry.id) : null;

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

  const allReviews = useMemo(
    () => reviewsData?.pages?.flatMap((page) => page.reviews?.data ?? []) ?? [],
    [reviewsData?.pages],
  );

  const ratingSummary = useMemo(() => {
    if (!reviewsData?.pages || reviewsData.pages.length === 0) return null;
    const pageWithRating = reviewsData.pages.find((page) => page?.rating);
    return pageWithRating?.rating ?? reviewsData.pages[0]?.rating ?? null;
  }, [reviewsData?.pages]);

  const ratingAverage =
    parseFloatOrNull(ratingSummary?.average ?? undefined) ??
    (typeof activity?.rating === "number" ? activity.rating : null);

  const ratingCount =
    parseIntOrNull(ratingSummary?.count ?? undefined) ??
    (typeof activity?.reviewCount === "number" ? activity.reviewCount : null);

  const isMutationPending = (mutation: { isPending?: boolean; isLoading?: boolean }) =>
    Boolean(mutation.isPending ?? mutation.isLoading ?? false);

  const isSubmittingReview = isMutationPending(createReviewMutation) || isMutationPending(updateReviewMutation);
  const isDeletingReview = isMutationPending(deleteReviewMutation);

  const openCreateReview = useCallback(() => {
    if (!currentUser) {
      toast({
        title: "Đăng nhập để đánh giá",
        description: "Vui lòng đăng nhập để chia sẻ trải nghiệm của bạn.",
        variant: "destructive",
      });
      return;
    }
    if (reviewableBookings.length === 0) {
      toast({
        title: "Chưa có booking phù hợp",
        description: "Bạn chỉ có thể đánh giá sau khi hoàn thành tour và chưa gửi đánh giá trước đó.",
      });
      return;
    }
    const defaultBookingId = String(reviewableBookings[0]?.id ?? "");
    setSelectedBookingId(defaultBookingId);
    setReviewRating(5);
    setReviewComment("");
    setEditingReview(null);
    setIsReviewDialogOpen(true);
  }, [currentUser, reviewableBookings, toast]);

  const openEditReview = useCallback(() => {
    if (!existingReview?.id) {
      toast({
        title: "Không tìm thấy đánh giá",
        description: "Không thể chỉnh sửa vì thiếu mã đánh giá hợp lệ.",
        variant: "destructive",
      });
      return;
    }
    const parsedRating = parseFloatOrNull(existingReview.rating ?? undefined) ?? 5;
    const normalizedRating = Math.min(5, Math.max(1, parsedRating));
    setReviewRating(normalizedRating);
    setReviewComment(existingReview.comment ?? "");
    setEditingReview({
      id: existingReview.id,
      rating: existingReview.rating,
      comment: existingReview.comment ?? "",
    });
    setSelectedBookingId(existingReviewBookingId ?? "");
    setIsReviewDialogOpen(true);
  }, [existingReview, existingReviewBookingId, toast]);

  const handleDeleteReview = useCallback(() => {
    if (!existingReview) return;
    if (isDeletingReview) return;
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?");
    if (!confirmed) return;
    deleteReviewMutation.mutate(existingReview.id);
  }, [deleteReviewMutation, existingReview, isDeletingReview]);

  const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRating = Math.min(5, Math.max(1, reviewRating));
    const sanitizedComment = reviewComment.trim();
    if (editingReview) {
      updateReviewMutation.mutate({
        reviewId: editingReview.id,
        payload: {
          rating: normalizedRating,
          comment: sanitizedComment.length > 0 ? sanitizedComment : undefined,
        },
      });
      return;
    }
    if (!selectedBookingId) {
      toast({
        title: "Chọn booking để đánh giá",
        description: "Vui lòng chọn booking đã hoàn thành để gửi đánh giá.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate({
      booking_id: selectedBookingId,
      rating: normalizedRating,
      comment: sanitizedComment.length > 0 ? sanitizedComment : undefined,
    });
  };
  
  const selectedSchedule = useMemo(
    () =>
      schedules.find((schedule) => String(schedule?.id) === selectedScheduleId) ??
      (schedules.length > 0 ? schedules[0] : null),
    [schedules, selectedScheduleId],
  );

  useEffect(() => {
    setSelectedImage(0);
  }, [activity?.id]);

  useEffect(() => {
    if (activity?.packages.length) {
      const fallback = activity.packages[0]?.id ?? null;
      const availableIds = new Set(activity.packages.map((pkg) => pkg.id));
      setSelectedPackageId((prev) => (prev && availableIds.has(prev) ? prev : fallback));
    } else {
      setSelectedPackageId(null);
    }
  }, [activity?.packages]);

  // Tự động chọn lịch trình đầu tiên khi có dữ liệu
  useEffect(() => {
    if (Array.isArray(tourDetail?.schedules) && tourDetail.schedules.length > 0) {
      const firstAvailableScheduleId = String(tourDetail.schedules[0]?.id ?? "");
      setSelectedScheduleId(firstAvailableScheduleId);
    } else {
      setSelectedScheduleId(null);
    }
  }, [tourDetail?.schedules]);

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

  const formatPriceLabel = (value: number) => {
    if (value <= 0) return "Liên hệ";
    return `₫ ${value.toLocaleString("vi-VN")}`;
  };

  const displayPrice = useMemo(() => {
    if (adultUnitPrice > 0) {
      return adultUnitPrice;
    }
    if (!activity) return null;
    const prices = activity.packages
      .map((pkg) => (typeof pkg.price === "number" ? pkg.price : null))
      .filter((price): price is number => price !== null);
    if (prices.length > 0) {
      return Math.min(...prices);
    }
    return typeof activity.price === "number" ? activity.price : null;
  }, [activity, adultUnitPrice]);

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

  useEffect(() => {
    if (!isReviewDialogOpen || editingReview) return;
    if (!selectedBookingId && reviewableBookings.length > 0) {
      setSelectedBookingId(String(reviewableBookings[0].id));
    }
  }, [isReviewDialogOpen, editingReview, reviewableBookings, selectedBookingId]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return null;
    return safeAdultCount * adultUnitPrice + safeChildCount * childUnitPrice;
  }, [selectedPackage, safeAdultCount, safeChildCount, adultUnitPrice, childUnitPrice]);


  const incrementAdults = () => setAdultCount((prev) => Math.min(MAX_TRAVELLERS, prev + 1));
  const decrementAdults = () => setAdultCount((prev) => Math.max(1, prev - 1));
  const incrementChildren = () =>
    setChildCount((prev) => Math.min(MAX_TRAVELLERS - safeAdultCount, prev + 1));
  const decrementChildren = () => setChildCount((prev) => Math.max(0, prev - 1));

  const handleAddToCart = () => {
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

    const scheduleTitle =
      selectedSchedule?.title ??
      (selectedSchedule?.start_date
        ? new Date(selectedSchedule.start_date).toLocaleDateString("vi-VN")
        : undefined);

    addItem({
      tourId: activity.id,
      tourTitle: activity.title,
      packageId: selectedPackage.packageId ?? selectedPackage.id,
      packageName: selectedPackage.name,
      scheduleId: selectedScheduleId ?? undefined,
      scheduleTitle,
      thumbnail: activity.images[0] ?? null,
      adultCount: safeAdultCount,
      childCount: safeChildCount,
      adultPrice: adultUnitPrice,
      childPrice: childUnitPrice,
    });

    toast({
      title: "Đã thêm vào giỏ hàng",
      description: "Bạn có thể xem lại các hoạt động trong giỏ hàng để đặt sau.",
    });
  };

  const handleBookNow = () => {
    if (!activity || !selectedPackage) return;
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
  const hasReviews = allReviews.length > 0;
  const hasLocation = Boolean(activity.location?.name || activity.location?.address);
  const locationCoords = activity.location?.coordinates;
  const hasRelated = activity.relatedActivities.length > 0;
  const ratingValue = ratingAverage ?? null;
  const reviewCount = ratingCount ?? null;
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
                                    const price = schedule.season_price ?? tourDetail?.base_price;
                                    const date = formatDate(schedule.start_date);
                                    
                                    const slots = schedule.slots_available;
                                    const status = slots !== null && slots < 5 ? `(Chỉ còn ${slots} chỗ)` : '';

                                    const label = [
                                      schedule.title,
                                      date ? `- ${date}` : null,
                                      status,
                                    ].filter(Boolean).join(" ");
                                    
                                    return (
                                      <SelectItem key={schedule.id} value={String(schedule.id)}>
                                        {label}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        {/* ==================================================================================== */}
                        
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
                              disabled={!selectedPackage}
                            >
                              Thêm vào giỏ hàng
                            </Button>
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600"
                              size="lg"
                              onClick={handleBookNow}
                              disabled={!selectedPackage}
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
                    <div className="flex flex-wrap items-center gap-2">
                      {existingReview ? (
                        <>
                          <Button variant="outline" size="sm" onClick={openEditReview} disabled={isSubmittingReview}>
                            Chỉnh sửa đánh giá
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={handleDeleteReview}
                            disabled={isDeletingReview}
                          >
                            {isDeletingReview ? "Đang xoá..." : "Xoá đánh giá"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={openCreateReview}
                          disabled={!currentUser || reviewableBookings.length === 0 || isSubmittingReview}
                        >
                          Viết đánh giá
                        </Button>
                      )}
                    </div>
                  </div>

                  {currentUser && reviewableBookings.length === 0 && !existingReview && (
                    <Alert>
                      <AlertTitle>Bạn chưa có booking đủ điều kiện</AlertTitle>
                      <AlertDescription>
                        Chỉ những booking đã hoàn thành và chưa từng được đánh giá mới có thể gửi đánh giá cho tour.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isReviewsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : hasReviews ? (
                    <div className="space-y-4">
                      {allReviews.map((review) => {
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
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
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
                      Chưa có đánh giá cho tour này. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
                    </p>
                  )}
                </div>
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
                            src={`https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${locationCoords.lat},${locationCoords.lng}&zoom=14`}
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

    <Dialog
      open={isReviewDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          setIsReviewDialogOpen(true);
        } else {
          closeReviewDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingReview ? "Cập nhật đánh giá" : "Viết đánh giá"}</DialogTitle>
          <DialogDescription>
            {editingReview
              ? "Điều chỉnh đánh giá đã gửi để phản ánh đúng trải nghiệm của bạn."
              : "Chia sẻ trải nghiệm thực tế của bạn để giúp những du khách khác lựa chọn tốt hơn."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {!editingReview && (
            <div className="space-y-2">
              <Label htmlFor="review-booking">Chọn booking</Label>
              <Select value={selectedBookingId} onValueChange={(value) => setSelectedBookingId(value)}>
                <SelectTrigger id="review-booking">
                  <SelectValue placeholder="Chọn booking đã hoàn thành" />
                </SelectTrigger>
                <SelectContent>
                  {reviewableBookings.map((booking) => {
                    const scheduleLabel = formatDate(
                      booking.schedule?.start_date ?? booking.booking_date ?? booking.created_at ?? null,
                    );
                    const packageName = booking.package?.name ?? "Gói tiêu chuẩn";
                    return (
                      <SelectItem key={booking.id} value={String(booking.id)}>
                        {packageName}
                        {scheduleLabel ? ` • ${scheduleLabel}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Điểm đánh giá</Label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const active = value <= reviewRating;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`transition-colors focus:outline-none ${
                      active ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                    }`}
                    onClick={() => setReviewRating(value)}
                    aria-label={`Chọn ${value} sao`}
                  >
                    <Star className={`h-6 w-6 ${active ? "fill-yellow-400" : ""}`} />
                  </button>
                );
              })}
              <span className="text-sm text-muted-foreground">{reviewRating}/5</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Nội dung đánh giá</Label>
            <Textarea
              id="review-comment"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Chia sẻ những điều bạn ấn tượng hoặc cần cải thiện để giúp cộng đồng du lịch tốt hơn."
              rows={5}
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeReviewDialog} disabled={isSubmittingReview}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmittingReview || (!editingReview && reviewableBookings.length === 0)}>
              {isSubmittingReview
                ? "Đang gửi..."
                : editingReview
                ? "Cập nhật đánh giá"
                : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
      <DialogContent className="max-w-7xl w-full p-0 border-none bg-transparent shadow-none">
        <div className="flex h-[90vh] flex-col overflow-hidden rounded-lg bg-black/90 text-white">
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

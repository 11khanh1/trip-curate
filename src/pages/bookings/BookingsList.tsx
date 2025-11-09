import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Star,
  Ticket,
  Trash2,
  Users,
  Info,
} from "lucide-react";
import { isAxiosError } from "axios";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { fetchBookings, cancelBooking, type Booking, type BookingListResponse } from "@/services/bookingApi";
import {
  createReview,
  deleteReview,
  updateReview,
  type CreateReviewPayload,
  type DeleteReviewResponse,
  type ReviewResponse,
  type UpdateReviewPayload,
} from "@/services/reviewApi";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusVariant = (status?: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
};

const statusLabel = (status?: string) => {
  switch (status) {
    case "pending":
      return "Chờ thanh toán";
    case "confirmed":
      return "Đã xác nhận";
    case "paid":
      return "Đã thanh toán";
    case "unpaid":
      return "Chưa thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status ? status : "Đang cập nhật";
  }
};

const paymentMethodLabel = (method?: string) => {
  switch (method) {
    case "sepay":
      return "Thanh toán Sepay";
    case "offline":
      return "Thanh toán trực tiếp";
    default:
      return method ?? "Chưa cập nhật";
  }
};

const formatCurrency = (value?: number | null, currency = "VND") => {
  if (typeof value !== "number") return "Đang cập nhật";
  try {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    });
  } catch {
    return `${value.toLocaleString("vi-VN")} ${currency}`;
  }
};

const coerceBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const coerceString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const resolveCancellationInfo = (booking: Booking) => {
  const record = booking as Record<string, unknown>;
  const reasonText =
    coerceString(record?.["cancel_reason"]) ??
    coerceString(record?.["cancellation_reason"]) ??
    coerceString(record?.["status_reason"]) ??
    coerceString(record?.["status_note"]) ??
    coerceString(record?.["cancel_reason_text"]) ??
    coerceString(record?.["cancel_message"]);
  const reasonCode =
    coerceString(record?.["cancel_reason_code"]) ??
    coerceString(record?.["cancellation_reason_code"]) ??
    coerceString(record?.["status_reason_code"]) ??
    coerceString(record?.["cancel_code"]);
  const normalizedText = reasonText?.toLowerCase() ?? "";
  const normalizedCode = reasonCode?.toLowerCase() ?? "";
  const underbooked =
    (normalizedCode.includes("underbook") ||
      normalizedCode.includes("under_book") ||
      normalizedCode.includes("insufficient")) ||
    normalizedText.includes("underbook") ||
    normalizedText.includes("under-book") ||
    normalizedText.includes("thiếu khách") ||
    normalizedText.includes("không đủ khách");
  return { reasonText: reasonText ?? null, reasonCode: reasonCode ?? null, underbooked };
};

const resolveTourTypeLabel = (type?: string | null) => {
  if (!type) return null;
  const normalized = type.toString().trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "domestic") return "Tour nội địa";
  if (normalized === "international") return "Tour quốc tế";
  return type.toString();
};

const summarizeDocumentRequirementShort = (requiresPassport?: unknown, requiresVisa?: unknown) => {
  const needsPassport = coerceBoolean(requiresPassport) === true;
  const needsVisa = coerceBoolean(requiresVisa) === true;
  if (!needsPassport && !needsVisa) return "Không cần hộ chiếu/visa";
  const pieces: string[] = [];
  if (needsPassport) pieces.push("Hộ chiếu");
  if (needsVisa) pieces.push("Visa");
  return `Bắt buộc: ${pieces.join(" & ")}`;
};

const formatChildAgeRequirement = (limit?: unknown) => {
  const value = coerceNumber(limit);
  if (typeof value === "number") {
    if (value <= 0) return "Giới hạn trẻ em: Không áp dụng";
    return `Giới hạn trẻ em: ≤ ${value} tuổi`;
  }
  return null;
};

const formatCancellationWindowLabel = (days?: unknown) => {
  const value = coerceNumber(days);
  if (typeof value !== "number") return "Theo chính sách";
  if (value <= 0) return "Trong ngày khởi hành";
  return `Trước ${value} ngày`;
};

const formatRefundRateLabel = (rate?: unknown) => {
  const value = coerceNumber(rate);
  if (typeof value !== "number") return "Theo quy định";
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const REVIEW_COMMENT_MAX_LENGTH = 500;

const clampRating = (value: number) => {
  if (!Number.isFinite(value)) return 5;
  return Math.min(5, Math.max(1, Math.round(value)));
};

const renderStaticStars = (rating?: number | null) => {
  const numericRating = typeof rating === "number" && Number.isFinite(rating) ? rating : 0;
  const normalized = numericRating > 0 ? Math.min(5, Math.max(1, Math.round(numericRating))) : 0;
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {STAR_VALUES.map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 transition-colors ${
            star <= normalized ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};

const resolveApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown; error?: unknown } | undefined;
    const messageCandidate = [payload?.message, payload?.error].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    if (messageCandidate && typeof messageCandidate === "string") {
      return messageCandidate;
    }
  } else if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

type ReviewMode = "create" | "edit";

interface ReviewDialogState {
  booking: Booking | null;
  mode: ReviewMode;
  rating: number;
  comment: string;
}

interface UpdateReviewVariables {
  reviewId: string | number;
  payload: UpdateReviewPayload;
}

interface DeleteReviewVariables {
  bookingId: string | number;
  reviewId: string | number;
}

const BookingsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-56" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

const EmptyState = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
      <Ticket className="h-10 w-10 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-semibold">Bạn chưa có booking nào</h3>
        <p className="text-sm text-muted-foreground">
          Hãy khám phá các hoạt động thú vị và đặt ngay để lưu giữ khoảnh khắc.
        </p>
      </div>
      <Button asChild>
        <Link to="/activities">Khám phá hoạt động</Link>
      </Button>
    </CardContent>
  </Card>
);

const BookingsList = () => {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({
    booking: null,
    mode: "create",
    rating: 5,
    comment: "",
  });

  const resetReviewDialog = () =>
    setReviewDialog({
      booking: null,
      mode: "create",
      rating: 5,
      comment: "",
    });

  const createReviewMutation = useMutation<ReviewResponse, unknown, CreateReviewPayload>({
    mutationFn: createReview,
    onSuccess: (response) => {
      toast({
        title: "Cảm ơn bạn đã đánh giá",
        description: response?.message ?? "Đánh giá của bạn đã được ghi nhận.",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      resetReviewDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Không thể gửi đánh giá",
        description: resolveApiErrorMessage(error, "Vui lòng thử lại sau."),
      });
    },
  });

  const updateReviewMutation = useMutation<ReviewResponse, unknown, UpdateReviewVariables>({
    mutationFn: ({ reviewId, payload }) => updateReview(reviewId, payload),
    onSuccess: (response) => {
      toast({
        title: "Đã cập nhật đánh giá",
        description: response?.message ?? "Cảm ơn bạn đã cập nhật phản hồi.",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      resetReviewDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Không thể cập nhật đánh giá",
        description: resolveApiErrorMessage(error, "Vui lòng thử lại sau."),
      });
    },
  });

  const deleteReviewMutation = useMutation<DeleteReviewResponse, unknown, DeleteReviewVariables>({
    mutationFn: ({ reviewId }) => deleteReview(reviewId),
    onSuccess: (response, variables) => {
      toast({
        title: "Đã xóa đánh giá",
        description: response?.message ?? "Đánh giá đã được gỡ bỏ.",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (reviewDialog.booking && String(reviewDialog.booking.id) === String(variables.bookingId)) {
        resetReviewDialog();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Không thể xóa đánh giá",
        description: resolveApiErrorMessage(error, "Vui lòng thử lại sau."),
      });
    },
  });

  const isReviewDialogOpen = reviewDialog.booking !== null;
  const isSubmittingReview = createReviewMutation.isPending || updateReviewMutation.isPending;
  const isDeletingReview = deleteReviewMutation.isPending;

  const isDeletingReviewFor = (bookingId: string | number) => {
    if (!isDeletingReview) return false;
    if (!deleteReviewMutation.variables) return false;
    return String(deleteReviewMutation.variables.bookingId) === String(bookingId);
  };

  const openReviewDialog = (booking: Booking, mode: ReviewMode) => {
    setReviewDialog({
      booking,
      mode,
      rating: mode === "edit" ? clampRating(booking.review?.rating ?? 5) : 5,
      comment:
        mode === "edit" && typeof booking.review?.comment === "string" ? booking.review.comment ?? "" : "",
    });
  };

  const handleReviewSubmit = () => {
    if (!reviewDialog.booking) return;
    const sanitizedComment = reviewDialog.comment.trim();
    if (reviewDialog.mode === "edit") {
      const reviewId = reviewDialog.booking.review?.id;
      if (!reviewId) {
        toast({
          variant: "destructive",
          title: "Không tìm thấy đánh giá",
          description: "Vui lòng tải lại danh sách rồi thử lại.",
        });
        return;
      }
      updateReviewMutation.mutate({
        reviewId,
        payload: {
          rating: clampRating(reviewDialog.rating),
          comment: sanitizedComment.length > 0 ? sanitizedComment : undefined,
        },
      });
      return;
    }

    createReviewMutation.mutate({
      booking_id: String(reviewDialog.booking.id),
      rating: clampRating(reviewDialog.rating),
      comment: sanitizedComment.length > 0 ? sanitizedComment : undefined,
    });
  };

  const handleDeleteReview = (booking: Booking) => {
    const reviewId = booking.review?.id;
    if (!reviewId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    deleteReviewMutation.mutate({
      bookingId: booking.id,
      reviewId,
    });
  };

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: (response) => {
      const refund = response?.refund ?? null;
      const details: string[] = [];
      if (refund) {
        if (typeof refund.amount === "number" && Number.isFinite(refund.amount)) {
          details.push(`Hoàn ${formatCurrency(refund.amount, "VND")}`);
        }
        if (refund.rate !== undefined && refund.rate !== null) {
          details.push(`Tỷ lệ ${formatRefundRateLabel(refund.rate)}`);
        }
        if (refund.policy_days_before !== undefined && refund.policy_days_before !== null) {
          details.push(formatCancellationWindowLabel(refund.policy_days_before));
        }
      }
      const descriptionParts = [
        response?.message ?? "Đơn của bạn đã được hủy thành công.",
        details.length > 0 ? details.join(" · ") : null,
      ].filter(Boolean);
      toast({
        title: "Đã hủy booking",
        description: descriptionParts.join(" "),
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      let description = "Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.";
      if (isAxiosError(error)) {
        const responseMessage =
          (error.response?.data as { message?: string } | undefined)?.message;
        if (responseMessage) {
          description = responseMessage;
        } else if (error.response?.status === 422) {
          description = "Booking không thể hủy theo chính sách hiện tại.";
        }
      } else if (error instanceof Error && error.message) {
        description = error.message;
      }
      toast({
        title: "Không thể hủy booking",
        description,
        variant: "destructive",
      });
    },
  });

  const isCancellingBooking = (bookingId: string | number) => {
    const pending = cancelMutation.isPending;
    if (!pending) return false;
    if (cancelMutation.variables === undefined) return false;
    return String(cancelMutation.variables) === String(bookingId);
  };

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<BookingListResponse>({
    queryKey: ["bookings", { status, page }],
    queryFn: () =>
      fetchBookings({
        status: status === "all" ? undefined : status,
        page,
        per_page: 10,
      }),
    placeholderData: keepPreviousData,
  });

  const bookings = data?.data ?? [];
  const meta = (data?.meta ?? {}) as Record<string, unknown>;
  const currentPage = typeof meta.current_page === "number" ? meta.current_page : page;
  const lastPage = typeof meta.last_page === "number" ? meta.last_page : undefined;

  const hasMore = lastPage ? currentPage < lastPage : false;
  const total = typeof meta.total === "number" ? meta.total : bookings.length;

  const statusSummary = useMemo(() => {
    if (!total) return "";
    return `${total} booking`;
  }, [total]);

  const selectedBookingForReview = reviewDialog.booking;
  const selectedTourName =
    selectedBookingForReview?.tour?.title ??
    selectedBookingForReview?.tour?.name ??
    selectedBookingForReview?.package?.name ??
    "Tour";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Đơn đặt của tôi</h1>
            <p className="text-sm text-muted-foreground">{statusSummary}</p>
          </div>
          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={status === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
              >
                {option.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Làm mới
            </Button>
          </div>
        </div>

        {isLoading ? (
          <BookingsSkeleton />
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: Booking) => {
              const tourName = booking.tour?.title ?? booking.tour?.name ?? "Tour không tên";
              const scheduleTitle =
                booking.schedule?.title ??
                (booking.schedule?.start_date ? `Lịch ${formatDate(booking.schedule.start_date)}` : undefined);
              const packageName = booking.package?.name ?? "Gói tiêu chuẩn";
              const bookingTotal = booking.total_price ?? booking.total_amount ?? null;
              const appliedPromotions = Array.isArray(booking.promotions) ? booking.promotions : [];
              const discountTotal =
                typeof booking.discount_total === "number"
                  ? booking.discount_total
                  : appliedPromotions.reduce(
                      (sum, promo) =>
                        typeof promo?.discount_amount === "number" ? sum + promo.discount_amount : sum,
                      0,
                    );
              const bookingDate = booking.booking_date ?? booking.booked_at ?? booking.created_at ?? null;
              const totalAdults = booking.total_adults ?? booking.adults ?? 0;
              const totalChildren = booking.total_children ?? booking.children ?? 0;
              const guestSummary =
                totalAdults + totalChildren > 0
                  ? totalChildren > 0
                    ? `${totalAdults} người lớn, ${totalChildren} trẻ em`
                    : `${totalAdults} người lớn`
                  : null;
              const contactPhone = booking.contact?.phone ?? booking.contact_phone ?? null;
              const canCancel =
                booking.can_cancel ??
                (booking.status === "pending" || booking.status === "confirmed");
              const normalizedStatus =
                typeof booking.status === "string" ? booking.status.toLowerCase() : "";
              const reviewEligible = normalizedStatus === "confirmed" || normalizedStatus === "completed";
              const existingReview = booking.review ?? null;
              const hasReview = Boolean(existingReview && existingReview.id);
              const reviewComment =
                existingReview && typeof existingReview.comment === "string" ? existingReview.comment : null;
              const reviewRating =
                existingReview && typeof existingReview.rating === "number" ? existingReview.rating : null;
              const scheduleRecord = booking.schedule as Record<string, unknown> | undefined;
              const scheduleMinParticipantsRaw = coerceNumber(
                booking.schedule?.min_participants ??
                  scheduleRecord?.["min_participants"] ??
                  scheduleRecord?.["minParticipants"],
              );
              const scheduleMinParticipants =
                typeof scheduleMinParticipantsRaw === "number"
                  ? Math.max(1, Math.trunc(scheduleMinParticipantsRaw))
                  : undefined;
              const scheduleSeatsAvailableRaw = coerceNumber(
                booking.schedule?.slots_available ??
                  scheduleRecord?.["slots_available"] ??
                  scheduleRecord?.["seats_available"] ??
                  scheduleRecord?.["slotsAvailable"],
              );
              const scheduleSeatsAvailable =
                typeof scheduleSeatsAvailableRaw === "number"
                  ? Math.max(0, Math.trunc(scheduleSeatsAvailableRaw))
                  : undefined;
              const scheduleSeatsTotalRaw = coerceNumber(
                booking.schedule?.seats_total ??
                  scheduleRecord?.["seats_total"] ??
                  scheduleRecord?.["seatsTotal"] ??
                  scheduleRecord?.["capacity"],
              );
              const scheduleSeatsTotal =
                typeof scheduleSeatsTotalRaw === "number" ? Math.max(0, Math.trunc(scheduleSeatsTotalRaw)) : undefined;
              const cancellationInfo = resolveCancellationInfo(booking);
              const bookingTourId =
                booking.tour?.uuid != null
                  ? String(booking.tour.uuid)
                  : booking.tour?.id != null
                  ? String(booking.tour.id)
                  : null;

              return (
                <Card key={booking.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">{tourName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
                      {canCancel && (
                        <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                          Có thể hủy
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        {packageName}
                      </span>
                      {scheduleTitle && (
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {scheduleTitle}
                        </span>
                      )}
                      {bookingDate && (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Đặt ngày {formatDate(bookingDate)}
                        </span>
                      )}
                    </div>
                    {booking.tour?.destination && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{booking.tour.destination}</span>
                      </div>
                    )}
                    {(() => {
                      const tourTypeLabel = resolveTourTypeLabel(
                        (booking.tour as { type?: string } | undefined)?.type ?? booking.tour?.type ?? null,
                      );
                      const childAgeLabel = formatChildAgeRequirement(
                        booking.tour?.child_age_limit ??
                          (booking.tour as Record<string, unknown> | undefined)?.childAgeLimit,
                      );
                      const documentLabel = summarizeDocumentRequirementShort(
                        booking.tour?.requires_passport ??
                          (booking.tour as Record<string, unknown> | undefined)?.requiresPassport,
                        booking.tour?.requires_visa ??
                          (booking.tour as Record<string, unknown> | undefined)?.requiresVisa,
                      );
                      return (
                        <div className="flex flex-wrap gap-2">
                          {tourTypeLabel ? (
                            <Badge variant="secondary" className="text-xs">
                              {tourTypeLabel}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-xs">
                            {documentLabel}
                          </Badge>
                          {childAgeLabel ? (
                            <Badge variant="outline" className="text-xs">
                              {childAgeLabel}
                            </Badge>
                          ) : null}
                          {typeof scheduleMinParticipants === "number" && scheduleMinParticipants > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              Tối thiểu {Math.max(1, Math.trunc(scheduleMinParticipants))} khách
                            </Badge>
                          ) : null}
                          {typeof scheduleSeatsAvailable === "number" ? (
                            <Badge variant="outline" className="text-xs">
                              {typeof scheduleSeatsTotal === "number"
                                ? `Còn ${Math.max(0, Math.trunc(scheduleSeatsAvailable))}/${Math.max(
                                    0,
                                    Math.trunc(scheduleSeatsTotal),
                                  )} chỗ`
                                : `Còn ${Math.max(0, Math.trunc(scheduleSeatsAvailable))} chỗ`}
                            </Badge>
                          ) : typeof scheduleSeatsTotal === "number" ? (
                            <Badge variant="outline" className="text-xs">
                              Sức chứa {Math.max(0, Math.trunc(scheduleSeatsTotal))} chỗ
                            </Badge>
                          ) : null}
                        </div>
                      );
                    })()}
                    <div className="flex flex-wrap items-center gap-4">
                      {guestSummary && (
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {guestSummary}
                        </span>
                      )}
                      {contactPhone && (
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          {contactPhone}
                        </span>
                      )}
                    </div>
                    {booking.status === "cancelled" && cancellationInfo.underbooked && (
                      <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                        <p>
                          Lịch khởi hành bị hủy do chưa đủ số khách tối thiểu
                          {scheduleMinParticipants ? ` (${scheduleMinParticipants} khách).` : "."}
                        </p>
                        {cancellationInfo.reasonText && (
                          <p className="mt-1 text-xs text-destructive/80">Chi tiết: {cancellationInfo.reasonText}</p>
                        )}
                        {bookingTourId && (
                          <div className="mt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/activity/${bookingTourId}?tab=packages`}>Chọn lịch khác</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {hasReview ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-foreground">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {renderStaticStars(reviewRating)}
                            {reviewRating !== null ? (
                              <span className="text-sm font-semibold text-amber-600">{reviewRating}/5</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-amber-600 hover:text-amber-700"
                              onClick={() => openReviewDialog(booking, "edit")}
                              disabled={isSubmittingReview}
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-destructive hover:text-destructive/80"
                              onClick={() => handleDeleteReview(booking)}
                              disabled={isDeletingReviewFor(booking.id)}
                            >
                              {isDeletingReviewFor(booking.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Xóa
                            </Button>
                          </div>
                        </div>
                        {reviewComment && (
                          <p className="mt-2 text-sm text-muted-foreground">{reviewComment}</p>
                        )}
                      </div>
                    ) : reviewEligible ? (
                      <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                        Đơn đã được đối tác xác nhận, bạn có thể gửi đánh giá sau khi hoàn tất chuyến đi.
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {bookingTotal !== null
                          ? formatCurrency(bookingTotal, booking.currency ?? "VND")
                          : "Đang cập nhật"}
                      </p>
                      {discountTotal > 0 && (
                        <p className="text-sm font-medium text-emerald-600">
                          Tiết kiệm: {formatCurrency(discountTotal, booking.currency ?? "VND")}
                        </p>
                      )}
                      {guestSummary && (
                        <p>
                          Số khách: <span className="font-medium text-foreground">{guestSummary}</span>
                        </p>
                      )}
                      {booking.payment_status && (
                        <p>
                          Trạng thái thanh toán:{" "}
                          <span className="font-medium text-foreground">{statusLabel(booking.payment_status)}</span>
                        </p>
                      )}
                      {booking.payment_method && (
                        <p>
                          Phương thức:{" "}
                          <span className="font-medium text-foreground">
                            {paymentMethodLabel(booking.payment_method)}
                          </span>
                        </p>
                      )}
                      {appliedPromotions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {appliedPromotions.map((promo) => (
                            <Badge
                              key={promo.id ?? promo.code ?? `${booking.id}-promo`}
                              variant="outline"
                              className="border-emerald-200 text-emerald-600"
                            >
                              {promo.description ?? (promo.code ? `Mã ${promo.code}` : "Khuyến mãi tự động")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reviewEligible && !hasReview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-1"
                          onClick={() => openReviewDialog(booking, "create")}
                          disabled={isSubmittingReview}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Đánh giá tour
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if (!window.confirm("Bạn có chắc chắn muốn hủy booking này?")) return;
                            cancelMutation.mutate(String(booking.id));
                          }}
                          disabled={isCancellingBooking(booking.id)}
                        >
                          {isCancellingBooking(booking.id) ? "Đang hủy..." : "Hủy booking"}
                        </Button>
                      )}
                      <Button asChild size="sm">
                        <Link to={`/bookings/${booking.id}`} className="inline-flex items-center gap-2">
                          Xem chi tiết
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  disabled={isFetching}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {isFetching ? "Đang tải..." : "Tải thêm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Dialog open={isReviewDialogOpen} onOpenChange={(open) => (!open ? resetReviewDialog() : undefined)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {reviewDialog.mode === "edit" ? "Chỉnh sửa đánh giá" : "Đánh giá tour"}
              {selectedTourName ? (
                <span className="ml-1 text-base font-medium text-muted-foreground">({selectedTourName})</span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Chia sẻ cảm nhận của bạn để giúp chúng tôi và các khách du lịch khác có thêm thông tin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary uppercase tracking-wide">Điểm chất lượng</p>
                  <p className="text-sm text-muted-foreground">
                    Nhấn để chọn số sao phản ánh đúng trải nghiệm của bạn.
                  </p>
                </div>
                <div className="text-2xl font-semibold text-foreground">
                  {clampRating(reviewDialog.rating).toFixed(1)}/5
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-50 px-3 py-2">
                  {STAR_VALUES.map((star) => {
                    const active = star <= clampRating(reviewDialog.rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`Chọn ${star} sao`}
                        className={`rounded-full p-1 transition focus:outline-none ${
                          active ? "text-amber-500" : "text-muted-foreground hover:text-amber-400"
                        }`}
                        onClick={() =>
                          setReviewDialog((prev) => ({
                            ...prev,
                            rating: star,
                          }))
                        }
                      >
                        <Star className={`h-7 w-7 ${active ? "fill-amber-500" : ""}`} />
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {clampRating(reviewDialog.rating)} sao
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Nhận xét (không bắt buộc)</p>
              <Textarea
                rows={5}
                placeholder="Bạn ấn tượng điều gì nhất? Dịch vụ có điểm nào cần cải thiện?"
                value={reviewDialog.comment}
                maxLength={REVIEW_COMMENT_MAX_LENGTH}
                onChange={(event) =>
                  setReviewDialog((prev) => ({
                    ...prev,
                    comment: event.target.value.slice(0, REVIEW_COMMENT_MAX_LENGTH),
                  }))
                }
              />
              <p className="text-right text-xs text-muted-foreground">
                {reviewDialog.comment.length}/{REVIEW_COMMENT_MAX_LENGTH} ký tự
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => resetReviewDialog()}
              disabled={isSubmittingReview}
              className="h-10 px-6"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={isSubmittingReview}
              className="h-10 px-6 bg-[#ff5b00] text-white hover:bg-[#e24c00]"
            >
              {isSubmittingReview ? "Đang gửi..." : reviewDialog.mode === "edit" ? "Lưu thay đổi" : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default BookingsList;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import OrderHistory from "@/components/orders/OrderHistory";
import CheckoutProgress, { type CheckoutStep } from "@/components/checkout/CheckoutProgress";
import { Info, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRecommendationRealtimeRefresh } from "@/hooks/useRecommendationRealtimeRefresh";
import {
  createBooking,
  fetchBookingPaymentStatus,
  type BookingPaymentStatusResponse,
  type CreateBookingPayload,
} from "@/services/bookingApi";
import { fetchTourDetail, type PublicTour, type PublicTourPackage, type PublicTourSchedule } from "@/services/publicApi";
import { deduceSepayQrImage, deriveQrFromPaymentUrl } from "@/lib/sepay";
import {
  isPastDate,
  isValidVietnamPhone,
  normalizeCitizenId,
  normalizeVietnamPhone,
} from "@/lib/validators";

const extractOrderCode = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("order_code");
  } catch {
    return null;
  }
};
const ensurePositive = (value: number, fallback: number) => (Number.isFinite(value) && value >= 0 ? value : fallback);

interface SepayPanelState {
  bookingId: string;
  paymentUrl: string;
  orderCode?: string;
  bookingCode?: string;
  paymentId?: string;
  amount?: number | null;
  currency: string;
  qrImage?: string | null;
  providerName: string;
}

const normalizeStatus = (status?: string | null) => (status ?? "").toString().trim().toLowerCase();
const SUCCESS_STATUSES = new Set(["success", "paid", "completed"]);
const PENDING_STATUSES = new Set(["pending", "processing", "waiting"]);


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

const resolveTourTypeLabel = (type: unknown) => {
  if (typeof type !== "string") return null;
  const normalized = type.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "domestic") return "Tour nội địa";
  if (normalized === "international") return "Tour quốc tế";
  return type.trim();
};

const isValidIdentityDocument = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) {
    return trimmed.length === 9 || trimmed.length === 12;
  }
  const compact = trimmed.replace(/\s+/g, "");
  return /^[A-Za-z0-9]{6,20}$/.test(compact);
};

const calculateAgeInYears = (date: Date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

const formatDocumentNumberForPayload = (value: string, requireDocument: boolean) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (requireDocument) return trimmed.toUpperCase();
  const digits = normalizeCitizenId(trimmed);
  return digits.length > 0 ? digits : trimmed;
};

const parseScheduleNumber = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const passengerSchema = z
  .object({
    type: z.enum(["adult", "child"]),
    full_name: z.string().min(1, "Yêu cầu họ tên"),
    date_of_birth: z.string().optional(),
    document_number: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.date_of_birth && !isPastDate(data.date_of_birth)) {
      ctx.addIssue({
        path: ["date_of_birth"],
        code: z.ZodIssueCode.custom,
        message: "Ngày sinh phải trước ngày hiện tại.",
      });
    }
    if (data.document_number) {
      const normalized = data.document_number.trim();
      if (!isValidIdentityDocument(normalized)) {
        ctx.addIssue({
          path: ["document_number"],
          code: z.ZodIssueCode.custom,
          message: "Giấy tờ cần 6–20 ký tự chữ hoặc số.",
        });
      }
    }
  });

const bookingSchema = z.object({
  package_id: z.string().min(1, "Yêu cầu chọn gói dịch vụ"),
  schedule_id: z.string().min(1, "Yêu cầu chọn lịch khởi hành"),
  adults: z.number().int().min(1, "Cần ít nhất 1 người lớn"),
  children: z.number().int().min(0),
  contact_name: z.string().min(1, "Yêu cầu họ tên người liên hệ"),
  contact_email: z.string().email("Email không hợp lệ"),
  contact_phone: z
    .string()
    .min(6, "Số điện thoại chưa hợp lệ")
    .refine(isValidVietnamPhone, "Số điện thoại không hợp lệ"),
  notes: z.string().optional(),
  payment_method: z.enum(["offline", "sepay"]),
  passengers: z.array(passengerSchema).min(1, "Cần tối thiểu 1 hành khách"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const BookingCheckout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { removeItem } = useCart();
  const { trackEvent } = useAnalytics();
  const scheduleRecommendationRefresh = useRecommendationRealtimeRefresh();
  const [searchParams] = useSearchParams();
  const [sepayPanel, setSepayPanel] = useState<SepayPanelState | null>(null);
  const [shouldPollSepayStatus, setShouldPollSepayStatus] = useState(false);

  const tourId = searchParams.get("tourId") ?? "";
  const cartItemId = searchParams.get("cartItemId") ?? "";
  const defaultPackageId = searchParams.get("packageId") ?? "";
  const defaultScheduleId = searchParams.get("scheduleId") ?? "";
  const initialAdults = ensurePositive(Number.parseInt(searchParams.get("adults") ?? "1", 10), 1) || 1;
  const initialChildren = ensurePositive(Number.parseInt(searchParams.get("children") ?? "0", 10), 0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      package_id: defaultPackageId,
      schedule_id: defaultScheduleId,
      adults: initialAdults,
      children: initialChildren,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      payment_method: "sepay",
      passengers: [],
    },
  });

  const { setValue, getValues } = form;

  const adults = form.watch("adults");
  const children = form.watch("children");
  const packageId = form.watch("package_id");
  const scheduleId = form.watch("schedule_id");

  const { data: tour, isLoading, isError, error } = useQuery<PublicTour | null>({
    queryKey: ["tour-detail", tourId],
    queryFn: () => fetchTourDetail(tourId),
    enabled: Boolean(tourId),
  });

  const packages = useMemo(() => tour?.packages ?? [], [tour?.packages]);
  const schedules = useMemo(() => tour?.schedules ?? [], [tour?.schedules]);
  const tourRecord = tour as Record<string, unknown> | null | undefined;
  const requiresPassport =
    coerceBoolean(tourRecord?.["requires_passport"]) === true ||
    coerceBoolean(tourRecord?.["requiresPassport"]) === true;
  const requiresVisa =
    coerceBoolean(tourRecord?.["requires_visa"]) === true ||
    coerceBoolean(tourRecord?.["requiresVisa"]) === true;
  const requiresDocument = requiresPassport || requiresVisa;
  const rawChildAgeLimit =
    tourRecord?.["child_age_limit"] ?? tourRecord?.["childAgeLimit"] ?? tour?.child_age_limit;
  const childAgeLimit = coerceNumber(rawChildAgeLimit) ?? null;
  const tourTypeLabel = resolveTourTypeLabel(
    tourRecord?.["type"] ?? (tour?.type as unknown) ?? tourRecord?.["tour_type"],
  );
  const documentRequirementLabel = requiresDocument
    ? `Cần cung cấp ${requiresPassport && requiresVisa ? "Hộ chiếu và Visa" : requiresPassport ? "Hộ chiếu" : "Visa"} cho mỗi hành khách.`
    : "Giấy tờ tùy thân giúp làm thủ tục nhanh hơn nhưng không bắt buộc.";
  const childAgeRequirementLabel =
    childAgeLimit !== null ? `Áp dụng cho trẻ em ≤ ${childAgeLimit} tuổi.` : "Giới hạn tuổi trẻ em tùy theo gói dịch vụ.";

  // Effect to set default package
  useEffect(() => {
    if (packages.length === 0) return;
    const current = getValues("package_id");
    if (!current || !packages.some(p => String(p.id) === current)) {
      setValue("package_id", String(packages[0]?.id ?? ""));
    }
  }, [packages, getValues, setValue]);

  // Effect to set default schedule
  useEffect(() => {
    if (schedules.length === 0) {
      setValue("schedule_id", ""); // Clear schedule if none available
      return;
    }
    const current = getValues("schedule_id");
      if (!current || !schedules.some(s => String(s.id) === current)) {
      setValue("schedule_id", String(schedules[0]?.id ?? ""));
    }
  }, [schedules, getValues, setValue]);

  // Effect to sync passenger fields with adult/child counts
  useEffect(() => {
    const safeAdults = Number.isFinite(adults) && adults >= 1 ? adults : 1;
    if (safeAdults !== adults) {
      setValue("adults", safeAdults);
    }
    const safeChildren = Number.isFinite(children) && children >= 0 ? children : 0;
    if (safeChildren !== children) {
      setValue("children", safeChildren);
    }

    const desired = safeAdults + safeChildren;
    const current = getValues("passengers");

    if (current.length === desired) return; // Already in sync

    const next: BookingFormValues["passengers"] = Array.from({ length: desired }, (_, index) => {
      const existing = current[index];
      const passengerType: "adult" | "child" = index < safeAdults ? "adult" : "child";
      return {
        type: passengerType,
        full_name: existing?.full_name ?? "",
        date_of_birth: existing?.date_of_birth ?? "",
        document_number: existing?.document_number ?? "",
      };
    });
    setValue("passengers", next, { shouldDirty: true, shouldValidate: true });
    // **FIXED**: Removed unstable `form` object from dependency array to prevent infinite loops.
  }, [adults, children, setValue, getValues]);

  const selectedPackage: PublicTourPackage | undefined = useMemo(
    () => packages.find((pkg) => String(pkg.id) === packageId),
    [packages, packageId],
  );

  const selectedSchedule: PublicTourSchedule | undefined = useMemo(
    () => schedules.find((schedule) => String(schedule?.id) === scheduleId),
    [schedules, scheduleId],
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

  const tourTitle = useMemo(
    () => tour?.title ?? tour?.name ?? "Tour chưa cập nhật",
    [tour?.name, tour?.title],
  );

  const providerName = useMemo(() => {
    const partnerCompany = tour?.partner?.company_name;
    if (typeof partnerCompany === "string" && partnerCompany.trim().length > 0) {
      return partnerCompany.trim();
    }
    return "CÔNG TY CỔ PHẦN SALEMALL";
  }, [tour?.partner?.company_name]);

  const resolvedTourEntityId = useMemo(() => {
    const candidates: Array<unknown> = [tour?.uuid, tour?.id, tourId];
    const candidate = candidates.find(
      (value) => typeof value === "string" || typeof value === "number",
    );
    return candidate !== undefined && candidate !== null ? String(candidate) : null;
  }, [tour?.id, tour?.uuid, tourId]);

  const displayCurrency = useMemo(() => {
    const raw = typeof tour?.currency === "string" ? tour.currency.trim() : "";
    return raw.length > 0 ? raw : "VND";
  }, [tour?.currency]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    const adultPrice = selectedPackage.adult_price ?? tour?.base_price ?? 0;
    const childPrice = selectedPackage.child_price ?? selectedPackage.adult_price ?? tour?.base_price ?? 0;
    return adults * adultPrice + children * childPrice;
  }, [adults, children, selectedPackage, tour?.base_price]);

  const mutation = useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: async (response, payload) => {
      toast({
        title: "Đặt chỗ thành công",
        description:
          payload.payment_method === "sepay"
            ? "Chúng tôi đã tạo yêu cầu thanh toán. Vui lòng quét mã để hoàn tất giao dịch."
            : "Chúng tôi đã gửi email xác nhận cho bạn.",
      });

      const bookingEntity = response?.booking ?? null;
      const bookingIdentifier =
        bookingEntity?.id ??
        bookingEntity?.uuid ??
        (response as { booking_id?: string | number | null })?.booking_id ??
        null;
      const bookingCode = bookingEntity?.code ? String(bookingEntity.code) : undefined;

      if (resolvedTourEntityId) {
        trackEvent(
          {
            event_name: "booking_success",
            entity_type: "tour",
            entity_id: resolvedTourEntityId,
            metadata: {
              booking_id: bookingIdentifier ?? undefined,
              booking_code: bookingCode,
              payment_method: payload.payment_method,
              total_amount:
                typeof bookingEntity?.total_amount === "number"
                  ? bookingEntity.total_amount
                  : typeof bookingEntity?.total_price === "number"
                  ? bookingEntity.total_price
                  : totalPrice,
            },
            context: {
              adults: payload.adults,
              children: payload.children ?? 0,
              package_id: payload.package_id,
              schedule_id: payload.schedule_id,
            },
          },
          { immediate: true },
        );
        scheduleRecommendationRefresh();
      }

      const invalidatePromises: Array<Promise<unknown>> = [
        queryClient.invalidateQueries({ queryKey: ["public-tours"] }),
        queryClient.invalidateQueries({ queryKey: ["public-tours-trending"] }),
        queryClient.invalidateQueries({ queryKey: ["trending-tours"] }),
        queryClient.invalidateQueries({ queryKey: ["user-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
      ];
      if (resolvedTourEntityId) {
        invalidatePromises.push(
          queryClient.invalidateQueries({ queryKey: ["tour-detail", resolvedTourEntityId] }),
        );
      }
      void Promise.all(invalidatePromises);

      if (cartItemId) {
        await removeItem(cartItemId);
      }

      if (payload.payment_method === "sepay") {
        const directPaymentUrl =
          response.payment_url ??
          (bookingEntity?.payment_url && String(bookingEntity.payment_url).trim().length
            ? String(bookingEntity.payment_url)
            : undefined);
        if (bookingIdentifier) {
          if (directPaymentUrl) {
            const derivedOrderCode =
              extractOrderCode(directPaymentUrl) ??
              bookingCode ??
              (response.payment_id ? String(response.payment_id) : undefined);
            const amountFromResponse =
              typeof bookingEntity?.total_amount === "number"
                ? bookingEntity.total_amount
                : typeof bookingEntity?.total_price === "number"
                ? bookingEntity.total_price
                : totalPrice;
            const currencyFromResponse =
              (bookingEntity?.currency && String(bookingEntity.currency).trim()) || displayCurrency;
            

          }

          const derivedOrderCode =
            extractOrderCode(response.payment_url ?? "") ??
            bookingCode ??
            (response.payment_id ? String(response.payment_id) : undefined);
          if (response.payment_url) {
            const amountFromResponse =
              typeof bookingEntity?.total_amount === "number"
                ? bookingEntity.total_amount
                : typeof bookingEntity?.total_price === "number"
                ? bookingEntity.total_price
                : totalPrice;
            const currencyFromResponse =
              (bookingEntity?.currency && String(bookingEntity.currency).trim()) || displayCurrency;
            const qrImage = deduceSepayQrImage(response) ?? deriveQrFromPaymentUrl(response.payment_url);

            setSepayPanel({
              bookingId: String(bookingIdentifier),
              paymentUrl: response.payment_url,
              orderCode: derivedOrderCode ?? undefined,
              bookingCode,
              paymentId: response.payment_id ? String(response.payment_id) : undefined,
              amount: amountFromResponse,
              currency: currencyFromResponse,
              qrImage: qrImage ?? null,
              providerName,
            });
            setShouldPollSepayStatus(true);
            return;
          }
        }
        if (response.payment_url) {
          setShouldPollSepayStatus(true);
          window.location.href = response.payment_url;
          return;
        }
      }

      if (response?.booking?.id) {
        navigate(`/bookings/${response.booking.id}`);
      } else {
         navigate(`/`); // Fallback to home page
      }
    },
    onError: (submitError: unknown) => {
      const fallbackMessage = "Vui lòng kiểm tra lại thông tin và thử lại.";
      const description = isAxiosError(submitError)
        ? (submitError.response?.data as { message?: string })?.message ??
          submitError.response?.statusText ??
          fallbackMessage
        : submitError instanceof Error
        ? submitError.message
        : fallbackMessage;

      toast({
        title: "Không thể tạo booking",
        description,
        variant: "destructive",
      });
    },
  });

  const sepayPaymentQuery = useQuery<BookingPaymentStatusResponse>({
    queryKey: ["sepay-payment-status", sepayPanel?.bookingId],
    queryFn: () => fetchBookingPaymentStatus(String(sepayPanel?.bookingId)),
    enabled: Boolean(sepayPanel?.bookingId && shouldPollSepayStatus),
    refetchInterval: shouldPollSepayStatus ? 5000 : false,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
  const sepayPaymentStatus = sepayPaymentQuery.data;
  const isSepayPaymentFetching = sepayPaymentQuery.isFetching;
  const sepayPaymentError = sepayPaymentQuery.error;

  useEffect(() => {
    if (!sepayPanel?.bookingId) return;
    const normalized = normalizeStatus(sepayPaymentStatus?.status ?? sepayPaymentStatus?.payment?.status);
    if (SUCCESS_STATUSES.has(normalized)) {
      const timer = window.setTimeout(() => {
        navigate(`/bookings/${sepayPanel.bookingId}`);
      }, 2000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [navigate, sepayPanel?.bookingId, sepayPaymentStatus?.payment?.status, sepayPaymentStatus?.status]);

  useEffect(() => {
    if (isAxiosError(sepayPaymentError) && sepayPaymentError.response?.status === 404) {
      setShouldPollSepayStatus(false);
    }
  }, [sepayPaymentError]);

  useEffect(() => {
    if (sepayPanel) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [sepayPanel]);

  const handleOpenSepayPayment = () => {
    if (!sepayPanel?.paymentUrl) return;
    window.open(sepayPanel.paymentUrl, "_blank", "noopener,noreferrer");
  };

  const hasSelectedTour = Boolean(tourId);
  const steps: CheckoutStep[] = useMemo(() => {
    if (sepayPanel) {
      return [
        { id: "select", label: "Chọn đơn hàng", status: "complete" },
        { id: "info", label: "Điền thông tin", status: "complete" },
        { id: "pay", label: "Thanh toán", status: "current" },
      ];
    }
    return [
      {
        id: "select",
        label: "Chọn đơn hàng",
        status: hasSelectedTour ? "complete" : "current",
      },
      {
        id: "info",
        label: "Điền thông tin",
        status: hasSelectedTour ? "current" : "upcoming",
      },
      {
        id: "pay",
        label: "Thanh toán",
        status: "upcoming",
      },
    ];
  }, [hasSelectedTour, sepayPanel]);

  const sepayQrImage = useMemo(() => {
    if (!sepayPanel) return null;
    if (sepayPanel.qrImage) return sepayPanel.qrImage;
    return deriveQrFromPaymentUrl(sepayPanel.paymentUrl);
  }, [sepayPanel]);

  const sepayAmountLabel = sepayPanel ? formatCurrency(sepayPanel.amount, sepayPanel.currency) : "";
  const sepayFeeLabel = sepayPanel ? formatCurrency(0, sepayPanel.currency) : "";
  const sepayStatusNormalized = normalizeStatus(
    sepayPaymentStatus?.status ?? sepayPaymentStatus?.payment?.status,
  );
  const sepayStatusLabel = sepayPanel
    ? SUCCESS_STATUSES.has(sepayStatusNormalized)
      ? "Thanh toán thành công"
      : sepayStatusNormalized === "failed"
      ? "Thanh toán thất bại"
      : sepayStatusNormalized === "refunded"
      ? "Đã hoàn tiền"
      : "Đang chờ thanh toán"
    : "";
  const handleSubmit = (values: BookingFormValues) => {
    if (!tourId || !tour) {
      toast({
        title: "Thiếu thông tin tour",
        description: "Vui lòng quay lại trang chi tiết để chọn tour cần đặt.",
        variant: "destructive",
      });
      return;
    }

    const totalGuests = values.adults + values.children;
    if (selectedScheduleMinParticipants !== null && totalGuests < selectedScheduleMinParticipants) {
      toast({
        title: "Chưa đủ số khách tối thiểu",
        description: `Lịch khởi hành này yêu cầu tối thiểu ${selectedScheduleMinParticipants} khách.`,
        variant: "destructive",
      });
      return;
    }
    if (selectedScheduleSlotsAvailable !== null && totalGuests > selectedScheduleSlotsAvailable) {
      toast({
        title: "Vượt quá số chỗ còn lại",
        description: `Lịch khởi hành này hiện chỉ còn ${selectedScheduleSlotsAvailable} chỗ trống.`,
        variant: "destructive",
      });
      return;
    }

    form.clearErrors("passengers");
    let hasPassengerError = false;

    values.passengers.forEach((passenger, index) => {
      const docNumber = passenger.document_number?.trim() ?? "";
      if (requiresDocument && docNumber.length === 0) {
        form.setError(`passengers.${index}.document_number`, {
          type: "manual",
          message: "Vui lòng nhập giấy tờ bắt buộc.",
        });
        hasPassengerError = true;
      }

      if (passenger.type === "child") {
        const dob = passenger.date_of_birth?.trim() ?? "";
        if (dob.length === 0) {
          form.setError(`passengers.${index}.date_of_birth`, {
            type: "manual",
            message: "Vui lòng nhập ngày sinh cho trẻ em.",
          });
          hasPassengerError = true;
        } else {
          const dobDate = new Date(`${dob}T00:00:00`);
          if (!Number.isNaN(dobDate.getTime()) && childAgeLimit !== null) {
            const age = calculateAgeInYears(dobDate);
            if (age > childAgeLimit) {
              form.setError(`passengers.${index}.date_of_birth`, {
                type: "manual",
                message: `Trẻ em phải không quá ${childAgeLimit} tuổi.`,
              });
              hasPassengerError = true;
            }
          }
        }
      }
    });

    if (hasPassengerError) {
      toast({
        title: "Thiếu thông tin hành khách",
        description: "Vui lòng bổ sung đầy đủ ngày sinh và giấy tờ theo yêu cầu trước khi tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    const payloadPassengers = values.passengers.map((passenger) => ({
      type: passenger.type,
      full_name: passenger.full_name.trim(),
      date_of_birth: passenger.date_of_birth?.trim() || undefined,
      document_number: passenger.document_number
        ? formatDocumentNumberForPayload(passenger.document_number, requiresDocument)
        : undefined,
    }));

    const payload: CreateBookingPayload = {
      tour_id: tourId || String(tour?.uuid ?? tour?.id ?? ""),
      package_id: String(values.package_id).trim(),
      schedule_id: String(values.schedule_id).trim(),
      adults: values.adults,
      contact_name: values.contact_name.trim(),
      contact_email: values.contact_email.trim(),
      contact_phone: normalizeVietnamPhone(values.contact_phone.trim()),
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      payment_method: values.payment_method,
      passengers: payloadPassengers,
    };

    if (values.children > 0) {
      payload.children = values.children;
    }

    if (!payload.tour_id) {
      toast({
        title: "Thiếu thông tin tour",
        description: "Không xác định được tour để tạo booking. Vui lòng thử lại từ trang chi tiết tour.",
        variant: "destructive",
      });
      return;
    }

    setSepayPanel(null);
    setShouldPollSepayStatus(false);
    mutation.mutate(payload);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <TravelHeader />
      <main className="flex-1 bg-gradient-to-b from-muted/40 via-transparent to-transparent">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <CheckoutProgress steps={steps} />
          {!tourId ? (
            <Alert variant="destructive">
              <AlertTitle>Thiếu thông tin tour</AlertTitle>
              <AlertDescription>Đường dẫn không chứa mã tour hợp lệ.</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể tải dữ liệu tour</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại sau hoặc liên hệ hỗ trợ."}
              </AlertDescription>
            </Alert>
        ) : !tour ? (
          <Alert>
            <AlertTitle>Tour đang cập nhật</AlertTitle>
            <AlertDescription>Chúng tôi chưa tìm thấy thông tin cho tour này.</AlertDescription>
          </Alert>
        ) : sepayPanel ? (
          <div className="space-y-6">
            <Alert className="border-l-4 border-amber-500 bg-amber-50 text-amber-900">
              <AlertTitle className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Lưu ý quan trọng
              </AlertTitle>
              <AlertDescription className="text-sm">
                Quý khách vui lòng không tắt trình duyệt cho đến khi nhận được kết quả giao dịch trên website. Xin cảm
                ơn!
              </AlertDescription>
            </Alert>

            <Card className="overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-white pb-4 text-center shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-blue-600">SePay QR</p>
                  <p className="text-2xl font-semibold text-foreground">Quét mã để thanh toán</p>
                  <p className="text-sm text-muted-foreground">
                    Sử dụng ứng dụng ngân hàng hỗ trợ VietQR hoặc SePay để hoàn tất giao dịch của bạn.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-10 bg-white py-10 lg:grid-cols-[1.1fr_1fr]">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Thông tin đơn hàng</h2>
                    <p className="text-sm text-muted-foreground">
                      Vui lòng kiểm tra lại thông tin trước khi thanh toán. Chúng tôi sẽ chuyển bạn về trang booking khi
                      giao dịch thành công.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
                    <dl className="space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Số tiền thanh toán</dt>
                        <dd className="text-lg font-semibold text-foreground">{sepayAmountLabel}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Giá trị đơn hàng</dt>
                        <dd className="font-medium text-foreground">{sepayAmountLabel}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Phí giao dịch</dt>
                        <dd className="font-medium text-foreground">{sepayFeeLabel}</dd>
                      </div>
                    </dl>
                    <Separator className="my-4" />
                    <dl className="space-y-4">
                      <div className="flex items-center justify-between">
                        <dt>Mã đơn hàng</dt>
                        <dd className="font-medium text-foreground">
                          {sepayPanel.bookingCode ?? sepayPanel.orderCode ?? "Đang cập nhật"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Mã giao dịch</dt>
                        <dd className="font-medium text-foreground">{sepayPanel.orderCode ?? "Đang cập nhật"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Nhà cung cấp</dt>
                        <dd className="font-medium text-foreground">{sepayPanel.providerName}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground shadow-sm">
                    <p>
                      Tour: <span className="font-medium text-foreground">{tourTitle}</span>
                    </p>
                    {selectedSchedule?.start_date && (
                      <p>
                        Khởi hành:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(selectedSchedule.start_date).toLocaleDateString("vi-VN")}
                        </span>
                      </p>
                    )}
                    <p>
                      Số lượng:{" "}
                      <span className="font-medium text-foreground">
                        {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ""}
                      </span>
                    </p>
                    {selectedScheduleMinParticipants !== null && (
                      <p>
                        Yêu cầu tối thiểu:{" "}
                        <span className="font-medium text-foreground">
                          {selectedScheduleMinParticipants} khách
                        </span>
                      </p>
                    )}
                    {selectedScheduleSlotsAvailable !== null && (
                      <p>
                        Số chỗ còn lại:{" "}
                        <span className="font-medium text-foreground">
                          {selectedScheduleSeatsTotal !== null
                            ? `${Math.max(0, selectedScheduleSlotsAvailable)}/${Math.max(
                                0,
                                selectedScheduleSeatsTotal,
                              )} chỗ`
                            : `${Math.max(0, selectedScheduleSlotsAvailable)} chỗ`}
                        </span>
                      </p>
                    )}
                    {selectedPackage?.name && (
                      <p>
                        Gói dịch vụ: <span className="font-medium text-foreground">{selectedPackage.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[#1d4ed8]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1d4ed8]/20 bg-[#eef3ff]">
                        <span className="text-lg font-semibold">S</span>
                      </div>
                      <span className="text-lg font-semibold">SePay</span>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Thanh toán QR
                    </p>
                  </div>
                  <div className="w-full max-w-[280px] rounded-2xl border border-[#1d4ed8] bg-white p-3">
                    {sepayQrImage ? (
                      <img
                        src={sepayQrImage}
                        alt="QR thanh toán SePay"
                        className="h-auto w-full rounded-xl object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-60 w-full items-center justify-center rounded-xl border border-dashed border-[#1d4ed8]/40 bg-muted/30 px-6 text-xs text-muted-foreground">
                        Đang tải mã QR... Vui lòng thử mở trang thanh toán trực tiếp.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>
                      <span className="text-[#1d4ed8]">napas</span>
                      <span className="text-emerald-500">247</span>
                    </span>
                    <span className="text-[#ef4444]">MB</span>
                    <span className="text-[#2563eb]">VietQR</span>
                  </div>
                  <div className="flex w-full flex-col gap-3">
                    {sepayPanel.paymentUrl && (
                      <Button
                        size="lg"
                        className="w-full bg-[#ff5b00] text-white hover:bg-[#e24c00]"
                        onClick={handleOpenSepayPayment}
                      >
                        Mở trang thanh toán
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                      onClick={() => navigate(sepayPanel.bookingId ? `/bookings/${sepayPanel.bookingId}` : "/")}
                    >
                      Xem booking của bạn
                    </Button>
                  </div>
                    <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
                      <span>Trạng thái: {sepayStatusLabel}</span>
                      {isSepayPaymentFetching && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang cập nhật trạng thái giao dịch...
                        </span>
                      )}
                      {sepayPaymentError && (
                        <span className="text-[11px] text-destructive">
                          Không thể kiểm tra trạng thái tự động. Vui lòng mở booking để kiểm tra thủ công.
                        </span>
                      )}
                      {!SUCCESS_STATUSES.has(sepayStatusNormalized) && (
                        <span>
                          Nếu đã thanh toán thành công, trạng thái sẽ tự động cập nhật trong ít phút.
                        </span>
                      )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-3 border-t bg-white py-6 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={() => navigate("/")}>
                  Về trang chủ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSepayPanel(null);
                    setShouldPollSepayStatus(false);
                  }}
                >
                  Thực hiện giao dịch mới
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start"
              >
                <div className="space-y-6">
                  <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Thông tin đặt chỗ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="package_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gói dịch vụ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn gói" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {packages.map((pkg) => (
                                <SelectItem key={String(pkg.id)} value={String(pkg.id)}>
                                  {pkg.name ?? `Gói ${pkg.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lịch khởi hành</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn lịch khởi hành" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schedules.map((schedule) => (
                                schedule && <SelectItem key={String(schedule.id)} value={String(schedule.id)}>
                                  {schedule.title ??
                                    (schedule.start_date
                                      ? new Date(schedule.start_date).toLocaleDateString("vi-VN")
                                      : `Lịch ${schedule.id}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="adults"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Người lớn</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="children"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trẻ em</FormLabel>
                              <FormControl>
                                  <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Thông tin liên hệ</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                              <Input placeholder="Nguyễn Văn A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="tenban@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                              <Input placeholder="0123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                              <Textarea rows={3} placeholder="Yêu cầu đặc biệt (nếu có)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Thông tin hành khách</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.getValues("passengers").length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Tăng số lượng người lớn hoặc trẻ em để thêm hành khách.
                        </p>
                      ) : (
                        <>
                          <Alert>
                            <AlertTitle>Yêu cầu khi tham gia</AlertTitle>
                            <AlertDescription className="space-y-1">
                              {tourTypeLabel ? <p>Loại tour: {tourTypeLabel}</p> : null}
                              <p>{documentRequirementLabel}</p>
                              <p>{childAgeRequirementLabel}</p>
                            </AlertDescription>
                          </Alert>
                          {form.getValues("passengers").map((passenger, index) => (
                          <div key={`passenger-${index}`} className="rounded-lg border p-4">
                            <p className="mb-3 text-sm font-semibold text-foreground">
                              Hành khách {index + 1} · {passenger.type === "child" ? "Trẻ em" : "Người lớn"}
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`passengers.${index}.full_name`}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Họ và tên</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nhập họ và tên" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`passengers.${index}.date_of_birth`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {passenger.type === "child" ? "Ngày sinh (bắt buộc)" : "Ngày sinh"}
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`passengers.${index}.document_number`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {requiresDocument ? "Giấy tờ hộ chiếu/visa (bắt buộc)" : "Giấy tờ tùy thân (tùy chọn)"}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={requiresDocument ? "Số hộ chiếu/visa" : "CMND/Hộ chiếu"}
                                        {...field}
                                      />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                      {requiresDocument
                                        ? "Nhập chính xác dãy chữ số ghi trên giấy tờ sẽ xuất trình."
                                        : "Nếu có, nhập CMND/CCCD hoặc hộ chiếu để hỗ trợ đối soát."}
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:sticky lg:top-24">
                  <Card className="border-none bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Tóm tắt đơn hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{tourTitle}</p>
                        {selectedSchedule?.start_date && (
                          <p>
                            Khởi hành:{" "}
                            {new Date(selectedSchedule.start_date).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Người lớn:</span>
                          <span className="font-medium text-foreground">{adults}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trẻ em:</span>
                          <span className="font-medium text-foreground">{children}</span>
                        </div>
                          <div className="flex justify-between">
                          <span>Gói dịch vụ:</span>
                          <span className="font-medium text-foreground text-right">
                            {selectedPackage?.name ?? "Chưa chọn"}
                          </span>
                        </div>
                        {selectedScheduleMinParticipants !== null && (
                          <div className="flex justify-between">
                            <span>Tối thiểu:</span>
                            <span className="font-medium text-foreground">
                              {selectedScheduleMinParticipants} khách
                            </span>
                          </div>
                        )}
                        {selectedScheduleSlotsAvailable !== null && (
                          <div className="flex justify-between">
                            <span>Còn lại:</span>
                            <span className="font-medium text-foreground">
                              {selectedScheduleSeatsTotal !== null
                                ? `${Math.max(0, selectedScheduleSlotsAvailable)}/${Math.max(
                                    0,
                                    selectedScheduleSeatsTotal,
                                  )} chỗ`
                                : `${Math.max(0, selectedScheduleSlotsAvailable)} chỗ`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        {tourTypeLabel ? (
                          <p className="text-foreground">
                            Loại tour: <span className="font-medium">{tourTypeLabel}</span>
                          </p>
                        ) : null}
                        <p>{documentRequirementLabel}</p>
                        <p>{childAgeRequirementLabel}</p>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-base font-semibold text-foreground">
                        <span>Tổng cộng</span>
                        <span>
                          {totalPrice.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: displayCurrency,
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <Separator />
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phương thức thanh toán</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sepay">Thanh toán qua Ví điện tử</SelectItem>
                                <SelectItem value="offline">Thanh toán sau</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={mutation.isPending || packages.length === 0}
                      >
                        {mutation.isPending ? "Đang xử lý..." : "Hoàn tất đặt chỗ"}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                          Khi tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách của chúng tôi.
                      </p>
                    </CardFooter>
                  </Card>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
      <section className="bg-background">
        <div className="container mx-auto px-4 pb-12">
          <OrderHistory />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BookingCheckout;

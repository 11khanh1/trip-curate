import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Phone,
  Shield,
  Ticket,
  User,
  Users,
  XCircle,
} from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  cancelBooking,
  fetchBookingDetail,
  initiateBookingPayment,
  type Booking,
  type BookingContact,
  type BookingPassenger,
  type BookingPayment,
  type BookingPaymentIntentResponse,
} from "@/services/bookingApi";
import { useToast } from "@/hooks/use-toast";
import {
  coalesceString,
  extractPaymentIntentUrl,
  resolveBookingPaymentUrl,
} from "@/lib/payment-utils";

const statusVariant = (status?: string) => {
  switch (status) {
    case "paid":
    case "success":
    case "confirmed":
    case "completed":
      return "default";
    case "refunded":
    case "pending":
      return "outline";
    case "failed":
    case "cancelled":
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
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    case "paid":
      return "Đã thanh toán";
    case "unpaid":
      return "Chưa thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    case "success":
      return "Thành công";
    case "failed":
      return "Thất bại";
    default:
      return status ?? "Đang cập nhật";
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

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const resolveTourTypeLabel = (type?: string | null) => {
  if (!type) return null;
  const normalized = type.toString().trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "domestic") return "Tour nội địa";
  if (normalized === "international") return "Tour quốc tế";
  return type.toString();
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

const summarizeDocumentRequirements = (requiresPassport?: boolean | null, requiresVisa?: boolean | null) => {
  const needsPassport = coerceBoolean(requiresPassport) === true;
  const needsVisa = coerceBoolean(requiresVisa) === true;
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

const formatCancellationSummary = (policies?: Array<Record<string, unknown>> | null) => {
  if (!Array.isArray(policies) || policies.length === 0) return "Theo điều khoản của nhà cung cấp";
  return `${policies.length} chính sách hủy áp dụng`;
};

const formatCancellationWindow = (days?: number | null) => {
  if (typeof days !== "number" || !Number.isFinite(days)) return "Linh hoạt";
  if (days <= 0) return "Trong ngày khởi hành";
  return `Trước ${days} ngày`;
};

const formatRefundRateLabel = (rate?: number | null) => {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "Theo quy định";
  const normalized = rate > 1 ? rate : rate * 100;
  return `${Math.round(normalized)}%`;
};

const BookingDetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-2/3" />
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/4" />
      </CardContent>
      <CardFooter className="space-x-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-3/5" />
        ))}
      </CardContent>
    </Card>
  </div>
);

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useQuery<Booking>({
    queryKey: ["booking-detail", id],
    queryFn: () => fetchBookingDetail(String(id)),
    enabled: Boolean(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(String(id)),
    onSuccess: (response) => {
      const refund = response?.refund ?? null;
      const baseTitle = response?.message ?? "Hủy booking thành công";
      const refundDetails: string[] = [];
      if (refund) {
        if (typeof refund.amount === "number" && Number.isFinite(refund.amount)) {
          refundDetails.push(`Hoàn ${formatCurrency(refund.amount, booking?.currency ?? "VND")}`);
        }
        if (typeof refund.rate === "number") {
          refundDetails.push(`Tỷ lệ ${formatRefundRateLabel(refund.rate)}`);
        }
        if (refund.policy_days_before !== undefined && refund.policy_days_before !== null) {
          refundDetails.push(`Áp dụng ${formatCancellationWindow(refund.policy_days_before)}`);
        }
      }

      const description =
        refundDetails.length > 0
          ? refundDetails.join(" · ")
          : "Chúng tôi đã gửi email xác nhận hủy cho bạn.";

      toast({
        title: baseTitle,
        description,
      });
      queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (mutationError: unknown) => {
      let message = "Không thể hủy booking. Vui lòng thử lại.";
      if (isAxiosError(mutationError)) {
        const responseMessage =
          (mutationError.response?.data as { message?: string } | undefined)?.message;
        if (responseMessage) {
          message = responseMessage;
        } else if (mutationError.response?.status === 422) {
          message = "Booking không thể hủy theo chính sách hiện tại.";
        }
      } else if (mutationError instanceof Error && mutationError.message) {
        message = mutationError.message;
      }
      toast({
        title: "Hủy booking thất bại",
        description: message,
        variant: "destructive",
      });
    },
  });

  const canCancel = Boolean(
    booking?.can_cancel ?? (booking?.status === "pending" || booking?.status === "confirmed"),
  );

  const bookingPaymentUrl = resolveBookingPaymentUrl(booking);
  const paymentMethod = (booking?.payment_method ?? "").toString().toLowerCase();
  const paymentStatusNormalized = (booking?.payment_status ?? booking?.status ?? "")
    .toString()
    .toLowerCase();
  const isPaid =
    paymentStatusNormalized === "paid" ||
    paymentStatusNormalized === "success" ||
    paymentStatusNormalized === "completed";
  const canPayOnline =
    paymentMethod === "sepay" &&
    typeof bookingPaymentUrl === "string" &&
    bookingPaymentUrl.length > 0 &&
    !isPaid;
  const paymentMutation = useMutation({
    mutationFn: () =>
      initiateBookingPayment(String(id), {
        method: booking?.payment_method ?? "sepay",
      }),
    onSuccess: (response) => {
      const nextUrl = extractPaymentIntentUrl(response, response?.booking ?? booking);
      if (nextUrl) {
        window.open(nextUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "Đang chuyển tới cổng thanh toán",
          description: "Chúng tôi đã mở trang thanh toán trong tab mới.",
        });
      } else {
        toast({
          title: "Không tìm thấy liên kết thanh toán",
          description: response?.message ?? "Vui lòng thử lại sau ít phút.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể khởi tạo thanh toán. Vui lòng thử lại.";
      toast({
        title: "Khởi tạo thanh toán thất bại",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleInitiatePayment = () => {
    if (!id || paymentMutation.isPending) return;
    paymentMutation.mutate();
  };

  const paymentButtonState = (() => {
    if (canPayOnline) {
      return {
        label: paymentMutation.isPending ? "Đang xử lý..." : "Thanh toán ngay",
        disabled: paymentMutation.isPending,
        onClick: handleInitiatePayment,
      };
    }
    if (isPaid) {
      return {
        label: "Đã thanh toán",
        disabled: true,
        onClick: undefined,
      };
    }
    if (paymentMethod === "offline") {
      return {
        label: "Thanh toán trực tiếp",
        disabled: true,
        onClick: undefined,
      };
    }
    if (bookingPaymentUrl) {
      return {
        label: "Mở liên kết thanh toán",
        disabled: false,
        onClick: () => window.open(bookingPaymentUrl, "_blank", "noopener,noreferrer"),
      };
    }
    return {
      label: "Thanh toán chưa khả dụng",
      disabled: true,
      onClick: undefined,
    };
  })();

  const contactRecord =
    booking?.contact && typeof booking.contact === "object" && !Array.isArray(booking.contact)
      ? (booking.contact as BookingContact)
      : undefined;
  const contactName = coalesceString(booking?.contact_name, contactRecord?.name) ?? "—";
  const contactPhone = coalesceString(booking?.contact_phone, contactRecord?.phone) ?? "—";
  const contactEmail = coalesceString(booking?.contact_email, contactRecord?.email) ?? "—";
  const contactNotes = coalesceString(booking?.notes, contactRecord?.notes);
  const contactCompany =
    coalesceString(
      contactRecord?.company_name,
      (contactRecord as { company?: string | null } | undefined)?.company ?? undefined,
      (booking as { company_name?: string | null } | undefined)?.company_name ?? undefined,
    ) ?? null;

  const tourTypeRaw = coalesceString(
    (booking?.tour as { type?: string } | undefined)?.type ?? undefined,
    booking?.tour?.type ?? undefined,
  );
  const tourTypeLabel =
    resolveTourTypeLabel(tourTypeRaw) ??
    coalesceString(
      booking?.tour?.categories && booking.tour.categories.length > 0
        ? (booking.tour.categories[0]?.name as string | undefined)
        : undefined,
    ) ??
    "Đang cập nhật";
  const childAgeLimitValue =
    coerceNumber(booking?.tour?.child_age_limit) ??
    coerceNumber((booking?.tour as Record<string, unknown> | undefined)?.childAgeLimit);
  const documentRequirementLabel = summarizeDocumentRequirements(
    booking?.tour?.requires_passport ?? (booking?.tour as Record<string, unknown> | undefined)?.requiresPassport,
    booking?.tour?.requires_visa ?? (booking?.tour as Record<string, unknown> | undefined)?.requiresVisa,
  );
  const childAgeRequirementLabel = formatChildAgeLimit(childAgeLimitValue ?? null);
  const cancellationPoliciesArray = Array.isArray(booking?.tour?.cancellation_policies)
    ? (booking?.tour?.cancellation_policies as Array<Record<string, unknown>>)
    : Array.isArray((booking?.tour as Record<string, unknown> | undefined)?.cancellationPolicies)
    ? ((booking?.tour as Record<string, unknown> | undefined)?.cancellationPolicies as Array<Record<string, unknown>>)
    : [];
  const cancellationSummaryLabel = formatCancellationSummary(cancellationPoliciesArray);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        {!id ? (
          <Alert variant="destructive">
            <AlertTitle>Thiếu mã booking</AlertTitle>
            <AlertDescription>Đường dẫn không chứa mã booking hợp lệ.</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <BookingDetailSkeleton />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Không thể tải thông tin booking</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
            </AlertDescription>
          </Alert>
        ) : !booking ? (
          <Alert>
            <AlertTitle>Booking đang cập nhật</AlertTitle>
            <AlertDescription>Chúng tôi không tìm thấy thông tin booking này.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Booking #{booking.code ?? booking.id}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {booking.tour?.title ?? booking.tour?.name ?? "Tour chưa cập nhật"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
                {booking.payment_status && (
                  <Badge variant={statusVariant(booking.payment_status)}>
                    Thanh toán: {statusLabel(booking.payment_status)}
                  </Badge>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Thông tin hành trình
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {booking.tour?.destination ?? "Đang cập nhật địa điểm"}
                  </span>
                  {booking.package?.name && (
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Gói {booking.package.name}
                    </span>
                  )}
                  {booking.schedule?.start_date && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Khởi hành {formatDateTime(booking.schedule.start_date)}
                    </span>
                  )}
                  {booking.schedule?.end_date && (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Kết thúc {formatDateTime(booking.schedule.end_date)}
                    </span>
                  )}
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Users className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Số lượng khách</p>
                      <p>
                        {booking.adults ?? 0} người lớn
                        {typeof booking.children === "number" && booking.children > 0
                          ? ` • ${booking.children} trẻ em`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Tổng tiền</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(booking.total_amount, booking.currency ?? "VND")}
                      </p>
                      {booking.payment_method && (
                        <p>Phương thức: {booking.payment_method === "sepay" ? "Thanh toán Sepay" : "Thanh toán tại quầy"}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Loại tour</p>
                      <p>{tourTypeLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Độ tuổi trẻ em</p>
                      <p>{childAgeRequirementLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <FileText className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Giấy tờ yêu cầu</p>
                      <p>{documentRequirementLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Info className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Chính sách hủy</p>
                      <p>{cancellationSummaryLabel}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/bookings")}>
                  Quay lại danh sách
                </Button>
                <Button
                  onClick={paymentButtonState.onClick}
                  disabled={paymentButtonState.disabled || !paymentButtonState.onClick}
                >
                  {paymentButtonState.label}
                </Button>
                {canCancel && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isLoading}
                  >
                    {cancelMutation.isLoading ? "Đang hủy..." : "Hủy booking"}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {cancellationPoliciesArray.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Chi tiết chính sách hủy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Hoàn tiền phụ thuộc vào thời điểm hủy trước ngày khởi hành. Vui lòng xem bảng dưới đây
                    để biết mức hoàn cụ thể.
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
                        {cancellationPoliciesArray.map((policy, index) => {
                          const daysBefore = coerceNumber(policy?.["days_before"]);
                          const refundRate = coerceNumber(policy?.["refund_rate"]);
                          const description = coalesceString(
                            policy?.["description"] as string | undefined,
                            policy?.["note"] as string | undefined,
                          );
                          return (
                            <tr key={`${daysBefore ?? "policy"}-${index}`} className="bg-white">
                              <td className="px-4 py-2">{formatCancellationWindow(daysBefore)}</td>
                              <td className="px-4 py-2">{formatRefundRateLabel(refundRate)}</td>
                              <td className="px-4 py-2 text-foreground">{description ?? "Không có mô tả"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Thông tin liên hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{contactName}</span>
                  </div>
                  {contactCompany && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{contactCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{contactEmail}</span>
                  </div>
                  {contactNotes && (
                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Ghi chú của bạn</p>
                      <p>{contactNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Hành khách
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(booking.passengers) && booking.passengers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Loại khách</TableHead>
                          <TableHead>Giới tính</TableHead>
                          <TableHead>Ngày sinh</TableHead>
                          <TableHead>Tài liệu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {booking.passengers.map((passenger: BookingPassenger, index) => (
                          <TableRow key={passenger.id ?? index}>
                            <TableCell className="font-medium text-foreground">
                              {passenger.full_name ?? "—"}
                            </TableCell>
                            <TableCell>{passenger.type === "child" ? "Trẻ em" : "Người lớn"}</TableCell>
                            <TableCell>{passenger.gender ?? "—"}</TableCell>
                            <TableCell>
                              {passenger.date_of_birth ? formatDateTime(passenger.date_of_birth) : "—"}
                            </TableCell>
                            <TableCell>{passenger.document_number ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertTitle>Chưa có thông tin hành khách</AlertTitle>
                      <AlertDescription>
                        Hãy cập nhật thông tin hành khách trước ngày khởi hành nếu nhà cung cấp yêu cầu.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Lịch sử thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(booking.payments) && booking.payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã giao dịch</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead className="text-right">Thanh toán</TableHead>
                      </TableRow>
                    </TableHeader>
                      <TableBody>
                        {booking.payments.map((payment: BookingPayment, index) => (
                          <TableRow key={payment.id ?? index}>
                        <TableCell className="font-medium text-foreground">
                          {payment.order_code ?? payment.transaction_id ?? "—"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payment.amount, payment.currency ?? "VND")}
                          {typeof payment.refund_amount === "number" && Number.isFinite(payment.refund_amount) && payment.refund_amount > 0 ? (
                            <div className="text-xs text-emerald-600">
                              Hoàn: {formatCurrency(payment.refund_amount, payment.currency ?? "VND")}
                            </div>
                          ) : null}
                        </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(payment.status)}>{statusLabel(payment.status)}</Badge>
                            </TableCell>
                            <TableCell>
                              {payment.paid_at
                                ? formatDateTime(payment.paid_at)
                                : payment.status === "pending"
                                ? "Đang chờ"
                                : payment.updated_at
                                ? formatDateTime(payment.updated_at as string)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {(() => {
                                const rowStatus = (payment.status ?? "").toString().toLowerCase();
                                const rowPaid =
                                  rowStatus === "paid" ||
                                  rowStatus === "success" ||
                                  rowStatus === "completed";
                                if (rowPaid) {
                                  return "—";
                                }
                                if (canPayOnline) {
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={handleInitiatePayment}
                                      disabled={paymentMutation.isPending}
                                    >
                                      {paymentMutation.isPending ? "Đang xử lý..." : "Thanh toán"}
                                    </Button>
                                  );
                                }
                                if (bookingPaymentUrl && paymentMethod !== "offline") {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(bookingPaymentUrl, "_blank", "noopener,noreferrer")
                                      }
                                    >
                                      Mở liên kết
                                    </Button>
                                  );
                                }
                                return "—";
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                ) : (
                  <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertTitle>Chưa có giao dịch thanh toán</AlertTitle>
                    <AlertDescription>
                      Booking của bạn chưa phát sinh thanh toán hoặc đang chờ cập nhật từ hệ thống.
                      {bookingPaymentUrl && (
                        <div className="mt-3">
                          <Button asChild size="sm">
                            <a href={bookingPaymentUrl} target="_blank" rel="noopener noreferrer">
                              Thanh toán ngay
                            </a>
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {booking.status === "cancelled" && booking.cancelled_at && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Booking đã được hủy</AlertTitle>
                <AlertDescription>
                  Hủy lúc {formatDateTime(booking.cancelled_at)}. Nếu cần hỗ trợ hoàn tiền, vui lòng liên hệ đội chăm
                  sóc khách hàng.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetailPage;

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

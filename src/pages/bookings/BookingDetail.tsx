import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Phone,
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
  type Booking,
  type BookingContact,
  type BookingPassenger,
  type BookingPayment,
} from "@/services/bookingApi";
import { useToast } from "@/hooks/use-toast";

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

const coalesceString = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
};

const isUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

const parseMetaRecord = (meta: unknown): Record<string, unknown> | undefined => {
  if (!meta) return undefined;
  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      return toRecord(parsed);
    } catch {
      return undefined;
    }
  }
  return toRecord(meta);
};

const findUrlDeep = (source: unknown): string | null => {
  if (typeof source === "string") {
    return isUrl(source);
  }
  if (!source || typeof source !== "object") return null;
  if (Array.isArray(source)) {
    for (const item of source) {
      const result = findUrlDeep(item);
      if (result) return result;
    }
    return null;
  }
  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const result = findUrlDeep(record[key]);
    if (result) return result;
  }
  return null;
};

const extractPaymentUrl = (payment?: BookingPayment | null): string | null => {
  if (!payment) return null;
  const paymentRecord = toRecord(payment) ?? {};
  const metaRecord = parseMetaRecord(paymentRecord.meta);
  const nestedMetaData = metaRecord?.data ? parseMetaRecord(metaRecord.data) : undefined;
  const candidateSources = [paymentRecord, metaRecord, nestedMetaData];
  const candidateKeys = [
    "payment_url",
    "paymentUrl",
    "payment_link",
    "paymentLink",
    "pay_url",
    "payUrl",
    "checkout_url",
    "checkoutUrl",
    "redirect_url",
    "redirectUrl",
    "gateway_url",
    "gatewayUrl",
    "intent_url",
    "intentUrl",
    "url",
    "link",
  ];

  for (const source of candidateSources) {
    if (!source) continue;
    for (const key of candidateKeys) {
      const value = source[key];
      if (typeof value === "string") {
        const normalized = isUrl(value);
        if (normalized) return normalized;
      }
    }
  }

  const deepMetaUrl = metaRecord ? findUrlDeep(metaRecord) : null;
  if (deepMetaUrl) return deepMetaUrl;

  const deepPaymentUrl = findUrlDeep(paymentRecord);
  if (deepPaymentUrl) return deepPaymentUrl;

  return null;
};

const resolveBookingPaymentUrl = (booking?: Booking | null): string | null => {
  if (!booking) return null;
  const directUrl = coalesceString(booking.payment_url) ?? null;
  if (directUrl) return directUrl;
  if (Array.isArray(booking.payments)) {
    for (const payment of booking.payments) {
      const candidate = extractPaymentUrl(payment);
      if (candidate) return candidate;
    }
  }
  return null;
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
    onSuccess: () => {
      toast({
        title: "Hủy booking thành công",
        description: "Chúng tôi đã gửi email xác nhận hủy cho bạn.",
      });
      queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể hủy booking. Vui lòng thử lại.";
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
  const paymentButtonConfig = (() => {
    if (canPayOnline) {
      return {
        label: "Thanh toán ngay",
        asChild: true,
        disabled: false,
        href: bookingPaymentUrl!,
        hrefTarget: "_blank" as "_blank" | undefined,
      };
    }
    if (isPaid) {
      return {
        label: "Đã thanh toán",
        asChild: false,
        disabled: true,
        href: null,
        hrefTarget: undefined,
      };
    }
    if (paymentMethod === "offline") {
      return {
        label: "Thanh toán trực tiếp",
        asChild: false,
        disabled: true,
        href: null,
        hrefTarget: undefined,
      };
    }
    if (bookingPaymentUrl) {
      return {
        label: "Xem liên kết thanh toán",
        asChild: true,
        disabled: false,
        href: bookingPaymentUrl,
        hrefTarget: "_blank" as "_blank" | undefined,
      };
    }
    return {
      label: "Thanh toán chưa khả dụng",
      asChild: false,
      disabled: true,
      href: null,
      hrefTarget: undefined,
    };
  })();

  const renderPaymentButton = () => {
    if (paymentButtonConfig.asChild && paymentButtonConfig.href) {
      return (
        <Button asChild disabled={paymentButtonConfig.disabled}>
          <a
            href={paymentButtonConfig.href}
            target={paymentButtonConfig.hrefTarget}
            rel="noopener noreferrer"
          >
            {paymentButtonConfig.label}
          </a>
        </Button>
      );
    }
    return (
      <Button disabled={paymentButtonConfig.disabled}>{paymentButtonConfig.label}</Button>
    );
  };

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
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/bookings")}>
                  Quay lại danh sách
                </Button>
                {renderPaymentButton()}
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
                          <TableCell>{formatCurrency(payment.amount, payment.currency ?? "VND")}</TableCell>
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
                              const paymentUrl = extractPaymentUrl(payment) ?? bookingPaymentUrl;
                              const statusNormalized = (payment.status ?? "").toLowerCase();
                              const isPaid =
                                statusNormalized === "paid" ||
                                statusNormalized === "success" ||
                                statusNormalized === "completed";
                              if (!isPaid && paymentUrl) {
                                return (
                                  <Button asChild size="sm">
                                    <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                                      Thanh toán
                                    </a>
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

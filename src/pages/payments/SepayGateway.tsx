import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import CheckoutProgress, { type CheckoutStep } from "@/components/checkout/CheckoutProgress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  fetchBookingDetail,
  fetchBookingPaymentStatus,
  type Booking,
  type BookingPaymentStatusResponse,
} from "@/services/bookingApi";
import {
  resolveBookingPayableAmount,
  resolveBookingPaymentUrl,
  resolvePaymentFinalAmount,
} from "@/lib/payment-utils";
import { deduceSepayQrImage, deriveQrFromPaymentUrl, extractSepayQrFromBooking } from "@/lib/sepay";

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

const normalizeStatus = (status?: string | null) =>
  (status ?? "").toString().trim().toLowerCase();

const SUCCESS_STATUSES = new Set(["success", "paid", "completed"]);
const PENDING_STATUSES = new Set(["pending", "processing", "waiting"]);
const resolvePaymentStatus = (payload?: BookingPaymentStatusResponse | null): string => {
  if (!payload) return "";
  const candidates = [
    payload?.status,
    payload?.payment?.status,
    (payload as Record<string, unknown>)?.payment_status,
    (payload as Record<string, unknown>)?.booking_status,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeStatus(candidate);
    if (normalized) return normalized;
  }
  return "";
};
const MAX_POLLING_DURATION = 2 * 60 * 1000;

const SepayGatewaySkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-24 w-full rounded-2xl" />
    <Skeleton className="h-72 w-full rounded-2xl" />
  </div>
);

const buildSteps = (): CheckoutStep[] => [
  { id: "select", label: "Chọn đơn hàng", status: "complete" },
  { id: "info", label: "Điền thông tin", status: "complete" },
  { id: "pay", label: "Thanh toán", status: "current" },
];

const SepayGateway = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingIdParam = searchParams.get("bookingId");
  const orderCodeParam = searchParams.get("orderCode");
  const paymentIdParam = searchParams.get("paymentId");
  const bookingCodeParam = searchParams.get("bookingCode");
  const paymentUrlParam = searchParams.get("paymentUrl");

  const bookingId = bookingIdParam ?? "";

  const {
    data: booking,
    isLoading: isBookingLoading,
    isError: isBookingError,
    error: bookingError,
  } = useQuery<Booking>({
    queryKey: ["booking-detail", bookingId],
    queryFn: () => fetchBookingDetail(String(bookingId)),
    enabled: Boolean(bookingId),
    staleTime: 30_000,
  });

  const [pollingStopped, setPollingStopped] = useState(false);
  const pollStartRef = useRef<number | null>(null);

  const {
    data: paymentStatus,
    isFetching: isPaymentStatusFetching,
  } = useQuery<BookingPaymentStatusResponse>({
    queryKey: ["booking-payment-status", bookingId],
    queryFn: () => fetchBookingPaymentStatus(String(bookingId)),
    enabled: Boolean(bookingId) && !pollingStopped,
    refetchInterval: pollingStopped ? false : 4000,
  });

  useEffect(() => {
    if (!bookingId || pollingStopped) return;
    if (!pollStartRef.current) {
      pollStartRef.current = Date.now();
    }
    const normalized = resolvePaymentStatus(paymentStatus);
    if (SUCCESS_STATUSES.has(normalized) || normalized === "failed") {
      setPollingStopped(true);
      return;
    }
    const now = Date.now();
    if (pollStartRef.current && now - pollStartRef.current >= MAX_POLLING_DURATION) {
      setPollingStopped(true);
    }
  }, [bookingId, paymentStatus, pollingStopped]);

  const normalizedPaymentStatus = resolvePaymentStatus(paymentStatus);
  const isPaid = SUCCESS_STATUSES.has(normalizedPaymentStatus);
  const isFailed = normalizedPaymentStatus === "failed";
  const hasTimedOut = pollingStopped && !isPaid && !isFailed;
  const paidAtRaw =
    paymentStatus?.payment && typeof paymentStatus.payment === "object"
      ? (paymentStatus.payment as Record<string, unknown>).paid_at
      : null;
  const paidAtLabel =
    typeof paidAtRaw === "string" && paidAtRaw
      ? new Date(paidAtRaw).toLocaleString("vi-VN")
      : null;

  const paymentUrl = useMemo(() => {
    if (paymentUrlParam) return paymentUrlParam;
    const paymentRecord =
      paymentStatus?.payment && typeof paymentStatus.payment === "object"
        ? (paymentStatus.payment as Record<string, unknown>)
        : null;
    const directUrl =
      paymentRecord && typeof paymentRecord.payment_url === "string"
        ? paymentRecord.payment_url.trim()
        : null;
    if (directUrl) {
      return directUrl;
    }
    return resolveBookingPaymentUrl(booking);
  }, [booking, paymentStatus?.payment, paymentUrlParam]);

  const qrImage = useMemo(() => {
    const fromStatus = deduceSepayQrImage(paymentStatus?.payment);
    if (fromStatus) return fromStatus;
    const fromBooking = extractSepayQrFromBooking(booking);
    if (fromBooking) return fromBooking;
    const fromParam = deriveQrFromPaymentUrl(paymentUrl);
    if (fromParam) return fromParam;
    if (paymentUrl) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(paymentUrl)}`;
    }
    return null;
  }, [booking, paymentStatus?.payment, paymentUrl]);

  const isDirectImagePayment = useMemo(() => {
    if (!qrImage || !paymentUrl) return false;
    return qrImage === paymentUrl;
  }, [paymentUrl, qrImage]);

  const amount = useMemo(() => {
    const bookingAmount = resolveBookingPayableAmount(booking);
    if (typeof bookingAmount === "number") return bookingAmount;
    const paymentAmount = resolvePaymentFinalAmount(paymentStatus?.payment);
    if (typeof paymentAmount === "number") return paymentAmount;
    if (typeof booking?.total_price === "number") return booking.total_price;
    if (typeof booking?.total_amount === "number") return booking.total_amount;
    if (typeof paymentStatus?.payment?.amount === "number") return paymentStatus.payment.amount;
    return null;
  }, [booking, paymentStatus?.payment]);

  const currency = useMemo(() => {
    const raw =
      (booking?.currency && booking.currency.trim()) ||
      (paymentStatus?.payment &&
        typeof paymentStatus.payment === "object" &&
        (paymentStatus.payment as Record<string, unknown>).currency?.toString()) ||
      "VND";
    return (raw ?? "VND").toString().trim().toUpperCase() || "VND";
  }, [booking?.currency, paymentStatus?.payment]);

  const providerName = useMemo(() => {
    if (booking?.tour?.partner?.company_name) {
      return booking.tour.partner.company_name;
    }
    return "Trip Curate";
  }, [booking?.tour?.partner?.company_name]);

  const statusLabel = (() => {
    if (SUCCESS_STATUSES.has(normalizedPaymentStatus)) return "Thanh toán thành công";
    if (PENDING_STATUSES.has(normalizedPaymentStatus)) return "Đang chờ thanh toán";
    if (normalizedPaymentStatus === "failed") return "Thanh toán thất bại";
    if (normalizedPaymentStatus === "refunded") return "Đã hoàn tiền";
    return "Chờ cập nhật";
  })();

  const steps = useMemo(buildSteps, []);

  const handleOpenPaymentUrl = () => {
    if (!paymentUrl) return;
    window.open(paymentUrl, "_blank", "noopener,noreferrer");
  };

  const bookingCode = bookingCodeParam ?? booking?.code ?? booking?.id ?? orderCodeParam ?? "Đang cập nhật";
  const orderCode = orderCodeParam ?? paymentStatus?.payment?.order_code ?? bookingCode;

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <TravelHeader />
      <main className="relative flex-1 bg-gradient-to-b from-muted/40 via-transparent to-transparent">
        {isPaid && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="pointer-events-auto max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="mt-4 text-xl font-semibold text-emerald-700">Thanh toán thành công</p>
              <p className="text-sm text-muted-foreground">
                Chúng tôi đã ghi nhận giao dịch và đang chuyển bạn tới trang booking.
              </p>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-10 space-y-8">
          <CheckoutProgress steps={steps} />

          {!bookingId ? (
            <Alert variant="destructive">
              <AlertTitle>Thiếu thông tin booking</AlertTitle>
              <AlertDescription>Đường dẫn không chứa mã booking hợp lệ.</AlertDescription>
            </Alert>
          ) : isBookingLoading ? (
            <SepayGatewaySkeleton />
          ) : isBookingError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể tải dữ liệu booking</AlertTitle>
              <AlertDescription>
                {bookingError instanceof Error ? bookingError.message : "Vui lòng thử lại sau."}
              </AlertDescription>
            </Alert>
          ) : !booking ? (
            <Alert>
              <AlertTitle>Booking đang cập nhật</AlertTitle>
              <AlertDescription>Chúng tôi chưa tìm thấy thông tin booking này.</AlertDescription>
            </Alert>
          ) : (
            <>
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
                      Sử dụng ứng dụng ngân hàng hỗ trợ VietQR hoặc SePay để hoàn tất giao dịch.
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-10 bg-white py-10 lg:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Thông tin đơn hàng</h2>
                      <p className="text-sm text-muted-foreground">
                        Vui lòng kiểm tra thông tin trước khi thanh toán. Bạn sẽ được chuyển về trang booking ngay khi
                        giao dịch thành công.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
                      <dl className="space-y-4">
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Số tiền thanh toán</dt>
                          <dd className="text-lg font-semibold text-foreground">
                            {formatCurrency(amount, currency)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Giá trị đơn hàng</dt>
                          <dd className="font-medium text-foreground">{formatCurrency(amount, currency)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Phí giao dịch</dt>
                          <dd className="font-medium text-foreground">
                            {formatCurrency(0, currency)}
                          </dd>
                        </div>
                      </dl>

                      <Separator className="my-4" />

                      <dl className="space-y-4">
                        <div className="flex items-center justify-between">
                          <dt>Mã đơn hàng</dt>
                          <dd className="font-medium text-foreground">{bookingCode}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Mã giao dịch</dt>
                          <dd className="font-medium text-foreground">{orderCode ?? "Đang cập nhật"}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Nhà cung cấp</dt>
                          <dd className="font-medium text-foreground">{providerName}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground shadow-sm">
                      <p>
                        Tour:{" "}
                        <span className="font-medium text-foreground">
                          {booking.tour?.title ?? booking.tour?.name ?? "Đang cập nhật"}
                        </span>
                      </p>
                      {booking.schedule?.start_date && (
                        <p>
                          Khởi hành:{" "}
                          <span className="font-medium text-foreground">
                            {new Date(booking.schedule.start_date).toLocaleDateString("vi-VN")}
                          </span>
                        </p>
                      )}
                      <p>
                        Số lượng:{" "}
                        <span className="font-medium text-foreground">
                          {(booking.adults ?? booking.total_adults ?? 0) || 0} người lớn
                          {booking.children || booking.total_children
                            ? `, ${(booking.children ?? booking.total_children) || 0} trẻ em`
                            : ""}
                        </span>
                      </p>
                      {booking.package?.name && (
                        <p>
                          Gói dịch vụ:{" "}
                          <span className="font-medium text-foreground">{booking.package.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-5">
                    {isPaid ? (
                      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
                        <CheckCircle2 className="h-12 w-12" />
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-emerald-900">Thanh toán SePay đã hoàn tất</p>
                          <p className="text-sm">
                            {paidAtLabel ? `Được xác nhận lúc ${paidAtLabel}.` : "Chúng tôi đã ghi nhận giao dịch thành công."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button onClick={() => navigate(`/bookings/${bookingId}`)}>Xem booking của bạn</Button>
                          <Button variant="outline" onClick={() => navigate("/")}>
                            Về trang chủ
                          </Button>
                        </div>
                      </div>
                    ) : isFailed ? (
                      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
                        <XCircle className="h-12 w-12" />
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-red-800">Thanh toán chưa thành công</p>
                          <p className="text-sm text-red-700">
                            Chúng tôi không nhận được xác nhận từ ngân hàng. Bạn có thể quét lại QR hoặc mở lại trang thanh
                            toán để thử lại.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            className="bg-[#ff5b00] text-white hover:bg-[#e24c00]"
                            onClick={() => {
                              handleOpenPaymentUrl();
                              pollStartRef.current = Date.now();
                              setPollingStopped(false);
                            }}
                            disabled={!paymentUrl}
                          >
                            Mở lại trang thanh toán
                          </Button>
                          <Button variant="outline" onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : "/")}>
                            Quay lại
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                          {qrImage ? (
                            <img
                              src={qrImage}
                              alt="QR thanh toán SePay"
                              className="h-auto w-full rounded-xl object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-60 w-full items-center justify-center rounded-xl border border-dashed border-[#1d4ed8]/40 bg-muted/30 px-6 text-xs text-muted-foreground">
                              Hiện chưa có mã QR. Vui lòng chọn mở trang thanh toán.
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
                          {!isDirectImagePayment && (
                            <Button
                              size="lg"
                              className="w-full bg-[#ff5b00] text-white hover:bg-[#e24c00]"
                              onClick={() => {
                                handleOpenPaymentUrl();
                                pollStartRef.current = Date.now();
                                setPollingStopped(false);
                              }}
                              disabled={!paymentUrl}
                            >
                              Mở trang thanh toán
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="w-full border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                            onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : "/")}
                          >
                            Hủy thanh toán
                          </Button>
                          {hasTimedOut && (
                            <Button
                              variant="ghost"
                              className="w-full text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                pollStartRef.current = Date.now();
                                setPollingStopped(false);
                              }}
                            >
                              Làm mới trạng thái giao dịch
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
                          <span>Trạng thái: {statusLabel}</span>
                          {isPaymentStatusFetching && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Đang cập nhật từ ngân hàng...
                            </span>
                          )}
                          <span>
                            Chúng tôi sẽ hiển thị kết quả ngay tại đây khi nhận được phản hồi từ SePay. Bạn có thể tiếp tục
                            mở lại trang thanh toán nếu cần.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-center gap-3 border-t bg-white py-6 sm:flex-row sm:justify-center">
                  {bookingId && (
                    <Button onClick={() => navigate(`/bookings/${bookingId}`)} variant="outline">
                      Xem booking của bạn
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => navigate("/")}>
                    Về trang chủ
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SepayGateway;

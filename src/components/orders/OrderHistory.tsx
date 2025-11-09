import { Link } from "react-router-dom";
import { Calendar, Clock, CreditCard, ExternalLink, FileText, MapPin, RefreshCw, Wallet } from "lucide-react";

import { useOrderHistory } from "@/hooks/useOrderHistory";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { Booking } from "@/services/bookingApi";

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
    default:
      return status ?? "Đang cập nhật";
  }
};

const paymentStatusLabel = (status?: string) => {
  switch (status) {
    case "success":
    case "paid":
      return "Đã thanh toán";
    case "pending":
      return "Đang chờ";
    case "failed":
      return "Thất bại";
    default:
      return status ?? "Đang cập nhật";
  }
};

const refundStatusLabel = (status?: string) => {
  switch (status) {
    case "await_customer_confirm":
      return "Chờ xác nhận";
    case "completed":
      return "Đã hoàn tất";
    case "rejected":
      return "Đã từ chối";
    case "pending":
    case "await_partner":
      return "Đang xử lý";
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

const formatDate = (value?: string | null) => {
  if (!value) return "Đang cập nhật";
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

const OrderHistorySkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

interface OrderHistoryProps {
  title?: string;
  limit?: number;
  emptyMessage?: string;
}

const OrderHistory = ({ title = "Đơn hàng gần đây", limit = 5, emptyMessage = "Bạn chưa có đơn đặt nào." }: OrderHistoryProps) => {
  const { currentUser } = useUser();
  const { data, isLoading, isError, error, refetch, isFetching } = useOrderHistory({ per_page: limit });

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Đăng nhập để xem lịch sử đơn hàng của bạn.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <OrderHistorySkeleton />
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Vui lòng thử lại sau.";
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải lịch sử đơn hàng</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{message}</span>
          <Button onClick={() => refetch()} size="sm" className="w-fit">
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const bookings = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Làm mới
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/bookings" className="inline-flex items-center gap-1">
              Xem tất cả
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => {
            const currency = booking.currency ?? "VND";
            const hasPayments = Array.isArray(booking.payments) && booking.payments.length > 0;
            const sepayPending =
              booking.payment_method === "sepay" &&
              booking.payment_status !== "paid" &&
              typeof booking.payment_url === "string" &&
              booking.payment_url.length > 0;
            const offlinePending =
              booking.payment_method === "offline" &&
              booking.status !== "completed" &&
              booking.status !== "cancelled";
            const showPaymentHistory = hasPayments || sepayPending || offlinePending;
            return (
              <Card key={booking.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {booking.tour?.title ?? booking.tour?.name ?? `Đơn #${booking.id}`}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Đặt lúc {formatDate(booking.booking_date ?? booking.booked_at ?? booking.created_at)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {booking.schedule?.start_date && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Khởi hành {formatDate(booking.schedule.start_date)}
                    </p>
                  )}
                  {booking.tour?.destination && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {booking.tour.destination}
                    </p>
                  )}
                  {(booking.total_price ?? booking.total_amount) != null && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      Tổng tiền:{" "}
                      <span className="font-medium">
                        {formatCurrency(
                          booking.total_price ?? booking.total_amount ?? 0,
                          currency,
                        )}
                      </span>
                    </p>
                  )}
                  {booking.payment_method && (
                    <p className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      Phương thức:{" "}
                      <span className="font-medium text-foreground">
                        {booking.payment_method === "sepay" ? "Thanh toán Sepay" : "Thanh toán trực tiếp"}
                      </span>
                    </p>
                  )}
                  {booking.payment_status && (
                    <p className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Trạng thái thanh toán:{" "}
                      <span className="font-medium text-foreground">{paymentStatusLabel(booking.payment_status)}</span>
                    </p>
                  )}
                  {Array.isArray(booking.refund_requests) && booking.refund_requests.length > 0 && (
                    <p className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      Hoàn tiền:{" "}
                      <span className="font-medium text-foreground">
                        {refundStatusLabel(
                          booking.refund_requests[booking.refund_requests.length - 1]?.status,
                        )}
                      </span>
                    </p>
                  )}
                  {booking.invoice && (
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Button
                        asChild
                        variant="link"
                        className="px-0 text-sm font-medium"
                      >
                        <a
                          href={booking.invoice.file_url ?? `/bookings/${booking.id}`}
                          target={booking.invoice.file_url ? "_blank" : "_self"}
                          rel="noreferrer"
                        >
                          {booking.invoice.file_url ? "Tải hóa đơn" : "Xem hóa đơn"}
                        </a>
                      </Button>
                    </p>
                  )}
                  {showPaymentHistory && (
                    <div className="rounded-lg border border-muted p-3 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Lịch sử thanh toán
                      </p>
                      {hasPayments ? (
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
                            {booking.payments?.map((payment, index) => (
                              <TableRow key={payment.id ?? index}>
                                <TableCell className="font-medium text-foreground">
                                  {payment.order_code ?? payment.transaction_id ?? "—"}
                                </TableCell>
                                <TableCell>{formatCurrency(payment.amount, payment.currency ?? currency)}</TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(payment.status)}>{paymentStatusLabel(payment.status)}</Badge>
                                </TableCell>
                                <TableCell>{formatDate(payment.paid_at ?? payment.updated_at ?? "")}</TableCell>
                                <TableCell className="text-right">
                                  {payment.status !== "paid" && sepayPending ? (
                                    <Button asChild size="sm">
                                      <a href={booking.payment_url ?? "#"} target="_blank" rel="noopener noreferrer">
                                        Thanh toán ngay
                                      </a>
                                    </Button>
                                  ) : payment.status !== "paid" && offlinePending ? (
                                    <Button asChild size="sm" variant="outline">
                                      <Link to={`/bookings/${booking.id}`}>Cập nhật</Link>
                                    </Button>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                          <p>Chưa có giao dịch thanh toán được ghi nhận.</p>
                          {sepayPending ? (
                            <Button asChild size="sm">
                              <a href={booking.payment_url ?? "#"} target="_blank" rel="noopener noreferrer">
                                Thanh toán ngay
                              </a>
                            </Button>
                          ) : offlinePending ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/bookings/${booking.id}`}>Cập nhật thanh toán</Link>
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

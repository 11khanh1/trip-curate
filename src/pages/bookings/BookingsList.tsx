import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Clock, MapPin, Ticket, Users, Phone } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchBookings, cancelBooking, type Booking, type BookingListResponse } from "@/services/bookingApi";
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

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: (response) => {
      toast({
        title: "Đã hủy booking",
        description: response?.message ?? "Đơn của bạn đã được hủy thành công.",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Không thể hủy booking",
        description:
          error instanceof Error ? error.message : "Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.",
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
    keepPreviousData: true,
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
              const bookingTotal = booking.total_amount ?? booking.total_price ?? null;
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
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {bookingTotal !== null
                          ? formatCurrency(bookingTotal, booking.currency ?? "VND")
                          : "Đang cập nhật"}
                      </p>
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
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
      <Footer />
    </div>
  );
};

export default BookingsList;

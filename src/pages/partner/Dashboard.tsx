import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
  RefreshCcw,
  Tag,
  Rocket,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/admin/StatCard";
import { fetchPartnerDashboard, type PartnerDashboardResponse } from "@/services/partnerApi";
import { format } from "date-fns";

const RANGE_OPTIONS = [7, 30, 60, 90, 180];

const formatCurrency = (value?: number | null, currency = "VND") => {
  if (typeof value !== "number") return "—";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString("vi-VN")} ${currency}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "dd/MM/yyyy");
};

const bookingStatusLabel = (status?: string | null) => {
  if (!status) return "Khác";
  switch (status.toLowerCase()) {
    case "pending":
      return "Chờ xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
    case "canceled":
      return "Đã hủy";
    default:
      return status;
  }
};

const paymentStatusLabel = (status?: string | null) => {
  if (!status) return "—";
  switch (status.toLowerCase()) {
    case "paid":
    case "success":
      return "Đã thanh toán";
    case "pending":
      return "Chờ thanh toán";
    case "failed":
      return "Thanh toán thất bại";
    case "refunded":
      return "Đã hoàn tiền";
    default:
      return status;
  }
};

const RevenueTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload as { date: string; revenue: number; bookings: number };
  return (
    <div className="rounded-lg border bg-white p-3 shadow">
      <p className="text-xs text-muted-foreground">{formatDate(data.date)}</p>
      <p className="text-sm font-semibold text-primary">{formatCurrency(data.revenue)}</p>
      <p className="text-xs text-muted-foreground">{data.bookings} đơn đặt</p>
    </div>
  );
};

const LoadingDashboard = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-1 h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={idx} className="h-32 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  </div>
);

const PartnerDashboard = () => {
  const [range, setRange] = useState("30");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<PartnerDashboardResponse>({
    queryKey: ["partner-dashboard", range],
    queryFn: () => fetchPartnerDashboard(Number(range)),
    refetchOnWindowFocus: false,
  });

  const stats = useMemo(
    () => ({
      toursTotal: data?.totals?.tours?.total ?? 0,
      toursApproved: data?.totals?.tours?.approved ?? 0,
      toursPending: data?.totals?.tours?.pending ?? 0,
      activePromotions: data?.totals?.active_promotions ?? 0,
      totalBookings: data?.totals?.bookings ?? 0,
    }),
    [data],
  );

  if (isLoading) {
    return <LoadingDashboard />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-semibold text-foreground">Không thể tải dữ liệu dashboard</p>
          <p className="text-sm text-muted-foreground">Vui lòng thử lại sau hoặc làm mới trang.</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 p-[1px] shadow-xl">
        <div className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-6 text-slate-900 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
              <Rocket className="h-4 w-4 text-orange-600" />
              Partner Pulse
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Tổng quan kinh doanh</h1>
            <p className="text-sm text-muted-foreground">
              Phạm vi: {data.range_days ?? Number(range)} ngày gần nhất • Cập nhật real-time
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                <ShieldCheck className="h-3.5 w-3.5" /> SLA ưu tiên đối tác
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                <TrendingUp className="h-3.5 w-3.5" /> Theo dõi tăng trưởng
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-32 bg-white text-slate-900 border-orange-200">
                <SelectValue placeholder="Phạm vi" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} ngày
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Tổng số tour" value={stats.toursTotal} icon={Package} gradient />
        <StatCard title="Tour đã duyệt" value={stats.toursApproved} icon={CheckCircle2} />
        <StatCard title="Tour chờ duyệt" value={stats.toursPending} icon={Calendar} />
        <StatCard title="Khuyến mãi đang bật" value={stats.activePromotions} icon={Tag} />
        <StatCard title="Tổng đơn đặt" value={stats.totalBookings} icon={DollarSign} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border border-slate-200/70 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Doanh thu theo ngày</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tổng: {formatCurrency(data.revenue?.overall)} • Phạm vi: {formatCurrency(data.revenue?.range)}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {data.revenue?.daily && data.revenue.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue.daily}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd/MM")}
                    tick={{ fontSize: 12 }}
                    dy={8}
                  />
                  <RechartsTooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Không có dữ liệu doanh thu trong phạm vi này.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Đơn đặt (theo phạm vi)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {data.bookings?.range?.bookings ?? 0} đơn • {data.bookings?.range?.paid_bookings ?? 0} đã thanh toán
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bookings?.by_status && Object.keys(data.bookings.by_status).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.bookings.by_status).map(([status, count]) => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {bookingStatusLabel(status)}:{" "}
                    <span className="ml-1 font-semibold text-foreground">{count}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu đơn hàng.</p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Tỉ lệ thanh toán</p>
                <p className="text-lg font-semibold text-foreground">
                  {data.bookings?.range?.bookings
                    ? Math.round(
                        ((data.bookings?.range?.paid_bookings ?? 0) / Math.max(data.bookings.range.bookings, 1)) * 100,
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(data.revenue?.range)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lịch khởi hành sắp tới</CardTitle>
              <span className="text-xs text-muted-foreground">Tối đa 6 lịch</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcoming_departures && data.upcoming_departures.length > 0 ? (
              data.upcoming_departures.map((departure) => (
                <div
                  key={departure.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">{departure.tour_title ?? "Tour chưa đặt tên"}</p>
                    <p className="text-sm text-muted-foreground">Khởi hành: {formatDate(departure.start_date)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      Số chỗ:{" "}
                      <span className="font-semibold text-foreground">
                        {departure.seats_available ?? "—"}/{departure.seats_total ?? "—"}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Đã đặt: {departure.booked_passengers ?? "—"} khách
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Hiện chưa có lịch khởi hành nào.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Đơn đặt gần đây</CardTitle>
              <span className="text-xs text-muted-foreground">5 đơn mới nhất</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recent_bookings && data.recent_bookings.length > 0 ? (
              data.recent_bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {booking.tour?.title ?? booking.tour?.name ?? "Tour chưa đặt tên"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      KH: {booking.customer_name ?? "Khách lẻ"} • Mã: {booking.id}
                    </p>
                  </div>
                  <div className="text-right text-sm space-y-1">
                    <p className="font-semibold text-primary">{formatCurrency(booking.total_price)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(booking.booking_date)}</p>
                    <div className="flex justify-end gap-2">
                      <Badge variant="secondary">{bookingStatusLabel(booking.status)}</Badge>
                      <Badge variant="outline">{paymentStatusLabel(booking.payment_status)}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có đơn đặt nào trong phạm vi này.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerDashboard;

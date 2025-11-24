import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import { Briefcase, Loader2, Plane, RefreshCcw, TrendingUp, Users } from "lucide-react";
import { endOfYear, format, startOfMonth, startOfYear, subMonths, subYears } from "date-fns";

import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminReportSummary,
  type AdminReportMonthlyBooking,
  type AdminReportMonthlyRevenue,
  type AdminReportQueryParams,
  type AdminReportSummary,
  type AdminReportTopPartner,
} from "@/services/adminApi";

type RangeKey = "default" | "6m" | "ytd" | "last_year";

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "default", label: "12 tháng gần nhất" },
  { value: "6m", label: "6 tháng gần nhất" },
  { value: "ytd", label: "Từ đầu năm" },
  { value: "last_year", label: "Năm trước" },
];

type RevenuePoint = { month: string; monthLabel: string; revenue: number };
type BookingPoint = { month: string; monthLabel: string; count: number };

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const parseNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value: number) => value.toLocaleString("vi-VN");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatMonthLabel = (month: string) => {
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  return format(parsed, "MM/yyyy");
};

const formatDateLabel = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "dd/MM/yyyy");
};

const resolveErrorMessage = (err: unknown): string | undefined => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message;
  }
  return undefined;
};

const buildRangeParams = (key: RangeKey): AdminReportQueryParams => {
  const today = new Date();
  const to = format(today, "yyyy-MM-dd");
  if (key === "6m") {
    const fromDate = startOfMonth(subMonths(today, 5));
    return { from: format(fromDate, "yyyy-MM-dd"), to };
  }
  if (key === "ytd") {
    const fromDate = startOfYear(today);
    return { from: format(fromDate, "yyyy-MM-dd"), to };
  }
  if (key === "last_year") {
    const lastYear = subYears(today, 1);
    const fromDate = startOfYear(lastYear);
    const toDate = endOfYear(lastYear);
    return { from: format(fromDate, "yyyy-MM-dd"), to: format(toDate, "yyyy-MM-dd") };
  }
  return {};
};

const RevenueTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RevenuePoint }>;
}) => {
  const dataPoint = payload?.[0]?.payload;
  if (!active || !dataPoint) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow">
      <p className="text-xs text-muted-foreground">{dataPoint.monthLabel}</p>
      <p className="text-sm font-semibold text-primary">{formatCurrency(dataPoint.revenue)}</p>
    </div>
  );
};

const BookingsTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BookingPoint }>;
}) => {
  const dataPoint = payload?.[0]?.payload;
  if (!active || !dataPoint) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow">
      <p className="text-xs text-muted-foreground">{dataPoint.monthLabel}</p>
      <p className="text-sm font-semibold text-foreground">{formatNumber(dataPoint.count)} đơn</p>
    </div>
  );
};

export default function Dashboard() {
  const { toast } = useToast();
  const [rangeKey, setRangeKey] = useState<RangeKey>("default");
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const rangeParams = useMemo(() => buildRangeParams(rangeKey), [rangeKey]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<AdminReportSummary>({
    queryKey: ["admin-report-summary", rangeParams.from ?? null, rangeParams.to ?? null],
    queryFn: () => fetchAdminReportSummary(rangeParams),
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error) {
      console.error("Fetch admin report summary failed:", error);
      const description = resolveErrorMessage(error) || "Vui lòng thử lại sau.";
      toast({
        title: "Không thể tải dữ liệu báo cáo",
        description,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const summary: AdminReportSummary = data ?? {};
  const metrics = summary.metrics ?? {};

  const revenueTotal = parseNumber(metrics.revenue_total);
  const bookingsTotal = parseNumber(metrics.bookings_total);
  const newCustomers = parseNumber(metrics.new_customers);
  const partnersTotal = parseNumber(metrics.partners_total);
  const partnersActive = parseNumber(metrics.partners_active);
  const partnersNew = parseNumber(metrics.partners_new);

  const revenueMonthly = useMemo<RevenuePoint[]>(() => {
    const list = asArray<AdminReportMonthlyRevenue>(summary.revenue_monthly ?? metrics.revenue_monthly);
    return list
      .map((item) => ({
        month: item.month,
        monthLabel: item.month ? formatMonthLabel(item.month) : "",
        revenue: parseNumber(item.revenue),
      }))
      .filter((item) => item.month);
  }, [metrics.revenue_monthly, summary.revenue_monthly]);

  const bookingsMonthly = useMemo<BookingPoint[]>(() => {
    const list = asArray<AdminReportMonthlyBooking>(summary.bookings_monthly ?? metrics.bookings_monthly);
    return list
      .map((item) => ({
        month: item.month,
        monthLabel: item.month ? formatMonthLabel(item.month) : "",
        count: parseNumber(item.count),
      }))
      .filter((item) => item.month);
  }, [metrics.bookings_monthly, summary.bookings_monthly]);

  const topPartners = useMemo(() => {
    const list = asArray<AdminReportTopPartner>(summary.top_partners ?? metrics.top_partners);
    return list.map((item, index) => ({
      id: item.id ?? index,
      name: item.name ?? item.company_name ?? `Đối tác #${index + 1}`,
      revenue: parseNumber(item.revenue),
      bookings: parseNumber(item.bookings_count),
    }));
  }, [metrics.top_partners, summary.top_partners]);

  const periodLabel = useMemo(() => {
    if (summary.period?.from || summary.period?.to) {
      const from = formatDateLabel(summary.period?.from);
      const to = formatDateLabel(summary.period?.to);
      if (from && to) return `${from} - ${to}`;
      return from || to || RANGE_OPTIONS.find((opt) => opt.value === rangeKey)?.label;
    }
    return RANGE_OPTIONS.find((opt) => opt.value === rangeKey)?.label;
  }, [rangeKey, summary.period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Thống kê {periodLabel?.toLowerCase() || "tổng quan hệ thống"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={rangeKey} onValueChange={(value) => setRangeKey(value as RangeKey)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Phạm vi" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu báo cáo...
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Doanh thu (kỳ)" value={formatCurrency(revenueTotal)} icon={TrendingUp} gradient />
        <StatCard title="Đơn đặt" value={formatNumber(bookingsTotal)} icon={Plane} />
        <StatCard title="Khách hàng mới" value={formatNumber(newCustomers)} icon={Users} />
        <StatCard
          title="Đối tác"
          value={formatNumber(partnersTotal)}
          icon={Briefcase}
          trend={{ value: `${formatNumber(partnersActive)} đang hoạt động`, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tổng quan hiệu suất</CardTitle>
            <CardDescription>Doanh thu và đơn đặt theo tháng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-64">
              {revenueMonthly.length === 0 ? (
                <EmptyState message="Chưa có dữ liệu doanh thu theo tháng." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueMonthly}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} dy={5} />
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
              )}
            </div>
            <div className="h-64">
              {bookingsMonthly.length === 0 ? (
                <EmptyState message="Chưa có dữ liệu đơn đặt theo tháng." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingsMonthly}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} dy={5} />
                    <RechartsTooltip content={<BookingsTooltip />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bảng điều phối nhanh</CardTitle>
            <CardDescription>Tóm tắt trạng thái hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickStat
              title="Đối tác đang hoạt động"
              description="Đã được phê duyệt"
              value={`${formatNumber(partnersActive)} đối tác`}
              tone="success"
            />
            <QuickStat
              title="Đối tác mới trong kỳ"
              description="Đăng ký mới"
              value={`${formatNumber(partnersNew)} đối tác`}
              tone="info"
            />
            <QuickStat
              title="Tổng đơn đặt"
              description="Trong phạm vi thời gian"
              value={`${formatNumber(bookingsTotal)} đơn`}
              tone="warning"
            />
            <QuickStat
              title="Doanh thu đã ghi nhận"
              description="Payments status=success, đã trừ giảm giá"
              value={formatCurrency(revenueTotal)}
              tone="primary"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top doanh thu đối tác</CardTitle>
          <CardDescription>Đối tác có doanh thu và số đơn cao nhất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topPartners.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu top đối tác." />
          ) : (
            topPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-muted/30"
              >
                <div>
                  <p className="font-semibold">{partner.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(partner.bookings)} đơn đặt
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{formatCurrency(partner.revenue)}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {formatNumber(partner.bookings)} đơn
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function QuickStat({
  title,
  description,
  value,
  tone,
}: {
  title: string;
  description: string;
  value: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : tone === "info"
      ? "bg-sky-100 text-sky-700"
      : "bg-primary/10 text-primary";
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

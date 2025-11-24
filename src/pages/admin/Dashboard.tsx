import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Plane, TrendingUp, Users, Clock, Sparkles, Loader2, Briefcase } from "lucide-react";
import { fetchAdminDashboard } from "@/services/adminApi";
import { useToast } from "@/hooks/use-toast";

const pickNumber = (source: Record<string, unknown> | undefined, keys: string[], fallback = 0) => {
  if (!source) return fallback;
  for (const key of keys) {
    if (key in source) {
      const value = Number(source[key] as number | string);
      if (!Number.isNaN(value)) return value;
    }
  }
  return fallback;
};

const formatNumber = (value: number) => value.toLocaleString("vi-VN");

export default function Dashboard() {
  const { toast } = useToast();
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (error) {
      console.error("Fetch admin dashboard failed:", error);
      toast({
        title: "Không thể tải dữ liệu dashboard",
        description: (error as any)?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const summary = (data as any) ?? {};

  const metrics = useMemo(() => {
    const users = summary.users ?? {};
    const partners = summary.partners ?? {};
    const bookings = summary.bookings ?? {};
    return {
      totalUsers: pickNumber(users, ["total"], 0),
      newUsers: pickNumber(users, ["new_last_7_days"], 0),
      totalPartners: pickNumber(partners, ["total"], 0),
      pendingPartners: pickNumber(partners, ["pending"], 0),
      totalBookings: pickNumber(bookings, ["total"], 0),
      bookingsLast30: pickNumber(bookings, ["last_30_days"], 0),
    };
  }, [summary]);

  const topPartners = useMemo(() => {
    const list = Array.isArray(summary.top_partners) ? summary.top_partners : [];
    return list.map((item: any, index: number) => ({
      id: item.id ?? index,
      name: item.company_name ?? `Đối tác #${index + 1}`,
      toursCount: item.tours_count ?? 0,
    }));
  }, [summary.top_partners]);

  const toursSummary = summary.tours ?? {};
  const bookingsSummary = summary.bookings ?? {};

  const kpis = useMemo(
    () => [
      {
        title: "Tour đang hoạt động",
        value: formatNumber(pickNumber(toursSummary, ["active"], 0)),
        note: `Tổng tour: ${formatNumber(pickNumber(toursSummary, ["total"], 0))}`,
      },
      {
        title: "Đơn đặt tổng",
        value: formatNumber(pickNumber(bookingsSummary, ["total"], 0)),
        note: `${formatNumber(pickNumber(bookingsSummary, ["last_30_days"], 0))} trong 30 ngày`,
      },
    ],
    [toursSummary, bookingsSummary],
  );

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu dashboard...
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng người dùng" value={formatNumber(metrics.totalUsers)} icon={Users} gradient />
        <StatCard title="Người dùng mới (7 ngày)" value={formatNumber(metrics.newUsers)} icon={Eye} />
        <StatCard title="Đối tác" value={formatNumber(metrics.totalPartners)} icon={Briefcase} />
        <StatCard title="Đơn đặt (30 ngày)" value={formatNumber(metrics.bookingsLast30)} icon={Plane} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tổng quan hiệu suất</CardTitle>
            <CardDescription>Số liệu thống kê 8 tuần gần nhất từ hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
              <TrendingUp className="mb-2 h-10 w-10 text-primary" />
              <p className="text-sm">Biểu đồ lưu lượng - đăng ký - đặt tour sẽ hiển thị ở đây</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bảng điều phối nhanh</CardTitle>
            <CardDescription>Trạng thái tổng quan của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Đối tác chờ duyệt</p>
                <p className="text-xs text-muted-foreground">Hồ sơ đang chờ phê duyệt</p>
              </div>
              <BadgeDisplay value={`${formatNumber(metrics.pendingPartners)} đối tác`} variant="primary" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Tour đang hoạt động</p>
                <p className="text-xs text-muted-foreground">Tour đã được phê duyệt</p>
              </div>
              <BadgeDisplay value={`${formatNumber(pickNumber(summary.tours, ["active"], 0))} tour`} variant="info" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Tổng đơn đặt</p>
                <p className="text-xs text-muted-foreground">Tính đến thời điểm hiện tại</p>
              </div>
              <BadgeDisplay value={`${formatNumber(metrics.totalBookings)} đơn`} variant="warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top đối tác theo số tour</CardTitle>
            <CardDescription>5 đối tác có số lượng tour nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPartners.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu đối tác nổi bật.
              </div>
            ) : (
              topPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-muted/30"
                >
                  <div>
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-xs text-muted-foreground">Tổng tour: {formatNumber(partner.toursCount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{formatNumber(partner.toursCount)}</p>
                    <p className="text-xs text-muted-foreground">tour đã tạo</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nguồn truy cập</CardTitle>
            <CardDescription>Đang chờ tích hợp số liệu marketing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPartners.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu truy cập.
              </div>
            ) : (
              topPartners.slice(0, 3).map((partner, index) => (
              <div
                key={partner.id}
                className="rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    Kênh #{index + 1}: {partner.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Ước lượng phiên truy cập đang cập nhật</p>
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hệ số vận hành chính</CardTitle>
          <CardDescription>Kiểm soát SLA và chất lượng dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item, index) => (
            <KpiItem
              key={index}
              icon={
                index % 2 === 0 ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )
              }
              title={item.title}
              value={item.value}
              note={item.note || ""}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiItem({ icon, title, value, note }: { icon: ReactNode; title: string; value: string; note: string }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function BadgeDisplay({ value, variant }: { value: string; variant: "primary" | "warning" | "info" }) {
  const style =
    variant === "primary"
      ? "bg-primary/10 text-primary"
      : variant === "warning"
      ? "bg-amber-100 text-amber-600"
      : "bg-sky-100 text-sky-600";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>{value}</span>;
}

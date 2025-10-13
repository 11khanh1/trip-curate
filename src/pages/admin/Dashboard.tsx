import type { ReactNode } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Plane, TrendingUp, Users, Activity, Clock, Globe2, Sparkles } from "lucide-react";

const recentBookings = [
  { name: "Nguyễn Văn A", tour: "Tour Hà Giang 3N2Đ", revenue: "₫5,600,000", time: "5 phút trước" },
  { name: "Trần Thị B", tour: "Combo Đà Nẵng - Hội An", revenue: "₫4,250,000", time: "12 phút trước" },
  { name: "Phạm Quốc C", tour: "Du thuyền Vịnh Hạ Long", revenue: "₫7,120,000", time: "30 phút trước" },
  { name: "Lê Mai D", tour: "Tour Singapore 4N3Đ", revenue: "₫12,340,000", time: "1 giờ trước" },
];

const trafficSources = [
  { channel: "Tìm kiếm tự nhiên", value: "8,420 phiên", change: "+12%" },
  { channel: "Quảng cáo trả phí", value: "5,310 phiên", change: "+8%" },
  { channel: "Đối tác liên kết", value: "2,240 phiên", change: "+4%" },
  { channel: "Mạng xã hội", value: "1,980 phiên", change: "+16%" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Lượt truy cập (24h)"
          value="18,420"
          icon={Eye}
          gradient
          trend={{ value: "+12% so với ngày hôm qua", isPositive: true }}
        />
        <StatCard
          title="Đăng ký mới"
          value="356"
          icon={Users}
          trend={{ value: "+42 tài khoản", isPositive: true }}
        />
        <StatCard
          title="Lượt đặt tour"
          value="1,842"
          icon={Plane}
          trend={{ value: "+221 lượt đặt", isPositive: true }}
        />
        <StatCard
          title="Tỷ lệ chuyển đổi"
          value="9.6%"
          icon={Activity}
          trend={{ value: "+0.8 điểm %", isPositive: true }}
        />
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
            <CardDescription>Tình trạng hoạt động trong ngày</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Đơn cần duyệt</p>
                <p className="text-xs text-muted-foreground">Khách hàng chờ xác nhận thanh toán</p>
              </div>
              <BadgeDisplay value="12 đơn" variant="primary" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Yêu cầu hỗ trợ</p>
                <p className="text-xs text-muted-foreground">Liên hệ mới trong trung tâm trợ giúp</p>
              </div>
              <BadgeDisplay value="7 ticket" variant="warning" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Đối tác chờ duyệt</p>
                <p className="text-xs text-muted-foreground">Hồ sơ cần kiểm tra và kích hoạt</p>
              </div>
              <BadgeDisplay value="3 đối tác" variant="info" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hoạt động đặt tour mới</CardTitle>
            <CardDescription>Danh sách cập nhật theo thời gian thực</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.tour}
                className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-muted/30"
              >
                <div>
                  <p className="font-semibold">{booking.name}</p>
                  <p className="text-xs text-muted-foreground">{booking.tour}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{booking.revenue}</p>
                  <p className="text-xs text-muted-foreground">{booking.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nguồn truy cập</CardTitle>
            <CardDescription>Top kênh mang lại khách truy cập</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trafficSources.map((source) => (
              <div key={source.channel} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{source.channel}</p>
                  <span className="text-xs text-green-600">{source.change}</span>
                </div>
                <p className="text-xs text-muted-foreground">{source.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hệ số vận hành chính</CardTitle>
          <CardDescription>Kiểm soát SLA và chất lượng dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiItem icon={<Clock className="h-5 w-5 text-primary" />} title="Thời gian phản hồi" value="12 phút" note="Avg. ticket 24h" />
          <KpiItem icon={<Globe2 className="h-5 w-5 text-primary" />} title="Thị trường hoạt động" value="12 quốc gia" note="Mở rộng 2 khu vực mới" />
          <KpiItem icon={<Sparkles className="h-5 w-5 text-primary" />} title="Điểm hài lòng" value="4.7 / 5" note="Theo phản hồi khách" />
          <KpiItem icon={<Activity className="h-5 w-5 text-primary" />} title="Tỷ lệ hoàn tất" value="96%" note="Hoàn tất booking thành công" />
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

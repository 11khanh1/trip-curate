import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";
import { BarChart3, ShoppingBag, Users, Wallet } from "lucide-react";

const performance = [
  { label: "Doanh thu", value: "₫12.4 tỷ", change: "+18% MoM", positive: true },
  { label: "Đơn đặt thành công", value: "1.842", change: "+11% MoM", positive: true },
  { label: "Tỷ lệ hủy", value: "4.2%", change: "-2% MoM", positive: true },
  { label: "Khách hàng quay lại", value: "38%", change: "+6% MoM", positive: true },
];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Báo cáo kinh doanh</h2>
          <p className="text-sm text-muted-foreground">
            Tổng hợp số liệu từ hệ thống theo thời gian thực
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">30 ngày gần nhất</Button>
          <Button variant="outline">Tùy chọn thời gian</Button>
          <Button>Xuất file PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu thuần"
          value="₫12.4 tỷ"
          icon={Wallet}
          gradient
          trend={{ value: "+18% so với kỳ trước", isPositive: true }}
        />
        <StatCard
          title="Đơn đặt tour"
          value="1.842"
          icon={ShoppingBag}
          trend={{ value: "+221 lượt", isPositive: true }}
        />
        <StatCard
          title="Khách hàng mới"
          value="356"
          icon={Users}
          trend={{ value: "+42 khách hàng", isPositive: true }}
        />
        <StatCard
          title="Đối tác đang hoạt động"
          value="36"
          icon={BarChart3}
          trend={{ value: "+4 đối tác", isPositive: true }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
            <CardDescription>So sánh doanh thu từng tháng trong năm 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                Biểu đồ trực quan sẽ được tích hợp tại đây
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top nguồn doanh thu</CardTitle>
            <CardDescription>Đối tác và khu vực mang lại doanh thu cao nhất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "TravelGo Asia", revenue: "₫2.3 tỷ", tours: 112 },
              { name: "Indochina Heritage", revenue: "₫1.6 tỷ", tours: 84 },
              { name: "Oceanic Tours", revenue: "₫1.2 tỷ", tours: 63 },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.tours} tour hoàn tất</p>
                </div>
                <p className="font-medium text-primary">{item.revenue}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt chỉ số chính</CardTitle>
          <CardDescription>Đánh giá nhanh hiệu suất theo mùa vụ và kênh bán</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performance.map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
              <p className={`text-xs ${item.positive ? "text-green-600" : "text-red-600"}`}>{item.change}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

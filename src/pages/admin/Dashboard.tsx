import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, MapPin, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value="₫45,231,890"
          icon={DollarSign}
          gradient
          trend={{ value: "+20.1% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Đơn đặt mới"
          value="245"
          icon={Calendar}
          trend={{ value: "+12% so với tuần trước", isPositive: true }}
        />
        <StatCard
          title="Hoạt động"
          value="89"
          icon={MapPin}
          trend={{ value: "+3 hoạt động mới", isPositive: true }}
        />
        <StatCard
          title="Khách hàng"
          value="1,234"
          icon={Users}
          trend={{ value: "+15.3% so với tháng trước", isPositive: true }}
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>
              Biểu đồ doanh thu 12 tháng gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-primary" />
                <p>Biểu đồ sẽ được hiển thị ở đây</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Các đơn đặt mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Nguyễn Văn A", activity: "Vịnh Kỳ Diệu", amount: "₫765,000", time: "5 phút trước" },
                { name: "Trần Thị B", activity: "Đón tiễn sân bay", amount: "₫850,000", time: "15 phút trước" },
                { name: "Lê Văn C", activity: "Tour Phú Quốc", amount: "₫1,250,000", time: "1 giờ trước" },
                { name: "Phạm Thị D", activity: "Vinpearl Land", amount: "₫450,000", time: "2 giờ trước" },
              ].map((booking, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-white text-sm font-medium">
                    {booking.name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{booking.name}</p>
                    <p className="text-xs text-muted-foreground">{booking.activity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{booking.amount}</p>
                    <p className="text-xs text-muted-foreground">{booking.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động phổ biến</CardTitle>
          <CardDescription>Top hoạt động được đặt nhiều nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Dịch vụ đón tiễn sân bay", bookings: 1840, revenue: "₫28,520,000" },
              { name: "Vé Công Viên Nước Vịnh Kỳ Diệu", bookings: 1234, revenue: "₫18,750,000" },
              { name: "Tour Phú Quốc 3N2Đ", bookings: 987, revenue: "₫45,230,000" },
              { name: "Vinpearl Land Nha Trang", bookings: 856, revenue: "₫12,340,000" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">{activity.bookings} lượt đặt</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{activity.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

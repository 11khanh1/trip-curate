import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { MapPin, Calendar, DollarSign, TrendingUp } from "lucide-react";

export default function PartnerDashboard() {
  return (
    <div className="space-y-6">
      

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Hoạt động đang bán"
          value="12"
          icon={MapPin}
          gradient
        />
        <StatCard
          title="Đơn đặt tháng này"
          value="234"
          icon={Calendar}
          trend={{ value: "+12.5% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Doanh thu tháng này"
          value="₫45,600,000"
          icon={DollarSign}
          trend={{ value: "+8.2% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Tỷ lệ hoàn thành"
          value="98.5%"
          icon={TrendingUp}
          trend={{ value: "+2.1% so với tháng trước", isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đơn đặt gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "BK001", activity: "Tour Phố cổ Hà Nội", date: "15/03/2024", amount: "₫1,200,000", status: "Đã xác nhận" },
                { id: "BK002", activity: "Buffet Hải sản", date: "14/03/2024", amount: "₫850,000", status: "Hoàn thành" },
                { id: "BK003", activity: "Vé tham quan Bảo tàng", date: "14/03/2024", amount: "₫350,000", status: "Đã xác nhận" },
              ].map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{booking.activity}</p>
                    <p className="text-sm text-muted-foreground">Mã: {booking.id} • {booking.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{booking.amount}</p>
                    <p className="text-xs text-muted-foreground">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động hàng đầu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Tour Phố cổ Hà Nội", bookings: 45, revenue: "₫12,500,000" },
                { name: "Buffet Hải sản", bookings: 38, revenue: "₫9,800,000" },
                { name: "Vé tham quan Bảo tàng", bookings: 32, revenue: "₫5,200,000" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.bookings} đơn đặt</p>
                  </div>
                  <p className="font-semibold text-primary">{activity.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

export default function PartnerRevenue() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu tháng này"
          value="₫45,600,000"
          icon={DollarSign}
          gradient
          trend={{ value: "+8.2% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Tổng doanh thu"
          value="₫340,200,000"
          icon={TrendingUp}
        />
        <StatCard
          title="Đơn đặt tháng này"
          value="234"
          icon={Calendar}
          trend={{ value: "+12.5% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Chờ thanh toán"
          value="₫2,400,000"
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { month: "Tháng 3/2024", amount: "₫45,600,000", bookings: 234 },
                { month: "Tháng 2/2024", amount: "₫42,100,000", bookings: 215 },
                { month: "Tháng 1/2024", amount: "₫38,900,000", bookings: 198 },
                { month: "Tháng 12/2023", amount: "₫51,200,000", bookings: 267 },
              ].map((record) => (
                <div key={record.month} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{record.month}</p>
                    <p className="text-sm text-muted-foreground">{record.bookings} đơn đặt</p>
                  </div>
                  <p className="font-semibold text-primary">{record.amount}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Tour Phố cổ Hà Nội", amount: "₫15,750,000", percentage: "35%" },
                { name: "Buffet Hải sản", amount: "₫13,680,000", percentage: "30%" },
                { name: "Vé tham quan Bảo tàng", amount: "₫9,120,000", percentage: "20%" },
                { name: "Trải nghiệm làm gốm", amount: "₫7,050,000", percentage: "15%" },
              ].map((activity) => (
                <div key={activity.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{activity.name}</p>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{activity.amount}</p>
                      <p className="text-xs text-muted-foreground">{activity.percentage}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full"
                      style={{ width: activity.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

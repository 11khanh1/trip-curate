import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { Eye, Star, Users, TrendingUp } from "lucide-react";

export default function PartnerAnalytics() {
  return (
    <div className="space-y-6">
      

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Lượt xem tổng"
          value="12,456"
          icon={Eye}
          gradient
          trend={{ value: "+15.3% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Đánh giá trung bình"
          value="4.8"
          icon={Star}
          trend={{ value: "+0.2 điểm", isPositive: true }}
        />
        <StatCard
          title="Tỷ lệ chuyển đổi"
          value="18.5%"
          icon={Users}
          trend={{ value: "+2.1%", isPositive: true }}
        />
        <StatCard
          title="Tăng trưởng"
          value="+24%"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { customer: "Nguyễn Văn A", activity: "Tour Phố cổ", rating: 5, comment: "Trải nghiệm tuyệt vời!" },
                { customer: "Trần Thị B", activity: "Buffet Hải sản", rating: 5, comment: "Chất lượng tốt, giá hợp lý" },
                { customer: "Lê Văn C", activity: "Vé Bảo tàng", rating: 4, comment: "Hài lòng với dịch vụ" },
              ].map((review, index) => (
                <div key={index} className="py-3 border-b last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{review.customer}</p>
                      <p className="text-sm text-muted-foreground">{review.activity}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê lượt xem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { activity: "Tour Phố cổ Hà Nội", views: 3245, bookings: 45 },
                { activity: "Buffet Hải sản", views: 2890, bookings: 38 },
                { activity: "Vé tham quan Bảo tàng", views: 2134, bookings: 32 },
                { activity: "Trải nghiệm làm gốm", views: 1456, bookings: 12 },
              ].map((stat) => (
                <div key={stat.activity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{stat.activity}</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{stat.views} lượt xem</p>
                      <p className="text-xs text-muted-foreground">{stat.bookings} đặt chỗ</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full"
                      style={{ width: `${(stat.bookings / stat.views) * 100}%` }}
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

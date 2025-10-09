import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";

export default function Activities() {
  const activities = [
    {
      id: 1,
      name: "Dịch Vụ Đón Tiễn Ưu Tiên Tại Sân Bay Tân Sơn Nhất",
      location: "TP. Hồ Chí Minh",
      price: "₫765,000",
      status: "active",
      bookings: 1840,
    },
    {
      id: 2,
      name: "Vé Công Viên Nước Vịnh Kỳ Diệu",
      location: "Biên Hòa",
      price: "₫450,000",
      status: "active",
      bookings: 1234,
    },
    {
      id: 3,
      name: "Tour Phú Quốc 3 Ngày 2 Đêm",
      location: "Phú Quốc",
      price: "₫2,500,000",
      status: "active",
      bookings: 987,
    },
    {
      id: 4,
      name: "Vinpearl Land Nha Trang",
      location: "Nha Trang",
      price: "₫650,000",
      status: "inactive",
      bookings: 856,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Hoạt động</h1>
          <p className="text-muted-foreground">Quản lý các tour và hoạt động du lịch</p>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Thêm hoạt động
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách hoạt động</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm hoạt động..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{activity.name}</h3>
                    <Badge variant={activity.status === "active" ? "default" : "secondary"}>
                      {activity.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📍 {activity.location}</span>
                    <span>•</span>
                    <span>{activity.bookings} lượt đặt</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg text-primary">{activity.price}</p>
                    <p className="text-xs text-muted-foreground">Giá khởi điểm</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

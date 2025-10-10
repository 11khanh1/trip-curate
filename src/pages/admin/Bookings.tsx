import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";

export default function Bookings() {
  const bookings = [
    {
      id: "BK001",
      customer: "Nguyễn Văn A",
      activity: "Dịch vụ đón tiễn sân bay",
      date: "15/10/2025",
      amount: "₫765,000",
      status: "confirmed",
    },
    {
      id: "BK002",
      customer: "Trần Thị B",
      activity: "Vịnh Kỳ Diệu",
      date: "16/10/2025",
      amount: "₫450,000",
      status: "pending",
    },
    {
      id: "BK003",
      customer: "Lê Văn C",
      activity: "Tour Phú Quốc 3N2Đ",
      date: "20/10/2025",
      amount: "₫2,500,000",
      status: "confirmed",
    },
    {
      id: "BK004",
      customer: "Phạm Thị D",
      activity: "Vinpearl Land Nha Trang",
      date: "18/10/2025",
      amount: "₫650,000",
      status: "cancelled",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      confirmed: { variant: "default", label: "Đã xác nhận" },
      pending: { variant: "secondary", label: "Chờ xác nhận" },
      cancelled: { variant: "destructive", label: "Đã hủy" },
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách đơn đặt</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm mã đơn, khách hàng..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Mã đơn</th>
                  <th className="p-3 text-left text-sm font-medium">Khách hàng</th>
                  <th className="p-3 text-left text-sm font-medium">Hoạt động</th>
                  <th className="p-3 text-left text-sm font-medium">Ngày đặt</th>
                  <th className="p-3 text-left text-sm font-medium">Số tiền</th>
                  <th className="p-3 text-left text-sm font-medium">Trạng thái</th>
                  <th className="p-3 text-left text-sm font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  return (
                    <tr key={booking.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-medium">{booking.id}</span>
                      </td>
                      <td className="p-3">{booking.customer}</td>
                      <td className="p-3 text-sm">{booking.activity}</td>
                      <td className="p-3 text-sm text-muted-foreground">{booking.date}</td>
                      <td className="p-3 font-semibold text-primary">{booking.amount}</td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

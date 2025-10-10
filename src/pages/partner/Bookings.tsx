import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Check, X } from "lucide-react";

export default function PartnerBookings() {
  const bookings = [
    { id: "BK001", customer: "Nguyễn Văn A", activity: "Tour Phố cổ Hà Nội", date: "15/03/2024", guests: 2, total: "₫700,000", status: "pending" },
    { id: "BK002", customer: "Trần Thị B", activity: "Buffet Hải sản", date: "14/03/2024", guests: 4, total: "₫3,400,000", status: "confirmed" },
    { id: "BK003", customer: "Lê Văn C", activity: "Vé tham quan Bảo tàng", date: "14/03/2024", guests: 1, total: "₫150,000", status: "completed" },
    { id: "BK004", customer: "Phạm Thị D", activity: "Trải nghiệm làm gốm", date: "13/03/2024", guests: 2, total: "₫560,000", status: "cancelled" },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Chờ xác nhận", variant: "secondary" as const },
      confirmed: { label: "Đã xác nhận", variant: "default" as const },
      completed: { label: "Hoàn thành", variant: "outline" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };
    return variants[status as keyof typeof variants] || variants.pending;
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
                  <th className="p-3 text-left text-sm font-medium">Ngày</th>
                  <th className="p-3 text-left text-sm font-medium">Số khách</th>
                  <th className="p-3 text-left text-sm font-medium">Tổng tiền</th>
                  <th className="p-3 text-left text-sm font-medium">Trạng thái</th>
                  <th className="p-3 text-left text-sm font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  return (
                    <tr key={booking.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{booking.id}</td>
                      <td className="p-3">{booking.customer}</td>
                      <td className="p-3 text-sm">{booking.activity}</td>
                      <td className="p-3 text-sm">{booking.date}</td>
                      <td className="p-3 text-sm">{booking.guests} người</td>
                      <td className="p-3 font-semibold text-primary">{booking.total}</td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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

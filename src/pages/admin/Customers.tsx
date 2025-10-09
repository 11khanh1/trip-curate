import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";

export default function Customers() {
  const customers = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", phone: "0901234567", totalBookings: 5, totalSpent: "₫3,500,000" },
    { id: 2, name: "Trần Thị B", email: "tranthib@email.com", phone: "0912345678", totalBookings: 3, totalSpent: "₫2,100,000" },
    { id: 3, name: "Lê Văn C", email: "levanc@email.com", phone: "0923456789", totalBookings: 8, totalSpent: "₫7,800,000" },
    { id: 4, name: "Phạm Thị D", email: "phamthid@email.com", phone: "0934567890", totalBookings: 2, totalSpent: "₫1,200,000" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Khách hàng</h1>
        <p className="text-muted-foreground">Danh sách khách hàng và lịch sử đặt chỗ</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm tên, email, SĐT..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Khách hàng</th>
                  <th className="p-3 text-left text-sm font-medium">Email</th>
                  <th className="p-3 text-left text-sm font-medium">Số điện thoại</th>
                  <th className="p-3 text-left text-sm font-medium">Tổng đơn</th>
                  <th className="p-3 text-left text-sm font-medium">Tổng chi tiêu</th>
                  <th className="p-3 text-left text-sm font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="p-3 text-sm">{customer.phone}</td>
                    <td className="p-3 text-sm font-medium">{customer.totalBookings} đơn</td>
                    <td className="p-3 font-semibold text-primary">{customer.totalSpent}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

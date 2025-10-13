import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Users, UserPlus, ShieldOff } from "lucide-react";

type UserStatus = "active" | "locked";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalBookings: number;
  status: UserStatus;
}

const initialUsers: User[] = [
  { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", phone: "0901234567", createdAt: "10/09/2025", totalBookings: 8, status: "active" },
  { id: 2, name: "Trần Thị B", email: "tranthib@email.com", phone: "0912345678", createdAt: "01/10/2025", totalBookings: 2, status: "locked" },
  { id: 3, name: "Lê Minh C", email: "leminhc@email.com", phone: "0987654321", createdAt: "25/09/2025", totalBookings: 5, status: "active" },
  { id: 4, name: "Phạm Mỹ D", email: "phammD@email.com", phone: "0909988776", createdAt: "03/10/2025", totalBookings: 1, status: "active" },
  { id: 5, name: "Đỗ Văn E", email: "dovane@email.com", phone: "0977788899", createdAt: "07/10/2025", totalBookings: 3, status: "active" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const activeUsers = users.filter((user) => user.status === "active").length;
  const lockedUsers = users.length - activeUsers;

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, status: user.status === "active" ? "locked" : "active" } : user,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tổng người dùng"
          value={users.length}
          icon={Users}
          gradient
          trend={{ value: "+12% so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Đăng ký mới (7 ngày)"
          value="186"
          icon={UserPlus}
          trend={{ value: "+27 tài khoản mới", isPositive: true }}
        />
        <StatCard
          title="Tài khoản bị khóa"
          value={lockedUsers}
          icon={ShieldOff}
          trend={{ value: "2 trường hợp cần rà soát", isPositive: false }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>Xem thông tin cơ bản và trạng thái tài khoản</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Tìm kiếm theo tên hoặc email..." className="w-full sm:w-64" />
              <Button variant="outline">Xuất báo cáo</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[2fr,2fr,1.5fr,1fr,1fr] bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Người dùng</span>
              <span>Email</span>
              <span>Số điện thoại</span>
              <span>Đăng ký</span>
              <span>Trạng thái</span>
            </div>
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[2fr,2fr,1.5fr,1fr,1fr] md:items-center"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">Đăng ký: {user.createdAt}</p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      Lượt đặt: {user.totalBookings} tour
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                  <div className="hidden text-sm text-muted-foreground md:block">{user.createdAt}</div>
                  <div className="flex items-center justify-between md:block">
                    <Badge variant={user.status === "active" ? "default" : "destructive"}>
                      {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 md:mt-0"
                      onClick={() => toggleStatus(user.id)}
                    >
                      {user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Role = "Super Admin" | "Quản lý nội dung" | "Hỗ trợ khách hàng";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  lastLogin: string;
  active: boolean;
}

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Nguyễn Thu Hà", email: "ha.nguyen@tripcurate.com", role: "Super Admin", lastLogin: "11/10/2025 09:12", active: true },
  { id: 2, name: "Trần Gia Bảo", email: "bao.tran@tripcurate.com", role: "Quản lý nội dung", lastLogin: "10/10/2025 21:45", active: true },
  { id: 3, name: "Phạm Minh Triết", email: "triet.pham@tripcurate.com", role: "Hỗ trợ khách hàng", lastLogin: "10/10/2025 18:05", active: false },
];

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

  const toggleActive = (id: number) => {
    setAdmins((prev) =>
      prev.map((admin) => (admin.id === id ? { ...admin, active: !admin.active } : admin)),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thêm nhân sự quản trị</CardTitle>
          <CardDescription>Khởi tạo tài khoản nội bộ với phân quyền phù hợp</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3">
            <Input placeholder="Họ và tên" />
            <Input placeholder="Email nội bộ" type="email" />
            <Input placeholder="Phân quyền (ví dụ: Hỗ trợ khách hàng)" />
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button type="reset" variant="outline">
                Hủy
              </Button>
              <Button type="submit">Tạo tài khoản</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách quản trị viên</CardTitle>
          <CardDescription>Theo dõi quyền hạn và trạng thái hoạt động của từng nhân sự</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phân quyền</TableHead>
                <TableHead>Lần đăng nhập cuối</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "Super Admin" ? "default" : "secondary"}>{admin.role}</Badge>
                  </TableCell>
                  <TableCell>{admin.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Switch checked={admin.active} onCheckedChange={() => toggleActive(admin.id)} />
                      <Button variant="outline" size="sm">
                        Đặt lại mật khẩu
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

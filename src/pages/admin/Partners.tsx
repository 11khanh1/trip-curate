import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Briefcase, UserPlus, BarChart3 } from "lucide-react";

type PartnerStatus = "pending" | "active" | "blocked";

interface Partner {
  id: number;
  name: string;
  contact: string;
  email: string;
  totalTours: number;
  revenue: string;
  status: PartnerStatus;
}

const partners: Partner[] = [
  {
    id: 1,
    name: "TravelGo Asia",
    contact: "Lê Thị Thu",
    email: "contact@travelgo.vn",
    totalTours: 28,
    revenue: "₫1.8 tỷ",
    status: "active",
  },
  {
    id: 2,
    name: "Indochina Heritage",
    contact: "Nguyễn Văn Quang",
    email: "ops@indochinaheritage.com",
    totalTours: 12,
    revenue: "₫860 triệu",
    status: "pending",
  },
  {
    id: 3,
    name: "Oceanic Tours",
    contact: "Phạm Gia Hưng",
    email: "hello@oceanic.vn",
    totalTours: 34,
    revenue: "₫2.3 tỷ",
    status: "active",
  },
  {
    id: 4,
    name: "Mountain Trails",
    contact: "Trần Khánh Linh",
    email: "support@mountaintrails.vn",
    totalTours: 9,
    revenue: "₫420 triệu",
    status: "blocked",
  },
];

export default function AdminPartners() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Đối tác đang hoạt động"
          value="36"
          icon={Briefcase}
          gradient
          trend={{ value: "+4 đối tác mới", isPositive: true }}
        />
        <StatCard
          title="Tours do đối tác quản lý"
          value="612"
          icon={UserPlus}
          trend={{ value: "+58 tour so với tháng trước", isPositive: true }}
        />
        <StatCard
          title="Doanh thu đối tác (tháng)"
          value="₫5.4 tỷ"
          icon={BarChart3}
          trend={{ value: "+12% hiệu suất", isPositive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản đối tác</CardTitle>
          <CardDescription>Nhập thông tin cơ bản để khởi tạo tài khoản hợp tác</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tên đối tác</label>
              <Input placeholder="Ví dụ: VietAdventure Co." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ tên người liên hệ</label>
              <Input placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="partner@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input placeholder="0901 234 567" />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
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
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Danh sách đối tác</CardTitle>
              <CardDescription>Theo dõi trạng thái duyệt và hiệu suất doanh thu</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Xuất dữ liệu</Button>
              <Button variant="outline">Bộ lọc</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[2fr,1.5fr,2fr,1fr,1fr] bg-muted/70 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Đối tác</span>
              <span>Liên hệ</span>
              <span>Email</span>
              <span>Tổng tour</span>
              <span>Trạng thái</span>
            </div>
            <div className="divide-y">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[2fr,1.5fr,2fr,1fr,1fr] md:items-center"
                >
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">Revenue: {partner.revenue}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.contact}</p>
                  <p className="text-sm text-muted-foreground">{partner.email}</p>
                  <div className="text-sm text-muted-foreground">
                    {partner.totalTours} tour
                    <span className="hidden md:block text-xs text-muted-foreground">
                      Doanh thu: {partner.revenue}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 md:items-start">
                    <Badge
                      variant={
                        partner.status === "active" ? "default" : partner.status === "pending" ? "secondary" : "destructive"
                      }
                    >
                      {partner.status === "active"
                        ? "Đang hoạt động"
                        : partner.status === "pending"
                        ? "Chờ duyệt"
                        : "Đã khóa"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Cập nhật
                      </Button>
                      <Button size="sm" variant="outline">
                        Nhật ký
                      </Button>
                    </div>
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

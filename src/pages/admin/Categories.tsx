import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { MapPin, Sparkles, Tag } from "lucide-react";

const destinations = [
  { id: 1, name: "Hà Nội", status: "Đang hiển thị", tours: 48 },
  { id: 2, name: "Đà Nẵng", status: "Đang hiển thị", tours: 36 },
  { id: 3, name: "Phú Quốc", status: "Ẩn tạm thời", tours: 18 },
];

const themes = [
  { id: 1, name: "Nghỉ dưỡng gia đình", tags: 8, lastUpdated: "05/10/2025" },
  { id: 2, name: "Phiêu lưu khám phá", tags: 12, lastUpdated: "28/09/2025" },
  { id: 3, name: "Couple Retreat", tags: 6, lastUpdated: "12/09/2025" },
];

const tags = [
  { id: 1, label: "#biensunghiep", usage: 124 },
  { id: 2, label: "#checkin", usage: 312 },
  { id: 3, label: "#amthuc", usage: 87 },
  { id: 4, label: "#luxuryresort", usage: 44 },
];

export default function AdminCategories() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Điểm đến"
          value="128"
          icon={MapPin}
          gradient
          trend={{ value: "+6 địa điểm mới", isPositive: true }}
        />
        <StatCard
          title="Chủ đề nội dung"
          value="24"
          icon={Sparkles}
          trend={{ value: "Đang rà soát 3 chủ đề", isPositive: false }}
        />
        <StatCard
          title="Thẻ tag đang dùng"
          value="142"
          icon={Tag}
          trend={{ value: "+18 thẻ mới tháng này", isPositive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm danh mục nhanh</CardTitle>
          <CardDescription>Nhập tên và phân loại để tạo mới danh mục dùng chung</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
            <Input placeholder="Tên danh mục (ví dụ: Du lịch tâm linh)" />
            <Input placeholder="Loại (điểm đến/chủ đề/thẻ tag)" />
            <Button type="submit">Thêm mới</Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="destinations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="destinations">Điểm đến</TabsTrigger>
          <TabsTrigger value="themes">Chủ đề</TabsTrigger>
          <TabsTrigger value="tags">Thẻ tag</TabsTrigger>
        </TabsList>

        <TabsContent value="destinations">
          <Card>
            <CardHeader>
              <CardTitle>Điểm đến nổi bật</CardTitle>
              <CardDescription>Quản lý trạng thái hiển thị của điểm đến</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên điểm đến</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số tour</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((destination) => (
                    <TableRow key={destination.id}>
                      <TableCell className="font-medium">{destination.name}</TableCell>
                      <TableCell>
                        <Badge variant={destination.status === "Đang hiển thị" ? "default" : "secondary"}>
                          {destination.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{destination.tours} tour</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          Chỉnh sửa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Chủ đề trải nghiệm</CardTitle>
              <CardDescription>Kết nối tour theo chủ đề để dễ tìm kiếm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {themes.map((theme) => (
                <div key={theme.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme.tags} thẻ tag • Cập nhật lần cuối {theme.lastUpdated}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Thêm tag
                    </Button>
                    <Button variant="outline" size="sm">
                      Chỉnh sửa
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Thẻ tag phổ biến</CardTitle>
              <CardDescription>Quản lý từ khóa để tăng hiệu quả tìm kiếm</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tags.map((tagItem) => (
                <div key={tagItem.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-semibold text-primary">{tagItem.label}</p>
                    <p className="text-xs text-muted-foreground">{tagItem.usage} lượt sử dụng</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Vô hiệu hóa
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

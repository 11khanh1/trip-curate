import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function Locations() {
  const locations = [
    { id: 1, name: "TP. Hồ Chí Minh", activities: 45, region: "Miền Nam" },
    { id: 2, name: "Hà Nội", activities: 38, region: "Miền Bắc" },
    { id: 3, name: "Đà Nẵng", activities: 32, region: "Miền Trung" },
    { id: 4, name: "Nha Trang", activities: 28, region: "Miền Trung" },
    { id: 5, name: "Phú Quốc", activities: 25, region: "Miền Nam" },
    { id: 6, name: "Hội An", activities: 22, region: "Miền Trung" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Địa điểm</h1>
          <p className="text-muted-foreground">Quản lý các điểm đến du lịch</p>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Thêm địa điểm
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách địa điểm</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm địa điểm..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">{location.region}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 py-2 px-3 bg-gradient-card rounded-md text-center">
                      <p className="font-semibold text-primary">{location.activities}</p>
                      <p className="text-xs text-muted-foreground">Hoạt động</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

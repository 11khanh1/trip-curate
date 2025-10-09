import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function Promotions() {
  const promotions = [
    { id: 1, name: "Sale Sinh Nhật", discount: "40%", code: "BIRTHDAY40", status: "active", used: 234 },
    { id: 2, name: "Giảm giá mùa hè", discount: "25%", code: "SUMMER25", status: "active", used: 156 },
    { id: 3, name: "Flash Sale", discount: "50%", code: "FLASH50", status: "expired", used: 489 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khuyến mãi</h1>
          <p className="text-muted-foreground">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Tạo khuyến mãi
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <Card key={promo.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-bl-full" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{promo.name}</CardTitle>
                  <p className="text-3xl font-bold text-primary mt-2">{promo.discount}</p>
                </div>
                <Badge variant={promo.status === "active" ? "default" : "secondary"}>
                  {promo.status === "active" ? "Đang áp dụng" : "Hết hạn"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Mã giảm giá</span>
                  <span className="font-mono font-semibold">{promo.code}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đã sử dụng</span>
                  <span className="font-medium">{promo.used} lần</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-3 w-3" />
                    Chỉnh sửa
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

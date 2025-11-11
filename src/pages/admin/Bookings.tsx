import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, Search } from "lucide-react";

export default function Bookings() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="tracking-tight text-foreground">Đơn đặt tour</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dữ liệu sẽ tự động hiển thị khi API booking được kết nối.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input disabled placeholder="Tìm mã đơn, khách hàng..." className="pl-8" />
              </div>
              <Button variant="outline" disabled className="sm:w-auto">
                Đồng bộ API
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Database className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">Chưa có dữ liệu đơn đặt</p>
              <p className="text-sm text-muted-foreground">
                Máy chủ hiện chưa trả danh sách booking. Khi backend sẵn sàng, module này sẽ tự cập nhật theo API
                <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">/admin/bookings</code>.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Đề xuất: chuẩn hóa endpoint trả dữ liệu phân trang & bộ lọc.</span>
              </div>
              <Button size="sm" variant="secondary" disabled>
                Làm mới dữ liệu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

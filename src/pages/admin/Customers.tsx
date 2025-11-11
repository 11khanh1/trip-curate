import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, AlertCircle } from "lucide-react";

export default function Customers() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="tracking-tight text-foreground">Khách hàng</CardTitle>
              <p className="text-sm text-muted-foreground">
                Module sẽ hiển thị danh sách khách theo dữ liệu thực tế từ API.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input disabled placeholder="Tìm tên, email, SĐT..." className="pl-8" />
              </div>
              <Button variant="outline" disabled>
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">Chưa có dữ liệu khách hàng</p>
              <p className="text-sm text-muted-foreground">
                Kết nối endpoint <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">/admin/customers</code> để
                đồng bộ thông tin người dùng, lịch sử đơn, giá trị chi tiêu và các bộ lọc nâng cao.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Gợi ý: thêm trường tổng đơn, tổng chi tiêu, nguồn khách để phân tích.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

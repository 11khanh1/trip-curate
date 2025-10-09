import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý cấu hình hệ thống</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin website</CardTitle>
            <CardDescription>Cấu hình thông tin cơ bản của website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Tên website</Label>
              <Input id="siteName" defaultValue="TripCurate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteEmail">Email liên hệ</Label>
              <Input id="siteEmail" type="email" defaultValue="contact@tripcurate.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sitePhone">Số điện thoại</Label>
              <Input id="sitePhone" defaultValue="1900 123 456" />
            </div>
            <Button className="bg-gradient-primary">Lưu thay đổi</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt đặt chỗ</CardTitle>
            <CardDescription>Quản lý các tùy chọn liên quan đến đặt chỗ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cho phép đặt trước</Label>
                <p className="text-sm text-muted-foreground">
                  Khách hàng có thể đặt trước cho các ngày trong tương lai
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xác nhận tự động</Label>
                <p className="text-sm text-muted-foreground">
                  Tự động xác nhận đơn đặt khi thanh toán thành công
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email thông báo</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi email thông báo cho admin khi có đơn mới
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
            <CardDescription>Cấu hình các phương thức thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thanh toán qua VNPAY</Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép thanh toán qua cổng VNPAY
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thanh toán qua Momo</Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép thanh toán qua ví điện tử Momo
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thanh toán khi nhận dịch vụ</Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép thanh toán trực tiếp
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

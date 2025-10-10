import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function PartnerSettings() {
  return (
    <div className="space-y-6">

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin công ty</CardTitle>
            <CardDescription>Cập nhật thông tin doanh nghiệp của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Tên công ty</Label>
              <Input id="company-name" placeholder="TripCurate Partner" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-license">Giấy phép kinh doanh</Label>
              <Input id="business-license" placeholder="0123456789" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea id="address" placeholder="Nhập địa chỉ công ty..." />
            </div>
            <Button className="bg-gradient-primary">Lưu thay đổi</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
            <CardDescription>Thông tin để khách hàng liên hệ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" type="tel" placeholder="0901234567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input id="email" type="email" placeholder="partner@tripcurate.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://yourwebsite.com" />
            </div>
            <Button className="bg-gradient-primary">Cập nhật</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông báo</CardTitle>
            <CardDescription>Quản lý các thông báo bạn nhận được</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đơn đặt mới</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có đơn đặt mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đánh giá mới</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có đánh giá mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Báo cáo doanh thu</Label>
                <p className="text-sm text-muted-foreground">Nhận báo cáo doanh thu hàng tuần</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
            <CardDescription>Thông tin tài khoản nhận thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bank-name">Ngân hàng</Label>
              <Input id="bank-name" placeholder="Vietcombank" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-number">Số tài khoản</Label>
              <Input id="account-number" placeholder="1234567890" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-holder">Chủ tài khoản</Label>
              <Input id="account-holder" placeholder="NGUYEN VAN A" />
            </div>
            <Button className="bg-gradient-primary">Cập nhật thông tin</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

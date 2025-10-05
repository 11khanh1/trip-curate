import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Bell, CreditCard, Globe, Shield } from "lucide-react";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const AccountSettings = () => {
  const { currentUser, setCurrentUser } = useUser();
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Update user in context and localStorage
    const updatedUser = {
      ...currentUser,
      name: formData.name,
      email: formData.email,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("Cập nhật thông tin thành công!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    // In real app, call API to change password
    toast.success("Đổi mật khẩu thành công!");
    setFormData({
      ...formData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <TravelHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt tài khoản</h1>
            <p className="text-gray-600">Quản lý thông tin cá nhân và tùy chọn bảo mật của bạn</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Hồ sơ</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Bảo mật</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Thông báo</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Thanh toán</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Tùy chọn</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+84 xxx xxx xxx"
                      />
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Lưu thay đổi
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Bảo mật tài khoản</CardTitle>
                  <CardDescription>Quản lý mật khẩu và cài đặt bảo mật</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Nhập mật khẩu mới"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </form>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Xác thực hai yếu tố
                    </h3>
                    <p className="text-sm text-gray-600">
                      Bảo vệ tài khoản của bạn bằng cách kích hoạt xác thực hai yếu tố
                    </p>
                    <Button variant="outline">Kích hoạt</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Thông báo</CardTitle>
                  <CardDescription>Quản lý cách bạn nhận thông báo từ chúng tôi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email khuyến mãi</h4>
                      <p className="text-sm text-gray-600">Nhận thông tin về ưu đãi và khuyến mãi đặc biệt</p>
                    </div>
                    <Button variant="outline" size="sm">Bật</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Cập nhật đặt chỗ</h4>
                      <p className="text-sm text-gray-600">Nhận thông báo về trạng thái đặt chỗ của bạn</p>
                    </div>
                    <Button variant="outline" size="sm">Bật</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tin tức và mẹo du lịch</h4>
                      <p className="text-sm text-gray-600">Nhận thông tin hữu ích về điểm đến và hoạt động</p>
                    </div>
                    <Button variant="outline" size="sm">Bật</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Phương thức thanh toán</CardTitle>
                  <CardDescription>Quản lý thẻ tín dụng và phương thức thanh toán</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">Chưa có phương thức thanh toán</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Thêm thẻ tín dụng hoặc phương thức thanh toán để đặt chỗ nhanh hơn
                      </p>
                      <Button className="bg-primary hover:bg-primary/90">
                        Thêm phương thức thanh toán
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Tùy chọn</CardTitle>
                  <CardDescription>Tùy chỉnh trải nghiệm của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <select className="w-full p-2 border rounded-lg">
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Đơn vị tiền tệ</Label>
                    <select className="w-full p-2 border rounded-lg">
                      <option value="vnd">VND - Đồng Việt Nam</option>
                      <option value="usd">USD - Dollar Mỹ</option>
                      <option value="eur">EUR - Euro</option>
                      <option value="jpy">JPY - Yên Nhật</option>
                    </select>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90">Lưu tùy chọn</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;

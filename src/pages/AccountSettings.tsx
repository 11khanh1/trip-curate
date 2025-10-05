import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Bell, CreditCard, Globe, Shield, ChevronRight, Mail, Phone, Calendar } from "lucide-react";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SectionType = "profile" | "security" | "notifications" | "payment" | "preferences";

const AccountSettings = () => {
  const { currentUser, setCurrentUser } = useUser();
  const [activeSection, setActiveSection] = useState<SectionType>("profile");
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const menuItems = [
    { id: "profile" as SectionType, label: "Hồ sơ của tôi", icon: User },
    { id: "security" as SectionType, label: "Bảo mật", icon: Lock },
    { id: "notifications" as SectionType, label: "Thông báo", icon: Bell },
    { id: "payment" as SectionType, label: "Thanh toán", icon: CreditCard },
    { id: "preferences" as SectionType, label: "Tùy chọn", icon: Globe },
  ];

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TravelHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Cài đặt tài khoản</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <Card className="p-4">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Hồ sơ của tôi</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý thông tin cá nhân của bạn</p>
                  </div>
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {/* Profile Photo */}
                      <div className="flex items-center gap-6 pb-6 border-b">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <Button type="button" variant="outline" size="sm">
                            Thay đổi ảnh
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">JPG, PNG hoặc GIF. Tối đa 2MB</p>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                              Họ và tên <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Nhập họ và tên"
                              className="h-11"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gender" className="text-sm font-medium">
                              Giới tính
                            </Label>
                            <select
                              id="gender"
                              name="gender"
                              value={formData.gender}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              className="w-full h-11 px-3 border rounded-lg bg-white"
                            >
                              <option value="">Chọn giới tính</option>
                              <option value="male">Nam</option>
                              <option value="female">Nữ</option>
                              <option value="other">Khác</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="email@example.com"
                              className="h-11"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Số điện thoại
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+84 xxx xxx xxx"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Ngày sinh
                          </Label>
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                          Lưu thay đổi
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Bảo mật</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý mật khẩu và bảo mật tài khoản</p>
                  </div>
                  <CardContent className="p-6">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-medium">
                            Mật khẩu hiện tại <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="h-11"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium">
                            Mật khẩu mới <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập lại mật khẩu mới"
                            className="h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </form>

                    <Separator className="my-8" />

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">Xác thực hai yếu tố</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Tăng cường bảo mật tài khoản bằng cách yêu cầu mã xác thực khi đăng nhập
                          </p>
                          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                            Kích hoạt ngay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý cách bạn nhận thông báo</p>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between py-4 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Email khuyến mãi</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Nhận thông tin về ưu đãi, khuyến mãi đặc biệt và các chương trình mới nhất
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4 shrink-0">
                        Bật
                      </Button>
                    </div>

                    <div className="flex items-start justify-between py-4 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Cập nhật đặt chỗ</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Nhận thông báo về trạng thái đặt chỗ, xác nhận và thay đổi lịch trình
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4 shrink-0">
                        Bật
                      </Button>
                    </div>

                    <div className="flex items-start justify-between py-4 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Tin tức và mẹo du lịch</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Khám phá các mẹo du lịch hữu ích, điểm đến mới và trải nghiệm độc đáo
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4 shrink-0">
                        Bật
                      </Button>
                    </div>

                    <div className="flex items-start justify-between py-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Nhắc nhở sắp tới</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Nhận nhắc nhở về các hoạt động và đặt chỗ sắp diễn ra
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4 shrink-0">
                        Bật
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Section */}
              {activeSection === "payment" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý thẻ và phương thức thanh toán</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Chưa có phương thức thanh toán</h3>
                      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        Thêm thẻ tín dụng hoặc phương thức thanh toán để đặt chỗ nhanh chóng và thuận tiện hơn
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 px-6">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Thêm phương thức thanh toán
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences Section */}
              {activeSection === "preferences" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Tùy chọn</h2>
                    <p className="text-sm text-gray-600 mt-1">Cá nhân hóa trải nghiệm của bạn</p>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Ngôn ngữ hiển thị
                      </Label>
                      <select className="w-full h-11 px-3 border rounded-lg bg-white">
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                        <option value="zh">中文 (简体)</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="th">ไทย</option>
                      </select>
                      <p className="text-xs text-gray-500">Chọn ngôn ngữ bạn muốn sử dụng trên trang web</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Đơn vị tiền tệ</Label>
                      <select className="w-full h-11 px-3 border rounded-lg bg-white">
                        <option value="vnd">VND - Đồng Việt Nam (₫)</option>
                        <option value="usd">USD - Dollar Mỹ ($)</option>
                        <option value="eur">EUR - Euro (€)</option>
                        <option value="jpy">JPY - Yên Nhật (¥)</option>
                        <option value="krw">KRW - Won Hàn Quốc (₩)</option>
                        <option value="thb">THB - Baht Thái (฿)</option>
                      </select>
                      <p className="text-xs text-gray-500">Chọn đơn vị tiền tệ để hiển thị giá</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Múi giờ</Label>
                      <select className="w-full h-11 px-3 border rounded-lg bg-white">
                        <option value="asia/ho_chi_minh">(GMT+7) Hà Nội, TP. Hồ Chí Minh</option>
                        <option value="asia/bangkok">(GMT+7) Bangkok</option>
                        <option value="asia/singapore">(GMT+8) Singapore</option>
                        <option value="asia/tokyo">(GMT+9) Tokyo</option>
                        <option value="asia/seoul">(GMT+9) Seoul</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button className="bg-primary hover:bg-primary/90 px-8">Lưu tùy chọn</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;

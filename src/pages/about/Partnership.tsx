import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Building2, TrendingUp, Users } from "lucide-react";

const Partnership = () => {
  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Tăng doanh thu",
      description: "Tiếp cận hàng triệu khách hàng tiềm năng trên toàn cầu",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Mở rộng tầm với",
      description: "Đưa sản phẩm của bạn đến với thị trường quốc tế",
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Hỗ trợ toàn diện",
      description: "Đội ngũ chuyên nghiệp hỗ trợ 24/7",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Handshake className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">Quan hệ đối tác</h1>
            <p className="text-xl">
              Hợp tác cùng VietTravel để phát triển kinh doanh du lịch của bạn
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Lợi ích khi hợp tác với VietTravel</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Các loại hình đối tác</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-3">Nhà cung cấp hoạt động</h3>
                  <p className="text-muted-foreground mb-4">
                    Tour du lịch, vé tham quan, trải nghiệm địa phương
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Công viên giải trí</li>
                    <li>• Bảo tàng & Di tích</li>
                    <li>• Tour tham quan</li>
                    <li>• Hoạt động giải trí</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-3">Đối tác vận chuyển</h3>
                  <p className="text-muted-foreground mb-4">
                    Dịch vụ di chuyển và vận chuyển du lịch
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Xe đưa đón sân bay</li>
                    <li>• Thuê xe tự lái</li>
                    <li>• Vé tàu & xe buýt</li>
                    <li>• Dịch vụ đưa đón riêng</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-3">Khách sạn & Lưu trú</h3>
                  <p className="text-muted-foreground mb-4">
                    Dịch vụ lưu trú và nghỉ dưỡng
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Khách sạn</li>
                    <li>• Khu nghỉ dưỡng</li>
                    <li>• Homestay</li>
                    <li>• Căn hộ dịch vụ</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-3">Đối tác công nghệ</h3>
                  <p className="text-muted-foreground mb-4">
                    Giải pháp công nghệ và tích hợp
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• API Integration</li>
                    <li>• Hệ thống đặt chỗ</li>
                    <li>• Thanh toán</li>
                    <li>• Phân tích dữ liệu</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Đăng ký hợp tác</h2>
              <p className="text-lg text-muted-foreground">
                Điền thông tin để đội ngũ của chúng tôi liên hệ với bạn
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tên công ty *</label>
                      <Input placeholder="Nhập tên công ty" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Loại hình kinh doanh *</label>
                      <Input placeholder="VD: Tour du lịch" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Họ và tên *</label>
                      <Input placeholder="Nhập họ và tên" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email *</label>
                      <Input type="email" placeholder="email@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Số điện thoại *</label>
                    <Input type="tel" placeholder="+84 123 456 789" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Thông tin chi tiết</label>
                    <Textarea 
                      placeholder="Vui lòng mô tả về dịch vụ của bạn và lý do muốn hợp tác với Klook"
                      rows={5}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Gửi đăng ký
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partnership;
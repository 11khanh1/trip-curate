import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Zap } from "lucide-react";

const Affiliate = () => {
  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Hoa hồng hấp dẫn",
      description: "Kiếm tới 5% hoa hồng cho mỗi đơn hàng thành công",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Hỗ trợ chuyên nghiệp",
      description: "Đội ngũ hỗ trợ affiliate 24/7",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Công cụ marketing",
      description: "Banner, link và tài liệu quảng cáo chất lượng cao",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Thanh toán nhanh chóng",
      description: "Chi trả hoa hồng hàng tháng đúng hạn",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Đăng ký",
      description: "Tạo tài khoản affiliate miễn phí",
    },
    {
      number: "2",
      title: "Nhận link",
      description: "Lấy link affiliate độc quyền của bạn",
    },
    {
      number: "3",
      title: "Chia sẻ",
      description: "Quảng bá link đến khách hàng tiềm năng",
    },
    {
      number: "4",
      title: "Kiếm tiền",
      description: "Nhận hoa hồng cho mỗi đơn hàng thành công",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Chương trình liên kết</h1>
            <p className="text-xl mb-8">
              Kiếm tiền bằng cách giới thiệu VietTravel đến bạn bè và người theo dõi của bạn
            </p>
            <Button size="lg" variant="secondary">
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Lợi ích của chương trình</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Cách thức hoạt động</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Cơ cấu hoa hồng</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3%</div>
                  <h3 className="font-semibold mb-2">Mức cơ bản</h3>
                  <p className="text-sm text-muted-foreground">
                    Cho mọi đơn hàng dưới 10 triệu VNĐ/tháng
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary border-2">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">4%</div>
                  <h3 className="font-semibold mb-2">Mức trung cấp</h3>
                  <p className="text-sm text-muted-foreground">
                    Từ 10-50 triệu VNĐ/tháng
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5%</div>
                  <h3 className="font-semibold mb-2">Mức cao cấp</h3>
                  <p className="text-sm text-muted-foreground">
                    Trên 50 triệu VNĐ/tháng
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
            <p className="text-lg mb-8">
              Tham gia chương trình affiliate ngay hôm nay và bắt đầu kiếm tiền
            </p>
            <Button size="lg" variant="secondary">
              Đăng ký miễn phí
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Affiliate;

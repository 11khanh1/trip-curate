import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Clock, Percent, Tag } from "lucide-react";

const Deals = () => {
  const promotionBanners = [
    {
      id: 1,
      title: "MÃ GIẢM 50%",
      subtitle: "Hoạt động vui chơi",
      color: "from-cyan-400 to-cyan-600",
    },
    {
      id: 2,
      title: "MÃ GIẢM 200K",
      subtitle: "Hoạt động vui chơi nước ngoài",
      color: "from-purple-500 to-purple-700",
    },
    {
      id: 3,
      title: "MÃ GIẢM 300K",
      subtitle: "Tour nước ngoài",
      color: "from-orange-500 to-red-600",
    },
    {
      id: 4,
      title: "MÃ GIẢM 7%",
      subtitle: "Hoạt động cuối tuần",
      color: "from-blue-400 to-blue-600",
    },
    {
      id: 5,
      title: "MÃ GIẢM 8%",
      subtitle: "Suối nước nóng, voucher ăn uống",
      color: "from-amber-400 to-orange-500",
    },
  ];

  const dealCodes = [
    {
      id: 1,
      title: "[Sale Thứ 6 - Cuối Tuần] Vé tham quan nước ngoài Giảm 200K",
      code: "ATTNUOCNGOAISN",
      discount: "200,000 VND off",
      minOrder: "3,000,000 VND",
      icon: <Tag className="w-5 h-5" />,
      appOnly: true,
    },
    {
      id: 2,
      title: "[Sale Thứ 6 - Cuối Tuần] Land tour nước ngoài Giảm 300K",
      code: "TOURNUOCNGOAISN",
      discount: "300,000 VND off",
      minOrder: "4,000,000 VND",
      icon: <Tag className="w-5 h-5" />,
      appOnly: true,
    },
    {
      id: 3,
      title: "[Sale Thứ 6 - Cuối Tuần] Suối Nước Nóng & Voucher Ăn Uống Giảm 8%",
      code: "THUGIANSN25",
      discount: "Giảm 8%",
      minOrder: "1,000,000 VND",
      icon: <Percent className="w-5 h-5" />,
      appOnly: true,
    },
    {
      id: 4,
      title: "[Sale Thứ 6 - Cuối Tuần] Giảm 7% Vui Chơi Cuối Tuần",
      code: "VUICUOITUANSN25",
      discount: "Giảm 7%",
      minOrder: "1,200,000 VND",
      icon: <Percent className="w-5 h-5" />,
      appOnly: false,
    },
    {
      id: 5,
      title: "[Sale Thứ 6 - Cuối Tuần] Vé Tham Quan Giảm 10%",
      code: "ATTCUOITUANSN",
      discount: "Giảm 10%",
      minOrder: "500,000 VND",
      icon: <Percent className="w-5 h-5" />,
      appOnly: false,
    },
    {
      id: 6,
      title: "Flash Sale - Giảm 30% Khách Sạn",
      code: "HOTELDEAL30",
      discount: "Giảm 30%",
      minOrder: "2,000,000 VND",
      icon: <Clock className="w-5 h-5" />,
      appOnly: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              😍 SALE THỨ 6 - CUỐI TUẦN 😍
            </h1>
            <p className="text-xl">Săn ngay deal siêu hời!</p>
          </div>

          {/* Promotion Banners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {promotionBanners.map((banner) => (
              <Card key={banner.id} className={`bg-gradient-to-br ${banner.color} border-0 text-white transform transition-transform hover:scale-105`}>
                <CardContent className="p-6 text-center">
                  <div className="font-bold text-sm mb-1">MÃ GIẢM</div>
                  <div className="text-3xl font-black mb-2">{banner.title.split(' ')[2]}</div>
                  <div className="text-xs font-medium">{banner.subtitle}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Deal Codes Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Mã giảm giá</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {dealCodes.map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      {deal.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{deal.title}</h3>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-lg border-2 border-dashed border-orange-400">
                          <div className="text-xs text-muted-foreground mb-1">Mã ưu đãi:</div>
                          <div className="font-bold text-orange-600">{deal.code}</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Giảm giá:</span>
                          <span className="font-semibold text-primary">{deal.discount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Đơn tối thiểu:</span>
                          <span className="font-semibold">{deal.minOrder}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button className="flex-1">Lưu mã</Button>
                        {deal.appOnly && (
                          <Badge variant="secondary" className="text-xs">
                            Chỉ trên App
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Cách sử dụng mã giảm giá</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Chọn hoạt động</h3>
              <p className="text-sm text-muted-foreground">Tìm và chọn hoạt động yêu thích của bạn</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Nhập mã giảm giá</h3>
              <p className="text-sm text-muted-foreground">Áp dụng mã tại trang thanh toán</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Hoàn tất đặt chỗ</h3>
              <p className="text-sm text-muted-foreground">Thanh toán và nhận xác nhận ngay</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Deals;
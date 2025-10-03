import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const ContactUs = () => {
  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Điện thoại",
      content: "1900-xxxx",
      description: "Thứ 2 - Chủ nhật: 8:00 - 22:00",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      content: "support@klook.com.vn",
      description: "Phản hồi trong vòng 24 giờ",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      content: "Chat trực tiếp",
      description: "Online: 8:00 - 22:00 hàng ngày",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Văn phòng",
      content: "Tầng 10, Tòa nhà ABC",
      description: "123 Nguyễn Huệ, Q.1, TP.HCM",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Liên hệ chúng tôi</h1>
            <p className="text-xl">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {method.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{method.title}</h3>
                    <p className="text-primary font-medium mb-1">{method.content}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Gửi tin nhắn cho chúng tôi</h2>
              <p className="text-lg text-muted-foreground">
                Điền form bên dưới và chúng tôi sẽ phản hồi sớm nhất có thể
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input id="name" placeholder="Nhập họ và tên" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="email@example.com" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" type="tel" placeholder="+84 123 456 789" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Chủ đề *</Label>
                      <Input id="subject" placeholder="Vấn đề cần hỗ trợ" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Mã đơn hàng (nếu có)</Label>
                    <Input id="orderNumber" placeholder="VD: KL123456789" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nội dung *</Label>
                    <Textarea 
                      id="message"
                      placeholder="Mô tả chi tiết vấn đề của bạn..."
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="terms" className="rounded" />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật
                    </Label>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Gửi tin nhắn
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Giờ làm việc</h3>
                      <p className="opacity-90">Hỗ trợ khách hàng 24/7</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold mb-1">Thứ 2 - Chủ nhật</p>
                    <p className="opacity-90">8:00 - 22:00</p>
                    <p className="text-sm opacity-75 mt-2">Ngoài giờ: support@klook.com.vn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
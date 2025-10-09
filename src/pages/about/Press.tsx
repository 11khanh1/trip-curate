import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, Download, Mail } from "lucide-react";

const Press = () => {
  const pressReleases = [
    {
      id: 1,
      date: "15/03/2025",
      title: "VietTravel mở rộng dịch vụ sang 50 quốc gia mới",
      excerpt: "Nền tảng du lịch hàng đầu châu Á công bố kế hoạch mở rộng toàn cầu...",
    },
    {
      id: 2,
      date: "28/02/2025",
      title: "VietTravel hợp tác với các điểm đến UNESCO",
      excerpt: "Đưa trải nghiệm di sản thế giới đến gần hơn với du khách...",
    },
    {
      id: 3,
      date: "10/01/2025",
      title: "VietTravel đạt mốc 100 triệu người dùng",
      excerpt: "Con số ấn tượng đánh dấu sự phát triển vượt bậc của nền tảng...",
    },
  ];

  const mediaContacts = [
    {
      region: "Việt Nam",
      email: "press.vn@viettravel.com",
      phone: "+84 24 1234 5678",
    },
    {
      region: "Châu Á - Thái Bình Dương",
      email: "press.apac@viettravel.com",
      phone: "+65 1234 5678",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Newspaper className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">Phòng báo chí</h1>
            <p className="text-xl">
              Tin tức mới nhất và thông tin báo chí về VietTravel
            </p>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Thông cáo báo chí</h2>
            
            <div className="space-y-6">
              {pressReleases.map((release) => (
                <Card key={release.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">{release.date}</p>
                        <h3 className="text-xl font-semibold mb-2">{release.title}</h3>
                        <p className="text-muted-foreground mb-4">{release.excerpt}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Bộ công cụ truyền thông</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Tải xuống logo, hình ảnh và tài liệu thương hiệu của VietTravel
            </p>
            <Button size="lg">
              <Download className="w-5 h-5 mr-2" />
              Tải bộ công cụ truyền thông
            </Button>
          </div>
        </div>
      </section>

      {/* Media Contacts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Liên hệ truyền thông</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {mediaContacts.map((contact, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{contact.region}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          Email: <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Điện thoại: {contact.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
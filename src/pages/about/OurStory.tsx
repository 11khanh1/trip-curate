import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Heart, Globe, Users, Award } from "lucide-react";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 to-purple-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Câu chuyện của chúng tôi</h1>
            <p className="text-xl text-muted-foreground">
              Từ một ý tưởng nhỏ đến nền tảng du lịch hàng đầu châu Á
            </p>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Khởi đầu hành trình</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Klook được thành lập vào năm 2014 bởi một nhóm những người đam mê du lịch, 
                với mong muốn mang đến trải nghiệm đặt chỗ dễ dàng và thuận tiện cho khách du lịch 
                trên khắp châu Á. Chúng tôi nhận thấy rằng việc đặt các hoạt động và dịch vụ du lịch 
                thường rất phức tạp và tốn thời gian.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-4">Sứ mệnh của chúng tôi</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Sứ mệnh của Klook là biến mọi khoảnh khắc trong hành trình du lịch của bạn trở nên 
                đáng nhớ và dễ dàng hơn. Chúng tôi kết nối du khách với hàng nghìn trải nghiệm 
                tuyệt vời trên toàn thế giới, từ vé tham quan các điểm đến nổi tiếng đến những 
                trải nghiệm địa phương độc đáo.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="p-8 bg-card rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2,000+ Điểm đến</h3>
                <p className="text-muted-foreground">
                  Phủ sóng rộng khắp châu Á và mở rộng ra toàn cầu
                </p>
              </div>

              <div className="p-8 bg-card rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">100 Triệu+ Khách hàng</h3>
                <p className="text-muted-foreground">
                  Phục vụ hàng triệu du khách mỗi năm
                </p>
              </div>

              <div className="p-8 bg-card rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">500,000+ Hoạt động</h3>
                <p className="text-muted-foreground">
                  Đa dạng trải nghiệm cho mọi loại hình du lịch
                </p>
              </div>

              <div className="p-8 bg-card rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nhiều giải thưởng</h3>
                <p className="text-muted-foreground">
                  Được công nhận bởi các tổ chức uy tín toàn cầu
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-4">Tầm nhìn tương lai</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Chúng tôi không ngừng đổi mới và phát triển để mang đến những trải nghiệm tốt nhất 
                cho khách hàng. Từ công nghệ đặt chỗ thông minh đến dịch vụ chăm sóc khách hàng 
                24/7, Klook cam kết đồng hành cùng bạn trong mọi chuyến đi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurStory;
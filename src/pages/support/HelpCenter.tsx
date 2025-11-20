import { useState } from "react";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { useChatWidget } from "@/context/ChatWidgetContext";

const HelpCenter = () => {
  const { openChat } = useChatWidget();

  const categories = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Đặt chỗ",
      description: "Hướng dẫn đặt và quản lý đơn hàng",
      articles: 25,
      items: [
        "Cách đặt tour và chọn lịch khởi hành",
        "Theo dõi & xác nhận trạng thái đơn",
        "Chỉnh sửa thông tin hành khách sau khi đặt",
        "Hủy/đổi lịch: điều kiện và phí",
        "Đơn bị từ chối/hết chỗ: lý do và cách xử lý",
      ],
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Thanh toán",
      description: "Phương thức thanh toán và hoàn tiền",
      articles: 18,
      items: [
        "Phương thức thanh toán hỗ trợ (thẻ, ví, chuyển khoản)",
        "Nhập mã giảm giá và kiểm tra số tiền sau giảm",
        "Kiểm tra trạng thái thanh toán pending/failed",
        "Yêu cầu và tải hóa đơn điện tử",
        "Hoàn tiền: thời gian xử lý và kênh nhận tiền",
      ],
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Hoạt động",
      description: "Thông tin về các hoạt động và tour",
      articles: 32,
      items: [
        "Đọc thông tin tour: lịch trình, giá, chính sách",
        "Kiểm tra chỗ trống & số khách tối thiểu",
        "Yêu cầu đặc biệt: ăn kiêng, đưa đón, ghép đoàn",
        "Đổi gói/lịch sau khi đặt: điều kiện áp dụng",
        "Chính sách hủy theo nhà cung cấp/điểm đến",
      ],
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Tài khoản",
      description: "Quản lý tài khoản và bảo mật",
      articles: 15,
      items: [
        "Đăng ký/đăng nhập và xác minh email/số điện thoại",
        "Đặt lại mật khẩu và bảo mật 2 lớp (nếu có)",
        "Cập nhật hồ sơ & kênh nhận thông báo",
        "Quản lý wishlist, lịch sử đặt chỗ và thông báo",
        "Nhận diện email/link giả mạo và báo cáo sự cố",
      ],
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const popularArticles = [
    {
      question: "Làm thế nào để đặt hoạt động trên VietTravel?",
      answer:
        "Bạn chỉ cần tìm kiếm hoạt động theo điểm đến hoặc từ khóa, chọn tour mong muốn và bấm “Đặt ngay”. Điền thông tin hành khách, chọn lịch khởi hành và phương thức thanh toán. Sau khi thanh toán thành công, hệ thống sẽ gửi email xác nhận cùng mã đơn hàng cho bạn.",
    },
    {
      question: "Chính sách hủy và hoàn tiền",
      answer:
        "Mỗi hoạt động có quy định hủy riêng. Bạn có thể xem ở phần “Điều khoản” của tour hoặc trong email xác nhận. Nếu cần hủy, hãy vào mục “Đơn đặt của tôi”, chọn tour và bấm “Hủy đơn”. Hệ thống sẽ hiển thị số tiền được hoàn và dự kiến thời gian hoàn (thông thường 3-7 ngày làm việc tùy phương thức).",
    },
    {
      question: "Cách sử dụng mã giảm giá",
      answer:
        "Ở bước thanh toán, nhập mã vào ô “Mã khuyến mãi” rồi bấm “Áp dụng”. Hệ thống sẽ trừ trực tiếp nếu mã hợp lệ. Lưu ý rằng mỗi mã có điều kiện riêng như giá trị đơn tối thiểu, số lần sử dụng, thời gian áp dụng…",
    },
    {
      question: "Tôi có thể thay đổi ngày đặt chỗ không?",
      answer:
        "Bạn có thể yêu cầu đổi lịch nếu tour còn chỗ và vẫn trong thời gian cho phép. Vào “Đơn đặt của tôi” → chọn tour → “Đổi lịch”. Nếu nhà cung cấp không hỗ trợ đổi lịch, bạn vui lòng hủy đơn hiện tại và đặt lại ngày mới.",
    },
    {
      question: "Làm sao để liên hệ với nhà cung cấp dịch vụ?",
      answer:
        "Trong trang chi tiết tour có mục “Liên hệ” hiển thị email và số điện thoại của nhà cung cấp. Ngoài ra, bạn có thể sử dụng chức năng Chat/Hotline VietTravel để được kết nối trực tiếp với đối tác trong vòng 24 giờ.",
    },
    {
      question: "VietTravel có hỗ trợ thanh toán trả góp không?",
      answer:
        "Đối với đơn hàng từ 5.000.000đ, bạn có thể chọn trả góp 0% qua thẻ tín dụng của các ngân hàng đối tác (Sacombank, VPBank, Techcombank…). Ở bước thanh toán, chọn mục “Trả góp 0%” và làm theo hướng dẫn trên màn hình.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section with Search */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Trung tâm trợ giúp</h1>
            <p className="text-xl mb-8">
              Chúng tôi có thể giúp gì cho bạn?
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Tìm kiếm câu hỏi, từ khóa..." 
                className="pl-12 h-14 text-lg bg-white text-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Chủ đề phổ biến</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    <p className="text-xs text-primary">{category.articles} bài viết</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Topic details */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground">Bắt đầu từ chủ đề bạn quan tâm</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Danh sách bài viết gợi ý để bạn tìm nhanh câu trả lời phổ biến.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card key={`topic-${index}`} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{category.title}</h4>
                        <p className="text-xs text-muted-foreground">{category.articles} bài viết</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {category.items?.map((item, itemIndex) => (
                        <li key={`${category.title}-${itemIndex}`} className="leading-snug">
                          • {item}
                        </li>
                      ))}
                    </ul>
                    <Button variant="link" className="px-0 text-primary font-semibold">
                      Xem tất cả {category.title.toLowerCase()}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Câu hỏi thường gặp</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {popularArticles.map((article, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="w-full text-left p-4 hover:bg-muted/50 rounded-lg transition-colors border-b last:border-b-0 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                          <p className="flex-1 font-medium">{article.question}</p>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                        {isOpen && (
                          <p className="mt-3 pl-8 text-sm text-muted-foreground">{article.answer}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Không tìm thấy câu trả lời?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Liên hệ với chúng tôi qua các kênh sau
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Trò chuyện trực tiếp với đội ngũ hỗ trợ
                  </p>
                  <Button variant="outline" onClick={openChat}>
                    Bắt đầu chat
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gửi email cho chúng tôi
                  </p>
                  <Button variant="outline">Gửi email</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Hotline</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    1900-xxxx (8:00 - 22:00)
                  </p>
                  <Button variant="outline">Gọi ngay</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;

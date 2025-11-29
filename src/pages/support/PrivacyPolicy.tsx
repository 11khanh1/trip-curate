import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Thông tin chúng tôi thu thập",
      content: [
        "Thông tin cá nhân: Họ tên, email, số điện thoại, địa chỉ",
        "Thông tin thanh toán: Chi tiết thẻ, lịch sử giao dịch",
        "Thông tin đặt chỗ: Lịch trình, sở thích du lịch",
        "Dữ liệu kỹ thuật: IP address, browser, thiết bị",
      ],
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Cách chúng tôi sử dụng thông tin",
      content: [
        "Xử lý đơn đặt hàng và cung cấp dịch vụ",
        "Gửi xác nhận và thông tin quan trọng về đặt chỗ",
        "Cải thiện trải nghiệm người dùng",
        "Gửi thông tin khuyến mãi (nếu bạn đồng ý)",
        "Phân tích dữ liệu để cải thiện dịch vụ",
      ],
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Bảo mật thông tin",
      content: [
        "Mã hóa SSL/TLS cho mọi giao dịch",
        "Hệ thống bảo mật đa lớp",
        "Tuân thủ các tiêu chuẩn bảo mật quốc tế",
        "Không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý",
        "Đào tạo nhân viên về bảo mật thông tin",
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Quyền của bạn",
      content: [
        "Truy cập và xem thông tin cá nhân",
        "Yêu cầu chỉnh sửa hoặc xóa thông tin",
        "Từ chối nhận email marketing",
        "Yêu cầu sao lưu dữ liệu cá nhân",
        "Khiếu nại về việc xử lý dữ liệu",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">Chính sách bảo mật</h1>
            <p className="text-xl">
              Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn
            </p>
            <p className="text-sm mt-4 opacity-90">
              Cập nhật lần cuối: 01/03/2025
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-12">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  VietTravel ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư của người dùng. 
                  Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và 
                  bảo vệ thông tin cá nhân của bạn khi bạn sử dụng dịch vụ của chúng tôi.
                </p>
              </CardContent>
            </Card>

            {/* Policy Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <Card key={index}>
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                        {section.icon}
                      </div>
                      <h2 className="text-2xl font-bold mt-1">{section.title}</h2>
                    </div>
                    <ul className="space-y-3 ml-16">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cookie Policy */}
            <Card className="mt-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Chính sách Cookie</h2>
                <p className="text-muted-foreground mb-4">
                  Chúng tôi sử dụng cookie và công nghệ tương tự để:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Ghi nhớ thông tin đăng nhập của bạn</li>
                  <li>• Phân tích lưu lượng truy cập website</li>
                  <li>• Cá nhân hóa nội dung và quảng cáo</li>
                  <li>• Cải thiện trải nghiệm người dùng</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Bạn có thể quản lý cookie thông qua cài đặt trình duyệt của mình.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="mt-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Lưu trữ dữ liệu</h2>
                <p className="text-muted-foreground mb-4">
                  Chúng tôi lưu trữ thông tin cá nhân của bạn:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li>• Trong thời gian cần thiết để cung cấp dịch vụ</li>
                  <li>• Theo yêu cầu pháp lý và quy định</li>
                  <li>• Để giải quyết tranh chấp và thực thi thỏa thuận</li>
                  <li>• Cho đến khi bạn yêu cầu xóa (trừ trường hợp pháp luật yêu cầu khác)</li>
                </ul>
              </CardContent>
            </Card>

            {/* International Transfers */}
            <Card className="mt-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Chuyển giao dữ liệu quốc tế</h2>
                <p className="text-muted-foreground">
                  Thông tin của bạn có thể được chuyển và lưu trữ tại các máy chủ đặt ở các quốc gia khác. 
                  Chúng tôi đảm bảo rằng tất cả các chuyển giao dữ liệu tuân thủ các tiêu chuẩn bảo mật 
                  và quy định về bảo vệ dữ liệu hiện hành.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="mt-8 border-primary">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Liên hệ về quyền riêng tư</h2>
                <p className="text-muted-foreground mb-4">
                  Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc muốn thực hiện quyền của mình, 
                  vui lòng liên hệ:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> privacy@klook.com.vn</p>
                  <p><strong>Địa chỉ:</strong> Tầng 10, Tòa nhà ABC, 123 Nguyễn Huệ, Q.1, TP.HCM</p>
                  <p><strong>Điện thoại:</strong> 1900-xxxx</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-8 space-y-3">
                <h3 className="text-xl font-semibold">Liên kết & tài nguyên</h3>
                <p className="text-sm text-muted-foreground">
                  Đọc thêm về điều khoản sử dụng và quyền hủy đặt chỗ để hiểu rõ quyền lợi của bạn trên VietTravel.
                </p>
                <ul className="text-primary font-medium space-y-2 text-sm">
                  <li><a href="/support/terms-of-service">Điều khoản sử dụng</a></li>
                  <li><a href="/support/cancellation-policy">Chính sách hủy</a></li>
                  <li><a href="/support/help-center">Trung tâm trợ giúp</a></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

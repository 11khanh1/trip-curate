import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <FileText className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">Điều khoản sử dụng</h1>
            <p className="text-xl">
              Quy định và điều kiện khi sử dụng dịch vụ VietTravel
            </p>
            <p className="text-sm mt-4 opacity-90">
              Có hiệu lực từ: 01/01/2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 border-amber-500">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Thông báo quan trọng</h3>
                    <p className="text-muted-foreground">
                      Bằng việc truy cập và sử dụng dịch vụ của VietTravel, bạn đồng ý tuân thủ các điều khoản 
                      và điều kiện được nêu dưới đây. Vui lòng đọc kỹ trước khi sử dụng.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">1. Định nghĩa</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>"VietTravel"</strong> hoặc <strong>"Chúng tôi"</strong> là nền tảng đặt chỗ trực tuyến.</p>
                    <p><strong>"Người dùng"</strong> hoặc <strong>"Bạn"</strong> là cá nhân/tổ chức sử dụng dịch vụ.</p>
                    <p><strong>"Dịch vụ"</strong> bao gồm website, ứng dụng di động và các nền tảng liên quan.</p>
                    <p><strong>"Nhà cung cấp"</strong> là đối tác cung cấp các hoạt động và dịch vụ du lịch.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">2. Sử dụng dịch vụ</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">2.1 Điều kiện sử dụng</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Phải từ đủ 18 tuổi hoặc có sự đồng ý của người giám hộ</li>
                        <li>• Cung cấp thông tin chính xác và đầy đủ</li>
                        <li>• Không được sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                        <li>• Tuân thủ mọi quy định pháp luật hiện hành</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">2.2 Tài khoản người dùng</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Bạn chịu trách nhiệm bảo mật thông tin tài khoản</li>
                        <li>• Không chia sẻ tài khoản với người khác</li>
                        <li>• Thông báo ngay nếu phát hiện truy cập trái phép</li>
                        <li>• VietTravel có quyền tạm khóa tài khoản nếu phát hiện vi phạm</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">3. Đặt chỗ và thanh toán</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">3.1 Quy trình đặt chỗ</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Kiểm tra kỹ thông tin trước khi xác nhận</li>
                        <li>• Đơn hàng chỉ được xác nhận sau khi thanh toán thành công</li>
                        <li>• E-voucher sẽ được gửi qua email sau khi xác nhận</li>
                        <li>• Người dùng phải xuất trình voucher tại địa điểm</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">3.2 Giá cả và phí</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Giá hiển thị bằng VND (trừ khi có ghi chú khác)</li>
                        <li>• Giá có thể thay đổi mà không cần báo trước</li>
                        <li>• Phí dịch vụ và thuế được tính riêng (nếu có)</li>
                        <li>• VietTravel không chịu trách nhiệm về sai sót giá do lỗi kỹ thuật</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">3.3 Phương thức thanh toán</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Thẻ tín dụng/ghi nợ quốc tế</li>
                        <li>• Ví điện tử (Momo, ZaloPay, VNPay)</li>
                        <li>• Chuyển khoản ngân hàng</li>
                        <li>• Thanh toán qua ứng dụng</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">4. Hủy và hoàn tiền</h2>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Chính sách hủy tùy thuộc vào từng sản phẩm/dịch vụ</li>
                    <li>• Vui lòng kiểm tra điều khoản cụ thể trước khi đặt</li>
                    <li>• Hoàn tiền sẽ được xử lý theo phương thức thanh toán ban đầu</li>
                    <li>• Thời gian hoàn tiền: 7-14 ngày làm việc</li>
                    <li>• VietTravel không chịu trách nhiệm về phí ngân hàng phát sinh</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">5. Trách nhiệm và miễn trừ</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">5.1 Trách nhiệm của VietTravel</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Cung cấp nền tảng đặt chỗ trung gian</li>
                        <li>• Bảo vệ thông tin người dùng</li>
                        <li>• Hỗ trợ khách hàng trong giờ làm việc</li>
                        <li>• Xử lý khiếu nại và tranh chấp</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">5.2 Miễn trừ trách nhiệm</h3>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• VietTravel không chịu trách nhiệm về chất lượng dịch vụ từ nhà cung cấp</li>
                        <li>• Không đảm bảo website hoạt động liên tục không lỗi</li>
                        <li>• Không chịu trách nhiệm về thiệt hại gián tiếp</li>
                        <li>• Không chịu trách nhiệm về hành vi của bên thứ ba</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">6. Quyền sở hữu trí tuệ</h2>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Mọi nội dung trên website thuộc quyền sở hữu của VietTravel</li>
                    <li>• Không được sao chép, phân phối mà không có sự cho phép</li>
                    <li>• Logo, thương hiệu được bảo vệ bởi luật sở hữu trí tuệ</li>
                    <li>• Vi phạm sẽ bị xử lý theo quy định pháp luật</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">7. Thay đổi điều khoản</h2>
                  <p className="text-muted-foreground mb-4">
                    VietTravel có quyền thay đổi điều khoản sử dụng này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực 
                    ngay khi được đăng tải trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi 
                    đồng nghĩa với việc chấp nhận các điều khoản mới.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">8. Luật áp dụng và giải quyết tranh chấp</h2>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• Điều khoản này tuân theo pháp luật Việt Nam</li>
                    <li>• Mọi tranh chấp sẽ được giải quyết thông qua thương lượng</li>
                    <li>• Nếu không thương lượng được, sẽ đưa ra Tòa án có thẩm quyền tại TP.HCM</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">9. Thông tin liên hệ</h2>
                  <p className="text-muted-foreground mb-4">
                    Nếu bạn có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ:
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Công ty:</strong> VietTravel Việt Nam</p>
                    <p><strong>Địa chỉ:</strong> Tầng 10, Tòa nhà ABC, 123 Nguyễn Huệ, Q.1, TP.HCM</p>
                    <p><strong>Email:</strong> legal@klook.com.vn</p>
                    <p><strong>Hotline:</strong> 1900-xxxx</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-8 space-y-3">
                  <h3 className="text-xl font-semibold">Tài nguyên liên quan</h3>
                  <p className="text-sm text-muted-foreground">
                    Để hiểu rõ hơn về cách VietTravel bảo vệ dữ liệu và xử lý hủy đặt chỗ, hãy xem thêm các trang dưới đây.
                  </p>
                  <ul className="text-primary font-medium space-y-2 text-sm">
                    <li><a href="/support/privacy-policy">Chính sách bảo mật</a></li>
                    <li><a href="/support/cancellation-policy">Chính sách hủy</a></li>
                    <li><a href="/support/help-center">Trung tâm trợ giúp</a></li>
                  </ul>
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

export default TermsOfService;

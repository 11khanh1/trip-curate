import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

const CancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Chính sách hủy đặt chỗ</h1>
            <p className="text-xl">
              Tìm hiểu về quy định hủy đặt chỗ và hoàn tiền
            </p>
          </div>
        </div>
      </section>

      {/* Policy Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 border-primary">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Lưu ý quan trọng</h3>
                    <p className="text-muted-foreground">
                      Chính sách hủy đặt chỗ có thể khác nhau tùy theo từng hoạt động và nhà cung cấp dịch vụ. 
                      Vui lòng kiểm tra kỹ điều khoản cụ thể của từng sản phẩm trước khi đặt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Các loại chính sách hủy</h2>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Miễn phí hủy</h3>
                          <p className="text-muted-foreground mb-3">
                            Hủy miễn phí và được hoàn tiền 100% nếu hủy trước thời gian quy định:
                          </p>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Hủy ít nhất 24-72 giờ trước ngày sử dụng (tùy sản phẩm)</li>
                            <li>• Nhận hoàn tiền đầy đủ trong vòng 7-14 ngày làm việc</li>
                            <li>• Không áp dụng phí hủy</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Hủy có phí</h3>
                          <p className="text-muted-foreground mb-3">
                            Phí hủy sẽ được tính dựa trên thời gian hủy:
                          </p>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Hủy 7+ ngày trước: Phí 10-20%</li>
                            <li>• Hủy 3-7 ngày trước: Phí 30-50%</li>
                            <li>• Hủy 1-3 ngày trước: Phí 50-80%</li>
                            <li>• Hủy trong vòng 24 giờ: Phí 80-100%</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Không hoàn tiền</h3>
                          <p className="text-muted-foreground mb-3">
                            Một số sản phẩm không cho phép hủy hoặc đổi lịch:
                          </p>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Vé ưu đãi đặc biệt</li>
                            <li>• Tour có giá khuyến mãi</li>
                            <li>• Sự kiện và buổi biểu diễn</li>
                            <li>• Một số dịch vụ vận chuyển</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Quy trình hủy đặt chỗ</h2>
                <Card>
                  <CardContent className="p-6">
                    <ol className="space-y-4">
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">1</span>
                        <div>
                          <h4 className="font-semibold mb-1">Đăng nhập tài khoản</h4>
                          <p className="text-sm text-muted-foreground">Truy cập vào phần "Đơn hàng của tôi"</p>
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">2</span>
                        <div>
                          <h4 className="font-semibold mb-1">Chọn đơn hàng cần hủy</h4>
                          <p className="text-sm text-muted-foreground">Kiểm tra chính sách hủy cụ thể của đơn hàng</p>
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">3</span>
                        <div>
                          <h4 className="font-semibold mb-1">Xác nhận hủy</h4>
                          <p className="text-sm text-muted-foreground">Nhấn nút "Hủy đặt chỗ" và xác nhận</p>
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">4</span>
                        <div>
                          <h4 className="font-semibold mb-1">Nhận xác nhận</h4>
                          <p className="text-sm text-muted-foreground">Nhận email xác nhận hủy và thông tin hoàn tiền</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Thời gian hoàn tiền</h2>
                <Card>
                  <CardContent className="p-6">
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Thẻ tín dụng/ghi nợ: 7-14 ngày làm việc</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Ví điện tử: 3-7 ngày làm việc</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Chuyển khoản: 5-10 ngày làm việc</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Trường hợp đặc biệt</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Thay đổi do thời tiết</h4>
                        <p className="text-sm text-muted-foreground">
                          Nếu hoạt động bị hủy do điều kiện thời tiết xấu, bạn sẽ được hoàn tiền đầy đủ 
                          hoặc có thể đổi sang ngày khác.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Lý do y tế khẩn cấp</h4>
                        <p className="text-sm text-muted-foreground">
                          Cần cung cấp giấy tờ y tế chứng minh. Sẽ được xem xét từng trường hợp cụ thể.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Thay đổi từ nhà cung cấp</h4>
                        <p className="text-sm text-muted-foreground">
                          Nếu nhà cung cấp hủy hoạt động, bạn sẽ được hoàn tiền 100% hoặc đổi sang 
                          sản phẩm tương đương.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CancellationPolicy;
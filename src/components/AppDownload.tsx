import { Smartphone, QrCode, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AppDownload = () => {
  return (
    <section className="py-16 gradient-orange">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ứng dụng du lịch từ A tới Z
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Ưu đãi hot khi đặt tour, vé tham quan, khách sạn, vé di chuyển khắp thế giới qua app VietTravel!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Email Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 text-white mr-3" />
              <h3 className="text-white font-semibold">
                Nhận & gửi magic link đến email của bạn
              </h3>
            </div>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Nhập email của bạn"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Gửi
              </Button>
            </div>
          </div>

          <div className="text-white text-xl font-medium">hoặc</div>

          {/* QR Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-white mr-3" />
              <h3 className="text-white font-semibold">
                Quét mã QR để tải ứng dụng VietTravel
              </h3>
            </div>
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mx-auto">
              <QrCode className="w-24 h-24 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-8 space-x-4">
          <Smartphone className="w-8 h-8 text-white" />
          <span className="text-white text-lg">Tải ngay ứng dụng VietTravel</span>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
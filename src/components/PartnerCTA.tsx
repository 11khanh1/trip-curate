import { ArrowRight, Sparkles, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PartnerCTAProps {
  className?: string;
}

const PartnerCTA = ({ className }: PartnerCTAProps) => {
  const navigate = useNavigate();

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-100 shadow-xl ${className ?? ""}`}
    >
      <div className="absolute -left-8 -top-12 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="relative z-10 grid gap-6 px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-orange-600">
            <Sparkles className="h-4 w-4" />
            Quan hệ đối tác
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Bạn là đối tác? Bạn là nhà cung cấp?
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Kết nối với hàng nghìn khách du lịch và tối ưu vận hành cùng VietTravel. Tham gia mạng lưới đối tác để nhận
            booking nhanh, quản lý tour dễ dàng và nhận hỗ trợ marketing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => navigate("/partner/register")}
            >
              Đăng ký hợp tác
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => navigate("/about/partnership")}
            >
              Tìm hiểu thêm
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white/70 p-6 shadow-lg backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/70 via-transparent to-amber-50/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <Handshake className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Một chạm đăng ký</p>
                <p className="text-sm text-muted-foreground">
                  Nộp hồ sơ online, duyệt nhanh, mở bán tour sau vài bước đơn giản.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-xl bg-orange-50/70 p-4 text-sm text-orange-900">
              <p className="font-semibold">Lợi ích nổi bật:</p>
              <ul className="space-y-2">
                <li>• Tiếp cận tệp khách lớn, thanh toán minh bạch</li>
                <li>• Hỗ trợ marketing & tối ưu lịch khởi hành</li>
                <li>• Dashboard quản lý tour, booking, doanh thu</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;

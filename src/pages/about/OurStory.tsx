import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Heart, Globe, Users, Award, Sparkles, Compass, Plane } from "lucide-react";

const milestones = [
  { year: "2014", title: "Khởi hành", desc: "Nhóm 5 người đam mê du lịch xây dựng sản phẩm đặt tour đầu tiên." },
  { year: "2018", title: "Mở rộng khu vực", desc: "Hơn 2000 đối tác, 15 điểm đến Đông Nam Á, ứng dụng mobile ra mắt." },
  { year: "2021", title: "Tăng tốc số", desc: "Cá nhân hoá bằng AI, quản lý booking real-time cho đối tác." },
  { year: "2024", title: "Toàn cầu", desc: "5.000+ hoạt động, 40+ điểm đến, hỗ trợ 24/7 đa ngôn ngữ." },
];

const values = [
  { icon: <Heart className="w-5 h-5 text-rose-500" />, title: "Lấy khách hàng làm trung tâm", desc: "Thiết kế trải nghiệm tối giản, rõ ràng, hỗ trợ tức thời." },
  { icon: <Globe className="w-5 h-5 text-sky-500" />, title: "Kết nối không biên giới", desc: "Liên tục mở rộng điểm đến và đối tác địa phương." },
  { icon: <Award className="w-5 h-5 text-amber-500" />, title: "Chất lượng & minh bạch", desc: "Chính sách rõ ràng, giá hiển thị trọn gói, hoàn tiền minh bạch." },
  { icon: <Users className="w-5 h-5 text-emerald-500" />, title: "Cộng đồng bền vững", desc: "Hợp tác với nhà cung cấp địa phương, thúc đẩy du lịch xanh." },
];

const OurStory = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TravelHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-600/10 to-slate-900" />
        <div className="container relative mx-auto px-4 py-20">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Hành trình VietTravel</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Câu chuyện của chúng tôi
              </h1>
              <p className="text-lg text-slate-200/80">
                Bắt đầu từ một nhóm du khách tò mò, VietTravel nay trở thành nền tảng du lịch được tin dùng tại châu Á, kết nối hàng ngàn trải nghiệm độc đáo với công nghệ đơn giản.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="rounded-full bg-white/10 border border-white/15 px-3 py-2 text-sm">5.000+ hoạt động</span>
                <span className="rounded-full bg-white/10 border border-white/15 px-3 py-2 text-sm">40+ điểm đến</span>
                <span className="rounded-full bg-white/10 border border-white/15 px-3 py-2 text-sm">24/7 hỗ trợ</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500/20 p-3"><Sparkles className="h-5 w-5 text-orange-300" /></div>
                  <div>
                    <p className="text-sm text-slate-200/80">Niềm tin từ du khách</p>
                    <p className="text-2xl font-semibold">12M+ lượt đặt</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500/20 p-3"><Plane className="h-5 w-5 text-blue-200" /></div>
                  <div>
                    <p className="text-sm text-slate-200/80">Đối tác địa phương</p>
                    <p className="text-2xl font-semibold">500+ nhà cung cấp</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/20 p-3"><Compass className="h-5 w-5 text-emerald-200" /></div>
                  <div>
                    <p className="text-sm text-slate-200/80">Mức độ hài lòng</p>
                    <p className="text-2xl font-semibold">4.8/5 trung bình</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white/10 p-2">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-200/80">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Các mốc đáng nhớ</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {milestones.map((m) => (
              <div key={m.year} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5">
                <p className="text-sm text-orange-200">{m.year}</p>
                <h4 className="text-lg font-semibold mt-2">{m.title}</h4>
                <p className="text-sm text-slate-200/80 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurStory;
               
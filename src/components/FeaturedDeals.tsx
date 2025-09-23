import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FeaturedDeals = () => {
  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ưu đãi cho bạn</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main promotional card */}
          <Card className="md:col-span-2 overflow-hidden rounded-xl">
            <div 
              className="relative h-48 bg-cover bg-center p-6 flex flex-col justify-between text-white"
              style={{
                backgroundImage: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              }}
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">✨</span>
                  <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">klook</span>
                </div>
                <div className="text-sm opacity-90 mb-1">Official Experience Partner</div>
                <div className="text-lg font-bold">TICKETS COMING SOON</div>
              </div>
              <Button size="sm" className="bg-white text-orange-500 hover:bg-white/90 w-fit">
                Find Out More
              </Button>
            </div>
          </Card>

          {/* Secondary promotional card */}
          <Card className="overflow-hidden rounded-xl">
            <div 
              className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between text-white"
              style={{
                backgroundImage: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              }}
            >
              <div className="text-xs bg-orange-500 px-2 py-1 rounded w-fit font-medium">
                KHÁCH SẠNG DEAL
              </div>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white w-fit">
                Đợt ngay 🔥
              </Button>
            </div>
          </Card>

          {/* Birthday sale card */}
          <Card className="overflow-hidden rounded-xl">
            <div 
              className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between text-white"
              style={{
                backgroundImage: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
              }}
            >
              <div>
                <div className="text-xs bg-white/20 px-2 py-1 rounded w-fit font-medium mb-2">
                  🎂 Sale Sinh Nhật
                </div>
                <div className="text-sm font-bold">Sale Sinh Nhật</div>
                <div className="text-xs opacity-90">Vé tham quan & Khách sạn</div>
                <div className="text-sm font-bold mt-1">Giảm đến 40%</div>
              </div>
              <div className="flex items-center justify-end">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeals;
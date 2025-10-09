import { Star, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeaturedDeals = () => {
  const deals = [
    {
      id: 1,
      title: "Sale Sinh Nhật",
      subtitle: "Vé tham quan & Khách sạn",
      discount: "Giảm đến 40%",
      bgColor: "bg-gradient-to-br from-purple-500 to-pink-500",
      textColor: "text-white",
      buttonText: "Sắn Deal ngay"
    },
    {
      id: 2,
      title: "SIÊU SALE SINH NHẬT VIETTRAVEL 11",
      subtitle: "🎂 Sinh Nhật Siêu To",
      discount: "Deal khủng",
      bgColor: "bg-gradient-to-br from-orange-500 to-red-500",
      textColor: "text-white",
      buttonText: "Sắn Deal ngay"
    },
    {
      id: 3,
      title: "Sale Sinh Nhật",
      subtitle: "Vé tham quan & Khách sạn",
      discount: "Giảm đến 40%",
      bgColor: "bg-gradient-to-br from-blue-500 to-purple-500",
      textColor: "text-white",
      buttonText: "Sắn Deal ngay"
    }
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Ưu đãi cho bạn
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${deal.bgColor} p-6 min-h-[200px] flex flex-col justify-between`}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 opacity-20">
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </div>
              <div className="absolute bottom-4 left-4 opacity-10">
                <div className="w-24 h-24 bg-white rounded-full"></div>
              </div>
              
              <div className={deal.textColor}>
                <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold mb-3 w-fit">
                  {deal.discount}
                </div>
                <h3 className="text-xl font-bold mb-2 leading-tight">{deal.title}</h3>
                <p className="text-white/90 text-sm mb-4">{deal.subtitle}</p>
              </div>
              
              <Button 
                size="sm"
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 w-fit text-xs font-semibold"
              >
                {deal.buttonText}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeals;
import { ArrowRight, Gift, Percent, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FeaturedDeals = () => {
  const deals = [
    {
      id: 1,
      title: "Sale Sinh Nhật",
      subtitle: "Vé tham quan & Khách sạn",
      discount: "Giảm đến 40%",
      bgColor: "bg-gradient-to-r from-orange-500 to-red-500",
      icon: Gift,
    },
    {
      id: 2,
      title: "Ưu đãi cuối tuần",
      subtitle: "Tours trong nước",
      discount: "Giảm đến 25%",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-500", 
      icon: Star,
    },
    {
      id: 3,
      title: "Flash Sale",
      subtitle: "Du lịch quốc tế",
      discount: "Giảm đến 60%",
      bgColor: "bg-gradient-to-r from-green-500 to-teal-500",
      icon: Percent,
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Ưu đãi cho bạn</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            Xem tất cả
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal) => {
            const IconComponent = deal.icon;
            return (
              <Card key={deal.id} className="overflow-hidden hover:shadow-hover transition-all duration-300 group cursor-pointer">
                <div className={`${deal.bgColor} p-6 text-white relative overflow-hidden`}>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className="h-8 w-8" />
                      <Badge className="bg-white/20 text-white border-white/30">
                        HOT
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{deal.title}</h3>
                    <p className="text-white/90 text-sm mb-3">{deal.subtitle}</p>
                    <p className="text-2xl font-bold">{deal.discount}</p>
                    
                    <Button 
                      className="mt-4 bg-white text-gray-900 hover:bg-white/90"
                      size="sm"
                    >
                      Khám phá ngay
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeals;
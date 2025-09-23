import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  return (
    <section className="relative min-h-[500px] gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-xl"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-20 w-24 h-24 bg-purple-400 rounded-full blur-xl"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Khám phá phiên bản tuyệt nhất của bạn!
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
            Mở ra chân trời mới, đam mê mới và đánh thức phiên bản rực rỡ của bạn cùng TravelBook - trên mọi hành trình, dù gần hay xa.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-hover">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Bạn muốn đi đâu?"
                  className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Ngày khởi hành"
                  className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white"
                  type="date"
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Số người"
                  className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white"
                />
              </div>
              
              <Button className="h-12 bg-gradient-orange text-white border-0 hover:opacity-90">
                <Search className="h-5 w-5 mr-2" />
                Khám phá
              </Button>
            </div>
          </div>
        </div>
        
        {/* Popular destinations */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {["Amazing Bay Đồng Nai", "Disneyland Shanghai", "Bà Nà Hills", "Phú Quốc", "Đà Lạt"].map((destination) => (
              <span 
                key={destination}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm hover:bg-white/30 cursor-pointer transition-colors"
              >
                {destination}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
import { Search, MapPin, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  return (
    <section className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-700">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Decorative floating elements */}
      <div className="absolute top-16 left-8 animate-bounce">
        <Star className="w-8 h-8 text-yellow-300 opacity-70" />
      </div>
      <div className="absolute top-32 right-16 animate-pulse">
        <div className="w-16 h-16 bg-orange-400 rounded-full opacity-30"></div>
      </div>
      <div className="absolute bottom-24 left-1/4 animate-bounce delay-300">
        <div className="w-12 h-12 bg-yellow-400 rounded-full opacity-40"></div>
      </div>
      <div className="absolute top-20 right-1/3 animate-pulse delay-500">
        <div className="w-20 h-20 bg-pink-400 rounded-full opacity-20"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          Khám phá phiên bản
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
            tuyệt nhất
          </span> của bạn!
        </h1>
        
        <p className="text-lg md:text-xl mb-8 text-white/90 max-w-3xl mx-auto font-medium">
          Mở ra chân trời mới, đam mê mới và đánh thức phiên bản rực rỡ của bạn cùng VietTravel - trên mọi hành trình, dù gần hay xa.
        </p>

        {/* Search Bar - More compact like VietTravel */}
        <div className="bg-white rounded-lg p-1 max-w-xl mx-auto shadow-2xl">
          <div className="flex items-center">
            <div className="flex-1 flex items-center px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <Input 
                placeholder="Tìm theo điểm đến, hoạt động"
                className="border-0 focus-visible:ring-0 text-gray-700 placeholder:text-gray-500 p-0"
              />
            </div>
            <Button className="gradient-orange hover:shadow-hover px-6 py-3 text-white font-semibold rounded-md mr-1">
              Khám phá
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

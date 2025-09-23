import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Decorative elements matching Klook's style */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-orange-400/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-purple-400/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-blue-400/20 rounded-full blur-lg"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[600px]">
        <div className="text-center text-white mb-12 max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Khám phá phiên bản tuyệt nhất của bạn!
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Mở ra chân trời mới, đam mê mới và đánh thức phiên bản rực rỡ của bạn cùng Klook - trên mọi hành trình, dù gần hay xa.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-white rounded-xl p-4 shadow-2xl">
            <div className="flex items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="disneyland shanghai"
                  className="pl-12 h-14 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none"
                />
              </div>
              <Button className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg ml-4">
                Khám phá
              </Button>
            </div>
          </div>
        </div>
        
        {/* Popular destinations */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {["amazing bay đồng nai", "disneyland shanghai", "bà nà hills"].map((destination) => (
              <span 
                key={destination}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm hover:bg-white/30 cursor-pointer transition-colors border border-white/30"
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
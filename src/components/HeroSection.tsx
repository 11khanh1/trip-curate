import { Search, MapPin, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-[420px] md:min-h-[520px] flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-700 px-4">
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute top-16 left-4 animate-bounce">
        <Star className="w-6 h-6 text-yellow-300 opacity-70" />
      </div>
      <div className="absolute top-10 right-10 animate-pulse">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-400 rounded-full opacity-30" />
      </div>
      <div className="absolute bottom-16 left-1/5 animate-bounce delay-300">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-full opacity-40" />
      </div>
      <div className="absolute top-24 right-1/3 animate-pulse delay-500">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-400 rounded-full opacity-20" />
      </div>

      <div className="relative z-10 text-center text-white max-w-3xl md:max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight px-2">
          Khám phá phiên bản{" "}
          <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
            tuyệt nhất
          </span>{" "}
          của bạn!
        </h1>

        <p className="text-base sm:text-lg md:text-xl mb-8 text-white/90 px-2">
          Mở ra chân trời mới, đam mê mới và đánh thức phiên bản rực rỡ của bạn cùng VietTravel - trên mọi
          hành trình, dù gần hay xa.
        </p>

        <div className="bg-white rounded-xl p-3 sm:p-1 max-w-xl mx-auto shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 flex items-center px-3 py-2 rounded-lg bg-white">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <Input
                placeholder="Tìm theo điểm đến, hoạt động"
                className="border-0 focus-visible:ring-0 text-gray-700 placeholder:text-gray-500 p-0 text-sm sm:text-base"
              />
            </div>
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6 py-3 shadow-lg">
              Khám phá
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

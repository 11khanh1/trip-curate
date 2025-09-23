import { Search, Globe, HelpCircle, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TravelHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Search */}
          <div className="flex items-center space-x-6 flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold" style={{color: '#FF5722'}}>klook</span>
            </div>
            
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Tìm thêm điểm đến, hoạt động" 
                  className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
          
          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-500">
                <Globe className="h-4 w-4" />
                <span>VN</span>
              </div>
              <span>VND</span>
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-500">
                <HelpCircle className="h-4 w-4" />
                <span>Trợ giúp</span>
              </div>
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-500">
                <ShoppingCart className="h-4 w-4" />
                <span>Xem giỏ hàng</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-500">
                Đăng ký
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                Đăng nhập
              </Button>
            </div>
          </div>
        </div>
        
        {/* Secondary Navigation */}
        <nav className="mt-4 border-t pt-3">
          <div className="flex items-center space-x-8 text-sm">
            <a href="#" className="font-medium hover:text-orange-500 transition-colors">
              Khu vực phổ biến
            </a>
            <a href="#" className="font-medium hover:text-orange-500 transition-colors">
              Điểm đến phổ biến
            </a>
            <a href="#" className="font-medium hover:text-orange-500 transition-colors">
              Địa danh phổ biến
            </a>
            <a href="#" className="font-medium hover:text-orange-500 transition-colors">
              Khám phá Klook
            </a>
            <a href="#" className="flex items-center space-x-1 font-medium text-orange-500">
              <span>🎁</span>
              <span>Phiếu Quà Tặng Klook</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TravelHeader;
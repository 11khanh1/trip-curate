import { Search, Menu, User, Globe, ShoppingBag, Gift, ChevronDown, HelpCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import AuthModal from "./AuthModal";

const TravelHeader = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          {/* Main header */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span className="text-primary">klook</span>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm theo điểm đến, hoạt động"
                  className="pl-10 pr-4 py-2 w-full border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="hidden lg:flex text-gray-600 hover:text-gray-800 text-sm">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyMCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIGZpbGw9IiNEQTAyMGUiLz4KPHJLY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHk9IjUiIGZpbGw9IiNGRkVCM0IiLz4KPHJLY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHk9IjEwIiBmaWxsPSIjREEwMjBlIi8+Cjwvc3ZnPgo=" alt="VN flag" className="w-4 h-4 mr-1" />
                VN
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden lg:flex text-gray-600 hover:text-gray-800 text-sm">
                VND
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm">
                Mở ứng dụng
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm">
                <HelpCircle className="w-4 h-4 mr-1" />
                Trợ giúp
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                Xem gần đây
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Đăng ký
              </Button>
              
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg"
              >
                Đăng nhập
              </Button>
              
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Secondary navigation */}
          <div className="border-t py-3">
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors">
                Khu vực phổ biến
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors">
                Điểm đến phổ biến
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors">
                Địa danh phổ biến
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors">
                Khám phá Klook
              </a>
              <a href="#" className="flex items-center text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                <Gift className="w-4 h-4 mr-1" />
                🎁 Phiếu Quà Tặng Klook
              </a>
            </nav>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default TravelHeader;
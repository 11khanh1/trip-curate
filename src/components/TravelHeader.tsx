import { Search, Menu, User, Globe, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AuthModal from "./AuthModal";

const TravelHeader = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-12">
              <div className="text-3xl font-bold">
                <span className="text-primary">klook</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors py-2">
                  Khu vực phổ biến
                </a>
                <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors py-2">
                  Điểm đến phổ biến
                </a>
                <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors py-2">
                  Địa danh phổ biến
                </a>
                <a href="#" className="text-sm text-gray-700 hover:text-primary transition-colors py-2">
                  Khám phá Klook
                </a>
                <a href="#" className="flex items-center text-sm text-primary font-medium hover:text-orange-600 transition-colors py-2">
                  <Gift className="w-4 h-4 mr-1" />
                  🎁 Phiếu Quà Tặng Klook
                </a>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800">
                <Globe className="w-4 h-4 mr-1" />
                VN
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800">
                <ShoppingBag className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-gray-600 hover:text-gray-800"
              >
                <User className="w-4 h-4 mr-1" />
                Đăng nhập
              </Button>
              
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
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
import { Search, Menu, User, Globe, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AuthModal from "./AuthModal";

const TravelHeader = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold">
                <span className="text-primary">klook</span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">
                  Khu vực phổ biến
                </a>
                <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">
                  Điểm đến phổ biến
                </a>
                <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">
                  Địa danh phổ biến
                </a>
                <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">
                  Khám phá Klook
                </a>
                <a href="#" className="flex items-center text-sm text-foreground hover:text-primary transition-colors">
                  <Gift className="w-4 h-4 mr-1" />
                  Phiếu Quà Tặng Klook
                </a>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Globe className="w-4 h-4 mr-2" />
                VN
              </Button>
              
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <ShoppingBag className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                <User className="w-4 h-4 mr-2" />
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
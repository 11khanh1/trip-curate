import { Search, Menu, User, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TravelHeader = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top navigation */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-foreground">TravelBook</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <span className="text-muted-foreground">VND</span>
            <span className="text-muted-foreground">Trợ giúp</span>
            <span className="text-muted-foreground">Xem giỏ hàng</span>
            <Button variant="outline" size="sm">Đăng ký</Button>
            <Button size="sm" className="bg-gradient-orange text-white border-0">Đăng nhập</Button>
          </div>
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main navigation */}
        <nav className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Khu vực phổ biến
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Điểm đến phổ biến
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Địa danh phổ biến
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Khám phá TravelBook
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TravelHeader;
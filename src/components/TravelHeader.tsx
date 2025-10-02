import { Search, Menu, User, Globe, ShoppingBag, Gift, ChevronDown, HelpCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const TravelHeader = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser, setCurrentUser } = useUser();


  const regions = [
    { id: "1", name: "VIỆT NAM", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop", url: "/regions/vietnam" },
    { id: "2", name: "NHẬT BẢN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=100&h=100&fit=crop", url: "/regions/japan" },
    { id: "3", name: "SINGAPORE", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop", url: "/regions/singapore" },
    { id: "4", name: "THÁI LAN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop", url: "/regions/thailand" },
    { id: "5", name: "TRUNG QUỐC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=100&h=100&fit=crop", url: "/regions/china" },
    { id: "6", name: "HÀN QUỐC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop", url: "/regions/south-korea" },
    { id: "7", name: "ÚC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=100&h=100&fit=crop", url: "/regions/australia" },
    { id: "8", name: "ANH", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=100&h=100&fit=crop", url: "/regions/uk" },
    { id: "9", name: "THỤY SĨ", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=100&h=100&fit=crop", url: "/regions/switzerland" },
    { id: "10", name: "MỸ", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=100&h=100&fit=crop", url: "/regions/usa" },
    { id: "11", name: "MALAYSIA", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=100&h=100&fit=crop", url: "/regions/malaysia" },
    { id: "12", name: "INDONESIA", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=100&h=100&fit=crop", url: "/regions/indonesia" }
  ];

  const destinations = [
    { id: "1", name: "Sapa", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&h=100&fit=crop" },
    { id: "2", name: "Thượng Hải", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&h=100&fit=crop" },
    { id: "3", name: "Tokyo", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop" },
    { id: "4", name: "Hà Nội", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=100&h=100&fit=crop" },
    { id: "5", name: "TP Hồ Chí Minh", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop" },
    { id: "6", name: "Bangkok", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=100&h=100&fit=crop" },
    { id: "7", name: "Osaka", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=100&h=100&fit=crop" },
    { id: "8", name: "Hồng Kông", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=100&h=100&fit=crop" },
    { id: "9", name: "Phú Quốc", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop" },
    { id: "10", name: "Nha Trang", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop" },
    { id: "11", name: "Đài Bắc", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=100&h=100&fit=crop" },
    { id: "12", name: "Đà Nẵng", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop" },
    { id: "13", name: "Kyoto", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=100&h=100&fit=crop" },
    { id: "14", name: "Seoul", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop" },
    { id: "15", name: "Edinburgh", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=100&h=100&fit=crop" },
    { id: "16", name: "Hội An", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&h=100&fit=crop" }
  ];

  const landmarks = [
    { id: "1", name: "Cung điện Grand", location: "THÁI LAN", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop" },
    { id: "2", name: "Núi Phú Sĩ", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=100&h=100&fit=crop" },
    { id: "3", name: "Legoland Discovery Center Tokyo", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop" },
    { id: "4", name: "Sands SkyPark Observation Deck Singapore", location: "SINGAPORE", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop" },
    { id: "5", name: "sunway lagoon", location: "MALAYSIA", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=100&h=100&fit=crop" },
    { id: "6", name: "Tokyo Disney Resort", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=100&h=100&fit=crop" },
    { id: "7", name: "Hong Kong Disneyland", location: "Hồng Kông", image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=100&h=100&fit=crop" },
    { id: "8", name: "Armani Hotel Dubai, Burj Khalifa", location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100&h=100&fit=crop" },
    { id: "9", name: "Tokyo Skytree", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop" },
    { id: "10", name: "Tháp Eiffel", location: "PHÁP", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=100&h=100&fit=crop" },
    { id: "11", name: "Ghibli Park", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=100&h=100&fit=crop" },
    { id: "12", name: "Nijo Castle", location: "NHẬT BẢN", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=100&h=100&fit=crop" },
    { id: "13", name: "Seoul Sky", location: "HÀN QUỐC", image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop" },
    { id: "14", name: "Dhow Cruise Dubai", location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=100&h=100&fit=crop" },
    { id: "15", name: "Bánh xe Ferris Miramar", location: "ĐÀI LOAN", image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=100&h=100&fit=crop" },
    { id: "16", name: "Yas Island", location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=100&h=100&fit=crop" }
  ];

  const exploreCategories = [
    {
      id: "1",
      icon: "🎯",
      title: "Các hoạt động nền trải nghiệm",
      items: ["Tour & Trải nghiệm", "Tour trong ngày", "Massage & Spa", "Hoạt động ngoài trời", "Trải nghiệm văn hóa", "Thể thao dưới nước", "Du thuyền", "Vé tham quan"]
    },
    {
      id: "2",
      icon: "🏨",
      title: "Chỗ ở",
      items: ["Khách sạn"]
    },
    {
      id: "3",
      icon: "🚌",
      title: "Các lựa chọn di chuyển",
      items: ["Xe sân bay", "Thuê xe tự lái", "Vé tàu châu Âu", "Vé tàu cao tốc Trung Quốc", "Vé tàu Nhật Bản", "Vé tàu Shinkansen", "Xe buýt Hàn Quốc"]
    },
    {
      id: "4",
      icon: "📱",
      title: "Sản phẩm du lịch thiết yếu",
      items: ["WiFi và SIM"]
    }
  ];

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          {/* Main header */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold">
                <span className="text-primary">klook</span>
              </a>
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
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hidden lg:flex text-gray-600 hover:text-gray-800 text-sm">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyMCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIGZpbGw9IiNEQTAyMGUiLz4KPHJLY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHk9IjUiIGZpbGw9IiNGRkVCM0IiLz4KPHJLY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHk9IjEwIiBmaWxsPSIjREEwMjBlIi8+Cjwvc3ZnPgo="
                  alt="VN flag"
                  className="w-4 h-4 mr-1"
                />
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

              {currentUser ? (
  // Nếu đã đăng nhập
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />

                  {/* Dropdown menu */}
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <span className="font-medium text-gray-800">{currentUser.name}</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            setCurrentUser(null);
                          }}
                        >
                          Đăng xuất
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                // Nếu chưa đăng nhập
                <>
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
                </>
              )}

              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          
          {/* Secondary navigation */}
          <div className="border-t py-3">
            <NavigationMenu>
              <NavigationMenuList className="flex items-center space-x-8">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Khu vực phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {regions.map((region) => (
                          <Link key={region.id} to={region.url} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <img src={region.image} alt={region.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="text-xs text-gray-500">{region.subtitle}</p>
                              <h3 className="font-semibold text-gray-900">{region.name}</h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Điểm đến phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {destinations.map((destination) => (
                          <a key={destination.id} href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <img src={destination.image} alt={destination.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="text-xs text-gray-500">{destination.subtitle}</p>
                              <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Địa danh phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {landmarks.map((landmark) => (
                          <a key={landmark.id} href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <img src={landmark.image} alt={landmark.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{landmark.name}</h3>
                              <p className="text-xs text-gray-500">{landmark.location}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Khám phá Klook
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-8">
                        {exploreCategories.map((category) => (
                          <div key={category.id}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">{category.icon}</span>
                              <h3 className="font-semibold text-gray-900 text-sm">{category.title}</h3>
                            </div>
                            <ul className="space-y-2">
                              {category.items.map((item, index) => (
                                <li key={index}>
                                  <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                                    {item}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a href="#" className="flex items-center text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                    <Gift className="w-4 h-4 mr-1" />
                    🎁 Phiếu Quà Tặng Klook
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
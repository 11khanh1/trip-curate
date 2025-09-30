import { useState } from "react";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AllActivities = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const allActivities = [
    {
      id: "1",
      title: "Dịch Vụ Đón Tiễn Ưu Tiên Tại Sân Bay Tân Sơn Nhất (SGN) - Hồ Chí Minh",
      location: "Thành phố Hồ Chí Minh",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop",
      rating: 4.4,
      reviewCount: 1840,
      price: 765000,
      originalPrice: 850000,
      discount: 10,
      duration: "1-2 giờ",
      category: "Dịch vụ du lịch",
      isPopular: true,
      features: ["Đặt trước cho ngày mai", "Miễn phí huỷ", "Xác nhận tức thời"]
    },
    {
      id: "2", 
      title: "Vé Công Viên Nước Vịnh Kỳ Diệu",
      location: "Thành phố Biên Hòa",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
      rating: 4.6,
      reviewCount: 349,
      price: 351500,
      duration: "Cả ngày",
      category: "Công viên giải trí",
      features: ["Đặt ngay hôm nay", "Miễn phí huỷ", "Xác nhận tức thời"]
    },
    {
      id: "3",
      title: "Tour Ngày Địa đạo Củ Chi và Đồng Bằng Sông Cửu Long từ TP.HCM",
      location: "Thành phố Hồ Chí Minh", 
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400&h=300&fit=crop",
      rating: 4.8,
      reviewCount: 2156,
      price: 1250000,
      duration: "Cả ngày",
      category: "Tour",
      isPopular: true,
      features: ["Đón tại khách sạn", "Tour riêng", "Hướng dẫn tiếng Việt"]
    },
    {
      id: "4",
      title: "Vé Tham Quan Bà Nà Hills & Cầu Vàng",
      location: "Đà Nẵng",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      rating: 4.7,
      reviewCount: 5240,
      price: 650000,
      originalPrice: 750000,
      discount: 13,
      duration: "Cả ngày",
      category: "Điểm tham quan",
      features: ["Cáp treo", "Miễn phí huỷ", "Vé điện tử"]
    },
    {
      id: "5",
      title: "Tour Phố Cổ Hội An & Đèn Lồng",
      location: "Hội An",
      image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop", 
      rating: 4.9,
      reviewCount: 1823,
      price: 450000,
      duration: "Nửa ngày",
      category: "Tour",
      features: ["Hướng dẫn viên", "Thuyền thúng", "Đèn lồng"]
    },
    {
      id: "6",
      title: "Vé Tham Quan Vinpearl Land Nha Trang",
      location: "Nha Trang",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
      rating: 4.5,
      reviewCount: 3421,
      price: 880000,
      originalPrice: 1000000,
      discount: 12,
      duration: "Cả ngày",
      category: "Công viên giải trí",
      isPopular: true,
      features: ["Cáp treo", "Buffet", "Show nghệ thuật"]
    },
    {
      id: "7",
      title: "eSIM 4G Việt Nam - Nhận Mã QR Qua Email",
      location: "Việt Nam",
      image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=400&h=300&fit=crop",
      rating: 4.6,
      reviewCount: 2152,
      price: 140000,
      originalPrice: 205000,
      discount: 32,
      duration: "7-30 ngày",
      category: "WiFi & Thẻ SIM",
      features: ["Đặt ngay hôm nay", "Xác nhận tức thời", "Miễn phí huỷ"]
    },
    {
      id: "8",
      title: "Vé Tham Quan Phú Quốc United Center",
      location: "Phú Quốc",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      rating: 4.4,
      reviewCount: 892,
      price: 550000,
      duration: "Nửa ngày",
      category: "Điểm tham quan",
      features: ["Vé điện tử", "Xác nhận tức thời", "Miễn phí huỷ"]
    },
    {
      id: "9",
      title: "Tour Vịnh Hạ Long & Hang Sửng Sốt",
      location: "Quảng Ninh",
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop",
      rating: 4.8,
      reviewCount: 3654,
      price: 950000,
      duration: "Cả ngày",
      category: "Tour",
      isPopular: true,
      features: ["Đón tại khách sạn", "Bữa trưa", "Hướng dẫn viên"]
    },
    {
      id: "10",
      title: "Vé Sun World Fansipan Legend",
      location: "Sa Pa",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      rating: 4.7,
      reviewCount: 2341,
      price: 750000,
      originalPrice: 850000,
      discount: 12,
      duration: "Cả ngày",
      category: "Công viên giải trí",
      features: ["Cáp treo", "Xác nhận tức thời", "Vé điện tử"]
    },
    {
      id: "11",
      title: "Tour Trekking Núi Hàm Lợn & Cánh Đồng Lúa",
      location: "Sa Pa",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      rating: 4.6,
      reviewCount: 1234,
      price: 580000,
      duration: "Cả ngày",
      category: "Tour",
      features: ["Hướng dẫn viên", "Bữa trưa", "Đón tại khách sạn"]
    },
    {
      id: "12",
      title: "Vé Tham Quan Asia Park Đà Nẵng",
      location: "Đà Nẵng",
      image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop",
      rating: 4.5,
      reviewCount: 1567,
      price: 200000,
      duration: "Nửa ngày",
      category: "Công viên giải trí",
      features: ["Vé điện tử", "Xác nhận tức thời", "Miễn xếp hàng"]
    }
  ];

  const categories = [
    { id: "all", label: "Tất cả" },
    { id: "tour", label: "Tour" },
    { id: "theme-park", label: "Công viên giải trí" },
    { id: "wifi-sim", label: "WiFi & Thẻ SIM" }
  ];

  const regions = [
    { id: "1", name: "VIỆT NAM", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop" },
    { id: "2", name: "NHẬT BẢN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=100&h=100&fit=crop" },
    { id: "3", name: "SINGAPORE", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop" },
    { id: "4", name: "THÁI LAN", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop" },
    { id: "5", name: "TRUNG QUỐC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=100&h=100&fit=crop" },
    { id: "6", name: "HÀN QUỐC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop" },
    { id: "7", name: "ÚC", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=100&h=100&fit=crop" },
    { id: "8", name: "ANH", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=100&h=100&fit=crop" },
    { id: "9", name: "THỤY SĨ", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=100&h=100&fit=crop" },
    { id: "10", name: "MỸ", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=100&h=100&fit=crop" },
    { id: "11", name: "MALAYSIA", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=100&h=100&fit=crop" },
    { id: "12", name: "INDONESIA", subtitle: "Vui chơi & Trải nghiệm", image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=100&h=100&fit=crop" }
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
      items: ["Xe sân bay", "Thuê xe tự lái", "Vé tàu châu Âu", "Vé tàu Nhật Bản", "Vé tàu Shinkansen", "Xe buýt Hàn Quốc"]
    },
    {
      id: "4",
      icon: "🎫",
      title: "Sản phẩm du lịch thiết yếu",
      items: ["WiFi và SIM"]
    }
  ];

  const filteredActivities = activeCategory === "all" 
    ? allActivities 
    : allActivities.filter(activity => {
        if (activeCategory === "tour") return activity.category === "Tour";
        if (activeCategory === "theme-park") return activity.category === "Công viên giải trí";
        if (activeCategory === "wifi-sim") return activity.category === "WiFi & Thẻ SIM";
        return true;
      });

  const mainTabs = [
    { id: "activities", label: "Các hoạt động nổi bật" },
    { id: "regions", label: "Khu vực phổ biến" },
    { id: "destinations", label: "Điểm đến phổ biến" },
    { id: "landmarks", label: "Địa danh phổ biến" },
    { id: "explore", label: "Khám phá Klook" }
  ];

  const [activeMainTab, setActiveMainTab] = useState("activities");

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-8">
          <TabsList className="bg-background border-b w-full justify-start rounded-none h-auto p-0">
            {mainTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 data-[state=active]:bg-transparent"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeMainTab === "activities" && (
          <>
            <h1 className="text-4xl font-bold text-foreground mb-8">Các hoạt động nổi bật</h1>
            
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
              <TabsList className="bg-background border-b w-full justify-start rounded-none h-auto p-0">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 data-[state=active]:bg-transparent"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {filteredActivities.map((activity) => (
                <TourCard key={activity.id} {...activity} />
              ))}
            </div>
          </>
        )}

        {activeMainTab === "regions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {regions.map((region) => (
              <div key={region.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                <img src={region.image} alt={region.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-muted-foreground">{region.subtitle}</p>
                  <h3 className="font-semibold text-foreground">{region.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "destinations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {destinations.map((destination) => (
              <div key={destination.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                <img src={destination.image} alt={destination.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-muted-foreground">{destination.subtitle}</p>
                  <h3 className="font-semibold text-foreground">{destination.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "landmarks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {landmarks.map((landmark) => (
              <div key={landmark.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                <img src={landmark.image} alt={landmark.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-foreground">{landmark.name}</h3>
                  <p className="text-xs text-muted-foreground">{landmark.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === "explore" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {exploreCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AllActivities;

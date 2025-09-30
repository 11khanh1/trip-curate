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

  const filteredActivities = activeCategory === "all" 
    ? allActivities 
    : allActivities.filter(activity => {
        if (activeCategory === "tour") return activity.category === "Tour";
        if (activeCategory === "theme-park") return activity.category === "Công viên giải trí";
        if (activeCategory === "wifi-sim") return activity.category === "WiFi & Thẻ SIM";
        return true;
      });

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <main className="container mx-auto px-4 py-8">
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
      </main>
      
      <Footer />
    </div>
  );
};

export default AllActivities;

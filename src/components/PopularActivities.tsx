import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TourCard from "./TourCard";

const PopularActivities = () => {
  const activities = [
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
      category: "Công viên & Vườn bách thảo",
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
      category: "Tour văn hóa",
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
    }
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Các hoạt động nổi bật</h2>
          <Link to="/activities">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              Xem tất cả
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div key={activity.id} className="h-full">
              <TourCard {...activity} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularActivities;

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import TourCard from "@/components/TourCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Vietnam = () => {
  const categories = [
    { id: "all", label: "Tất cả", icon: "🎯" },
    { id: "theme-park", label: "Công viên giải trí", icon: "🎢" },
    { id: "tour", label: "Tour", icon: "🗺️" },
    { id: "outdoor", label: "Hoạt động ngoài trời", icon: "⛰️" },
    { id: "massage", label: "Massages", icon: "💆" },
    { id: "wifi-sim", label: "WiFi & Thẻ SIM", icon: "📱" }
  ];

  const cities = [
    { name: "Thành phố Hồ Chí Minh", rank: 1, image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop" },
    { name: "Hà Nội", rank: 2, image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop" },
    { name: "Đà Nẵng", rank: 3, image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop" },
    { name: "Hội An", image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop" },
    { name: "Thành phố Hạ Long", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop" },
    { name: "Nha Trang", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop" },
  ];

  const activities = [
    {
      id: "1",
      title: "Vé Sun World Bà Nà Hills - Đà Nẵng",
      location: "Đà Nẵng",
      rating: 4.8,
      reviewCount: 15234,
      price: 750000,
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
      discount: 15,
      category: "theme-park",
      duration: "1 ngày",
      features: ["Cáp treo", "Cầu Vàng", "Vườn Hoa"]
    },
    {
      id: "2",
      title: "Tour Vịnh Hạ Long 1 ngày",
      location: "Quảng Ninh",
      rating: 4.9,
      reviewCount: 8521,
      price: 850000,
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop",
      discount: 20,
      category: "tour",
      duration: "1 ngày",
      features: ["Du thuyền", "Ăn trưa", "Chèo kayak"]
    },
    {
      id: "3",
      title: "Vé Vinpearl Safari Phú Quốc",
      location: "Phú Quốc",
      rating: 4.7,
      reviewCount: 6234,
      price: 550000,
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
      discount: 10,
      category: "theme-park",
      duration: "4-6 giờ",
      features: ["Safari", "Động vật hoang dã", "Xe điện"]
    },
    {
      id: "4",
      title: "Tour Đồng bằng sông Cửu Long 1 ngày",
      location: "TP. Hồ Chí Minh",
      rating: 4.6,
      reviewCount: 4521,
      price: 450000,
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
      discount: 12,
      category: "tour",
      duration: "1 ngày",
      features: ["Chợ nổi", "Vườn trái cây", "Ăn trưa"]
    },
    {
      id: "5",
      title: "Vé cáp treo Fansipan",
      location: "Sa Pa",
      rating: 4.8,
      reviewCount: 7890,
      price: 650000,
      image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop",
      discount: 15,
      category: "outdoor",
      duration: "3-4 giờ",
      features: ["Cáp treo", "Đỉnh Fansipan", "View núi"]
    },
    {
      id: "6",
      title: "Tour Địa đạo Củ Chi nửa ngày",
      location: "TP. Hồ Chí Minh",
      rating: 4.5,
      reviewCount: 5432,
      price: 350000,
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
      discount: 8,
      category: "tour",
      duration: "4 giờ",
      features: ["Địa đạo", "Hướng dẫn viên", "Xe đưa đón"]
    },
    {
      id: "7",
      title: "Massage truyền thống Việt Nam",
      location: "Hà Nội",
      rating: 4.7,
      reviewCount: 3210,
      price: 280000,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
      discount: 0,
      category: "massage",
      duration: "60-90 phút",
      features: ["Massage body", "Thư giãn", "Chuyên nghiệp"]
    },
    {
      id: "8",
      title: "Thẻ SIM 4G Việt Nam",
      location: "Toàn quốc",
      rating: 4.9,
      reviewCount: 12345,
      price: 120000,
      image: "https://images.unsplash.com/photo-1551817958-11e0f7bbea9b?w=400&h=300&fit=crop",
      discount: 5,
      category: "wifi-sim",
      duration: "7-30 ngày",
      features: ["4G tốc độ cao", "Giao tận nơi", "Data không giới hạn"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=400&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white">
          <p className="text-sm mb-2">Thay đổi điểm đến</p>
          <h1 className="text-5xl font-bold">VIỆT NAM</h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">Trang chủ</a>
          <span className="mx-2">›</span>
          <span>VIỆT NAM</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="data-[state=active]:bg-card data-[state=active]:border-primary border-2 border-transparent"
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Cities Section */}
          <div className="mt-12 mb-16">
            <h2 className="text-3xl font-bold mb-8">Điểm đến hấp dẫn tại VIỆT NAM</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cities.map((city) => (
                <div 
                  key={city.name}
                  className="relative h-48 rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {city.rank && (
                    <div className="absolute top-3 left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {city.rank}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 text-white font-semibold">
                    {city.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Grid */}
          <TabsContent value="all" className="mt-8">
            <h2 className="text-3xl font-bold mb-8">Chơi gì khi du lịch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activities.map(activity => (
                <TourCard key={activity.id} {...activity} />
              ))}
            </div>
          </TabsContent>

          {categories.slice(1).map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-8">
              <h2 className="text-3xl font-bold mb-8">Chơi gì khi du lịch - {category.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activities
                  .filter(activity => activity.category === category.id)
                  .map(activity => (
                    <TourCard key={activity.id} {...activity} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Vietnam;
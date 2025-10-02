import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Malaysia = () => {
  const categories = [
    { id: "all", label: "Tất cả", icon: "🎯" },
    { id: "theme-park", label: "Công viên giải trí", icon: "🎢" },
    { id: "tour", label: "Tour", icon: "🗺️" },
    { id: "outdoor", label: "Hoạt động ngoài trời", icon: "⛰️" },
    { id: "massage", label: "Massages", icon: "💆" },
    { id: "wifi-sim", label: "WiFi & Thẻ SIM", icon: "📱" }
  ];

  const cities = [
    { name: "Kuala Lumpur", rank: 1, image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop" },
    { name: "Penang", rank: 2, image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=300&fit=crop" },
    { name: "Langkawi", rank: 3, image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop" },
    { name: "Malacca", image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=300&fit=crop" },
    { name: "Johor Bahru", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop" },
    { name: "Cameron Highlands", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop" },
  ];

  const activities = [
    {
      id: "1",
      title: "Vé Petronas Twin Towers",
      location: "Kuala Lumpur",
      rating: 4.8,
      reviewCount: 18500,
      price: 850000,
      image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop",
      discount: 12,
      category: "outdoor",
      duration: "2 giờ",
      features: ["Vé vào Skybridge", "Tầng quan sát", "Hướng dẫn audio"]
    },
    {
      id: "2",
      title: "Tour Penang Heritage",
      location: "Penang",
      rating: 4.7,
      reviewCount: 9800,
      price: 650000,
      image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=300&fit=crop",
      discount: 10,
      category: "tour",
      duration: "5 giờ",
      features: ["Hướng dẫn viên", "Phố cổ George Town", "Bữa trưa"]
    },
    {
      id: "3",
      title: "Vé Sunway Lagoon",
      location: "Kuala Lumpur",
      rating: 4.8,
      reviewCount: 15200,
      price: 950000,
      image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop",
      discount: 15,
      category: "theme-park",
      duration: "Cả ngày",
      features: ["6 công viên chủ đề", "Trò chơi nước", "Phòng thay đồ"]
    },
    {
      id: "4",
      title: "Thẻ SIM 4G Malaysia",
      location: "Toàn quốc",
      rating: 4.9,
      reviewCount: 12500,
      price: 180000,
      image: "https://images.unsplash.com/photo-1551817958-11e0f7bbea9b?w=400&h=300&fit=crop",
      discount: 5,
      category: "wifi-sim",
      duration: "7 ngày",
      features: ["4G tốc độ cao", "Nhận tại sân bay", "Kích hoạt dễ dàng"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&h=400&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white">
          <p className="text-sm mb-2">Thay đổi điểm đến</p>
          <h1 className="text-5xl font-bold">MALAYSIA</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">Trang chủ</a>
          <span className="mx-2">›</span>
          <span>MALAYSIA</span>
        </div>
      </div>

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

          <div className="mt-12 mb-16">
            <h2 className="text-3xl font-bold mb-8">Điểm đến hấp dẫn tại MALAYSIA</h2>
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

export default Malaysia;
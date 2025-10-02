import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Australia = () => {
  const categories = [
    { id: "all", label: "Tất cả", icon: "🎯" },
    { id: "theme-park", label: "Công viên giải trí", icon: "🎢" },
    { id: "tour", label: "Tour", icon: "🗺️" },
    { id: "outdoor", label: "Hoạt động ngoài trời", icon: "⛰️" },
    { id: "massage", label: "Massages", icon: "💆" },
    { id: "wifi-sim", label: "WiFi & Thẻ SIM", icon: "📱" }
  ];

  const cities = [
    { name: "Sydney", rank: 1, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop" },
    { name: "Melbourne", rank: 2, image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=400&h=300&fit=crop" },
    { name: "Brisbane", rank: 3, image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&h=300&fit=crop" },
    { name: "Gold Coast", image: "https://images.unsplash.com/photo-1580209776019-8b3a8f1a40d2?w=400&h=300&fit=crop" },
    { name: "Perth", image: "https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=400&h=300&fit=crop" },
    { name: "Cairns", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&h=300&fit=crop" },
  ];

  const activities = [
    {
      id: "1",
      title: "Tour Great Barrier Reef",
      location: "Cairns",
      rating: 4.9,
      reviewCount: 14500,
      price: 3500000,
      image: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&h=300&fit=crop",
      discount: 15,
      category: "tour",
      duration: "Cả ngày",
      features: ["Lặn biển", "Bữa trưa", "Đưa đón thuyền"]
    },
    {
      id: "2",
      title: "Vé Sydney Opera House",
      location: "Sydney",
      rating: 4.8,
      reviewCount: 18200,
      price: 1250000,
      image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop",
      discount: 10,
      category: "outdoor",
      duration: "2 giờ",
      features: ["Tour hậu trường", "Hướng dẫn viên", "Tham quan nhà hát"]
    },
    {
      id: "3",
      title: "Vé Sea World Gold Coast",
      location: "Gold Coast",
      rating: 4.7,
      reviewCount: 9600,
      price: 1850000,
      image: "https://images.unsplash.com/photo-1580209776019-8b3a8f1a40d2?w=400&h=300&fit=crop",
      discount: 12,
      category: "theme-park",
      duration: "Cả ngày",
      features: ["Công viên biển", "Show cá heo", "Trò chơi nước"]
    },
    {
      id: "4",
      title: "Thẻ SIM 4G Úc",
      location: "Toàn quốc",
      rating: 4.8,
      reviewCount: 7200,
      price: 450000,
      image: "https://images.unsplash.com/photo-1551817958-11e0f7bbea9b?w=400&h=300&fit=crop",
      discount: 5,
      category: "wifi-sim",
      duration: "14 ngày",
      features: ["4G LTE", "Dung lượng lớn", "Kích hoạt ngay"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&h=400&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white">
          <p className="text-sm mb-2">Thay đổi điểm đến</p>
          <h1 className="text-5xl font-bold">ÚC</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">Trang chủ</a>
          <span className="mx-2">›</span>
          <span>ÚC</span>
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
            <h2 className="text-3xl font-bold mb-8">Điểm đến hấp dẫn tại ÚC</h2>
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

export default Australia;
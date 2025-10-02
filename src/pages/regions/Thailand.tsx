import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Thailand = () => {
  const categories = [
    { id: "all", label: "Tất cả", icon: "🎯" },
    { id: "theme-park", label: "Công viên giải trí", icon: "🎢" },
    { id: "tour", label: "Tour", icon: "🗺️" },
    { id: "outdoor", label: "Hoạt động ngoài trời", icon: "⛰️" },
    { id: "massage", label: "Massages", icon: "💆" },
    { id: "wifi-sim", label: "WiFi & Thẻ SIM", icon: "📱" }
  ];

  const cities = [
    { name: "Bangkok", rank: 1, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop" },
    { name: "Phuket", rank: 2, image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop" },
    { name: "Chiang Mai", rank: 3, image: "https://images.unsplash.com/photo-1598970605070-89a6c49f3174?w=400&h=300&fit=crop" },
    { name: "Pattaya", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop" },
    { name: "Krabi", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop" },
    { name: "Koh Samui", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop" },
  ];

  const activities = [
    {
      id: "1",
      title: "Tour đảo Phi Phi bằng thuyền cao tốc",
      location: "Phuket",
      rating: 4.9,
      reviewCount: 18500,
      price: 1350000,
      image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop",
      discount: 20,
      category: "tour",
      duration: "8 giờ",
      features: ["Thuyền cao tốc", "Lặn biển", "Bữa trưa buffet"]
    },
    {
      id: "2",
      title: "Massage truyền thống Thái",
      location: "Bangkok",
      rating: 4.8,
      reviewCount: 12000,
      price: 450000,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
      discount: 15,
      category: "massage",
      duration: "2 giờ",
      features: ["Massage Thái cổ truyền", "Dầu thơm", "Đồ uống miễn phí"]
    },
    {
      id: "3",
      title: "Vé Safari World Bangkok",
      location: "Bangkok",
      rating: 4.7,
      reviewCount: 9800,
      price: 850000,
      image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop",
      discount: 12,
      category: "theme-park",
      duration: "Cả ngày",
      features: ["Safari & Marine Park", "Biểu diễn động vật", "Đưa đón"]
    },
    {
      id: "4",
      title: "Thẻ SIM 4G Thái Lan",
      location: "Toàn quốc",
      rating: 4.9,
      reviewCount: 15200,
      price: 180000,
      image: "https://images.unsplash.com/photo-1551817958-11e0f7bbea9b?w=400&h=300&fit=crop",
      discount: 5,
      category: "wifi-sim",
      duration: "8 ngày",
      features: ["4G tốc độ cao", "Không giới hạn", "Nhận tại sân bay"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=400&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white">
          <p className="text-sm mb-2">Thay đổi điểm đến</p>
          <h1 className="text-5xl font-bold">THÁI LAN</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary">Trang chủ</a>
          <span className="mx-2">›</span>
          <span>THÁI LAN</span>
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
            <h2 className="text-3xl font-bold mb-8">Điểm đến hấp dẫn tại THÁI LAN</h2>
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

export default Thailand;
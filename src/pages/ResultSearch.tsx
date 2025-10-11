import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { TabNavigation } from "@/components/search/TabNavigation";
import { FilterSidebarKlook } from "@/components/search/FilterSidebar";
import { ActivityCardKlook } from "@/components/search/ActivityCard";
import { ResultsHeader } from "@/components/search/ResultsHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    image: "https://images.unsplash.com/photo-1589895292539-8e7fdf87e41f?w=800",
    category: "Du thuyền ngắm cảnh",
    location: "Hà Nội, Việt Nam",
    title: "Du thuyền Cozy Bay: Vịnh Hạ Long, Sửng Sốt, Ti Top",
    bookingType: "Đón tại khách sạn",
    rating: 4.8,
    reviews: 3406,
    booked: "40K+ đã được đặt",
    price: 1_219_927,
    discount: 15,
  },
  {
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    category: "Du thuyền ngắm cảnh",
    location: "Hà Nội, Việt Nam",
    title: "Du thuyền Olympus Day Cruise: Vịnh Hạ Long, Sửng Sốt, Ti Top",
    bookingType: "Đặt trước cho ngày mai",
    rating: 4.9,
    reviews: 756,
    booked: "8K+ đã được đặt",
    price: 1_087_324,
    discount: 15,
  },
  {
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    category: "Du thuyền ngắm cảnh",
    location: "Hà Nội, Việt Nam",
    title: "Du thuyền Serenity: Vịnh Hạ Long & Vịnh Lan Hạ",
    bookingType: "Đón tại khách sạn",
    rating: 4.9,
    reviews: 2145,
    booked: "18K+ đã được đặt",
    price: 2_650_000,
    discount: 15,
  },
];

const sortOptions = [
  { value: "popular", label: "Phổ biến" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "new", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
];

const ResultSearch = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("popular");

  const activeFilters = useMemo(
    () => ["Ưu đãi độc quyền", "Xếp hạng 4.5+", "Có hoàn hủy linh hoạt"],
    []
  );

  const sortedActivities = useMemo(() => {
    const list = [...activities];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "new":
        return list.slice().reverse();
      default:
        return list;
    }
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <TravelHeader />
      <TabNavigation />

      <header className="border-b bg-gradient-to-r from-orange-100 via-white to-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Kết quả tìm kiếm cho
            </p>
            <h1 className="text-3xl font-bold text-foreground">
              Tour & Hoạt động tại Hạ Long
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tìm thấy {sortedActivities.length} tour phù hợp với tiêu chí của bạn. Hãy dùng bộ lọc để tinh chỉnh kết quả nhanh hơn.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="bg-white/70 border border-orange-200 text-orange-600">
                  {filter}
                </Badge>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
            <div className="flex items-center gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={sortBy === option.value ? "default" : "outline"}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
            </Button>
          </div>

          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24`}>
            <FilterSidebarKlook />
          </aside>

          <section className="flex-1 min-w-0 space-y-6">
            <ResultsHeader
              totalResults={sortedActivities.length}
              selectedFilters={activeFilters.length}
              sortValue={sortBy}
              sortOptions={sortOptions}
              onSortChange={setSortBy}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedActivities.map((activity, index) => (
                <ActivityCardKlook key={index} {...activity} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-full bg-background/95 p-2 shadow-lg backdrop-blur">
          <Button variant="outline" className="flex-1" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Bộ lọc
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Lên đầu trang
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResultSearch;

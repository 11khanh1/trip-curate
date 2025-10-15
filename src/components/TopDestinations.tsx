import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHighlightCategories, type HomeCategory } from "@/services/publicApi";

interface TopDestinationsProps {
  categories?: HomeCategory[];
}

const fallbackDestinations: HomeCategory[] = [
  { id: "fallback-1", name: "Vịnh Hạ Long", tours_count: 128 },
  { id: "fallback-2", name: "Địa đạo Củ Chi", tours_count: 96 },
  { id: "fallback-3", name: "Bà Nà Hills", tours_count: 88 },
  { id: "fallback-4", name: "Phố Cổ Hội An", tours_count: 75 },
  { id: "fallback-5", name: "Tràng An - Ninh Bình", tours_count: 64 },
  { id: "fallback-6", name: "Sa Pa", tours_count: 54 },
  { id: "fallback-7", name: "Đà Lạt", tours_count: 49 },
  { id: "fallback-8", name: "Phú Quốc", tours_count: 42 },
];

const HIGHLIGHT_LIMIT = 12;

const TopDestinations = ({ categories }: TopDestinationsProps) => {
  const shouldFetch = !categories;
  const categoriesQuery = useQuery({
    queryKey: ["public-highlight-categories", HIGHLIGHT_LIMIT],
    queryFn: () => fetchHighlightCategories(HIGHLIGHT_LIMIT),
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000,
  });

  const data = categories ?? categoriesQuery.data ?? [];
  const isLoading = shouldFetch ? categoriesQuery.isLoading : false;
  const destinations = data.length > 0 ? data : fallbackDestinations;

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
          Hấp dẫn không kém
        </h2>
        <h3 className="text-xl text-center mb-12 text-muted-foreground">
          Điểm tham quan hàng đầu Việt Nam
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {destinations.map((destination, index) => (
              <div
                key={destination.id ?? index}
                className="bg-card rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer border"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <span className="block text-foreground font-medium text-sm">
                      {destination.name}
                    </span>
                    {destination.tours_count !== undefined ? (
                      <span className="text-xs text-muted-foreground">
                        {destination.tours_count.toLocaleString("vi-VN")} tour đã duyệt
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopDestinations;

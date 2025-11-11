import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHighlightCategories, type HomeCategory } from "@/services/publicApi";

interface TopDestinationsProps {
  categories?: HomeCategory[];
}

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
  const destinations = data.length > 0 ? data : [];

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
        ) : destinations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-white px-6 py-12 text-center text-sm text-muted-foreground shadow-inner">
            <p className="font-medium text-foreground">Chưa có danh mục nổi bật</p>
            <p className="mt-2">
              Khi API trả về dữ liệu, các điểm đến được quan tâm sẽ hiển thị tại đây.
            </p>
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

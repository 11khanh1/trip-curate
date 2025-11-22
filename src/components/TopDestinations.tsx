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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f6f9ff] via-white to-[#fff8f0] py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-80px] top-[-80px] h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute right-[-60px] bottom-[-60px] h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
      </div>
      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center space-y-3">
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Điểm đến hàng đầu Việt Nam</h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Khám phá các chủ đề được yêu thích, từ biển đảo, núi rừng đến ẩm thực và văn hoá.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
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
              <a
                key={destination.id ?? index}
                href={`/activities?category_id=${encodeURIComponent(String(destination.id ?? ""))}`}
                className="group relative overflow-hidden rounded-2xl border border-orange-100/70 bg-white/90 p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-transparent to-blue-50/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-sm font-semibold shadow-inner">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="block text-base font-semibold text-foreground">
                      {destination.name}
                    </span>
                    {destination.tours_count !== undefined ? (
                      <span className="text-sm text-muted-foreground">
                        {destination.tours_count.toLocaleString("vi-VN")} tour đã duyệt
                      </span>
                    ) : null}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopDestinations;

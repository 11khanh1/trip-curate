import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CollectionTourCard from "@/components/CollectionTourCard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { fetchSimilarRecommendations, type RecommendationItem } from "@/services/recommendationApi";
import type { PublicTour } from "@/services/publicApi";
import { getTourStartingPrice, formatCurrency as formatPrice } from "@/lib/tour-utils";
import { Compass, Sparkles } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  content_match: "Nội dung tương đồng",
  shared_tags: "Chung chủ đề",
  same_destination: "Cùng điểm đến",
  same_type: "Cùng loại tour",
  popular: "Được nhiều người đặt",
};

const normalizeReasons = (reasons: string[] | undefined) => {
  if (!Array.isArray(reasons)) return [];
  return Array.from(new Set(reasons))
    .map((reason) => ({
      code: reason,
      label: REASON_LABELS[reason] ?? reason.replace(/[_-]/g, " "),
    }))
    .slice(0, 2);
};

const resolveTourImage = (tour?: PublicTour | null) => {
  if (!tour) return "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?w=900&h=600&fit=crop";
  const candidates: Array<string | undefined | null> = [
    tour.thumbnail_url,
    Array.isArray(tour.media) ? (tour.media[0] as string | undefined) : undefined,
    Array.isArray(tour.gallery) ? (tour.gallery[0] as string | undefined) : undefined,
  ];
  const selected = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  if (selected) return selected;
  return "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?w=900&h=600&fit=crop";
};

const formatDuration = (value?: number | string | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return "Trong ngày";
    if (value === 1) return "1 ngày";
    return `${value} ngày`;
  }
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return "Lịch trình linh hoạt";
};

interface SimilarTourRecommendationsProps {
  tourId?: string | number | null;
  baseTourTitle?: string | null;
  limit?: number;
}

const mapItemToCard = (item: RecommendationItem) => {
  if (!item.tour) return null;
  const reasons = normalizeReasons(item.reasons);
  const price = getTourStartingPrice(item.tour);
  const priceLabel = formatPrice(price);
  const entityId = String(
    item.tour.id ?? item.tour.uuid ?? item.tour_id ?? Math.random().toString(36).slice(2, 8),
  );
  return {
    id: entityId,
    entityId,
    tour: item.tour,
    reasons,
    priceLabel,
    image: resolveTourImage(item.tour),
  };
};

const SimilarTourRecommendations = ({ tourId, baseTourTitle, limit = 8 }: SimilarTourRecommendationsProps) => {
  const { trackEvent } = useAnalytics();

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["similar-recommendations", { tourId, limit }],
    queryFn: () => fetchSimilarRecommendations(String(tourId), limit),
    enabled: Boolean(tourId),
    staleTime: 5 * 60 * 1000,
  });

  const cards = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .map(mapItemToCard)
      .filter((value): value is NonNullable<ReturnType<typeof mapItemToCard>> => Boolean(value));
  }, [data?.data]);

  if (!tourId) {
    return null;
  }

  const showEmptyState = !isLoading && cards.length === 0;
  const hasData = cards.length > 0;
  const isRefreshing = isFetching && !isLoading;

  const handleCardClick = (recommendedTourId: string, reasons: string[]) => {
    trackEvent({
      event_name: "tour_view",
      entity_type: "tour",
      entity_id: recommendedTourId,
      metadata: {
        source: "similar_tours",
        base_tour_id: tourId,
        reasons,
      },
    }, { immediate: true });
  };

  return (
    <section className="mt-12 rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Tour tương tự</h3>
          <p className="text-sm text-muted-foreground">
            {baseTourTitle ? `Dựa trên "${baseTourTitle}"` : "Khám phá các lựa chọn có nội dung tương đồng."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => refetch()}
          disabled={isRefreshing}
        >
          <Sparkles className="h-4 w-4 text-orange-500" />
          Làm mới gợi ý
        </Button>
      </div>

      {isLoading && !hasData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
            <div key={`similar-skeleton-${index}`} className="h-44 animate-pulse rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : showEmptyState ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/50 bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-start gap-3">
            <Compass className="mt-1 h-6 w-6 text-primary" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Chưa có gợi ý phù hợp lúc này</p>
              <p>
                Chúng tôi đang thu thập thêm dữ liệu để gợi ý tour tương tự
                {baseTourTitle ? ` cho "${baseTourTitle}".` : " cho bạn."}
              </p>
              <p className="text-xs italic text-muted-foreground">
                Hãy tiếp tục xem, thêm wishlist hoặc đặt tour để nhận nhiều gợi ý chính xác hơn.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="default">
              <Link to="/activities">Khám phá thêm tour</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/wishlist">Xem wishlist</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((card) => (
            <CollectionTourCard
              key={card.id}
              className="border border-slate-200/60 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              href={`/activity/${card.tour.id ?? card.tour.uuid ?? card.id}`}
              image={card.image}
              title={card.tour.title ?? card.tour.name ?? "Tour đang cập nhật"}
              category={card.tour.type === "international" ? "Tour quốc tế" : "Tour nội địa"}
              location={card.tour.destination ?? card.tour.partner?.company_name ?? "Đang cập nhật"}
              duration={formatDuration(card.tour.duration)}
              rating={
                typeof card.tour.rating_average === "number"
                  ? card.tour.rating_average
                  : typeof card.tour.average_rating === "number"
                  ? card.tour.average_rating
                  : null
              }
              ratingCount={card.tour.rating_count ?? card.tour.reviews_count ?? null}
              priceLabel={card.priceLabel}
              metaContent={
                <div className="flex flex-wrap gap-2 pt-1">
                  {card.reasons.map((reason) => (
                    <Badge key={`${card.id}-${reason.code}`} variant="outline" className="text-xs">
                      {reason.label}
                    </Badge>
                  ))}
                </div>
              }
              onNavigate={() => handleCardClick(card.entityId, card.reasons.map((reason) => reason.code))}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SimilarTourRecommendations;

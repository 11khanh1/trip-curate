import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles } from "lucide-react";
import CollectionTourCard from "@/components/CollectionTourCard";
import { useUser } from "@/context/UserContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { fetchPersonalizedRecommendations, type RecommendationItem } from "@/services/recommendationApi";
import { fetchTrendingTours, type PublicTour } from "@/services/publicApi";
import { getTourStartingPrice, formatCurrency as formatPrice } from "@/lib/tour-utils";
import { cn } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  ml_collaborative_filtering: "Dựa trên tour bạn đã chọn",
  content_match: "Nội dung tương đồng bạn từng thích",
  popular: "Được nhiều người đặt",
  shared_tags: "Chung chủ đề quan tâm",
  same_destination: "Cùng điểm đến",
  same_type: "Cùng loại tour",
};

const normalizeReasonLabels = (reasons: string[] | undefined) => {
  if (!Array.isArray(reasons)) return [];
  const unique = Array.from(new Set(reasons));
  return unique
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
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "Lịch trình linh hoạt";
};

interface PersonalizedRecommendationsProps {
  limit?: number;
  className?: string;
}

const mapRecommendationToCard = (item: RecommendationItem) => {
  const tour = item.tour ?? null;
  if (!tour) return null;
  const reasons = normalizeReasonLabels(item.reasons);
  const price = getTourStartingPrice(tour);
  const priceLabel = formatPrice(price);
  const originalLabel =
    typeof tour.season_price === "number" && Number.isFinite(tour.season_price) && tour.season_price > price
      ? formatPrice(tour.season_price)
      : undefined;
  const features: string[] = [];
  if (tour.requires_passport) features.push("Yêu cầu hộ chiếu");
  if (tour.requires_visa) features.push("Yêu cầu visa");
  if (Array.isArray(tour.tags) && tour.tags.length > 0) {
    features.push(`Chủ đề: ${tour.tags.slice(0, 2).join(", ")}`);
  }

  const entityId = String(
    tour.id ?? tour.uuid ?? item.tour_id ?? `recommend-${Math.random().toString(36).slice(2, 10)}`,
  );
  return {
    id: entityId,
    entityId,
    tour,
    reasons,
    priceLabel,
    originalLabel,
    features,
    image: resolveTourImage(tour),
  };
};

const mapTrendingTourToCard = (tour: PublicTour) => {
  const price = getTourStartingPrice(tour);
  const priceLabel = formatPrice(price);
  const originalLabel =
    typeof tour.season_price === "number" && Number.isFinite(tour.season_price) && tour.season_price > price
      ? formatPrice(tour.season_price)
      : undefined;
  const entityId = String(tour.id ?? tour.uuid ?? `trending-${Math.random().toString(36).slice(2, 10)}`);
  const reasons = [{ code: "popular", label: "Được nhiều khách quan tâm" }];
  return {
    id: entityId,
    entityId,
    tour,
    reasons,
    priceLabel,
    originalLabel,
    features: Array.isArray(tour.tags) ? tour.tags.slice(0, 2) : [],
    image: resolveTourImage(tour),
  };
};

const PersonalizedRecommendations = ({ limit = 10, className }: PersonalizedRecommendationsProps) => {
  const { currentUser } = useUser();
  const { trackEvent } = useAnalytics();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personalized-recommendations", { limit }],
    queryFn: () => fetchPersonalizedRecommendations(limit),
    enabled: Boolean(currentUser),
    staleTime: 60 * 1000,
    retry: false,
  });

  const hasPersonalizedError = Boolean(isError);
  const hasPersonalizedData = Array.isArray(data?.data) && data.data.length > 0;
  const shouldFetchFallback = !isLoading && (!hasPersonalizedData || hasPersonalizedError);

  const {
    data: fallbackTrending,
    isLoading: isFallbackLoading,
  } = useQuery({
    queryKey: ["personalized-fallback-trending", { limit }],
    queryFn: () => fetchTrendingTours({ limit, days: 60 }),
    enabled: shouldFetchFallback,
    staleTime: 10 * 60 * 1000,
  });

  const cards = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .map(mapRecommendationToCard)
      .filter((value): value is NonNullable<ReturnType<typeof mapRecommendationToCard>> => Boolean(value));
  }, [data?.data]);

  const fallbackCards = useMemo(() => {
    if (!fallbackTrending || !Array.isArray(fallbackTrending)) return [];
    return fallbackTrending
      .map(mapTrendingTourToCard)
      .filter((value): value is ReturnType<typeof mapTrendingTourToCard> => Boolean(value));
  }, [fallbackTrending]);

  const displayedCards = cards.length > 0 ? cards : fallbackCards;

  const meta = data?.meta ?? {};
  const recommendationCount =
    typeof meta.count === "number" && Number.isFinite(meta.count) ? meta.count : cards.length;
  const hasPersonalizedSignals =
    typeof meta.has_personalized_signals === "boolean" ? meta.has_personalized_signals : false;
  const shouldShowEmptyState =
    !isLoading &&
    !isFallbackLoading &&
    !isError &&
    recommendationCount === 0 &&
    fallbackCards.length === 0;

  if (!currentUser) {
    return null;
  }

  const hasError = Boolean(isError);
  if (hasError) {
    console.error("Không thể tải gợi ý cá nhân hóa:", error);
  }

  const handleCardClick = (tourId: string, reasons: string[]) => {
    trackEvent({
      event_name: "tour_view",
      entity_type: "tour",
      entity_id: tourId,
      metadata: {
        source: "personalized_home",
        reasons,
      },
    }, { immediate: true });
  };

  return (
    <section className={cn("bg-gradient-to-b from-white to-slate-50 py-12", className)}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Dành riêng cho bạn</h2>
            <p className="text-sm text-muted-foreground">
              Khám phá những hành trình phù hợp dựa trên hoạt động gần đây của bạn.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: limit }).map((_, index) => (
              <div key={`recommend-skeleton-${index}`} className="h-48 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : null}

        {!isLoading && cards.length > 0 ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {displayedCards.map((card) => (
              <CollectionTourCard
                key={card.id}
                className="border border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
                originalPriceLabel={card.originalLabel}
                features={[...card.features]}
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
        ) : null}

        {shouldShowEmptyState ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-primary/50 bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
            <div className="flex items-start gap-3">
              {hasPersonalizedSignals ? (
                <Compass className="mt-1 h-6 w-6 text-primary" />
              ) : (
                <Sparkles className="mt-1 h-6 w-6 text-primary" />
              )}
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">
                  {hasPersonalizedSignals
                    ? "Chưa có gợi ý phù hợp lúc này"
                    : "Tour sẽ được gợi ý sau vài lần thao tác"}
                </p>
                <p>
                  {hasPersonalizedSignals
                    ? "Hệ thống chưa tìm thấy tour thực sự phù hợp. Hãy tiếp tục xem, wishlist hoặc đặt tour để nhận nhiều gợi ý chính xác hơn."
                    : "Bạn cần xem tour, thêm vào danh sách yêu thích hoặc đặt thử vài tour để hệ thống hiểu sở thích của bạn và đưa ra gợi ý cá nhân hóa."}
                </p>
                {!hasPersonalizedSignals ? (
                  <p className="text-xs italic text-muted-foreground">
                    Gợi ý sẽ xuất hiện ngay khi chúng tôi ghi nhận thêm hành vi như xem tour, thêm wishlist, đặt tour hoặc
                    gửi đánh giá.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <Link to="/activities">Khám phá thêm tour</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/wishlist">Quản lý wishlist</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;

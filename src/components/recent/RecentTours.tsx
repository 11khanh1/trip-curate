import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, Star, Clock } from "lucide-react";

import { fetchRecentTours } from "@/services/recentToursApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== "number") return "Liên hệ";
  try {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });
  } catch {
    return `${value.toLocaleString("vi-VN")}₫`;
  }
};

const formatDuration = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} ngày`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "Lịch trình linh hoạt";
};

const RecentTours = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recent-tours"],
    queryFn: fetchRecentTours,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Chưa có tour nào được xem gần đây.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((entry) => {
        const tour = entry.tour;
        if (!tour) return null;

        const thumbnail =
          (tour.media && tour.media.length > 0 ? tour.media[0] : null) ??
          tour.thumbnail_url ??
          tour.thumbnail ??
          "https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=900&q=80";

        const rating = typeof tour.rating_average === "number" ? tour.rating_average : null;
        const ratingCount = typeof tour.rating_count === "number" ? tour.rating_count : null;

        return (
          <Card key={`${tour.id}-${entry.viewed_at ?? "recent"}`} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={thumbnail}
                  alt={tour.title ?? "Tour"}
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-2">
                <div className="space-y-1">
                  <Link
                    to={`/activities/${tour.id ?? tour.uuid ?? ""}`}
                    className="line-clamp-2 font-semibold text-foreground hover:text-primary"
                  >
                    {tour.title ?? tour.name ?? "Tour chưa có tiêu đề"}
                  </Link>
                  {tour.destination && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {tour.destination}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(tour.duration)}
                    </span>
                    {rating !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {rating.toFixed(1)}
                        {typeof ratingCount === "number" && ratingCount > 0 ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({ratingCount.toLocaleString()})
                          </span>
                        ) : null}
                      </span>
                    )}
                    {entry.view_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Đã xem {entry.view_count} lần
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(tour.base_price ?? tour.price ?? null)}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/activities/${tour.id ?? tour.uuid ?? ""}`}>Xem lại tour</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RecentTours;

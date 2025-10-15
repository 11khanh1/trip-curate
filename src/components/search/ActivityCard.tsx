import { Star, Heart, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActivityCardKlookProps {
  image: string;
  category: string;
  location: string;
  title: string;
  bookingType?: string;
  rating: number;
  reviews: number;
  booked?: string;
  price: number;
  discount?: number;
}

export const ActivityCardKlook = ({
  image,
  category,
  location,
  title,
  bookingType,
  rating,
  reviews,
  booked,
  price,
  discount,
}: ActivityCardKlookProps) => {
  const finalPrice = discount ? price * (1 - discount / 100) : price;
  const formattedPrice = finalPrice.toLocaleString("vi-VN");

  return (
    <Card className="group flex h-full flex-col overflow-hidden border bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 transition-opacity group-hover:opacity-75" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-white/85 text-slate-900 backdrop-blur">
            {category}
          </Badge>
          {bookingType ? (
            <Badge variant="outline" className="border-white/70 bg-black/20 text-white backdrop-blur">
              {bookingType}
            </Badge>
          ) : null}
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-all hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{location}</p>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              {rating.toFixed(1)}
            </div>
            <span className="text-xs text-muted-foreground">
              {reviews.toLocaleString("vi-VN")} đánh giá
            </span>
            {booked ? (
              <Badge variant="outline" className="border-muted text-xs text-muted-foreground">
                {booked}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Từ</p>
              <p className="text-lg font-bold text-primary">₫ {formattedPrice}</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full">
              Xem chi tiết
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

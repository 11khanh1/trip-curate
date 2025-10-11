import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg border cursor-pointer bg-card">
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      <div className="p-4 space-y-2">
        <div className="text-xs text-muted-foreground">
          {category} • Từ {location}
        </div>
        
        <h3 className="font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>
        
        {bookingType && (
          <div className="text-xs text-muted-foreground">
            {bookingType}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-semibold">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
          {booked && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{booked}</span>
            </>
          )}
        </div>

        <div className="flex items-end gap-2 pt-1">
          <div className="text-lg font-bold">
            Từ ₫ {finalPrice.toLocaleString()}
          </div>
          {discount && (
            <Badge variant="destructive" className="text-xs px-2 py-0 h-5">
              Sale • Giảm {discount}%
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

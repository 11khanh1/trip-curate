import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, MapPin, Star } from "lucide-react";

export interface CollectionTourCardProps {
  className?: string;
  href?: string;
  image: string;
  title: string;
  category?: string | null;
  location?: string | null;
  duration?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  priceLabel?: string | null;
  originalPriceLabel?: string;
  features?: string[];
  metaContent?: ReactNode;
  topLeftOverlay?: ReactNode;
  topRightOverlay?: ReactNode;
  footerContent?: ReactNode;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const CollectionTourCard = ({
  className,
  href,
  image,
  title,
  category,
  location,
  duration,
  rating,
  ratingCount,
  priceLabel,
  originalPriceLabel,
  features = [],
  metaContent,
  topLeftOverlay,
  topRightOverlay,
  footerContent,
  onNavigate,
}: CollectionTourCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="relative h-48 w-full overflow-hidden rounded-xl sm:h-auto sm:w-48 lg:w-56">
          {href ? (
            <Link
              to={href}
              className="group block h-full w-full overflow-hidden"
              onClick={onNavigate}
            >
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </Link>
          ) : (
            <div className="block h-full w-full overflow-hidden">
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          {topLeftOverlay ? (
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
              <div className="pointer-events-auto">{topLeftOverlay}</div>
            </div>
          ) : null}
          {topRightOverlay ? (
            <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
              <div className="pointer-events-auto">{topRightOverlay}</div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col">
          <CardContent className="flex flex-1 flex-col gap-4 p-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                {category ? (
                  <Badge variant="secondary" className="w-fit">
                    {category}
                  </Badge>
                ) : null}
                {href ? (
                  <Link
                    to={href}
                    className="text-lg font-semibold leading-tight text-foreground hover:text-primary focus:text-primary focus:outline-none"
                  >
                    {title}
                  </Link>
                ) : (
                  <span className="text-lg font-semibold leading-tight text-foreground">{title}</span>
                )}
                {metaContent}
              </div>
              {(priceLabel || originalPriceLabel) && (
                <div className="flex flex-col items-end gap-1 text-right">
                  {priceLabel ? <span className="text-xl font-semibold text-primary">{priceLabel}</span> : null}
                  {originalPriceLabel ? (
                    <span className="text-sm text-muted-foreground line-through">{originalPriceLabel}</span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              ) : null}
              {duration ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {duration}
                </span>
              ) : null}
              {typeof rating === "number" ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                  {typeof ratingCount === "number" ? (
                    <span className="text-xs text-muted-foreground">({ratingCount.toLocaleString()})</span>
                  ) : null}
                </span>
              ) : null}
            </div>

            {features.length > 0 ? (
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={`${title}-feature-${index}`} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>

          {footerContent ? (
            <CardFooter className="mt-4 border-t bg-muted/40 px-0 pt-4">
              <div className="w-full">{footerContent}</div>
            </CardFooter>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default CollectionTourCard;

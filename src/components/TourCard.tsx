import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Star, MapPin, Clock, Users, Heart, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { addWishlistItem, removeWishlistItem, type WishlistItem } from "@/services/wishlistApi";

interface TourCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  category: string;
  isPopular?: boolean;
  features: string[];
}

const TourCard = ({
  id,
  title,
  location,
  image,
  rating,
  reviewCount,
  price,
  originalPrice,
  discount,
  duration,
  category,
  isPopular,
  features,
}: TourCardProps) => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userWishlistKey = ["wishlist", currentUser?.id != null ? String(currentUser.id) : "guest"] as const;
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);

  const syncWishlistState = useCallback(() => {
    const cached = queryClient.getQueryData<WishlistItem[]>(userWishlistKey);
    if (!Array.isArray(cached)) {
      setWishlistItemId(null);
      return;
    }
    const matched = cached.find((entry) => String(entry.tour_id) === String(id));
    setWishlistItemId(matched?.id ?? null);
  }, [id, queryClient, userWishlistKey]);

  useEffect(() => {
    syncWishlistState();
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.query?.queryKey?.[0] === "wishlist" &&
        event.query?.queryKey?.[1] === userWishlistKey[1]
      ) {
        syncWishlistState();
      }
    });
    return unsubscribe;
  }, [queryClient, syncWishlistState, userWishlistKey]);

  useEffect(() => {
    if (!currentUser) {
      setWishlistItemId(null);
    } else {
      syncWishlistState();
    }
  }, [currentUser, syncWishlistState]);

  const addWishlistMutation = useMutation<WishlistItem, unknown, string>({
    mutationFn: (tourId: string) => addWishlistItem(tourId),
    onSuccess: (item) => {
      setWishlistItemId(item.id);
      queryClient.setQueryData<WishlistItem[]>(userWishlistKey, (previous) => {
        const existing = Array.isArray(previous) ? previous : [];
        const filtered = existing.filter((entry) => entry.id !== item.id);
        return [item, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã thêm vào yêu thích",
        description: "Tour đã được lưu trong mục Wishlist của bạn.",
      });
    },
    onError: (error) => {
      const description =
        error instanceof Error && error.message
          ? error.message
          : "Không thể thêm tour vào danh sách yêu thích.";
      toast({
        title: "Thao tác thất bại",
        description,
        variant: "destructive",
      });
    },
  });

  const removeWishlistMutation = useMutation<void, unknown, string>({
    mutationFn: (wishlistId: string) => removeWishlistItem(wishlistId),
    onSuccess: (_, removedId) => {
      setWishlistItemId(null);
      queryClient.setQueryData<WishlistItem[]>(userWishlistKey, (previous) =>
        (previous ?? []).filter((entry) => entry.id !== removedId),
      );
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: "Đã xoá khỏi yêu thích",
        description: "Tour đã được gỡ khỏi danh sách Wishlist.",
      });
    },
    onError: (error) => {
      const description =
        error instanceof Error && error.message
          ? error.message
          : "Không thể xoá tour khỏi danh sách yêu thích.";
      toast({
        title: "Thao tác thất bại",
        description,
        variant: "destructive",
      });
    },
  });

  const resolveWishlistId = useCallback(() => {
    if (wishlistItemId) return wishlistItemId;
    const cached = queryClient.getQueryData<WishlistItem[]>(userWishlistKey);
    const matched = cached?.find((entry) => String(entry.tour_id) === String(id));
    return matched?.id ?? null;
  }, [id, queryClient, userWishlistKey, wishlistItemId]);

  const isWishlisted = Boolean(wishlistItemId);
  const isWishlistMutating = addWishlistMutation.isPending || removeWishlistMutation.isPending;

  const handleWishlistToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!id) return;
      if (!currentUser) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Đăng nhập để quản lý danh sách yêu thích.",
          variant: "destructive",
        });
        return;
      }
      if (isWishlistMutating) return;
      if (isWishlisted) {
        const targetId = resolveWishlistId();
        if (!targetId) {
          toast({
            title: "Không thể xoá khỏi yêu thích",
            description: "Không tìm thấy tour trong danh sách của bạn. Vui lòng thử lại.",
            variant: "destructive",
          });
          syncWishlistState();
          return;
        }
        removeWishlistMutation.mutate(targetId);
      } else {
        addWishlistMutation.mutate(id);
      }
    },
    [
      addWishlistMutation,
      currentUser,
      id,
      isWishlisted,
      isWishlistMutating,
      removeWishlistMutation,
      resolveWishlistId,
      syncWishlistState,
      toast,
    ],
  );

  const hasPrice = typeof price === "number" && Number.isFinite(price) && price > 0;
  const formattedPrice = hasPrice ? `₫ ${price.toLocaleString("vi-VN")}` : "Liên hệ";
  const showOriginalPrice =
    typeof originalPrice === "number" &&
    Number.isFinite(originalPrice) &&
    hasPrice &&
    originalPrice > price;
  return (
    <Link to={`/activity/${id}`}>
      <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group cursor-pointer h-full min-h-[440px] flex flex-col">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          {isPopular && (
            <Badge className="bg-gradient-orange text-white border-0">
              Phổ biến
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="ml-2">
              Giảm {discount}%
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost" 
          size="icon"
          className={`absolute top-3 right-3 bg-white/80 hover:bg-white ${isWishlisted ? "text-red-500" : ""}`}
          onClick={handleWishlistToggle}
          disabled={isWishlistMutating}
        >
          {isWishlistMutating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          )}
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{category} • {location}</span>
          </div>
          
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{duration}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{(Math.random() * 100 + 10).toFixed(0)}K+ Đã đặt</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t mt-auto">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {showOriginalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₫ {originalPrice!.toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Từ</span>
              <span className="text-lg font-bold text-primary ml-1">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default TourCard;

import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActivePromotions, type HomePromotion } from "@/services/publicApi";
import { Link } from "react-router-dom";

interface FeaturedDealsProps {
  promotions?: HomePromotion[];
}

const GRADIENTS = [
  "bg-gradient-to-br from-purple-500 to-pink-500",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-blue-500 to-purple-500",
  "bg-gradient-to-br from-rose-500 to-fuchsia-500",
  "bg-gradient-to-br from-amber-500 to-rose-500",
];

const BUTTON_TEXT = "Săn deal ngay";

const fallbackDeals = [
  {
    id: "fallback-1",
    title: "Sale Sinh Nhật",
    subtitle: "Vé tham quan & Khách sạn",
    discountLabel: "Giảm đến 40%",
    gradient: GRADIENTS[0],
  },
  {
    id: "fallback-2",
    title: "Siêu ưu đãi cuối tuần",
    subtitle: "Combo khách sạn + vé tham quan",
    discountLabel: "Deal khủng",
    gradient: GRADIENTS[1],
  },
  {
    id: "fallback-3",
    title: "Đặt tour nhóm",
    subtitle: "Tiết kiệm hơn cho cả gia đình",
    discountLabel: "Tặng thêm voucher",
    gradient: GRADIENTS[2],
  },
];

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("vi-VN");
};

const buildDiscountLabel = (promotion: HomePromotion) => {
  const { discount_type, value } = promotion;
  if (discount_type === "percent" || discount_type === "percentage") {
    return `Giảm ${value}%`;
  }
  if (discount_type === "fixed") {
    const formatted = new Intl.NumberFormat("vi-VN").format(value);
    return `Giảm ₫${formatted}`;
  }
  return "Ưu đãi hấp dẫn";
};

const buildSubtitle = (promotion: HomePromotion) => {
  const from = formatDate(promotion.valid_from);
  const to = formatDate(promotion.valid_to);
  if (from && to) return `Hiệu lực: ${from} - ${to}`;
  if (to) return `Hiệu lực đến ${to}`;
  return "Áp dụng cho số lượng có hạn";
};

const mapPromotionToDeal = (promotion: HomePromotion, index: number) => {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  return {
    id: promotion.id ?? index,
    title: promotion.code ?? "VietTravel Deal",
    subtitle: buildSubtitle(promotion),
    discountLabel: buildDiscountLabel(promotion),
    gradient,
  };
};

const PROMOTION_LIMIT = 5;

const FeaturedDeals = ({ promotions }: FeaturedDealsProps) => {
  const shouldFetch = !promotions;
  const promotionsQuery = useQuery({
    queryKey: ["public-promotions-active", PROMOTION_LIMIT],
    queryFn: () => fetchActivePromotions(PROMOTION_LIMIT),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
  });

  const data = promotions ?? promotionsQuery.data ?? [];
  const isLoading = shouldFetch ? promotionsQuery.isLoading : false;
  const deals = data.length > 0 ? data.map(mapPromotionToDeal) : fallbackDeals;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Ưu đãi cho bạn</h2>
          <Link
            to="/deals"
            className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[220px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${deal.gradient} p-6 min-h-[200px] flex flex-col justify-between text-white`}
              >
                <div className="absolute top-4 right-4 opacity-20">
                  <div className="w-16 h-16 bg-white rounded-full"></div>
                </div>
                <div className="absolute bottom-4 left-4 opacity-10">
                  <div className="w-24 h-24 bg-white rounded-full"></div>
                </div>

                <div>
                  <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold mb-3 w-fit">
                    {deal.discountLabel}
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight">{deal.title}</h3>
                  <p className="text-white/90 text-sm mb-4">{deal.subtitle}</p>
                </div>

                <Button
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 w-fit text-xs font-semibold"
                >
                  {BUTTON_TEXT}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedDeals;

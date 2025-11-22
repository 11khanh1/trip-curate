import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Clock, Percent, Tag, Sparkles } from "lucide-react";
import { fetchActivePromotions, type HomePromotion } from "@/services/publicApi";
import { useToast } from "@/hooks/use-toast";

const GRADIENTS = [
  "from-cyan-400 to-cyan-600",
  "from-purple-500 to-purple-700",
  "from-orange-500 to-red-600",
  "from-blue-400 to-blue-600",
  "from-amber-400 to-orange-500",
];

const PROMOTION_LIMIT = 12;

const fallbackBanners = [
  {
    id: "fallback-banner-1",
    code: "SALE50",
    discountLabel: "Giảm 50%",
    subtitle: "Hoạt động vui chơi",
    gradient: GRADIENTS[0],
  },
  {
    id: "fallback-banner-2",
    code: "200KOFF",
    discountLabel: "Giảm 200K",
    subtitle: "Hoạt động nước ngoài",
    gradient: GRADIENTS[1],
  },
  {
    id: "fallback-banner-3",
    code: "TOUR300",
    discountLabel: "Giảm 300K",
    subtitle: "Tour nước ngoài",
    gradient: GRADIENTS[2],
  },
  {
    id: "fallback-banner-4",
    code: "WEEKEND7",
    discountLabel: "Giảm 7%",
    subtitle: "Hoạt động cuối tuần",
    gradient: GRADIENTS[3],
  },
  {
    id: "fallback-banner-5",
    code: "SPA8",
    discountLabel: "Giảm 8%",
    subtitle: "Suối nước nóng & ăn uống",
    gradient: GRADIENTS[4],
  },
];

const fallbackDeals = [
  {
    id: "fallback-deal-1",
    title: "Vé tham quan nước ngoài",
    code: "ATTNUOCNGOAISN",
    discount: "Giảm 200.000₫",
    usageLimit: "Không giới hạn",
    validity: "Áp dụng cuối tuần",
    icon: <Tag className="w-5 h-5" />,
    appOnly: true,
  },
  {
    id: "fallback-deal-2",
    title: "Land tour nước ngoài",
    code: "TOURNUOCNGOAISN",
    discount: "Giảm 300.000₫",
    usageLimit: "Không giới hạn",
    validity: "Áp dụng cuối tuần",
    icon: <Tag className="w-5 h-5" />,
    appOnly: true,
  },
  {
    id: "fallback-deal-3",
    title: "Suối nước nóng & Voucher ăn uống",
    code: "THUGIANSN25",
    discount: "Giảm 8%",
    usageLimit: "Không giới hạn",
    validity: "Áp dụng cuối tuần",
    icon: <Percent className="w-5 h-5" />,
    appOnly: true,
  },
  {
    id: "fallback-deal-4",
    title: "Vui chơi cuối tuần",
    code: "VUICUOITUANSN25",
    discount: "Giảm 7%",
    usageLimit: "Không giới hạn",
    validity: "Áp dụng cuối tuần",
    icon: <Percent className="w-5 h-5" />,
    appOnly: false,
  },
  {
    id: "fallback-deal-5",
    title: "Vé tham quan nội địa",
    code: "ATTCUOITUANSN",
    discount: "Giảm 10%",
    usageLimit: "Không giới hạn",
    validity: "Áp dụng cuối tuần",
    icon: <Percent className="w-5 h-5" />,
    appOnly: false,
  },
  {
    id: "fallback-deal-6",
    title: "Flash Sale khách sạn",
    code: "HOTELDEAL30",
    discount: "Giảm 30%",
    usageLimit: "Không giới hạn",
    validity: "Trong tuần",
    icon: <Clock className="w-5 h-5" />,
    appOnly: true,
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
  if ((discount_type === "percent" || discount_type === "percentage") && Number.isFinite(value)) {
    return `Giảm ${value}%`;
  }
  if (discount_type === "fixed" && Number.isFinite(value)) {
    const formatted = new Intl.NumberFormat("vi-VN").format(value ?? 0);
    return `Giảm ₫${formatted}`;
  }
  if (Number.isFinite(value)) {
    const formatted = new Intl.NumberFormat("vi-VN").format(value ?? 0);
    return `Ưu đãi ₫${formatted}`;
  }
  return "Ưu đãi hấp dẫn";
};

const buildValidityLabel = (promotion: HomePromotion) => {
  const from = formatDate(promotion.valid_from);
  const to = formatDate(promotion.valid_to);
  if (from && to) return `${from} - ${to}`;
  if (to) return `Đến ${to}`;
  return "Thời gian có hạn";
};

const buildUsageLimit = (promotion: HomePromotion) => {
  const limit = promotion.max_usage;
  if (typeof limit !== "number" || limit <= 0) return "Không giới hạn";
  return `${limit.toLocaleString("vi-VN")} lượt`;
};

const resolveIcon = (promotion: HomePromotion) => {
  const type = promotion.discount_type;
  if (type === "percent" || type === "percentage") return <Percent className="w-5 h-5" />;
  if (type === "fixed") return <Tag className="w-5 h-5" />;
  return <Gift className="w-5 h-5" />;
};

const mapPromotionToBanner = (promotion: HomePromotion, index: number) => ({
  id: promotion.id ?? `promotion-${index}`,
  code: (promotion.code ?? "Ưu đãi").toUpperCase(),
  discountLabel: buildDiscountLabel(promotion),
  subtitle: buildValidityLabel(promotion),
  gradient: GRADIENTS[index % GRADIENTS.length],
});

const mapPromotionToDeal = (promotion: HomePromotion) => {
  const fallbackId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `promotion-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  return {
    id: promotion.id ?? promotion.code ?? fallbackId,
    title: promotion.code ?? "Khuyến mãi đặc biệt",
    code: (promotion.code ?? "—").toUpperCase(),
    discount: buildDiscountLabel(promotion),
    usageLimit: buildUsageLimit(promotion),
    validity: buildValidityLabel(promotion),
    icon: resolveIcon(promotion),
    appOnly: false,
  };
};

const Deals = () => {
  const promotionsQuery = useQuery({
    queryKey: ["public-promotions-active", PROMOTION_LIMIT],
    queryFn: () => fetchActivePromotions(PROMOTION_LIMIT),
    staleTime: 5 * 60 * 1000,
  });
  const { toast } = useToast();

  const promotions = promotionsQuery.data ?? [];

  const { bannerItems, dealItems } = useMemo(() => {
    if (promotions.length === 0) {
      return {
        bannerItems: fallbackBanners,
        dealItems: fallbackDeals,
      };
    }
    const banners = promotions.slice(0, 5).map(mapPromotionToBanner);
    const deals = promotions.map(mapPromotionToDeal);
    return {
      bannerItems: banners.length > 0 ? banners : fallbackBanners,
      dealItems: deals.length > 0 ? deals : fallbackDeals,
    };
  }, [promotions]);

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              😍 SALE THỨ 6 - CUỐI TUẦN 😍
            </h1>
            <p className="text-xl">Săn ngay deal siêu hời!</p>
          </div>

          {/* Promotion Banners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {promotionsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))
            ) : (
              bannerItems.map((banner) => (
                <Card
                  key={banner.id}
                  className={`bg-gradient-to-br ${banner.gradient} border-0 text-white transform transition-transform hover:scale-105`}
                >
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="font-semibold text-xs tracking-wide uppercase text-white/90">
                      {banner.code}
                    </div>
                    <div className="text-2xl font-black">{banner.discountLabel}</div>
                    <div className="text-xs font-medium text-white/90">{banner.subtitle}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Deal Codes Section */}
      <section className="relative py-16 bg-gradient-to-b from-[#f7f9ff] via-white to-[#fff7f0]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-10 top-8 h-24 w-24 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute right-6 bottom-10 h-28 w-28 rounded-full bg-blue-200/40 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col gap-3 mb-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-9 h-9 text-orange-600" />
              <div>
                <h2 className="text-3xl font-bold text-foreground">Mã giảm giá</h2>
                <p className="text-sm text-muted-foreground">Nhận ưu đãi, nhập mã và tiết kiệm cho chuyến đi của bạn</p>
              </div>
            </div>
            <Badge className="flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              <Sparkles className="h-4 w-4" />
              Ưu đãi nổi bật
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {promotionsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 rounded-2xl" />
                ))
              : dealItems.map((deal) => (
                  <Card
                    key={deal.id}
                    className="hover:shadow-lg transition hover:-translate-y-1 border border-orange-100 bg-white/90 backdrop-blur"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                          {deal.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{deal.title}</h3>

                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-lg border-2 border-dashed border-orange-400">
                              <div className="text-xs text-muted-foreground mb-1">Mã ưu đãi:</div>
                              <div className="font-bold text-orange-600">{deal.code}</div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Giảm giá:</span>
                              <span className="font-semibold text-primary">{deal.discount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Hiệu lực:</span>
                              <span className="font-semibold">{deal.validity}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Giới hạn:</span>
                              <span className="font-semibold">{deal.usageLimit}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              className="flex-1"
                              onClick={() => {
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard
                                    .writeText(deal.code)
                                    .then(() => {
                                      toast({
                                        title: "Đã sao chép mã khuyến mãi",
                                        description: `${deal.code} đã được lưu vào bộ nhớ tạm.`,
                                      });
                                    })
                                    .catch(() => {
                                      toast({
                                        title: "Không thể sao chép",
                                        description: "Vui lòng thử lại hoặc tự sao chép mã.",
                                        variant: "destructive",
                                      });
                                    });
                                }
                              }}
                            >
                              Lưu mã
                            </Button>
                            {deal.appOnly && (
                              <Badge variant="secondary" className="text-xs">
                                Chỉ trên App
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Cách sử dụng mã giảm giá</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Chọn hoạt động</h3>
              <p className="text-sm text-muted-foreground">Tìm và chọn hoạt động yêu thích của bạn</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Nhập mã giảm giá</h3>
              <p className="text-sm text-muted-foreground">Áp dụng mã tại trang thanh toán</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Hoàn tất đặt chỗ</h3>
              <p className="text-sm text-muted-foreground">Thanh toán và nhận xác nhận ngay</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Deals;

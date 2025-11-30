import { Search, Menu, User, ShoppingBag, Gift, ChevronDown, HelpCircle, Clock, Settings, Shield, LogOut, Briefcase, Receipt, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchSearchSuggestions, type SearchSuggestion } from "@/services/publicApi";
import { Separator } from "./ui/separator";
import NotificationDropdown from "@/components/notifications/NotificationsDropdown";

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'partner' | 'admin';
}

interface UserContextType {
    currentUser: CurrentUser | null;
    setCurrentUser: (user: CurrentUser | null) => void;
}

// ====================================================================================
// COMPONENT: CART POPOVER CONTENT
// ====================================================================================
const CartPopoverContent = () => {
  const { items, totalAmount } = useCart();
  const navigate = useNavigate();

  const formatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }),
    [],
  );

  return (
    <div className="flex flex-col">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
          <p className="mt-4 font-semibold text-foreground">Giỏ hàng của bạn đang trống</p>
          <p className="text-sm text-muted-foreground">Hãy bắt đầu khám phá và thêm sản phẩm!</p>
        </div>
      ) : (
        <>
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
            {items.map((item) => (
              <Link to={`/activity/${item.tourId}`} key={item.id} className="flex items-start gap-4 group">
                <img
                  src={item.thumbnail ?? "https://via.placeholder.com/150"}
                  alt={item.tourTitle}
                  className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.tourTitle}</p>
                  <p className="text-xs text-muted-foreground">{item.packageName}</p>
                  {item.scheduleTitle && <p className="text-xs text-muted-foreground">{item.scheduleTitle}</p>}
                  {typeof item.minParticipants === "number" && item.minParticipants > 0 && (
                    <p className="text-xs text-muted-foreground">Tối thiểu {item.minParticipants} khách</p>
                  )}
                  {typeof item.slotsAvailable === "number" && (
                    <p className="text-xs text-muted-foreground">
                      {typeof item.seatsTotal === "number"
                        ? `Còn ${item.slotsAvailable}/${item.seatsTotal} chỗ`
                        : `Còn ${item.slotsAvailable} chỗ`}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.adultCount} Người lớn
                    {item.childCount > 0 && `, ${item.childCount} Trẻ em`}
                  </p>
                  <p className="text-sm font-medium text-primary mt-1">{formatter.format(item.totalPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
          <Separator />
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center font-semibold">
              <span>Tổng tiền ({items.length} sản phẩm):</span>
              <span>{formatter.format(totalAmount)}</span>
            </div>
            <Button onClick={() => navigate("/cart")} className="w-full bg-orange-500 hover:bg-orange-600">
              Xem giỏ hàng
            </Button>
          </div>
        </>
      )}
    </div>
  );
};


// ====================================================================================
// COMPONENT CHÍNH: TRAVEL HEADER
// ====================================================================================
const TravelHeader = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser, setCurrentUser } = useUser() as UserContextType;
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { totalItems, clearCart } = useCart();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(searchValue.trim());
    }, 300);
    return () => window.clearTimeout(handler);
  }, [searchValue]);

  const suggestionsQuery = useQuery({
    queryKey: ["search-suggestions", debouncedValue],
    queryFn: () => fetchSearchSuggestions(debouncedValue),
    enabled: debouncedValue.length > 0,
  });

  const suggestions = suggestionsQuery.data?.suggestions ?? [];

  const showSuggestionDropdown = useMemo(() => {
    if (!isSearchFocused) return false;
    if (searchValue.trim().length === 0) return false;
    return suggestionsQuery.isFetching || suggestions.length > 0;
  }, [isSearchFocused, searchValue, suggestionsQuery.isFetching, suggestions.length]);

  const handleSearchSubmit = (keyword?: string) => {
    const term = keyword ?? searchValue.trim();
    if (!term) return;
    setIsSearchFocused(false);
    navigate(`/resultsearch?keyword=${encodeURIComponent(term)}`);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchValue("");
    setIsSearchFocused(false);
    if (suggestion.id !== undefined && suggestion.id !== null) {
      navigate(`/activity/${suggestion.id}`);
    } else if (suggestion.title) {
      handleSearchSubmit(suggestion.title);
    }
  };

  // Dữ liệu menu... (giữ nguyên)
  const regions = [
    {
      id: "hanoi",
      name: "Hà Nội",
      subtitle: "Phố cổ & văn hóa",
      image: "https://th.bing.com/th/id/OIP.U4qkbrQ2P80ghwdnVkyYhAHaFn?w=237&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Hà Nội",
    },
    {
      id: "hcmc",
      name: "TP. Hồ Chí Minh",
      subtitle: "Đô thị sôi động",
      image: "data:image/webp;base64,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",
      keyword: "Hồ Chí Minh",
    },
    {
      id: "danang",
      name: "Đà Nẵng",
      subtitle: "Biển & ẩm thực",
      image: "https://th.bing.com/th/id/OIP.iz-DOT2w-MktVzNEiWd-dgHaEP?w=280&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Đà Nẵng",
    },
    {
      id: "dalat",
      name: "Đà Lạt",
      subtitle: "Xứ sở mộng mơ",
      image: "https://th.bing.com/th/id/OIP.3hYHO4EXKvi82OVVETNO9gHaE7?w=285&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Đà Lạt",
    },
    {
      id: "nhatrang",
      name: "Nha Trang",
      subtitle: "Thiên đường biển",
      image: "data:image/webp;base64,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",
      keyword: "Nha Trang",
    },
    {
      id: "halong",
      name: "Hạ Long",
      subtitle: "Vịnh di sản",
      image: "data:image/webp;base64,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",
      keyword: "Hạ Long",
    },
    {
      id: "phuquoc",
      name: "Phú Quốc",
      subtitle: "Đảo ngọc",
      image: "https://th.bing.com/th/id/OIP.L1Z_RnujZqeatQJcnGEpbgHaEK?w=260&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Phú Quốc",
    },
    {
      id: "sapa",
      name: "Sa Pa",
      subtitle: "Núi rừng Tây Bắc",
      image: "data:image/webp;base64,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",
      keyword: "Sa Pa",
    },
  ];

  const destinations = [
    {
      id: "1",
      name: "Sapa",
      subtitle: "Núi rừng Tây Bắc",
      image: "https://th.bing.com/th/id/OIP.wfe95pvzUVn8oyZVjK9YowHaEo?w=289&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Sapa",
    },
    {
      id: "2",
      name: "Hà Nội",
      subtitle: "Phố cổ & văn hóa",
      image: "https://th.bing.com/th/id/OIP.zqR8hpfQx6Rla8dKQBNK7QHaE8?w=225&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Hà Nội",
    },
    {
      id: "3",
      name: "TP Hồ Chí Minh",
      subtitle: "Đô thị sôi động",
      image: "https://th.bing.com/th/id/OIP.RAaUfDMXZuE-E-Z_FD4Z8QHaEU?w=258&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Hồ Chí Minh",
    },
    {
      id: "4",
      name: "Hạ Long",
      subtitle: "Vịnh di sản",
      image: "https://th.bing.com/th/id/OIP.wBNNbqjveKbsyuJZktu8uAHaEK?w=332&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Hạ Long",
    },
    {
      id: "5",
      name: "Phú Quốc",
      subtitle: "Đảo ngọc",
      image: "https://th.bing.com/th/id/OIP.FuN6s5nrb_bqmGPxBIlUsQHaE7?w=305&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Phú Quốc",
    },
    {
      id: "6",
      name: "Nha Trang",
      subtitle: "Thiên đường biển",
      image: "data:image/webp;base64,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",
      keyword: "Nha Trang",
    },
    {
      id: "7",
      name: "Đà Nẵng",
      subtitle: "Biển & ẩm thực",
      image: "data:image/webp;base64,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",
      keyword: "Đà Nẵng",
    },
    {
      id: "8",
      name: "Hội An",
      subtitle: "Phố cổ ven sông",
      image: "https://th.bing.com/th/id/OIP.DSo3UM0Ni7jKTAEbTaK0zQHaD2?w=341&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      keyword: "Hội An",
    },
  ];

  const landmarks = [
    {
      id: "1",
      name: "Phố cổ Hội An",
      location: "Hội An",
      keyword: "Phố cổ Hội An",
      image: "https://th.bing.com/th/id/OIP.hvcCQmE2vXQ04NKgMDvkxAHaFF?w=306&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "2",
      name: "Vịnh Hạ Long",
      location: "Quảng Ninh",
      keyword: "Vịnh Hạ Long",
      image: "https://th.bing.com/th/id/OIP.RgYQk8GdgfPFtpo7geQaXwHaEs?w=303&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "3",
      name: "Bà Nà Hills",
      location: "Đà Nẵng",
      keyword: "Bà Nà Hills",
      image: "https://th.bing.com/th/id/OIP.IMKM-OdCRdwhO8qFijm8HAHaEK?w=270&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "4",
      name: "Cầu Vàng",
      location: "Đà Nẵng",
      keyword: "Cầu Vàng",
      image: "https://th.bing.com/th/id/OIP.u-DICfagveDN2gV8JQvhJQHaF4?w=172&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "5",
      name: "Tháp Chàm Po Nagar",
      location: "Nha Trang",
      keyword: "Tháp Chàm Po Nagar",
      image: "https://th.bing.com/th/id/OIP.F14dTtGkM7Z56dCORFkDFAHaEK?w=355&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "6",
      name: "VinWonders Phú Quốc",
      location: "Phú Quốc",
      keyword: "VinWonders Phú Quốc",
      image: "https://th.bing.com/th/id/OIP.xuCaFcCtnfAWlVJHvD94xAHaE7?w=293&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "7",
      name: "Nhà thờ Đức Bà",
      location: "TP.HCM",
      keyword: "Nhà thờ Đức Bà",
      image: "https://th.bing.com/th/id/OIP.-t5XMVizggb7lw0dDN6qJgHaFA?w=232&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "8",
      name: "Lăng Chủ tịch Hồ Chí Minh",
      location: "Hà Nội",
      keyword: "Lăng Chủ tịch Hồ Chí Minh",
      image: "https://th.bing.com/th/id/OIP.63AeyDmX2SlAYYjDzzV0dwHaFj?w=257&h=193&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "9",
      name: "Chợ Đêm Đà Lạt",
      location: "Đà Lạt",
      keyword: "Chợ đêm Đà Lạt",
      image: "https://th.bing.com/th/id/OIP.nBiR1UiYs6NlbrXhm_FL5wHaE6?w=247&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "10",
      name: "Chợ Bến Thành",
      location: "TP.HCM",
      keyword: "Chợ Bến Thành",
      image: "https://th.bing.com/th/id/OIP.vgX-9C05y3QdXpIJeMfZPgHaE9?w=253&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "11",
      name: "Fansipan",
      location: "Sa Pa",
      keyword: "Fansipan",
      image: "https://th.bing.com/th/id/OIP.qY649Mrmkhjc2ICtVBf6lAHaE8?w=232&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
    {
      id: "12",
      name: "Lâu đài trắng Tam Đảo",
      location: "Vĩnh Phúc",
      keyword: "Tam Đảo",
      image: "https://th.bing.com/th/id/OIP.rLfUVFFcafcNgrhrNNNHIgHaEK?w=357&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    },
  ];

  const mobileNavLinks = [
    { label: "Địa danh phổ biến", href: "/activities" },
    { label: "Ưu đãi hot", href: "/deals" },
    { label: "Khám phá VietTravel", href: "/about/our-story" },
    { label: "Hỗ trợ", href: "/support/help-center" },
  ];


  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 py-3 md:flex-nowrap md:justify-between md:py-0 md:h-16">
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link to="/" className="text-2xl font-bold text-primary">
                VietTravel
              </Link>
              <div className="flex items-center gap-2 md:hidden">
                {currentUser ? <NotificationDropdown /> : null}
              </div>
            </div>

            <div className="order-3 w-full md:order-none md:flex-1 md:max-w-md md:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm theo điểm đến, hoạt động"
                  className="pl-10 pr-4 py-2 w-full border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm md:text-base"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSearchFocused(false), 150);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearchSubmit();
                    }
                    if (event.key === "Escape") {
                      setIsSearchFocused(false);
                    }
                  }}
                />
                {/* PHẦN GỢI Ý TÌM KIẾM ĐÃ ĐƯỢC KHÔI PHỤC */}
                {showSuggestionDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
                    {suggestionsQuery.isFetching ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Đang tìm kiếm...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</div>
                    ) : (
                      <ul className="max-h-72 overflow-y-auto py-2">
                        {suggestions.map((suggestion) => (
                          <li key={`${suggestion.id ?? suggestion.title}`} className="px-2">
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <p className="text-sm font-medium text-foreground">{suggestion.title ?? "Tour chưa đặt tên"}</p>
                              {suggestion.destination ? (
                                <p className="text-xs text-muted-foreground">{suggestion.destination}</p>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSearchSubmit()}
                      >
                        Xem tất cả kết quả
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end w-full md:w-auto md:justify-end order-2 md:order-none">
            
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm"
                asChild
              >
                <Link to="/support/help-center" className="inline-flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Trợ giúp
                </Link>
              </Button>
              {currentUser ? (
                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm"
                asChild
              >
                <Link to="/recent" className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Xem gần đây
                </Link>
              </Button>
            

              {/* GIỎ HÀNG CHO DESKTOP */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden items-center gap-2 text-gray-600 hover:text-gray-800 md:flex relative">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="text-sm">Giỏ hàng</span>
                    {totalItems > 0 && (
                      <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(90vw,380px)] p-0" align="center">
                  <CartPopoverContent />
                </PopoverContent>
              </Popover>

              {/* GIỎ HÀNG CHO MOBILE */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-gray-600 hover:text-gray-800 relative">
                    <ShoppingBag className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(90vw,380px)] p-0" align="center">
                  <CartPopoverContent />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-gray-800"
                asChild
              >
                <Link to="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <span className="font-medium text-gray-800">{currentUser.name}</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white">
                        
                        {currentUser.role === 'admin' && (
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                              <Shield className="w-4 h-4" />
                              Quản lý
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {currentUser.role === 'partner' && (
                          <DropdownMenuItem asChild>
                            <Link to="/partner" className="flex items-center gap-2 cursor-pointer">
                              <Briefcase className="w-4 h-4" />
                              Đối tác
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {currentUser.role === 'customer' && (
                           <DropdownMenuItem asChild>
                              <Link to="/wishlist" className="flex items-center gap-2 cursor-pointer">
                                <Heart className="w-4 h-4" />
                                Danh sách yêu thích
                              </Link>
                            </DropdownMenuItem>
                        )}
                        {currentUser.role === 'customer' && (
                          <DropdownMenuItem asChild>
                            <Link to="/bookings" className="flex items-center gap-2 cursor-pointer">
                              <Receipt className="w-4 h-4" />
                              Lịch sử đơn hàng
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link to="/account-settings" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            Cài đặt
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await clearCart({ persist: false });
                            } catch (cartError) {
                              console.error("Không thể xoá giỏ hàng khi đăng xuất:", cartError);
                            }
                            queryClient.removeQueries({ queryKey: ["wishlist"] });
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            setCurrentUser(null);
                            setTimeout(() => {
                              window.location.href = "/";
                            }, 300);
                          }}
                          className="cursor-pointer flex items-center gap-2 text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAuthMode("register");
                      setShowAuthModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Đăng ký
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthModal(true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    Đăng nhập
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="hidden border-t py-3 lg:block">
             <NavigationMenu>
              <NavigationMenuList className="flex items-center space-x-8">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Khu vực phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {regions.map((region) => (
                          <Link
                            key={region.id}
                            to={`/resultsearch?keyword=${encodeURIComponent(region.keyword ?? region.name)}`}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <img src={region.image} alt={region.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="text-xs text-gray-500">{region.subtitle}</p>
                              <h3 className="font-semibold text-gray-900">{region.name}</h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Điểm đến phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {destinations.map((destination) => (
                          <Link
                            key={destination.id}
                            to={`/resultsearch?keyword=${encodeURIComponent(destination.keyword ?? destination.name)}`}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <img src={destination.image} alt={destination.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="text-xs text-gray-500">{destination.subtitle}</p>
                              <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Địa danh phổ biến
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-4">
                        {landmarks.map((landmark) => (
                          <Link
                            key={landmark.id}
                            to={`/resultsearch?keyword=${encodeURIComponent(landmark.keyword ?? landmark.name)}`}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <img src={landmark.image} alt={landmark.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{landmark.name}</h3>
                              <p className="text-xs text-gray-500">{landmark.location}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="border-t py-2 lg:hidden">
            <div className="container mx-auto px-4">
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
                {mobileNavLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="whitespace-nowrap rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary/80 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
};

export default TravelHeader;

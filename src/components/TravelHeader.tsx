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
      id: "1",
      name: "VIỆT NAM",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop",
      url: "/regions/vietnam",
    },
    {
      id: "2",
      name: "NHẬT BẢN",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=100&h=100&fit=crop",
      url: "/regions/japan",
    },
    {
      id: "3",
      name: "SINGAPORE",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop",
      url: "/regions/singapore",
    },
    {
      id: "4",
      name: "THÁI LAN",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop",
      url: "/regions/thailand",
    },
    {
      id: "5",
      name: "TRUNG QUỐC",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=100&h=100&fit=crop",
      url: "/regions/china",
    },
    {
      id: "6",
      name: "HÀN QUỐC",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop",
      url: "/regions/south-korea",
    },
    {
      id: "7",
      name: "ÚC",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=100&h=100&fit=crop",
      url: "/regions/australia",
    },
    {
      id: "8",
      name: "ANH",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=100&h=100&fit=crop",
      url: "/regions/uk",
    },
    {
      id: "9",
      name: "THỤY SĨ",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=100&h=100&fit=crop",
      url: "/regions/switzerland",
    },
    {
      id: "10",
      name: "MỸ",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=100&h=100&fit=crop",
      url: "/regions/usa",
    },
    {
      id: "11",
      name: "MALAYSIA",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=100&h=100&fit=crop",
      url: "/regions/malaysia",
    },
    {
      id: "12",
      name: "INDONESIA",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=100&h=100&fit=crop",
      url: "/regions/indonesia",
    },
  ];

  const destinations = [
    {
      id: "1",
      name: "Sapa",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&h=100&fit=crop",
    },
    {
      id: "2",
      name: "Thượng Hải",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&h=100&fit=crop",
    },
    {
      id: "3",
      name: "Tokyo",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop",
    },
    {
      id: "4",
      name: "Hà Nội",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=100&h=100&fit=crop",
    },
    {
      id: "5",
      name: "TP Hồ Chí Minh",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=100&h=100&fit=crop",
    },
    {
      id: "6",
      name: "Bangkok",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=100&h=100&fit=crop",
    },
    {
      id: "7",
      name: "Osaka",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=100&h=100&fit=crop",
    },
    {
      id: "8",
      name: "Hồng Kông",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=100&h=100&fit=crop",
    },
    {
      id: "9",
      name: "Phú Quốc",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop",
    },
    {
      id: "10",
      name: "Nha Trang",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop",
    },
    {
      id: "11",
      name: "Đài Bắc",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=100&h=100&fit=crop",
    },
    {
      id: "12",
      name: "Đà Nẵng",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop",
    },
    {
      id: "13",
      name: "Kyoto",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=100&h=100&fit=crop",
    },
    {
      id: "14",
      name: "Seoul",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop",
    },
    {
      id: "15",
      name: "Edinburgh",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=100&h=100&fit=crop",
    },
    {
      id: "16",
      name: "Hội An",
      subtitle: "Vui chơi & Trải nghiệm",
      image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&h=100&fit=crop",
    },
  ];

  const landmarks = [
    {
      id: "1",
      name: "Cung Điện Grand",
      location: "THÁI LAN",
      image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=100&h=100&fit=crop",
    },
    {
      id: "2",
      name: "Núi Phú Sĩ",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=100&h=100&fit=crop",
    },
    {
      id: "3",
      name: "Legoland Discovery Center Tokyo",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop",
    },
    {
      id: "4",
      name: "Sands SkyPark Observation Deck Singapore",
      location: "SINGAPORE",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=100&h=100&fit=crop",
    },
    {
      id: "5",
      name: "Sunway Lagoon",
      location: "MALAYSIA",
      image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=100&h=100&fit=crop",
    },
    {
      id: "6",
      name: "Tokyo Disney Resort",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=100&h=100&fit=crop",
    },
    {
      id: "7",
      name: "Hong Kong Disneyland",
      location: "HỒNG KÔNG",
      image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=100&h=100&fit=crop",
    },
    {
      id: "8",
      name: "Armani Hotel Dubai, Burj Khalifa",
      location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100&h=100&fit=crop",
    },
    {
      id: "9",
      name: "Tokyo Skytree",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop",
    },
    {
      id: "10",
      name: "Tháp Eiffel",
      location: "PHÁP",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=100&h=100&fit=crop",
    },
    {
      id: "11",
      name: "Ghibli Park",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=100&h=100&fit=crop",
    },
    {
      id: "12",
      name: "Nijo Castle",
      location: "NHẬT BẢN",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=100&h=100&fit=crop",
    },
    {
      id: "13",
      name: "Seoul Sky",
      location: "HÀN QUỐC",
      image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=100&h=100&fit=crop",
    },
    {
      id: "14",
      name: "Dhow Cruise Dubai",
      location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT",
      image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=100&h=100&fit=crop",
    },
    {
      id: "15",
      name: "Bánh xe Ferris Miramar",
      location: "ĐÀI LOAN",
      image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=100&h=100&fit=crop",
    },
    {
      id: "16",
      name: "Yas Island",
      location: "CÁC TIỂU VƯƠNG QUỐC Ả RẬP THỐNG NHẤT",
      image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=100&h=100&fit=crop",
    },
  ];

  const exploreCategories = [
    {
      id: "1",
      icon: "🎯",
      title: "Các hoạt động nên trải nghiệm",
      items: [
        "Tour & Trải nghiệm",
        "Tour trong ngày",
        "Massage & Spa",
        "Hoạt động ngoài trời",
        "Trải nghiệm văn hóa",
        "Thể thao dưới nước",
        "Du thuyền",
        "Vé tham quan",
      ],
    },
    {
      id: "3",
      icon: "🚌",
      title: "Các lựa chọn di chuyển",
      items: [
        "Xe sân bay",
        "Thuê xe tự lái",
        "Vé tàu châu Âu",
        "Vé tàu cao tốc Trung Quốc",
        "Vé tàu Nhật Bản",
        "Vé tàu Shinkansen",
        "Xe buýt Hàn Quốc",
      ],
    },
  ];


  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold">
                <span className="text-primary">VietTravel</span>
              </Link>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm theo điểm đến, hoạt động"
                  className="pl-10 pr-4 py-2 w-full border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
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

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hidden md:flex text-gray-600 hover:text-gray-800 text-sm">Mở ứng dụng</Button>
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
              {currentUser ? <NotificationDropdown /> : null}
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
                <PopoverContent className="w-96 p-0" align="center">
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
                <PopoverContent className="w-96 p-0" align="center">
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
              <Button variant="ghost" size="sm" className="md:hidden"><Menu className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="border-t py-3">
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
                          <Link key={region.id} to={region.url} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
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
                          <a key={destination.id} href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <img src={destination.image} alt={destination.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="text-xs text-gray-500">{destination.subtitle}</p>
                              <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                            </div>
                          </a>
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
                          <a key={landmark.id} href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <img src={landmark.image} alt={landmark.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{landmark.name}</h3>
                              <p className="text-xs text-gray-500">{landmark.location}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Khám phá VietTravel
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-white">
                      <div className="grid grid-cols-4 gap-8">
                        {exploreCategories.map((category) => (
                          <div key={category.id}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">{category.icon}</span>
                              <h3 className="font-semibold text-gray-900 text-sm">{category.title}</h3>
                            </div>
                            <ul className="space-y-2">
                              {category.items.map((item, index) => (
                                <li key={index}>
                                  <a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">{item}</a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <a href="#" className="flex items-center text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                    <Gift className="w-4 h-4 mr-1" />
                    Phiếu Quà Tặng VietTravel
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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

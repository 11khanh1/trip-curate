import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Settings,
  Search,
  Gift,
  RefreshCcw,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationInbox from "@/components/notifications/NotificationInbox";

// DỰ ĐOÁN: Bạn sẽ có một UserContext cho Partner User.
// Đảm bảo đường dẫn import này chính xác hoặc thay thế bằng context của bạn.
import { useUser } from "@/context/UserContext"; 

const menuItems = [
  { title: "Tổng quan", url: "/partner", icon: LayoutDashboard, exact: true },
  { title: "Hoạt động của tôi", url: "/partner/activities", icon: MapPin },
  { title: "Khuyến mãi", url: "/partner/promotions", icon: Gift },
  { title: "Yêu cầu hoàn tiền", url: "/partner/refund-requests", icon: RefreshCcw },
  { title: "Đơn đặt", url: "/partner/bookings", icon: Calendar },
  { title: "Cài đặt", url: "/partner/settings", icon: Settings },
];

interface PageInfo {
    title: string;
    desc: string;
}

function PartnerPortalSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm"
    >
      <SidebarHeader className="p-4 h-16"> 
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-500 shadow-sm">
              <span className="text-lg font-bold text-white">VT</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 leading-tight">
                VietTravel
              </h2>
              <p className="text-xs text-gray-500">Partner Portal</p>
            </div>
          </div>
        ) : (
          <div className="h-9 w-9 mx-auto" /> 
        )}
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 px-4 uppercase tracking-wide">
              Quản lý đối tác
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.url, item.exact);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={collapsed ? item.title : undefined}
                      isActive={active}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150
                        ${active
                          ? "bg-gradient-to-r from-primary/10 to-orange-100 text-primary font-semibold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                      }
                    >
                      <NavLink to={item.url}>
                        <item.icon
                          className={`h-5 w-5 ${
                            active ? "text-primary" : "text-gray-500 group-hover:text-gray-800"
                          }`}
                        />
                        {!collapsed && (
                          <span className="text-sm leading-none">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400">
        {!collapsed && "© 2025 VietTravel"}
      </div>
    </Sidebar>
  );
}

export default function PartnerLayout() {
  const navigate = useNavigate(); 
  const location = useLocation();
  // Lấy thông tin người dùng từ UserContext
  const { currentUser } = useUser(); 

  const pageTitles: Record<string, PageInfo> = {
    "/partner": { title: "Tổng quan", desc: "Xem tổng quan hoạt động kinh doanh" },
    "/partner/activities": { title: "Hoạt động của tôi", desc: "Quản lý và cập nhật tour" },
    "/partner/bookings": { title: "Đơn đặt", desc: "Danh sách đơn hàng của khách" },
    "/partner/promotions": { title: "Khuyến mãi", desc: "Quản lý ưu đãi tự động cho tour" },
    "/partner/refund-requests": {
      title: "Yêu cầu hoàn tiền",
      desc: "Xử lý hoàn tiền và cập nhật chứng từ",
    },
    "/partner/settings": { title: "Cài đặt", desc: "Cấu hình tài khoản đối tác" },
  };

  const currentPage: PageInfo = (() => {
    if (pageTitles[location.pathname]) {
        return pageTitles[location.pathname];
    }

    const menuItem = menuItems.find(item => location.pathname.startsWith(item.url));
    if (menuItem) {
        return { 
            title: menuItem.title, 
            desc: `Trang quản lý: ${menuItem.title}` 
        };
    }

    return {
        title: "Trang đối tác",
        desc: "Hệ thống quản lý VietTravel Partner",
    };
  })();

  // Lấy chữ cái đầu tiên của tên hoặc 'P' nếu không có tên
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'P';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PartnerPortalSidebar />
        
        <div className="flex flex-1 flex-col bg-slate-50">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 pr-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-lg font-semibold text-foreground">{currentPage.title}</h1>
                <p className="text-xs text-muted-foreground">{currentPage.desc}</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="relative hidden w-full max-w-md md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm kiếm trong trang đối tác..." className="pl-9" />
              </div>
              <div className="flex items-center gap-3">
                <NotificationInbox variant="partner" />
                <div className="hidden flex-col items-end leading-tight md:flex">
                  <p className="text-sm font-medium">{currentUser?.name || "Partner User"}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email || "Chưa có email"}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                  {userInitial}
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                  Trang chủ
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto px-4 py-6">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

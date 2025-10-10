import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  DollarSign,
  Settings,
  BarChart3,
  Menu,
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

// DỰ ĐOÁN: Bạn sẽ có một UserContext cho Partner User.
// Đảm bảo đường dẫn import này chính xác hoặc thay thế bằng context của bạn.
import { useUser } from "@/context/UserContext"; 

const menuItems = [
  { title: "Tổng quan", url: "/partner", icon: LayoutDashboard, exact: true },
  { title: "Hoạt động của tôi", url: "/partner/activities", icon: MapPin },
  { title: "Đơn đặt", url: "/partner/bookings", icon: Calendar },
  { title: "Doanh thu", url: "/partner/revenue", icon: DollarSign },
  { title: "Thống kê", url: "/partner/analytics", icon: BarChart3 },
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
              <span className="text-lg font-bold text-white">TC</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 leading-tight">
                TripCurate
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
        {!collapsed && "© 2025 TripCurate"}
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
    "/partner/revenue": { title: "Doanh thu", desc: "Thống kê thu nhập và thanh toán" },
    "/partner/analytics": { title: "Thống kê", desc: "Phân tích hiệu suất hoạt động" },
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
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 px-6">
            
            <div className="flex items-center gap-4">
              <SidebarTrigger /> 
              
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h1>
                <p className="text-xs text-muted-foreground">{currentPage.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium">
                    {/* Hiển thị tên người dùng từ currentUser */}
                    {currentUser?.name || "Partner User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {/* Hiển thị email người dùng từ currentUser */}
                    {currentUser?.email || "Chưa có email"}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                  {/* Hiển thị chữ cái đầu tiên của tên người dùng */}
                  {userInitial}
                </div>
              </div>

              <Button size="sm" onClick={() => navigate("/")}>
                Xem trang chủ
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
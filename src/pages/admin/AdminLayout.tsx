import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Layers, Gift, BarChart3, Settings, Shield, Search, MapPin } from "lucide-react";
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
import { useUser } from "@/context/UserContext"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationInbox from "@/components/notifications/NotificationInbox";

// --- AdminSidebar Component ---

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Người dùng", url: "/admin/users", icon: Users },
  { title: "Đối tác", url: "/admin/partners", icon: Briefcase },
  { title: "Tour đối tác", url: "/admin/tours", icon: MapPin },
  { title: "Danh mục", url: "/admin/categories", icon: Layers },
  { title: "Khuyến mãi", url: "/admin/promotions", icon: Gift },
  { title: "Báo cáo", url: "/admin/reports", icon: BarChart3 },
  { title: "Cài đặt hệ thống", url: "/admin/settings", icon: Settings },
  { title: "Quản trị viên", url: "/admin/admins", icon: Shield },
];

function AdminSidebar() {
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
      {/* ⬅️ LOGO VIETTRAVEL TRONG SIDEBAR HEADER */}
      {/* Đã loại bỏ border-b (viền dưới) để liền mạch với header chính, nhưng giữ height */}
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
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        ) : (
          /* Đã loại bỏ logo "TC" khi collapsed, chỉ để trống */
          <div className="h-9 w-9 mx-auto" /> 
        )}
      </SidebarHeader>

      {/* Menu (Giữ nguyên) */}
      <SidebarContent className="py-4">
        {/* ... (Menu items giữ nguyên) ... */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 px-4 uppercase tracking-wide">
              Quản lý
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

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400">
        {!collapsed && "© 2025 VietTravel"}
      </div>
    </Sidebar>
  );
}

// --- AdminLayout Component (Giữ nguyên vị trí các phần tử) ---

export default function AdminLayout() {
  const { currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitles: Record<string, { title: string; desc: string }> = {
    "/admin": { title: "Dashboard", desc: "Thống kê tổng quan hoạt động hệ thống" },
    "/admin/users": { title: "Quản lý người dùng", desc: "Theo dõi và điều chỉnh tài khoản khách hàng" },
    "/admin/partners": { title: "Quản lý đối tác", desc: "Duyệt và theo dõi hoạt động của đối tác" },
    "/admin/tours": { title: "Tour đối tác", desc: "Phê duyệt và quản lý tour do đối tác đăng tải" },
    "/admin/categories": { title: "Danh mục nội dung", desc: "Điểm đến, chủ đề và thẻ tag hệ thống" },
    "/admin/promotions": { title: "Khuyến mãi", desc: "Quản lý mã giảm giá và ưu đãi" },
    "/admin/reports": { title: "Báo cáo", desc: "Phân tích dữ liệu và hiệu suất kinh doanh" },
    "/admin/settings": { title: "Cài đặt hệ thống", desc: "Thiết lập vận hành và bảo mật" },
    "/admin/admins": { title: "Quản trị viên", desc: "Quản lý đội ngũ admin nội bộ" },
  };

  const currentPage =
    Object.entries(pageTitles).find(([path]) => {
      const exactMatch = location.pathname === path;
      const nestedMatch = location.pathname.startsWith(`${path}/`);
      return exactMatch || nestedMatch;
    })?.[1] ??
    {
      title: "Trang quản trị",
      desc: "Hệ thống quản lý VietTravel",
    };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header chính */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/95 px-4 pr-6 backdrop-blur supports-[backdrop-filter]:bg-white/75">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-lg font-semibold text-foreground">{currentPage.title}</h1>
                <p className="text-xs text-muted-foreground">{currentPage.desc}</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="relative hidden md:block w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm trong bảng điều khiển..."
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <NotificationInbox variant="admin" />
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <p className="text-sm font-medium">{currentUser?.name || "Người dùng"}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.email || "Chưa có email"}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                  Trang chủ
                </Button>
              </div>
            </div>
          </header>

          {/* Nội dung chính */}
          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

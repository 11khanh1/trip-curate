import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Tag,
  FileText,
  Settings,
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
import { useUser } from "@/context/UserContext"; 
import { Button } from "@/components/ui/button";

// --- AdminSidebar Component ---

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Hoạt động", url: "/admin/activities", icon: MapPin },
  { title: "Đơn đặt", url: "/admin/bookings", icon: Calendar },
  { title: "Khách hàng", url: "/admin/customers", icon: Users },
  { title: "Khuyến mãi", url: "/admin/promotions", icon: Tag },
  { title: "Địa điểm", url: "/admin/locations", icon: FileText },
  { title: "Cài đặt", url: "/admin/settings", icon: Settings },
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
    "/admin": { title: "Tổng quan", desc: "Xem tổng quan hoạt động hệ thống" },
    "/admin/activities": { title: "Hoạt động", desc: "Quản lý hoạt động du lịch" },
    "/admin/bookings": { title: "Đơn đặt", desc: "Danh sách đơn đặt tour" },
    "/admin/customers": { title: "Khách hàng", desc: "Thông tin khách hàng" },
    "/admin/promotions": { title: "Khuyến mãi", desc: "Chiến dịch giảm giá, khuyến mãi" },
    "/admin/locations": { title: "Địa điểm", desc: "Quản lý danh sách địa điểm du lịch" },
    "/admin/settings": { title: "Cài đặt", desc: "Cấu hình hệ thống" },
    "/admin/partner": { title: "Quản lý Tour - Đối tác", desc: "Quản lý danh sách tour của bạn" },
  };

  const currentPage =
    pageTitles[location.pathname] || {
      title: "Trang quản trị",
      desc: "Hệ thống quản lý VietTravel",
    };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header chính */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 px-6">
            
            {/* 🔹 Bên trái: Trigger + Tiêu đề trang */}
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              
              {/* Tiêu đề trang (Sát nút toggle) */}
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h1>
                <p className="text-xs text-muted-foreground">{currentPage.desc}</p>
              </div>
            </div>

            {/* Bên phải: Thông tin user + nút (Giữ nguyên) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium">
                    {currentUser?.name || "Người dùng"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.email || "Chưa có email"}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                  {currentUser?.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : "A"}
                </div>
              </div>

              <Button size="sm" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
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
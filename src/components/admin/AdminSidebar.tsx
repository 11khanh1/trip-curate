import { NavLink, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Hoạt động", url: "/admin/activities", icon: MapPin },
  { title: "Đơn đặt", url: "/admin/bookings", icon: Calendar },
  { title: "Khách hàng", url: "/admin/customers", icon: Users },
  { title: "Khuyến mãi", url: "/admin/promotions", icon: Tag },
  { title: "Địa điểm", url: "/admin/locations", icon: FileText },
  { title: "Cài đặt", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
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
      className="border-r border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm"
    >
      {/* Header Logo */}
      <SidebarHeader className="border-b border-gray-200 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 shadow-sm">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 shadow-sm mx-auto">
            <span className="text-lg font-bold text-white">TC</span>
          </div>
        )}
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="py-4">
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

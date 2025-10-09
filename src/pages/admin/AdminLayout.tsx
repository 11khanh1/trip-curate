import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const { currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Tiêu đề trang theo route
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
          {/* 🔹 Header chính */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 backdrop-blur px-6">
            {/* Bên trái: Trigger + Tiêu đề */}
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h1>
                <p className="text-xs text-muted-foreground">{currentPage.desc}</p>
              </div>
            </div>

            {/* Bên phải: Thông tin user + nút */}
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

              {/* 👉 Nút Về trang chủ — chuyển ra sau cùng, màu mặc định */}
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

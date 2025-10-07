import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  Shield,
  Settings,
} from "lucide-react";

const Admin = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin (TEMPORARY: For production, use proper backend auth)
    if (!currentUser) {
      navigate("/");
      return;
    }
    
    if (currentUser.role !== "admin") {
      alert("Bạn không có quyền truy cập trang này");
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Mock data for demo
  const stats = [
    { title: "Tổng người dùng", value: "12,543", icon: Users, trend: "+12.5%" },
    { title: "Tour đã đặt", value: "3,847", icon: Ticket, trend: "+8.2%" },
    { title: "Doanh thu", value: "₫2.4M", icon: DollarSign, trend: "+15.3%" },
    { title: "Tăng trưởng", value: "23.5%", icon: TrendingUp, trend: "+3.1%" },
  ];

  const recentBookings = [
    { id: "1", user: "Nguyễn Văn A", tour: "Tour Hạ Long 3N2Đ", date: "2025-10-15", amount: "₫5,500,000", status: "confirmed" },
    { id: "2", user: "Trần Thị B", tour: "Du lịch Đà Nẵng", date: "2025-10-18", amount: "₫3,200,000", status: "pending" },
    { id: "3", user: "Lê Văn C", tour: "Phú Quốc Resort", date: "2025-10-20", amount: "₫7,800,000", status: "confirmed" },
    { id: "4", user: "Phạm Thị D", tour: "Sapa Trekking", date: "2025-10-22", amount: "₫4,100,000", status: "confirmed" },
    { id: "5", user: "Hoàng Văn E", tour: "Nha Trang Beach", date: "2025-10-25", amount: "₫6,300,000", status: "cancelled" },
  ];

  const popularDestinations = [
    { name: "Hạ Long", bookings: 456, revenue: "₫1.2M" },
    { name: "Đà Nẵng", bookings: 389, revenue: "₫980K" },
    { name: "Phú Quốc", bookings: 312, revenue: "₫850K" },
    { name: "Sapa", bookings: 278, revenue: "₫720K" },
    { name: "Nha Trang", bookings: 245, revenue: "₫650K" },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
    };
    return variants[status] || "default";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      confirmed: "Đã xác nhận",
      pending: "Chờ xử lý",
      cancelled: "Đã hủy",
    };
    return texts[status] || status;
  };

  // Show loading or null while checking auth
  if (!currentUser) {
    return null;
  }

  if (currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quản lý hệ thống</h1>
              <p className="text-muted-foreground mt-1">
                Chào mừng, {currentUser.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Cài đặt
              </Button>
              <Button size="sm" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend} so với tháng trước
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">
              <Ticket className="h-4 w-4 mr-2" />
              Đặt chỗ
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Người dùng
            </TabsTrigger>
            <TabsTrigger value="destinations">
              <MapPin className="h-4 w-4 mr-2" />
              Điểm đến
            </TabsTrigger>
            <TabsTrigger value="reports">
              <TrendingUp className="h-4 w-4 mr-2" />
              Báo cáo
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Đặt chỗ gần đây</CardTitle>
                <CardDescription>
                  Danh sách các đơn đặt tour mới nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Tour</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.user}</TableCell>
                        <TableCell>{booking.tour}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {booking.date}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{booking.amount}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
                <CardDescription>
                  Danh sách người dùng và quyền hạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chức năng quản lý người dùng</p>
                  <p className="text-sm mt-2">Sẽ được phát triển trong phiên bản tiếp theo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Destinations Tab */}
          <TabsContent value="destinations">
            <Card>
              <CardHeader>
                <CardTitle>Điểm đến phổ biến</CardTitle>
                <CardDescription>
                  Thống kê theo địa điểm du lịch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Điểm đến</TableHead>
                      <TableHead>Số lượng đặt</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularDestinations.map((dest, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {dest.name}
                          </div>
                        </TableCell>
                        <TableCell>{dest.bookings} đơn</TableCell>
                        <TableCell className="text-right font-semibold">
                          {dest.revenue}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Báo cáo & Phân tích</CardTitle>
                <CardDescription>
                  Dữ liệu và thống kê chi tiết
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chức năng báo cáo chi tiết</p>
                  <p className="text-sm mt-2">Sẽ được phát triển trong phiên bản tiếp theo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

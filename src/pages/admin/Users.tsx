import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Users, UserPlus, ShieldOff, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminUsers, patchAdminUserStatus, type AdminUser } from "@/services/adminApi";

const normalizeUser = (user: AdminUser) => ({
  id: user.id,
  name: user.name ?? (user as any)?.full_name ?? "Không rõ tên",
  email: user.email ?? (user as any)?.mail ?? "Không rõ email",
  phone: user.phone ?? (user as any)?.phone_number ?? "",
  createdAt: user.created_at ?? (user as any)?.createdAt ?? (user as any)?.created_at ?? "",
  totalBookings: user.total_bookings ?? (user as any)?.orders_count ?? 0,
  status: (user.status as "active" | "locked" | string) ?? "active",
});

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "locked" | "all">("active");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", statusFilter, searchTerm],
    queryFn: () =>
      fetchAdminUsers({
        role: "customer",
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
      }),
  });

  const users = useMemo(() => {
    if (!data) return [];
    const list = Array.isArray(data) ? data : (data as any)?.data || [];
    return (list as AdminUser[]).map(normalizeUser);
  }, [data]);

  const activeUsers = users.filter((user) => user.status === "active").length;
  const lockedUsers = users.filter((user) => user.status && user.status !== "active").length;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) => patchAdminUserStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái người dùng đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      console.error("Update user status failed:", err);
      toast({
        title: "Không thể cập nhật trạng thái",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleToggleStatus = (user: ReturnType<typeof normalizeUser>) => {
    const nextStatus = user.status === "active" ? "locked" : "active";
    statusMutation.mutate({ id: user.id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tổng người dùng"
          value={users.length}
          icon={Users}
          gradient
          trend={
            data && (data as any)?.total_new
              ? { value: `+${(data as any).total_new} so với tháng trước`, isPositive: true }
              : undefined
          }
        />
        <StatCard
          title="Đăng ký mới (7 ngày)"
          value={(data as any)?.registrations_week ?? "N/A"}
          icon={UserPlus}
          trend={
            (data as any)?.registrations_change
              ? {
                  value: String((data as any).registrations_change),
                  isPositive: String((data as any).registrations_change).includes("+"),
                }
              : undefined
          }
        />
        <StatCard
          title="Tài khoản bị khóa"
          value={lockedUsers}
          icon={ShieldOff}
          trend={lockedUsers ? { value: `${lockedUsers} cần rà soát`, isPositive: false } : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>Xem thông tin cơ bản và trạng thái tài khoản</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Bộ lọc trạng thái</label>
                <Select value={statusFilter} onValueChange={(value: "active" | "locked" | "all") => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="locked">Đã khóa</SelectItem>
                    <SelectItem value="all">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ khóa</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit();
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleSearchSubmit}>
                    Tìm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[2fr,2fr,1.5fr,1fr,1fr] bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Người dùng</span>
              <span>Email</span>
              <span>Số điện thoại</span>
              <span>Đăng ký</span>
              <span>Trạng thái</span>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải dữ liệu người dùng...
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Không có người dùng phù hợp.</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-4 px-4 py-4 md:grid-cols-[2fr,2fr,1.5fr,1fr,1fr] md:items-center"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        Đăng ký: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        Lượt đặt: {user.totalBookings} tour
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.phone || "—"}</p>
                    <div className="hidden text-sm text-muted-foreground md:block">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </div>
                    <div className="flex items-center justify-between md:block">
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>
                        {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 md:mt-0"
                        onClick={() => handleToggleStatus(user)}
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : user.status === "active" ? (
                          "Khóa tài khoản"
                        ) : (
                          "Mở khóa"
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

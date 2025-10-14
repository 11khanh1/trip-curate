import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Users, UserPlus, ShieldOff, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminUsers,
  patchAdminUserStatus,
  type AdminUser,
  type PaginatedResponse,
} from "@/services/adminApi";

const KNOWN_USER_STATUSES = ["active", "inactive"] as const;
type UserStatus = (typeof KNOWN_USER_STATUSES)[number];

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngưng",
};

const TOGGLE_ACTION_LABELS: Record<UserStatus, string> = {
  active: "Tạm ngưng tài khoản",
  inactive: "Kích hoạt lại",
};

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

// ✨ TỐI ƯU 1: Xử lý status mặc định an toàn hơn
const normalizeUser = (user: AdminUser) => {
  const rawStatus = (user.status as string | undefined) ?? (user as any)?.status;
  // Chỉ khi status là "active" mới coi là active, còn lại (null, undefined, "inactive",...) đều là inactive.
  const normalizedStatus: UserStatus = rawStatus === "active" ? "active" : "inactive";

  return {
    id: user.id,
    name: user.name ?? (user as any)?.full_name ?? "Không rõ tên",
    email: user.email ?? (user as any)?.mail ?? "Không rõ email",
    phone: user.phone ?? (user as any)?.phone_number ?? "",
    createdAt: user.created_at ?? (user as any)?.createdAt ?? (user as any)?.created_at ?? "",
    totalBookings: user.total_bookings ?? (user as any)?.orders_count ?? 0,
    status: normalizedStatus,
  };
};

type NormalizedUser = ReturnType<typeof normalizeUser>;

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PER_PAGE_OPTIONS[1]);

  const queryKey = ["admin-users", statusFilter, searchTerm, page, perPage];
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const usersQuery = useQuery<
    PaginatedResponse<AdminUser>,
    Error,
    { list: NormalizedUser[]; meta: Record<string, unknown> }
  >({
    queryKey,
    queryFn: () =>
      fetchAdminUsers({
        role: "customer",
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
        page,
        per_page: perPage,
      }),
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
    select: (response: PaginatedResponse<AdminUser>) => ({
      list: (response?.data ?? []).map(normalizeUser),
      meta: response?.meta ?? {},
    }),
  });

  const users = usersQuery.data?.list ?? [];
  const userStatsMeta = (usersQuery.data?.meta ?? {}) as {
    total_new?: number | string;
    registrations_week?: number | string;
    registrations_change?: number | string;
    current_page?: number | string;
    per_page?: number | string;
    last_page?: number | string;
    total?: number | string;
    from?: number | string;
    to?: number | string;
  };

  const currentPage = Number(userStatsMeta.current_page ?? page) || 1;
  const serverPerPage = Number(userStatsMeta.per_page ?? perPage) || perPage;
  const totalUsers = Number(userStatsMeta.total ?? users.length) || users.length;
  const lastPage = Number(userStatsMeta.last_page ?? Math.max(1, Math.ceil(totalUsers / serverPerPage))) || 1;
  const rangeStart = Number(userStatsMeta.from ?? (currentPage - 1) * serverPerPage + 1) || 0;
  const rangeEnd = Number(userStatsMeta.to ?? Math.min(totalUsers, currentPage * serverPerPage)) || 0;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;
  const displayStart = totalUsers === 0 ? 0 : Math.max(1, Math.min(rangeStart || 1, totalUsers));
  const displayEnd = totalUsers === 0 ? 0 : Math.min(rangeEnd || displayStart, totalUsers);

  const paginationRange = useMemo<(number | "ellipsis")[]>(() => {
    const totalPages = lastPage;
    const current = Math.min(Math.max(1, currentPage), totalPages);
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const range: (number | "ellipsis")[] = [1];
    const siblings = 1;
    const start = Math.max(2, current - siblings);
    const end = Math.min(totalPages - 1, current + siblings);

    if (start > 2) {
      range.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages - 1) {
      range.push("ellipsis");
    }

    range.push(totalPages);
    return range;
  }, [currentPage, lastPage]);

  const inactiveUsers = users.filter((user) => user.status !== "active").length;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: UserStatus }) =>
      patchAdminUserStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái người dùng đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"], exact: false });
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

  const handleStatusFilterChange = (value: UserStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePerPageChange = (value: string) => {
    const parsed = Number(value);
    setPerPage((prev) => (Number.isFinite(parsed) && parsed > 0 ? parsed : prev));
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(nextPage)), lastPage || 1);
    if (clamped === page) return;
    setPage(clamped);
  };

  const handleToggleStatus = (user: NormalizedUser) => {
    const nextStatus: UserStatus = user.status === "active" ? "inactive" : "active";
    if (statusFilter !== "all" && nextStatus !== statusFilter) {
      setStatusFilter("all");
      setPage(1);
    }

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
            userStatsMeta.total_new !== undefined
              ? { value: `+${userStatsMeta.total_new} so với tháng trước`, isPositive: true }
              : undefined
          }
        />
        <StatCard
          title="Đăng ký mới (7 ngày)"
          value={userStatsMeta.registrations_week ?? "N/A"}
          icon={UserPlus}
          trend={
            userStatsMeta.registrations_change
              ? {
                  value: String(userStatsMeta.registrations_change),
                  isPositive: String(userStatsMeta.registrations_change).includes("+"),
                }
              : undefined
          }
        />
        <StatCard
          title="Tài khoản tạm ngưng"
          value={inactiveUsers}
          icon={ShieldOff}
          trend={inactiveUsers ? { value: `${inactiveUsers} cần rà soát`, isPositive: false } : undefined}
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
               <div className="w-full sm:w-40">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Số dòng / trang</label>
                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số dòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Bộ lọc trạng thái</label>
                <Select value={statusFilter} onValueChange={(value) => handleStatusFilterChange(value as UserStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                    <SelectItem value="inactive">{STATUS_LABELS.inactive}</SelectItem>
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
              {usersQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải dữ liệu người dùng...
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Không có người dùng phù hợp.</div>
              ) : (
                users.map((user) => {
                  const badgeVariant = user.status === "active" ? "default" : "destructive";
                  const badgeLabel = STATUS_LABELS[user.status];
                  const buttonLabel = TOGGLE_ACTION_LABELS[user.status];


                  const isUpdatingThisUser = 
                    statusMutation.isPending && statusMutation.variables?.id === user.id;

                  return (
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
                      <div className="flex items-center justify-between gap-2 md:block">
                        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 md:mt-0"
                          onClick={() => handleToggleStatus(user)}
                          // Vẫn disable tất cả các nút khi một mutation đang chạy
                          disabled={statusMutation.isPending}
                        >
                          {isUpdatingThisUser ? ( // ✨ CHỈ HIỂN THỊ LOADER CHO ĐÚNG NÚT NÀY
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            buttonLabel
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {totalUsers > 0 ? (
            <div className="flex flex-col gap-4 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                Hiển thị {displayStart}-{displayEnd} trên tổng {totalUsers} người dùng
              </span>
              <Pagination className="w-auto gap-2 md:mx-0 md:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (isFirstPage) return;
                        handlePageChange(currentPage - 1);
                      }}
                      className={isFirstPage ? "pointer-events-none opacity-50" : undefined}
                      aria-disabled={isFirstPage}
                      tabIndex={isFirstPage ? -1 : undefined}
                    />
                  </PaginationItem>
                  {paginationRange.map((item, index) => (
                    <PaginationItem key={`${item}-${index}`}>
                      {item === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={(event) => {
                            event.preventDefault();
                            handlePageChange(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (isLastPage) return;
                        handlePageChange(currentPage + 1);
                      }}
                      className={isLastPage ? "pointer-events-none opacity-50" : undefined}
                      aria-disabled={isLastPage}
                      tabIndex={isLastPage ? -1 : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

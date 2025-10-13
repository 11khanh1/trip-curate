import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { Loader2, MapPin, CheckCircle2, Clock, XCircle, Search, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminTours,
  updateAdminTourStatus,
  type AdminTour,
  type AdminTourStatus,
  type AdminTourParams,
  type PaginatedResponse,
} from "@/services/adminApi";

type NormalizedTour = {
  id: string;
  name: string;
  status: AdminTourStatus;
  partner: string;
  price: string;
  location: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
};

const STATUS_LABELS: Record<AdminTourStatus, { label: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ duyệt", badge: "secondary" },
  approved: { label: "Đã duyệt", badge: "default" },
  rejected: { label: "Từ chối", badge: "destructive" },

};

const STATUS_OPTIONS: { value: AdminTourStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: STATUS_LABELS.pending.label },
  { value: "approved", label: STATUS_LABELS.approved.label },
  { value: "rejected", label: STATUS_LABELS.rejected.label },

];

const UPDATABLE_STATUSES: AdminTourStatus[] = ["pending", "approved", "rejected"];

const normalizeTour = (tour: AdminTour): NormalizedTour => {
  const rawStatus = typeof tour.status === "string" ? tour.status.toLowerCase() : undefined;
  const status: AdminTourStatus =
    rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";

  const idCandidate =
    typeof tour.id === "string"
      ? tour.id
      : typeof tour.id === "number"
        ? String(tour.id)
        : typeof (tour as any)?.uuid === "string"
          ? ((tour as any)?.uuid as string)
          : undefined;

  const priceValue = typeof tour.price === "number" ? tour.price : Number(tour.price ?? 0);
  const currency = tour.currency ?? "VND";
  return {
    id: String(idCandidate ?? tour.id ?? ""),
    name: tour.name ?? (tour as any)?.title ?? "Chưa đặt tên",
    status,
    partner: tour.partner?.company_name ?? tour.partner?.user?.name ?? "Đối tác",
    price:
      priceValue > 0
        ? new Intl.NumberFormat("vi-VN", {
            style: currency.toUpperCase() === "USD" ? "currency" : "decimal",
            currency: currency.toUpperCase() === "USD" ? "USD" : undefined,
            maximumFractionDigits: 0,
          }).format(priceValue)
        : "Liên hệ",
    location: tour.location ?? (tour as any)?.destination ?? "—",
    createdAt: tour.created_at,
    startDate: tour.start_date,
    endDate: tour.end_date,
  };
};

export default function AdminTours() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<AdminTourStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const queryKey = ["admin-tours", statusFilter, search];

  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const toursQuery = useQuery<
    PaginatedResponse<AdminTour>,
    Error,
    { list: NormalizedTour[]; meta: Record<string, unknown> }
  >({
    queryKey,
    queryFn: () => {
      const params: AdminTourParams = {
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        per_page: 20,
      };
      return fetchAdminTours(params);
    },
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
    select: (response) => ({
      list: (response?.data ?? []).map(normalizeTour),
      meta: response?.meta ?? {},
    }),
  });

  const tours = toursQuery.data?.list ?? [];
  const meta = toursQuery.data?.meta ?? {};

  const normalizeCount = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const totalTours = useMemo(() => normalizeCount(meta?.total, tours.length), [meta, tours]);
  const pendingCount = normalizeCount(
    meta?.pending_count,
    tours.filter((tour) => tour.status === "pending").length,
  );
  const approvedCount = normalizeCount(
    meta?.approved_count,
    tours.filter((tour) => tour.status === "approved").length,
  );
  const rejectedCount = normalizeCount(
    meta?.rejected_count,
    tours.filter((tour) => tour.status === "rejected").length,
  );
  const newTourCount = normalizeCount(meta?.new_count, 0);

  const mutation = useMutation<unknown, Error, { id: string; status: AdminTourStatus }>({
    mutationFn: ({ id, status }) => updateAdminTourStatus(id, status),
    onSuccess: () => {
      toast({ title: "Đã cập nhật", description: "Trạng thái tour đã được cập nhật." });
      queryClient.invalidateQueries({ queryKey: ["admin-tours"], exact: false });
    },
    onError: (err: any) => {
      console.error("Update tour status failed:", err);
      toast({
        title: "Không thể cập nhật",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (tour: NormalizedTour, nextStatus: AdminTourStatus) => {
    if (!UPDATABLE_STATUSES.includes(nextStatus)) return;
    if (tour.status === nextStatus) return;
    if (!tour.id || tour.id.trim().length === 0) {
      toast({
        title: "Không thể cập nhật",
        description: "Tour không có mã định danh hợp lệ.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ id: tour.id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng số tour"
          value={totalTours}
          icon={MapPin}
          gradient
          trend={newTourCount > 0 ? { value: `+${newTourCount} tour mới`, isPositive: true } : undefined}
        />
        <StatCard
          title="Chờ duyệt"
          value={pendingCount}
          icon={Clock}
          trend={
            pendingCount > 0 ? { value: `${pendingCount} tour cần xử lý`, isPositive: false } : undefined
          }
        />
        <StatCard title="Đã duyệt" value={approvedCount} icon={CheckCircle2} />
        <StatCard title="Từ chối" value={rejectedCount} icon={XCircle} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <CardTitle>Quản lý tour đối tác</CardTitle>
              <CardDescription>Duyệt nội dung tour do đối tác đăng tải</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-56">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: AdminTourStatus | "all") => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-72">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tìm kiếm</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Tên tour, đối tác..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Lọc
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[1.6fr,1.2fr,1fr,1fr,1fr] bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Tour</span>
              <span>Đối tác</span>
              <span>Giá</span>
              <span>Lịch trình</span>
              <span className="text-right">Trạng thái</span>
            </div>
            <div className="divide-y">
              {toursQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách tour...
                </div>
              ) : tours.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có tour nào phù hợp với bộ lọc.
                </div>
              ) : (
                tours.map((tour, index) => {
                  const statusMeta = STATUS_LABELS[tour.status] ?? STATUS_LABELS.pending;
                  const isUpdating =
                    mutation.isPending && mutation.variables?.id === tour.id;
                  const canUpdate = Boolean(tour.id);
                  const rowKey = `${tour.id}-${index}`;
                  return (
                    <div
                      key={rowKey}
                      className="grid gap-4 px-4 py-4 text-sm md:grid-cols-[1.6fr,1.2fr,1fr,1fr,1fr] md:items-center"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{tour.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{tour.partner}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          Giá: {tour.price} • {tour.location}
                        </p>
                      </div>
                      <p className="hidden text-muted-foreground md:block">{tour.partner}</p>
                      <p className="hidden text-muted-foreground md:block">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-primary" />
                          {tour.price}
                        </span>
                      </p>
                      <div className="hidden flex-col gap-1 text-xs text-muted-foreground md:flex">
                        <span>
                          Từ:{" "}
                          <span className="font-medium">
                            {tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "—"}
                          </span>
                        </span>
                        <span>
                          Đến:{" "}
                          <span className="font-medium">
                            {tour.endDate ? new Date(tour.endDate).toLocaleDateString("vi-VN") : "—"}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
                        <div className="flex flex-wrap items-center gap-3">
                          <Select
                            value={tour.status}
                            onValueChange={(value: AdminTourStatus) =>
                              handleStatusChange(tour, value)
                            }
                            disabled={mutation.isPending || !canUpdate}
                          >
                            <SelectTrigger className="h-9 w-[180px] justify-between">
                              <SelectValue placeholder="Cập nhật trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              {UPDATABLE_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {STATUS_LABELS[status].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isUpdating && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Đang cập nhật...
                            </div>
                          )}
                          {!canUpdate && (
                            <p className="text-xs text-amber-600">
                              Thiếu UUID hợp lệ, không thể đổi trạng thái.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

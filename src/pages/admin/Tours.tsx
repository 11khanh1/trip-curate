import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { StatCard } from "@/components/admin/StatCard";
import { Loader2, MapPin, CheckCircle2, Clock, XCircle, Search, DollarSign, CalendarDays, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchAdminTours,
  fetchAdminTour,
  updateAdminTourStatus,
  type AdminTour,
  type AdminTourStatus,
  type AdminTourParams,
  type AdminTourDetail,
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

const PER_PAGE_OPTIONS = [5, 10, 20] as const;

const UPDATABLE_STATUSES: AdminTourStatus[] = ["pending", "approved", "rejected"];

const parseMetaNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (error instanceof Error && error.message?.trim()) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeResponse = (error as { response?: unknown }).response;
    if (typeof maybeResponse === "object" && maybeResponse !== null) {
      const maybeData = (maybeResponse as { data?: unknown }).data;
      if (typeof maybeData === "object" && maybeData !== null) {
        const maybeMessage = (maybeData as { message?: unknown }).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
          return maybeMessage;
        }
      }
    }
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
};

const formatDateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
};

const formatCurrency = (amount?: number | string, currency?: string) => {
  if (amount === undefined || amount === null) return "—";
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric)) return "—";
  const upperCurrency = currency?.toUpperCase();
  const isUsd = upperCurrency === "USD";
  return new Intl.NumberFormat("vi-VN", {
    style: isUsd ? "currency" : "decimal",
    currency: isUsd ? "USD" : undefined,
    maximumFractionDigits: isUsd ? 2 : 0,
  }).format(numeric);
};

const normalizeTour = (tour: AdminTour): NormalizedTour => {
  const rawStatus = typeof tour.status === "string" ? tour.status.toLowerCase() : undefined;
  const status: AdminTourStatus =
    rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";

  const fallbackUuid = tour["uuid"];
  const idCandidate =
    typeof tour.id === "string"
      ? tour.id
      : typeof tour.id === "number"
        ? String(tour.id)
        : typeof fallbackUuid === "string"
          ? fallbackUuid
          : undefined;

  const rawTitle = tour["title"];
  const rawDestination = tour["destination"];
  const priceValue =
    typeof tour.price === "number"
      ? tour.price
      : typeof tour.price === "string"
        ? Number(tour.price)
        : undefined;
  const currency = typeof tour.currency === "string" ? tour.currency : "VND";
  const formattedPrice =
    typeof priceValue === "number" && Number.isFinite(priceValue) && priceValue > 0
      ? new Intl.NumberFormat("vi-VN", {
          style: currency.toUpperCase() === "USD" ? "currency" : "decimal",
          currency: currency.toUpperCase() === "USD" ? "USD" : undefined,
          maximumFractionDigits: 0,
        }).format(priceValue)
      : "Liên hệ";

  return {
    id: String(idCandidate ?? tour.id ?? ""),
    name: typeof tour.name === "string" && tour.name.trim() ? tour.name : (typeof rawTitle === "string" ? rawTitle : "Chưa đặt tên"),
    status,
    partner: tour.partner?.company_name ?? tour.partner?.user?.name ?? "Đối tác",
    price: formattedPrice,
    location: typeof tour.location === "string" && tour.location.trim()
      ? tour.location
      : typeof rawDestination === "string"
        ? rawDestination
        : "—",
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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PER_PAGE_OPTIONS[1]);
  const [detailTourId, setDetailTourId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const queryKey = ["admin-tours", statusFilter, search, page, perPage] as const;

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
        page,
        per_page: perPage,
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

  const totalTours = parseMetaNumber(meta?.total) ?? tours.length;

  const pendingCount =
    parseMetaNumber(meta?.pending_count) ?? tours.filter((tour) => tour.status === "pending").length;
  const approvedCount =
    parseMetaNumber(meta?.approved_count) ?? tours.filter((tour) => tour.status === "approved").length;
  const rejectedCount =
    parseMetaNumber(meta?.rejected_count) ?? tours.filter((tour) => tour.status === "rejected").length;
  const newTourCount = parseMetaNumber(meta?.new_count) ?? 0;

  const currentPage = parseMetaNumber(meta?.current_page) ?? page;
  const serverPerPage = parseMetaNumber(meta?.per_page) ?? perPage;
  const effectivePerPage = serverPerPage && serverPerPage > 0 ? serverPerPage : perPage;
  const lastPage =
    parseMetaNumber(meta?.last_page) ??
    Math.max(1, effectivePerPage > 0 ? Math.ceil((totalTours || 0) / effectivePerPage) : 1);
  const rangeStart =
    parseMetaNumber(meta?.from) ?? (totalTours > 0 ? (currentPage - 1) * effectivePerPage + 1 : 0);
  const rangeEnd =
    parseMetaNumber(meta?.to) ?? (totalTours > 0 ? Math.min(totalTours, currentPage * effectivePerPage) : 0);
  const displayStart = totalTours === 0 ? 0 : Math.max(1, Math.min(rangeStart || 1, totalTours));
  const displayEnd = totalTours === 0 ? 0 : Math.min(rangeEnd || displayStart, totalTours);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  const paginationRange = useMemo<(number | "ellipsis")[]>(() => {
    const totalPages = Math.max(1, lastPage);
    const current = Math.min(Math.max(1, currentPage), totalPages);
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const range: (number | "ellipsis")[] = [1];
    const siblings = 1;
    const startPage = Math.max(2, current - siblings);
    const endPage = Math.min(totalPages - 1, current + siblings);

    if (startPage > 2) {
      range.push("ellipsis");
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    if (endPage < totalPages - 1) {
      range.push("ellipsis");
    }

    range.push(totalPages);
    return range;
  }, [currentPage, lastPage]);

  const mutation = useMutation<unknown, Error, { id: string; status: AdminTourStatus }>({
    mutationFn: ({ id, status }) => updateAdminTourStatus(id, status),
    onSuccess: (_, variables) => {
      toast({ title: "Đã cập nhật", description: "Trạng thái tour đã được cập nhật." });
      queryClient.invalidateQueries({ queryKey: ["admin-tours"], exact: false });
      if (detailTourId && variables?.id === detailTourId) {
        queryClient.invalidateQueries({ queryKey: ["admin-tour", detailTourId] });
      }
    },
    onError: (error) => {
      console.error("Update tour status failed:", error);
      toast({
        title: "Không thể cập nhật",
        description: extractErrorMessage(error, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
    },
  });

  const applyFilters = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusFilterChange = (value: AdminTourStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePerPageChange = (value: string) => {
    const parsed = Number(value);
    setPerPage((prev) => (Number.isFinite(parsed) && parsed > 0 ? parsed : prev));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) return;
    const clamped = Math.min(Math.max(1, Math.trunc(nextPage)), lastPage || 1);
    if (clamped === page) return;
    setPage(clamped);
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

  const handleViewDetail = (tour: NormalizedTour) => {
    if (!tour.id) {
      toast({
        title: "Không thể mở chi tiết",
        description: "Tour không có mã định danh hợp lệ.",
        variant: "destructive",
      });
      return;
    }
    setDetailTourId(tour.id);
    setIsDetailOpen(true);
  };

  const tourDetailQuery = useQuery<AdminTourDetail, Error>({
    queryKey: ["admin-tour", detailTourId],
    queryFn: () => fetchAdminTour(detailTourId as string),
    enabled: detailTourId !== null && isDetailOpen,
    staleTime: 30_000,
  });

  const detailTour = tourDetailQuery.data;
  const detailSchedules = detailTour?.schedules ?? [];
  const fallbackTour = detailTourId ? tours.find((item) => item.id === detailTourId) : undefined;
  const detailNormalized = detailTour ? normalizeTour(detailTour) : fallbackTour;
  const detailStatusMeta = detailNormalized ? STATUS_LABELS[detailNormalized.status] ?? STATUS_LABELS.pending : undefined;
  const detailPartner = detailTour?.partner;
  const detailContact = detailPartner?.user;
  const detailContactName =
    detailContact?.name ?? (detailContact as { full_name?: string } | undefined)?.full_name ?? detailNormalized?.partner ?? "—";
  const detailContactEmail =
    detailContact?.email ?? (detailContact as { mail?: string } | undefined)?.mail ?? "";
  const detailContactPhone =
    detailContact?.phone ?? (detailContact as { phone_number?: string } | undefined)?.phone_number ?? "";
  const detailPriceLabelRaw = formatCurrency(detailTour?.price, detailTour?.currency);
  const detailPriceLabel =
    detailPriceLabelRaw === "—" && typeof detailNormalized?.price === "string"
      ? detailNormalized.price
      : detailPriceLabelRaw;
  const detailErrorMessage = tourDetailQuery.isError
    ? extractErrorMessage(tourDetailQuery.error, "Không thể tải chi tiết tour.")
    : "";
  const isDetailLoading = tourDetailQuery.isFetching;

  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setDetailTourId(null);
    tourDetailQuery.remove?.();
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
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
              <div className="w-full sm:w-56">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
                <Select value={statusFilter} onValueChange={(value: AdminTourStatus | "all") => handleStatusFilterChange(value)}>
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
                    placeholder="Tên tour, điểm đến..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyFilters();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={applyFilters}>
                    <Search className="mr-2 h-4 w-4" />
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
                        <div className="flex flex-wrap items-center gap-3 md:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(tour)}
                            disabled={isDetailOpen && detailTourId === tour.id && isDetailLoading}
                          >
                            {isDetailOpen && detailTourId === tour.id && isDetailLoading ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CalendarDays className="mr-2 h-3.5 w-3.5 text-primary" />
                            )}
                            Chi tiết
                          </Button>
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
          {totalTours > 0 ? (
            <div className="flex flex-col gap-4 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                Hiển thị {displayStart}-{displayEnd} trên tổng {totalTours} tour
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

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDetailClose();
          } else {
            setIsDetailOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Chi tiết tour</DialogTitle>
            <DialogDescription>Xem thông tin đầy đủ của tour và lịch khởi hành mới nhất.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4 scrollbar-hide">
            <div className="space-y-6 pr-2">
            {detailErrorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {detailErrorMessage}
              </div>
            ) : null}
            {detailNormalized ? (
              <div className="space-y-6">
                {isDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đồng bộ dữ liệu tour...
                  </div>
                ) : null}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-foreground">{detailNormalized.name}</p>
                    {detailStatusMeta ? <Badge variant={detailStatusMeta.badge}>{detailStatusMeta.label}</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Địa điểm: <span className="font-medium text-foreground">{detailNormalized.location}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Thời gian:{" "}
                    <span className="font-medium text-foreground">
                      {formatDateLabel(detailNormalized.startDate)} → {formatDateLabel(detailNormalized.endDate)}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Giá niêm yết:{" "}
                    <span className="font-medium text-foreground">
                      {detailPriceLabel}
                    </span>
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Đối tác phụ trách</p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {detailPartner?.company_name ?? detailNormalized.partner ?? "—"}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {detailContactName}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Thông tin liên hệ</p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      {detailContactEmail || "Chưa cập nhật"}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {detailContactPhone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Lịch khởi hành</p>
                  {detailSchedules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tiêu đề</TableHead>
                          <TableHead>Bắt đầu</TableHead>
                          <TableHead>Kết thúc</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Số chỗ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailSchedules.map((schedule, index) => (
                          <TableRow key={`${schedule.id ?? index}-${index}`}>
                            <TableCell>
                              {typeof schedule.title === "string" && schedule.title.trim()
                                ? schedule.title
                                : "Không tên"}
                            </TableCell>
                            <TableCell>{formatDateLabel(schedule.start_date)}</TableCell>
                            <TableCell>{formatDateLabel(schedule.end_date)}</TableCell>
                            <TableCell>{formatCurrency(schedule.price, detailTour?.currency)}</TableCell>
                            <TableCell>
                              {(schedule.slots_available ?? schedule.capacity) !== undefined
                                ? `${schedule.slots_available ?? schedule.capacity} chỗ`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có lịch khởi hành nào được cấu hình.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải thông tin tour...
                  </div>
                ) : (
                  "Chọn một tour trong danh sách để xem chi tiết."
                )}
              </div>
            )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDetailClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import {
  Loader2,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  DollarSign,
  CalendarDays,
  Phone,
  Mail,
  User,
  List,
  Shield,
} from "lucide-react";
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
  type AdminTourSchedule,
  type AdminTourPackage,
  type AdminTourCancellationPolicy,
  type AdminTourCategory,
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

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

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

const formatRefundRateLabel = (rate?: number | null) => {
  if (typeof rate !== "number" || Number.isNaN(rate)) return null;
  const normalized = rate > 1 ? rate : rate * 100;
  return `${Math.round(normalized)}%`;
};

const extractTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (
          item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).url === "string"
        ) {
          return ((item as Record<string, unknown>).url as string).trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return toStringArray(parsed);
      } catch {
        return trimmed.split(/\s*,\s*/).filter(Boolean);
      }
    }
    return trimmed.split(/\s*,\s*/).filter(Boolean);
  }
  return [];
};

const parseItineraryEntries = (
  value: unknown,
): Array<{ day: number; title: string; detail: string }> => {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const dayRaw = record.day ?? record.order ?? index + 1;
      const day =
        typeof dayRaw === "number" && Number.isFinite(dayRaw)
          ? dayRaw
          : Number(dayRaw) || index + 1;
      const title =
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : typeof record.name === "string" && record.name.trim()
          ? record.name.trim()
          : `Hoạt động ngày ${day}`;
      const detail =
        typeof record.detail === "string" && record.detail.trim()
          ? record.detail.trim()
          : typeof record.description === "string" && record.description.trim()
          ? record.description.trim()
          : "Chưa có chi tiết.";
      return { day, title, detail };
    }
    if (typeof entry === "string") {
      const parts = entry.split(":");
      const dayMatch = parts[0]?.match(/\d+/);
      const day = dayMatch ? parseInt(dayMatch[0], 10) : index + 1;
      const content = parts.slice(1).join(":").trim();
      const detailParts = content.split(" - ");
      return {
        day,
        title: detailParts[0]?.trim() || `Hoạt động ngày ${day}`,
        detail: detailParts.slice(1).join(" - ").trim() || "Chưa có chi tiết.",
      };
    }
    return { day: index + 1, title: `Hoạt động ngày ${index + 1}`, detail: "Chưa có chi tiết." };
  });
};

const normalizeTour = (tour: AdminTour): NormalizedTour => {
  const tourRecord = tour as AdminTour & Record<string, unknown>;
  const rawStatus = typeof tour.status === "string" ? tour.status.toLowerCase() : undefined;
  const status: AdminTourStatus =
    rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";

  const fallbackUuid = tourRecord["uuid"];
  const idCandidate =
    typeof tour.id === "string"
      ? tour.id
      : typeof tour.id === "number"
        ? String(tour.id)
        : typeof fallbackUuid === "string"
          ? fallbackUuid
          : undefined;

  const titleCandidate =
    extractTrimmedString(tour.name) ??
    extractTrimmedString(tourRecord.title) ??
    extractTrimmedString(tourRecord["tour_name"]) ??
    "Chưa đặt tên";

  const destinationCandidate =
    extractTrimmedString(tour.location) ??
    extractTrimmedString(tourRecord.destination) ??
    extractTrimmedString(tourRecord["place"]) ??
    "—";

  const packages = Array.isArray(tour.packages)
    ? tour.packages.filter((pkg): pkg is AdminTourPackage => Boolean(pkg))
    : [];
  const primaryPackage = packages.find((pkg) => pkg?.is_active !== false) ?? packages[0];

  const rawBasePrice = tourRecord.base_price as unknown;

  const basePrice = (() => {
    if (typeof rawBasePrice === "number" && Number.isFinite(rawBasePrice)) return rawBasePrice;
    if (typeof rawBasePrice === "string" && rawBasePrice.trim()) {
      const parsed = Number(rawBasePrice);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (primaryPackage) {
      const priceCandidate =
        typeof primaryPackage.adult_price === "number"
          ? primaryPackage.adult_price
          : typeof primaryPackage.adult_price === "string"
          ? Number(primaryPackage.adult_price)
          : undefined;
      if (typeof priceCandidate === "number" && Number.isFinite(priceCandidate)) {
        return priceCandidate;
      }
    }
    if (typeof tour.price === "number" && Number.isFinite(tour.price)) return tour.price;
    if (typeof tour.price === "string" && (tour.price as string).trim()) {
    const parsed = Number(tour.price);
    if (Number.isFinite(parsed)) return parsed;
  }
    return undefined;
  })();

  const formattedPrice =
    typeof basePrice === "number" && Number.isFinite(basePrice) && basePrice > 0
      ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(basePrice)
      : "Liên hệ";

  const schedules = Array.isArray(tour.schedules)
    ? tour.schedules.filter((schedule): schedule is AdminTourSchedule => Boolean(schedule))
    : [];
  const fallbackSchedule = tourRecord.schedule as AdminTourSchedule | undefined;
  const primarySchedule =
    schedules.find(
      (schedule) =>
        typeof schedule?.start_date === "string" && schedule.start_date.trim().length > 0,
    ) ?? fallbackSchedule;

  const startDate =
    typeof primarySchedule?.start_date === "string" && primarySchedule.start_date.trim()
      ? primarySchedule.start_date
      : typeof tour.start_date === "string" && tour.start_date.trim()
      ? tour.start_date
      : undefined;
  const endDate =
    typeof primarySchedule?.end_date === "string" && primarySchedule.end_date.trim()
      ? primarySchedule.end_date
      : typeof tour.end_date === "string" && tour.end_date.trim()
      ? tour.end_date
      : undefined;

  return {
    id: String(idCandidate ?? tour.id ?? ""),
    name: titleCandidate,
    status,
    partner: tour.partner?.company_name ?? tour.partner?.user?.name ?? "Đối tác",
    price: formattedPrice,
    location: destinationCandidate,
    createdAt: tour.created_at,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
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
  const detailSchedules = (detailTour?.schedules ?? []).filter(
    (schedule): schedule is AdminTourSchedule => Boolean(schedule),
  );
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
  const detailTags = toStringArray(detailTour?.tags);
  const detailCategories = (detailTour?.categories ?? []).filter(
    (category): category is AdminTourCategory => Boolean(category),
  );
  const detailPackages = (detailTour?.packages ?? []).filter(
    (pkg): pkg is AdminTourPackage => Boolean(pkg),
  );
  const detailCancellationPolicies = (detailTour?.cancellation_policies ?? []).filter(
    (policy): policy is AdminTourCancellationPolicy => Boolean(policy),
  );
  const detailItinerary = parseItineraryEntries(detailTour?.itinerary ?? []);
  const detailRequiresPassport = Boolean(detailTour?.requires_passport);
  const detailRequiresVisa = Boolean(detailTour?.requires_visa);
  const detailChildAgeLimit =
    typeof detailTour?.child_age_limit === "number" && Number.isFinite(detailTour.child_age_limit)
      ? detailTour.child_age_limit
      : null;
  const detailType =
    typeof detailTour?.type === "string" && detailTour.type.trim().length > 0
      ? detailTour.type.trim()
      : null;
  const detailErrorMessage = tourDetailQuery.isError
    ? extractErrorMessage(tourDetailQuery.error, "Không thể tải chi tiết tour.")
    : "";
  const isDetailLoading = tourDetailQuery.isFetching;

  const handleDetailClose = () => {
    const currentId = detailTourId;
    setIsDetailOpen(false);
    setDetailTourId(null);
    if (currentId) {
      queryClient.removeQueries({ queryKey: ["admin-tour", currentId] });
    }
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
                    {detailStatusMeta ? (
                      <Badge variant={detailStatusMeta.badge}>{detailStatusMeta.label}</Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-muted-foreground">
                      Địa điểm:{" "}
                      <span className="font-medium text-foreground">{detailNormalized.location}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Giá niêm yết:{" "}
                      <span className="font-medium text-foreground">{detailPriceLabel}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Thời gian:{" "}
                      <span className="font-medium text-foreground">
                        {formatDateLabel(detailNormalized.startDate)} → {formatDateLabel(detailNormalized.endDate)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Loại tour:{" "}
                      <span className="font-medium text-foreground">
                        {detailType === "domestic"
                          ? "Nội địa"
                          : detailType === "international"
                          ? "Quốc tế"
                          : detailType ?? "Chưa cập nhật"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={detailRequiresPassport ? "default" : "outline"}>
                      {detailRequiresPassport ? "Cần hộ chiếu" : "Không cần hộ chiếu"}
                    </Badge>
                    <Badge variant={detailRequiresVisa ? "default" : "outline"}>
                      {detailRequiresVisa ? "Cần visa" : "Không cần visa"}
                    </Badge>
                    {detailChildAgeLimit !== null ? (
                      <Badge variant="secondary">Trẻ em ≤ {detailChildAgeLimit} tuổi</Badge>
                    ) : null}
                  </div>
                  {detailTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {detailTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-primary/5 text-primary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {detailCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Danh mục:</span>
                      {detailCategories.map((category, index) => (
                        <span key={category.id ?? index} className="rounded-full bg-muted px-2 py-1">
                          {typeof category?.name === "string" && category.name.trim()
                            ? category.name
                            : `Danh mục #${index + 1}`}
                        </span>
                      ))}
                    </div>
                  ) : null}
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
                          <TableHead>Bắt đầu</TableHead>
                          <TableHead>Kết thúc</TableHead>
                          <TableHead>Giá mùa cao điểm</TableHead>
                          <TableHead>Tổng chỗ</TableHead>
                          <TableHead>Còn trống</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailSchedules.map((schedule, index) => (
                          <TableRow key={`${schedule.id ?? index}-${index}`}>
                            <TableCell>{formatDateLabel(schedule.start_date)}</TableCell>
                            <TableCell>{formatDateLabel(schedule.end_date)}</TableCell>
                            <TableCell>{formatCurrency(schedule.season_price, detailTour?.currency)}</TableCell>
                            <TableCell>{schedule.seats_total ?? "—"}</TableCell>
                            <TableCell>{schedule.seats_available ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có lịch khởi hành nào được cấu hình.</p>
                  )}
                </div>
                {detailPackages.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Gói dịch vụ</p>
                    <div className="space-y-2">
                      {detailPackages.map((pkg, index) => (
                        <div
                          key={pkg.id ?? index}
                          className="rounded-lg border border-dashed border-primary/20 p-3 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-foreground">
                              {typeof pkg.name === "string" && pkg.name.trim()
                                ? pkg.name
                                : `Gói dịch vụ #${index + 1}`}
                            </p>
                            <Badge variant={pkg.is_active === false ? "secondary" : "default"}>
                              {pkg.is_active === false ? "Ngừng bán" : "Đang mở bán"}
                            </Badge>
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          )}
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <p>
                              <span className="text-muted-foreground">Giá người lớn:</span>{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(pkg.adult_price, detailTour?.currency)}
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Giá trẻ em:</span>{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(pkg.child_price, detailTour?.currency)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {detailCancellationPolicies.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Chính sách hoàn hủy</p>
                    <div className="space-y-2">
                      {detailCancellationPolicies.map((policy, index) => (
                        <div
                          key={policy.id ?? index}
                          className="rounded border border-muted-foreground/20 bg-muted/20 px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-foreground">
                            Trước {policy.days_before ?? "—"} ngày
                          </p>
                          <p className="text-muted-foreground">
                                  Hoàn lại {formatRefundRateLabel(policy.refund_rate) ?? "Theo thỏa thuận"}
                          </p>
                          {policy.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{policy.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Lịch trình chi tiết</p>
                  {detailItinerary.length > 0 ? (
                    <div className="space-y-3">
                      {detailItinerary.map((item) => (
                        <div key={`${item.day}-${item.title}`} className="border-l-4 border-primary/60 pl-3">
                          <p className="font-semibold text-foreground">
                            Ngày {item.day}: {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa cập nhật lịch trình chi tiết.</p>
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


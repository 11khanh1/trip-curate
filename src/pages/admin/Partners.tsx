import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Briefcase, UserPlus, BarChart3, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminPartners,
  fetchAdminPartner,
  createAdminPartner,
  updateAdminPartner,
  updateAdminPartnerStatus,
  type AdminPartner,
  type AdminPartnerDetail,
  type PaginatedResponse,
  type PartnerStatus,
} from "@/services/adminApi";

const STATUS_OPTIONS: { value: PartnerStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const STATUS_LABEL_MAP = STATUS_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<PartnerStatus, string>,
);

const getPartnerStatusBadgeVariant = (status: PartnerStatus) => {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

const normalizePartner = (partner: AdminPartner) => {
  const status = (partner.status as PartnerStatus | undefined) ?? "pending";
  const toursCount = partner.stats?.tours_count ?? partner.tours_count ?? 0;
  const bookingsCount = partner.stats?.bookings_count ?? partner.bookings_count ?? 0;

  return {
    id: partner.id,
    companyName: partner.company_name,
    contactName: partner.user?.name ?? "",
    email: partner.user?.email ?? "",
    phone: partner.user?.phone ?? "",
    taxCode: partner.tax_code ?? "",
    address: partner.address ?? "",
    status,
    toursCount,
    bookingsCount,
    userStatus: partner.user?.status ?? "",
    raw: partner,
  };
};

type NormalizedPartner = ReturnType<typeof normalizePartner>;

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  tax_code: string;
  address: string;
  status: PartnerStatus;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  company_name: "",
  tax_code: "",
  address: "",
  status: "pending",
};

type EditFormState = {
  company_name: string;
  name: string;
  email: string;
  phone: string;
  tax_code: string;
  address: string;
  status: PartnerStatus;
};

const INITIAL_EDIT_FORM: EditFormState = {
  company_name: "",
  name: "",
  email: "",
  phone: "",
  tax_code: "",
  address: "",
  status: "pending",
};

const parseMetaNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const numeric = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (error instanceof Error && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }
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

type PartnerDetailQueryData = {
  normalized: NormalizedPartner;
  stats: {
    toursCount: number;
    bookingsCount: number;
  };
  raw: AdminPartnerDetail;
};

export default function AdminPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingPartner, setEditingPartner] = useState<NormalizedPartner | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(INITIAL_EDIT_FORM);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PER_PAGE_OPTIONS[1]);
  const [detailPartnerId, setDetailPartnerId] = useState<string | number | null>(null);
  const [detailPartner, setDetailPartner] = useState<NormalizedPartner | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleEditOpen = (partner: NormalizedPartner) => {
    setEditingPartner(partner);
    setEditForm({
      company_name: partner.companyName ?? "",
      name: partner.contactName ?? "",
      email: partner.email ?? "",
      phone: partner.phone ?? "",
      tax_code: partner.taxCode ?? "",
      address: partner.address ?? "",
      status: partner.status,
    });
  };

  const handleEditClose = () => {
    setEditingPartner(null);
    setEditForm(INITIAL_EDIT_FORM);
  };

  const partnersQueryKey = ["admin-partners", statusFilter, searchTerm, page, perPage] as const;

  const partnersQuery = useQuery<
    PaginatedResponse<AdminPartner>,
    Error,
    { list: NormalizedPartner[]; meta: Record<string, unknown> }
  >({
    queryKey: partnersQueryKey,
    queryFn: () =>
      fetchAdminPartners({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
        page,
        per_page: perPage,
      }),
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
    select: (response) => ({
      list: (response?.data ?? []).map(normalizePartner),
      meta: response?.meta ?? {},
    }),
  });

  const partners = partnersQuery.data?.list ?? [];
  const partnersMeta = partnersQuery.data?.meta ?? {};

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminPartner({
        ...form,
        tax_code: form.tax_code || null,
        address: form.address || null,
      }),
    onSuccess: () => {
      toast({
        title: "Đã tạo đối tác",
        description: "Tài khoản đối tác mới đã được khởi tạo.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"], exact: false });
      setForm(INITIAL_FORM);
    },
    onError: (error: unknown) => {
      console.error("Create partner failed:", error);
      toast({
        title: "Không thể tạo đối tác",
        description: extractErrorMessage(error, "Vui lòng kiểm tra lại thông tin."),
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation<unknown, unknown, { id: string | number; status: PartnerStatus }>({
    mutationFn: ({ id, status }) => updateAdminPartnerStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Đã cập nhật đối tác",
        description: "Trạng thái đối tác đã được thay đổi.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"], exact: false });
    },
    onError: (error: unknown) => {
      console.error("Update partner failed:", error);
      toast({
        title: "Không thể cập nhật",
        description: extractErrorMessage(error, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
    },
  });

  const updateInfoMutation = useMutation({
    mutationFn: () => {
      if (!editingPartner) return Promise.resolve(null);
      return updateAdminPartner(editingPartner.id, {
        company_name: editForm.company_name.trim(),
        tax_code: editForm.tax_code.trim(),
        address: editForm.address.trim(),
        status: editForm.status,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Đã lưu thông tin",
        description: "Thông tin đối tác đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"], exact: false });
      handleEditClose();
    },
    onError: (error: unknown) => {
      console.error("Update partner info failed:", error);
      toast({
        title: "Không thể cập nhật",
        description: extractErrorMessage(error, "Vui lòng kiểm tra lại dữ liệu."),
        variant: "destructive",
      });
    },
  });

  const partnerMetaNumbers = partnersMeta as {
    current_page?: number | string;
    per_page?: number | string;
    last_page?: number | string;
    total?: number | string;
    from?: number | string;
    to?: number | string;
    approved_count?: number | string;
    rejected_count?: number | string;
  };

  const currentPage = parseMetaNumber(partnerMetaNumbers.current_page) ?? page;
  const serverPerPage = parseMetaNumber(partnerMetaNumbers.per_page) ?? perPage;
  const totalPartners =
    parseMetaNumber(partnerMetaNumbers.total) ?? (partners.length && !partnersQuery.isLoading ? partners.length : 0);
  const lastPage =
    parseMetaNumber(partnerMetaNumbers.last_page) ??
    Math.max(1, serverPerPage > 0 ? Math.ceil(totalPartners / serverPerPage) : 1);
  const rangeStart =
    parseMetaNumber(partnerMetaNumbers.from) ?? (totalPartners > 0 ? (currentPage - 1) * serverPerPage + 1 : 0);
  const rangeEnd =
    parseMetaNumber(partnerMetaNumbers.to) ??
    (totalPartners > 0 ? Math.min(totalPartners, currentPage * serverPerPage) : 0);
  const displayStart = totalPartners === 0 ? 0 : Math.max(1, Math.min(rangeStart || 1, totalPartners));
  const displayEnd = totalPartners === 0 ? 0 : Math.min(rangeEnd || displayStart, totalPartners);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  const approvedPartners =
    parseMetaNumber(partnerMetaNumbers.approved_count) ??
    partners.filter((partner) => partner.status === "approved").length;
  const rejectedPartners =
    parseMetaNumber(partnerMetaNumbers.rejected_count) ??
    partners.filter((partner) => partner.status === "rejected").length;

  const paginationRange = useMemo<(number | "ellipsis")[]>(() => {
    const totalPages = Math.max(1, lastPage);
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

  const partnerDetailQuery = useQuery<AdminPartnerDetail, Error, PartnerDetailQueryData>({
    queryKey: ["admin-partner", detailPartnerId],
    queryFn: () => {
      if (detailPartnerId === null) {
        throw new Error("Thiếu mã đối tác để tra cứu hồ sơ.");
      }
      return fetchAdminPartner(detailPartnerId);
    },
    enabled: detailPartnerId !== null,
    staleTime: 30_000,
    select: (payload) => {
      const normalized = normalizePartner(payload.partner);
      const statsSource = payload.stats ?? payload.partner?.stats ?? {};
      return {
        normalized,
        stats: {
          toursCount: parseMetaNumber(statsSource.tours_count) ?? normalized.toursCount ?? 0,
          bookingsCount: parseMetaNumber(statsSource.bookings_count) ?? normalized.bookingsCount ?? 0,
        },
        raw: payload,
      };
    },
  });

  useEffect(() => {
    if (partnerDetailQuery.data?.normalized) {
      setDetailPartner(partnerDetailQuery.data.normalized);
    }
  }, [partnerDetailQuery.data]);

  const handleStatusFilterChange = (value: PartnerStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePerPageChange = (value: string) => {
    const parsed = Number(value);
    setPerPage((prev) => {
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
      return prev;
    });
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

  const handleViewDetail = (partner: NormalizedPartner) => {
    setDetailPartner(partner);
    setDetailPartnerId(partner.id);
    setIsDetailOpen(true);
  };

  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setDetailPartnerId(null);
    setDetailPartner(null);
    if (partnerDetailQuery.remove) {
      partnerDetailQuery.remove();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.company_name.trim()) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: "Vui lòng nhập đầy đủ họ tên liên hệ và tên công ty.",
        variant: "destructive",
      });
      return;
    }
    if (!form.email.trim()) {
      toast({
        title: "Thiếu email",
        description: "Vui lòng nhập email của đối tác.",
        variant: "destructive",
      });
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast({
        title: "Mật khẩu không hợp lệ",
        description: "Mật khẩu cần tối thiểu 6 ký tự.",
        variant: "destructive",
      });
      return;
    }
    if (form.password !== form.password_confirmation) {
      toast({
        title: "Xác nhận mật khẩu không khớp",
        description: "Vui lòng nhập lại mật khẩu.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPartner) return;
    if (!editForm.company_name.trim() || !editForm.name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên công ty và người liên hệ.",
        variant: "destructive",
      });
      return;
    }
    if (!editForm.email.trim()) {
      toast({
        title: "Thiếu email",
        description: "Vui lòng nhập email của đối tác.",
        variant: "destructive",
      });
      return;
    }
    updateInfoMutation.mutate();
  };

  const detailStats =
    partnerDetailQuery.data?.stats ?? {
      toursCount: detailPartner?.toursCount ?? 0,
      bookingsCount: detailPartner?.bookingsCount ?? 0,
    };
  const detailStatusLabel =
    detailPartner && detailPartner.status ? STATUS_LABEL_MAP[detailPartner.status] ?? detailPartner.status : "";
  const detailAccountStatus = detailPartner?.userStatus ?? detailPartner?.raw?.user?.status ?? "";
  const isDetailLoading = partnerDetailQuery.isFetching;
  const detailErrorMessage = partnerDetailQuery.isError
    ? extractErrorMessage(partnerDetailQuery.error, "Không thể tải hồ sơ đối tác.")
    : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Tổng đối tác" value={totalPartners.toString()} icon={Briefcase} gradient />
        <StatCard title="Đối tác đã duyệt" value={approvedPartners.toString()} icon={UserPlus} />
        <StatCard title="Đối tác bị từ chối" value={rejectedPartners.toString()} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản đối tác</CardTitle>
          <CardDescription>Nhập thông tin cơ bản để khởi tạo tài khoản hợp tác</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ tên người liên hệ</label>
              <Input
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="partner@email.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input
                placeholder="0901 234 567"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mật khẩu tạm</label>
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={form.password_confirmation}
                onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tên công ty</label>
              <Input
                placeholder="VietAdventure Co."
                value={form.company_name}
                onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mã số thuế</label>
              <Input
                placeholder="0123456789"
                value={form.tax_code}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Địa chỉ</label>
              <Input
                placeholder="Số 1, Đường ABC, Quận 1"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <Select value={form.status} onValueChange={(value: PartnerStatus) => setForm((prev) => ({ ...prev, status: value }))}>
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
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(INITIAL_FORM)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo tài khoản"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Danh sách đối tác</CardTitle>
              <CardDescription>Theo dõi trạng thái duyệt và thống kê cơ bản</CardDescription>
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
              <div className="w-full sm:w-48">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Trạng thái</label>
                <Select value={statusFilter} onValueChange={(value) => handleStatusFilterChange(value as PartnerStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Từ khóa</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm theo tên, email hoặc công ty..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchSubmit}
                    disabled={partnersQuery.isFetching && searchTerm === searchInput.trim()}
                  >
                    Tìm
                  </Button>
                </div>
              </div>
              
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[2fr,1.5fr,2fr,1fr,1fr] bg-muted/70 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Doanh nghiệp</span>
              <span>Liên hệ</span>
              <span>Email</span>
              <span>Hoạt động</span>
              <span>Trạng thái</span>
            </div>
            <div className="divide-y">
              {partnersQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách đối tác...
                </div>
              ) : partners.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Không tìm thấy đối tác phù hợp."
                    : "Chưa có đối tác nào trong hệ thống."}
                </div>
              ) : (
                partners.map((partner) => {
                  const badgeLabel = STATUS_LABEL_MAP[partner.status] ?? partner.status;
                  const badgeVariant = getPartnerStatusBadgeVariant(partner.status);
                  const createdAtSource = partner.raw?.created_at;
                  const createdAtLabel = createdAtSource ? new Date(createdAtSource).toLocaleDateString("vi-VN") : null;
                  const isUpdatingThisPartner =
                    updateStatusMutation.isPending && updateStatusMutation.variables?.id === partner.id;

                  return (
                    <div
                      key={partner.id}
                      className="grid gap-4 px-4 py-4 md:grid-cols-[2fr,1.5fr,2fr,1fr,1.35fr] md:items-center"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{partner.companyName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                          {createdAtLabel ? <span>Gia nhập: {createdAtLabel}</span> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          MST: {partner.taxCode || "—"} • {partner.address || "Chưa cập nhật"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {partner.contactName || partner.phone
                          ? `${partner.contactName}${partner.phone ? ` • ${partner.phone}` : ""}`
                          : "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">{partner.email || "—"}</p>
                      <div className="text-sm text-muted-foreground">
                        {partner.toursCount} tour • {partner.bookingsCount} lượt đặt
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetail(partner)}>
                          Xem hồ sơ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(partner)}
                          disabled={updateInfoMutation.isPending && editingPartner?.id === partner.id}
                        >
                          Chỉnh sửa
                        </Button>
                        <Select
                          value={partner.status}
                          onValueChange={(status) =>
                            updateStatusMutation.mutate({ id: partner.id, status: status as PartnerStatus })
                          }
                          disabled={isUpdatingThisPartner}
                        >
                          <SelectTrigger className="h-9 min-w-[170px] justify-between sm:w-auto">
                            <SelectValue placeholder="Cập nhật trạng thái" />
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {totalPartners > 0 ? (
            <div className="flex flex-col gap-4 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                Hiển thị {displayStart}-{displayEnd} trên tổng {totalPartners} đối tác
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hồ sơ đối tác</DialogTitle>
            <DialogDescription>Thông tin tổng quan và thống kê hoạt động của đối tác.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {detailErrorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {detailErrorMessage}
              </div>
            ) : null}
            {detailPartner ? (
              <div className="space-y-6">
                {isDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đồng bộ dữ liệu mới nhất...
                  </div>
                ) : null}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-foreground">{detailPartner.companyName}</p>
                    {detailPartner.status ? (
                      <Badge variant={getPartnerStatusBadgeVariant(detailPartner.status)}>
                        {detailStatusLabel || detailPartner.status}
                      </Badge>
                    ) : null}
                    {detailAccountStatus ? (
                      <Badge variant={detailAccountStatus === "active" ? "default" : "secondary"}>
                        Tài khoản {detailAccountStatus === "active" ? "hoạt động" : "tạm dừng"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Thành lập:{" "}
                    {detailPartner.raw?.created_at
                      ? new Date(detailPartner.raw.created_at).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </p>
                  <p className="text-sm text-muted-foreground">Địa chỉ: {detailPartner.address || "Chưa cập nhật"}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground">Số tour đã tạo</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{detailStats.toursCount}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground">Tổng lượt đặt</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{detailStats.bookingsCount}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">Thông tin liên hệ</p>
                    <p className="text-muted-foreground">Người liên hệ: {detailPartner.contactName || "—"}</p>
                    <p className="text-muted-foreground">Email: {detailPartner.email || "—"}</p>
                    <p className="text-muted-foreground">Số điện thoại: {detailPartner.phone || "—"}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">Thông tin doanh nghiệp</p>
                    <p className="text-muted-foreground">Tên công ty: {detailPartner.companyName}</p>
                    <p className="text-muted-foreground">Mã số thuế: {detailPartner.taxCode || "—"}</p>
                    <p className="text-muted-foreground">Email đăng nhập: {detailPartner.raw?.user?.email || "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải hồ sơ đối tác...
                  </div>
                ) : (
                  "Chọn một đối tác trong danh sách để xem chi tiết hồ sơ."
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDetailClose}>
              Đóng
            </Button>
            {detailPartner ? (
              <Button
                type="button"
                onClick={() => {
                  handleEditOpen(detailPartner);
                  handleDetailClose();
                }}
              >
                Chỉnh sửa thông tin
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingPartner)}
        onOpenChange={(open) => {
          if (!open) handleEditClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin đối tác</DialogTitle>
            <DialogDescription>Chỉnh sửa dữ liệu liên hệ và trạng thái hoạt động.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Tên doanh nghiệp</label>
                <Input
                  value={editForm.company_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tên người liên hệ</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mã số thuế</label>
                <Input
                  value={editForm.tax_code}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tax_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Địa chỉ</label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Trạng thái</label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: PartnerStatus) => setEditForm((prev) => ({ ...prev, status: value }))}
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleEditClose} disabled={updateInfoMutation.isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateInfoMutation.isPending}>
                {updateInfoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { StatCard } from "@/components/admin/StatCard";
import { Briefcase, BarChart3, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminPartners,
  fetchAdminPartner,
  updateAdminPartner,
  type AdminPartner,
  type AdminPartnerDetail,
  type PartnerStatus,
  type PaginatedResponse,
} from "@/services/adminApi";
import { normalizeVietnamPhone } from "@/lib/validators";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: PartnerStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const STATUS_BADGE: Record<PartnerStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const STATUS_FILTER_ALL = "all";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
};

const normalizePartner = (partner: AdminPartner) => {
  const status = (partner.status as PartnerStatus | undefined) ?? "pending";
  const toursCount = partner.stats?.tours_count ?? partner.tours_count ?? 0;
  const bookingsCount = partner.stats?.bookings_count ?? partner.bookings_count ?? 0;

  return {
    id: partner.id,
    companyName: partner.company_name ?? "—",
    businessType: partner.business_type ?? "—",
    taxCode: partner.tax_code ?? "",
    address: partner.address ?? "",
    description: partner.description ?? "",
    contactName: partner.contact_name ?? "",
    contactEmail: partner.contact_email ?? "",
    contactPhone: partner.contact_phone ?? "",
    status,
    approvedAt: partner.approved_at ?? null,
    createdAt: partner.created_at ?? null,
    toursCount,
    bookingsCount,
    raw: partner,
  };
};

type NormalizedPartner = ReturnType<typeof normalizePartner>;

type EditFormState = {
  company_name: string;
  business_type: string;
  tax_code: string;
  address: string;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: PartnerStatus;
};

const INITIAL_EDIT_FORM: EditFormState = {
  company_name: "",
  business_type: "",
  tax_code: "",
  address: "",
  description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  status: "pending",
};

interface PartnersQueryData extends PaginatedResponse<AdminPartner> {
  meta?: {
    total?: number;
    approved_count?: number;
    rejected_count?: number;
    pending_count?: number;
    current_page?: number;
    last_page?: number;
  };
}

type PartnerDetailSelection = {
  partner: NormalizedPartner;
  stats: {
    toursCount: number;
    bookingsCount: number;
  };
};

const parseNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) return undefined;
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : undefined;
};

export default function AdminPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | typeof STATUS_FILTER_ALL>(STATUS_FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detailId, setDetailId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(INITIAL_EDIT_FORM);
  const [pendingStatusId, setPendingStatusId] = useState<string | number | null>(null);

  const partnersQueryKey = ["admin-partners", statusFilter, searchTerm, page, perPage] as const;

  const partnersQuery = useQuery<PartnersQueryData>({
    queryKey: partnersQueryKey,
    queryFn: () =>
      fetchAdminPartners({
        status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
        search: searchTerm,
        page,
        per_page: perPage,
      }),
    placeholderData: keepPreviousData,
  });

  const partners = partnersQuery.data?.data?.map(normalizePartner) ?? [];
  const meta = partnersQuery.data?.meta ?? {};
  const totalPartners = parseNumber(meta.total) ?? partners.length;
  const approvedCount = parseNumber(meta.approved_count) ?? partners.filter((p) => p.status === "approved").length;
  const pendingCount = parseNumber(meta.pending_count) ?? partners.filter((p) => p.status === "pending").length;
  const rejectedCount = parseNumber(meta.rejected_count) ?? partners.filter((p) => p.status === "rejected").length;
  const lastPage = parseNumber(meta.last_page) ?? Math.max(1, Math.ceil(totalPartners / perPage));
  const currentPage = parseNumber(meta.current_page) ?? page;

  const partnerDetailQuery = useQuery<AdminPartnerDetail, Error, PartnerDetailSelection>({
    queryKey: ["admin-partner", detailId],
    queryFn: () => {
      if (detailId === null) throw new Error("Thiếu mã đối tác.");
      return fetchAdminPartner(detailId);
    },
    enabled: detailId !== null,
    select: (data) => ({
      partner: normalizePartner(data.partner),
      stats: {
        toursCount: parseNumber(data.stats?.tours_count) ?? 0,
        bookingsCount: parseNumber(data.stats?.bookings_count) ?? 0,
      },
    }),
  });

  const openDetail = (partner: NormalizedPartner) => {
    setDetailId(partner.id);
    setEditForm({
      company_name: partner.companyName,
      business_type: partner.businessType === "—" ? "" : partner.businessType,
      tax_code: partner.taxCode,
      address: partner.address,
      description: partner.description,
      contact_name: partner.contactName,
      contact_email: partner.contactEmail,
      contact_phone: partner.contactPhone,
      status: partner.status,
    });
  };

  const closeDetail = () => {
    setDetailId(null);
    setEditForm(INITIAL_EDIT_FORM);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (detailId === null) return null;
      if (editForm.status === "approved" && !editForm.contact_email.trim()) {
        throw new Error("Cần email liên hệ để duyệt đối tác.");
      }
      return updateAdminPartner(detailId, {
        company_name: editForm.company_name,
        business_type: editForm.business_type,
        tax_code: editForm.tax_code,
        address: editForm.address,
        description: editForm.description,
        contact_name: editForm.contact_name,
        contact_email: editForm.contact_email,
        contact_phone: editForm.contact_phone ? normalizeVietnamPhone(editForm.contact_phone) : "",
        status: editForm.status,
      });
    },
    onSuccess: () => {
      toast({
        title: "Đã cập nhật hồ sơ",
        description:
          editForm.status === "approved"
            ? "Đối tác đã được duyệt. Hệ thống sẽ gửi email thông báo."
            : "Thông tin đối tác đã được lưu.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["admin-partner", detailId] });
      closeDetail();
    },
    onError: (error: unknown) => {
      const message =
        (error as any)?.response?.data?.message ||
        (error instanceof Error ? error.message : "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: PartnerStatus }) => updateAdminPartner(id, { status }),
    onMutate: ({ id }) => {
      setPendingStatusId(id);
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Đã cập nhật trạng thái",
        description:
          variables.status === "approved"
            ? "Đối tác đã được duyệt. Hệ thống sẽ gửi email thông báo."
            : "Trạng thái hồ sơ đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["admin-partner", variables.id] });
      if (detailId === variables.id) {
        setEditForm((prev) => ({ ...prev, status: variables.status }));
      }
    },
    onError: (error: unknown) => {
      const message =
        (error as any)?.response?.data?.message ||
        (error instanceof Error ? error.message : "Không thể đổi trạng thái. Vui lòng thử lại.");
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPendingStatusId(null);
    },
  });

  const handleQuickStatusChange = (partner: NormalizedPartner, status: PartnerStatus) => {
    if (partner.status === status) return;
    if (status === "approved" && !partner.contactEmail?.trim()) {
      toast({
        title: "Thiếu email liên hệ",
        description: "Vui lòng cập nhật email liên hệ của đối tác trước khi duyệt.",
        variant: "destructive",
      });
      return;
    }
    quickStatusMutation.mutate({ id: partner.id, status });
  };

  const stats = [
    { label: "Tổng đối tác", value: totalPartners, icon: Briefcase },
    { label: "Chờ duyệt", value: pendingCount, icon: Loader2 },
    { label: "Đã duyệt", value: approvedCount, icon: BarChart3 },
  ];

  const paginationNumbers = useMemo(() => {
    const total = Math.max(1, lastPage);
    const current = Math.min(Math.max(1, currentPage), total);
    const range: (number | "ellipsis")[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }
    range.push(1);
    const siblings = 1;
    let start = Math.max(2, current - siblings);
    let end = Math.min(total - 1, current + siblings);
    if (start > 2) range.push("ellipsis");
    for (let i = start; i <= end; i++) range.push(i);
    if (end < total - 1) range.push("ellipsis");
    range.push(total);
    return range;
  }, [currentPage, lastPage]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} title={stat.label} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý đối tác</CardTitle>
          <CardDescription>
            Tiếp nhận hồ sơ đăng ký từ đối tác và duyệt trực tiếp trên hệ thống. Khi duyệt, tài khoản sẽ được tạo và gửi email
            tự động cho đối tác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Tìm theo tên công ty, email hoặc số điện thoại"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="md:max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as PartnerStatus | typeof STATUS_FILTER_ALL);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>Tất cả trạng thái</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Hiển thị" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}/trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground text-center">
                  <th className="py-3 pr-4 font-medium">Công ty</th>
                  <th className="py-3 pr-4 font-medium">Loại hình</th>
                  <th className="py-3 pr-4 font-medium">Liên hệ</th>
                  <th className="py-3 pr-4 font-medium">Ngày tạo</th>
                  <th className="py-3 pr-4 font-medium">Duyệt</th>
                  <th className="py-3 pr-4 font-medium text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {partnersQuery.isLoading ? "Đang tải dữ liệu..." : "Chưa có hồ sơ nào."}
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="border-t">
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{partner.companyName}</p>
                        {partner.taxCode && <p className="text-xs text-muted-foreground">MST: {partner.taxCode}</p>}
                      </td>
                      <td className="py-3 pr-4">{partner.businessType}</td>
                      <td className="py-3 pr-4">
                        <p>{partner.contactName || "—"}</p>
                        <p className="text-xs text-muted-foreground">{partner.contactEmail || "—"}</p>
                        <p className="text-xs text-muted-foreground">{partner.contactPhone || "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(partner.createdAt)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatDateTime(partner.approvedAt)}</td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex flex-col gap-2 md:items-end">
                          <Badge
                            variant={STATUS_BADGE[partner.status]}
                            className={cn(
                              "w-fit rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-sm",
                              partner.status === "approved" ? "bg-primary text-white" : undefined,
                            )}
                          >
                            {STATUS_OPTIONS.find((opt) => opt.value === partner.status)?.label}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex w-full max-w-[180px] items-center justify-center gap-1.5 rounded-full border-primary/30 bg-white px-3 py-1 text-xs text-primary shadow-sm hover:bg-primary/5 md:w-auto"
                            onClick={() => openDetail(partner)}
                          >
                            <Calendar className="h-3 w-3" />
                            Chi tiết
                          </Button>
                          <Select
                            value={partner.status}
                            onValueChange={(value: PartnerStatus) => handleQuickStatusChange(partner, value)}
                            disabled={pendingStatusId === partner.id}
                          >
                            <SelectTrigger className="w-full min-w-[150px] justify-between rounded-full border bg-white px-3 text-sm font-medium shadow-sm md:w-[180px]">
                              <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationPrevious onClick={() => setPage((prev) => Math.max(1, prev - 1))} />
                {paginationNumbers.map((value, index) =>
                  value === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <PaginationLink
                      key={value}
                      isActive={value === currentPage}
                      onClick={() => setPage(value)}
                    >
                      {value}
                    </PaginationLink>
                  ),
                )}
                <PaginationNext onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))} />
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailId !== null} onOpenChange={(open) => (!open ? closeDetail() : null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hồ sơ đối tác</DialogTitle>
            <DialogDescription>
              Duyệt hồ sơ và cập nhật thông tin liên hệ. Nếu duyệt, hệ thống sẽ tự tạo tài khoản và gửi email thông báo.
            </DialogDescription>
          </DialogHeader>
          {partnerDetailQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải dữ liệu đối tác...
            </div>
          ) : partnerDetailQuery.data ? (
            <form
              className="grid gap-6 md:grid-cols-[3fr_2fr]"
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
            >
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tên doanh nghiệp</label>
                    <Input
                      value={editForm.company_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Loại hình kinh doanh</label>
                    <Input
                      value={editForm.business_type}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, business_type: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Người liên hệ</label>
                      <Input
                        value={editForm.contact_name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Số điện thoại</label>
                      <Input
                        value={editForm.contact_phone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email liên hệ</label>
                    <Input
                      type="email"
                      value={editForm.contact_email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                      required={editForm.status === "approved"}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mã số thuế</label>
                      <Input
                        value={editForm.tax_code}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, tax_code: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Trạng thái</label>
                      <div className="rounded-full border px-4 py-2 text-sm font-medium">
                        {STATUS_OPTIONS.find((option) => option.value === editForm.status)?.label ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Địa chỉ</label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mô tả doanh nghiệp</label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-semibold">Thống kê & lịch sử</h4>
                <div className="grid gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ngày tạo hồ sơ</p>
                    <p className="font-medium">{formatDateTime(partnerDetailQuery.data.partner.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày duyệt</p>
                    <p className="font-medium">{formatDateTime(partnerDetailQuery.data.partner.approvedAt)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/60 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Tổng tour</p>
                      <p className="text-lg font-semibold">{partnerDetailQuery.data.stats.toursCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tổng booking</p>
                      <p className="text-lg font-semibold">{partnerDetailQuery.data.stats.bookingsCount}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-900">
                    <p className="text-sm font-medium">Lưu ý khi duyệt</p>
                    <p className="text-xs">
                      Khi chuyển trạng thái sang <strong>Đã duyệt</strong>, hệ thống sẽ tạo tài khoản đối tác, sinh mật khẩu và
                      gửi email thông báo. Vui lòng đảm bảo email liên hệ chính xác.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDetail} disabled={updateMutation.isPending}>
                    Đóng
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu & cập nhật"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Không thể tải dữ liệu đối tác.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

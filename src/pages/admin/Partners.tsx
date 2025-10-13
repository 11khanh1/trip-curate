import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Briefcase, UserPlus, BarChart3, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminPartners,
  createAdminPartner,
  updateAdminPartner,
  type AdminPartner,
  type PaginatedResponse,
} from "@/services/adminApi";

type PartnerStatus = "pending" | "approved" | "rejected";

const STATUS_OPTIONS: { value: PartnerStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const statusLabel = (status: PartnerStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

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
  };
};

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

export default function AdminPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: () => fetchAdminPartners(),
  });

  const partnersResponse = data as PaginatedResponse<AdminPartner> | undefined;
  const partners = useMemo(() => {
    const list = partnersResponse?.data ?? [];
    return list.map(normalizePartner);
  }, [partnersResponse]);

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
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setForm(INITIAL_FORM);
    },
    onError: (err: any) => {
      console.error("Create partner failed:", err);
      toast({
        title: "Không thể tạo đối tác",
        description: err?.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: PartnerStatus }) =>
      updateAdminPartner(id, { status }),
    onSuccess: () => {
      toast({
        title: "Đã cập nhật đối tác",
        description: "Trạng thái đối tác đã được thay đổi.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
    onError: (err: any) => {
      console.error("Update partner failed:", err);
      toast({
        title: "Không thể cập nhật",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

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

  const totalPartners = (partnersResponse?.meta?.total as number | undefined) ?? partners.length;
  const approvedPartners = partners.filter((partner) => partner.status === "approved").length;
  const rejectedPartners = partners.filter((partner) => partner.status === "rejected").length;

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
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Danh sách đối tác</CardTitle>
              <CardDescription>Theo dõi trạng thái duyệt và thống kê cơ bản</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Xuất dữ liệu</Button>
              <Button variant="outline" disabled>
                Bộ lọc
              </Button>
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
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách đối tác...
                </div>
              ) : partners.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Chưa có đối tác nào trong hệ thống.</div>
              ) : (
                partners.map((partner) => (
                  <div key={partner.id} className="grid gap-4 px-4 py-4 md:grid-cols-[2fr,1.5fr,2fr,1fr,1fr] md:items-center">
                    <div className="space-y-1">
                      <p className="font-semibold">{partner.companyName}</p>
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
                    <div className="flex flex-col gap-2 md:items-start">
                      <Badge
                        variant={
                          partner.status === "approved"
                            ? "default"
                            : partner.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {statusLabel(partner.status)}
                      </Badge>
                      <Select
                        defaultValue={partner.status}
                        onValueChange={(status) => updateMutation.mutate({ id: partner.id, status: status as PartnerStatus })}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="h-9 w-[160px] justify-between">
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
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

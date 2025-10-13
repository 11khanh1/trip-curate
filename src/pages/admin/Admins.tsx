import { useState, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  type AdminStaff,
  type PaginatedResponse,
  type StaffUpdatePayload,
} from "@/services/adminApi";

type Role = "Super Admin" | "Quản lý nội dung" | "Hỗ trợ khách hàng";

type StaffStatus = "active" | "inactive" | "suspended";

const STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngưng",
  suspended: "Khóa tạm thời",
};

type NormalizedStaff = {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  phone?: string;
  status: StaffStatus;
  lastLogin: string;
};

type EditFormState = {
  name: string;
  email: string;
  phone: string;
  status: StaffStatus;
  password: string;
  password_confirmation: string;
};

const EMPTY_EDIT_FORM: EditFormState = {
  name: "",
  email: "",
  phone: "",
  status: "active",
  password: "",
  password_confirmation: "",
};

const normalizeStaff = (staff: AdminStaff): NormalizedStaff => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  role: (staff.role as Role) || "Hỗ trợ khách hàng",
  phone: staff.phone,
  status: ((staff.status as StaffStatus) ?? "active") as StaffStatus,
  lastLogin: staff.last_login_at ?? (staff as any)?.last_login ?? "",
});

export default function AdminAdmins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    status: "active" as StaffStatus,
  });
  const [editingStaff, setEditingStaff] = useState<NormalizedStaff | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ ...EMPTY_EDIT_FORM });

  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const staffQuery = useQuery<
    PaginatedResponse<AdminStaff>,
    Error,
    NormalizedStaff[]
  >({
    queryKey: ["admin-staff"],
    queryFn: () => fetchAdminStaff({ per_page: 20 }),
    enabled: Boolean(authToken),
    placeholderData: keepPreviousData,
    select: (response) => {
      const list = response?.data ?? [];
      return list.map(normalizeStaff);
    },
  });

  const staff = staffQuery.data ?? [];

  const openEditDialog = (staffMember: NormalizedStaff) => {
    setEditingStaff(staffMember);
    setEditForm({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone ?? "",
      status: staffMember.status,
      password: "",
      password_confirmation: "",
    });
  };

  const closeEditDialog = () => {
    setEditingStaff(null);
    setEditForm({ ...EMPTY_EDIT_FORM });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminStaff({
        ...form,
        status: form.status,
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo tài khoản", description: "Nhân sự quản trị mới đã được thêm." });
      setForm({ name: "", email: "", phone: "", password: "", password_confirmation: "", status: "active" });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"], exact: false });
    },
    onError: (err: any) => {
      console.error("Create staff failed:", err);
      toast({
        title: "Không thể tạo tài khoản",
        description: err?.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StaffStatus }) =>
      updateAdminStaff(id, { status }),
    onSuccess: () => {
      toast({ title: "Đã cập nhật", description: "Trạng thái nhân sự đã được cập nhật." });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"], exact: false });
    },
    onError: (err: any) => {
      console.error("Update staff failed:", err);
      toast({
        title: "Không thể cập nhật trạng thái",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminStaff(id),
    onSuccess: () => {
      toast({ title: "Đã xoá nhân sự", description: "Tài khoản quản trị đã được xoá." });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"], exact: false });
    },
    onError: (err: any) => {
      console.error("Delete staff failed:", err);
      toast({
        title: "Không thể xoá tài khoản",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUpdatePayload }) => updateAdminStaff(id, data),
    onSuccess: () => {
      toast({ title: "Đã cập nhật nhân sự", description: "Thông tin tài khoản đã được lưu." });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"], exact: false });
      closeEditDialog();
    },
    onError: (err: any) => {
      console.error("Edit staff failed:", err);
      toast({
        title: "Không thể cập nhật thông tin",
        description: err?.response?.data?.message || "Vui lòng kiểm tra lại dữ liệu.",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = () => {
    if (!editingStaff) return;
    if (editForm.password && editForm.password !== editForm.password_confirmation) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng kiểm tra lại mật khẩu xác nhận.",
        variant: "destructive",
      });
      return;
    }

    const data: StaffUpdatePayload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      status: editForm.status,
    };

    const phone = editForm.phone.trim();
    if (phone) {
      data.phone = phone;
    }

    if (editForm.password) {
      data.password = editForm.password;
      data.password_confirmation = editForm.password_confirmation;
    }

    editMutation.mutate({ id: editingStaff.id, data });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.password || form.password.length < 6) {
      toast({
        title: "Mật khẩu chưa hợp lệ",
        description: "Mật khẩu cần tối thiểu 6 ký tự.",
        variant: "destructive",
      });
      return;
    }
    if (!form.password || form.password !== form.password_confirmation) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng kiểm tra lại mật khẩu và xác nhận.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thêm nhân sự quản trị</CardTitle>
            <CardDescription>Khởi tạo tài khoản nội bộ với phân quyền phù hợp</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
              <Input
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Email nội bộ"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Mật khẩu tạm"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <Input
                placeholder="Xác nhận mật khẩu"
                type="password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))
                }
                required
              />
              <Select
                value={form.status}
                onValueChange={(value: StaffStatus) => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng</SelectItem>
                  <SelectItem value="suspended">Khóa tạm thời</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      name: "",
                      email: "",
                      phone: "",
                      password: "",
                      password_confirmation: "",
                      status: "active",
                    })
                  }
                >
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
            <CardTitle>Danh sách quản trị viên</CardTitle>
            <CardDescription>Theo dõi quyền hạn và trạng thái hoạt động của từng nhân sự</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phân quyền</TableHead>
                  <TableHead>Lần đăng nhập cuối</TableHead>
                  <TableHead className="text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải danh sách nhân sự...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Chưa có nhân sự quản trị nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === "Super Admin" ? "default" : "secondary"}>{admin.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell className="space-y-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          
                          <Select
                            defaultValue={admin.status}
                            onValueChange={(value: StaffStatus) =>
                              updateStatusMutation.mutate({ id: admin.id, status: value })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="h-9 w-[160px] justify-between">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                              <SelectItem value="inactive">{STATUS_LABELS.inactive}</SelectItem>
                              <SelectItem value="suspended">{STATUS_LABELS.suspended}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(admin)}
                            disabled={editMutation.isPending && editingStaff?.id === admin.id}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(admin.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Xóa"
                            )}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Trạng thái: {STATUS_LABELS[admin.status] ?? admin.status}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(editingStaff)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật quản trị viên</DialogTitle>
            <DialogDescription>Điều chỉnh thông tin liên hệ và trạng thái hoạt động của tài khoản.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ và tên</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="0909 xxx xxx"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <Select
                value={editForm.status}
                onValueChange={(value: StaffStatus) => setEditForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                  <SelectItem value="inactive">{STATUS_LABELS.inactive}</SelectItem>
                  <SelectItem value="suspended">{STATUS_LABELS.suspended}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Để trống nếu không thay đổi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
                <Input
                  type="password"
                  value={editForm.password_confirmation}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, password_confirmation: e.target.value }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={editMutation.isPending}>
              Hủy
            </Button>
            <Button onClick={handleEditSubmit} disabled={editMutation.isPending}>
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

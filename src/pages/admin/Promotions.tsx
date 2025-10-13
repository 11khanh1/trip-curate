import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Percent, Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  deleteAdminPromotion,
  type AdminPromotion,
  type PaginatedResponse,
} from "@/services/adminApi";

type PromotionForm = {
  name: string;
  discountValue: number;
  isPercentage: boolean;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  maxUsage: string;
  isActive: boolean;
};

type NormalizedPromotion = {
  id: string;
  name: string;
  code: string;
  discountType: "percent" | "fixed" | string;
  discountLabel: string;
  value: number;
  description: string;
  used: number;
  maxUsage: number | null;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
};

const normalizePromotion = (promotion: AdminPromotion): NormalizedPromotion => {
  const value = Number(promotion.value ?? 0);
  const rawType = (promotion.discount_type ?? "percent").toLowerCase();
  const discountType = rawType === "percentage" ? "percent" : (rawType as "percent" | "fixed" | string);
  const discountLabel =
    discountType === "percent"
      ? `${value}%`
      : `₫${value.toLocaleString("vi-VN")}`;

  return {
    id: String(promotion.id),
    name: (promotion as any).name ?? promotion.code,
    code: promotion.code,
    discountType,
    discountLabel,
    value,
    description: (promotion as any).description ?? "",
    used: promotion.used ?? 0,
    maxUsage: promotion.max_usage ?? null,
    startDate: promotion.valid_from ? String(promotion.valid_from).slice(0, 10) : undefined,
    endDate: promotion.valid_to ? String(promotion.valid_to).slice(0, 10) : undefined,
    isActive: promotion.is_active ?? true,
  };
};

const initialFormData: PromotionForm = {
  name: "",
  discountValue: 10,
  isPercentage: true,
  code: "",
  description: "",
  startDate: "",
  endDate: "",
  maxUsage: "",
  isActive: true,
};

export default function Promotions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<NormalizedPromotion | null>(null);
  const [formData, setFormData] = useState<PromotionForm>(initialFormData);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const promotionsQuery = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: () => fetchAdminPromotions(),
  });

  const promotions = useMemo(() => {
    const response = promotionsQuery.data as PaginatedResponse<AdminPromotion> | undefined;
    const list = response?.data ?? [];
    return list.map(normalizePromotion);
  }, [promotionsQuery.data]);

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminPromotion({
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.isPercentage ? "percent" : "fixed",
        value: formData.discountValue,
        max_usage: formData.maxUsage ? Number(formData.maxUsage) : null,
        valid_from: formData.startDate || null,
        valid_to: formData.endDate || null,
        is_active: formData.isActive,
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo khuyến mãi", description: "Mã khuyến mãi mới đã được thêm." });
      setIsDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (err: any) => {
      console.error("Create promotion failed:", err);
      toast({
        title: "Không thể tạo khuyến mãi",
        description: err?.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingPromo) return Promise.resolve(null);
      return updateAdminPromotion(editingPromo.id, {
        discount_type: formData.isPercentage ? "percent" : "fixed",
        value: formData.discountValue,
        max_usage: formData.maxUsage ? Number(formData.maxUsage) : null,
        valid_from: formData.startDate || null,
        valid_to: formData.endDate || null,
        is_active: formData.isActive,
      });
    },
    onSuccess: () => {
      toast({ title: "Đã cập nhật khuyến mãi", description: "Thông tin khuyến mãi đã được thay đổi." });
      setEditingPromo(null);
      setIsDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (err: any) => {
      console.error("Update promotion failed:", err);
      toast({
        title: "Không thể cập nhật",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingPromo(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (promotion: NormalizedPromotion) => {
    setEditingPromo(promotion);
    setFormData({
      name: promotion.name,
      discountValue: promotion.value,
      isPercentage: promotion.discountType === "percent",
      code: promotion.code,
      description: promotion.description,
      startDate: promotion.startDate || "",
      endDate: promotion.endDate || "",
      maxUsage: promotion.maxUsage ? String(promotion.maxUsage) : "",
      isActive: promotion.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "discountValue" ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.code.trim()) {
      toast({
        title: "Thiếu mã khuyến mãi",
        description: "Vui lòng nhập mã khuyến mãi.",
        variant: "destructive",
      });
      return;
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      toast({
        title: "Khoảng thời gian không hợp lệ",
        description: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
        variant: "destructive",
      });
      return;
    }

    if (editingPromo) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminPromotion(id),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      toast({ title: "Đã xoá khuyến mãi", description: "Mã khuyến mãi đã được xoá khỏi hệ thống." });
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (err: any) => {
      console.error("Delete promotion failed:", err);
      toast({
        title: "Không thể xoá khuyến mãi",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (promotion: NormalizedPromotion) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xoá mã ${promotion.code}?`);
    if (!confirmed) return;
    deleteMutation.mutate(promotion.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Quản lý khuyến mãi</h2>
          <p className="text-sm text-muted-foreground">Tạo, chỉnh sửa và theo dõi hiệu suất mã giảm giá</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo khuyến mãi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}</DialogTitle>
              <DialogDescription>
                {editingPromo
                  ? "Điều chỉnh thông tin mã khuyến mãi hiện có."
                  : "Nhập thông tin để tạo mã khuyến mãi mới cho hệ thống."}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Mã khuyến mãi</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="SUMMER25"
                    required
                    disabled={Boolean(editingPromo)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Tên hiển thị</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Giảm giá mùa hè"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Nhập mô tả chi tiết điều kiện áp dụng..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[2fr,1fr,auto] items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="discountValue">Giá trị giảm</Label>
                  <div className="flex rounded-md shadow-sm">
                    <Input
                      id="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={handleChange}
                      min={formData.isPercentage ? 1 : 1000}
                      required
                      className="rounded-r-none"
                    />
                    <div className="inline-flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-muted-foreground">
                      {formData.isPercentage ? "%" : "VNĐ"}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxUsage">Giới hạn lượt dùng</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={formData.maxUsage}
                    min={1}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isPercentage: !prev.isPercentage }))
                  }
                >
                  <Percent className="h-4 w-4" />
                  Đổi loại
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Kích hoạt ngay</p>
                  <p className="text-xs text-muted-foreground">
                    Nếu tắt, mã sẽ lưu ở trạng thái nháp.
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingPromo ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo khuyến mãi"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promotionsQuery.isLoading ? (
          <div className="col-span-full flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách khuyến mãi...
          </div>
        ) : promotions.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Chưa có mã khuyến mãi nào. Nhấn nút &quot;Tạo khuyến mãi&quot; để bắt đầu.
            </CardContent>
          </Card>
        ) : (
          promotions.map((promo) => (
            <Card key={promo.id} className="relative overflow-hidden transition-shadow duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-primary/10" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{promo.name}</CardTitle>
                    <p className="mt-2 text-3xl font-bold text-primary">{promo.discountLabel}</p>
                  </div>
                  <Badge variant={promo.isActive ? "default" : "secondary"}>
                    {promo.isActive ? "Đang áp dụng" : "Ngưng hoạt động"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-primary/40 bg-muted/40 p-3">
                  <span className="text-xs text-muted-foreground">Mã sử dụng</span>
                  <span className="font-mono text-lg font-semibold">{promo.code}</span>
                </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Bắt đầu: <span className="text-foreground font-medium">{promo.startDate || "—"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Kết thúc: <span className="text-foreground font-medium">{promo.endDate || "—"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Đã sử dụng</p>
                    <p className="font-medium">{promo.used} lượt</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giới hạn</p>
                    <p className="font-medium">
                      {promo.maxUsage && promo.maxUsage > 0 ? promo.maxUsage : "Không giới hạn"}
                    </p>
                  </div>
                </div>

                {promo.description && (
                  <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">{promo.description}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(promo)}>
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(promo)}
                    disabled={isDeleting && deletingId === promo.id}
                  >
                    {isDeleting && deletingId === promo.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { MapPin, Sparkles, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategory,
  type PaginatedResponse,
} from "@/services/adminApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NormalizedCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  raw: AdminCategory;
};

const normalizeCategory = (category: AdminCategory): NormalizedCategory => {
  const parent = (category.parent as AdminCategory | undefined | null) ?? (category as any).parent ?? null;
  return {
    id: String(category.id),
    name: category.name ?? "Danh mục",
    slug: category.slug ?? "",
    parentId: category.parent_id ? String(category.parent_id) : null,
    parentName: parent ? parent.name ?? null : null,
    raw: category,
  };
};

export default function AdminCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const NO_PARENT_VALUE = "__none";

  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    parent_id: NO_PARENT_VALUE,
  });
  const [editingCategory, setEditingCategory] = useState<NormalizedCategory | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", parent_id: NO_PARENT_VALUE });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories(),
  });

  const categoriesResponse = categoriesQuery.data as PaginatedResponse<AdminCategory> | undefined;

  const categories = useMemo(() => {
    const list = categoriesResponse?.data ?? [];
    return list.map(normalizeCategory);
  }, [categoriesResponse]);

  const rootCategories = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

  const childCategories = useMemo(
    () => categories.filter((category) => category.parentId !== null),
    [categories],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminCategory({
        name: createForm.name.trim(),
        slug: createForm.slug.trim() || undefined,
        parent_id: createForm.parent_id === NO_PARENT_VALUE ? null : createForm.parent_id,
      }),
    onSuccess: () => {
      toast({
        title: "Đã tạo danh mục",
        description: "Danh mục mới đã được thêm vào hệ thống.",
      });
      setCreateForm({ name: "", slug: "", parent_id: NO_PARENT_VALUE });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      console.error("Create category failed:", err);
      toast({
        title: "Không thể tạo danh mục",
        description: err?.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingCategory) return Promise.resolve(null);
      return updateAdminCategory(editingCategory.id, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim() || undefined,
        parent_id: editForm.parent_id === NO_PARENT_VALUE ? null : editForm.parent_id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Đã cập nhật danh mục",
        description: "Thông tin danh mục đã được cập nhật.",
      });
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      console.error("Update category failed:", err);
      toast({
        title: "Không thể cập nhật danh mục",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast({
        title: "Đã xóa danh mục",
        description: "Danh mục đã được xóa khỏi hệ thống.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      console.error("Delete category failed:", err);
      toast({
        title: "Không thể xóa danh mục",
        description: err?.response?.data?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên danh mục.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  const openEditDialog = (category: NormalizedCategory) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      slug: category.slug,
      parent_id: category.parentId ?? NO_PARENT_VALUE,
    });
  };

  const parentOptions = useMemo(() => rootCategories, [rootCategories]);

  const totalCategories = categories.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Tổng danh mục" value={totalCategories} icon={MapPin} gradient />
        <StatCard title="Danh mục gốc" value={rootCategories.length} icon={Sparkles} />
        <StatCard title="Danh mục con" value={childCategories.length} icon={Tag} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm danh mục</CardTitle>
          <CardDescription>Tạo danh mục mới và cấu hình cấp cha nếu cần</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[2fr,2fr,2fr,auto]" onSubmit={handleCreate}>
            <Input
              placeholder="Tên danh mục (ví dụ: Du lịch sinh thái)"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Slug (tùy chọn)"
              value={createForm.slug}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <Select
              value={createForm.parent_id}
              onValueChange={(value) => setCreateForm((prev) => ({ ...prev, parent_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Danh mục cha (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT_VALUE}>Không có</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm mới"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
          <CardDescription>Hiển thị danh mục hiện có và quan hệ cấp cha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden grid-cols-[2fr,2fr,2fr,auto] bg-muted/70 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>Tên danh mục</span>
              <span>Slug</span>
              <span>Danh mục cha</span>
              <span>Hành động</span>
            </div>
            <div className="divide-y">
              {categoriesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách danh mục...
                </div>
              ) : categories.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Chưa có danh mục nào được tạo.
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="grid gap-4 px-4 py-4 text-sm md:grid-cols-[2fr,2fr,2fr,auto] md:items-center"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">Slug: {category.slug || "—"}</p>
                    </div>
                    <p className="hidden text-muted-foreground md:block">{category.slug || "—"}</p>
                    <p className="text-muted-foreground">{category.parentName || "Không có"}</p>
                    <div className="flex gap-2 md:justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Bạn có chắc muốn xóa danh mục "${category.name}"?`,
                          );
                          if (confirmed) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Xóa"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật danh mục</DialogTitle>
            <DialogDescription>Điều chỉnh tên, slug và danh mục cha.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tên danh mục</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input
                value={editForm.slug}
                onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="Tự động sinh nếu để trống"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Danh mục cha</label>
              <Select
                value={editForm.parent_id}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không có" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>Không có</SelectItem>
                  {parentOptions
                    .filter((option) => option.id !== editingCategory?.id)
                    .map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Hủy
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

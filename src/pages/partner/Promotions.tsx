import { useMemo, useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Gift,
  Plus,
  Loader2,
  Filter,
  Search,
  RefreshCcw,
  History,
  Copy,
  Trash2,
  Edit,
  CalendarRange,
  Sparkles,
  Zap,
  ListChecks,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatPromotionDate,
  resolvePromotionTypeText,
  resolvePromotionValueText,
  usePartnerPromotions,
  type PromotionStatusFilter,
  type PromotionTypeFilter,
  type PromotionFormState,
  type PromotionFilters,
  defaultPromotionFilters,
} from "@/hooks/usePartnerPromotions";
import type { PartnerPromotion } from "@/services/partnerApi";

const statusOptions: Array<{ label: string; value: PromotionStatusFilter }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang bật", value: "active" },
  { label: "Đang tắt", value: "inactive" },
  { label: "Sắp diễn ra", value: "upcoming" },
  { label: "Đã hết hạn", value: "expired" },
];

const typeOptions: Array<{ label: string; value: PromotionTypeFilter }> = [
  { label: "Mọi loại giảm", value: "all" },
  { label: "Giảm theo %", value: "percent" },
  { label: "Giảm cố định", value: "fixed" },
];

const promotionKindOptions: Array<{ label: string; value: "all" | "auto" | "voucher" }> = [
  { label: "Mọi hình thức", value: "all" },
  { label: "Giảm trực tiếp", value: "auto" },
  { label: "Voucher tặng", value: "voucher" },
];

export default function PartnerPromotionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPromotion, setHistoryPromotion] = useState<PartnerPromotion | null>(null);

  const {
    tours,
    isToursLoading,
    selectedTourId,
    selectTour,
    promotions,
    filteredPromotions,
    loadPromotions,
    isListLoading,
    isSaving,
    filters,
    setFilters,
    resetForm,
    formState,
    handleFormChange,
    editingPromotion,
    startEditPromotion,
    startClonePromotion,
    savePromotion,
    removePromotion,
    togglePromotion,
  } = usePartnerPromotions();

  const selectedTour = useMemo(
    () => tours.find((tour) => String(tour.id) === String(selectedTourId ?? "")),
    [tours, selectedTourId],
  );

  const metrics = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let upcoming = 0;
    let expired = 0;
    let totalUsage = 0;

    promotions.forEach((promotion) => {
      const start = promotion.valid_from ? Date.parse(promotion.valid_from) : null;
      const end = promotion.valid_to ? Date.parse(promotion.valid_to) : null;
      const isUpcoming = start !== null && start > now;
      const isExpired = end !== null && end < now;
      const isActive = Boolean(promotion.is_active) && !isUpcoming && !isExpired;

      if (isActive) active += 1;
      if (isUpcoming) upcoming += 1;
      if (isExpired) expired += 1;
      totalUsage += promotion.usage_count ?? 0;
    });

    return {
      total: promotions.length,
      active,
      upcoming,
      expired,
      usage: totalUsage,
    };
  }, [promotions]);

  const updateFilters = (payload: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...payload }));
  };

  const handleDateChange = (key: "from" | "to", value: string) => {
    setFilters((prev) => {
      const nextRange = { ...(prev.dateRange ?? {}) };
      if (value) {
        nextRange[key] = value;
      } else {
        delete nextRange[key];
      }
      const hasRange = nextRange.from || nextRange.to;
      return { ...prev, dateRange: hasRange ? nextRange : null };
    });
  };

  const handleClearFilters = () => {
    setFilters({ ...defaultPromotionFilters });
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    try {
      await savePromotion();
      setIsFormOpen(false);
    } catch {
      // keep sheet open for the user to fix validation errors
    }
  };

  const handleOpenCreate = () => {
    resetForm({
      tour_ids:
        selectedTourId !== null && selectedTourId !== undefined ? [String(selectedTourId)] : [],
    });
    setIsFormOpen(true);
  };

  const handleEdit = (promotion: PartnerPromotion) => {
    startEditPromotion(promotion);
    setIsFormOpen(true);
  };

  const handleClone = (promotion: PartnerPromotion) => {
    startClonePromotion(promotion);
    setIsFormOpen(true);
  };

  const handleHistory = (promotion: PartnerPromotion) => {
    setHistoryPromotion(promotion);
    setIsHistoryOpen(true);
  };

  const handleDelete = async (promotion: PartnerPromotion) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xoá khuyến mãi này?");
    if (!confirmed) return;
    try {
      await removePromotion(promotion);
    } catch {
      // toast already handled inside hook
    }
  };

  const handleRefresh = async () => {
    await loadPromotions();
  };

  const selectedTourValue =
    selectedTourId !== null && selectedTourId !== undefined ? String(selectedTourId) : "all";

  const handleTourCheckboxChange = (tourId: string, checked: CheckedState) => {
    const isChecked = checked === true;
    handleFormChange(
      "tour_ids",
      isChecked
        ? Array.from(new Set([...formState.tour_ids, tourId]))
        : formState.tour_ids.filter((id) => id !== tourId),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            Quản lý ưu đãi tự động cho đối tác
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Khuyến mãi của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi hiệu suất ưu đãi, tạo mới hoặc nhân bản khuyến mãi cho từng tour.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isListLoading}>
            {isListLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Làm mới
              </>
            )}
          </Button>
          <Button onClick={handleOpenCreate} disabled={tours.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo khuyến mãi
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khuyến mãi</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Bao gồm cả khuyến mãi đã hết hạn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.active}</div>
            <p className="text-xs text-muted-foreground">Được áp dụng ngay khi khách đặt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sắp diễn ra</CardTitle>
            <CalendarRange className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.upcoming}</div>
            <p className="text-xs text-muted-foreground">Bắt đầu trong tương lai gần</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lượt sử dụng</CardTitle>
            <ListChecks className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.usage}</div>
            <p className="text-xs text-muted-foreground">Tổng số booking đã dùng ưu đãi</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Bộ lọc khuyến mãi
          </CardTitle>
          <CardDescription>
            Lọc theo tour, trạng thái, loại ưu đãi hoặc mốc thời gian để tìm nhanh khuyến mãi cần chỉnh sửa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tour</Label>
              <Select
                value={selectedTourValue}
                onValueChange={(value) => selectTour(value === "all" ? null : value)}
                disabled={isToursLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isToursLoading ? "Đang tải tour..." : "Chọn tour cần quản lý"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tour</SelectItem>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={String(tour.id)}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Mã khuyến mãi, mô tả..."
                  value={filters.search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value as PromotionStatusFilter })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Hình thức ưu đãi</Label>
              <Select
                value={filters.promotionType}
                onValueChange={(value) =>
                  updateFilters({ promotionType: value as PromotionFilters["promotionType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {promotionKindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Loại giảm giá</Label>
              <Select
                value={filters.discountType}
                onValueChange={(value) => updateFilters({ discountType: value as PromotionTypeFilter })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={filters.dateRange?.from ?? ""}
                onChange={(event) => handleDateChange("from", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={filters.dateRange?.to ?? ""}
                onChange={(event) => handleDateChange("to", event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <div>
              {selectedTourId === null ? (
                "Đang xem ưu đãi của tất cả tour."
              ) : selectedTour ? (
                <>
                  Đang xem ưu đãi của <span className="font-medium text-foreground">{selectedTour.title}</span>
                </>
              ) : (
                "Chọn một tour để xem và tạo khuyến mãi."
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Danh sách khuyến mãi
          </CardTitle>
          <CardDescription>Quản lý nhanh trạng thái, chỉnh sửa hoặc nhân bản khuyến mãi.</CardDescription>
      </CardHeader>
      <CardContent>
        {tours.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium text-foreground">Chưa có tour nào để áp dụng khuyến mãi.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tạo tour mới trước khi cấu hình ưu đãi cho khách hàng.
            </p>
          </div>
        ) : isListLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải khuyến mãi...
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium text-foreground">Chưa có khuyến mãi nào phù hợp bộ lọc.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Thử xoá bộ lọc hoặc tạo khuyến mãi mới cho các tour đã chọn.
            </p>
            <Button className="mt-4" onClick={handleOpenCreate} disabled={tours.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo khuyến mãi đầu tiên
            </Button>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khuyến mãi</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead>Áp dụng cho tour</TableHead>
                  <TableHead>Loại giảm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Số lượt dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="font-medium">{promotion.code ?? "Tự động"}</div>
                      <p className="text-xs text-muted-foreground">
                        {promotion.description && promotion.description.trim().length > 0
                          ? promotion.description
                          : "Chưa có mô tả."}
                      </p>
                    </TableCell>
                    <TableCell className="space-y-1 text-sm">
                      <Badge variant="outline">
                        {(promotion.type ?? "auto") === "voucher" ? "Voucher tặng" : "Giảm trực tiếp"}
                      </Badge>
                      {promotion.auto_issue_on_cancel && (
                        <p className="text-xs text-orange-600">Tự phát voucher khi tour bị huỷ</p>
                      )}
                    </TableCell>
                    <TableCell className="space-y-1 text-sm">
                      {Array.isArray(promotion.tours) && promotion.tours.length > 0 ? (
                        promotion.tours.map((tour) => (
                          <Badge key={tour.id} variant="secondary" className="mr-1">
                            {tour.title ?? `Tour #${tour.id}`}
                          </Badge>
                        ))
                      ) : selectedTour ? (
                        <Badge variant="secondary">{selectedTour.title}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Đang cập nhật</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold">
                        {resolvePromotionValueText(promotion)}
                      </div>
                      <Badge variant="outline">{resolvePromotionTypeText(promotion.discount_type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPromotionDate(promotion.valid_from)} – {formatPromotionDate(promotion.valid_to)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{promotion.usage_count ?? 0}</TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={200}>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Switch
                                checked={Boolean(promotion.is_active)}
                                onCheckedChange={(checked) => {
                                  void togglePromotion(promotion, checked);
                                }}
                                disabled={isSaving}
                                aria-label="Bật/tắt khuyến mãi"
                              />
                            </TooltipTrigger>
                            <TooltipContent>{promotion.is_active ? "Tạm tắt khuyến mãi" : "Kích hoạt khuyến mãi"}</TooltipContent>
                          </Tooltip>
                          <Badge variant={promotion.is_active ? "default" : "secondary"}>
                            {promotion.is_active ? "Đang bật" : "Tạm tắt"}
                          </Badge>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={200}>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleHistory(promotion)}
                                aria-label="Xem lịch sử áp dụng"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem lịch sử áp dụng</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleClone(promotion)}
                                aria-label="Nhân bản khuyến mãi"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Nhân bản khuyến mãi</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(promotion)}
                                aria-label="Chỉnh sửa khuyến mãi"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Chỉnh sửa khuyến mãi</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => void handleDelete(promotion)}
                                aria-label="Xoá khuyến mãi"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xoá khuyến mãi</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      </Card>

      <Sheet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            resetForm({
              tour_ids:
                selectedTourId !== null && selectedTourId !== undefined ? [String(selectedTourId)] : [],
            });
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle>
              {editingPromotion ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}
            </SheetTitle>
            <SheetDescription>Chọn ít nhất một tour để áp dụng khuyến mãi. Bạn có thể áp dụng cho nhiều tour cùng lúc.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hình thức khuyến mãi</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(value) =>
                      handleFormChange("type", value as PromotionFormState["type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Giảm trực tiếp trên tour</SelectItem>
                      <SelectItem value="voucher">Voucher tặng khách</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch
                      checked={formState.is_active}
                      onCheckedChange={(checked) => handleFormChange("is_active", checked)}
                    />
                    <span className="text-sm">{formState.is_active ? "Đang bật" : "Tạm tắt"}</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Loại giảm giá</Label>
                  <Select
                    value={formState.discount_type}
                    onValueChange={(value) =>
                      handleFormChange("discount_type", value as PromotionFormState["discount_type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Giảm theo %</SelectItem>
                      <SelectItem value="fixed">Giảm cố định</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={formState.discount_type === "fixed" ? "500000" : "15"}
                    value={formState.value}
                    onChange={(event) => handleFormChange("value", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Số lượt tối đa</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Không giới hạn"
                    value={formState.max_usage}
                    onChange={(event) => handleFormChange("max_usage", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tự phát voucher khi huỷ</Label>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch
                      checked={formState.auto_issue_on_cancel}
                      onCheckedChange={(checked) =>
                        handleFormChange("auto_issue_on_cancel", checked === true)
                      }
                      disabled={formState.type !== "voucher"}
                    />
                    <span className="text-sm">
                      {formState.type === "voucher"
                        ? "Bật để gửi voucher khi tour bị huỷ"
                        : "Chỉ áp dụng cho voucher"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tour áp dụng</Label>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="space-y-2 p-3">
                    {tours.map((tour) => (
                      <label key={tour.id} className="flex items-center gap-2 text-sm font-medium">
                        <Checkbox
                          checked={formState.tour_ids.includes(String(tour.id))}
                          onCheckedChange={(checked) => handleTourCheckboxChange(String(tour.id), checked)}
                        />
                        <span>{tour.title}</span>
                      </label>
                    ))}
                    {tours.length === 0 && (
                      <p className="text-xs text-muted-foreground">Chưa có tour khả dụng.</p>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  Bắt buộc chọn ít nhất một tour. Bạn có thể áp dụng cho nhiều tour cùng lúc.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={formState.valid_from}
                    onChange={(event) => handleFormChange("valid_from", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={formState.valid_to}
                    onChange={(event) => handleFormChange("valid_to", event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  placeholder="Ghi chú nội bộ hoặc mô tả để hiển thị"
                  value={formState.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={isSaving || formState.tour_ids.length === 0}>
                  {isSaving ? "Đang lưu..." : editingPromotion ? "Lưu thay đổi" : "Tạo khuyến mãi"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm({
                      tour_ids:
                        selectedTourId !== null && selectedTourId !== undefined
                          ? [String(selectedTourId)]
                          : [],
                    });
                    setIsFormOpen(false);
                  }}
                >
                  Huỷ
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Lịch sử khuyến mãi {historyPromotion?.code ?? historyPromotion?.id ?? ""}
            </DialogTitle>
            <DialogDescription>
              Theo dõi trạng thái và số lượt đã dùng của khuyến mãi này.
            </DialogDescription>
          </DialogHeader>
          {historyPromotion ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái hiện tại</span>
                <Badge variant={historyPromotion.is_active ? "default" : "secondary"}>
                  {historyPromotion.is_active ? "Đang bật" : "Tạm tắt"}
                </Badge>
              </div>
              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Áp dụng từ</span>
                  <span className="font-medium">{formatPromotionDate(historyPromotion.valid_from)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đến ngày</span>
                  <span className="font-medium">{formatPromotionDate(historyPromotion.valid_to)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đã dùng</span>
                  <span className="font-medium">{historyPromotion.usage_count ?? 0} lượt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loại ưu đãi</span>
                  <span className="font-medium">{resolvePromotionTypeText(historyPromotion.discount_type)}</span>
                </div>
              </div>
              <div>
                <Label>Mô tả</Label>
                <p className="mt-1 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {historyPromotion.description && historyPromotion.description.trim().length > 0
                    ? historyPromotion.description
                    : "Chưa có mô tả cho khuyến mãi này."}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa chọn khuyến mãi để xem chi tiết.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeCheck, Check, Eye, Loader2, RefreshCcw, Search, X } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPartnerBookings,
  PartnerBooking,
  PartnerBookingStatus,
  updatePartnerBookingStatus,
} from "@/services/partnerApi";

type StatusFilter = "all" | PartnerBookingStatus;

const PARTNER_STATUS_VALUES: PartnerBookingStatus[] = ["pending", "confirmed", "cancelled", "completed"];

const STATUS_BADGE_MAP: Record<
  PartnerBookingStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Chờ xác nhận", variant: "secondary" },
  confirmed: { label: "Đã xác nhận", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

const PAYMENT_BADGE_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  paid: { label: "Đã thanh toán", variant: "default" },
  pending: { label: "Đang xử lý", variant: "secondary" },
  unpaid: { label: "Chưa thanh toán", variant: "outline" },
  refunded: { label: "Đã hoàn tiền", variant: "outline" },
  failed: { label: "Thanh toán thất bại", variant: "destructive" },
};

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: STATUS_BADGE_MAP.pending.label },
  { value: "confirmed", label: STATUS_BADGE_MAP.confirmed.label },
  { value: "cancelled", label: STATUS_BADGE_MAP.cancelled.label },
  { value: "completed", label: STATUS_BADGE_MAP.completed.label },
];

const isPartnerStatus = (value: string): value is PartnerBookingStatus => {
  return PARTNER_STATUS_VALUES.includes(value as PartnerBookingStatus);
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const formatCurrency = (value: unknown) => {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numeric);
  } catch {
    return `${numeric.toLocaleString("vi-VN")}₫`;
  }
};

const formatDateTime = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const resolveBookingCode = (booking: PartnerBooking) => {
  if (typeof booking.code === "string" && booking.code.trim().length > 0) return booking.code;
  if (typeof booking.uuid === "string" && booking.uuid.trim().length > 0) return booking.uuid;
  if (booking.id !== undefined && booking.id !== null) return String(booking.id);
  return "—";
};

const resolveCustomerName = (booking: PartnerBooking) => {
  const candidates: Array<unknown> = [
    booking.contact_name,
    booking.contact_email,
    booking.contact?.name,
    booking.contact?.full_name,
    booking.contact?.company_name,
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof found === "string" ? found : "—";
};

const resolveTourTitle = (booking: PartnerBooking) => {
  const title = booking.tour?.title ?? booking.tour?.name ?? booking.tour?.display_name;
  return typeof title === "string" && title.trim().length > 0 ? title : "—";
};

const resolveBookingDate = (booking: PartnerBooking) => {
  return booking.booked_at ?? booking.booking_date ?? booking.created_at ?? booking.updated_at ?? null;
};

const resolveGuestCount = (booking: PartnerBooking) => {
  const adults =
    toNumber(booking.total_adults) ??
    toNumber(booking.adults) ??
    (Array.isArray(booking.passengers)
      ? booking.passengers.filter((passenger) => passenger.type !== "child").length
      : null);
  const children =
    toNumber(booking.total_children) ??
    toNumber(booking.children) ??
    (Array.isArray(booking.passengers)
      ? booking.passengers.filter((passenger) => passenger.type === "child").length
      : null);

  const total = (adults ?? 0) + (children ?? 0);
  if (total > 0) return total;
  if (Array.isArray(booking.passengers) && booking.passengers.length > 0) {
    return booking.passengers.length;
  }
  return null;
};

const resolveTotalAmount = (booking: PartnerBooking) => {
  return (
    toNumber(booking.total_amount) ??
    toNumber(booking.total_price) ??
    toNumber((booking as Record<string, unknown>)?.["amount"]) ??
    null
  );
};

const getStatusBadge = (status: PartnerBooking["status"]) => {
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (isPartnerStatus(normalized)) {
      return STATUS_BADGE_MAP[normalized];
    }
    return { label: status, variant: "outline" as const };
  }
  return { label: "Không xác định", variant: "outline" as const };
};

const getPaymentBadge = (status: unknown) => {
  if (typeof status !== "string" || status.trim() === "") {
    return { label: "—", variant: "outline" as const };
  }
  const normalized = status.toLowerCase();
  if (PAYMENT_BADGE_MAP[normalized]) {
    return PAYMENT_BADGE_MAP[normalized];
  }
  return { label: status, variant: "outline" as const };
};

const normalizeStatusForFilter = (status: PartnerBooking["status"]): StatusFilter => {
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (isPartnerStatus(normalized)) {
      return normalized;
    }
  }
  return "pending";
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown; error?: unknown } | undefined;
    const candidate = data?.message ?? data?.error ?? error.message;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
    return "Máy chủ không phản hồi. Vui lòng thử lại sau.";
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
};

export default function PartnerBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState<{ id: string | number | null; status: PartnerBookingStatus | null }>({
    id: null,
    status: null,
  });

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchPartnerBookings();
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Không thể tải đơn đặt",
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const normalizedStatus = normalizeStatusForFilter(booking.status);
      if (statusFilter !== "all" && normalizedStatus !== statusFilter) {
        return false;
      }
      if (keyword.length === 0) return true;

      const code = resolveBookingCode(booking).toLowerCase();
      const customer = resolveCustomerName(booking).toLowerCase();
      const tourTitle = resolveTourTitle(booking).toLowerCase();
      const destination =
        typeof booking.tour?.destination === "string" ? booking.tour.destination.toLowerCase() : "";

      return [code, customer, tourTitle, destination].some((value) => value.includes(keyword));
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleStatusUpdate = useCallback(
    async (bookingId: string | number, nextStatus: PartnerBookingStatus) => {
      setUpdating({ id: bookingId, status: nextStatus });
      try {
        const { booking: updatedBooking, message } = await updatePartnerBookingStatus(bookingId, {
          status: nextStatus,
        });

        if (updatedBooking) {
          setBookings((prev) =>
            prev.map((item) => (String(item.id) === String(bookingId) ? { ...item, ...updatedBooking } : item)),
          );
        } else {
          await loadBookings();
        }

        const successLabel = STATUS_BADGE_MAP[nextStatus]?.label ?? nextStatus;
        toast({
          title: "Cập nhật thành công",
          description: message ?? `Đơn hàng đã chuyển sang trạng thái "${successLabel}".`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Cập nhật thất bại",
          description: getErrorMessage(error),
        });
      } finally {
        setUpdating({ id: null, status: null });
      }
    },
    [toast, loadBookings],
  );

  const handleRefresh = useCallback(() => {
    void loadBookings();
  }, [loadBookings]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Danh sách đơn đặt</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm mã đơn, khách hàng, tour..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                <span className="hidden sm:inline">Tải lại</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Đang tải danh sách đơn đặt...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchTerm.trim().length > 0 ? "Không tìm thấy đơn phù hợp." : "Chưa có đơn đặt nào."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Mã đơn</th>
                    <th className="p-3 text-left text-sm font-medium">Khách hàng</th>
                    <th className="p-3 text-left text-sm font-medium">Tour</th>
                    <th className="p-3 text-left text-sm font-medium">Ngày đặt</th>
                    <th className="p-3 text-left text-sm font-medium">Số khách</th>
                    <th className="p-3 text-left text-sm font-medium">Tổng tiền</th>
                    <th className="p-3 text-left text-sm font-medium">Trạng thái</th>
                    <th className="p-3 text-left text-sm font-medium">Thanh toán</th>
                    <th className="p-3 text-left text-sm font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    const paymentBadge = getPaymentBadge(booking.payment_status);
                    const guestCount = resolveGuestCount(booking);
                    const normalizedStatus = normalizeStatusForFilter(booking.status);
                    const isRowUpdating =
                      updating.id !== null && String(updating.id) === String(booking.id) && updating.status !== null;
                    const isMutatingTo = (target: PartnerBookingStatus) =>
                      isRowUpdating && updating.status === target;

                    return (
                      <tr key={resolveBookingCode(booking)} className="border-t transition-colors hover:bg-muted/30">
                        <td className="p-3 font-mono text-sm font-semibold">{resolveBookingCode(booking)}</td>
                        <td className="p-3 text-sm">{resolveCustomerName(booking)}</td>
                        <td className="p-3 text-sm">{resolveTourTitle(booking)}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDateTime(resolveBookingDate(booking))}
                        </td>
                        <td className="p-3 text-sm">{guestCount ? `${guestCount} khách` : "—"}</td>
                        <td className="p-3 text-sm font-semibold text-primary">
                          {formatCurrency(resolveTotalAmount(booking))}
                        </td>
                        <td className="p-3">
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={paymentBadge.variant}>{paymentBadge.label}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Xem chi tiết" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {normalizedStatus === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                title="Xác nhận đơn"
                                onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                disabled={isRowUpdating}
                              >
                                {isMutatingTo("confirmed") ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {(normalizedStatus === "pending" || normalizedStatus === "confirmed") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-red-700"
                                title="Hủy đơn"
                                onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                disabled={isRowUpdating}
                              >
                                {isMutatingTo("cancelled") ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {normalizedStatus === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                title="Hoàn thành đơn"
                                onClick={() => handleStatusUpdate(booking.id, "completed")}
                                disabled={isRowUpdating}
                              >
                                {isMutatingTo("completed") ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <BadgeCheck className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

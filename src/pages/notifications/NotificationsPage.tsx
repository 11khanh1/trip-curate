import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fetchNotifications,
  fetchNotificationSettings,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  toggleNotifications,
  type NotificationPayload,
  type NotificationListResponse,
  type UnreadCountResponse,
  type NotificationToggleResponse,
} from "@/services/notificationApi";
import { Loader2, BellRing, BellOff, ArrowRight, Inbox, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getNotificationCopy, getNotificationTypeLabel } from "@/lib/notification-utils";
import { useUser } from "@/context/UserContext";

const PER_PAGE = 5;

const renderRelativeTime = (value?: string | null) => {
  if (!value) return "Vừa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
};

const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const canFetchNotifications = Boolean(currentUser);

  const notificationAudience = useMemo(() => {
    const role = currentUser?.role?.toLowerCase() ?? "";
    if (role.includes("admin")) return "admin";
    if (role.includes("partner")) return "partner";
    return "customer";
  }, [currentUser]);

  const notificationsQuery = useQuery<NotificationListResponse>({
    queryKey: ["notifications", { page, per_page: PER_PAGE, audience: notificationAudience }],
    queryFn: () =>
      fetchNotifications({
        page,
        per_page: PER_PAGE,
        audience: notificationAudience,
      }),
    enabled: canFetchNotifications,
  });

  const unreadQuery = useQuery<UnreadCountResponse>({
    queryKey: ["notifications-unread"],
    queryFn: () => fetchUnreadCount(),
    refetchInterval: 60000,
  });

  const settingsQuery = useQuery<NotificationToggleResponse>({
    queryKey: ["notifications-settings"],
    queryFn: () => fetchNotificationSettings(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread"],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread"],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleNotifications(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications-settings"], data);
    },
  });

  const notificationsEnabled =
    typeof settingsQuery.data?.enabled === "boolean"
      ? settingsQuery.data.enabled
      : typeof notificationsQuery.data?.enabled === "boolean"
      ? notificationsQuery.data.enabled
      : true;

  const notifications = notificationsQuery.data?.data ?? [];
  const filteredNotifications = useMemo(() => {
    if (!notifications.length) return [];
    return notifications.filter((item) => {
      const audience = (item.data as Record<string, unknown> | undefined)?.audience;
      if (typeof audience === "string" && audience.trim().length > 0) {
        return audience === notificationAudience;
      }
      // Giữ lại thông báo cũ chưa có audience sau khi deploy
      return true;
    });
  }, [notifications, notificationAudience]);
  const unreadCount = unreadQuery.data?.unread ?? 0;

  const meta = notificationsQuery.data?.meta ?? {};
  const currentPage =
    typeof meta?.current_page === "number" && meta.current_page > 0 ? meta.current_page : page;
  const lastPageMeta =
    typeof meta?.last_page === "number" && meta.last_page > 0 ? meta.last_page : null;
  const totalPages =
    lastPageMeta ??
    (filteredNotifications.length === PER_PAGE ? currentPage + 1 : currentPage);
  const hasNextPage = totalPages
    ? currentPage < totalPages
    : filteredNotifications.length === PER_PAGE;
  const hasPrevPage = currentPage > 1;
  const pageNumbers = useMemo(() => {
    const maxPage = Math.max(totalPages ?? 1, 1);
    if (maxPage <= 6) {
      return Array.from({ length: maxPage }, (_, index) => index + 1);
    }
    const pages = new Set<number>([1, maxPage, currentPage]);
    for (let offset = -2; offset <= 2; offset += 1) {
      const candidate = currentPage + offset;
      if (candidate > 1 && candidate < maxPage) pages.add(candidate);
    }
    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  const isLoading = notificationsQuery.isLoading;
  const isError = Boolean(notificationsQuery.error);

  const handleGoToPage = (target: number) => {
    const safeTotal = Math.max(totalPages ?? target, 1);
    const next = Math.min(Math.max(1, target), safeTotal);
    setPage(next);
  };

const handleItemClick = (notification: NotificationPayload) => {
  const data = (notification.data as Record<string, unknown> | undefined) ?? {};
  const bookingId = (data["booking_id"] ?? data["bookingId"]) as string | undefined;
  const tourId = (data["tour_id"] ?? data["tourId"]) as string | undefined;
  const isPartner = currentUser?.role?.toLowerCase().includes("partner");

  if (bookingId) {
    const target = isPartner
      ? `/partner/bookings?bookingId=${encodeURIComponent(bookingId)}`
      : `/bookings/${bookingId}`;
    navigate(target);
    return;
  }

  if (tourId) {
    const target = isPartner ? "/partner/activities" : `/activity/${tourId}`;
    navigate(target);
    return;
  }

  const fallback = typeof data.link === "string" ? data.link : null;
  if (fallback) {
    navigate(fallback);
  }
};

  const summaryItems = useMemo(
    () => [
      {
        label: "Tổng chưa đọc",
        value: unreadCount,
        icon: BellRing,
        accent: "text-primary",
      },
      {
        label: "Đã đọc gần đây",
        value: filteredNotifications.filter((item) => item.read_at).length,
        icon: CheckCircle,
        accent: "text-emerald-600",
      },
    ],
    [filteredNotifications, unreadCount],
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <TravelHeader />
      <main className="flex-1 py-10">
        <div className="container mx-auto flex flex-col gap-6 px-4 lg:flex-row">
          <aside className="lg:w-80">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg font-semibold">Trung tâm thông báo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quản lý cách bạn nhận các nhắc nhở từ VietTravel
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Nhận thông báo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bật để hệ thống tiếp tục gửi cập nhật
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    disabled={toggleMutation.isPending}
                    onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                  />
                </div>
                <div className="space-y-4">
                  {summaryItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-2xl font-semibold text-foreground">
                            {item.value}
                          </p>
                        </div>
                        <Icon className={cn("h-6 w-6", item.accent)} />
                      </div>
                    );
                  })}
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Sự kiện gửi thông báo</p>
                  <ul className="list-disc pl-5">
                    <li>Tặng voucher khi tour bị huỷ tự động</li>
                    <li>Cập nhật trạng thái yêu cầu hoàn tiền</li>
                    <li>Thông báo phát hành hóa đơn điện tử</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </aside>
          <section className="flex-1">
            <Card className="h-full">
              <CardHeader className="flex flex-col gap-4 border-b border-dashed border-border md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold text-foreground">
                    Danh sách thông báo
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mỗi thông báo được lưu tối đa 30 ngày. Nhấn để xem chi tiết.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markAllMutation.isPending || filteredNotifications.length === 0}
                    onClick={() => markAllMutation.mutate()}
                  >
                    Đánh dấu tất cả đã đọc
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => notificationsQuery.refetch()}
                    disabled={notificationsQuery.isFetching}
                  >
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Đang tải thông báo...
                  </div>
                ) : isError ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Không thể tải dữ liệu</p>
                    <p className="text-xs text-muted-foreground">
                      Vui lòng thử lại hoặc kiểm tra kết nối mạng.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => notificationsQuery.refetch()}
                      disabled={notificationsQuery.isFetching}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BellOff className="h-10 w-10" />
                    <p className="text-sm">Hiện chưa có thông báo nào</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => {
                      const { title, message } = getNotificationCopy(notification);
                      const bookingId =
                        (notification.data?.["booking_id"] ??
                          notification.data?.["bookingId"]) as string | undefined;
                      const isRead = Boolean(notification.read_at);
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex flex-col gap-2 px-6 py-5 transition hover:bg-muted/50",
                            !isRead && "bg-primary/5",
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={isRead ? "secondary" : "default"}>
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                              {!isRead && (
                                <span className="text-xs font-medium text-primary">Mới</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {renderRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="text-sm text-muted-foreground">{message}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              onClick={() => handleItemClick(notification)}
                              disabled={!bookingId}
                            >
                              Xem chi tiết
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                            {!isRead && (
                              <Button
                                variant="link"
                                size="sm"
                                className="px-0 text-foreground"
                                onClick={() => markReadMutation.mutate(notification.id)}
                                disabled={markReadMutation.isPending}
                              >
                                Đánh dấu đã đọc
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
                <span className="text-muted-foreground">
                  Trang {currentPage}
                  {totalPages ? ` / ${totalPages}` : null}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrevPage || notificationsQuery.isFetching}
                    onClick={() => hasPrevPage && handleGoToPage(currentPage - 1)}
                  >
                    Trước
                  </Button>
                  {pageNumbers.map((pageNumber, index) => {
                    const prev = pageNumbers[index - 1];
                    const showEllipsis = prev && pageNumber - prev > 1;
                    return (
                      <div key={pageNumber} className="flex items-center gap-2">
                        {showEllipsis && <span className="text-muted-foreground">…</span>}
                        <Button
                          variant={pageNumber === currentPage ? "default" : "outline"}
                          size="sm"
                          disabled={notificationsQuery.isFetching}
                          onClick={() => handleGoToPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage || notificationsQuery.isFetching}
                    onClick={() => hasNextPage && handleGoToPage(currentPage + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;

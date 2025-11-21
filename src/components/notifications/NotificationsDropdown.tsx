import { useMemo, useState, type MouseEvent } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  toggleNotifications,
  type NotificationAudience,
  type NotificationPayload,
} from "@/services/notificationApi";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getNotificationCopy } from "@/lib/notification-utils";
import { useUser } from "@/context/UserContext";

const MAX_ITEMS = 8;
const tokenKey = "token";

const renderTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "HH:mm dd/MM/yyyy", { locale: vi });
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const hasAuthToken = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(tokenKey);
      return Boolean(raw && raw.trim().length > 0);
    } catch {
      return false;
    }
  }, []);
  const notificationAudience: NotificationAudience =
    currentUser?.role?.toLowerCase().includes("admin")
      ? "admin"
      : currentUser?.role?.toLowerCase().includes("partner")
      ? "partner"
      : "customer";
  const userScope = useMemo(() => {
    if (!currentUser) return hasAuthToken ? "token" : "guest";
    if (currentUser.id !== undefined && currentUser.id !== null) {
      return `user:${currentUser.id}`;
    }
    if (currentUser.email) {
      return `email:${currentUser.email}`;
    }
    return currentUser.name ? `name:${currentUser.name}` : "guest";
  }, [currentUser, hasAuthToken]);

  const canFetchNotifications = Boolean(currentUser?.id || currentUser?.email || hasAuthToken);

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread", userScope],
    queryFn: () => fetchUnreadCount(),
    refetchInterval: 60000,
    enabled: canFetchNotifications,
    retry: false,
  });

  const settingsQuery = useQuery({
    queryKey: ["notifications-settings", userScope],
    queryFn: async () => ({ enabled: true }),
    enabled: canFetchNotifications,
    retry: false,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userScope, { page: 1, audience: notificationAudience }],
    queryFn: async () => {
      const primary = await fetchNotifications({ per_page: MAX_ITEMS, audience: notificationAudience });
      const total = Number((primary.meta as Record<string, unknown> | undefined)?.total ?? primary.data?.length ?? 0);
      if ((primary.data?.length ?? 0) === 0 && total === 0) {
        // Fallback: thử lại không truyền audience nếu BE chưa lọc theo tham số này
        return fetchNotifications({ per_page: MAX_ITEMS });
      }
      return primary;
    },
    enabled: open && canFetchNotifications,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", userScope],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread", userScope],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", userScope],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread", userScope],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleNotifications(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications-settings", userScope], data);
    },
  });

  const fallbackNotifications: NotificationPayload[] = useMemo(
    () => [
      {
        id: "demo-tour-published",
        type: "booking_confirmation",
        created_at: new Date().toISOString(),
        data: {
          title: "Bạn đã đăng tour thành công",
          message: "Tour mới vừa gửi lên hệ thống và đang chờ đội ngũ VietTravel duyệt.",
          is_demo: true,
          link: "/partner/activities",
        },
      },
      {
        id: "demo-payment-success",
        type: "payment_status",
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        data: {
          title: "Thanh toán đặt tour thành công",
          message: "Đơn #VX-2305 đã được thanh toán đầy đủ. Hãy chuẩn bị cho khách của bạn nhé!",
          is_demo: true,
          link: "/bookings",
        },
      },
      {
        id: "demo-tour-completed",
        type: "booking_update",
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        data: {
          title: "Tour của bạn đã hoàn thành",
          message: "Khách vừa kết thúc hành trình. Đừng quên gửi lời cảm ơn và mời đánh giá.",
          is_demo: true,
          link: "/bookings",
        },
      },
      {
        id: "demo-tour-approved",
        type: "promotion_update",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: {
          title: "Tour đã được VietTravel duyệt",
          message: "Tour riêng ngắm bình minh ở Mũi Né đã được đưa lên trang chủ. Hãy kiểm tra lại thông tin.",
          is_demo: true,
          link: "/partner/activities",
        },
      },
    ],
    [],
  );

  const apiNotifications = notificationsQuery.data?.data ?? [];
  const filteredNotifications = apiNotifications.filter((item) => {
    const audience = (item.data as Record<string, unknown> | undefined)?.audience as string | undefined;
    if (!audience) return true;
    return audience === notificationAudience;
  });
  const shouldUseFallback =
    !canFetchNotifications && !notificationsQuery.isFetching && filteredNotifications.length === 0;
  const notifications = shouldUseFallback ? fallbackNotifications : filteredNotifications;
  const unread = shouldUseFallback ? fallbackNotifications.length : unreadQuery.data?.unread ?? 0;
  const notificationsEnabled =
    typeof settingsQuery.data?.enabled === "boolean"
      ? settingsQuery.data.enabled
      : typeof notificationsQuery.data?.enabled === "boolean"
      ? notificationsQuery.data.enabled
      : true;

  const resolveNotificationLink = (notification: NotificationPayload) => {
    const data = (notification.data as Record<string, unknown> | undefined) ?? {};
    const bookingId = (data["booking_id"] ?? data["bookingId"]) as string | undefined;
    const tourId = (data["tour_id"] ?? data["tourId"]) as string | undefined;
    const isPartner = currentUser?.role?.toLowerCase().includes("partner");

    if (bookingId) {
      return isPartner ? `/partner/bookings?bookingId=${encodeURIComponent(bookingId)}` : `/bookings/${bookingId}`;
    }
    if (tourId) {
      return isPartner ? `/partner/activities` : `/activity/${tourId}`;
    }
    const fallbackLink = typeof data.link === "string" ? data.link : null;
    return fallbackLink;
  };

  const handleItemClick = (notification: NotificationPayload) => {
    if (!notification.id) return;

    const notificationData = (notification.data as Record<string, unknown> | undefined) ?? {};
    const isDemoNotification = Boolean(notificationData.is_demo);
    const targetLink = resolveNotificationLink(notification);

    if (!isDemoNotification) {
      markReadMutation.mutate(notification.id);
    }

    if (targetLink) {
      navigate(targetLink);
      setOpen(false);
    }
  };

  const handleMarkReadOnly = (event: MouseEvent, notification: NotificationPayload) => {
    event.stopPropagation();
    event.preventDefault();
    if (!notification.id || markReadMutation.isPending) return;
    if (notification.read_at) return;
    markReadMutation.mutate(notification.id);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Thông báo</p>
            <p className="text-xs text-muted-foreground">
              {notificationsEnabled ? "Đang bật thông báo" : "Đã tắt thông báo"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Tắt</span>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              disabled={toggleMutation.isPending}
            />
            <span>Bật</span>
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/60" />
              Không có thông báo nào
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => {
                const { title, message } = getNotificationCopy(notification);
                const isRead = Boolean(notification.read_at);
                return (
                  <li
                    key={notification.id}
                    className={`cursor-pointer px-4 py-3 transition hover:bg-muted/60 ${
                      !isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleItemClick(notification)}
                  >
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{renderTime(notification.created_at)}</span>
                      {!isRead && notification.id ? (
                        <button
                          type="button"
                          onClick={(event) => handleMarkReadOnly(event, notification)}
                          className="text-primary hover:underline"
                          disabled={markReadMutation.isPending}
                        >
                          Đánh dấu đã đọc
                        </button>
                      ) : (
                        <span>Đã đọc</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            disabled={shouldUseFallback || markAllMutation.isPending || notifications.length === 0}
            onClick={() => markAllMutation.mutate()}
          >
            Đánh dấu đã đọc
          </Button>
          <Button variant="link" size="sm" onClick={handleViewAll}>
            Xem tất cả
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;

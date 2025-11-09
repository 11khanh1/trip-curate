import { useState } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationSettings,
  markNotificationRead,
  markAllNotificationsRead,
  toggleNotifications,
  type NotificationPayload,
} from "@/services/notificationApi";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const MAX_ITEMS = 8;

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

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60000,
  });

  const settingsQuery = useQuery({
    queryKey: ["notifications-settings"],
    queryFn: fetchNotificationSettings,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", { page: 1 }],
    queryFn: () => fetchNotifications({ per_page: MAX_ITEMS }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleNotifications(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications-settings"], data);
    },
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unread = unreadQuery.data?.unread ?? 0;
  const notificationsEnabled =
    settingsQuery.data?.notifications_enabled ??
    notificationsQuery.data?.notifications_enabled ??
    true;

  const handleItemClick = (notification: NotificationPayload) => {
    if (!notification.id) return;
    markReadMutation.mutate(notification.id);
    const bookingId = (notification.data?.["booking_id"] ??
      notification.data?.["bookingId"]) as string | undefined;
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
      setOpen(false);
    }
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
                const title =
                  (notification.data?.["title"] as string | undefined) ??
                  (notification.type === "voucher"
                    ? "Có voucher mới dành cho bạn"
                    : "Thông báo mới");
                const message =
                  (notification.data?.["message"] as string | undefined) ??
                  "Xem chi tiết để biết thêm thông tin.";
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
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {renderTime(notification.created_at)}
                    </p>
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
            disabled={markAllMutation.isPending || notifications.length === 0}
            onClick={() => markAllMutation.mutate()}
          >
            Đánh dấu đã đọc
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate("/notifications")}>
            Xem tất cả
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;

import { useMemo } from "react";
import { Bell, Loader2, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";

import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationPayload,
  type NotificationAudience,
} from "@/services/notificationApi";
import { getNotificationCopy, getNotificationTypeLabel, resolveNotificationLink } from "@/lib/notification-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/UserContext";

interface NotificationInboxProps {
  variant: "admin" | "partner";
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "Vừa xong";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
};

const variantLabel: Record<NotificationInboxProps["variant"], { title: string; empty: string }> = {
  admin: {
    title: "Thông báo hệ thống",
    empty: "Hiện chưa có cập nhật mới.",
  },
  partner: {
    title: "Thông báo đối tác",
    empty: "Chưa có thông báo nào.",
  },
};

const NotificationInbox = ({ variant }: NotificationInboxProps) => {
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const userScope = useMemo(() => {
    if (!currentUser) return "guest";
    if (currentUser.id !== undefined && currentUser.id !== null) {
      return `user:${currentUser.id}`;
    }
    if (currentUser.email) {
      return `email:${currentUser.email}`;
    }
    return currentUser.name ? `name:${currentUser.name}` : "guest";
  }, [currentUser]);

  const audience: NotificationAudience | undefined = variant === "partner" ? "partner" : undefined;

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread", variant, userScope],
    queryFn: () => fetchUnreadCount(),
    refetchInterval: 60000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userScope, variant, { per_page: 6, audience: audience ?? "all" }],
    queryFn: () => fetchNotifications({ per_page: 6, audience }),
    staleTime: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", userScope, variant],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread", variant, userScope],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", userScope, variant],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications-unread", variant, userScope],
      });
    },
  });

  const unread = unreadQuery.data?.unread ?? 0;
  const notifications = useMemo(
    () =>
      (notificationsQuery.data?.data ?? []).filter((item) => {
        const notifAudience = (item.data as Record<string, unknown> | undefined)?.audience as string | undefined;
        if (!audience) return true;
        if (!notifAudience) return true;
        return notifAudience === audience;
      }),
    [audience, notificationsQuery.data],
  );

  const { title, empty } = variantLabel[variant];

  const renderItem = (notification: NotificationPayload) => {
    const isRead = Boolean(notification.read_at);
    const { title: notifTitle, message } = getNotificationCopy(notification);
    const typeLabel = getNotificationTypeLabel(notification.type);
    const targetLink = resolveNotificationLink(notification, {
      role: currentUser?.role,
      audience: variant === "partner" ? "partner" : "admin",
    });
    return (
      <button
        key={notification.id}
        type="button"
        className={`w-full rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-primary/40 ${
          !isRead ? "bg-primary/5" : "bg-transparent"
        }`}
        onClick={() => {
          if (!isRead && notification.id) {
            markReadMutation.mutate(notification.id);
          }
          if (targetLink) {
            window.location.href = targetLink;
          }
        }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant={isRead ? "outline" : "default"} className="text-[10px] font-medium uppercase">
            {typeLabel}
          </Badge>
          <span>{formatRelativeTime(notification.created_at)}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground line-clamp-1">{notifTitle}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
      </button>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
          aria-label="Thông báo"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} thông báo chưa đọc` : "Đã cập nhật tất cả thông báo"}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={notifications.length === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Đọc hết
          </Button>
        </div>
        <ScrollArea className="max-h-[360px]">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
              <AlertCircle className="h-6 w-6" />
              {empty}
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-3 py-3">{notifications.map(renderItem)}</div>
          )}
        </ScrollArea>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Thông điệp ngắn gọn cho quản trị.</span>
          <Button variant="link" size="sm" className="text-primary" asChild>
            <Link to="/notifications">Xem tất cả</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationInbox;

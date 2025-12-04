import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchSupportTickets, updateSupportTicketStatus, type SupportTicket, type SupportTicketStatus } from "@/services/supportTicketApi";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, LifeBuoy, Filter } from "lucide-react";

const STATUS_META: Record<
  SupportTicketStatus,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: { label: "Mở", badge: "secondary" },
  in_progress: { label: "Đang xử lý", badge: "default" },
  resolved: { label: "Đã giải quyết", badge: "outline" },
  closed: { label: "Đã đóng", badge: "destructive" },
};

const SupportTicketsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all");

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets-admin"],
    queryFn: () => fetchSupportTickets({ per_page: 50 }),
    staleTime: 30 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicketStatus }) =>
      updateSupportTicketStatus(id, status),
    onSuccess: () => {
      toast({ title: "Đã cập nhật trạng thái" });
      queryClient.invalidateQueries({ queryKey: ["support-tickets-admin"] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Cập nhật trạng thái thất bại.");
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const tickets = ticketsQuery.data?.data ?? [];

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [statusFilter, tickets]);

  const summary = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Quản lý support tickets</h1>
            <p className="text-sm text-white/85">Theo dõi và đổi trạng thái yêu cầu hỗ trợ của khách</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white/15 p-3">
            <p className="text-xs text-white/80">Tổng</p>
            <p className="text-2xl font-semibold">{summary.total}</p>
          </div>
          <div className="rounded-lg bg-white/15 p-3">
            <p className="text-xs text-white/80">Mở</p>
            <p className="text-2xl font-semibold">{summary.open}</p>
          </div>
          <div className="rounded-lg bg-white/15 p-3">
            <p className="text-xs text-white/80">Đang xử lý</p>
            <p className="text-2xl font-semibold">{summary.inProgress}</p>
          </div>
          <div className="rounded-lg bg-white/15 p-3">
            <p className="text-xs text-white/80">Đã giải quyết</p>
            <p className="text-2xl font-semibold">{summary.resolved}</p>
          </div>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Danh sách tickets</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as SupportTicketStatus | "all")}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="open">Mở</SelectItem>
                  <SelectItem value="in_progress">Đang xử lý</SelectItem>
                  <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  <SelectItem value="closed">Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ticketsQuery.refetch()}
              disabled={ticketsQuery.isFetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {ticketsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-lg bg-slate-200/70" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
              Chưa có ticket nào hoặc không khớp bộ lọc.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket: SupportTicket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.booking_id ? `Booking: ${ticket.booking_id}` : "Không có mã đơn"}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      <div className="text-xs text-muted-foreground">
                        <span>Created: {ticket.created_at ?? "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-48">
                      <Badge variant={STATUS_META[ticket.status]?.badge ?? "secondary"}>
                        {STATUS_META[ticket.status]?.label ?? ticket.status}
                      </Badge>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) =>
                          updateStatusMutation.mutate({ id: ticket.id, status: value as SupportTicketStatus })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Đổi trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Mở</SelectItem>
                          <SelectItem value="in_progress">Đang xử lý</SelectItem>
                          <SelectItem value="resolved">Đã giải quyết</SelectItem>
                          <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketsAdmin;

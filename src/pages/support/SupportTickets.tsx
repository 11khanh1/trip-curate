import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchSupportTickets,
  fetchSupportTicketDetail,
  createSupportTicket,
  updateSupportTicketStatus,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/services/supportTicketApi";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";
import {
  Loader2,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

const STATUS_META: Record<
  SupportTicketStatus,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: { label: "Mở", badge: "secondary" },
  in_progress: { label: "Đang xử lý", badge: "default" },
  resolved: { label: "Đã giải quyết", badge: "outline" },
  closed: { label: "Đã đóng", badge: "destructive" },
};

const SupportTickets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser() as any;
  const isAdmin = (currentUser?.role ?? "").toString().toLowerCase() === "admin";

  const [page] = useState(1);
  const [perPage] = useState(15);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", { page, perPage }],
    queryFn: () => fetchSupportTickets({ page, per_page: perPage }),
    staleTime: 30 * 1000,
  });

  const detailQuery = useQuery({
    queryKey: ["support-ticket", selectedId],
    queryFn: () => fetchSupportTicketDetail(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      toast({ title: "Đã gửi yêu cầu hỗ trợ" });
      setSubject("");
      setMessage("");
      setBookingId("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Không thể gửi ticket, thử lại sau.");
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicketStatus }) =>
      updateSupportTicketStatus(id, status),
    onSuccess: () => {
      toast({ title: "Đã cập nhật trạng thái" });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["support-ticket", selectedId] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Cập nhật trạng thái thất bại.");
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  const tickets = ticketsQuery.data?.data ?? [];
  const isLoading = ticketsQuery.isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tiêu đề và nội dung.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      booking_id: bookingId.trim() ? bookingId.trim() : undefined,
    });
  };

  const statusOptions = useMemo(
    () => ["open", "in_progress", "resolved", "closed"] as SupportTicketStatus[],
    [],
  );

  const summary = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t: SupportTicket) => t.status === "open").length;
    const inProgress = tickets.filter((t: SupportTicket) => t.status === "in_progress").length;
    const resolved = tickets.filter((t: SupportTicket) => t.status === "resolved" || t.status === "closed").length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TravelHeader />
      <main className="container mx-auto px-4 py-10">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-500 text-white px-6 py-10 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                Trung tâm hỗ trợ VietTravel
              </div>
              <h1 className="text-3xl font-bold leading-tight lg:text-4xl">Gửi ticket & theo dõi xử lý</h1>
              <p className="text-white/90">
                Mô tả vấn đề, đính kèm mã đơn nếu có. Đội ngũ sẽ tiếp nhận và phản hồi nhanh nhất.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <ShieldCheck className="h-4 w-4" /> Ưu tiên đơn có mã booking
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                  <ClipboardList className="h-4 w-4" /> Theo dõi trạng thái realtime
                </span>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="rounded-lg bg-white/15 p-3">
                <p className="text-xs text-white/80">Tổng yêu cầu</p>
                <p className="text-2xl font-semibold">{summary.total}</p>
              </div>
              <div className="rounded-lg bg-white/15 p-3">
                <p className="text-xs text-white/80">Đang mở</p>
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
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Gửi yêu cầu hỗ trợ</h2>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tiêu đề *</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={255}
                    placeholder="Ví dụ: Không nhận được email xác nhận"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nội dung *</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Mô tả vấn đề bạn gặp phải..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mã đơn (tuỳ chọn)</label>
                  <Input
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="Nhập mã booking nếu có"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...
                    </>
                  ) : (
                    "Gửi ticket"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Danh sách yêu cầu</h2>
                  <p className="text-sm text-muted-foreground">Theo dõi các ticket bạn đã gửi.</p>
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

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-16 animate-pulse rounded-lg bg-slate-200/70" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  Bạn chưa có ticket nào. Hãy gửi yêu cầu để chúng tôi hỗ trợ.
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket: SupportTicket) => (
                    <div
                      key={ticket.id}
                      className="rounded-lg border border-slate-200 p-4 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition"
                      onClick={() => setSelectedId(ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-foreground">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.booking_id ? `Booking: ${ticket.booking_id}` : "Không có mã đơn"}
                          </p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={STATUS_META[ticket.status]?.badge ?? "secondary"}>
                            {STATUS_META[ticket.status]?.label ?? ticket.status}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết ticket</DialogTitle>
            <DialogDescription>Thông tin yêu cầu hỗ trợ của bạn</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{detailQuery.data.subject}</h3>
                <Badge variant={STATUS_META[detailQuery.data.status]?.badge ?? "secondary"}>
                  {STATUS_META[detailQuery.data.status]?.label ?? detailQuery.data.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailQuery.data.message}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Booking: {detailQuery.data.booking_id ?? "Không có"}</p>
                <p>Đã tạo: {detailQuery.data.created_at ?? "—"}</p>
                <p>Cập nhật: {detailQuery.data.updated_at ?? "—"}</p>
              </div>

              {isAdmin && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Cập nhật trạng thái</label>
                  <Select
                    value={detailQuery.data.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate({ id: detailQuery.data.id, status: value as SupportTicketStatus })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {STATUS_META[option]?.label ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive">Không tải được chi tiết ticket.</p>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SupportTickets;

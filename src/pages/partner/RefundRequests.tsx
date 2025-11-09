import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, FileText, Loader2, RefreshCcw, ShieldX } from "lucide-react";

import {
  fetchPartnerRefundRequests,
  updatePartnerRefundRequestStatus,
  type PartnerRefundRequest,
  type PartnerRefundRequestStatusPayload,
} from "@/services/partnerApi";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5MB

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  await_partner: "Chờ đối tác",
  await_customer_confirm: "Chờ khách xác nhận",
  completed: "Đã hoàn tất",
  rejected: "Từ chối",
};

const statusVariants: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pending: "outline",
  await_partner: "outline",
  await_customer_confirm: "secondary",
  completed: "default",
  rejected: "destructive",
};

const statusFilters = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "await_partner", label: "Chờ đối tác" },
  { value: "await_customer_confirm", label: "Chờ khách xác nhận" },
  { value: "completed", label: "Đã hoàn tất" },
  { value: "rejected", label: "Đã từ chối" },
];

const formatMoney = (value?: number | null, currency = "VND") => {
  if (typeof value !== "number") return "—";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString("vi-VN")} ${currency}`;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const PARTNER_REFUND_TIMELINE: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Tiếp nhận" },
  { key: "await_customer_confirm", label: "Đã chuyển khoản" },
  { key: "completed", label: "Khách xác nhận" },
];

const getPartnerTimelineIndex = (status?: string): number => {
  switch (status) {
    case "pending":
    case "await_partner":
      return 0;
    case "await_customer_confirm":
      return 1;
    case "completed":
    case "rejected":
      return 2;
    default:
      return -1;
  }
};

const PartnerRefundRequestsPage = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tourFilter, setTourFilter] = useState("");
  const [dialogAction, setDialogAction] = useState<{
    request: PartnerRefundRequest | null;
    status: PartnerRefundRequestStatusPayload["status"] | null;
  }>({ request: null, status: null });
  const [partnerMessage, setPartnerMessage] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["partner-refund-requests", statusFilter, tourFilter],
    queryFn: () =>
      fetchPartnerRefundRequests({
        status: statusFilter !== "all" ? statusFilter : undefined,
        tour_id: tourFilter.trim() ? tourFilter.trim() : undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: PartnerRefundRequestStatusPayload;
    }) => updatePartnerRefundRequestStatus(id, payload),
    onSuccess: () => {
      toast({
        title: "Cập nhật yêu cầu hoàn tiền thành công",
      });
      void refetch();
      closeDialog();
    },
    onError: (error: unknown) => {
      console.error("Không thể cập nhật yêu cầu hoàn tiền:", error);
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật trạng thái yêu cầu, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = useMemo(() => data ?? [], [data]);

  const handleOpenAction = (
    request: PartnerRefundRequest,
    status: PartnerRefundRequestStatusPayload["status"],
  ) => {
    setDialogAction({ request, status });
    setPartnerMessage("");
    setProofFile(null);
  };

  const closeDialog = () => {
    setDialogAction({ request: null, status: null });
    setPartnerMessage("");
    setProofFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_PROOF_SIZE) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn file nhỏ hơn 5MB (jpg, png hoặc pdf).",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }
    setProofFile(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialogAction.request || !dialogAction.status) return;
    if (dialogAction.status === "rejected" && partnerMessage.trim().length === 0) {
      toast({
        title: "Chưa nhập lý do",
        description: "Vui lòng ghi chú lý do từ chối.",
        variant: "destructive",
      });
      return;
    }
    if (dialogAction.status === "await_customer_confirm" && !proofFile) {
      toast({
        title: "Thiếu chứng từ",
        description: "Vui lòng tải lên chứng từ chuyển khoản trước khi xác nhận đã hoàn.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      id: dialogAction.request.id,
      payload: {
        status: dialogAction.status,
        partner_message: partnerMessage.trim() || undefined,
        proof: proofFile ?? undefined,
      },
    });
  };

  const summary = useMemo(() => {
    const total = data?.length ?? 0;
    const pending = data?.filter(
      (item) => item.status === "pending" || item.status === "await_partner",
    ).length ?? 0;
    const awaitingCustomer =
      data?.filter((item) => item.status === "await_customer_confirm").length ?? 0;
    const completed = data?.filter((item) => item.status === "completed").length ?? 0;
    return { total, pending, awaitingCustomer, completed };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCcw className="h-4 w-4 text-primary" />
            Hoàn tiền & chứng từ
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Yêu cầu hoàn tiền</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi và xử lý các yêu cầu hoàn tiền từ khách hàng, tải chứng từ và cập nhật trạng thái.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang làm mới
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Làm mới
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tổng yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Bao gồm mọi trạng thái</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.pending}</div>
            <p className="text-xs text-muted-foreground">Cần phản hồi của đối tác</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Chờ khách xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.awaitingCustomer}</div>
            <p className="text-xs text-muted-foreground">Đã chuyển khoản, chờ khách xác nhận</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Hoàn tất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.completed}</div>
            <p className="text-xs text-muted-foreground">Khách đã xác nhận nhận tiền</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Danh sách yêu cầu</CardTitle>
            <CardDescription>Lọc theo trạng thái hoặc tour để xử lý chính xác.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={tourFilter}
              onChange={(event) => setTourFilter(event.target.value)}
              placeholder="Tour ID"
              className="w-[140px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải yêu cầu hoàn tiền...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Không có yêu cầu nào phù hợp.
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tiến trình</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.booking_code ?? `#${request.booking_id}`}</div>
                        {request.reason && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{request.reason}</p>
                        )}
                        {request.customer_message && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            KH: {request.customer_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.customer_name ?? "Khách lẻ"}</div>
                        <p className="text-xs text-muted-foreground">{request.booking_id}</p>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {formatMoney(request.amount, request.currency ?? "VND")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">{request.bank_account_name}</div>
                        <div>{request.bank_account_number}</div>
                        <div>{request.bank_name}</div>
                        {request.bank_branch && <div>{request.bank_branch}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[request.status ?? "pending"] ?? "secondary"}>
                          {statusLabels[request.status ?? "pending"] ?? request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {PARTNER_REFUND_TIMELINE.map((step, index) => {
                            const baseClass = "rounded-full px-2 py-1 text-[11px]";
                            const timelineIndex = getPartnerTimelineIndex(request.status);
                            const isRejected = request.status === "rejected";
                            const isRejectedStep =
                              isRejected && index === PARTNER_REFUND_TIMELINE.length - 1;
                            const isDone = timelineIndex > index && !isRejected;
                            const isCurrent = timelineIndex === index && !isRejected;
                            let chipClass = `${baseClass} bg-muted text-muted-foreground`;
                            if (isRejectedStep) {
                              chipClass = `${baseClass} bg-destructive/10 text-destructive`;
                            } else if (isDone) {
                              chipClass = `${baseClass} bg-emerald-100 text-emerald-700`;
                            } else if (isCurrent) {
                              chipClass = `${baseClass} bg-primary/10 text-primary`;
                            }
                            return (
                              <span key={step.key} className={chipClass}>
                                {isRejectedStep ? "Đã từ chối" : step.label}
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(request.submitted_at)}</TableCell>
                      <TableCell className="text-right space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAction(request, "await_customer_confirm")}
                          disabled={
                            request.status === "completed" ||
                            request.status === "await_customer_confirm" ||
                            request.status === "rejected"
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Đã hoàn tiền
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleOpenAction(request, "rejected")}
                          disabled={request.status === "completed" || request.status === "rejected"}
                        >
                          <ShieldX className="mr-2 h-4 w-4" />
                          Từ chối
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(dialogAction.request && dialogAction.status)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogAction.status === "rejected" ? "Từ chối yêu cầu hoàn tiền" : "Xác nhận đã chuyển khoản"}
            </DialogTitle>
          </DialogHeader>
          {dialogAction.request && dialogAction.status && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {dialogAction.request.booking_code ?? `#${dialogAction.request.booking_id}`}
                </p>
                <p className="text-muted-foreground">
                  {formatMoney(dialogAction.request.amount, dialogAction.request.currency ?? "VND")}
                </p>
              </div>

              <div className="space-y-2">
                <LabelElement label={dialogAction.status === "rejected" ? "Lý do từ chối" : "Ghi chú chuyển khoản"} />
                <Textarea
                  rows={4}
                  placeholder={
                    dialogAction.status === "rejected"
                      ? "Giải thích lý do từ chối hoàn tiền..."
                      : "Ghi chú thông tin chuyển khoản, số tham chiếu..."
                  }
                  value={partnerMessage}
                  onChange={(event) => setPartnerMessage(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <LabelElement
                  label={
                    dialogAction.status === "await_customer_confirm"
                      ? "Chứng từ chuyển khoản (bắt buộc)"
                      : "Chứng từ chuyển khoản (tùy chọn)"
                  }
                />
                <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">
                  Định dạng JPG/PNG/PDF, dung lượng tối đa 5MB.
                </p>
                {proofFile && (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{proofFile.name}</span>
                    <span>{(proofFile.size / 1024).toFixed(0)} KB</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : dialogAction.status === "rejected" ? (
                    <>
                      <ShieldX className="mr-2 h-4 w-4" />
                      Từ chối yêu cầu
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Đã chuyển khoản
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={mutation.isPending}>
                  Huỷ
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerRefundRequestsPage;

interface LabelProps {
  label: string;
}

const LabelElement = ({ label }: LabelProps) => (
  <p className="text-sm font-medium text-foreground">{label}</p>
);

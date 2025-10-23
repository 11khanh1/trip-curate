import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchBookingDetail, verifySepayReturn, type Booking } from "@/services/bookingApi";

const useSepayParams = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderCode = params.get("order_code") ?? "";
  const status = params.get("status") ?? "";
  const signature = params.get("signature") ?? "";
  return { orderCode, status, signature, queryString: search };
};

const SepayReturn = () => {
  const navigate = useNavigate();
  const { orderCode, status, signature, queryString } = useSepayParams();

  const enabled = Boolean(orderCode && status && signature);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sepay-return", queryString],
    queryFn: () =>
      verifySepayReturn({
        order_code: orderCode,
        status,
        signature,
      }),
    enabled,
  });

  useEffect(() => {
    if (data?.booking_id && data?.status === "success") {
      const timer = window.setTimeout(() => {
        navigate(`/bookings/${data.booking_id}`);
      }, 4000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [data?.booking_id, data?.status, navigate]);

  const isSuccess = data?.status === "success";
  const bookingId = data?.booking_id ? String(data.booking_id) : null;
  const normalizedBookingId = bookingId ?? "";

  const { data: bookingDetail, isLoading: isBookingLoading } = useQuery<Booking>({
    queryKey: ["booking-detail", normalizedBookingId],
    queryFn: () => fetchBookingDetail(normalizedBookingId),
    enabled: Boolean(normalizedBookingId),
  });

  const effectiveOrderCode =
    bookingDetail?.code?.toString().trim().length && bookingDetail?.code ? String(bookingDetail.code) : orderCode;
  const bookingCurrency = bookingDetail?.currency ?? "VND";
  const totalAmount =
    typeof bookingDetail?.total_amount === "number"
      ? bookingDetail.total_amount
      : typeof bookingDetail?.total_price === "number"
        ? bookingDetail.total_price
        : null;
  const formattedAmount =
    typeof totalAmount === "number"
      ? totalAmount.toLocaleString("vi-VN", {
          style: "currency",
          currency: bookingCurrency,
          minimumFractionDigits: 0,
        })
      : "Đang cập nhật";
  const providerName =
    bookingDetail?.tour?.partner?.company_name ??
    bookingDetail?.tour?.title ??
    bookingDetail?.tour?.name ??
    "Trip Curate";
  const transactionFee = 0;
  const formattedFee = transactionFee.toLocaleString("vi-VN", {
    style: "currency",
    currency: bookingCurrency,
    minimumFractionDigits: 0,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-6">
          {!enabled ? (
            <Alert variant="destructive">
              <AlertTitle>Thiếu thông tin giao dịch</AlertTitle>
              <AlertDescription>
                Đường dẫn quay về không chứa đủ dữ liệu xác thực. Vui lòng kiểm tra lại email xác nhận.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Đang xác nhận thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Vui lòng đợi trong giây lát, chúng tôi đang kiểm tra trạng thái giao dịch từ Sepay.
                </p>
              </CardContent>
            </Card>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể xác thực giao dịch</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại hoặc liên hệ đội ngũ hỗ trợ."}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-l-4 border-amber-500 bg-amber-50 text-amber-900">
                <AlertTitle className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4" />
                  Lưu ý quan trọng
                </AlertTitle>
                <AlertDescription className="text-sm">
                  Quý khách vui lòng không tắt trình duyệt cho đến khi nhận được kết quả giao dịch trên website.
                  Xin cảm ơn!
                </AlertDescription>
              </Alert>
              <Card>
                <CardHeader className="border-b pb-6 text-center">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {isSuccess ? "Thanh toán qua Ví điện tử đã hoàn tất" : "Thanh toán qua Ví điện tử chưa hoàn tất"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mã giao dịch: {effectiveOrderCode || orderCode}
                  </p>
                </CardHeader>
                <CardContent className="grid gap-10 py-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Thông tin đơn hàng</h2>
                      <p className="text-sm text-muted-foreground">
                        Thông tin chi tiết giúp bạn theo dõi trạng thái thanh toán.
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                      <dl className="space-y-4">
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Số tiền thanh toán</dt>
                          <dd className="text-base font-semibold text-foreground">{formattedAmount}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Giá trị đơn hàng</dt>
                          <dd className="font-medium text-foreground">{formattedAmount}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Phí giao dịch</dt>
                          <dd className="font-medium text-foreground">{formattedFee}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Mã đơn hàng</dt>
                          <dd className="font-medium text-foreground">
                            {bookingDetail?.code ?? bookingDetail?.id ?? orderCode}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Nhà cung cấp</dt>
                          <dd className="font-medium text-foreground">{providerName}</dd>
                        </div>
                      </dl>
                    </div>
                    {isBookingLoading && (
                      <p className="text-xs text-muted-foreground">
                        Đang đồng bộ thông tin booking của bạn...
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center gap-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        {isSuccess ? "Thanh toán thành công" : "Giao dịch chưa được ghi nhận"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isSuccess
                          ? "Bạn sẽ được chuyển đến trang chi tiết booking trong giây lát."
                          : "Nếu khoản thanh toán đã trừ tiền, vui lòng liên hệ đội hỗ trợ để được xử lý."}
                      </p>
                    </div>
                    <div className="flex h-56 w-56 items-center justify-center rounded-xl border bg-background shadow-sm">
                      {isSuccess ? (
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                      ) : (
                        <XCircle className="h-20 w-20 text-red-500" />
                      )}
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      Để kiểm tra lại thông tin thanh toán, bạn có thể mở trang booking hoặc quay về trang chủ.
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-center">
                  {bookingId && (
                    <Button onClick={() => navigate(`/bookings/${bookingId}`)} variant="outline">
                      Xem booking của bạn
                    </Button>
                  )}
                  <Button onClick={() => navigate("/")}>Về trang chủ</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SepayReturn;

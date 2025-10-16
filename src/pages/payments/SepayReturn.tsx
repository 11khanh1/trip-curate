import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { verifySepayReturn } from "@/services/bookingApi";

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
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
            <Card className="text-center">
              <CardHeader>
                <CardTitle>
                  {isSuccess ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  {isSuccess ? (
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  ) : (
                    <XCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>
                <p className="text-base text-foreground">Mã giao dịch: {orderCode}</p>
                {isSuccess ? (
                  <p className="text-sm text-muted-foreground">
                    Cảm ơn bạn đã hoàn tất thanh toán. Chúng tôi sẽ gửi email xác nhận trong giây lát.
                  </p>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>Giao dịch chưa được ghi nhận</AlertTitle>
                    <AlertDescription>
                      Nếu khoản thanh toán đã trừ tiền, vui lòng liên hệ đội hỗ trợ để được xử lý.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-center gap-3">
                {bookingId && (
                  <Button onClick={() => navigate(`/bookings/${bookingId}`)} variant="outline">
                    Xem booking của bạn
                  </Button>
                )}
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SepayReturn;

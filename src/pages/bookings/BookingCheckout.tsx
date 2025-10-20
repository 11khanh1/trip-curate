import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import OrderHistory from "@/components/orders/OrderHistory";

import { isAxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { createBooking, type CreateBookingPayload } from "@/services/bookingApi";
import { fetchTourDetail, type PublicTour, type PublicTourPackage, type PublicTourSchedule } from "@/services/publicApi";

const passengerSchema = z.object({
  type: z.enum(["adult", "child"]),
  full_name: z.string().min(1, "Yêu cầu họ tên"),
  date_of_birth: z.string().optional(),
  document_number: z.string().optional(),
});

const bookingSchema = z.object({
  package_id: z.string().min(1, "Yêu cầu chọn gói dịch vụ"),
  schedule_id: z.string().min(1, "Yêu cầu chọn lịch khởi hành"),
  adults: z.number().int().min(1, "Cần ít nhất 1 người lớn"),
  children: z.number().int().min(0),
  contact_name: z.string().min(1, "Yêu cầu họ tên người liên hệ"),
  contact_email: z.string().email("Email không hợp lệ"),
  contact_phone: z.string().min(6, "Số điện thoại chưa hợp lệ"),
  notes: z.string().optional(),
  payment_method: z.enum(["offline", "sepay"]),
  passengers: z.array(passengerSchema).min(1, "Cần tối thiểu 1 hành khách"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const ensurePositive = (value: number, fallback: number) => (Number.isFinite(value) && value >= 0 ? value : fallback);

const BookingCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { removeItem } = useCart();
  const [searchParams] = useSearchParams();

  const tourId = searchParams.get("tourId") ?? "";
  const cartItemId = searchParams.get("cartItemId") ?? "";
  const defaultPackageId = searchParams.get("packageId") ?? "";
  const defaultScheduleId = searchParams.get("scheduleId") ?? "";
  const initialAdults = ensurePositive(Number.parseInt(searchParams.get("adults") ?? "1", 10), 1) || 1;
  const initialChildren = ensurePositive(Number.parseInt(searchParams.get("children") ?? "0", 10), 0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      package_id: defaultPackageId,
      schedule_id: defaultScheduleId,
      adults: initialAdults,
      children: initialChildren,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      payment_method: "sepay",
      passengers: [],
    },
  });

  const { setValue, getValues } = form;

  const adults = form.watch("adults");
  const children = form.watch("children");
  const packageId = form.watch("package_id");
  const scheduleId = form.watch("schedule_id");

  const { data: tour, isLoading, isError, error } = useQuery<PublicTour | null>({
    queryKey: ["tour-detail", tourId],
    queryFn: () => fetchTourDetail(tourId),
    enabled: Boolean(tourId),
  });

  const packages = useMemo(() => tour?.packages ?? [], [tour?.packages]);
  const schedules = useMemo(() => tour?.schedules ?? [], [tour?.schedules]);

  // Effect to set default package
  useEffect(() => {
    if (packages.length === 0) return;
    const current = getValues("package_id");
    if (!current || !packages.some(p => String(p.id) === current)) {
      setValue("package_id", String(packages[0]?.id ?? ""));
    }
  }, [packages, getValues, setValue]);

  // Effect to set default schedule
  useEffect(() => {
    if (schedules.length === 0) {
      setValue("schedule_id", ""); // Clear schedule if none available
      return;
    }
    const current = getValues("schedule_id");
     if (!current || !schedules.some(s => String(s.id) === current)) {
      setValue("schedule_id", String(schedules[0]?.id ?? ""));
    }
  }, [schedules, getValues, setValue]);

  // Effect to sync passenger fields with adult/child counts
  useEffect(() => {
    const safeAdults = Number.isFinite(adults) && adults >= 1 ? adults : 1;
    if (safeAdults !== adults) {
      setValue("adults", safeAdults);
    }
    const safeChildren = Number.isFinite(children) && children >= 0 ? children : 0;
    if (safeChildren !== children) {
      setValue("children", safeChildren);
    }

    const desired = safeAdults + safeChildren;
    const current = getValues("passengers");

    if (current.length === desired) return; // Already in sync

    const next: BookingFormValues["passengers"] = Array.from({ length: desired }, (_, index) => {
      const existing = current[index];
      const passengerType: "adult" | "child" = index < safeAdults ? "adult" : "child";
      return {
        type: passengerType,
        full_name: existing?.full_name ?? "",
        date_of_birth: existing?.date_of_birth ?? "",
        document_number: existing?.document_number ?? "",
      };
    });
    setValue("passengers", next, { shouldDirty: true, shouldValidate: true });
    // **FIXED**: Removed unstable `form` object from dependency array to prevent infinite loops.
  }, [adults, children, setValue, getValues]);

  const selectedPackage: PublicTourPackage | undefined = useMemo(
    () => packages.find((pkg) => String(pkg.id) === packageId),
    [packages, packageId],
  );

  const selectedSchedule: PublicTourSchedule | undefined = useMemo(
    () => schedules.find((schedule) => String(schedule?.id) === scheduleId),
    [schedules, scheduleId],
  );

  const displayCurrency = useMemo(() => {
    const raw = typeof tour?.currency === "string" ? tour.currency.trim() : "";
    return raw.length > 0 ? raw : "VND";
  }, [tour?.currency]);

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    const adultPrice = selectedPackage.adult_price ?? tour?.base_price ?? 0;
    const childPrice = selectedPackage.child_price ?? selectedPackage.adult_price ?? tour?.base_price ?? 0;
    return adults * adultPrice + children * childPrice;
  }, [adults, children, selectedPackage, tour?.base_price]);

  const mutation = useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: (response, payload) => {
      toast({
        title: "Đặt chỗ thành công",
        description:
          payload.payment_method === "sepay"
            ? "Đang chuyển tới cổng thanh toán Sepay."
            : "Chúng tôi đã gửi email xác nhận cho bạn.",
      });
      if (cartItemId) {
        removeItem(cartItemId);
      }
      if (payload.payment_method === "sepay" && response.payment_url) {
        window.location.href = response.payment_url;
      } else if (response?.booking?.id) {
        navigate(`/bookings/${response.booking.id}`);
      } else {
         navigate(`/`); // Fallback to home page
      }
    },
    onError: (submitError: unknown) => {
      const fallbackMessage = "Vui lòng kiểm tra lại thông tin và thử lại.";
      const description = isAxiosError(submitError)
        ? (submitError.response?.data as { message?: string })?.message ??
          submitError.response?.statusText ??
          fallbackMessage
        : submitError instanceof Error
        ? submitError.message
        : fallbackMessage;

      toast({
        title: "Không thể tạo booking",
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: BookingFormValues) => {
    if (!tourId || !tour) {
      toast({
        title: "Thiếu thông tin tour",
        description: "Vui lòng quay lại trang chi tiết để chọn tour cần đặt.",
        variant: "destructive",
      });
      return;
    }

    const payloadPassengers = values.passengers.map((passenger) => ({
      type: passenger.type,
      full_name: passenger.full_name.trim(),
      date_of_birth: passenger.date_of_birth?.trim() || undefined,
      document_number: passenger.document_number?.trim() || undefined,
    }));

    const payload: CreateBookingPayload = {
      tour_id: tourId || String(tour?.uuid ?? tour?.id ?? ""),
      package_id: String(values.package_id).trim(),
      schedule_id: String(values.schedule_id).trim(),
      adults: values.adults,
      contact_name: values.contact_name.trim(),
      contact_email: values.contact_email.trim(),
      contact_phone: values.contact_phone.trim(),
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      payment_method: values.payment_method,
      passengers: payloadPassengers,
    };

    if (values.children > 0) {
      payload.children = values.children;
    }

    if (!payload.tour_id) {
      toast({
        title: "Thiếu thông tin tour",
        description: "Không xác định được tour để tạo booking. Vui lòng thử lại từ trang chi tiết tour.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(payload);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        {!tourId ? (
          <Alert variant="destructive">
            <AlertTitle>Thiếu thông tin tour</AlertTitle>
            <AlertDescription>Đường dẫn không chứa mã tour hợp lệ.</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Không thể tải dữ liệu tour</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Vui lòng thử lại sau hoặc liên hệ hỗ trợ."}
            </AlertDescription>
          </Alert>
        ) : !tour ? (
          <Alert>
            <AlertTitle>Tour đang cập nhật</AlertTitle>
            <AlertDescription>Chúng tôi chưa tìm thấy thông tin cho tour này.</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin đặt chỗ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="package_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gói dịch vụ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn gói" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {packages.map((pkg) => (
                                <SelectItem key={String(pkg.id)} value={String(pkg.id)}>
                                  {pkg.name ?? `Gói ${pkg.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lịch khởi hành</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn lịch khởi hành" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schedules.map((schedule) => (
                                schedule && <SelectItem key={String(schedule.id)} value={String(schedule.id)}>
                                  {schedule.title ??
                                    (schedule.start_date
                                      ? new Date(schedule.start_date).toLocaleDateString("vi-VN")
                                      : `Lịch ${schedule.id}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="adults"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Người lớn</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="children"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trẻ em</FormLabel>
                            <FormControl>
                               <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contact_name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyễn Văn A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="tenban@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="0123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Yêu cầu đặc biệt (nếu có)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin hành khách</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.getValues("passengers").length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Tăng số lượng người lớn hoặc trẻ em để thêm hành khách.
                      </p>
                    ) : (
                      form.getValues("passengers").map((passenger, index) => (
                        <div key={`passenger-${index}`} className="rounded-lg border p-4">
                          <p className="mb-3 text-sm font-semibold text-foreground">
                            Hành khách {index + 1} · {passenger.type === "child" ? "Trẻ em" : "Người lớn"}
                          </p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`passengers.${index}.full_name`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Họ và tên</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nhập họ và tên" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`passengers.${index}.date_of_birth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ngày sinh (tùy chọn)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`passengers.${index}.document_number`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Giấy tờ tùy thân (tùy chọn)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="CMND/Hộ chiếu" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* **IMPROVEMENT**: Added sticky positioning for the summary card */}
              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Tóm tắt đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{tour.title ?? tour.name ?? "Tour không tên"}</p>
                      {selectedSchedule?.start_date && (
                        <p>
                          Khởi hành:{" "}
                          {new Date(selectedSchedule.start_date).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Người lớn:</span>
                        <span className="font-medium text-foreground">{adults}</span>
                      </div>
                       <div className="flex justify-between">
                        <span>Trẻ em:</span>
                        <span className="font-medium text-foreground">{children}</span>
                      </div>
                       <div className="flex justify-between">
                        <span>Gói dịch vụ:</span>
                        <span className="font-medium text-foreground text-right">
                          {selectedPackage?.name ?? "Chưa chọn"}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-base font-semibold text-foreground">
                      <span>Tổng cộng</span>
                      <span>
                        {totalPrice.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: displayCurrency,
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <Separator />
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phương thức thanh toán</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sepay">Thanh toán qua Ví điện tử</SelectItem>
                              <SelectItem value="offline">Thanh toán sau</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={mutation.isPending || packages.length === 0}
                    >
                      {mutation.isPending ? "Đang xử lý..." : "Hoàn tất đặt chỗ"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                       Khi tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách của chúng tôi.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </Form>
        )}
      </main>
      <section className="container mx-auto px-4 pb-12">
        <OrderHistory />
      </section>
      <Footer />
    </div>
  );
};

export default BookingCheckout;

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { registerPartner } from "@/services/partnerService";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";

const partnerSchema = z.object({
  company_name: z.string().min(3, "Yêu cầu tên công ty"),
  business_type: z.string().min(2, "Yêu cầu loại hình kinh doanh"),
  contact_name: z.string().min(2, "Yêu cầu họ tên"),
  contact_email: z.string().email("Email không hợp lệ"),
  contact_phone: z
    .string()
    .regex(/^0\d{9}$/, "Số điện thoại phải đủ 10 số và bắt đầu bằng 0"),
  address: z.string().optional(),
  tax_code: z
    .string()
    .regex(/^\d{8,15}$/, "Mã số thuế phải là số, từ 8 đến 15 ký tự")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

const PartnerSignup = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      company_name: "",
      business_type: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      tax_code: "",
      description: "",
    },
  });

  const onSubmit = async (values: PartnerFormValues) => {
    try {
      await registerPartner({
        company_name: values.company_name,
        business_type: values.business_type,
        contact_name: values.contact_name,
        contact_email: values.contact_email,
        contact_phone: values.contact_phone,
        address: values.address,
        tax_code: values.tax_code,
        description: values.description,
      });
      setSubmitted(true);
      toast({
        title: "Đã gửi đăng ký hợp tác",
        description: "Chúng tôi sẽ liên hệ trong thời gian sớm nhất.",
      });
      form.reset();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast({
          title: "Đăng ký đã tồn tại",
          description: "Thông tin đối tác này đã được đăng ký. Vui lòng kiểm tra lại email hoặc số điện thoại.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Không thể gửi đăng ký",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <TravelHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Hợp tác cùng VietTravel</p>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Đăng ký trở thành đối tác</h1>
            <p className="text-base text-muted-foreground">
              Điền thông tin bên dưới để chúng tôi liên hệ và kích hoạt tài khoản đối tác của bạn.
            </p>
          </div>

          <Card className="border border-orange-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Thông tin doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tên công ty *</FormLabel>
                        <FormControl>
                          <Input placeholder="Công ty TNHH Du lịch ABC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại hình kinh doanh *</FormLabel>
                        <FormControl>
                          <Input placeholder="Lữ hành, vận chuyển, lưu trú..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã số thuế (tuỳ chọn)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập MST nếu có" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Input placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 h-px w-full bg-orange-100" />

                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Người liên hệ *</FormLabel>
                        <FormControl>
                          <Input placeholder="Họ và tên" {...field} />
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
                        <FormLabel>Số điện thoại *</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email liên hệ *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="doitac@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Giới thiệu ngắn</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Mô tả dịch vụ, thế mạnh, khu vực phục vụ..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={cn("md:col-span-2 flex flex-col gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-orange-900", submitted ? "border-green-200 bg-green-50/70 text-green-900" : "")}>
                    {submitted ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Đã gửi đăng ký. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-orange-700">Lưu ý</span>
                        <p>Thông tin được dùng để thẩm định và tạo tài khoản đối tác. Vui lòng cung cấp chính xác.</p>
                      </>
                    )}
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-orange-600 text-white hover:bg-orange-700"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...
                        </span>
                      ) : (
                        "Gửi đăng ký"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PartnerSignup;

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPartnerProfile,
  updatePartnerProfile,
  type PartnerProfile,
  type UpdatePartnerProfilePayload,
} from "@/services/partnerApi";

type ProfileFormKeys =
  | "company_name"
  | "tax_code"
  | "business_license"
  | "company_address"
  | "website"
  | "contact_name"
  | "contact_phone"
  | "contact_email"
  | "invoice_company_name"
  | "invoice_tax_code"
  | "invoice_address"
  | "invoice_email"
  | "invoice_vat_rate"
  | "bank_name"
  | "bank_account_number"
  | "bank_account_name"
  | "note";

type PartnerProfileFormState = Record<ProfileFormKeys, string>;

const profileFieldOrder: ProfileFormKeys[] = [
  "company_name",
  "tax_code",
  "business_license",
  "company_address",
  "website",
  "contact_name",
  "contact_phone",
  "contact_email",
  "invoice_company_name",
  "invoice_tax_code",
  "invoice_address",
  "invoice_email",
  "invoice_vat_rate",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
  "note",
];

type TextProfileField = Exclude<ProfileFormKeys, "invoice_vat_rate">;

const mapProfileToForm = (profile?: PartnerProfile | null): PartnerProfileFormState => ({
  company_name: profile?.company_name ?? "",
  tax_code: profile?.tax_code ?? "",
  business_license: profile?.business_license ?? "",
  company_address: profile?.company_address ?? "",
  website: profile?.website ?? "",
  contact_name: profile?.contact_name ?? "",
  contact_phone: profile?.contact_phone ?? "",
  contact_email: profile?.contact_email ?? "",
  invoice_company_name: profile?.invoice_company_name ?? "",
  invoice_tax_code: profile?.invoice_tax_code ?? "",
  invoice_address: profile?.invoice_address ?? "",
  invoice_email: profile?.invoice_email ?? "",
  invoice_vat_rate:
    typeof profile?.invoice_vat_rate === "number" && Number.isFinite(profile.invoice_vat_rate)
      ? String(profile.invoice_vat_rate)
      : "",
  bank_name: profile?.bank_name ?? "",
  bank_account_number: profile?.bank_account_number ?? "",
  bank_account_name: profile?.bank_account_name ?? "",
  note: profile?.note ?? "",
});

export default function PartnerSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<PartnerProfileFormState>(() => mapProfileToForm(undefined));

  const profileQuery = useQuery({
    queryKey: ["partner-profile"],
    queryFn: fetchPartnerProfile,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setFormState(mapProfileToForm(profileQuery.data));
    }
  }, [profileQuery.data]);

  const mutation = useMutation({
    mutationFn: (payload: UpdatePartnerProfilePayload) => updatePartnerProfile(payload),
    onSuccess: (response) => {
      toast({
        title: "Đã cập nhật hồ sơ",
        description: response.message ?? "Thông tin đối tác đã được lưu.",
      });
      setFormState(mapProfileToForm(response.profile));
      queryClient.setQueryData(["partner-profile"], response.profile);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Không thể cập nhật hồ sơ.";
      toast({
        title: "Lỗi cập nhật",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: ProfileFormKeys) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (): UpdatePartnerProfilePayload => {
    const payload: UpdatePartnerProfilePayload = {};
    const profile = profileQuery.data;
    profileFieldOrder.forEach((key) => {
      if (key === "invoice_vat_rate") {
        const numericValue =
          formState.invoice_vat_rate.trim().length === 0
            ? null
            : Number(formState.invoice_vat_rate);
        const original =
          typeof profile?.invoice_vat_rate === "number" && Number.isFinite(profile.invoice_vat_rate)
            ? profile.invoice_vat_rate
            : null;
        if (numericValue !== original) {
          payload.invoice_vat_rate = numericValue;
        }
        return;
      }
      const fieldKey = key as TextProfileField;
      const currentValue = formState[fieldKey];
      const originalValue =
        (profile?.[fieldKey as keyof PartnerProfile] as string | null | undefined) ?? "";
      if ((originalValue ?? "") !== currentValue) {
        payload[fieldKey] = currentValue.trim().length ? currentValue : null;
      }
    });
    return payload;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast({
        title: "Không có thay đổi",
        description: "Bạn chưa chỉnh sửa thông tin nào.",
      });
      return;
    }
    mutation.mutate(payload);
  };

  const isLoading = profileQuery.isLoading;
  const isError = profileQuery.isError;
  const isSaving = mutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-destructive">
        Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin công ty</CardTitle>
            <CardDescription>Cập nhật thông tin doanh nghiệp của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Tên công ty</Label>
              <Input
                id="company-name"
                placeholder="TripCurate Partner"
                value={formState.company_name}
                onChange={handleInputChange("company_name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-license">Giấy phép kinh doanh</Label>
              <Input
                id="business-license"
                placeholder="0123456789"
                value={formState.business_license}
                onChange={handleInputChange("business_license")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tax-code">Mã số thuế</Label>
              <Input
                id="tax-code"
                placeholder="0312345678"
                value={formState.tax_code}
                onChange={handleInputChange("tax_code")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                placeholder="Nhập địa chỉ công ty..."
                value={formState.company_address}
                onChange={handleInputChange("company_address")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formState.website}
                onChange={handleInputChange("website")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
            <CardDescription>Thông tin để khách hàng và VietTravel liên hệ với bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="contact-name">Người liên hệ</Label>
              <Input
                id="contact-name"
                placeholder="Nguyễn Văn A"
                value={formState.contact_name}
                onChange={handleInputChange("contact_name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={formState.contact_phone}
                onChange={handleInputChange("contact_phone")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@tripcurate.com"
                value={formState.contact_email}
                onChange={handleInputChange("contact_email")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin xuất hóa đơn</CardTitle>
            <CardDescription>Thông tin này giúp hệ thống phát hành hóa đơn chính xác</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-company">Tên đơn vị nhận hóa đơn</Label>
              <Input
                id="invoice-company"
                placeholder="Công ty TNHH Du lịch ABC"
                value={formState.invoice_company_name}
                onChange={handleInputChange("invoice_company_name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-tax">Mã số thuế xuất hóa đơn</Label>
              <Input
                id="invoice-tax"
                placeholder="0101234567"
                value={formState.invoice_tax_code}
                onChange={handleInputChange("invoice_tax_code")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-address">Địa chỉ xuất hóa đơn</Label>
              <Textarea
                id="invoice-address"
                placeholder="Địa chỉ ghi trên hóa đơn..."
                value={formState.invoice_address}
                onChange={handleInputChange("invoice_address")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-email">Email nhận hóa đơn</Label>
              <Input
                id="invoice-email"
                type="email"
                placeholder="invoice@yourcompany.com"
                value={formState.invoice_email}
                onChange={handleInputChange("invoice_email")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-vat">Thuế VAT (%)</Label>
              <Input
                id="invoice-vat"
                type="number"
                min={0}
                step="0.1"
                placeholder="10"
                value={formState.invoice_vat_rate}
                onChange={handleInputChange("invoice_vat_rate")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
            <CardDescription>Thông tin tài khoản nhận thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bank-name">Ngân hàng</Label>
              <Input
                id="bank-name"
                placeholder="Vietcombank"
                value={formState.bank_name}
                onChange={handleInputChange("bank_name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-number">Số tài khoản</Label>
              <Input
                id="account-number"
                placeholder="1234567890"
                value={formState.bank_account_number}
                onChange={handleInputChange("bank_account_number")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-holder">Chủ tài khoản</Label>
              <Input
                id="account-holder"
                placeholder="NGUYEN VAN A"
                value={formState.bank_account_name}
                onChange={handleInputChange("bank_account_name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Ghi chú nội bộ..."
                value={formState.note}
                onChange={handleInputChange("note")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông báo</CardTitle>
            <CardDescription>Quản lý các thông báo bạn nhận được</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đơn đặt mới</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có đơn đặt mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đánh giá mới</Label>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có đánh giá mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Báo cáo doanh thu</Label>
                <p className="text-sm text-muted-foreground">Nhận báo cáo doanh thu hàng tuần</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-gradient-primary"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lưu hồ sơ
        </Button>
      </div>
    </form>
  );
}

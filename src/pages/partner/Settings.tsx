import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPartnerProfile,
  updatePartnerProfile,
  type PartnerProfile,
  type UpdatePartnerProfilePayload,
} from "@/services/partnerApi";

type ProfileFormKeys = Extract<keyof UpdatePartnerProfilePayload, string>;
type NumericProfileField = "invoice_vat_rate";
type TextProfileField = Exclude<ProfileFormKeys, NumericProfileField>;
type PartnerProfileFormState = Record<TextProfileField, string> & {
  invoice_vat_rate: string;
};

const textProfileFields: TextProfileField[] = [
  "company_name",
  "tax_code",
  "address",
  "business_type",
  "description",
  "contact_name",
  "contact_phone",
  "contact_email",
  "invoice_company_name",
  "invoice_tax_code",
  "invoice_address",
  "invoice_email",
];


const mapProfileToForm = (profile?: PartnerProfile | null): PartnerProfileFormState => ({
  company_name: profile?.company_name ?? "",
  tax_code: profile?.tax_code ?? "",
  address: profile?.address ?? "",
  business_type: profile?.business_type ?? "",
  description: profile?.description ?? "",
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
      const nextProfile = response.profile ?? profileQuery.data ?? null;
      toast({
        title: "Đã cập nhật hồ sơ",
        description: response.message ?? "Thông tin đối tác đã được lưu.",
      });
      setFormState(mapProfileToForm(nextProfile));
      queryClient.setQueryData(["partner-profile"], nextProfile);
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
    textProfileFields.forEach((key) => {
      const currentValue = formState[key];
      const originalValue =
        (profile?.[key as keyof PartnerProfile] as string | null | undefined) ?? "";
      if ((originalValue ?? "") !== currentValue) {
        payload[key] = currentValue.trim().length ? currentValue : null;
      }
    });
    const vatInput = formState.invoice_vat_rate.trim();
    const numericValue = vatInput.length === 0 ? null : Number(vatInput);
    const original =
      typeof profile?.invoice_vat_rate === "number" && Number.isFinite(profile.invoice_vat_rate)
        ? profile.invoice_vat_rate
        : null;
    if (numericValue !== original) {
      payload.invoice_vat_rate = numericValue;
    }
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
                value={formState.address}
                onChange={handleInputChange("address")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-type">Loại hình kinh doanh</Label>
              <Input
                id="business-type"
                placeholder="Tour nội địa, tour inbound..."
                value={formState.business_type}
                onChange={handleInputChange("business_type")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Giới thiệu doanh nghiệp</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về dịch vụ, thế mạnh của đối tác..."
                value={formState.description}
                onChange={handleInputChange("description")}
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
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-6"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lưu hồ sơ
        </Button>
      </div>
    </form>
  );
}

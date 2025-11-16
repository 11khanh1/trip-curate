import { apiClient, extractData } from "@/lib/api-client";

export interface PartnerRegistrationPayload {
  company_name: string;
  business_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  tax_code?: string;
  description?: string;
}

export interface PartnerRegistrationResponse {
  message?: string;
  [key: string]: unknown;
}

export const registerPartner = async (payload: PartnerRegistrationPayload): Promise<PartnerRegistrationResponse> => {
  const body = {
    company_name: payload.company_name.trim(),
    business_type: payload.business_type.trim(),
    contact_name: payload.contact_name.trim(),
    contact_email: payload.contact_email.trim(),
    contact_phone: payload.contact_phone.trim(),
    address: payload.address?.trim() || undefined,
    tax_code: payload.tax_code?.trim() || undefined,
    description: payload.description?.trim() || undefined,
  };

  const res = await apiClient.post("/partners/register", body);
  return extractData<PartnerRegistrationResponse>(res);
};

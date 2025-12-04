import { apiClient } from "@/lib/api-client";

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  booking_id?: string | null;
  status: SupportTicketStatus;
  created_at?: string;
  updated_at?: string;
}

export interface SupportTicketListResponse {
  data: SupportTicket[];
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

export const fetchSupportTickets = async (params?: { page?: number; per_page?: number }) => {
  const res = await apiClient.get<SupportTicketListResponse>("/support-tickets", { params });
  return res.data;
};

export const fetchSupportTicketDetail = async (id: string) => {
  const res = await apiClient.get<SupportTicket>(`/support-tickets/${id}`);
  return res.data;
};

export const createSupportTicket = async (payload: {
  subject: string;
  message: string;
  booking_id?: string | null;
}) => {
  const res = await apiClient.post<SupportTicket>("/support-tickets", payload);
  return res.data;
};

export const updateSupportTicketStatus = async (id: string, status: SupportTicketStatus) => {
  const res = await apiClient.patch<SupportTicket>(`/support-tickets/${id}/status`, { status });
  return res.data;
};

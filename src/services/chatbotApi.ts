import { apiClient } from "@/lib/api-client";

export type ChatbotLanguage = "vi" | "en";

export interface ChatbotRequestPayload {
  message: string;
  language?: ChatbotLanguage;
}

export interface ChatbotSource {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  [key: string]: unknown;
}

export interface ChatbotResponse {
  reply: string;
  language: ChatbotLanguage;
  sources?: ChatbotSource[] | string[];
}

const MAX_MESSAGE_LENGTH = 2000;

export const sendChatbotMessage = async ({
  message,
  language = "vi",
}: ChatbotRequestPayload): Promise<ChatbotResponse> => {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Vui lòng nhập nội dung câu hỏi.");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Tin nhắn quá dài, vui lòng rút gọn nội dung (≤ 2000 ký tự).");
  }

  const res = await apiClient.post<ChatbotResponse>("/chatbot", {
    message: trimmed,
    language,
  });
  return res.data ?? (res as unknown as ChatbotResponse);
};

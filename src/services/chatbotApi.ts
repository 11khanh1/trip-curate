import { apiClient } from "@/lib/api-client";

export type ChatbotLanguage = "vi" | "en";

export interface ChatbotRequestPayload {
  message: string;
  language?: ChatbotLanguage;
  history?: ChatbotHistoryEntry[];
  systemPrompt?: string;
}

export interface ChatbotHistoryEntry {
  role: "user" | "assistant" | "model" | "system";
  content: string;
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
  history,
  systemPrompt,
}: ChatbotRequestPayload): Promise<ChatbotResponse> => {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Vui lòng nhập nội dung câu hỏi.");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Tin nhắn quá dài, vui lòng rút gọn nội dung (≤ 2000 ký tự).");
  }

  // Chuẩn hoá lịch sử, map role theo backend (user/model), bỏ role lạ
  const normalizedHistory =
    Array.isArray(history)
      ? history
          .map((entry) => {
            if (!entry || typeof entry.content !== "string") return null;
            if (entry.role === "assistant") return { role: "model" as const, content: entry.content };
            if (entry.role === "model" || entry.role === "user") return { role: entry.role, content: entry.content };
            // Bỏ qua role system/khác để tránh 422
            return null;
          })
          .filter((entry): entry is { role: "user" | "model"; content: string } => Boolean(entry))
      : [];

  const res = await apiClient.post<ChatbotResponse>("/chatbot", {
    message: trimmed,
    language,
    history: normalizedHistory,
    // systemPrompt bỏ qua để tránh gửi role lạ (backend chỉ nhận user/model)
  });
  return res.data ?? (res as unknown as ChatbotResponse);
};

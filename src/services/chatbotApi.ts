import { apiClient } from "@/lib/api-client";

export type ChatbotLanguage = "vi" | "en";

export interface ChatbotRequestPayload {
  message: string;
  language?: ChatbotLanguage;
  history?: ChatbotHistoryEntry[];
  systemPrompt?: string;
}

export interface ChatbotHistoryEntry {
  role: "system" | "user" | "assistant";
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

  // Chuẩn hoá lịch sử để chỉ gửi các role hợp lệ theo chuẩn OpenAI (system/user/assistant)
  const validRoles: ChatbotHistoryEntry["role"][] = ["system", "user", "assistant"];
  const normalizedHistory =
    Array.isArray(history)
      ? history.filter(
          (entry): entry is ChatbotHistoryEntry =>
            !!entry &&
            typeof entry.content === "string" &&
            (validRoles as string[]).includes(entry.role),
        )
      : [];

  const messages = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...normalizedHistory,
    { role: "user" as const, content: trimmed },
  ];

  const res = await apiClient.post<ChatbotResponse>("/chatbot", {
    message: trimmed,
    language,
    history: normalizedHistory,
    messages,
  });
  return res.data ?? (res as unknown as ChatbotResponse);
};

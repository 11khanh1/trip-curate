import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Paperclip, Send, Loader2, MessageSquare, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { sendChatbotMessage, type ChatbotLanguage } from "@/services/chatbotApi";
import { useChatWidget } from "@/context/ChatWidgetContext";

const MAX_CHATBOT_MESSAGE_LENGTH = 2000;

const quickReplies = [
  "Gợi ý tour Đà Lạt đang giảm giá",
  "Các mã khuyến mãi hiện có là gì?",
  "Làm sao để đặt tour nhiều người?",
];

const languageLabel: Record<ChatbotLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

const FloatingChatWidget = () => {
  const { toast } = useToast();
  const { isOpen, openChat, closeChat, toggleChat } = useChatWidget();
  const [chatMessage, setChatMessage] = useState("");
  const [chatLanguage, setChatLanguage] = useState<ChatbotLanguage>("en");
  const [chatHistory, setChatHistory] = useState<
    Array<{
      id: string;
      question: string;
      answer?: string;
      language: ChatbotLanguage;
      error?: string;
    }>
  >([]);

  const chatbotMutation = useMutation({
    mutationFn: sendChatbotMessage,
  });

  const resolveChatbotErrorMessage = (error: unknown): string => {
    if (isAxiosError(error)) {
      const backendMessage =
        (error.response?.data as { message?: string; error?: string })?.message ??
        (error.response?.data as { error?: string })?.error ??
        error.message;

      if (error.response?.status === 429) {
        return "Bạn đang gửi quá nhanh. Chatbot chỉ hỗ trợ tối đa 30 yêu cầu mỗi phút.";
      }

      if (backendMessage && backendMessage.toLowerCase().includes("openai")) {
        return "Chatbot đang tạm nghỉ vì thiếu cấu hình OPENAI_API_KEY. Vui lòng thử lại sau.";
      }

      if (backendMessage) {
        return backendMessage;
      }
    } else if (error instanceof Error) {
      return error.message;
    }
    return "Chatbot đang bận. Vui lòng thử lại sau ít phút.";
  };

  const handleSendMessage = (preset?: string, presetLanguage?: ChatbotLanguage) => {
    const raw = typeof preset === "string" ? preset : chatMessage;
    const trimmed = raw.trim();
    if (!trimmed) {
      toast({
        title: "Tin nhắn trống",
        description: "Vui lòng nhập câu hỏi trước khi gửi.",
        variant: "destructive",
      });
      return;
    }

    if (trimmed.length > MAX_CHATBOT_MESSAGE_LENGTH) {
      toast({
        title: "Tin nhắn quá dài",
        description: "Vui lòng rút gọn nội dung (tối đa 2000 ký tự).",
        variant: "destructive",
      });
      return;
    }

    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const turnLanguage = presetLanguage ?? chatLanguage;

    setChatHistory((prev) => [...prev, { id: turnId, question: trimmed, language: turnLanguage }]);
    setChatMessage("");

    chatbotMutation.mutate(
      { message: trimmed, language: turnLanguage },
      {
        onSuccess: (data) => {
          setChatHistory((prev) =>
            prev.map((item) => (item.id === turnId ? { ...item, answer: data.reply, language: data.language } : item)),
          );
        },
        onError: (error) => {
          const friendly = resolveChatbotErrorMessage(error);
          setChatHistory((prev) => prev.map((item) => (item.id === turnId ? { ...item, error: friendly } : item)));
          toast({
            title: "Không thể gửi tin nhắn",
            description: friendly,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const handleChatKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => (open ? openChat() : closeChat())}>
        <DialogContent
          position="floating"
          hideCloseButton
          overlayClassName="bg-transparent"
          className="bottom-24 right-6 w-full max-w-sm border-none bg-transparent p-0 shadow-none"
        >
          <div className="flex h-[560px] w-[360px] max-h-[80vh] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-orange-500/25 sm:h-[620px]">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#f97316] to-[#fb923c] px-4 py-3 text-white">
              <div>
                <p className="text-base font-semibold leading-tight">VietTravel</p>
                <p className="text-xs text-white/80">Assistant</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={closeChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div
                className="space-y-4 px-4 py-5"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 12% 18%, rgba(249,115,22,0.08) 0, transparent 45%), radial-gradient(circle at 80% 5%, rgba(59,130,246,0.08) 0, transparent 35%)",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      className="rounded-full border border-orange-300 bg-white px-4 text-xs font-medium text-orange-600 hover:bg-orange-50"
                      onClick={() => handleQuickReply(reply)}
                      disabled={chatbotMutation.isPending}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
                  <ScrollArea className="h-36 pr-2">
                    {chatHistory.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Chưa có cuộc trò chuyện. Hãy chọn gợi ý nhanh hoặc nhập câu hỏi bên dưới.
                      </p>
                    ) : (
                      <div className="space-y-3 text-sm">
                        {chatHistory.map((turn) => (
                          <div key={turn.id} className="space-y-1">
                            <div className="text-right">
                              <div className="inline-flex max-w-full rounded-2xl rounded-tr-sm bg-blue-500 px-3 py-2 text-xs font-medium text-white">
                                {turn.question}
                              </div>
                            </div>
                            {turn.answer ? (
                              <div className="text-left">
                                <div className="inline-flex max-w-full rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                                  {turn.answer}
                                </div>
                              </div>
                            ) : turn.error ? (
                              <p className="text-left text-xs text-destructive">{turn.error}</p>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Đang soạn câu trả lời...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Select
                      value={chatLanguage}
                      onValueChange={(value) => setChatLanguage(value as ChatbotLanguage)}
                      disabled={chatbotMutation.isPending}
                    >
                      <SelectTrigger className="w-32 border-orange-200 text-xs text-orange-600">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-600">
                      {languageLabel[chatLanguage]}
                    </span>
                  </div>
                  <span>Ctrl ⌘ + Enter để gửi nhanh.</span>
                </div>
              </div>
            </div>

            <div className="border-t bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-orange-600"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  rows={2}
                  placeholder="Nhập tin nhắn..."
                  className="border-none px-0 py-3 text-sm shadow-none focus-visible:ring-0"
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  maxLength={MAX_CHATBOT_MESSAGE_LENGTH}
                  disabled={chatbotMutation.isPending}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => handleSendMessage()}
                  disabled={chatbotMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {chatMessage.length}/{MAX_CHATBOT_MESSAGE_LENGTH} ký tự
                </span>
                {chatbotMutation.isPending && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    GPT-4o đang trả lời...
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition hover:scale-105 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
        aria-label="Mở chat hỗ trợ"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </>
  );
};

export default FloatingChatWidget;

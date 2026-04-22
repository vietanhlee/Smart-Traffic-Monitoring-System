import { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  loadChatDraft,
  saveChatDraft,
  clearChatDraft,
} from "@/utils/chatStorage";
import { authConfig, endpoints } from "@/config";
import {
  fetchChatHistory,
  clearServerChatHistory,
} from "@/services/chatHistoryService";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { ScrollArea } from "@/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Copy,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

function normalizeImageSource(raw: string): string {
  if (!raw) return raw;
  if (raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

// Custom markdown components for react-markdown v8+
const markdownComponents: Components = {
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "currentColor", textDecoration: "underline" }}
    />
  ),
  code: (props: { inline?: boolean; children?: React.ReactNode }) => {
    const { inline, children, ...rest } = props;
    return inline ? (
      <code
        {...rest}
        style={{
          background: "rgba(148, 163, 184, 0.2)",
          borderRadius: 4,
          padding: "2px 4px",
          fontSize: 13,
        }}
      >
        {children}
      </code>
    ) : (
      <pre
        style={{
          background: "#111827",
          color: "#e5e7eb",
          borderRadius: 6,
          padding: 12,
          overflowX: "auto",
        }}
      >
        <code>{children}</code>
      </pre>
    );
  },
  img: (props) => {
    const src = normalizeImageSource((props as { src?: string }).src ?? "");
    return (
      <img
        {...props}
        src={src}
        style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }}
        alt="Markdown img"
      />
    );
  },
  ul: (props) => <ul {...props} style={{ paddingLeft: 20, margin: "8px 0" }} />,
  ol: (props) => <ol {...props} style={{ paddingLeft: 20, margin: "8px 0" }} />,
  li: (props) => <li {...props} style={{ marginBottom: 4 }} />,
  blockquote: (props) => (
    <blockquote
      {...props}
      style={{
        borderLeft: "4px solid rgba(148,163,184,0.8)",
        background: "rgba(148, 163, 184, 0.12)",
        padding: "8px 16px",
        margin: "8px 0",
        borderRadius: 4,
        color: "inherit",
      }}
    />
  ),
  p: (props) => <p {...props} style={{ margin: "8px 0" }} />,
};
import { useWebSocket } from "../../../../hooks/useWebSocket";

// Helper function để tạo unique message ID với random string
const generateMessageId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `msg_${timestamp}_${random}`;
};

interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

const createWelcomeMessage = (): Message => ({
  id: "1",
  text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
  user: false,
  time: new Date().toLocaleTimeString("vi-VN"),
});

// Memoized MessageBubble component để tránh re-render không cần thiết
const MessageBubble = memo(
  ({
    msg,
    copiedMessageId,
    onCopyMessage,
    onPreviewImage,
  }: {
    msg: Message;
    copiedMessageId: string | null;
    onCopyMessage: (text: string, id: string) => void;
    onPreviewImage: (url: string) => void;
  }) => {
    const isUser = msg.user;
    const hasImage = Boolean(msg.image && msg.image.length > 0);

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`group flex items-start gap-3 w-full max-w-[min(96%,68rem)] ${
            isUser ? "flex-row-reverse ml-auto" : "mr-auto"
          }`}
        >
          <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700 shrink-0 mt-1">
            {isUser ? (
              <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                <User className="w-4 h-4" />
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            )}
          </Avatar>

          <div
            className={`flex min-w-0 flex-col ${isUser ? "items-end" : "items-start"} flex-1`}
          >
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>{isUser ? "Bạn" : "Trợ lý"}</span>
              <span className="text-slate-400 dark:text-slate-500">
                {msg.time}
              </span>
              {msg.typing && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 dark:text-slate-500" />
              )}
            </div>

            <div
              className={`w-fit max-w-[88%] text-[15px] leading-7 text-left break-words border ${
                isUser
                  ? "rounded-[1.8rem] px-6 py-4 bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-400/30 text-white shadow-[0_12px_30px_rgba(139,92,246,0.25)]"
                  : hasImage
                    ? "rounded-3xl px-5 py-5 bg-white/80 dark:bg-slate-900/55 border-slate-200/70 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
                    : "rounded-[1.8rem] px-6 py-4 bg-white/90 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 shadow-sm"
              }`}
            >
              {msg.image && msg.image.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-2">
                  {msg.image.map((imgData, i) => {
                    const normalizedImage = normalizeImageSource(imgData);
                    const isRemoteUrl =
                      normalizedImage.startsWith("http://") ||
                      normalizedImage.startsWith("https://");

                    return (
                      <div
                        key={i}
                        className="w-full sm:max-w-[620px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        <button
                          type="button"
                          className="w-full hover:opacity-95 transition"
                          onClick={() => onPreviewImage(normalizedImage)}
                          title="Xem ảnh lớn"
                        >
                          <img
                            src={normalizedImage}
                            alt="Ảnh chat"
                            className="w-full max-h-[460px] object-contain"
                            style={{ width: "100%" }}
                          />
                        </button>
                        {isRemoteUrl && (
                          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
                            <a
                              href={normalizedImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
                            >
                              Mở link ảnh gốc
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {msg.text && (
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>

            {!msg.typing && (
              <div className="flex items-center gap-2 mt-1.5 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCopyMessage(msg.text, msg.id)}
                  title="Sao chép nội dung"
                  className="h-7 w-7 p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {copiedMessageId === msg.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
  // Custom comparison function để optimize re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.msg.id === nextProps.msg.id &&
      prevProps.msg.text === nextProps.msg.text &&
      prevProps.msg.typing === nextProps.msg.typing &&
      prevProps.copiedMessageId === nextProps.copiedMessageId &&
      JSON.stringify(prevProps.msg.image) ===
        JSON.stringify(nextProps.msg.image)
    );
  },
);
MessageBubble.displayName = "MessageBubble";

function processImageUrlsInText(text: string): string {
  return text;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createWelcomeMessage(),
  ]);
  const [input, setInput] = useState(() => loadChatDraft());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hàm scroll xuống cuối
  const scrollToBottom = useCallback(() => {
    // Sử dụng setTimeout để đảm bảo DOM đã update xong
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  }, []);

  // Track current token to reload messages when user switches accounts
  const [currentToken, setCurrentToken] = useState(() =>
    localStorage.getItem(authConfig.TOKEN_KEY),
  );

  // Reload messages from backend when token changes (user logged in/out or switched accounts)
  useEffect(() => {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);

    if (token !== currentToken) {
      setCurrentToken(token);
      setInput(loadChatDraft());

      (async () => {
        if (!token) {
          setMessages([createWelcomeMessage()]);
          return;
        }
        const history = await fetchChatHistory(1, 100);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([createWelcomeMessage()]);
        }
      })();
    }
  }, [currentToken]);

  // Check token periodically in case user logs in/out in another tab
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem(authConfig.TOKEN_KEY);
      if (token !== currentToken) {
        setCurrentToken(token);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [currentToken]);

  // Persist draft input
  useEffect(() => {
    saveChatDraft(input);
  }, [input]);

  // Initial load from backend history
  useEffect(() => {
    const initialToken = localStorage.getItem(authConfig.TOKEN_KEY);
    // Debug log for initial token
    // console.log(
    //   "ChatInterface initial history load, token present:",
    //   Boolean(initialToken),
    //   "token length:",
    //   initialToken?.length ?? 0,
    // );
    if (!initialToken) {
      setMessages([createWelcomeMessage()]);
      return;
    }

    void (async () => {
      const history = await fetchChatHistory(1, 100);
      if (history.length > 0) {
        setMessages(history);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll khi messages thay đổi (gửi tin mới hoặc nhận tin mới)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll xuống cuối khi component mount (mở chat lần đầu)
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Chat WebSocket with authentication - setup trước để dùng trong handlers
  // Sử dụng currentToken (reactive state) thay vì đọc trực tiếp từ localStorage
  // để đảm bảo WebSocket hook nhận được token mới khi user đổi tài khoản
  const chatWsUrl = endpoints.chatWs;

  // Show message if no token
  useEffect(() => {
    if (!currentToken) {
      toast.error("Vui lòng đăng nhập để sử dụng chat AI");
    }
  }, [currentToken]);

  const {
    data: chatData,
    send: chatSocketSend,
    isConnected: isWsConnected,
    error: wsError,
  } = useWebSocket(chatWsUrl, {
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    authToken: currentToken,
  });

  useEffect(() => {
    if (wsError) {
      console.error("WebSocket Error:", wsError);
      // Only show error toast if it's a final error, not retry messages
      if (
        wsError.includes("Không thể kết nối với server") ||
        wsError.includes("Lỗi kết nối WebSocket")
      ) {
        toast.error(wsError);
      }
    }
  }, [wsError]);

  // Monitor connection status
  useEffect(() => {
    // Đã xoá popup thông báo kết nối thành công với AI
  }, [isWsConnected]);

  // Bỏ phần xử lý/biến đổi câu hỏi - gửi thẳng nội dung người dùng nhập

  // Memoize handlers để tránh re-create functions
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    // clear saved draft after sending
    clearChatDraft();
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: generateMessageId(),
      text: userMessage,
      user: true,
      time: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Scroll xuống sau khi thêm tin nhắn người dùng
    scrollToBottom();

    // Add typing indicator
    const typingMsg: Message = {
      id: "typing",
      text: "",
      user: false,
      time: "",
      typing: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      if (!isWsConnected) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "typing"),
          {
            id: generateMessageId(),
            text: "Không thể kết nối tới AI. Vui lòng thử lại sau.",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ]);
        toast.error("Không thể kết nối tới AI");
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Gửi thẳng tin nhắn người dùng tới AI
      const ok = chatSocketSend({ message: userMessage });

      if (!ok) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "typing"),
          {
            id: generateMessageId(),
            text: "Không thể gửi tin nhắn tới AI. Vui lòng thử lại.",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ]);
        toast.error("Không thể gửi tin nhắn tới AI");
        setIsLoading(false);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Remove typing indicator and add error message
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        {
          id: generateMessageId(),
          text: "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.",
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);

      toast.error("Không thể kết nối với AI");
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, isWsConnected, chatSocketSend, scrollToBottom]); // Dependencies for useCallback

  useEffect(() => {
    if (!chatData) return;
    try {
      // Log toàn bộ dữ liệu nhận được từ WebSocket
      const payload = chatData as
        | { message?: string; image?: string[] }
        | undefined;
      const responseText = payload?.message;
      const responseImage = payload?.image;

      // Log chi tiết từng phần của response

      // Chỉ bỏ qua nếu cả text và image đều không có hoặc undefined
      // Chấp nhận empty string vì AI có thể gửi text rỗng kèm ảnh
      const hasText = responseText !== undefined && responseText !== null;
      const hasImages = responseImage && responseImage.length > 0;

      if (!hasText && !hasImages) {
        setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      const imageUrls = (responseImage || []).map((img) =>
        normalizeImageSource(img),
      );

      // Process text to add authentication token to any image URLs in text
      const processedText = processImageUrlsInText(responseText ?? "");
      setMessages((prev) => {
        // Remove typing indicator
        const filtered = prev.filter((msg) => msg.id !== "typing");
        // Add AI response
        return [
          ...filtered,
          {
            id: generateMessageId(),
            text: processedText,
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
            image: imageUrls,
          },
        ];
      });
      // Bỏ toast success notification
      // toast.success("Đã nhận được phản hồi từ AI");
      setIsLoading(false);
      inputRef.current?.focus();
      // eslint-disable-next-line no-empty
    } catch (error) {
      toast.error("Lỗi khi xử lý phản hồi");
    }
  }, [chatData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Restore clearChat for delete button
  const clearChat = useCallback(async () => {
    const success = await clearServerChatHistory();
    setMessages([createWelcomeMessage()]);
    if (success) {
      toast.success("Đã xóa lịch sử chat");
    } else {
      toast.error("Không thể xóa lịch sử trên server");
    }
  }, []);

  const copyMessage = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Đã sao chép nội dung");
    } catch {
      toast.error("Không thể sao chép nội dung");
    }
  }, []);

  const handlePreviewImage = useCallback((rawImage: string) => {
    setPreviewImage(normalizeImageSource(rawImage));
  }, []);

  // --- COMPONENT RETURN ---
  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0b1020]">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(167,139,250,0.18),transparent_34%),radial-gradient(circle_at_84%_86%,rgba(59,130,246,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_15%_12%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_84%_86%,rgba(56,189,248,0.12),transparent_30%)]" />

      {/* ── Chat header ──────────────────────────────────── */}
      <div className="relative z-10 shrink-0 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shadow-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                Trợ lý AI giao thông
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Trả lời nhanh, có kèm ảnh realtime khi có dữ liệu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={
                isWsConnected
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 text-xs"
                  : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 text-xs"
              }
            >
              {isWsConnected ? (
                <Wifi className="w-3 h-3 mr-0.5" />
              ) : (
                <WifiOff className="w-3 h-3 mr-0.5" />
              )}
              {isWsConnected ? "Online" : "Offline"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              title="Xóa lịch sử chat"
              className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  copiedMessageId={copiedMessageId}
                  onCopyMessage={copyMessage}
                  onPreviewImage={handlePreviewImage}
                />
              ))}
            </AnimatePresence>
            {/* Anchor để scroll xuống */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* ── Input area ────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-xl">
        <form
          className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 sm:py-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <div className="rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/75 shadow-[0_4px_20px_rgba(15,23,42,0.08)] px-3 py-2 flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi về giao thông..."
                className="h-10 bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              variant="default"
              size="icon"
              disabled={isLoading || !input.trim()}
              title="Gửi"
              className="h-10 w-10 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl shadow-[0_4px_12px_rgba(139,92,246,0.35)]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Nhấn{" "}
            <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
              Enter
            </kbd>{" "}
            để gửi nhanh
          </p>
        </form>
      </div>

      {/* ── Image preview modal ───────────────────────────── */}
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </motion.div>
      )}
    </div>
  );
};
export default ChatInterface;

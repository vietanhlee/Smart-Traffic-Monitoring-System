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
import { Card, CardContent } from "@/ui/card";
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
  Download,
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
      style={{ color: "#2563eb", textDecoration: "underline" }}
    />
  ),
  code: (props: { inline?: boolean; children?: React.ReactNode }) => {
    const { inline, children, ...rest } = props;
    return inline ? (
      <code
        {...rest}
        style={{
          background: "#f3f4f6",
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
          background: "#1e293b",
          color: "#f8fafc",
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
        borderLeft: "4px solid #2563eb",
        background: "#f1f5f9",
        padding: "8px 16px",
        margin: "8px 0",
        borderRadius: 4,
        color: "#334155",
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

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

interface ChatInterfaceProps {
  trafficData: TrafficData;
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
        className={`flex ${msg.user ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`${
            msg.image && msg.image.length > 0
              ? "max-w-[90%] sm:max-w-[60%] md:max-w-[45%]"
              : "max-w-[60%] sm:max-w-[45%] md:max-w-[35%]"
          } flex flex-col gap-1 rounded-lg px-4 py-3 shadow-md border text-base transition-all hover:shadow-lg ${
            msg.user
              ? "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-right ml-auto"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-left mr-auto"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              {msg.user ? (
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              ) : (
                <AvatarFallback>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {msg.user ? "Bạn" : "AI"}
            </span>
            <span className="text-xs text-gray-400 ml-2">{msg.time}</span>
            {msg.typing && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />
            )}
          </div>
          {msg.image && msg.image.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-2">
              {msg.image.map((imgData, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full sm:max-w-[520px] h-auto hover:opacity-90 transition"
                  onClick={() => onPreviewImage(imgData)}
                  title="Xem ảnh lớn"
                >
                  <img
                    src={normalizeImageSource(imgData)}
                    alt="Ảnh chat"
                    className="w-full h-full rounded shadow border border-gray-200 dark:border-gray-700 object-contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                </button>
              ))}
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
          <div className="flex gap-2 mt-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopyMessage(msg.text, msg.id)}
              title="Sao chép nội dung"
              className="p-1"
            >
              {copiedMessageId === msg.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {msg.user && (
              <Badge variant="outline" className="text-xs">
                Bạn
              </Badge>
            )}
            {!msg.user && (
              <Badge variant="secondary" className="text-xs">
                AI
              </Badge>
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

const ChatInterface = ({ trafficData }: ChatInterfaceProps) => {
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
      console.log("[ChatInterface] Token changed, reloading messages");
      console.log("  Old token:", currentToken?.substring(0, 10));
      console.log("  New token:", token?.substring(0, 10));

      setCurrentToken(token);
      setInput(loadChatDraft());

      void (async () => {
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

        console.log(
          "[ChatInterface] Loaded",
          history.length,
          "messages from API",
        );
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
    if (!token) {
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

  // Kiểm tra trafficData
  useEffect(() => {
    const hasData = trafficData && Object.keys(trafficData).length > 0;
    console.log("Traffic Data Status:", {
      hasData,
      roads: Object.keys(trafficData || {}),
      data: trafficData,
    });

    if (!hasData && messages.length === 1) {
      // Chỉ hiển thị thông báo nếu là tin nhắn chào đầu tiên
      setMessages([
        {
          id: "1",
          text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Hiện tại hệ thống đang khởi động và thu thập dữ liệu giao thông. Tôi sẽ thông báo ngay khi có thông tin từ các tuyến đường.",
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);
    }
  }, [trafficData, messages.length]);

  // Auto-scroll khi messages thay đổi (gửi tin mới hoặc nhận tin mới)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll xuống cuối khi component mount (mở chat lần đầu)
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Chat WebSocket with authentication - setup trước để dùng trong handlers
  const token = localStorage.getItem(authConfig.TOKEN_KEY);
  const chatWsUrl = endpoints.chatWs;

  // Show message if no token
  useEffect(() => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng chat AI");
    }
  }, [token]);

  const {
    data: chatData,
    send: chatSocketSend,
    isConnected: isWsConnected,
    error: wsError,
  } = useWebSocket(chatWsUrl, {
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    authToken: token,
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
    console.log("WebSocket Connection Status:", isWsConnected);
    if (isWsConnected) {
      toast.success("Đã kết nối với AI thành công!");
    }
  }, [isWsConnected]);

  // Bỏ phần xử lý/biến đổi câu hỏi - gửi thẳng nội dung người dùng nhập

  // Memoize handlers để tránh re-create functions
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    console.log("Sending message:", { message: userMessage }); // Log tin nhắn gửi đi
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
      console.log("Message sent status:", ok);

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
  }, [input, isLoading, isWsConnected, chatSocketSend]); // Dependencies for useCallback

  useEffect(() => {
    if (!chatData) return;
    try {
      // Log toàn bộ dữ liệu nhận được từ WebSocket
      console.log("WebSocket Raw Response:", chatData);
      const payload = chatData as
        | { message?: string; image?: string[] }
        | undefined;
      const responseText = payload?.message;
      const responseImage = payload?.image;

      // Log chi tiết từng phần của response
      console.log("Response Text:", responseText);
      console.log("Response Images:", responseImage);

      // Chỉ bỏ qua nếu cả text và image đều không có hoặc undefined
      // Chấp nhận empty string vì AI có thể gửi text rỗng kèm ảnh
      const hasText = responseText !== undefined && responseText !== null;
      const hasImages = responseImage && responseImage.length > 0;

      if (!hasText && !hasImages) {
        console.log("No text or images in response, skipping");
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

      console.log("Processed Response:", {
        text: processedText,
        images: imageUrls,
        hasText: !!processedText,
        hasImages: imageUrls.length > 0,
      });

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
    } catch (error) {
      console.error("Error processing WebSocket response:", error);
      toast.error("Lỗi khi xử lý phản hồi");
    }
    setIsLoading(false);
    inputRef.current?.focus();
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

  const exportHistory = useCallback(() => {
    try {
      const dataStr = JSON.stringify(messages, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-history-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất lịch sử chat");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất lịch sử chat");
    }
  }, [messages]);

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
    <Card className="h-[calc(100vh-8rem)] min-h-[600px] max-h-[900px] flex flex-col relative shadow-xl">
      {/* Floating action buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={exportHistory}
          title="Xuất lịch sử chat"
          className="bg-white/90 dark:bg-gray-900/90 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          title="Xóa lịch sử chat"
          className="bg-white/90 dark:bg-gray-900/90 hover:bg-red-50 dark:hover:bg-red-900/50 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
        </Button>
      </div>
      <CardContent className="flex-1 p-3 sm:p-6 overflow-hidden">
        <ScrollArea className="h-full w-full pr-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-3 sm:gap-4">
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
            {/* Invisible element để scroll xuống */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </CardContent>
      <form
        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi về giao thông..."
          className="flex-1 h-11 sm:h-12"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={isLoading || !input.trim()}
          title="Gửi"
          className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </form>
      {/* Simple image preview modal */}
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
    </Card>
  );
};
export default ChatInterface;

import { useState, useRef, useEffect } from "react";
// Component fetch và hiển thị ảnh từ URL API (có token)
const ChatImageFromUrl = ({ url }: { url: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function fetchImg() {
      setError(false);
      try {
        const authUrl = addTokenToImageUrl(url);
        const res = await fetch(authUrl);
        if (!res.ok) throw new Error("fetch error");
        const blob = await res.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setError(true);
      }
    }
    fetchImg();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line
  }, [url]);
  if (error)
    return <div className="text-xs text-red-500">Không thể tải ảnh</div>;
  if (!blobUrl)
    return <div className="w-32 h-24 bg-gray-200 animate-pulse rounded" />;
  return (
    <img
      src={blobUrl}
      alt="Ảnh chat"
      className="w-full h-full rounded shadow border border-gray-200 dark:border-gray-700 object-contain"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
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
  img: (props) => (
    <img
      {...props}
      style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }}
      alt="Markdown img"
    />
  ),
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
import { useWebSocket } from "../../../hooks/useWebSocket";

import { endpoints } from "../../../config";

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
const STORAGE_KEY = "chat_history";

// extractImageLinks and removeImageLinksFromText are unused, removed for lint clean
function addTokenToImageUrl(url: string): string {
  if (!url) return url;
  url = url.replace(/([?&])token=[^&]+(&)?/, (p1, p2) => (p2 ? p1 : ""));
  if (url.includes("localhost:8000") || url.includes("127.0.0.1:8000")) {
    const token = localStorage.getItem("access_token");
    if (token) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}token=${encodeURIComponent(token)}`;
    }
  }
  return url;
}
function processImageUrlsInText(text: string): string {
  if (!text) return text;
  const imgRegex =
    /(https?:\/\/[\w\-./%?=&@]+\.(?:jpg|jpeg|png|webp|gif|bmp))(?!\S)/gi;
  return text.replace(imgRegex, (match) => {
    return addTokenToImageUrl(match);
  });
}

const ChatInterface = ({ trafficData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Khởi tạo từ localStorage nếu có
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Nếu lỗi, xóa localStorage và trả về mặc định
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return [
      {
        id: "1",
        text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
        user: false,
        time: new Date().toLocaleTimeString("vi-VN"),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 👉 Lưu messages vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Tìm tên tuyến đường từ câu hỏi
  const findRequestedRoad = (question: string): string | null => {
    const roadNames = trafficData ? Object.keys(trafficData) : [];
    return (
      roadNames.find((road) =>
        question.toLowerCase().includes(road.toLowerCase())
      ) || null
    );
  };

  // Phân tích loại câu hỏi để xử lý phù hợp
  const analyzeQuestionType = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (
      lowerQuestion.includes("tuyến nào nên đi") ||
      lowerQuestion.includes("đường nào tốt") ||
      lowerQuestion.includes("nên đi đâu")
    ) {
      return "route_recommendation";
    }
    if (
      lowerQuestion.includes("tuyến nào tắc") ||
      lowerQuestion.includes("đường nào tắc") ||
      lowerQuestion.includes("tắc nhất")
    ) {
      return "congestion_analysis";
    }
    if (
      lowerQuestion.includes("tình trạng") ||
      lowerQuestion.includes("tình hình") ||
      lowerQuestion.includes("giao thông")
    ) {
      return "traffic_overview";
    }
    if (lowerQuestion.includes("tốc độ") || lowerQuestion.includes("vận tốc")) {
      return "speed_analysis";
    }
    if (
      lowerQuestion.includes("có nên đi") ||
      lowerQuestion.includes("đi được không")
    ) {
      return "route_evaluation";
    }
    if (
      lowerQuestion.includes("so sánh") ||
      lowerQuestion.includes("khác nhau")
    ) {
      return "comparison";
    }

    return "general";
  };

  const buildMonitoringInfo = (data: TrafficData) => {
    return Object.entries(data)
      .map(
        ([roadName, info]) =>
          `${roadName}: ${info.count_car} ô tô, ${
            info.count_motor
          } xe máy. Vận tốc: ${info.speed_car.toFixed(1)} km/h`
      )
      .join("; ");
  };

  const buildSmartPrompt = (
    monitoringInfo: string,
    userMessage: string,
    questionType: string
  ) => {
    const baseData = `Dữ liệu giao thông hiện tại: ${monitoringInfo}`;

    switch (questionType) {
      case "route_recommendation":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy đề xuất tuyến đường tốt nhất dựa trên dữ liệu giao thông hiện tại.`;
      case "congestion_analysis":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy phân tích các tuyến đường đang tắc dựa trên dữ liệu giao thông.`;
      case "traffic_overview":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy tóm tắt tình trạng giao thông hiện tại một cách ngắn gọn.`;
      case "speed_analysis":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy phân tích vận tốc các phương tiện trên các tuyến đường.`;
      case "route_evaluation":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy đánh giá tuyến đường được hỏi dựa trên dữ liệu giao thông.`;
      case "comparison":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy so sánh các tuyến đường dựa trên dữ liệu giao thông.`;
      default:
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy trả lời câu hỏi một cách thân thiện và hữu ích .`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    console.log("Sending message:", { message: userMessage }); // Log tin nhắn gửi đi
    setInput("");
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      user: true,
      time: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages((prev) => [...prev, userMsg]);

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
            id: Date.now().toString(),
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

      // Phân tích loại câu hỏi và xây dựng prompt thông minh
      const questionType = analyzeQuestionType(userMessage);
      let fullPrompt = userMessage;

      // Kiểm tra dữ liệu giao thông và tuyến đường cụ thể
      const requestedRoad = findRequestedRoad(userMessage);

      if (!trafficData || Object.keys(trafficData).length === 0) {
        fullPrompt = userMessage;
      } else if (requestedRoad && !trafficData[requestedRoad]) {
        fullPrompt = userMessage;
      } else {
        const monitoringInfo = buildMonitoringInfo(trafficData);
        fullPrompt = buildSmartPrompt(
          monitoringInfo,
          userMessage,
          questionType
        );
      }

      const ok = chatSocketSend({ message: fullPrompt }); // Gửi prompt thông minh tới AI
      console.log("Message sent status:", ok);

      if (!ok) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "typing"),
          {
            id: Date.now().toString(),
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
          id: Date.now().toString(),
          text: "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.",
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);

      toast.error("Không thể kết nối với AI");
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Chat WebSocket with authentication
  const token = localStorage.getItem("access_token");
  const chatWsUrl = token
    ? `${endpoints.chatWs}?token=${encodeURIComponent(token)}`
    : null;

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

  useEffect(() => {
    if (!chatData) return;
    try {
      // Log toàn bộ dữ liệu nhận được từ WebSocket
      console.log("WebSocket Raw Response:", chatData);

      const responseText = chatData?.text as string | undefined;
      const responseImage = chatData?.image as string[] | undefined;

      // Log chi tiết từng phần của response
      console.log("Response Text:", responseText);
      console.log("Response Images:", responseImage);

      // Nếu cả text và image đều không tồn tại -> bỏ qua
      if (
        (!responseText || responseText === "") &&
        (!responseImage || responseImage.length === 0)
      ) {
        setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Process image URLs to add authentication token
      const imageUrls = (responseImage || []).map((url) =>
        addTokenToImageUrl(url)
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
            id: Date.now().toString(),
            text: processedText,
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
            image: imageUrls,
          },
        ];
      });

      toast.success("Đã nhận được phản hồi từ AI");
    } catch (error) {
      console.error("Error processing WebSocket response:", error);
      toast.error("Lỗi khi xử lý phản hồi");
    }
    setIsLoading(false);
    inputRef.current?.focus();
  }, [chatData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Restore clearChat for delete button
  const clearChat = () => {
    const welcomeMsg: Message = {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
      user: false,
      time: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages([welcomeMsg]);
    toast.success("Đã xóa lịch sử chat");
  };

  const copyMessage = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Đã sao chép nội dung");
    } catch {
      toast.error("Không thể sao chép nội dung");
    }
  };

  // --- COMPONENT RETURN ---
  return (
    <Card className="h-[600px] sm:h-[500px] md:h-[600px] flex flex-col relative">
      {/* Floating delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={clearChat}
        title="Xóa lịch sử chat"
        className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-900/80 hover:bg-red-100 dark:hover:bg-red-900 border border-gray-200 dark:border-gray-700 shadow"
      >
        <Trash2 className="w-5 h-5 text-red-500" />
      </Button>
      <CardContent className="flex-1 p-2 sm:p-4 overflow-hidden">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    msg.user ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[60%] sm:max-w-[45%] md:max-w-[35%] flex flex-col gap-1 rounded-lg px-4 py-3 shadow-md border text-base ${
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
                      <span className="text-xs text-gray-400 ml-2">
                        {msg.time}
                      </span>
                      {msg.typing && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />
                      )}
                    </div>
                    {msg.image && msg.image.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-2">
                        {msg.image.map((imgUrl, i) => (
                          <div key={i} className="w-full max-w-[520px] h-auto">
                            <ChatImageFromUrl url={imgUrl} />
                          </div>
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
                        onClick={() => copyMessage(msg.text, msg.id)}
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
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
      <form
        className="flex items-center gap-2 p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700"
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
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={isLoading || !input.trim()}
          title="Gửi"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </Card>
  );
};
export default ChatInterface;

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
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
import { useWebSocket } from "@/hooks/useWebSocket";
import { endpoints } from "@/config";

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
}

interface ChatInterfaceProps {
  trafficData: TrafficData;
}

const ChatInterface = ({ trafficData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
      user: false,
      time: new Date().toLocaleTimeString("vi-VN"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const buildMonitoringInfo = (data: TrafficData) => {
    return Object.entries(data)
      .map(
        ([roadName, info]) =>
          `${roadName}: ${info.count_car} ô tô (${info.speed_car.toFixed(
            1
          )} km/h), ${info.count_motor} xe máy (${info.speed_motor.toFixed(
            1
          )} km/h)`
      )
      .join("; ");
  };

  const buildPrompt = (monitoringInfo: string, userMessage: string) => {
    return `Bạn là một trợ lý AI thông minh cho hệ thống giao thông. Dưới đây là thông tin giao thông hiện tại:
${monitoringInfo}

Hãy trả lời câu hỏi sau một cách thân thiện và hữu ích: ${userMessage}

Lưu ý: Hãy trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu. Nếu được hỏi về tình trạng giao thông, hãy phân tích dựa trên số lượng xe (>15 xe là tắc, 8-15 xe là đông, <8 xe là thông thoáng).`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
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
      // Build prompt with current traffic data
      let fullPrompt = userMessage;
      if (Object.keys(trafficData).length > 0) {
        const monitoringInfo = buildMonitoringInfo(trafficData);
        fullPrompt = buildPrompt(monitoringInfo, userMessage);
      } else {
        fullPrompt = `Hiện tại hệ thống đang cập nhật dữ liệu giao thông. Bạn hãy trả lời như một trợ lý AI thông minh: ${userMessage}`;
      }

      const ok = chatSocketSend({ message: fullPrompt });
      if (!ok) {
        throw new Error("WebSocket not connected");
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Remove typing indicator and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "typing");
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            text: "Xin lỗi, tôi không thể kết nối với hệ thống. Vui lòng thử lại sau.",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ];
      });

      toast.error("Không thể kết nối với AI");
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Chat WebSocket
  const { data: chatData, send: chatSocketSend } = useWebSocket(endpoints.chatWs);

  useEffect(() => {
    if (!chatData) return;
    try {
      const responseText = chatData?.response as string | undefined;
      if (!responseText) return;

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "typing");
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            text: responseText,
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ];
      });
      toast.success("Đã nhận được phản hồi từ AI");
    } catch {}
    setIsLoading(false);
    inputRef.current?.focus();
  }, [chatData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep only the welcome message
    toast.success("Đã xóa lịch sử chat");
  };

  const copyMessage = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Đã sao chép tin nhắn");
    } catch {
      toast.error("Không thể sao chép tin nhắn");
    }
  };

  // Custom markdown components for styling
  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="ml-2">{children}</li>,
    code: ({ children, className }) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ) : (
        <code className={className}>{children}</code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2 text-sm">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">
        {children}
      </blockquote>
    ),
    h1: ({ children }) => (
      <h1 className="text-lg font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-bold mb-1">{children}</h3>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 underline"
      >
        {children}
      </a>
    ),
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Trợ Lý AI Giao Thông</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {messages.length - 1} tin nhắn
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages - Takes up remaining space */}
        <div className="flex-1 min-h-0 mb-4">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${
                      message.user ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[80%] ${
                        message.user ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback
                          className={
                            message.user
                              ? "bg-blue-500 text-white"
                              : "bg-purple-500 text-white"
                          }
                        >
                          {message.user ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`rounded-lg p-3 ${
                          message.user
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {message.typing ? (
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 ml-2">
                              Đang trả lời...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm leading-relaxed">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={markdownComponents}
                              >
                                {message.text}
                              </ReactMarkdown>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span
                                className={`text-xs ${
                                  message.user
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {message.time}
                              </span>
                              {!message.user && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    copyMessage(message.text, message.id)
                                  }
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tình trạng giao thông..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;

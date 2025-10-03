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
  image?: string[];
}

interface ChatInterfaceProps {
  trafficData: TrafficData;
}
const STORAGE_KEY = "chat_history";

const ChatInterface = ({ trafficData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Khởi tạo từ localStorage nếu có
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Message[];
      } catch {
        return [
          {
            id: "1",
            text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ];
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
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy phân tích dữ liệu và đưa ra khuyến nghị tuyến đường tốt nhất dựa trên vận tốc và mật độ xe. Bắt đầu bằng câu trả lời trực tiếp, sau đó giải thích lý do.`;

      case "congestion_analysis":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy xác định tuyến đường có tình trạng tắc nghẽn nhất dựa trên vận tốc và số lượng xe. Đưa ra câu trả lời rõ ràng về tuyến tệ nhất.`;

      case "traffic_overview":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy tóm tắt tình hình giao thông tổng quan, không liệt kê chi tiết từng tuyến. Đưa ra nhận xét chung về tình trạng giao thông.`;

      case "speed_analysis":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy phân tích và so sánh tốc độ giữa các tuyến đường. Tính toán tốc độ trung bình và đưa ra nhận xét.`;

      case "route_evaluation":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy đánh giá cụ thể tuyến đường được hỏi dựa trên dữ liệu. Đưa ra lời khuyên có nên đi hay không và lý do.`;

      case "comparison":
        return `${baseData}\n\nNgười dùng hỏi: "${userMessage}"\n\nHãy so sánh các tuyến đường dựa trên dữ liệu. Đưa ra bảng so sánh và kết luận.`;

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
        // Fallback response khi không có kết nối
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== "typing");
          return [
            ...filtered,
            {
              id: Date.now().toString(),
              text: "Xin lỗi, hiện tại tôi không thể kết nối với máy chủ. Tôi sẽ cố gắng kết nối lại và trả lời bạn sớm nhất có thể.",
              user: false,
              time: new Date().toLocaleTimeString("vi-VN"),
            },
          ];
        });
        setIsLoading(false);
        throw new Error("WebSocket chưa được kết nối");
      }

      // Phân tích loại câu hỏi và xây dựng prompt thông minh
      const questionType = analyzeQuestionType(userMessage);
      let fullPrompt = userMessage;

      // Kiểm tra dữ liệu giao thông và tuyến đường cụ thể
      const requestedRoad = findRequestedRoad(userMessage);

      if (!trafficData || Object.keys(trafficData).length === 0) {
        fullPrompt =
          "Xin lỗi, hiện tại hệ thống đang khởi động và chưa có dữ liệu giao thông. Vui lòng thử lại sau vài giây.";
      } else if (requestedRoad && !trafficData[requestedRoad]) {
        fullPrompt = `Xin lỗi, tôi không tìm thấy dữ liệu cho tuyến ${requestedRoad}. Các tuyến đường đang được giám sát là: ${Object.keys(
          trafficData
        ).join(", ")}.`;
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
        throw new Error("Không thể gửi tin nhắn");
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
  const {
    data: chatData,
    send: chatSocketSend,
    isConnected: isWsConnected,
    error: wsError,
  } = useWebSocket(endpoints.chatWs);

  useEffect(() => {
    if (wsError) {
      console.error("WebSocket Error:", wsError);
      toast.error(`Lỗi kết nối: ${wsError}`);
    }
  }, [wsError]);

  // Monitor connection status
  useEffect(() => {
    console.log("WebSocket Connection Status:", isWsConnected);
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
        return;
      }

      // Use the image URLs directly as they are already properly formatted
      const imageUrls = responseImage || [];

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "typing");
        const newMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText ?? "", // cho phép text rỗng nếu chỉ có ảnh
          image: imageUrls, // Use URLs directly
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        };

        // Prevent adding exact duplicate (same text and same images) repeatedly
        const last = filtered[filtered.length - 1];
        const isDuplicate =
          last &&
          last.text === newMessage.text &&
          JSON.stringify(last.image || []) === JSON.stringify(newMessage.image);

        if (isDuplicate) {
          console.log("Duplicate message received — skipping append.");
          return filtered;
        }

        console.log("Appending new message (text length, images):", {
          textLength: (newMessage.text || "").length,
          imageCount: newMessage.image.length,
        });

        return [...filtered, newMessage];
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
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Đã sao chép tin nhắn");
    } catch {
      toast.error("Không thể sao chép tin nhắn");
    }
  };

  // Custom markdown components for styling
  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-1 sm:mb-2 last:mb-0 text-xs sm:text-sm break-words">{children}</p>,
    strong: ({ children }) => (
      <strong className="font-semibold break-words">{children}</strong>
    ),
    em: ({ children }) => <em className="italic break-words">{children}</em>,
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm break-words">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm break-words">{children}</ol>
    ),
    li: ({ children }) => <li className="ml-1 sm:ml-2 break-words">{children}</li>,
    code: ({ children, className }) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono break-all">
          {children}
        </code>
      ) : (
        <code className={`${className} break-all`}>{children}</code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-3 rounded-lg overflow-x-auto mb-1 sm:mb-2 text-xs sm:text-sm break-all">
        {children}
      </pre>
    ),
    img: ({ src, alt }) => {
      if (!src) return null;

      // Log để debug src
      console.log("Markdown Image src:", src);

      return (
        <img
          src={src} // Use URL directly as it's already properly formatted
          alt={alt || "AI generated image"}
          className="max-w-full h-auto rounded-lg shadow-lg mb-1 sm:mb-2"
          onError={(e) => {
            console.error("Markdown Image load error:", e);
            e.currentTarget.style.display = "none";
          }}
        />
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 sm:border-l-4 border-gray-300 dark:border-gray-600 pl-2 sm:pl-4 italic mb-1 sm:mb-2 text-xs sm:text-sm break-words">
        {children}
      </blockquote>
    ),
    h1: ({ children }) => (
      <h1 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2 break-words">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xs sm:text-base font-bold mb-1 sm:mb-2 break-words">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 break-words">{children}</h3>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 underline text-xs sm:text-sm break-all"
      >
        {children}
      </a>
    ),
  };

  return (
    <Card className="h-[600px] sm:h-[500px] md:h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Trợ Lý AI Giao Thông</span>
          </CardTitle>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              {messages.length - 1} tin nhắn
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length <= 1}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Xóa</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 px-3 sm:px-6">
        {/* Messages - Takes up remaining space */}
        <div className="flex-1 min-h-0 mb-3 sm:mb-4">
          <ScrollArea className="h-full pr-2 sm:pr-4" ref={scrollAreaRef}>
            <div className="space-y-3 sm:space-y-4">
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
                      className={`flex items-start space-x-2 sm:space-x-3 max-w-[90%] sm:max-w-[85%] ${
                        message.user ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                        <AvatarFallback
                          className={
                            message.user
                              ? "bg-blue-500 text-white text-xs"
                              : "bg-purple-500 text-white text-xs"
                          }
                        >
                          {message.user ? (
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`rounded-lg p-2 sm:p-3 min-w-0 flex-1 ${
                          message.user
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {message.image && message.image.length > 0 && (
                          <div className="mb-2">
                            {message.image.map((imgSrc, index) => (
                              <img
                                key={index}
                                src={imgSrc}
                                alt={`AI generated image ${index + 1}`}
                                className="max-w-full h-auto rounded-lg shadow-lg mb-2"
                                onError={(e) => {
                                  console.error(
                                    `Image ${index + 1} load error:`,
                                    e
                                  );
                                  e.currentTarget.style.display = "none";
                                  const errorDiv = document.createElement("div");
                                  errorDiv.textContent = "Không thể tải ảnh";
                                  errorDiv.className = "text-red-500 text-xs sm:text-sm";
                                  if (e.currentTarget.parentNode) {
                                    e.currentTarget.parentNode.appendChild(errorDiv);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {message.typing ? (
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 ml-2">
                              Đang trả lời...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs sm:text-sm leading-relaxed break-words overflow-wrap-anywhere">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={markdownComponents}
                              >
                                {message.text}
                              </ReactMarkdown>
                            </div>
                            <div className="flex items-center justify-between mt-1 sm:mt-2">
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
                                  className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                  onClick={() =>
                                    copyMessage(message.text, message.id)
                                  }
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
            className="flex-1 text-sm sm:text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;

// Đã xoá dòng thừa useState và khai báo state ở đầu file
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import ChatMessage from "./ChatMessage";

export default function ChatBox() {
  const [messages, setMessages] = useState([
    {
      text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có cần hỗ trợ gì không?",
      user: false,
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const chatRef = useRef();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    const now = new Date().toLocaleTimeString();
    setMessages((msgs) => [
      ...msgs,
      { text: userMessage, user: true, time: now },
    ]);
    setInput("");
    setIsLoading(true);
    try {
      let fullPrompt = userMessage;
      try {
        const resultsResponse = await fetch("http://127.0.0.1:8000/results");
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          if (resultsData && Object.keys(resultsData).length > 0) {
            const filteredData = {};
            Object.entries(resultsData).forEach(([videoName, info]) => {
              filteredData[videoName] = {
                count_car: info.count_car,
                count_motor: info.count_motor,
                speed_car: info.speed_car,
                speed_motor: info.speed_motor,
              };
            });
            const monitoringInfo = JSON.stringify(filteredData, null, 2);
            fullPrompt = `Bạn hãy dựa vào các thông tin sau và trả lời câu hỏi:\n\nDữ liệu giám sát giao thông hiện tại:\n${monitoringInfo}\n\nCâu hỏi: ${userMessage}`;
          }
        }
      } catch (resultsError) {
        fullPrompt = `Hiện tại các API bị lỗi cho nên không có dữ liệu, bạn hãy là một chatbot đời thường thông minh trả lời câu hỏi: ${userMessage}`;
      }
      const response = await fetch(
        `http://127.0.0.1:8000/chat/${encodeURIComponent(fullPrompt)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        {
          text: data.response || "Không có phản hồi từ hệ thống",
          user: false,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setMessages((msgs) => [
        ...msgs,
        {
          text: "Xin lỗi, tôi không thể kết nối với hệ thống. Vui lòng thử lại sau.",
          user: false,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 100,
        right: 40,
        zIndex: 1000,
        background: collapsed
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: collapsed ? 50 : 32,
        padding: collapsed ? 0 : 36,
        boxShadow: collapsed
          ? "0 4px 16px rgba(102,126,234,0.18)"
          : "0 24px 48px rgba(0, 0, 0, 0.12)",
        display: "flex",
        flexDirection: "column",
        height: collapsed ? 70 : 750,
        width: collapsed ? 70 : 480,
        minWidth: collapsed ? 70 : 340,
        maxWidth: "100%",
        border: "1px solid #e2e8f0",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        cursor: collapsed ? "pointer" : "default",
        transition: "all 0.3s",
      }}
      onClick={() => {
        if (collapsed) setCollapsed(false);
      }}
    >
      {/* Collapse/Expand button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed((c) => !c);
        }}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          background: collapsed
            ? "rgba(255,255,255,0.8)"
            : "rgba(102,126,234,0.12)",
          border: "none",
          borderRadius: 20,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(102,126,234,0.10)",
        }}
        title={collapsed ? "Mở chat" : "Thu gọn"}
      >
        {collapsed ? (
          <MessageCircle size={22} color="#667eea" />
        ) : (
          <span style={{ fontSize: 22, color: "#667eea", fontWeight: 900 }}>
            &minus;
          </span>
        )}
      </button>
      {collapsed ? null : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <MessageCircle size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: "#1a202c",
                }}
              >
                Trợ lý AI
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: 0,
                }}
              >
                Luôn sẵn sàng hỗ trợ bạn
              </p>
            </div>
          </div>
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: 16,
              paddingRight: 8,
            }}
          >
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} {...msg} />
            ))}
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 16,
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid #e2e8f0",
                    borderTop: "2px solid #667eea",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>Đang suy nghĩ...</span>
              </div>
            )}
          </div>
          <form
            onSubmit={handleSend}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: 16,
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s",
                background: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: "12px 16px",
                background:
                  input.trim() && !isLoading
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#e2e8f0",
                color: input.trim() && !isLoading ? "white" : "#64748b",
                border: "none",
                borderRadius: 12,
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
              }}
            >
              <Send size={16} />
              Gửi
            </button>
          </form>
        </>
      )}
    </div>
  );
}

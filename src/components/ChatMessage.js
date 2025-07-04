import React from "react";
import { Bot } from "lucide-react";

export default function ChatMessage({ text, user, time }) {
  return (
    <div
      className={`chat-message ${user ? "user" : "bot"}`}
      style={{
        display: "flex",
        flexDirection: user ? "row-reverse" : "row",
        alignItems: "flex-start",
        marginBottom: 16,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: user
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 14,
          fontWeight: "bold",
          marginLeft: user ? 12 : 0,
          marginRight: user ? 0 : 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {user ? "U" : <Bot size={20} />}
      </div>
      <div
        style={{
          maxWidth: "70%",
          background: user
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          color: user ? "white" : "#1a202c",
          padding: "12px 16px",
          borderRadius: user ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          fontSize: 15,
          lineHeight: 1.5,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          border: user ? "none" : "1px solid #e2e8f0",
        }}
      >
        <div>{text}</div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            marginTop: 4,
            textAlign: user ? "right" : "left",
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

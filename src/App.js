import VideoGrid from "./components/VideoGrid";
import ChatBox from "./components/ChatBox";
import React, { useState } from "react";

// Đã xoá duplicate SmartTrafficSystem
// ...existing code...

// Component chính
export default function SmartTrafficSystem() {
  const [focused, setFocused] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            overflow-x: hidden;
          }
        `}
      </style>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          padding: "24px 0",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            textAlign: "center",
            animation: "fadeIn 0.8s ease-out",
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              margin: 0,
              textShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              letterSpacing: "-1px",
            }}
          >
            🚦 Hệ Thống Giao Thông Thông Minh
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.9)",
              margin: "12px 0 0 0",
              fontWeight: 400,
            }}
          >
            Giám sát và phân tích giao thông thời gian thực
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 0",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 32,
          minHeight: "calc(100vh - 140px)",
        }}
      >
        <div
          style={{
            marginLeft: 0,
            marginRight: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          <VideoGrid focused={focused} setFocused={setFocused} />
        </div>
        <div
          style={{
            marginRight: 0,
            marginLeft: 0,
            paddingRight: 0,
            paddingLeft: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <ChatBox />
        </div>
      </div>
    </div>
  );
}

// main.js

const { useState, useEffect, useRef } = React;

// Create animated background particles
function createParticles() {
  const container = document.getElementById("particles");
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.width = Math.random() * 4 + 2 + "px";
    particle.style.height = particle.style.width;
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = Math.random() * 4 + 4 + "s";
    container.appendChild(particle);
  }
}

function VideoCard({ videoName, info, onClick }) {
  const carAlert = info.speed_car > 60;
  const motorAlert = info.speed_motor > 50;
  const hasAlert = carAlert || motorAlert;

  let imgSrc = "";
  if (info.frame) {
    imgSrc = info.frame.startsWith("data:")
      ? info.frame
      : `data:image/jpeg;base64,${info.frame}`;
  }

  return (
    <div className="video-card" onClick={onClick}>
      <div className="video-preview">
        {imgSrc ? (
          <img src={imgSrc} alt={`Khung hình từ ${videoName}`} />
        ) : (
          <div style={{ color: "#64748b", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📹</div>
            <div>Đang kết nối...</div>
          </div>
        )}
        {hasAlert && <div className="alert-badge">🚨 Vượt tốc độ</div>}
      </div>
      <div className="video-info">
        <div className="video-title">📍 {videoName}</div>
        {info.count_car !== undefined ? (
          <>
            <div className="stats-row">
              <div className="stat-item">
                🚗 <span>{info.count_car} xe</span>
              </div>
              <div className={`stat-item ${carAlert ? "stat-highlight" : ""}`}>
                {info.speed_car} km/h
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-item">
                🏍️ <span>{info.count_motor} xe</span>
              </div>
              <div
                className={`stat-item ${motorAlert ? "stat-highlight" : ""}`}
              >
                {info.speed_motor} km/h
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: "#ef4444", fontSize: "0.9rem" }}>
            ⚠️ Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}

function VideoGrid() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    const fetchResults = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/results");
        const data = await response.json();
        setData(data);
        setLoading(false);
      } catch (error) {
        setData(null);
        setLoading(false);
      }
      timer = setTimeout(fetchResults, 1000);
    };
    fetchResults();
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div
          className="loading"
          style={{
            width: "40px",
            height: "40px",
            borderWidth: "4px",
            margin: "0 auto 1rem",
          }}
        ></div>
        <div style={{ color: "#64748b" }}>Đang tải dữ liệu giám sát...</div>
      </div>
    );
  }

  const videos = data || {
    "Camera 1": {},
    "Camera 2": {},
    "Camera 3": {},
    "Camera 4": {},
  };

  return (
    <div className="video-grid">
      {Object.entries(videos).map(([videoName, info]) => (
        <VideoCard
          key={videoName}
          videoName={videoName}
          info={info}
          onClick={() => console.log(`Clicked ${videoName}`)}
        />
      ))}
    </div>
  );
}

function ChatMessage({ message, isUser, time }) {
  return (
    <div className={`message ${isUser ? "user" : "bot"}`}>
      <div
        className={`message-avatar ${isUser ? "user-avatar" : "bot-avatar"}`}
      >
        {isUser ? "👤" : "🤖"}
      </div>
      <div>
        <div className="message-content">{message}</div>
        <div className="message-time">{time}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message bot">
      <div className="message-avatar bot-avatar">🤖</div>
      <div className="typing-indicator">
        <span>AI đang suy nghĩ</span>
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
}

function ChatBox() {
  const [messages, setMessages] = useState([
    {
      message:
        "Xin chào! Tôi là AI Assistant của hệ thống giám sát. Bạn cần hỗ trợ gì không? 🚀",
      isUser: false,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const currentTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        message: userMessage,
        isUser: true,
        time: currentTime,
      },
    ]);

    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Call API
      const response = await fetch(
        `http://127.0.0.1:8000/chat/${encodeURIComponent(userMessage)}`
      );
      const data = await response.json();

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            message:
              data.response ||
              "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.",
            isUser: false,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            message: "❌ Không thể kết nối với server. Vui lòng thử lại sau.",
            isUser: false,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>💬</span>
          <div>
            <div style={{ fontWeight: "600" }}>AI Chat Support</div>
            <div style={{ fontSize: "0.85rem", opacity: "0.9" }}>
              Luôn sẵn sàng hỗ trợ bạn
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <ChatMessage key={index} {...msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Nhập câu hỏi của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <span>🚀</span>
                Gửi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  useEffect(() => {
    createParticles();
  }, []);

  return (
    <div className="main-container">
      <div className="video-section">
        <h2 className="section-title">📹 Giám Sát Camera Realtime</h2>
        <VideoGrid />
      </div>

      <ChatBox />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Dashboard />);

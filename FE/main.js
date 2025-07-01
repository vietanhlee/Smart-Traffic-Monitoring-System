const { useState, useEffect, useRef } = React;

function VideoCard({ videoName, info }) {
  const carAlert = info.speed_car > 60;
  const motorAlert = info.speed_motor > 50;
  let imgSrc = info.frame.startsWith("data:")
    ? info.frame
    : `data:image/jpeg;base64,${info.frame}`;

  return (
    <div
      className="card"
      style={{ borderColor: carAlert || motorAlert ? "#ff7675" : "#e3e8ee" }}
    >
      <div style={{ position: "relative" }}>
        <img src={imgSrc} alt="Khung hình từ video" />
        {(carAlert || motorAlert) && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "#ff7675",
              color: "#fff",
              borderRadius: 8,
              padding: "4px 12px",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 2px 8px #d63031a0",
              letterSpacing: 1,
              zIndex: 2,
              animation: "pulse 1.2s infinite",
            }}
          >
            🚨 Cảnh báo tốc độ
          </span>
        )}
      </div>
      <div className="info">
        <h3>🎥 {videoName}</h3>
        <p>
          🚗 Ô tô:{" "}
          <span className={carAlert ? "highlight" : ""}>
            {info.count_car} xe – {info.speed_car} km/h
          </span>
        </p>
        <p>
          🏍️ Xe máy:{" "}
          <span className={motorAlert ? "highlight" : ""}>
            {info.count_motor} xe – {info.speed_motor} km/h
          </span>
        </p>
      </div>
    </div>
  );
}

function VideoGrid() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    const fetchResults = () => {
      fetch("http://127.0.0.1:8000/results")
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch(() => {
          setData(null);
          setLoading(false);
        });
      timer = setTimeout(fetchResults, 300);
    };
    fetchResults();
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ gridColumn: "1/3", textAlign: "center", padding: 60 }}>
        <div className="loader"></div>
        <div style={{ marginTop: 18, fontSize: 20, color: "#007acc" }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="error" style={{ gridColumn: "1/3" }}>
        ❌ Không thể lấy dữ liệu từ API.
      </div>
    );
  }
  return (
    <div id="output">
      {Object.entries(data).map(([videoName, info]) => (
        <VideoCard key={videoName} videoName={videoName} info={info} />
      ))}
    </div>
  );
}

function ChatMessage({ text, user, time }) {
  return (
    <div className={"chat-message" + (user ? " user" : "")}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {!user && (
          <img
            src="https://i.imgur.com/0y0y0y0.png"
            alt="bot"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#eee",
              border: "2px solid #00b894",
              marginRight: 2,
            }}
          />
        )}
        <div className="bubble">{text}</div>
        {user && (
          <img
            src="https://i.imgur.com/8Km9tLL.png"
            alt="user"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#eee",
              border: "2px solid #007acc",
              marginLeft: 2,
            }}
          />
        )}
      </div>
      <div className="meta">
        {user ? "Bạn" : "Hệ thống"} • {time}
      </div>
    </div>
  );
}

function ChatBox() {
  const [messages, setMessages] = useState([
    {
      text: "Xin chào! Bạn cần hỗ trợ gì không?",
      user: false,
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef();

  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString();
    setMessages((msgs) => [...msgs, { text: input, user: true, time: now }]);
    setInput("");
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          text: "Đã nhận: " + input,
          user: false,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }, 700);
  };

  return (
    <div className="chat-section">
      <div className="chat-header">💬 Chat Giám Sát</div>
      <div className="chat-messages" id="chat-messages" ref={chatRef}>
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} {...msg} />
        ))}
      </div>
      <form
        className="chat-input"
        id="chat-form"
        autoComplete="off"
        onSubmit={handleSend}
      >
        <input
          type="text"
          id="chat-text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <button type="submit">Gửi</button>
      </form>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="video-section">
        <VideoGrid />
      </div>
      <ChatBox />
    </div>
  );
}

// Loader animation
const style = document.createElement("style");
style.innerHTML = `
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 #ff767580; }
  70% { box-shadow: 0 0 0 12px #ff767500; }
  100% { box-shadow: 0 0 0 0 #ff767500; }
}
.loader {
  border: 6px solid #e3e8ee;
  border-top: 6px solid #007acc;
  border-radius: 50%;
  width: 54px;
  height: 54px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(<Dashboard />);

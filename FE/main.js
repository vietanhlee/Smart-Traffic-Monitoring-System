const { useState, useEffect, useRef } = React;
function VideoCard({ videoName, info, onClick, isFocused, onClose }) {
  const carAlert = info.speed_car > 60;
  const motorAlert = info.speed_motor > 50;
  let imgSrc =
    info.frame && info.frame.startsWith("data:")
      ? info.frame
      : info.frame
      ? `data:image/jpeg;base64,${info.frame}`
      : "";

  return (
    <div
      className={"card" + (isFocused ? " focused" : "")}
      style={{
        borderColor: carAlert || motorAlert ? "#ff7675" : "#e3e8ee",
        maxWidth: isFocused ? "900px" : "1600px",
        width: isFocused ? "900px" : "100%",
        margin: "0 auto",
        boxShadow: isFocused ? "0 0 0 4px #007acc33" : undefined,
        zIndex: isFocused ? 100 : 1,
        position: isFocused ? "relative" : undefined,
        cursor: isFocused ? "default" : "pointer",
        transition: "all 0.2s",
      }}
      onClick={isFocused ? undefined : onClick}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 8,
          background: "#222",
          height: isFocused ? "600px" : "300px",
          width: isFocused ? "900px" : "400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Khung hình từ video"
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "cover",
              borderRadius: 8,
              display: "block",
              background: "#222",
            }}
          />
        ) : (
          <span
            style={{
              color: "#ff7675",
              fontWeight: 700,
              fontSize: 22,
              textAlign: "center",
            }}
          >
            API không tồn tại hoặc không thể kết nối
          </span>
        )}
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
        {isFocused && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "#fff",
              color: "#007acc",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 18,
              padding: "2px 12px",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px #007acc22",
            }}
          >
            Đóng
          </button>
        )}
      </div>
      <div className="info">
        <h3>🎥 {videoName}</h3>
        {info.count_car !== undefined ? (
          React.createElement(
            React.Fragment,
            null,
            <p>
              🚗 Ô tô:{" "}
              <span className={carAlert ? "highlight" : ""}>
                {info.count_car} xe – {info.speed_car} km/h
              </span>
            </p>,
            <p>
              🏍️ Xe máy:{" "}
              <span className={motorAlert ? "highlight" : ""}>
                {info.count_motor} xe – {info.speed_motor} km/h
              </span>
            </p>
          )
        ) : (
          <p style={{ color: "#ff7675", fontWeight: 600 }}>Không có dữ liệu</p>
        )}
      </div>
    </div>
  );
}

function VideoGrid({ focused, setFocused }) {
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
      timer = setTimeout(fetchResults, 150);
    };
    fetchResults();
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ gridColumn: "1/4", textAlign: "center", padding: 60 }}>
        <div className="loader"></div>
        <div style={{ marginTop: 18, fontSize: 20, color: "#007acc" }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }
  // 3 columns grid for both error and normal state
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    alignItems: 'flex-start',
    width: '100%',
    padding: 8,
    boxSizing: 'border-box',
  };
  if (!data) {
    const fakeVideos = ["Video 1", "Video 2", "Video 3"];
    return (
      <div id="output" style={gridStyle}>
        {fakeVideos.map((videoName) => (
          <VideoCard
            key={videoName}
            videoName={videoName}
            info={{}}
            onClick={() => setFocused(videoName)}
            isFocused={focused === videoName}
            onClose={() => setFocused(null)}
          />
        ))}
      </div>
    );
  }
  return (
    <div id="output" style={gridStyle}>
      {Object.entries(data).map(
        ([videoName, info]) =>
          (focused === null || focused === videoName) && (
            <VideoCard
              key={videoName}
              videoName={videoName}
              info={info}
              onClick={() => setFocused(videoName)}
              isFocused={focused === videoName}
              onClose={() => setFocused(null)}
            />
          )
      )}
    </div>
  );
}

function ChatMessage({ text, user, time }) {
  return (
    <div className={"chat-message" + (user ? " user" : "")}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {!user && (
          <img
            src="https://img.icons8.com/?size=100&id=cjaav1k9qYa5&format=png&color=000000"
            alt="bot"
            style={{
              width: 40,
              height: 40,
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
            src="https://img.icons8.com/?size=100&id=23280&format=png&color=000000"
            alt="user"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#eee",
              border: "2px solid rgb(13, 94, 148)",
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
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef();

  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    const now = new Date().toLocaleTimeString();
    
    // Thêm tin nhắn của user
    setMessages((msgs) => [...msgs, { text: userMessage, user: true, time: now }]);
    setInput("");
    setIsLoading(true);

    try {
      let fullPrompt = userMessage;
      
      // Thử lấy dữ liệu monitoring trước khi gọi chat API
      try {
        const resultsResponse = await fetch("http://127.0.0.1:8000/results");
        
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          
          if (resultsData && Object.keys(resultsData).length > 0) {
            // Lọc dữ liệu (chỉ lấy thông tin cần thiết)
            const filteredData = {};
            Object.entries(resultsData).forEach(([videoName, info]) => {
              filteredData[videoName] = {
                count_car: info.count_car,
                count_motor: info.count_motor,
                speed_car: info.speed_car,
                speed_motor: info.speed_motor
              };
            });
            
            const monitoringInfo = JSON.stringify(filteredData, null, 2);
            fullPrompt = `Bạn hãy dựa vào các thông tin sau và trả lời câu hỏi:

Dữ liệu giám sát giao thông hiện tại:
${monitoringInfo}

Câu hỏi: ${userMessage}`;
          }
        }
      } catch (resultsError) {
        console.log('API results bị lỗi, sử dụng chế độ chatbot thông thường');
        // Nếu API results lỗi, thêm context cho chatbot thông thường
        fullPrompt = `Hiện tại các API bị lỗi cho nên không có dữ liệu, bạn hãy là một chatbot đời thường thông minh trả lời câu hỏi: ${userMessage}`;
      }
      
      // Gọi API chat với prompt đã xử lý
      const response = await fetch(`http://127.0.0.1:8000/chat/${encodeURIComponent(fullPrompt)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Thêm phản hồi từ hệ thống
      setMessages((msgs) => [
        ...msgs,
        {
          text: data.response || "Không có phản hồi từ hệ thống",
          user: false,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error('Lỗi khi gọi API chat:', error);
      // Thêm thông báo lỗi
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
    <div className="chat-section" style={{ padding: 32, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px #007acc22', minHeight: 700, height: '90vh', display: 'flex', flexDirection: 'column', maxWidth: 900, width: '100%' }}>
      <div className="chat-header" style={{ fontSize: 32, fontWeight: 800, color: '#0a2540', marginBottom: 18, letterSpacing: 1, textShadow: '0 2px 8px #007acc22' }}>💬 Chat Giám Sát</div>
      <div className="chat-messages" id="chat-messages" ref={chatRef} style={{ flex: 1, overflowY: 'auto', marginBottom: 18, paddingRight: 8, color: '#222', fontSize: 20, fontWeight: 500 }}>
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} {...msg} />
        ))}
      </div>
      <form
        className="chat-input"
        id="chat-form"
        autoComplete="off"
        onSubmit={handleSend}
        style={{ display: 'flex', gap: 12 }}
      >
        <input
          type="text"
          id="chat-text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
          style={{ flex: 1, fontSize: 20, padding: '14px 18px', borderRadius: 10, border: '2px solid #007acc', outline: 'none', color: '#222', background: '#f8fbff' }}
        />
        <button type="submit" style={{ fontSize: 20, fontWeight: 700, background: '#007acc', color: '#fff', border: 'none', borderRadius: 10, padding: '0 32px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px #007acc22' }}>Gửi</button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [focused, setFocused] = useState(null);
  return (
    <div
      className="dashboard-container"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 24,
        width: '100vw',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div style={{
        flex: 1,
        minWidth: 1200,
        maxWidth: 1800,
        marginLeft: 0,
        position: 'fixed',
        left: 0,
        top: 100,
        zIndex: 200,
        height: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        background: 'transparent',
        pointerEvents: 'none',
      }}>
        <div style={{ width: '100%', pointerEvents: 'auto' }}>
          <div className="video-section">
            <VideoGrid focused={focused} setFocused={setFocused} />
          </div>
        </div>
      </div>
      <div style={{
        flex: 1,
        minWidth: 600,
        maxWidth: 1100,
        marginRight: 0,
        position: 'fixed',
        right: 0,
        top: 100,
        zIndex: 200,
        height: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        background: 'transparent',
        pointerEvents: 'none',
      }}>
        <div style={{ width: '100%', pointerEvents: 'auto' }}>
          <ChatBox />
        </div>
      </div>
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
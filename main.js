function fetchResults() {
  fetch("http://127.0.0.1:8000/results")
    .then((res) => res.json())
    .then((data) => {
      const output = document.getElementById("output");
      output.innerHTML = "";

      for (const [videoName, info] of Object.entries(data)) {
        const card = document.createElement("div");
        card.className = "card";

        // Nếu frame không có prefix, thêm vào
        let imgSrc = info.frame.startsWith("data:")
          ? info.frame
          : `data:image/jpeg;base64,${info.frame}`;

        const carAlert = info.speed_car > 60 ? "highlight" : "";
        const motorAlert = info.speed_motor > 50 ? "highlight" : "";

        card.innerHTML = `
          <img src="${imgSrc}" alt="Khung hình từ video">
          <div class="info">
            <h3>🎥 ${videoName}</h3>
            <p>🚗 Ô tô: <span class="${carAlert}">${info.count_car} xe – ${info.speed_car} km/h</span></p>
            <p>🏍️ Xe máy: <span class="${motorAlert}">${info.count_motor} xe – ${info.speed_motor} km/h</span></p>
          </div>
        `;
        output.appendChild(card);
      }
    })
    .catch((err) => {
      const output = document.getElementById("output");
      output.innerHTML =
        "<p class='error'>❌ Không thể lấy dữ liệu từ API.</p>";
      console.error(err);
    });
}

fetchResults();
setInterval(fetchResults, 100); // Cập nhật mỗi 100ms

// Simple chat FE (local only)
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-text");
const chatMessages = document.getElementById("chat-messages");

function appendMessage(text, user = true) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "chat-message" + (user ? " user" : "");
  msgDiv.innerHTML = `
    <div class="bubble">${text}</div>
    <div class="meta">${
      user ? "Bạn" : "Hệ thống"
    } • ${new Date().toLocaleTimeString()}</div>
  `;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage(text, true);
  chatInput.value = "";
  // Giả lập phản hồi hệ thống
  setTimeout(() => {
    appendMessage("Đã nhận: " + text, false);
  }, 700);
});

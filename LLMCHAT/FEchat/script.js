const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function appendMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  appendMessage(message, "user");
  userInput.value = "";
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/chat/${encodeURIComponent(message)}`
    );
    if (!res.ok) throw new Error("Lỗi server!");
    const data = await res.json();
    appendMessage(data.response, "bot");
  } catch (err) {
    appendMessage("Đã xảy ra lỗi khi kết nối server.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendMessage();
});

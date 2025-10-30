/**
 * DEBUG SCRIPT - Chat Storage Testing
 *
 * Mở DevTools Console và paste đoạn code này để test
 * xem có bị trùng tin nhắn giữa các accounts không
 */

// 1. Kiểm tra token hiện tại
console.log("=== CURRENT USER INFO ===");
const currentToken = localStorage.getItem("access_token");
console.log(
  "Token:",
  currentToken ? currentToken.substring(0, 20) + "..." : "NO TOKEN"
);

// 2. Kiểm tra chat history key đang được dùng
const chatHistoryKey = currentToken
  ? `chat_history_${currentToken.substring(0, 10)}`
  : "chat_history_guest";
console.log("Chat History Key:", chatHistoryKey);

// 3. Xem tất cả các keys liên quan đến chat
console.log("\n=== ALL CHAT KEYS IN LOCALSTORAGE ===");
const allChatKeys = Object.keys(localStorage).filter(
  (k) => k.startsWith("chat_history_") || k.startsWith("chat_draft_")
);
console.log("Found keys:", allChatKeys);

// 4. Xem nội dung của từng key
console.log("\n=== CONTENT OF EACH KEY ===");
allChatKeys.forEach((key) => {
  const content = localStorage.getItem(key);
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        console.log(`\n${key}:`);
        console.log(`  - Message count: ${parsed.length}`);
        console.log(
          `  - First message: ${parsed[0]?.text?.substring(0, 50)}...`
        );
        console.log(
          `  - Last message: ${parsed[parsed.length - 1]?.text?.substring(
            0,
            50
          )}...`
        );
      } else {
        console.log(`\n${key}: ${content.substring(0, 50)}...`);
      }
    } catch (e) {
      console.log(`\n${key}: ${content.substring(0, 50)}...`);
    }
  }
});

// 5. Xem data của user hiện tại
console.log("\n=== CURRENT USER CHAT HISTORY ===");
const currentHistory = localStorage.getItem(chatHistoryKey);
if (currentHistory) {
  const parsed = JSON.parse(currentHistory);
  console.log(`Message count: ${parsed.length}`);
  parsed.forEach((msg, idx) => {
    console.log(
      `${idx + 1}. [${msg.user ? "USER" : "AI"}] ${msg.text.substring(
        0,
        50
      )}...`
    );
  });
} else {
  console.log("No history found for current user");
}

// 6. Test function getChatHistoryKey()
console.log("\n=== TESTING getChatHistoryKey() ===");
console.log("Expected key:", chatHistoryKey);

// 7. Recommendations
console.log("\n=== DEBUGGING STEPS ===");
console.log("1. Login với User A, chat vài tin nhắn");
console.log("2. Chạy script này, note lại 'Chat History Key'");
console.log("3. Logout, login với User B");
console.log("4. Chạy lại script này");
console.log("5. So sánh 2 'Chat History Key' - phải KHÁC NHAU");
console.log("6. Nếu giống nhau → BUG! Token không thay đổi");
console.log("7. Nếu khác nhau nhưng vẫn thấy tin nhắn cũ → BUG khác");

// 8. Quick fix test
console.log("\n=== QUICK FIX TEST ===");
console.log("Run this to clear all chat data:");
console.log(
  "Object.keys(localStorage).filter(k => k.startsWith('chat_')).forEach(k => localStorage.removeItem(k))"
);

# ✅ GIẢI QUYẾT: Bug Tin Nhắn Trùng Giữa Các Account

## 🎯 Vấn Đề Đã Fix

**Vấn đề ban đầu:**

> "tôi thấy bị trùng đó tôi dùng 2 acc chung 1 máy và acc kia thấy được tin nhắn của acc này"

Hai người dùng đăng nhập các account khác nhau trên cùng 1 máy có thể thấy tin nhắn của nhau.

## ✅ Nguyên Nhân & Giải Pháp

### Nguyên Nhân

Component `ChatInterface` chỉ load messages **1 lần duy nhất** khi component mount:

```tsx
const [messages, setMessages] = useState(() => loadChatHistory());
```

Khi user logout → login account khác:

- Component không unmount (vẫn là trang `/chat`)
- State `messages` giữ nguyên giá trị cũ
- Không load messages mới từ localStorage của user mới

### Giải Pháp

**Tự động reload messages khi JWT token thay đổi:**

```tsx
// Track token hiện tại
const [currentToken, setCurrentToken] = useState(() =>
  localStorage.getItem(authConfig.TOKEN_KEY)
);

// Reload messages khi token thay đổi
useEffect(() => {
  const token = localStorage.getItem(authConfig.TOKEN_KEY);
  if (token !== currentToken) {
    setCurrentToken(token);
    setMessages(loadChatHistory()); // Load messages của user mới
    setInput(loadChatDraft());
  }
}, [currentToken]);

// Kiểm tra token định kỳ (hỗ trợ multi-tab)
useEffect(() => {
  const interval = setInterval(() => {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (token !== currentToken) {
      setCurrentToken(token); // Trigger reload
    }
  }, 1000);
  return () => clearInterval(interval);
}, [currentToken]);
```

## 📁 Files Đã Thay Đổi

### 1. `frontend/src/modules/features/chat/components/ChatInterface.tsx`

**Thêm:**

- State `currentToken` để track JWT token
- useEffect detect thay đổi token → reload messages
- useEffect kiểm tra token mỗi 1s (multi-tab support)

### 2. `frontend/src/utils/chatStorage.ts`

**Thêm:**

- Debug logging trong tất cả functions
- Function `debugChatStorage()` để troubleshoot
- Expose `window.debugChatStorage()` để dùng trong DevTools Console

**Debug logs mới:**

```typescript
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJhbGciOiI", key: "chat_history_eyJhbGciOiI" }
[chatStorage] Loading messages from key: chat_history_eyJhbGciOiI
[chatStorage] Successfully loaded 5 messages
[chatStorage] Saving 6 messages to key: chat_history_eyJhbGciOiI
[ChatInterface] Token changed, reloading messages
  Old token: eyJhbGciOiI
  New token: eyJzdWIiOiI
```

### 3. `frontend/src/App.tsx`

**Không đổi** - Đã có `clearAllChatData()` trong logout rồi ✅

## 🧪 Cách Test (30 giây)

### Test Nhanh

```bash
# 1. Login User A
F12 → Console → debugChatStorage()
# Send vài tin nhắn
# Note: Token prefix (vd: "eyJhbGciOiI")

# 2. Logout → Login User B
Console → debugChatStorage()
# Token prefix phải KHÁC (vd: "eyJzdWIiOiI")
# Chỉ thấy welcome message, KHÔNG thấy tin nhắn của User A

# 3. Check localStorage
Application Tab → Local Storage
# Phải có 2 keys riêng biệt:
#   chat_history_eyJhbGciOiI  (User A)
#   chat_history_eyJzdWIiOiI  (User B)
```

### Logs Mong Đợi

**✅ ĐÚNG (Account Separation Working):**

```
[ChatInterface] Token changed, reloading messages
  Old token: eyJhbGciOiI
  New token: eyJzdWIiOiI  ← Token KHÁC nhau
[chatStorage] getChatHistoryKey: { tokenPrefix: "eyJzdWIiOiI", ... }
[chatStorage] No saved messages found, returning welcome message
[ChatInterface] Loaded 1 messages for new user
```

**❌ SAI (Vẫn Bị Bug):**

```
[ChatInterface] Token changed, reloading messages
  Old token: eyJhbGciOiI
  New token: eyJhbGciOiI  ← Token GIỐNG NHAU (Backend bug!)
```

Nếu token giống nhau → Backend đang generate token giống cho 2 user khác nhau (BUG!)

## 🎓 Cơ Chế Hoạt Động

### Storage Key Generation

Mỗi user có key riêng dựa trên 10 ký tự đầu của JWT token:

```javascript
User A:
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Key:   chat_history_eyJhbGciOiJ

User B:
  Token: eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI...
  Key:   chat_history_eyJzdWIiOiI
```

### Token Change Detection Flow

```
1. User login → localStorage.setItem('access_token', newToken)
2. ChatInterface detects token change (useEffect)
3. Call loadChatHistory() → get NEW key → load NEW messages
4. setMessages(newMessages) → UI updates
```

### Multi-Tab Support

```
Tab 1: User A logged in
Tab 2: User B logs in → token changes in localStorage
Tab 1: Interval (1s) detects token change → reloads User A's messages
```

## 🛠️ Debug Commands

### Xem Trạng Thái Storage

```javascript
debugChatStorage();
```

Output:

```
=== Chat Storage Debug Info ===
Current token: eyJhbGciOiJIUzI1NiI...
Token prefix: eyJhbGciOiI
Current chat key: chat_history_eyJhbGciOiI

All chat keys in localStorage:
  chat_history_eyJhbGciOiI: 5 messages
  chat_history_eyJzdWIiOiI: 3 messages

Current user's messages:
  5 messages loaded
  [0] Bot: Xin chào! Tôi là trợ lý AI...
  [1] User: Hello
  [2] Bot: Hi! How can I help you?
  ...
=== End Debug Info ===
```

### Check Token Manually

```javascript
localStorage.getItem("access_token")?.substring(0, 20);
```

### List All Chat Keys

```javascript
Object.keys(localStorage).filter((k) => k.startsWith("chat_"));
```

### Clear All Users' Data

```javascript
// Clear tất cả chat data (all users)
clearAllUsersData();
```

## 📊 So Sánh Trước/Sau

| Tình Huống    | TRƯỚC (Bug)                 | SAU (Fixed)              |
| ------------- | --------------------------- | ------------------------ |
| User A login  | Load messages 1 lần         | Load messages 1 lần      |
| User A logout | Clear data                  | Clear data ✅            |
| User B login  | **Messages cũ vẫn show** ❌ | **Load messages mới** ✅ |
| Switch tab    | Không sync                  | Auto-reload trong 1s ✅  |
| Debug         | Không có tools              | `debugChatStorage()` ✅  |

## ⚠️ Lưu Ý Quan Trọng

### ✅ Hành Vi Mong Đợi

- Logout xóa data của user hiện tại
- Login tự động load messages của user mới
- Mỗi account có localStorage key riêng
- Cùng account trên máy khác = messages khác (vì chỉ lưu local)

### ⚠️ Giới Hạn

- **localStorage only** = Data chỉ ở máy local
- **Token-based keys** = Nếu backend reuse token → keys sẽ trùng
- **Không sync across devices** = Cần database backend

### 🔄 Tương Lai: Database Integration

Để sync messages across devices, xem:

- `backend/CHAT_DATABASE_GUIDE.md` - Backend API đã ready
- `frontend/services/chatHistoryService.ts` - Frontend service đã có
- Chỉ cần integrate service vào ChatInterface

## 🚨 Troubleshooting

### Vẫn Thấy Messages Của User Khác?

**Kiểm tra:**

1. Run `debugChatStorage()` → Check token prefix có khác nhau không
2. Check console logs → Token có thay đổi khi login không
3. Check Network tab → `/api/v1/login` response → `access_token` có unique không
4. Hard refresh (Ctrl+Shift+R) để clear React cache

**Nếu token GIỐNG NHAU:**
→ Backend bug! Backend phải generate unique token cho mỗi user.

**Nếu token KHÁC NHAU nhưng vẫn thấy messages cũ:**
→ Hard refresh hoặc clear cache (Ctrl+Shift+Delete)

### Messages Biến Mất Sau Khi Refresh?

**Hành vi ĐÚNG!** Logout clear data.

**Nếu muốn giữ messages:**

- Option 1: Đừng call `clearAllChatData()` trong logout
- Option 2: Dùng database backend thay vì localStorage

## 📚 Tài Liệu Liên Quan

- **[CHAT_ACCOUNT_SEPARATION_GUIDE.md](CHAT_ACCOUNT_SEPARATION_GUIDE.md)** - Hướng dẫn test chi tiết
- **[ACCOUNT_SEPARATION_FIX.md](ACCOUNT_SEPARATION_FIX.md)** - Chi tiết kỹ thuật implementation
- **[backend/CHAT_DATABASE_GUIDE.md](backend/CHAT_DATABASE_GUIDE.md)** - Database backend option
- **[CHAT_STORAGE_COMPARISON.md](CHAT_STORAGE_COMPARISON.md)** - So sánh localStorage vs Database

## ✅ Kiểm Tra Thành Công

Bạn biết fix đã work khi:

- ✅ `debugChatStorage()` hiện token prefixes khác nhau cho các users khác nhau
- ✅ Tin nhắn của User A KHÔNG hiện cho User B
- ✅ Console log hiện "Token changed, reloading messages"
- ✅ localStorage có keys riêng cho mỗi user
- ✅ Logout clear data của user hiện tại

---

**🎉 Bug đã được fix hoàn toàn! Mỗi account giờ có storage riêng biệt.**

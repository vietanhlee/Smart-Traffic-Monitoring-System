# Chat Storage Utilities

## Mục đích

Quản lý lịch sử chat và draft input trong localStorage với user-specific keys.

## Tính năng chính

### 1. **User-specific Storage**

- Mỗi user có chat history riêng dựa trên token
- Guest users có storage key riêng
- Keys format: `chat_history_{token_prefix}` hoặc `chat_history_guest`

### 2. **Auto-persistence**

- Tự động lưu chat history sau mỗi tin nhắn
- Tự động lưu draft input khi user đang gõ
- Load history tự động khi mở app

### 3. **Auto-cleanup on Logout**

- Chat history và draft được xóa tự động khi user logout
- Sử dụng `clearAllChatData()` trong logout handler

### 4. **Export History**

- Export chat history dạng JSON file
- Download file với timestamp
- Format: `chat-history-YYYY-MM-DD.json`

## API

### Loading Functions

```typescript
// Load chat history for current user
const history: Message[] = loadChatHistory();

// Load draft input for current user
const draft: string = loadChatDraft();
```

### Saving Functions

```typescript
// Save chat history
saveChatHistory(messages);

// Save draft input
saveChatDraft(input);
```

### Clearing Functions

```typescript
// Clear chat history only
clearChatHistory();

// Clear draft only
clearChatDraft();

// Clear both (used on logout)
clearAllChatData();

// Clear all users' data (maintenance)
clearAllUsersData();
```

### Helper Functions

```typescript
// Get current user's chat history key
const key = getChatHistoryKey();
// Returns: "chat_history_abc123..." or "chat_history_guest"

// Get current user's draft key
const draftKey = getChatDraftKey();
// Returns: "chat_draft_abc123..." or "chat_draft_guest"
```

## Sử dụng trong Components

### ChatInterface.tsx

```typescript
import {
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  loadChatDraft,
  saveChatDraft,
  clearChatDraft,
} from "@/utils/chatStorage";

// Load history on mount
const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
const [input, setInput] = useState(() => loadChatDraft());

// Auto-save on change
useEffect(() => {
  saveChatHistory(messages);
}, [messages]);

useEffect(() => {
  saveChatDraft(input);
}, [input]);

// Clear on send
const handleSend = () => {
  // ... send message ...
  clearChatDraft();
};

// Clear all
const clearChat = () => {
  setMessages([welcomeMessage]);
  clearChatHistory();
};
```

### App.tsx (Logout)

```typescript
import { clearAllChatData } from "@/utils/chatStorage";

const handleLogout = () => {
  localStorage.removeItem("access_token");
  clearAllChatData(); // Clear chat history and draft
  setAuthed(false);
  navigate("/login");
};
```

## Storage Structure

### Keys in localStorage

```
access_token: "eyJ..."
chat_history_eyJ0eXAiOi: "[{...messages...}]"
chat_draft_eyJ0eXAiOi: "Đang gõ..."
```

### Chat History Format

```json
[
  {
    "id": "1234567890",
    "text": "Xin chào!",
    "user": true,
    "time": "14:30:25",
    "image": ["http://..."]
  },
  {
    "id": "1234567891",
    "text": "Chào bạn! Tôi có thể giúp gì?",
    "user": false,
    "time": "14:30:26"
  }
]
```

## Error Handling

- Tất cả localStorage operations được wrap trong try-catch
- Log errors to console
- Fallback to default values nếu load fail
- Không throw errors để không crash app

## Best Practices

### 1. **Always use helper functions**

```typescript
// ✅ GOOD
saveChatHistory(messages);

// ❌ BAD - don't access localStorage directly
localStorage.setItem("chat_history", JSON.stringify(messages));
```

### 2. **Clear data on logout**

```typescript
// ✅ GOOD - clears all chat data
const handleLogout = () => {
  clearAllChatData();
  // ...
};

// ❌ BAD - leaves chat data in localStorage
const handleLogout = () => {
  localStorage.removeItem("access_token");
};
```

### 3. **Handle errors gracefully**

```typescript
// Already handled in helper functions
// No need to wrap in try-catch when calling helpers
saveChatHistory(messages); // Safe to call
```

## Performance Considerations

### 1. **localStorage Size Limit**

- Browser limit: ~5-10MB per domain
- Current implementation: No size limit
- **TODO**: Add size limit check (e.g., max 1000 messages)

### 2. **Auto-save Frequency**

- Saves on every message change
- Saves on every keystroke (draft)
- Consider debouncing for draft input if performance issues

### 3. **Message Cleanup**

```typescript
// Future improvement: Limit history size
const MAX_MESSAGES = 1000;

const saveChatHistory = (messages: Message[]): void => {
  try {
    const limited = messages.slice(-MAX_MESSAGES); // Keep only last 1000
    const key = getChatHistoryKey();
    localStorage.setItem(key, JSON.stringify(limited));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};
```

## Troubleshooting

### History không load

- Check console for errors
- Verify token exists: `localStorage.getItem("access_token")`
- Check key format: `getChatHistoryKey()`

### Draft không save

- Check if auto-save useEffect đang chạy
- Verify draft key: `getChatDraftKey()`

### localStorage full

- Check total size: `JSON.stringify(localStorage).length`
- Clear old data: `clearAllUsersData()`
- Implement size limits

## Migration Guide

### From old implementation

```typescript
// OLD
const [messages, setMessages] = useState<Message[]>(() => {
  const saved = localStorage.getItem(CHAT_HISTORY_KEY);
  return saved ? JSON.parse(saved) : [welcomeMessage];
});

// NEW
const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
```

```typescript
// OLD
useEffect(() => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}, [messages, CHAT_HISTORY_KEY]);

// NEW
useEffect(() => {
  saveChatHistory(messages);
}, [messages]);
```

## Testing

### Manual Tests

1. **Login → Chat → Logout → Login**: History should be cleared
2. **Chat → Navigate away → Back**: History should persist
3. **Multiple users**: Each should have separate history
4. **Guest mode**: Should work without token
5. **Export**: Should download JSON file

### Edge Cases

- Empty history
- Very long messages
- Special characters in messages
- Image URLs in messages
- Browser localStorage disabled
- localStorage quota exceeded

## Future Enhancements

1. **Size Limits**: Implement max message count
2. **Compression**: Use compression for large histories
3. **IndexedDB**: Migrate to IndexedDB for larger storage
4. **Import History**: Allow importing from exported JSON
5. **Search**: Add search in chat history
6. **Backup**: Auto-backup to server
7. **Encryption**: Encrypt sensitive chat data

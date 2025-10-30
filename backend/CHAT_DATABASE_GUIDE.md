# Chat History Database Implementation Guide

## 🎯 Overview

Hệ thống lưu trữ lịch sử chat trong PostgreSQL database với khả năng đồng bộ giữa local và server.

## 📊 Database Schema

### Table: `chat_messages`

```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    images JSON,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_id ON chat_messages(user_id);
CREATE INDEX idx_created_at ON chat_messages(created_at);
```

### Columns:

- **id**: Auto-increment primary key
- **user_id**: Foreign key to users table (CASCADE delete)
- **message**: Nội dung tin nhắn (TEXT - unlimited)
- **is_user**: `true` = user message, `false` = AI response
- **images**: JSON array of image URLs
- **metadata**: JSON object cho extra info (traffic data, intent, etc.)
- **created_at**: Timestamp (auto-generated)

## 🔧 Setup Instructions

### 1. Run Migration

```bash
cd backend
alembic upgrade head
```

Hoặc chạy migration cụ thể:

```bash
alembic upgrade chat_messages_001
```

### 2. Register Router in main.py

```python
# backend/app/main.py
from app.api.v1 import chat_history

app.include_router(
    chat_history.router,
    prefix="/api/v1/chat",
    tags=["🤖 Chat History"]
)
```

### 3. Update base.py imports

```python
# backend/app/db/base.py
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.models.TokenLLM import TokenLLM
```

## 📡 API Endpoints

### 1. **POST** `/api/v1/chat/messages`

Lưu một tin nhắn mới

**Request Body:**

```json
{
  "message": "Tình trạng giao thông đường Lê Duẩn như thế nào?",
  "is_user": true,
  "images": ["http://localhost:8000/api/v1/roads/leduan/frames/latest"],
  "metadata": {
    "intent": "traffic_query",
    "road_name": "leduan"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": 123,
  "user_id": 1,
  "message": "Tình trạng giao thông...",
  "is_user": true,
  "images": ["http://..."],
  "metadata": {...},
  "created_at": "2025-10-30T10:30:00"
}
```

### 2. **GET** `/api/v1/chat/messages?limit=100&offset=0`

Lấy lịch sử chat

**Query Parameters:**

- `limit`: Số lượng (default: 100, max: 1000)
- `offset`: Skip messages (pagination)
- `since`: ISO timestamp (optional) - lấy từ thời điểm này

**Response:** `200 OK`

```json
[
  {
    "id": "123",
    "text": "Xin chào!",
    "user": true,
    "time": "14:30:25",
    "image": null,
    "created_at": "2025-10-30T14:30:25"
  },
  {
    "id": "124",
    "text": "Chào bạn! Tôi có thể giúp gì?",
    "user": false,
    "time": "14:30:26",
    "image": ["http://..."],
    "created_at": "2025-10-30T14:30:26"
  }
]
```

### 3. **DELETE** `/api/v1/chat/messages`

Xóa toàn bộ lịch sử chat

**Response:** `204 No Content`

### 4. **DELETE** `/api/v1/chat/messages/{message_id}`

Xóa một tin nhắn cụ thể

**Response:** `204 No Content`

### 5. **GET** `/api/v1/chat/messages/count`

Đếm số tin nhắn

**Response:** `200 OK`

```json
{
  "count": 42
}
```

## 🔄 Frontend Integration

### Using the Chat History Service

File `frontend/src/services/chatHistoryService.ts` provides ready-to-use functions:

```typescript
import {
  fetchChatHistory,
  saveMessageToServer,
  clearServerChatHistory,
  syncLocalToServer,
} from "@/services/chatHistoryService";
```

### Option 1: Server-only (No localStorage)

```typescript
import {
  fetchChatHistory,
  saveMessageToServer,
} from "@/services/chatHistoryService";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load from server on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await fetchChatHistory();
      setMessages(history.length > 0 ? history : [welcomeMessage]);
    };
    loadHistory();
  }, []);

  // Save to server after sending
  const handleSendMessage = async () => {
    // ... user message ...
    await saveMessageToServer(userMessage, true);

    // ... AI response ...
    await saveMessageToServer(aiResponse, false, images);
  };
};
```

### Option 2: Hybrid (localStorage + Server sync)

```typescript
import { loadChatHistory, saveChatHistory } from "@/utils/chatStorage";
import {
  fetchChatHistory,
  saveMessageToServer,
  syncLocalToServer,
} from "@/services/chatHistoryService";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from server if localStorage is empty
  useEffect(() => {
    const initHistory = async () => {
      if (messages.length <= 1) {
        // Only welcome message
        const serverHistory = await fetchChatHistory();
        if (serverHistory.length > 0) {
          setMessages(serverHistory);
          saveChatHistory(serverHistory);
        }
      }
    };
    initHistory();
  }, []);

  // Auto-save to both
  useEffect(() => {
    // Save to localStorage (instant)
    saveChatHistory(messages);

    // Sync to server (background)
    const syncToServer = async () => {
      for (const msg of messages) {
        if (msg.id !== "1" && !msg.typing) {
          await saveMessageToServer(msg.text, msg.user, msg.image);
        }
      }
    };

    // Debounce server sync
    const timer = setTimeout(syncToServer, 2000);
    return () => clearTimeout(timer);
  }, [messages]);

  // Manual sync button
  const handleSync = async () => {
    setIsSyncing(true);
    const count = await syncLocalToServer(messages);
    toast.success(`Đã đồng bộ ${count} tin nhắn`);
    setIsSyncing(false);
  };

  return (
    <div>
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? "Đang đồng bộ..." : "Đồng bộ lên server"}
      </Button>
      {/* ... chat UI ... */}
    </div>
  );
};
```

### Option 3: Smart Sync (Recommended)

```typescript
// Only sync when user explicitly wants it
const [syncEnabled, setSyncEnabled] = useState(false);

useEffect(() => {
  saveChatHistory(messages); // Always save local

  if (syncEnabled) {
    // Sync to server if enabled
    const timer = setTimeout(async () => {
      for (const msg of messages.slice(-5)) {
        // Only last 5
        await saveMessageToServer(msg.text, msg.user, msg.image);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [messages, syncEnabled]);
```

## 🎨 UI Enhancements

### Add Sync Toggle

```tsx
import { Cloud, CloudOff } from "lucide-react";

<Button
  variant="ghost"
  size="icon"
  onClick={() => setSyncEnabled(!syncEnabled)}
  title={syncEnabled ? "Đang đồng bộ" : "Tắt đồng bộ"}
>
  {syncEnabled ? (
    <Cloud className="w-5 h-5 text-blue-500" />
  ) : (
    <CloudOff className="w-5 h-5 text-gray-400" />
  )}
</Button>;
```

### Show Sync Status

```tsx
{
  isSyncing && (
    <Badge variant="outline" className="gap-1">
      <Loader2 className="w-3 h-3 animate-spin" />
      Đang đồng bộ...
    </Badge>
  );
}

{
  !isSyncing && syncEnabled && (
    <Badge variant="outline" className="gap-1">
      <Check className="w-3 h-3" />
      Đã đồng bộ
    </Badge>
  );
}
```

## 📈 Performance Considerations

### 1. **Batch Inserts**

Thay vì save từng message, batch nhiều messages:

```python
# Backend service
def save_messages_batch(db: Session, user_id: int, messages: List[dict]):
    chat_messages = [
        ChatMessage(
            user_id=user_id,
            message=msg["text"],
            is_user=msg["user"],
            images=msg.get("images"),
        )
        for msg in messages
    ]
    db.bulk_save_objects(chat_messages)
    db.commit()
```

### 2. **Pagination**

Load history theo chunks:

```typescript
const loadMore = async () => {
  const offset = messages.length;
  const older = await fetchChatHistory(50, offset);
  setMessages([...older, ...messages]);
};
```

### 3. **Caching**

Cache API responses:

```typescript
const cache = new Map<string, Message[]>();

const fetchWithCache = async (key: string) => {
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const data = await fetchChatHistory();
  cache.set(key, data);
  return data;
};
```

## 🔐 Security

### 1. **User Isolation**

✅ Mỗi user chỉ thấy messages của mình:

```python
query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
```

### 2. **Input Validation**

✅ Pydantic validates:

- Message length (1-10,000 chars)
- Image URLs format
- Metadata structure

### 3. **Rate Limiting**

Thêm rate limit để tránh spam:

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("/messages")
@limiter.limit("60/minute")  # Max 60 messages per minute
async def create_chat_message(...):
    ...
```

## 📊 Analytics & Monitoring

### Track Usage

```python
# Add to metadata
metadata = {
    "timestamp": datetime.utcnow().isoformat(),
    "response_time_ms": 250,
    "traffic_data_included": True,
    "intent": "traffic_query",
    "road_name": "leduan",
}
```

### Query Analytics

```python
# Most active users
SELECT user_id, COUNT(*) as message_count
FROM chat_messages
GROUP BY user_id
ORDER BY message_count DESC
LIMIT 10;

# Messages per day
SELECT DATE(created_at) as date, COUNT(*) as count
FROM chat_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

# AI vs User ratio
SELECT
    is_user,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM chat_messages
GROUP BY is_user;
```

## 🧪 Testing

### Backend Tests

```python
def test_create_chat_message(client, auth_headers):
    response = client.post(
        "/api/v1/chat/messages",
        json={
            "message": "Test message",
            "is_user": True,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["message"] == "Test message"

def test_get_chat_history(client, auth_headers):
    response = client.get(
        "/api/v1/chat/messages?limit=10",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Frontend Tests

```typescript
describe("Chat History Service", () => {
  it("should fetch chat history", async () => {
    const history = await fetchChatHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should save message to server", async () => {
    const success = await saveMessageToServer("Test", true);
    expect(success).toBe(true);
  });
});
```

## 🚀 Deployment Checklist

- [ ] Run migration: `alembic upgrade head`
- [ ] Register router in main.py
- [ ] Test all endpoints với Swagger UI
- [ ] Update frontend to use new service
- [ ] Test sync functionality
- [ ] Monitor database performance
- [ ] Setup backup strategy
- [ ] Add logging for debugging

## 📝 Migration Commands

```bash
# Create new migration
alembic revision -m "create chat_messages table"

# Upgrade to latest
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# Check current version
alembic current

# View history
alembic history
```

## 🎉 Benefits

| Feature                    | localStorage Only | Database              |
| -------------------------- | ----------------- | --------------------- |
| **Persist across devices** | ❌                | ✅                    |
| **Backup & restore**       | ❌                | ✅                    |
| **Analytics**              | ❌                | ✅                    |
| **Search**                 | Limited           | ✅ Full-text          |
| **Offline access**         | ✅                | ❌ (needs sync)       |
| **Speed**                  | ⚡ Instant        | 🌐 Network delay      |
| **Storage limit**          | ~5-10MB           | Unlimited             |
| **Privacy**                | Higher            | Lower (server access) |

## 🔮 Future Enhancements

1. **Full-text Search**: PostgreSQL tsvector
2. **Message Threading**: Conversation grouping
3. **Export to PDF**: Generate reports
4. **AI Training**: Use history to improve responses
5. **Shared Conversations**: Team chat history
6. **Message Reactions**: Like, bookmark
7. **Voice Messages**: Store audio files
8. **Message Encryption**: End-to-end encryption

## 📚 References

- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [PostgreSQL JSON](https://www.postgresql.org/docs/current/datatype-json.html)

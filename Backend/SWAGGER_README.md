# 📚 API Documentation - Swagger UI

## 🚀 Truy cập Swagger UI

Sau khi start server, mở browser và truy cập:

### **Swagger UI** (Interactive)

```
http://localhost:8000/docs
```

### **ReDoc** (Alternative, read-only)

```
http://localhost:8000/redoc
```

### **OpenAPI JSON**

```
http://localhost:8000/openapi.json
```

## 📖 Giới thiệu

Smart Transportation API cung cấp đầy đủ documentation tự động thông qua **Swagger UI** và **ReDoc**.

### ✨ Features

- ✅ **Interactive API Testing**: Test trực tiếp trên browser
- ✅ **Authentication Support**: Authorize với JWT token
- ✅ **Schema Validation**: Xem request/response models
- ✅ **WebSocket Documentation**: Hướng dẫn sử dụng WebSocket endpoints
- ✅ **Examples**: Request/response examples cho mỗi endpoint

## 🔐 Authentication trong Swagger

### Bước 1: Register/Login

1. Mở Swagger UI: `http://localhost:8000/docs`
2. Tìm section **🔐 Authentication**
3. Thử endpoint `POST /api/v1/register` hoặc `POST /api/v1/login`
4. Copy `access_token` từ response

### Bước 2: Authorize

1. Click nút **"Authorize"** ở góc trên bên phải
2. Nhập token theo format: `Bearer <your_token>`
3. Click **"Authorize"**
4. Click **"Close"**

Bây giờ tất cả protected endpoints sẽ tự động gửi token!

## 📋 API Groups

### 🔐 Authentication

- `POST /api/v1/register` - Đăng ký user mới
- `POST /api/v1/login` - Đăng nhập và nhận JWT token
- `GET /api/v1/me` - Lấy thông tin user hiện tại
- `PUT /api/v1/me` - Cập nhật thông tin user

### 👤 User Management

- `PUT /api/v1/users/password` - Đổi mật khẩu
- `PUT /api/v1/users/profile` - Cập nhật profile (username, email, phone)

### 📹 Traffic Monitoring

- `GET /api/v1/roads_name` - Lấy danh sách tên đường
- `GET /api/v1/info/{road_name}` - Lấy thông tin giao thông (REST)
- `GET /api/v1/frames/{road_name}` - Lấy frame ảnh (JPEG)
- `WS /ws/frames/{road_name}` - Stream video frames (WebSocket)
- `WS /ws/info/{road_name}` - Stream traffic data real-time (WebSocket)

### 🤖 AI Chatbot

- `POST /api/v1/chat` - Chat với AI (REST)
- `WS /ws/chat` - Chat với AI (WebSocket, real-time)

### 🔧 Admin Tools

- `GET /api/v1/admin/resources` - Lấy system resources (CPU, RAM, Disk)

## 🔌 WebSocket Endpoints

WebSocket endpoints không thể test trực tiếp trên Swagger UI. Sử dụng WebSocket client như:

### Browser JavaScript

```javascript
// Stream video frames
const ws = new WebSocket("ws://localhost:8000/ws/frames/Văn Quán");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.frame = base64 encoded JPEG
  document.getElementById("img").src = `data:image/jpeg;base64,${data.frame}`;
};

// Stream traffic info
const wsInfo = new WebSocket("ws://localhost:8000/ws/info/Văn Quán");
wsInfo.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Traffic data:", data);
  // { count_car: 10, count_motor: 5, speed_car: 45.2, speed_motor: 30.1 }
};

// AI Chat
const wsChat = new WebSocket("ws://localhost:8000/ws/chat");
wsChat.onopen = () => {
  wsChat.send(JSON.stringify({ message: "Xin chào!" }));
};
wsChat.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log("AI:", response.message);
  console.log("Images:", response.image); // Array of image URLs
};
```

### Python Client

```python
import websocket
import json

# Connect to chat
ws = websocket.create_connection("ws://localhost:8000/ws/chat")

# Send message
ws.send(json.dumps({"message": "Cho tôi biết tình hình giao thông"}))

# Receive response
response = json.loads(ws.recv())
print("AI:", response['message'])
print("Images:", response['image'])

ws.close()
```

## 📦 Request/Response Examples

### POST /api/v1/login

**Request:**

```json
{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "0123456789",
    "role_id": 1
  }
}
```

### GET /api/v1/info/Văn Quán

**Headers:**

```
Authorization: Bearer <your_token>
```

**Response (200 OK):**

```json
{
  "count_car": 15,
  "count_motor": 8,
  "speed_car": 42.5,
  "speed_motor": 28.3
}
```

### POST /api/v1/chat

**Request:**

```json
{
  "message": "Tình hình giao thông Văn Quán hiện tại thế nào?"
}
```

**Response (200 OK):**

```json
{
  "message": "Hiện tại đường Văn Quán đang thông thoáng với 15 xe ô tô và 8 xe máy. Tốc độ trung bình xe ô tô là 42.5 km/h.",
  "image": ["http://localhost:8000/api/v1/frames/Văn%20Quán"]
}
```

## 🎨 Customization

### Thay đổi metadata

Edit `main.py`:

```python
app = FastAPI(
    title="Your API Title",
    description="Your description",
    version="2.0.0",
    contact={
        "name": "Your Name",
        "email": "your@email.com",
    },
)
```

### Thêm tags cho endpoints

```python
@router.get(
    "/endpoint",
    tags=["Your Tag"],
    summary="Short description",
    description="Long description with **markdown** support",
    response_description="What this returns",
)
async def your_endpoint():
    pass
```

### Thêm examples

```python
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        description="Tin nhắn gửi đến AI",
        example="Cho tôi biết tình hình giao thông Văn Quán"
    )
```

## 🔍 Advanced Features

### Response Models

Swagger tự động generate schema từ Pydantic models:

```python
class UserOut(BaseModel):
    id: int
    username: str
    email: str

@router.get("/users/{id}", response_model=UserOut)
async def get_user(id: int):
    return user
```

### Status Codes

```python
@router.post(
    "/endpoint",
    status_code=201,
    responses={
        201: {"description": "Created successfully"},
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
    }
)
```

### Query Parameters

```python
@router.get("/items")
async def get_items(
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(10, description="Max items to return", le=100),
):
    pass
```

## 📚 Tài liệu thêm

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [ReDoc](https://github.com/Redocly/redoc)

## 🎯 Tips

1. **Luôn thêm descriptions** cho parameters và response models
2. **Sử dụng examples** để giúp Frontend developers hiểu API
3. **Group endpoints** bằng tags hợp lý
4. **Document errors** với `responses` parameter
5. **Include authentication** trong protected endpoints

## ✅ Current API Structure

```
Smart Transportation API v1.0.0
├── 🔐 Authentication
│   ├── POST /api/v1/register
│   ├── POST /api/v1/login
│   ├── GET /api/v1/me
│   └── PUT /api/v1/me
├── 👤 User Management
│   ├── PUT /api/v1/users/password
│   └── PUT /api/v1/users/profile
├── 📹 Traffic Monitoring
│   ├── GET /api/v1/roads_name
│   ├── GET /api/v1/info/{road_name}
│   ├── GET /api/v1/frames/{road_name}
│   ├── WS /ws/frames/{road_name}
│   └── WS /ws/info/{road_name}
├── 🤖 AI Chatbot
│   ├── POST /api/v1/chat
│   └── WS /ws/chat
└── 🔧 Admin Tools
    └── GET /api/v1/admin/resources
```

Truy cập http://localhost:8000/docs để explore! 🚀

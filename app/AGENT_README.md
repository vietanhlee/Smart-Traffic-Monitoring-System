# Agent React - Trợ Lý AI Giao Thông Thông Minh

## Tổng Quan

Agent React là một trợ lý AI được thiết kế đặc biệt cho hệ thống giao thông thông minh, sử dụng LangGraph và Google Gemini để cung cấp phản hồi thông minh với khả năng hiển thị hình ảnh từ camera giao thông.

## Tính Năng Chính

### 1. Structured Output với Pydantic
- Sử dụng `with_structured_output()` để ép LLM trả về đúng format
- Pydantic model `AgentResponse` đảm bảo type safety
- Tự động validate và format response

```python
class AgentResponse(BaseModel):
    message: str = Field(description="Phản hồi text từ AI")
    image: str = Field(default=None, description="Base64 encoded image (nếu có)")
```

### 2. Đầu Ra Định Dạng Dict
```python
{
    "message": str,  # Phản hồi text từ AI
    "image": str     # Base64 encoded image (nếu có)
}
```

### 3. Memory (Bộ Nhớ)
- Sử dụng `ConversationBufferMemory` để lưu trữ lịch sử hội thoại
- Tự động load và save context giữa các cuộc trò chuyện
- Hỗ trợ cuộc hội thoại liên tục và có ngữ cảnh

### 4. System Prompt Thông Minh
- Prompt được tối ưu cho lĩnh vực giao thông
- Hướng dẫn phân loại tình trạng giao thông:
  - Nhiều xe + vận tốc < 12 km/h → Ùn tắc
  - Nhiều xe + vận tốc 12-30 km/h → Đông
  - Vận tốc >= 30 km/h → Thông thoáng
  - Ít xe + vận tốc thấp → Chậm nhưng không tắc

### 5. Tools Integration
- `get_info_road(road_name)`: Lấy thông tin thống kê giao thông
- `get_frame_road(road_name)`: Lấy hình ảnh từ camera giao thông

## Cách Sử Dụng

### Khởi Tạo Agent
```python
from services.Agent import AgentReact

agent = AgentReact()
```

### Gửi Tin Nhắn
```python
response = agent.chat("Tình trạng giao thông hiện tại như thế nào?")
print(response["message"])  # Text response
if response["image"]:
    print("Có hình ảnh kèm theo!")
```

### Test Agent
```bash
cd app
python test_structured_agent.py
```

## Cấu Trúc Response

### Response Thành Công
```python
{
    "message": "Dựa trên dữ liệu hiện tại, tuyến đường Đường Láng đang có tình trạng giao thông đông đúc với 45 xe ô tô và 78 xe máy, vận tốc trung bình 18 km/h.",
    "image": "iVBORw0KGgoAAAANSUhEUgAA..."  # Base64 image data
}
```

### Response Không Có Hình Ảnh
```python
{
    "message": "Xin chào! Tôi có thể giúp bạn phân tích tình trạng giao thông.",
    "image": None
}
```

### Response Lỗi
```python
{
    "message": "Đã xảy ra lỗi: [Chi tiết lỗi]",
    "image": None
}
```

## Tích Hợp Với API

### REST API
```python
# POST /chat
{
    "message": "Hỏi về giao thông"
}

# Response
{
    "message": "Phản hồi từ AI",
    "image": "base64_image_data"
}
```

### WebSocket
```javascript
// Gửi
{"message": "Hỏi về giao thông"}

// Nhận
{
    "message": "Phản hồi từ AI", 
    "image": "base64_image_data"
}
```

## Frontend Integration

### ChatInterface Component
- Tự động hiển thị hình ảnh khi có
- Hỗ trợ markdown formatting
- Lưu trữ lịch sử chat trong localStorage

### Hiển Thị Hình Ảnh
```tsx
{message.image && (
  <img
    src={`data:image/jpeg;base64,${message.image}`}
    alt="Traffic camera view"
    className="max-w-full h-auto rounded-lg"
  />
)}
```

## Cấu Hình

### Environment Variables
```env
GOOGLE_API_KEY=your_gemini_api_key
```

### Model Settings
- Model: `gemini-2.5-flash`
- Temperature: `0.6`
- Memory: `ConversationBufferMemory`

## Lưu Ý Kỹ Thuật

1. **Structured Output**: Sử dụng Pydantic để đảm bảo format response nhất quán
2. **Memory Management**: Memory được tự động quản lý, không cần can thiệp thủ công
3. **Error Handling**: Tất cả lỗi được bắt và trả về trong response
4. **Image Processing**: Hình ảnh được trả về dưới dạng base64 string
5. **Tool Integration**: Tools được gọi tự động dựa trên ngữ cảnh câu hỏi
6. **Two-Stage Processing**: Agent xử lý tools trước, sau đó structured LLM format response cuối

## Troubleshooting

### Lỗi Thường Gặp
1. **GOOGLE_API_KEY không tìm thấy**: Kiểm tra file .env
2. **Agent không trả về hình ảnh**: Kiểm tra tools và analyzer state
3. **Memory không hoạt động**: Đảm bảo ConversationBufferMemory được khởi tạo đúng

### Debug
```python
# Bật debug mode
import logging
logging.basicConfig(level=logging.DEBUG)
```

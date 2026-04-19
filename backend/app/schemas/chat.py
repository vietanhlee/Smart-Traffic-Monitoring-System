"""
Pydantic schemas for Chat Messages
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessageCreate(BaseModel):
    """Schema for creating a new chat message."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Nội dung tin nhắn được gửi tới chatbot.",
        example="Cho tôi biết tình hình giao thông tuyến Văn Phú.",
    )
    is_user: bool = Field(
        default=True,
        description="Cho biết tin nhắn do người dùng gửi lên hay do hệ thống.",
        example=True,
    )
    images: Optional[List[str]] = Field(
        default=None,
        description="Danh sách URL ảnh đính kèm (MinIO hoặc URL ký tạm).",
        example=["https://example.com/images/traffic1.jpg"],
    )
    extra_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dữ liệu bổ sung hoặc metadata cho tin nhắn.",
        example={"source": "web", "channel": "chatbot"},
    )


class ChatMessageResponse(BaseModel):
    """Schema for chat message response."""
    id: int = Field(
        ...,
        description="Mã định danh duy nhất của tin nhắn.",
        example=123,
    )
    user_id: int = Field(
        ...,
        description="Mã người dùng đã gửi tin nhắn.",
        example=1,
    )
    message: str = Field(
        ...,
        description="Nội dung tin nhắn trả về từ hệ thống.",
        example="Hiện tại tuyến Văn Phú đang đông đúc, tốc độ trung bình khoảng 25 km/h.",
    )
    is_user: bool = Field(
        ...,
        description="Cho biết tin nhắn này có phải do người dùng gửi hay không.",
        example=False,
    )
    images: Optional[List[str]] = Field(
        default=None,
        description="Danh sách URL ảnh kèm theo tin nhắn.",
        example=["https://example.com/images/traffic2.jpg"],
    )
    extra_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Metadata bổ sung hoặc thông tin ngữ cảnh của tin nhắn.",
        example={"channel": "websocket", "priority": "high"},
    )
    created_at: datetime = Field(
        ...,
        description="Thời điểm tin nhắn được tạo.",
        example="2026-04-19T12:34:56Z",
    )

    class Config:
        from_attributes = True


class ChatMessageListResponse(BaseModel):
    """Schema for listing chat messages."""
    id: str = Field(
        ...,
        description="Mã định danh tin nhắn hiển thị trên frontend.",
        example="msg_1713523456",
    )
    text: str = Field(
        ...,
        description="Nội dung văn bản hiển thị của tin nhắn.",
        example="Tuyến Văn Phú hiện đang bị ùn tắc nhẹ.",
    )
    user: bool = Field(
        ...,
        description="Cho biết tin nhắn này do người dùng gửi hay do trợ lý.",
        example=False,
    )
    time: str = Field(
        ...,
        description="Thời gian hiển thị của tin nhắn.",
        example="12:34",
    )
    image: Optional[List[str]] = Field(
        default=None,
        description="Danh sách ảnh liên quan đến tin nhắn.",
        example=["https://example.com/images/traffic3.jpg"],
    )
    created_at: str = Field(
        ...,
        description="Thời điểm tin nhắn được tạo dưới dạng chuỗi.",
        example="2026-04-19T12:34:56Z",
    )


class ChatMessagePageResponse(BaseModel):
    """Paginated response for chat history."""
    items: List[ChatMessageListResponse] = Field(
        ...,
        description="Danh sách tin nhắn trong trang hiện tại.",
    )
    page: int = Field(
        ...,
        description="Số trang hiện tại.",
        example=1,
    )
    page_size: int = Field(
        ...,
        description="Số lượng mục trả về trên mỗi trang.",
        example=20,
    )
    total_items: int = Field(
        ...,
        description="Tổng số tin nhắn có trong hệ thống.",
        example=120,
    )
    total_pages: int = Field(
        ...,
        description="Tổng số trang có thể truy vấn được.",
        example=6,
    )
    has_next: bool = Field(
        ...,
        description="Có còn trang tiếp theo hay không.",
        example=True,
    )
    has_prev: bool = Field(
        ...,
        description="Có trang trước hay không.",
        example=False,
    )


class AgentTextResponse(BaseModel):
    message: str = Field(
        ...,
        description="Phản hồi văn bản của trợ lý AI.",
        example="Hiện tại tuyến Văn Phú đang đông đúc, bạn nên đi đường khác nếu có thể.",
    )


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        description="Tin nhắn người dùng gửi đến chatbot.",
        example="Cho tôi biết tình trạng tuyến Văn Quán.",
    )


class ChatResponse(BaseModel):
    message: str = Field(
        ...,
        description="Phản hồi văn bản của Agent (không bao gồm đường dẫn ảnh trong nội dung).",
        example="Tuyến Văn Quán đang thông thoáng, tốc độ trung bình khoảng 45 km/h.",
    )
    image: List[str] = Field(
        default_factory=list,
        description="Danh sách URL ảnh để frontend hiển thị.",
        example=["https://example.com/images/road_frame.jpg"],
    )
"""
Chat Message Model for PostgreSQL
Lưu trữ lịch sử chat của users
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base


class ChatMessage(Base):
    """
    Model để lưu tin nhắn chat
    
    Attributes:
        id: Primary key
        user_id: Foreign key đến User
        message: Nội dung tin nhắn
        is_user: True nếu là tin nhắn của user, False nếu là AI
        images: JSON array chứa URLs ảnh (nếu có)
        created_at: Thời gian tạo
        extra_data: JSON field cho thông tin bổ sung (traffic data, context, etc.)
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Nội dung tin nhắn
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True, nullable=False)  # True = user, False = AI
    
    # Ảnh đính kèm (JSON array of URLs)
    images = Column(JSON, nullable=True)
    # Example: ["http://localhost:8000/api/v1/roads/road1/frames/latest", ...]
    
    # Extra data bổ sung (avoid 'metadata' - reserved by SQLAlchemy)
    extra_data = Column(JSON, nullable=True)
    # Example: {"traffic_data": {...}, "intent": "traffic_query", "response_time_ms": 250}
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, is_user={self.is_user})>"

    def to_dict(self):
        """Convert to dict for API response"""
        return {
            "id": str(self.id),
            "text": self.message,
            "user": self.is_user,
            "time": self.created_at.strftime("%H:%M:%S"),
            "image": self.images if self.images else None,
            "created_at": self.created_at.isoformat(),
        }

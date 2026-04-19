from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.base import Base

class User(Base):
    """Mô hình người dùng trong hệ thống.

    Chứa thông tin xác thực, quyền hạn và các quan hệ với tin nhắn chat.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, default=1)  # 0=admin, 1=user
    email = Column(String(255), unique=True, nullable=False)      # email của người dùng
    phone_number = Column(String(20), unique=True, nullable=False) # số điện thoại của người dùng
    
    # Quan hệ một-nhiều với bảng chat_messages
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
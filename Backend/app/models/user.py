from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, default=1)  # 0=admin, 1=user
    email = Column(String(255), unique=True, nullable=False)      # NEW: email
    phone_number = Column(String(20), unique=True, nullable=False) # NEW: phone number
    
    # Relationships
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    
"""
Pydantic schemas for Chat Messages
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessageCreate(BaseModel):
    """Schema for creating a new chat message"""
    message: str = Field(..., min_length=1, max_length=10000)
    is_user: bool = Field(default=True)
    images: Optional[List[str]] = Field(default=None)
    extra_data: Optional[Dict[str, Any]] = Field(default=None)


class ChatMessageResponse(BaseModel):
    """Schema for chat message response"""
    id: int
    user_id: int
    message: str
    is_user: bool
    images: Optional[List[str]]
    extra_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageListResponse(BaseModel):
    """Schema for listing chat messages"""
    id: str  # Frontend expects string ID
    text: str
    user: bool
    time: str
    image: Optional[List[str]] = None
    created_at: str


class ChatHistoryQuery(BaseModel):
    """Query parameters for chat history"""
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
    since: Optional[datetime] = None  # Get messages since this timestamp

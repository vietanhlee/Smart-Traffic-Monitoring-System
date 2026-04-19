"""
Chat History API Endpoints
Lưu và lấy lịch sử chat của user
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, func
from typing import Optional
from datetime import datetime

from utils.jwt_handler import get_current_user
from models.user import User
from models.chat_message import ChatMessage
from schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageListResponse,
    ChatMessagePageResponse,
)
from db.base import get_db

router = APIRouter(prefix= "/chat-history")


@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=201,
    summary="Lưu tin nhắn chat",
    description="API lưu một tin nhắn chat mới vào database. Hỗ trợ lưu cả tin nhắn từ user và AI response, kèm theo ảnh và metadata. Yêu cầu JWT authentication."
)
async def create_chat_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lưu một tin nhắn chat mới
    
    - **message**: Nội dung tin nhắn
    - **is_user**: True nếu là tin của user, False nếu là AI response
    - **images**: Array URLs của ảnh đính kèm (optional)
    - **extra_data**: Thông tin bổ sung như traffic data, intent, etc. (optional)
    """
    new_message = ChatMessage(
        user_id=current_user.id,
        message=message_data.message,
        is_user=message_data.is_user,
        images=message_data.images,
        extra_data=message_data.extra_data,
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    return new_message


@router.get(
    "/messages",
    response_model=ChatMessagePageResponse,
    summary="Lấy lịch sử chat",
    description="API lấy lịch sử chat của user hiện tại theo phân trang kiểu thương mại điện tử. Chỉ query đúng trang được yêu cầu, không tải toàn bộ DB."
)
async def get_chat_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    since: Optional[datetime] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy lịch sử chat của user hiện tại
    
    - **page**: Trang hiện tại (bắt đầu từ 1)
    - **page_size**: Số lượng bản ghi mỗi trang (mặc định 20, tối đa 100)
    - **since**: Chỉ lấy tin nhắn sau thời điểm này (ISO format)

    Returns object gồm items + metadata phân trang.
    """
    base_query = select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    
    # Filter by timestamp if provided
    if since:
        base_query = base_query.where(ChatMessage.created_at > since)

    # Count only matching rows (for metadata)
    count_query = select(func.count()).select_from(base_query.subquery())
    total_items = int((await db.execute(count_query)).scalar() or 0)

    offset = (page - 1) * page_size
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0

    data_query = (
        base_query
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(data_query)
    messages = result.scalars().all()

    items = [
        ChatMessageListResponse(
            id=str(msg.id),
            text=msg.message,
            user=msg.is_user,
            time=msg.created_at.strftime("%H:%M:%S"),
            image=msg.images,
            created_at=msg.created_at.isoformat(),
        )
        for msg in messages
    ]

    return ChatMessagePageResponse(
        items=items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.delete(
    "/messages",
    status_code=204,
    summary="Xóa toàn bộ lịch sử chat",
    description="API xóa tất cả tin nhắn chat của user hiện tại. Không thể hoàn tác sau khi xóa. Yêu cầu JWT authentication."
)
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Xóa toàn bộ lịch sử chat của user hiện tại
    """
    await db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    await db.commit()
    
    return None


@router.delete(
    "/messages/{message_id}",
    status_code=204,
    summary="Xóa một tin nhắn cụ thể",
    description="API xóa một tin nhắn chat theo ID. User chỉ có thể xóa tin nhắn của chính mình. Yêu cầu JWT authentication."
)
async def delete_chat_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Xóa một tin nhắn cụ thể
    
    User chỉ có thể xóa tin nhắn của chính mình
    """
    query = select(ChatMessage).where(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id,
    )
    result = await db.execute(query)
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    await db.delete(message)
    await db.commit()
    
    return None


@router.get(
    "/messages/count",
    summary="Đếm số lượng tin nhắn",
    description="API trả về tổng số tin nhắn chat của user hiện tại. Yêu cầu JWT authentication."
)
async def get_message_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Đếm tổng số tin nhắn của user
    """
    query = select(func.count(ChatMessage.id)).where(
        ChatMessage.user_id == current_user.id
    )
    result = await db.execute(query)
    count = result.scalar()
    
    return {"count": count}

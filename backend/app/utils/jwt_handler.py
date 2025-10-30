from datetime import datetime, timedelta
from jose import jwt
from core.config import settings_server
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from models.user import User
from db.base import get_db
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_access_token(data: dict):
    """ Tạo JWT access token từ dữ liệu đầu vào.

    Args:
        data (dict): Dữ liệu đầu vào để tạo token.

    Returns:
        str: JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings_server.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings_server.JWT_SECRET, algorithm=settings_server.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict|None:
    """Giải mã token JWT.

    Args:
        token (str): token cần giải mã.

    Returns:
        dict|None: thông tin của token nếu hợp lệ, ngược lại trả về None.
    """
    try:
        payload = jwt.decode(token, settings_server.JWT_SECRET, algorithms=[settings_server.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User|None:

    user = await get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc user không tồn tại.")
    return user


# Hàm dùng cho websocket hoặc các trường hợp cần truyền token/db trực tiếp
async def get_user_by_token(token: str, db: AsyncSession) -> Optional[User]:
    payload = decode_access_token(token)
    if payload is None:
        return None
    username = payload.get("sub")
    if username is None:
        return None
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar()
    return user

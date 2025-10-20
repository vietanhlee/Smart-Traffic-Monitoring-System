from datetime import datetime, timedelta
from jose import jwt
from core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from models.user import User
from db.base import get_db
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_access_token(data: dict):
    """ Tạo JWT access token từ dữ liệu đầu vào.

    Args:
        data (dict): Dữ liệu đầu vào để tạo token.

    Returns:
        str: JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict|None:
    """Giải mã token JWT.

    Args:
        token (str): token cần giải mã.

    Returns:
        dict|None: thông tin của token nếu hợp lệ, ngược lại trả về None.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User|None:
    """ Lấy thông tin user hiện tại 

    Args:
        token (str, optional): token JWT đầu vào. Defaults to Depends(oauth2_scheme).
        db (AsyncSession, optional): phiên làm việc với cơ sở dữ liệu. Defaults to Depends(get_db).

    Raises:
        HTTPException: Token không hợp lệ hoặc đã hết hạn.
        HTTPException: Token payload không hợp lệ.
        HTTPException: User không tồn tại..

    Returns:
        User|None: trả về đối tượng User hoặc None nếu không tìm thấy.
    """
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc đã hết hạn.")
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload không hợp lệ.")
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User không tồn tại.")
    return user

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.db.base import get_db
from app.models.user import User
from app.utils.jwt_handler import JWTBearer, get_current_user
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str

@router.put("/password")
async def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user password. Requires:
    - Old password verification
    - JWT authentication
    """
    # Verify old password
    if not verify_password(request.old_password, current_user.password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu hiện tại không đúng!"
        )
    
    # Hash new password
    hashed_password = hash_password(request.new_password)
    
    # Update password in database
    try:
        db_user = db.query(User).filter(User.id == current_user.id).first()
        db_user.password = hashed_password
        db.commit()
        return {"message": "Cập nhật mật khẩu thành công!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại sau."
        )

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None

@router.put("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile information. Requires JWT authentication.
    """
    try:
        db_user = db.query(User).filter(User.id == current_user.id).first()
        
        # Check for unique constraints
        if request.username and request.username != db_user.username:
            if db.query(User).filter(User.username == request.username).first():
                raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại!")
            db_user.username = request.username
            
        if request.email and request.email != db_user.email:
            if db.query(User).filter(User.email == request.email).first():
                raise HTTPException(status_code=400, detail="Email đã được sử dụng!")
            db_user.email = request.email
            
        if request.phone_number and request.phone_number != db_user.phone_number:
            if db.query(User).filter(User.phone_number == request.phone_number).first():
                raise HTTPException(status_code=400, detail="Số điện thoại đã được sử dụng!")
            db_user.phone_number = request.phone_number

        db.commit()
        return {"message": "Cập nhật thông tin thành công!"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail="Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau."
        )
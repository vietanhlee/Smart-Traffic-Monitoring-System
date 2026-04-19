from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from core.security import hash_password, verify_password
from db.base import get_db
from models.user import User
from utils.jwt_handler import get_current_user
from schemas.user import PasswordUpdateRequest, ProfileUpdateRequest
router = APIRouter(prefix="/user")

@router.put(
    "/password",
    summary="Thay đổi mật khẩu",
    description="API cập nhật mật khẩu của user. Yêu cầu xác thực mật khẩu cũ và JWT authentication."
)
async def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
        result = await db.execute(select(User).where(User.id == current_user.id))
        db_user = result.scalar_one_or_none()
        if db_user is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

        db_user.password = hashed_password
        await db.commit()
        return {"message": "Cập nhật mật khẩu thành công!"}
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại sau."
        )

@router.put(
    "/profile",
    summary="Cập nhật thông tin cá nhân",
    description="API cập nhật profile của user (username, email, phone_number). Username, email và số điện thoại phải là duy nhất. Yêu cầu JWT authentication."
)
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile information. Requires JWT authentication.
    """
    try:
        result = await db.execute(select(User).where(User.id == current_user.id))
        db_user = result.scalar_one_or_none()
        if db_user is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

        if request.username is not None:
            db_user.username = request.username
        if request.email is not None:
            db_user.email = request.email
        if request.phone_number is not None:
            db_user.phone_number = request.phone_number

        await db.commit()
        return {"message": "Cập nhật thông tin thành công!"}
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Tên đăng nhập, email hoặc số điện thoại đã tồn tại!",
        )
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=500, 
            detail="Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau."
        )
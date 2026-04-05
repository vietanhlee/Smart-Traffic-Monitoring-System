from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm  
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User
from schemas.user import UserCreate, UserUpdate, UserOut
from core.security import hash_password, verify_password
from db.base import get_db
from utils.jwt_handler import create_access_token, get_current_user
from core.config import settings_server
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/auth")

@router.post(
    path= "/register",
    summary="Đăng ký tài khoản mới",
    description="API đăng ký user mới với thông tin username, password, email và phone_number. Username, email và số điện thoại phải là duy nhất trong hệ thống.",
    status_code=201
)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = User(
        username=user.username,
        password=hash_password(user.password),
        email=user.email,
        phone_number=user.phone_number
    )
    db.add(new_user)
    try:
        await db.commit()
        return {"msg": "Đăng ký thành công"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Username, email hoặc số điện thoại đã tồn tại!")

@router.post(
    path= "/login",
    summary="Đăng nhập vào hệ thống",
    description="API đăng nhập OAuth2 compatible. Sử dụng email cùng với password để lấy access token. Token này dùng để xác thực các request tiếp theo."
)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Có thể login bằng:
    - username field: nhập email
    - password field: nhập password
    """
    q = select(User).where(
        User.email == form_data.username
    )
    result = await db.execute(q)
    user_db = result.scalar()
    
    if not user_db or not verify_password(form_data.password, user_db.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai thông tin đăng nhập",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Build full user claims for the JWT (avoid sensitive fields like password)
    token_payload = {
        "sub": user_db.email,  # keep for backward compatibility
        "uid": user_db.id,
        "username": user_db.username,
        "email": user_db.email,
        "phone_number": user_db.phone_number,
        "role_id": user_db.role_id,
    }
    token = create_access_token(token_payload)

    try:
        # Expiry in seconds
        max_age = 60 * 60 * 24 * settings_server.ACCESS_TOKEN_EXPIRE_DAYS
        # Note: For local HTTP development, secure=False. In production (HTTPS), set secure=True and SameSite=None
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=max_age,
            expires=max_age,
            samesite="lax",
            secure=False,
            path="/",
        )
    except Exception:
        pass

    return {"access_token": token, "token_type": "bearer"}

@router.get(
    path= "/me",
    response_model=UserOut,
    summary="Lấy thông tin user hiện tại",
    description="API trả về thông tin chi tiết của user đang đăng nhập. Yêu cầu JWT authentication."
)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Lấy thông tin user hiện tại"""
    return current_user

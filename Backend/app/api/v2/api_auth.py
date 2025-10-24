from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User
from schemas.User import UserCreate, UserLogin, UserUpdate, UserOut
from core.security import hash_password, verify_password
from db.base import get_db
from utils.jwt_handler import create_access_token, get_current_user
from sqlalchemy.exc import IntegrityError

router = APIRouter()

@router.post("/register")
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
        return {"msg": "Register successful"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Username, email hoặc số điện thoại đã tồn tại!")

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    q = select(User)
    if user.email:
        q = q.where(User.email == user.email)
    elif user.username:
        q = q.where(User.username == user.username)
    else:
        raise HTTPException(status_code=400, detail="Cần email hoặc username để đăng nhập")
    result = await db.execute(q)
    user_db = result.scalar()
    if not user_db or not verify_password(user.password, user_db.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai thông tin đăng nhập")
    token = create_access_token({"sub": user_db.username})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Lấy thông tin user hiện tại"""
    return current_user

@router.put("/me", response_model=UserOut)
async def update_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cập nhật thông tin user"""
    try:
        # Cập nhật các trường được cung cấp
        if user_update.username is not None:
            current_user.username = user_update.username
        if user_update.email is not None:
            current_user.email = user_update.email
        if user_update.phone_number is not None:
            current_user.phone_number = user_update.phone_number
        if user_update.password is not None:
            current_user.password = hash_password(user_update.password)
        
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Username, email hoặc số điện thoại đã tồn tại!")

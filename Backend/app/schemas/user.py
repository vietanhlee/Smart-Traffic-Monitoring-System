from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    phone_number: str

class UserLogin(BaseModel):
    username: str | None = None  # Cho phép dùng username hoặc email
    email: EmailStr | None = None
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone_number: str
    role_id: int

    class Config:
        orm_mode = True

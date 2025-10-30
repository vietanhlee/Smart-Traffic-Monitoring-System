
from pydantic import BaseModel, EmailStr
from typing import Optional

class BaseUser(BaseModel):
    username: str
    email: EmailStr
    phone_number: str

class UserCreate(BaseUser):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseUser):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None

class UserOut(BaseUser):
    id: int
    role_id: int

    class Config:
        from_attributes = True # chuyển từ orm mode sang from_attributes

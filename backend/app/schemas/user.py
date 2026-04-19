from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class BaseUser(BaseModel):
    username: str = Field(
        ...,
        description="Tên đăng nhập của người dùng.",
        example="nguyen_van_a",
    )
    email: EmailStr = Field(
        ...,
        description="Địa chỉ email của người dùng.",
        example="user@example.com",
    )
    phone_number: str = Field(
        ...,
        description="Số điện thoại của người dùng.",
        example="+84901234567",
    )


class UserCreate(BaseUser):
    password: str = Field(
        ...,
        description="Mật khẩu dùng để tạo tài khoản.",
        example="P@ssw0rd123",
    )


class UserOut(BaseUser):
    id: int = Field(
        ...,
        description="Mã định danh duy nhất của người dùng.",
        example=1,
    )
    role_id: int = Field(
        ...,
        description="Mã vai trò được gán cho người dùng.",
        example=0,
    )

    class Config:
        from_attributes = True  # chuyển từ orm mode sang from_attributes


class PasswordUpdateRequest(BaseModel):
    old_password: str = Field(
        ...,
        description="Mật khẩu hiện tại để xác thực.",
        example="OldP@ssw0rd",
    )
    new_password: str = Field(
        ...,
        description="Mật khẩu mới thay thế mật khẩu hiện tại.",
        example="NewP@ssw0rd123",
    )


class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = Field(
        default=None,
        description="Tên đăng nhập mới của người dùng.",
        example="nguyen_van_b",
    )
    email: Optional[EmailStr] = Field(
        default=None,
        description="Địa chỉ email mới của người dùng.",
        example="new_email@example.com",
    )
    phone_number: Optional[str] = Field(
        default=None,
        description="Số điện thoại mới của người dùng.",
        example="+84909876543",
    )
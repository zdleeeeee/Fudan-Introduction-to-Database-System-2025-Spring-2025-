# backend/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None

class UserRole(str, Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.user  # user/admin/super_admin

# 用户更新模型，继承自UserBase，用于更新用户信息时的数据验证
class UserSelfUpdate(UserBase):
    password: Optional[str] = None

class UserUpdate(UserBase):
    password: Optional[str] = None
    role: UserRole = UserRole.user

# 用户响应模型，继承自UserBase，用于返回给客户端的数据
class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # 允许从ORM对象创建模型实例

class UserLogin(BaseModel):
    username: str
    password: str
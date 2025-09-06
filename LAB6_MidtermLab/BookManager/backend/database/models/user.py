# user information model
# backend/database/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.database.session import Base
from passlib.context import CryptContext
from datetime import datetime, timezone
import pytz

china_tz = pytz.timezone('Asia/Shanghai')

# build a CryptContext object using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "Users"
    
    id = Column(Integer, primary_key=True, index=True) # 管理员工号/客户编码
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String(50))
    gender = Column(String(10), default="unknown") # 'male', 'female', 'other', 'unknown'
    age = Column(Integer)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="user")  # 'super_admin', 'admin', 'user'
    is_active = Column(Boolean, default=True) # True：表示账户状态正常；False：表示账户已被停用/禁用，无法登录
    created_at = Column(DateTime, default=lambda: datetime.now(china_tz)) # 默认当前时间

    @staticmethod
    def hash_password(password: str) -> str:
        '''use bcrypt to hash password'''
        return pwd_context.hash(password)

    def verify_password(self, password: str) -> str:
        '''verify password'''
        return pwd_context.verify(password, self.hashed_password)
from fastapi import APIRouter, Depends, HTTPException, status
from backend.crud import authenticate_user, create_user, get_user, update_self
from backend.schemas import UserLogin, Token, UserResponse, UserCreate, UserUpdate
from backend.api.deps import get_db, jwt, get_current_user
from sqlalchemy.orm import Session
from backend.config import settings
from datetime import datetime, timedelta, timezone
from backend.database.models.user import User
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["认证"])

@router.post("/login", response_model=Dict[str, Any])
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名或密码错误")
    # 生成真实JWT令牌
    access_token_expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode(
        {
            "sub": str(db_user.id), 
            "role": db_user.role,  # 存入用户ID和角色
            "exp": access_token_expires
        },
        settings.SECRET_KEY,         # 密钥
        algorithm=settings.ALGORITHM # 加密算法
    )
    
    return {
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role,
            # 添加其他需要的用户字段
        },
        "token": {
            "access_token": access_token,
            "token_type": "bearer"
        }
    }

# 公共注册接口（无需认证）
@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,  # 基础用户信息（不包含role字段）
    db: Session = Depends(get_db)
) -> UserResponse:
    return create_user(db, user=user)

# 获取当前用户自己的信息
@router.get("/me", response_model=UserResponse)
def read_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """获取当前登录用户自己的信息（需登录）"""
    return get_user(db, current_user, current_user.id)

# 更新当前用户自己的信息
@router.put("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """更新当前用户自己的信息（需登录）"""
    return update_self(db, current_user.id, update_data, current_user)

# backend/api/user.py

from fastapi import APIRouter, Depends, HTTPException
from backend.crud.user import create_user, get_user, get_all_users, get_user_by_username, update_user, shift_user_active
from backend.schemas.user import UserCreate, UserUpdate, UserResponse
from backend.api.deps import get_current_superadmin, get_current_admin, get_current_user
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models.user import User
from typing import List

router = APIRouter(prefix="/users", tags=["用户管理"])

# 管理员创建接口（需超级管理员权限）
@router.post("/admin", response_model=UserResponse)
def create_admin_user(
    user: UserCreate,  # 包含role字段的扩展模型
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_superadmin)
) -> UserResponse:
    return create_user(db, user=user, current_user = super_admin)

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return get_all_users(db, admin)

# 超级管理员通过用户ID获取用户信息
@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return get_user(db, admin, user_id)

# 超级管理员通过用户名获取用户信息
@router.get("/username/{username}", response_model=UserResponse)
def read_user_by_username(
    username: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> UserResponse:
    return get_user_by_username(db, admin, username)

# 切换指定用户的激活状态（仅超级管理员可操作）
@router.put("/{user_id}/active", response_model=UserResponse)
def api_shift_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return shift_user_active(db=db, current_user=current_user, user_id=user_id)

# 超级管理员通过用户ID修改用户信息
@router.put("/{user_id}", response_model=UserResponse)
def modify_user(
    user_id: int,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> UserResponse:
    return update_user(db, user_id, update_data, admin)
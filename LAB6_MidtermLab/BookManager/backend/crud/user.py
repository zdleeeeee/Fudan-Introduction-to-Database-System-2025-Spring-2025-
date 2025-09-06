# backend/crud/user.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.database.models import User
from backend.schemas.user import UserCreate, UserRole, UserLogin, UserUpdate, UserResponse, UserSelfUpdate
from passlib.context import CryptContext
from typing import Optional, List

# 创建密码哈希上下文，使用bcrypt算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 根据用户id获取用户信息，用户“查询用户信息”
def get_user(db: Session, current_user: User, user_id: int) -> UserResponse: 
    if current_user.id == user_id or current_user.role == UserRole.super_admin:
        db_user = db.query(User).filter(User.id == user_id).first()
        return UserResponse.model_validate(db_user)  # 将 SQLAlchemy 的 数据库模型对象（db_user）转换为 Pydantic 响应模型（UserResponse）
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有超级管理员可以查看其他用户"
        )
    
# 专门为deps.get_current_user()使用的用id查找用户
def get_user_deps(db: Session, user_id: int) -> User:
    db_user = db.query(User).filter(User.id == user_id).first()
    return db_user

# 获取所有用户（添加权限控制）
def get_all_users(db: Session, current_user: User) -> List[UserResponse]:
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有超级管理员可以查看所有用户"
        )
    users = db.query(User).all()
    return [UserResponse.model_validate(user) for user in users]

def get_user_by_username(db: Session, current_user: User, username: str) -> UserResponse:
    if current_user.username == username or current_user.role == UserRole.super_admin:
        db_user = db.query(User).filter(User.username == username).first()
        return UserResponse.model_validate(db_user)  # 将 SQLAlchemy 的 数据库模型对象（db_user）转换为 Pydantic 响应模型（UserResponse）
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有超级管理员可以查看其他用户"
        )

def shift_user_active(db: Session, current_user: User, user_id: int) -> UserResponse:
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有超级管理员可以修改用户账号状态"
        )
    
    # 查询目标用户
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到指定用户"
        )
    if target_user.role == UserRole.super_admin:
        raise  HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="不可以封禁超级管理员账号"
        )

    # 切换 is_active 状态
    target_user.is_active = not target_user.is_active
    db.commit()
    db.refresh(target_user)

    # 返回更新后的用户信息
    return UserResponse.model_validate(target_user)

# 创建账号
def create_user(db: Session, user: UserCreate, current_user: User = None) -> UserResponse:
    hashed_password = pwd_context.hash(user.password)
    if current_user != None:
        # 检查当前用户是否有权限创建目标角色的用户
        if user.role == UserRole.admin and current_user.role != UserRole.super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有超级管理员可以创建管理员用户"
            )
        
        # 普通用户只能创建user角色的账户
        if current_user.role == UserRole.user and user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权创建此权限级别的用户"
            )
    else:
        if user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权创建此权限级别的用户"
            )

     # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被使用"
        )

    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )

    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        **user.model_dump(exclude={"password"}), # .model_dump() 是 Pydantic 的方法，将user这个Pydantic模型转换为字典；** 字典解包运算符将字典的键值对解包为关键字参数，相当于把字典内容展开为 username="john", email="john@example.com", role="user"
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.model_validate(db_user)

# 用户认证函数，用于检测“用户登录”
def authenticate_user(db: Session, user_login: UserLogin) -> Optional[User]:
    user = db.query(User).filter(User.username == user_login.username).first()
    if not user or not pwd_context.verify(user_login.password, user.hashed_password):
        return None
    if user.is_active == False:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return user

# 更新用户信息
def update_self(db: Session, user_id: int, update_data: UserSelfUpdate, current_user: User) -> UserResponse:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    
    # 权限检查：只能修改自己的账户
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此用户信息"
        )

    update_dict = update_data.model_dump(exclude_unset=True) # 将 Pydantic 模型 UserUpdate 转换为字典，并过滤掉未设置的字段
    if "password" in update_dict:
        update_dict["hashed_password"] = pwd_context.hash(update_dict.pop("password")) # [pop]:从字典中移除 password 键; 将结果存入 hashed_password 键
    
    db.query(User).filter(User.id == user_id).update(update_dict)
    db.commit()
    db.refresh(db_user) # 从数据库重新加载指定对象的当前状态：1、立即向数据库发送一个 SELECT 查询 2、用查询到的最新数据 覆盖 内存中 db_user 对象的所有属性 3、确保对象状态与数据库完全同步
    return UserResponse.model_validate(db_user)

def update_user(db: Session, user_id: int, update_data: UserUpdate, current_user: User) -> UserResponse:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    
    # 权限检查：只能超级管理员
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此用户信息"
        )

    
    update_dict = update_data.model_dump(exclude_unset=True) # 将 Pydantic 模型 UserUpdate 转换为字典，并过滤掉未设置的字段
    if "password" in update_dict:
        update_dict["hashed_password"] = pwd_context.hash(update_dict.pop("password"))
    
    db.query(User).filter(User.id == user_id).update(update_dict)
    db.commit()
    db.refresh(db_user) # 从数据库重新加载指定对象的当前状态：1、立即向数据库发送一个 SELECT 查询 2、用查询到的最新数据 覆盖 内存中 db_user 对象的所有属性 3、确保对象状态与数据库完全同步
    return UserResponse.model_validate(db_user)
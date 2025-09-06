# backend/api/deps.py
# 公共依赖

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.crud.user import get_user_deps
from backend.config import settings
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)):
    
    '''Token 的工作原理
    生成 Token：用户登录系统时，服务器验证用户的身份信息（如用户名和密码）。验证通过后，服务器生成一个唯一的 token，并将其与用户的身份信息关联起来。
    传递 Token：服务器将生成的 token 返回给客户端。客户端在后续的请求中，会将这个 token 携带在请求头中发送给服务器。
    验证 Token：服务器接收到请求后，解析请求头中的 token，并验证其有效性。如果 token 有效，服务器会根据用户的身份和权限来处理请求；如果 token 无效或已过期，服务器会返回相应的错误信息。
    '''

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_deps(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(user: User = Depends(get_current_user)):
    if user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def get_current_superadmin(user: User = Depends(get_current_user)):
    if user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super_admin access required")
    return user
# backend/schemas/auth.py

from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

# Token 类在 FastAPI 应用中主要用于定义 JSON Web Token (JWT) 的结构。
# 它通常用于登录成功后返回给客户端的响应体中，
# 包含访问令牌（access_token）和令牌类型（token_type），
# 有时还可能包括过期时间等其他信息。
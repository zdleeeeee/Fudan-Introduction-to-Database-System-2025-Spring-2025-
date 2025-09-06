# backend/main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 跨域支持
from backend.api import (  # 导入所有路由
    auth_router,
    users_router,
    books_router,
    orders_router,
    bill_router,
    sales_router
)

# 初始化FastAPI应用
app = FastAPI(title="图书销售管理系统", version="1.0")

# 配置跨域（前端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 填写前端地址，生产环境应限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
""" React 项目：
默认前端地址：http://localhost:3000
配置位置：package.json 中的 scripts 字段：
json
"scripts": {
  "start": "react-scripts start"  // 默认启动在 3000 端口
}
可通过环境变量修改端口：
PORT=4000 npm start  # 改为 4000 端口 """


# 挂载路由（可添加权限依赖或前缀）
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(books_router)
app.include_router(orders_router)
app.include_router(bill_router)
app.include_router(sales_router)

# 根路由（健康检查）
@app.get("/")
def read_root():
    return {"status": "API is running"}

if __name__ == "__main__":
    # 明确指定host和port(http://127.0.0.1:8000) ，确保浏览器能正确打开，reload：修改代码后服务会自动重启
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
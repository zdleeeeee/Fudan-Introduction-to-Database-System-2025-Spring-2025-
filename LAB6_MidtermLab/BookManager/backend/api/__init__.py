# backend/api/__init__.py

# 按功能模块划分路由，使用依赖项处理权限。

from fastapi import APIRouter
from backend.api.auth import router as auth_router
from backend.api.user import router as users_router
from backend.api.book import router as books_router
from backend.api.purchase_order import router as orders_router
from backend.api.bill_record import router as bill_router
from backend.api.sales import router as sales_router

router = [
    auth_router,
    users_router,
    books_router,
    orders_router,
    bill_router,
    sales_router
]

'''
POST：创建数据。
GET：读取数据。
PUT：更新数据。
DELETE：删除数据。
'''
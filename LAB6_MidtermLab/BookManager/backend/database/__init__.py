# backend/database/__init__.py
# 作为数据库包的主入口，导出核心组件

from backend.database.session import engine, SessionLocal, Base, get_db
from backend.database.models import (
    User,
    Book,
    PurchaseOrder,
    BillRecord,
    # setup_relationships  # 导出关系设置函数
)

__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "User",
    "Book",
    "PurchaseOrder",
    "BillRecord"
]

# 应用启动时自动建立关系
# setup_relationships()
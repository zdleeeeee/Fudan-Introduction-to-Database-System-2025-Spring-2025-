# backend/database/models/__init__.py
# 作用：集中导出所有数据模型，方便其他模块统一导入
from sqlalchemy.orm import relationship
from .user import User
from .book import Book
from .purchase_order import PurchaseOrder
from .bill_record import BillRecord

__all__ = [
    "User",
    "Book",
    "PurchaseOrder",
    "BillRecord",
    "setup_relationships"
]

'''
# 可选：解决模型间的循环依赖
def setup_relationships():
    """建立模型间的关联关系"""
    # 延迟导入避免循环依赖
    from .bill_record import BillRecord
    from .user import User
    
    # 建立双向关系（示例）
    if not hasattr(BillRecord, 'customer'):
        BillRecord.customer = relationship(
            "User", 
            back_populates="bill_records",
            foreign_keys="BillRecord.customer_id"
        )
    
    if not hasattr(User, 'bill_records'):
        User.bill_records = relationship(
            "BillRecord", 
            back_populates="customer",
            foreign_keys="[BillRecord.customer_id]"
        )
'''
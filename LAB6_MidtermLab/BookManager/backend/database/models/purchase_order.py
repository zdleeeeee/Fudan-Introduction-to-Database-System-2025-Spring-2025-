# purchase oreder model
# backend/database/models/purchase_order.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.sql import expression
from backend.database.session import Base
from datetime import datetime, timezone
import pytz

china_tz = pytz.timezone('Asia/Shanghai')

class PurchaseOrder(Base):
    __tablename__ = "PurchaseOrders"
    
    id = Column(Integer, primary_key=True, index=True)
    bk_id = Column(Integer, ForeignKey("Books.id"), nullable=True)
    isbn = Column(String(20))
    title = Column(String(100))  # 冗余存储，避免频繁联表查询
    author = Column(String(50))  # 冗余存储
    publisher = Column(String(50))  # 冗余存储
    purchase_price = Column(Float)
    quantity = Column(Integer)
    order_status = Column(String(20), default="unpaid")  # 'unpaid', 'returned', 'paid'
    is_stocked = Column(Boolean, default=False)  # 新增字段，标记是否已入库
    created_at = Column(DateTime, default=lambda: datetime.now(china_tz)) # 默认当前时间
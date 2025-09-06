# bill record model
# backend/database/models/bill_record.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database.session import Base
from datetime import datetime, timezone
import pytz

china_tz = pytz.timezone('Asia/Shanghai')

class BillRecord(Base):
    __tablename__ = "BillRecords"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_type = Column(String(20))  # 'purchase' or 'sale'
    amount = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(china_tz)) # 默认当前时间
    bk_id = Column(Integer, ForeignKey("Books.id"))
    isbn = Column(String(20))
    title = Column(String(100))
    author = Column(String(50))
    publisher = Column(String(50))
    price = Column(Float)
    quantity = Column(Integer)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=True) # 普通用户购买图书时记录普通用户id，管理员用户支付账单时记录管理员id
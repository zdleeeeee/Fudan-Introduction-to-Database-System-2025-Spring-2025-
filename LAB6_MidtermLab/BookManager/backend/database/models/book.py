# book information table model
# backend/database/models/book.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.database.session import Base
from datetime import datetime, timezone
import pytz

china_tz = pytz.timezone('Asia/Shanghai')

class Book(Base):
    __tablename__ = "Books"
    
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), index=True, unique=True)
    title = Column(String(100), index=True)
    author = Column(String(50))
    publisher = Column(String(50))
    retail_price = Column(Float) # 零售价格
    stock_quantity = Column(Integer) # 库存数量
    updated_at = Column(DateTime, default=datetime.now(china_tz), onupdate=lambda: datetime.now(china_tz)) 
        # 当该行记录的任何字段被修改时，自动将本字段（updated_at）的值设置为当前时间（UTC）
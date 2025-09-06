# backend/schemas/bill_record.py

from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class BillType(str, Enum):
    purchase = "purchase"
    sale = "sale"

class BillRecordBase(BaseModel):
    bill_type: BillType
    amount: float
    isbn: str
    bk_id: Optional[int]

class BillRecordCreate(BillRecordBase): 
    # 因为是付款/购买时自动产生的，而付款时书籍的信息不一定已经进入了图书信息表，所以要想办法用进货清单表中的内容创建账单中书籍的信息
    publisher: str
    author: str
    price: float
    quantity: int
    title: str
    user_id: Optional[int] = None  # 普通用户购买图书时记录普通用户id，管理员用户支付账单时记录管理员id

class BillRecordResponse(BillRecordCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
# backend/schemas/purchase_order.py

from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional

class PaymentStatus(str, Enum):
    unpaid = "unpaid"
    paid = "paid"
    returned = "returned"

class PurchaseOrderCreate(BaseModel):
    isbn: str
    purchase_price: float
    quantity: int

class PurchaseOrderResponse(PurchaseOrderCreate):
    id: int
    bk_id: Optional[int]
    title: str  # 冗余存储
    author: str
    publisher: str
    is_stocked: bool  # 新增字段，表示是否已入库
    order_status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True

# 入库时提供的零售价格信息
class RetailPriceInfo(BaseModel):
    retail_price: float
# backend/api/purchase_order.py

from fastapi import APIRouter, Depends, HTTPException, Body
from backend.crud import create_order, pay_order, return_order, stock_book, get_all_orders
from backend.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse, RetailPriceInfo
from .deps import get_current_admin
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models.user import User
from typing import Optional, Dict, List

router = APIRouter(prefix="/orders", tags=["进货管理"])

# 创建进货订单（管理员）
@router.post("/", response_model=PurchaseOrderResponse)
def create_purchase_order(
    isbn: str = Body(..., embed=True),  # 必填字段
    quantity: int = Body(..., embed=True),     # 必填字段
    purchase_price: float = Body(..., embed=True),      # 必填字段
    manual_book_info: Optional[Dict] = Body(None, embed=True),  # 可选字段
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    order_data = PurchaseOrderCreate(
        isbn=isbn,
        quantity=quantity,
        purchase_price=purchase_price
    )

    return create_order(db=db, current_user=admin, order_data=order_data, manual_book_info=manual_book_info)

# 支付进货订单（管理员）
@router.post("/{order_id}/pay", response_model=PurchaseOrderResponse)
def pay_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return pay_order(db, admin, order_id)

# 图书退货（管理员）
@router.post("/{order_id}/return", response_model=PurchaseOrderResponse)
def return_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return return_order(db, admin, order_id)

# 入库操作（管理员）
@router.post("/{order_id}/stock", response_model=PurchaseOrderResponse)
def stock_purchase_order(
    order_id: int,
    retail: RetailPriceInfo,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return stock_book(db, admin, order_id, retail)

# 获取所有订单（管理员）
@router.get("/", response_model=List[PurchaseOrderResponse])
def read_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return get_all_orders(db=db, current_user=current_user)
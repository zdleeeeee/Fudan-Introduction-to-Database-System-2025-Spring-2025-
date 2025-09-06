# backend/crud/purchase_order.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.crud.bill_record import create_purchase_bill
from backend.database.models import PurchaseOrder, User, Book
from backend.schemas.user import UserRole
from backend.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse, PaymentStatus, RetailPriceInfo
from datetime import datetime
from typing import List

# 创建订单
def create_order(
    db: Session, 
    current_user: User, 
    order_data: PurchaseOrderCreate, 
    manual_book_info: Optional[dict] = None
) -> PurchaseOrderResponse:
    # 权限检查
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以创建进货订单"
        )
    
    # 检查图书是否存在
    book = db.query(Book).filter(Book.isbn == order_data.isbn).first()
    book_exists = book is not None

    if book_exists:
        # 图书存在，从数据库获取信息，不需要手动提供信息
        order_info = {
            **order_data.model_dump(),
            "bk_id": book.id,
            "title": book.title,
            "author": book.author,
            "publisher": book.publisher
        }
    else:
        # 图书不存在，检查是否提供了手动信息
        if not manual_book_info or not all(k in manual_book_info for k in ["title", "author", "publisher"]):
            raise HTTPException(
                status_code=400,
                detail="图书不存在，请提供完整的图书信息(title, author, publisher)"
            )
        order_info = {
            **order_data.model_dump(),
            "bk_id": None,
            "title": manual_book_info["title"],
            "author": manual_book_info["author"],
            "publisher": manual_book_info["publisher"],
        }
    
    db_order = PurchaseOrder(
        **order_info,
        is_stocked=False,
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return PurchaseOrderResponse.model_validate(db_order)

# 支付订单
def pay_order(
    db: Session,
    current_user: User,
    order_id: int,
) -> PurchaseOrderResponse:
    """仅标记订单为已付款状态，不处理库存"""
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有管理员可以支付订单")

    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.order_status != PaymentStatus.unpaid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能支付未付款的订单")

    order.order_status = PaymentStatus.paid  # 仅更新付款状态
    db.commit()

    # 自动生成账单记录
    create_purchase_bill(db=db, order_data=order, admin_id=current_user.id)

    return PurchaseOrderResponse.model_validate(order)

# 图书退货
def return_order(
    db: Session,
    current_user: User,
    order_id: int,
) -> PurchaseOrderResponse:
    """仅标记订单为已退货状态，不处理库存"""
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有管理员可以支付订单")

    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.order_status != PaymentStatus.unpaid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能退货未付款的订单")

    order.order_status = PaymentStatus.returned  # 仅更新退货状态
    db.commit()

    return PurchaseOrderResponse.model_validate(order)


# 图书入库
def stock_book(
    db: Session,
    current_user: User,
    order_id: int,
    retail_info: RetailPriceInfo
) -> PurchaseOrderResponse:
    """将已付款的图书入库"""
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有管理员可以操作入库")

    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.order_status != PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能入库已付款的订单")
    if order.is_stocked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该订单已入库")

    # 处理图书信息
    book = db.query(Book).filter(Book.isbn == order.isbn).first()
    
    if not book:
        # 新书入库
        if not hasattr(order, 'title') or not hasattr(order, 'author') or not hasattr(order, 'publisher'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少必要的图书信息(title, author, publisher等)"
            )
            
        book = Book(
            isbn=order.isbn,
            title=order.title,
            author=order.author,
            publisher=order.publisher,
            retail_price=retail_info.retail_price,
            stock_quantity=order.quantity
        )
        db.add(book)
    else:
        # 已有图书增加库存
        book.stock_quantity += order.quantity
        if retail_info.retail_price:  # 可选更新零售价
            book.retail_price = retail_info.retail_price

    # 标记订单已入库
    order.is_stocked = True
    db.commit()
    return PurchaseOrderResponse.model_validate(order)

def get_all_orders(
    db: Session,
    current_user: User
) -> List[PurchaseOrderResponse]:
    # 权限检查
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以查看订单信息"
        )

    orders = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()

    return [PurchaseOrderResponse.model_validate(order) for order in orders]
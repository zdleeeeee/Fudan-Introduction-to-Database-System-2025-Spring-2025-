# backend/crud/bill_record.py

from sqlalchemy import and_
from sqlalchemy.orm import Session
from backend.database.models import BillRecord, PurchaseOrder, Book, User
from backend.schemas.bill_record import BillRecordCreate, BillRecordResponse, BillType
from backend.schemas.user import UserRole
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException, status

def create_bill_record(
    db: Session, 
    bill_data: BillRecordCreate,
    user_id: Optional[int] = None
) -> BillRecordResponse:
    """
    自动创建账单记录
    参数:
        - bill_data: 账单基础数据
        - user_id: 关联用户ID（购买用户或操作管理员）
    """
    db_bill = BillRecord(
        bill_type=bill_data.bill_type,
        amount=bill_data.price * bill_data.quantity,  # 计算总金额
        bk_id=bill_data.bk_id if hasattr(bill_data, 'bk_id') else None,
        isbn=bill_data.isbn,
        title=bill_data.title,
        author=bill_data.author,
        publisher=bill_data.publisher,
        price=bill_data.price,
        quantity=bill_data.quantity,
        user_id=user_id
    )
    
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return BillRecordResponse.model_validate(db_bill)


def create_purchase_bill(
    db: Session,
    order_data: PurchaseOrder,  # 假设从order模块导入
    admin_id: int                    # 操作的管理员ID
):
    """
    专门处理进货付款的账单创建
    """
    bill_data = BillRecordCreate(
        bill_type=BillType.purchase,
        amount=order_data.purchase_price * order_data.quantity,
        bk_id=order_data.bk_id,
        isbn=order_data.isbn,
        title=order_data.title,
        author=order_data.author,
        publisher=order_data.publisher,
        price=order_data.purchase_price,
        quantity=order_data.quantity
    )
    
    return create_bill_record(db, bill_data, user_id=admin_id)

def create_sale_bill(
    db: Session,
    book_data: Book,          # 销售的书籍数据
    quantity: int,            # 销售数量
    user_id: int              # 购买用户ID
):
    """
    专门处理用户购买的账单创建
    """
    bill_data = BillRecordCreate(
        bill_type=BillType.sale,
        amount=book_data.retail_price * quantity,
        bk_id=book_data.id,
        isbn=book_data.isbn,
        title=book_data.title,
        author=book_data.author,
        publisher=book_data.publisher,
        price=book_data.retail_price,
        quantity=quantity,
    )
    
    return create_bill_record(db, bill_data, user_id=user_id)

# 查询一段时间内的财务信息
def get_financial_records(
    db: Session,
    current_user: User,
    start_time: datetime,
    end_time: datetime,
    record_type: str = None  # 可选过滤类型：'purchase'/'sale'
) -> List[BillRecordResponse]:
    """
    按时间段获取财务记录（仅限admin/super_admin）
    
    参数:
    - start_time: 开始时间（包含）
    - end_time: 结束时间（包含）
    - record_type: 可选过滤类型（'purchase'进货/'sale'销售）
    
    返回:
    - 账单记录列表（按时间倒序）
    """
    # 权限检查
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以查看财务信息"
        )

    # 基础查询条件
    query = db.query(BillRecord).filter(
        and_(
            BillRecord.created_at >= start_time,
            BillRecord.created_at <= end_time
        )
    )

    # 按类型过滤
    if record_type:
        if record_type.lower() == 'purchase':
            query = query.filter(BillRecord.bill_type == 'purchase')
        elif record_type.lower() == 'sale':
            query = query.filter(BillRecord.bill_type == 'sale')

    # 执行查询并返回
    records = query.order_by(BillRecord.created_at.desc()).all()
    return [BillRecordResponse.model_validate(record) for record in records]
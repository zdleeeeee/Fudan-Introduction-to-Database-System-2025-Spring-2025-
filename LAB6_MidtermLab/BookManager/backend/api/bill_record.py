# backend/api/bill_record.py

from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models.user import User
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from backend.crud import get_financial_records
from backend.schemas.bill_record import BillRecordResponse
from backend.api.deps import get_current_admin
from typing import List

router = APIRouter(prefix="/bills", tags=["财务管理"])

@router.get("/records", response_model=List[BillRecordResponse])
def view_financial(
    start: datetime = Query(..., description="开始时间（ISO格式）"),
    end: datetime = Query(..., description="结束时间（ISO格式）"),
    type: str = Query(None, description="过滤类型：purchase/sale"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return get_financial_records(db, admin, start, end, type)
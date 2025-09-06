# backend/api/sales
from fastapi import APIRouter, Depends, Body
from backend.crud import sell_book
from backend.schemas import BillRecordResponse
from backend.api.deps import get_db, get_current_user
from sqlalchemy.orm import Session
from backend.database.models import User

router = APIRouter(prefix="/sales", tags=["图书销售"])

@router.post("/{bk_id}", response_model=BillRecordResponse)
def sell_book_1(
    bk_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> BillRecordResponse:
    return sell_book(db=db, book_id=bk_id, quantity_delta=quantity, customer=user)
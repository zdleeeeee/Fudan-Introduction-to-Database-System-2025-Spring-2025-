# backend/schemas/book.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    publisher: str

class BookCreate(BookBase):
    retail_price: float
    stock_quantity: int = 0

class BookUpdate(BookBase):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    retail_price: Optional[float] = None

class BookResponse(BookBase):
    id: int
    retail_price: float
    stock_quantity: int
    updated_at: datetime

    class Config:
        from_attributes = True
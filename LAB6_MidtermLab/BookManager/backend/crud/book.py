# backend/crud/book.py

from fastapi import HTTPException, status
from sqlalchemy import exc
from sqlalchemy.orm import Session
from backend.database.models import Book, User
from backend.schemas.user import UserRole
from backend.schemas.book import BookCreate, BookUpdate, BookResponse
from backend.schemas.bill_record import BillRecordResponse
from .bill_record import create_sale_bill
from typing import List

def get_book_by_id(db: Session, book_id: int) -> List[BookResponse]:
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID为 {book_id} 的书籍不存在"
        )
    return BookResponse.model_validate(db_book)

def get_book(db: Session, isbn: str) -> BookResponse:
    db_book = db.query(Book).filter(Book.isbn == isbn).first()
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ISBN为 {isbn} 的书籍不存在"
        )
    return BookResponse.model_validate(db_book)

def get_all_books(db: Session) -> List[BookResponse]:
    books = db.query(Book).all()
    return [BookResponse.model_validate(book) for book in books]

def search_books(db: Session, keyword: str) -> List[BookResponse]:
    books = db.query(Book).filter(
        (Book.title.contains(keyword)) 
    ).all()
    return [BookResponse.model_validate(book) for book in books]

def get_book_by_isbn_func(db: Session, isbn: str) -> List[BookResponse]:
    books = db.query(Book).filter(
        (Book.isbn.contains(isbn)) 
    ).all()
    return [BookResponse.model_validate(book) for book in books]

def search_books_with_author(db: Session, author: str) -> List[BookResponse]:
    books = db.query(Book).filter(
        (Book.author.contains(author)) 
    ).all()
    return [BookResponse.model_validate(book) for book in books]

def search_books_with_publisher(db: Session, publisher: str) -> List[BookResponse]:
    books = db.query(Book).filter(
        (Book.publisher.contains(publisher)) 
    ).all()
    return [BookResponse.model_validate(book) for book in books]

def create_book(db: Session, book: BookCreate, current_user: User) -> BookResponse:
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可创建书籍信息"
        )
    
    # 检查书籍是否已经存在
    existing_book = db.query(Book).filter(Book.isbn == book.isbn).first()
    if existing_book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ISBN为 {book.isbn} 的书籍已存在"
        )
    
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return BookResponse.model_validate(db_book)

def update_book(db: Session, book: BookUpdate, bk_id: int, current_user: User) -> BookResponse:
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可修改书籍信息"
        )
    
    update_data = book.model_dump(exclude_unset=True)  # [exclude_unset=True]: 忽略未提供的字段
    db.query(Book).filter(Book.id == bk_id).update(update_data) # update() 方法直接接受一个字典来更新记录，而不需要先将字典转换为模型实例。
    db.commit()
    return get_book_by_id(db, bk_id)

# 销售书籍
def sell_book(db: Session, book_id: int, quantity_delta: int, customer: User) -> BillRecordResponse:
    try:
        db_book = db.query(Book).filter(Book.id == book_id).with_for_update().first()
        if not db_book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图书不存在"
            )
        
        if quantity_delta <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="购买数量必须大于0"
            )
        
        new_quantity = db_book.stock_quantity - quantity_delta
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"库存不足，当前库存：{db_book.stock_quantity}"
            )
        
        db_book.stock_quantity = new_quantity
        db.flush()  # 立即刷新到数据库（不提交）
        
        bill_record = create_sale_bill(db, db_book, quantity_delta, customer.id)
        db.commit()
        
        return bill_record
    
    except exc.SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库操作失败：{str(e)}"
        )
    except Exception as e:  # 捕获其他意外错误
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"交易处理异常：{str(e)}"
        )
    
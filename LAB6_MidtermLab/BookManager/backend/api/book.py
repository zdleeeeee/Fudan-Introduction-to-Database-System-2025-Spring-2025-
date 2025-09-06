# backend/api/book.py

from fastapi import APIRouter, Depends, HTTPException
from backend.crud.book import update_book, get_book_by_id, get_all_books, create_book, search_books, get_book_by_isbn_func, search_books_with_author, search_books_with_publisher
from backend.schemas.book import BookCreate, BookUpdate, BookResponse
from backend.api.deps import get_current_admin
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models.user import User
from typing import List

router = APIRouter(prefix="/books", tags=["图书信息"])

# 查看所有书籍
@router.get("/", response_model=List[BookResponse])
def list_books(db: Session = Depends(get_db)):
    return get_all_books(db)

# 用书名keyword查找
@router.get("/search", response_model=List[BookResponse])
def search(keyword: str, db: Session = Depends(get_db)):
    return search_books(db, keyword)

# 用书籍id查找
@router.get("/{bk_id}", response_model=BookResponse)
def get_book_by_id_api(bk_id: int, db: Session = Depends(get_db)):
    return get_book_by_id(db, bk_id)

# 通过ISBN查找书籍
@router.get("/isbn/{isbn}", response_model=List[BookResponse])
def get_book_by_isbn(isbn: str, db: Session = Depends(get_db)):
    return get_book_by_isbn_func(db, isbn)

# 通过作者查找书籍
@router.get("/author/{author_name}", response_model=List[BookResponse])
def search_books_by_author(author_name: str, db: Session = Depends(get_db)):
    return search_books_with_author(db, author_name)

# 通过出版社查找书籍
@router.get("/publisher/{publisher_name}", response_model=List[BookResponse])
def search_books_by_publisher(publisher_name: str, db: Session = Depends(get_db)):
    return search_books_with_publisher(db, publisher_name)

# 添加书籍
@router.post("/", response_model=BookResponse)
def add_book(book: BookCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return create_book(db, book, admin)

# 更新书籍信息
@router.put("/{bk_id}", response_model=BookResponse)
def update_book_info(
    book: BookUpdate,  # 图书更新数据
    bk_id: int,
    db: Session = Depends(get_db),  # 数据库会话
    current_user: User = Depends(get_current_admin)  # 管理员验证
) -> BookResponse:
    return update_book(db, book, bk_id, current_user)
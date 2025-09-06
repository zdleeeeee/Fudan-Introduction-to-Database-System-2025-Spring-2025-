# backend/crud/__init__.py

'''
==========================================================
作用：
    封装所有数据库的增删改查（CRUD）操作。
    隔离业务逻辑和数据库细节，方便维护和复用。
    使用SQLAlchemy与数据库交互，但不处理业务规则（如权限校验）

==========================================================
'''

from backend.crud.user import get_user, get_user_deps, get_all_users, get_user_by_username, create_user, authenticate_user, update_user, update_self, shift_user_active
from backend.crud.book import get_book_by_id, get_book, get_all_books, search_books, create_book, update_book, sell_book, get_book_by_isbn_func, search_books_with_author, search_books_with_publisher
from backend.crud.purchase_order import create_order, pay_order, stock_book, get_all_orders, return_order
from backend.crud.bill_record import create_sale_bill, create_bill_record, create_purchase_bill, get_financial_records
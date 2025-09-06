# backend/database/init_db.py
from sqlalchemy import create_engine
from .models import User, Book
from .session import Base
from .session import engine, SessionLocal
from ..config import settings

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    try:
        # 初始化用户（密码自动哈希）
        # 在 SQLAlchemy 模型中，数据库会自动处理：插入时不指定 ID 时，数据库自动分配（SQLite 是 AUTOINCREMENT）
        # 登录时使用用户名和密码登录
        Users = [
            User(
                username=settings.SUPERUSER_USERNAME,
                hashed_password=User.hash_password(settings.SUPERUSER_PASSWORD),  # bcrypt 哈希
                email=settings.SUPERUSER_EMAIL,
                role="super_admin",
                is_active=True # 激活状态下可以登录账号，封禁状态下不可登陆账号，显示已封禁
            ),
            User(
                username="admin001",
                hashed_password=User.hash_password("admin001"),
                email="admin01@example.com",
                role="admin",
                is_active=True
            ),
            User(
                username="user001",
                hashed_password=User.hash_password("user001"),
                email="user01@example.com",
                role="user",
                is_active=True
            )
        ]

        # 初始化图书
        Books = [
            Book(
                isbn="978-3-16-148410-0",
                title="Python高级编程",
                author="John Doe",
                publisher="Tech Press",
                retail_price=99.99,
                stock_quantity=100
            ),
            Book(
                isbn="978-7-302-49836-1",
                title="Python编程从入门到实践",
                author="Eric Matthes",
                publisher="清华大学出版社",
                retail_price=89.00,
                stock_quantity=50
            ),
            Book(
                isbn="978-7-115-46105-3",
                title="流畅的Python",
                author="Luciano Ramalho",
                publisher="人民邮电出版社",
                retail_price=128.00,
                stock_quantity=30
            ),
            Book(
                isbn="978-7-121-33483-6",
                title="算法导论",
                author="Thomas H.Cormen",
                publisher="电子工业出版社",
                retail_price=128.00,
                stock_quantity=20
            )
        ]

        db.add_all(Users)
        db.add_all(Books)
        db.commit()
        print("✅ Database initialized successfully with sample data!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
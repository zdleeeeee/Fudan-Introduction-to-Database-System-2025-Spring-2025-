# backend/database/session.py
# Database session managment 数据库会话管理
# - Creates SQLAlchemy's database engine (Engine)
# - Defines the session factory for database sessions
# - Provides the declarative base class (Base) for defining data models

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from backend.config import settings  # Import database URL from config

# Create database engine (connection pool)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite-specific parameter
)

# Session factory (generates database sessions)
SessionLocal = sessionmaker(
    autocommit=False,  # Disable auto-commit (recommend explicit commits)
    autoflush=False,   # Disable auto-flush
    bind=engine        # Bind to the engine created above
)

# Declarative base class (all model classes inherit this)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    符合类型检查的数据库会话生成器
    返回类型注解必须明确为 Generator[YieldType, SendType, ReturnType]
    """

    """FastAPI依赖注入的数据库会话生成器"""
    db: Session = SessionLocal() # 表示变量 db 的类型是 Session（SQLAlchemy 的会话类）
    try:
        yield db
    finally:
        db.close()

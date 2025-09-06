# Application Configuration Management
# - Centralizes all application configuration
# - Supports reading configurations from environment variables (for security)
# - Provides type-safe configuration access

# backend/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 应用基础配置
    APP_NAME: str = "图书销售管理系统"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 数据库配置（SQLite示例，生产环境可改用PostgreSQL）
    DATABASE_URL: str = "sqlite:///./library.db"

    # 安全配置
    SECRET_KEY: str = "simple-dev-key-for-demo-only"  # 用于JWT令牌签名，仅适用于作业演示用的简单密钥！！！
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240 # 4小时强制退出，需要重新登陆

    # 超级管理员初始账号（仅首次运行生效）
    SUPERUSER_USERNAME: str = "superadmin"
    SUPERUSER_PASSWORD: str = "superadmin123"
    SUPERUSER_EMAIL: str = "superadmin@example.com"

    '''# 生产环境覆盖默认配置（通过环境变量），为了简化，暂时不考虑生产环境，所以不使用Config类和.env
    class Config:
        env_file = ".env"  # 从.env文件加载环境变量
        env_file_encoding = 'utf-8'  # 确保中文兼容
        case_sensitive = True  # 环境变量大小写敏感
    '''
        
# 全局配置实例
settings = Settings()
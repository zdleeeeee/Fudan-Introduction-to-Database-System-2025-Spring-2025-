# backend/schemas/__init__.py
# 作用：定义数据验证模型，分为请求/响应Schema和数据库模型解耦。
# 集中导出所有Schemas
from .user import *
from .book import *
from .purchase_order import *
from .bill_record import *
from .auth import *
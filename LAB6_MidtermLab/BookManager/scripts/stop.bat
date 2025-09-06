@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

set "SERVICE_TITLE=FastAPI Server"
echo 正在查找 "%SERVICE_TITLE%" 服务...

taskkill /FI "WINDOWTITLE eq %SERVICE_TITLE%*" /F
if %ERRORLEVEL% EQU 0 (
    echo 成功停止服务
) else (
    echo 未找到运行的 "%SERVICE_TITLE%" 服务
)

pause
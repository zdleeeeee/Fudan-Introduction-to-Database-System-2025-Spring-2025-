@echo off
SETLOCAL

:: ==============================================
:: 后端服务启动脚本
:: 功能: 启动Web服务并自动打开浏览器
:: ==============================================

set PROJECT_ROOT=%~dp0..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set VENV_DIR=%PROJECT_ROOT%\venv
set MAIN_FILE=%BACKEND_DIR%\main.py
set FRONTEND_DIR=%PROJECT_ROOT%\frontend
set URL=http://127.0.0.1:8000

echo 正在启动后端服务...

:: 切换到项目根目录
cd /d "%PROJECT_ROOT%"

:: 激活虚拟环境
call "%VENV_DIR%\Scripts\activate"
if %errorlevel% neq 0 (
    echo [错误] 虚拟环境激活失败
    echo 请先运行setup.bat设置环境
    pause
    exit /b 1
)

:: 启动服务并在完成后打开浏览器
:: 先启动服务进程
start "FastAPI Server" cmd /k "uvicorn backend.main:app --host 127.0.0.1 --port 8000"

:: 等待几秒钟确保后端服务已启动
timeout /t 5 >nul

echo 正在启动前端服务...

:: 启动前端服务进程
powershell.exe -Command "Start-Process powershell.exe '-NoExit -Command cd ''%FRONTEND_DIR%'' ; npm start'"

:: 等待几秒钟确保前端服务已启动
timeout /t 10 >nul

echo 服务已在后台运行，浏览器已打开
echo 若想停止服务，运行stop.bat
echo 按任意键关闭此窗口(不会停止服务)...
pause
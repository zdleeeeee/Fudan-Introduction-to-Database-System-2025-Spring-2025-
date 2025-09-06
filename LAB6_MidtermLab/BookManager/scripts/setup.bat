@echo off
setlocal enabledelayedexpansion
SETLOCAL

:: ==============================================
:: 后端环境安装脚本
:: 位置: scripts/setup.bat
:: 功能: 初始化Python虚拟环境并安装依赖
:: ==============================================

:: 配置部分
set PROJECT_ROOT=%~dp0..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set VENV_DIR=%PROJECT_ROOT%\venv
set REQUIREMENTS=%BACKEND_DIR%\requirements.txt

:: 检查Python安装
echo 检查Python安装...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python或未添加到系统PATH
    echo 请从 https://www.python.org/downloads/ 安装Python 3.8+
    echo 并确保安装时勾选了"Add Python to PATH"选项
    pause
    exit /b 1
)

:: 检查是否已存在虚拟环境
if exist "%VENV_DIR%\Scripts\python.exe" (
    echo 检测到已存在的虚拟环境
    set /p REINSTALL="是否要重新创建虚拟环境？(y/N): "
    if /i "!REINSTALL!"=="y" (
        echo 删除旧虚拟环境...
        rmdir /s /q "%VENV_DIR%"
    ) else (
        echo 使用现有虚拟环境
        goto INSTALL_DEPS
    )
)

:: 创建虚拟环境
echo 正在创建Python虚拟环境...
python -m venv "%VENV_DIR%"
if %errorlevel% neq 0 (
    echo [错误] 虚拟环境创建失败
    pause
    exit /b 1
)

:INSTALL_DEPS
echo 激活虚拟环境...
call "%VENV_DIR%\Scripts\activate"
if %errorlevel% neq 0 (
    echo [错误] 虚拟环境激活失败
    pause
    exit /b 1
)

set /p REINSTALLREQUIRE="是否要重新安装依赖包？(y/N): "
if /i "%REINSTALLREQUIRE%"=="y" (
    echo 升级到pip 25.0.1...
    python -m pip install --upgrade pip==25.0.1
    echo 安装依赖包...
    pip install -r "%REQUIREMENTS%" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn --default-timeout=100
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络或手动运行以下命令：
        echo pip install -r "%REQUIREMENTS%" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn
        pause
        exit /b 1
    )
) else (
    echo 已安装依赖包
)

echo 初始化数据库...
cd %PROJECT_ROOT%
python -m backend.database.init_db
if %errorlevel% neq 0 (
    echo [错误] 数据库初始化失败
    pause
    exit /b 1
)

:: 检查Node.js和npm安装
echo 检查Node.js和npm安装...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] Node.js未检测到，请访问 https://nodejs.org/ 下载并安装v22.15.0 (x64)版本。
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] npm未检测到，请确保Node.js安装正确。
    pause
    exit /b 1
)

:: 检查并安装前端依赖
cd %FRONTEND_DIR%
echo 检查前端依赖...
npm list axios >nul 2>&1
if %errorlevel% neq 0 (
    echo [信息] 安装前端依赖...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败，请检查网络连接或手动运行 "npm install"。
        pause
        exit /b 1
    )
) else (
    echo [信息] 前端依赖已安装。
)

echo 配置成功！可运行run.bat启动应用！
pause
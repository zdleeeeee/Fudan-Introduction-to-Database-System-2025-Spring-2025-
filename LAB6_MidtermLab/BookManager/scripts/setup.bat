@echo off
setlocal enabledelayedexpansion
SETLOCAL

:: ==============================================
:: ��˻�����װ�ű�
:: λ��: scripts/setup.bat
:: ����: ��ʼ��Python���⻷������װ����
:: ==============================================

:: ���ò���
set PROJECT_ROOT=%~dp0..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set VENV_DIR=%PROJECT_ROOT%\venv
set REQUIREMENTS=%BACKEND_DIR%\requirements.txt

:: ���Python��װ
echo ���Python��װ...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [����] δ��⵽Python��δ��ӵ�ϵͳPATH
    echo ��� https://www.python.org/downloads/ ��װPython 3.8+
    echo ��ȷ����װʱ��ѡ��"Add Python to PATH"ѡ��
    pause
    exit /b 1
)

:: ����Ƿ��Ѵ������⻷��
if exist "%VENV_DIR%\Scripts\python.exe" (
    echo ��⵽�Ѵ��ڵ����⻷��
    set /p REINSTALL="�Ƿ�Ҫ���´������⻷����(y/N): "
    if /i "!REINSTALL!"=="y" (
        echo ɾ�������⻷��...
        rmdir /s /q "%VENV_DIR%"
    ) else (
        echo ʹ���������⻷��
        goto INSTALL_DEPS
    )
)

:: �������⻷��
echo ���ڴ���Python���⻷��...
python -m venv "%VENV_DIR%"
if %errorlevel% neq 0 (
    echo [����] ���⻷������ʧ��
    pause
    exit /b 1
)

:INSTALL_DEPS
echo �������⻷��...
call "%VENV_DIR%\Scripts\activate"
if %errorlevel% neq 0 (
    echo [����] ���⻷������ʧ��
    pause
    exit /b 1
)

set /p REINSTALLREQUIRE="�Ƿ�Ҫ���°�װ��������(y/N): "
if /i "%REINSTALLREQUIRE%"=="y" (
    echo ������pip 25.0.1...
    python -m pip install --upgrade pip==25.0.1
    echo ��װ������...
    pip install -r "%REQUIREMENTS%" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn --default-timeout=100
    if %errorlevel% neq 0 (
        echo [����] ������װʧ�ܣ�����������ֶ������������
        echo pip install -r "%REQUIREMENTS%" -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn
        pause
        exit /b 1
    )
) else (
    echo �Ѱ�װ������
)

echo ��ʼ�����ݿ�...
cd %PROJECT_ROOT%
python -m backend.database.init_db
if %errorlevel% neq 0 (
    echo [����] ���ݿ��ʼ��ʧ��
    pause
    exit /b 1
)

:: ���Node.js��npm��װ
echo ���Node.js��npm��װ...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [����] Node.jsδ��⵽������� https://nodejs.org/ ���ز���װv22.15.0 (x64)�汾��
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [����] npmδ��⵽����ȷ��Node.js��װ��ȷ��
    pause
    exit /b 1
)

:: ��鲢��װǰ������
cd %FRONTEND_DIR%
echo ���ǰ������...
npm list axios >nul 2>&1
if %errorlevel% neq 0 (
    echo [��Ϣ] ��װǰ������...
    npm install
    if %errorlevel% neq 0 (
        echo [����] ǰ��������װʧ�ܣ������������ӻ��ֶ����� "npm install"��
        pause
        exit /b 1
    )
) else (
    echo [��Ϣ] ǰ�������Ѱ�װ��
)

echo ���óɹ���������run.bat����Ӧ�ã�
pause
@echo off
SETLOCAL

:: ==============================================
:: ��˷��������ű�
:: ����: ����Web�����Զ��������
:: ==============================================

set PROJECT_ROOT=%~dp0..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set VENV_DIR=%PROJECT_ROOT%\venv
set MAIN_FILE=%BACKEND_DIR%\main.py
set FRONTEND_DIR=%PROJECT_ROOT%\frontend
set URL=http://127.0.0.1:8000

echo ����������˷���...

:: �л�����Ŀ��Ŀ¼
cd /d "%PROJECT_ROOT%"

:: �������⻷��
call "%VENV_DIR%\Scripts\activate"
if %errorlevel% neq 0 (
    echo [����] ���⻷������ʧ��
    echo ��������setup.bat���û���
    pause
    exit /b 1
)

:: ������������ɺ�������
:: �������������
start "FastAPI Server" cmd /k "uvicorn backend.main:app --host 127.0.0.1 --port 8000"

:: �ȴ�������ȷ����˷���������
timeout /t 5 >nul

echo ��������ǰ�˷���...

:: ����ǰ�˷������
powershell.exe -Command "Start-Process powershell.exe '-NoExit -Command cd ''%FRONTEND_DIR%'' ; npm start'"

:: �ȴ�������ȷ��ǰ�˷���������
timeout /t 10 >nul

echo �������ں�̨���У�������Ѵ�
echo ����ֹͣ��������stop.bat
echo ��������رմ˴���(����ֹͣ����)...
pause
@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

set "SERVICE_TITLE=FastAPI Server"
echo ���ڲ��� "%SERVICE_TITLE%" ����...

taskkill /FI "WINDOWTITLE eq %SERVICE_TITLE%*" /F
if %ERRORLEVEL% EQU 0 (
    echo �ɹ�ֹͣ����
) else (
    echo δ�ҵ����е� "%SERVICE_TITLE%" ����
)

pause
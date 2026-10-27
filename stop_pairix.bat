@echo off
title Pairix - Stopping Servers
color 0E
cls

echo =====================================================================
echo                 PAIRIX - TERMINATING DRAFT SERVERS
echo =====================================================================
echo.

echo Stopping FastAPI Backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Stopping Vite Frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [OK] All Pairix server processes have been stopped cleanly.
echo.
pause

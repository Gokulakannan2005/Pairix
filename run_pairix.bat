@echo off
title Pairix - Algorithmic Talent Draft Platform
color 0B
cls

echo =====================================================================
echo                 PAIRIX - SMART TALENT DRAFT PLATFORM
echo          Algorithmic Team Formation ^& Skill Auction System
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking environment dependencies...
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python was not found in PATH! Please install Python 3.10+
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js / npm was not found in PATH! Please install Node.js 18+
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.

echo [2/4] Verifying Python and Node packages...
python -c "import fastapi, uvicorn, pydantic, pandas, numpy, sklearn, torch" >nul 2>nul
if %errorlevel% neq 0 (
    echo Python requirements not fully installed. Installing via pip...
    python -m pip install -r requirements.txt
)

if not exist "%~dp0frontend\node_modules" (
    echo Frontend node_modules not found. Installing npm dependencies...
    cd /d "%~dp0frontend"
    call npm.cmd install
    cd /d "%~dp0"
)

echo [OK] Environment is ready.
echo.

echo [3/4] Initializing Pairix Backend (FastAPI on http://127.0.0.1:8000)...
start "Pairix Backend Server" cmd /k "title Pairix Backend && cd /d %~dp0 && color 0A && echo Starting FastAPI Backend on port 8000... && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [4/4] Initializing Pairix Frontend (Vite on http://localhost:5173)...
start "Pairix Frontend Client" cmd /k "title Pairix Frontend && cd /d %~dp0\frontend && color 09 && echo Starting Vite Dev Server on port 5173... && npm.cmd run dev"

echo.
echo =====================================================================
echo   Waiting 4 seconds for servers to initialize...
echo =====================================================================
timeout /t 4 /nobreak >nul

echo.
echo Opening Pairix in your browser...
start http://localhost:5173

echo.
echo =====================================================================
echo   PAIRIX IS NOW RUNNING!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000/docs
echo.
echo   Keep the two background server windows open while using Pairix.
echo   To shut down both servers, simply run 'stop_pairix.bat'.
echo =====================================================================
echo.
pause

@echo off
chcp 65001 >nul
title Taolun - PRD Debate Dashboard

echo ==========================================
echo   Taolun - PRD Debate Dashboard
echo ==========================================
echo.

REM Check and kill processes on ports 9516 and 9528
echo [1/4] Checking ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9516') do (
    echo Killing process on port 9516 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9528') do (
    echo Killing process on port 9528 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Start backend
echo [2/4] Starting backend server...
start "Backend" cmd /k "cd backend && node src/index.js"
timeout /t 3 /nobreak >nul

REM Start frontend
echo [3/4] Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

REM Open browser
echo [4/4] Opening browser...
start http://localhost:9516

echo.
echo ==========================================
echo   All services started!
echo   Frontend: http://localhost:9516
echo   Backend: http://localhost:9528
echo ==========================================

pause

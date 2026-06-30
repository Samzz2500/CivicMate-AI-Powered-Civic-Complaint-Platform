@echo off
title Shahar Sahayya Kranti - Startup
color 0A

echo ========================================
echo   SHAHAR SAHAYYA KRANTI (CivicMate)
echo   AI-Powered Civic Engagement Platform
echo ========================================
echo.

:: Check MongoDB
echo [1/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [!] MongoDB is not running!
    echo.
    echo Please start MongoDB first:
    echo   Option 1: net start MongoDB ^(as Administrator^)
    echo   Option 2: mongod --dbpath C:\data\db
    echo.
    pause
    exit /b 1
)
echo [OK] MongoDB is running
echo.

:: Check Node.js
echo [2/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found in PATH
    echo Please install Node.js or add it to PATH
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

:: Start Backend
echo [3/4] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "node server-improved.js"
timeout /t 5 /nobreak >nul
cd ..
echo [OK] Backend started on http://localhost:5000
echo.

:: Start Frontend
echo [4/4] Starting Frontend...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..
echo [OK] Frontend starting on http://localhost:3000
echo.

echo ========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:5000/api-docs
echo.
echo Press any key to open browser...
pause >nul

:: Open browser
start http://localhost:3000

echo.
echo To stop servers, close the terminal windows
echo.
pause

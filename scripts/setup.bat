@echo off
title Setup - Shahar Sahayya Kranti
color 0B

echo ========================================
echo   SHAHAR SAHAYYA KRANTI - SETUP
echo ========================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo [OK] Node.js installed
echo.

:: Check Python
echo [2/5] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python not found!
    echo Please install Python from: https://www.python.org/
    pause
    exit /b 1
)
python --version
echo [OK] Python installed
echo.

:: Install Backend Dependencies
echo [3/5] Installing Backend Dependencies...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo [!] Backend npm install failed
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

:: Install Python Dependencies
echo [4/5] Installing Python Dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [!] Python dependencies install failed
    pause
    exit /b 1
)
echo [OK] Python dependencies installed
echo.

:: Install Frontend Dependencies
echo [5/5] Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [!] Frontend npm install failed
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..
echo.

echo ========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Next Steps:
echo 1. Install MongoDB (see INSTALL_MONGODB.md)
echo 2. Configure .env files in backend and frontend
echo 3. Run START.bat to launch the application
echo.
pause

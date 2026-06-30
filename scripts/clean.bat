@echo off
title Clean - Shahar Sahayya Kranti
color 0C

echo ========================================
echo   CLEAN PROJECT
echo ========================================
echo.
echo This will delete:
echo - node_modules folders
echo - package-lock.json files
echo - Build artifacts
echo.
echo Press Ctrl+C to cancel or
pause

echo.
echo Cleaning Backend...
cd ..\backend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo [OK] Backend cleaned

echo.
echo Cleaning Frontend...
cd ..\frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist build rmdir /s /q build
echo [OK] Frontend cleaned

cd ..
echo.
echo ========================================
echo   CLEANUP COMPLETE
echo ========================================
echo.
echo Run scripts\setup.bat to reinstall dependencies
echo.
pause

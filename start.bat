@echo off
chcp 65001 >nul
title SpellBook Dev

echo ========================================
echo  SpellBook OpenClaw - Dev Server
echo ========================================
echo.

:: Kill any leftover node processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Clear Turbopack/webpack cache to avoid stale errors
if exist "apps\web\.next" (
    echo [1/3] Clearing build cache...
    rmdir /s /q "apps\web\.next"
)

echo [2/3] Starting web server (Webpack mode)...
echo.
echo ========================================
echo  访问地址: http://localhost:3000
echo ========================================
echo.

:: Start Next.js in this window (Webpack, no Turbopack)
cd /d "%~dp0apps\web"
node_modules\.bin\next.cmd dev --webpack

@echo off
chcp 65001 >nul
title SpellBook Local Agent

echo ============================================
echo   SpellBook Local Agent
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

:: Check config.toml exists
if not exist "%~dp0config.toml" (
    echo.
    echo [提示] 未找到 config.toml
    echo        请登录 SpellBook 网页，进入「设置」页面，
    echo        注册一个 Agent 后点击「下载 config.toml」，
    echo        将下载的文件放到本目录后再双击本脚本。
    echo.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "%~dp0venv" (
    echo [SETUP] Creating virtual environment...
    python -m venv "%~dp0venv"
    echo [SETUP] Installing dependencies...
    "%~dp0venv\Scripts\pip" install -q -r "%~dp0requirements.txt"
    echo [SETUP] Done.
    echo.
)

:: Check openclaw is available
openclaw --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] openclaw not found in PATH.
    echo Please install it: npm install -g openclaw
    pause
    exit /b 1
)

echo [OK] Starting agent...
echo [OK] Press Ctrl+C to stop.
echo.

"%~dp0venv\Scripts\python" "%~dp0src\main.py" --config "%~dp0config.toml"

echo.
echo Agent stopped.
pause

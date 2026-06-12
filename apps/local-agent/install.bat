@echo off
chcp 65001 >nul
title SpellBook Agent — 安装向导

echo ============================================
echo  SpellBook 本地 Agent 安装向导
echo ============================================
echo.

:: ── 1. 检查 Python ────────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python。请先从 https://python.org 安装 Python 3.10 或更高版本。
    pause
    exit /b 1
)

:: ── 2. 检查 Node / npm ────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js。请先从 https://nodejs.org 安装 Node.js 18 或更高版本。
    pause
    exit /b 1
)

:: ── 3. 安装 Python 依赖 ───────────────────────────────────────────
echo [1/4] 安装 Python 依赖...
pip install -r "%~dp0requirements.txt" --quiet
if %errorlevel% neq 0 (
    echo [错误] pip install 失败，请检查网络或 requirements.txt
    pause
    exit /b 1
)

:: ── 4. 安装 openclaw CLI ──────────────────────────────────────────
echo [2/4] 安装 openclaw CLI...
npm install -g openclaw --quiet 2>nul
if %errorlevel% neq 0 (
    echo [警告] openclaw 安装失败，请稍后手动运行: npm install -g openclaw
)

:: ── 5. 检查 config.toml ───────────────────────────────────────────
echo [3/4] 检查配置文件...
if not exist "%~dp0config.toml" (
    echo.
    echo [提示] 未找到 config.toml。
    echo        请登录 SpellBook 网页，进入「设置」页面，
    echo        注册一个 Agent 后点击「下载 config.toml」，
    echo        将下载的文件放到本目录（%~dp0）再重新运行本脚本。
    echo.
    pause
    exit /b 1
)

:: ── 6. 创建数据目录 ───────────────────────────────────────────────
echo [4/4] 创建数据目录...
if not exist "%~dp0data" mkdir "%~dp0data"

echo.
echo ============================================
echo  安装完成！
echo  运行 start_agent.bat 启动 Agent
echo ============================================
echo.
pause

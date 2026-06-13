@echo off
chcp 65001 >nul
title SpellBook Agent — 首次配置

echo ============================================
echo   SpellBook Agent 配置助手
echo ============================================
echo.
echo 本工具将自动：① 配置 Agent ID  ② 检测/安装 openclaw
echo.

:: ── 1. Agent ID ────────────────────────────────────────────
set CONFIG_FILE="%~dp0config.toml"

if exist %CONFIG_FILE% (
    echo [✓] 检测到 config.toml
    goto :check_openclaw
)

echo ============================================
echo   第一步：配置 Agent
echo ============================================
echo.
echo 请在浏览器中登录 https://www.spellb00k.me
echo 进入「设置」→「本地 Agent」→ 注册一个 Agent
echo 复制 Agent ID 粘贴到下面：
echo.
set /p AGENT_ID="Agent ID: "

if "%AGENT_ID%"=="" (
    echo [错误] Agent ID 不能为空
    pause
    exit /b 1
)

:: Generate config.toml
set SUPABASE_URL="https://hbnaqcjpdabicpyzoagp.supabase.co"
set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibmFxY2pwZGFiaWNweXpvYWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjQ4NDMsImV4cCI6MjA5NjQwMDg0M30.Z6Q72pXNAvu5bFCHxEtieOZiLsrj3mrSSKpadVEFwyo"

(
    echo # SpellBook OpenClaw — Local Agent Config
    echo # 由安装程序自动生成
    echo.
    echo supabase_url = %SUPABASE_URL%
    echo supabase_anon_key = %SUPABASE_ANON_KEY%
    echo agent_id = "%AGENT_ID%"
    echo.
    echo heartbeat_interval = 30
    echo poll_interval = 5
    echo.
    echo # openclaw 路径（自动检测中...）
    echo openclaw_path = "openclaw"
    echo.
    echo local_db_path = "./data/db.sqlite"
) > %CONFIG_FILE%

echo [✓] config.toml 已创建

:: ── 2. Detect / Install OpenClaw ──────────────────────────────
:check_openclaw
echo.
echo ============================================
echo   第二步：检测 OpenClaw（龙虾）
echo ============================================
echo.

where openclaw >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where openclaw') do set OCLAW_PATH=%%i
    echo [✓] 已找到 openclaw: %OCLAW_PATH%
    
    :: Update config.toml with actual path
    powershell -Command "(Get-Content config.toml) -replace 'openclaw_path = \"openclaw\"', 'openclaw_path = \"%OCLAW_PATH:\=\\%\"' | Set-Content config.toml"
    echo [✓] config.toml 已更新为实际路径
    goto :done
)

:: OpenClaw not found — try auto-install
echo [⚠] 未检测到 openclaw，尝试自动安装...
echo.

:: Check for npm
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] 检测到 npm，正在安装 openclaw...
    echo.
    call npm install -g openclaw
    
    :: Verify installation
    where openclaw >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('where openclaw') do set OCLAW_PATH=%%i
        echo.
        echo [✓] openclaw 安装成功！
        echo     位置: %OCLAW_PATH%
        
        :: Update config.toml
        powershell -Command "(Get-Content config.toml) -replace 'openclaw_path = \"openclaw\"', 'openclaw_path = \"%OCLAW_PATH:\=\\%\"' | Set-Content config.toml"
        echo [✓] config.toml 已更新
        goto :done
    ) else (
        echo.
        echo [✗] openclaw 安装失败
        goto :manual_install
    )
) else (
    echo [✗] 未检测到 npm，无法自动安装 openclaw
    goto :manual_install
)

:manual_install
echo.
echo ============================================
echo   需要手动安装 Node.js + openclaw
echo ============================================
echo.
echo 请按以下步骤操作：
echo.
echo 1. 下载安装 Node.js（LTS 版本）：
echo    https://nodejs.org
echo.
echo 2. 安装 Node.js（一路下一步即可）
echo.
echo 3. 打开命令提示符（Win+R → 输入 cmd → 回车）
echo.
echo 4. 粘贴以下命令按回车：
echo.
echo    npm install -g openclaw
echo.
echo 5. 安装完成后，重新运行本配置助手
echo.
echo    路径: "%~dp0setup.bat"
echo.
pause
exit /b 1

:configure_openclaw
echo.
echo ============================================
echo   第三步：配置 OpenClaw（龙虾）
echo ============================================
echo.
echo 龙虾需要配置 API Key 才能调用 AI 模型。
echo 支持任意 OpenAI 兼容的 API（DeepSeek / OpenAI / 通义千问 / 智谱等）。
echo.
echo 选项：
echo   1) 运行配置向导（推荐）
echo   2) 直接写入配置（命令行）
echo   3) 稍后再说
echo.
set /p OCLAW_CHOICE="请选择 (1/2/3): "

if "%OCLAW_CHOICE%"=="1" (
    echo.
    echo 正在启动配置向导...
    call openclaw config
    goto :done
)

if "%OCLAW_CHOICE%"=="2" (
    echo.
    echo 请输入 API Key:
    echo （如 DeepSeek: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx）
    set /p API_KEY="API Key: "
    
    if "%API_KEY%"=="" (
        echo [错误] API Key 不能为空
        pause
        goto :configure_openclaw
    )
    
    echo.
    echo 请输入 Base URL（输入 0 使用 DeepSeek 官方地址）:
    echo 常用示例:
    echo   DeepSeek:   https://api.deepseek.com
    echo   OpenAI:     https://api.openai.com/v1
    echo   通义千问:   https://dashscope.aliyuncs.com/compatible-mode/v1
    echo   智谱 GLM:   https://open.bigmodel.cn/api/paas/v4
    echo   月之暗面:   https://api.moonshot.cn/v1
    echo.
    set /p BASE_URL="Base URL (输入0用默认): "
    
    if "%BASE_URL%"=="" set BASE_URL=0
    
    :: Write .env file
    if not exist "%USERPROFILE%\.openclaw" mkdir "%USERPROFILE%\.openclaw"
    
    if "%BASE_URL%"=="0" (
        echo DEEPSEEK_API_KEY=%API_KEY% > "%USERPROFILE%\.openclaw\.env"
    ) else (
        (
            echo DEEPSEEK_API_KEY=%API_KEY%
            echo OPENCLAW_BASE_URL=%BASE_URL%
        ) > "%USERPROFILE%\.openclaw\.env"
    )
    
    echo.
    echo [✓] 配置已写入 %USERPROFILE%\.openclaw\.env
    echo.
    echo 你也可以通过网页下载 .env 文件：
    echo   https://www.spellb00k.me/settings
    echo.
    pause
    goto :done
)

if "%OCLAW_CHOICE%"=="3" (
    echo.
    echo [提示] 稍后可通过以下方式配置：
    echo   1. 运行: openclaw config
    echo   2. 访问 https://www.spellb00k.me/settings 下载 .env 文件
    echo   3. 直接编辑 %%USERPROFILE%%\.openclaw\.env
    echo.
    pause
    goto :done
)

echo [错误] 无效选项，请重新选择
pause
goto :configure_openclaw

:done
echo.
echo ============================================
echo   ✅ 配置完成！
echo.
echo   Agent 现在可以正常运行。
echo.
echo   如已设为开机自启，下次开机 Agent 会自动运行。
echo   如需手动启动，双击 _run_loop.bat
echo ============================================
echo.
pause



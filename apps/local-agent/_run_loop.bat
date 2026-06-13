@echo off
chcp 65001 >nul
title SpellBook Local Agent (Auto-Restart)

:loop
echo [%date% %time%] Starting SpellBook Agent...

:: Check config
if not exist "%~dp0config.toml" (
    echo [ERROR] config.toml not found. Agent will not start.
    timeout /t 30 /nobreak >nul
    goto loop
)

:: Run agent
"%~dp0venv\Scripts\python" "%~dp0src\main.py" --config "%~dp0config.toml"

echo [%date% %time%] Agent exited (code %errorlevel%). Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop

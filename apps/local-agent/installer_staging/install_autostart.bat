@echo off
chcp 65001 >nul
title SpellBook Agent - 安装开机自启

echo ============================================
echo   SpellBook Agent — 开机自启安装
echo ============================================
echo.
echo 本脚本将注册 Windows 计划任务，让 Agent：
echo   - 开机自动启动（无需登录）
echo   - 崩溃后自动重启（5 秒内）
echo.
echo 需要管理员权限，如弹出 UAC 请点「是」。
echo.

:: Check admin
net session >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [提示] 未以管理员身份运行，正在重新请求权限...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set TASK_NAME=SpellBook Local Agent
set LOOP_BAT=%~dp0_run_loop.bat

:: Delete existing task if any
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Register: run at SYSTEM startup, hidden window, run whether user logged on or not
powershell -NoProfile -Command ^
  "$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c \"%LOOP_BAT%\"';" ^
  "$trigger = New-ScheduledTaskTrigger -AtStartup;" ^
  "$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable;" ^
  "$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest;" ^
  "Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null;" ^
  "Write-Host '已注册计划任务：%TASK_NAME%'"

if %errorlevel% EQU 0 (
    echo.
    echo [OK] 安装完成！Agent 将在下次开机时自动启动。
    echo.
    echo 立即启动？按任意键启动，关闭窗口跳过。
    pause >nul
    start "" "%LOOP_BAT%"
) else (
    echo [ERROR] 注册失败，请以管理员身份重新运行。
    pause
)

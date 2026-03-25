@echo off
chcp 65001 >nul
title G open v1.0.3 安装程序

echo ========================================
echo   G open 智能创作助手 v1.0.3
echo ========================================
echo.

:: 检查PowerShell
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 PowerShell，请先安装 PowerShell
    pause
    exit /b 1
)

:: 以管理员权限运行
if "%1"=="admin" (
    goto :run
)

:: 请求管理员权限
powershell -Command "Start-Process '%~f0' 'admin' -Verb RunAs"
exit /b

:run
:: 运行图形界面安装程序
powershell -ExecutionPolicy Bypass -File "%~dp0安装程序-GUI.ps1"

exit /b

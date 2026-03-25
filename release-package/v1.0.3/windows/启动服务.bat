@echo off
chcp 65001 >nul
title G open 智能创作助手

echo ========================================
echo   G open 智能创作助手 v1.0.3
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，正在尝试安装...
    echo 请稍候...
    
    :: 尝试使用 winget 安装
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    ) else (
        echo 请手动安装 Node.js: https://nodejs.org
        pause
        exit /b 1
    )
)

:: 检查 pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [安装] 正在安装 pnpm...
    npm install -g pnpm
)

:: 启动后端服务
echo [启动] 正在启动后端服务...
cd /d "%~dp0server"
start "" cmd /c "pnpm install && pnpm run dev"

:: 等待后端启动
timeout /t 5 /nobreak >nul

:: 启动前端服务
echo [启动] 正在启动前端服务...
cd /d "%~dp0client"
start "" cmd /c "pnpm install && pnpm run web"

:: 等待前端启动
timeout /t 10 /nobreak >nul

:: 打开浏览器
echo [启动] 正在打开浏览器...
start http://localhost:5000

echo.
echo ========================================
echo   G open 已启动！
echo ========================================
echo.
echo 前端地址: http://localhost:5000
echo 后端地址: http://localhost:9091
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

pause

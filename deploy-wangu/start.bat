@echo off
chcp 65001 >nul
echo ========================================
echo    万古长夜 - 独立服务器启动
echo ========================================
echo.

cd /d "%~dp0server"

:: 检查node_modules
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败！
        echo 请确保已安装 Node.js 18 或更高版本
        pause
        exit /b 1
    )
)

:: 创建数据目录
if not exist "data" mkdir data

echo 启动服务器...
echo.
call npm run dev

pause

@echo off
chcp 65001 >nul
echo ==========================================
echo   G open 智能创作助手 v1.0.0
echo   Windows x64 安装程序
echo ==========================================
echo.

:: 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 20.x 或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在安装 pnpm...
    npm install -g pnpm
)

:: 显示Node版本
echo [检查] Node.js 版本:
node --version
echo [检查] pnpm 版本:
pnpm --version
echo.

:: 安装依赖
echo [1/3] 正在安装依赖...
call pnpm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

:: 安装前端依赖
echo [2/3] 正在安装前端依赖...
cd client
call pnpm install
cd ..

:: 安装后端依赖
echo [3/3] 正在安装后端依赖...
cd server
call pnpm install
cd ..

echo.
echo ==========================================
echo   安装完成！
echo ==========================================
echo.
echo 启动方式:
echo   方式1: 双击运行 start.bat
echo   方式2: 手动运行 bash .cozeproj/scripts/dev_run.sh
echo.
echo 访问地址:
echo   前端: http://localhost:5000
echo   后端: http://localhost:9091
echo.
pause

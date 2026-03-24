@echo off
chcp 65001 >nul
title G Open AI助手 - 一键构建安装程序

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     G Open AI助手 - Windows 安装程序构建工具              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  此脚本将自动完成以下操作：                                ║
echo ║  1. 检查 Node.js 环境                                     ║
echo ║  2. 安装依赖                                              ║
echo ║  3. 构建 Windows 安装程序 (.exe)                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [警告] 建议以管理员身份运行，以便创建开始菜单快捷方式
    echo.
)

:: 检查 Node.js
echo [1/4] 检查 Node.js 环境...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未安装 Node.js！
    echo.
    echo 请先安装 Node.js: https://nodejs.org/
    echo 建议安装 LTS 版本 (18.x 或更高)
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [成功] Node.js 版本: %NODE_VERSION%

:: 检查 pnpm
echo.
echo [2/4] 检查 pnpm...
where pnpm >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 正在安装 pnpm...
    npm install -g pnpm
)
echo [成功] pnpm 已就绪

:: 进入项目目录
cd /d "%~dp0"
echo.
echo [信息] 当前目录: %CD%

:: 安装依赖
echo.
echo [3/4] 安装项目依赖...
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    pnpm install
) else (
    echo [提示] 依赖已存在，跳过安装
)

:: 构建安装程序
echo.
echo [4/4] 构建 Windows 安装程序...
echo.
echo 正在构建，请稍候...
echo.

pnpm run build:nsis

if %errorLevel% neq 0 (
    echo.
    echo [错误] 构建失败！
    echo.
    pause
    exit /b 1
)

:: 检查输出
echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo [成功] 构建完成！
echo.
echo 输出文件位置:
echo.

if exist "release\G Open AI助手 Setup 1.0.0.exe" (
    echo   📦 安装程序: release\G Open AI助手 Setup 1.0.0.exe
    for %%A in ("release\G Open AI助手 Setup 1.0.0.exe") do echo      文件大小: %%~zA 字节
)

if exist "release\G Open AI助手-1.0.0-Portable.exe" (
    echo   📦 便携版: release\G Open AI助手-1.0.0-Portable.exe
    for %%A in ("release\G Open AI助手-1.0.0-Portable.exe") do echo      文件大小: %%~zA 字节
)

echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo 您可以:
echo   1. 双击 Setup.exe 安装到电脑
echo   2. 运行 Portable.exe 无需安装直接使用
echo.

:: 打开输出目录
explorer release

pause

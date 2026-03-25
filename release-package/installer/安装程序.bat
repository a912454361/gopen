@echo off
:: G open 智能创作助手 - Windows 一键安装程序
:: 版本: 1.0.1

chcp 65001 >nul
title G open 智能创作助手 v1.0.1 安装程序

:: 管理员权限检查
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在请求管理员权限...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: 设置颜色
color 0A

:: 显示欢迎界面
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║      ██████╗  ██████╗ ██████╗     ██████╗ ██████╗  ██████╗ ║
echo ║      ╚════██╗██╔═████╗╚════██╗    ╚════██╗╚════██╗██╔════╝ ║
echo ║       █████╔╝██║██╔██║ █████╔╝     █████╔╝ █████╔╝██║      ║
echo ║      ██╔═══╝ ████╔╝██║██╔═══╝     ██╔═══╝ ██╔═══╝██║      ║
echo ║      ███████╗╚██████╔╝███████╗    ███████╗███████╗╚██████╗ ║
echo ║      ╚══════╝ ╚═════╝ ╚══════╝    ╚══════╝╚══════╝ ╚═════╝ ║
echo ║                                                              ║
echo ║           智能创作助手 v1.0.1 - Windows 安装程序            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 检测 Node.js
echo [检测环境] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║  [错误] 未检测到 Node.js                                     ║
    echo ╠══════════════════════════════════════════════════════════════╣
    echo ║                                                              ║
    echo ║  G open 需要 Node.js 20.x 或更高版本                        ║
    echo ║                                                              ║
    echo ║  请访问以下地址下载并安装:                                   ║
    echo ║  https://nodejs.org/                                         ║
    echo ║                                                              ║
    echo ║  安装完成后，请重新运行此安装程序                             ║
    echo ║                                                              ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js 版本: %NODE_VERSION%

:: 选择安装目录
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  请选择安装目录                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo  [1] 默认目录: %LOCALAPPDATA%\GOpen
echo  [2] 自定义目录
echo.
set /p CHOICE="请选择 (1/2): "

if "%CHOICE%"=="2" (
    set /p INSTALL_DIR="请输入安装目录: "
) else (
    set INSTALL_DIR=%LOCALAPPDATA%\GOpen
)

:: 创建安装目录
echo.
echo [安装] 创建安装目录: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 获取当前脚本所在目录
set SCRIPT_DIR=%~dp0

:: 复制文件
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  正在安装文件...                                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/8] 复制前端代码...
xcopy /E /I /Y "%SCRIPT_DIR%client" "%INSTALL_DIR%\client" >nul

echo [2/8] 复制后端代码...
xcopy /E /I /Y "%SCRIPT_DIR%server" "%INSTALL_DIR%\server" >nul

echo [3/8] 复制静态资源...
xcopy /E /I /Y "%SCRIPT_DIR%assets" "%INSTALL_DIR%\assets" >nul

echo [4/8] 复制配置文件...
copy /Y "%SCRIPT_DIR%package.json" "%INSTALL_DIR%\" >nul 2>&1
copy /Y "%SCRIPT_DIR%pnpm-workspace.yaml" "%INSTALL_DIR%\" >nul 2>&1
copy /Y "%SCRIPT_DIR%.gitignore" "%INSTALL_DIR%\" >nul 2>&1

echo [5/8] 复制启动脚本...
xcopy /E /I /Y "%SCRIPT_DIR%.cozeproj" "%INSTALL_DIR%\.cozeproj" >nul

echo [6/8] 创建桌面快捷方式...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%USERPROFILE%\Desktop\G open 智能创作助手.lnk'); $s.TargetPath = '%INSTALL_DIR%\启动服务.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'G open 智能创作助手'; $s.Save()"

echo [7/8] 创建开始菜单快捷方式...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\G open" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\G open"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\G open\启动 G open.lnk'); $s.TargetPath = '%INSTALL_DIR%\启动服务.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Save()"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\G open\卸载 G open.lnk'); $s.TargetPath = '%INSTALL_DIR%\卸载.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Save()"

echo [8/8] 注册到控制面板...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /v "DisplayName" /t REG_SZ /d "G open 智能创作助手" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /v "DisplayVersion" /t REG_SZ /d "1.0.1" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /v "Publisher" /t REG_SZ /d "G Open Team" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /v "UninstallString" /t REG_SZ /d "%INSTALL_DIR%\卸载.bat" /f >nul

:: 创建启动脚本
echo @echo off > "%INSTALL_DIR%\启动服务.bat"
echo chcp 65001 ^>nul >> "%INSTALL_DIR%\启动服务.bat"
echo title G open 智能创作助手 >> "%INSTALL_DIR%\启动服务.bat"
echo cd /d "%INSTALL_DIR%" >> "%INSTALL_DIR%\启动服务.bat"
echo echo 正在启动 G open 智能创作助手... >> "%INSTALL_DIR%\启动服务.bat"
echo start "G open 服务端" cmd /c "cd server && pnpm run dev" >> "%INSTALL_DIR%\启动服务.bat"
echo timeout /t 3 /nobreak ^>nul >> "%INSTALL_DIR%\启动服务.bat"
echo start "G open 客户端" cmd /c "cd client && pnpm run start" >> "%INSTALL_DIR%\启动服务.bat"
echo timeout /t 5 /nobreak ^>nul >> "%INSTALL_DIR%\启动服务.bat"
echo start http://localhost:5000 >> "%INSTALL_DIR%\启动服务.bat"
echo echo. >> "%INSTALL_IDR%\启动服务.bat"
echo echo 服务已启动！ >> "%INSTALL_DIR%\启动服务.bat"
echo echo 前端地址: http://localhost:5000 >> "%INSTALL_DIR%\启动服务.bat"
echo echo 后端地址: http://localhost:9091 >> "%INSTALL_DIR%\启动服务.bat"

:: 创建停止脚本
echo @echo off > "%INSTALL_DIR%\停止服务.bat"
echo chcp 65001 ^>nul >> "%INSTALL_DIR%\停止服务.bat"
echo echo 正在停止 G open 服务... >> "%INSTALL_DIR%\停止服务.bat"
echo taskkill /f /im node.exe 2^>nul >> "%INSTALL_DIR%\停止服务.bat"
echo echo 服务已停止 >> "%INSTALL_DIR%\停止服务.bat"
echo pause >> "%INSTALL_DIR%\停止服务.bat"

:: 创建卸载脚本
echo @echo off > "%INSTALL_DIR%\卸载.bat"
echo chcp 65001 ^>nul >> "%INSTALL_DIR%\卸载.bat"
echo title 卸载 G open 智能创作助手 >> "%INSTALL_DIR%\卸载.bat"
echo echo 正在卸载 G open 智能创作助手... >> "%INSTALL_DIR%\卸载.bat"
echo taskkill /f /im node.exe 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo rmdir /s /q "%INSTALL_DIR%" 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo del "%%USERPROFILE%%\Desktop\G open 智能创作助手.lnk" 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo rmdir /s /q "%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\G open" 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /f ^>nul 2^>^&1 >> "%INSTALL_DIR%\卸载.bat"
echo echo 卸载完成！ >> "%INSTALL_DIR%\卸载.bat"
echo pause >> "%INSTALL_DIR%\卸载.bat"

:: 询问是否安装依赖
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  文件安装完成！                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
set /p INSTALL_DEPS="是否立即安装依赖？(Y/N): "
if /i "%INSTALL_DEPS%"=="Y" (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║  正在安装依赖...                                             ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    
    :: 安装 pnpm
    echo [1/4] 安装 pnpm...
    pnpm --version >nul 2>&1 || npm install -g pnpm
    
    :: 安装根目录依赖
    echo [2/4] 安装根目录依赖...
    cd /d "%INSTALL_DIR%"
    call pnpm install
    
    :: 安装前端依赖
    echo [3/4] 安装前端依赖...
    cd client
    call pnpm install
    cd ..
    
    :: 安装后端依赖
    echo [4/4] 安装后端依赖...
    cd server
    call pnpm install
    cd ..
)

:: 完成界面
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║                    安装完成！                                ║
echo ║                                                              ║
echo ║  安装目录: %INSTALL_DIR%
echo ║                                                              ║
echo ║  启动方式:                                                   ║
echo ║    1. 双击桌面快捷方式 "G open 智能创作助手"                  ║
echo ║    2. 或运行 "%INSTALL_DIR%\启动服务.bat"   ║
echo ║                                                              ║
echo ║  访问地址:                                                   ║
echo ║    前端: http://localhost:5000                               ║
echo ║    后端: http://localhost:9091                               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set /p START_NOW="是否立即启动？(Y/N): "
if /i "%START_NOW%"=="Y" (
    start "" "%INSTALL_DIR%\启动服务.bat"
)

echo.
echo 感谢使用 G open 智能创作助手！
pause

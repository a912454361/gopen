@echo off
chcp 65001 >nul
echo ==========================================
echo   G open 智能创作助手 v1.0.0
echo   正在启动服务...
echo ==========================================
echo.

:: 启动后端服务
echo [1/2] 启动后端服务 (端口 9091)...
start "G open Server" cmd /c "cd server && pnpm run dev"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端服务
echo [2/2] 启动前端服务 (端口 5000)...
start "G open Client" cmd /c "cd client && pnpm run start"

echo.
echo ==========================================
echo   服务已启动！
echo ==========================================
echo.
echo 前端地址: http://localhost:5000
echo 后端地址: http://localhost:9091
echo.
echo 按任意键打开浏览器访问...
pause >nul
start http://localhost:5000

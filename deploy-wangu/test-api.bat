@echo off
chcp 65001 >nul
echo ========================================
echo    万古长夜 - 服务器测试
echo ========================================
echo.

set BASE_URL=http://localhost:18789

echo 1. 健康检查...
curl -s "%BASE_URL%/api/v1/health"
echo.
echo.

echo 2. 测试OAuth登录...
curl -s -X POST "%BASE_URL%/api/v1/oauth/callback" -H "Content-Type: application/json" -d "{\"platform\":\"github\",\"code\":\"test-code\"}"
echo.
echo.

echo 3. 获取收款账户...
curl -s "%BASE_URL%/api/v1/payment/accounts"
echo.
echo.

echo ========================================
echo    测试完成！
echo ========================================
pause

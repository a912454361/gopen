#!/bin/bash

echo "========================================"
echo "   万古长夜 - 服务器测试"
echo "========================================"
echo

BASE_URL="http://localhost:18789"

echo "1. 健康检查..."
HEALTH=$(curl -s "$BASE_URL/api/v1/health")
echo "   响应: $HEALTH"
echo

echo "2. 测试OAuth登录..."
OAUTH=$(curl -s -X POST "$BASE_URL/api/v1/oauth/callback" \
  -H "Content-Type: application/json" \
  -d '{"platform":"github","code":"test-code"}')
echo "   响应: $OAUTH"
echo

echo "3. 获取收款账户..."
PAYMENT=$(curl -s "$BASE_URL/api/v1/payment/accounts")
echo "   响应: ${PAYMENT:0:100}..."
echo

echo "========================================"
echo "   测试完成！"
echo "========================================"

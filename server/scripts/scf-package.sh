#!/bin/bash

# ========================================
# 腾讯云 SCF 部署打包脚本
# ========================================

set -e

echo "========================================"
echo "  腾讯云 SCF 部署打包"
echo "========================================"

# 进入 server 目录
cd "$(dirname "$0")/.."

# 清理旧的构建
echo "[1/4] 清理旧构建..."
rm -rf dist scf-package

# 构建项目
echo "[2/4] 构建项目..."
pnpm run build

# 创建 SCF 包目录
echo "[3/4] 创建部署包..."
mkdir -p scf-package

# 复制构建产物
cp -r dist/* scf-package/

# 复制必要的配置文件
cp package.json scf-package/
cp pnpm-lock.yaml scf-package/ 2>/dev/null || cp package-lock.json scf-package/ 2>/dev/null || true

# 复制 SCF 入口文件
cp src/scf-handler.ts scf-package/ 2>/dev/null || true
cp src/scf-app.ts scf-package/ 2>/dev/null || true

# 创建 .env 示例文件（实际部署时需要填写）
cat > scf-package/.env.example << 'EOF'
# 数据库配置
DATABASE_URL=your_database_url_here

# 安全配置
ADMIN_KEY=your_admin_key_here

# 对象存储配置
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret_key
OSS_BUCKET=your_bucket_name
OSS_REGION=your_region

# 其他配置
NODE_ENV=production
EOF

# 打包
echo "[4/4] 打包..."
cd scf-package
tar -czf ../gopen-scf-package.tar.gz .
cd ..

echo ""
echo "========================================"
echo "  ✅ 打包完成!"
echo "========================================"
echo ""
echo "部署包: gopen-scf-package.tar.gz"
echo "大小: $(du -h gopen-scf-package.tar.gz | cut -f1)"
echo ""
echo "下一步操作:"
echo "1. 登录腾讯云 SCF 控制台"
echo "2. 创建或更新函数 express_demo-1774288018"
echo "3. 上传部署包 gopen-scf-package.tar.gz"
echo "4. 配置环境变量（参考 .env.example）"
echo "5. 配置函数 URL 和自定义域名 gopen.com.cn"
echo ""

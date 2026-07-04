#!/bin/bash
# ============================================
# G Open 服务端部署脚本
# 直接在服务器上运行
# ============================================

cd /var/www/gopen

echo "=========================================="
echo "   创建项目文件结构"
echo "=========================================="

# 创建后端 package.json
cat > server/package.json << 'EOF'
{
  "name": "gopen-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "zod": "^3.22.4",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
EOF

# 创建后端 tsconfig.json
cat > server/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 创建后端入口文件
mkdir -p server/src/routes server/src/storage/database

cat > server/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 9091;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 管理员验证
app.get('/api/v1/admin/verify', (req, res) => {
  const key = req.query.key as string;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
  res.json({ success: key === ADMIN_KEY });
});

// 统计数据
app.get('/api/v1/admin/stats', (req, res) => {
  const key = req.query.key as string;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
  
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      memberUsers: 0,
      todayOrders: 0,
      todayAmount: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      paymentAccounts: {
        alipay: { name: '支付宝收款', account: '18321337942', realName: 'G Open官方' },
        wechat: { name: '微信收款', account: 'G Open官方', realName: 'G Open官方' }
      },
      recentOrders: []
    }
  });
});

// 订单列表
app.get('/api/v1/admin/orders', (req, res) => {
  res.json({ success: true, data: [] });
});

// 用户列表
app.get('/api/v1/admin/users', (req, res) => {
  res.json({ success: true, data: [] });
});

// 收入图表
app.get('/api/v1/admin/revenue-chart', (req, res) => {
  res.json({
    success: true,
    data: {
      daily: [
        { label: '周一', amount: 0 },
        { label: '周二', amount: 0 },
        { label: '周三', amount: 0 },
        { label: '周四', amount: 0 },
        { label: '周五', amount: 0 },
        { label: '周六', amount: 0 },
        { label: '周日', amount: 0 }
      ],
      maxAmount: 1
    }
  });
});

// 操作日志
app.get('/api/v1/admin/logs', (req, res) => {
  res.json({ success: true, data: [] });
});

// 支付账户
app.get('/api/v1/payment/accounts', (req, res) => {
  res.json({
    success: true,
    data: {
      alipay: { name: '支付宝', account: '18321337942', qrcodeUrl: '' },
      wechat: { name: '微信', account: '', qrcodeUrl: '' }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
EOF

# 创建前端 package.json
cat > client/package.json << 'EOF'
{
  "name": "gopen-client",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "build": "expo export --platform web",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.6",
    "react-native-web": "~0.19.13"
  },
  "devDependencies": {
    "@types/react": "~18.3.12",
    "typescript": "~5.3.3"
  }
}
EOF

# 创建前端 tsconfig.json
cat > client/tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
EOF

echo "✅ 项目文件创建完成"
echo ""
echo "下一步："
echo "  cd /var/www/gopen/server && pnpm install && pnpm build"
echo "  cd /var/www/gopen/client && pnpm install && npx expo export --platform web"
echo "  pm2 start /var/www/gopen/ecosystem.config.js"

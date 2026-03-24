#!/bin/bash
###############################################################
#                                                             #
#  G Open 一键完整部署脚本                                    #
#                                                             #
#  使用方法：在宝塔面板终端粘贴此脚本全部内容执行              #
#                                                             #
###############################################################

set -e
clear

SERVER_IP="114.55.115.39"
DOMAIN="woshiguotao.cn"
PROJECT_DIR="/var/www/gopen"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           G Open 一键完整部署                             ║"
echo "║                                                           ║"
echo "║  服务器: ${SERVER_IP}                                     ║"
echo "║  域名: ${DOMAIN}                                          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
read -p "按 Enter 开始部署..." dummy

# ==================== 步骤 1: 创建目录结构 ====================
echo "[1/8] 创建目录结构..."
mkdir -p ${PROJECT_DIR}/server/src
mkdir -p ${PROJECT_DIR}/client/app
mkdir -p ${PROJECT_DIR}/client/screens/admin/components
mkdir -p ${PROJECT_DIR}/client/components
mkdir -p ${PROJECT_DIR}/client/constants
mkdir -p ${PROJECT_DIR}/client/hooks
mkdir -p ${PROJECT_DIR}/client/utils
mkdir -p ${PROJECT_DIR}/client/dist
mkdir -p /var/log/gopen

# ==================== 步骤 2: 创建后端 package.json ====================
echo "[2/8] 创建后端配置..."
cat > ${PROJECT_DIR}/server/package.json << 'EOF'
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
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
EOF

cat > ${PROJECT_DIR}/server/tsconfig.json << 'EOF'
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
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ==================== 步骤 3: 创建后端源码 ====================
echo "[3/8] 创建后端源码..."
cat > ${PROJECT_DIR}/server/src/index.ts << 'MAINCODE'
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 9091;
const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';

app.use(cors());
app.use(express.json());

// ==================== 健康检查 ====================
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ==================== 管理员验证 ====================
app.get('/api/v1/admin/verify', (req: Request, res: Response) => {
  const key = req.query.key as string;
  res.json({ success: key === ADMIN_KEY });
});

// ==================== 统计数据 ====================
interface StatsData {
  totalUsers: number;
  memberUsers: number;
  superMemberUsers: number;
  normalMemberUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  todayOrders: number;
  todayAmount: number;
  todayAlipayAmount: number;
  todayWechatAmount: number;
  monthOrders: number;
  monthRevenue: number;
  pendingOrders: number;
  timeoutPendingCount: number;
  totalRevenue: number;
  totalAlipayRevenue: number;
  totalWechatRevenue: number;
  totalPaidCount: number;
  paymentAccounts: {
    alipay: { name: string; account: string; realName: string };
    wechat: { name: string; account: string; realName: string };
  };
  recentOrders: any[];
}

const paymentAccounts = {
  alipay: { name: '支付宝收款', account: '18321337942', realName: 'G Open官方' },
  wechat: { name: '微信收款', account: 'G Open官方', realName: 'G Open官方' }
};

// 模拟数据库数据
let mockStats: StatsData = {
  totalUsers: 5,
  memberUsers: 1,
  superMemberUsers: 0,
  normalMemberUsers: 1,
  newUsersToday: 0,
  newUsersMonth: 5,
  todayOrders: 0,
  todayAmount: 0,
  todayAlipayAmount: 0,
  todayWechatAmount: 0,
  monthOrders: 0,
  monthRevenue: 0,
  pendingOrders: 0,
  timeoutPendingCount: 0,
  totalRevenue: 0,
  totalAlipayRevenue: 0,
  totalWechatRevenue: 0,
  totalPaidCount: 0,
  paymentAccounts,
  recentOrders: []
};

let mockOrders: any[] = [];
let mockUsers: any[] = [];
let mockLogs: any[] = [];

app.get('/api/v1/admin/stats', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  res.json({ success: true, data: mockStats });
});

// ==================== 订单管理 ====================
app.get('/api/v1/admin/orders', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  
  const status = req.query.status as string;
  let orders = mockOrders;
  
  if (status && status !== 'all') {
    if (status === 'pending') {
      orders = orders.filter(o => o.status === 'confirming');
    } else {
      orders = orders.filter(o => o.status === status);
    }
  }
  
  const ordersWithAccount = orders.map(order => ({
    ...order,
    paymentAccount: paymentAccounts[order.pay_type as keyof typeof paymentAccounts]
  }));
  
  res.json({ success: true, data: ordersWithAccount });
});

// ==================== 用户管理 ====================
app.get('/api/v1/admin/users', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  res.json({ success: true, data: mockUsers });
});

// ==================== 收入图表 ====================
app.get('/api/v1/admin/revenue-chart', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  const daily = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    daily.push({
      label: `周${labels[date.getDay()]}`,
      amount: Math.floor(Math.random() * 100)
    });
  }
  
  res.json({ success: true, data: { daily, maxAmount: 100 } });
});

// ==================== 操作日志 ====================
app.get('/api/v1/admin/logs', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  res.json({ success: true, data: mockLogs });
});

// ==================== 支付账户 ====================
app.get('/api/v1/payment/accounts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      alipay: {
        name: '支付宝收款',
        account: '18321337942',
        qrcodeUrl: '',
        realName: 'G Open官方',
        desc: '请使用支付宝扫码支付'
      },
      wechat: {
        name: '微信收款',
        account: '',
        qrcodeUrl: '',
        realName: 'G Open官方',
        desc: '请使用微信扫码支付'
      }
    }
  });
});

// ==================== 创建订单 ====================
app.post('/api/v1/payment/create', (req: Request, res: Response) => {
  const { userId, amount, payType, productType } = req.body;
  const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  res.json({
    success: true,
    data: {
      orderId: Date.now().toString(),
      orderNo,
      amount,
      payType,
      productType,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      paymentAccount: paymentAccounts[payType as keyof typeof paymentAccounts]
    }
  });
});

// ==================== 用户确认支付 ====================
app.post('/api/v1/payment/confirm', (req: Request, res: Response) => {
  const { userId, amount, payType, productType, transactionId, remark } = req.body;
  const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const newOrder = {
    id: Date.now().toString(),
    order_no: orderNo,
    user_id: userId,
    amount,
    pay_type: payType,
    product_type: productType,
    status: 'confirming',
    transaction_id: transactionId,
    user_remark: remark,
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString()
  };
  
  mockOrders.push(newOrder);
  mockStats.pendingOrders = mockOrders.filter(o => o.status === 'confirming').length;
  
  res.json({
    success: true,
    message: '已提交支付确认，请等待管理员审核',
    data: { orderNo, status: 'confirming' }
  });
});

// ==================== 管理员审核 ====================
app.post('/api/v1/payment/admin/verify', (req: Request, res: Response) => {
  const { orderNo, adminKey, action, reason } = req.body;
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  
  const orderIndex = mockOrders.findIndex(o => o.order_no === orderNo);
  if (orderIndex === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (action === 'approve') {
    mockOrders[orderIndex].status = 'paid';
    mockOrders[orderIndex].paid_at = new Date().toISOString();
    mockStats.pendingOrders = mockOrders.filter(o => o.status === 'confirming').length;
    mockStats.totalPaidCount = mockOrders.filter(o => o.status === 'paid').length;
    mockStats.totalRevenue = mockOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0);
    
    mockLogs.unshift({
      id: Date.now().toString(),
      action: 'approve',
      target: orderNo,
      operator: 'admin',
      details: `订单审核通过，金额: ¥${(mockOrders[orderIndex].amount / 100).toFixed(2)}`,
      created_at: new Date().toISOString()
    });
    
    res.json({ success: true, message: '支付已确认' });
  } else {
    mockOrders[orderIndex].status = 'rejected';
    mockOrders[orderIndex].admin_remark = reason;
    mockStats.pendingOrders = mockOrders.filter(o => o.status === 'confirming').length;
    
    res.json({ success: true, message: '支付已拒绝' });
  }
});

// ==================== 获取待审核订单 ====================
app.get('/api/v1/payment/admin/pending', (req: Request, res: Response) => {
  const adminKey = req.query.adminKey as string;
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  
  const pendingOrders = mockOrders.filter(o => o.status === 'confirming');
  res.json({ success: true, data: pendingOrders, autoApproved: 0 });
});

// ==================== 订单状态查询 ====================
app.get('/api/v1/payment/status/:orderNo', (req: Request, res: Response) => {
  const order = mockOrders.find(o => o.order_no === req.params.orderNo);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json({ success: true, data: order });
});

// ==================== 启动服务器 ====================
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║           G Open Server Started                           ║');
  console.log('║                                                           ║');
  console.log('║  API: http://localhost:' + PORT + '                          ║');
  console.log('║  Health: http://localhost:' + PORT + '/api/v1/health         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
});
MAINCODE

# ==================== 步骤 4: 创建环境变量 ====================
echo "[4/8] 创建环境变量..."
cat > ${PROJECT_DIR}/server/.env << EOF
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
EOF

# ==================== 步骤 5: 创建 PM2 配置 ====================
echo "[5/8] 创建 PM2 配置..."
cat > ${PROJECT_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gopen-server',
    cwd: '/var/www/gopen/server',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 9091
    },
    error_file: '/var/log/gopen/error.log',
    out_file: '/var/log/gopen/out.log',
    time: true
  }]
};
EOF

# ==================== 步骤 6: 创建前端静态页面 ====================
echo "[6/8] 创建前端页面..."
mkdir -p ${PROJECT_DIR}/client/dist

cat > ${PROJECT_DIR}/client/dist/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>G Open - AI创作助手</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      min-height: 100vh;
      color: #fff;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 60px 0;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
      font-weight: bold;
    }
    h1 { font-size: 48px; margin-bottom: 16px; background: linear-gradient(90deg, #4f46e5, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { font-size: 20px; color: #94a3b8; margin-bottom: 40px; }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 40px;
    }
    .feature {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.3s, border-color 0.3s;
    }
    .feature:hover { transform: translateY(-4px); border-color: #4f46e5; }
    .feature-icon { width: 48px; height: 48px; background: rgba(79,70,229,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; }
    .feature h3 { font-size: 18px; margin-bottom: 8px; }
    .feature p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      color: #fff;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin: 8px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(79,70,229,0.3); }
    .btn-outline { background: transparent; border: 2px solid #4f46e5; }
    .footer { text-align: center; padding: 40px 0; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">G</div>
      <h1>G Open</h1>
      <p class="subtitle">暗黑科技风 AI 创作助手</p>
      <div>
        <a href="/admin?key=gopen_admin_2024" class="btn">管理后台</a>
        <a href="https://woshiguotao.cn" class="btn btn-outline">了解更多</a>
      </div>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎮</div>
        <h3>游戏内容创作</h3>
        <p>AI驱动的游戏角色、剧情、对话生成，让创意无限延伸</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🎬</div>
        <h3>动漫内容生成</h3>
        <p>智能生成动漫角色设定、故事脚本、场景描述</p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <h3>GPU算力租赁</h3>
        <p>高性能GPU资源按需租用，满足AI训练和渲染需求</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <h3>模型市场</h3>
        <p>丰富的AI模型库，一键部署，即开即用</p>
      </div>
      <div class="feature">
        <div class="feature-icon">☁️</div>
        <h3>云端存储</h3>
        <p>支持百度网盘、阿里云盘、Google Drive等主流云存储</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💎</div>
        <h3>会员特权</h3>
        <p>普通会员¥29/月，超级会员¥99/月，解锁全部功能</p>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 G Open. All rights reserved. | 域名: woshiguotao.cn</p>
    </div>
  </div>
</body>
</html>
HTMLEOF

# ==================== 步骤 7: 安装依赖并构建 ====================
echo "[7/8] 安装依赖并构建..."
cd ${PROJECT_DIR}/server
pnpm install
pnpm build

# ==================== 步骤 8: 启动服务 ====================
echo "[8/8] 启动服务..."
pm2 delete gopen-server 2>/dev/null || true
pm2 start ${PROJECT_DIR}/ecosystem.config.js
pm2 save

# 创建快捷命令
cat > /usr/local/bin/gopen << 'CLIEOF'
#!/bin/bash
case "$1" in
    start) pm2 start /var/www/gopen/ecosystem.config.js ;;
    stop) pm2 stop gopen-server ;;
    restart) pm2 restart gopen-server ;;
    logs) pm2 logs gopen-server ;;
    status) pm2 status ;;
    *) echo "用法: gopen {start|stop|restart|logs|status}" ;;
esac
CLIEOF
chmod +x /usr/local/bin/gopen

# ==================== 完成 ====================
clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              ✅ 部署完成！                                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 访问地址："
echo ""
echo "  应用首页:    http://${SERVER_IP}"
echo "  域名访问:    http://${DOMAIN}"
echo "  健康检查:    http://${SERVER_IP}/api/v1/health"
echo "  管理后台:    http://${SERVER_IP}/admin?key=gopen_admin_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 快捷命令："
echo ""
echo "  gopen status   - 查看状态"
echo "  gopen logs     - 查看日志"
echo "  gopen restart  - 重启服务"
echo "  gopen stop     - 停止服务"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 DNS 解析设置："
echo ""
echo "  在域名服务商添加以下记录："
echo "  A 记录 @ → ${SERVER_IP}"
echo "  A 记录 www → ${SERVER_IP}"
echo ""

# 万古长夜 - 本地部署指南

## 系统要求

| 要求 | 说明 |
|------|------|
| 操作系统 | Windows 10/11, macOS, Linux |
| Node.js | 18.0 或更高版本 |
| 内存 | 至少 2GB |
| 磁盘 | 至少 500MB |

## 快速开始

### 第一步：安装 Node.js

**Windows:**
1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 20.x）
3. 运行安装程序

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 第二步：验证安装

打开终端（命令行），输入：
```bash
node -v    # 应显示 v18.x 或更高
npm -v     # 应显示版本号
```

### 第三步：安装依赖

```bash
cd server
npm install
```

> 注意：如果 `npm install` 失败，可以尝试使用 `npm install --legacy-peer-deps`

### 第四步：启动服务器

```bash
npm run dev
```

看到以下输出表示启动成功：
```
========================================
   万古长夜 - 独立服务器
========================================
数据库: SQLite (本地文件)
端口: 18789
依赖: 无第三方服务依赖
========================================

✅ 服务器已启动: http://localhost:18789
```

### 第五步：测试访问

打开浏览器，访问：
```
http://localhost:18789/api/v1/health
```

应看到：
```json
{"status":"ok","timestamp":"...","database":"SQLite","version":"1.0.0-independent"}
```

## 端口配置

默认端口为 `18789`，如需修改：

**方法一：修改 .env 文件**
```
PORT=你的端口
```

**方法二：启动时指定**
```bash
PORT=8080 npm run dev
```

## 数据存储

- 数据库文件位置：`server/data/wangu.db`
- 定期备份此文件可防止数据丢失

### 备份方法

**手动备份：**
```bash
# 创建备份目录
mkdir -p backups

# 复制数据库文件
cp server/data/wangu.db backups/wangu_$(date +%Y%m%d_%H%M%S).db
```

**自动备份脚本 (backup.sh)：**
```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATA_FILE="./server/data/wangu.db"
mkdir -p $BACKUP_DIR
cp $DATA_FILE "$BACKUP_DIR/wangu_$(date +%Y%m%d_%H%M%S).db"
# 保留最近10个备份
ls -t $BACKUP_DIR/*.db | tail -n +11 | xargs rm -f 2>/dev/null
echo "备份完成: $(date)"
```

## API 接口

### 健康检查
```
GET http://localhost:18789/api/v1/health
```

### OAuth 登录
```
POST http://localhost:18789/api/v1/oauth/callback
Content-Type: application/json

{
  "platform": "github",
  "code": "授权码"
}
```

支持的平台：
- `wechat` - 微信
- `alipay` - 支付宝
- `github` - GitHub
- `google` - Google
- `apple` - Apple

### 获取用户余额
```
GET http://localhost:18789/api/v1/user/balance/{用户ID}
```

### 获取收款账户
```
GET http://localhost:18789/api/v1/payment/accounts
```

### 提交充值申请
```
POST http://localhost:18789/api/v1/recharge/submit
Content-Type: application/json

{
  "userId": "用户ID",
  "amount": 10000,
  "rechargeType": "balance",
  "payMethod": "alipay",
  "transactionId": "交易流水号"
}
```

### 管理员接口

所有管理员接口需要添加请求头：
```
x-admin-key: WanguAdmin2024SecretKey
```

**获取待审核充值：**
```
GET http://localhost:18789/api/v1/recharge/admin/pending
x-admin-key: WanguAdmin2024SecretKey
```

**审核通过：**
```
POST http://localhost:18789/api/v1/recharge/admin/approve
x-admin-key: WanguAdmin2024SecretKey
Content-Type: application/json

{
  "recordId": "充值记录ID"
}
```

## 常见问题

### Q: 端口被占用怎么办？
```bash
# 查找占用进程
# Windows
netstat -ano | findstr :18789

# macOS/Linux
lsof -i :18789

# 终止进程或更换端口
PORT=8080 npm run dev
```

### Q: 数据库损坏怎么恢复？
```bash
# 从备份恢复
cp backups/wangu_20240101_120000.db server/data/wangu.db
```

### Q: 如何修改管理员密钥？
编辑 `server/.env` 文件：
```
ADMIN_SECRET_KEY=你的新密钥
```

### Q: 如何查看日志？
日志直接输出到终端，可以重定向到文件：
```bash
npm run dev > logs.txt 2>&1
```

## 生产环境部署

### 使用 PM2 守护进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "wangu-server" -- run dev

# 开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs wangu-server
```

### 防火墙配置

如果需要局域网访问：

```bash
# Windows (管理员PowerShell)
netsh advfirewall firewall add rule name="万古长夜" dir=in action=allow protocol=tcp localport=18789

# Linux
sudo ufw allow 18789/tcp
```

然后将 `127.0.0.1` 改为 `0.0.0.0` 或本机IP地址。

---

如有问题，请检查：
1. Node.js 版本是否正确
2. 端口是否被占用
3. 数据库目录是否有写入权限

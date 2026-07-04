# 万古长夜 - 国风粒子卡牌游戏平台

独立运行的游戏平台，与 Gopen 完全分离。

## 项目结构

```
wangu-game/
├── client/                 # Expo React Native 前端
│   ├── app/               # 路由文件
│   ├── screens/           # 页面组件
│   ├── components/        # 公共组件
│   ├── constants/         # 常量配置
│   ├── hooks/             # 自定义 Hooks
│   └── assets/            # 静态资源
├── server/                 # Express 后端
│   └── src/
│       └── index.ts       # 服务入口
└── scripts/               # 部署脚本
```

## 快速启动

### 开发模式

```bash
# 1. 安装依赖
cd client && npm install
cd ../server && npm install

# 2. 启动后端 (端口 6091)
cd server && npm run dev

# 3. 启动前端 (端口 6001)
cd client && npm run web:port
```

### 一键启动

```bash
./scripts/start.sh
```

## 功能模块

### 🏠 首页
- 五大阵营选择（幽冥、昆仑、蓬莱、蛮荒、万古）
- 玩家信息展示
- 快捷入口导航

### 🃏 卡牌系统
- 卡牌收藏
- 抽卡系统
- 卡组构建

### ⚔️ 对战系统
- 实时匹配对战
- 回合制卡牌战斗
- 胜负记录

### ☁️ 云游戏
- 无需下载，即时畅玩
- 低延迟流式传输
- 多画质支持

### 💰 充值系统
- 0.05折优惠充值
- 新用户送10000代金券
- 多档位套餐

### 📦 下载中心
- Android APK
- iOS App Store
- Windows 客户端
- macOS 客户端

## 技术栈

- **前端**: Expo 55 + React Native 0.83
- **后端**: Express.js + TypeScript
- **数据库**: PostgreSQL (生产环境)
- **云游戏**: WebRTC

## 部署

### 阿里云
```bash
./scripts/deploy.sh aliyun
```

### 腾讯云
```bash
./scripts/deploy.sh tencent
```

### Docker
```bash
docker-compose up -d
```

## 访问地址

- 前端: http://localhost:6001
- 后端API: http://localhost:6091/api/v1

---

© 2024 万古长夜 · All Rights Reserved

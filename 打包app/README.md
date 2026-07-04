# 万古长夜 - 3D粒子卡牌游戏

## 项目概述

万古长夜是一款国风3D粒子卡牌游戏，支持2K粒子实时渲染，包含五大阵营的卡牌收集与对战系统。

## 核心特性

### 🎨 2K粒子渲染引擎
- **2048粒子实时渲染**
- **3D透视效果**
- **阵营专属粒子特效**

### 🃏 3D卡牌系统
- **透视变换** - 卡牌支持3D旋转交互
- **阵营皮肤** - 五大阵营专属卡牌风格
- **稀有度系统** - 凡品、灵品、仙品、圣品、万古品

### ⚔️ 五大阵营
| 阵营 | 颜色 | 特点 |
|------|------|------|
| 幽冥 | 紫色 | 魂火水墨 |
| 昆仑 | 青色 | 流云剑气 |
| 蓬莱 | 粉色 | 花瓣云雾 |
| 蛮荒 | 橙色 | 火焰星尘 |
| 万古 | 金色 | 星尘光点 |

## 技术栈

- **前端**: Expo 55 + React Native + Three.js
- **后端**: Express.js (端口 6091)
- **渲染**: Canvas WebGL + 2K粒子系统

## 快速启动

```bash
# 1. 安装依赖
cd client && npm install --legacy-peer-deps
cd ../server && npm install

# 2. 启动后端
cd server && npm run dev

# 3. 启动前端
cd client && npm run web:port
```

## 项目结构

```
打包app/
├── client/                 # Expo React Native 前端
│   ├── app/               # 路由文件
│   ├── screens/           # 页面组件
│   ├── components/        # 公共组件
│   │   ├── Particle3DEngine.tsx   # 2K粒子引擎
│   │   ├── Card3D.tsx             # 3D卡牌组件
│   │   └── ...
│   ├── constants/         # 常量配置
│   └── hooks/             # 自定义 Hooks
├── server/                 # Express 后端
│   └── src/index.ts       # 服务入口
└── scripts/               # 部署脚本
```

## API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/health` | GET | 健康检查 |
| `/api/v1/cards` | GET | 获取卡牌列表 |
| `/api/v1/cards/:id` | GET | 获取单张卡牌 |

---

© 2024 万古长夜 · 3D粒子卡牌游戏

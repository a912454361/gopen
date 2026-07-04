# G open 智能创作助手 - Windows 版本打包说明

## 项目信息
- **名称**: G open 智能创作助手
- **版本**: 1.0.0
- **技术栈**: Expo 54 + React Native + Express.js

## 打包内容
本压缩包包含完整的源代码，可在Windows环境下运行。

## Windows 环境运行步骤

### 1. 环境要求
- Node.js >= 20.x
- pnpm >= 9.x
- Git

### 2. 安装依赖
```bash
# 安装 pnpm（如果没有）
npm install -g pnpm

# 进入项目目录
cd gopen-windows

# 安装依赖
pnpm install

# 分别安装前后端依赖
cd client && pnpm install
cd ../server && pnpm install
```

### 3. 配置环境变量
创建 `server/.env` 文件：
```env
# 数据库配置（Supabase）
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 管理员密钥
ADMIN_KEY=GtAdmin2024SecretKey8888

# 其他配置
PORT=9091
NODE_ENV=development
```

### 4. 启动服务
```bash
# 方式一：使用启动脚本
bash .cozeproj/scripts/dev_run.sh

# 方式二：分别启动
# 终端1 - 启动后端
cd server && pnpm run dev

# 终端2 - 启动前端
cd client && pnpm run start
```

### 5. 访问应用
- Web版本: http://localhost:5000
- 后端API: http://localhost:9091

## 项目结构
```
gopen-windows/
├── client/                 # Expo 前端（React Native）
│   ├── app/               # 路由配置
│   ├── screens/           # 页面组件
│   ├── components/        # 公共组件
│   ├── hooks/             # 自定义Hooks
│   └── ...
├── server/                 # Express 后端
│   ├── src/               # 源代码
│   │   ├── routes/        # API路由
│   │   ├── managers/      # 业务逻辑
│   │   └── index.ts       # 入口文件
│   └── ...
├── assets/                 # 静态资源
└── .cozeproj/             # 启动脚本
```

## 核心功能
- AI辅助创作（游戏/动漫）
- 80集《剑破苍穹》动漫制作系统
- 会员系统与支付
- OAuth登录
- 视频生成与管理

## 注意事项
1. 首次运行需要配置数据库连接
2. 确保端口 5000 和 9091 未被占用
3. 如遇问题，检查环境变量配置

## 技术支持
- Expo文档: https://docs.expo.dev
- React Native文档: https://reactnative.dev

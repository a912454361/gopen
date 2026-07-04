# 万古长夜游戏平台 - Docker 镜像构建
# 多阶段构建，优化镜像大小

# 阶段1: 依赖安装
FROM node:20-alpine AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 阶段2: 构建
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV EXPO_PUBLIC_BACKEND_BASE_URL=https://api.wangu.game.com

# 构建 Web 版本
RUN npx expo export --platform web

# 阶段3: 运行
FROM node:20-alpine AS runner
WORKDIR /app

# 安装 serve 用于静态文件服务
RUN npm install -g serve

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 5001

# 启动命令
CMD ["serve", "-s", "dist", "-l", "5001"]

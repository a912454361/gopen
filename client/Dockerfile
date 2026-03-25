# ============================================
# G open 前端服务 Dockerfile
# ============================================

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm 和 Expo CLI
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 Web 版本
RUN npx expo export --platform web

# 暴露端口
EXPOSE 5000

# 启动服务
CMD ["npx", "serve", "-s", "dist", "-l", "5000"]

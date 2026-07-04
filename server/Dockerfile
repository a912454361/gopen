# ============================================
# G open 后端服务 Dockerfile
# ============================================

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript
RUN pnpm run build

# 暴露端口
EXPOSE 9091

# 启动服务
CMD ["node", "dist/index.js"]

# G Open - 快速部署指南

## 🚀 一键部署（推荐）

### 第一步：解除宝塔 IP 限制

1. 登录阿里云控制台 → ECS 实例 → 远程连接
2. 选择 Workbench 或 VNC
3. 执行命令：
   ```bash
   bt 13
   ```
4. 输入 `y` 确认

---

### 第二步：执行一键部署

复制粘贴以下命令：

```bash
cd /workspace/projects && chmod +x deploy.sh && ./deploy.sh
```

---

## 📋 部署后配置

### 1. 配置环境变量

编辑 `server/.env` 文件，填入真实的 Supabase 和集成配置：

```bash
nano /workspace/projects/server/.env
```

### 2. 配置 DNS 解析

在域名服务商处，将 `woshiguotao.cn` 解析到 `114.55.115.39`

### 3. 申请 SSL 证书

使用宝塔面板或 Let's Encrypt

---

## 🔧 常用命令

| 操作 | 命令 |
|------|------|
| 查看后端日志 | `pm2 logs gopen-server` |
| 重启后端 | `pm2 restart gopen-server` |
| 停止后端 | `pm2 stop gopen-server` |
| 重启 Nginx | `systemctl restart nginx` |
| 检查服务状态 | `pm2 list` |

---

## 📞 技术支持

如遇问题，查看日志：
```bash
pm2 logs gopen-server --lines 100
```


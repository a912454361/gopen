# 🔐 Gopen - Go 登录系统

基于 Go + Gin 的现代化登录系统，支持 JWT 认证、OAuth 第三方登录和密码加密存储。

## ✨ 功能特性

- ✅ 用户注册/登录
- ✅ JWT Token 认证
- ✅ 密码 bcrypt 加密
- ✅ GitHub OAuth 登录
- ✅ Google OAuth 登录
- ✅ 用户资料管理
- ✅ 响应式前端界面
- ✅ 环境变量配置（安全存储密钥）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/a912454361/gopen.git
cd gopen
```

### 2. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，填入你的配置
nano .env
```

### 3. 安装依赖

```bash
go mod download
```

### 4. 运行项目

```bash
go run cmd/main.go
```

访问 http://localhost:8080

## ⚙️ 配置说明

### 基本配置 (.env)

```env
# 服务器配置
SERVER_PORT=8080

# JWT配置（重要：生产环境请修改为随机强密码）
JWT_SECRET=your-super-secret-jwt-key

# 数据库（SQLite用于开发）
DB_TYPE=sqlite
DB_PATH=./data/gopen.db
```

### OAuth 配置

#### GitHub OAuth

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: Gopen
   - Homepage URL: http://localhost:8080
   - Authorization callback URL: http://localhost:8080/auth/callback/github
4. 获取 Client ID 和 Client Secret
5. 填入 .env 文件

#### Google OAuth

1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID
3. 配置回调地址: http://localhost:8080/auth/callback/google
4. 获取 Client ID 和 Client Secret
5. 填入 .env 文件

## 📁 项目结构

```
gopen/
├── cmd/
│   └── main.go              # 程序入口
├── internal/
│   ├── auth/                # 认证服务
│   │   └── service.go       # JWT/OAuth逻辑
│   ├── database/            # 数据库
│   │   └── database.go      # 数据库连接
│   ├── handlers/            # HTTP处理器
│   │   ├── auth.go          # 认证相关API
│   │   └── user.go          # 用户相关API
│   ├── middleware/          # 中间件
│   │   └── auth.go          # JWT验证中间件
│   └── models/              # 数据模型
│       └── user.go          # 用户模型
├── web/
│   ├── static/              # 静态文件
│   └── templates/           # HTML模板
│       ├── index.html       # 首页
│       ├── login.html       # 登录页
│       ├── register.html    # 注册页
│       └── dashboard.html   # 控制面板
├── .env.example             # 环境变量示例
├── .gitignore               # Git忽略文件
├── go.mod                   # Go模块
└── README.md                # 说明文档
```

## 🔒 安全特性

1. **密码加密**: 使用 bcrypt 算法加密存储
2. **JWT认证**: 无状态认证，支持Token刷新
3. **CSRF防护**: OAuth state参数验证
4. **环境隔离**: 敏感信息通过环境变量管理，不提交到代码仓库

## 🛡️ 安全最佳实践

⚠️ **重要提醒**:

1. **永远不要提交 .env 文件到Git** - 已添加到 .gitignore
2. **生产环境修改 JWT_SECRET** - 使用随机生成的强密码
3. **定期更换 OAuth 密钥** - 尤其是发现泄露时
4. **使用 HTTPS** - 生产环境务必启用HTTPS
5. **设置强密码策略** - 建议最小8位，包含大小写和特殊字符

## 📡 API 文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新Token |
| POST | /api/auth/logout | 退出登录 |
| GET | /api/auth/github | GitHub OAuth |
| GET | /api/auth/google | Google OAuth |
| GET | /api/auth/callback/:provider | OAuth回调 |

### 用户接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/user/profile | 获取用户资料 |
| PUT | /api/user/profile | 更新用户资料 |

### 请求示例

```bash
# 注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'

# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_email":"test","password":"123456"}'

# 获取用户资料 (需要Token)
curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 技术栈

- **后端**: Go 1.21 + Gin
- **数据库**: SQLite (GORM)
- **认证**: JWT + OAuth2
- **密码加密**: bcrypt
- **前端**: HTML5 + CSS3 + Vanilla JS

## 📄 许可证

MIT License

---

🔒 **记住**: 安全是第一位的，永远不要将敏感信息提交到代码仓库！
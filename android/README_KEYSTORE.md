# G Open Android Keystore 签名证书说明

## 📌 重要提示

**请妥善保管本目录下的 keystore 文件！丢失后将无法更新应用！**

---

## 🔑 签名证书信息

### 1. 发布版证书 (Release)
| 项目 | 值 |
|------|------|
| 文件名 | `app/gopen.keystore` |
| 别名 (Alias) | `gopen` |
| 密码 | `gopen2024` |
| SHA1 | `9D:B9:F0:D6:C6:57:4F:05:6B:06:F8:B9:D4:D4:EF:EE:DD:7A:0E:AF` |
| SHA256 | `A0:AA:31:6A:9D:0F:44:56:89:78:C3:E5:AE:B5:00:DC:8D:B0:16:90:3A:2F:F0:8E:45:01:1C:E4:33:43:CD:DB` |

### 2. 调试版证书 (Debug)
| 项目 | 值 |
|------|------|
| 文件名 | `app/debug.keystore` |
| 别名 (Alias) | `androiddebugkey` |
| 密码 | `android` |
| SHA1 | `12:51:EB:AD:FB:14:60:A5:8B:BC:01:CB:83:5E:DB:69:C7:57:D1:86` |
| SHA256 | `46:B9:33:F8:1F:C8:F0:65:B5:D9:D9:03:9A:59:E3:11:B6:08:08:58:3C:38:9A:0C:5C:F0:A7:1D:36:70:EB:85` |

---

## 📱 各平台配置指南

### 微信开放平台
1. 登录 [微信开放平台](https://open.weixin.qq.com/)
2. 进入管理中心 → 移动应用
3. 开发信息 → Android 应用签名
4. 填入 **发布版 SHA1**（去掉冒号，32位小写）
   ```
   9db9f0d6c6574f056b06f8b9d4d4efeedd7a0eaf
   ```

### 支付宝开放平台
1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 创建应用 → 移动应用
3. 开发配置 → Android 签名
4. 填入 **发布版 SHA1**（格式：`XX:XX:XX:XX:XX`）

### 华为开发者联盟
1. 登录 [华为开发者联盟](https://developer.huawei.com/)
2. AppGallery Connect → 项目设置
3. SHA256 证书指纹
4. 填入 **发布版 SHA256**（去掉冒号）
   ```
   A0AA316A9D0F44568978C3E5AEB500DC8DB016903A2FF08E45011CE43343CDDB
   ```

### 小米开放平台
1. 登录 [小米开放平台](https://dev.mi.com/)
2. 应用服务 → 移动应用
3. 签名证书 SHA1
4. 填入 **发布版 SHA1**

### OPPO 开放者平台
1. 登录 [OPPO 开发者平台](https://open.oppomobile.com/)
2. 应用服务 → 应用管理
3. 签名证书 SHA1
4. 填入 **发布版 SHA1**

### vivo 开发者平台
1. 登录 [vivo 开发者平台](https://dev.vivo.com.cn/)
2. 应用服务 → 应用管理
3. 签名证书 SHA1
4. 填入 **发布版 SHA1**

---

## 🔧 EAS Build 配置

在 `app.config.ts` 中添加：

```typescript
import { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => {
  return {
    ...config,
    android: {
      ...config.android,
      package: 'com.gopen.app',
    },
    extra: {
      eas: {
        projectId: 'your-project-id',
      },
    },
  };
};
```

创建 `eas.json`：

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🚀 构建命令

### 使用 EAS Build
```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账户
eas login

# 配置项目
eas build:configure

# 构建 APK（测试）
eas build --platform android --profile preview

# 构建 AAB（上架）
eas build --platform android --profile production
```

### 本地构建（需要 Android Studio）
```bash
cd android
./gradlew assembleRelease
```

---

## ⚠️ 安全注意事项

1. **备份 keystore 文件**
   - 将 `gopen.keystore` 备份到多个安全位置
   - 推荐使用加密云存储或密码管理器

2. **密码安全**
   - 生产环境建议使用更强的密码
   - 不要将密码提交到 Git 仓库

3. **证书更新**
   - 如果 keystore 丢失或泄露，需要重新签名
   - 新签名意味着新应用，用户需要卸载重装
   - 所有平台（微信、支付宝等）需要重新配置

---

## 📋 SHA1 格式转换

### 带冒号格式（用于大部分平台）
```
9D:B9:F0:D6:C6:57:4F:05:6B:06:F8:B9:D4:D4:EF:EE:DD:7A:0E:AF
```

### 不带冒号小写（用于微信等）
```
9db9f0d6c6574f056b06f8b9d4d4efeedd7a0eaf
```

### 不带冒号大写（用于华为等）
```
9DB9F0D6C6574F056B06F8B9D4D4EFEEDD7A0EAF
```

---

生成时间：2025-03-21

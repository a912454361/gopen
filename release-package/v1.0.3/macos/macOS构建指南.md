# G open macOS 构建指南

## 版本信息
- 版本号: v1.0.3
- Bundle ID: com.gopen.app
- 最低版本: macOS 10.15 (Catalina)

## 构建要求

### 硬件要求
- Mac 电脑（Intel 或 Apple Silicon）
- 至少 8GB 内存
- 至少 20GB 可用空间

### 软件要求
- macOS 12.0+
- Xcode 14.0+
- Node.js 18+
- pnpm 8+

## 构建方式

### 方式一：本地构建

```bash
# 1. 解压源码包
tar -xzvf gopen-macos-v1.0.3.tar.gz
cd gopen-macos

# 2. 安装依赖
cd client
pnpm install

# 3. 生成原生项目
npx expo prebuild --platform macos

# 4. 安装 macOS 依赖
cd macos
pod install

# 5. 打开 Xcode
open GOpen.xcworkspace

# 6. 在 Xcode 中构建
# Product -> Archive -> Distribute App
```

### 方式二：EAS 云端构建

```bash
# 构建 macOS 应用
eas build --platform macos --profile production
```

## 签名配置

### 开发者签名
```bash
# 检查签名身份
security find-identity -v -p codesigning

# 对应用签名
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (XXXXXXXXXX)" \
  --options runtime \
  GOpen.app
```

### 公证（上架必需）
```bash
# 创建 DMG
hdiutil create -volname "G open" \
  -srcfolder GOpen.app \
  -ov -format UDZO \
  GOpen.dmg

# 提交公证
xcrun notarytool submit GOpen.dmg \
  --apple-id your@email.com \
  --password app-specific-password \
  --team-id XXXXXXXXXX \
  --wait

# 公证通过后 Staple
xcrun stapler staple GOpen.dmg
```

## 分发方式

### 方式一：DMG 安装包
```bash
# 创建 DMG
hdiutil create -volname "G open" \
  -srcfolder GOpen.app \
  -ov -format UDZO \
  GOpen.dmg
```

### 方式二：Mac App Store
```bash
# 构建
eas build --platform macos --profile production

# 提交
eas submit --platform macos
```

### 方式三：直接分发
- 上传到官网下载
- 上传到 GitHub Releases

## 权限说明

应用可能需要以下权限：
- 网络访问
- 文件读写
- 相机（可选）
- 麦克风（可选）

## 问题排查

### 签名被拒绝
```bash
# 检查证书是否有效
security find-identity -v -p codesigning

# 重新签名
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  GOpen.app
```

### 运行时崩溃
```bash
# 检查日志
log show --predicate 'process == "GOpen"' --last 5m
```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues

/**
 * 万古长夜游戏平台 - 多平台部署配置
 * 支持：阿里云、腾讯云、Coze Cloud
 */

export interface DeploymentConfig {
  name: string;
  platform: 'aliyun' | 'tencent' | 'coze';
  domains: {
    web: string;
    api: string;
    cdn: string;
  };
  ports: {
    web: number;
    api: number;
    proxy: number;
  };
  ssl: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
  };
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
  };
  storage: {
    type: 'oss' | 'cos' | 's3';
    bucket: string;
    region: string;
  };
  database: {
    type: 'postgresql' | 'mysql';
    host: string;
    port: number;
    name: string;
  };
  features: {
    cloudGaming: boolean;
    pushNotifications: boolean;
    analytics: boolean;
    cdn: boolean;
  };
}

// 阿里云配置
export const aliyunConfig: DeploymentConfig = {
  name: '万古长夜-阿里云',
  platform: 'aliyun',
  domains: {
    web: 'wangu.aliyun.game.com',
    api: 'api.wangu.aliyun.game.com',
    cdn: 'cdn.wangu.aliyun.game.com',
  },
  ports: {
    web: 5001,
    api: 9091,
    proxy: 5000,
  },
  ssl: {
    enabled: true,
    certPath: '/etc/ssl/wangu/aliyun.crt',
    keyPath: '/etc/ssl/wangu/aliyun.key',
  },
  scaling: {
    minInstances: 2,
    maxInstances: 10,
    targetCpuUtilization: 70,
  },
  storage: {
    type: 'oss',
    bucket: 'wangu-game-assets',
    region: 'cn-hangzhou',
  },
  database: {
    type: 'postgresql',
    host: 'rm-xxxxx.pg.rds.aliyuncs.com',
    port: 5432,
    name: 'wangu_game',
  },
  features: {
    cloudGaming: true,
    pushNotifications: true,
    analytics: true,
    cdn: true,
  },
};

// 腾讯云配置
export const tencentConfig: DeploymentConfig = {
  name: '万古长夜-腾讯云',
  platform: 'tencent',
  domains: {
    web: 'wangu.tencent.game.com',
    api: 'api.wangu.tencent.game.com',
    cdn: 'cdn.wangu.tencent.game.com',
  },
  ports: {
    web: 5001,
    api: 9091,
    proxy: 5000,
  },
  ssl: {
    enabled: true,
    certPath: '/etc/ssl/wangu/tencent.crt',
    keyPath: '/etc/ssl/wangu/tencent.key',
  },
  scaling: {
    minInstances: 2,
    maxInstances: 10,
    targetCpuUtilization: 70,
  },
  storage: {
    type: 'cos',
    bucket: 'wangu-game-assets-1250000000',
    region: 'ap-guangzhou',
  },
  database: {
    type: 'postgresql',
    host: 'gz-cdb-xxxxx.sql.tencentcdb.com',
    port: 5432,
    name: 'wangu_game',
  },
  features: {
    cloudGaming: true,
    pushNotifications: true,
    analytics: true,
    cdn: true,
  },
};

// Coze Cloud 配置（当前平台）
export const cozeConfig: DeploymentConfig = {
  name: '万古长夜-Coze Cloud',
  platform: 'coze',
  domains: {
    web: '916c8e51-dd88-40fc-81e0-5de9e61eded7.dev.coze.site',
    api: '916c8e51-dd88-40fc-81e0-5de9e61eded7.dev.coze.site',
    cdn: 'cdn.wangu.coze.site',
  },
  ports: {
    web: 5001,
    api: 9091,
    proxy: 5000,
  },
  ssl: {
    enabled: true,
  },
  scaling: {
    minInstances: 1,
    maxInstances: 5,
    targetCpuUtilization: 80,
  },
  storage: {
    type: 's3',
    bucket: 'wangu-game-coze',
    region: 'auto',
  },
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    name: 'wangu_game',
  },
  features: {
    cloudGaming: true,
    pushNotifications: false,
    analytics: true,
    cdn: false,
  },
};

// 部署配置映射
export const deploymentConfigs: Record<string, DeploymentConfig> = {
  aliyun: aliyunConfig,
  tencent: tencentConfig,
  coze: cozeConfig,
};

// 获取当前部署配置
export function getCurrentDeployment(): DeploymentConfig {
  const platform = process.env.DEPLOY_PLATFORM || 'coze';
  return deploymentConfigs[platform] || cozeConfig;
}

// 部署脚本生成
export function generateDeployScript(config: DeploymentConfig): string {
  const scripts: Record<string, string> = {
    aliyun: `
# 阿里云部署脚本
# 1. 构建前端
cd game-platform && npx expo export:web

# 2. 上传到 OSS
aliyun oss cp ./web-dist oss://${config.storage.bucket}/ --recursive

# 3. 配置 CDN 刷新
aliyun cdn RefreshObjectCaches --ObjectPath https://${config.domains.cdn}/*

# 4. 部署后端
cd ../server && docker build -t wangu-api .
docker push registry.cn-hangzhou.aliyuncs.com/wangu/api:latest

# 5. 更新 ECS 服务
kubectl set image deployment/wangu-api wangu-api=registry.cn-hangzhou.aliyuncs.com/wangu/api:latest
`,
    tencent: `
# 腾讯云部署脚本
# 1. 构建前端
cd game-platform && npx expo export:web

# 2. 上传到 COS
coscmd upload -r ./web-dist /${config.storage.bucket}/

# 3. 配置 CDN 刷新
tccli cdn PurgeUrlsCache --Urls '["https://${config.domains.cdn}"]'

# 4. 部署后端
cd ../server && docker build -t wangu-api .
docker push ccr.ccs.tencentyun.com/wangu/api:latest

# 5. 更新 TKE 服务
kubectl set image deployment/wangu-api wangu-api=ccr.ccs.tencentyun.com/wangu/api:latest
`,
    coze: `
# Coze Cloud 部署脚本
# 自动部署，无需手动操作
# 代码提交后自动触发 CI/CD

# 本地测试
cd game-platform && npx expo start --web --port 5001
cd ../server && pnpm run dev
`,
  };

  return scripts[config.platform] || scripts.coze;
}

export default deploymentConfigs;

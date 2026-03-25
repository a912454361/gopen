/**
 * 启动自检模块
 * 服务启动时校验文件完整性，检测篡改和损坏
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// 安全配置
interface SecurityConfig {
  enabled: boolean;
  failOnTamper: boolean;  // 检测到篡改时是否拒绝启动
  logLevel: 'silent' | 'warn' | 'error';
}

// 文件哈希记录
interface FileHashRecord {
  hash: string;
  size: number;
  modified: number;
}

// 自检结果
interface IntegrityCheckResult {
  success: boolean;
  totalFiles: number;
  passedFiles: number;
  failedFiles: string[];
  missingFiles: string[];
  newFiles: string[];
  errors: string[];
}

// 默认配置
const DEFAULT_CONFIG: SecurityConfig = {
  enabled: process.env.NODE_ENV === 'production',
  failOnTamper: true,
  logLevel: 'error',
};

// 关键文件列表（与 security-check.sh 保持同步）
const CRITICAL_FILES = [
  // 后端核心文件
  'server/src/index.ts',
  'server/src/services/consumption-service.ts',
  'server/src/services/reward-service.ts',
  'server/src/services/model-service.ts',
  'server/src/routes/ai-gateway.ts',
  'server/src/routes/consumption.ts',
  'server/src/routes/rewards.ts',
  'server/src/routes/bill.ts',
  'server/src/routes/payment.ts',
  'server/src/routes/admin.ts',
  'server/src/storage/database/supabase-client.ts',
  'server/src/config/model-providers.ts',
  'server/package.json',
  
  // 前端核心文件
  'client/app/_layout.tsx',
  'client/screens/models/index.tsx',
  'client/screens/consumption/index.tsx',
  'client/screens/rewards/index.tsx',
  'client/screens/wallet/index.tsx',
  'client/screens/payment/index.tsx',
  'client/screens/settings/index.tsx',
  'client/hooks/useTheme.ts',
  'client/constants/theme.ts',
  'client/package.json',
];

/**
 * 安全校验器
 */
export class SecurityValidator {
  private projectRoot: string;
  private securityDir: string;
  private hashFile: string;
  private manifestFile: string;
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.projectRoot = process.cwd();
    this.securityDir = path.join(this.projectRoot, '.security');
    this.hashFile = path.join(this.securityDir, 'file-hashes.json');
    this.manifestFile = path.join(this.securityDir, 'manifest.json');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 计算文件 SHA256 哈希
   */
  private calculateFileHash(filepath: string): string | null {
    try {
      const content = fs.readFileSync(filepath);
      return createHash('sha256').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  /**
   * 加载已保存的哈希记录
   */
  private loadHashRecords(): Record<string, FileHashRecord> {
    try {
      if (fs.existsSync(this.hashFile)) {
        const content = fs.readFileSync(this.hashFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[Security] 无法加载哈希文件:', error);
    }
    return {};
  }

  /**
   * 加载清单文件
   */
  private loadManifest(): { version: string; generated_at: string; total_files: number } | null {
    try {
      if (fs.existsSync(this.manifestFile)) {
        const content = fs.readFileSync(this.manifestFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // 忽略错误
    }
    return null;
  }

  /**
   * 执行完整性检查
   */
  checkIntegrity(): IntegrityCheckResult {
    const result: IntegrityCheckResult = {
      success: true,
      totalFiles: 0,
      passedFiles: 0,
      failedFiles: [],
      missingFiles: [],
      newFiles: [],
      errors: [],
    };

    if (!this.config.enabled) {
      console.log('[Security] 安全校验已禁用（非生产环境）');
      return result;
    }

    // 加载已保存的哈希
    const savedHashes = this.loadHashRecords();
    const manifest = this.loadManifest();

    if (Object.keys(savedHashes).length === 0) {
      const errorMsg = '未找到哈希文件，请先运行安全校验脚本';
      result.errors.push(errorMsg);
      result.success = false;
      
      if (this.config.logLevel !== 'silent') {
        console.error(`[Security] ${errorMsg}`);
        console.error('[Security] 运行: bash .cozeproj/scripts/security-check.sh hash');
      }
      
      return result;
    }

    console.log(`[Security] 开始完整性检查...`);
    console.log(`[Security] 清单版本: ${manifest?.version || 'unknown'}`);
    console.log(`[Security] 生成时间: ${manifest?.generated_at || 'unknown'}`);

    // 检查每个关键文件
    for (const relativePath of CRITICAL_FILES) {
      result.totalFiles++;
      const filepath = path.join(this.projectRoot, relativePath);

      // 检查文件是否存在
      if (!fs.existsSync(filepath)) {
        result.missingFiles.push(relativePath);
        continue;
      }

      // 获取当前哈希
      const currentHash = this.calculateFileHash(filepath);
      if (!currentHash) {
        result.errors.push(`无法计算哈希: ${relativePath}`);
        continue;
      }

      // 与保存的哈希对比
      const savedRecord = savedHashes[relativePath];
      if (!savedRecord) {
        // 新文件（可能是未授权添加的）
        result.newFiles.push(relativePath);
        continue;
      }

      if (currentHash === savedRecord.hash) {
        result.passedFiles++;
      } else {
        // 哈希不匹配 - 文件被篡改！
        result.failedFiles.push(relativePath);
        result.success = false;

        if (this.config.logLevel !== 'silent') {
          console.error(`[Security] 检测到篡改: ${relativePath}`);
          console.error(`[Security]   期望哈希: ${savedRecord.hash}`);
          console.error(`[Security]   当前哈希: ${currentHash}`);
        }
      }
    }

    // 检查是否有未授权删除的文件
    for (const savedPath of Object.keys(savedHashes)) {
      if (!CRITICAL_FILES.includes(savedPath)) {
        continue;
      }
      const filepath = path.join(this.projectRoot, savedPath);
      if (!fs.existsSync(filepath)) {
        result.missingFiles.push(savedPath);
      }
    }

    return result;
  }

  /**
   * 启动前自检（如果检测到问题则拒绝启动）
   */
  performStartupCheck(): boolean {
    console.log('');
    console.log('========================================');
    console.log('   启动安全自检');
    console.log('========================================');

    const result = this.checkIntegrity();

    // 输出结果摘要
    console.log('');
    console.log(`[Security] 检查文件数: ${result.totalFiles}`);
    console.log(`[Security] 通过文件数: ${result.passedFiles}`);
    
    if (result.failedFiles.length > 0) {
      console.error(`[Security] 篡改文件数: ${result.failedFiles.length}`);
      result.failedFiles.forEach(f => console.error(`  - ${f}`));
    }
    
    if (result.missingFiles.length > 0) {
      console.warn(`[Security] 缺失文件数: ${result.missingFiles.length}`);
    }
    
    if (result.newFiles.length > 0) {
      console.warn(`[Security] 新增文件数: ${result.newFiles.length}`);
    }

    if (result.errors.length > 0) {
      console.error(`[Security] 错误数: ${result.errors.length}`);
      result.errors.forEach(e => console.error(`  - ${e}`));
    }

    console.log('');

    // 决定是否允许启动
    if (!result.success && this.config.failOnTamper) {
      console.error('========================================');
      console.error('   ❌ 安全自检失败！');
      console.error('========================================');
      console.error('');
      console.error('[Security] 检测到文件完整性问题，拒绝启动服务！');
      console.error('[Security] 可能原因:');
      console.error('  1. 文件被恶意篡改');
      console.error('  2. 文件损坏');
      console.error('  3. 哈希文件过期');
      console.error('');
      console.error('[Security] 解决方法:');
      console.error('  1. 检查篡改文件内容');
      console.error('  2. 从备份恢复: .security/backups/');
      console.error('  3. 重新生成哈希: bash .cozeproj/scripts/security-check.sh hash');
      console.error('');
      
      return false;
    }

    if (result.success) {
      console.log('========================================');
      console.log('   ✅ 安全自检通过！');
      console.log('========================================');
      console.log('');
    } else {
      console.warn('========================================');
      console.warn('   ⚠️  安全自检有警告（已忽略）');
      console.warn('========================================');
      console.log('');
    }

    return true;
  }

  /**
   * 快速检查（仅检查关键文件是否存在）
   */
  quickCheck(): boolean {
    let allExist = true;
    const criticalCount = Math.min(5, CRITICAL_FILES.length);
    
    for (let i = 0; i < criticalCount; i++) {
      const filepath = path.join(this.projectRoot, CRITICAL_FILES[i]);
      if (!fs.existsSync(filepath)) {
        console.error(`[Security] 关键文件缺失: ${CRITICAL_FILES[i]}`);
        allExist = false;
      }
    }
    
    return allExist;
  }
}

// 导出单例
export const securityValidator = new SecurityValidator();

// 便捷函数
export function performSecurityCheck(): boolean {
  return securityValidator.performStartupCheck();
}

export function quickSecurityCheck(): boolean {
  return securityValidator.quickCheck();
}

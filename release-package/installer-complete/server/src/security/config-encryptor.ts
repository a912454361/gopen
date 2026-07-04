/**
 * 敏感配置加密工具
 * 用于加密和解密敏感配置信息
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto';

// 加密算法
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * 配置加密器
 */
export class ConfigEncryptor {
  private key: Buffer;

  /**
   * @param secretKey 加密密钥（建议从环境变量获取）
   */
  constructor(secretKey: string) {
    if (!secretKey || secretKey.length < 16) {
      throw new Error('加密密钥长度必须至少16个字符');
    }
    
    // 使用 scrypt 派生密钥
    const salt = createHash('sha256').update(secretKey).digest();
    this.key = scryptSync(secretKey, salt, 32);
  }

  /**
   * 加密文本
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    cipher.setAAD(salt);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // 格式: salt(32) + iv(16) + authTag(16) + encrypted
    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    return result.toString('base64');
  }

  /**
   * 解密文本
   */
  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, 'base64');
    
    if (buffer.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('无效的加密数据');
    }
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(authTag);
    
    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      throw new Error('解密失败：数据可能被篡改或密钥错误');
    }
  }

  /**
   * 加密文件
   */
  encryptFile(inputPath: string, outputPath: string): void {
    const content = fs.readFileSync(inputPath, 'utf8');
    const encrypted = this.encrypt(content);
    fs.writeFileSync(outputPath, encrypted, 'utf8');
  }

  /**
   * 解密文件
   */
  decryptFile(inputPath: string): string {
    const encrypted = fs.readFileSync(inputPath, 'utf8');
    return this.decrypt(encrypted);
  }

  /**
   * 加密环境变量文件
   */
  encryptEnvFile(inputPath: string, outputPath: string): void {
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // 解析环境变量
    const lines = content.split('\n');
    const encryptedLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) {
        encryptedLines.push(line);
        continue;
      }
      
      // 加密值部分
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        
        // 标记为加密
        const encryptedValue = this.encrypt(value);
        encryptedLines.push(`${key}=ENCRYPTED:${encryptedValue}`);
      } else {
        encryptedLines.push(line);
      }
    }
    
    fs.writeFileSync(outputPath, encryptedLines.join('\n'), 'utf8');
  }

  /**
   * 解密环境变量对象
   */
  decryptEnvValues(env: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      if (value.startsWith('ENCRYPTED:')) {
        const encryptedValue = value.substring(10);
        try {
          result[key] = this.decrypt(encryptedValue);
        } catch {
          console.error(`[Config] 无法解密环境变量: ${key}`);
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

/**
 * 从环境变量创建加密器
 */
export function createEncryptorFromEnv(): ConfigEncryptor | null {
  const key = process.env.SECURITY_KEY || process.env.CONFIG_ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('[Config] 未设置 SECURITY_KEY，敏感配置加密功能禁用');
    return null;
  }
  
  return new ConfigEncryptor(key);
}

/**
 * 加载并解密配置文件
 */
export function loadEncryptedConfig(filepath: string): Record<string, string> {
  const encryptor = createEncryptorFromEnv();
  
  if (!fs.existsSync(filepath)) {
    return {};
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  const result: Record<string, string> = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex);
      let value = trimmed.substring(eqIndex + 1);
      
      // 解密加密的值
      if (value.startsWith('ENCRYPTED:') && encryptor) {
        const encryptedValue = value.substring(10);
        try {
          value = encryptor.decrypt(encryptedValue);
        } catch {
          console.error(`[Config] 无法解密配置: ${key}`);
        }
      }
      
      result[key] = value;
    }
  }
  
  return result;
}

// CLI 工具
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('用法:');
    console.log('  ts-node config-encryptor.ts encrypt <input> <output>');
    console.log('  ts-node config-encryptor.ts decrypt <input>');
    console.log('  ts-node config-encryptor.ts encrypt-env <input> <output>');
    console.log('');
    console.log('环境变量:');
    console.log('  SECURITY_KEY - 加密密钥');
    process.exit(1);
  }
  
  const key = process.env.SECURITY_KEY;
  if (!key) {
    console.error('错误: 请设置 SECURITY_KEY 环境变量');
    process.exit(1);
  }
  
  const encryptor = new ConfigEncryptor(key);
  
  switch (command) {
    case 'encrypt': {
      const [, input, output] = args;
      encryptor.encryptFile(input, output);
      console.log(`已加密: ${input} -> ${output}`);
      break;
    }
    case 'decrypt': {
      const [, input] = args;
      const decrypted = encryptor.decryptFile(input);
      console.log(decrypted);
      break;
    }
    case 'encrypt-env': {
      const [, input, output] = args;
      encryptor.encryptEnvFile(input, output);
      console.log(`已加密环境变量: ${input} -> ${output}`);
      break;
    }
    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }
}

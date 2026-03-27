/**
 * 粒子系统默认导出
 * 此文件作为后备，实际使用时 Metro 会自动选择平台特定版本
 */

// 重新导出 Web 版本（作为默认后备）
export { ParticleSystem, PARTICLE_PRESETS } from './ParticleSystem.web';
export type { ParticleConfig } from './ParticleSystem.web';

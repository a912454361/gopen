/**
 * 粒子系统统一入口
 * 
 * Metro 会根据平台自动选择：
 * - Web: ParticleSystem.web.tsx (CSS 动画)
 * - Native: ParticleSystem.native.tsx (Reanimated)
 * 
 * 使用方式：
 * ```tsx
 * import { ParticleSystem, PARTICLE_PRESETS } from '@/components/ParticleSystem';
 * 
 * <ParticleSystem config={PARTICLE_PRESETS.gameHome} intensity="medium" />
 * ```
 */

// 从平台特定文件导出
export { ParticleSystem, PARTICLE_PRESETS } from './ParticleSystem';
export type { ParticleConfig } from './ParticleSystem';

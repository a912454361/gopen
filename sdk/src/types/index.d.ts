/**
 * G open SDK - TypeScript 类型定义
 * @module @gopen/sdk
 * @version 1.0.3
 */

// ================== 核心配置 ==================

/**
 * SDK 初始化配置
 */
export interface GopenConfig {
  /** 你的 API 基础 URL（你自己部署的服务器地址） */
  baseUrl: string;
  /** 授权码（从官网获取） */
  licenseKey: string;
  /** 设备唯一标识（用于授权验证） */
  deviceId?: string;
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 是否启用调试模式 */
  debug?: boolean;
}

// ================== 用户认证 ==================

/**
 * 用户登录参数
 */
export interface LoginParams {
  /** 手机号或邮箱 */
  account: string;
  /** 密码 */
  password?: string;
  /** 验证码（快捷登录时使用） */
  code?: string;
  /** 登录类型 */
  type: 'password' | 'code';
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 头像URL */
  avatar?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 会员等级 */
  memberLevel: number;
  /** G点余额 */
  gpoints: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 过期时间（秒） */
  expiresIn: number;
  /** 用户信息 */
  user: UserInfo;
}

// ================== AI 创作服务 ==================

/**
 * 文本生成参数
 */
export interface TextGenerationParams {
  /** 提示词 */
  prompt: string;
  /** 模型选择 */
  model?: 'doubao' | 'deepseek' | 'kimi' | 'qwen' | 'glm';
  /** 最大生成长度 */
  maxLength?: number;
  /** 温度参数 (0-1) */
  temperature?: number;
  /** 上下文ID（用于多轮对话） */
  contextId?: string;
}

/**
 * 文本生成结果
 */
export interface TextGenerationResult {
  /** 生成的文本 */
  text: string;
  /** 使用的模型 */
  model: string;
  /** 消耗的G点 */
  costGpoints: number;
  /** 生成时间（毫秒） */
  duration: number;
}

/**
 * 图像生成参数
 */
export interface ImageGenerationParams {
  /** 提示词 */
  prompt: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 图像宽度 */
  width?: number;
  /** 图像高度 */
  height?: number;
  /** 生成数量 */
  count?: number;
  /** 风格 */
  style?: 'anime' | 'realistic' | 'fantasy' | 'scifi';
}

/**
 * 图像生成结果
 */
export interface ImageGenerationResult {
  /** 图像URL列表 */
  images: string[];
  /** 消耗的G点 */
  costGpoints: number;
  /** 生成时间（毫秒） */
  duration: number;
}

/**
 * 视频生成参数
 */
export interface VideoGenerationParams {
  /** 提示词 */
  prompt: string;
  /** 参考图像URL */
  referenceImage?: string;
  /** 视频时长（秒） */
  duration?: number;
  /** 视频宽度 */
  width?: number;
  /** 视频高度 */
  height?: number;
  /** 帧率 */
  fps?: number;
  /** 模型选择 */
  model?: 'seedance' | 'kling' | 'pika' | 'runway' | 'qwen';
}

/**
 * 视频生成结果
 */
export interface VideoGenerationResult {
  /** 任务ID */
  taskId: string;
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 视频URL（完成后） */
  videoUrl?: string;
  /** 消耗的G点 */
  costGpoints: number;
}

// ================== 粒子特效服务 ==================

/**
 * 粒子特效类型
 */
export type ParticleEffectType = 
  | 'sword_qi'      // 苍穹剑气
  | 'ice_heart'     // 冰心诀
  | 'shadow'        // 暗影吞噬
  | 'flame'         // 烈焰焚天
  | 'thunder'       // 雷霆万钧
  | 'wind'          // 风云变幻
  | 'starfall'      // 星辰陨落
  | 'sword_rain';   // 万剑归宗

/**
 * 粒子特效参数
 */
export interface ParticleEffectParams {
  /** 特效类型 */
  type: ParticleEffectType;
  /** 输出分辨率 */
  resolution: '1080p' | '4K' | '8K';
  /** 帧率 */
  fps?: 30 | 60;
  /** 时长（秒） */
  duration: number;
  /** 背景颜色（十六进制） */
  backgroundColor?: string;
  /** 自定义参数 */
  customParams?: Record<string, any>;
}

/**
 * 粒子特效结果
 */
export interface ParticleEffectResult {
  /** 任务ID */
  taskId: string;
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 输出视频URL */
  videoUrl?: string;
  /** 预览图URL */
  previewUrl?: string;
  /** 消耗的G点 */
  costGpoints: number;
}

// ================== 动漫制作服务 ==================

/**
 * 场景信息
 */
export interface Scene {
  /** 场景ID */
  id: string;
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 场景类型 */
  type: 'action' | 'dialogue' | 'transition' | 'climax';
  /** 角色列表 */
  characters: string[];
  /** 分镜脚本 */
  storyboard?: string;
  /** 生成状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 剧集信息
 */
export interface Episode {
  /** 剧集ID */
  id: string;
  /** 剧集编号 */
  number: number;
  /** 剧集标题 */
  title: string;
  /** 剧集描述 */
  description: string;
  /** 故事线 */
  storyLine: string;
  /** 场景列表 */
  scenes: Scene[];
  /** 时长（分钟） */
  duration: number;
  /** 生成状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 动漫项目参数
 */
export interface AnimeProjectParams {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 风格 */
  style: 'chinese' | 'japanese' | 'western';
  /** 总集数 */
  totalEpisodes: number;
  /** 故事大纲 */
  storyOutline: string;
}

/**
 * 动漫项目结果
 */
export interface AnimeProjectResult {
  /** 项目ID */
  projectId: string;
  /** 状态 */
  status: 'created' | 'generating' | 'completed' | 'failed';
  /** 剧集列表 */
  episodes: Episode[];
  /** 预计完成时间 */
  estimatedCompletion?: string;
}

// ================== 支付服务 ==================

/**
 * 支付方式
 */
export type PaymentMethod = 'wechat' | 'alipay';

/**
 * 充值参数
 */
export interface RechargeParams {
  /** 充值金额（元） */
  amount: number;
  /** 支付方式 */
  method: PaymentMethod;
  /** 返回URL（支付完成后跳转） */
  returnUrl?: string;
}

/**
 * 充值结果
 */
export interface RechargeResult {
  /** 订单ID */
  orderId: string;
  /** 支付参数（用于调起支付） */
  paymentParams: Record<string, any>;
  /** 二维码URL（扫码支付时） */
  qrCodeUrl?: string;
}

// ================== 任务队列 ==================

/**
 * 任务状态
 */
export interface TaskStatus {
  /** 任务ID */
  taskId: string;
  /** 任务类型 */
  type: 'text' | 'image' | 'video' | 'particle' | 'anime';
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 进度 (0-100) */
  progress: number;
  /** 结果 */
  result?: any;
  /** 错误信息 */
  error?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

// ================== 错误类型 ==================

/**
 * SDK 错误
 */
export interface GopenError {
  /** 错误码 */
  code: string;
  /** 错误信息 */
  message: string;
  /** 详细信息 */
  details?: Record<string, any>;
}

// ================== 主类接口 ==================

/**
 * G open SDK 主接口
 */
export interface GopenSDKInterface {
  // 初始化
  initialize(config: GopenConfig): Promise<void>;
  
  // 用户认证
  auth: {
    login(params: LoginParams): Promise<LoginResponse>;
    logout(): Promise<void>;
    refreshToken(): Promise<LoginResponse>;
    getUserInfo(): Promise<UserInfo>;
  };
  
  // AI 创作服务
  ai: {
    generateText(params: TextGenerationParams): Promise<TextGenerationResult>;
    generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
    generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult>;
  };
  
  // 粒子特效服务
  particles: {
    createEffect(params: ParticleEffectParams): Promise<ParticleEffectResult>;
    getEffectStatus(taskId: string): Promise<ParticleEffectResult>;
    listEffects(): ParticleEffectType[];
  };
  
  // 动漫制作服务
  anime: {
    createProject(params: AnimeProjectParams): Promise<AnimeProjectResult>;
    getProject(projectId: string): Promise<AnimeProjectResult>;
    generateEpisode(projectId: string, episodeId: string): Promise<Episode>;
    generateScene(projectId: string, episodeId: string, sceneId: string): Promise<Scene>;
  };
  
  // 支付服务
  payment: {
    recharge(params: RechargeParams): Promise<RechargeResult>;
    getRechargeHistory(): Promise<any[]>;
  };
  
  // 任务管理
  tasks: {
    getStatus(taskId: string): Promise<TaskStatus>;
    cancel(taskId: string): Promise<void>;
    list(): Promise<TaskStatus[]>;
  };
}

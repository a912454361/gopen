/**
 * G open SDK - 核心实现
 * @module @gopen/sdk
 * @version 1.0.3
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// 导入类型
export * from './types';

import {
  GopenConfig,
  LoginParams,
  LoginResponse,
  UserInfo,
  TextGenerationParams,
  TextGenerationResult,
  ImageGenerationParams,
  ImageGenerationResult,
  VideoGenerationParams,
  VideoGenerationResult,
  ParticleEffectParams,
  ParticleEffectResult,
  ParticleEffectType,
  AnimeProjectParams,
  AnimeProjectResult,
  Episode,
  Scene,
  RechargeParams,
  RechargeResult,
  TaskStatus,
  GopenError,
} from './types';

/**
 * G open SDK 主类
 */
export class GopenSDK {
  private config: GopenConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * 创建 SDK 实例
   * @param config SDK 配置
   */
  constructor(config: GopenConfig) {
    this.config = {
      timeout: 30000,
      debug: false,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': this.config.licenseKey,
        'X-Device-Id': this.config.deviceId || this.generateDeviceId(),
      },
    });

    this.setupInterceptors();
  }

  /**
   * 生成设备ID
   */
  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 设置请求拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        if (this.config.debug) {
          console.log('[GopenSDK] Request:', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          console.log('[GopenSDK] Response:', response.status, response.data);
        }
        return response;
      },
      async (error: AxiosError<any>) => {
        const gopenError: GopenError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details,
        };

        // Token 过期自动刷新
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.auth.refreshToken();
            // 重试原请求
            return this.client.request(error.config!);
          } catch (refreshError) {
            this.accessToken = null;
            this.refreshToken = null;
            throw refreshError;
          }
        }

        throw gopenError;
      }
    );
  }

  // ================== 用户认证 ==================

  /**
   * 用户认证模块
   */
  auth = {
    /**
     * 用户登录
     */
    login: async (params: LoginParams): Promise<LoginResponse> => {
      const response = await this.client.post('/api/v1/auth/login', params);
      const data: LoginResponse = response.data.data;
      
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      
      return data;
    },

    /**
     * 用户登出
     */
    logout: async (): Promise<void> => {
      await this.client.post('/api/v1/auth/logout');
      this.accessToken = null;
      this.refreshToken = null;
    },

    /**
     * 刷新 Token
     */
    refreshToken: async (): Promise<LoginResponse> => {
      const response = await this.client.post('/api/v1/auth/refresh', {
        refreshToken: this.refreshToken,
      });
      const data: LoginResponse = response.data.data;
      
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      
      return data;
    },

    /**
     * 获取用户信息
     */
    getUserInfo: async (): Promise<UserInfo> => {
      const response = await this.client.get('/api/v1/user/me');
      return response.data.data;
    },
  };

  // ================== AI 创作服务 ==================

  /**
   * AI 创作服务模块
   */
  ai = {
    /**
     * 文本生成
     */
    generateText: async (params: TextGenerationParams): Promise<TextGenerationResult> => {
      const response = await this.client.post('/api/v1/ai/text', params);
      return response.data.data;
    },

    /**
     * 图像生成
     */
    generateImage: async (params: ImageGenerationParams): Promise<ImageGenerationResult> => {
      const response = await this.client.post('/api/v1/ai/image', params);
      return response.data.data;
    },

    /**
     * 视频生成
     */
    generateVideo: async (params: VideoGenerationParams): Promise<VideoGenerationResult> => {
      const response = await this.client.post('/api/v1/ai/video', params);
      return response.data.data;
    },
  };

  // ================== 粒子特效服务 ==================

  /**
   * 粒子特效服务模块
   */
  particles = {
    /**
     * 创建粒子特效
     */
    createEffect: async (params: ParticleEffectParams): Promise<ParticleEffectResult> => {
      const response = await this.client.post('/api/v1/particles/create', params);
      return response.data.data;
    },

    /**
     * 获取特效状态
     */
    getEffectStatus: async (taskId: string): Promise<ParticleEffectResult> => {
      const response = await this.client.get(`/api/v1/particles/status/${taskId}`);
      return response.data.data;
    },

    /**
     * 获取可用特效列表
     */
    listEffects: (): ParticleEffectType[] => {
      return [
        'sword_qi',    // 苍穹剑气
        'ice_heart',   // 冰心诀
        'shadow',      // 暗影吞噬
        'flame',       // 烈焰焚天
        'thunder',     // 雷霆万钧
        'wind',        // 风云变幻
        'starfall',    // 星辰陨落
        'sword_rain',  // 万剑归宗
      ];
    },
  };

  // ================== 动漫制作服务 ==================

  /**
   * 动漫制作服务模块
   */
  anime = {
    /**
     * 创建动漫项目
     */
    createProject: async (params: AnimeProjectParams): Promise<AnimeProjectResult> => {
      const response = await this.client.post('/api/v1/anime/project', params);
      return response.data.data;
    },

    /**
     * 获取项目信息
     */
    getProject: async (projectId: string): Promise<AnimeProjectResult> => {
      const response = await this.client.get(`/api/v1/anime/project/${projectId}`);
      return response.data.data;
    },

    /**
     * 生成剧集
     */
    generateEpisode: async (projectId: string, episodeId: string): Promise<Episode> => {
      const response = await this.client.post(
        `/api/v1/anime/project/${projectId}/episode/${episodeId}/generate`
      );
      return response.data.data;
    },

    /**
     * 生成场景
     */
    generateScene: async (
      projectId: string,
      episodeId: string,
      sceneId: string
    ): Promise<Scene> => {
      const response = await this.client.post(
        `/api/v1/anime/project/${projectId}/episode/${episodeId}/scene/${sceneId}/generate`
      );
      return response.data.data;
    },
  };

  // ================== 支付服务 ==================

  /**
   * 支付服务模块
   */
  payment = {
    /**
     * 充值
     */
    recharge: async (params: RechargeParams): Promise<RechargeResult> => {
      const response = await this.client.post('/api/v1/pay/recharge', params);
      return response.data.data;
    },

    /**
     * 获取充值历史
     */
    getRechargeHistory: async (): Promise<any[]> => {
      const response = await this.client.get('/api/v1/pay/history');
      return response.data.data;
    },
  };

  // ================== 任务管理 ==================

  /**
   * 任务管理模块
   */
  tasks = {
    /**
     * 获取任务状态
     */
    getStatus: async (taskId: string): Promise<TaskStatus> => {
      const response = await this.client.get(`/api/v1/tasks/${taskId}`);
      return response.data.data;
    },

    /**
     * 取消任务
     */
    cancel: async (taskId: string): Promise<void> => {
      await this.client.post(`/api/v1/tasks/${taskId}/cancel`);
    },

    /**
     * 获取任务列表
     */
    list: async (): Promise<TaskStatus[]> => {
      const response = await this.client.get('/api/v1/tasks');
      return response.data.data;
    },
  };
}

// 默认导出
export default GopenSDK;

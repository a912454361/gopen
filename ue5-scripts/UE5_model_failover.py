#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 AI 模型故障转移系统
多模型备份与自动切换

功能：
- 主备模型配置
- 自动健康检测
- 故障自动切换
- 负载均衡
- 性能监控
- 智能路由
"""

import unreal
import time
import json
import threading
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import random


class ModelStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    OFFLINE = "offline"


class ModelType(Enum):
    LLM = "llm"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


@dataclass
class AIModel:
    """AI 模型配置"""
    id: str
    name: str
    type: ModelType
    provider: str
    api_endpoint: str
    priority: int = 1  # 1=主模型, 2=备选, 3=兜底
    status: ModelStatus = ModelStatus.HEALTHY
    latency_ms: float = 0.0
    success_rate: float = 1.0
    last_check: Optional[float] = None
    consecutive_failures: int = 0
    total_requests: int = 0
    successful_requests: int = 0


@dataclass
class ModelGroup:
    """模型组（主备配置）"""
    model_type: ModelType
    models: List[AIModel] = field(default_factory=list)
    current_primary: Optional[str] = None
    failover_threshold: int = 3  # 连续失败次数触发切换
    health_check_interval: float = 30.0  # 秒
    
    def get_active_model(self) -> Optional[AIModel]:
        """获取当前活跃模型"""
        for model in self.models:
            if model.id == self.current_primary and model.status == ModelStatus.HEALTHY:
                return model
        
        # 如果主模型不健康，寻找备选
        for model in sorted(self.models, key=lambda m: m.priority):
            if model.status == ModelStatus.HEALTHY:
                self.current_primary = model.id
                return model
        
        return None


class ModelFailoverSystem:
    """模型故障转移系统"""
    
    # 预配置的模型组（每种类型多个备用）
    MODEL_CONFIGS = {
        ModelType.LLM: [
            # 主模型
            {"id": "doubao-seed-pro", "name": "Doubao Seed Pro", "provider": "doubao", "priority": 1},
            {"id": "doubao-seed-lite", "name": "Doubao Seed Lite", "provider": "doubao", "priority": 1},
            # 备选模型
            {"id": "deepseek-v3", "name": "DeepSeek V3", "provider": "deepseek", "priority": 2},
            {"id": "kimi-k2", "name": "Kimi K2", "provider": "moonshot", "priority": 2},
            {"id": "qwen-max", "name": "通义千问 Max", "provider": "alibaba", "priority": 3},
            {"id": "glm-4", "name": "智谱 GLM-4", "provider": "zhipu", "priority": 3},
            # 兜底模型
            {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "priority": 4},
            {"id": "claude-3", "name": "Claude 3.5", "provider": "anthropic", "priority": 4},
        ],
        ModelType.IMAGE: [
            # 主模型
            {"id": "image-gen-4k", "name": "Image Gen 4K", "provider": "doubao", "priority": 1},
            {"id": "image-gen-2k", "name": "Image Gen 2K", "provider": "doubao", "priority": 1},
            # 备选模型
            {"id": "midjourney", "name": "Midjourney", "provider": "midjourney", "priority": 2},
            {"id": "dall-e-3", "name": "DALL-E 3", "provider": "openai", "priority": 2},
            {"id": "stable-diffusion-xl", "name": "SDXL", "provider": "stability", "priority": 3},
            {"id": "flux-pro", "name": "Flux Pro", "provider": "flux", "priority": 3},
            # 动漫专用
            {"id": "niji-v6", "name": "Niji V6", "provider": "midjourney", "priority": 2},
            {"id": "novelai", "name": "NovelAI", "provider": "novelai", "priority": 3},
        ],
        ModelType.VIDEO: [
            # 主模型
            {"id": "video-gen-1080p", "name": "Video Gen 1080p", "provider": "doubao", "priority": 1},
            {"id": "video-gen-720p", "name": "Video Gen 720p", "provider": "doubao", "priority": 1},
            # 备选模型
            {"id": "runway-gen3", "name": "Runway Gen-3", "provider": "runway", "priority": 2},
            {"id": "pika-labs", "name": "Pika Labs", "provider": "pika", "priority": 2},
            {"id": "sora", "name": "Sora", "provider": "openai", "priority": 2},
            {"id": "kling", "name": "可灵 AI", "provider": "kuaishou", "priority": 3},
            {"id": "seedance", "name": "Seedance", "provider": "doubao", "priority": 2},
            # 兜底
            {"id": "stable-video", "name": "Stable Video", "provider": "stability", "priority": 4},
        ],
        ModelType.AUDIO: [
            # 主模型
            {"id": "tts-zh", "name": "TTS Chinese", "provider": "doubao", "priority": 1},
            {"id": "tts-jp", "name": "TTS Japanese", "provider": "doubao", "priority": 1},
            # 备选模型
            {"id": "eleven-labs", "name": "ElevenLabs", "provider": "elevenlabs", "priority": 2},
            {"id": "azure-tts", "name": "Azure TTS", "provider": "microsoft", "priority": 2},
            {"id": "google-tts", "name": "Google TTS", "provider": "google", "priority": 3},
            {"id": "edge-tts", "name": "Edge TTS", "provider": "microsoft", "priority": 3},
            # 配音专用
            {"id": "gpt-sovits", "name": "GPT-SoVITS", "provider": "open-source", "priority": 2},
            {"id": "vits", "name": "VITS", "provider": "open-source", "priority": 3},
        ],
    }
    
    def __init__(self):
        self.model_groups: Dict[ModelType, ModelGroup] = {}
        self.health_checker: Optional[threading.Thread] = None
        self.running = False
        self.failover_callbacks: List[Callable] = []
        
        # 初始化模型组
        self._initialize_model_groups()
    
    def _initialize_model_groups(self):
        """初始化所有模型组"""
        
        for model_type, configs in self.MODEL_CONFIGS.items():
            models = []
            
            for config in configs:
                model = AIModel(
                    id=config["id"],
                    name=config["name"],
                    type=model_type,
                    provider=config["provider"],
                    priority=config["priority"],
                    api_endpoint=f"https://api.{config['provider']}.com/v1",
                )
                models.append(model)
            
            # 设置初始主模型
            primary_model = next((m for m in models if m.priority == 1), models[0])
            
            self.model_groups[model_type] = ModelGroup(
                model_type=model_type,
                models=models,
                current_primary=primary_model.id,
            )
        
        unreal.log(f"[FailoverSystem] Initialized {len(self.model_groups)} model groups")
    
    def start_health_monitor(self):
        """启动健康监控"""
        
        if self.running:
            return
        
        self.running = True
        self.health_checker = threading.Thread(target=self._health_check_loop, daemon=True)
        self.health_checker.start()
        
        unreal.log("[FailoverSystem] Health monitor started")
    
    def _health_check_loop(self):
        """健康检查循环"""
        
        while self.running:
            for model_type, group in self.model_groups.items():
                for model in group.models:
                    self._check_model_health(model)
            
            time.sleep(30)  # 每30秒检查一次
    
    def _check_model_health(self, model: AIModel):
        """检查单个模型健康状态"""
        
        try:
            # 模拟健康检查（实际应调用API）
            start_time = time.time()
            
            # 这里应该发送实际的API请求
            # response = requests.get(f"{model.api_endpoint}/health", timeout=5)
            
            # 模拟检查
            is_healthy = random.random() > 0.05  # 95%成功率
            
            latency = (time.time() - start_time) * 1000
            
            model.latency_ms = latency
            model.last_check = time.time()
            
            if is_healthy:
                model.consecutive_failures = 0
                model.status = ModelStatus.HEALTHY if latency < 2000 else ModelStatus.DEGRADED
            else:
                model.consecutive_failures += 1
                if model.consecutive_failures >= 3:
                    model.status = ModelStatus.UNHEALTHY
                    self._trigger_failover(model)
            
        except Exception as e:
            model.consecutive_failures += 1
            model.status = ModelStatus.UNHEALTHY if model.consecutive_failures >= 3 else ModelStatus.DEGRADED
            
            unreal.log_warning(f"[FailoverSystem] Health check failed for {model.id}: {e}")
    
    def _trigger_failover(self, failed_model: AIModel):
        """触发故障转移"""
        
        model_type = failed_model.type
        group = self.model_groups.get(model_type)
        
        if not group:
            return
        
        # 寻找备选模型
        backup_models = [
            m for m in group.models
            if m.id != failed_model.id and m.status == ModelStatus.HEALTHY
        ]
        
        if not backup_models:
            unreal.log_error(f"[FailoverSystem] No backup models available for {model_type.value}")
            return
        
        # 选择优先级最高的健康模型
        new_primary = min(backup_models, key=lambda m: m.priority)
        old_primary = group.current_primary
        group.current_primary = new_primary.id
        
        unreal.log(f"[FailoverSystem] Failover triggered: {old_primary} -> {new_primary.id}")
        
        # 调用回调
        for callback in self.failover_callbacks:
            try:
                callback(model_type, old_primary, new_primary.id)
            except Exception as e:
                unreal.log_error(f"[FailoverSystem] Callback error: {e}")
    
    def register_failover_callback(self, callback: Callable):
        """注册故障转移回调"""
        self.failover_callbacks.append(callback)
    
    def get_model(self, model_type: ModelType) -> Optional[AIModel]:
        """获取指定类型的活跃模型"""
        
        group = self.model_groups.get(model_type)
        if not group:
            return None
        
        return group.get_active_model()
    
    def get_all_models(self, model_type: ModelType = None) -> List[AIModel]:
        """获取所有模型状态"""
        
        if model_type:
            group = self.model_groups.get(model_type)
            return group.models if group else []
        
        all_models = []
        for group in self.model_groups.values():
            all_models.extend(group.models)
        return all_models
    
    def report_success(self, model_id: str, latency_ms: float):
        """报告成功请求"""
        
        for group in self.model_groups.values():
            for model in group.models:
                if model.id == model_id:
                    model.successful_requests += 1
                    model.total_requests += 1
                    model.success_rate = model.successful_requests / model.total_requests
                    model.latency_ms = (model.latency_ms * 0.9 + latency_ms * 0.1)
                    model.consecutive_failures = 0
                    return
    
    def report_failure(self, model_id: str):
        """报告失败请求"""
        
        for group in self.model_groups.values():
            for model in group.models:
                if model.id == model_id:
                    model.total_requests += 1
                    model.success_rate = model.successful_requests / model.total_requests
                    model.consecutive_failures += 1
                    
                    if model.consecutive_failures >= group.failover_threshold:
                        model.status = ModelStatus.UNHEALTHY
                        self._trigger_failover(model)
                    
                    return
    
    def get_status_report(self) -> Dict[str, Any]:
        """获取状态报告"""
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "model_groups": {},
            "summary": {
                "total_models": 0,
                "healthy": 0,
                "degraded": 0,
                "unhealthy": 0,
            }
        }
        
        for model_type, group in self.model_groups.items():
            group_status = {
                "current_primary": group.current_primary,
                "models": [],
            }
            
            for model in group.models:
                model_status = {
                    "id": model.id,
                    "name": model.name,
                    "provider": model.provider,
                    "priority": model.priority,
                    "status": model.status.value,
                    "latency_ms": round(model.latency_ms, 2),
                    "success_rate": round(model.success_rate * 100, 1),
                    "consecutive_failures": model.consecutive_failures,
                }
                
                group_status["models"].append(model_status)
                report["summary"]["total_models"] += 1
                
                if model.status == ModelStatus.HEALTHY:
                    report["summary"]["healthy"] += 1
                elif model.status == ModelStatus.DEGRADED:
                    report["summary"]["degraded"] += 1
                else:
                    report["summary"]["unhealthy"] += 1
            
            report["model_groups"][model_type.value] = group_status
        
        return report
    
    def stop(self):
        """停止健康监控"""
        self.running = False
        
        if self.health_checker:
            self.health_checker.join(timeout=5)
        
        unreal.log("[FailoverSystem] Stopped")


class LoadBalancer:
    """负载均衡器"""
    
    def __init__(self, failover_system: ModelFailoverSystem):
        self.failover_system = failover_system
        self.round_robin_index: Dict[ModelType, int] = {}
    
    def get_model_round_robin(self, model_type: ModelType) -> Optional[AIModel]:
        """轮询选择模型"""
        
        group = self.failover_system.model_groups.get(model_type)
        if not group:
            return None
        
        healthy_models = [m for m in group.models if m.status == ModelStatus.HEALTHY]
        
        if not healthy_models:
            return group.get_active_model()
        
        if model_type not in self.round_robin_index:
            self.round_robin_index[model_type] = 0
        
        index = self.round_robin_index[model_type] % len(healthy_models)
        self.round_robin_index[model_type] += 1
        
        return healthy_models[index]
    
    def get_model_least_latency(self, model_type: ModelType) -> Optional[AIModel]:
        """选择延迟最低的模型"""
        
        group = self.failover_system.model_groups.get(model_type)
        if not group:
            return None
        
        healthy_models = [m for m in group.models if m.status == ModelStatus.HEALTHY]
        
        if not healthy_models:
            return group.get_active_model()
        
        return min(healthy_models, key=lambda m: m.latency_ms)
    
    def get_model_weighted(self, model_type: ModelType) -> Optional[AIModel]:
        """加权选择（成功率权重）"""
        
        group = self.failover_system.model_groups.get(model_type)
        if not group:
            return None
        
        healthy_models = [m for m in group.models if m.status == ModelStatus.HEALTHY]
        
        if not healthy_models:
            return group.get_active_model()
        
        # 按成功率加权随机选择
        weights = [m.success_rate for m in healthy_models]
        total_weight = sum(weights)
        
        if total_weight == 0:
            return healthy_models[0]
        
        r = random.random() * total_weight
        cumulative = 0
        
        for model, weight in zip(healthy_models, weights):
            cumulative += weight
            if r <= cumulative:
                return model
        
        return healthy_models[-1]


# 全局实例
_failover_system: Optional[ModelFailoverSystem] = None


def get_failover_system() -> ModelFailoverSystem:
    """获取故障转移系统实例"""
    global _failover_system
    
    if _failover_system is None:
        _failover_system = ModelFailoverSystem()
        _failover_system.start_health_monitor()
    
    return _failover_system


def get_model(model_type: str) -> Optional[AIModel]:
    """便捷函数：获取模型"""
    system = get_failover_system()
    return system.get_model(ModelType(model_type))


def get_backup_models(model_type: str) -> List[AIModel]:
    """便捷函数：获取备用模型列表"""
    system = get_failover_system()
    return [m for m in system.get_all_models(ModelType(model_type)) if m.priority > 1]


if __name__ == "__main__":
    system = get_failover_system()
    
    # 获取状态报告
    report = system.get_status_report()
    print(f"Model Status Report:\n{json.dumps(report, indent=2)}")
    
    # 测试获取模型
    llm_model = system.get_model(ModelType.LLM)
    print(f"\nActive LLM Model: {llm_model.name if llm_model else 'None'}")
    
    # 测试负载均衡
    lb = LoadBalancer(system)
    for i in range(5):
        model = lb.get_model_round_robin(ModelType.LLM)
        print(f"Round Robin {i+1}: {model.name if model else 'None'}")

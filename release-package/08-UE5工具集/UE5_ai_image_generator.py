#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 AI 图像生成器
对接 Stable Diffusion / DALL-E / Midjourney API 生成场景图

功能：
- 文本转图像生成
- 图生图（风格迁移）
- 批量生成
- 自动导入到 UE5 项目
"""

import unreal
import json
import requests
import base64
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class ImageGenerationConfig:
    """图像生成配置"""
    prompt: str
    negative_prompt: str = "blurry, low quality, distorted, deformed"
    width: int = 1024
    height: int = 1024
    num_images: int = 1
    style: str = "anime"  # anime, realistic, painting
    save_path: str = "/Game/Generated/Images"
    model: str = "sd_xl_base"  # sd_xl_base, dall_e_3, midjourney


class AIImageGenerator:
    """AI 图像生成器"""
    
    # API 端点配置
    API_ENDPOINTS = {
        "local_sd": "http://localhost:7860/sdapi/v1/txt2img",
        "local_sd_img2img": "http://localhost:7860/sdapi/v1/img2img",
        "coze_api": "https://api.coze.com/v1/image/generate",
        "openai_api": "https://api.openai.com/v1/images/generations",
    }
    
    # 风格预设
    STYLE_PRESETS = {
        "anime": {
            "positive": "anime style, cel shading, vibrant colors, high quality, detailed",
            "negative": "3d, realistic, photograph, low quality",
        },
        "realistic": {
            "positive": "photorealistic, ultra detailed, 8k, high quality",
            "negative": "anime, cartoon, low quality, blurry",
        },
        "painting": {
            "positive": "oil painting style, artistic, detailed brushstrokes",
            "negative": "photo, realistic, low quality",
        },
        "japanese_anime": {
            "positive": "japanese anime style, beautiful detailed eyes, vibrant, high quality anime",
            "negative": "3d, realistic, western cartoon, low quality",
        },
        "chinese_anime": {
            "positive": "chinese anime style, guofeng, traditional elements, elegant",
            "negative": "western, realistic, low quality",
        },
    }
    
    def __init__(self, api_key: Optional[str] = None, api_type: str = "local_sd"):
        """
        初始化图像生成器
        
        Args:
            api_key: API 密钥（如果使用云服务）
            api_type: API 类型 (local_sd, coze_api, openai_api)
        """
        self.api_key = api_key or os.environ.get("AI_API_KEY", "")
        self.api_type = api_type
        self.generated_images: List[str] = []
        
    def generate_image(self, config: ImageGenerationConfig) -> List[str]:
        """
        生成图像
        
        Args:
            config: 图像生成配置
            
        Returns:
            生成的图像路径列表
        """
        # 构建提示词
        style_preset = self.STYLE_PRESETS.get(config.style, self.STYLE_PRESETS["anime"])
        full_prompt = f"{config.prompt}, {style_preset['positive']}"
        full_negative = f"{config.negative_prompt}, {style_preset['negative']}"
        
        if self.api_type == "local_sd":
            return self._generate_with_local_sd(config, full_prompt, full_negative)
        elif self.api_type == "coze_api":
            return self._generate_with_coze(config, full_prompt)
        elif self.api_type == "openai_api":
            return self._generate_with_openai(config, full_prompt)
        else:
            unreal.log_error(f"Unknown API type: {self.api_type}")
            return []
    
    def _generate_with_local_sd(
        self, 
        config: ImageGenerationConfig, 
        prompt: str, 
        negative_prompt: str
    ) -> List[str]:
        """使用本地 Stable Diffusion WebUI API"""
        
        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": config.width,
            "height": config.height,
            "batch_size": config.num_images,
            "steps": 30,
            "cfg_scale": 7,
            "sampler_name": "DPM++ 2M Karras",
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["local_sd"],
                json=payload,
                timeout=300
            )
            response.raise_for_status()
            
            result = response.json()
            images = result.get("images", [])
            
            return self._save_images(images, config.save_path)
            
        except requests.exceptions.RequestException as e:
            unreal.log_error(f"SD API request failed: {e}")
            return []
    
    def _generate_with_coze(
        self, 
        config: ImageGenerationConfig, 
        prompt: str
    ) -> List[str]:
        """使用 Coze API（coze-coding-dev-sdk）"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "prompt": prompt,
            "size": f"{config.width}x{config.height}",
            "num": config.num_images,
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["coze_api"],
                headers=headers,
                json=payload,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            image_urls = result.get("data", [])
            
            return self._download_and_save_images(image_urls, config.save_path)
            
        except requests.exceptions.RequestException as e:
            unreal.log_error(f"Coze API request failed: {e}")
            return []
    
    def _generate_with_openai(
        self, 
        config: ImageGenerationConfig, 
        prompt: str
    ) -> List[str]:
        """使用 OpenAI DALL-E API"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # DALL-E 3 支持的尺寸
        size = "1024x1024"
        if config.width == 1792 or config.height == 1792:
            size = "1792x1024" if config.width > config.height else "1024x1792"
        
        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": min(config.num_images, 1),  # DALL-E 3 只支持 n=1
            "size": size,
            "quality": "hd",
            "response_format": "url",
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["openai_api"],
                headers=headers,
                json=payload,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            image_urls = [item["url"] for item in result.get("data", [])]
            
            return self._download_and_save_images(image_urls, config.save_path)
            
        except requests.exceptions.RequestException as e:
            unreal.log_error(f"OpenAI API request failed: {e}")
            return []
    
    def _save_images(self, base64_images: List[str], save_path: str) -> List[str]:
        """保存 Base64 图像到 UE5 项目"""
        
        saved_paths = []
        
        # 获取项目根目录
        project_dir = unreal.SystemLibrary.get_project_directory()
        content_dir = os.path.join(project_dir, "Content")
        target_dir = os.path.join(content_dir, save_path.replace("/Game/", "").replace("/", os.sep))
        
        os.makedirs(target_dir, exist_ok=True)
        
        for i, img_data in enumerate(base64_images):
            # 生成文件名
            filename = f"generated_{len(self.generated_images) + i:04d}.png"
            filepath = os.path.join(target_dir, filename)
            
            # 解码并保存
            img_bytes = base64.b64decode(img_data)
            with open(filepath, "wb") as f:
                f.write(img_bytes)
            
            saved_paths.append(filepath)
            self.generated_images.append(filepath)
            
        # 刷新资产注册表
        unreal.AssetRegistryHelpers.get_asset_registry().search_all_assets(True)
        
        unreal.log(f"Saved {len(saved_paths)} images to {target_dir}")
        return saved_paths
    
    def _download_and_save_images(self, urls: List[str], save_path: str) -> List[str]:
        """下载并保存图像"""
        
        saved_paths = []
        
        project_dir = unreal.SystemLibrary.get_project_directory()
        content_dir = os.path.join(project_dir, "Content")
        target_dir = os.path.join(content_dir, save_path.replace("/Game/", "").replace("/", os.sep))
        
        os.makedirs(target_dir, exist_ok=True)
        
        for i, url in enumerate(urls):
            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                filename = f"generated_{len(self.generated_images) + i:04d}.png"
                filepath = os.path.join(target_dir, filename)
                
                with open(filepath, "wb") as f:
                    f.write(response.content)
                
                saved_paths.append(filepath)
                self.generated_images.append(filepath)
                
            except requests.exceptions.RequestException as e:
                unreal.log_error(f"Failed to download image: {e}")
        
        unreal.AssetRegistryHelpers.get_asset_registry().search_all_assets(True)
        return saved_paths
    
    def import_to_ue5(
        self, 
        image_paths: List[str], 
        as_texture: bool = True,
        as_sprite: bool = False
    ) -> List[unreal.Object]:
        """将图像导入为 UE5 资产"""
        
        imported_assets = []
        
        for path in image_paths:
            # 构建导入任务
            import_task = unreal.AssetImportTask()
            import_task.set_editor_property("filename", path)
            import_task.set_editor_property("destination_path", "/Game/Generated/Textures")
            import_task.set_editor_property("automated", True)
            import_task.set_editor_property("save", True)
            
            if as_texture:
                import_task.set_editor_property("replace_existing", True)
            
            # 执行导入
            unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([import_task])
            
            # 获取导入的资产
            for obj in import_task.get_editor_property("imported_object_paths"):
                asset = unreal.EditorAssetLibrary.load_asset(obj)
                if asset:
                    imported_assets.append(asset)
        
        return imported_assets


def generate_scene_image(
    prompt: str,
    style: str = "anime",
    width: int = 1024,
    height: int = 1024,
    api_type: str = "local_sd",
    api_key: Optional[str] = None
) -> List[str]:
    """
    便捷函数：生成场景图像
    
    Args:
        prompt: 场景描述
        style: 风格 (anime, realistic, painting, japanese_anime, chinese_anime)
        width: 图像宽度
        height: 图像高度
        api_type: API 类型
        api_key: API 密钥
        
    Returns:
        生成的图像路径列表
    """
    config = ImageGenerationConfig(
        prompt=prompt,
        style=style,
        width=width,
        height=height,
    )
    
    generator = AIImageGenerator(api_key=api_key, api_type=api_type)
    return generator.generate_image(config)


# UE5 编辑器工具入口
class AIImageGeneratorTool(unreal.ToolMenuEntryScript):
    """UE5 编辑器工具菜单入口"""
    
    def __init__(self):
        super().__init__()
        self.init_menu_entry(
            "LevelEditorToolBar",
            "AIImageGenerator",
            "AI Image Generator",
            "Generate images with AI",
            self.execute_tool
        )
    
    @staticmethod
    def execute_tool():
        """执行工具"""
        # 打开配置窗口
        unreal.log("AI Image Generator Tool activated")


# 模块入口点
def on_module_loaded():
    """模块加载时执行"""
    unreal.log("UE5 AI Image Generator loaded")


def on_module_unloaded():
    """模块卸载时执行"""
    unreal.log("UE5 AI Image Generator unloaded")


if __name__ == "__main__":
    # 测试代码
    config = ImageGenerationConfig(
        prompt="A beautiful anime girl standing in a cherry blossom garden",
        style="japanese_anime",
        width=1024,
        height=1024,
    )
    
    generator = AIImageGenerator(api_type="local_sd")
    paths = generator.generate_image(config)
    print(f"Generated images: {paths}")

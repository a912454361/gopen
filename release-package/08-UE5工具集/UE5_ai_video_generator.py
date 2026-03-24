#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 AI 视频生成器
对接 Runway / Pika / Coze API 生成动画
"""

import unreal
import json
import requests
import time
import os
import base64
from typing import Optional, List, Dict
from dataclasses import dataclass
from enum import Enum


class VideoProvider(Enum):
    RUNWAY = "runway"
    PIKA = "pika"
    SVD = "stable_video_diffusion"
    COZE = "coze"


@dataclass
class VideoGenerationConfig:
    prompt: str
    image_url: Optional[str] = None
    duration: float = 4.0
    fps: int = 24
    resolution: tuple = (1024, 576)
    style: str = "anime"
    motion_intensity: float = 1.0
    save_path: str = "/Game/Generated/Videos"
    provider: VideoProvider = VideoProvider.COZE


class AIVideoGenerator:
    API_ENDPOINTS = {
        VideoProvider.RUNWAY: "https://api.runwayml.com/v1/generate",
        VideoProvider.PIKA: "https://api.pika.art/v1/generate",
        VideoProvider.SVD: "http://localhost:7860/svdapi/v1/txt2vid",
        VideoProvider.COZE: "https://api.coze.com/v1/video/generate",
    }
    
    ANIME_STYLE_PROMPTS = {
        "japanese": "japanese anime style, smooth animation, vivid colors",
        "chinese": "chinese anime style, elegant motion, traditional aesthetics",
        "korean": "korean anime style, smooth transitions, modern aesthetic",
        "western": "western animation style, fluid motion, cartoon aesthetic",
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("AI_VIDEO_API_KEY", "")
        self.completed_videos: List[str] = []
    
    def generate_video(self, config: VideoGenerationConfig) -> Optional[str]:
        style_prompt = self.ANIME_STYLE_PROMPTS.get(config.style, "anime style")
        full_prompt = f"{config.prompt}, {style_prompt}"
        
        if config.provider == VideoProvider.COZE:
            return self._generate_with_coze(config, full_prompt)
        elif config.provider == VideoProvider.RUNWAY:
            return self._generate_with_runway(config, full_prompt)
        elif config.provider == VideoProvider.PIKA:
            return self._generate_with_pika(config, full_prompt)
        elif config.provider == VideoProvider.SVD:
            return self._generate_with_svd(config, full_prompt)
        return None
    
    def _generate_with_coze(self, config: VideoGenerationConfig, prompt: str) -> Optional[str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        content = []
        if config.image_url:
            content.append({
                "type": "image_url",
                "image_url": {"url": config.image_url},
                "role": "first_frame"
            })
        content.append({"type": "text", "text": prompt})
        
        payload = {
            "model": "doubao-seedance-1-5-pro-251215",
            "content": content,
            "duration": int(config.duration),
            "ratio": "16:9",
            "resolution": "720p",
            "generate_audio": True,
            "watermark": False,
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS[VideoProvider.COZE],
                headers=headers, json=payload, timeout=120
            )
            response.raise_for_status()
            result = response.json()
            video_url = result.get("video_url")
            if video_url:
                return self._download_video(video_url, config.save_path)
        except Exception as e:
            unreal.log_error(f"Coze API error: {e}")
        return None
    
    def _generate_with_runway(self, config: VideoGenerationConfig, prompt: str) -> Optional[str]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gen3", "prompt": prompt,
            "duration": config.duration,
            "resolution": f"{config.resolution[0]}x{config.resolution[1]}",
            "motion": config.motion_intensity,
        }
        if config.image_url:
            payload["image"] = config.image_url
            payload["mode"] = "image_to_video"
        else:
            payload["mode"] = "text_to_video"
        
        try:
            response = requests.post(
                self.API_ENDPOINTS[VideoProvider.RUNWAY],
                headers=headers, json=payload, timeout=60
            )
            response.raise_for_status()
            result = response.json()
            job_id = result.get("id")
            return self._poll_and_download(job_id, config.save_path, VideoProvider.RUNWAY)
        except Exception as e:
            unreal.log_error(f"Runway API error: {e}")
        return None
    
    def _generate_with_pika(self, config: VideoGenerationConfig, prompt: str) -> Optional[str]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "prompt": prompt,
            "duration": int(config.duration * 24),
            "motion_strength": config.motion_intensity,
        }
        if config.image_url:
            payload["image_url"] = config.image_url
        
        try:
            response = requests.post(
                self.API_ENDPOINTS[VideoProvider.PIKA],
                headers=headers, json=payload, timeout=60
            )
            response.raise_for_status()
            result = response.json()
            job_id = result.get("task_id")
            return self._poll_and_download(job_id, config.save_path, VideoProvider.PIKA)
        except Exception as e:
            unreal.log_error(f"Pika API error: {e}")
        return None
    
    def _generate_with_svd(self, config: VideoGenerationConfig, prompt: str) -> Optional[str]:
        payload = {
            "prompt": prompt,
            "num_frames": int(config.duration * config.fps),
            "width": config.resolution[0],
            "height": config.resolution[1],
            "motion_bucket_id": int(config.motion_intensity * 255),
        }
        if config.image_url:
            payload["init_image"] = config.image_url
        
        try:
            response = requests.post(
                self.API_ENDPOINTS[VideoProvider.SVD],
                json=payload, timeout=600
            )
            response.raise_for_status()
            result = response.json()
            if "video_base64" in result:
                return self._save_base64_video(result["video_base64"], config.save_path)
        except Exception as e:
            unreal.log_error(f"SVD API error: {e}")
        return None
    
    def _poll_and_download(self, job_id: str, save_path: str, provider: VideoProvider, max_wait: int = 300) -> Optional[str]:
        status_url = f"{self.API_ENDPOINTS[provider]}/{job_id}/status"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                response = requests.get(status_url, headers=headers, timeout=30)
                response.raise_for_status()
                result = response.json()
                status = result.get("status")
                
                if status == "completed":
                    video_url = result.get("video_url") or result.get("output_url")
                    if video_url:
                        return self._download_video(video_url, save_path)
                    return None
                elif status == "failed":
                    unreal.log_error(f"Video generation failed: {result.get('error')}")
                    return None
                time.sleep(5)
            except Exception as e:
                unreal.log_warning(f"Status check error: {e}")
                time.sleep(5)
        return None
    
    def _download_video(self, url: str, save_path: str) -> Optional[str]:
        project_dir = unreal.SystemLibrary.get_project_directory()
        content_dir = os.path.join(project_dir, "Content")
        target_dir = os.path.join(content_dir, save_path.replace("/Game/", "").replace("/", os.sep))
        os.makedirs(target_dir, exist_ok=True)
        
        filename = f"video_{len(self.completed_videos):04d}.mp4"
        filepath = os.path.join(target_dir, filename)
        
        try:
            response = requests.get(url, timeout=120, stream=True)
            response.raise_for_status()
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            self.completed_videos.append(filepath)
            unreal.log(f"Video saved: {filepath}")
            return filepath
        except Exception as e:
            unreal.log_error(f"Video download error: {e}")
        return None
    
    def _save_base64_video(self, base64_data: str, save_path: str) -> Optional[str]:
        project_dir = unreal.SystemLibrary.get_project_directory()
        content_dir = os.path.join(project_dir, "Content")
        target_dir = os.path.join(content_dir, save_path.replace("/Game/", "").replace("/", os.sep))
        os.makedirs(target_dir, exist_ok=True)
        
        filename = f"video_{len(self.completed_videos):04d}.mp4"
        filepath = os.path.join(target_dir, filename)
        
        try:
            video_bytes = base64.b64decode(base64_data)
            with open(filepath, "wb") as f:
                f.write(video_bytes)
            self.completed_videos.append(filepath)
            return filepath
        except Exception as e:
            unreal.log_error(f"Video save error: {e}")
        return None


def generate_anime_video(prompt: str, style: str = "japanese", duration: float = 4.0, 
                         image_url: Optional[str] = None, provider: str = "coze",
                         api_key: Optional[str] = None) -> Optional[str]:
    config = VideoGenerationConfig(
        prompt=prompt, image_url=image_url, duration=duration,
        style=style, provider=VideoProvider(provider.lower())
    )
    generator = AIVideoGenerator(api_key=api_key)
    return generator.generate_video(config)


if __name__ == "__main__":
    config = VideoGenerationConfig(
        prompt="A anime girl walking through a cherry blossom forest",
        style="japanese", duration=4.0, provider=VideoProvider.COZE
    )
    generator = AIVideoGenerator(api_key="your_api_key")
    result = generator.generate_video(config)
    print(f"Generated: {result}")

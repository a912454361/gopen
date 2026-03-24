#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 AI 音频生成器
AI 配音 / 音效 / 背景音乐生成

功能：
- 文本转语音（TTS）
- AI 音效生成
- AI 背景音乐生成
- 音频风格转换
"""

import unreal
import json
import requests
import os
import base64
from typing import Optional, List, Dict
from dataclasses import dataclass
from enum import Enum


class AudioType(Enum):
    TTS = "tts"
    SFX = "sound_effect"
    MUSIC = "background_music"


@dataclass
class AudioGenerationConfig:
    text: str = ""
    audio_type: AudioType = AudioType.TTS
    voice: str = "zh_male"  # zh_male, zh_female, jp_male, jp_female
    emotion: str = "neutral"  # neutral, happy, sad, angry
    duration: float = 0.0  # 音乐时长
    style: str = "anime"  # anime, cinematic, ambient
    save_path: str = "/Game/Generated/Audio"


class AIAudioGenerator:
    VOICE_MAPPING = {
        "zh_male": "zh_male_m191_uranus_bigtts",
        "zh_female": "zh_female_vv_uranus_bigtts",
        "zh_boy": "saturn_zh_male_shuanglangshaonian_tob",
        "zh_girl": "saturn_zh_female_keainvsheng_tob",
        "zh_narrator": "zh_male_ruyayichen_saturn_bigtts",
        "jp_male": "jp_male_001",
        "jp_female": "jp_female_001",
    }
    
    API_ENDPOINTS = {
        "coze_tts": "https://api.coze.com/v1/audio/speech",
        "coze_music": "https://api.coze.com/v1/audio/music",
        "elevenlabs": "https://api.elevenlabs.io/v1/text-to-speech",
        "suno": "https://api.suno.ai/v1/generate",
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("AI_AUDIO_API_KEY", "")
        self.generated_audio: List[str] = []
    
    def generate(self, config: AudioGenerationConfig) -> Optional[str]:
        if config.audio_type == AudioType.TTS:
            return self._generate_tts(config)
        elif config.audio_type == AudioType.SFX:
            return self._generate_sfx(config)
        elif config.audio_type == AudioType.MUSIC:
            return self._generate_music(config)
        return None
    
    def _generate_tts(self, config: AudioGenerationConfig) -> Optional[str]:
        """文本转语音"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        voice_id = self.VOICE_MAPPING.get(config.voice, self.VOICE_MAPPING["zh_male"])
        
        payload = {
            "uid": "ue5_audio_generator",
            "text": config.text,
            "speaker": voice_id,
            "audio_format": "mp3",
            "sample_rate": 24000,
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["coze_tts"],
                headers=headers, json=payload, timeout=60
            )
            response.raise_for_status()
            result = response.json()
            audio_uri = result.get("audio_uri") or result.get("audio_url")
            if audio_uri:
                return self._download_audio(audio_uri, config.save_path, "tts")
        except Exception as e:
            unreal.log_error(f"TTS error: {e}")
        return None
    
    def _generate_sfx(self, config: AudioGenerationConfig) -> Optional[str]:
        """生成音效"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "prompt": config.text,
            "duration": max(config.duration, 5.0),
            "style": config.style,
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["coze_music"],
                headers=headers, json=payload, timeout=120
            )
            response.raise_for_status()
            result = response.json()
            audio_url = result.get("audio_url")
            if audio_url:
                return self._download_audio(audio_url, config.save_path, "sfx")
        except Exception as e:
            unreal.log_error(f"SFX generation error: {e}")
        return None
    
    def _generate_music(self, config: AudioGenerationConfig) -> Optional[str]:
        """生成背景音乐"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "prompt": config.text,
            "duration": max(config.duration, 30.0),
            "style": config.style,
            "genre": "anime_soundtrack",
        }
        
        try:
            response = requests.post(
                self.API_ENDPOINTS["suno"],
                headers=headers, json=payload, timeout=180
            )
            response.raise_for_status()
            result = response.json()
            audio_url = result.get("audio_url")
            if audio_url:
                return self._download_audio(audio_url, config.save_path, "music")
        except Exception as e:
            unreal.log_error(f"Music generation error: {e}")
        return None
    
    def _download_audio(self, url: str, save_path: str, prefix: str) -> Optional[str]:
        project_dir = unreal.SystemLibrary.get_project_directory()
        content_dir = os.path.join(project_dir, "Content")
        target_dir = os.path.join(content_dir, save_path.replace("/Game/", "").replace("/", os.sep))
        os.makedirs(target_dir, exist_ok=True)
        
        filename = f"{prefix}_{len(self.generated_audio):04d}.mp3"
        filepath = os.path.join(target_dir, filename)
        
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            with open(filepath, "wb") as f:
                f.write(response.content)
            self.generated_audio.append(filepath)
            unreal.log(f"Audio saved: {filepath}")
            return filepath
        except Exception as e:
            unreal.log_error(f"Audio download error: {e}")
        return None
    
    def import_to_ue5(self, audio_path: str) -> Optional[unreal.Object]:
        """导入音频到 UE5"""
        import_task = unreal.AssetImportTask()
        import_task.set_editor_property("filename", audio_path)
        import_task.set_editor_property("destination_path", "/Game/Generated/Sounds")
        import_task.set_editor_property("automated", True)
        import_task.set_editor_property("save", True)
        
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([import_task])
        
        imported = import_task.get_editor_property("imported_object_paths")
        if imported:
            return unreal.EditorAssetLibrary.load_asset(imported[0])
        return None


def generate_voice(text: str, voice: str = "zh_male", api_key: Optional[str] = None) -> Optional[str]:
    config = AudioGenerationConfig(text=text, voice=voice, audio_type=AudioType.TTS)
    generator = AIAudioGenerator(api_key=api_key)
    return generator.generate(config)


def generate_music(prompt: str, duration: float = 60.0, style: str = "anime", api_key: Optional[str] = None) -> Optional[str]:
    config = AudioGenerationConfig(text=prompt, duration=duration, style=style, audio_type=AudioType.MUSIC)
    generator = AIAudioGenerator(api_key=api_key)
    return generator.generate(config)


if __name__ == "__main__":
    generator = AIAudioGenerator(api_key="your_api_key")
    result = generator.generate(AudioGenerationConfig(
        text="欢迎来到奇幻世界",
        voice="zh_male",
        audio_type=AudioType.TTS
    ))
    print(f"Generated: {result}")

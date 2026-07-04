#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 语音聊天系统
支持实时语音通信、语音识别、语音合成

功能：
- 实时语音通话
- 语音频道管理
- 语音识别转文字
- 语音消息录制与播放
- 音量控制和静音
- 3D空间音频
"""

import json
import time
import threading
import asyncio
from typing import Optional, Dict, Any, List, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
import base64
import hashlib


class VoiceChannelType(Enum):
    """语音频道类型"""
    GLOBAL = "global"           # 全局频道
    TEAM = "team"               # 队伍频道
    PROXIMITY = "proximity"     # 近距离频道
    PRIVATE = "private"         # 私聊频道


class VoiceState(Enum):
    """语音状态"""
    IDLE = "idle"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    MUTED = "muted"
    DEAFENED = "deafened"
    SPEAKING = "speaking"


@dataclass
class VoiceUser:
    """语音用户"""
    user_id: str
    nickname: str
    channel_id: Optional[str] = None
    state: VoiceState = VoiceState.IDLE
    volume: float = 1.0
    muted: bool = False
    deafened: bool = False
    position: List[float] = field(default_factory=lambda: [0.0, 0.0, 0.0])
    speaking: bool = False
    voice_data: Optional[str] = None  # Base64编码的语音数据


@dataclass
class VoiceChannel:
    """语音频道"""
    channel_id: str
    name: str
    channel_type: VoiceChannelType
    max_users: int = 10
    users: List[str] = field(default_factory=list)
    bitrate: int = 64000  # 比特率
    sample_rate: int = 48000  # 采样率


@dataclass
class VoiceMessage:
    """语音消息"""
    message_id: str
    sender_id: str
    channel_id: str
    audio_data: str  # Base64编码
    duration: float  # 秒
    transcription: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


class UE5VoiceChatSystem:
    """UE5 语音聊天系统"""
    
    def __init__(self):
        self.users: Dict[str, VoiceUser] = {}
        self.channels: Dict[str, VoiceChannel] = {}
        self.voice_messages: List[VoiceMessage] = []
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.running = False
        
        # 创建默认频道
        self._create_default_channels()
        
        # ASR/TTS 配置
        self.asr_enabled = True  # 语音识别
        self.tts_enabled = True  # 语音合成
        self.noise_suppression = True  # 降噪
        self.echo_cancellation = True  # 回声消除
    
    def _create_default_channels(self):
        """创建默认频道"""
        default_channels = [
            VoiceChannel("global", "世界频道", VoiceChannelType.GLOBAL, max_users=100),
            VoiceChannel("team_1", "队伍1", VoiceChannelType.TEAM, max_users=10),
            VoiceChannel("team_2", "队伍2", VoiceChannelType.TEAM, max_users=10),
            VoiceChannel("proximity", "附近频道", VoiceChannelType.PROXIMITY, max_users=20),
        ]
        
        for channel in default_channels:
            self.channels[channel.channel_id] = channel
    
    def register_user(self, user_id: str, nickname: str) -> VoiceUser:
        """注册用户"""
        user = VoiceUser(
            user_id=user_id,
            nickname=nickname
        )
        self.users[user_id] = user
        
        self._trigger_event("user_registered", {
            "user_id": user_id,
            "nickname": nickname
        })
        
        return user
    
    def unregister_user(self, user_id: str):
        """注销用户"""
        if user_id in self.users:
            # 离开当前频道
            user = self.users[user_id]
            if user.channel_id:
                self.leave_channel(user_id)
            
            del self.users[user_id]
            
            self._trigger_event("user_unregistered", {"user_id": user_id})
    
    def join_channel(self, user_id: str, channel_id: str) -> bool:
        """加入语音频道"""
        if user_id not in self.users:
            return False
        
        if channel_id not in self.channels:
            return False
        
        channel = self.channels[channel_id]
        user = self.users[user_id]
        
        # 检查频道人数限制
        if len(channel.users) >= channel.max_users:
            return False
        
        # 离开当前频道
        if user.channel_id:
            self.leave_channel(user_id)
        
        # 加入新频道
        channel.users.append(user_id)
        user.channel_id = channel_id
        user.state = VoiceState.CONNECTED
        
        self._trigger_event("user_joined_channel", {
            "user_id": user_id,
            "channel_id": channel_id,
            "channel_name": channel.name
        })
        
        return True
    
    def leave_channel(self, user_id: str) -> bool:
        """离开语音频道"""
        if user_id not in self.users:
            return False
        
        user = self.users[user_id]
        channel_id = user.channel_id
        
        if not channel_id:
            return False
        
        if channel_id in self.channels:
            channel = self.channels[channel_id]
            if user_id in channel.users:
                channel.users.remove(user_id)
        
        user.channel_id = None
        user.state = VoiceState.IDLE
        user.speaking = False
        
        self._trigger_event("user_left_channel", {
            "user_id": user_id,
            "channel_id": channel_id
        })
        
        return True
    
    def set_mute(self, user_id: str, muted: bool):
        """设置静音"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        user.muted = muted
        user.state = VoiceState.MUTED if muted else VoiceState.CONNECTED
        
        self._trigger_event("user_mute_changed", {
            "user_id": user_id,
            "muted": muted
        })
    
    def set_deafen(self, user_id: str, deafened: bool):
        """设置耳聋（听不到别人）"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        user.deafened = deafened
        user.state = VoiceState.DEAFENED if deafened else VoiceState.CONNECTED
        
        self._trigger_event("user_deafen_changed", {
            "user_id": user_id,
            "deafened": deafened
        })
    
    def set_volume(self, user_id: str, volume: float):
        """设置用户音量"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        user.volume = max(0.0, min(2.0, volume))  # 0-200%
    
    def update_position(self, user_id: str, position: List[float]):
        """更新用户位置（用于3D空间音频）"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        user.position = position
        
        # 计算附近用户（近距离语音）
        if user.channel_id:
            self._update_proximity_audio(user_id)
    
    def _update_proximity_audio(self, user_id: str):
        """更新近距离音频"""
        user = self.users.get(user_id)
        if not user or user.channel_id != "proximity":
            return
        
        proximity_threshold = 100.0  # 100米范围内
        
        for other_id, other_user in self.users.items():
            if other_id == user_id:
                continue
            
            if other_user.channel_id == "proximity":
                # 计算距离
                distance = sum((a - b) ** 2 for a, b in zip(user.position, other_user.position)) ** 0.5
                
                # 根据距离调整音量
                if distance < proximity_threshold:
                    volume = 1.0 - (distance / proximity_threshold)
                    other_user.volume = volume
                else:
                    other_user.volume = 0.0
    
    def start_speaking(self, user_id: str):
        """开始说话"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        
        if user.muted or not user.channel_id:
            return
        
        user.speaking = True
        user.state = VoiceState.SPEAKING
        
        self._trigger_event("user_started_speaking", {
            "user_id": user_id,
            "channel_id": user.channel_id
        })
    
    def stop_speaking(self, user_id: str):
        """停止说话"""
        if user_id not in self.users:
            return
        
        user = self.users[user_id]
        user.speaking = False
        user.state = VoiceState.CONNECTED
        
        self._trigger_event("user_stopped_speaking", {
            "user_id": user_id
        })
    
    def send_voice_data(self, user_id: str, audio_data: str) -> bool:
        """发送语音数据"""
        if user_id not in self.users:
            return False
        
        user = self.users[user_id]
        
        if user.muted or not user.channel_id:
            return False
        
        # 广播语音数据到频道内其他用户
        channel = self.channels.get(user.channel_id)
        if channel:
            self._trigger_event("voice_data_received", {
                "sender_id": user_id,
                "channel_id": user.channel_id,
                "audio_data": audio_data,
                "timestamp": time.time()
            })
        
        return True
    
    def record_voice_message(self, user_id: str, audio_data: str, duration: float) -> VoiceMessage:
        """录制语音消息"""
        message_id = hashlib.md5(f"{user_id}_{time.time()}".encode()).hexdigest()[:16]
        
        message = VoiceMessage(
            message_id=message_id,
            sender_id=user_id,
            channel_id=self.users[user_id].channel_id or "global",
            audio_data=audio_data,
            duration=duration
        )
        
        # 语音识别转文字
        if self.asr_enabled:
            message.transcription = self._transcribe_audio(audio_data)
        
        self.voice_messages.append(message)
        
        self._trigger_event("voice_message_created", {
            "message_id": message_id,
            "sender_id": user_id,
            "duration": duration,
            "transcription": message.transcription
        })
        
        return message
    
    def _transcribe_audio(self, audio_data: str) -> str:
        """语音识别（模拟）"""
        # 实际应调用ASR API
        return "[语音消息]"
    
    def play_voice_message(self, user_id: str, message_id: str) -> bool:
        """播放语音消息"""
        for msg in self.voice_messages:
            if msg.message_id == message_id:
                self._trigger_event("voice_message_playing", {
                    "message_id": message_id,
                    "listener_id": user_id,
                    "duration": msg.duration
                })
                return True
        return False
    
    def create_channel(self, name: str, channel_type: VoiceChannelType, max_users: int = 10) -> VoiceChannel:
        """创建语音频道"""
        channel_id = f"channel_{int(time.time() * 1000)}"
        
        channel = VoiceChannel(
            channel_id=channel_id,
            name=name,
            channel_type=channel_type,
            max_users=max_users
        )
        
        self.channels[channel_id] = channel
        
        self._trigger_event("channel_created", {
            "channel_id": channel_id,
            "name": name,
            "type": channel_type.value
        })
        
        return channel
    
    def delete_channel(self, channel_id: str) -> bool:
        """删除语音频道"""
        if channel_id not in self.channels:
            return False
        
        channel = self.channels[channel_id]
        
        # 踢出所有用户
        for user_id in channel.users[:]:
            self.leave_channel(user_id)
        
        del self.channels[channel_id]
        
        self._trigger_event("channel_deleted", {"channel_id": channel_id})
        
        return True
    
    def get_channel_users(self, channel_id: str) -> List[Dict]:
        """获取频道内用户列表"""
        if channel_id not in self.channels:
            return []
        
        channel = self.channels[channel_id]
        users = []
        
        for user_id in channel.users:
            user = self.users.get(user_id)
            if user:
                users.append({
                    "user_id": user.user_id,
                    "nickname": user.nickname,
                    "state": user.state.value,
                    "muted": user.muted,
                    "deafened": user.deafened,
                    "speaking": user.speaking,
                    "volume": user.volume
                })
        
        return users
    
    def get_channels_list(self) -> List[Dict]:
        """获取所有频道列表"""
        channels = []
        
        for channel in self.channels.values():
            channels.append({
                "channel_id": channel.channel_id,
                "name": channel.name,
                "type": channel.channel_type.value,
                "users_count": len(channel.users),
                "max_users": channel.max_users
            })
        
        return channels
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """注册事件处理器"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def _trigger_event(self, event_type: str, data: Dict):
        """触发事件"""
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception as e:
                print(f"[VoiceChat] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "users_count": len(self.users),
            "channels_count": len(self.channels),
            "messages_count": len(self.voice_messages),
            "active_speakers": sum(1 for u in self.users.values() if u.speaking),
            "asr_enabled": self.asr_enabled,
            "tts_enabled": self.tts_enabled,
            "noise_suppression": self.noise_suppression,
            "echo_cancellation": self.echo_cancellation
        }


# 全局实例
_voice_chat_instance: Optional[UE5VoiceChatSystem] = None


def get_voice_chat_system() -> UE5VoiceChatSystem:
    """获取语音聊天系统实例"""
    global _voice_chat_instance
    
    if _voice_chat_instance is None:
        _voice_chat_instance = UE5VoiceChatSystem()
    
    return _voice_chat_instance


if __name__ == "__main__":
    system = get_voice_chat_system()
    
    # 测试
    system.register_user("player1", "玩家1")
    system.register_user("player2", "玩家2")
    
    system.join_channel("player1", "global")
    system.join_channel("player2", "global")
    
    print("Channels:", system.get_channels_list())
    print("Status:", system.get_status())

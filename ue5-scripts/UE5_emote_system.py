#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 表情动作系统
支持角色表情、动作动画、社交交互

功能：
- 预设表情动作库
- 自定义表情动作
- 同步播放给其他玩家
- 组合动作（表情+动作）
- 动作队列
- 快捷键绑定
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable, Set
from dataclasses import dataclass, field
from enum import Enum


class EmoteCategory(Enum):
    """表情动作类别"""
    GREETING = "greeting"       # 问候
    EMOTION = "emotion"         # 情绪
    ACTION = "action"           # 动作
    DANCE = "dance"             # 舞蹈
    SOCIAL = "social"           # 社交
    COMBAT = "combat"           # 战斗
    SPECIAL = "special"         # 特殊


class EmoteType(Enum):
    """表情动作类型"""
    EMOTE = "emote"             # 表情（面部）
    ACTION = "action"           # 动作（全身）
    DANCE = "dance"             # 舞蹈
    POSE = "pose"               # 姿势
    INTERACTIVE = "interactive" # 交互动作


@dataclass
class Emote:
    """表情动作定义"""
    emote_id: str
    name: str
    category: EmoteCategory
    emote_type: EmoteType
    animation_name: str             # UE动画名称
    duration: float = 3.0           # 持续时间（秒）
    loop: bool = False              # 是否循环
    interruptible: bool = True      # 是否可中断
    movement_enabled: bool = False  # 是否允许移动
    icon: Optional[str] = None      # 图标路径
    description: str = ""
    unlock_condition: Optional[str] = None  # 解锁条件
    premium: bool = False           # 是否VIP专属


@dataclass
class EmoteSlot:
    """表情动作槽位"""
    slot_id: int
    emote_id: str
    hotkey: Optional[str] = None
    cooldown: float = 0.0
    last_used: float = 0.0


@dataclass
class EmotePlayState:
    """表情动作播放状态"""
    user_id: str
    emote_id: str
    start_time: float
    end_time: float
    interrupted: bool = False
    target_user_id: Optional[str] = None  # 交互动作目标


class UE5EmoteSystem:
    """UE5 表情动作系统"""
    
    def __init__(self):
        # 表情库
        self.emotes: Dict[str, Emote] = {}
        
        # 用户解锁的表情
        self.user_emotes: Dict[str, Set[str]] = {}
        
        # 用户槽位配置
        self.user_slots: Dict[str, List[EmoteSlot]] = {}
        
        # 当前播放状态
        self.playing_states: Dict[str, EmotePlayState] = {}
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 初始化默认表情
        self._init_default_emotes()
        
        # 配置
        self.max_slots = 8
        self.default_slots = 4
        self.global_cooldown = 0.5
    
    def _init_default_emotes(self):
        """初始化默认表情动作库"""
        default_emotes = [
            # 问候类
            Emote("wave", "挥手", EmoteCategory.GREETING, EmoteType.EMOTE, 
                  "Wave_Anim", duration=2.0, icon="wave.png"),
            Emote("bow", "鞠躬", EmoteCategory.GREETING, EmoteType.ACTION, 
                  "Bow_Anim", duration=2.5, icon="bow.png"),
            Emote("salute", "敬礼", EmoteCategory.GREETING, EmoteType.ACTION, 
                  "Salute_Anim", duration=2.0, icon="salute.png"),
            
            # 情绪类
            Emote("happy", "开心", EmoteCategory.EMOTION, EmoteType.EMOTE, 
                  "Happy_Anim", duration=3.0, icon="happy.png"),
            Emote("sad", "伤心", EmoteCategory.EMOTION, EmoteType.EMOTE, 
                  "Sad_Anim", duration=3.0, icon="sad.png"),
            Emote("angry", "生气", EmoteCategory.EMOTION, EmoteType.EMOTE, 
                  "Angry_Anim", duration=2.5, icon="angry.png"),
            Emote("laugh", "大笑", EmoteCategory.EMOTION, EmoteType.EMOTE, 
                  "Laugh_Anim", duration=4.0, icon="laugh.png"),
            Emote("cry", "哭泣", EmoteCategory.EMOTION, EmoteType.EMOTE, 
                  "Cry_Anim", duration=3.0, icon="cry.png"),
            
            # 动作类
            Emote("sit", "坐下", EmoteCategory.ACTION, EmoteType.POSE, 
                  "Sit_Anim", duration=0, loop=True, movement_enabled=False, icon="sit.png"),
            Emote("sleep", "睡觉", EmoteCategory.ACTION, EmoteType.POSE, 
                  "Sleep_Anim", duration=0, loop=True, movement_enabled=False, icon="sleep.png"),
            Emote("jump", "跳跃", EmoteCategory.ACTION, EmoteType.ACTION, 
                  "Jump_Anim", duration=1.0, icon="jump.png"),
            Emote("clap", "鼓掌", EmoteCategory.ACTION, EmoteType.ACTION, 
                  "Clap_Anim", duration=3.0, icon="clap.png"),
            
            # 舞蹈类
            Emote("dance1", "舞蹈1", EmoteCategory.DANCE, EmoteType.DANCE, 
                  "Dance1_Anim", duration=10.0, loop=True, icon="dance1.png"),
            Emote("dance2", "舞蹈2", EmoteCategory.DANCE, EmoteType.DANCE, 
                  "Dance2_Anim", duration=8.0, loop=True, premium=True, icon="dance2.png"),
            Emote("dance3", "街舞", EmoteCategory.DANCE, EmoteType.DANCE, 
                  "Dance3_Anim", duration=12.0, loop=True, premium=True, icon="dance3.png"),
            
            # 社交类
            Emote("hug", "拥抱", EmoteCategory.SOCIAL, EmoteType.INTERACTIVE, 
                  "Hug_Anim", duration=4.0, icon="hug.png"),
            Emote("highfive", "击掌", EmoteCategory.SOCIAL, EmoteType.INTERACTIVE, 
                  "HighFive_Anim", duration=2.0, icon="highfive.png"),
            Emote("handshake", "握手", EmoteCategory.SOCIAL, EmoteType.INTERACTIVE, 
                  "Handshake_Anim", duration=3.0, icon="handshake.png"),
            
            # 战斗类
            Emote("victory", "胜利", EmoteCategory.COMBAT, EmoteType.ACTION, 
                  "Victory_Anim", duration=5.0, icon="victory.png"),
            Emote("defeat", "失败", EmoteCategory.COMBAT, EmoteType.ACTION, 
                  "Defeat_Anim", duration=4.0, icon="defeat.png"),
            Emote("taunt", "嘲讽", EmoteCategory.COMBAT, EmoteType.ACTION, 
                  "Taunt_Anim", duration=3.0, icon="taunt.png"),
            
            # 特殊类
            Emote("cheer", "欢呼", EmoteCategory.SPECIAL, EmoteType.ACTION, 
                  "Cheer_Anim", duration=4.0, icon="cheer.png"),
            Emote("meditate", "冥想", EmoteCategory.SPECIAL, EmoteType.POSE, 
                  "Meditate_Anim", duration=0, loop=True, movement_enabled=False, icon="meditate.png"),
        ]
        
        for emote in default_emotes:
            self.emotes[emote.emote_id] = emote
    
    def register_user(self, user_id: str, is_premium: bool = False):
        """注册用户"""
        if user_id not in self.user_emotes:
            # 解锁基础表情
            self.user_emotes[user_id] = set()
            
            for emote_id, emote in self.emotes.items():
                if not emote.premium or is_premium:
                    if emote.unlock_condition is None:
                        self.user_emotes[user_id].add(emote_id)
            
            # 初始化槽位
            self.user_slots[user_id] = []
            for i in range(self.default_slots):
                self.user_slots[user_id].append(EmoteSlot(slot_id=i, emote_id="", hotkey=str(i+1)))
            
            # 设置默认槽位
            default_emotes = ["wave", "happy", "dance1", "clap"]
            for i, emote_id in enumerate(default_emotes):
                if i < len(self.user_slots[user_id]):
                    self.user_slots[user_id][i].emote_id = emote_id
    
    def unlock_emote(self, user_id: str, emote_id: str) -> bool:
        """解锁表情动作"""
        if emote_id not in self.emotes:
            return False
        
        if user_id not in self.user_emotes:
            self.register_user(user_id)
        
        self.user_emotes[user_id].add(emote_id)
        
        self._trigger_event("emote_unlocked", {
            "user_id": user_id,
            "emote_id": emote_id,
            "emote_name": self.emotes[emote_id].name
        })
        
        return True
    
    def lock_emote(self, user_id: str, emote_id: str) -> bool:
        """锁定表情动作"""
        if user_id not in self.user_emotes:
            return False
        
        if emote_id in self.user_emotes[user_id]:
            self.user_emotes[user_id].discard(emote_id)
            return True
        
        return False
    
    def play_emote(self, user_id: str, emote_id: str, target_user_id: str = None) -> bool:
        """播放表情动作"""
        # 检查表情是否存在
        if emote_id not in self.emotes:
            return False
        
        emote = self.emotes[emote_id]
        
        # 检查用户是否解锁
        if user_id not in self.user_emotes or emote_id not in self.user_emotes[user_id]:
            return False
        
        # 检查冷却
        if not self._check_cooldown(user_id, emote_id):
            return False
        
        # 中断当前播放的表情
        if user_id in self.playing_states:
            self.stop_emote(user_id)
        
        # 创建播放状态
        now = time.time()
        end_time = now + emote.duration if emote.duration > 0 else float('inf')
        
        state = EmotePlayState(
            user_id=user_id,
            emote_id=emote_id,
            start_time=now,
            end_time=end_time,
            target_user_id=target_user_id
        )
        
        self.playing_states[user_id] = state
        
        # 更新冷却
        self._update_cooldown(user_id, emote_id)
        
        # 触发事件
        self._trigger_event("emote_played", {
            "user_id": user_id,
            "emote_id": emote_id,
            "emote_name": emote.name,
            "animation": emote.animation_name,
            "duration": emote.duration,
            "loop": emote.loop,
            "target_user_id": target_user_id
        })
        
        # 如果是交互动作，通知目标
        if target_user_id and emote.emote_type == EmoteType.INTERACTIVE:
            self._trigger_event("emote_interaction", {
                "user_id": user_id,
                "target_user_id": target_user_id,
                "emote_id": emote_id,
                "emote_name": emote.name
            })
        
        return True
    
    def stop_emote(self, user_id: str) -> bool:
        """停止当前表情动作"""
        if user_id not in self.playing_states:
            return False
        
        state = self.playing_states[user_id]
        emote = self.emotes.get(state.emote_id)
        
        if emote and not emote.interruptible:
            return False
        
        state.interrupted = True
        del self.playing_states[user_id]
        
        self._trigger_event("emote_stopped", {
            "user_id": user_id,
            "emote_id": state.emote_id,
            "interrupted": True
        })
        
        return True
    
    def set_emote_slot(self, user_id: str, slot_id: int, emote_id: str) -> bool:
        """设置槽位表情"""
        if user_id not in self.user_slots:
            return False
        
        if slot_id < 0 or slot_id >= len(self.user_slots[user_id]):
            return False
        
        # 检查表情是否解锁
        if emote_id and emote_id not in self.user_emotes.get(user_id, set()):
            return False
        
        self.user_slots[user_id][slot_id].emote_id = emote_id
        
        self._trigger_event("emote_slot_changed", {
            "user_id": user_id,
            "slot_id": slot_id,
            "emote_id": emote_id
        })
        
        return True
    
    def set_slot_hotkey(self, user_id: str, slot_id: int, hotkey: str) -> bool:
        """设置槽位快捷键"""
        if user_id not in self.user_slots:
            return False
        
        if slot_id < 0 or slot_id >= len(self.user_slots[user_id]):
            return False
        
        self.user_slots[user_id][slot_id].hotkey = hotkey
        
        return True
    
    def add_emote_slot(self, user_id: str) -> int:
        """添加新槽位"""
        if user_id not in self.user_slots:
            self.register_user(user_id)
        
        if len(self.user_slots[user_id]) >= self.max_slots:
            return -1
        
        slot_id = len(self.user_slots[user_id])
        self.user_slots[user_id].append(EmoteSlot(slot_id=slot_id, emote_id=""))
        
        return slot_id
    
    def get_user_emotes(self, user_id: str) -> List[Dict]:
        """获取用户可用表情列表"""
        emotes = []
        
        for emote_id in self.user_emotes.get(user_id, set()):
            emote = self.emotes.get(emote_id)
            if emote:
                emotes.append({
                    "emote_id": emote.emote_id,
                    "name": emote.name,
                    "category": emote.category.value,
                    "type": emote.emote_type.value,
                    "duration": emote.duration,
                    "loop": emote.loop,
                    "icon": emote.icon,
                    "description": emote.description
                })
        
        return emotes
    
    def get_user_slots(self, user_id: str) -> List[Dict]:
        """获取用户槽位配置"""
        slots = []
        
        for slot in self.user_slots.get(user_id, []):
            emote = self.emotes.get(slot.emote_id) if slot.emote_id else None
            slots.append({
                "slot_id": slot.slot_id,
                "emote_id": slot.emote_id,
                "emote_name": emote.name if emote else "",
                "icon": emote.icon if emote else "",
                "hotkey": slot.hotkey,
                "cooldown_remaining": max(0, slot.cooldown - (time.time() - slot.last_used))
            })
        
        return slots
    
    def get_playing_emotes(self) -> List[Dict]:
        """获取正在播放的表情列表"""
        now = time.time()
        playing = []
        
        for user_id, state in self.playing_states.items():
            emote = self.emotes.get(state.emote_id)
            if emote:
                remaining = state.end_time - now if state.end_time != float('inf') else -1
                
                # 检查是否已结束
                if remaining > 0 or emote.loop:
                    playing.append({
                        "user_id": user_id,
                        "emote_id": state.emote_id,
                        "emote_name": emote.name,
                        "animation": emote.animation_name,
                        "elapsed": now - state.start_time,
                        "remaining": remaining if remaining > 0 else -1,
                        "loop": emote.loop,
                        "target_user_id": state.target_user_id
                    })
                else:
                    # 自动结束
                    del self.playing_states[user_id]
        
        return playing
    
    def get_emote_list(self, category: EmoteCategory = None) -> List[Dict]:
        """获取表情动作列表"""
        emotes = []
        
        for emote in self.emotes.values():
            if category is None or emote.category == category:
                emotes.append({
                    "emote_id": emote.emote_id,
                    "name": emote.name,
                    "category": emote.category.value,
                    "type": emote.emote_type.value,
                    "duration": emote.duration,
                    "loop": emote.loop,
                    "icon": emote.icon,
                    "description": emote.description,
                    "premium": emote.premium
                })
        
        return emotes
    
    def _check_cooldown(self, user_id: str, emote_id: str) -> bool:
        """检查冷却"""
        # 全局冷却
        for slot in self.user_slots.get(user_id, []):
            if time.time() - slot.last_used < self.global_cooldown:
                return False
        
        # 槽位冷却
        for slot in self.user_slots.get(user_id, []):
            if slot.emote_id == emote_id:
                return time.time() - slot.last_used >= slot.cooldown
        
        return True
    
    def _update_cooldown(self, user_id: str, emote_id: str):
        """更新冷却"""
        for slot in self.user_slots.get(user_id, []):
            if slot.emote_id == emote_id:
                slot.last_used = time.time()
                break
    
    def create_custom_emote(self, name: str, animation_name: str, category: EmoteCategory,
                            emote_type: EmoteType, duration: float = 3.0,
                            icon: str = None, description: str = "") -> Emote:
        """创建自定义表情动作"""
        emote_id = f"custom_{hashlib.md5(f'{name}_{time.time()}'.encode()).hexdigest()[:8]}"
        
        emote = Emote(
            emote_id=emote_id,
            name=name,
            category=category,
            emote_type=emote_type,
            animation_name=animation_name,
            duration=duration,
            icon=icon,
            description=description
        )
        
        self.emotes[emote_id] = emote
        
        return emote
    
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
                print(f"[EmoteSystem] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "total_emotes": len(self.emotes),
            "users_count": len(self.user_emotes),
            "playing_count": len(self.playing_states),
            "max_slots": self.max_slots
        }


# 全局实例
_emote_instance: Optional[UE5EmoteSystem] = None


def get_emote_system() -> UE5EmoteSystem:
    """获取表情动作系统实例"""
    global _emote_instance
    
    if _emote_instance is None:
        _emote_instance = UE5EmoteSystem()
    
    return _emote_instance


if __name__ == "__main__":
    system = get_emote_system()
    
    # 测试
    system.register_user("player1", is_premium=True)
    system.register_user("player2")
    
    print("Available emotes:", len(system.get_emote_list()))
    print("User slots:", system.get_user_slots("player1"))
    
    system.play_emote("player1", "wave")
    system.play_emote("player2", "dance1")
    
    print("Playing:", system.get_playing_emotes())
    print("Status:", system.get_status())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 文字聊天系统
支持多种聊天频道、消息过滤、富文本

功能：
- 多频道聊天（世界、队伍、私聊、系统）
- 消息历史记录
- 富文本支持（表情、链接、物品链接）
- 敏感词过滤
- 聊天命令系统
- 消息撤回
- @提及功能
"""

import json
import time
import re
import hashlib
from typing import Optional, Dict, Any, List, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class ChatChannelType(Enum):
    """聊天频道类型"""
    WORLD = "world"         # 世界频道
    TEAM = "team"           # 队伍频道
    PRIVATE = "private"     # 私聊频道
    SYSTEM = "system"       # 系统频道
    GUILD = "guild"         # 公会频道
    TRADE = "trade"         # 交易频道


class MessageType(Enum):
    """消息类型"""
    TEXT = "text"
    EMOTE = "emote"
    ITEM_LINK = "item_link"
    SYSTEM = "system"
    COMMAND = "command"


@dataclass
class ChatUser:
    """聊天用户"""
    user_id: str
    nickname: str
    level: int = 1
    vip_level: int = 0
    guild_id: Optional[str] = None
    team_id: Optional[str] = None
    muted: bool = False
    muted_until: Optional[float] = None
    ban_reason: Optional[str] = None


@dataclass
class ChatMessage:
    """聊天消息"""
    message_id: str
    sender_id: str
    sender_name: str
    channel_type: ChatChannelType
    channel_id: str
    content: str
    message_type: MessageType = MessageType.TEXT
    target_id: Optional[str] = None  # 私聊目标或@目标
    mentions: List[str] = field(default_factory=list)
    extra_data: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    edited: bool = False
    edited_at: Optional[float] = None
    deleted: bool = False
    deleted_at: Optional[float] = None


@dataclass
class ChatChannel:
    """聊天频道"""
    channel_id: str
    name: str
    channel_type: ChatChannelType
    description: str = ""
    max_history: int = 100
    slow_mode: bool = False  # 慢速模式
    slow_mode_delay: int = 0  # 慢速模式延迟（秒）


class UE5TextChatSystem:
    """UE5 文字聊天系统"""
    
    def __init__(self):
        self.users: Dict[str, ChatUser] = {}
        self.channels: Dict[str, ChatChannel] = {}
        self.messages: List[ChatMessage] = []
        self.private_messages: Dict[str, List[ChatMessage]] = {}  # user_id -> messages
        
        # 敏感词列表
        self.banned_words: Set[str] = set()
        self._load_banned_words()
        
        # 命令处理器
        self.command_handlers: Dict[str, Callable] = {}
        self._register_default_commands()
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 表情映射
        self.emotes: Dict[str, str] = {
            ":)": "😊",
            ":(": "😢",
            ":D": "😀",
            ":P": "😛",
            ";)": "😉",
            "<3": "❤️",
            ":fire:": "🔥",
            ":star:": "⭐",
            ":sword:": "⚔️",
            ":shield:": "🛡️",
        }
        
        # 创建默认频道
        self._create_default_channels()
        
        # 配置
        self.max_message_length = 500
        self.max_history_per_channel = 100
        self.enable_profanity_filter = True
        self.enable_rich_text = True
    
    def _load_banned_words(self):
        """加载敏感词"""
        # 示例敏感词
        self.banned_words = {
            "傻逼", "操你", "妈的", "草泥马", "废物", "垃圾"
        }
    
    def _create_default_channels(self):
        """创建默认频道"""
        default_channels = [
            ChatChannel("world", "世界频道", ChatChannelType.WORLD, "全服玩家聊天", max_history=200),
            ChatChannel("team", "队伍频道", ChatChannelType.TEAM, "队伍成员聊天"),
            ChatChannel("guild", "公会频道", ChatChannelType.GUILD, "公会成员聊天"),
            ChatChannel("trade", "交易频道", ChatChannelType.TRADE, "物品交易信息", slow_mode=True, slow_mode_delay=30),
            ChatChannel("system", "系统公告", ChatChannelType.SYSTEM, "系统公告信息"),
        ]
        
        for channel in default_channels:
            self.channels[channel.channel_id] = channel
    
    def _register_default_commands(self):
        """注册默认命令"""
        self.command_handlers = {
            "/help": self._cmd_help,
            "/whisper": self._cmd_whisper,
            "/me": self._cmd_me,
            "/emote": self._cmd_emote,
            "/trade": self._cmd_trade,
            "/team": self._cmd_team,
            "/guild": self._cmd_guild,
            "/ignore": self._cmd_ignore,
            "/unignore": self._cmd_unignore,
            "/report": self._cmd_report,
            "/mute": self._cmd_mute,
            "/clear": self._cmd_clear,
        }
    
    def register_user(self, user_id: str, nickname: str, level: int = 1, vip_level: int = 0) -> ChatUser:
        """注册聊天用户"""
        user = ChatUser(
            user_id=user_id,
            nickname=nickname,
            level=level,
            vip_level=vip_level
        )
        self.users[user_id] = user
        
        # 发送系统消息
        self.send_system_message(f"欢迎 {nickname} 进入游戏！", "world")
        
        return user
    
    def unregister_user(self, user_id: str):
        """注销用户"""
        if user_id in self.users:
            user = self.users[user_id]
            del self.users[user_id]
            
            # 发送系统消息
            self.send_system_message(f"{user.nickname} 离开了游戏", "world")
    
    def send_message(self, sender_id: str, channel_id: str, content: str, 
                     message_type: MessageType = MessageType.TEXT) -> Optional[ChatMessage]:
        """发送聊天消息"""
        
        if sender_id not in self.users:
            return None
        
        user = self.users[sender_id]
        
        # 检查是否被禁言
        if user.muted:
            if user.muted_until and user.muted_until < time.time():
                user.muted = False
                user.muted_until = None
            else:
                return None
        
        # 检查消息长度
        if len(content) > self.max_message_length:
            content = content[:self.max_message_length]
        
        # 处理命令
        if content.startswith("/"):
            return self._process_command(sender_id, content)
        
        # 过滤敏感词
        if self.enable_profanity_filter:
            content = self._filter_profanity(content)
        
        # 解析表情
        content = self._parse_emotes(content)
        
        # 解析@提及
        mentions = self._parse_mentions(content)
        
        # 确定频道类型
        channel = self.channels.get(channel_id)
        channel_type = channel.channel_type if channel else ChatChannelType.WORLD
        
        # 创建消息
        message_id = hashlib.md5(f"{sender_id}_{time.time()}_{content}".encode()).hexdigest()[:16]
        
        message = ChatMessage(
            message_id=message_id,
            sender_id=sender_id,
            sender_name=user.nickname,
            channel_type=channel_type,
            channel_id=channel_id,
            content=content,
            message_type=message_type,
            mentions=mentions,
            extra_data={
                "level": user.level,
                "vip_level": user.vip_level
            }
        )
        
        # 保存消息
        self.messages.append(message)
        
        # 限制历史记录数量
        if len(self.messages) > 1000:
            self.messages = self.messages[-500:]
        
        # 触发事件
        self._trigger_event("message_sent", {
            "message_id": message_id,
            "sender_id": sender_id,
            "channel_id": channel_id,
            "content": content
        })
        
        # 通知被@的用户
        for mentioned_id in mentions:
            self._trigger_event("user_mentioned", {
                "mentioned_id": mentioned_id,
                "message_id": message_id,
                "sender_name": user.nickname
            })
        
        return message
    
    def send_private_message(self, sender_id: str, target_id: str, content: str) -> Optional[ChatMessage]:
        """发送私聊消息"""
        if sender_id not in self.users or target_id not in self.users:
            return None
        
        sender = self.users[sender_id]
        target = self.users[target_id]
        
        # 过滤敏感词
        if self.enable_profanity_filter:
            content = self._filter_profanity(content)
        
        # 解析表情
        content = self._parse_emotes(content)
        
        message_id = hashlib.md5(f"{sender_id}_{target_id}_{time.time()}".encode()).hexdigest()[:16]
        
        message = ChatMessage(
            message_id=message_id,
            sender_id=sender_id,
            sender_name=sender.nickname,
            channel_type=ChatChannelType.PRIVATE,
            channel_id=f"private_{sender_id}_{target_id}",
            content=content,
            message_type=MessageType.TEXT,
            target_id=target_id,
            extra_data={
                "target_name": target.nickname
            }
        )
        
        # 保存到双方的消息记录
        for user_id in [sender_id, target_id]:
            if user_id not in self.private_messages:
                self.private_messages[user_id] = []
            self.private_messages[user_id].append(message)
        
        self._trigger_event("private_message_sent", {
            "message_id": message_id,
            "sender_id": sender_id,
            "target_id": target_id,
            "content": content
        })
        
        return message
    
    def send_system_message(self, content: str, channel_id: str = "system") -> ChatMessage:
        """发送系统消息"""
        message_id = hashlib.md5(f"system_{time.time()}_{content}".encode()).hexdigest()[:16]
        
        message = ChatMessage(
            message_id=message_id,
            sender_id="system",
            sender_name="系统",
            channel_type=ChatChannelType.SYSTEM,
            channel_id=channel_id,
            content=content,
            message_type=MessageType.SYSTEM
        )
        
        self.messages.append(message)
        
        self._trigger_event("system_message", {
            "message_id": message_id,
            "content": content,
            "channel_id": channel_id
        })
        
        return message
    
    def edit_message(self, user_id: str, message_id: str, new_content: str) -> bool:
        """编辑消息"""
        for msg in self.messages:
            if msg.message_id == message_id and msg.sender_id == user_id:
                # 检查时间限制（5分钟内可编辑）
                if time.time() - msg.timestamp > 300:
                    return False
                
                msg.content = self._filter_profanity(new_content) if self.enable_profanity_filter else new_content
                msg.edited = True
                msg.edited_at = time.time()
                
                self._trigger_event("message_edited", {
                    "message_id": message_id,
                    "user_id": user_id,
                    "new_content": new_content
                })
                
                return True
        
        return False
    
    def delete_message(self, user_id: str, message_id: str, is_admin: bool = False) -> bool:
        """删除/撤回消息"""
        for msg in self.messages:
            if msg.message_id == message_id:
                # 检查权限：发送者或管理员
                if msg.sender_id == user_id or is_admin:
                    # 发送者撤回：2分钟内
                    if msg.sender_id == user_id and time.time() - msg.timestamp > 120:
                        return False
                    
                    msg.deleted = True
                    msg.deleted_at = time.time()
                    
                    self._trigger_event("message_deleted", {
                        "message_id": message_id,
                        "user_id": user_id,
                        "is_admin": is_admin
                    })
                    
                    return True
        
        return False
    
    def get_channel_history(self, channel_id: str, limit: int = 50) -> List[Dict]:
        """获取频道消息历史"""
        messages = []
        
        for msg in reversed(self.messages):
            if msg.channel_id == channel_id and not msg.deleted:
                messages.append(self._message_to_dict(msg))
                if len(messages) >= limit:
                    break
        
        return list(reversed(messages))
    
    def get_private_history(self, user_id: str, target_id: str, limit: int = 50) -> List[Dict]:
        """获取私聊历史"""
        messages = []
        channel_id = f"private_{min(user_id, target_id)}_{max(user_id, target_id)}"
        
        for msg in reversed(self.private_messages.get(user_id, [])):
            if target_id in [msg.sender_id, msg.target_id]:
                messages.append(self._message_to_dict(msg))
                if len(messages) >= limit:
                    break
        
        return list(reversed(messages))
    
    def mute_user(self, user_id: str, duration: int, reason: str, admin_id: str):
        """禁言用户"""
        if user_id not in self.users:
            return False
        
        user = self.users[user_id]
        user.muted = True
        user.muted_until = time.time() + duration
        user.ban_reason = reason
        
        self._trigger_event("user_muted", {
            "user_id": user_id,
            "duration": duration,
            "reason": reason,
            "admin_id": admin_id
        })
        
        return True
    
    def unmute_user(self, user_id: str, admin_id: str):
        """解除禁言"""
        if user_id not in self.users:
            return False
        
        user = self.users[user_id]
        user.muted = False
        user.muted_until = None
        user.ban_reason = None
        
        self._trigger_event("user_unmuted", {
            "user_id": user_id,
            "admin_id": admin_id
        })
        
        return True
    
    def _filter_profanity(self, content: str) -> str:
        """过滤敏感词"""
        for word in self.banned_words:
            content = content.replace(word, "*" * len(word))
        return content
    
    def _parse_emotes(self, content: str) -> str:
        """解析表情"""
        for emote_code, emote_char in self.emotes.items():
            content = content.replace(emote_code, emote_char)
        return content
    
    def _parse_mentions(self, content: str) -> List[str]:
        """解析@提及"""
        mentions = []
        pattern = r'@(\w+)'
        matches = re.findall(pattern, content)
        
        for match in matches:
            # 查找用户
            for user_id, user in self.users.items():
                if user.nickname == match:
                    mentions.append(user_id)
                    break
        
        return mentions
    
    def _process_command(self, sender_id: str, content: str) -> Optional[ChatMessage]:
        """处理命令"""
        parts = content.split(" ", 1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        
        handler = self.command_handlers.get(command)
        if handler:
            return handler(sender_id, args)
        
        return None
    
    # 命令处理器
    def _cmd_help(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """帮助命令"""
        help_text = """可用命令：
/help - 显示帮助
/w <玩家名> <消息> - 私聊
/me <动作> - 表达动作
/emote <表情> - 发送表情
/trade <消息> - 交易频道
/team <消息> - 队伍频道
/guild <消息> - 公会频道
/ignore <玩家名> - 屏蔽玩家
/report <玩家名> <原因> - 举报玩家"""
        return self.send_system_message(help_text, "system")
    
    def _cmd_whisper(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """私聊命令"""
        parts = args.split(" ", 1)
        if len(parts) < 2:
            return self.send_system_message("用法: /w <玩家名> <消息>", "system")
        
        target_name, message = parts
        
        # 查找目标用户
        for user_id, user in self.users.items():
            if user.nickname == target_name:
                return self.send_private_message(sender_id, user_id, message)
        
        return self.send_system_message(f"找不到玩家: {target_name}", "system")
    
    def _cmd_me(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """动作命令"""
        if not args:
            return None
        
        user = self.users.get(sender_id)
        if user:
            content = f"* {user.nickname} {args}"
            return self.send_message(sender_id, "world", content, MessageType.EMOTE)
        
        return None
    
    def _cmd_emote(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """表情命令"""
        if not args:
            return None
        
        return self.send_message(sender_id, "world", f":{args}:", MessageType.EMOTE)
    
    def _cmd_trade(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """交易频道"""
        if not args:
            return None
        return self.send_message(sender_id, "trade", args)
    
    def _cmd_team(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """队伍频道"""
        if not args:
            return None
        return self.send_message(sender_id, "team", args)
    
    def _cmd_guild(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """公会频道"""
        if not args:
            return None
        return self.send_message(sender_id, "guild", args)
    
    def _cmd_ignore(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """屏蔽玩家"""
        if not args:
            return self.send_system_message("用法: /ignore <玩家名>", "system")
        
        # 实现屏蔽逻辑
        return self.send_system_message(f"已屏蔽玩家: {args}", "system")
    
    def _cmd_unignore(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """取消屏蔽"""
        if not args:
            return self.send_system_message("用法: /unignore <玩家名>", "system")
        
        return self.send_system_message(f"已取消屏蔽: {args}", "system")
    
    def _cmd_report(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """举报玩家"""
        if not args:
            return self.send_system_message("用法: /report <玩家名> <原因>", "system")
        
        return self.send_system_message("举报已提交，我们会尽快处理", "system")
    
    def _cmd_mute(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """禁言命令（管理员）"""
        return self.send_system_message("权限不足", "system")
    
    def _cmd_clear(self, sender_id: str, args: str) -> Optional[ChatMessage]:
        """清除聊天记录"""
        self.messages.clear()
        return self.send_system_message("聊天记录已清除", "system")
    
    def _message_to_dict(self, msg: ChatMessage) -> Dict:
        """消息转字典"""
        return {
            "message_id": msg.message_id,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender_name,
            "channel_type": msg.channel_type.value,
            "channel_id": msg.channel_id,
            "content": msg.content,
            "message_type": msg.message_type.value,
            "target_id": msg.target_id,
            "mentions": msg.mentions,
            "extra_data": msg.extra_data,
            "timestamp": msg.timestamp,
            "edited": msg.edited,
            "deleted": msg.deleted
        }
    
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
                print(f"[TextChat] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "users_count": len(self.users),
            "channels_count": len(self.channels),
            "messages_count": len(self.messages),
            "muted_users": sum(1 for u in self.users.values() if u.muted),
            "banned_words_count": len(self.banned_words),
            "emotes_count": len(self.emotes)
        }


# 全局实例
_text_chat_instance: Optional[UE5TextChatSystem] = None


def get_text_chat_system() -> UE5TextChatSystem:
    """获取文字聊天系统实例"""
    global _text_chat_instance
    
    if _text_chat_instance is None:
        _text_chat_instance = UE5TextChatSystem()
    
    return _text_chat_instance


if __name__ == "__main__":
    system = get_text_chat_system()
    
    # 测试
    system.register_user("player1", "剑客小明", level=50, vip_level=2)
    system.register_user("player2", "法师小红", level=45)
    
    system.send_message("player1", "world", "大家好！我是小明")
    system.send_message("player2", "world", "你好小明！@剑客小明")
    system.send_private_message("player1", "player2", "私聊测试")
    
    print("History:", system.get_channel_history("world"))
    print("Status:", system.get_status())

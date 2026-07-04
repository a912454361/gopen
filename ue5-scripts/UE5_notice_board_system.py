#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 公告板系统
支持系统公告、活动公告、玩家公告

功能：
- 多种公告类型
- 公告优先级
- 已读未读状态
- 自动过期
- 置顶公告
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable, Set
from dataclasses import dataclass, field
from enum import Enum


class NoticeType(Enum):
    """公告类型"""
    SYSTEM = "system"           # 系统公告
    EVENT = "event"             # 活动公告
    UPDATE = "update"           # 更新公告
    MAINTENANCE = "maintenance" # 维护公告
    PLAYER = "player"           # 玩家公告
    GUILD = "guild"             # 公会公告


class NoticePriority(Enum):
    """公告优先级"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4
    EMERGENCY = 5


@dataclass
class Notice:
    """公告"""
    notice_id: str
    title: str
    content: str
    notice_type: NoticeType
    priority: NoticePriority
    author: str = "系统"
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    is_pinned: bool = False
    is_global: bool = True
    target_users: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    icon: Optional[str] = None
    created_at: float = field(default_factory=time.time)


@dataclass
class UserNoticeStatus:
    """用户公告状态"""
    user_id: str
    read_notices: Set[str] = field(default_factory=set)
    dismissed_notices: Set[str] = field(default_factory=set)


class UE5NoticeBoardSystem:
    """UE5 公告板系统"""
    
    def __init__(self):
        self.notices: Dict[str, Notice] = {}
        self.user_statuses: Dict[str, UserNoticeStatus] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.max_notices = 100
        self.default_expire_hours = 168
    
    def create_notice(self, title: str, content: str,
                      notice_type: NoticeType,
                      priority: NoticePriority = NoticePriority.NORMAL,
                      author: str = "系统",
                      duration_hours: float = None,
                      is_pinned: bool = False,
                      target_users: List[str] = None,
                      tags: List[str] = None,
                      icon: str = None) -> Notice:
        """创建公告"""
        notice_id = hashlib.md5(f"{title}_{time.time()}".encode()).hexdigest()[:12]
        
        end_time = None
        if duration_hours:
            end_time = time.time() + duration_hours * 3600
        elif notice_type != NoticeType.SYSTEM:
            end_time = time.time() + self.default_expire_hours * 3600
        
        notice = Notice(
            notice_id=notice_id,
            title=title,
            content=content,
            notice_type=notice_type,
            priority=priority,
            author=author,
            end_time=end_time,
            is_pinned=is_pinned,
            target_users=target_users or [],
            tags=tags or [],
            icon=icon
        )
        
        self.notices[notice_id] = notice
        
        # 限制数量
        if len(self.notices) > self.max_notices:
            self._remove_oldest()
        
        self._trigger_event("notice_created", {
            "notice_id": notice_id,
            "title": title,
            "type": notice_type.value
        })
        
        return notice
    
    def get_notices(self, user_id: str = None,
                    notice_type: NoticeType = None,
                    include_expired: bool = False) -> List[Dict]:
        """获取公告列表"""
        now = time.time()
        notices = []
        
        for notice in self.notices.values():
            # 过滤过期
            if not include_expired and notice.end_time and now > notice.end_time:
                continue
            
            # 过滤类型
            if notice_type and notice.notice_type != notice_type:
                continue
            
            # 过滤目标用户
            if not notice.is_global and user_id:
                if notice.target_users and user_id not in notice.target_users:
                    continue
            
            # 获取状态
            is_read = False
            is_dismissed = False
            if user_id and user_id in self.user_statuses:
                status = self.user_statuses[user_id]
                is_read = notice.notice_id in status.read_notices
                is_dismissed = notice.notice_id in status.dismissed_notices
            
            notices.append({
                "notice_id": notice.notice_id,
                "title": notice.title,
                "content": notice.content,
                "type": notice.notice_type.value,
                "priority": notice.priority.value,
                "author": notice.author,
                "is_pinned": notice.is_pinned,
                "is_read": is_read,
                "is_dismissed": is_dismissed,
                "tags": notice.tags,
                "icon": notice.icon,
                "start_time": notice.start_time,
                "end_time": notice.end_time
            })
        
        # 排序
        notices.sort(key=lambda x: (
            -x["is_pinned"],
            -x["priority"],
            -x["start_time"]
        ))
        
        return notices
    
    def mark_as_read(self, user_id: str, notice_id: str) -> bool:
        """标记已读"""
        if notice_id not in self.notices:
            return False
        
        if user_id not in self.user_statuses:
            self.user_statuses[user_id] = UserNoticeStatus(user_id)
        
        self.user_statuses[user_id].read_notices.add(notice_id)
        return True
    
    def dismiss_notice(self, user_id: str, notice_id: str) -> bool:
        """忽略公告"""
        if notice_id not in self.notices:
            return False
        
        if user_id not in self.user_statuses:
            self.user_statuses[user_id] = UserNoticeStatus(user_id)
        
        self.user_statuses[user_id].dismissed_notices.add(notice_id)
        return True
    
    def get_unread_count(self, user_id: str) -> int:
        """获取未读数量"""
        if user_id not in self.user_statuses:
            return len([n for n in self.notices.values() 
                       if not n.end_time or time.time() < n.end_time])
        
        status = self.user_statuses[user_id]
        count = 0
        
        for notice in self.notices.values():
            if notice.notice_id not in status.read_notices:
                if not notice.end_time or time.time() < notice.end_time:
                    count += 1
        
        return count
    
    def delete_notice(self, notice_id: str) -> bool:
        """删除公告"""
        if notice_id in self.notices:
            del self.notices[notice_id]
            return True
        return False
    
    def _remove_oldest(self):
        """移除最旧的公告"""
        non_pinned = [n for n in self.notices.values() if not n.is_pinned]
        if non_pinned:
            oldest = min(non_pinned, key=lambda x: x.created_at)
            del self.notices[oldest.notice_id]
    
    def register_event_handler(self, event_type: str, handler: Callable):
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def _trigger_event(self, event_type: str, data: Dict):
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception as e:
                print(f"[NoticeBoard] Event handler error: {e}")


def get_notice_board_system() -> UE5NoticeBoardSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5NoticeBoardSystem()
    return _instance


if __name__ == "__main__":
    system = get_notice_board_system()
    system.create_notice("系统维护公告", "服务器将于今晚维护", 
                         NoticeType.MAINTENANCE, NoticePriority.HIGH)
    print("Notices:", system.get_notices())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 世界UI系统合集
包含公告板、广告牌、贴花、名字标签、雷达等系统

功能：
- 公告板系统
- 广告牌系统
- 贴花系统
- 名字标签系统
- 雷达系统
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Callable, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


# ============== 公告板系统 ==============

class AnnouncementType(Enum):
    """公告类型"""
    SYSTEM = "system"
    EVENT = "event"
    UPDATE = "update"
    WARNING = "warning"
    MAINTENANCE = "maintenance"


@dataclass
class Announcement:
    """公告"""
    announcement_id: str
    title: str
    content: str
    announcement_type: AnnouncementType
    priority: int = 1
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    author: str = "系统"
    is_pinned: bool = False
    is_read: bool = False
    created_at: float = field(default_factory=time.time)


class UE5AnnouncementBoardSystem:
    """UE5 公告板系统"""
    
    def __init__(self):
        self.announcements: Dict[str, Announcement] = {}
        self.user_read_status: Dict[str, Set[str]] = {}  # user_id -> read_announcement_ids
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.max_announcements = 50
        self.auto_expire_hours = 168  # 7天
    
    def create_announcement(self, title: str, content: str,
                            announcement_type: AnnouncementType,
                            priority: int = 1, end_time: float = None,
                            author: str = "系统", is_pinned: bool = False) -> Announcement:
        """创建公告"""
        announcement_id = hashlib.md5(f"{title}_{time.time()}".encode()).hexdigest()[:12]
        
        announcement = Announcement(
            announcement_id=announcement_id,
            title=title,
            content=content,
            announcement_type=announcement_type,
            priority=priority,
            end_time=end_time,
            author=author,
            is_pinned=is_pinned
        )
        
        self.announcements[announcement_id] = announcement
        
        # 限制数量
        if len(self.announcements) > self.max_announcements:
            self._remove_oldest()
        
        self._trigger_event("announcement_created", {
            "announcement_id": announcement_id,
            "title": title,
            "type": announcement_type.value
        })
        
        return announcement
    
    def mark_as_read(self, user_id: str, announcement_id: str) -> bool:
        """标记公告已读"""
        if announcement_id not in self.announcements:
            return False
        
        if user_id not in self.user_read_status:
            self.user_read_status[user_id] = set()
        
        self.user_read_status[user_id].add(announcement_id)
        
        return True
    
    def get_announcements(self, user_id: str = None, include_expired: bool = False) -> List[Dict]:
        """获取公告列表"""
        now = time.time()
        announcements = []
        
        for ann in self.announcements.values():
            # 过滤过期公告
            if not include_expired and ann.end_time and now > ann.end_time:
                continue
            
            is_read = False
            if user_id:
                is_read = ann.announcement_id in self.user_read_status.get(user_id, set())
            
            announcements.append({
                "announcement_id": ann.announcement_id,
                "title": ann.title,
                "content": ann.content,
                "type": ann.announcement_type.value,
                "priority": ann.priority,
                "author": ann.author,
                "is_pinned": ann.is_pinned,
                "is_read": is_read,
                "start_time": ann.start_time,
                "end_time": ann.end_time,
                "created_at": ann.created_at
            })
        
        # 排序：置顶 > 优先级 > 时间
        announcements.sort(key=lambda x: (
            -x["is_pinned"],
            -x["priority"],
            -x["created_at"]
        ))
        
        return announcements
    
    def get_unread_count(self, user_id: str) -> int:
        """获取未读公告数量"""
        read_ids = self.user_read_status.get(user_id, set())
        count = 0
        
        for ann in self.announcements.values():
            if ann.announcement_id not in read_ids:
                if not ann.end_time or time.time() < ann.end_time:
                    count += 1
        
        return count
    
    def delete_announcement(self, announcement_id: str) -> bool:
        """删除公告"""
        if announcement_id in self.announcements:
            del self.announcements[announcement_id]
            return True
        return False
    
    def _remove_oldest(self):
        """移除最旧的公告"""
        if not self.announcements:
            return
        
        # 找到最旧且非置顶的公告
        oldest_id = None
        oldest_time = float('inf')
        
        for ann_id, ann in self.announcements.items():
            if not ann.is_pinned and ann.created_at < oldest_time:
                oldest_time = ann.created_at
                oldest_id = ann_id
        
        if oldest_id:
            del self.announcements[oldest_id]
    
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
                print(f"[Announcement] Event handler error: {e}")


# ============== 广告牌系统 ==============

class BillboardType(Enum):
    """广告牌类型"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    INTERACTIVE = "interactive"


@dataclass
class Billboard:
    """广告牌"""
    billboard_id: str
    name: str
    billboard_type: BillboardType
    content: str  # 文本内容或媒体URL
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: float = 1.0
    width: float = 2.0
    height: float = 1.0
    visible: bool = True
    face_camera: bool = True  # 是否面向摄像机
    fade_distance: float = 50.0  # 淡出距离
    created_at: float = field(default_factory=time.time)


class UE5BillboardSystem:
    """UE5 广告牌系统"""
    
    def __init__(self):
        self.billboards: Dict[str, Billboard] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
    
    def create_billboard(self, name: str, billboard_type: BillboardType,
                         content: str, position: Tuple[float, float, float],
                         **kwargs) -> Billboard:
        """创建广告牌"""
        billboard_id = hashlib.md5(f"{name}_{position}_{time.time()}".encode()).hexdigest()[:12]
        
        billboard = Billboard(
            billboard_id=billboard_id,
            name=name,
            billboard_type=billboard_type,
            content=content,
            position=position,
            rotation=kwargs.get("rotation", (0.0, 0.0, 0.0)),
            scale=kwargs.get("scale", 1.0),
            width=kwargs.get("width", 2.0),
            height=kwargs.get("height", 1.0),
            face_camera=kwargs.get("face_camera", True),
            fade_distance=kwargs.get("fade_distance", 50.0)
        )
        
        self.billboards[billboard_id] = billboard
        
        self._trigger_event("billboard_created", {
            "billboard_id": billboard_id,
            "name": name,
            "type": billboard_type.value
        })
        
        return billboard
    
    def update_content(self, billboard_id: str, content: str) -> bool:
        """更新广告牌内容"""
        if billboard_id not in self.billboards:
            return False
        
        self.billboards[billboard_id].content = content
        
        self._trigger_event("billboard_updated", {
            "billboard_id": billboard_id
        })
        
        return True
    
    def set_visible(self, billboard_id: str, visible: bool) -> bool:
        """设置可见性"""
        if billboard_id not in self.billboards:
            return False
        
        self.billboards[billboard_id].visible = visible
        return True
    
    def remove_billboard(self, billboard_id: str) -> bool:
        """移除广告牌"""
        if billboard_id in self.billboards:
            del self.billboards[billboard_id]
            return True
        return False
    
    def get_billboards_in_range(self, camera_position: Tuple[float, float, float]) -> List[Dict]:
        """获取范围内的广告牌"""
        billboards = []
        
        for billboard in self.billboards.values():
            if not billboard.visible:
                continue
            
            distance = math.sqrt(
                (billboard.position[0] - camera_position[0]) ** 2 +
                (billboard.position[1] - camera_position[1]) ** 2 +
                (billboard.position[2] - camera_position[2]) ** 2
            )
            
            if distance <= billboard.fade_distance * 1.5:
                opacity = 1.0 if distance <= billboard.fade_distance else \
                         1.0 - (distance - billboard.fade_distance) / (billboard.fade_distance * 0.5)
                
                billboards.append({
                    "billboard_id": billboard.billboard_id,
                    "name": billboard.name,
                    "type": billboard.billboard_type.value,
                    "content": billboard.content,
                    "position": billboard.position,
                    "rotation": billboard.rotation,
                    "scale": billboard.scale,
                    "width": billboard.width,
                    "height": billboard.height,
                    "face_camera": billboard.face_camera,
                    "distance": distance,
                    "opacity": opacity
                })
        
        return billboards
    
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
                print(f"[Billboard] Event handler error: {e}")


# ============== 贴花系统 ==============

class DecalType(Enum):
    """贴花类型"""
    FOOTPRINT = "footprint"
    BLOOD = "blood"
    BURN = "burn"
    MAGIC = "magic"
    MARKER = "marker"
    CUSTOM = "custom"


@dataclass
class Decal:
    """贴花"""
    decal_id: str
    decal_type: DecalType
    texture_path: str
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    color: str = "#FFFFFF"
    opacity: float = 1.0
    lifetime: Optional[float] = None  # 持续时间（None为永久）
    fade_out: bool = True  # 是否淡出
    created_at: float = field(default_factory=time.time)


class UE5DecalSystem:
    """UE5 贴花系统"""
    
    def __init__(self):
        self.decals: Dict[str, Decal] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.max_decals = 500
        self.default_lifetime = 30.0
    
    def create_decal(self, decal_type: DecalType, texture_path: str,
                     position: Tuple[float, float, float], **kwargs) -> Decal:
        """创建贴花"""
        decal_id = hashlib.md5(f"{decal_type.value}_{position}_{time.time()}".encode()).hexdigest()[:12]
        
        decal = Decal(
            decal_id=decal_id,
            decal_type=decal_type,
            texture_path=texture_path,
            position=position,
            rotation=kwargs.get("rotation", (0.0, 0.0, 0.0)),
            scale=kwargs.get("scale", (1.0, 1.0, 1.0)),
            color=kwargs.get("color", "#FFFFFF"),
            opacity=kwargs.get("opacity", 1.0),
            lifetime=kwargs.get("lifetime", self.default_lifetime),
            fade_out=kwargs.get("fade_out", True)
        )
        
        self.decals[decal_id] = decal
        
        # 限制数量
        if len(self.decals) > self.max_decals:
            self._remove_oldest()
        
        return decal
    
    def update_opacity(self, decal_id: str, opacity: float) -> bool:
        """更新透明度"""
        if decal_id not in self.decals:
            return False
        
        self.decals[decal_id].opacity = max(0.0, min(1.0, opacity))
        return True
    
    def remove_decal(self, decal_id: str) -> bool:
        """移除贴花"""
        if decal_id in self.decals:
            del self.decals[decal_id]
            return True
        return False
    
    def update(self, delta_time: float) -> List[str]:
        """更新贴花（返回过期的贴花ID列表）"""
        now = time.time()
        expired = []
        
        for decal_id, decal in self.decals.items():
            if decal.lifetime is None:
                continue
            
            elapsed = now - decal.created_at
            
            if elapsed >= decal.lifetime:
                expired.append(decal_id)
            elif decal.fade_out:
                # 淡出效果
                fade_start = decal.lifetime * 0.8
                if elapsed > fade_start:
                    decal.opacity = 1.0 - (elapsed - fade_start) / (decal.lifetime - fade_start)
        
        # 移除过期贴花
        for decal_id in expired:
            del self.decals[decal_id]
        
        return expired
    
    def get_decals_in_range(self, camera_position: Tuple[float, float, float],
                            max_distance: float = 50.0) -> List[Dict]:
        """获取范围内的贴花"""
        decals = []
        
        for decal in self.decals.values():
            distance = math.sqrt(
                (decal.position[0] - camera_position[0]) ** 2 +
                (decal.position[1] - camera_position[1]) ** 2 +
                (decal.position[2] - camera_position[2]) ** 2
            )
            
            if distance <= max_distance and decal.opacity > 0:
                decals.append({
                    "decal_id": decal.decal_id,
                    "decal_type": decal.decal_type.value,
                    "texture_path": decal.texture_path,
                    "position": decal.position,
                    "rotation": decal.rotation,
                    "scale": decal.scale,
                    "color": decal.color,
                    "opacity": decal.opacity
                })
        
        return decals
    
    def clear_all(self):
        """清除所有贴花"""
        self.decals.clear()
    
    def _remove_oldest(self):
        """移除最旧的贴花"""
        if not self.decals:
            return
        
        oldest_id = min(self.decals.keys(), key=lambda x: self.decals[x].created_at)
        del self.decals[oldest_id]
    
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
                print(f"[Decal] Event handler error: {e}")


# ============== 名字标签系统 ==============

@dataclass
class NameTag:
    """名字标签"""
    tag_id: str
    target_id: str
    display_name: str
    title: Optional[str] = None
    guild: Optional[str] = None
    level: int = 1
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    offset: Tuple[float, float, float] = (0.0, 2.0, 0.0)
    color: str = "#FFFFFF"
    background_color: str = "#000000"
    background_opacity: float = 0.5
    visible: bool = True
    show_level: bool = True
    show_guild: bool = True
    show_title: bool = True
    scale_with_distance: bool = True
    max_distance: float = 100.0


class UE5NameTagSystem:
    """UE5 名字标签系统"""
    
    def __init__(self):
        self.name_tags: Dict[str, NameTag] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.default_max_distance = 100.0
        self.min_scale = 0.3
        self.max_scale = 1.0
    
    def create_name_tag(self, target_id: str, display_name: str, **kwargs) -> NameTag:
        """创建名字标签"""
        tag_id = hashlib.md5(f"{target_id}_nametag".encode()).hexdigest()[:12]
        
        tag = NameTag(
            tag_id=tag_id,
            target_id=target_id,
            display_name=display_name,
            title=kwargs.get("title"),
            guild=kwargs.get("guild"),
            level=kwargs.get("level", 1),
            position=kwargs.get("position", (0.0, 0.0, 0.0)),
            offset=kwargs.get("offset", (0.0, 2.0, 0.0)),
            color=kwargs.get("color", "#FFFFFF"),
            background_color=kwargs.get("background_color", "#000000"),
            visible=kwargs.get("visible", True)
        )
        
        self.name_tags[tag_id] = tag
        
        return tag
    
    def update_position(self, target_id: str, position: Tuple[float, float, float]) -> bool:
        """更新位置"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.position = position
                return True
        return False
    
    def set_visible(self, target_id: str, visible: bool) -> bool:
        """设置可见性"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.visible = visible
                return True
        return False
    
    def update_display_name(self, target_id: str, display_name: str) -> bool:
        """更新显示名称"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.display_name = display_name
                return True
        return False
    
    def remove_name_tag(self, target_id: str) -> bool:
        """移除名字标签"""
        to_remove = [tag_id for tag_id, tag in self.name_tags.items() if tag.target_id == target_id]
        
        for tag_id in to_remove:
            del self.name_tags[tag_id]
        
        return len(to_remove) > 0
    
    def get_name_tags_in_view(self, camera_position: Tuple[float, float, float]) -> List[Dict]:
        """获取视野内的名字标签"""
        tags = []
        
        for tag in self.name_tags.values():
            if not tag.visible:
                continue
            
            distance = math.sqrt(
                (tag.position[0] - camera_position[0]) ** 2 +
                (tag.position[1] - camera_position[1]) ** 2 +
                (tag.position[2] - camera_position[2]) ** 2
            )
            
            if distance <= tag.max_distance:
                # 计算缩放
                scale = 1.0
                if tag.scale_with_distance:
                    scale = max(self.min_scale, min(self.max_scale, 50.0 / max(distance, 1.0)))
                
                tags.append({
                    "tag_id": tag.tag_id,
                    "target_id": tag.target_id,
                    "display_name": tag.display_name,
                    "title": tag.title,
                    "guild": tag.guild,
                    "level": tag.level,
                    "position": tag.position,
                    "offset": tag.offset,
                    "color": tag.color,
                    "background_color": tag.background_color,
                    "background_opacity": tag.background_opacity,
                    "distance": distance,
                    "scale": scale
                })
        
        return tags
    
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
                print(f"[NameTag] Event handler error: {e}")


# ============== 雷达系统 ==============

class RadarBlipType(Enum):
    """雷达光点类型"""
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    ITEM = "item"
    QUEST = "quest"
    WAYPOINT = "waypoint"
    DANGER = "danger"


@dataclass
class RadarBlip:
    """雷达光点"""
    blip_id: str
    blip_type: RadarBlipType
    target_id: str
    name: str
    position: Tuple[float, float, float]
    icon: Optional[str] = None
    color: str = "#FFFFFF"
    pulse: bool = False
    visible: bool = True


@dataclass
class RadarConfig:
    """雷达配置"""
    range: float = 100.0
    zoom: float = 1.0
    show_players: bool = True
    show_enemies: bool = True
    show_npcs: bool = True
    show_items: bool = True
    show_quests: bool = True


class UE5RadarSystem:
    """UE5 雷达系统"""
    
    def __init__(self):
        self.blips: Dict[str, RadarBlip] = {}
        self.radar_configs: Dict[str, RadarConfig] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.default_range = 100.0
    
    def create_blip(self, blip_type: RadarBlipType, target_id: str,
                    name: str, position: Tuple[float, float, float],
                    **kwargs) -> RadarBlip:
        """创建雷达光点"""
        blip_id = hashlib.md5(f"{blip_type.value}_{target_id}".encode()).hexdigest()[:12]
        
        blip = RadarBlip(
            blip_id=blip_id,
            blip_type=blip_type,
            target_id=target_id,
            name=name,
            position=position,
            icon=kwargs.get("icon"),
            color=kwargs.get("color", self._get_default_color(blip_type)),
            pulse=kwargs.get("pulse", False),
            visible=kwargs.get("visible", True)
        )
        
        self.blips[blip_id] = blip
        
        return blip
    
    def update_blip_position(self, blip_id: str, position: Tuple[float, float, float]) -> bool:
        """更新光点位置"""
        if blip_id not in self.blips:
            return False
        
        self.blips[blip_id].position = position
        return True
    
    def remove_blip(self, blip_id: str) -> bool:
        """移除光点"""
        if blip_id in self.blips:
            del self.blips[blip_id]
            return True
        return False
    
    def get_radar_data(self, user_id: str,
                       player_position: Tuple[float, float, float],
                       player_rotation: float) -> Dict:
        """获取雷达数据"""
        config = self.radar_configs.get(user_id, RadarConfig())
        
        blips = []
        
        for blip in self.blips.values():
            if not blip.visible:
                continue
            
            # 过滤类型
            if blip.blip_type == RadarBlipType.PLAYER and not config.show_players:
                continue
            if blip.blip_type == RadarBlipType.ENEMY and not config.show_enemies:
                continue
            if blip.blip_type == RadarBlipType.NPC and not config.show_npcs:
                continue
            if blip.blip_type == RadarBlipType.ITEM and not config.show_items:
                continue
            if blip.blip_type == RadarBlipType.QUEST and not config.show_quests:
                continue
            
            # 计算相对位置
            rel_x = blip.position[0] - player_position[0]
            rel_z = blip.position[2] - player_position[2]
            
            distance = math.sqrt(rel_x ** 2 + rel_z ** 2)
            
            if distance <= config.range:
                # 考虑玩家朝向旋转
                angle = math.radians(player_rotation)
                rotated_x = rel_x * math.cos(angle) - rel_z * math.sin(angle)
                rotated_z = rel_x * math.sin(angle) + rel_z * math.cos(angle)
                
                # 归一化到雷达范围
                normalized_x = rotated_x / config.range
                normalized_z = rotated_z / config.range
                
                blips.append({
                    "blip_id": blip.blip_id,
                    "blip_type": blip.blip_type.value,
                    "name": blip.name,
                    "relative_x": normalized_x,
                    "relative_z": normalized_z,
                    "distance": distance,
                    "icon": blip.icon,
                    "color": blip.color,
                    "pulse": blip.pulse
                })
        
        return {
            "range": config.range,
            "zoom": config.zoom,
            "blips": blips
        }
    
    def set_radar_config(self, user_id: str, **kwargs):
        """设置雷达配置"""
        if user_id not in self.radar_configs:
            self.radar_configs[user_id] = RadarConfig()
        
        config = self.radar_configs[user_id]
        
        if "range" in kwargs:
            config.range = kwargs["range"]
        if "zoom" in kwargs:
            config.zoom = kwargs["zoom"]
        if "show_players" in kwargs:
            config.show_players = kwargs["show_players"]
        if "show_enemies" in kwargs:
            config.show_enemies = kwargs["show_enemies"]
        if "show_npcs" in kwargs:
            config.show_npcs = kwargs["show_npcs"]
    
    def _get_default_color(self, blip_type: RadarBlipType) -> str:
        """获取默认颜色"""
        colors = {
            RadarBlipType.PLAYER: "#00FF00",
            RadarBlipType.ENEMY: "#FF0000",
            RadarBlipType.NPC: "#FFFF00",
            RadarBlipType.ITEM: "#00FFFF",
            RadarBlipType.QUEST: "#FFD700",
            RadarBlipType.WAYPOINT: "#FFFFFF",
            RadarBlipType.DANGER: "#FF4444"
        }
        return colors.get(blip_type, "#FFFFFF")
    
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
                print(f"[Radar] Event handler error: {e}")


# 全局实例
_announcement_instance: Optional[UE5AnnouncementBoardSystem] = None
_billboard_instance: Optional[UE5BillboardSystem] = None
_decal_instance: Optional[UE5DecalSystem] = None
_nametag_instance: Optional[UE5NameTagSystem] = None
_radar_instance: Optional[UE5RadarSystem] = None


def get_announcement_system() -> UE5AnnouncementBoardSystem:
    global _announcement_instance
    if _announcement_instance is None:
        _announcement_instance = UE5AnnouncementBoardSystem()
    return _announcement_instance


def get_billboard_system() -> UE5BillboardSystem:
    global _billboard_instance
    if _billboard_instance is None:
        _billboard_instance = UE5BillboardSystem()
    return _billboard_instance


def get_decal_system() -> UE5DecalSystem:
    global _decal_instance
    if _decal_instance is None:
        _decal_instance = UE5DecalSystem()
    return _decal_instance


def get_nametag_system() -> UE5NameTagSystem:
    global _nametag_instance
    if _nametag_instance is None:
        _nametag_instance = UE5NameTagSystem()
    return _nametag_instance


def get_radar_system() -> UE5RadarSystem:
    global _radar_instance
    if _radar_instance is None:
        _radar_instance = UE5RadarSystem()
    return _radar_instance


if __name__ == "__main__":
    print("All world UI systems initialized successfully!")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 小地图图标系统
支持动态图标、追踪标记、区域显示

功能：
- 多种图标类型（玩家、NPC、敌人、资源、任务等）
- 动态图标更新
- 追踪标记
- 区域范围显示
- 图标层级管理
- 自定义图标
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Callable, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum


class MinimapIconType(Enum):
    """小地图图标类型"""
    PLAYER = "player"
    TEAMMATE = "teammate"
    ENEMY = "enemy"
    NPC = "npc"
    QUEST = "quest"
    RESOURCE = "resource"
    COLLECTIBLE = "collectible"
    WAYPOINT = "waypoint"
    DANGER = "danger"
    SAFEZONE = "safezone"
    POI = "poi"  # Point of Interest
    CUSTOM = "custom"


class IconSize(Enum):
    """图标大小"""
    SMALL = 12
    MEDIUM = 16
    LARGE = 20
    XLARGE = 24


class IconPriority(Enum):
    """图标优先级"""
    LOW = 1
    NORMAL = 5
    HIGH = 10
    CRITICAL = 15


@dataclass
class MinimapIcon:
    """小地图图标"""
    icon_id: str
    icon_type: MinimapIconType
    name: str
    position: Tuple[float, float, float]  # x, y, z
    icon_name: str = ""  # UE图标资源名称
    color: str = "#FFFFFF"
    size: IconSize = IconSize.MEDIUM
    priority: IconPriority = IconPriority.NORMAL
    visible: bool = True
    fade_distance: float = 0.0  # 淡出距离（0表示不淡出）
    pulse: bool = False  # 是否脉冲闪烁
    rotation: float = 0.0  # 旋转角度
    owner_id: Optional[str] = None  # 所有者ID
    trackable: bool = True  # 是否可追踪
    description: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)


@dataclass
class TrackingMarker:
    """追踪标记"""
    marker_id: str
    icon_id: str
    owner_id: str
    distance: float = 0.0
    direction: float = 0.0  # 角度（0-360）
    active: bool = True
    created_at: float = field(default_factory=time.time)


@dataclass
class ZoneArea:
    """区域范围"""
    zone_id: str
    name: str
    center: Tuple[float, float, float]
    radius: float
    color: str = "#FF0000"
    opacity: float = 0.3
    visible: bool = True
    priority: int = 1


class UE5MinimapIconSystem:
    """UE5 小地图图标系统"""
    
    def __init__(self):
        # 图标存储
        self.icons: Dict[str, MinimapIcon] = {}
        
        # 追踪标记
        self.tracking_markers: Dict[str, TrackingMarker] = {}
        
        # 区域范围
        self.zones: Dict[str, ZoneArea] = {}
        
        # 用户追踪列表
        self.user_tracking: Dict[str, Set[str]] = {}
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 配置
        self.map_center = (0.0, 0.0, 0.0)
        self.map_size = 1000.0  # 地图大小
        self.max_tracking = 10  # 最大追踪数量
        self.icon_update_interval = 0.1  # 图标更新间隔（秒）
        
        # 预设图标颜色
        self.icon_colors = {
            MinimapIconType.PLAYER: "#00FF00",
            MinimapIconType.TEAMMATE: "#00FFFF",
            MinimapIconType.ENEMY: "#FF0000",
            MinimapIconType.NPC: "#FFFF00",
            MinimapIconType.QUEST: "#FFD700",
            MinimapIconType.RESOURCE: "#00FF00",
            MinimapIconType.COLLECTIBLE: "#FF00FF",
            MinimapIconType.WAYPOINT: "#FFFFFF",
            MinimapIconType.DANGER: "#FF4444",
            MinimapIconType.SAFEZONE: "#44FF44",
            MinimapIconType.POI: "#8888FF",
        }
    
    def create_icon(self, icon_type: MinimapIconType, name: str,
                    position: Tuple[float, float, float],
                    icon_name: str = "",
                    size: IconSize = IconSize.MEDIUM,
                    priority: IconPriority = IconPriority.NORMAL,
                    owner_id: str = None,
                    **kwargs) -> MinimapIcon:
        """创建小地图图标"""
        icon_id = hashlib.md5(f"{icon_type.value}_{name}_{time.time()}".encode()).hexdigest()[:12]
        
        # 设置默认颜色
        color = kwargs.get('color', self.icon_colors.get(icon_type, "#FFFFFF"))
        
        icon = MinimapIcon(
            icon_id=icon_id,
            icon_type=icon_type,
            name=name,
            position=position,
            icon_name=icon_name or icon_type.value,
            color=color,
            size=size,
            priority=priority,
            owner_id=owner_id,
            **kwargs
        )
        
        self.icons[icon_id] = icon
        
        self._trigger_event("icon_created", {
            "icon_id": icon_id,
            "icon_type": icon_type.value,
            "name": name,
            "position": position
        })
        
        return icon
    
    def update_icon_position(self, icon_id: str, position: Tuple[float, float, float]) -> bool:
        """更新图标位置"""
        if icon_id not in self.icons:
            return False
        
        icon = self.icons[icon_id]
        icon.position = position
        icon.updated_at = time.time()
        
        self._trigger_event("icon_position_updated", {
            "icon_id": icon_id,
            "position": position
        })
        
        return True
    
    def update_icon_visibility(self, icon_id: str, visible: bool) -> bool:
        """更新图标可见性"""
        if icon_id not in self.icons:
            return False
        
        self.icons[icon_id].visible = visible
        self.icons[icon_id].updated_at = time.time()
        
        return True
    
    def update_icon_rotation(self, icon_id: str, rotation: float) -> bool:
        """更新图标旋转"""
        if icon_id not in self.icons:
            return False
        
        self.icons[icon_id].rotation = rotation
        self.icons[icon_id].updated_at = time.time()
        
        return True
    
    def set_icon_pulse(self, icon_id: str, pulse: bool) -> bool:
        """设置图标脉冲效果"""
        if icon_id not in self.icons:
            return False
        
        self.icons[icon_id].pulse = pulse
        return True
    
    def remove_icon(self, icon_id: str) -> bool:
        """移除图标"""
        if icon_id not in self.icons:
            return False
        
        # 移除相关追踪标记
        if icon_id in self.tracking_markers:
            del self.tracking_markers[icon_id]
        
        del self.icons[icon_id]
        
        self._trigger_event("icon_removed", {"icon_id": icon_id})
        
        return True
    
    def get_icons_in_range(self, center: Tuple[float, float, float],
                           radius: float,
                           icon_types: List[MinimapIconType] = None) -> List[Dict]:
        """获取范围内的图标"""
        icons = []
        
        for icon in self.icons.values():
            # 检查类型过滤
            if icon_types and icon.icon_type not in icon_types:
                continue
            
            # 检查可见性
            if not icon.visible:
                continue
            
            # 计算距离
            distance = math.sqrt(
                (icon.position[0] - center[0]) ** 2 +
                (icon.position[1] - center[1]) ** 2
            )
            
            if distance <= radius:
                icons.append({
                    "icon_id": icon.icon_id,
                    "icon_type": icon.icon_type.value,
                    "name": icon.name,
                    "position": icon.position,
                    "distance": distance,
                    "icon_name": icon.icon_name,
                    "color": icon.color,
                    "size": icon.size.value,
                    "priority": icon.priority.value,
                    "pulse": icon.pulse,
                    "rotation": icon.rotation,
                    "fade_distance": icon.fade_distance,
                    "trackable": icon.trackable
                })
        
        # 按优先级排序
        icons.sort(key=lambda x: x["priority"], reverse=True)
        
        return icons
    
    def track_icon(self, user_id: str, icon_id: str) -> bool:
        """追踪图标"""
        if icon_id not in self.icons:
            return False
        
        icon = self.icons[icon_id]
        
        if not icon.trackable:
            return False
        
        # 初始化用户追踪列表
        if user_id not in self.user_tracking:
            self.user_tracking[user_id] = set()
        
        # 检查追踪数量限制
        if len(self.user_tracking[user_id]) >= self.max_tracking and icon_id not in self.user_tracking[user_id]:
            return False
        
        self.user_tracking[user_id].add(icon_id)
        
        # 创建追踪标记
        marker = TrackingMarker(
            marker_id=f"track_{user_id}_{icon_id}",
            icon_id=icon_id,
            owner_id=user_id
        )
        
        self.tracking_markers[marker.marker_id] = marker
        
        self._trigger_event("icon_tracked", {
            "user_id": user_id,
            "icon_id": icon_id,
            "icon_name": icon.name
        })
        
        return True
    
    def untrack_icon(self, user_id: str, icon_id: str) -> bool:
        """取消追踪"""
        if user_id not in self.user_tracking:
            return False
        
        if icon_id not in self.user_tracking[user_id]:
            return False
        
        self.user_tracking[user_id].discard(icon_id)
        
        # 移除追踪标记
        marker_id = f"track_{user_id}_{icon_id}"
        if marker_id in self.tracking_markers:
            del self.tracking_markers[marker_id]
        
        return True
    
    def get_tracked_icons(self, user_id: str, user_position: Tuple[float, float, float]) -> List[Dict]:
        """获取用户追踪的图标"""
        tracked = []
        
        for icon_id in self.user_tracking.get(user_id, set()):
            icon = self.icons.get(icon_id)
            if icon:
                # 计算距离和方向
                distance = math.sqrt(
                    (icon.position[0] - user_position[0]) ** 2 +
                    (icon.position[1] - user_position[1]) ** 2
                )
                
                # 计算方向角度
                dx = icon.position[0] - user_position[0]
                dy = icon.position[1] - user_position[1]
                direction = math.degrees(math.atan2(dy, dx))
                if direction < 0:
                    direction += 360
                
                tracked.append({
                    "icon_id": icon.icon_id,
                    "name": icon.name,
                    "icon_type": icon.icon_type.value,
                    "position": icon.position,
                    "distance": distance,
                    "direction": direction,
                    "icon_name": icon.icon_name,
                    "color": icon.color
                })
        
        # 按距离排序
        tracked.sort(key=lambda x: x["distance"])
        
        return tracked
    
    def create_zone(self, name: str, center: Tuple[float, float, float],
                    radius: float, color: str = "#FF0000",
                    opacity: float = 0.3) -> ZoneArea:
        """创建区域范围"""
        zone_id = hashlib.md5(f"{name}_{center}_{radius}".encode()).hexdigest()[:12]
        
        zone = ZoneArea(
            zone_id=zone_id,
            name=name,
            center=center,
            radius=radius,
            color=color,
            opacity=opacity
        )
        
        self.zones[zone_id] = zone
        
        self._trigger_event("zone_created", {
            "zone_id": zone_id,
            "name": name,
            "center": center,
            "radius": radius
        })
        
        return zone
    
    def remove_zone(self, zone_id: str) -> bool:
        """移除区域"""
        if zone_id not in self.zones:
            return False
        
        del self.zones[zone_id]
        
        return True
    
    def get_zones_in_range(self, position: Tuple[float, float, float]) -> List[Dict]:
        """获取范围内的区域"""
        zones = []
        
        for zone in self.zones.values():
            if not zone.visible:
                continue
            
            distance = math.sqrt(
                (zone.center[0] - position[0]) ** 2 +
                (zone.center[1] - position[1]) ** 2
            )
            
            # 检查是否在区域内
            in_zone = distance <= zone.radius
            
            zones.append({
                "zone_id": zone.zone_id,
                "name": zone.name,
                "center": zone.center,
                "radius": zone.radius,
                "color": zone.color,
                "opacity": zone.opacity,
                "distance": distance,
                "in_zone": in_zone
            })
        
        return zones
    
    def create_waypoint(self, user_id: str, position: Tuple[float, float, float],
                        name: str = "自定义标记") -> MinimapIcon:
        """创建自定义路径点"""
        return self.create_icon(
            icon_type=MinimapIconType.WAYPOINT,
            name=name,
            position=position,
            size=IconSize.MEDIUM,
            priority=IconPriority.HIGH,
            owner_id=user_id,
            color="#FFFFFF",
            pulse=True
        )
    
    def create_quest_marker(self, quest_id: str, position: Tuple[float, float, float],
                            name: str) -> MinimapIcon:
        """创建任务标记"""
        return self.create_icon(
            icon_type=MinimapIconType.QUEST,
            name=name,
            position=position,
            icon_name="quest_marker",
            size=IconSize.LARGE,
            priority=IconPriority.HIGH,
            color="#FFD700",
            pulse=True,
            metadata={"quest_id": quest_id}
        )
    
    def create_danger_zone(self, center: Tuple[float, float, float],
                           radius: float, name: str = "危险区域") -> ZoneArea:
        """创建危险区域"""
        return self.create_zone(
            name=name,
            center=center,
            radius=radius,
            color="#FF0000",
            opacity=0.4
        )
    
    def create_safe_zone(self, center: Tuple[float, float, float],
                         radius: float, name: str = "安全区域") -> ZoneArea:
        """创建安全区域"""
        return self.create_zone(
            name=name,
            center=center,
            radius=radius,
            color="#00FF00",
            opacity=0.3
        )
    
    def get_minimap_data(self, user_id: str, user_position: Tuple[float, float, float],
                         radius: float = 200.0) -> Dict:
        """获取小地图数据"""
        # 获取范围内的图标
        icons = self.get_icons_in_range(user_position, radius)
        
        # 获取追踪的图标
        tracked = self.get_tracked_icons(user_id, user_position)
        
        # 获取区域
        zones = self.get_zones_in_range(user_position)
        
        # 计算相对坐标
        for icon in icons:
            icon["relative_x"] = icon["position"][0] - user_position[0]
            icon["relative_y"] = icon["position"][1] - user_position[1]
        
        for zone in zones:
            zone["relative_x"] = zone["center"][0] - user_position[0]
            zone["relative_y"] = zone["center"][1] - user_position[1]
        
        return {
            "user_position": user_position,
            "radius": radius,
            "icons": icons,
            "tracked": tracked,
            "zones": zones,
            "map_center": self.map_center,
            "map_size": self.map_size
        }
    
    def batch_update_positions(self, updates: List[Dict]) -> int:
        """批量更新图标位置"""
        count = 0
        
        for update in updates:
            icon_id = update.get("icon_id")
            position = update.get("position")
            
            if icon_id and position:
                if self.update_icon_position(icon_id, tuple(position)):
                    count += 1
        
        return count
    
    def clear_user_icons(self, user_id: str):
        """清除用户创建的所有图标"""
        to_remove = []
        
        for icon_id, icon in self.icons.items():
            if icon.owner_id == user_id:
                to_remove.append(icon_id)
        
        for icon_id in to_remove:
            self.remove_icon(icon_id)
    
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
                print(f"[Minimap] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "total_icons": len(self.icons),
            "tracked_count": len(self.tracking_markers),
            "zones_count": len(self.zones),
            "users_tracking": len(self.user_tracking)
        }


# 全局实例
_minimap_instance: Optional[UE5MinimapIconSystem] = None


def get_minimap_system() -> UE5MinimapIconSystem:
    """获取小地图系统实例"""
    global _minimap_instance
    
    if _minimap_instance is None:
        _minimap_instance = UE5MinimapIconSystem()
    
    return _minimap_instance


if __name__ == "__main__":
    system = get_minimap_system()
    
    # 测试
    player_icon = system.create_icon(
        MinimapIconType.PLAYER,
        "玩家1",
        (100, 100, 0),
        owner_id="player1"
    )
    
    enemy_icon = system.create_icon(
        MinimapIconType.ENEMY,
        "敌人A",
        (150, 120, 0)
    )
    
    quest_marker = system.create_quest_marker(
        "quest_001",
        (200, 180, 0),
        "主线任务"
    )
    
    danger_zone = system.create_danger_zone((180, 150, 0), 50)
    
    system.track_icon("player1", quest_marker.icon_id)
    
    print("Minimap data:", system.get_minimap_data("player1", (100, 100, 0)))
    print("Status:", system.get_status())

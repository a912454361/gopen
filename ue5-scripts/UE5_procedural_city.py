#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 程序化城市生成系统
支持程序化建筑、道路、区域划分

功能：
- 程序化建筑生成
- 道路网络生成
- 区域划分（商业区、住宅区等）
- 建筑风格配置
- LOD支持
"""

import json
import random
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class BuildingType(Enum):
    """建筑类型"""
    RESIDENTIAL = "residential"  # 住宅
    COMMERCIAL = "commercial"    # 商业
    INDUSTRIAL = "industrial"    # 工业
    LANDMARK = "landmark"        # 地标
    PARK = "park"               # 公园
    ROAD = "road"               # 道路


class DistrictType(Enum):
    """区域类型"""
    DOWNTOWN = "downtown"       # 市中心
    RESIDENTIAL = "residential"  # 住宅区
    INDUSTRIAL = "industrial"    # 工业区
    COMMERCIAL = "commercial"    # 商业区
    PARK = "park"               # 公园区


@dataclass
class BuildingConfig:
    """建筑配置"""
    building_type: BuildingType
    min_height: float = 10.0
    max_height: float = 50.0
    min_width: float = 10.0
    max_width: float = 30.0
    min_depth: float = 10.0
    max_depth: float = 30.0
    style: str = "modern"
    density: float = 0.8


@dataclass
class RoadConfig:
    """道路配置"""
    road_type: str = "main"  # main, secondary, alley
    width: float = 10.0
    lanes: int = 2
    sidewalk_width: float = 2.0
    has_crosswalk: bool = True
    has_streetlights: bool = True


@dataclass
class Building:
    """建筑数据"""
    building_id: str
    building_type: BuildingType
    position: Tuple[float, float, float]
    rotation: float
    width: float
    depth: float
    height: float
    style: str
    district_id: str
    lod_level: int = 0
    mesh_path: Optional[str] = None
    materials: List[str] = field(default_factory=list)


@dataclass
class Road:
    """道路数据"""
    road_id: str
    road_type: str
    start_point: Tuple[float, float, float]
    end_point: Tuple[float, float, float]
    width: float
    lanes: int
    connected_buildings: List[str] = field(default_factory=list)


@dataclass
class District:
    """区域数据"""
    district_id: str
    district_type: DistrictType
    center: Tuple[float, float, float]
    radius: float
    buildings: List[str] = field(default_factory=list)
    roads: List[str] = field(default_factory=list)


class UE5ProceduralCitySystem:
    """UE5 程序化城市生成系统"""
    
    def __init__(self):
        self.buildings: Dict[str, Building] = {}
        self.roads: Dict[str, Road] = {}
        self.districts: Dict[str, District] = {}
        
        self.building_configs: Dict[BuildingType, BuildingConfig] = {}
        self.road_configs: Dict[str, RoadConfig] = {}
        
        # 初始化默认配置
        self._init_default_configs()
        
        # 生成参数
        self.grid_size = 50.0
        self.city_size = 1000.0
        self.random_seed = None
    
    def _init_default_configs(self):
        """初始化默认配置"""
        # 建筑配置
        self.building_configs = {
            BuildingType.RESIDENTIAL: BuildingConfig(
                BuildingType.RESIDENTIAL,
                min_height=15.0, max_height=40.0,
                min_width=12.0, max_width=25.0,
                density=0.7
            ),
            BuildingType.COMMERCIAL: BuildingConfig(
                BuildingType.COMMERCIAL,
                min_height=20.0, max_height=80.0,
                min_width=15.0, max_width=40.0,
                density=0.9
            ),
            BuildingType.INDUSTRIAL: BuildingConfig(
                BuildingType.INDUSTRIAL,
                min_height=10.0, max_height=30.0,
                min_width=20.0, max_width=50.0,
                density=0.6
            ),
            BuildingType.LANDMARK: BuildingConfig(
                BuildingType.LANDMARK,
                min_height=50.0, max_height=150.0,
                min_width=30.0, max_width=60.0,
                density=1.0
            ),
        }
        
        # 道路配置
        self.road_configs = {
            "main": RoadConfig("main", width=20.0, lanes=4),
            "secondary": RoadConfig("secondary", width=12.0, lanes=2),
            "alley": RoadConfig("alley", width=6.0, lanes=1),
        }
    
    def set_seed(self, seed: int):
        """设置随机种子"""
        self.random_seed = seed
        random.seed(seed)
    
    def generate_city(self, size: float = 1000.0, 
                     density: float = 0.7,
                     district_count: int = 5) -> Dict[str, Any]:
        """生成城市"""
        self.city_size = size
        
        # 生成区域
        self._generate_districts(district_count)
        
        # 生成道路网络
        self._generate_road_network()
        
        # 生成建筑
        self._generate_buildings(density)
        
        return self.get_city_data()
    
    def _generate_districts(self, count: int):
        """生成区域"""
        district_types = list(DistrictType)
        
        for i in range(count):
            district_id = f"district_{i}"
            
            # 随机位置
            angle = (2 * math.pi * i) / count
            distance = random.uniform(200, self.city_size * 0.4)
            
            center = (
                self.city_size / 2 + distance * math.cos(angle),
                0.0,
                self.city_size / 2 + distance * math.sin(angle)
            )
            
            district_type = district_types[i % len(district_types)]
            radius = random.uniform(100, 200)
            
            district = District(
                district_id=district_id,
                district_type=district_type,
                center=center,
                radius=radius
            )
            
            self.districts[district_id] = district
    
    def _generate_road_network(self):
        """生成道路网络"""
        # 主干道（网格）
        grid_count = int(self.city_size / self.grid_size)
        
        for i in range(grid_count):
            # 横向道路
            road_id = f"road_h_{i}"
            start = (0.0, 0.0, i * self.grid_size)
            end = (self.city_size, 0.0, i * self.grid_size)
            
            self.roads[road_id] = Road(
                road_id=road_id,
                road_type="main" if i % 3 == 0 else "secondary",
                start_point=start,
                end_point=end,
                width=20.0 if i % 3 == 0 else 12.0,
                lanes=4 if i % 3 == 0 else 2
            )
            
            # 纵向道路
            road_id = f"road_v_{i}"
            start = (i * self.grid_size, 0.0, 0.0)
            end = (i * self.grid_size, 0.0, self.city_size)
            
            self.roads[road_id] = Road(
                road_id=road_id,
                road_type="main" if i % 3 == 0 else "secondary",
                start_point=start,
                end_point=end,
                width=20.0 if i % 3 == 0 else 12.0,
                lanes=4 if i % 3 == 0 else 2
            )
    
    def _generate_buildings(self, density: float):
        """生成建筑"""
        building_id_counter = 0
        
        # 在每个网格中生成建筑
        grid_count = int(self.city_size / self.grid_size)
        
        for gx in range(grid_count):
            for gz in range(grid_count):
                # 检查是否在道路上
                if self._is_on_road(gx, gz):
                    continue
                
                # 随机决定是否生成建筑
                if random.random() > density:
                    continue
                
                # 确定建筑类型
                building_type = self._determine_building_type(gx, gz)
                config = self.building_configs[building_type]
                
                # 确定区域
                district_id = self._get_district_at(gx, gz)
                
                # 生成建筑
                building = self._create_building(
                    building_id_counter,
                    building_type,
                    config,
                    gx, gz,
                    district_id
                )
                
                self.buildings[building.building_id] = building
                building_id_counter += 1
    
    def _is_on_road(self, gx: int, gz: int) -> bool:
        """检查是否在道路上"""
        # 简化判断：网格边缘是道路
        return gx % 3 == 0 or gz % 3 == 0
    
    def _determine_building_type(self, gx: int, gz: int) -> BuildingType:
        """确定建筑类型"""
        # 根据位置和区域确定
        x = gx * self.grid_size
        z = gz * self.grid_size
        
        # 检查区域
        district = self._get_district_at(gx, gz)
        if district:
            district_type = self.districts[district].district_type
            if district_type == DistrictType.COMMERCIAL:
                return BuildingType.COMMERCIAL
            elif district_type == DistrictType.INDUSTRIAL:
                return BuildingType.INDUSTRIAL
            elif district_type == DistrictType.PARK:
                return BuildingType.PARK
        
        # 市中心区域
        center = self.city_size / 2
        distance_to_center = math.sqrt((x - center) ** 2 + (z - center) ** 2)
        
        if distance_to_center < 200:
            if random.random() < 0.3:
                return BuildingType.LANDMARK
            return BuildingType.COMMERCIAL
        
        return BuildingType.RESIDENTIAL
    
    def _get_district_at(self, gx: int, gz: int) -> Optional[str]:
        """获取位置所在的区域"""
        x = gx * self.grid_size
        z = gz * self.grid_size
        
        for district_id, district in self.districts.items():
            distance = math.sqrt(
                (x - district.center[0]) ** 2 +
                (z - district.center[2]) ** 2
            )
            if distance <= district.radius:
                return district_id
        
        return None
    
    def _create_building(self, counter: int, building_type: BuildingType,
                         config: BuildingConfig, gx: int, gz: int,
                         district_id: str) -> Building:
        """创建单个建筑"""
        building_id = f"building_{counter}"
        
        # 位置
        position = (
            gx * self.grid_size + random.uniform(5, self.grid_size - 5),
            0.0,
            gz * self.grid_size + random.uniform(5, self.grid_size - 5)
        )
        
        # 随机尺寸
        width = random.uniform(config.min_width, config.max_width)
        depth = random.uniform(config.min_depth, config.max_depth)
        height = random.uniform(config.min_height, config.max_height)
        
        # 随机旋转
        rotation = random.choice([0, 90, 180, 270])
        
        return Building(
            building_id=building_id,
            building_type=building_type,
            position=position,
            rotation=rotation,
            width=width,
            depth=depth,
            height=height,
            style=config.style,
            district_id=district_id
        )
    
    def get_city_data(self) -> Dict[str, Any]:
        """获取城市数据"""
        return {
            "city_size": self.city_size,
            "grid_size": self.grid_size,
            "districts_count": len(self.districts),
            "buildings_count": len(self.buildings),
            "roads_count": len(self.roads),
            "districts": [{
                "district_id": d.district_id,
                "type": d.district_type.value,
                "center": d.center,
                "radius": d.radius,
                "buildings_count": len(d.buildings)
            } for d in self.districts.values()],
            "buildings": [{
                "building_id": b.building_id,
                "type": b.building_type.value,
                "position": b.position,
                "rotation": b.rotation,
                "dimensions": (b.width, b.depth, b.height),
                "district": b.district_id
            } for b in list(self.buildings.values())[:100]],  # 限制返回数量
            "roads": [{
                "road_id": r.road_id,
                "type": r.road_type,
                "start": r.start_point,
                "end": r.end_point,
                "width": r.width
            } for r in self.roads.values()]
        }
    
    def get_buildings_in_area(self, center: Tuple[float, float, float],
                              radius: float) -> List[Dict]:
        """获取区域内的建筑"""
        buildings = []
        
        for building in self.buildings.values():
            distance = math.sqrt(
                (building.position[0] - center[0]) ** 2 +
                (building.position[2] - center[2]) ** 2
            )
            
            if distance <= radius:
                buildings.append({
                    "building_id": building.building_id,
                    "type": building.building_type.value,
                    "position": building.position,
                    "rotation": building.rotation,
                    "dimensions": (building.width, building.depth, building.height),
                    "distance": distance
                })
        
        return buildings
    
    def clear_city(self):
        """清除城市数据"""
        self.buildings.clear()
        self.roads.clear()
        self.districts.clear()


# 全局实例
_city_instance: Optional[UE5ProceduralCitySystem] = None


def get_procedural_city_system() -> UE5ProceduralCitySystem:
    """获取程序化城市系统实例"""
    global _city_instance
    if _city_instance is None:
        _city_instance = UE5ProceduralCitySystem()
    return _city_instance


if __name__ == "__main__":
    system = get_procedural_city_system()
    system.set_seed(12345)
    result = system.generate_city(size=1000, density=0.7, district_count=5)
    print(f"Generated city with {result['buildings_count']} buildings")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 天气与昼夜系统
支持动态天气变化、昼夜循环

功能：
- 天气系统（晴天、雨天、雪天、雷暴等）
- 昼夜循环
- 天气效果
- 时间影响游戏玩法
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class WeatherType(Enum):
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAIN = "rain"
    HEAVY_RAIN = "heavy_rain"
    SNOW = "snow"
    BLIZZARD = "blizzard"
    FOG = "fog"
    STORM = "storm"
    SANDSTORM = "sandstorm"


class TimeOfDay(Enum):
    DAWN = "dawn"
    MORNING = "morning"
    NOON = "noon"
    AFTERNOON = "afternoon"
    DUSK = "dusk"
    EVENING = "evening"
    MIDNIGHT = "midnight"


@dataclass
class WeatherState:
    """天气状态"""
    weather_type: WeatherType
    intensity: float  # 0.0 - 1.0
    wind_speed: float
    wind_direction: float  # degrees
    temperature: float
    humidity: float
    visibility: float
    start_time: float = 0.0
    duration: float = 3600.0


@dataclass
class DayNightCycle:
    """昼夜循环"""
    current_time: float  # 0-24 hours
    time_scale: float = 1.0  # 游戏时间流逝速度倍率
    sun_position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    moon_position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    ambient_light: float = 1.0


class UE5WeatherSystem:
    """UE5 天气系统"""
    
    def __init__(self):
        self.current_weather: Optional[WeatherState] = None
        self.weather_history: List[WeatherState] = []
        self.weather_effects: Dict[str, Dict] = {}
        self._init_weather_effects()
    
    def _init_weather_effects(self):
        """初始化天气效果"""
        self.weather_effects = {
            WeatherType.CLEAR.value: {
                "visibility": 1.0,
                "movement_speed_mod": 1.0,
                "damage_mod": 1.0,
                "particle_effect": None
            },
            WeatherType.RAIN.value: {
                "visibility": 0.7,
                "movement_speed_mod": 0.9,
                "damage_mod": 1.0,
                "particle_effect": "rain_particles"
            },
            WeatherType.HEAVY_RAIN.value: {
                "visibility": 0.4,
                "movement_speed_mod": 0.8,
                "damage_mod": 1.0,
                "particle_effect": "heavy_rain_particles"
            },
            WeatherType.SNOW.value: {
                "visibility": 0.6,
                "movement_speed_mod": 0.85,
                "damage_mod": 1.0,
                "particle_effect": "snow_particles"
            },
            WeatherType.BLIZZARD.value: {
                "visibility": 0.2,
                "movement_speed_mod": 0.6,
                "damage_mod": 0.9,
                "particle_effect": "blizzard_particles"
            },
            WeatherType.FOG.value: {
                "visibility": 0.3,
                "movement_speed_mod": 1.0,
                "damage_mod": 1.0,
                "particle_effect": "fog_particles"
            },
            WeatherType.STORM.value: {
                "visibility": 0.5,
                "movement_speed_mod": 0.7,
                "damage_mod": 1.1,
                "particle_effect": "storm_particles"
            },
            WeatherType.SANDSTORM.value: {
                "visibility": 0.2,
                "movement_speed_mod": 0.7,
                "damage_mod": 0.95,
                "particle_effect": "sandstorm_particles"
            }
        }
    
    def set_weather(self, weather_type: WeatherType, intensity: float = 0.5,
                    duration: float = 3600.0) -> WeatherState:
        """设置天气"""
        weather = WeatherState(
            weather_type=weather_type,
            intensity=intensity,
            wind_speed=random.uniform(0, 20) * intensity,
            wind_direction=random.uniform(0, 360),
            temperature=random.uniform(10, 30),
            humidity=random.uniform(0.3, 0.9) if weather_type in [WeatherType.RAIN, WeatherType.HEAVY_RAIN] else random.uniform(0.2, 0.5),
            visibility=self.weather_effects.get(weather_type.value, {}).get("visibility", 1.0) * intensity,
            start_time=time.time(),
            duration=duration
        )
        
        if self.current_weather:
            self.weather_history.append(self.current_weather)
        
        self.current_weather = weather
        return weather
    
    def get_weather_effects(self) -> Dict:
        """获取当前天气效果"""
        if not self.current_weather:
            return self.weather_effects.get(WeatherType.CLEAR.value, {})
        
        return self.weather_effects.get(self.current_weather.weather_type.value, {})


class UE5DayNightSystem:
    """UE5 昼夜系统"""
    
    def __init__(self):
        self.cycle = DayNightCycle()
        self.day_duration = 1200.0  # 20分钟一个游戏日
        self.season_offset = 0.0
    
    def update(self, delta_time: float):
        """更新昼夜循环"""
        game_time_delta = delta_time * self.cycle.time_scale * (24.0 / self.day_duration)
        self.cycle.current_time = (self.cycle.current_time + game_time_delta) % 24.0
        
        self._update_celestial_bodies()
        self._update_ambient_light()
    
    def _update_celestial_bodies(self):
        """更新天体位置"""
        time_rad = math.radians(self.cycle.current_time * 15)  # 15 degrees per hour
        
        # 太阳位置（东升西落）
        sun_angle = time_rad - math.pi / 2
        self.cycle.sun_position = (
            math.cos(sun_angle) * 1000,
            math.sin(sun_angle) * 1000,
            0
        )
        
        # 月亮位置（与太阳相反）
        moon_angle = sun_angle + math.pi
        self.cycle.moon_position = (
            math.cos(moon_angle) * 1000,
            math.sin(moon_angle) * 1000,
            0
        )
    
    def _update_ambient_light(self):
        """更新环境光"""
        hour = self.cycle.current_time
        
        # 白天光照强，夜晚光照弱
        if 6 <= hour < 7:  # 黎明
            self.cycle.ambient_light = 0.3 + 0.5 * (hour - 6)
        elif 7 <= hour < 18:  # 白天
            self.cycle.ambient_light = 0.8 + 0.2 * math.sin(math.pi * (hour - 7) / 11)
        elif 18 <= hour < 19:  # 黄昏
            self.cycle.ambient_light = 0.8 - 0.5 * (hour - 18)
        else:  # 夜晚
            self.cycle.ambient_light = 0.3
    
    def get_time_of_day(self) -> TimeOfDay:
        """获取时间段"""
        hour = self.cycle.current_time
        
        if 5 <= hour < 7:
            return TimeOfDay.DAWN
        elif 7 <= hour < 12:
            return TimeOfDay.MORNING
        elif 12 <= hour < 14:
            return TimeOfDay.NOON
        elif 14 <= hour < 18:
            return TimeOfDay.AFTERNOON
        elif 18 <= hour < 20:
            return TimeOfDay.DUSK
        elif 20 <= hour < 22:
            return TimeOfDay.EVENING
        else:
            return TimeOfDay.MIDNIGHT
    
    def get_current_state(self) -> Dict:
        """获取当前状态"""
        return {
            "game_time": self.cycle.current_time,
            "time_of_day": self.get_time_of_day().value,
            "ambient_light": self.cycle.ambient_light,
            "sun_position": self.cycle.sun_position,
            "moon_position": self.cycle.moon_position,
            "is_daytime": 6 <= self.cycle.current_time < 19
        }
    
    def set_time(self, hour: float):
        """设置时间"""
        self.cycle.current_time = hour % 24.0
        self._update_celestial_bodies()
        self._update_ambient_light()


# 全局实例
_weather_instance: Optional[UE5WeatherSystem] = None
_day_night_instance: Optional[UE5DayNightSystem] = None


def get_weather_system() -> UE5WeatherSystem:
    global _weather_instance
    if _weather_instance is None:
        _weather_instance = UE5WeatherSystem()
    return _weather_instance


def get_day_night_system() -> UE5DayNightSystem:
    global _day_night_instance
    if _day_night_instance is None:
        _day_night_instance = UE5DayNightSystem()
    return _day_night_instance


if __name__ == "__main__":
    weather = get_weather_system()
    day_night = get_day_night_system()
    
    weather.set_weather(WeatherType.RAIN, 0.7)
    print("Weather effects:", weather.get_weather_effects())
    
    print("Day/Night state:", day_night.get_current_state())

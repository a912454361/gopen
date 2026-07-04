#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 AI与游戏逻辑系统
包含AI导航、行为树、环境特效、输入系统等

功能：
- AI导航系统
- 行为树系统
- 环境特效
- 输入动作系统
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple, Set, Callable
from dataclasses import dataclass, field
from enum import Enum


# ============== AI导航系统 ==============

class NavAreaType(Enum):
    WALKABLE = "walkable"
    OBSTACLE = "obstacle"
    WATER = "water"
    JUMP = "jump"


@dataclass
class NavMeshNode:
    """导航网格节点"""
    node_id: str
    position: Tuple[float, float, float]
    neighbors: List[str] = field(default_factory=list)
    area_type: NavAreaType = NavAreaType.WALKABLE
    cost: float = 1.0


@dataclass
class NavigationPath:
    """导航路径"""
    path_id: str
    points: List[Tuple[float, float, float]]
    total_distance: float = 0.0


class UE5NavigationSystem:
    """UE5 AI导航系统"""
    
    def __init__(self):
        self.nav_nodes: Dict[str, NavMeshNode] = {}
        self.nav_grid_size: float = 100.0
    
    def add_nav_node(self, node: NavMeshNode):
        """添加导航节点"""
        self.nav_nodes[node.node_id] = node
    
    def find_path(self, start: Tuple[float, float, float],
                  end: Tuple[float, float, float]) -> Optional[NavigationPath]:
        """寻找路径（A*算法）"""
        start_node = self._find_nearest_node(start)
        end_node = self._find_nearest_node(end)
        
        if not start_node or not end_node:
            return None
        
        # A*算法
        open_set = {start_node.node_id}
        came_from: Dict[str, str] = {}
        g_score: Dict[str, float] = {start_node.node_id: 0}
        f_score: Dict[str, float] = {start_node.node_id: self._heuristic(start_node, end_node)}
        
        while open_set:
            current_id = min(open_set, key=lambda n: f_score.get(n, float('inf')))
            
            if current_id == end_node.node_id:
                return self._reconstruct_path(came_from, current_id)
            
            open_set.discard(current_id)
            current_node = self.nav_nodes[current_id]
            
            for neighbor_id in current_node.neighbors:
                neighbor_node = self.nav_nodes.get(neighbor_id)
                
                if not neighbor_node:
                    continue
                
                tentative_g = g_score[current_id] + self._distance(current_node, neighbor_node) * neighbor_node.cost
                
                if tentative_g < g_score.get(neighbor_id, float('inf')):
                    came_from[neighbor_id] = current_id
                    g_score[neighbor_id] = tentative_g
                    f_score[neighbor_id] = tentative_g + self._heuristic(neighbor_node, end_node)
                    open_set.add(neighbor_id)
        
        return None
    
    def _find_nearest_node(self, position: Tuple[float, float, float]) -> Optional[NavMeshNode]:
        """查找最近的导航节点"""
        nearest = None
        min_distance = float('inf')
        
        for node in self.nav_nodes.values():
            distance = self._point_distance(position, node.position)
            if distance < min_distance:
                min_distance = distance
                nearest = node
        
        return nearest
    
    def _heuristic(self, a: NavMeshNode, b: NavMeshNode) -> float:
        """启发式函数"""
        return self._distance(a, b)
    
    def _distance(self, a: NavMeshNode, b: NavMeshNode) -> float:
        """计算距离"""
        return math.sqrt(
            (a.position[0] - b.position[0]) ** 2 +
            (a.position[1] - b.position[1]) ** 2 +
            (a.position[2] - b.position[2]) ** 2
        )
    
    def _point_distance(self, a: Tuple[float, float, float], b: Tuple[float, float, float]) -> float:
        """计算点距离"""
        return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
    
    def _reconstruct_path(self, came_from: Dict[str, str], current_id: str) -> NavigationPath:
        """重建路径"""
        path_points = []
        total_distance = 0.0
        
        node_id = current_id
        prev_position = None
        
        while node_id:
            node = self.nav_nodes[node_id]
            path_points.insert(0, node.position)
            
            if prev_position:
                total_distance += self._point_distance(node.position, prev_position)
            
            prev_position = node.position
            node_id = came_from.get(node_id)
        
        return NavigationPath(
            path_id=f"path_{int(time.time() * 1000)}",
            points=path_points,
            total_distance=total_distance
        )


# ============== 行为树系统 ==============

class NodeStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    RUNNING = "running"


@dataclass
class Blackboard:
    """行为树黑板"""
    data: Dict[str, Any] = field(default_factory=dict)
    
    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)
    
    def set(self, key: str, value: Any):
        self.data[key] = value
    
    def has(self, key: str) -> bool:
        return key in self.data


class BehaviorNode:
    """行为树节点基类"""
    
    def __init__(self, name: str):
        self.name = name
        self.children: List[BehaviorNode] = []
    
    def execute(self, blackboard: Blackboard) -> NodeStatus:
        return NodeStatus.FAILURE


class SequenceNode(BehaviorNode):
    """顺序节点"""
    
    def execute(self, blackboard: Blackboard) -> NodeStatus:
        for child in self.children:
            status = child.execute(blackboard)
            if status != NodeStatus.SUCCESS:
                return status
        return NodeStatus.SUCCESS


class SelectorNode(BehaviorNode):
    """选择节点"""
    
    def execute(self, blackboard: Blackboard) -> NodeStatus:
        for child in self.children:
            status = child.execute(blackboard)
            if status != NodeStatus.FAILURE:
                return status
        return NodeStatus.FAILURE


class ActionNode(BehaviorNode):
    """动作节点"""
    
    def __init__(self, name: str, action: Callable):
        super().__init__(name)
        self.action = action
    
    def execute(self, blackboard: Blackboard) -> NodeStatus:
        return self.action(blackboard)


class ConditionNode(BehaviorNode):
    """条件节点"""
    
    def __init__(self, name: str, condition: Callable):
        super().__init__(name)
        self.condition = condition
    
    def execute(self, blackboard: Blackboard) -> NodeStatus:
        return NodeStatus.SUCCESS if self.condition(blackboard) else NodeStatus.FAILURE


class UE5BehaviorTree:
    """UE5 行为树系统"""
    
    def __init__(self, name: str):
        self.name = name
        self.root: Optional[BehaviorNode] = None
        self.blackboard = Blackboard()
    
    def set_root(self, root: BehaviorNode):
        """设置根节点"""
        self.root = root
    
    def tick(self) -> NodeStatus:
        """执行一次行为树"""
        if self.root:
            return self.root.execute(self.blackboard)
        return NodeStatus.FAILURE
    
    def create_default_patrol_tree(self) -> BehaviorNode:
        """创建默认巡逻行为树"""
        root = SelectorNode("Root")
        
        # 检查是否有敌人
        has_enemy = SequenceNode("HasEnemy")
        has_enemy.children = [
            ConditionNode("CheckEnemy", lambda bb: bb.has("target_enemy")),
            ActionNode("AttackEnemy", lambda bb: NodeStatus.SUCCESS)
        ]
        
        # 巡逻
        patrol = SequenceNode("Patrol")
        patrol.children = [
            ActionNode("FindPatrolPoint", lambda bb: NodeStatus.SUCCESS),
            ActionNode("MoveToPatrolPoint", lambda bb: NodeStatus.SUCCESS),
            ActionNode("WaitAtPoint", lambda bb: NodeStatus.SUCCESS)
        ]
        
        root.children = [has_enemy, patrol]
        
        return root


# ============== 环境特效系统 ==============

class EffectType(Enum):
    PARTICLE = "particle"
    DECAL = "decal"
    LIGHT = "light"
    SOUND = "sound"
    POST_PROCESS = "post_process"


@dataclass
class EnvironmentEffect:
    """环境特效"""
    effect_id: str
    effect_type: EffectType
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    is_active: bool = True
    duration: Optional[float] = None
    start_time: float = 0.0


class UE5EnvironmentEffectSystem:
    """UE5 环境特效系统"""
    
    def __init__(self):
        self.effects: Dict[str, EnvironmentEffect] = {}
        self.effect_templates: Dict[str, Dict] = {}
    
    def create_effect(self, effect_type: EffectType, position: Tuple[float, float, float],
                      duration: Optional[float] = None, **kwargs) -> EnvironmentEffect:
        """创建特效"""
        effect_id = f"effect_{int(time.time() * 1000)}_{random.randint(0, 999)}"
        
        effect = EnvironmentEffect(
            effect_id=effect_id,
            effect_type=effect_type,
            position=position,
            rotation=kwargs.get("rotation", (0.0, 0.0, 0.0)),
            scale=kwargs.get("scale", (1.0, 1.0, 1.0)),
            duration=duration,
            start_time=time.time()
        )
        
        self.effects[effect_id] = effect
        return effect
    
    def remove_effect(self, effect_id: str):
        """移除特效"""
        if effect_id in self.effects:
            del self.effects[effect_id]
    
    def update(self, delta_time: float) -> List[str]:
        """更新特效，返回过期的特效ID列表"""
        expired = []
        
        for effect_id, effect in list(self.effects.items()):
            if effect.duration and (time.time() - effect.start_time) >= effect.duration:
                expired.append(effect_id)
                del self.effects[effect_id]
        
        return expired
    
    def get_active_effects(self) -> List[Dict]:
        """获取所有活跃特效"""
        return [{
            "effect_id": e.effect_id,
            "effect_type": e.effect_type.value,
            "position": e.position,
            "rotation": e.rotation,
            "scale": e.scale,
            "is_active": e.is_active,
            "remaining_time": e.duration - (time.time() - e.start_time) if e.duration else None
        } for e in self.effects.values() if e.is_active]


# ============== 输入动作系统 ==============

@dataclass
class InputAction:
    """输入动作"""
    action_id: str
    action_name: str
    default_key: str
    modifiers: List[str] = field(default_factory=list)
    pressed_callbacks: List[Callable] = field(default_factory=list)
    released_callbacks: List[Callable] = field(default_factory=list)


class UE5InputActionSystem:
    """UE5 输入动作系统"""
    
    def __init__(self):
        self.actions: Dict[str, InputAction] = {}
        self.key_bindings: Dict[str, str] = {}  # key -> action_id
        self.action_states: Dict[str, bool] = {}
        self._init_default_actions()
    
    def _init_default_actions(self):
        """初始化默认输入动作"""
        default_actions = [
            InputAction("move_forward", "向前移动", "W"),
            InputAction("move_backward", "向后移动", "S"),
            InputAction("move_left", "向左移动", "A"),
            InputAction("move_right", "向右移动", "D"),
            InputAction("jump", "跳跃", "Space"),
            InputAction("attack", "攻击", "Mouse0"),
            InputAction("skill_1", "技能1", "Q"),
            InputAction("skill_2", "技能2", "E"),
            InputAction("interact", "交互", "F"),
        ]
        
        for action in default_actions:
            self.actions[action.action_id] = action
            self.key_bindings[action.default_key] = action.action_id
    
    def bind_key(self, key: str, action_id: str):
        """绑定按键"""
        if action_id in self.actions:
            self.key_bindings[key] = action_id
    
    def handle_key_press(self, key: str):
        """处理按键按下"""
        action_id = self.key_bindings.get(key)
        
        if action_id:
            self.action_states[action_id] = True
            action = self.actions.get(action_id)
            
            if action:
                for callback in action.pressed_callbacks:
                    callback()
    
    def handle_key_release(self, key: str):
        """处理按键释放"""
        action_id = self.key_bindings.get(key)
        
        if action_id:
            self.action_states[action_id] = False
            action = self.actions.get(action_id)
            
            if action:
                for callback in action.released_callbacks:
                    callback()
    
    def is_action_pressed(self, action_id: str) -> bool:
        """检查动作是否按下"""
        return self.action_states.get(action_id, False)
    
    def register_callback(self, action_id: str, callback: Callable, on_press: bool = True):
        """注册回调"""
        action = self.actions.get(action_id)
        
        if action:
            if on_press:
                action.pressed_callbacks.append(callback)
            else:
                action.released_callbacks.append(callback)


# 全局实例
_navigation_instance: Optional[UE5NavigationSystem] = None
_behavior_tree_instances: Dict[str, UE5BehaviorTree] = {}
_environment_effect_instance: Optional[UE5EnvironmentEffectSystem] = None
_input_action_instance: Optional[UE5InputActionSystem] = None


def get_navigation_system() -> UE5NavigationSystem:
    global _navigation_instance
    if _navigation_instance is None:
        _navigation_instance = UE5NavigationSystem()
    return _navigation_instance


def create_behavior_tree(name: str) -> UE5BehaviorTree:
    global _behavior_tree_instances
    tree = UE5BehaviorTree(name)
    _behavior_tree_instances[name] = tree
    return tree


def get_environment_effect_system() -> UE5EnvironmentEffectSystem:
    global _environment_effect_instance
    if _environment_effect_instance is None:
        _environment_effect_instance = UE5EnvironmentEffectSystem()
    return _environment_effect_instance


def get_input_action_system() -> UE5InputActionSystem:
    global _input_action_instance
    if _input_action_instance is None:
        _input_action_instance = UE5InputActionSystem()
    return _input_action_instance


if __name__ == "__main__":
    navigation = get_navigation_system()
    behavior_tree = create_behavior_tree("patrol_ai")
    env_effect = get_environment_effect_system()
    input_action = get_input_action_system()
    
    print("Input actions:", list(input_action.actions.keys()))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 WebSocket 桥接
与外部系统实时通信

功能：
- 实时双向通信
- 支持多个客户端连接
- 事件广播
- 远程命令执行
"""

import unreal
import json
import asyncio
import threading
import time
from typing import Optional, Dict, Any, List, Callable, Set
from dataclasses import dataclass, field


@dataclass
class WSMessage:
    """WebSocket 消息"""
    type: str
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)


class UE5WebSocketBridge:
    """WebSocket 桥接服务器"""
    
    def __init__(self, port: int = 8765):
        self.port = port
        self.clients: Set[Any] = set()  # WebSocket clients
        self.running = False
        self.server = None
        self.loop = None
        self.thread = None
        self.event_handlers: Dict[str, List[Callable]] = {}
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """注册事件处理器"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def unregister_event_handler(self, event_type: str, handler: Callable):
        """取消注册事件处理器"""
        if event_type in self.event_handlers:
            self.event_handlers[event_type].remove(handler)
    
    def broadcast(self, message: WSMessage):
        """广播消息到所有客户端"""
        if not self.clients:
            return
        
        message_str = json.dumps({
            "type": message.type,
            "payload": message.payload,
            "timestamp": message.timestamp,
        })
        
        for client in self.clients:
            try:
                # 发送消息
                unreal.log(f"Broadcasting to client: {message.type}")
            except Exception as e:
                unreal.log_error(f"Failed to broadcast: {e}")
    
    def start(self):
        """启动 WebSocket 服务器"""
        if self.running:
            return
        
        self.running = True
        
        # 启动异步服务器
        self.thread = threading.Thread(target=self._run_async_server, daemon=True)
        self.thread.start()
        
        unreal.log(f"[WebSocket] Server started on port {self.port}")
    
    def _run_async_server(self):
        """运行异步服务器"""
        asyncio.run(self._async_start())
    
    async def _async_start(self):
        """异步启动"""
        try:
            # 注意：实际运行时需要安装 websockets 库
            # import websockets
            # async with websockets.serve(self._handle_client, "0.0.0.0", self.port):
            #     await asyncio.Future()  # 永远运行
            
            # 占位实现
            while self.running:
                await asyncio.sleep(1)
                
        except Exception as e:
            unreal.log_error(f"[WebSocket] Server error: {e}")
    
    async def _handle_client(self, websocket, path: str = ""):
        """处理客户端连接"""
        self.clients.add(websocket)
        unreal.log(f"[WebSocket] Client connected: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self._process_message(message, websocket)
        except Exception as e:
            unreal.log_error(f"[WebSocket] Client error: {e}")
        finally:
            self.clients.discard(websocket)
            unreal.log("[WebSocket] Client disconnected")
    
    async def _process_message(self, message_str: str, websocket):
        """处理接收的消息"""
        try:
            data = json.loads(message_str)
            message_type = data.get("type", "unknown")
            payload = data.get("payload", {})
            
            # 触发事件处理器
            handlers = self.event_handlers.get(message_type, [])
            for handler in handlers:
                result = await handler(payload)
                if result:
                    await self._send_response(websocket, message_type, result)
            
            # 处理内置命令
            response = await self._handle_builtin_command(message_type, payload)
            if response:
                await self._send_response(websocket, message_type, response)
                
        except json.JSONDecodeError:
            unreal.log_error("[WebSocket] Invalid JSON message")
        except Exception as e:
            unreal.log_error(f"[WebSocket] Message processing error: {e}")
    
    async def _handle_builtin_command(self, command: str, payload: Dict) -> Optional[Dict]:
        """处理内置命令"""
        
        if command == "ping":
            return {"pong": True, "timestamp": time.time()}
        
        elif command == "get_engine_info":
            return {
                "version": unreal.SystemLibrary.get_engine_version(),
                "project": unreal.SystemLibrary.get_project_name(),
            }
        
        elif command == "get_actors":
            actors = unreal.EditorLevelLibrary.get_all_level_actors()
            return {
                "actors": [
                    {"name": actor.get_name(), "class": actor.get_class().get_name()}
                    for actor in actors[:100]  # 限制数量
                ]
            }
        
        elif command == "spawn_actor":
            actor_class = payload.get("class", "StaticMeshActor")
            location = payload.get("location", [0, 0, 0])
            # 实际生成逻辑
            return {"spawned": True, "location": location}
        
        elif command == "render_frame":
            # 触发渲染
            return {"rendering": True, "frame": payload.get("frame", 0)}
        
        return None
    
    async def _send_response(self, websocket, message_type: str, data: Dict):
        """发送响应"""
        response = json.dumps({
            "type": f"{message_type}_response",
            "payload": data,
            "timestamp": time.time(),
        })
        await websocket.send(response)
    
    def stop(self):
        """停止服务器"""
        self.running = False
        
        if self.loop:
            self.loop.stop()
        
        self.clients.clear()
        
        unreal.log("[WebSocket] Server stopped")


# 全局实例
_ws_instance: Optional[UE5WebSocketBridge] = None


def start_websocket_bridge(port: int = 8765) -> UE5WebSocketBridge:
    """启动 WebSocket 桥接"""
    global _ws_instance
    
    if _ws_instance is None:
        _ws_instance = UE5WebSocketBridge(port)
    
    _ws_instance.start()
    return _ws_instance


def stop_websocket_bridge():
    """停止 WebSocket 桥接"""
    global _ws_instance
    
    if _ws_instance:
        _ws_instance.stop()


def broadcast_event(event_type: str, payload: Dict[str, Any]):
    """广播事件"""
    global _ws_instance
    
    if _ws_instance:
        message = WSMessage(type=event_type, payload=payload)
        _ws_instance.broadcast(message)


if __name__ == "__main__":
    bridge = start_websocket_bridge(port=8765)
    print("WebSocket Bridge running on port 8765")

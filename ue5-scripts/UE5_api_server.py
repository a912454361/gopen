#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 API 服务器
内置 REST API 服务器，对接后端系统

功能：
- REST API 接口
- 项目创建/渲染提交
- 状态查询
- 与外部系统集成
"""

import unreal
import json
import threading
import time
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse


@dataclass
class APIResponse:
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None


class UE5APIHandler(BaseHTTPRequestHandler):
    """HTTP 请求处理器"""
    
    # 类变量存储引用
    server_instance = None
    
    def log_message(self, format, *args):
        """自定义日志"""
        unreal.log(f"[UE5 API] {args[0]}")
    
    def send_json_response(self, status_code: int, response: APIResponse):
        """发送 JSON 响应"""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        
        response_dict = asdict(response)
        self.wfile.write(json.dumps(response_dict).encode("utf-8"))
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
    
    def do_GET(self):
        """处理 GET 请求"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query = urllib.parse.parse_qs(parsed_path.query)
        
        if path == "/api/v1/ue5/status":
            self.handle_get_status()
        elif path == "/api/v1/ue5/projects":
            self.handle_list_projects()
        elif path.startswith("/api/v1/ue5/project/"):
            project_id = path.split("/")[-1]
            self.handle_get_project(project_id)
        elif path == "/api/v1/ue5/health":
            self.handle_health_check()
        else:
            self.send_json_response(404, APIResponse(
                success=False,
                error="Endpoint not found"
            ))
    
    def do_POST(self):
        """处理 POST 请求"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # 读取请求体
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_json_response(400, APIResponse(
                success=False,
                error="Invalid JSON"
            ))
            return
        
        if path == "/api/v1/ue5/create-project":
            self.handle_create_project(data)
        elif path == "/api/v1/ue5/render-scene":
            self.handle_render_scene(data)
        elif path == "/api/v1/ue5/generate-image":
            self.handle_generate_image(data)
        elif path == "/api/v1/ue5/generate-video":
            self.handle_generate_video(data)
        elif path == "/api/v1/ue5/generate-audio":
            self.handle_generate_audio(data)
        elif path == "/api/v1/ue5/apply-shader":
            self.handle_apply_shader(data)
        elif path == "/api/v1/ue5/import-asset":
            self.handle_import_asset(data)
        else:
            self.send_json_response(404, APIResponse(
                success=False,
                error="Endpoint not found"
            ))
    
    # ===== API 处理方法 =====
    
    def handle_health_check(self):
        """健康检查"""
        self.send_json_response(200, APIResponse(
            success=True,
            data={"status": "ok", "version": "1.0.0"}
        ))
    
    def handle_get_status(self):
        """获取引擎状态"""
        try:
            # 获取内存使用
            stats = unreal.SystemLibrary.get_memory_stats()
            
            response_data = {
                "engine_version": unreal.SystemLibrary.get_engine_version(),
                "project_name": unreal.SystemLibrary.get_project_name(),
                "memory_used_mb": stats.get("used", 0) / (1024 * 1024),
                "memory_available_mb": stats.get("available", 0) / (1024 * 1024),
                "fps": 60.0,  # 占位符
                "active_plugins": [],
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=response_data
            ))
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_create_project(self, data: Dict):
        """创建项目"""
        try:
            project_name = data.get("name", "NewProject")
            template = data.get("template", "empty")
            
            # 创建项目目录
            project_path = f"/Game/Projects/{project_name}"
            
            if not unreal.EditorAssetLibrary.does_directory_exist(project_path):
                unreal.EditorAssetLibrary.make_directory(project_path)
            
            # 创建子目录
            for subdir in ["Maps", "Materials", "Meshes", "Textures", "Blueprints"]:
                path = f"{project_path}/{subdir}"
                if not unreal.EditorAssetLibrary.does_directory_exist(path):
                    unreal.EditorAssetLibrary.make_directory(path)
            
            project_info = {
                "id": f"proj_{int(time.time())}",
                "name": project_name,
                "path": project_path,
                "template": template,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=project_info
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_render_scene(self, data: Dict):
        """提交场景渲染"""
        try:
            project_id = data.get("project_id", "")
            scene_id = data.get("scene_id", "")
            resolution = data.get("resolution", [1920, 1080])
            frame_range = data.get("frame_range", [1, 1])
            
            # 创建渲染任务
            render_settings = {
                "resolution_x": resolution[0],
                "resolution_y": resolution[1],
                "frame_start": frame_range[0],
                "frame_end": frame_range[1],
            }
            
            # 配置电影渲染队列
            movie_pipeline = unreal.MoviePipelineEditorLibrary.get_active_movie_pipeline()
            if movie_pipeline:
                # 设置渲染参数
                pass
            
            job_info = {
                "job_id": f"render_{int(time.time())}",
                "project_id": project_id,
                "scene_id": scene_id,
                "status": "queued",
                "settings": render_settings,
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=job_info
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_generate_image(self, data: Dict):
        """AI 图像生成"""
        try:
            prompt = data.get("prompt", "")
            style = data.get("style", "anime")
            width = data.get("width", 1024)
            height = data.get("height", 1024)
            
            # 调用 AI 图像生成器
            # 这里可以导入 UE5_ai_image_generator 模块
            result = {
                "task_id": f"img_{int(time.time())}",
                "prompt": prompt,
                "style": style,
                "resolution": f"{width}x{height}",
                "status": "processing",
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=result
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_generate_video(self, data: Dict):
        """AI 视频生成"""
        try:
            prompt = data.get("prompt", "")
            style = data.get("style", "japanese")
            duration = data.get("duration", 4.0)
            image_url = data.get("image_url")
            
            result = {
                "task_id": f"vid_{int(time.time())}",
                "prompt": prompt,
                "style": style,
                "duration": duration,
                "status": "processing",
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=result
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_generate_audio(self, data: Dict):
        """AI 音频生成"""
        try:
            text = data.get("text", "")
            voice = data.get("voice", "zh_male")
            audio_type = data.get("type", "tts")
            
            result = {
                "task_id": f"aud_{int(time.time())}",
                "text": text,
                "voice": voice,
                "type": audio_type,
                "status": "processing",
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=result
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_apply_shader(self, data: Dict):
        """应用着色器"""
        try:
            shader_name = data.get("shader_name", "toon_basic")
            actor_name = data.get("actor_name", "")
            
            # 查找 Actor
            actors = unreal.EditorLevelLibrary.get_all_level_actors()
            target_actor = None
            
            for actor in actors:
                if actor.get_name() == actor_name:
                    target_actor = actor
                    break
            
            if not target_actor:
                self.send_json_response(404, APIResponse(
                    success=False,
                    error=f"Actor not found: {actor_name}"
                ))
                return
            
            # 加载并应用材质
            shader_path = f"/Game/Shaders/Anime/M_{shader_name.title()}"
            
            if unreal.EditorAssetLibrary.does_asset_exist(shader_path):
                material = unreal.EditorAssetLibrary.load_asset(shader_path)
                
                components = target_actor.get_components_by_class(unreal.StaticMeshComponent)
                for comp in components:
                    comp.set_material(0, material)
                
                self.send_json_response(200, APIResponse(
                    success=True,
                    data={"applied": True, "shader": shader_name, "actor": actor_name}
                ))
            else:
                self.send_json_response(404, APIResponse(
                    success=False,
                    error=f"Shader not found: {shader_path}"
                ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_import_asset(self, data: Dict):
        """导入资产"""
        try:
            asset_path = data.get("asset_path", "")
            asset_type = data.get("asset_type", "mesh")
            destination = data.get("destination", "/Game/Imported")
            
            if not os.path.exists(asset_path):
                self.send_json_response(404, APIResponse(
                    success=False,
                    error=f"Asset file not found: {asset_path}"
                ))
                return
            
            # 创建导入任务
            import_task = unreal.AssetImportTask()
            import_task.set_editor_property("filename", asset_path)
            import_task.set_editor_property("destination_path", destination)
            import_task.set_editor_property("automated", True)
            import_task.set_editor_property("save", True)
            
            unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([import_task])
            
            imported_paths = import_task.get_editor_property("imported_object_paths")
            
            result = {
                "imported": True,
                "source": asset_path,
                "destination": destination,
                "imported_assets": imported_paths,
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=result
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_list_projects(self):
        """列出所有项目"""
        try:
            projects_dir = "/Game/Projects"
            projects = []
            
            if unreal.EditorAssetLibrary.does_directory_exist(projects_dir):
                # 获取所有子目录
                # 注意：这里需要根据实际 UE5 API 调整
                pass
            
            self.send_json_response(200, APIResponse(
                success=True,
                data={"projects": projects}
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))
    
    def handle_get_project(self, project_id: str):
        """获取项目详情"""
        try:
            project_info = {
                "id": project_id,
                "name": project_id.replace("proj_", ""),
                "path": f"/Game/Projects/{project_id}",
                "status": "active",
            }
            
            self.send_json_response(200, APIResponse(
                success=True,
                data=project_info
            ))
            
        except Exception as e:
            self.send_json_response(500, APIResponse(
                success=False,
                error=str(e)
            ))


class UE5APIServer:
    """UE5 API 服务器"""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8080):
        self.host = host
        self.port = port
        self.server: Optional[HTTPServer] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None
    
    def start(self):
        """启动服务器"""
        if self.running:
            unreal.log_warning("[UE5 API] Server already running")
            return
        
        try:
            self.server = HTTPServer((self.host, self.port), UE5APIHandler)
            UE5APIHandler.server_instance = self
            
            self.running = True
            self.thread = threading.Thread(target=self._run_server, daemon=True)
            self.thread.start()
            
            unreal.log(f"[UE5 API] Server started on {self.host}:{self.port}")
            
        except Exception as e:
            unreal.log_error(f"[UE5 API] Failed to start server: {e}")
    
    def _run_server(self):
        """运行服务器循环"""
        while self.running:
            try:
                self.server.handle_request()
            except Exception as e:
                if self.running:
                    unreal.log_error(f"[UE5 API] Server error: {e}")
    
    def stop(self):
        """停止服务器"""
        if not self.running:
            return
        
        self.running = False
        
        if self.server:
            self.server.shutdown()
            self.server = None
        
        if self.thread:
            self.thread.join(timeout=5)
            self.thread = None
        
        unreal.log("[UE5 API] Server stopped")
    
    def is_running(self) -> bool:
        """检查服务器是否运行"""
        return self.running


# 全局服务器实例
_server_instance: Optional[UE5APIServer] = None


def start_api_server(host: str = "0.0.0.0", port: int = 8080) -> UE5APIServer:
    """启动 API 服务器"""
    global _server_instance
    
    if _server_instance is None:
        _server_instance = UE5APIServer(host, port)
    
    _server_instance.start()
    return _server_instance


def stop_api_server():
    """停止 API 服务器"""
    global _server_instance
    
    if _server_instance:
        _server_instance.stop()


def get_api_server() -> Optional[UE5APIServer]:
    """获取 API 服务器实例"""
    return _server_instance


if __name__ == "__main__":
    # 启动服务器
    server = start_api_server(port=8080)
    print(f"UE5 API Server running on port 8080")

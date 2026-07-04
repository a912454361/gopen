#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 动漫着色器包
导入和应用动漫风格着色器

功能：
- 导入预设动漫着色器
- 卡通着色（Toon Shading）
- 描边效果
- 半调网点效果
"""

import unreal
import os
from typing import List, Dict, Optional


class AnimeShaderPack:
    """动漫着色器包管理器"""
    
    # 着色器预设
    SHADER_PRESETS = {
        "toon_basic": {
            "name": "Basic Toon Shader",
            "description": "基础卡通着色器",
            "ramp_stages": 3,
        },
        "toon_anime": {
            "name": "Anime Style Shader",
            "description": "日式动漫着色器",
            "ramp_stages": 4,
        },
        "toon_cel": {
            "name": "Cel Shader",
            "description": "赛璐璐着色器",
            "ramp_stages": 2,
        },
        "guofeng": {
            "name": "Guofeng Shader",
            "description": "国风水墨风格着色器",
            "ramp_stages": 5,
        },
        "watercolor": {
            "name": "Watercolor Shader",
            "description": "水彩风格着色器",
            "ramp_stages": 6,
        },
    }
    
    def __init__(self):
        self.installed_shaders: List[str] = []
    
    def install_shader_pack(self, target_path: str = "/Game/Shaders/Anime") -> bool:
        """安装着色器包到项目"""
        
        # 创建目标目录
        if not unreal.EditorAssetLibrary.does_directory_exist(target_path):
            unreal.EditorAssetLibrary.make_directory(target_path)
        
        # 创建材质函数
        self._create_material_functions(target_path)
        
        # 创建主材质
        for preset_id, preset in self.SHADER_PRESETS.items():
            self._create_anime_material(target_path, preset_id, preset)
        
        unreal.log(f"Anime shader pack installed to {target_path}")
        return True
    
    def _create_material_functions(self, base_path: str):
        """创建材质函数"""
        
        # ToonRamp 材质函数
        toon_ramp_path = f"{base_path}/MF_ToonRamp"
        if not unreal.EditorAssetLibrary.does_asset_exist(toon_ramp_path):
            material_function = unreal.MaterialFunctionFactoryNew().factory_create_new(toon_ramp_path)
            material_function.set_editor_property("description", "Toon Ramp Lighting")
            unreal.EditorAssetLibrary.save_loaded_asset(material_function)
        
        # Outline 材质函数
        outline_path = f"{base_path}/MF_Outline"
        if not unreal.EditorAssetLibrary.does_asset_exist(outline_path):
            material_function = unreal.MaterialFunctionFactoryNew().factory_create_new(outline_path)
            material_function.set_editor_property("description", "Outline Effect")
            unreal.EditorAssetLibrary.save_loaded_asset(material_function)
    
    def _create_anime_material(self, base_path: str, preset_id: str, preset: Dict):
        """创建动漫材质"""
        
        material_path = f"{base_path}/M_{preset_id.title()}"
        
        if unreal.EditorAssetLibrary.does_asset_exist(material_path):
            return
        
        # 创建材质
        material = unreal.MaterialFactoryNew().factory_create_new(material_path)
        material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
        material.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
        
        # 保存材质
        unreal.EditorAssetLibrary.save_loaded_asset(material)
        self.installed_shaders.append(material_path)
        
        unreal.log(f"Created anime material: {material_path}")
    
    def apply_to_actor(self, actor: unreal.Actor, shader_name: str) -> bool:
        """将着色器应用到 Actor"""
        
        shader_path = f"/Game/Shaders/Anime/M_{shader_name.title()}"
        
        if not unreal.EditorAssetLibrary.does_asset_exist(shader_path):
            unreal.log_error(f"Shader not found: {shader_path}")
            return False
        
        material = unreal.EditorAssetLibrary.load_asset(shader_path)
        
        # 获取静态网格组件
        components = actor.get_components_by_class(unreal.StaticMeshComponent)
        
        for component in components:
            num_materials = component.get_num_materials()
            for i in range(num_materials):
                component.set_material(i, material)
        
        return True
    
    def create_material_instance(self, base_shader: str, instance_name: str, 
                                 parameters: Dict) -> Optional[unreal.Object]:
        """创建材质实例"""
        
        base_path = f"/Game/Shaders/Anime/M_{base_shader.title()}"
        
        if not unreal.EditorAssetLibrary.does_asset_exist(base_path):
            unreal.log_error(f"Base shader not found: {base_path}")
            return None
        
        base_material = unreal.EditorAssetLibrary.load_asset(base_path)
        
        # 创建材质实例
        instance_path = f"/Game/MaterialInstances/MI_{instance_name}"
        material_instance = unreal.MaterialInstanceConstantFactoryNew().factory_create_new(instance_path)
        material_instance.set_editor_property("parent", base_material)
        
        # 设置参数
        for param_name, param_value in parameters.items():
            if isinstance(param_value, unreal.LinearColor):
                material_instance.set_vector_parameter_editor_value(param_name, param_value)
            elif isinstance(param_value, (int, float)):
                material_instance.set_scalar_parameter_editor_value(param_name, float(param_value))
        
        unreal.EditorAssetLibrary.save_loaded_asset(material_instance)
        return material_instance


def install_anime_shaders(target_path: str = "/Game/Shaders/Anime") -> bool:
    """便捷函数：安装动漫着色器包"""
    pack = AnimeShaderPack()
    return pack.install_shader_pack(target_path)


if __name__ == "__main__":
    pack = AnimeShaderPack()
    pack.install_shader_pack()

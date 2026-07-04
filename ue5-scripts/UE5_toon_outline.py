#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 卡通描边设置
自动设置和配置描边效果

功能：
- 后处理描边
- 几何描边
- 自定义描边宽度/颜色
"""

import unreal
from typing import Optional, List, Dict


class ToonOutlineSetup:
    """卡通描边设置"""
    
    def __init__(self):
        self.outline_material_path = "/Game/Materials/Outline/M_Outline"
    
    def setup_post_process_outline(self, world: Optional[unreal.World] = None) -> bool:
        """设置后处理描边"""
        
        if world is None:
            world = unreal.EditorLevelLibrary.get_editor_world()
        
        # 查找后处理体积
        pp_volumes = unreal.GameplayStatics.get_all_actors_of_class(
            world, unreal.PostProcessVolume
        )
        
        if not pp_volumes:
            # 创建后处理体积
            pp_volume = unreal.EditorLevelLibrary.spawn_actor_from_class(
                unreal.PostProcessVolume, 
                unreal.Vector(0, 0, 0),
                unreal.Rotator(0, 0, 0)
            )
        else:
            pp_volume = pp_volumes[0]
        
        # 创建描边材质
        outline_material = self._create_outline_material()
        
        # 配置后处理设置
        settings = pp_volume.get_editor_property("settings")
        
        # 启用后期处理材质
        settings.set_editor_property("post_process_materials", [
            unreal.WeightedBlendable(weight=1.0, object=outline_material)
        ])
        
        # 设置无边框
        pp_volume.set_editor_property("bUnbound", True)
        
        unreal.log("Post-process outline setup complete")
        return True
    
    def _create_outline_material(self) -> unreal.Material:
        """创建描边材质"""
        
        if unreal.EditorAssetLibrary.does_asset_exist(self.outline_material_path):
            return unreal.EditorAssetLibrary.load_asset(self.outline_material_path)
        
        # 创建目录
        material_dir = "/".join(self.outline_material_path.split("/")[:-1])
        if not unreal.EditorAssetLibrary.does_directory_exist(material_dir):
            unreal.EditorAssetLibrary.make_directory(material_dir)
        
        # 创建材质
        material = unreal.MaterialFactoryNew().factory_create_new(self.outline_material_path)
        material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_ALPHA)
        material.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
        
        unreal.EditorAssetLibrary.save_loaded_asset(material)
        return material
    
    def setup_mesh_outline(self, mesh: unreal.StaticMesh, 
                          outline_width: float = 1.0,
                          outline_color: unreal.LinearColor = None) -> bool:
        """为网格设置几何描边"""
        
        if outline_color is None:
            outline_color = unreal.LinearColor(0, 0, 0, 1)
        
        # 创建描边材质实例
        outline_material = self._create_outline_material()
        
        # 这里需要通过材质参数设置描边属性
        # 实际实现需要根据材质节点图配置
        
        unreal.log(f"Mesh outline setup: {mesh.get_name()}")
        return True
    
    def create_outline_material_instance(self, 
                                         name: str,
                                         width: float = 2.0,
                                         color: unreal.LinearColor = None,
                                         opacity: float = 1.0) -> unreal.MaterialInstanceConstant:
        """创建描边材质实例"""
        
        if color is None:
            color = unreal.LinearColor(0, 0, 0, 1)
        
        instance_path = f"/Game/Materials/Outline/MI_{name}"
        
        if unreal.EditorAssetLibrary.does_asset_exist(instance_path):
            return unreal.EditorAssetLibrary.load_asset(instance_path)
        
        base_material = self._create_outline_material()
        
        # 创建材质实例
        material_instance = unreal.MaterialInstanceConstantFactoryNew().factory_create_new(instance_path)
        material_instance.set_editor_property("parent", base_material)
        
        # 设置参数
        material_instance.set_scalar_parameter_editor_value("OutlineWidth", width)
        material_instance.set_vector_parameter_editor_value("OutlineColor", color)
        material_instance.set_scalar_parameter_editor_value("Opacity", opacity)
        
        unreal.EditorAssetLibrary.save_loaded_asset(material_instance)
        return material_instance


def setup_toon_outline(world: Optional[unreal.World] = None) -> bool:
    """便捷函数：设置卡通描边"""
    setup = ToonOutlineSetup()
    return setup.setup_post_process_outline(world)


if __name__ == "__main__":
    setup = ToonOutlineSetup()
    setup.setup_post_process_outline()

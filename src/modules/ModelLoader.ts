/**
 * 模型加载器 - 加载FBX和其他3D模型
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders'; // 导入所有加载器（包括FBX、GLTF等）

export interface ModelConfig {
    name: string;
    modelPath: string;
    texturePath?: string;
    position?: BABYLON.Vector3;
    rotation?: BABYLON.Vector3;
    scale?: BABYLON.Vector3;
}

export default class ModelLoader {
    private scene: BABYLON.Scene;
    private loadedModels: Map<string, BABYLON.AbstractMesh[]> = new Map();

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }

    /**
     * 加载3D模型（支持GLB、FBX等格式，带超时保护）
     */
    async loadModel(config: ModelConfig): Promise<BABYLON.AbstractMesh> {
        try {
            const fileExtension = config.modelPath.split('.').pop()?.toLowerCase();
            console.log(`Loading ${fileExtension?.toUpperCase()} model: ${config.name} from ${config.modelPath}`);

            // 添加10秒超时保护，防止加載卡住
            const result = await Promise.race([
                BABYLON.SceneLoader.ImportMeshAsync(
                    '',
                    '',
                    config.modelPath,
                    this.scene
                ),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Model loading timeout')), 10000)
                )
            ]);

            if (result.meshes.length === 0) {
                throw new Error(`No meshes found in ${config.modelPath}`);
            }

            // 获取根网格
            const rootMesh = result.meshes[0];
            rootMesh.name = config.name;

            // 设置位置
            if (config.position) {
                rootMesh.position = config.position;
            }

            // 设置旋转
            if (config.rotation) {
                rootMesh.rotation = config.rotation;
            }

            // 设置缩放
            if (config.scale) {
                rootMesh.scaling = config.scale;
            } else {
                // 默认缩放以适应场景
                rootMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
            }

            // ===== 材質處理：保留 GLB 嵌入的 PBR 材質 =====
            // GLB 檔案已經包含完整的 PBR 材質和貼圖，不需要手動覆蓋
            // 只有 FBX 可能需要外部貼圖
            if (config.texturePath && fileExtension === 'fbx') {
                this.applyTexture(result.meshes, config.texturePath);
            }

            // ===== 射線檢測優化：預設禁用所有網格的 isPickable =====
            // 這樣可以避免對高多邊形模型進行昂貴的射線檢測
            // 實際的互動將由外部的簡化碰撞體處理（見 BarEnvironment.ts）
            result.meshes.forEach(mesh => {
                if (mesh instanceof BABYLON.Mesh) {
                    mesh.receiveShadows = true;
                    // 禁用射線檢測和碰撞檢測
                    mesh.isPickable = false;
                    mesh.checkCollisions = false;
                }
            });

            // ===== 關鍵修改：根網格也設為不可選取 =====
            // 讓外部的碰撞體負責處理所有的射線檢測和互動
            if (rootMesh instanceof BABYLON.Mesh) {
                rootMesh.isPickable = false;
                rootMesh.checkCollisions = false;
            }

            // 保存加载的模型
            this.loadedModels.set(config.name, result.meshes);

            console.log(`✓ Model loaded: ${config.name} (${result.meshes.length} meshes)`);

            return rootMesh;
        } catch (error) {
            console.error(`Failed to load model ${config.name}:`, error);
            console.warn(`Using fallback mesh for ${config.name}`);
            // 返回一个简单的替代网格
            return this.createFallbackMesh(config.name, config.position);
        }
    }

    /**
     * 加载FBX模型（保留向後兼容性）
     * @deprecated 使用 loadModel() 替代
     */
    async loadFBXModel(config: ModelConfig): Promise<BABYLON.AbstractMesh> {
        return this.loadModel(config);
    }

    /**
     * 应用贴图到模型
     */
    private applyTexture(meshes: BABYLON.AbstractMesh[], texturePath: string): void {
        const texture = new BABYLON.Texture(texturePath, this.scene);

        meshes.forEach(mesh => {
            if (mesh instanceof BABYLON.Mesh) {
                // 创建PBR材质以获得更好的视觉效果
                const material = new BABYLON.PBRMaterial(`${mesh.name}_mat`, this.scene);
                material.albedoTexture = texture;
                material.metallic = 0.2;
                material.roughness = 0.3;
                material.backFaceCulling = false;

                mesh.material = material;
            }
        });
    }

    /**
     * 创建备用网格（如果FBX加载失败）
     */
    private createFallbackMesh(name: string, position?: BABYLON.Vector3): BABYLON.Mesh {
        console.warn(`Creating fallback mesh for ${name}`);

        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            name,
            { height: 0.8, diameter: 0.3 },
            this.scene
        );

        if (position) {
            mesh.position = position;
        }

        // 简单的材质
        const material = new BABYLON.StandardMaterial(`${name}_fallback_mat`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        mesh.material = material;

        return mesh;
    }

    /**
     * 批量加载多个模型
     */
    async loadMultipleModels(configs: ModelConfig[]): Promise<BABYLON.AbstractMesh[]> {
        const promises = configs.map(config => this.loadFBXModel(config));
        return Promise.all(promises);
    }

    /**
     * 获取已加载的模型
     */
    getLoadedModel(name: string): BABYLON.AbstractMesh[] | undefined {
        return this.loadedModels.get(name);
    }

    /**
     * 清理所有加载的模型
     */
    dispose(): void {
        this.loadedModels.forEach(meshes => {
            meshes.forEach(mesh => mesh.dispose());
        });
        this.loadedModels.clear();
    }
}

/**
 * AAA級光照系統
 */

import * as BABYLON from '@babylonjs/core';

export default class LightingSystem {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator | null = null;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.setupLights();
        this.setupPostProcessing();
    }

    /**
     * 設置光源（現代奢華酒吧氛圍 - 提升亮度突顯大理石反射）
     */
    private setupLights(): void {
        // === 主光源：中性白光（突顯大理石） ===
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        mainLight.position = new BABYLON.Vector3(20, 40, 20);
        mainLight.intensity = 0.8; // 提升強度以突顯大理石反射
        mainLight.diffuse = new BABYLON.Color3(1.0, 0.98, 0.95); // 中性白光（略帶暖意）
        mainLight.specular = new BABYLON.Color3(1.0, 1.0, 1.0); // 純白高光

        // === 陰影映射 ===
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight);
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.bias = 0.001;

        // === 環境光：提升亮度以突顯奢華感 ===
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.5; // 提升環境光
        hemiLight.diffuse = new BABYLON.Color3(0.95, 0.95, 1.0); // 中性偏冷色調
        hemiLight.groundColor = new BABYLON.Color3(0.4, 0.38, 0.35); // 地面反射（拋光硬木）
        hemiLight.specular = new BABYLON.Color3(0.9, 0.9, 0.9); // 明亮高光

        // === 吧檯聚光燈：重點照明大理石檯面 ===
        const barSpotlight = new BABYLON.SpotLight(
            'barSpotlight',
            new BABYLON.Vector3(0, 4, -3),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI / 3,
            2,
            this.scene
        );
        barSpotlight.intensity = 1.5; // 提升強度聚焦大理石
        barSpotlight.diffuse = new BABYLON.Color3(1.0, 1.0, 0.98); // 明亮白光
        barSpotlight.specular = new BABYLON.Color3(1.0, 1.0, 1.0); // 純白高光

        // === PBR 環境光照（Image-Based Lighting）===
        // 高對比度 HDR 環境讓大理石反射更明顯
        this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "https://assets.babylonjs.com/environments/environmentSpecular.env",
            this.scene
        );
        this.scene.environmentIntensity = 1.0; // 確保環境光強度適中

        console.log('✓ 現代奢華光照系統已設置（含增強 PBR 環境光照）');
    }

    /**
     * 設置後處理效果（已优化：完全移除后处理以加快加载）
     */
    private setupPostProcessing(): void {
        // 完全移除后处理效果以加快加载速度
        // 引擎已经开启了antialias，不需要FXAA
        this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;

        console.log('✓ 后处理已优化：移除FXAA，使用引擎内置抗锯齿');
    }

    /**
     * 添加陰影投射者
     */
    addShadowCaster(mesh: BABYLON.Mesh): void {
        if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(mesh);
        }
    }

    /**
     * 獲取陰影生成器
     */
    getShadowGenerator(): BABYLON.ShadowGenerator | null {
        return this.shadowGenerator;
    }

    /**
     * 清理
     */
    dispose(): void {
        if (this.shadowGenerator) {
            this.shadowGenerator.dispose();
        }
    }
}

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
     * 設置光源（昏暗酒吧氛圍）
     */
    private setupLights(): void {
        // === 主光源：昏暗的暖色燈光 ===
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        mainLight.position = new BABYLON.Vector3(20, 40, 20);
        mainLight.intensity = 0.5; // 大幅降低強度，打造昏暗氛圍
        mainLight.diffuse = new BABYLON.Color3(0.9, 0.7, 0.5); // 暖橙色調
        mainLight.specular = new BABYLON.Color3(0.8, 0.6, 0.4);

        // === 陰影映射 ===
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight);
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.bias = 0.001;

        // === 環境光：低強度暖色調 ===
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.3; // 大幅降低環境光
        hemiLight.diffuse = new BABYLON.Color3(0.7, 0.5, 0.4); // 暖色調
        hemiLight.groundColor = new BABYLON.Color3(0.3, 0.2, 0.15); // 更暗的地面反射
        hemiLight.specular = new BABYLON.Color3(0.3, 0.25, 0.2);

        // === 吧檯聚光燈：營造重點照明 ===
        const barSpotlight = new BABYLON.SpotLight(
            'barSpotlight',
            new BABYLON.Vector3(0, 4, -3),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI / 3,
            2,
            this.scene
        );
        barSpotlight.intensity = 1.2; // 聚焦在吧檯上
        barSpotlight.diffuse = new BABYLON.Color3(1.0, 0.8, 0.5); // 溫暖的吧檯燈光
        barSpotlight.specular = new BABYLON.Color3(0.8, 0.7, 0.5);

        console.log('✓ 昏暗酒吧光照系統已設置');
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

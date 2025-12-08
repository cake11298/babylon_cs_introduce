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
     * 設置光源（已优化：减少光源数量，降低阴影质量）
     */
    private setupLights(): void {
        // === 主光源：暖色陽光 ===
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        mainLight.position = new BABYLON.Vector3(20, 40, 20);
        mainLight.intensity = 3.0; // 提高強度以補償移除的光源
        mainLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
        mainLight.specular = new BABYLON.Color3(1.0, 0.9, 0.7);

        // === 陰影映射（已提升：提高质量以配合FBX模型）===
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight); // 512 -> 1024（提高质量）
        this.shadowGenerator.usePercentageCloserFiltering = true; // 使用PCF软阴影
        this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.bias = 0.001;

        // === 環境光：半球光 ===
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 2.0; // 提高環境光強度
        hemiLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        hemiLight.groundColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        hemiLight.specular = new BABYLON.Color3(0.5, 0.5, 0.6);

        // === 補光：填充光（已优化：移除聚光灯和点光源，只保留核心3光源）===
        const fillLight = new BABYLON.DirectionalLight(
            'fillLight',
            new BABYLON.Vector3(1, -0.5, 1),
            this.scene
        );
        fillLight.intensity = 0.8; // 提高補光強度以补偿移除的光源
        fillLight.diffuse = new BABYLON.Color3(0.8, 0.85, 1.0);

        console.log('✓ 光照系统已优化：5光源 -> 3光源，阴影 1024 -> 512');
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

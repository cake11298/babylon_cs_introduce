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
     * 設置光源
     */
    private setupLights(): void {
        // === 主光源：暖色陽光 ===
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        mainLight.position = new BABYLON.Vector3(20, 40, 20);
        mainLight.intensity = 2.5; // 提高主光源強度以改善可見度
        mainLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
        mainLight.specular = new BABYLON.Color3(1.0, 0.9, 0.7);

        // === 陰影映射（簡化以提升性能）===
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 32;
        this.shadowGenerator.bias = 0.001;

        // === 環境光：半球光 ===
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 1.5; // 大幅提高環境光強度以改善整體亮度
        hemiLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0); // 純白環境光
        hemiLight.groundColor = new BABYLON.Color3(0.7, 0.7, 0.7); // 更亮的地面反射
        hemiLight.specular = new BABYLON.Color3(0.5, 0.5, 0.6);

        // === 補光：填充光 ===
        const fillLight = new BABYLON.DirectionalLight(
            'fillLight',
            new BABYLON.Vector3(1, -0.5, 1),
            this.scene
        );
        fillLight.intensity = 0.6; // 提高補光強度
        fillLight.diffuse = new BABYLON.Color3(0.8, 0.85, 1.0);

        // === 聚光燈：酒吧氛圍 ===
        const spotLight1 = new BABYLON.SpotLight(
            'spotLight1',
            new BABYLON.Vector3(0, 5, 0),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI / 3,
            2,
            this.scene
        );
        spotLight1.intensity = 1.2; // 提高聚光燈強度
        spotLight1.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);

        // === 點光源：裝飾性光源 ===
        const pointLight = new BABYLON.PointLight(
            'pointLight',
            new BABYLON.Vector3(0, 3, 0),
            this.scene
        );
        pointLight.intensity = 1.0; // 提高點光源強度
        pointLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);
        pointLight.range = 15; // 擴大照明範圍
    }

    /**
     * 設置後處理效果（極簡化版本，優先加載速度）
     */
    private setupPostProcessing(): void {
        const camera = this.scene.activeCamera as BABYLON.Camera;

        if (!camera) return;

        // 完全禁用複雜的後處理管線以提升加載速度
        // 只使用基本的 FXAA 抗鋸齒
        const fxaa = new BABYLON.FxaaPostProcess('fxaa', 1.0, camera);

        console.log('✓ 使用輕量級後處理（僅 FXAA）以提升性能');

        // 禁用霧效果
        this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
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

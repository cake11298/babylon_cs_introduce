/**
 * AAA級光照系統
 */

import * as BABYLON from '@babylonjs/core';

export default class LightingSystem {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.CascadedShadowGenerator | null = null;

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

        // === 級聯陰影映射（優化品質以提升性能）===
        this.shadowGenerator = new BABYLON.CascadedShadowGenerator(2048, mainLight);
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.lambda = 0.95;
        this.shadowGenerator.cascadeBlendPercentage = 0.1;
        this.shadowGenerator.depthClamp = true;
        this.shadowGenerator.stabilizeCascades = true;
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
     * 設置後處理效果
     */
    private setupPostProcessing(): void {
        const camera = this.scene.activeCamera as BABYLON.Camera;

        if (!camera) return;

        // === 默認渲染管線（AAA級效果）===
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            'defaultPipeline',
            true,
            this.scene,
            [camera]
        );

        // === Bloom（輝光效果）===
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.6;
        pipeline.bloomWeight = 0.4;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.7;

        // === SSAO2（環境光遮蔽）- 禁用以提升加載性能和畫面亮度 ===
        // 注释掉SSAO以加快加载并提升亮度
        /*
        const ssao = new BABYLON.SSAO2RenderingPipeline(
            'ssao',
            this.scene,
            {
                ssaoRatio: 0.5,
                blurRatio: 1
            }
        );
        ssao.radius = 1.5;
        ssao.totalStrength = 0.3;
        ssao.expensiveBlur = true;
        ssao.samples = 16;
        ssao.maxZ = 100;

        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
            'ssao',
            camera
        );
        */

        // === 圖像處理（色調映射、色彩分級）===
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.toneMappingType =
            BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        pipeline.imageProcessing.exposure = 2.2; // 大幅提高曝光度，讓畫面明亮
        pipeline.imageProcessing.contrast = 1.05; // 稍微降低對比度，避免過暗

        // === 暈影效果 - 大幅減弱以避免邊緣過暗 ===
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 0.3; // 大幅降低暈影強度
        pipeline.imageProcessing.vignetteStretch = 0.3;
        pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);

        // === 色彩曲線（電影感）===
        pipeline.imageProcessing.colorCurvesEnabled = true;
        const curve = new BABYLON.ColorCurves();
        curve.globalHue = 20;
        curve.globalSaturation = 15;
        curve.highlightsSaturation = 10;
        curve.shadowsSaturation = -10;
        pipeline.imageProcessing.colorCurves = curve;

        // === 色差效果 ===
        pipeline.chromaticAberrationEnabled = true;
        pipeline.chromaticAberration.aberrationAmount = 15;

        // === 膠片顆粒 - 禁用以提升性能 ===
        pipeline.grainEnabled = false;

        // === 銳化 - 禁用以提升性能 ===
        pipeline.sharpenEnabled = false;

        // === 抗鋸齒（FXAA）- 降低采样以提升性能 ===
        pipeline.fxaaEnabled = true;
        pipeline.samples = 2;

        // === 輝光層（用於發光物體）===
        const glowLayer = new BABYLON.GlowLayer('glow', this.scene, {
            mainTextureFixedSize: 512,
            blurKernelSize: 64
        });
        glowLayer.intensity = 0.7;

        // === 霧效果 - 幾乎完全移除以避免畫面灰暗 ===
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.0001; // 大幅降低霧的密度
        this.scene.fogColor = new BABYLON.Color3(0.9, 0.95, 1.0); // 更亮的霧色
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
    getShadowGenerator(): BABYLON.CascadedShadowGenerator | null {
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

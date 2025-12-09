/**
 * 酒吧環境模組 - 創建酒吧場景、物品和互動物件
 * 使用 Babylon.js PBR 材質和物理系統
 */

import * as BABYLON from '@babylonjs/core';
import type PhysicsSystem from './PhysicsSystem';
import type InteractionSystem from './InteractionSystem';
import type CocktailSystem from './CocktailSystem';
import { ItemType } from '../types/types';

export default class BarEnvironment {
    private scene: BABYLON.Scene;
    private physics: PhysicsSystem;
    private interaction: InteractionSystem;
    private cocktail: CocktailSystem;

    // 場景物件
    private bottles: BABYLON.Mesh[] = [];
    private glasses: BABYLON.Mesh[] = [];
    private barTools: { shaker?: BABYLON.Mesh; jigger?: BABYLON.Mesh } = {};

    constructor(
        scene: BABYLON.Scene,
        physics: PhysicsSystem,
        interaction: InteractionSystem,
        cocktail: CocktailSystem
    ) {
        this.scene = scene;
        this.physics = physics;
        this.interaction = interaction;
        this.cocktail = cocktail;
    }

    /**
     * 創建完整的酒吧環境（程序化幾何體）
     */
    async createEnvironment(): Promise<void> {
        this.createFloorAndWalls();
        this.createBarCounter();
        this.createLiquorShelf();
        this.createBarBottles(); // 程序化幾何體
        this.createGlasses();
        await this.createBarTools(); // 仍需async以保持兼容性
        this.createFurniture();
    }

    /**
     * 創建地板和牆壁（現代奢華風格PBR材質）
     */
    private createFloorAndWalls(): void {
        // 地板 - 粗糙深色硬木/石材（磨砂質感）
        const floor = BABYLON.MeshBuilder.CreateGround(
            'floor',
            { width: 30, height: 30 },
            this.scene
        );
        const floorMaterial = new BABYLON.PBRMaterial('floorMat', this.scene);
        floorMaterial.albedoColor = new BABYLON.Color3(0.12, 0.10, 0.08); // 深色硬木
        floorMaterial.metallic = 0.0;
        floorMaterial.roughness = 0.85; // 高粗糙度 = 磨砂/粗糙效果
        floorMaterial.environmentIntensity = 0.3; // 降低環境反射
        // 移除反射效果
        floorMaterial.reflectivityColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        floorMaterial.microSurface = 0.4; // 粗糙表面
        // 禁用清漆層（不需要光澤）
        floorMaterial.clearCoat.isEnabled = false;
        floor.material = floorMaterial;
        floor.receiveShadows = true;
        floor.checkCollisions = true;
        this.physics.addStaticBoxCollider(floor);

        // 牆壁材質 - 高光澤牆面（拋光板岩/光澤塗料）
        const wallMaterial = new BABYLON.PBRMaterial('wallMat', this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.18, 0.18, 0.19); // 深灰色拋光板岩
        wallMaterial.metallic = 0.0;
        wallMaterial.roughness = 0.15; // 低粗糙度 = 高光澤/反射效果
        wallMaterial.environmentIntensity = 1.2; // 增強環境反射
        // 添加牆壁的強烈反射
        wallMaterial.reflectivityColor = new BABYLON.Color3(0.3, 0.3, 0.32);
        wallMaterial.microSurface = 0.92; // 光滑表面
        // 啟用清漆層（高光澤效果）
        wallMaterial.clearCoat.isEnabled = true;
        wallMaterial.clearCoat.intensity = 0.5;
        wallMaterial.clearCoat.roughness = 0.1;

        // 後牆 - 封閉房間
        const backWall = BABYLON.MeshBuilder.CreateBox(
            'backWall',
            { width: 30, height: 5, depth: 0.5 },
            this.scene
        );
        backWall.position = new BABYLON.Vector3(0, 2.5, -15);
        backWall.material = wallMaterial;
        backWall.receiveShadows = true;
        backWall.checkCollisions = true;
        this.physics.addStaticBoxCollider(backWall);

        // 左牆
        const leftWall = BABYLON.MeshBuilder.CreateBox(
            'leftWall',
            { width: 0.5, height: 5, depth: 30 },
            this.scene
        );
        leftWall.position = new BABYLON.Vector3(-15, 2.5, 0);
        leftWall.material = wallMaterial;
        leftWall.receiveShadows = true;
        leftWall.checkCollisions = true;
        this.physics.addStaticBoxCollider(leftWall);

        // 右牆
        const rightWall = BABYLON.MeshBuilder.CreateBox(
            'rightWall',
            { width: 0.5, height: 5, depth: 30 },
            this.scene
        );
        rightWall.position = new BABYLON.Vector3(15, 2.5, 0);
        rightWall.material = wallMaterial;
        rightWall.receiveShadows = true;
        rightWall.checkCollisions = true;
        this.physics.addStaticBoxCollider(rightWall);

        // 前牆（入口側） - 創建封閉的房間
        const frontWall = BABYLON.MeshBuilder.CreateBox(
            'frontWall',
            { width: 30, height: 5, depth: 0.5 },
            this.scene
        );
        frontWall.position = new BABYLON.Vector3(0, 2.5, 15);
        frontWall.material = wallMaterial;
        frontWall.receiveShadows = true;
        frontWall.checkCollisions = true;
        this.physics.addStaticBoxCollider(frontWall);

        // 天花板 - 深色木樑風格
        const ceiling = BABYLON.MeshBuilder.CreateBox(
            'ceiling',
            { width: 30, height: 0.4, depth: 30 },
            this.scene
        );
        ceiling.position = new BABYLON.Vector3(0, 5, 0);
        const ceilingMaterial = new BABYLON.PBRMaterial('ceilingMat', this.scene);
        ceilingMaterial.albedoColor = new BABYLON.Color3(0.12, 0.10, 0.08); // 深色木材
        ceilingMaterial.metallic = 0.0;
        ceilingMaterial.roughness = 0.9;
        ceilingMaterial.environmentIntensity = 0.2;
        ceiling.material = ceilingMaterial;
        ceiling.receiveShadows = true;
        ceiling.checkCollisions = true;
        this.physics.addStaticBoxCollider(ceiling);
    }

    /**
     * 創建吧檯（現代奢華拋光大理石）
     */
    private createBarCounter(): void {
        // 吧檯檯面 - 高級拋光大理石
        const counter = BABYLON.MeshBuilder.CreateBox(
            'barCounter',
            { width: 12, height: 0.2, depth: 2 },
            this.scene
        );
        counter.position = new BABYLON.Vector3(0, 1.05, -3);

        const counterMaterial = new BABYLON.PBRMaterial('counterMat', this.scene);
        counterMaterial.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95); // 白色/淺灰大理石
        counterMaterial.metallic = 0.0; // 大理石非金屬
        counterMaterial.roughness = 0.45; // 中等粗糙度 = 磨砂/半啞光效果
        counterMaterial.environmentIntensity = 0.6; // 降低環境反射
        // 降低反射強度，使玻璃物品更清晰可見
        counterMaterial.reflectivityColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        counterMaterial.microSurface = 0.65; // 稍微粗糙的表面
        // 禁用清漆層（啞光效果）
        counterMaterial.clearCoat.isEnabled = false;
        counter.material = counterMaterial;
        counter.receiveShadows = true;
        counter.checkCollisions = true;
        this.physics.addStaticBoxCollider(counter);

        // 吧檯底座 - 深色拋光石材（奢華風格）
        const base = BABYLON.MeshBuilder.CreateBox(
            'barBase',
            { width: 12, height: 1, depth: 2 },
            this.scene
        );
        base.position = new BABYLON.Vector3(0, 0.5, -3);

        const baseMaterial = new BABYLON.PBRMaterial('baseMat', this.scene);
        baseMaterial.albedoColor = new BABYLON.Color3(0.15, 0.15, 0.15); // 深灰拋光石材
        baseMaterial.metallic = 0.0;
        baseMaterial.roughness = 0.15; // 低粗糙度 = 拋光效果
        baseMaterial.environmentIntensity = 0.9;
        baseMaterial.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        baseMaterial.microSurface = 0.9;
        base.material = baseMaterial;
        base.receiveShadows = true;
        base.checkCollisions = true;
        this.physics.addStaticBoxCollider(base);
    }

    /**
     * 創建酒架
     */
    private createLiquorShelf(): void {
        const shelfHeights = [1.5, 2.5, 3.5];
        const shelfMaterial = new BABYLON.PBRMaterial('shelfMat', this.scene);
        shelfMaterial.albedoColor = new BABYLON.Color3(0.25, 0.2, 0.15);
        shelfMaterial.metallic = 0.2;
        shelfMaterial.roughness = 0.6;

        shelfHeights.forEach((height, index) => {
            const shelf = BABYLON.MeshBuilder.CreateBox(
                `shelf_${index}`,
                { width: 10, height: 0.1, depth: 0.8 },
                this.scene
            );
            shelf.position = new BABYLON.Vector3(0, height, -8);
            shelf.material = shelfMaterial;
            shelf.receiveShadows = true;

            // 启用相机碰撞检测
            shelf.checkCollisions = true;

            // 添加架子碰撞體
            this.physics.addStaticBoxCollider(shelf);
        });

        // 酒架背板
        const backPanel = BABYLON.MeshBuilder.CreateBox(
            'shelfBack',
            { width: 10, height: 3, depth: 0.1 },
            this.scene
        );
        backPanel.position = new BABYLON.Vector3(0, 2.5, -8.5);
        const panelMaterial = new BABYLON.PBRMaterial('panelMat', this.scene);
        panelMaterial.albedoColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        panelMaterial.metallic = 0.1;
        panelMaterial.roughness = 0.8;
        backPanel.material = panelMaterial;
        backPanel.receiveShadows = true;
    }

    /**
     * 創建酒瓶（高品質程序化幾何體 + PBR材質）
     * 不同酒類使用獨特的瓶身造型
     */
    private createBarBottles(): void {
        const bottleConfigs = [
            {
                name: 'bottle_whiskey_1',
                position: new BABYLON.Vector3(-4, 1.9, -8),
                liquorType: 'whiskey',
                shape: 'square', // 威士忌使用方形瓶
                liquidColor: new BABYLON.Color3(0.6, 0.35, 0.1) // 琥珀色
            },
            {
                name: 'bottle_gin',
                position: new BABYLON.Vector3(-2, 1.9, -8),
                liquorType: 'gin',
                shape: 'tall', // 琴酒使用高瘦圓瓶
                liquidColor: new BABYLON.Color3(0.95, 0.97, 0.95) // 透明偏白
            },
            {
                name: 'bottle_vodka',
                position: new BABYLON.Vector3(0, 1.9, -8),
                liquorType: 'vodka',
                shape: 'round', // 伏特加使用圓瓶
                liquidColor: new BABYLON.Color3(0.98, 0.98, 1.0) // 透明無色
            },
            {
                name: 'bottle_rum',
                position: new BABYLON.Vector3(2, 1.9, -8),
                liquorType: 'rum',
                shape: 'wide', // 蘭姆酒使用寬瓶
                liquidColor: new BABYLON.Color3(0.5, 0.25, 0.08) // 深琥珀色
            },
            {
                name: 'bottle_tequila',
                position: new BABYLON.Vector3(4, 1.9, -8),
                liquorType: 'tequila',
                shape: 'square', // 龍舌蘭使用方形瓶
                liquidColor: new BABYLON.Color3(0.95, 0.92, 0.8) // 金黃色
            }
        ];

        bottleConfigs.forEach(config => {
            let bottle: BABYLON.Mesh;

            // 根據不同酒類創建獨特的瓶身造型
            switch (config.shape) {
                case 'square':
                    bottle = this.createSquareBottle(config.name, config.position, config.liquidColor);
                    break;
                case 'tall':
                    bottle = this.createTallBottle(config.name, config.position, config.liquidColor);
                    break;
                case 'round':
                    bottle = this.createRoundBottle(config.name, config.position, config.liquidColor);
                    break;
                case 'wide':
                    bottle = this.createWideBottle(config.name, config.position, config.liquidColor);
                    break;
                default:
                    bottle = this.createRoundBottle(config.name, config.position, config.liquidColor);
            }

            this.bottles.push(bottle);

            // 註冊為可互動物品
            this.interaction.registerInteractable(
                bottle,
                ItemType.BOTTLE,
                config.liquorType
            );

            // 添加物理
            this.physics.addCylinderBody(bottle, {
                mass: 0.5,
                restitution: 0.3,
                friction: 0.6
            });

            console.log(`✓ Created procedural bottle: ${config.name}`);
        });
    }

    /**
     * 創建方形威士忌瓶（帶液體）
     */
    private createSquareBottle(
        name: string,
        position: BABYLON.Vector3,
        liquidColor: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身 - 方形
        const body = BABYLON.MeshBuilder.CreateBox(
            `${name}_body`,
            { width: 0.3, height: 0.7, depth: 0.3 },
            this.scene
        );

        // 瓶頸 - 圓柱形
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.18, diameterTop: 0.08, diameterBottom: 0.12, tessellation: 8 },
            this.scene
        );
        neck.position.y = 0.44;

        // 瓶蓋 - 金屬蓋
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            { height: 0.06, diameter: 0.1, tessellation: 8 },
            this.scene
        );
        cap.position.y = 0.56;

        // 液體 - 內部稍小的方形
        const liquid = BABYLON.MeshBuilder.CreateBox(
            `${name}_liquid`,
            { width: 0.28, height: 0.5, depth: 0.28 },
            this.scene
        );
        liquid.position.y = -0.1;

        // 創建高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.05; // 極其光滑
        glassMaterial.alpha = 0.15; // 高透明度
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.5; // 玻璃折射率
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.98;

        // 液體材質
        const liquidMaterial = new BABYLON.PBRMaterial(`${name}_liquid`, this.scene);
        liquidMaterial.albedoColor = liquidColor;
        liquidMaterial.metallic = 0.0;
        liquidMaterial.roughness = 0.1;
        liquidMaterial.alpha = 0.7;
        liquidMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        liquidMaterial.subSurface.isTranslucencyEnabled = true;
        liquidMaterial.subSurface.translucencyIntensity = 0.8;

        // 瓶蓋材質 - 金屬
        const capMaterial = new BABYLON.PBRMaterial(`${name}_cap_mat`, this.scene);
        capMaterial.albedoColor = new BABYLON.Color3(0.15, 0.12, 0.08);
        capMaterial.metallic = 0.6;
        capMaterial.roughness = 0.4;

        // 應用材質
        body.material = glassMaterial;
        neck.material = glassMaterial;
        cap.material = capMaterial;
        liquid.material = liquidMaterial;

        // 合併為一個網格
        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, neck, cap, liquid],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;
        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建高瘦琴酒瓶（帶液體）
     */
    private createTallBottle(
        name: string,
        position: BABYLON.Vector3,
        liquidColor: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身 - 高瘦圓柱 (優化: tessellation降至8)
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            { height: 0.85, diameter: 0.22, tessellation: 8 },
            this.scene
        );
        body.forceSharedVertices(); // 強制共享頂點以實現平滑著色

        // 瓶頸 - 細長 (優化: tessellation降至8)
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.15, diameterTop: 0.06, diameterBottom: 0.11, tessellation: 8 },
            this.scene
        );
        neck.position.y = 0.5;
        neck.forceSharedVertices();

        // 瓶蓋
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            { height: 0.05, diameter: 0.08, tessellation: 8 },
            this.scene
        );
        cap.position.y = 0.6;
        cap.forceSharedVertices();

        // 液體 (優化: tessellation降至8)
        const liquid = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_liquid`,
            { height: 0.72, diameter: 0.2, tessellation: 8 },
            this.scene
        );
        liquid.position.y = -0.065;
        liquid.forceSharedVertices();

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.02;
        glassMaterial.alpha = 0.12;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.52;
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.99;

        // 液體材質
        const liquidMaterial = new BABYLON.PBRMaterial(`${name}_liquid`, this.scene);
        liquidMaterial.albedoColor = liquidColor;
        liquidMaterial.metallic = 0.0;
        liquidMaterial.roughness = 0.08;
        liquidMaterial.alpha = 0.75;
        liquidMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        liquidMaterial.subSurface.isTranslucencyEnabled = true;
        liquidMaterial.subSurface.translucencyIntensity = 0.9;

        // 瓶蓋材質
        const capMaterial = new BABYLON.PBRMaterial(`${name}_cap_mat`, this.scene);
        capMaterial.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.92);
        capMaterial.metallic = 0.95;
        capMaterial.roughness = 0.2;

        body.material = glassMaterial;
        neck.material = glassMaterial;
        cap.material = capMaterial;
        liquid.material = liquidMaterial;

        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, neck, cap, liquid],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;
        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建圓形伏特加瓶（帶液體）
     */
    private createRoundBottle(
        name: string,
        position: BABYLON.Vector3,
        liquidColor: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身 - 標準圓柱 (優化: tessellation降至8)
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            { height: 0.75, diameter: 0.28, tessellation: 8 },
            this.scene
        );
        body.forceSharedVertices();

        // 瓶肩 - 漸變過渡 (優化: tessellation降至8)
        const shoulder = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_shoulder`,
            { height: 0.12, diameterTop: 0.14, diameterBottom: 0.28, tessellation: 8 },
            this.scene
        );
        shoulder.position.y = 0.435;
        shoulder.forceSharedVertices();

        // 瓶頸 (優化: tessellation降至8)
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.14, diameterTop: 0.07, diameterBottom: 0.14, tessellation: 8 },
            this.scene
        );
        neck.position.y = 0.565;
        neck.forceSharedVertices();

        // 瓶蓋
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            { height: 0.06, diameter: 0.09, tessellation: 8 },
            this.scene
        );
        cap.position.y = 0.67;
        cap.forceSharedVertices();

        // 液體 (優化: tessellation降至8)
        const liquid = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_liquid`,
            { height: 0.65, diameter: 0.26, tessellation: 8 },
            this.scene
        );
        liquid.position.y = -0.05;
        liquid.forceSharedVertices();

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.03;
        glassMaterial.alpha = 0.1;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.5;
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.98;

        // 液體材質
        const liquidMaterial = new BABYLON.PBRMaterial(`${name}_liquid`, this.scene);
        liquidMaterial.albedoColor = liquidColor;
        liquidMaterial.metallic = 0.0;
        liquidMaterial.roughness = 0.05;
        liquidMaterial.alpha = 0.8;
        liquidMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        liquidMaterial.subSurface.isTranslucencyEnabled = true;
        liquidMaterial.subSurface.translucencyIntensity = 0.85;

        // 瓶蓋材質
        const capMaterial = new BABYLON.PBRMaterial(`${name}_cap_mat`, this.scene);
        capMaterial.albedoColor = new BABYLON.Color3(0.88, 0.88, 0.9);
        capMaterial.metallic = 0.9;
        capMaterial.roughness = 0.25;

        body.material = glassMaterial;
        shoulder.material = glassMaterial;
        neck.material = glassMaterial;
        cap.material = capMaterial;
        liquid.material = liquidMaterial;

        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, shoulder, neck, cap, liquid],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;
        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建寬蘭姆酒瓶（帶液體）
     */
    private createWideBottle(
        name: string,
        position: BABYLON.Vector3,
        liquidColor: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身 - 寬矮圓柱 (優化: tessellation降至8)
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            { height: 0.6, diameter: 0.35, tessellation: 8 },
            this.scene
        );
        body.forceSharedVertices();

        // 瓶肩 - 寬到窄 (優化: tessellation降至8)
        const shoulder = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_shoulder`,
            { height: 0.15, diameterTop: 0.15, diameterBottom: 0.35, tessellation: 8 },
            this.scene
        );
        shoulder.position.y = 0.375;
        shoulder.forceSharedVertices();

        // 瓶頸 (優化: tessellation降至8)
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.12, diameterTop: 0.08, diameterBottom: 0.15, tessellation: 8 },
            this.scene
        );
        neck.position.y = 0.51;
        neck.forceSharedVertices();

        // 瓶蓋
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            { height: 0.05, diameter: 0.1, tessellation: 8 },
            this.scene
        );
        cap.position.y = 0.6;
        cap.forceSharedVertices();

        // 液體 (優化: tessellation降至8)
        const liquid = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_liquid`,
            { height: 0.52, diameter: 0.33, tessellation: 8 },
            this.scene
        );
        liquid.position.y = -0.04;
        liquid.forceSharedVertices();

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(0.98, 0.96, 0.92);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.04;
        glassMaterial.alpha = 0.14;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.5;
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.97;

        // 液體材質
        const liquidMaterial = new BABYLON.PBRMaterial(`${name}_liquid`, this.scene);
        liquidMaterial.albedoColor = liquidColor;
        liquidMaterial.metallic = 0.0;
        liquidMaterial.roughness = 0.1;
        liquidMaterial.alpha = 0.8;
        liquidMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        liquidMaterial.subSurface.isTranslucencyEnabled = true;
        liquidMaterial.subSurface.translucencyIntensity = 0.75;

        // 瓶蓋材質 - 木塞風格
        const capMaterial = new BABYLON.PBRMaterial(`${name}_cap_mat`, this.scene);
        capMaterial.albedoColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        capMaterial.metallic = 0.0;
        capMaterial.roughness = 0.9;

        body.material = glassMaterial;
        shoulder.material = glassMaterial;
        neck.material = glassMaterial;
        cap.material = capMaterial;
        liquid.material = liquidMaterial;

        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, shoulder, neck, cap, liquid],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;
        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建杯子（高品質玻璃材質與液體）
     */
    private createGlasses(): void {
        // 在吧檯上創建3個杯子
        const glassConfigs = [
            { position: new BABYLON.Vector3(-3, 1.2, -3), style: 'highball' },
            { position: new BABYLON.Vector3(0, 1.2, -3), style: 'rocks' },
            { position: new BABYLON.Vector3(3, 1.2, -3), style: 'coupe' }
        ];

        glassConfigs.forEach((config, index) => {
            let glass: BABYLON.Mesh;

            // 根據樣式創建不同的杯子
            switch (config.style) {
                case 'highball':
                    glass = this.createHighballGlass(`glass_${index}`, config.position);
                    break;
                case 'rocks':
                    glass = this.createRocksGlass(`glass_${index}`, config.position);
                    break;
                case 'coupe':
                    glass = this.createCoupeGlass(`glass_${index}`, config.position);
                    break;
                default:
                    glass = this.createHighballGlass(`glass_${index}`, config.position);
            }

            this.glasses.push(glass);

            // 註冊為可互動物品
            this.interaction.registerInteractable(glass, ItemType.GLASS);

            // 添加物理
            this.physics.addCylinderBody(glass, {
                mass: 0.3,
                restitution: 0.2,
                friction: 0.5
            });

            // 初始化杯子容器
            this.cocktail.initContainer(glass, 300);
        });
    }

    /**
     * 創建高球杯（Highball Glass）- 簡化為空心圓柱
     */
    private createHighballGlass(name: string, position: BABYLON.Vector3): BABYLON.Mesh {
        // 杯身 - 高直筒（簡化：降低tessellation到8）
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            {
                height: 0.55,
                diameterTop: 0.28,
                diameterBottom: 0.27,
                tessellation: 8
            },
            this.scene
        );

        // 杯底 - 厚實的玻璃底（簡化：降低tessellation到8）
        const bottom = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_bottom`,
            { height: 0.05, diameter: 0.27, tessellation: 8 },
            this.scene
        );
        bottom.position.y = -0.3;

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.02; // 極光滑
        glassMaterial.alpha = 0.08; // 極高透明度
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.52; // 玻璃折射率
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.99;

        body.material = glassMaterial;
        bottom.material = glassMaterial;

        const glass = BABYLON.Mesh.MergeMeshes(
            [body, bottom],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        glass.name = name;
        glass.position = position;
        glass.castShadow = true;

        return glass;
    }

    /**
     * 創建威士忌杯（Rocks/Old Fashioned Glass）- 簡化為空心圓柱
     */
    private createRocksGlass(name: string, position: BABYLON.Vector3): BABYLON.Mesh {
        // 杯身 - 矮寬（簡化：降低tessellation到8）
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            {
                height: 0.4,
                diameterTop: 0.32,
                diameterBottom: 0.28,
                tessellation: 8
            },
            this.scene
        );

        // 杯底（簡化：降低tessellation到8）
        const bottom = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_bottom`,
            { height: 0.08, diameter: 0.28, tessellation: 8 },
            this.scene
        );
        bottom.position.y = -0.24;

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.01;
        glassMaterial.alpha = 0.1;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.5;
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.98;

        body.material = glassMaterial;
        bottom.material = glassMaterial;

        const glass = BABYLON.Mesh.MergeMeshes(
            [body, bottom],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        glass.name = name;
        glass.position = position;
        glass.castShadow = true;

        return glass;
    }

    /**
     * 創建雞尾酒杯（Coupe Glass）- 簡化為高球杯樣式
     */
    private createCoupeGlass(name: string, position: BABYLON.Vector3): BABYLON.Mesh {
        // 簡化為高球杯樣式，以提升性能（簡化：降低tessellation到8）
        const bowl = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_bowl`,
            { height: 0.45, diameterTop: 0.28, diameterBottom: 0.27, tessellation: 8 },
            this.scene
        );
        bowl.position.y = 0.15;

        // 杯腳 - 細長（簡化：降低tessellation到8）
        const stem = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_stem`,
            { height: 0.25, diameter: 0.03, tessellation: 8 },
            this.scene
        );
        stem.position.y = -0.125;

        // 杯座（簡化：降低tessellation到8）
        const base = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_base`,
            { height: 0.03, diameterTop: 0.08, diameterBottom: 0.12, tessellation: 8 },
            this.scene
        );
        base.position.y = -0.265;

        // 高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_glass`, this.scene);
        glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.metallic = 0.0;
        glassMaterial.roughness = 0.015;
        glassMaterial.alpha = 0.09;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        glassMaterial.indexOfRefraction = 1.52;
        glassMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        glassMaterial.microSurface = 0.99;

        bowl.material = glassMaterial;
        stem.material = glassMaterial;
        base.material = glassMaterial;

        const glass = BABYLON.Mesh.MergeMeshes(
            [bowl, stem, base],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        glass.name = name;
        glass.position = position;
        glass.castShadow = true;

        return glass;
    }

    /**
     * 創建調酒工具（程序化幾何體 + 高品質金屬材質）
     */
    private async createBarTools(): Promise<void> {
        // Cobbler Shaker（經典三件式搖酒器）
        const shaker = this.createCobblerShaker('shaker', new BABYLON.Vector3(-5, 1.2, -3));
        this.barTools.shaker = shaker;
        this.interaction.registerInteractable(shaker, ItemType.SHAKER);
        this.physics.addCylinderBody(shaker, {
            mass: 0.6,
            restitution: 0.4,
            friction: 0.5
        });
        this.cocktail.initContainer(shaker, 500);
        console.log('✓ Created procedural Cobbler shaker');

        // Jigger（雙端量酒器）
        const jigger = this.createJigger('jigger', new BABYLON.Vector3(5, 1.2, -3));
        this.barTools.jigger = jigger;
        this.interaction.registerInteractable(jigger, ItemType.JIGGER);
        this.physics.addCylinderBody(jigger, {
            mass: 0.2,
            restitution: 0.3,
            friction: 0.5
        });
        console.log('✓ Created procedural jigger');
    }

    /**
     * 創建經典三件式搖酒器（Cobbler Shaker）- 性能優化版
     */
    private createCobblerShaker(name: string, position: BABYLON.Vector3): BABYLON.Mesh {
        // 主體 - 底部容器（簡化：降低tessellation到8）
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            {
                height: 0.6,
                diameterTop: 0.38,
                diameterBottom: 0.4,
                tessellation: 8
            },
            this.scene
        );

        // 上蓋 - 帶濾網的中間部分（簡化：降低tessellation到8）
        const lid = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_lid`,
            {
                height: 0.12,
                diameterTop: 0.36,
                diameterBottom: 0.38,
                tessellation: 8
            },
            this.scene
        );
        lid.position.y = 0.36;

        // 頂蓋 - 小頂部（簡化：降低tessellation到8）
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            {
                height: 0.08,
                diameterTop: 0.15,
                diameterBottom: 0.36,
                tessellation: 8
            },
            this.scene
        );
        cap.position.y = 0.46;

        // 頂部旋鈕（簡化：降低segments到8）
        const knob = BABYLON.MeshBuilder.CreateSphere(
            `${name}_knob`,
            { diameter: 0.08, segments: 8 },
            this.scene
        );
        knob.position.y = 0.54;
        knob.scaling.y = 0.7; // 壓扁一點

        // 高品質拋光不鏽鋼材質
        const metalMaterial = new BABYLON.PBRMaterial(`${name}_metal`, this.scene);
        metalMaterial.albedoColor = new BABYLON.Color3(0.88, 0.88, 0.9);
        metalMaterial.metallic = 1.0; // 完全金屬
        metalMaterial.roughness = 0.15; // 高度拋光
        metalMaterial.environmentIntensity = 1.5;
        metalMaterial.reflectivityColor = new BABYLON.Color3(0.95, 0.95, 0.97);
        metalMaterial.microSurface = 0.95;
        // 添加清晰的金屬反射
        metalMaterial.clearCoat.isEnabled = true;
        metalMaterial.clearCoat.intensity = 0.3;

        // 應用材質
        body.material = metalMaterial;
        lid.material = metalMaterial;
        cap.material = metalMaterial;
        knob.material = metalMaterial;

        // 合併為一個網格
        const shaker = BABYLON.Mesh.MergeMeshes(
            [body, lid, cap, knob],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        shaker.name = name;
        shaker.position = position;
        shaker.castShadow = true;

        return shaker;
    }

    /**
     * 創建雙端量酒器（Jigger）- 改進的雙錐形設計
     */
    private createJigger(name: string, position: BABYLON.Vector3): BABYLON.Mesh {
        // 大端（50ml）- 使用錐形（簡化：降低tessellation到8）
        const largeCup = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_large`,
            {
                height: 0.12,
                diameterTop: 0.2,
                diameterBottom: 0.08,
                tessellation: 8
            },
            this.scene
        );
        largeCup.position.y = 0.06;

        // 小端（25ml）- 使用錐形（簡化：降低tessellation到8）
        const smallCup = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_small`,
            {
                height: 0.08,
                diameterTop: 0.15,
                diameterBottom: 0.08,
                tessellation: 8
            },
            this.scene
        );
        smallCup.position.y = -0.04;

        // 中央連接環（簡化：降低tessellation到8）
        const connector = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_connector`,
            {
                height: 0.02,
                diameter: 0.08,
                tessellation: 8
            },
            this.scene
        );

        // 拋光不鏽鋼材質
        const metalMaterial = new BABYLON.PBRMaterial(`${name}_metal`, this.scene);
        metalMaterial.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.92);
        metalMaterial.metallic = 1.0;
        metalMaterial.roughness = 0.18;
        metalMaterial.environmentIntensity = 1.4;
        metalMaterial.reflectivityColor = new BABYLON.Color3(0.95, 0.95, 0.97);
        metalMaterial.microSurface = 0.93;

        largeCup.material = metalMaterial;
        smallCup.material = metalMaterial;
        connector.material = metalMaterial;

        // 合併為一個網格
        const jigger = BABYLON.Mesh.MergeMeshes(
            [largeCup, smallCup, connector],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        jigger.name = name;
        jigger.position = position;
        jigger.castShadow = true;

        return jigger;
    }

    /**
     * 創建家具（桌椅）
     */
    private createFurniture(): void {
        // 創建1張簡單的桌子（減少以提升性能）
        const tablePositions = [
            new BABYLON.Vector3(0, 0, 3)
        ];

        // 使用StandardMaterial以提升性能（家具不需要PBR）
        const tableMaterial = new BABYLON.StandardMaterial('tableMat', this.scene);
        tableMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        tableMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        tablePositions.forEach((position, index) => {
            // 桌面（性能優化：降低到6邊形）
            const tableTop = BABYLON.MeshBuilder.CreateCylinder(
                `tableTop_${index}`,
                { height: 0.1, diameter: 1.2, tessellation: 6 },
                this.scene
            );
            tableTop.position = new BABYLON.Vector3(position.x, 0.75, position.z);
            tableTop.material = tableMaterial;
            tableTop.receiveShadows = true;

            // 启用相机碰撞检测
            tableTop.checkCollisions = true;

            this.physics.addStaticBoxCollider(tableTop);

            // 桌腿（性能優化：降低到6邊形）
            const tableLeg = BABYLON.MeshBuilder.CreateCylinder(
                `tableLeg_${index}`,
                { height: 0.7, diameter: 0.1, tessellation: 6 },
                this.scene
            );
            tableLeg.position = new BABYLON.Vector3(position.x, 0.35, position.z);
            tableLeg.material = tableMaterial;
            tableLeg.castShadow = true;
        });

        // 創建吧檯椅（減少到2個以提升性能）
        const stoolPositions = [
            new BABYLON.Vector3(-2, 0, -1),
            new BABYLON.Vector3(2, 0, -1)
        ];

        // 使用StandardMaterial以提升性能（椅子不需要PBR）
        const stoolMaterial = new BABYLON.StandardMaterial('stoolMat', this.scene);
        stoolMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        stoolMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

        stoolPositions.forEach((position, index) => {
            // 椅座（性能優化：降低到6邊形）
            const seat = BABYLON.MeshBuilder.CreateCylinder(
                `stoolSeat_${index}`,
                { height: 0.08, diameter: 0.4, tessellation: 6 },
                this.scene
            );
            seat.position = new BABYLON.Vector3(position.x, 0.65, position.z);
            seat.material = stoolMaterial;
            seat.receiveShadows = true;

            // 椅腿（性能優化：降低到6邊形）
            const leg = BABYLON.MeshBuilder.CreateCylinder(
                `stoolLeg_${index}`,
                { height: 0.6, diameter: 0.06, tessellation: 6 },
                this.scene
            );
            leg.position = new BABYLON.Vector3(position.x, 0.3, position.z);
            leg.material = stoolMaterial;
            leg.castShadow = true;
        });

        // ===== 測試用：在桌面上添加一個簡單的圓柱體酒瓶 =====
        this.createTestBottleOnTable();
    }

    /**
     * 創建測試用圓柱體酒瓶（放在桌面上）
     */
    private createTestBottleOnTable(): void {
        const bottleHeight = 0.25;
        const bottleRadius = 0.05;

        // 創建瓶身（圓柱體）
        const bottle = BABYLON.MeshBuilder.CreateCylinder(
            'testBottle',
            {
                height: bottleHeight,
                diameterTop: bottleRadius * 2,
                diameterBottom: bottleRadius * 2,
                tessellation: 12
            },
            this.scene
        );

        // 放在桌面上（桌子位置是 (0, 0.75, 3)，桌面高度 0.1）
        bottle.position = new BABYLON.Vector3(0, 0.75 + 0.05 + bottleHeight / 2, 3);

        // 創建簡單的玻璃材質
        const glassMat = new BABYLON.PBRMaterial('testBottleGlass', this.scene);
        glassMat.metallic = 0.0;
        glassMat.roughness = 0.05;
        glassMat.alpha = 0.15;
        glassMat.indexOfRefraction = 1.5;
        glassMat.subSurface.isTranslucencyEnabled = true;
        glassMat.subSurface.translucencyIntensity = 0.8;
        bottle.material = glassMat;

        // 創建液體（伏特加 - 透明）
        const liquid = BABYLON.MeshBuilder.CreateCylinder(
            'testBottleLiquid',
            {
                height: bottleHeight * 0.7,
                diameter: bottleRadius * 1.8,
                tessellation: 12
            },
            this.scene
        );
        liquid.parent = bottle;
        liquid.position.y = -bottleHeight * 0.15;

        const liquidMat = new BABYLON.PBRMaterial('testLiquidMat', this.scene);
        liquidMat.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95); // 伏特加顏色
        liquidMat.metallic = 0.0;
        liquidMat.roughness = 0.1;
        liquidMat.alpha = 0.5;
        liquidMat.subSurface.isTranslucencyEnabled = true;
        liquidMat.subSurface.translucencyIntensity = 0.9;
        liquid.material = liquidMat;

        // 啟用陰影
        bottle.castShadow = true;

        // 添加物理（動態物體）
        this.physics.addCylinderBody(bottle, {
            mass: 0.3,
            restitution: 0.3,
            friction: 0.6
        });

        // 註冊為可互動物品（酒瓶）
        this.interaction.registerInteractable(
            bottle,
            'bottle' as any,
            'vodka', // 伏特加類型
            500 // 容量 500ml
        );

        // 初始化容器內容（伏特加）
        this.cocktailSystem.initializeContainer(bottle, 'vodka', 500, 500);

        console.log('✅ 測試用圓柱體酒瓶已添加到桌面 (位置: 0, 0.8, 3)');
    }

    /**
     * 獲取所有酒瓶
     */
    getBottles(): BABYLON.Mesh[] {
        return this.bottles;
    }

    /**
     * 獲取所有杯子
     */
    getGlasses(): BABYLON.Mesh[] {
        return this.glasses;
    }

    /**
     * 獲取調酒工具
     */
    getBarTools(): { shaker?: BABYLON.Mesh; jigger?: BABYLON.Mesh } {
        return this.barTools;
    }
}

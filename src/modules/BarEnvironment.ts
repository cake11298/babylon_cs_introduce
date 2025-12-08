/**
 * 酒吧環境模組 - 創建酒吧場景、物品和互動物件
 * 使用 Babylon.js PBR 材質和物理系統
 */

import * as BABYLON from '@babylonjs/core';
import type PhysicsSystem from './PhysicsSystem';
import type InteractionSystem from './InteractionSystem';
import type CocktailSystem from './CocktailSystem';
import ModelLoader from './ModelLoader';
import { ItemType } from '../types/types';

export default class BarEnvironment {
    private scene: BABYLON.Scene;
    private physics: PhysicsSystem;
    private interaction: InteractionSystem;
    private cocktail: CocktailSystem;
    private modelLoader: ModelLoader;

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
        this.modelLoader = new ModelLoader(scene);
    }

    /**
     * 創建完整的酒吧環境（已升级：支持FBX模型）
     */
    async createEnvironment(): Promise<void> {
        this.createFloorAndWalls();
        this.createBarCounter();
        this.createLiquorShelf();
        await this.createBarBottles(); // 异步加载FBX模型
        this.createGlasses();
        await this.createBarTools(); // 异步加载FBX模型
        this.createFurniture();
    }

    /**
     * 創建地板和牆壁（高品質PBR材質）
     */
    private createFloorAndWalls(): void {
        // 地板 - 深色木質地板
        const floor = BABYLON.MeshBuilder.CreateGround(
            'floor',
            { width: 30, height: 30 },
            this.scene
        );
        const floorMaterial = new BABYLON.PBRMaterial('floorMat', this.scene);
        floorMaterial.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1); // 深色木質
        floorMaterial.metallic = 0.0;
        floorMaterial.roughness = 0.6;
        floorMaterial.environmentIntensity = 0.8;
        // 添加微弱的反射效果
        floorMaterial.reflectivityColor = new BABYLON.Color3(0.15, 0.12, 0.1);
        floorMaterial.microSurface = 0.7;
        floor.material = floorMaterial;
        floor.receiveShadows = true;
        floor.checkCollisions = true;
        this.physics.addStaticBoxCollider(floor);

        // 後牆 - 深色磚牆質感
        const backWall = BABYLON.MeshBuilder.CreateBox(
            'backWall',
            { width: 30, height: 5, depth: 0.3 },
            this.scene
        );
        backWall.position = new BABYLON.Vector3(0, 2.5, -10);
        const wallMaterial = new BABYLON.PBRMaterial('wallMat', this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.25, 0.2, 0.18); // 深灰棕色
        wallMaterial.metallic = 0.0;
        wallMaterial.roughness = 0.95;
        wallMaterial.environmentIntensity = 0.3;
        // 添加細微的凹凸感
        wallMaterial.microSurface = 0.6;
        backWall.material = wallMaterial;
        backWall.receiveShadows = true;
        backWall.checkCollisions = true;
        this.physics.addStaticBoxCollider(backWall);

        // 左牆
        const leftWall = BABYLON.MeshBuilder.CreateBox(
            'leftWall',
            { width: 0.3, height: 5, depth: 20 },
            this.scene
        );
        leftWall.position = new BABYLON.Vector3(-15, 2.5, 0);
        leftWall.material = wallMaterial;
        leftWall.receiveShadows = true;

        // 启用相机碰撞检测
        leftWall.checkCollisions = true;

        this.physics.addStaticBoxCollider(leftWall);

        // 右牆
        const rightWall = BABYLON.MeshBuilder.CreateBox(
            'rightWall',
            { width: 0.3, height: 5, depth: 20 },
            this.scene
        );
        rightWall.position = new BABYLON.Vector3(15, 2.5, 0);
        rightWall.material = wallMaterial;
        rightWall.receiveShadows = true;

        // 启用相机碰撞检测
        rightWall.checkCollisions = true;

        this.physics.addStaticBoxCollider(rightWall);

        // 天花板
        const ceiling = BABYLON.MeshBuilder.CreateBox(
            'ceiling',
            { width: 30, height: 0.3, depth: 30 },
            this.scene
        );
        ceiling.position = new BABYLON.Vector3(0, 5, 0);
        const ceilingMaterial = new BABYLON.PBRMaterial('ceilingMat', this.scene);
        ceilingMaterial.albedoColor = new BABYLON.Color3(0.25, 0.22, 0.2);
        ceilingMaterial.metallic = 0.0;
        ceilingMaterial.roughness = 0.95;
        ceiling.material = ceilingMaterial;
        ceiling.receiveShadows = true;

        // 启用相机碰撞检测
        ceiling.checkCollisions = true;

        this.physics.addStaticBoxCollider(ceiling);
    }

    /**
     * 創建吧檯（高品質木質材質）
     */
    private createBarCounter(): void {
        // 吧檯檯面 - 拋光深色木材
        const counter = BABYLON.MeshBuilder.CreateBox(
            'barCounter',
            { width: 12, height: 0.15, depth: 2 },
            this.scene
        );
        counter.position = new BABYLON.Vector3(0, 1.05, -3);

        const counterMaterial = new BABYLON.PBRMaterial('counterMat', this.scene);
        counterMaterial.albedoColor = new BABYLON.Color3(0.18, 0.12, 0.08); // 深紅棕色
        counterMaterial.metallic = 0.0; // 木材不是金屬
        counterMaterial.roughness = 0.25; // 拋光效果
        counterMaterial.environmentIntensity = 1.0;
        // 添加木質光澤
        counterMaterial.reflectivityColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        counterMaterial.microSurface = 0.85;
        // 添加清漆層效果
        counterMaterial.clearCoat.isEnabled = true;
        counterMaterial.clearCoat.intensity = 0.5;
        counter.material = counterMaterial;
        counter.receiveShadows = true;
        counter.checkCollisions = true;
        this.physics.addStaticBoxCollider(counter);

        // 吧檯底座 - 深色木材
        const base = BABYLON.MeshBuilder.CreateBox(
            'barBase',
            { width: 12, height: 1, depth: 2 },
            this.scene
        );
        base.position = new BABYLON.Vector3(0, 0.5, -3);

        const baseMaterial = new BABYLON.PBRMaterial('baseMat', this.scene);
        baseMaterial.albedoColor = new BABYLON.Color3(0.12, 0.08, 0.05);
        baseMaterial.metallic = 0.0;
        baseMaterial.roughness = 0.8;
        baseMaterial.environmentIntensity = 0.5;
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
     * 創建酒瓶（優化版：使用高品質幾何體代替FBX）
     * 注意：FBX模型因頂點過多（2MB+）會導致性能問題，已改用優化幾何體
     */
    private async createBarBottles(): Promise<void> {
        const bottleConfigs = [
            {
                name: 'bottle_whiskey_1',
                position: new BABYLON.Vector3(-2, 1.9, -8),
                liquorType: 'whiskey',
                color: new BABYLON.Color3(0.6, 0.3, 0.1) // 琥珀色威士忌
            },
            {
                name: 'bottle_gin',
                position: new BABYLON.Vector3(0, 1.9, -8),
                liquorType: 'gin',
                color: new BABYLON.Color3(0.9, 0.95, 0.95) // 透明琴酒
            },
            {
                name: 'bottle_whiskey_2',
                position: new BABYLON.Vector3(2, 1.9, -8),
                liquorType: 'whiskey',
                color: new BABYLON.Color3(0.6, 0.3, 0.1) // 琥珀色威士忌
            }
        ];

        for (const config of bottleConfigs) {
            const bottle = this.createOptimizedBottle(
                config.name,
                config.position,
                config.color
            );

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

            console.log(`✓ Created optimized bottle: ${config.name}`);
        }
    }

    /**
     * 創建優化的酒瓶（高品質PBR材質）
     */
    private createOptimizedBottle(
        name: string,
        position: BABYLON.Vector3,
        color: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身 - 降低tessellation以提升性能
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            { height: 0.8, diameter: 0.3, tessellation: 12 },
            this.scene
        );

        // 瓶頸
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.2, diameterTop: 0.08, diameterBottom: 0.15, tessellation: 12 },
            this.scene
        );
        neck.position.y = 0.5;

        // 瓶蓋
        const cap = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_cap`,
            { height: 0.08, diameter: 0.1, tessellation: 12 },
            this.scene
        );
        cap.position.y = 0.64;

        // 合併為一個網格
        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, neck, cap],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;

        // 創建高品質玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_mat`, this.scene);
        glassMaterial.albedoColor = color;
        glassMaterial.metallic = 0.05;
        glassMaterial.roughness = 0.15; // 光滑玻璃
        glassMaterial.alpha = 0.85;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;

        // 添加反射效果
        glassMaterial.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        glassMaterial.microSurface = 0.95;

        // 添加折射效果
        glassMaterial.indexOfRefraction = 1.5; // 玻璃的折射率

        bottle.material = glassMaterial;
        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建杯子
     */
    private createGlasses(): void {
        // 在吧檯上創建2個杯子（減少以提升性能）
        const glassPositions = [
            new BABYLON.Vector3(-2, 1.2, -3),
            new BABYLON.Vector3(2, 1.2, -3)
        ];

        glassPositions.forEach((position, index) => {
            const glass = BABYLON.MeshBuilder.CreateCylinder(
                `glass_${index}`,
                {
                    height: 0.6,
                    diameterTop: 0.3,
                    diameterBottom: 0.26,
                    tessellation: 24
                },
                this.scene
            );
            glass.position = position;

            // 玻璃材質
            const glassMaterial = new BABYLON.PBRMaterial(`glassMat_${index}`, this.scene);
            glassMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
            glassMaterial.metallic = 0.0;
            glassMaterial.roughness = 0.1;
            glassMaterial.alpha = 0.3;
            glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
            glass.material = glassMaterial;

            glass.castShadow = true;

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
     * 創建調酒工具（優化版：使用高品質幾何體）
     */
    private async createBarTools(): Promise<void> {
        // Shaker（搖酒器）- 優化的幾何體
        const shaker = BABYLON.MeshBuilder.CreateCylinder(
            'shaker',
            {
                height: 0.65,
                diameterTop: 0.35,
                diameterBottom: 0.4,
                tessellation: 20
            },
            this.scene
        );
        shaker.position = new BABYLON.Vector3(-5, 1.2, -3);

        // 高品質不鏽鋼材質
        const shakerMaterial = new BABYLON.PBRMaterial('shakerMat', this.scene);
        shakerMaterial.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.88);
        shakerMaterial.metallic = 0.95; // 高金屬感
        shakerMaterial.roughness = 0.2; // 拋光不鏽鋼
        shakerMaterial.environmentIntensity = 1.2;
        shakerMaterial.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        shakerMaterial.microSurface = 0.9;
        shaker.material = shakerMaterial;
        shaker.castShadow = true;

        this.barTools.shaker = shaker;

        // 註冊為可互動物品
        this.interaction.registerInteractable(shaker, ItemType.SHAKER);

        // 添加物理
        this.physics.addCylinderBody(shaker, {
            mass: 0.6,
            restitution: 0.4,
            friction: 0.5
        });

        // 初始化 Shaker 容器
        this.cocktail.initContainer(shaker, 500);

        console.log('✓ Created optimized shaker');

        // Jigger（量酒器）
        const jigger = BABYLON.MeshBuilder.CreateCylinder(
            'jigger',
            {
                height: 0.18,
                diameterTop: 0.18,
                diameterBottom: 0.26,
                tessellation: 16
            },
            this.scene
        );
        jigger.position = new BABYLON.Vector3(5, 1.2, -3);

        const jiggerMaterial = new BABYLON.PBRMaterial('jiggerMat', this.scene);
        jiggerMaterial.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.9);
        jiggerMaterial.metallic = 0.85;
        jiggerMaterial.roughness = 0.4;
        jigger.material = jiggerMaterial;
        jigger.castShadow = true;

        this.barTools.jigger = jigger;

        // 註冊為可互動物品
        this.interaction.registerInteractable(jigger, ItemType.JIGGER);

        // 添加物理
        this.physics.addCylinderBody(jigger, {
            mass: 0.2,
            restitution: 0.3,
            friction: 0.5
        });
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
            // 桌面（优化：降低多边形数量）
            const tableTop = BABYLON.MeshBuilder.CreateCylinder(
                `tableTop_${index}`,
                { height: 0.1, diameter: 1.2, tessellation: 12 },
                this.scene
            );
            tableTop.position = new BABYLON.Vector3(position.x, 0.75, position.z);
            tableTop.material = tableMaterial;
            tableTop.receiveShadows = true;

            // 启用相机碰撞检测
            tableTop.checkCollisions = true;

            this.physics.addStaticBoxCollider(tableTop);

            // 桌腿（优化：降低多边形数量）
            const tableLeg = BABYLON.MeshBuilder.CreateCylinder(
                `tableLeg_${index}`,
                { height: 0.7, diameter: 0.1, tessellation: 8 },
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
            // 椅座（优化：降低多边形数量）
            const seat = BABYLON.MeshBuilder.CreateCylinder(
                `stoolSeat_${index}`,
                { height: 0.08, diameter: 0.4, tessellation: 12 },
                this.scene
            );
            seat.position = new BABYLON.Vector3(position.x, 0.65, position.z);
            seat.material = stoolMaterial;
            seat.receiveShadows = true;

            // 椅腿（优化：降低多边形数量）
            const leg = BABYLON.MeshBuilder.CreateCylinder(
                `stoolLeg_${index}`,
                { height: 0.6, diameter: 0.06, tessellation: 8 },
                this.scene
            );
            leg.position = new BABYLON.Vector3(position.x, 0.3, position.z);
            leg.material = stoolMaterial;
            leg.castShadow = true;
        });
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

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
     * 創建完整的酒吧環境
     */
    createEnvironment(): void {
        this.createFloorAndWalls();
        this.createBarCounter();
        this.createLiquorShelf();
        this.createBarBottles();
        this.createGlasses();
        this.createBarTools();
        this.createFurniture();
    }

    /**
     * 創建地板和牆壁
     */
    private createFloorAndWalls(): void {
        // 地板
        const floor = BABYLON.MeshBuilder.CreateGround(
            'floor',
            { width: 30, height: 30 },
            this.scene
        );
        const floorMaterial = new BABYLON.PBRMaterial('floorMat', this.scene);
        floorMaterial.albedoColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        floorMaterial.metallic = 0.1;
        floorMaterial.roughness = 0.8;
        floor.material = floorMaterial;
        floor.receiveShadows = true;

        // 启用相机碰撞检测
        floor.checkCollisions = true;

        // 添加地板物理碰撞
        this.physics.addStaticBoxCollider(floor);

        // 後牆
        const backWall = BABYLON.MeshBuilder.CreateBox(
            'backWall',
            { width: 30, height: 5, depth: 0.3 },
            this.scene
        );
        backWall.position = new BABYLON.Vector3(0, 2.5, -10);
        const wallMaterial = new BABYLON.PBRMaterial('wallMat', this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.4, 0.35, 0.3);
        wallMaterial.metallic = 0.05;
        wallMaterial.roughness = 0.9;
        backWall.material = wallMaterial;
        backWall.receiveShadows = true;

        // 启用相机碰撞检测
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
    }

    /**
     * 創建吧檯
     */
    private createBarCounter(): void {
        // 吧檯檯面
        const counter = BABYLON.MeshBuilder.CreateBox(
            'barCounter',
            { width: 12, height: 0.15, depth: 2 },
            this.scene
        );
        counter.position = new BABYLON.Vector3(0, 1.05, -3);

        const counterMaterial = new BABYLON.PBRMaterial('counterMat', this.scene);
        counterMaterial.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        counterMaterial.metallic = 0.3;
        counterMaterial.roughness = 0.4;
        counter.material = counterMaterial;
        counter.receiveShadows = true;

        // 启用相机碰撞检测
        counter.checkCollisions = true;

        // 添加檯面碰撞體
        this.physics.addStaticBoxCollider(counter);

        // 吧檯底座
        const base = BABYLON.MeshBuilder.CreateBox(
            'barBase',
            { width: 12, height: 1, depth: 2 },
            this.scene
        );
        base.position = new BABYLON.Vector3(0, 0.5, -3);

        const baseMaterial = new BABYLON.PBRMaterial('baseMat', this.scene);
        baseMaterial.albedoColor = new BABYLON.Color3(0.15, 0.1, 0.05);
        baseMaterial.metallic = 0.1;
        baseMaterial.roughness = 0.7;
        base.material = baseMaterial;
        base.receiveShadows = true;

        // 启用相机碰撞检测
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
     * 創建酒瓶
     */
    private createBarBottles(): void {
        const liquorTypes = ['vodka', 'gin', 'rum', 'whiskey', 'tequila', 'brandy'];
        const liquorColors: { [key: string]: BABYLON.Color3 } = {
            vodka: new BABYLON.Color3(0.95, 0.95, 0.95),
            gin: new BABYLON.Color3(0.9, 0.95, 0.97),
            rum: new BABYLON.Color3(0.8, 0.6, 0.4),
            whiskey: new BABYLON.Color3(0.7, 0.4, 0.2),
            tequila: new BABYLON.Color3(0.95, 0.85, 0.7),
            brandy: new BABYLON.Color3(0.55, 0.27, 0.07)
        };

        // 在酒架上創建酒瓶（3層，每層2瓶）
        const shelfHeights = [1.5, 2.5, 3.5];
        let bottleIndex = 0;

        shelfHeights.forEach((shelfY) => {
            for (let i = 0; i < 2; i++) {
                const xPos = -2 + i * 4;
                const liquorType = liquorTypes[bottleIndex % liquorTypes.length];

                const bottle = this.createBottle(
                    `bottle_${bottleIndex}`,
                    new BABYLON.Vector3(xPos, shelfY + 0.5, -8),
                    liquorColors[liquorType]
                );

                this.bottles.push(bottle);

                // 註冊為可互動物品
                this.interaction.registerInteractable(
                    bottle,
                    ItemType.BOTTLE,
                    liquorType
                );

                // 添加物理
                this.physics.addCylinderBody(bottle, {
                    mass: 0.5,
                    restitution: 0.3,
                    friction: 0.6
                });

                bottleIndex++;
            }
        });
    }

    /**
     * 創建單個酒瓶
     */
    private createBottle(
        name: string,
        position: BABYLON.Vector3,
        color: BABYLON.Color3
    ): BABYLON.Mesh {
        // 瓶身
        const body = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_body`,
            { height: 0.8, diameter: 0.3, tessellation: 16 },
            this.scene
        );

        // 瓶頸
        const neck = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_neck`,
            { height: 0.15, diameterTop: 0.08, diameterBottom: 0.15, tessellation: 16 },
            this.scene
        );
        neck.position.y = 0.475;

        // 合併為一個網格
        const bottle = BABYLON.Mesh.MergeMeshes(
            [body, neck],
            true,
            true,
            undefined,
            false,
            true
        ) as BABYLON.Mesh;

        bottle.name = name;
        bottle.position = position;

        // 創建玻璃材質
        const glassMaterial = new BABYLON.PBRMaterial(`${name}_mat`, this.scene);
        glassMaterial.albedoColor = color;
        glassMaterial.metallic = 0.1;
        glassMaterial.roughness = 0.2;
        glassMaterial.alpha = 0.7;
        glassMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        bottle.material = glassMaterial;

        bottle.castShadow = true;

        return bottle;
    }

    /**
     * 創建杯子
     */
    private createGlasses(): void {
        // 在吧檯上創建3個杯子
        const glassPositions = [
            new BABYLON.Vector3(-3, 1.2, -3),
            new BABYLON.Vector3(0, 1.2, -3),
            new BABYLON.Vector3(3, 1.2, -3)
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
     * 創建調酒工具
     */
    private createBarTools(): void {
        // Shaker（搖酒器）
        const shaker = BABYLON.MeshBuilder.CreateCylinder(
            'shaker',
            {
                height: 0.65,
                diameterTop: 0.4,
                diameterBottom: 0.44,
                tessellation: 24
            },
            this.scene
        );
        shaker.position = new BABYLON.Vector3(-5, 1.2, -3);

        const shakerMaterial = new BABYLON.PBRMaterial('shakerMat', this.scene);
        shakerMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.85);
        shakerMaterial.metallic = 0.9;
        shakerMaterial.roughness = 0.3;
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
        // 創建幾張簡單的桌子
        const tablePositions = [
            new BABYLON.Vector3(-6, 0, 2),
            new BABYLON.Vector3(0, 0, 4),
            new BABYLON.Vector3(6, 0, 2)
        ];

        const tableMaterial = new BABYLON.PBRMaterial('tableMat', this.scene);
        tableMaterial.albedoColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        tableMaterial.metallic = 0.2;
        tableMaterial.roughness = 0.6;

        tablePositions.forEach((position, index) => {
            // 桌面
            const tableTop = BABYLON.MeshBuilder.CreateCylinder(
                `tableTop_${index}`,
                { height: 0.1, diameter: 1.2, tessellation: 24 },
                this.scene
            );
            tableTop.position = new BABYLON.Vector3(position.x, 0.75, position.z);
            tableTop.material = tableMaterial;
            tableTop.receiveShadows = true;

            // 启用相机碰撞检测
            tableTop.checkCollisions = true;

            this.physics.addStaticBoxCollider(tableTop);

            // 桌腿
            const tableLeg = BABYLON.MeshBuilder.CreateCylinder(
                `tableLeg_${index}`,
                { height: 0.7, diameter: 0.1, tessellation: 12 },
                this.scene
            );
            tableLeg.position = new BABYLON.Vector3(position.x, 0.35, position.z);
            tableLeg.material = tableMaterial;
            tableLeg.castShadow = true;
        });

        // 創建吧檯椅
        const stoolPositions = [
            new BABYLON.Vector3(-4, 0, -1),
            new BABYLON.Vector3(-2, 0, -1),
            new BABYLON.Vector3(2, 0, -1),
            new BABYLON.Vector3(4, 0, -1)
        ];

        const stoolMaterial = new BABYLON.PBRMaterial('stoolMat', this.scene);
        stoolMaterial.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        stoolMaterial.metallic = 0.3;
        stoolMaterial.roughness = 0.5;

        stoolPositions.forEach((position, index) => {
            // 椅座
            const seat = BABYLON.MeshBuilder.CreateCylinder(
                `stoolSeat_${index}`,
                { height: 0.08, diameter: 0.4, tessellation: 16 },
                this.scene
            );
            seat.position = new BABYLON.Vector3(position.x, 0.65, position.z);
            seat.material = stoolMaterial;
            seat.receiveShadows = true;

            // 椅腿
            const leg = BABYLON.MeshBuilder.CreateCylinder(
                `stoolLeg_${index}`,
                { height: 0.6, diameter: 0.06, tessellation: 12 },
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

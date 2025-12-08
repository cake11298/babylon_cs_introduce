/**
 * 調酒系統 - 處理倒酒、搖酒、喝酒等調酒邏輯
 * Babylon.js TypeScript 版本
 */

import * as BABYLON from '@babylonjs/core';
import { LiquorData, LiquorCategory, ContainerContent } from '../types/types';

// 容器內容介面
interface ContainerContents {
    ingredients: Array<{
        type: string;
        name: string;
        displayName: string;
        amount: number;
        color: number;
    }>;
    volume: number;
    maxVolume: number;
    color: number;
    liquidMesh: BABYLON.Mesh | null;
}

// 倒酒進度 UI 介面
interface PourProgressUI {
    panel: HTMLElement | null;
    containerVolumeBar: HTMLElement | null;
    containerVolumeText: HTMLElement | null;
    pourRateBar: HTMLElement | null;
    pourRateText: HTMLElement | null;
}

export default class CocktailSystem {
    private scene: BABYLON.Scene;
    private containerContents: Map<BABYLON.TransformNode, ContainerContents>;

    // 倒酒狀態
    private isPouringActive: boolean;
    private pouringStartTime: number;
    private currentPouringBottle: BABYLON.TransformNode | null;
    private originalBottleRotation: BABYLON.Vector3 | null;
    private currentPouringAmount: number;
    private pourProgressHideTimer: NodeJS.Timeout | null;

    // 喝酒狀態
    private isDrinking: boolean;
    private drinkingStartTime: number;
    private currentDrinkingGlass: BABYLON.TransformNode | null;
    private originalGlassPosition: BABYLON.Vector3 | null;
    private lastDrinkInfo: any | null;

    // 搖酒狀態
    private isShakingActive: boolean;
    private shakeIntensity: number;
    private shakeTime: number;

    // 粒子系統
    private particleSystems: Map<string, BABYLON.ParticleSystem>;

    // 酒類資料庫
    private liquorDatabase: Map<string, LiquorData>;

    // UI 元素
    private pourProgressUI: PourProgressUI;

    // 倒酒速度（ml/秒）
    public pourRate: number;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.containerContents = new Map();

        // 初始化倒酒狀態
        this.isPouringActive = false;
        this.pouringStartTime = 0;
        this.currentPouringBottle = null;
        this.originalBottleRotation = null;
        this.currentPouringAmount = 0;
        this.pourProgressHideTimer = null;

        // 初始化喝酒狀態
        this.isDrinking = false;
        this.drinkingStartTime = 0;
        this.currentDrinkingGlass = null;
        this.originalGlassPosition = null;
        this.lastDrinkInfo = null;

        // 初始化搖酒狀態
        this.isShakingActive = false;
        this.shakeIntensity = 0;
        this.shakeTime = 0;

        // 初始化粒子系統
        this.particleSystems = new Map();

        // 初始化酒類資料庫
        this.liquorDatabase = this.initLiquorDatabase();

        // 初始化 UI 元素
        this.pourProgressUI = {
            panel: document.getElementById('pour-progress-panel'),
            containerVolumeBar: document.getElementById('container-volume-bar'),
            containerVolumeText: document.getElementById('container-volume-text'),
            pourRateBar: document.getElementById('pour-rate-bar'),
            pourRateText: document.getElementById('pour-rate-text')
        };

        // 倒酒速度設定
        this.pourRate = 30; // ml/秒
    }

    /**
     * 初始化酒類資料庫
     */
    private initLiquorDatabase(): Map<string, LiquorData> {
        const database = new Map<string, LiquorData>();

        // === 六大基酒 ===
        database.set('vodka', {
            name: '伏特加',
            displayName: 'Vodka',
            color: 0xf0f0f0,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        database.set('gin', {
            name: '琴酒',
            displayName: 'Gin',
            color: 0xe8f4f8,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        database.set('rum', {
            name: '蘭姆酒',
            displayName: 'Rum',
            color: 0xd4a574,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        database.set('whiskey', {
            name: '威士忌',
            displayName: 'Whiskey',
            color: 0xb87333,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        database.set('tequila', {
            name: '龍舌蘭',
            displayName: 'Tequila',
            color: 0xf5deb3,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        database.set('brandy', {
            name: '白蘭地',
            displayName: 'Brandy',
            color: 0x8b4513,
            alcoholContent: 40,
            category: LiquorCategory.BASE_SPIRIT
        });

        // === 調味料 ===
        database.set('lemon_juice', {
            name: '檸檬汁',
            displayName: 'Lemon Juice',
            color: 0xfff44f,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        database.set('lime_juice', {
            name: '萊姆汁',
            displayName: 'Lime Juice',
            color: 0x32cd32,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        database.set('simple_syrup', {
            name: '糖漿',
            displayName: 'Simple Syrup',
            color: 0xffe4b5,
            alcoholContent: 0,
            category: LiquorCategory.SYRUP
        });

        database.set('grenadine', {
            name: '紅石榴糖漿',
            displayName: 'Grenadine',
            color: 0xff0000,
            alcoholContent: 0,
            category: LiquorCategory.SYRUP
        });

        database.set('angostura_bitters', {
            name: '安格仕苦精',
            displayName: 'Angostura Bitters',
            color: 0x8b0000,
            alcoholContent: 44.7,
            category: LiquorCategory.BITTERS
        });

        // === 果汁類 ===
        database.set('orange_juice', {
            name: '柳橙汁',
            displayName: 'Orange Juice',
            color: 0xffa500,
            alcoholContent: 0,
            category: LiquorCategory.JUICE
        });

        database.set('pineapple_juice', {
            name: '鳳梨汁',
            displayName: 'Pineapple Juice',
            color: 0xffeb3b,
            alcoholContent: 0,
            category: LiquorCategory.JUICE
        });

        database.set('cranberry_juice', {
            name: '蔓越莓汁',
            displayName: 'Cranberry Juice',
            color: 0xdc143c,
            alcoholContent: 0,
            category: LiquorCategory.JUICE
        });

        database.set('tomato_juice', {
            name: '番茄汁',
            displayName: 'Tomato Juice',
            color: 0xff6347,
            alcoholContent: 0,
            category: LiquorCategory.JUICE
        });

        database.set('grapefruit_juice', {
            name: '葡萄柚汁',
            displayName: 'Grapefruit Juice',
            color: 0xff69b4,
            alcoholContent: 0,
            category: LiquorCategory.JUICE
        });

        // === 其他常見材料 ===
        database.set('soda_water', {
            name: '蘇打水',
            displayName: 'Soda Water',
            color: 0xe0ffff,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        database.set('tonic_water', {
            name: '通寧水',
            displayName: 'Tonic Water',
            color: 0xf0ffff,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        database.set('cola', {
            name: '可樂',
            displayName: 'Cola',
            color: 0x3e2723,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        database.set('liqueur', {
            name: '利口酒',
            displayName: 'Liqueur',
            color: 0xff6b9d,
            alcoholContent: 20,
            category: LiquorCategory.LIQUEUR
        });

        // === 利口酒和香艾酒類 ===
        database.set('vermouth_dry', {
            name: '不甜香艾酒',
            displayName: 'Dry Vermouth',
            color: 0xe8e8d0,
            alcoholContent: 18,
            category: LiquorCategory.LIQUEUR
        });

        database.set('vermouth_sweet', {
            name: '甜香艾酒',
            displayName: 'Sweet Vermouth',
            color: 0x8b4513,
            alcoholContent: 18,
            category: LiquorCategory.LIQUEUR
        });

        database.set('campari', {
            name: '金巴利',
            displayName: 'Campari',
            color: 0xdc143c,
            alcoholContent: 25,
            category: LiquorCategory.LIQUEUR
        });

        database.set('triple_sec', {
            name: '橙皮酒',
            displayName: 'Triple Sec',
            color: 0xffa500,
            alcoholContent: 40,
            category: LiquorCategory.LIQUEUR
        });

        database.set('coconut_cream', {
            name: '椰漿',
            displayName: 'Coconut Cream',
            color: 0xfffaf0,
            alcoholContent: 0,
            category: LiquorCategory.MIXER
        });

        // === 額外添加的酒類，達到 25+ 種 ===
        database.set('coffee_liqueur', {
            name: '咖啡利口酒',
            displayName: 'Coffee Liqueur',
            color: 0x3e2723,
            alcoholContent: 20,
            category: LiquorCategory.LIQUEUR
        });

        database.set('amaretto', {
            name: '杏仁利口酒',
            displayName: 'Amaretto',
            color: 0xd2691e,
            alcoholContent: 28,
            category: LiquorCategory.LIQUEUR
        });

        database.set('baileys', {
            name: '貝禮詩奶酒',
            displayName: 'Baileys',
            color: 0xd2b48c,
            alcoholContent: 17,
            category: LiquorCategory.LIQUEUR
        });

        database.set('blue_curacao', {
            name: '藍柑橘酒',
            displayName: 'Blue Curaçao',
            color: 0x0000ff,
            alcoholContent: 21,
            category: LiquorCategory.LIQUEUR
        });

        database.set('peach_schnapps', {
            name: '水蜜桃酒',
            displayName: 'Peach Schnapps',
            color: 0xffdab9,
            alcoholContent: 20,
            category: LiquorCategory.LIQUEUR
        });

        return database;
    }

    /**
     * 初始化容器（杯子、Shaker）
     */
    public initContainer(container: BABYLON.TransformNode, maxVolume: number = 300): void {
        this.containerContents.set(container, {
            ingredients: [],
            color: 0xffffff,
            volume: 0,
            maxVolume: maxVolume,
            liquidMesh: null
        });

        // 創建液體視覺效果
        this.createLiquidVisual(container);
    }

    /**
     * 創建液體視覺效果
     */
    private createLiquidVisual(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        if (!contents) return;

        // 創建液體網格 - 使用圓柱體
        const liquidMesh = BABYLON.MeshBuilder.CreateCylinder(
            `liquid_${container.name}`,
            {
                diameterTop: 0.3,
                diameterBottom: 0.28,
                height: 0.01,
                tessellation: 32
            },
            this.scene
        );

        // 創建液體材質
        const liquidMaterial = new BABYLON.PBRMaterial(`liquidMat_${container.name}`, this.scene);
        liquidMaterial.albedoColor = BABYLON.Color3.FromHexString('#ffffff');
        liquidMaterial.metallic = 0.1;
        liquidMaterial.roughness = 0.3;
        liquidMaterial.alpha = 0.8;
        liquidMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;

        liquidMesh.material = liquidMaterial;
        liquidMesh.parent = container;
        liquidMesh.position = new BABYLON.Vector3(0, 0.08, 0);
        liquidMesh.isVisible = false; // 初始隱藏

        contents.liquidMesh = liquidMesh;
    }

    /**
     * 更新液體視覺效果
     */
    private updateLiquidVisual(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        if (!contents || !contents.liquidMesh) return;

        const fillRatio = contents.volume / contents.maxVolume;

        if (fillRatio > 0) {
            // 顯示液體
            contents.liquidMesh.isVisible = true;

            // 更新高度
            const maxHeight = 0.55; // 杯子可用高度
            const liquidHeight = Math.max(0.01, Math.min(maxHeight * fillRatio, maxHeight));

            // 計算半徑
            const bottomRadius = 0.14;
            const topRadius = 0.12 + (fillRatio * 0.02);

            // 重新創建幾何體
            const newLiquid = BABYLON.MeshBuilder.CreateCylinder(
                `liquid_${container.name}`,
                {
                    diameterTop: topRadius * 2,
                    diameterBottom: bottomRadius * 2,
                    height: liquidHeight,
                    tessellation: 32
                },
                this.scene
            );

            // 複製材質和父級關係
            newLiquid.material = contents.liquidMesh.material;
            newLiquid.parent = container;
            newLiquid.position = new BABYLON.Vector3(0, 0.08 + liquidHeight / 2, 0);

            // 刪除舊網格
            contents.liquidMesh.dispose();
            contents.liquidMesh = newLiquid;

            // 更新顏色
            const material = contents.liquidMesh.material as BABYLON.PBRMaterial;
            if (material) {
                material.albedoColor = BABYLON.Color3.FromHexString('#' + contents.color.toString(16).padStart(6, '0'));
            }
        } else {
            // 隱藏液體
            contents.liquidMesh.isVisible = false;
        }
    }

    /**
     * 倒酒（從酒瓶到容器）
     */
    public pour(
        bottle: BABYLON.TransformNode,
        targetContainer: BABYLON.TransformNode,
        liquorType: string,
        deltaTime: number,
        camera?: BABYLON.Camera
    ): void {
        const contents = this.containerContents.get(targetContainer);
        if (!contents) return;

        // 檢查容器是否已滿
        if (contents.volume >= contents.maxVolume) {
            console.log('容器已滿！');
            return;
        }

        // 如果提供了相機，檢查距離和視角
        if (camera) {
            const distance = BABYLON.Vector3.Distance(
                bottle.getAbsolutePosition(),
                targetContainer.getAbsolutePosition()
            );

            // 距離必須小於 1.5 米
            if (distance > 1.5) {
                return;
            }

            // 計算相機方向
            const cameraDirection = camera.getForwardRay().direction;
            const cameraToGlass = targetContainer.getAbsolutePosition()
                .subtract(camera.globalPosition)
                .normalize();

            // 計算角度（點積）
            const dotProduct = BABYLON.Vector3.Dot(cameraDirection, cameraToGlass);

            // 視角必須對準杯子
            if (dotProduct < 0.85) {
                return;
            }
        }

        // 倒酒速度（ml/秒）
        const amountPoured = this.pourRate * deltaTime;

        // 添加酒水
        const liquor = this.liquorDatabase.get(liquorType);
        if (liquor) {
            // 檢查是否已經有相同類型的材料
            const existingIngredient = contents.ingredients.find(ing => ing.type === liquorType);

            if (existingIngredient) {
                existingIngredient.amount += amountPoured;
            } else {
                contents.ingredients.push({
                    type: liquorType,
                    name: liquor.name,
                    displayName: liquor.displayName || liquor.name,
                    amount: amountPoured,
                    color: liquor.color
                });
            }

            contents.volume += amountPoured;

            // 重新計算混合顏色
            this.updateMixedColor(targetContainer);

            // 更新視覺效果
            this.updateLiquidVisual(targetContainer);

            // 更新倒酒進度條 UI
            this.updatePourProgressUI(targetContainer, amountPoured);

            // 創建倒酒粒子效果和動畫
            if (!this.isPouringActive) {
                this.createPourParticles(bottle, targetContainer);
                this.isPouringActive = true;
                this.currentPouringBottle = bottle;
                this.originalBottleRotation = bottle.rotation.clone();
                this.currentPouringAmount = 0;

                // 清除之前的隱藏計時器
                if (this.pourProgressHideTimer) {
                    clearTimeout(this.pourProgressHideTimer);
                    this.pourProgressHideTimer = null;
                }
            }

            // 累積這次倒酒的總量
            this.currentPouringAmount += amountPoured;

            // 倒酒動畫：傾斜酒瓶
            if (this.currentPouringBottle) {
                const targetRotation = Math.PI / 3; // 60度傾斜
                const currentZ = this.currentPouringBottle.rotation.z;
                const lerpSpeed = 3.0 * deltaTime;
                this.currentPouringBottle.rotation.z += (targetRotation - currentZ) * lerpSpeed;
            }
        }
    }

    /**
     * 停止倒酒
     */
    public stopPouring(): void {
        // 恢復酒瓶旋轉
        if (this.currentPouringBottle && this.originalBottleRotation) {
            this.currentPouringBottle.rotation.copyFrom(this.originalBottleRotation);
        }

        this.isPouringActive = false;
        this.currentPouringBottle = null;
        this.originalBottleRotation = null;
        this.removePourParticles();

        // 延遲5秒後隱藏倒酒進度條
        if (this.pourProgressUI.panel) {
            if (this.pourProgressHideTimer) {
                clearTimeout(this.pourProgressHideTimer);
            }

            this.pourProgressHideTimer = setTimeout(() => {
                if (this.pourProgressUI.panel) {
                    this.pourProgressUI.panel.style.display = 'none';
                }
                this.currentPouringAmount = 0;
            }, 5000);
        }
    }

    /**
     * 從 Shaker 倒酒到其他容器
     */
    public pourFromShaker(
        shaker: BABYLON.TransformNode,
        targetContainer: BABYLON.TransformNode,
        deltaTime: number
    ): void {
        const shakerContents = this.containerContents.get(shaker);
        const targetContents = this.containerContents.get(targetContainer);

        if (!shakerContents || !targetContents) return;
        if (shakerContents.volume <= 0) return;
        if (targetContents.volume >= targetContents.maxVolume) return;

        // 倒酒速度
        const amountToPour = Math.min(
            this.pourRate * deltaTime,
            shakerContents.volume,
            targetContents.maxVolume - targetContents.volume
        );

        // 轉移材料
        shakerContents.ingredients.forEach(ingredient => {
            const ratio = amountToPour / shakerContents.volume;
            const transferAmount = ingredient.amount * ratio;

            // 從 Shaker 減少
            ingredient.amount -= transferAmount;

            // 添加到目標容器
            const existingIngredient = targetContents.ingredients.find(
                ing => ing.type === ingredient.type
            );

            if (existingIngredient) {
                existingIngredient.amount += transferAmount;
            } else {
                targetContents.ingredients.push({
                    type: ingredient.type,
                    name: ingredient.name,
                    displayName: ingredient.displayName,
                    amount: transferAmount,
                    color: ingredient.color
                });
            }
        });

        // 更新體積
        shakerContents.volume -= amountToPour;
        targetContents.volume += amountToPour;

        // 清理 Shaker 中量為 0 的材料
        shakerContents.ingredients = shakerContents.ingredients.filter(
            ing => ing.amount > 0.01
        );

        // 更新顏色和視覺效果
        this.updateMixedColor(shaker);
        this.updateMixedColor(targetContainer);
        this.updateLiquidVisual(shaker);
        this.updateLiquidVisual(targetContainer);

        // 更新進度條 UI
        this.updatePourProgressUI(targetContainer, amountToPour);

        // 創建倒酒效果
        if (!this.isPouringActive) {
            this.createPourParticles(shaker, targetContainer);
            this.isPouringActive = true;
            this.currentPouringBottle = shaker;
            this.originalBottleRotation = shaker.rotation.clone();
            this.currentPouringAmount = 0;

            if (this.pourProgressHideTimer) {
                clearTimeout(this.pourProgressHideTimer);
                this.pourProgressHideTimer = null;
            }
        }

        this.currentPouringAmount += amountToPour;

        // 傾斜動畫
        if (this.currentPouringBottle) {
            const targetRotation = Math.PI / 3;
            const currentZ = this.currentPouringBottle.rotation.z;
            const lerpSpeed = 3.0 * deltaTime;
            this.currentPouringBottle.rotation.z += (targetRotation - currentZ) * lerpSpeed;
        }
    }

    /**
     * 更新倒酒進度條 UI
     */
    private updatePourProgressUI(targetContainer: BABYLON.TransformNode, amountPoured: number): void {
        if (!this.pourProgressUI.panel) return;

        const contents = this.containerContents.get(targetContainer);
        if (!contents) return;

        // 顯示進度條面板
        this.pourProgressUI.panel.style.display = 'block';

        // 更新杯子容量進度條
        const volumePercentage = (contents.volume / contents.maxVolume) * 100;
        if (this.pourProgressUI.containerVolumeBar) {
            this.pourProgressUI.containerVolumeBar.style.width = `${Math.min(volumePercentage, 100)}%`;
        }
        if (this.pourProgressUI.containerVolumeText) {
            this.pourProgressUI.containerVolumeText.textContent =
                `${Math.round(contents.volume)}/${contents.maxVolume}ml`;
        }

        // 更新倒入量進度條
        const totalPouredPercentage = (this.currentPouringAmount / contents.maxVolume) * 100;
        if (this.pourProgressUI.pourRateBar) {
            this.pourProgressUI.pourRateBar.style.width = `${Math.min(totalPouredPercentage, 100)}%`;
        }
        if (this.pourProgressUI.pourRateText) {
            this.pourProgressUI.pourRateText.textContent = `${Math.round(this.currentPouringAmount)}ml`;
        }
    }

    /**
     * 創建倒酒粒子效果 - 使用 Babylon.js ParticleSystem
     */
    private createPourParticles(bottle: BABYLON.TransformNode, target: BABYLON.TransformNode): void {
        // 創建粒子系統
        const particleSystem = new BABYLON.ParticleSystem(
            'pourParticles',
            2000,
            this.scene
        );

        // 設置粒子紋理（使用圓形粒子）
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://www.babylonjs.com/assets/Flare.png',
            this.scene
        );

        // 粒子發射器位置（瓶口）
        const bottlePos = bottle.getAbsolutePosition().clone();
        bottlePos.y -= 0.3; // 瓶口位置
        particleSystem.emitter = bottlePos;

        // 粒子發射範圍
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.05, 0, -0.05);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.05, 0, 0.05);

        // 粒子顏色
        particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1, 0.8);
        particleSystem.color2 = new BABYLON.Color4(0.5, 0.6, 0.9, 0.6);
        particleSystem.colorDead = new BABYLON.Color4(0.3, 0.4, 0.7, 0);

        // 粒子大小
        particleSystem.minSize = 0.03;
        particleSystem.maxSize = 0.06;

        // 粒子生命週期
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.6;

        // 發射速率
        particleSystem.emitRate = 500;

        // 粒子速度和方向
        const targetPos = target.getAbsolutePosition();
        const direction = targetPos.subtract(bottlePos).normalize();

        particleSystem.direction1 = direction.add(new BABYLON.Vector3(-0.1, -0.2, -0.1));
        particleSystem.direction2 = direction.add(new BABYLON.Vector3(0.1, -0.2, 0.1));

        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        // 重力效果
        particleSystem.gravity = new BABYLON.Vector3(0, -9.8, 0);

        // 混合模式
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

        // 啟動粒子系統
        particleSystem.start();

        this.particleSystems.set('pour', particleSystem);
    }

    /**
     * 移除倒酒粒子效果
     */
    private removePourParticles(): void {
        const particleSystem = this.particleSystems.get('pour');
        if (particleSystem) {
            particleSystem.stop();
            particleSystem.dispose();
            this.particleSystems.delete('pour');
        }
    }

    /**
     * 搖酒（Shaker）
     */
    public shake(shaker: BABYLON.TransformNode, deltaTime: number): void {
        const contents = this.containerContents.get(shaker);
        if (!contents || contents.volume === 0) {
            console.log('Shaker 是空的！');
            return;
        }

        this.isShakingActive = true;
        this.shakeTime += deltaTime;

        // 搖晃強度（正弦波動）
        this.shakeIntensity = Math.sin(this.shakeTime * 20) * 0.05;

        // 應用搖晃旋轉
        shaker.rotation.z = this.shakeIntensity;
        shaker.rotation.x = Math.sin(this.shakeTime * 15) * 0.03;

        // 搖晃會混合酒水，增強顏色混合
        if (this.shakeTime > 2) {
            this.enhanceMixing(shaker);
        }
    }

    /**
     * 停止搖酒
     */
    public stopShaking(shaker: BABYLON.TransformNode): void {
        this.isShakingActive = false;
        this.shakeTime = 0;

        // 重置旋轉
        shaker.rotation.z = 0;
        shaker.rotation.x = 0;
    }

    /**
     * 增強混合效果
     */
    private enhanceMixing(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        if (!contents) return;

        // 混合後顏色更均勻
        this.updateMixedColor(container);
        this.updateLiquidVisual(container);
    }

    /**
     * 更新混合顏色
     */
    private updateMixedColor(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        if (!contents || contents.ingredients.length === 0) return;

        let r = 0, g = 0, b = 0;
        let totalAmount = 0;

        // 加權平均計算混合顏色
        contents.ingredients.forEach(ingredient => {
            const color = BABYLON.Color3.FromHexString('#' + ingredient.color.toString(16).padStart(6, '0'));
            const weight = ingredient.amount;

            r += color.r * weight;
            g += color.g * weight;
            b += color.b * weight;
            totalAmount += weight;
        });

        if (totalAmount > 0) {
            r /= totalAmount;
            g /= totalAmount;
            b /= totalAmount;

            const mixedColor = new BABYLON.Color3(r, g, b);
            contents.color = parseInt(mixedColor.toHexString().substring(1), 16);
        }
    }

    /**
     * 喝掉飲品
     */
    public drink(container: BABYLON.TransformNode, startAnimation: boolean = true): any | null {
        const contents = this.containerContents.get(container);
        if (!contents || contents.volume === 0) {
            console.log('杯子是空的！');
            return null;
        }

        if (startAnimation && !this.isDrinking) {
            // 開始喝酒動畫
            this.isDrinking = true;
            this.drinkingStartTime = Date.now();
            this.currentDrinkingGlass = container;
            this.originalGlassPosition = container.position.clone();
            return null;
        }

        // 獲取飲品資訊
        const drinkInfo = {
            volume: contents.volume,
            ingredients: [...contents.ingredients],
            color: contents.color,
            name: this.identifyCocktail(contents)
        };

        // 清空容器
        contents.ingredients = [];
        contents.volume = 0;
        contents.color = 0xffffff;

        // 更新視覺
        this.updateLiquidVisual(container);

        console.log(`你喝了 ${drinkInfo.name}！`);
        return drinkInfo;
    }

    /**
     * 取得並清除最後一次喝酒的資訊
     */
    public getLastDrinkInfo(): any | null {
        const info = this.lastDrinkInfo;
        this.lastDrinkInfo = null;
        return info;
    }

    /**
     * 更新喝酒動畫
     */
    private updateDrinkingAnimation(): void {
        if (!this.isDrinking || !this.currentDrinkingGlass) return;

        const elapsedTime = (Date.now() - this.drinkingStartTime) / 1000;

        if (elapsedTime < 1.0) {
            // 動畫進行中
            const progress = elapsedTime;
            if (this.originalGlassPosition) {
                this.currentDrinkingGlass.position.y = this.originalGlassPosition.y + 0.2 * progress;
                this.currentDrinkingGlass.rotation.x = -Math.PI / 6 * progress;
            }
        } else {
            // 動畫結束
            if (this.originalGlassPosition) {
                this.currentDrinkingGlass.position.copyFrom(this.originalGlassPosition);
            }
            this.currentDrinkingGlass.rotation.x = 0;

            // 實際消耗飲品
            const contents = this.containerContents.get(this.currentDrinkingGlass);
            if (contents && contents.volume > 0) {
                const drinkInfo = {
                    volume: contents.volume,
                    ingredients: [...contents.ingredients],
                    color: contents.color,
                    name: this.identifyCocktail(contents)
                };

                // 清空容器
                contents.ingredients = [];
                contents.volume = 0;
                contents.color = 0xffffff;
                this.updateLiquidVisual(this.currentDrinkingGlass);

                // 儲存飲品資訊
                this.lastDrinkInfo = drinkInfo;
            }

            this.isDrinking = false;
            this.currentDrinkingGlass = null;
        }
    }

    /**
     * 識別雞尾酒
     */
    public identifyCocktail(contents: ContainerContents): string {
        const ingredients = contents.ingredients;
        const types = ingredients.map(ing => ing.type);

        // 獲取每種材料的量
        const getAmount = (type: string): number => {
            const ing = ingredients.find(i => i.type === type);
            return ing ? ing.amount : 0;
        };

        // === 經典調酒識別 ===

        // Martini（馬丁尼）
        if (types.includes('gin') && types.includes('vermouth_dry')) {
            const ginAmount = getAmount('gin');
            const vermouthAmount = getAmount('vermouth_dry');
            const ratio = ginAmount / vermouthAmount;

            const hasOtherSpirits = types.some(t =>
                ['vodka', 'rum', 'whiskey', 'tequila', 'brandy', 'campari'].includes(t)
            );
            const hasJuice = types.some(t =>
                ['orange_juice', 'cranberry_juice', 'pineapple_juice', 'tomato_juice', 'grapefruit_juice'].includes(t)
            );

            const allowedExtras = ['lemon_juice', 'lime_juice', 'simple_syrup'];
            const hasOnlyAllowedExtras = types.filter(t =>
                t !== 'gin' && t !== 'vermouth_dry'
            ).every(t => allowedExtras.includes(t));

            if (!hasOtherSpirits && !hasJuice && hasOnlyAllowedExtras && ratio >= 2 && ratio <= 3) {
                return '馬丁尼 (Martini)';
            }
        }

        // Vodka Martini
        if (types.includes('vodka') && types.includes('vermouth_dry')) {
            const vodkaAmount = getAmount('vodka');
            const vermouthAmount = getAmount('vermouth_dry');
            const ratio = vodkaAmount / vermouthAmount;

            const hasOtherSpirits = types.some(t =>
                ['gin', 'rum', 'whiskey', 'tequila', 'brandy', 'campari'].includes(t)
            );

            if (!hasOtherSpirits && ratio >= 2 && ratio <= 3) {
                return '伏特加馬丁尼 (Vodka Martini)';
            }
        }

        // Negroni
        if (types.includes('gin') && types.includes('campari') && types.includes('vermouth_sweet')) {
            const ginAmount = getAmount('gin');
            const campariAmount = getAmount('campari');
            const vermouthAmount = getAmount('vermouth_sweet');

            const avgAmount = (ginAmount + campariAmount + vermouthAmount) / 3;
            const isBalanced =
                Math.abs(ginAmount - avgAmount) / avgAmount < 0.3 &&
                Math.abs(campariAmount - avgAmount) / avgAmount < 0.3 &&
                Math.abs(vermouthAmount - avgAmount) / avgAmount < 0.3;

            if (isBalanced) {
                return '內格羅尼 (Negroni)';
            }
        }

        // Margarita
        if (types.includes('tequila') && types.includes('triple_sec') && types.includes('lime_juice')) {
            return '瑪格麗特 (Margarita)';
        }

        // Daiquiri
        if (types.includes('rum') && types.includes('lime_juice') && types.includes('simple_syrup')) {
            return '黛克瑞 (Daiquiri)';
        }

        // Piña Colada
        if (types.includes('rum') && types.includes('pineapple_juice') && types.includes('coconut_cream')) {
            return '椰林風情 (Piña Colada)';
        }

        // Cosmopolitan
        if (types.includes('vodka') && types.includes('triple_sec') &&
            types.includes('cranberry_juice') && types.includes('lime_juice')) {
            return '柯夢波丹 (Cosmopolitan)';
        }

        // Mojito
        if (types.includes('rum') && types.includes('lime_juice') && types.includes('simple_syrup')) {
            return '莫希托 (Mojito)';
        }

        // Manhattan
        if (types.includes('whiskey') && types.includes('vermouth_sweet')) {
            return '曼哈頓 (Manhattan)';
        }

        // Whiskey Sour
        if (types.includes('whiskey') && types.includes('lemon_juice') && types.includes('simple_syrup')) {
            return '威士忌酸酒 (Whiskey Sour)';
        }

        // Bloody Mary
        if (types.includes('vodka') && types.includes('tomato_juice')) {
            return '血腥瑪麗 (Bloody Mary)';
        }

        // Screwdriver
        if (types.includes('vodka') && types.includes('orange_juice') && types.length === 2) {
            return '螺絲起子 (Screwdriver)';
        }

        // Tequila Sunrise
        if (types.includes('tequila') && types.includes('orange_juice') && types.includes('grenadine')) {
            return '龍舌蘭日出 (Tequila Sunrise)';
        }

        // Mai Tai
        if (types.includes('rum') && types.includes('triple_sec') && types.includes('lime_juice')) {
            return '邁泰 (Mai Tai)';
        }

        // Long Island Iced Tea
        if (types.includes('vodka') && types.includes('rum') && types.includes('gin') &&
            types.includes('tequila') && types.includes('triple_sec')) {
            return '長島冰茶 (Long Island Iced Tea)';
        }

        // === 簡單配方匹配 ===
        if (types.includes('vodka') && types.length === 1) {
            return '伏特加純飲';
        } else if (types.includes('gin') && types.length === 1) {
            return '琴酒純飲';
        } else if (types.includes('rum') && types.includes('liqueur')) {
            return '熱帶雞尾酒';
        } else if (types.includes('vodka') && types.includes('liqueur')) {
            return '性感海灘';
        } else if (types.length > 2) {
            return '特調混酒';
        } else if (types.length === 2) {
            return '雙料調酒';
        } else {
            return '未知飲品';
        }
    }

    /**
     * 清空容器
     */
    public emptyContainer(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        if (!contents) return;

        contents.ingredients = [];
        contents.volume = 0;
        contents.color = 0xffffff;

        this.updateLiquidVisual(container);
    }

    /**
     * 獲取容器資訊
     */
    public getContainerInfo(container: BABYLON.TransformNode): ContainerContents | null {
        return this.containerContents.get(container) || null;
    }

    /**
     * 檢查容器是否為空
     */
    public isEmpty(container: BABYLON.TransformNode): boolean {
        const contents = this.containerContents.get(container);
        return !contents || contents.volume === 0;
    }

    /**
     * 檢查容器是否已滿
     */
    public isFull(container: BABYLON.TransformNode): boolean {
        const contents = this.containerContents.get(container);
        return contents !== undefined && contents.volume >= contents.maxVolume;
    }

    /**
     * 計算容器內的平均酒精濃度
     */
    public calculateAlcoholContent(contents: ContainerContents): number {
        if (!contents || contents.volume === 0) return 0;

        let totalAlcohol = 0;

        contents.ingredients.forEach(ing => {
            const liquor = this.liquorDatabase.get(ing.type);
            if (liquor && liquor.alcoholContent) {
                totalAlcohol += ing.amount * (liquor.alcoholContent / 100);
            }
        });

        const averageAlcoholContent = (totalAlcohol / contents.volume) * 100;
        return averageAlcoholContent;
    }

    /**
     * 顯示容器成分信息（UI）
     */
    public showContainerInfo(container: BABYLON.TransformNode): void {
        const contents = this.containerContents.get(container);
        const infoDiv = document.getElementById('container-info');

        if (!contents || !infoDiv) return;

        if (contents.volume > 0) {
            // 構建成分列表
            const ingredientListHTML = contents.ingredients.map(ing => {
                const liquor = this.liquorDatabase.get(ing.type);
                return `
                    <div class="ingredient-item">
                        <span class="ingredient-name">${liquor ? liquor.name : ing.name}</span>
                        <span class="ingredient-amount">${Math.round(ing.amount)} ml</span>
                    </div>
                `;
            }).join('');

            // 計算酒精濃度
            const alcoholContent = this.calculateAlcoholContent(contents);

            // 識別雞尾酒
            const cocktailName = this.identifyCocktail(contents);

            infoDiv.innerHTML = `
                <h3>${cocktailName}</h3>
                <div class="ingredient-list">
                    ${ingredientListHTML}
                </div>
                <div class="volume-info">
                    總容量: ${Math.round(contents.volume)} / ${contents.maxVolume} ml<br>
                    酒精濃度: ${alcoholContent.toFixed(1)}%
                </div>
            `;
            infoDiv.classList.add('visible');
        } else {
            infoDiv.classList.remove('visible');
        }
    }

    /**
     * 隱藏容器成分信息
     */
    public hideContainerInfo(): void {
        const infoDiv = document.getElementById('container-info');
        if (infoDiv) {
            infoDiv.classList.remove('visible');
        }
    }

    /**
     * 更新系統（每幀調用）
     */
    public update(deltaTime: number): void {
        // 更新喝酒動畫
        this.updateDrinkingAnimation();
    }

    /**
     * 獲取酒類資料庫
     */
    public getLiquorDatabase(): Map<string, LiquorData> {
        return this.liquorDatabase;
    }

    /**
     * 獲取經典調酒食譜列表
     */
    public getCocktailRecipes() {
        return [
            // === Unforgettable 經典不朽調酒 ===
            {
                name: 'Martini 馬丁尼',
                ingredients: [
                    { amount: '60ml', name: '琴酒 Gin' },
                    { amount: '10ml', name: '不甜香艾酒 Dry Vermouth' }
                ],
                method: 'Stir（攪拌法）：將材料加冰攪拌後濾入冰鎮馬丁尼杯，可加檸檬皮裝飾。'
            },
            {
                name: 'Vodka Martini 伏特加馬丁尼',
                ingredients: [
                    { amount: '60ml', name: '伏特加 Vodka' },
                    { amount: '10ml', name: '不甜香艾酒 Dry Vermouth' }
                ],
                method: 'Stir：將材料加冰攪拌後濾入冰鎮馬丁尼杯，檸檬皮或橄欖裝飾。'
            },
            {
                name: 'Negroni 內格羅尼',
                ingredients: [
                    { amount: '30ml', name: '琴酒 Gin' },
                    { amount: '30ml', name: '金巴利 Campari' },
                    { amount: '30ml', name: '甜香艾酒 Sweet Vermouth' }
                ],
                method: 'Build：將材料倒入裝滿冰塊的古典杯，攪拌均勻，柳橙皮裝飾。'
            },
            {
                name: 'Margarita 瑪格麗特',
                ingredients: [
                    { amount: '50ml', name: '龍舌蘭 Tequila' },
                    { amount: '20ml', name: '橙皮酒 Triple Sec' },
                    { amount: '15ml', name: '萊姆汁 Lime Juice' }
                ],
                method: 'Shake：加冰搖盪後濾入杯緣抹鹽的杯中，萊姆角裝飾。'
            },
            {
                name: 'Daiquiri 黛克瑞',
                ingredients: [
                    { amount: '60ml', name: '蘭姆酒 Rum' },
                    { amount: '20ml', name: '萊姆汁 Lime Juice' },
                    { amount: '10ml', name: '糖漿 Simple Syrup' }
                ],
                method: 'Shake：加冰搖盪後濾入冰鎮雞尾酒杯。'
            },
            {
                name: 'Cosmopolitan 柯夢波丹',
                ingredients: [
                    { amount: '40ml', name: '伏特加 Vodka' },
                    { amount: '15ml', name: '橙皮酒 Triple Sec' },
                    { amount: '15ml', name: '萊姆汁 Lime Juice' },
                    { amount: '30ml', name: '蔓越莓汁 Cranberry Juice' }
                ],
                method: 'Shake：加冰搖盪後濾入馬丁尼杯，萊姆皮或蔓越莓裝飾。'
            },
            {
                name: 'Mojito 莫希托',
                ingredients: [
                    { amount: '45ml', name: '蘭姆酒 Rum' },
                    { amount: '20ml', name: '萊姆汁 Lime Juice' },
                    { amount: '20ml', name: '糖漿 Simple Syrup' },
                    { amount: '適量', name: '蘇打水 Soda Water' }
                ],
                method: 'Muddle：在杯中壓碎薄荷葉與糖，加冰、蘭姆酒、萊姆汁，上方加蘇打水。'
            },
            {
                name: 'Piña Colada 椰林風情',
                ingredients: [
                    { amount: '50ml', name: '蘭姆酒 Rum' },
                    { amount: '30ml', name: '椰漿 Coconut Cream' },
                    { amount: '50ml', name: '鳳梨汁 Pineapple Juice' }
                ],
                method: 'Blend：與碎冰混合打碎，倒入颶風杯，鳳梨角和櫻桃裝飾。'
            },
            {
                name: 'Whiskey Sour 威士忌酸酒',
                ingredients: [
                    { amount: '50ml', name: '威士忌 Whiskey' },
                    { amount: '25ml', name: '檸檬汁 Lemon Juice' },
                    { amount: '15ml', name: '糖漿 Simple Syrup' }
                ],
                method: 'Shake：加冰搖盪後濾入古典杯，可加蛋白增加口感。'
            },
            {
                name: 'Manhattan 曼哈頓',
                ingredients: [
                    { amount: '50ml', name: '威士忌 Whiskey' },
                    { amount: '20ml', name: '甜香艾酒 Sweet Vermouth' },
                    { amount: '2滴', name: '安格仕苦精 Angostura Bitters' }
                ],
                method: 'Stir：將材料加冰攪拌後濾入馬丁尼杯，櫻桃裝飾。'
            },
            {
                name: 'Long Island Iced Tea 長島冰茶',
                ingredients: [
                    { amount: '15ml', name: '伏特加 Vodka' },
                    { amount: '15ml', name: '蘭姆酒 Rum' },
                    { amount: '15ml', name: '琴酒 Gin' },
                    { amount: '15ml', name: '龍舌蘭 Tequila' },
                    { amount: '15ml', name: '橙皮酒 Triple Sec' },
                    { amount: '25ml', name: '檸檬汁 Lemon Juice' },
                    { amount: '30ml', name: '糖漿 Simple Syrup' },
                    { amount: '適量', name: '可樂 Cola' }
                ],
                method: 'Shake前七種材料後濾入裝滿冰塊的柯林斯杯，上方補可樂，檸檬片裝飾。'
            },
            {
                name: 'Bloody Mary 血腥瑪麗',
                ingredients: [
                    { amount: '45ml', name: '伏特加 Vodka' },
                    { amount: '90ml', name: '番茄汁 Tomato Juice' },
                    { amount: '15ml', name: '檸檬汁 Lemon Juice' },
                    { amount: '少許', name: '安格仕苦精 Angostura Bitters' }
                ],
                method: 'Roll：在雪克杯中倒入材料與冰塊，來回倒入另一個杯子混合。'
            },
            {
                name: 'Tequila Sunrise 龍舌蘭日出',
                ingredients: [
                    { amount: '45ml', name: '龍舌蘭 Tequila' },
                    { amount: '90ml', name: '柳橙汁 Orange Juice' },
                    { amount: '15ml', name: '紅石榴糖漿 Grenadine' }
                ],
                method: 'Build：在高球杯中加冰、龍舌蘭和柳橙汁，最後慢慢倒入紅石榴糖漿形成漸層。'
            },
            {
                name: 'Screwdriver 螺絲起子',
                ingredients: [
                    { amount: '50ml', name: '伏特加 Vodka' },
                    { amount: '100ml', name: '柳橙汁 Orange Juice' }
                ],
                method: 'Build：在裝滿冰塊的高球杯中倒入伏特加，補滿柳橙汁，攪拌均勻。'
            },
            {
                name: 'Mai Tai 邁泰',
                ingredients: [
                    { amount: '40ml', name: '蘭姆酒 Rum' },
                    { amount: '20ml', name: '橙皮酒 Triple Sec' },
                    { amount: '15ml', name: '萊姆汁 Lime Juice' },
                    { amount: '10ml', name: '糖漿 Simple Syrup' }
                ],
                method: 'Shake：加冰搖盪後濾入裝滿碎冰的古典杯，薄荷和萊姆裝飾。'
            }
        ];
    }
}

/**
 * 主程式 - Babylon.js 調酒模擬器
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import PhysicsSystem from './modules/PhysicsSystem';
import InteractionSystem from './modules/InteractionSystem';
import CocktailSystem from './modules/CocktailSystem';
import PlayerController from './modules/PlayerController';
import LightingSystem from './modules/LightingSystem';
import BarEnvironment from './modules/BarEnvironment';
import NPCManager from './modules/NPCManager';
import './styles/main.css';

class BarSimulator {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.UniversalCamera;

    // 核心系統
    private physicsSystem!: PhysicsSystem;
    private interactionSystem!: InteractionSystem;
    private cocktailSystem!: CocktailSystem;
    private playerController!: PlayerController;
    private lightingSystem!: LightingSystem;
    private barEnvironment!: BarEnvironment;
    private npcManager!: NPCManager;

    // 遊戲狀態
    private isPaused: boolean = false;
    private isRecipeMenuOpen: boolean = false;

    // 按鍵狀態記錄（防止重複觸發）
    private lastInteraction: boolean = false;
    private lastPickup: boolean = false;
    private lastDrop: boolean = false;
    private lastReturn: boolean = false;
    private lastRightMouse: boolean = false;
    private lastRecipeToggle: boolean = false;

    constructor() {
        // 獲取 canvas 元素
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // 創建 Babylon.js 引擎
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });

        // 創建場景
        this.scene = this.createScene();
        this.camera = this.scene.activeCamera as BABYLON.UniversalCamera;

        // 異步初始化
        this.initialize();

        // 開始渲染循環
        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
        });

        // 處理窗口大小調整
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    /**
     * 創建場景
     */
    private createScene(): BABYLON.Scene {
        const scene = new BABYLON.Scene(this.engine);

        // 場景背景色 - 昏暗酒吧氛圍
        scene.clearColor = new BABYLON.Color4(0.08, 0.06, 0.05, 1.0);

        // 啟用碰撞
        scene.collisionsEnabled = true;
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // 創建相機
        const camera = new BABYLON.UniversalCamera(
            'camera',
            new BABYLON.Vector3(0, 1.7, -5),
            scene
        );
        camera.setTarget(BABYLON.Vector3.Zero());

        // 設置視野（FOV）- 降低10%以防止近距離穿模並提供更電影化的視角
        camera.fov = 1.2654; // 約72.5度（弧度制），從原本的1.406降低10%

        // 設置相機為活動相機
        scene.activeCamera = camera;

        return scene;
    }

    /**
     * 異步初始化所有系統
     */
    private async initialize(): Promise<void> {
        try {
            // 顯示載入畫面
            this.showLoadingScreen();
            this.updateLoadingProgress(0, '正在初始化...');

            // 1. 初始化物理系統（已优化：瞬时加载）
            this.updateLoadingProgress(10, '正在載入物理引擎...');
            this.physicsSystem = new PhysicsSystem(this.scene);
            this.physicsSystem.initialize();
            this.updateLoadingProgress(30, '✓ 物理引擎已載入（瞬时）');

            // 2. 初始化互動系統
            this.updateLoadingProgress(40, '正在初始化互動系統...');
            this.interactionSystem = new InteractionSystem(
                this.camera,
                this.scene,
                this.physicsSystem
            );
            this.updateLoadingProgress(50, '✓ 互動系統已初始化');

            // 3. 初始化調酒系統
            this.updateLoadingProgress(55, '正在初始化調酒系統...');
            this.cocktailSystem = new CocktailSystem(
                this.scene,
                this.interactionSystem
            );
            this.interactionSystem.setCocktailSystem(this.cocktailSystem);
            this.updateLoadingProgress(60, '✓ 調酒系統已初始化');

            // 4. 初始化玩家控制器
            this.updateLoadingProgress(65, '正在初始化玩家控制...');
            this.playerController = new PlayerController(
                this.camera,
                this.scene,
                this.canvas
            );
            this.updateLoadingProgress(70, '✓ 玩家控制已初始化');

            // 5. 初始化光照系統
            this.updateLoadingProgress(75, '正在設置光照...');
            this.lightingSystem = new LightingSystem(this.scene);
            this.updateLoadingProgress(80, '✓ 光照系統已設置');

            // 6. 創建酒吧環境
            this.updateLoadingProgress(85, '正在建構酒吧環境...');
            this.barEnvironment = new BarEnvironment(
                this.scene,
                this.physicsSystem,
                this.interactionSystem,
                this.cocktailSystem
            );
            await this.barEnvironment.createEnvironment();
            this.updateLoadingProgress(92, '✓ 酒吧環境已建構（含FBX模型）');

            // 7. 初始化 NPC 管理器
            this.updateLoadingProgress(95, '正在初始化 NPC...');
            this.npcManager = new NPCManager(this.scene);
            this.updateLoadingProgress(97, '✓ NPC 已初始化');

            // 8. 設置 UI 控制
            this.updateLoadingProgress(99, '正在設置 UI...');
            this.setupUIControls();
            this.updateLoadingProgress(100, '✓ 載入完成！');

            // 稍微延遲一下再隱藏載入畫面，讓用戶看到100%
            await new Promise(resolve => setTimeout(resolve, 500));
            this.hideLoadingScreen();

            console.log('🎮 Bar Simulator initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            this.updateLoadingProgress(0, '❌ 載入失敗，請重新整理頁面');
            alert('遊戲初始化失敗，請重新整理頁面\n錯誤: ' + error);
        }
    }

    /**
     * 更新遊戲（每幀）
     */
    private update(): void {
        const deltaTime = this.engine.getDeltaTime() / 1000;

        // 如果暫停，只更新 NPC 動畫
        if (this.isPaused) {
            this.npcManager?.update(deltaTime);
            return;
        }

        // 更新各個系統
        this.playerController?.update(deltaTime);
        this.interactionSystem?.update();
        this.cocktailSystem?.update(deltaTime);
        this.npcManager?.update(deltaTime);

        // 處理輸入
        this.handleInput();

        // 更新 FPS 顯示
        this.updateFPS();
    }

    /**
     * 處理玩家輸入
     */
    private handleInput(): void {
        // E 鍵：拾取物品 / 互動 NPC
        const ePressed = this.playerController.isKeyPressed('KeyE');
        if (ePressed && !this.lastPickup) {
            // 檢查目標物件類型
            const targetedObject = this.interactionSystem.getTargetedObject();

            if (targetedObject && targetedObject.userData.type === 'npc') {
                // 如果是 NPC，觸發對話互動
                this.npcManager.interact();
            } else {
                // 否則，拾取物品
                this.interactionSystem.pickupItem();
            }
        }
        this.lastPickup = ePressed;

        // Q 鍵：放下物品
        const qPressed = this.playerController.isKeyPressed('KeyQ');
        if (qPressed && !this.lastDrop) {
            this.interactionSystem.dropItem();
        }
        this.lastDrop = qPressed;

        // R 鍵：放回原位
        const rPressed = this.playerController.isKeyPressed('KeyR');
        if (rPressed && !this.lastReturn) {
            this.interactionSystem.returnItem();
        }
        this.lastReturn = rPressed;

        // 滑鼠左鍵：倒酒 / 搖酒
        const leftMousePressed = this.scene.pointerX !== 0; // 簡化的檢測
        this.handlePouring(leftMousePressed);

        // M 鍵：開啟/關閉食譜面板
        const mPressed = this.playerController.isKeyPressed('KeyM');
        if (mPressed && !this.lastRecipeToggle) {
            this.toggleRecipeMenu();
        }
        this.lastRecipeToggle = mPressed;
    }

    /**
     * 處理倒酒
     */
    private handlePouring(isPressed: boolean): void {
        const heldObject = this.interactionSystem.getHeldObject();

        if (!heldObject || !isPressed) {
            this.cocktailSystem.stopPouring();
            return;
        }

        // 獲取 deltaTime
        const deltaTime = this.engine.getDeltaTime() / 1000;

        // 檢查附近是否有容器
        const targetContainer = this.findNearbyContainer();

        if (targetContainer) {
            // 倒酒到容器
            const heldObjectType = heldObject.userData.type;
            const liquorType = heldObject.userData.liquorType;

            if (heldObjectType === 'bottle' && liquorType) {
                // 從酒瓶倒酒
                this.cocktailSystem.pour(
                    heldObject,
                    targetContainer,
                    liquorType,
                    deltaTime,
                    this.camera
                );
            } else if (heldObjectType === 'shaker') {
                // 從 Shaker 倒酒
                this.cocktailSystem.pourFromShaker(heldObject, targetContainer, deltaTime);
            }
        } else if (heldObject.userData.type === 'shaker') {
            // 搖酒
            this.cocktailSystem.shake(heldObject);
        }
    }

    /**
     * 尋找附近的容器
     */
    private findNearbyContainer(): BABYLON.Mesh | null {
        const heldObject = this.interactionSystem.getHeldObject();
        if (!heldObject) return null;

        // 從相機發射射線
        const ray = this.camera.getForwardRay(2.5);
        const pickInfo = this.scene.pickWithRay(ray!);

        if (pickInfo && pickInfo.hit && pickInfo.pickedMesh) {
            const mesh = pickInfo.pickedMesh as BABYLON.Mesh;
            const type = mesh.userData?.type;

            // 檢查是否為容器
            if (type === 'glass' || type === 'shaker' || type === 'mixing_glass') {
                return mesh;
            }
        }

        return null;
    }

    /**
     * 設置 UI 控制
     */
    private setupUIControls(): void {
        // 食譜面板
        const recipeMenu = document.getElementById('recipe-menu');
        const closeRecipeBtn = document.getElementById('close-recipe-menu');

        if (closeRecipeBtn) {
            closeRecipeBtn.addEventListener('click', () => {
                this.toggleRecipeMenu();
            });
        }

        // 載入食譜內容
        this.loadRecipes();
    }

    /**
     * 載入食譜
     */
    private loadRecipes(): void {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) return;

        const recipes = this.cocktailSystem.getCocktailRecipes();

        recipeList.innerHTML = recipes
            .map(
                recipe => `
            <div class="recipe-item">
                <h3>${recipe.name} <span class="recipe-name-cn">${recipe.nameChinese}</span></h3>
                <div class="recipe-ingredients">
                    ${recipe.ingredients
                        .map(ing => `<div>• ${ing.amount}ml ${ing.name}</div>`)
                        .join('')}
                </div>
                <div class="recipe-method">
                    <strong>作法：</strong>${recipe.method}
                </div>
                <div class="recipe-glass">
                    <strong>杯具：</strong>${recipe.glass}
                </div>
                ${recipe.garnish ? `<div class="recipe-garnish"><strong>裝飾：</strong>${recipe.garnish}</div>` : ''}
            </div>
        `
            )
            .join('');
    }

    /**
     * 切換食譜選單
     */
    private toggleRecipeMenu(): void {
        const recipeMenu = document.getElementById('recipe-menu');
        if (!recipeMenu) return;

        this.isRecipeMenuOpen = !this.isRecipeMenuOpen;
        this.isPaused = this.isRecipeMenuOpen;

        recipeMenu.style.display = this.isRecipeMenuOpen ? 'block' : 'none';
    }

    /**
     * 更新 FPS 顯示
     */
    private updateFPS(): void {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = Math.round(this.engine.getFps()).toString();
        }
    }

    /**
     * 顯示載入畫面
     */
    private showLoadingScreen(): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    /**
     * 更新載入進度
     */
    private updateLoadingProgress(percentage: number, message: string): void {
        const loadingText = document.getElementById('loading-text');
        const loadingPercentage = document.getElementById('loading-percentage');
        const loadingProgressBar = document.getElementById('loading-progress-bar');

        if (loadingText) loadingText.textContent = message;
        if (loadingPercentage) loadingPercentage.textContent = `${percentage}%`;
        if (loadingProgressBar) loadingProgressBar.style.width = `${percentage}%`;

        console.log(`[${percentage}%] ${message}`);
    }

    /**
     * 隱藏載入畫面
     */
    private hideLoadingScreen(): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// 當 DOM 載入完成後啟動遊戲
window.addEventListener('DOMContentLoaded', () => {
    new BarSimulator();
});

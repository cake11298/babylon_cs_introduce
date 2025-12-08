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
    private clock: BABYLON.Time;
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
        this.clock = new BABYLON.Time();

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

        // 場景背景色
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1.0);

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

            // 1. 初始化物理系統
            this.physicsSystem = new PhysicsSystem(this.scene);
            await this.physicsSystem.initialize();
            console.log('✓ Physics system initialized');

            // 2. 初始化互動系統
            this.interactionSystem = new InteractionSystem(
                this.camera,
                this.scene,
                this.physicsSystem
            );
            console.log('✓ Interaction system initialized');

            // 3. 初始化調酒系統
            this.cocktailSystem = new CocktailSystem(
                this.scene,
                this.interactionSystem
            );
            this.interactionSystem.setCocktailSystem(this.cocktailSystem);
            console.log('✓ Cocktail system initialized');

            // 4. 初始化玩家控制器
            this.playerController = new PlayerController(
                this.camera,
                this.scene,
                this.canvas
            );
            console.log('✓ Player controller initialized');

            // 5. 初始化光照系統
            this.lightingSystem = new LightingSystem(this.scene);
            console.log('✓ Lighting system initialized');

            // 6. 創建酒吧環境
            this.barEnvironment = new BarEnvironment(
                this.scene,
                this.physicsSystem,
                this.interactionSystem,
                this.cocktailSystem
            );
            this.barEnvironment.createEnvironment();
            console.log('✓ Bar environment created');

            // 7. 初始化 NPC 管理器
            this.npcManager = new NPCManager(this.scene);
            console.log('✓ NPC manager initialized');

            // 8. 設置 UI 控制
            this.setupUIControls();

            // 隱藏載入畫面
            this.hideLoadingScreen();

            console.log('🎮 Bar Simulator initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            alert('遊戲初始化失敗，請重新整理頁面');
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
        // E 鍵：拾取物品 / 互動
        const ePressed = this.playerController.isKeyPressed('KeyE');
        if (ePressed && !this.lastPickup) {
            this.interactionSystem.pickupItem();
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

        // 檢查附近是否有容器
        const targetContainer = this.findNearbyContainer();

        if (targetContainer) {
            // 倒酒到容器
            this.cocktailSystem.pour(heldObject, targetContainer);
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

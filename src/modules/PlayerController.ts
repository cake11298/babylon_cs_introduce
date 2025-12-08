/**
 * 玩家控制器 - 第一人稱控制
 */

import * as BABYLON from '@babylonjs/core';

export default class PlayerController {
    private camera: BABYLON.UniversalCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;

    // 移動速度和靈敏度
    private readonly MOVE_SPEED = 0.15;
    private readonly SPRINT_SPEED = 0.3;
    private readonly MOUSE_SENSITIVITY = 0.08; // 提高20倍靈敏度（從0.004到0.08）

    // 鍵盤狀態
    private keys: Map<string, boolean>;

    // 是否鎖定指針
    private isPointerLocked: boolean = false;

    constructor(camera: BABYLON.UniversalCamera, scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.scene = scene;
        this.canvas = canvas;
        this.keys = new Map();

        this.setupControls();
        this.setupPointerLock();
    }

    /**
     * 設置控制
     */
    private setupControls(): void {
        // 鍵盤事件
        window.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });

        // 設置基本移動鍵
        this.camera.keysUp = [87];    // W
        this.camera.keysDown = [83];  // S
        this.camera.keysLeft = [65];  // A
        this.camera.keysRight = [68]; // D

        // 設置速度
        this.camera.speed = this.MOVE_SPEED;

        // 設置滑鼠靈敏度
        this.camera.angularSensibility = 1000 / this.MOUSE_SENSITIVITY;

        // 啟用碰撞
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

        // 設置相機限制（防止看太高或太低）
        this.camera.upperBetaLimit = Math.PI / 2 + 0.1;
        this.camera.lowerBetaLimit = -Math.PI / 2 - 0.1;
    }

    /**
     * 設置指針鎖定
     */
    private setupPointerLock(): void {
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;

            if (this.isPointerLocked) {
                this.camera.attachControl(this.canvas, true);
            } else {
                this.camera.detachControl();
            }
        });
    }

    /**
     * 更新（每幀調用）
     */
    update(deltaTime: number): void {
        // 更新衝刺
        const isShiftPressed = this.keys.get('ShiftLeft') || this.keys.get('ShiftRight');
        this.camera.speed = isShiftPressed ? this.SPRINT_SPEED : this.MOVE_SPEED;

        // 跳躍（如果需要的話）
        if (this.keys.get('Space')) {
            // 可以添加跳躍邏輯
            // this.camera.position.y += 0.1;
        }
    }

    /**
     * 獲取相機
     */
    getCamera(): BABYLON.UniversalCamera {
        return this.camera;
    }

    /**
     * 設置相機位置
     */
    setPosition(position: BABYLON.Vector3): void {
        this.camera.position = position;
    }

    /**
     * 檢查按鍵狀態
     */
    isKeyPressed(keyCode: string): boolean {
        return this.keys.get(keyCode) === true;
    }

    /**
     * 清理
     */
    dispose(): void {
        this.camera.detachControl();
    }
}

/**
 * 互動系統 - 處理物品拾取、放置、檢測
 */

import * as BABYLON from '@babylonjs/core';
import type PhysicsSystem from './PhysicsSystem';
import type CocktailSystem from './CocktailSystem';
import { ItemType, type InteractableObject } from '../types/types';

export default class InteractionSystem {
    private camera: BABYLON.UniversalCamera;
    private scene: BABYLON.Scene;
    private physics: PhysicsSystem;
    private cocktailSystem: CocktailSystem | null = null;

    // 可互動物品列表
    private interactableObjects: InteractableObject[] = [];

    // 當前瞄準和持有的物品
    private targetedObject: InteractableObject | null = null;
    private heldObject: InteractableObject | null = null;

    // 手持物品的偏移位置
    private holdOffset: BABYLON.Vector3;
    private holdParent: BABYLON.TransformNode;

    // 高亮效果
    private highlightLayer: BABYLON.HighlightLayer;

    // 互動距離
    private readonly INTERACTION_DISTANCE = 3.0;

    // 性能優化：射線檢測節流
    private frameCounter = 0;
    private readonly RAYCAST_THROTTLE_FRAMES = 10; // 每10幀執行一次射線檢測

    constructor(
        camera: BABYLON.UniversalCamera,
        scene: BABYLON.Scene,
        physics: PhysicsSystem
    ) {
        this.camera = camera;
        this.scene = scene;
        this.physics = physics;

        // 創建手持物品的父節點（附加到相機）
        this.holdParent = new BABYLON.TransformNode('holdParent', scene);
        this.holdParent.parent = camera;
        // 調整為更合理的手持位置：右下前方
        this.holdOffset = new BABYLON.Vector3(0.4, -0.5, 1.2);

        // 創建高亮圖層
        this.highlightLayer = new BABYLON.HighlightLayer('highlight', scene);
        this.highlightLayer.blurHorizontalSize = 1.0;
        this.highlightLayer.blurVerticalSize = 1.0;
    }

    /**
     * 設置調酒系統引用
     */
    setCocktailSystem(cocktailSystem: CocktailSystem): void {
        this.cocktailSystem = cocktailSystem;
    }

    /**
     * 註冊可互動物品
     */
    registerInteractable(
        object: BABYLON.Mesh,
        type: ItemType,
        liquorType?: string,
        capacity?: number
    ): void {
        const interactable = object as InteractableObject;

        interactable.userData = {
            interactable: true,
            type,
            liquorType,
            capacity,
            originalPosition: object.position.clone()
        };

        this.interactableObjects.push(interactable);
    }

    /**
     * 更新系統（每幀調用）
     */
    update(): void {
        this.updateTargeting();
        this.updateHeldObject();
    }

    /**
     * 更新瞄準檢測（性能優化：節流處理）
     */
    private updateTargeting(): void {
        // 如果正在持有物品，跳過瞄準檢測
        if (this.heldObject) {
            return;
        }

        // 性能優化：每N幀執行一次射線檢測
        this.frameCounter++;
        if (this.frameCounter < this.RAYCAST_THROTTLE_FRAMES) {
            return;
        }
        this.frameCounter = 0;

        // 清除之前的高亮
        if (this.targetedObject && this.targetedObject !== this.heldObject) {
            this.highlightLayer.removeMesh(this.targetedObject);
        }

        this.targetedObject = null;

        // 從相機中心發射射線
        const ray = this.camera.getForwardRay(this.INTERACTION_DISTANCE);

        const pickInfo = this.scene.pickWithRay(ray!, (mesh) => {
            return this.interactableObjects.includes(mesh as InteractableObject);
        });

        if (pickInfo && pickInfo.hit && pickInfo.pickedMesh) {
            this.targetedObject = pickInfo.pickedMesh as InteractableObject;

            // 添加黃色高亮
            this.highlightLayer.addMesh(
                this.targetedObject,
                BABYLON.Color3.Yellow()
            );

            // 更新 UI 提示
            this.updateInteractionHint();
        } else {
            this.hideInteractionHint();
        }
    }

    /**
     * 更新持有物品的位置
     */
    private updateHeldObject(): void {
        if (!this.heldObject) return;

        // 計算物品在手中的位置
        const forward = this.camera.getDirection(BABYLON.Axis.Z);
        const right = this.camera.getDirection(BABYLON.Axis.X);
        const up = this.camera.getDirection(BABYLON.Axis.Y);

        // 物品位置 = 相機位置 + 偏移量
        this.heldObject.position = this.camera.position
            .add(forward.scale(this.holdOffset.z))
            .add(right.scale(this.holdOffset.x))
            .add(up.scale(this.holdOffset.y));

        // 物品朝向與相機一致
        this.heldObject.rotationQuaternion = this.camera.absoluteRotation.clone();

        // 輕微縮小物品以便觀看（可選）
        if (!this.heldObject.metadata?.originalScaling) {
            this.heldObject.metadata = this.heldObject.metadata || {};
            this.heldObject.metadata.originalScaling = this.heldObject.scaling.clone();
        }
    }

    /**
     * 拾取物品
     */
    pickupItem(): boolean {
        if (!this.targetedObject || this.heldObject) return false;

        this.heldObject = this.targetedObject;

        // 移除高亮
        this.highlightLayer.removeMesh(this.heldObject);

        // 禁用物理
        this.physics.setPhysicsEnabled(this.heldObject, false);

        console.log(`Picked up: ${this.heldObject.userData.type}`);
        return true;
    }

    /**
     * 放下物品
     */
    dropItem(): boolean {
        if (!this.heldObject) return false;

        const droppedObject = this.heldObject;

        // 恢復原始縮放（如果有修改過）
        if (droppedObject.metadata?.originalScaling) {
            droppedObject.scaling = droppedObject.metadata.originalScaling;
        }

        // 計算放下位置（相機前方稍遠處）
        const dropPosition = this.camera.position
            .add(this.camera.getDirection(BABYLON.Axis.Z).scale(1.5))
            .add(this.camera.getDirection(BABYLON.Axis.Y).scale(-0.5));

        droppedObject.position = dropPosition;

        // 啟用物理
        this.physics.setPhysicsEnabled(droppedObject, true);

        // 給予輕微向前的速度
        const dropVelocity = this.camera.getDirection(BABYLON.Axis.Z).scale(2);
        this.physics.setVelocity(droppedObject, dropVelocity);

        this.heldObject = null;

        console.log(`Dropped: ${droppedObject.userData.type}`);
        return true;
    }

    /**
     * 將物品放回原位
     */
    returnItem(): boolean {
        if (!this.heldObject) return false;

        const returnedObject = this.heldObject;
        const originalPos = returnedObject.userData.originalPosition;

        // 恢復原始縮放（如果有修改過）
        if (returnedObject.metadata?.originalScaling) {
            returnedObject.scaling = returnedObject.metadata.originalScaling;
        }

        if (originalPos) {
            returnedObject.position = originalPos.clone();
        }

        // 啟用物理
        this.physics.setPhysicsEnabled(returnedObject, true);
        this.physics.setVelocity(returnedObject, BABYLON.Vector3.Zero());

        this.heldObject = null;

        console.log(`Returned: ${returnedObject.userData.type}`);
        return true;
    }

    /**
     * 獲取當前持有的物品
     */
    getHeldObject(): InteractableObject | null {
        return this.heldObject;
    }

    /**
     * 獲取當前瞄準的物品
     */
    getTargetedObject(): InteractableObject | null {
        return this.targetedObject;
    }

    /**
     * 更新互動提示 UI
     */
    private updateInteractionHint(): void {
        if (!this.targetedObject) return;

        const hintElement = document.getElementById('interaction-hint');
        if (hintElement) {
            const type = this.targetedObject.userData.type;
            let hintText = '按 E 拾取';

            if (type === ItemType.NPC) {
                hintText = '按 E 對話';
            } else if (type === ItemType.GUITAR) {
                hintText = '按 E 演奏';
            } else if (this.cocktailSystem && this.targetedObject.userData.liquorType) {
                const liquorData = this.cocktailSystem.getLiquorData(
                    this.targetedObject.userData.liquorType
                );
                if (liquorData) {
                    hintText = `${liquorData.displayName} - 按 E 拾取`;
                }
            }

            hintElement.textContent = hintText;
            hintElement.style.display = 'block';
        }
    }

    /**
     * 隱藏互動提示 UI
     */
    private hideInteractionHint(): void {
        const hintElement = document.getElementById('interaction-hint');
        if (hintElement) {
            hintElement.style.display = 'none';
        }
    }

    /**
     * 清理系統
     */
    dispose(): void {
        this.highlightLayer.dispose();
        this.holdParent.dispose();
    }
}

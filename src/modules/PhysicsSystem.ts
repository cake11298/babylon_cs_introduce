/**
 * 物理系統 - 使用 Babylon.js v1 物理引擎（Cannon.js）
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Physics/physicsEngineComponent';
import type { PhysicsBodyConfig } from '../types/types';

export default class PhysicsSystem {
    private scene: BABYLON.Scene;
    private gravity: BABYLON.Vector3;
    private physicsImpostors: Map<BABYLON.Mesh, BABYLON.PhysicsImpostor>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.physicsImpostors = new Map();
    }

    /**
     * 初始化物理引擎
     */
    async initialize(): Promise<void> {
        // 直接使用 Cannon.js（輕量級，加載更快）
        try {
            console.log('正在載入 Cannon.js 物理引擎（輕量級）...');
            const { CannonJSPlugin } = await import('@babylonjs/core/Physics/v1');
            const CANNON = await import('cannon');
            const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
            this.scene.enablePhysics(this.gravity, cannonPlugin);
            console.log('✓ Physics system initialized with Cannon.js (v1 API)');
        } catch (error) {
            console.error('Failed to initialize Cannon.js physics engine:', error);
            throw new Error('No physics engine available');
        }
    }

    /**
     * 添加盒狀剛體（使用 v1 PhysicsImpostor）
     */
    addBoxBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsImpostor {
        const impostor = new BABYLON.PhysicsImpostor(
            mesh,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        this.physicsImpostors.set(mesh, impostor);
        return impostor;
    }

    /**
     * 添加圓柱剛體（使用 v1 PhysicsImpostor）
     */
    addCylinderBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsImpostor {
        const impostor = new BABYLON.PhysicsImpostor(
            mesh,
            BABYLON.PhysicsImpostor.CylinderImpostor,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        this.physicsImpostors.set(mesh, impostor);
        return impostor;
    }

    /**
     * 添加球狀剛體（使用 v1 PhysicsImpostor）
     */
    addSphereBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsImpostor {
        const impostor = new BABYLON.PhysicsImpostor(
            mesh,
            BABYLON.PhysicsImpostor.SphereImpostor,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        this.physicsImpostors.set(mesh, impostor);
        return impostor;
    }

    /**
     * 添加靜態盒狀碰撞體（質量為0，不會移動）
     */
    addStaticBoxCollider(mesh: BABYLON.Mesh): BABYLON.PhysicsImpostor {
        return this.addBoxBody(mesh, { mass: 0 });
    }

    /**
     * 移除物理體
     */
    removeBody(mesh: BABYLON.Mesh): void {
        const impostor = this.physicsImpostors.get(mesh);
        if (impostor) {
            impostor.dispose();
            this.physicsImpostors.delete(mesh);
        }
    }

    /**
     * 設定物體速度
     */
    setVelocity(mesh: BABYLON.Mesh, velocity: BABYLON.Vector3): void {
        const impostor = this.physicsImpostors.get(mesh);
        if (impostor) {
            impostor.setLinearVelocity(velocity);
        }
    }

    /**
     * 獲取物體速度
     */
    getVelocity(mesh: BABYLON.Mesh): BABYLON.Vector3 | null {
        const impostor = this.physicsImpostors.get(mesh);
        return impostor ? impostor.getLinearVelocity() : null;
    }

    /**
     * 啟用/禁用物理
     */
    setPhysicsEnabled(mesh: BABYLON.Mesh, enabled: boolean): void {
        const impostor = this.physicsImpostors.get(mesh);
        if (impostor && impostor.physicsBody) {
            if (enabled) {
                impostor.physicsBody.mass = impostor.getParam('mass') || 1;
            } else {
                impostor.physicsBody.mass = 0;
            }
            impostor.physicsBody.updateMassProperties();
        }
    }

    /**
     * 清理所有物理體
     */
    dispose(): void {
        this.physicsImpostors.forEach(impostor => impostor.dispose());
        this.physicsImpostors.clear();
    }
}

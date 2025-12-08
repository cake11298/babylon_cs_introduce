/**
 * 物理系統 - 使用 Babylon.js 內建物理引擎
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Physics/physicsEngineComponent';
import type { PhysicsBodyConfig } from '../types/types';

export default class PhysicsSystem {
    private scene: BABYLON.Scene;
    private gravity: BABYLON.Vector3;
    private physicsBodies: Map<BABYLON.Mesh, BABYLON.PhysicsBody>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.physicsBodies = new Map();
    }

    /**
     * 初始化物理引擎
     */
    async initialize(): Promise<void> {
        // 直接使用 Cannon.js（輕量級，加載更快）
        // 跳過 Havok 以提升加載速度
        try {
            console.log('正在載入 Cannon.js 物理引擎（輕量級）...');
            await this.initializeCannonFallback();
            console.log('✓ Physics system initialized with Cannon.js');
        } catch (error) {
            console.error('Failed to initialize Cannon.js physics engine:', error);
            throw new Error('No physics engine available');
        }
    }

    /**
     * 初始化 Havok 物理引擎
     */
    private async initializeHavok(): Promise<void> {
        const HavokPhysics = await import('@babylonjs/havok');
        const { HavokPlugin } = await import('@babylonjs/core/Physics/v2/Plugins/havokPlugin');

        const havokInstance = await HavokPhysics.default();
        const havokPlugin = new HavokPlugin(true, havokInstance);

        this.scene.enablePhysics(this.gravity, havokPlugin);
    }

    /**
     * Cannon.js 後備初始化
     */
    private async initializeCannonFallback(): Promise<void> {
        try {
            const { CannonJSPlugin } = await import('@babylonjs/core/Physics/v1');
            const CANNON = await import('cannon');
            const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
            this.scene.enablePhysics(this.gravity, cannonPlugin);
            console.log('✓ Physics system initialized with Cannon.js fallback');
        } catch (error) {
            console.error('Failed to initialize physics engine:', error);
            throw new Error('No physics engine available');
        }
    }

    /**
     * 添加盒狀剛體
     */
    addBoxBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsBody {
        const aggregate = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        const body = aggregate.body;
        this.physicsBodies.set(mesh, body);
        return body;
    }

    /**
     * 添加圓柱剛體
     */
    addCylinderBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsBody {
        const aggregate = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        const body = aggregate.body;
        this.physicsBodies.set(mesh, body);
        return body;
    }

    /**
     * 添加球狀剛體
     */
    addSphereBody(
        mesh: BABYLON.Mesh,
        config: PhysicsBodyConfig
    ): BABYLON.PhysicsBody {
        const aggregate = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            {
                mass: config.mass,
                restitution: config.restitution ?? 0.3,
                friction: config.friction ?? 0.5
            },
            this.scene
        );

        const body = aggregate.body;
        this.physicsBodies.set(mesh, body);
        return body;
    }

    /**
     * 添加靜態盒狀碰撞體（質量為0，不會移動）
     */
    addStaticBoxCollider(mesh: BABYLON.Mesh): BABYLON.PhysicsBody {
        return this.addBoxBody(mesh, { mass: 0 });
    }

    /**
     * 移除物理體
     */
    removeBody(mesh: BABYLON.Mesh): void {
        const body = this.physicsBodies.get(mesh);
        if (body) {
            body.dispose();
            this.physicsBodies.delete(mesh);
        }
    }

    /**
     * 設定物體速度
     */
    setVelocity(mesh: BABYLON.Mesh, velocity: BABYLON.Vector3): void {
        const body = this.physicsBodies.get(mesh);
        if (body) {
            body.setLinearVelocity(velocity);
        }
    }

    /**
     * 獲取物體速度
     */
    getVelocity(mesh: BABYLON.Mesh): BABYLON.Vector3 | null {
        const body = this.physicsBodies.get(mesh);
        return body ? body.getLinearVelocity() : null;
    }

    /**
     * 啟用/禁用物理
     */
    setPhysicsEnabled(mesh: BABYLON.Mesh, enabled: boolean): void {
        const body = this.physicsBodies.get(mesh);
        if (body) {
            body.setMotionType(
                enabled
                    ? BABYLON.PhysicsMotionType.DYNAMIC
                    : BABYLON.PhysicsMotionType.STATIC
            );
        }
    }

    /**
     * 清理所有物理體
     */
    dispose(): void {
        this.physicsBodies.forEach(body => body.dispose());
        this.physicsBodies.clear();
    }
}

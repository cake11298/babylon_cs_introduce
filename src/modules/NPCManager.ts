/**
 * NPC 管理器 - 創建和管理 NPC 角色
 * 使用簡單的幾何體和 PBR 材質
 */

import * as BABYLON from '@babylonjs/core';
import { ItemType } from '../types/types';

interface NPCConfig {
    name: string;
    position: BABYLON.Vector3;
    shirtColor: number;
    pantsColor: number;
    role: string;
    dialogues: string[];
    gender?: 'male' | 'female';
    rotation?: number;
}

interface NPCData {
    name: string;
    role: string;
    dialogues: string[];
    currentDialogue: number;
    originalY: number;
    baseRotation: number;
    nameTagSprite?: BABYLON.Sprite;
}

export default class NPCManager {
    private scene: BABYLON.Scene;
    private npcs: BABYLON.Mesh[] = [];

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.createNPCs();
    }

    /**
     * 創建所有 NPC
     */
    private createNPCs(): void {
        // 創建 NPC 1 - Gustave（調酒社創始社長）
        this.addNPC({
            name: 'Gustave',
            position: new BABYLON.Vector3(8, 0, -5),
            shirtColor: 0x0066cc,
            pantsColor: 0x1a1a1a,
            role: '調酒社創始社長',
            gender: 'male',
            dialogues: [
                '嗨！我是 Gustave Yang，NCU 分子創意飲品研究社的創辦人！',
                '分子調酒不只是技術，更是科學與藝術的融合。',
                '你知道嗎？調酒的關鍵在於材料的比例和混合方式。',
                '歡迎來到我們的酒吧！試著調製一杯屬於你的調酒吧！',
                '記得，好的調酒需要耐心和創意。'
            ]
        });

        // 創建 NPC 2 - Seaton（調酒社共同創辦人）
        this.addNPC({
            name: 'Seaton',
            position: new BABYLON.Vector3(-8, 0, -5),
            shirtColor: 0xcc0066,
            pantsColor: 0x333333,
            role: '調酒社共同創辦人',
            gender: 'male',
            dialogues: [
                '哈囉！我是 Seaton 曦樂，也是社團的共同創辦人！',
                '我最喜歡日本威士忌，特別是山崎12年。',
                '調酒是一門藝術，每一杯都有它的故事。',
                '你可以試著調一杯 Old Fashioned，那是我的最愛。',
                '享受調酒的過程，不要急於求成。'
            ]
        });
    }

    /**
     * 添加單個 NPC
     */
    private addNPC(config: NPCConfig): void {
        const npc = new BABYLON.Mesh(`npc_${config.name}`, this.scene);
        const isFemale = config.gender === 'female';

        // 創建身體部件
        const body = this.createBody(config.shirtColor, isFemale);
        const pants = this.createPants(config.pantsColor, isFemale);
        const head = this.createHead();
        const hair = this.createHair(isFemale);
        const leftArm = this.createArm(true, isFemale);
        const rightArm = this.createArm(false, isFemale);
        const leftLeg = this.createLeg(true);
        const rightLeg = this.createLeg(false);
        const face = this.createFace();

        // 組裝 NPC
        body.parent = npc;
        pants.parent = npc;
        head.parent = npc;
        hair.parent = npc;
        leftArm.parent = npc;
        rightArm.parent = npc;
        leftLeg.parent = npc;
        rightLeg.parent = npc;
        face.parent = npc;

        // 創建名字標籤
        const nameTag = this.createNameTag(config.name, config.role);
        nameTag.parent = npc;

        // 設置位置和旋轉
        npc.position = config.position;
        if (config.rotation !== undefined) {
            npc.rotation.y = config.rotation;
        }

        // 儲存 NPC 資料
        (npc as any).userData = {
            name: config.name,
            role: config.role,
            dialogues: config.dialogues,
            currentDialogue: 0,
            originalY: config.position.y,
            baseRotation: config.rotation || 0
        } as NPCData;

        this.npcs.push(npc);
    }

    /**
     * 創建身體
     */
    private createBody(color: number, isFemale: boolean): BABYLON.Mesh {
        const width = isFemale ? 0.35 : 0.4;
        const body = BABYLON.MeshBuilder.CreateCylinder(
            'body',
            {
                height: 0.9,
                diameterTop: width * 2,
                diameterBottom: (width + 0.05) * 2,
                tessellation: 16
            },
            this.scene
        );
        body.position.y = 1.2;

        const material = new BABYLON.PBRMaterial('bodyMat', this.scene);
        material.albedoColor = BABYLON.Color3.FromHexString('#' + color.toString(16).padStart(6, '0'));
        material.metallic = 0.1;
        material.roughness = 0.8;
        body.material = material;
        body.castShadow = true;

        return body;
    }

    /**
     * 創建褲子
     */
    private createPants(color: number, isFemale: boolean): BABYLON.Mesh {
        const pants = BABYLON.MeshBuilder.CreateCylinder(
            'pants',
            {
                height: 1.0,
                diameter: 0.7,
                tessellation: 16
            },
            this.scene
        );
        pants.position.y = 0.2;

        const material = new BABYLON.PBRMaterial('pantsMat', this.scene);
        material.albedoColor = BABYLON.Color3.FromHexString('#' + color.toString(16).padStart(6, '0'));
        material.metallic = 0.05;
        material.roughness = 0.9;
        pants.material = material;
        pants.castShadow = true;

        return pants;
    }

    /**
     * 創建頭部
     */
    private createHead(): BABYLON.Mesh {
        const head = BABYLON.MeshBuilder.CreateSphere(
            'head',
            { diameter: 0.7, segments: 16 },
            this.scene
        );
        head.position.y = 2.1;

        const material = new BABYLON.PBRMaterial('headMat', this.scene);
        material.albedoColor = BABYLON.Color3.FromHexString('#fdbcb4');
        material.metallic = 0.0;
        material.roughness = 0.9;
        head.material = material;
        head.castShadow = true;

        return head;
    }

    /**
     * 創建頭髮
     */
    private createHair(isFemale: boolean): BABYLON.Mesh {
        const hair = BABYLON.MeshBuilder.CreateSphere(
            'hair',
            {
                diameter: 0.76,
                segments: 16,
                slice: isFemale ? 0.4 : 0.35
            },
            this.scene
        );
        hair.position.y = 2.1;

        const material = new BABYLON.PBRMaterial('hairMat', this.scene);
        material.albedoColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        material.metallic = 0.05;
        material.roughness = 0.7;
        hair.material = material;
        hair.castShadow = true;

        return hair;
    }

    /**
     * 創建手臂
     */
    private createArm(isLeft: boolean, isFemale: boolean): BABYLON.Mesh {
        const armDistance = isFemale ? 0.5 : 0.55;
        const arm = BABYLON.MeshBuilder.CreateCylinder(
            isLeft ? 'leftArm' : 'rightArm',
            { height: 0.8, diameter: 0.24, tessellation: 12 },
            this.scene
        );
        arm.position.set(isLeft ? -armDistance : armDistance, 1.2, 0);

        const material = new BABYLON.PBRMaterial('armMat', this.scene);
        material.albedoColor = BABYLON.Color3.FromHexString('#fdbcb4');
        material.metallic = 0.0;
        material.roughness = 0.9;
        arm.material = material;
        arm.castShadow = true;

        return arm;
    }

    /**
     * 創建腿
     */
    private createLeg(isLeft: boolean): BABYLON.Mesh {
        const leg = BABYLON.MeshBuilder.CreateCylinder(
            isLeft ? 'leftLeg' : 'rightLeg',
            { height: 1.0, diameter: 0.3, tessellation: 16 },
            this.scene
        );
        leg.position.set(isLeft ? -0.18 : 0.18, -0.3, 0);

        const material = new BABYLON.PBRMaterial('legMat', this.scene);
        material.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        material.metallic = 0.1;
        material.roughness = 0.8;
        leg.material = material;
        leg.castShadow = true;

        return leg;
    }

    /**
     * 創建臉部（眼睛和嘴巴）
     */
    private createFace(): BABYLON.TransformNode {
        const faceGroup = new BABYLON.TransformNode('face', this.scene);
        faceGroup.position.y = 2.1;

        // 左眼
        const leftEye = BABYLON.MeshBuilder.CreateSphere(
            'leftEye',
            { diameter: 0.1, segments: 8 },
            this.scene
        );
        leftEye.position.set(-0.12, 0.05, 0.33);
        const eyeMaterial = new BABYLON.StandardMaterial('eyeMat', this.scene);
        eyeMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        leftEye.material = eyeMaterial;
        leftEye.parent = faceGroup;

        // 右眼
        const rightEye = BABYLON.MeshBuilder.CreateSphere(
            'rightEye',
            { diameter: 0.1, segments: 8 },
            this.scene
        );
        rightEye.position.set(0.12, 0.05, 0.33);
        rightEye.material = eyeMaterial;
        rightEye.parent = faceGroup;

        // 嘴巴
        const mouth = BABYLON.MeshBuilder.CreateTorus(
            'mouth',
            { diameter: 0.24, thickness: 0.02, tessellation: 16 },
            this.scene
        );
        mouth.rotation.x = Math.PI;
        mouth.position.set(0, -0.1, 0.32);
        mouth.material = eyeMaterial;
        mouth.parent = faceGroup;

        return faceGroup;
    }

    /**
     * 創建名字標籤
     */
    private createNameTag(name: string, role: string): BABYLON.TransformNode {
        const tagGroup = new BABYLON.TransformNode('nameTag', this.scene);
        tagGroup.position.y = 2.8;

        // 創建 Canvas 繪製文字
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 512;
        canvas.height = 256;

        // 清除並設定透明背景
        context.clearRect(0, 0, canvas.width, canvas.height);

        // 繪製半透明背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.roundRect(50, 70, 412, 116, 20);
        context.fill();

        // 繪製名字
        context.fillStyle = 'white';
        context.font = 'bold 64px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, 256, 110);

        // 繪製角色職稱
        context.font = '40px Arial';
        context.fillStyle = '#FFD700';
        context.fillText(role, 256, 160);

        // 創建動態紋理
        const texture = new BABYLON.DynamicTexture('nameTagTexture', canvas, this.scene, false);
        texture.update();

        // 創建平面來顯示標籤
        const plane = BABYLON.MeshBuilder.CreatePlane(
            'nameTagPlane',
            { width: 2, height: 1 },
            this.scene
        );
        plane.parent = tagGroup;
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        const material = new BABYLON.StandardMaterial('nameTagMat', this.scene);
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;
        material.opacityTexture = texture;
        material.backFaceCulling = false;
        plane.material = material;

        return tagGroup;
    }

    /**
     * 檢查玩家是否接近某個 NPC
     */
    checkInteractions(playerPosition: BABYLON.Vector3): BABYLON.Mesh | null {
        const interactionDistance = 2.5;
        let closestNPC: BABYLON.Mesh | null = null;
        let minDistance = Infinity;

        for (const npc of this.npcs) {
            const distance = BABYLON.Vector3.Distance(playerPosition, npc.position);

            if (distance < interactionDistance && distance < minDistance) {
                minDistance = distance;
                closestNPC = npc;
            }
        }

        // 更新互動提示
        const hint = document.getElementById('interaction-hint');
        if (hint) {
            if (closestNPC) {
                const userData = (closestNPC as any).userData as NPCData;
                hint.textContent = `按 E 與 ${userData.name} 交談`;
                hint.style.display = 'block';
            } else {
                hint.style.display = 'none';
            }
        }

        return closestNPC;
    }

    /**
     * 與 NPC 互動
     */
    interact(npc: BABYLON.Mesh): void {
        if (!npc) return;

        const userData = (npc as any).userData as NPCData;

        const dialogueBox = document.getElementById('dialogue-box');
        const characterName = document.getElementById('character-name');
        const dialogueText = document.getElementById('dialogue-text');

        if (!dialogueBox || !characterName || !dialogueText) return;

        // 設置對話內容
        characterName.textContent = `${userData.name} - ${userData.role}`;
        dialogueText.textContent = userData.dialogues[userData.currentDialogue];

        // 顯示對話框
        dialogueBox.classList.remove('active');
        dialogueBox.offsetHeight; // 強制重繪
        dialogueBox.classList.add('active');

        // 循環對話
        userData.currentDialogue = (userData.currentDialogue + 1) % userData.dialogues.length;

        // 4秒後隱藏
        setTimeout(() => {
            dialogueBox.classList.remove('active');
        }, 4000);
    }

    /**
     * 更新 NPC 動畫（每幀調用）
     */
    update(deltaTime: number): void {
        const currentTime = Date.now() * 0.001; // 轉換為秒

        this.npcs.forEach((npc, index) => {
            const userData = (npc as any).userData as NPCData;

            // 輕微的上下浮動
            const floatY = Math.sin(currentTime + index) * 0.02;
            npc.position.y = userData.originalY + floatY;

            // 輕微的左右搖擺
            const swayAmount = Math.sin(currentTime * 0.8 + index * 2) * 0.05;
            npc.rotation.y = userData.baseRotation + swayAmount;
        });
    }

    /**
     * 獲取所有 NPC
     */
    getNPCs(): BABYLON.Mesh[] {
        return this.npcs;
    }

    /**
     * 根據名字獲取 NPC
     */
    getNPCByName(name: string): BABYLON.Mesh | undefined {
        return this.npcs.find(npc => {
            const userData = (npc as any).userData as NPCData;
            return userData.name === name;
        });
    }
}

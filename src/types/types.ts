/**
 * 類型定義
 */

import * as BABYLON from '@babylonjs/core';

// 物品類型
export enum ItemType {
    BOTTLE = 'bottle',
    GLASS = 'glass',
    SHAKER = 'shaker',
    JIGGER = 'jigger',
    MIXING_GLASS = 'mixing_glass',
    NPC = 'npc',
    GUITAR = 'guitar'
}

// 酒類類別
export enum LiquorCategory {
    BASE_SPIRIT = 'base_spirit',
    LIQUEUR = 'liqueur',
    JUICE = 'juice',
    MIXER = 'mixer',
    SYRUP = 'syrup',
    BITTERS = 'bitters'
}

// 酒類資料介面
export interface LiquorData {
    name: string;
    displayName: string;
    color: number;
    alcoholContent: number;
    category: LiquorCategory;
}

// 容器內容介面
export interface ContainerContent {
    ingredients: Array<{
        type: string;
        amount: number;
        liquorData: LiquorData;
    }>;
    totalVolume: number;
    color: number;
}

// 可互動物品介面
export interface InteractableObject extends BABYLON.Mesh {
    userData: {
        interactable: boolean;
        type: ItemType;
        liquorType?: string;
        capacity?: number;
        originalPosition?: BABYLON.Vector3;
    };
}

// 物理體設定
export interface PhysicsBodyConfig {
    mass: number;
    restitution?: number;
    friction?: number;
}

// 調酒配方介面
export interface CocktailRecipe {
    name: string;
    nameChinese: string;
    ingredients: Array<{
        type: string;
        amount: number;
        name: string;
    }>;
    method: string;
    glass: string;
    garnish?: string;
}

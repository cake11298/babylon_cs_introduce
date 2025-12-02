import * as BABYLON from '@babylonjs/core';
import { WaterMaterial } from '@babylonjs/materials';

'use strict';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
    CHUNK_SIZE: 64,           // 64x64x16 blocks per chunk (expanded terrain)
    WORLD_HEIGHT: 16,         // Max world height (reduced for performance)
    RENDER_DISTANCE: 1,       // Chunks to render in each direction (reduced for larger chunks)
    BLOCK_SIZE: 1,            // Size of each block
    WATER_LEVEL: 6,           // Water height
    TREE_DENSITY: 0.02,       // Tree spawn probability
};

// Block types
const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WATER: 4,
    WOOD: 5,
    LEAVES: 6,
    SAND: 7,
};

// Block colors (for procedural texture)
const BLOCK_COLORS = {
    [BLOCK.GRASS]: { r: 0.35, g: 0.7, b: 0.25 },
    [BLOCK.DIRT]: { r: 0.55, g: 0.35, b: 0.2 },
    [BLOCK.STONE]: { r: 0.45, g: 0.45, b: 0.48 },
    [BLOCK.WATER]: { r: 0.2, g: 0.5, b: 0.9 },
    [BLOCK.WOOD]: { r: 0.4, g: 0.25, b: 0.1 },
    [BLOCK.LEAVES]: { r: 0.2, g: 0.6, b: 0.2 },
    [BLOCK.SAND]: { r: 0.85, g: 0.8, b: 0.6 },
};

// ============================================================================
// NOISE GENERATION (Simplified Perlin-like noise)
// ============================================================================

class SimplexNoise {
    constructor(seed = 12345) {
        this.seed = seed;
        this.perm = this.generatePermutation(seed);
    }

    generatePermutation(seed) {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;

        // Shuffle using seed
        for (let i = 255; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            const j = Math.floor((seed / 233280) * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }

        return [...p, ...p]; // Double it for overflow
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
    }

    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.perm[X] + Y;
        const b = this.perm[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.perm[a], x, y),
                         this.grad(this.perm[b], x - 1, y)),
            this.lerp(u, this.grad(this.perm[a + 1], x, y - 1),
                         this.grad(this.perm[b + 1], x - 1, y - 1))
        );
    }

    octaveNoise2D(x, y, octaves = 4, persistence = 0.5) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }
}

// ============================================================================
// TEXTURE GENERATOR - Create realistic procedural textures
// ============================================================================

class TextureGenerator {
    static createGrassTexture(scene, noise) {
        const texture = new BABYLON.DynamicTexture("grassTex", 512, scene);
        const ctx = texture.getContext();
        const imageData = ctx.createImageData(512, 512);

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;

                // Multi-octave noise for realistic grass
                const n1 = noise.octaveNoise2D(x * 0.05, y * 0.05, 5, 0.6);
                const n2 = noise.octaveNoise2D(x * 0.2, y * 0.2, 3, 0.5);

                // Green base with variation
                const greenBase = 80 + n1 * 40;
                const greenVariation = 150 + n2 * 60;

                imageData.data[idx] = Math.floor(greenBase + n1 * 20);     // R
                imageData.data[idx + 1] = Math.floor(greenVariation);      // G
                imageData.data[idx + 2] = Math.floor(greenBase);           // B
                imageData.data[idx + 3] = 255;                              // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
        texture.update();
        return texture;
    }

    static createDirtTexture(scene, noise) {
        const texture = new BABYLON.DynamicTexture("dirtTex", 512, scene);
        const ctx = texture.getContext();
        const imageData = ctx.createImageData(512, 512);

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;

                const n = noise.octaveNoise2D(x * 0.1, y * 0.1, 4, 0.5);
                const brown = 100 + n * 60;

                imageData.data[idx] = Math.floor(brown * 1.2);
                imageData.data[idx + 1] = Math.floor(brown * 0.7);
                imageData.data[idx + 2] = Math.floor(brown * 0.4);
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        texture.update();
        return texture;
    }

    static createStoneTexture(scene, noise) {
        const texture = new BABYLON.DynamicTexture("stoneTex", 512, scene);
        const ctx = texture.getContext();
        const imageData = ctx.createImageData(512, 512);

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;

                const n = noise.octaveNoise2D(x * 0.08, y * 0.08, 6, 0.55);
                const gray = 100 + n * 80;

                imageData.data[idx] = Math.floor(gray);
                imageData.data[idx + 1] = Math.floor(gray);
                imageData.data[idx + 2] = Math.floor(gray * 1.1);
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        texture.update();
        return texture;
    }

    static createSandTexture(scene, noise) {
        const texture = new BABYLON.DynamicTexture("sandTex", 512, scene);
        const ctx = texture.getContext();
        const imageData = ctx.createImageData(512, 512);

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;

                const n = noise.octaveNoise2D(x * 0.15, y * 0.15, 4, 0.5);
                const sand = 200 + n * 40;

                imageData.data[idx] = Math.floor(sand);
                imageData.data[idx + 1] = Math.floor(sand * 0.9);
                imageData.data[idx + 2] = Math.floor(sand * 0.7);
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        texture.update();
        return texture;
    }

    static createNormalMap(scene, noise) {
        const texture = new BABYLON.DynamicTexture("normalMap", 512, scene);
        const ctx = texture.getContext();
        const imageData = ctx.createImageData(512, 512);

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;

                // Sample height at neighboring pixels
                const h = noise.octaveNoise2D(x * 0.1, y * 0.1, 3, 0.5);
                const hx = noise.octaveNoise2D((x + 1) * 0.1, y * 0.1, 3, 0.5);
                const hy = noise.octaveNoise2D(x * 0.1, (y + 1) * 0.1, 3, 0.5);

                // Calculate normal
                const nx = (h - hx) * 5;
                const ny = (h - hy) * 5;
                const nz = 1;

                // Normalize
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

                imageData.data[idx] = Math.floor((nx / len + 1) * 127.5);
                imageData.data[idx + 1] = Math.floor((ny / len + 1) * 127.5);
                imageData.data[idx + 2] = Math.floor((nz / len + 1) * 127.5);
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        texture.update();
        return texture;
    }
}

// ============================================================================
// CHUNK CLASS - Core voxel mesh generation with optimization
// ============================================================================

class Chunk {
    constructor(chunkX, chunkZ, scene, materials, noise) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.scene = scene;
        this.materials = materials;
        this.noise = noise;

        // 3D array to store block data [x][y][z]
        this.blocks = new Array(CONFIG.CHUNK_SIZE);
        for (let x = 0; x < CONFIG.CHUNK_SIZE; x++) {
            this.blocks[x] = new Array(CONFIG.WORLD_HEIGHT);
            for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
                this.blocks[x][y] = new Array(CONFIG.CHUNK_SIZE).fill(BLOCK.AIR);
            }
        }

        this.mesh = null;
        this.waterMesh = null;
        this.generateTerrain();
        this.buildMesh();
    }

    // Check if position is in river path
    isRiverPath(worldX, worldZ) {
        // Create a winding river through the center
        const riverCenterZ = 32;
        const riverNoise = this.noise.octaveNoise2D(worldX * 0.05, 0, 3, 0.5);
        const riverOffset = riverNoise * 8;
        const distToRiver = Math.abs(worldZ - (riverCenterZ + riverOffset));

        return distToRiver < 4; // River width of ~8 blocks
    }

    // Generate terrain using noise
    generateTerrain() {
        const offsetX = this.chunkX * CONFIG.CHUNK_SIZE;
        const offsetZ = this.chunkZ * CONFIG.CHUNK_SIZE;

        for (let x = 0; x < CONFIG.CHUNK_SIZE; x++) {
            for (let z = 0; z < CONFIG.CHUNK_SIZE; z++) {
                const worldX = offsetX + x;
                const worldZ = offsetZ + z;

                // Check if this is river path
                const inRiver = this.isRiverPath(worldX, worldZ);

                // Generate height using multiple octaves of noise
                const height = this.noise.octaveNoise2D(worldX * 0.02, worldZ * 0.02, 4, 0.5);
                let terrainHeight = Math.floor(8 + height * 4);

                // Lower terrain for river
                if (inRiver) {
                    terrainHeight = Math.min(terrainHeight, CONFIG.WATER_LEVEL - 1);
                }

                // Fill blocks based on height
                for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
                    if (y < terrainHeight - 3) {
                        this.blocks[x][y][z] = BLOCK.STONE;
                    } else if (y < terrainHeight - 1) {
                        this.blocks[x][y][z] = BLOCK.DIRT;
                    } else if (y < terrainHeight) {
                        // Use sand near river, grass elsewhere
                        if (inRiver || this.distanceToRiver(worldX, worldZ) < 6) {
                            this.blocks[x][y][z] = BLOCK.SAND;
                        } else {
                            this.blocks[x][y][z] = BLOCK.GRASS;
                        }
                    } else if (y < CONFIG.WATER_LEVEL) {
                        this.blocks[x][y][z] = BLOCK.WATER;
                    }
                }
            }
        }
    }

    distanceToRiver(worldX, worldZ) {
        const riverCenterZ = 32;
        const riverNoise = this.noise.octaveNoise2D(worldX * 0.05, 0, 3, 0.5);
        const riverOffset = riverNoise * 8;
        return Math.abs(worldZ - (riverCenterZ + riverOffset));
    }

    // Check if a block is solid (not air or water)
    isSolid(x, y, z) {
        if (x < 0 || x >= CONFIG.CHUNK_SIZE ||
            y < 0 || y >= CONFIG.WORLD_HEIGHT ||
            z < 0 || z >= CONFIG.CHUNK_SIZE) {
            return false; // Assume air outside chunk bounds
        }
        const block = this.blocks[x][y][z];
        return block !== BLOCK.AIR && block !== BLOCK.WATER;
    }

    // Check if block is water
    isWater(x, y, z) {
        if (x < 0 || x >= CONFIG.CHUNK_SIZE ||
            y < 0 || y >= CONFIG.WORLD_HEIGHT ||
            z < 0 || z >= CONFIG.CHUNK_SIZE) {
            return false;
        }
        return this.blocks[x][y][z] === BLOCK.WATER;
    }

    // Build optimized mesh using VertexData with greedy meshing
    buildMesh() {
        const positions = [];
        const indices = [];
        const normals = [];
        const uvs = [];
        const colors = [];

        const waterPositions = [];
        const waterIndices = [];
        const waterNormals = [];
        const waterUvs = [];

        let vertexCount = 0;
        let waterVertexCount = 0;

        // Process each block
        for (let x = 0; x < CONFIG.CHUNK_SIZE; x++) {
            for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
                for (let z = 0; z < CONFIG.CHUNK_SIZE; z++) {
                    const blockType = this.blocks[x][y][z];

                    if (blockType === BLOCK.AIR) continue;

                    const isWaterBlock = blockType === BLOCK.WATER;

                    // Check each face and only add if visible
                    const faces = [
                        { dir: [0, 1, 0], check: [x, y + 1, z], verts: [[0,1,0], [1,1,0], [1,1,1], [0,1,1]], normal: [0,1,0] },  // Top
                        { dir: [0, -1, 0], check: [x, y - 1, z], verts: [[0,0,1], [1,0,1], [1,0,0], [0,0,0]], normal: [0,-1,0] }, // Bottom
                        { dir: [0, 0, 1], check: [x, y, z + 1], verts: [[0,0,1], [0,1,1], [1,1,1], [1,0,1]], normal: [0,0,1] },  // Front
                        { dir: [0, 0, -1], check: [x, y, z - 1], verts: [[1,0,0], [1,1,0], [0,1,0], [0,0,0]], normal: [0,0,-1] }, // Back
                        { dir: [1, 0, 0], check: [x + 1, y, z], verts: [[1,0,1], [1,1,1], [1,1,0], [1,0,0]], normal: [1,0,0] },  // Right
                        { dir: [-1, 0, 0], check: [x - 1, y, z], verts: [[0,0,0], [0,1,0], [0,1,1], [0,0,1]], normal: [-1,0,0] }, // Left
                    ];

                    for (const face of faces) {
                        // Face culling: skip if adjacent block is solid
                        if (isWaterBlock) {
                            if (this.isWater(...face.check) || this.isSolid(...face.check)) continue;
                        } else {
                            if (this.isSolid(...face.check)) continue;
                        }

                        const color = BLOCK_COLORS[blockType];
                        const baseIdx = isWaterBlock ? waterVertexCount : vertexCount;
                        const targetPositions = isWaterBlock ? waterPositions : positions;
                        const targetIndices = isWaterBlock ? waterIndices : indices;
                        const targetNormals = isWaterBlock ? waterNormals : normals;
                        const targetUvs = isWaterBlock ? waterUvs : uvs;

                        // Add 4 vertices for this face
                        for (const vert of face.verts) {
                            targetPositions.push(
                                (x + vert[0]) * CONFIG.BLOCK_SIZE,
                                (y + vert[1]) * CONFIG.BLOCK_SIZE,
                                (z + vert[2]) * CONFIG.BLOCK_SIZE
                            );
                            targetNormals.push(...face.normal);
                            targetUvs.push(vert[0] * 4, vert[1] * 4); // Tile texture

                            if (!isWaterBlock) {
                                colors.push(color.r, color.g, color.b, 1);
                            }
                        }

                        // Add 2 triangles (6 indices) for this face
                        targetIndices.push(
                            baseIdx, baseIdx + 1, baseIdx + 2,
                            baseIdx, baseIdx + 2, baseIdx + 3
                        );

                        if (isWaterBlock) {
                            waterVertexCount += 4;
                        } else {
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        // Create solid blocks mesh
        if (positions.length > 0) {
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            vertexData.colors = colors;

            this.mesh = new BABYLON.Mesh(`chunk_${this.chunkX}_${this.chunkZ}`, this.scene);
            vertexData.applyToMesh(this.mesh);
            this.mesh.material = this.materials.terrain;

            // Enable collision
            this.mesh.checkCollisions = true;
        }

        // Create water mesh
        if (waterPositions.length > 0) {
            const waterVertexData = new BABYLON.VertexData();
            waterVertexData.positions = waterPositions;
            waterVertexData.indices = waterIndices;
            waterVertexData.normals = waterNormals;
            waterVertexData.uvs = waterUvs;

            this.waterMesh = new BABYLON.Mesh(`water_${this.chunkX}_${this.chunkZ}`, this.scene);
            waterVertexData.applyToMesh(this.waterMesh);
            this.waterMesh.material = this.materials.water;
        }
    }

    // Get total triangle count
    getTriangleCount() {
        let count = 0;
        if (this.mesh) count += this.mesh.getTotalIndices() / 3;
        if (this.waterMesh) count += this.waterMesh.getTotalIndices() / 3;
        return count;
    }

    dispose() {
        if (this.mesh) this.mesh.dispose();
        if (this.waterMesh) this.waterMesh.dispose();
    }
}

// ============================================================================
// BRIDGE BUILDER
// ============================================================================

class BridgeBuilder {
    constructor(scene, noise) {
        this.scene = scene;
        this.noise = noise;
        this.createBridge();
    }

    createBridge() {
        // Bridge position (crossing the river)
        const bridgeX = 32;
        const bridgeZ = 32;
        const bridgeY = CONFIG.WATER_LEVEL + 1;

        // Bridge deck material
        const woodMat = new BABYLON.PBRMaterial("bridgeWood", this.scene);
        woodMat.albedoColor = new BABYLON.Color3(0.4, 0.25, 0.1);
        woodMat.metallic = 0;
        woodMat.roughness = 0.8;

        // Create bridge deck
        const deck = BABYLON.MeshBuilder.CreateBox("bridgeDeck", {
            width: 3,
            height: 0.5,
            depth: 12
        }, this.scene);
        deck.position = new BABYLON.Vector3(bridgeX, bridgeY, bridgeZ);
        deck.material = woodMat;
        deck.checkCollisions = true;

        // Bridge supports (pillars)
        for (let i = -1; i <= 1; i++) {
            const pillar = BABYLON.MeshBuilder.CreateCylinder("pillar", {
                diameter: 0.4,
                height: 4
            }, this.scene);
            pillar.position = new BABYLON.Vector3(bridgeX + i * 1.2, bridgeY - 2, bridgeZ - 4);
            pillar.material = woodMat;

            const pillar2 = BABYLON.MeshBuilder.CreateCylinder("pillar2", {
                diameter: 0.4,
                height: 4
            }, this.scene);
            pillar2.position = new BABYLON.Vector3(bridgeX + i * 1.2, bridgeY - 2, bridgeZ + 4);
            pillar2.material = woodMat;
        }

        // Bridge railings
        for (let side of [-1.5, 1.5]) {
            const railing = BABYLON.MeshBuilder.CreateBox("railing", {
                width: 0.2,
                height: 1,
                depth: 12
            }, this.scene);
            railing.position = new BABYLON.Vector3(bridgeX + side, bridgeY + 0.75, bridgeZ);
            railing.material = woodMat;
        }
    }
}

// ============================================================================
// HOUSE BUILDER
// ============================================================================

class HouseBuilder {
    constructor(scene) {
        this.scene = scene;
        this.createHouse();
    }

    createHouse() {
        // House position (on grass, away from river)
        const houseX = 20;
        const houseZ = 15;
        const houseY = 10;

        // Materials
        const wallMat = new BABYLON.PBRMaterial("wallMat", this.scene);
        wallMat.albedoColor = new BABYLON.Color3(0.9, 0.85, 0.7);
        wallMat.metallic = 0;
        wallMat.roughness = 0.7;

        const roofMat = new BABYLON.PBRMaterial("roofMat", this.scene);
        roofMat.albedoColor = new BABYLON.Color3(0.6, 0.2, 0.1);
        roofMat.metallic = 0;
        roofMat.roughness = 0.9;

        const doorMat = new BABYLON.PBRMaterial("doorMat", this.scene);
        doorMat.albedoColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        doorMat.metallic = 0;
        doorMat.roughness = 0.8;

        // House walls
        const walls = BABYLON.MeshBuilder.CreateBox("walls", {
            width: 6,
            height: 4,
            depth: 6
        }, this.scene);
        walls.position = new BABYLON.Vector3(houseX, houseY + 2, houseZ);
        walls.material = wallMat;
        walls.checkCollisions = true;

        // Roof (pyramid)
        const roof = BABYLON.MeshBuilder.CreateCylinder("roof", {
            diameterTop: 0,
            diameterBottom: 8.5,
            height: 3,
            tessellation: 4
        }, this.scene);
        roof.position = new BABYLON.Vector3(houseX, houseY + 5.5, houseZ);
        roof.rotation.y = Math.PI / 4;
        roof.material = roofMat;

        // Door
        const door = BABYLON.MeshBuilder.CreateBox("door", {
            width: 1.5,
            height: 2.5,
            depth: 0.2
        }, this.scene);
        door.position = new BABYLON.Vector3(houseX, houseY + 1.25, houseZ - 3);
        door.material = doorMat;

        // Windows
        const windowMat = new BABYLON.PBRMaterial("windowMat", this.scene);
        windowMat.albedoColor = new BABYLON.Color3(0.3, 0.5, 0.7);
        windowMat.metallic = 0.5;
        windowMat.roughness = 0.1;

        const window1 = BABYLON.MeshBuilder.CreateBox("window1", {
            width: 1.2,
            height: 1.2,
            depth: 0.1
        }, this.scene);
        window1.position = new BABYLON.Vector3(houseX - 2, houseY + 2.5, houseZ - 3);
        window1.material = windowMat;

        const window2 = BABYLON.MeshBuilder.CreateBox("window2", {
            width: 1.2,
            height: 1.2,
            depth: 0.1
        }, this.scene);
        window2.position = new BABYLON.Vector3(houseX + 2, houseY + 2.5, houseZ - 3);
        window2.material = windowMat;

        // Chimney
        const chimney = BABYLON.MeshBuilder.CreateBox("chimney", {
            width: 0.8,
            height: 2,
            depth: 0.8
        }, this.scene);
        chimney.position = new BABYLON.Vector3(houseX + 2, houseY + 5, houseZ + 2);
        chimney.material = wallMat;
    }
}

// ============================================================================
// WORLD MANAGER
// ============================================================================

class World {
    constructor(scene, materials, noise) {
        this.scene = scene;
        this.materials = materials;
        this.noise = noise;
        this.chunks = new Map();
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    generateChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (this.chunks.has(key)) return;

        const chunk = new Chunk(chunkX, chunkZ, this.scene, this.materials, this.noise);
        this.chunks.set(key, chunk);
    }

    generateWorld() {
        const radius = CONFIG.RENDER_DISTANCE;
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                this.generateChunk(x, z);
            }
        }
    }

    getTotalTriangles() {
        let total = 0;
        this.chunks.forEach(chunk => {
            total += chunk.getTriangleCount();
        });
        return total;
    }

    getChunkCount() {
        return this.chunks.size;
    }
}

// ============================================================================
// TREE GENERATOR (Using Instancing)
// ============================================================================

class TreeGenerator {
    constructor(scene, world, noise) {
        this.scene = scene;
        this.world = world;
        this.noise = noise;
        this.treeInstances = [];

        this.createTreeTemplates();
        this.generateTrees();
    }

    createTreeTemplates() {
        // Tree trunk template with PBR
        this.trunkTemplate = BABYLON.MeshBuilder.CreateCylinder("trunk", {
            height: 4,
            diameter: 0.5,
        }, this.scene);
        this.trunkTemplate.position.y = 2;

        const trunkMat = new BABYLON.PBRMaterial("trunkMat", this.scene);
        trunkMat.albedoColor = new BABYLON.Color3(0.4, 0.25, 0.1);
        trunkMat.metallic = 0;
        trunkMat.roughness = 0.9;
        this.trunkTemplate.material = trunkMat;
        this.trunkTemplate.isVisible = false;

        // Leaves template with PBR
        this.leavesTemplate = BABYLON.MeshBuilder.CreateBox("leaves", {
            size: 3,
        }, this.scene);
        this.leavesTemplate.position.y = 5;

        const leavesMat = new BABYLON.PBRMaterial("leavesMat", this.scene);
        leavesMat.albedoColor = new BABYLON.Color3(0.2, 0.7, 0.2);
        leavesMat.metallic = 0;
        leavesMat.roughness = 0.8;
        this.leavesTemplate.material = leavesMat;
        this.leavesTemplate.isVisible = false;

        // Enable shadows
        this.trunkTemplate.receiveShadows = true;
        this.leavesTemplate.receiveShadows = true;
    }

    generateTrees() {
        const radius = CONFIG.RENDER_DISTANCE;
        const trunkMatrices = [];
        const leavesMatrices = [];

        for (let cx = -radius; cx <= radius; cx++) {
            for (let cz = -radius; cz <= radius; cz++) {
                for (let i = 0; i < 5; i++) { // 5 trees per chunk
                    const x = cx * CONFIG.CHUNK_SIZE + Math.floor(Math.random() * CONFIG.CHUNK_SIZE);
                    const z = cz * CONFIG.CHUNK_SIZE + Math.floor(Math.random() * CONFIG.CHUNK_SIZE);

                    // Don't spawn trees in river or near river
                    const riverCenterZ = 32;
                    const riverNoise = this.noise.octaveNoise2D(x * 0.05, 0, 3, 0.5);
                    const riverOffset = riverNoise * 8;
                    const distToRiver = Math.abs(z - (riverCenterZ + riverOffset));

                    if (distToRiver < 8) continue; // Skip if too close to river

                    // Use noise to determine if tree should spawn
                    if (this.noise.noise2D(x * 0.1, z * 0.1) > 0.3) {
                        const height = this.noise.octaveNoise2D(x * 0.02, z * 0.02, 4, 0.5);
                        const y = Math.floor(8 + height * 4);

                        if (y > CONFIG.WATER_LEVEL) {
                            const matrix = BABYLON.Matrix.Translation(x, y, z);
                            trunkMatrices.push(matrix);
                            leavesMatrices.push(matrix);
                        }
                    }
                }
            }
        }

        // Create thin instances
        if (trunkMatrices.length > 0) {
            this.trunkTemplate.thinInstanceSetBuffer("matrix", trunkMatrices, 16, false);
            this.trunkTemplate.isVisible = true;

            this.leavesTemplate.thinInstanceSetBuffer("matrix", leavesMatrices, 16, false);
            this.leavesTemplate.isVisible = true;
        }
    }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class VoxelDemo {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });

        this.scene = this.createScene();
        this.setupUI();

        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.updateUI();
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // Pointer lock for first-person controls
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
    }

    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = new BABYLON.Color3(0.5, 0.7, 1.0);
        scene.collisionsEnabled = true;
        scene.gravity = new BABYLON.Vector3(0, -0.5, 0);

        // Create noise generator
        this.noise = new SimplexNoise(42);

        // Camera setup with collision
        this.camera = new BABYLON.UniversalCamera("camera",
            new BABYLON.Vector3(10, 15, 5), scene);
        this.camera.attachControl(this.canvas, true);
        this.camera.speed = 0.5;
        this.camera.angularSensibility = 1000;

        // Enable collision and gravity
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

        // Movement keys
        this.camera.keysUp.push(87); // W
        this.camera.keysDown.push(83); // S
        this.camera.keysLeft.push(65); // A
        this.camera.keysRight.push(68); // D

        // Setup jump on space
        scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.code === 'Space') {
                this.camera.position.y += 0.5;
            }
        });

        // Lighting - Enhanced for PBR
        const hemiLight = new BABYLON.HemisphericLight("hemiLight",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemiLight.intensity = 0.5;
        hemiLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.5);

        const sunLight = new BABYLON.DirectionalLight("sunLight",
            new BABYLON.Vector3(-1, -2, -1), scene);
        sunLight.position = new BABYLON.Vector3(50, 80, 50);
        sunLight.intensity = 1.2;
        sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);

        // Shadow generator
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurScale = 2;

        // Create materials
        this.createMaterials(scene);

        // Generate world
        this.world = new World(scene, this.materials, this.noise);
        this.world.generateWorld();

        // Create bridge
        this.bridge = new BridgeBuilder(scene, this.noise);

        // Create house
        this.house = new HouseBuilder(scene);

        // Generate trees (with instancing)
        this.treeGenerator = new TreeGenerator(scene, this.world, this.noise);

        // Add trees to shadow casters
        this.shadowGenerator.addShadowCaster(this.treeGenerator.trunkTemplate);
        this.shadowGenerator.addShadowCaster(this.treeGenerator.leavesTemplate);

        // Enable fog for atmosphere
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.008;
        scene.fogColor = new BABYLON.Color3(0.5, 0.7, 1.0);

        return scene;
    }

    createMaterials(scene) {
        this.materials = {};

        // Create high-quality PBR terrain material
        this.materials.terrain = new BABYLON.PBRMaterial("terrainPBR", scene);

        // Create procedural textures
        const grassTexture = TextureGenerator.createGrassTexture(scene, this.noise);
        const normalMap = TextureGenerator.createNormalMap(scene, this.noise);

        grassTexture.uScale = 4;
        grassTexture.vScale = 4;

        this.materials.terrain.albedoTexture = grassTexture;
        this.materials.terrain.bumpTexture = normalMap;
        this.materials.terrain.metallic = 0;
        this.materials.terrain.roughness = 0.95;
        this.materials.terrain.useVertexColors = true;

        // Create realistic water material using WaterMaterial
        this.materials.water = new WaterMaterial("water", scene, new BABYLON.Vector2(512, 512));
        this.materials.water.backFaceCulling = true;
        this.materials.water.bumpTexture = normalMap;
        this.materials.water.windForce = -5;
        this.materials.water.waveHeight = 0.3;
        this.materials.water.bumpHeight = 0.1;
        this.materials.water.windDirection = new BABYLON.Vector2(1, 1);
        this.materials.water.waterColor = new BABYLON.Color3(0.1, 0.4, 0.6);
        this.materials.water.colorBlendFactor = 0.3;
        this.materials.water.waveLength = 0.3;

        // Add reflections to water
        this.materials.water.addToRenderList(scene.meshes[0]);
    }

    setupUI() {
        this.fpsElement = document.getElementById('fps');
        this.chunksElement = document.getElementById('chunks');
        this.trianglesElement = document.getElementById('triangles');
    }

    updateUI() {
        this.fpsElement.textContent = Math.round(this.engine.getFps());
        this.chunksElement.textContent = this.world.getChunkCount();
        this.trianglesElement.textContent = Math.round(this.world.getTotalTriangles()).toLocaleString();
    }
}

// ============================================================================
// START APPLICATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    new VoxelDemo();
});

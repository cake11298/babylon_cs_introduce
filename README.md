# Babylon.js 調酒模擬器 - Bar Simulator

## 專案簡介

這是一個使用 **Babylon.js** 打造的 **AAA 級 3D 調酒模擬器**，重構自原本的 Three.js 專案。玩家可以在虛擬酒吧中體驗真實的調酒過程、與 NPC 互動，享受高品質的視覺效果和物理模擬。

本專案是從 [NCU Bar Simulator](https://github.com/cake11298/ncu-bar-simulator) 重構而來，使用 Babylon.js 引擎並升級到 AAA 級遊戲品質。

## 主要特色

### 🍸 真實的調酒體驗
- **30+ 種酒類**：六大基酒 + 果汁 + 利口酒 + 調味料
- **15+ 種經典 IBA 調酒配方**：Martini、Mojito、Margarita 等
- **專業調酒工具**：Shaker（搖酒器）、Jigger（量酒器）、Mixing Glass（調酒杯）
- **視覺化液體系統**：即時顯示液體顏色、容量與成分
- **精確倒酒機制**：使用射線檢測和距離判定
- **倒酒進度條**：即時顯示容器容量與倒入量

### 🎮 完整的互動系統
- **物品拾取與放置**：使用 Babylon.js HighlightLayer 高亮可互動物品
- **物理模擬**：使用 Havok 物理引擎（或 Cannon.js 作為後備）
- **智能射線檢測**：準星對準物品時顯示黃色高亮
- **第一人稱控制**：WASD 移動、滑鼠視角控制、指針鎖定

### 🎨 AAA 級視覺效果
- **PBR 材質系統**：物理渲染材質，逼真的光影效果
- **後處理管線**：
  - Bloom（輝光）
  - SSAO2（環境光遮蔽）
  - ACES 色調映射
  - 色差效果
  - 膠片顆粒
  - 暈影效果
  - 色彩曲線
- **級聯陰影映射**：高品質動態陰影
- **多光源系統**：主光源、環境光、補光、聚光燈、點光源
- **霧效果**：營造氛圍

### 👥 NPC 系統
- **2 位 NPC 角色**：Gustave 和 Seaton
- **對話系統**：多段對話內容
- **閒置動畫**：上下浮動、左右搖擺
- **名字標籤**：Billboard 模式，始終面向玩家

## 技術架構

### 核心技術
- **Babylon.js 8.39.2**：先進的 WebGL 遊戲引擎
- **TypeScript**：類型安全的開發體驗
- **Vite**：快速的開發構建工具
- **Havok Physics**：高性能物理引擎

### 模組系統
```
src/
├── main.ts                      # 主程式入口
├── types/
│   └── types.ts                 # TypeScript 類型定義
├── modules/
│   ├── PhysicsSystem.ts         # 物理系統
│   ├── InteractionSystem.ts     # 互動系統
│   ├── CocktailSystem.ts        # 調酒系統
│   ├── PlayerController.ts      # 玩家控制
│   ├── LightingSystem.ts        # 光照系統
│   ├── BarEnvironment.ts        # 酒吧環境
│   └── NPCManager.ts            # NPC 管理
└── styles/
    └── main.css                 # 樣式表
```

### 系統設計

1. **PhysicsSystem（物理系統）**
   - 使用 Havok 物理引擎
   - 支援盒狀、圓柱、球狀剛體
   - 靜態碰撞體（地板、牆壁、吧檯）
   - 動態物體（酒瓶、杯子、工具）

2. **InteractionSystem（互動系統）**
   - 射線檢測（Raycaster）
   - 物品註冊與追蹤
   - 拾取/放置/放回原位
   - HighlightLayer 高亮效果

3. **CocktailSystem（調酒系統）**
   - 30+ 種酒類數據庫
   - 容器內容追蹤
   - 液體視覺化（動態圓柱體）
   - 倒酒動畫與粒子效果
   - 調酒辨識系統（15+ 種調酒）
   - 酒精濃度計算

4. **PlayerController（玩家控制）**
   - 第一人稱相機
   - WASD 移動
   - 滑鼠視角控制
   - 指針鎖定
   - 衝刺功能

5. **LightingSystem（光照系統）**
   - 多光源設置
   - 級聯陰影映射
   - DefaultRenderingPipeline
   - 後處理效果

## 操作指南

### 基本操作
- **WASD**：移動
- **Shift + WASD**：衝刺
- **滑鼠**：視角控制
- **E**：拾取物品
- **Q**：放下物品
- **R**：將物品放回原位
- **M**：開啟/關閉調酒配方面板
- **滑鼠左鍵（按住）**：倒酒 / 搖酒

### 調酒步驟
1. **拾取酒瓶**：走近酒瓶，準心對準後按 **E** 鍵
2. **拾取杯子**：用相同方式拾取杯子
3. **倒酒**：
   - 手持酒瓶
   - 準心對準杯子（會顯示黃色高亮）
   - 按住**滑鼠左鍵**開始倒酒
   - 觀察倒酒進度條
4. **搖酒**：
   - 先將材料倒入 Shaker
   - 手持 Shaker
   - 按住**滑鼠左鍵**搖酒
5. **查看配方**：按 **M** 鍵開啟食譜面板

## 安裝與執行

### 環境需求
- Node.js 16+
- npm 或 yarn

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd babylon_cs_introduce
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

4. **開啟瀏覽器**
   ```
   http://localhost:5173
   ```

### 建置生產版本
```bash
npm run build
```

建置完成後，檔案會輸出到 `dist/` 目錄。

## 調酒配方範例

### Martini（馬丁尼）
- 60ml 琴酒 (Gin)
- 10ml 不甜香艾酒 (Dry Vermouth)
- 作法：攪拌法，濾入冰鎮馬丁尼杯
- 裝飾：檸檬皮或橄欖

### Mojito（莫希托）
- 45ml 蘭姆酒 (Rum)
- 20ml 萊姆汁 (Lime Juice)
- 20ml 糖漿 (Simple Syrup)
- 適量蘇打水 (Soda Water)
- 作法：壓碎薄荷葉與糖，加冰和材料

### Margarita（瑪格麗特）
- 50ml 龍舌蘭 (Tequila)
- 20ml 橙皮酒 (Triple Sec)
- 15ml 萊姆汁 (Lime Juice)
- 作法：搖盪法，濾入抹鹽杯緣的杯中

*更多配方請在遊戲中按 **M** 鍵查看*

## 從 Three.js 到 Babylon.js 的重構亮點

### 技術升級
- ✅ **物理引擎**：cannon-es → Havok Physics（高性能）
- ✅ **材質系統**：MeshStandardMaterial → PBRMaterial（更逼真）
- ✅ **後處理**：手動實現 → DefaultRenderingPipeline（更強大）
- ✅ **陰影**：基礎陰影 → 級聯陰影映射（更真實）
- ✅ **類型安全**：JavaScript → TypeScript（更安全）

### 視覺升級
- 🎨 PBR 材質系統
- 🎨 ACES 色調映射
- 🎨 SSAO2 環境光遮蔽
- 🎨 Bloom 輝光效果
- 🎨 色差、顆粒、暈影
- 🎨 多光源系統

### 架構優化
- 📦 模組化設計（TypeScript）
- 📦 類型定義分離
- 📦 更好的代碼組織
- 📦 更易於維護和擴展

## 未來計劃

### 待實現功能
- [ ] FBX 模型載入（替換簡單幾何體）
- [ ] 冰塊系統
- [ ] 更多調酒工具（吧匙、濾冰器等）
- [ ] NPC AI 對話樹
- [ ] 音效系統（倒酒聲、搖酒聲等）
- [ ] 存檔功能
- [ ] 成就系統

### 效能優化
- [ ] 物件池管理
- [ ] LOD 系統
- [ ] 粒子系統優化
- [ ] Occlusion Culling

## 專案結構

```
babylon_cs_introduce/
├── src/
│   ├── main.ts                    # 主程式
│   ├── types/
│   │   └── types.ts               # 類型定義
│   ├── modules/
│   │   ├── PhysicsSystem.ts       # 物理系統
│   │   ├── InteractionSystem.ts   # 互動系統
│   │   ├── CocktailSystem.ts      # 調酒系統
│   │   ├── PlayerController.ts    # 玩家控制
│   │   ├── LightingSystem.ts      # 光照系統
│   │   ├── BarEnvironment.ts      # 酒吧環境
│   │   └── NPCManager.ts          # NPC 管理
│   └── styles/
│       └── main.css               # 樣式表
├── index.html                     # HTML 入口
├── package.json                   # 專案配置
├── tsconfig.json                  # TypeScript 配置
└── vite.config.js                 # Vite 配置
```

## 授權資訊

本專案採用 MIT 授權條款。

## 致謝

- **Babylon.js 團隊**：提供強大的 WebGL 引擎
- **Three.js NCU Bar Simulator**：原始專案靈感來源
- **IBA（國際調酒師協會）**：經典調酒配方
- **所有貢獻者**

---

**Enjoy your virtual bartending experience with AAA-quality graphics! 🍹**

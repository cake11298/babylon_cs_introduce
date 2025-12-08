# 🎨 FBX模型设置指南

## 📦 需要的文件

请将以下6个文件放入 `public/materials/` 文件夹中：

### FBX模型文件
1. `Bottle_of_Maker_s_Mar_1208132858_texture.fbx`
2. `Gin_Bottle_Image_1208132907_texture.fbx`
3. `Stainless_Steel_Cockt_1208132913_texture.fbx`

### PNG贴图文件
4. `Bottle_of_Maker_s_Mar_1208132858_texture.png`
5. `Gin_Bottle_Image_1208132907_texture.png`
6. `Stainless_Steel_Cockt_1208132913_texture.png`

## 📁 文件结构

```
babylon_cs_introduce/
├── public/
│   └── materials/
│       ├── Bottle_of_Maker_s_Mar_1208132858_texture.fbx
│       ├── Bottle_of_Maker_s_Mar_1208132858_texture.png
│       ├── Gin_Bottle_Image_1208132907_texture.fbx
│       ├── Gin_Bottle_Image_1208132907_texture.png
│       ├── Stainless_Steel_Cockt_1208132913_texture.fbx
│       └── Stainless_Steel_Cockt_1208132913_texture.png
├── src/
└── ...
```

## 🚀 操作步骤

### 方法1：使用PowerShell（推荐）

在项目根目录打开PowerShell，执行：

```powershell
# 从你的materials文件夹复制到public/materials
Copy-Item "C:\Users\cake1\OneDrive\桌面\GameFIxed\babylon_cs_introduce\materials\*" -Destination ".\public\materials\" -Force
```

### 方法2：手动复制

1. 打开文件资源管理器
2. 导航到：`C:\Users\cake1\OneDrive\桌面\GameFIxed\babylon_cs_introduce\materials\`
3. 选择所有6个文件（Ctrl+A）
4. 复制（Ctrl+C）
5. 导航到项目的 `public\materials\` 文件夹
6. 粘贴（Ctrl+V）

## ✅ 验证文件

复制完成后，运行以下命令验证文件是否正确放置：

```powershell
Get-ChildItem ".\public\materials\" -Name
```

应该看到所有6个文件列出。

## 🎮 启动游戏

文件放置完成后，运行：

```bash
npm run dev
```

游戏会自动加载高质量的FBX模型！

## 🔧 故障排除

### 如果模型没有加载：

1. **检查文件路径**：确保文件在 `public/materials/` 中
2. **检查文件名**：文件名必须完全匹配（包括大小写）
3. **查看浏览器控制台**：按F12查看是否有加载错误
4. **重启开发服务器**：Ctrl+C停止，然后重新运行 `npm run dev`

### 如果游戏加载缓慢：

- FBX模型较大（约2-3MB每个），首次加载需要时间
- 检查网络请求（F12 -> Network标签）
- 等待模型加载完成

## 🎨 已集成的高级功能

✅ FBX模型加载支持
✅ 高质量PBR材质
✅ 自动贴图应用
✅ 物理碰撞体
✅ 阴影投射
✅ 备用模型（如果FBX加载失败）

## 📝 注意事项

- 模型会自动缩放到适合场景的大小（0.01倍）
- 如果FBX加载失败，游戏会自动使用简单的几何体作为备用
- 所有模型都支持物理交互和拾取

---

**祝你游戏愉快！** 🍹🎮

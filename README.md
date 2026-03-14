# Pixel Firefight

一个可直接在浏览器运行的 2D 枪战小游戏，支持：

- WASD 移动
- 鼠标瞄准 + 左键连发
- 空格冲刺
- 敌人追击、开火、血量与得分系统
- 死亡结算 + 一键重开

## 本地运行

直接双击 `index.html` 即可打开。  
若浏览器限制本地模块加载，可用任意静态服务器：

```bash
cd /Users/a1-6/Desktop/Codex
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署分享（推荐：Vercel）

1. 把项目推到 GitHub 仓库。
2. 打开 [Vercel](https://vercel.com/) 并导入该仓库。
3. Framework 选 `Other`（或保持自动识别）。
4. Build Command 留空，Output Directory 留空。
5. 点击 Deploy，部署完成后会得到公开链接，可直接分享。

## 备选部署（GitHub Pages）

1. 上传这 4 个文件到 GitHub 仓库根目录。
2. 在仓库中进入 `Settings` -> `Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main` + `/ (root)`，保存。
5. 几分钟后获得公开页面链接。


// 手动构建便携版 Claude Code Manager
// 将 Electron 运行时 + 应用文件打包到一个目录中
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist', 'Claude-Code-Manager-portable');
const ELECTRON_DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');

console.log('=== 构建便携版 Claude Code Manager ===\n');

// 1. 清理 dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
fs.mkdirSync(DIST, { recursive: true });

// 2. 复制 Electron 运行时
console.log('[1/5] 复制 Electron 运行时...');
const electronExe = path.join(ELECTRON_DIST, 'electron.exe');
const targetExe = path.join(DIST, 'Claude-Code-Manager.exe');
fs.copyFileSync(electronExe, targetExe);

// 复制 Electron 所需的 DLL 和资源
const electronFiles = fs.readdirSync(ELECTRON_DIST);
for (const file of electronFiles) {
  const src = path.join(ELECTRON_DIST, file);
  const dst = path.join(DIST, file);
  if (file === 'electron.exe') continue; // 已经复制并重命名
  const stat = fs.statSync(src);
  if (stat.isFile()) {
    fs.copyFileSync(src, dst);
  } else if (stat.isDirectory() && file !== 'locales' && file !== 'resources') {
    // 跳过 locales (很大，可选) 和 resources (后面自己创建)
    // 复制其他目录如 swiftshader
    copyDirRecursive(src, dst);
  }
}

// 复制 locales 目录 (electron 需要部分)
const localesSrc = path.join(ELECTRON_DIST, 'locales');
const localesDst = path.join(DIST, 'locales');
if (fs.existsSync(localesSrc)) {
  fs.mkdirSync(localesDst, { recursive: true });
  for (const f of fs.readdirSync(localesSrc)) {
    if (f.startsWith('en-US') || f.startsWith('zh-CN') || f.startsWith('zh-TW')) {
      fs.copyFileSync(path.join(localesSrc, f), path.join(localesDst, f));
    }
  }
}

// 3. 创建 resources/app 目录结构
console.log('[2/5] 创建应用资源...');
const resourcesDir = path.join(DIST, 'resources');
const appDir = path.join(resourcesDir, 'app');
fs.mkdirSync(appDir, { recursive: true });

// 4. 复制应用文件
console.log('[3/5] 复制应用文件...');
const appFiles = [
  'package.json',
  'main.js',
  'preload.js',
  'test-runner.js',
];

for (const f of appFiles) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(appDir, f));
}

// 复制 renderer 目录
const rendererDir = path.join(appDir, 'renderer');
fs.mkdirSync(rendererDir, { recursive: true });
const rendererSrc = path.join(ROOT, 'renderer');
for (const f of fs.readdirSync(rendererSrc)) {
  fs.copyFileSync(path.join(rendererSrc, f), path.join(rendererDir, f));
}

// 5. 创建启动脚本
console.log('[4/5] 创建启动脚本...');
const batContent = `@echo off
cd /d "%~dp0"
start "" "Claude-Code-Manager.exe" .
`;
fs.writeFileSync(path.join(DIST, '启动 Claude Code Manager.bat'), batContent);

// 创建 README
const readme = `Claude Code Manager 便携版 v1.0.0
=====================================

使用方法：
  双击 "启动 Claude Code Manager.bat" 或直接运行 "Claude-Code-Manager.exe"

注意：
  - 首次启动可能需要几秒钟
  - 需要 Claude Code CLI 已安装并运行过至少一次
  - 数据来源于 ~/.claude/ 目录

功能：
  - 项目管理与别名
  - Token 用量监控
  - 会话浏览
  - 命令记录
  - 技能管理
  - 4 种主题 + 中英双语
`;
fs.writeFileSync(path.join(DIST, 'README.txt'), readme);

console.log('[5/5] 计算大小...');
let totalSize = 0;
function calcSize(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isFile()) totalSize += fs.statSync(p).size;
    else if (f.isDirectory()) calcSize(p);
  }
}
calcSize(DIST);

console.log('\n=== 构建完成 ===');
console.log('输出目录: ' + DIST);
console.log('总大小: ' + (totalSize / 1024 / 1024).toFixed(1) + ' MB');
console.log('\n请双击 启动 Claude Code Manager.bat 运行');

// === 辅助函数 ===
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isFile()) fs.copyFileSync(srcPath, destPath);
    else if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
  }
}
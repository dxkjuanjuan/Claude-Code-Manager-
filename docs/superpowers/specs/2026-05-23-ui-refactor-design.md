# Claude Code Manager UI 重构与数据修复设计

> 日期: 2026-05-23
> 方案: 增量修改（保持现有5文件结构）

---

## Context

当前应用存在以下问题：
1. **布局重复**：顶部Tab"项目文件"与左侧栏功能重叠
2. **数据缺失**：插件skill命令文件未读取，技能描述空白，Token数据固定不变
3. **交互缺陷**：缺少悬浮弹窗、项目条目按钮、15秒自动刷新
4. **命令不完整**：中文指令可能遗漏，无法查看命令执行结果

本次重构目标：职责分离、数据完整、交互顺畅。

---

## 1. 布局重构

### 1.1 Tab精简

删除顶部"项目文件"Tab。项目管理全部由左侧栏负责。

顶部Tab只保留5个：
| Tab | 标签 | 职责 |
|-----|------|------|
| commands | 命令历史 | 当前项目的命令使用记录，100%项目绑定 |
| skills | 技能管理 | 全部插件skill + 用户skill，扁平化展示 |
| token | Token模型 | 每个会话独立Token统计 + 实时模型信息 |
| memory | 记忆管理 | 当前项目双向记忆，支持查看/复制 |
| operations | 操作面板 | 快捷命令、危险操作、项目跳转 |

### 1.2 左侧栏升级

从简单列表升级为项目管理专区：

```
┌─ 项目管理 ────────┐
│ 共 5 个项目        │
│                    │
│ ▸ CLuade管理工具    │ ← 精简名称
│   [打开] [启动] [复制]│ ← 3个操作按钮
│                    │
│ ▸ DevEnvironment    │
│   [打开] [启动] [复制]│
│                    │
│ ▸ Desktop          │
│   [打开] [启动] [复制]│
│                    │
├────────────────────┤
│ [▶ 启动 Claude Code]│
└────────────────────┘
```

- 项目名称：默认精简显示（路径最后一段）
- 鼠标悬浮：弹出tooltip显示完整路径
- 每个项目条目下3个按钮：
  - **打开目录**：shell.openPath 打开资源管理器
  - **再次启动**：在终端中cd到项目目录并启动claude
  - **复制**：一键复制完整项目路径
- 顶部显示项目总数统计
- 底部保留全局"启动Claude Code"按钮

---

## 2. 技能完整抓取

### 2.1 主进程数据读取

`get-skills` IPC 重写：

1. 遍历 `~/.claude/plugins/cache/` 下所有插件目录
2. 对每个插件，读取 `.claude-plugin/plugin.json` 获取元数据
3. 进入 `commands/` 子目录，读取每个 `.md` 文件的frontmatter（name、description）
4. 返回扁平化数组，每个skill独立条目

数据结构：
```javascript
{
  name: 'brainstorming',           // 技能名称
  description: '将想法转化为设计', // 中文描述
  content: '...',                  // 完整Markdown内容（前500字）
  source: 'superpowers',           // 来源插件名
  sourceType: 'plugin',            // plugin | user
  locked: true,                    // 是否被插件锁定
  version: '5.1.0'                 // 插件版本
}
```

### 2.2 描述补齐与翻译

- 空白描述 → 自动补齐为 "[技能名] - 来自[插件名]插件"
- 英文描述 → 硬编码翻译映射表覆盖常用skill（约30条）
- 未覆盖的保留英文原文

### 2.3 锁定状态标注

`locked: true` 的skill在卡片上显示 `🔒 系统锁定` 标签，说明"此功能由插件强制启用，可正常使用但无法手动关闭"。

### 2.4 渲染层展示

- 两大区域：**插件技能** 和 **用户技能**
- 每个skill独立卡片，显示：名称、中文描述、来源插件、锁定状态、复制按钮
- 点击卡片 → 模态框查看完整内容

---

## 3. Token数据修复

### 3.1 主进程数据读取

`get-token-info` IPC 增强：

1. 读取 `tt-status.json` 获取实时模型名和上下文窗口占用
2. 遍历每个项目的每个JSONL会话文件
3. 解析每条消息的 `usage` 字段：

```javascript
// 每条消息的usage结构
{
  input_tokens: 45000,
  output_tokens: 2000,
  cache_read_input_tokens: 40000,
  cache_creation_input_tokens: 5000
}
```

4. 按会话汇总返回 `perSessionUsage` 数组

### 3.2 数据结构

```javascript
{
  liveModel: 'astron-code-latest',
  contextWindow: { current_usage: { input_tokens }, context_window_size },
  totalSessions: 47,
  totalMessages: 1234,
  models: { 'model-name': count },
  perSessionUsage: [
    {
      sessionId: 'abc-123',
      model: 'astron-code-latest',
      inputTokens: 45000,
      outputTokens: 2000,
      cacheTokens: 40000,
      totalTokens: 47000,
      messageCount: 23
    }
  ]
}
```

### 3.3 渲染层展示

- 顶部：模型信息卡片 + 实时占用进度条 + 历史统计卡片
- 下方：每个会话独立行，显示：会话ID、模型、Token消耗明细、消息数、复制按钮
- 取消会话命名功能

---

## 4. 命令历史修复

### 4.1 匹配策略

`get-commands` IPC 修改：
- 保留当前 `startsWith('/')` 匹配
- 新增：检查消息是否包含中文命令关键词（初始化、配置、帮助等）
- 每条命令记录增加 `fullMessage` 字段（完整消息内容，最多2000字）

### 4.2 项目绑定

- `state.commands` 严格绑定 `state.currentProject`
- 切换项目时自动重新加载命令
- 命令Tab显示当前项目标签

### 4.3 点击查看结果

- 点击命令行 → 调用 `getSessionMessages` 获取对应会话的完整消息
- 模态框显示该命令的完整输入和助手回复

---

## 5. 其他修改

### 5.1 自动刷新

从30秒改为15秒间隔。

### 5.2 交互约束

所有操作在当前窗口完成，禁止 `window.open`、`shell.openExternal` 弹出新窗口。`openInTerminal` 和 `openFolder` 除外（系统级操作）。

### 5.3 复制按钮

每个代码段/命令/路径/会话ID旁附带复制按钮，使用 `navigator.clipboard.writeText`。

### 5.4 确认弹窗 + Toast

危险操作（删除文件/项目）强制二次确认弹窗。所有操作反馈通过Toast通知。

---

## 修改文件清单

| 文件 | 修改范围 |
|------|---------|
| main.js | 重写 get-skills（深度遍历）、增强 get-token-info（perSessionUsage）、修改 get-commands（宽松匹配+fullMessage） |
| preload.js | 更新API签名匹配新IPC |
| renderer/index.html | 删除项目Tab、重构侧边栏DOM、更新Tab导航、保留5个Tab面板 |
| renderer/styles.css | 侧边栏新样式、悬浮tooltip、项目操作按钮、token明细行 |
| renderer/app.js | 重构渲染逻辑、15秒刷新、项目绑定、命令点击查看、复制按钮 |

---

## 验证方案

1. 启动应用 `npx electron .`
2. 检查左侧栏：项目总数统计、精简名称、悬浮显示完整路径、3个操作按钮
3. 检查5个Tab：命令历史显示项目标签、技能Tab显示全部skill卡片（含锁定标签）、TokenTab显示每会话Token明细、记忆Tab显示项目记忆、操作面板含危险操作
4. 切换项目：命令/会话/记忆自动切换
5. 15秒后观察数据是否自动刷新
6. 点击复制按钮验证剪贴板
7. 点击删除按钮验证确认弹窗和根目录拦截
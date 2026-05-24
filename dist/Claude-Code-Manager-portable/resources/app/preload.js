// preload.js - IPC桥接层
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claudeAPI', {
  getProjects: (scanMode) => ipcRenderer.invoke('get-projects', scanMode),
  getSessions: (name) => ipcRenderer.invoke('get-sessions', name),

  getCommands: (name) => ipcRenderer.invoke('get-commands', name),
  getAllCommands: () => ipcRenderer.invoke('get-all-commands'),

  getSkills: () => ipcRenderer.invoke('get-skills'),
  getSkillDetail: (p) => ipcRenderer.invoke('get-skill-detail', p),

  getTokenInfo: (name) => ipcRenderer.invoke('get-token-info', name),
  getSettings: () => ipcRenderer.invoke('get-settings'),

  getSessionMessages: (name, id) => ipcRenderer.invoke('get-session-messages', name, id),

  launchClaude: (cwd) => ipcRenderer.invoke('launch-claude', cwd),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  openInTerminal: (cwd) => ipcRenderer.invoke('open-in-terminal', cwd),
  launchClaudeDangerous: (cwd) => ipcRenderer.invoke('launch-claude-dangerous', cwd),
  openInTerminalDangerous: (cwd) => ipcRenderer.invoke('open-in-terminal-dangerous', cwd),

  deleteProjectFiles: (name) => ipcRenderer.invoke('delete-project-files', name),
  deleteProject: (name) => ipcRenderer.invoke('delete-project', name),

  getProjectMemory: (name) => ipcRenderer.invoke('get-project-memory', name),
  writeOpLog: (name, action, detail) => ipcRenderer.invoke('write-op-log', name, action, detail),

  // 新增：全盘扫描
  scanAllData: () => ipcRenderer.invoke('scan-all-data'),

  // 新增：项目别名
  getAliases: () => ipcRenderer.invoke('get-aliases'),
  setAlias: (name, alias) => ipcRenderer.invoke('set-alias', name, alias),

  // 新增：应用设置（主题、功能开关、扫描模式）
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  setScanMode: (mode) => ipcRenderer.invoke('set-scan-mode', mode)
});
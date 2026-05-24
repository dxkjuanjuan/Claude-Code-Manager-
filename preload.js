// preload.js - IPC桥接层
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claudeAPI', {
  getProjects: (scanMode) => ipcRenderer.invoke('get-projects', scanMode),
  getSessions: (name) => ipcRenderer.invoke('get-sessions', name),
  getConversation: (name, sessionId) => ipcRenderer.invoke('get-conversation', name, sessionId),

  getCommands: (name) => ipcRenderer.invoke('get-commands', name),

  getSkills: () => ipcRenderer.invoke('get-skills'),

  getTokenInfo: (name) => ipcRenderer.invoke('get-token-info', name),
  getSettings: () => ipcRenderer.invoke('get-settings'),

  launchClaude: (cwd) => ipcRenderer.invoke('launch-claude', cwd),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  openInTerminal: (cwd) => ipcRenderer.invoke('open-in-terminal', cwd),
  openInTerminalDangerous: (cwd) => ipcRenderer.invoke('open-in-terminal-dangerous', cwd),

  deleteProjectFiles: (name) => ipcRenderer.invoke('delete-project-files', name),
  deleteProject: (name) => ipcRenderer.invoke('delete-project', name),

  getProjectMemory: (name) => ipcRenderer.invoke('get-project-memory', name),
  writeOpLog: (name, action, detail) => ipcRenderer.invoke('write-op-log', name, action, detail),

  // 全盘扫描
  scanAllData: () => ipcRenderer.invoke('scan-all-data'),

  // 项目别名
  getAliases: () => ipcRenderer.invoke('get-aliases'),
  setAlias: (name, alias) => ipcRenderer.invoke('set-alias', name, alias),

  // 应用设置
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  setScanMode: (mode) => ipcRenderer.invoke('set-scan-mode', mode),

  // 文件管理
  listFiles: (dirPath) => ipcRenderer.invoke('list-files', dirPath),
  createFolder: (parentPath, folderName) => ipcRenderer.invoke('create-folder', parentPath, folderName),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // 项目分组
  getGroups: () => ipcRenderer.invoke('get-groups'),
  saveGroups: (groups) => ipcRenderer.invoke('save-groups', groups)
});
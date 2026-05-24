// app.js - Claude Code Manager 渲染逻辑 v5
// 6项优化：创建时间+距今标识、Token美观还原、删除迁移侧边栏、设置扩充、命令交互优化、字体放大

const state = {
  projects: [], currentProject: null, commands: [], skills: null,
  tokenInfo: null, memoryData: null, sessions: [],
  refreshInterval: null, aliases: {},
  appSettings: {
    theme: 'dark', language: 'zh', claudeVersion: 'latest',
    features: { commands: true, skills: true, token: true, memory: true, operations: true },
    scanMode: 'full'
  }
};

// ===== 国际化 =====
const i18n = {
  zh: {
    commands: '命令历史', skills: '技能管理', token: 'Token / 模型',
    memory: '记忆管理', operations: '操作面板',
    projectManage: '项目管理', search: '搜索项目...',
    launchClaude: '启动 Claude Code', launchDangerous: '全权限启动',
    scanAll: '全盘扫描', refresh: '刷新数据',
    commandCount: '命令总数', topCommand: '最常用', uniqueCount: '不同命令',
    createdAgo: '创建', lastActive: '活跃',
    deleteFiles: '删除会话文件', deleteProject: '删除整个项目',
    settings: '应用设置', theme: '主题风格', language: '界面语言',
    scanMode: '扫描模式', features: '功能开关',
    claudeVersion: 'Claude版本', fullScan: '全量加载', recentScan: '最近30天',
    currentScan: '仅当前项目', confirmDelete: '确认删除',
    dark: '暗色主题', light: '亮色主题', blue: '蓝色调', purple: '紫色调',
    cancel: '取消', confirm: '确认执行', rename: '重命名',
    open: '打开', launch: '启动', dangerous: '全权限', copy: '复制',
    cmdDetail: '命令详情', sessionLabel: '来源会话', time: '使用时间',
    fullInput: '完整输入', pluginSkills: '插件技能', userSkills: '用户技能',
    projRealtime: '当前项目实时Token', timeDimension: '时间维度消耗趋势',
    globalSummary: '全局Token汇总', toolTracking: '工具使用 & 技能追踪',
    currentModel: '当前模型', contextWindow: '上下文窗口',
    remaining: '剩余', updatedAt: '更新时间',
    totalTokens: '项目总Token', projSessions: '项目会话/消息',
    last5h: '近5小时', last1d: '近1天', last7d: '近7天',
    globalTotal: '全局总计', globalSessions: '总会话数', globalMessages: '总消息数',
    modelDist: '模型分布', cliTools: 'CLI工具排行', usedSkills: '已用技能',
    mcpServices: 'MCP服务', noRecords: '暂无工具使用记录',
    noMemory: '当前项目暂无记忆文件', quickCommands: '快捷命令',
    projectJump: '项目快速跳转', dangerZone: '危险操作区',
    deleteFilesDesc: '仅清理Claude会话记录', deleteProjectDesc: '不可恢复，根目录受保护',
    confirmDeleteFiles: '将删除当前项目的所有 Claude 会话记录文件，用户源代码不受影响。是否继续？',
    confirmDeleteProject: '将删除整个项目所有内容（不可恢复）！根目录受保护。是否继续？',
    startupTitle: 'Claude Code Manager', startupDesc: '选择数据加载范围',
    startupFull: '全部寻找', startupFullDesc: '合并所有 .claude 数据源，包括历史记录、会话索引、文件操作记录',
    startupRecent: '最近使用', startupRecentDesc: '仅加载最近30天内活跃的项目',
    startupCurrent: '仅当前项目', startupCurrentDesc: '只管理有本地会话文件的当前项目',
    deleteSessionOnly: '仅删除Claude生成的会话记录文件，保留所有用户源代码',
    deleteEntireProject: '删除当前项目所有内容（不可恢复），根目录受保护',
    dangerousLaunch: '将以 --dangerously-skip-permissions 模式启动 Claude Code，跳过所有权限确认。此模式存在安全风险，是否继续？',
    dangerousLaunchShort: '将以 --dangerously-skip-permissions 模式启动，跳过所有权限检查。是否继续？'
  },
  en: {
    commands: 'Commands', skills: 'Skills', token: 'Token / Model',
    memory: 'Memory', operations: 'Operations',
    projectManage: 'Projects', search: 'Search projects...',
    launchClaude: 'Launch Claude Code', launchDangerous: 'Full Permission',
    scanAll: 'Scan All', refresh: 'Refresh',
    commandCount: 'Total Commands', topCommand: 'Top Command', uniqueCount: 'Unique',
    createdAgo: 'Created', lastActive: 'Active',
    deleteFiles: 'Delete Session Files', deleteProject: 'Delete Entire Project',
    settings: 'Settings', theme: 'Theme', language: 'Language',
    scanMode: 'Scan Mode', features: 'Features',
    claudeVersion: 'Claude Version', fullScan: 'Full Load', recentScan: 'Last 30 Days',
    currentScan: 'Current Only', confirmDelete: 'Confirm Delete',
    dark: 'Dark', light: 'Light', blue: 'Blue', purple: 'Purple',
    cancel: 'Cancel', confirm: 'Confirm', rename: 'Rename',
    open: 'Open', launch: 'Launch', dangerous: 'Full Perm', copy: 'Copy',
    cmdDetail: 'Command Detail', sessionLabel: 'Session', time: 'Time',
    fullInput: 'Full Input', pluginSkills: 'Plugin Skills', userSkills: 'User Skills',
    projRealtime: 'Project Real-time Tokens', timeDimension: 'Time Dimension',
    globalSummary: 'Global Token Summary', toolTracking: 'Tool & Skill Tracking',
    currentModel: 'Current Model', contextWindow: 'Context Window',
    remaining: 'Remaining', updatedAt: 'Updated',
    totalTokens: 'Total Tokens', projSessions: 'Sessions/Messages',
    last5h: 'Last 5h', last1d: 'Last 1d', last7d: 'Last 7d',
    globalTotal: 'Global Total', globalSessions: 'Total Sessions', globalMessages: 'Total Messages',
    modelDist: 'Model Distribution', cliTools: 'CLI Tool Ranking', usedSkills: 'Used Skills',
    mcpServices: 'MCP Services', noRecords: 'No tool usage records',
    noMemory: 'No memory files for this project', quickCommands: 'Quick Commands',
    projectJump: 'Project Quick Jump', dangerZone: 'Danger Zone',
    deleteFilesDesc: 'Only clear Claude session records', deleteProjectDesc: 'Irreversible, root protected',
    confirmDeleteFiles: 'Delete all Claude session files for this project? Source code is preserved.',
    confirmDeleteProject: 'Delete entire project (irreversible)? Root directories are protected.',
    startupTitle: 'Claude Code Manager', startupDesc: 'Select data scope',
    startupFull: 'Find All', startupFullDesc: 'Merge all .claude data sources including history, session index, file records',
    startupRecent: 'Recent', startupRecentDesc: 'Only load projects active in the last 30 days',
    startupCurrent: 'Current Only', startupCurrentDesc: 'Only manage projects with local session files',
    deleteSessionOnly: 'Delete only Claude-generated session files, keep all source code',
    deleteEntireProject: 'Delete entire project (irreversible), root directories protected',
    dangerousLaunch: 'Launch with --dangerously-skip-permissions, skipping all permission checks. Continue?',
    dangerousLaunchShort: 'Launch with --dangerously-skip-permissions, skipping all permission checks. Continue?'
  }
};

function t(key) {
  const lang = state.appSettings.language || 'zh';
  return (i18n[lang] && i18n[lang][key]) || (i18n.zh[key]) || key;
}

// 更新所有静态DOM文字（语言切换时调用）
function updateI18nTexts() {
  // Tab 按钮
  document.querySelectorAll('.tab').forEach(btn => {
    const tab = btn.dataset.tab;
    const i18nMap = { commands: 'commands', skills: 'skills', token: 'token', memory: 'memory', operations: 'operations' };
    if (i18nMap[tab]) {
      // 清除旧文本节点，只保留SVG + 新文本
      const svg = btn.querySelector('svg');
      const oldText = btn.textContent.trim();
      btn.textContent = '';
      if (svg) btn.appendChild(svg);
      btn.appendChild(document.createTextNode(' ' + t(i18nMap[tab])));
    }
  });
  // 侧边栏标题
  const sidebarHeader = document.querySelector('.sidebar-header h3');
  if (sidebarHeader) sidebarHeader.innerHTML = `${t('projectManage')} <span class="sidebar-count" id="sidebar-proj-count">${state.projects.length}</span>`;
  const searchInput = document.getElementById('project-search');
  if (searchInput) searchInput.placeholder = t('search');
  // 底部启动按钮
  const launchBtnEl = document.getElementById('btn-launch-claude');
  if (launchBtnEl) {
    const svgL = launchBtnEl.querySelector('svg');
    launchBtnEl.textContent = '';
    if (svgL) launchBtnEl.appendChild(svgL);
    launchBtnEl.appendChild(document.createTextNode(' ' + t('launchClaude')));
  }
  const dangerBtnEl = document.getElementById('btn-launch-dangerous');
  if (dangerBtnEl) {
    const svgD = dangerBtnEl.querySelector('svg');
    dangerBtnEl.textContent = '';
    if (svgD) dangerBtnEl.appendChild(svgD);
    dangerBtnEl.appendChild(document.createTextNode(' ' + t('launchDangerous')));
  }
  // 面板标题
  const panelTitles = {
    'panel-commands': 'commands', 'panel-skills': 'skills',
    'panel-token': 'token', 'panel-memory': 'memory', 'panel-operations': 'operations'
  };
  for (const [panelId, key] of Object.entries(panelTitles)) {
    const h2 = document.querySelector(`#${panelId} .panel-header h2`);
    if (h2) h2.textContent = t(key);
  }
  // 操作面板区段标题
  const sectionTitles = document.querySelectorAll('#panel-operations .section-title');
  const sectionMap = ['settings', 'quickCommands', 'projectJump'];
  sectionTitles.forEach((h3, i) => { if (sectionMap[i]) h3.textContent = t(sectionMap[i]); });
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  try { state.appSettings = await window.claudeAPI.getAppSettings(); } catch {}
  try { state.aliases = await window.claudeAPI.getAliases(); } catch {}

  applyTheme(state.appSettings.theme || 'dark');
  applyFeatureToggles(state.appSettings.features || {});
  updateI18nTexts();
  renderSettingsPanel();

  bindEvents();
  await loadData();
  state.refreshInterval = setInterval(loadData, 30000);
  updateStatusTime();
  setInterval(updateStatusTime, 60000);
});

// ===== 主题切换 =====
function applyTheme(theme) {
  const themes = {
    dark: {
      'bg-primary': '#0d1117', 'bg-secondary': '#161b22', 'bg-tertiary': '#1c2128',
      'bg-hover': '#21262d', 'bg-active': '#262c36', 'border': '#30363d', 'border-light': '#3d444d',
      'text-primary': '#e6edf3', 'text-secondary': '#8b949e', 'text-muted': '#6e7681',
      'accent': '#7c6aef', 'accent-hover': '#8f7ff5', 'accent-bg': 'rgba(124,106,239,0.12)',
      'green': '#3fb950', 'green-bg': 'rgba(63,185,80,0.12)',
      'red': '#f85149', 'red-bg': 'rgba(248,81,73,0.12)',
      'yellow': '#d29922', 'yellow-bg': 'rgba(210,153,34,0.12)',
      'blue': '#58a6ff', 'blue-bg': 'rgba(88,166,255,0.12)',
      'orange': '#d18616', 'orange-bg': 'rgba(209,134,22,0.12)'
    },
    light: {
      'bg-primary': '#ffffff', 'bg-secondary': '#f6f8fa', 'bg-tertiary': '#eaeef2',
      'bg-hover': '#d0d7de', 'bg-active': '#c6cbd1', 'border': '#d0d7de', 'border-light': '#afb8c1',
      'text-primary': '#1f2328', 'text-secondary': '#656d76', 'text-muted': '#8c959f',
      'accent': '#7c6aef', 'accent-hover': '#6b5ce0', 'accent-bg': 'rgba(124,106,239,0.12)',
      'green': '#1a7f37', 'green-bg': 'rgba(26,127,55,0.12)',
      'red': '#cf222e', 'red-bg': 'rgba(207,34,46,0.12)',
      'yellow': '#9a6700', 'yellow-bg': 'rgba(154,103,0,0.12)',
      'blue': '#0969da', 'blue-bg': 'rgba(9,105,218,0.12)',
      'orange': '#bc4c00', 'orange-bg': 'rgba(188,76,0,0.12)'
    },
    blue: {
      'bg-primary': '#0a192f', 'bg-secondary': '#112240', 'bg-tertiary': '#1d3461',
      'bg-hover': '#233554', 'bg-active': '#2d4a73', 'border': '#233554', 'border-light': '#3d5a80',
      'text-primary': '#ccd6f6', 'text-secondary': '#8892b0', 'text-muted': '#6b7a99',
      'accent': '#64ffda', 'accent-hover': '#4cdfc0', 'accent-bg': 'rgba(100,255,218,0.12)',
      'green': '#64ffda', 'green-bg': 'rgba(100,255,218,0.12)',
      'red': '#ff6b6b', 'red-bg': 'rgba(255,107,107,0.12)',
      'yellow': '#ffd93d', 'yellow-bg': 'rgba(255,217,61,0.12)',
      'blue': '#58a6ff', 'blue-bg': 'rgba(88,166,255,0.12)',
      'orange': '#f0a500', 'orange-bg': 'rgba(240,165,0,0.12)'
    },
    purple: {
      'bg-primary': '#1a1025', 'bg-secondary': '#231536', 'bg-tertiary': '#2d1b45',
      'bg-hover': '#3d2658', 'bg-active': '#4d316a', 'border': '#3d2658', 'border-light': '#5d377a',
      'text-primary': '#e8d5f5', 'text-secondary': '#a78bba', 'text-muted': '#7d6b92',
      'accent': '#c084fc', 'accent-hover': '#a855f7', 'accent-bg': 'rgba(192,132,252,0.12)',
      'green': '#4ade80', 'green-bg': 'rgba(74,222,128,0.12)',
      'red': '#f87171', 'red-bg': 'rgba(248,113,113,0.12)',
      'yellow': '#fbbf24', 'yellow-bg': 'rgba(251,191,36,0.12)',
      'blue': '#818cf8', 'blue-bg': 'rgba(129,140,248,0.12)',
      'orange': '#fb923c', 'orange-bg': 'rgba(251,146,60,0.12)'
    }
  };
  const vars = themes[theme] || themes.dark;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(`--${k}`, v);
}

// ===== 功能开关 =====
function applyFeatureToggles(features) {
  const tabMap = { commands: 'commands', skills: 'skills', token: 'token', memory: 'memory', operations: 'operations' };
  for (const [key, tabId] of Object.entries(tabMap)) {
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    const panel = document.getElementById(`panel-${tabId}`);
    if (features[key] === false) {
      if (tab) tab.style.display = 'none';
      if (panel) panel.style.display = 'none';
    } else {
      if (tab) tab.style.display = '';
      if (panel) panel.style.display = '';
    }
  }
}

// ===== 距今时间格式化 =====
// ===== 辅助函数 =====
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\\/g,'&#92;'); }

function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return '';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('createdAgo') + ' ' + seconds + '秒前';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('createdAgo') + ' ' + minutes + '分钟前';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('createdAgo') + ' ' + hours + '小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return t('createdAgo') + ' ' + days + '天前';
  const months = Math.floor(days / 30);
  if (months < 12) return t('createdAgo') + ' ' + months + '个月前';
  return t('createdAgo') + ' ' + Math.floor(months / 12) + '年前';
}

function formatDateTime(ms) {
  if (!ms) return '-';
  try { return new Date(ms).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return '-'; }
}

// ===== 数据加载 =====
async function loadData() {
  try { state.projects = await window.claudeAPI.getProjects(state.appSettings.scanMode); } catch { state.projects = []; }
  try { state.aliases = await window.claudeAPI.getAliases(); } catch {}

  if (!state.currentProject && state.projects.length > 0) {
    state.currentProject = state.projects[0].name;
  }

  renderSidebar();
  renderSettingsPanel();
  await loadCurrentTabData();
  updateStatus(t('refresh') || '数据已刷新');
}

// ===== 侧边栏渲染 =====
function renderSidebar() {
  const list = document.getElementById('sidebar-projects');
  const countEl = document.getElementById('sidebar-proj-count');
  if (!list) return;

  let filtered = state.projects;
  const searchVal = document.getElementById('project-search')?.value?.toLowerCase() || '';
  if (searchVal) {
    filtered = filtered.filter(p => {
      const dn = getDisplayName(p.name);
      return dn.toLowerCase().includes(searchVal) || (p.path || '').toLowerCase().includes(searchVal) || p.name.toLowerCase().includes(searchVal);
    });
  }

  if (countEl) countEl.textContent = state.projects.length;

  list.innerHTML = filtered.map((p, idx) => {
    const isActive = p.name === state.currentProject;
    const displayName = getDisplayName(p.name);
    const shortName = getShortName(p);
    const sourceTag = p.source && p.source !== 'projects' ? `<span class="source-tag source-${p.source}">${p.source}</span>` : '';
    const createdStr = p.createdAt ? `<span class="time-ago">${timeAgo(p.createdAt)}</span>` : '';
    const activeStr = p.lastAccess ? `<span class="last-active">${t('lastActive')} ${timeAgo(p.lastAccess)}</span>` : '';

    return `<div class="sidebar-item ${isActive ? 'active' : ''}" data-idx="${idx}" data-name="${escAttr(p.name)}">
      <div class="sidebar-item-info" data-action="select">
        <span class="sidebar-item-name" title="${escAttr(displayName)}">${escHtml(shortName)}</span>
        <span class="sidebar-item-path" title="${escAttr(p.path || '')}">${escHtml(truncatePath(p.path || p.name))}</span>
        <div class="sidebar-item-meta">
          ${createdStr}${createdStr && activeStr ? '<span class="meta-sep">|</span>' : ''}${activeStr}
          ${sourceTag}
        </div>
      </div>
      <div class="sidebar-item-actions">
        <button class="sidebar-action" data-action="open" title="${t('open')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </button>
        <button class="sidebar-action" data-action="launch" title="${t('launch')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button class="sidebar-action sidebar-action-danger" data-action="dangerous" title="${t('dangerous')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
        <button class="sidebar-action" data-action="rename" title="${t('rename')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="sidebar-action sidebar-action-delete" data-action="delete" title="${t('deleteFiles')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // 事件委托：避免 inline onclick 路径反斜杠损坏问题
  list.querySelectorAll('.sidebar-item').forEach(item => {
    const idx = parseInt(item.dataset.idx);
    const p = filtered[idx];
    if (!p) return;

    item.querySelector('[data-action="select"]')?.addEventListener('click', () => selectProject(p.name));
    item.querySelector('[data-action="open"]')?.addEventListener('click', (e) => { e.stopPropagation(); openProject(p.path); });
    item.querySelector('[data-action="launch"]')?.addEventListener('click', (e) => { e.stopPropagation(); launchProject(p.path); });
    item.querySelector('[data-action="dangerous"]')?.addEventListener('click', (e) => { e.stopPropagation(); launchProjectDangerous(p.path); });
    item.querySelector('[data-action="rename"]')?.addEventListener('click', (e) => { e.stopPropagation(); renameProject(p.name); });
    item.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => { e.stopPropagation(); deleteProjectFiles(p.name); });
  });
}

function getDisplayName(name) { return state.aliases[name] || name; }

function getShortName(p) {
  if (state.aliases[p.name]) return state.aliases[p.name];
  if (p.path) { const parts = p.path.replace(/\\/g, '/').split('/'); return parts[parts.length - 1] || p.name; }
  return p.name;
}

function truncatePath(p) { if (!p) return ''; if (p.length <= 45) return p; return '...' + p.substring(p.length - 42); }

// ===== 项目操作 =====
function selectProject(name) {
  state.currentProject = name;
  renderSidebar();
  loadCurrentTabData();
}

function openProject(p) { if (p && p.trim()) window.claudeAPI.openFolder(p); }
function launchProject(p) { if (p && p.trim()) window.claudeAPI.openInTerminal(p); }
function launchProjectDangerous(p) {
  if (!p || !p.trim()) return;
  showConfirm(t('dangerousLaunch'), t('dangerousLaunchShort'), () => window.claudeAPI.openInTerminalDangerous(p));
}

async function renameProject(name) {
  const currentAlias = state.aliases[name] || '';
  const input = document.getElementById('rename-input');
  const overlay = document.getElementById('rename-overlay');
  const title = document.getElementById('rename-title');
  const hint = document.getElementById('rename-hint');

  title.textContent = t('rename');
  hint.textContent = name + '\n' + (t('cancel') || '留空恢复默认');
  input.value = currentAlias;
  overlay.style.display = 'flex';
  input.focus();
  input.select();

  return new Promise((resolve) => {
    const cleanup = () => {
      overlay.style.display = 'none';
      document.getElementById('rename-ok').removeEventListener('click', onOk);
      document.getElementById('rename-cancel').removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    };
    const onOk = async () => {
      const newAlias = input.value;
      cleanup();
      try {
        const result = await window.claudeAPI.setAlias(name, newAlias);
        state.aliases = result.aliases || {};
        renderSidebar();
      } catch (e) { console.error(e); }
      resolve();
    };
    const onCancel = () => { cleanup(); resolve(); };
    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    document.getElementById('rename-ok').addEventListener('click', onOk);
    document.getElementById('rename-cancel').addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  });
}

async function deleteProjectFiles(name) {
  if (!name) return;
  showConfirm(t('deleteFiles'), t('confirmDeleteFiles'), async () => {
    const r = await window.claudeAPI.deleteProjectFiles(name);
    alert(r.success ? r.message : r.error);
    loadData();
  });
}

async function deleteEntireProject(name) {
  if (!name) return;
  showConfirm(t('deleteProject'), t('confirmDeleteProject'), async () => {
    const r = await window.claudeAPI.deleteProject(name);
    alert(r.success ? r.message : r.error);
    state.currentProject = null;
    loadData();
  });
}

// ===== Tab 切换 =====
function bindEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
      loadCurrentTabData();
    });
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => { loadData(); });
  document.getElementById('btn-scan-all')?.addEventListener('click', async () => {
    updateStatus('正在全盘扫描...');
    const result = await window.claudeAPI.scanAllData();
    if (result.success) {
      state.projects = result.projects;
      renderSidebar();
      updateStatus(`扫描完成，找到 ${result.count} 个项目`);
    }
  });
  document.getElementById('btn-launch-claude')?.addEventListener('click', () => {
    const proj = state.projects.find(p => p.name === state.currentProject);
    if (proj?.path) window.claudeAPI.openInTerminal(proj.path);
    else window.claudeAPI.launchClaude();
  });
  document.getElementById('btn-launch-dangerous')?.addEventListener('click', () => {
    const proj = state.projects.find(p => p.name === state.currentProject);
    if (!proj?.path) return;
    showConfirm(t('dangerousLaunch'), t('dangerousLaunchShort'), () => window.claudeAPI.openInTerminalDangerous(proj.path));
  });
  document.getElementById('project-search')?.addEventListener('input', renderSidebar);

  // 确认弹窗
  document.getElementById('confirm-cancel')?.addEventListener('click', () => {
    document.getElementById('confirm-overlay').style.display = 'none';
    window._confirmCallback = null;
  });
  document.getElementById('confirm-ok')?.addEventListener('click', () => {
    document.getElementById('confirm-overlay').style.display = 'none';
    if (window._confirmCallback) { window._confirmCallback(); window._confirmCallback = null; }
  });

  // 模态框
  document.getElementById('modal-close')?.addEventListener('click', () => { document.getElementById('modal-overlay').style.display = 'none'; });
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) document.getElementById('modal-overlay').style.display = 'none';
  });
  document.getElementById('modal-copy')?.addEventListener('click', () => {
    const body = document.getElementById('modal-body');
    if (body) navigator.clipboard.writeText(body.textContent);
  });
}

async function loadCurrentTabData() {
  const activeTab = document.querySelector('.tab.active');
  if (!activeTab) return;
  const tabId = activeTab.dataset.tab;
  if (tabId === 'commands') await loadCommands();
  else if (tabId === 'skills') await loadSkills();
  else if (tabId === 'token') await loadToken();
  else if (tabId === 'memory') await loadMemory();
  else if (tabId === 'operations') renderOperations();
}

// ===== 命令历史 =====
async function loadCommands() {
  if (!state.currentProject) return;
  try { state.commands = await window.claudeAPI.getCommands(state.currentProject); } catch { state.commands = []; }
  renderCommands();
}

function renderCommands() {
  const tbody = document.getElementById('commands-tbody');
  const countEl = document.getElementById('commands-count');
  const statsEl = document.getElementById('command-stats');
  const projBadge = document.getElementById('commands-proj-badge');
  if (!tbody) return;

  const proj = state.projects.find(p => p.name === state.currentProject);
  if (projBadge) projBadge.textContent = proj ? (state.aliases[proj.name] || getShortName(proj)) : '';

  if (countEl) countEl.textContent = state.commands.length;

  // 统计行
  if (statsEl) {
    const cmdCount = {};
    state.commands.forEach(c => { cmdCount[c.command] = (cmdCount[c.command] || 0) + 1; });
    const topCmds = Object.entries(cmdCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const uniqueCount = Object.keys(cmdCount).length;
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-icon" style="background:var(--accent-bg);color:var(--accent);">&#x2318;</div><div class="stat-info"><div class="stat-value">${state.commands.length}</div><div class="stat-label">${t('commandCount')}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--green-bg);color:var(--green);">&#x2605;</div><div class="stat-info"><div class="stat-value">${topCmds.length > 0 ? topCmds[0][0] : '-'}</div><div class="stat-label">${t('topCommand')}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--blue-bg);color:var(--blue);">&#x2234;</div><div class="stat-info"><div class="stat-value">${uniqueCount}</div><div class="stat-label">${t('uniqueCount')}</div></div></div>`;
  }

  tbody.innerHTML = state.commands.slice(0, 100).map(c => {
    const time = c.timestamp ? new Date(c.timestamp).toLocaleString('zh-CN') : '';
    return `<tr class="clickable" onclick="showCommandDetail(${JSON.stringify(c).replace(/"/g, '&quot;')})">
      <td><code class="cmd-code">${escHtml(c.command)}</code></td>
      <td class="cell-truncate" title="${escAttr(c.fullText || '')}">${escHtml((c.fullText || '').substring(0, 80))}</td>
      <td class="cell-time">${time}</td>
      <td><span class="session-badge">${escHtml((c.sessionId || '').substring(0, 8))}</span></td>
    </tr>`;
  }).join('');
}

// 点击查看命令详情 - 字体放大
function showCommandDetail(c) {
  const content = `${t('cmdDetail')}\n${'─'.repeat(30)}\n${t('fullInput')}:\n${c.fullMessage || c.fullText || c.command}\n\n${t('sessionLabel')}: ${c.sessionId || '-'}\n${t('time')}: ${c.timestamp ? new Date(c.timestamp).toLocaleString('zh-CN') : '-'}`;
  showModal(t('cmdDetail'), content);
}

// ===== 技能管理 =====
async function loadSkills() {
  try { state.skills = await window.claudeAPI.getSkills(); } catch { state.skills = null; }
  renderSkills();
}

function renderSkills() {
  const pluginGrid = document.getElementById('plugin-skills-grid');
  const userGrid = document.getElementById('user-skills-grid');
  if (!state.skills || !pluginGrid) return;

  const pluginSkills = (state.skills.allSkills || []).filter(s => s.sourceType === 'plugin');
  const userSkills = (state.skills.allSkills || []).filter(s => s.sourceType === 'user');

  pluginGrid.innerHTML = pluginSkills.map(s => skillCard(s)).join('');
  userGrid.innerHTML = userSkills.map(s => skillCard(s)).join('');

  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.dataset.name;
      const skill = (state.skills.allSkills || []).find(s => s.name === name);
      if (skill) showModal(skill.name + (skill.source ? ' - ' + skill.source : ''), skill.content || skill.description || '');
    });
  });
}

function skillCard(s) {
  const lockedTag = s.locked ? '<span class="skill-locked">&#x1F512; 已锁定</span>' : '';
  return `<div class="skill-card" data-name="${escHtml(s.name)}">
    <div class="skill-header"><span class="skill-name">${escHtml(s.name)}</span>${lockedTag}</div>
    <div class="skill-source">${escHtml(s.source || '用户自定义')} ${s.version ? 'v' + s.version : ''}</div>
    <div class="skill-desc" title="${escAttr(s.description)}">${escHtml(s.description)}</div>
  </div>`;
}

// ===== Token / 模型 - 还原美观样式 =====
async function loadToken() {
  try { state.tokenInfo = await window.claudeAPI.getTokenInfo(state.currentProject); } catch { state.tokenInfo = null; }
  renderToken();
}

function renderToken() {
  const cardsEl = document.getElementById('token-cards');
  const sessionsEl = document.getElementById('token-sessions');
  if (!state.tokenInfo || !cardsEl) return;

  const info = state.tokenInfo;
  const pt = info.projectToken || {};
  const gt = info.globalToken || {};
  const td = info.timeDimension || {};
  const proj = state.projects.find(p => p.name === state.currentProject);
  const projName = proj ? (state.aliases[proj.name] || getShortName(proj)) : '';

  let html = '';

  // ===== Token吞噬动画区域 =====
  const cwPct = info.contextWindow
    ? Math.min(100, ((info.contextWindow.current_usage?.input_tokens || 0) / (info.contextWindow.context_window_size || 200000) * 100))
    : 0;
  const barPct = Math.min(100, cwPct);

  html += `<div class="token-animation-area" id="tokenAnimArea">
    <div class="token-source" id="tokenSource">
      <div class="source-aura"></div>
      <img src="claude-icon.png" class="source-img" id="sourceImg" alt="Claude" />
    </div>
    <div class="token-context-info">
      <div class="context-pct" id="contextPct">${cwPct.toFixed(1)}%</div>
      <div class="context-label">${t('contextWindow')}</div>
    </div>
    <div class="token-mascot" id="tokenMascot">
      <div class="mascot-aura"></div>
      <img src="claudecode-icon.png" class="mascot-img" id="mascotImg" alt="Claude Code" />
    </div>
    <div class="token-particles" id="tokenParticles"></div>
    <div class="token-absorb-bar">
      <div class="absorb-fill" id="absorbFill" style="width:${barPct}%"></div>
    </div>
  </div>`;

  // ===== 区块1: 当前项目实时Token - 美观卡片 =====
  html += `<div class="token-block">
    <div class="token-block-title">
      <span class="token-block-icon" style="background:var(--accent-bg);color:var(--accent);">&#x2B50;</span>
      ${t('projRealtime')}
      <span class="proj-badge">${escHtml(projName)}</span>
    </div>
    <div class="token-grid-4col">`;

  // 当前模型
  html += `<div class="token-card"><div class="tc-label">${t('currentModel')}</div><div class="tc-value accent">${escHtml(info.liveModel || '-')}</div></div>`;

  // 上下文窗口
  if (info.contextWindow) {
    const cw = info.contextWindow;
    const currentUsage = cw.current_usage?.input_tokens || 0;
    const windowSize = cw.context_window_size || 200000;
    const pct = Math.min(100, (currentUsage / windowSize * 100));
    const remaining = Math.max(0, 100 - pct);
    const barColor = remaining < 20 ? 'red' : remaining < 50 ? 'yellow' : 'accent';
    const tsStr = info.contextReceivedAt ? new Date(info.contextReceivedAt).toLocaleTimeString() : '';
    html += `<div class="token-card"><div class="tc-label">${t('contextWindow')}</div>
      <div class="tc-value ${barColor === 'accent' ? 'accent' : barColor}">${formatTokens(currentUsage)}</div>
      <div class="tc-sub">/ ${formatTokens(windowSize)} | ${t('remaining')}: ${remaining.toFixed(1)}%</div>
      <div class="progress-bar"><div class="fill ${barColor}" style="width:${pct}%"></div></div>
      ${tsStr ? `<div class="tc-time">${tsStr}</div>` : ''}</div>`;
  }

  // 项目总Token
  html += `<div class="token-card"><div class="tc-label">${t('totalTokens')}</div><div class="tc-value blue">${formatTokens(pt.totalTokens || 0)}</div>
    <div class="tc-sub">输入 ${formatTokens(pt.inputTokens || 0)} | 输出 ${formatTokens(pt.outputTokens || 0)}</div>
    <div class="tc-sub">缓存读 ${formatTokens(pt.cacheRead || 0)} | 缓存创 ${formatTokens(pt.cacheCreate || 0)}</div></div>`;

  // 会话/消息数
  html += `<div class="token-card"><div class="tc-label">${t('projSessions')}</div><div class="tc-value green">${pt.sessionCount || 0}</div>
    <div class="tc-sub">消息总数: ${pt.messageCount || 0}</div></div>`;

  html += `</div></div>`;

  // ===== 区块2: 时间维度Token =====
  html += `<div class="token-block">
    <div class="token-block-title">
      <span class="token-block-icon" style="background:var(--blue-bg);color:var(--blue);">&#x1F4C8;</span>
      ${t('timeDimension')}
      <span class="proj-badge">${escHtml(projName)}</span>
    </div>
    <div class="time-cards-row">`;

  const timeWindows = [
    { key: 'last5h', label: t('last5h') },
    { key: 'last1d', label: t('last1d') },
    { key: 'last7d', label: t('last7d') }
  ];

  for (const tw of timeWindows) {
    const data = td[tw.key] || { input: 0, output: 0, cache: 0, total: 0 };
    html += `<div class="time-card">
      <div class="time-card-label">${tw.label}</div>
      <div class="time-card-total">${formatTokens(data.total)}</div>
      <div class="time-card-detail">
        <span class="tsinput">输入 ${formatTokens(data.input)}</span>
        <span class="tsoutput">输出 ${formatTokens(data.output)}</span>
        <span class="tscache">缓存 ${formatTokens(data.cache)}</span>
      </div>
    </div>`;
  }

  html += `</div></div>`;

  // ===== 区块3: 全局总Token =====
  html += `<div class="token-block">
    <div class="token-block-title">
      <span class="token-block-icon" style="background:var(--green-bg);color:var(--green);">&#x1F30D;</span>
      ${t('globalSummary')}
    </div>
    <div class="token-grid-4col">
      <div class="token-card"><div class="tc-label">${t('globalTotal')}</div><div class="tc-value blue">${formatTokens(gt.totalTokens || 0)}</div>
        <div class="tc-sub">输入 ${formatTokens(gt.inputTokens || 0)} | 输出 ${formatTokens(gt.outputTokens || 0)}</div>
        <div class="tc-sub">缓存读 ${formatTokens(gt.cacheRead || 0)} | 缓存创 ${formatTokens(gt.cacheCreate || 0)}</div></div>
      <div class="token-card"><div class="tc-label">${t('globalSessions')}</div><div class="tc-value">${gt.totalSessions || 0}</div></div>
      <div class="token-card"><div class="tc-label">${t('globalMessages')}</div><div class="tc-value green">${gt.totalMessages || 0}</div></div>`;

  const globalModelEntries = Object.entries(info.globalModels || {}).sort((a, b) => b[1] - a[1]);
  if (globalModelEntries.length > 0) {
    html += `<div class="token-card"><div class="tc-label">${t('modelDist')}</div><div class="model-dist">${globalModelEntries.slice(0, 5).map(([m, c]) => `<div class="model-dist-row"><span class="model-name">${escHtml(m)}</span><span class="model-count">${c}次</span></div>`).join('')}</div></div>`;
  }

  html += `</div></div>`;

  // ===== 区块4: 工具追踪 =====
  html += `<div class="token-block">
    <div class="token-block-title">
      <span class="token-block-icon" style="background:var(--orange-bg);color:var(--orange);">&#x1F527;</span>
      ${t('toolTracking')}
      <span class="proj-badge">${escHtml(projName)}</span>
    </div>`;

  const tools = info.projectTools || [];
  if (tools.length > 0) {
    html += `<div class="tool-track-section"><div class="tool-track-label">${t('cliTools')}</div><div class="tool-track-list">`;
    tools.forEach(tool => {
      const lastTime = tool.lastUsed ? new Date(tool.lastUsed).toLocaleString('zh-CN') : '';
      const catClass = tool.category === 'skill' ? 'tool-cat-skill' : tool.category === 'agent' ? 'tool-cat-agent' : 'tool-cat-cli';
      html += `<div class="tool-track-item">
        <span class="tool-name ${catClass}">${escHtml(tool.name)}</span>
        <span class="tool-desc">${escHtml(tool.descChinese)}</span>
        <span class="tool-count">${tool.count}次</span>
        <span class="tool-time">${lastTime}</span>
      </div>`;
    });
    html += `</div></div>`;
  }

  const skills = info.projectSkills || [];
  if (skills.length > 0) {
    html += `<div class="tool-track-section"><div class="tool-track-label">${t('usedSkills')}</div><div class="skill-tags">`;
    skills.forEach(s => html += `<span class="skill-tag">${escHtml(s)}</span>`);
    html += `</div></div>`;
  }

  const mcp = info.projectMcp || [];
  if (mcp.length > 0) {
    html += `<div class="tool-track-section"><div class="tool-track-label">${t('mcpServices')}</div><div class="tool-track-list">`;
    mcp.forEach(m => html += `<div class="tool-track-item"><span class="tool-name tool-cat-mcp">${escHtml(m.name)}</span><span class="tool-desc">${escHtml(m.desc)}</span></div>`);
    html += `</div></div>`;
  }

  if (tools.length === 0 && skills.length === 0 && mcp.length === 0) {
    html += `<div class="empty-hint">${t('noRecords')}</div>`;
  }

  html += `</div>`;

  cardsEl.innerHTML = html;
  if (sessionsEl) sessionsEl.innerHTML = '';

  // 启动Token吞噬动画
  startTokenAnimation(cwPct);
}

// ===== 记忆管理 =====
async function loadMemory() {
  if (!state.currentProject) return;
  try { state.memoryData = await window.claudeAPI.getProjectMemory(state.currentProject); } catch { state.memoryData = null; }
  renderMemory();
}

function renderMemory() {
  const el = document.getElementById('memory-content');
  const projBadge = document.getElementById('memory-proj-badge');
  const proj = state.projects.find(p => p.name === state.currentProject);
  if (projBadge) projBadge.textContent = proj ? (state.aliases[proj.name] || getShortName(proj)) : '';
  if (!el) return;
  if (!state.memoryData || !state.memoryData.files?.length) {
    el.innerHTML = `<div class="empty-hint">${t('noMemory')}</div>`;
    return;
  }
  el.innerHTML = state.memoryData.files.map(f => `<div class="memory-file">
    <div class="memory-file-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
      <span class="memory-file-name">${escHtml(f.name)}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <pre class="memory-file-content">${escHtml(f.content)}</pre>
  </div>`).join('');
}

// ===== 操作面板 =====
function renderOperations() {
  renderQuickCommands();
  renderOpsProjects();
  renderSettingsPanel();
}

function renderQuickCommands() {
  const container = document.getElementById('quick-commands');
  if (!container) return;
  const cmds = [
    { label: '/help', desc: t('commands') }, { label: '/compact', desc: '压缩' },
    { label: '/clear', desc: '清空' }, { label: '/model', desc: '模型' },
    { label: '/fast', desc: '快速' }, { label: '/memory', desc: '记忆' }
  ];
  container.innerHTML = cmds.map(c => `<button class="cmd-btn" onclick="copyCmd('${c.label}')">${c.label}<span class="cmd-desc">${c.desc}</span></button>`).join('');
}

function renderOpsProjects() {
  const container = document.getElementById('ops-projects');
  if (!container) return;
  container.innerHTML = state.projects.slice(0, 20).map(p => {
    const dn = getDisplayName(p.name);
    return `<div class="ops-project-item" onclick="selectProject('${p.name}')">${escHtml(dn)}</div>`;
  }).join('');
}

// ===== 设置面板渲染 =====
function renderSettingsPanel() {
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = state.appSettings.theme || 'dark';
    themeSelect.onchange = async (e) => {
      state.appSettings.theme = e.target.value;
      applyTheme(e.target.value);
      try { await window.claudeAPI.saveAppSettings(state.appSettings); } catch {}
    };
  }
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = state.appSettings.language || 'zh';
    langSelect.onchange = async (e) => {
      state.appSettings.language = e.target.value;
      try { await window.claudeAPI.saveAppSettings(state.appSettings); } catch {}
      updateI18nTexts();
      renderSidebar();
      loadCurrentTabData();
    };
  }
  const versionSelect = document.getElementById('version-select');
  if (versionSelect) {
    versionSelect.value = state.appSettings.claudeVersion || 'latest';
    versionSelect.onchange = async (e) => {
      state.appSettings.claudeVersion = e.target.value;
      try { await window.claudeAPI.saveAppSettings(state.appSettings); } catch {}
    };
  }
  const scanSelect = document.getElementById('scan-mode-select');
  if (scanSelect) {
    scanSelect.value = state.appSettings.scanMode || 'full';
    scanSelect.onchange = async (e) => {
      state.appSettings.scanMode = e.target.value;
      try { await window.claudeAPI.setScanMode(e.target.value); } catch {}
      loadData();
    };
  }
  document.querySelectorAll('.feature-toggle').forEach(toggle => {
    const feature = toggle.dataset.feature;
    toggle.checked = state.appSettings.features[feature] !== false;
    toggle.onchange = async (e) => {
      state.appSettings.features[feature] = e.target.checked;
      applyFeatureToggles(state.appSettings.features);
      try { await window.claudeAPI.saveAppSettings(state.appSettings); } catch {}
    };
  });
}

function copyCmd(cmd) { navigator.clipboard.writeText(cmd); updateStatus(`已复制: ${cmd}`); }

// ===== 通用工具 =====
function showConfirm(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').style.display = 'flex';
  window._confirmCallback = callback;
}

function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  const body = document.getElementById('modal-body');
  body.textContent = content;
  // 字体放大到15px提升辨识度
  body.style.fontSize = '15px';
  body.style.lineHeight = '1.8';
  document.getElementById('modal-overlay').style.display = 'flex';
}

function updateStatus(text) { const el = document.getElementById('status-text'); if (el) el.textContent = text; }
function updateStatusTime() { const el = document.getElementById('status-time'); if (el) el.textContent = new Date().toLocaleTimeString('zh-CN'); }

function formatTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function escHtml(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// ===== Token吞噬动画引擎 - 精致版 =====
let tokenAnimTimer = null;
let idleTimer = null;
let ambientParticles = [];

function startTokenAnimation(pct) {
  if (tokenAnimTimer) clearInterval(tokenAnimTimer);
  if (idleTimer) clearTimeout(idleTimer);

  const mascot = document.getElementById('tokenMascot');
  const source = document.getElementById('tokenSource');
  const particles = document.getElementById('tokenParticles');
  if (!mascot || !source || !particles) return;

  // 创建环境漂浮粒子
  createAmbientParticles(particles);

  // 创建能量连接线
  createEnergyLine(particles, source, mascot);

  // 星星从左侧Claude大头像发出，飞向右侧ClaudeCode图标
  // 每1.2秒发射一波粒子（1-3个）
  tokenAnimTimer = setInterval(() => {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnTokenParticle(particles, source, mascot), i * 150);
    }
  }, 1200);

  resetIdleTimer();
}

function createAmbientParticles(container) {
  // 清除旧的环境粒子
  ambientParticles.forEach(p => p.remove());
  ambientParticles = [];

  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'ambient-particle';
    const size = 2 + Math.random() * 3;
    const colors = ['rgba(209,134,22,0.15)', 'rgba(124,106,239,0.15)', 'rgba(63,185,80,0.12)', 'rgba(88,166,255,0.1)'];
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (10 + Math.random() * 70) + '%';
    el.style.setProperty('--ambient-dur', (6 + Math.random() * 8) + 's');
    el.style.setProperty('--ambient-drift-y', (-10 + Math.random() * 20) + 'px');
    el.style.setProperty('--ambient-drift-x', (-8 + Math.random() * 16) + 'px');
    el.style.setProperty('--ambient-drift-y2', (-5 + Math.random() * 15) + 'px');
    el.style.setProperty('--ambient-drift-x2', (-6 + Math.random() * 12) + 'px');
    el.style.setProperty('--ambient-start-opacity', '0.1');
    el.style.setProperty('--ambient-mid-opacity', (0.2 + Math.random() * 0.15).toFixed(2));
    container.appendChild(el);
    ambientParticles.push(el);
  }
}

function createEnergyLine(container, source, mascot) {
  // 移除旧的能量线
  const old = container.querySelector('.energy-line');
  if (old) old.remove();

  const area = container.closest('.token-animation-area');
  const sourceRect = source.getBoundingClientRect();
  const mascotRect = mascot.getBoundingClientRect();
  const areaRect = area.getBoundingClientRect();

  const startX = sourceRect.right - areaRect.left;
  const startY = sourceRect.top + sourceRect.height / 2 - areaRect.top;
  const endX = mascotRect.left - areaRect.left;
  const endY = mascotRect.top + mascotRect.height / 2 - areaRect.top;

  const length = endX - startX;
  const angle = Math.atan2(endY - startY, length) * 180 / Math.PI;

  const line = document.createElement('div');
  line.className = 'energy-line';
  line.style.left = startX + 'px';
  line.style.top = startY + 'px';
  line.style.width = length + 'px';
  line.style.transform = `rotate(${angle}deg)`;
  container.appendChild(line);
}

function spawnTokenParticle(container, source, mascot) {
  // 粒子类型：星标emoji、光点、能量球
  const types = [
    { kind: 'star', symbols: ['⭐', '✨', '💫', '🌟', '★'], sizeRange: [14, 20] },
    { kind: 'dot', symbols: ['●', '◉', '◆'], sizeRange: [8, 12] },
    { kind: 'spark', symbols: ['✦', '✧', '⊹'], sizeRange: [10, 16] }
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const symbol = type.symbols[Math.floor(Math.random() * type.symbols.length)];

  const colors = ['var(--accent)', 'var(--green)', 'var(--yellow)', 'var(--blue)', 'var(--orange)', '#d18616'];

  // 计算源(左侧Claude)和目标(右侧ClaudeCode)的位置
  const area = container.closest('.token-animation-area');
  const sourceRect = source.getBoundingClientRect();
  const mascotRect = mascot.getBoundingClientRect();
  const areaRect = area.getBoundingClientRect();

  const startX = sourceRect.right - areaRect.left - 8;
  const startY = sourceRect.top + sourceRect.height / 2 - areaRect.top + (Math.random() - 0.5) * 40;
  const endX = mascotRect.left - areaRect.left + mascotRect.width / 2 + (Math.random() - 0.5) * 10;
  const endY = mascotRect.top + mascotRect.height / 2 - areaRect.top + (Math.random() - 0.5) * 20;

  // 选择飞行轨迹：上弧、下弧、直线高速
  const anims = ['starArcUp', 'starArcDown', 'starLinearFast'];
  const anim = type.kind === 'dot' ? 'starLinearFast' : anims[Math.floor(Math.random() * anims.length)];
  const dur = type.kind === 'dot' ? (0.6 + Math.random() * 0.4) : (1.2 + Math.random() * 0.4);
  const ease = anim === 'starLinearFast' ? 'ease-in' : 'ease-in-out';

  const el = document.createElement('span');
  el.className = 'token-star';
  el.textContent = symbol;
  el.style.color = colors[Math.floor(Math.random() * colors.length)];
  el.style.fontSize = (type.sizeRange[0] + Math.random() * (type.sizeRange[1] - type.sizeRange[0])) + 'px';
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';
  el.style.setProperty('--fly-x', (endX - startX) + 'px');
  el.style.setProperty('--fly-y', (endY - startY) + 'px');
  el.style.setProperty('--star-anim', anim);
  el.style.setProperty('--star-dur', dur + 's');
  el.style.setProperty('--star-ease', ease);
  container.appendChild(el);

  // 添加拖尾粒子（每200ms在飞行途中创建残影）
  if (type.kind !== 'dot') {
    const trailCount = 3;
    for (let t = 1; t <= trailCount; t++) {
      setTimeout(() => {
        const trail = document.createElement('div');
        trail.className = 'token-trail';
        const trailSize = 3 + Math.random() * 3;
        trail.style.width = trailSize + 'px';
        trail.style.height = trailSize + 'px';
        trail.style.background = el.style.color;
        trail.style.left = (startX + (endX - startX) * (t / (trailCount + 2))) + 'px';
        trail.style.top = (startY + (endY - startY) * (t / (trailCount + 2)) + (Math.random() - 0.5) * 8) + 'px';
        container.appendChild(trail);
        trail.addEventListener('animationend', () => trail.remove());
      }, t * 180);
    }
  }

  // 触发Claude头像发射闪光
  triggerEmitFlash(container, source);

  // 粒子到达目标时触发吞噬效果
  const absorbDelay = dur * 0.75 * 1000;
  setTimeout(() => triggerAbsorb(container, mascot, areaRect), absorbDelay);

  // 触发ClaudeCode图标吞噬效果
  triggerMascotAbsorb(mascot);

  // 粒子飞行后清除
  el.addEventListener('animationend', () => el.remove());
}

function triggerEmitFlash(container, source) {
  const area = container.closest('.token-animation-area');
  const sourceRect = source.getBoundingClientRect();
  const areaRect = area.getBoundingClientRect();

  const flash = document.createElement('div');
  flash.className = 'emit-flash';
  flash.style.left = (sourceRect.right - areaRect.left - 15) + 'px';
  flash.style.top = (sourceRect.top + sourceRect.height / 2 - areaRect.top - 15) + 'px';
  container.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());

  // 源头像发光
  source.classList.add('source-emitting');
  source.classList.remove('source-idle');
  setTimeout(() => source.classList.remove('source-emitting'), 600);
}

function triggerMascotAbsorb(mascot) {
  mascot.classList.add('mascot-absorb');
  mascot.classList.remove('mascot-sleeping');
  setTimeout(() => mascot.classList.remove('mascot-absorb'), 600);
  resetIdleTimer();
}

function triggerAbsorb(container, mascot, areaRect) {
  const mascotRect = mascot.getBoundingClientRect();

  // 吞噬爆发闪光
  const flash = document.createElement('div');
  flash.className = 'absorb-flash';
  flash.style.left = (mascotRect.left - areaRect.left + mascotRect.width / 2 - 15) + 'px';
  flash.style.top = (mascotRect.top - areaRect.top + mascotRect.height / 2 - 15) + 'px';
  container.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());

  // 吞噬粒子环
  const ring = document.createElement('div');
  ring.className = 'absorb-ring';
  ring.style.left = (mascotRect.left - areaRect.left + mascotRect.width / 2 - 10) + 'px';
  ring.style.top = (mascotRect.top - areaRect.top + mascotRect.height / 2 - 10) + 'px';
  container.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove());

  // 爆发散射小粒子（2-4个）
  const burstCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < burstCount; i++) {
    const burst = document.createElement('div');
    burst.className = 'token-trail';
    const burstSize = 2 + Math.random() * 2;
    burst.style.width = burstSize + 'px';
    burst.style.height = burstSize + 'px';
    burst.style.background = 'var(--accent)';
    const cx = mascotRect.left - areaRect.left + mascotRect.width / 2;
    const cy = mascotRect.top - areaRect.top + mascotRect.height / 2;
    burst.style.left = (cx + (Math.random() - 0.5) * 30) + 'px';
    burst.style.top = (cy + (Math.random() - 0.5) * 25) + 'px';
    container.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove());
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const mascot = document.getElementById('tokenMascot');
    const source = document.getElementById('tokenSource');
    if (mascot) mascot.classList.add('mascot-sleeping');
    if (source) source.classList.add('source-idle');
  }, 5000);
}
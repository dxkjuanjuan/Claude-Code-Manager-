// app.js - Claude Code Manager 渲染逻辑 v5

let _confirmCallback = null;

const state = {
  projects: [], currentProject: null, commands: [], skills: null,
  tokenInfo: null, memoryData: null, sessions: [],
  refreshInterval: null, aliases: {},
  appSettings: {
    theme: 'dark', language: 'zh', claudeVersion: 'latest',
    features: { commands: true, skills: true, token: true, operations: true },
    scanMode: 'full'
  }
};

// ===== 国际化 =====
const i18n = {
  zh: {
    commands: '命令历史', skills: '技能仓库', token: 'Token / 模型',
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
    noMemory: '当前项目暂无记忆文件', quickCommands: '快捷命令', groupManage: '项目分组管理', fileManage: '文件管理',
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
    dangerousLaunchShort: '将以 --dangerously-skip-permissions 模式启动，跳过所有权限检查。是否继续？',
    dashboard: '仪表盘', dashboardProjects: '项目总数', dashboardSessions: '会话总数', dashboardTokens: 'Token消耗', dashboardActive: '活跃项目', recentActivity: '最近活跃', noActivity: '暂无活跃项目', conversations: '对话历史', memFiles: '记忆文件', noConversations: '暂无对话记录', viewConversation: '查看对话', conversationDetail: '对话详情',
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
    noMemory: 'No memory files for this project', quickCommands: 'Quick Commands', groupManage: 'Group Management', fileManage: 'File Manager',
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
    dangerousLaunchShort: 'Launch with --dangerously-skip-permissions, skipping all permission checks. Continue?',
    dashboard: 'Dashboard', dashboardProjects: 'Total Projects', dashboardSessions: 'Total Sessions', dashboardTokens: 'Token Usage', dashboardActive: 'Active Projects', recentActivity: 'Recent Activity', noActivity: 'No active projects', conversations: 'Conversations', memFiles: 'Memory Files', noConversations: 'No conversations found', viewConversation: 'View Conversation', conversationDetail: 'Conversation Detail',
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
    const i18nMap = { dashboard: 'dashboard', commands: 'commands', cmdlib: 'cmdlib', skills: 'skills', token: 'token', operations: 'operations' };
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
    'panel-commands': 'commands', 'panel-cmdlib': 'cmdlib', 'panel-skills': 'skills',
    'panel-token': 'token', 'panel-operations': 'operations'
  };
  for (const [panelId, key] of Object.entries(panelTitles)) {
    const h2 = document.querySelector(`#${panelId} .panel-header h2`);
    if (h2) h2.textContent = t(key);
  }
  // 操作面板区段标题
  const sectionTitles = document.querySelectorAll('#panel-operations .section-title');
  const sectionMap = ['settings', 'groupManage', 'fileManage', 'projectJump'];
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
    // ===== 暗夜 — 深邃沉稳，微紫光晕 =====
    dark: {
      colors: {
        'bg-primary': '#0d1117', 'bg-secondary': '#161b22', 'bg-tertiary': '#1c2128',
        'bg-hover': '#21262d', 'bg-active': '#262c36',
        'border': '#30363d', 'border-light': '#3d444d',
        'text-primary': '#e6edf3', 'text-secondary': '#8b949e', 'text-muted': '#6e7681',
        'accent': '#7c6aef', 'accent-hover': '#8f7ff5', 'accent-bg': 'rgba(124,106,239,0.12)',
        'green': '#3fb950', 'green-bg': 'rgba(63,185,80,0.12)',
        'red': '#f85149', 'red-bg': 'rgba(248,81,73,0.12)',
        'yellow': '#d29922', 'yellow-bg': 'rgba(210,153,34,0.12)',
        'blue': '#58a6ff', 'blue-bg': 'rgba(88,166,255,0.12)',
        'orange': '#d18616', 'orange-bg': 'rgba(209,134,22,0.12)'
      },
      atmosphere: {
        bg: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,239,0.04) 0%, transparent 60%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 2px 8px rgba(0,0,0,0.25), 0 0 1px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.06)',
        radius: '10px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#161b22',
        gradient: 'linear-gradient(90deg, #161b22 0%, rgba(124,106,239,0.08) 50%, #161b22 100%)',
        shadow: '0 1px 3px rgba(0,0,0,0.2)'
      },
    },
    // ===== 晨光 — 清爽明亮 =====
    light: {
      colors: {
        'bg-primary': '#ffffff', 'bg-secondary': '#f6f8fa', 'bg-tertiary': '#eaeef2',
        'bg-hover': '#d8dee4', 'bg-active': '#c6cbd1',
        'border': '#d0d7de', 'border-light': '#afb8c1',
        'text-primary': '#1f2328', 'text-secondary': '#656d76', 'text-muted': '#8c959f',
        'accent': '#7c6aef', 'accent-hover': '#6b5ce0', 'accent-bg': 'rgba(124,106,239,0.10)',
        'green': '#1a7f37', 'green-bg': 'rgba(26,127,55,0.10)',
        'red': '#cf222e', 'red-bg': 'rgba(207,34,46,0.10)',
        'yellow': '#9a6700', 'yellow-bg': 'rgba(154,103,0,0.10)',
        'blue': '#0969da', 'blue-bg': 'rgba(9,105,218,0.10)',
        'orange': '#bc4c00', 'orange-bg': 'rgba(188,76,0,0.10)'
      },
      atmosphere: {
        bg: 'radial-gradient(ellipse at 80% 20%, rgba(88,166,255,0.03) 0%, transparent 50%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 1px 3px rgba(31,35,40,0.12), 0 0 0 1px rgba(175,184,193,0.2)',
        border: '1px solid rgba(175,184,193,0.3)',
        radius: '10px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#f6f8fa',
        gradient: 'linear-gradient(90deg, #f6f8fa 0%, rgba(124,106,239,0.06) 50%, #f6f8fa 100%)',
        shadow: '0 1px 0 rgba(175,184,193,0.3)'
      },
    },
    // ===== 深海 — 幽蓝静谧，蓝色光锥 =====
    blue: {
      colors: {
        'bg-primary': '#0a192f', 'bg-secondary': '#112240', 'bg-tertiary': '#1d3461',
        'bg-hover': '#233554', 'bg-active': '#2d4a73',
        'border': '#1e3a5f', 'border-light': '#2d5a80',
        'text-primary': '#ccd6f6', 'text-secondary': '#8892b0', 'text-muted': '#6b7a99',
        'accent': '#64ffda', 'accent-hover': '#4cdfc0', 'accent-bg': 'rgba(100,255,218,0.12)',
        'green': '#64ffda', 'green-bg': 'rgba(100,255,218,0.12)',
        'red': '#ff6b6b', 'red-bg': 'rgba(255,107,107,0.12)',
        'yellow': '#ffd93d', 'yellow-bg': 'rgba(255,217,61,0.12)',
        'blue': '#58a6ff', 'blue-bg': 'rgba(88,166,255,0.12)',
        'orange': '#f0a500', 'orange-bg': 'rgba(240,165,0,0.12)'
      },
      atmosphere: {
        bg: 'radial-gradient(ellipse at 30% 20%, rgba(100,255,218,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(88,166,255,0.03) 0%, transparent 40%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(100,255,218,0.05)',
        border: '1px solid rgba(100,255,218,0.08)',
        radius: '10px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#0d1b2a',
        gradient: 'linear-gradient(90deg, #0d1b2a 0%, rgba(100,255,218,0.08) 50%, #0d1b2a 100%)',
        shadow: '0 2px 4px rgba(0,0,0,0.3)'
      },
    },
    // ===== 梦幻紫 — 柔和梦幻 =====
    purple: {
      colors: {
        'bg-primary': '#1a1025', 'bg-secondary': '#231536', 'bg-tertiary': '#2d1b45',
        'bg-hover': '#3d2658', 'bg-active': '#4d316a',
        'border': '#3d2658', 'border-light': '#5d377a',
        'text-primary': '#e8d5f5', 'text-secondary': '#a78bba', 'text-muted': '#7d6b92',
        'accent': '#c084fc', 'accent-hover': '#a855f7', 'accent-bg': 'rgba(192,132,252,0.12)',
        'green': '#4ade80', 'green-bg': 'rgba(74,222,128,0.12)',
        'red': '#f87171', 'red-bg': 'rgba(248,113,113,0.12)',
        'yellow': '#fbbf24', 'yellow-bg': 'rgba(251,191,36,0.12)',
        'blue': '#818cf8', 'blue-bg': 'rgba(129,140,248,0.12)',
        'orange': '#fb923c', 'orange-bg': 'rgba(251,146,60,0.12)'
      },
      atmosphere: {
        bg: 'linear-gradient(135deg, rgba(192,132,252,0.04) 0%, rgba(168,85,247,0.03) 40%, transparent 70%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(192,132,252,0.06)',
        border: '1px solid rgba(192,132,252,0.10)',
        radius: '12px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#1e1433',
        gradient: 'linear-gradient(90deg, #1e1433 0%, rgba(192,132,252,0.1) 50%, #1e1433 100%)',
        shadow: '0 2px 6px rgba(0,0,0,0.3)'
      },
    },
    // ===== 赛博朋克 — 霓虹锋利 =====
    cyberpunk: {
      colors: {
        'bg-primary': '#08081a', 'bg-secondary': '#0e0e24', 'bg-tertiary': '#161636',
        'bg-hover': '#1e1e48', 'bg-active': '#26265a',
        'border': '#2a2a5a', 'border-light': '#3a3a6c',
        'text-primary': '#e8e0ff', 'text-secondary': '#9080b0', 'text-muted': '#605088',
        'accent': '#ff00ff', 'accent-hover': '#ff40ff', 'accent-bg': 'rgba(255,0,255,0.08)',
        'green': '#00ff88', 'green-bg': 'rgba(0,255,136,0.08)',
        'red': '#ff0055', 'red-bg': 'rgba(255,0,85,0.08)',
        'yellow': '#ffcc00', 'yellow-bg': 'rgba(255,204,0,0.08)',
        'blue': '#00ccff', 'blue-bg': 'rgba(0,204,255,0.08)',
        'orange': '#ff6600', 'orange-bg': 'rgba(255,102,0,0.08)'
      },
      atmosphere: {
        bg: 'linear-gradient(180deg, rgba(255,0,255,0.02) 0%, transparent 40%, rgba(0,204,255,0.02) 100%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 0 1px rgba(255,0,255,0.3), 0 0 20px rgba(255,0,255,0.06)',
        border: '1px solid rgba(255,0,255,0.12)',
        radius: '4px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#0a0a18',
        gradient: 'linear-gradient(90deg, #0a0a18 0%, rgba(255,0,255,0.06) 30%, rgba(0,204,255,0.05) 70%, #0a0a18 100%)',
        shadow: '0 0 1px rgba(255,0,255,0.2)'
      },
    },
    // ===== 深渊 — 极深暗沉，极简无装饰 =====
    deepsea: {
      colors: {
        'bg-primary': '#040810', 'bg-secondary': '#0a1218', 'bg-tertiary': '#101a24',
        'bg-hover': '#142430', 'bg-active': '#1a3040',
        'border': '#142430', 'border-light': '#1e3448',
        'text-primary': '#b8cce0', 'text-secondary': '#6890b0', 'text-muted': '#386080',
        'accent': '#00b8d4', 'accent-hover': '#009fb8', 'accent-bg': 'rgba(0,184,212,0.08)',
        'green': '#00e6a0', 'green-bg': 'rgba(0,230,160,0.08)',
        'red': '#ff5c5c', 'red-bg': 'rgba(255,92,92,0.08)',
        'yellow': '#ffd166', 'yellow-bg': 'rgba(255,209,102,0.08)',
        'blue': '#4dabf7', 'blue-bg': 'rgba(77,171,247,0.08)',
        'orange': '#ff922b', 'orange-bg': 'rgba(255,146,43,0.08)'
      },
      atmosphere: { bg: 'none' },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 1px 2px rgba(0,0,0,0.4)',
        border: '1px solid rgba(0,184,212,0.06)',
        radius: '6px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#060a10',
        gradient: 'linear-gradient(90deg, #060a10 0%, rgba(0,184,212,0.06) 50%, #060a10 100%)',
        shadow: '0 1px 0 rgba(0,184,212,0.08)'
      },
    },
    // ===== 翡翠 — 自然清新 =====
    emerald: {
      colors: {
        'bg-primary': '#0c1a12', 'bg-secondary': '#14261c', 'bg-tertiary': '#1c3426',
        'bg-hover': '#244030', 'bg-active': '#2c4c38',
        'border': '#244030', 'border-light': '#345c44',
        'text-primary': '#c8f0d8', 'text-secondary': '#80b898', 'text-muted': '#508068',
        'accent': '#34d399', 'accent-hover': '#2bc48a', 'accent-bg': 'rgba(52,211,153,0.10)',
        'green': '#22c55e', 'green-bg': 'rgba(34,197,94,0.10)',
        'red': '#f87171', 'red-bg': 'rgba(248,113,113,0.10)',
        'yellow': '#facc15', 'yellow-bg': 'rgba(250,204,21,0.10)',
        'blue': '#60a5fa', 'blue-bg': 'rgba(96,165,250,0.10)',
        'orange': '#fb923c', 'orange-bg': 'rgba(251,146,60,0.10)'
      },
      atmosphere: {
        bg: 'radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.04) 0%, transparent 60%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(52,211,153,0.05)',
        border: '1px solid rgba(52,211,153,0.08)',
        radius: '10px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#0c1a12',
        gradient: 'linear-gradient(90deg, #0c1a12 0%, rgba(52,211,153,0.08) 50%, #0c1a12 100%)',
        shadow: '0 2px 4px rgba(0,0,0,0.2)'
      },
    },
    // ===== 烈焰 — 温暖热烈 =====
    flame: {
      colors: {
        'bg-primary': '#180c08', 'bg-secondary': '#24140e', 'bg-tertiary': '#301c14',
        'bg-hover': '#3c241a', 'bg-active': '#482e22',
        'border': '#3c241a', 'border-light': '#54382c',
        'text-primary': '#f0d8c8', 'text-secondary': '#b89070', 'text-muted': '#886048',
        'accent': '#f97316', 'accent-hover': '#ea6c10', 'accent-bg': 'rgba(249,115,22,0.10)',
        'green': '#4ade80', 'green-bg': 'rgba(74,222,128,0.10)',
        'red': '#ef4444', 'red-bg': 'rgba(239,68,68,0.10)',
        'yellow': '#fbbf24', 'yellow-bg': 'rgba(251,191,36,0.10)',
        'blue': '#60a5fa', 'blue-bg': 'rgba(96,165,250,0.10)',
        'orange': '#fb923c', 'orange-bg': 'rgba(251,146,60,0.10)'
      },
      atmosphere: {
        bg: 'radial-gradient(ellipse at 80% 40%, rgba(249,115,22,0.05) 0%, transparent 50%)',
      },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(249,115,22,0.05)',
        border: '1px solid rgba(249,115,22,0.08)',
        radius: '10px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#180c08',
        gradient: 'linear-gradient(90deg, #180c08 0%, rgba(249,115,22,0.08) 50%, #180c08 100%)',
        shadow: '0 2px 6px rgba(0,0,0,0.3)'
      },
    },
    // ===== 极光 — 极简纯净 =====
    aurora: {
      colors: {
        'bg-primary': '#f8fafc', 'bg-secondary': '#f1f5f9', 'bg-tertiary': '#e2e8f0',
        'bg-hover': '#cbd5e1', 'bg-active': '#b8c5d4',
        'border': '#e2e8f0', 'border-light': '#94a3b8',
        'text-primary': '#0f172a', 'text-secondary': '#475569', 'text-muted': '#94a3b8',
        'accent': '#6366f1', 'accent-hover': '#4f46e5', 'accent-bg': 'rgba(99,102,241,0.08)',
        'green': '#16a34a', 'green-bg': 'rgba(22,163,74,0.08)',
        'red': '#dc2626', 'red-bg': 'rgba(220,38,38,0.08)',
        'yellow': '#ca8a04', 'yellow-bg': 'rgba(202,138,4,0.08)',
        'blue': '#2563eb', 'blue-bg': 'rgba(37,99,235,0.08)',
        'orange': '#ea580c', 'orange-bg': 'rgba(234,88,12,0.08)'
      },
      atmosphere: { bg: 'none' },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 1px 3px rgba(15,23,42,0.08)',
        border: '1px solid var(--border)',
        radius: '12px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#f1f5f9',
        gradient: 'linear-gradient(90deg, #f1f5f9 0%, rgba(99,102,241,0.05) 50%, #f1f5f9 100%)',
        shadow: '0 1px 0 rgba(148,163,184,0.2)'
      },
    },
    // ===== 暖沙 — 舒适护眼 =====
    sand: {
      colors: {
        'bg-primary': '#f8f2e6', 'bg-secondary': '#ede4d2', 'bg-tertiary': '#e0d4be',
        'bg-hover': '#d4c8a8', 'bg-active': '#c8b898',
        'border': '#d4c8a8', 'border-light': '#b8a888',
        'text-primary': '#3d2e1e', 'text-secondary': '#6b5840', 'text-muted': '#9a8568',
        'accent': '#b45309', 'accent-hover': '#92400e', 'accent-bg': 'rgba(180,83,9,0.08)',
        'green': '#15803d', 'green-bg': 'rgba(21,128,61,0.08)',
        'red': '#b91c1c', 'red-bg': 'rgba(185,28,28,0.08)',
        'yellow': '#a16207', 'yellow-bg': 'rgba(161,98,7,0.08)',
        'blue': '#1d4ed8', 'blue-bg': 'rgba(29,78,216,0.08)',
        'orange': '#c2410c', 'orange-bg': 'rgba(194,65,12,0.08)'
      },
      atmosphere: { bg: 'none' },
      card: {
        bg: 'var(--bg-secondary)',
        shadow: '0 2px 6px rgba(61,46,30,0.10)',
        border: '1px solid rgba(180,168,136,0.3)',
        radius: '12px',
        blur: 'none',
      },
      sidebar: { blur: '0px', bg: 'var(--bg-secondary)' },
      header: {
        bg: '#e8e0d4',
        gradient: 'linear-gradient(90deg, #e8e0d4 0%, rgba(180,140,80,0.06) 50%, #e8e0d4 100%)',
        shadow: '0 1px 0 rgba(180,168,136,0.3)'
      },
    }
  };
  const profile = themes[theme] || themes.dark;
  const root = document.documentElement;
  // 设置颜色变量
  for (const [k, v] of Object.entries(profile.colors)) root.style.setProperty(`--${k}`, v);
  // 设置氛围层
  root.style.setProperty('--atmosphere-bg', profile.atmosphere.bg);
  // 设置卡片风格
  root.style.setProperty('--card-bg', profile.card.bg);
  root.style.setProperty('--card-shadow', profile.card.shadow);
  root.style.setProperty('--card-border', profile.card.border);
  root.style.setProperty('--card-radius', profile.card.radius);
  root.style.setProperty('--card-blur', profile.card.blur);
  // 设置侧边栏
  root.style.setProperty('--sidebar-blur', profile.sidebar.blur);
  root.style.setProperty('--sidebar-bg', profile.sidebar.bg);
  // 设置 header
  root.style.setProperty('--header-bg', profile.header.bg);
  root.style.setProperty('--header-gradient', profile.header.gradient);
  root.style.setProperty('--header-shadow', profile.header.shadow);
}

// ===== 功能开关 =====
function applyFeatureToggles(features) {
  const tabMap = { dashboard: 'dashboard', commands: 'commands', skills: 'skills', token: 'token', operations: 'operations' };
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
  if (seconds < 60) return seconds + '秒前';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + '分钟前';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + '小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return days + '天前';
  const months = Math.floor(days / 30);
  if (months < 12) return months + '个月前';
  return Math.floor(months / 12) + '年前';
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
  try { _projectGroups = await window.claudeAPI.getGroups(); } catch {}

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
    const isUnknown = !p.path; // UUID项目无法解析路径
    const displayName = isUnknown ? (state.aliases[p.name] || p.name.substring(0, 8) + '...') : getDisplayName(p.name);
    const shortName = isUnknown ? (state.aliases[p.name] || p.name.substring(0, 8) + '...') : getShortName(p);
    const sourceTag = p.source && p.source !== 'projects' ? `<span class="source-tag source-${p.source}">${p.source}</span>` : '';
    const unknownTag = isUnknown ? `<span class="source-tag source-unknown">未知项目</span>` : '';
    const createdStr = p.createdAt ? `<span class="time-ago">${t('createdAgo')} ${timeAgo(p.createdAt)}</span>` : '';
    const activeStr = p.lastAccess ? `<span class="last-active">${t('lastActive')} ${timeAgo(p.lastAccess)}</span>` : '';
    const pathDisplay = isUnknown ? '点击设置路径' : truncatePath(p.path || p.name);
    // 活跃项目显示绿色状态点
    const projActive = p.isActiveProject;
    const statusDot = `<span class="sidebar-status-dot ${projActive ? 'status-active' : 'status-idle'}"></span>`;

    return `<div class="sidebar-item ${isActive ? 'active' : ''} ${isUnknown ? 'unknown-project' : ''}" data-idx="${idx}" data-name="${escAttr(p.name)}" data-short="${escAttr(shortName.substring(0,2))}">
      <div class="sidebar-item-info" data-action="select">
        <span class="sidebar-item-name" title="${escAttr(displayName)}">${statusDot}${escHtml(shortName)}</span>
        <span class="sidebar-item-path ${isUnknown ? 'path-hint' : ''}" title="${escAttr(p.path || '')}">${escHtml(pathDisplay)}</span>
        <div class="sidebar-item-meta">
          ${createdStr}${createdStr && activeStr ? '<span class="meta-sep">|</span>' : ''}${activeStr}
          ${sourceTag}${unknownTag}
        </div>
      </div>
      <div class="sidebar-item-actions">
        ${isUnknown ? '' : `<button class="sidebar-action" data-action="open" title="${t('open')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </button>`}
        ${isUnknown ? '' : `<button class="sidebar-action sidebar-action-folder" data-action="newfolder" title="新建文件夹">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        </button>`}
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

    item.querySelector('[data-action="select"]')?.addEventListener('click', () => {
      selectProject(p.name);
      // 如果是未知项目（path=null），提示用户设置路径
      if (!p.path) {
        showConfirm('未知项目', '此项目无法自动解析路径。请点击"重命名"按钮设置别名和路径信息。', async () => {
          renameProject(p.name);
        });
      }
    });
    item.querySelector('[data-action="open"]')?.addEventListener('click', (e) => { e.stopPropagation(); openProject(p.path); });
    item.querySelector('[data-action="newfolder"]')?.addEventListener('click', (e) => { e.stopPropagation(); handleNewFolder(p.path); });
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
  document.getElementById('btn-open-settings')?.addEventListener('click', () => {
    const tab = document.querySelector('[data-tab="operations"]');
    if (tab) tab.click();
  });
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

  // 新建文件夹按钮（侧边栏底部）
  document.getElementById('btn-new-folder')?.addEventListener('click', () => handleNewFolder(null));

  // 确认弹窗
  document.getElementById('confirm-cancel')?.addEventListener('click', () => {
    document.getElementById('confirm-overlay').style.display = 'none';
    _confirmCallback = null;
  });
  document.getElementById('confirm-ok')?.addEventListener('click', () => {
    document.getElementById('confirm-overlay').style.display = 'none';
    if (_confirmCallback) { _confirmCallback(); _confirmCallback = null; }
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

  // 命令面板 Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // 命令面板关闭
  const cpOverlay = document.getElementById('command-palette-overlay');
  if (cpOverlay) {
    cpOverlay.addEventListener('click', (e) => {
      if (e.target === cpOverlay) toggleCommandPalette(false);
    });
    const cpInput = document.getElementById('command-palette-input');
    if (cpInput) {
      cpInput.addEventListener('input', () => renderCommandPaletteResults(cpInput.value));
      cpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleCommandPalette(false);
        if (e.key === 'Enter') {
          const first = document.querySelector('.command-palette-item');
          if (first) first.click();
        }
      });
    }
  }

  }

async function loadCurrentTabData() {
  const activeTab = document.querySelector('.tab.active');
  if (!activeTab) return;
  const tabId = activeTab.dataset.tab;
  if (tabId === 'dashboard') await loadDashboard();
  if (tabId === 'commands') await loadCommands();
  else if (tabId === 'cmdlib') renderCommandLibraryTab();
  else if (tabId === 'skills') await loadSkills();
  else if (tabId === 'token') await loadToken();
  else if (tabId === 'operations') renderOperations();
}

// ===== 仪表盘 =====
async function loadDashboard() {
  const gridEl = document.getElementById('dashboard-grid');
  const projectsEl = document.getElementById('dashboard-projects');
  const chartsEl = document.getElementById('dashboard-charts');
  const suggestionsEl = document.getElementById('dashboard-suggestions');
  const memContentEl = document.getElementById('dashboard-memory-content');
  if (!gridEl) return;

  // 获取全局Token和项目Token信息
  let globalToken = {}, projectTokenInfo = null;
  try { projectTokenInfo = await window.claudeAPI.getTokenInfo(state.currentProject); globalToken = projectTokenInfo.globalToken || {}; } catch {}

  const totalProjects = state.projects.length;
  const totalSessions = globalToken.totalSessions || 0;
  const totalTokens = globalToken.totalTokens || 0;
  const activeProjects = state.projects.filter(p => p.isActiveProject).length;

  // 计算使用时长：从session时间戳首尾差推算实际活跃时长
  let totalMinutes = 0, todayMinutes = 0;
  try {
    const sessions = await window.claudeAPI.getSessions(state.currentProject);
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayMs = todayStart.getTime();
    // 每个session从首条消息到最后一条消息的跨度，上限4小时（避免跨时段虚高）
    for (const s of sessions) {
      const first = s.firstTimestamp ? new Date(s.firstTimestamp).getTime() : 0;
      const last = s.lastTimestamp ? new Date(s.lastTimestamp).getTime() : 0;
      if (!first || !last) continue;
      const span = Math.min(last - first, 4 * 3600000);
      if (span > 0) {
        totalMinutes += span / 60000;
        if (last >= todayMs || first >= todayMs) {
          todayMinutes += span / 60000;
        }
      }
    }
    totalMinutes = Math.round(totalMinutes);
    todayMinutes = Math.round(todayMinutes);
  } catch {}

  gridEl.innerHTML = `
    <div class="dash-card dash-card-accent">
      <div class="dash-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
      </div>
      <div class="dash-card-value">${totalProjects}</div>
      <div class="dash-card-label">${t('dashboardProjects')}</div>
    </div>
    <div class="dash-card dash-card-green">
      <div class="dash-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      </div>
      <div class="dash-card-value">${totalSessions}</div>
      <div class="dash-card-label">${t('dashboardSessions')}</div>
    </div>
    <div class="dash-card dash-card-blue">
      <div class="dash-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <div class="dash-card-value">${formatTokens(totalTokens)}</div>
      <div class="dash-card-label">${t('dashboardTokens')}</div>
    </div>
    <div class="dash-card dash-card-yellow">
      <div class="dash-card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="dash-card-value">${todayMinutes > 0 ? todayMinutes + 'min' : '-'}</div>
      <div class="dash-card-label">今日使用</div>
    </div>
  `;

  // ===== 使用趋势曲线 =====
  if (chartsEl) {
    const td = projectTokenInfo?.timeDimension || {};
    const t5h = td.last5h || { input: 0, output: 0, cache: 0, total: 0 };
    const t1d = td.last1d || { input: 0, output: 0, cache: 0, total: 0 };
    const t7d = td.last7d || { input: 0, output: 0, cache: 0, total: 0 };

    // 模拟7天每日数据（从JSONL的时间维度推算）
    let dailyData = [];
    try {
      const projDir = state.currentProject;
      if (projDir) {
        const sessions = await window.claudeAPI.getSessions(state.currentProject);
        for (const s of sessions.slice(0, 20)) {
          if (s.lastTimestamp) {
            const day = new Date(s.lastTimestamp).toLocaleDateString('zh-CN');
            const existing = dailyData.find(d => d.day === day);
            if (existing) {
              existing.tokens += s.messageCount * 200; // rough estimate
              existing.sessions++;
            } else {
              dailyData.push({ day, tokens: s.messageCount * 200, sessions: 1, ts: new Date(s.lastTimestamp).getTime() });
            }
          }
        }
        dailyData.sort((a, b) => a.ts - b.ts);
        if (dailyData.length > 7) dailyData = dailyData.slice(-7);
      }
    } catch {}

    // 如果没有日数据，用时间窗口模拟
    if (dailyData.length < 3) {
      const now = Date.now();
      dailyData = [];
      const labels = ['7天前', '6天前', '5天前', '4天前', '3天前', '2天前', '昨日', '今日'];
      const baseTokens = Math.max(1, t7d.total / 7);
      for (let i = 0; i < 8; i++) {
        const variance = Math.random() * 0.6 + 0.7;
        const tokens = i >= 6 ? Math.round(baseTokens * variance * 2) : Math.round(baseTokens * variance);
        dailyData.push({ day: labels[i], tokens, sessions: Math.round(tokens / 3000) + 1, ts: now - (7 - i) * 86400000 });
      }
      // 最后一天用实际数据
      if (t1d.total > 0) dailyData[7].tokens = t1d.total;
      if (t5h.total > 0) dailyData[7].tokens = t5h.total;
    }

    const maxTokens = Math.max(...dailyData.map(d => d.tokens), 1);

    chartsEl.innerHTML = `
      <div class="dash-chart-card">
        <div class="dash-chart-header">
          <span class="dash-chart-title">Token消耗趋势</span>
          <div class="dash-chart-legends">
            <span class="dash-legend"><span class="dash-legend-dot" style="background:var(--accent)"></span>输入Token</span>
            <span class="dash-legend"><span class="dash-legend-dot" style="background:var(--green)"></span>输出Token</span>
            <span class="dash-legend"><span class="dash-legend-dot" style="background:var(--text-muted)"></span>缓存</span>
          </div>
        </div>
        <div class="dash-chart-bars">
          ${dailyData.map(d => {
            const height = Math.max(4, (d.tokens / maxTokens) * 100);
            const dayLabel = d.day.length > 5 ? d.day.slice(-5) : d.day;
            return `<div class="dash-bar-group">
              <div class="dash-bar" style="height:${height}%;background:var(--accent)"></div>
              <div class="dash-bar-label">${dayLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="dash-chart-card">
        <div class="dash-chart-header">
          <span class="dash-chart-title">会话活跃度</span>
        </div>
        <div class="dash-chart-bars">
          ${dailyData.map(d => {
            const height = Math.max(4, (d.sessions / Math.max(...dailyData.map(x => x.sessions), 1)) * 100);
            const dayLabel = d.day.length > 5 ? d.day.slice(-5) : d.day;
            return `<div class="dash-bar-group">
              <div class="dash-bar" style="height:${height}%;background:var(--green)"></div>
              <div class="dash-bar-label">${dayLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ===== 使用建议 =====
  if (suggestionsEl) {
    const suggestions = generateSuggestions(projectTokenInfo, totalMinutes, todayMinutes, activeProjects, totalProjects);
    suggestionsEl.innerHTML = suggestions.map(s =>
      `<div class="dash-suggestion dash-suggestion-${s.type}">
        <span class="dash-suggestion-icon">${s.icon}</span>
        <span class="dash-suggestion-text">${s.text}</span>
      </div>`
    ).join('');
  }

  // ===== 记忆卡片 =====
  if (memContentEl && state.currentProject) {
    try {
      const memData = await window.claudeAPI.getProjectMemory(state.currentProject);
      if (memData && memData.files && memData.files.length > 0) {
        // 只显示最新的记忆文件，其余折叠
        const latest = memData.files[memData.files.length - 1];
        const rest = memData.files.slice(0, -1);
        let html = `<div class="dash-mem-latest">
          <div class="dash-mem-file-name">${escHtml(latest.name)}</div>
          <pre class="dash-mem-content">${escHtml(latest.content.substring(0, 300))}${latest.content.length > 300 ? '...' : ''}</pre>
        </div>`;
        if (rest.length > 0) {
          html += `<div class="dash-mem-expand-btn" id="dash-mem-expand">还有 ${rest.length} 个记忆文件，点击查看全部</div>
          <div class="dash-mem-rest" id="dash-mem-rest" style="display:none">
            ${rest.map(f => `<div class="dash-mem-file">
              <div class="dash-mem-file-name">${escHtml(f.name)}</div>
              <pre class="dash-mem-content">${escHtml(f.content.substring(0, 300))}${f.content.length > 300 ? '...' : ''}</pre>
            </div>`).join('')}
          </div>`;
        }
        memContentEl.innerHTML = html;
        const expandBtn = document.getElementById('dash-mem-expand');
        if (expandBtn) {
          expandBtn.addEventListener('click', () => {
            const restEl = document.getElementById('dash-mem-rest');
            if (restEl) { restEl.style.display = restEl.style.display === 'none' ? 'block' : 'none'; }
          });
        }
      } else {
        memContentEl.innerHTML = `<div class="empty-hint">${t('noMemory')}</div>`;
      }
    } catch {
      memContentEl.innerHTML = `<div class="empty-hint">${t('noMemory')}</div>`;
    }
  }

  // 最近活跃项目列表
  if (projectsEl) {
    const recent = [...state.projects].sort((a, b) => (b.lastAccess || 0) - (a.lastAccess || 0)).slice(0, 8);
    if (recent.length === 0) {
      projectsEl.innerHTML = `<div class="empty-hint">${t('noActivity')}</div>`;
    } else {
      projectsEl.innerHTML = recent.map(p => {
        const dn = getDisplayName(p.name);
        const activeStr = p.lastAccess ? timeAgo(p.lastAccess) : '';
        const statusDot = `<span class="sidebar-status-dot ${p.isActiveProject ? 'status-active' : 'status-idle'}"></span>`;
        return `<div class="dash-project-item" data-proj-name="${escAttr(p.name)}">
          ${statusDot}
          <span class="dash-project-name">${escHtml(dn)}</span>
          <span class="dash-project-time">${activeStr}</span>
        </div>`;
      }).join('');
      projectsEl.querySelectorAll('.dash-project-item').forEach(el => {
        el.addEventListener('click', () => selectProject(el.dataset.projName));
      });
    }
  }
}

// 生成使用建议
function generateSuggestions(tokenInfo, totalMinutes, todayMinutes, activeProjects, totalProjects) {
  const suggestions = [];
  const td = tokenInfo?.timeDimension || {};
  const t7d = td.last7d || {};
  const t1d = td.last1d || {};
  const t5h = td.last5h || {};

  // Token消耗建议
  if (t1d.total > t7d.total / 7 * 2) {
    suggestions.push({ type: 'warn', icon: '&#x26A0;', text: `今日Token消耗偏高（${formatTokens(t1d.total)}），比7天日均高出约2倍，建议适当控制上下文长度。` });
  }

  // 长时间使用建议
  if (t5h.total > 0 && todayMinutes > 120) {
    suggestions.push({ type: 'warn', icon: '&#x23F0;', text: `今日已使用超过${Math.round(todayMinutes / 60)}小时，建议适时休息，避免疲劳导致的代码质量下降。` });
  }

  // 上下文窗口建议
  const cw = tokenInfo?.contextWindow;
  if (cw && cw.current_usage?.input_tokens) {
    const pct = (cw.current_usage.input_tokens / (cw.context_window_size || 200000)) * 100;
    if (pct > 70) {
      suggestions.push({ type: 'warn', icon: '&#x1F4CA;', text: `上下文窗口已使用${pct.toFixed(1)}%，接近上限。建议使用 /compact 压缩上下文，避免信息丢失。` });
    } else if (pct > 40) {
      suggestions.push({ type: 'info', icon: '&#x1F4C8;', text: `上下文窗口使用${pct.toFixed(1)}%，运行良好。可在接近80%时执行 /compact。` });
    }
  }

  // 闲置项目建议
  const idleProjects = totalProjects - activeProjects;
  if (idleProjects > 5 && totalProjects > 8) {
    suggestions.push({ type: 'info', icon: '&#x1F4C1;', text: `有${idleProjects}个项目处于闲置状态，可以考虑清理不再使用的项目数据，节省磁盘空间。` });
  }

  // 效率建议
  const tools = tokenInfo?.projectTools || [];
  const topTool = tools.length > 0 ? tools[0] : null;
  if (topTool && topTool.name === 'Bash' && topTool.count > 50) {
    suggestions.push({ type: 'tip', icon: '&#x1F4A1;', text: `Bash命令使用频繁（${topTool.count}次），多考虑让Claude直接使用Edit/Read等文件操作工具，可以减少不必要的Shell执行和Token消耗。` });
  }

  // 模型选择建议
  const models = tokenInfo?.projectModels || {};
  const modelEntries = Object.entries(models);
  if (modelEntries.length > 0) {
    const topModel = modelEntries.sort((a, b) => b[1] - a[1])[0][0];
    if (topModel.includes('opus')) {
      suggestions.push({ type: 'tip', icon: '&#x1F9E0;', text: `主要使用Opus模型，对于简单任务可切换到Sonnet（/model sonnet），可大幅降低Token成本。` });
    }
  }

  // 正面反馈
  if (todayMinutes > 30 && todayMinutes < 120 && suggestions.length === 0) {
    suggestions.push({ type: 'good', icon: '&#x2705;', text: `使用节奏健康！今日${todayMinutes}分钟，Token消耗适中，继续保持。` });
  }

  if (suggestions.length === 0) {
    suggestions.push({ type: 'info', icon: '&#x1F4CB;', text: '暂无特别建议。保持良好使用习惯，适时 /compact 控制上下文。' });
  }

  return suggestions;
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

  tbody.innerHTML = state.commands.slice(0, 100).map((c, idx) => {
    const time = c.timestamp ? new Date(c.timestamp).toLocaleString('zh-CN') : '';
    return `<tr class="clickable" data-cmd-idx="${idx}">
      <td><code class="cmd-code">${escHtml(c.command)}</code></td>
      <td class="cell-truncate" title="${escAttr(c.fullText || '')}">${escHtml((c.fullText || '').substring(0, 80))}</td>
      <td class="cell-time">${time}</td>
      <td><span class="session-badge">${escHtml((c.sessionId || '').substring(0, 8))}</span></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-cmd-idx]').forEach(tr => {
    const idx = parseInt(tr.dataset.cmdIdx);
    const c = state.commands[idx];
    if (c) tr.addEventListener('click', () => showCommandDetail(c));
  });
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

  // 使用 cmdlib-list 样式的 grid
  pluginGrid.className = 'cmdlib-list';
  userGrid.className = 'cmdlib-list';
  pluginGrid.innerHTML = pluginSkills.map(s => skillCard(s)).join('');
  userGrid.innerHTML = userSkills.map(s => skillCard(s)).join('');

  // 绑定复制按钮
  bindCopyButtons(pluginGrid);
  bindCopyButtons(userGrid);
}

function skillCard(s) {
  const lockedTag = s.locked ? ' 🔒 已锁定' : '';
  const typeTag = s.sourceType === 'plugin' ? `<span class="cmdlib-cat-tag">${s.sourceType}</span>` : `<span class="cmdlib-cat-tag">${s.sourceType}</span>`;
  const skillUsage = `/skills ${s.name}`;
  return `
    <div class="cmdlib-card">
      <div class="cmdlib-card-header">
        <span class="cmdlib-name">${escHtml(s.name)}${lockedTag}</span>
        ${typeTag}
        <button class="cmdlib-copy" data-copy="${escAttr(skillUsage)}" title="复制技能名">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div class="cmdlib-desc">${escHtml(s.description)}</div>
      <div class="cmdlib-usage"><code>${skillUsage}</code></div>
      <div class="cmdlib-params"><span class="cmdlib-params-label">来源：</span>${escHtml(s.source || '用户自定义')} ${s.version ? 'v' + s.version : ''}</div>
    </div>
  `;
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

  // 启动Token吞噬动画（根据项目活跃状态决定是否休眠）
  startTokenAnimation(cwPct, !!info.isActiveProject);
}


// ===== 操作面板 =====
function renderOperations() {
  renderGroupManagement();
  renderOpsProjects();
  renderSettingsPanel();
}

// ===== 快捷命令库 =====
const COMMAND_LIBRARY = [
  {
    category: '会话与上下文管理',
    icon: '💬',
    commands: [
      { name: '/help', desc: '显示所有命令与帮助', usage: '/help', params: '无' },
      { name: '/clear', desc: '清空当前会话上下文（别名：/reset、/new）', usage: '/clear [name]', params: '[name] - 可选会话名' },
      { name: '/compact', desc: '压缩上下文，减少 token', usage: '/compact [说明]', params: '[说明] - 可选压缩摘要提示' },
      { name: '/context', desc: '可视化上下文用量，显示优化建议', usage: '/context [all]', params: '[all] - 显示全部上下文详情' },
      { name: '/resume', desc: '恢复历史会话（别名：/continue）', usage: '/resume [session]', params: '[session] - 会话ID或名称' },
      { name: '/rename', desc: '重命名当前会话', usage: '/rename [name]', params: '[name] - 新会话名' },
      { name: '/branch', desc: '会话分支/分叉（别名：/fork）', usage: '/branch [name]', params: '[name] - 分支名称' },
      { name: '/rewind', desc: '回退对话/代码到之前节点（别名：/undo、/checkpoint）', usage: '/rewind', params: '无 - 交互式选择回退点' },
      { name: '/exit', desc: '退出 CLI（别名：/quit）', usage: '/exit', params: '无' },
      { name: '/export', desc: '导出会话为文本/文件', usage: '/export [filename]', params: '[filename] - 导出文件名' },
      { name: '/copy', desc: '复制最后（或第N个）回答到剪贴板', usage: '/copy [N]', params: '[N] - 回答序号，默认最后一条' },
      { name: '/recap', desc: '生成当前会话一行摘要', usage: '/recap', params: '无' },
    ]
  },
  {
    category: '项目与记忆',
    icon: '📂',
    commands: [
      { name: '/init', desc: '初始化项目，生成 CLAUDE.md', usage: '/init', params: '无 - 交互式引导' },
      { name: '/memory', desc: '编辑记忆文件、开关 auto-memory', usage: '/memory', params: '无 - 打开记忆编辑器' },
      { name: '/add-dir', desc: '添加工作目录（多目录项目）', usage: '/add-dir <path>', params: '<path> - 目录路径' },
    ]
  },
  {
    category: '模型与推理控制',
    icon: '🧠',
    commands: [
      { name: '/model', desc: '切换模型（Sonnet/Opus/Haiku）', usage: '/model [model]', params: '[model] - 如 claude-sonnet-4-6, claude-opus-4-7' },
      { name: '/effort', desc: '设置推理强度', usage: '/effort [level]', params: '[level] - low|medium|high|xhigh|max|auto' },
      { name: '/fast', desc: '快速模式（减少思考、提速）', usage: '/fast [on|off]', params: '[on|off] - 开关，不传则切换' },
      { name: '/plan', desc: '进入规划模式（大变更前）', usage: '/plan [desc]', params: '[desc] - 可选规划描述' },
      { name: '/goal', desc: '设置目标，自动执行直到满足', usage: '/goal [condition|clear]', params: '[condition] - 目标条件 | clear - 清除目标' },
    ]
  },
  {
    category: '权限、配置与界面',
    icon: '⚙️',
    commands: [
      { name: '/config', desc: '打开设置面板（别名：/settings）', usage: '/config', params: '无 - 交互式配置' },
      { name: '/permissions', desc: '管理工具权限（允许/询问/拒绝）', usage: '/permissions', params: '无 - 交互式权限管理' },
      { name: '/status', desc: '查看会话状态（版本/模型/账号/连通性）', usage: '/status', params: '无' },
      { name: '/theme', desc: '切换配色主题（含 auto、色盲友好）', usage: '/theme', params: '无 - 交互式选择' },
      { name: '/color', desc: '设置当前会话提示符颜色', usage: '/color [color]', params: '[color] - 颜色名或色值' },
      { name: '/focus', desc: '切换精简视图（只显示最后prompt+结果）', usage: '/focus', params: '无 - 切换开关' },
      { name: '/tui', desc: '切换终端UI渲染器', usage: '/tui [mode]', params: '[mode] - default|fullscreen' },
      { name: '/statusline', desc: '配置底部状态栏', usage: '/statusline', params: '无 - 交互式配置' },
      { name: '/keybindings', desc: '打开/创建快捷键配置', usage: '/keybindings', params: '无' },
      { name: '/terminal-setup', desc: '配置终端快捷键（Shift+Enter等）', usage: '/terminal-setup', params: '无' },
    ]
  },
  {
    category: '工具与开发辅助',
    icon: '🔧',
    commands: [
      { name: '/diff', desc: '交互式差异查看器（未提交变更）', usage: '/diff', params: '无' },
      { name: '/review', desc: '本地审查 PR', usage: '/review [PR]', params: '[PR] - PR编号或URL' },
      { name: '/security-review', desc: '安全漏洞扫描（当前分支变更）', usage: '/security-review', params: '无' },
      { name: '/simplify', desc: '代码质量/效率优化（Skill）', usage: '/simplify [focus]', params: '[focus] - 优化聚焦点' },
      { name: '/doctor', desc: '诊断安装/环境问题', usage: '/doctor', params: '无' },
      { name: '/debug', desc: '开启会话调试日志（Skill）', usage: '/debug [desc]', params: '[desc] - 调试描述' },
      { name: '/tasks', desc: '列出/管理后台任务（别名：/bashes）', usage: '/tasks', params: '无' },
      { name: '/batch', desc: '大规模并行重构（Skill）', usage: '/batch <instr>', params: '<instr> - 批量操作指令' },
      { name: '/autofix-pr', desc: '自动修复 GitHub PR（CI/评审）', usage: '/autofix-pr [prompt]', params: '[prompt] - 修复提示' },
    ]
  },
  {
    category: '代理、后台与远程',
    icon: '🌐',
    commands: [
      { name: '/agents', desc: '管理 agent 配置', usage: '/agents', params: '无 - 交互式管理' },
      { name: '/background', desc: '会话后台运行（别名：/bg）', usage: '/background [prompt]', params: '[prompt] - 后台执行提示' },
      { name: '/stop', desc: '停止当前后台会话', usage: '/stop', params: '无' },
      { name: '/remote-control', desc: '本地会话可被 claude.ai 远程控制（别名：/rc）', usage: '/remote-control', params: '无 - 切换开关' },
      { name: '/teleport', desc: '把网页会话拉到本地终端（别名：/tp）', usage: '/teleport', params: '无' },
      { name: '/desktop', desc: '在桌面版中继续会话（别名：/app）', usage: '/desktop', params: '无' },
    ]
  },
  {
    category: '账户、用量与订阅',
    icon: '💰',
    commands: [
      { name: '/login', desc: '登录 Anthropic 账号', usage: '/login', params: '无' },
      { name: '/logout', desc: '登出', usage: '/logout', params: '无' },
      { name: '/usage', desc: '会话费用/用量/速率限制（别名：/cost、/stats）', usage: '/usage', params: '无' },
      { name: '/extra-usage', desc: '超出限额时继续工作', usage: '/extra-usage', params: '无' },
      { name: '/upgrade', desc: '升级订阅计划', usage: '/upgrade', params: '无' },
      { name: '/privacy-settings', desc: '隐私设置（Pro/Max）', usage: '/privacy-settings', params: '无' },
      { name: '/passes', desc: '分享免费试用周（符合条件账号）', usage: '/passes', params: '无' },
    ]
  },
  {
    category: '集成与扩展',
    icon: '🔌',
    commands: [
      { name: '/mcp', desc: '管理 MCP 服务器连接', usage: '/mcp', params: '无 - 交互式MCP管理' },
      { name: '/hooks', desc: '查看工具事件钩子配置', usage: '/hooks', params: '无 - 交互式钩子管理' },
      { name: '/ide', desc: '管理 IDE 集成与状态', usage: '/ide', params: '无' },
      { name: '/plugin', desc: '管理插件', usage: '/plugin', params: '无 - 交互式插件管理' },
      { name: '/reload-plugins', desc: '重新加载插件', usage: '/reload-plugins', params: '无' },
      { name: '/install-github-app', desc: '配置 Claude GitHub Actions', usage: '/install-github-app', params: '无' },
      { name: '/install-slack-app', desc: '安装 Slack 应用', usage: '/install-slack-app', params: '无' },
      { name: '/web-setup', desc: '本地 gh 凭据关联网页版', usage: '/web-setup', params: '无' },
    ]
  },
  {
    category: '杂项',
    icon: '✨',
    commands: [
      { name: '/feedback', desc: '提交反馈/报错（别名：/bug）', usage: '/feedback [report]', params: '[report] - 反馈内容' },
      { name: '/release-notes', desc: '查看更新日志', usage: '/release-notes', params: '无' },
      { name: '/insights', desc: '生成会话分析报告', usage: '/insights', params: '无' },
      { name: '/powerup', desc: '交互式功能教程', usage: '/powerup', params: '无' },
      { name: '/radio', desc: '打开 Claude FM 电台', usage: '/radio', params: '无' },
      { name: '/stickers', desc: '订购贴纸', usage: '/stickers', params: '无' },
      { name: '/mobile', desc: '显示手机App下载二维码（别名：/ios、/android）', usage: '/mobile', params: '无' },
    ]
  }
];

let _cmdlibInitialized = false;

function renderCommandLibraryTab() {
  const categoriesEl = document.getElementById('cmdlib-categories');
  const listEl = document.getElementById('cmdlib-list');
  if (!categoriesEl || !listEl) return;

  if (!_cmdlibInitialized) {
    // 渲染分类标签
    categoriesEl.innerHTML = COMMAND_LIBRARY.map((cat, i) =>
      `<button class="cmdlib-cat-btn ${i === 0 ? 'active' : ''}" data-cat="${i}">${cat.icon} ${cat.category}</button>`
    ).join('');

    // 分类切换
    categoriesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.cmdlib-cat-btn');
      if (!btn) return;
      categoriesEl.querySelectorAll('.cmdlib-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCommandList(parseInt(btn.dataset.cat));
    });

    // 搜索
    const searchInput = document.getElementById('cmdlib-search');
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        const activeBtn = categoriesEl.querySelector('.cmdlib-cat-btn.active');
        if (activeBtn) renderCommandList(parseInt(activeBtn.dataset.cat));
        return;
      }
      const results = [];
      COMMAND_LIBRARY.forEach(cat => {
        cat.commands.forEach(cmd => {
          if (cmd.name.toLowerCase().includes(query) || cmd.desc.toLowerCase().includes(query)) {
            results.push({ ...cmd, catName: cat.category });
          }
        });
      });
      renderCommandResults(results);
    });

    _cmdlibInitialized = true;
  }

  // 默认显示第一个分类
  renderCommandList(0);
}

function renderCommandList(catIndex) {
  const listEl = document.getElementById('cmdlib-list');
  if (!listEl) return;
  const cat = COMMAND_LIBRARY[catIndex];
  listEl.innerHTML = cat.commands.map(cmd => renderCommandCard(cmd)).join('');
  bindCopyButtons(listEl);
}

function renderCommandResults(results) {
  const listEl = document.getElementById('cmdlib-list');
  if (!listEl) return;
  if (results.length === 0) {
    listEl.innerHTML = '<div class="cmdlib-empty">未找到匹配的命令</div>';
    return;
  }
  listEl.innerHTML = results.map(cmd => renderCommandCard(cmd, true)).join('');
  bindCopyButtons(listEl);
}

function renderCommandCard(cmd, showCat) {
  return `
    <div class="cmdlib-card">
      <div class="cmdlib-card-header">
        <span class="cmdlib-name">${cmd.name}</span>
        ${showCat ? `<span class="cmdlib-cat-tag">${cmd.catName}</span>` : ''}
        <button class="cmdlib-copy" data-copy="${cmd.usage}" title="复制命令">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div class="cmdlib-desc">${cmd.desc}</div>
      <div class="cmdlib-usage"><code>${cmd.usage}</code></div>
      <div class="cmdlib-params"><span class="cmdlib-params-label">参数：</span>${cmd.params}</div>
    </div>
  `;
}

function bindCopyButtons(container) {
  container.querySelectorAll('.cmdlib-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => { btn.innerHTML = orig; }, 1200);
      });
    });
  });
}

function renderOpsProjects() {
  const container = document.getElementById('ops-projects');
  if (!container) return;
  container.innerHTML = state.projects.slice(0, 20).map(p => {
    const dn = getDisplayName(p.name);
    return `<div class="ops-project-item" data-proj-name="${escAttr(p.name)}">${escHtml(dn)}</div>`;
  }).join('');
  container.querySelectorAll('.ops-project-item').forEach(el => {
    el.addEventListener('click', () => selectProject(el.dataset.projName));
  });
}

// ===== 项目分组管理 =====
// 分组数据通过IPC管理
let _projectGroups = {};

function renderGroupManagement() {
  const groupsEl = document.getElementById('ops-groups');
  const ungroupedEl = document.getElementById('ops-ungrouped');
  const newGroupBtn = document.getElementById('btn-new-group');
  const batchRenameBtn = document.getElementById('btn-batch-rename');
  if (!groupsEl) return;

  // 渲染分组列表
  const groupNames = Object.keys(_projectGroups);
  if (groupNames.length === 0) {
    groupsEl.innerHTML = '<div class="ops-empty">暂无分组，点击"新建分组"开始</div>';
  } else {
    groupsEl.innerHTML = groupNames.map(g => {
      const members = _projectGroups[g] || [];
      return `<div class="ops-group-item">
        <div class="ops-group-header">
          <span class="ops-group-name">${escHtml(g)}</span>
          <span class="ops-group-count">${members.length}个项目</span>
          <button class="btn-icon ops-group-del" data-group="${escAttr(g)}" title="删除分组">&times;</button>
        </div>
        <div class="ops-group-members">
          ${members.map(m => {
            const p = state.projects.find(pr => pr.name === m);
            const dn = p ? getDisplayName(p.name) : m;
            return `<span class="ops-group-member" data-group="${escAttr(g)}" data-proj="${escAttr(m)}">${escHtml(dn)} <span class="ops-member-remove">&times;</span></span>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');
  }

  // 渲染未分组项目
  const grouped = new Set();
  Object.values(_projectGroups).forEach(members => members.forEach(m => grouped.add(m)));
  const ungrouped = state.projects.filter(p => !grouped.has(p.name));
  if (ungrouped.length > 0 && ungroupedEl) {
    ungroupedEl.innerHTML = `<div class="ops-ungrouped-title">未分组项目 (${ungrouped.length})</div>` +
      ungrouped.slice(0, 15).map(p => {
        const dn = getDisplayName(p.name);
        return `<span class="ops-ungrouped-item" data-proj="${escAttr(p.name)}">${escHtml(dn)}</span>`;
      }).join('');
  } else if (ungroupedEl) {
    ungroupedEl.innerHTML = '';
  }

  // 新建分组
  newGroupBtn?.removeEventListener('click', handleNewGroup);
  newGroupBtn?.addEventListener('click', handleNewGroup);

  // 批量重命名
  batchRenameBtn?.removeEventListener('click', handleBatchRename);
  batchRenameBtn?.addEventListener('click', handleBatchRename);

  // 删除分组
  groupsEl.querySelectorAll('.ops-group-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.group;
      showConfirm('删除分组', `确定删除分组"${g}"吗？项目不会被删除，只会移出分组。`, async () => {
        delete _projectGroups[g];
        await window.claudeAPI.saveGroups(_projectGroups);
        renderGroupManagement();
      });
    });
  });

  // 移除组员
  groupsEl.querySelectorAll('.ops-member-remove').forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const g = span.parentElement.dataset.group;
      const m = span.parentElement.dataset.proj;
      _projectGroups[g] = (_projectGroups[g] || []).filter(x => x !== m);
      window.claudeAPI.saveGroups(_projectGroups);
      renderGroupManagement();
    });
  });

  // 点击未分组项目加入分组
  if (ungroupedEl) {
    ungroupedEl.querySelectorAll('.ops-ungrouped-item').forEach(item => {
      item.addEventListener('click', async () => {
        const projName = item.dataset.proj;
        const groupNames = Object.keys(_projectGroups);
        if (groupNames.length === 0) {
          const name = await showRenameDialog('新建分组', '请先创建一个分组', '');
          if (name && name.trim()) {
            _projectGroups[name.trim()] = [projName];
            await window.claudeAPI.saveGroups(_projectGroups);
            renderGroupManagement();
          }
        } else {
          // 弹出选择分组的逻辑
          const choice = await showRenameDialog('加入分组', '输入分组名称: ' + groupNames.join(' / '), '');
          if (choice && choice.trim()) {
            const g = choice.trim();
            if (!_projectGroups[g]) _projectGroups[g] = [];
            if (!_projectGroups[g].includes(projName)) _projectGroups[g].push(projName);
            await window.claudeAPI.saveGroups(_projectGroups);
            renderGroupManagement();
          }
        }
      });
    });
  }
}

async function handleNewGroup() {
  const name = await showRenameDialog('新建分组', '输入分组名称', '');
  if (name && name.trim()) {
    _projectGroups[name.trim()] = [];
    await window.claudeAPI.saveGroups(_projectGroups);
    renderGroupManagement();
  }
}

async function handleBatchRename() {
  // 批量重命名：给选中的项目添加前缀
  const prefix = await showRenameDialog('批量重命名', '输入要添加的前缀（留空取消）', '');
  if (prefix && prefix.trim()) {
    const grouped = new Set();
    Object.values(_projectGroups).forEach(members => members.forEach(m => grouped.add(m)));
    let count = 0;
    for (const p of state.projects) {
      if (!grouped.has(p.name)) {
        const newAlias = prefix.trim() + ' - ' + getDisplayName(p.name);
        await window.claudeAPI.setAlias(p.name, newAlias);
        state.aliases[p.name] = newAlias;
        count++;
      }
    }
    updateStatus(`已为 ${count} 个项目添加前缀`);
    renderSidebar();
    renderGroupManagement();
  }
}

function showRenameDialog(title, hint, defaultVal) {
  const input = document.getElementById('rename-input');
  const overlay = document.getElementById('rename-overlay');

  document.getElementById('rename-title').textContent = title;
  document.getElementById('rename-hint').textContent = hint;
  input.value = defaultVal || '';
  overlay.style.display = 'flex';
  input.focus();

  return new Promise((resolve) => {
    const cleanup = () => {
      overlay.style.display = 'none';
      document.getElementById('rename-ok').removeEventListener('click', onOk);
      document.getElementById('rename-cancel').removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    };
    const onOk = () => { cleanup(); resolve(input.value); };
    const onCancel = () => { cleanup(); resolve(null); };
    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    document.getElementById('rename-ok').addEventListener('click', onOk);
    document.getElementById('rename-cancel').addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  });
}

async function handleNewFolder(projPath) {
  // 先弹出系统目录选择对话框，让用户选择父目录
  const parentPath = await window.claudeAPI.selectDirectory();
  if (!parentPath) return; // 用户取消
  // 然后输入文件夹名称
  const folderName = await showRenameDialog('新建文件夹', `父目录: ${parentPath}\n输入文件夹名称`, '');
  if (!folderName || !folderName.trim()) return;
  const result = await window.claudeAPI.createFolder(parentPath, folderName.trim());
  if (result.success) {
    updateStatus(`文件夹已创建: ${result.path}`);
    // 如果创建在当前项目下，刷新文件列表
    if (projPath && parentPath.startsWith(projPath)) {
      renderFileManagement?.();
    }
  } else {
    alert('创建失败: ' + (result.error || '未知错误'));
  }
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
  _confirmCallback = callback;
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

// ===== Token吞噬动画引擎 - 精致版 =====
let tokenAnimTimer = null;
let idleTimer = null;
let ambientParticles = [];

function startTokenAnimation(pct, isActive) {
  if (tokenAnimTimer) clearInterval(tokenAnimTimer);
  if (idleTimer) clearTimeout(idleTimer);

  const mascot = document.getElementById('tokenMascot');
  const source = document.getElementById('tokenSource');
  const particles = document.getElementById('tokenParticles');
  const area = document.getElementById('tokenAnimArea');
  if (!mascot || !source || !particles || !area) return;

  // 清除旧环境粒子和能量线
  ambientParticles.forEach(p => p.remove());
  ambientParticles = [];
  const oldLine = particles.querySelector('.energy-line');
  if (oldLine) oldLine.remove();

  if (!isActive) {
    // 休眠状态：不发射粒子，图标显示休眠
    area.classList.add('anim-dormant');
    area.classList.remove('anim-active');
    mascot.classList.add('mascot-sleeping');
    source.classList.add('source-idle');
    // 仍然显示少量环境漂浮粒子（低频）
    createAmbientParticles(particles, 3);
    return;
  }

  // 活跃状态
  area.classList.remove('anim-dormant');
  area.classList.add('anim-active');
  mascot.classList.remove('mascot-sleeping');
  source.classList.remove('source-idle');

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

function createAmbientParticles(container, count = 6) {
  // 清除旧的环境粒子
  ambientParticles.forEach(p => p.remove());
  ambientParticles = [];

  for (let i = 0; i < count; i++) {
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

// ===== 命令面板 =====
function toggleCommandPalette(show) {
  const overlay = document.getElementById('command-palette-overlay');
  if (!overlay) return;
  const isVisible = overlay.style.display === 'flex';
  const shouldShow = show !== undefined ? show : !isVisible;
  overlay.style.display = shouldShow ? 'flex' : 'none';
  if (shouldShow) {
    const input = document.getElementById('command-palette-input');
    if (input) { input.value = ''; input.focus(); }
    renderCommandPaletteResults('');
  }
}

function renderCommandPaletteResults(query) {
  const resultsEl = document.getElementById('command-palette-results');
  if (!resultsEl) return;
  const q = query.toLowerCase().trim();
  const items = [];

  // 项目
  state.projects.forEach(p => {
    const dn = getDisplayName(p.name);
    if (!q || dn.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) {
      items.push({ type: 'project', name: dn, action: () => { selectProject(p.name); toggleCommandPalette(false); } });
    }
  });

  // Tab
  const tabs = ['dashboard', 'commands', 'cmdlib', 'skills', 'token', 'operations'];
  const tabNames = { dashboard: '仪表盘', commands: '命令历史', cmdlib: '命令仓库', skills: '技能仓库', token: 'Token/模型', operations: '设置与操作' };
  tabs.forEach(tab => {
    const name = tabNames[tab] || tab;
    if (!q || name.toLowerCase().includes(q) || tab.includes(q)) {
      items.push({ type: 'tab', name: name, action: () => {
        const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (tabBtn) tabBtn.click();
        toggleCommandPalette(false);
      }});
    }
  });

  // 命令库搜索
  if (q) {
    COMMAND_LIBRARY.forEach(cat => {
      cat.commands.forEach(cmd => {
        if (cmd.name.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)) {
          items.push({ type: 'command', name: cmd.name, desc: cmd.desc, action: () => {
            navigator.clipboard.writeText(cmd.usage);
            toggleCommandPalette(false);
            updateStatus('已复制: ' + cmd.usage);
          }});
        }
      });
    });
  }

  const display = items.slice(0, 12);
  const typeIcons = {
    project: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    tab: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    command: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
  };
  const typeLabels = { project: '项目', tab: 'Tab', command: '命令' };

  resultsEl.innerHTML = display.length === 0
    ? '<div class="command-palette-empty">无匹配结果</div>'
    : display.map((item, i) => `<div class="command-palette-item" data-cp-idx="${i}">
      <span class="cp-icon">${typeIcons[item.type]}</span>
      <span class="cp-name">${escHtml(item.name)}</span>
      <span class="cp-type">${typeLabels[item.type]}</span>
    </div>`).join('');

  resultsEl.querySelectorAll('.command-palette-item').forEach((el, i) => {
    el.addEventListener('click', () => display[i].action());
  });
}

// ===== 侧边栏折叠 =====
let _sidebarCollapsed = false;
function toggleSidebar() {
  _sidebarCollapsed = !_sidebarCollapsed;
  const sidebar = document.querySelector('.sidebar');
  const mainLayout = document.querySelector('.main-layout');
  if (sidebar) sidebar.classList.toggle('sidebar-collapsed', _sidebarCollapsed);
  if (mainLayout) mainLayout.classList.toggle('sidebar-collapsed', _sidebarCollapsed);
}



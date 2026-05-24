const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const MANAGER_DATA_DIR = path.join(CLAUDE_DIR, 'manager-data');
const ALIASES_FILE = path.join(MANAGER_DATA_DIR, 'aliases.json');
const APP_SETTINGS_FILE = path.join(MANAGER_DATA_DIR, 'app-settings.json');

// 确保 manager-data 目录存在
if (!fs.existsSync(MANAGER_DATA_DIR)) {
  fs.mkdirSync(MANAGER_DATA_DIR, { recursive: true });
}

// ===== 项目别名系统 =====
function loadAliases() {
  try {
    if (fs.existsSync(ALIASES_FILE)) {
      return JSON.parse(fs.readFileSync(ALIASES_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveAliases(aliases) {
  try {
    fs.writeFileSync(ALIASES_FILE, JSON.stringify(aliases, null, 2), 'utf8');
  } catch {}
}

// ===== 应用设置（主题、功能开关等） =====
function loadAppSettings() {
  try {
    if (fs.existsSync(APP_SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(APP_SETTINGS_FILE, 'utf8'));
    }
  } catch {}
  return {
    theme: 'dark',
    features: {
      commands: true,
      skills: true,
      token: true,
      memory: true,
      operations: true
    },
    scanMode: 'full' // 'full' | 'recent' | 'current'
  };
}

function saveAppSettings(settings) {
  try {
    fs.writeFileSync(APP_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch {}
}

// ===== 路径解析 =====
function resolveProjectPath(dirName, projDir) {
  // First try: read cwd from JSONL files, but verify it matches this project
  try {
    const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(projDir, file), 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const obj = JSON.parse(lines[i]);
          if (obj.cwd) {
            // Verify the cwd actually belongs to this project
            const cwdEncoded = encodeProjectPath(obj.cwd);
            if (cwdEncoded === dirName) return obj.cwd;
            // cwd doesn't match this directory — skip it (belongs to a sub/super project)
          }
        } catch {}
      }
    }
  } catch {}

  // Fallback: improved manual decode with fs.existsSync validation
  const driveMatch = dirName.match(/^([A-Z])--/);
  if (!driveMatch) return dirName;

  let stripped = dirName.replace(/^([A-Z])--/, '$1:');

  // Remove remaining '--' (CJK chars are lost in encoding)
  let result = stripped.replace(/--/g, '');
  result = result.replace(/-/g, path.sep);

  // Validate: if the decoded path exists on disk, it's correct
  if (fs.existsSync(result)) return result;

  // Try alternate separator
  const altResult = stripped.replace(/--/g, '').replace(/-/g, '/');
  if (fs.existsSync(altResult)) return altResult;

  return result;
}

// ===== 全盘扫描：合并所有 .claude 数据源 =====
function scanAllData() {
  const projectsMap = new Map(); // encodedName -> project data

  // 1. 扫描 projects/ 目录（主要数据源）
  try {
    const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const fullPath = path.join(PROJECTS_DIR, d.name);
      const resolved = resolveProjectPath(d.name, fullPath);
      let lastAccess = null;
      let createdAt = null;
      try {
        const stat = fs.statSync(fullPath);
        // birthtime 在 Windows 上可能不准确，用最早的 JSONL 作为创建时间
        createdAt = stat.birthtimeMs || stat.ctimeMs;
        lastAccess = stat.mtimeMs;
        const files = fs.readdirSync(fullPath);
        for (const f of files) {
          if (f.endsWith('.jsonl')) {
            const fstat = fs.statSync(path.join(fullPath, f));
            if (fstat.mtimeMs > lastAccess) lastAccess = fstat.mtimeMs;
            if (fstat.birthtimeMs && fstat.birthtimeMs < createdAt) createdAt = fstat.birthtimeMs;
            else if (fstat.ctimeMs && fstat.ctimeMs < createdAt) createdAt = fstat.ctimeMs;
          }
        }
      } catch {}
      projectsMap.set(d.name, {
        name: d.name, path: resolved, rawPath: fullPath, lastAccess, createdAt, source: 'projects'
      });
    }
  } catch {}

  // 2. 解析 history.jsonl 提取额外项目（老用户可能有项目记录但projects下无目录）
  try {
    const historyFile = path.join(CLAUDE_DIR, 'history.jsonl');
    if (fs.existsSync(historyFile)) {
      const content = fs.readFileSync(historyFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.project) {
            // obj.project 是真实路径如 "C:\\Users\\Administrator"
            // 需要反向编码为目录名来检查是否已在 projectsMap 中
            const realPath = obj.project;
            const encodedName = encodeProjectPath(realPath);
            if (!projectsMap.has(encodedName)) {
              // 检查 projects/ 下是否确实不存在这个目录
              const projDir = path.join(PROJECTS_DIR, encodedName);
              if (!fs.existsSync(projDir)) {
                // 来自 history.jsonl 的历史项目，无本地目录
                const timestamp = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
                const existing = projectsMap.get(encodedName);
                if (!existing || (existing.lastAccess || 0) < timestamp) {
                  projectsMap.set(encodedName, {
                    name: encodedName, path: realPath, rawPath: projDir,
                    lastAccess: timestamp, source: 'history'
                  });
                }
              }
            } else {
              // 更新 lastAccess
              const existing = projectsMap.get(encodedName);
              const timestamp = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
              if (timestamp > (existing.lastAccess || 0)) {
                existing.lastAccess = timestamp;
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 3. 扫描 sessions/ 目录（全局会话索引）
  try {
    const sessionsDir = path.join(CLAUDE_DIR, 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
      for (const sf of sessionFiles) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(sessionsDir, sf), 'utf8'));
          if (data.projectPath) {
            const encodedName = encodeProjectPath(data.projectPath);
            if (!projectsMap.has(encodedName)) {
              const projDir = path.join(PROJECTS_DIR, encodedName);
              if (!fs.existsSync(projDir)) {
                projectsMap.set(encodedName, {
                  name: encodedName, path: data.projectPath, rawPath: projDir,
                  lastAccess: data.lastActivity ? new Date(data.lastActivity).getTime() : 0,
                  source: 'sessions'
                });
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 4. 扫描 file-history/ 目录（文件操作历史）
  try {
    const fhDir = path.join(CLAUDE_DIR, 'file-history');
    if (fs.existsSync(fhDir)) {
      const fhProjects = fs.readdirSync(fhDir, { withFileTypes: true });
      for (const d of fhProjects) {
        if (!d.isDirectory()) continue;
        const encodedName = d.name;
        if (!projectsMap.has(encodedName)) {
          const fhPath = path.join(fhDir, encodedName);
          const stat = fs.statSync(fhPath);
          // 尝试从目录名解码路径
          const resolved = resolveProjectPath(encodedName, fhPath);
          projectsMap.set(encodedName, {
            name: encodedName, path: resolved, rawPath: path.join(PROJECTS_DIR, encodedName),
            lastAccess: stat.mtimeMs, source: 'file-history'
          });
        }
      }
    }
  } catch {}

  const projects = Array.from(projectsMap.values());
  projects.sort((a, b) => (b.lastAccess || 0) - (a.lastAccess || 0));
  return projects;
}

// 反向编码：真实路径 → Claude编码目录名
function encodeProjectPath(realPath) {
  let result = realPath;
  // Drive prefix: C:\ => C-- (colon + first backslash become --)
  result = result.replace(/^([A-Z]):[\\/]/, '$1--');
  // Remaining path separators
  result = result.replace(/[\\/]/g, '-');
  // CJK/non-ASCII chars => single dash (Claude CLI encoding rule)
  result = result.replace(/[^\x00-\x7F]/g, '-');
  return result;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Claude Code Manager',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ========== IPC Handlers ==========

// 1. Get all projects（支持扫描模式参数）
ipcMain.handle('get-projects', async (_e, scanMode) => {
  try {
    const allProjects = scanAllData();
    const mode = scanMode || loadAppSettings().scanMode || 'full';

    if (mode === 'current') {
      // 仅保留 projects/ 目录下有 .jsonl 文件的项目
      return allProjects.filter(p => {
        if (!fs.existsSync(p.rawPath)) return false;
        try {
          const files = fs.readdirSync(p.rawPath);
          return files.some(f => f.endsWith('.jsonl'));
        } catch { return false; }
      });
    } else if (mode === 'recent') {
      // 仅保留最近30天有活动的项目
      const cutoff = Date.now() - 30 * 24 * 3600000;
      return allProjects.filter(p => (p.lastAccess || 0) > cutoff);
    }
    // mode === 'full': 返回所有
    return allProjects;
  } catch (e) { return []; }
});

// 1b. Scan all data（手动触发全盘扫描）
ipcMain.handle('scan-all-data', async () => {
  try {
    const projects = scanAllData();
    return { success: true, count: projects.length, projects };
  } catch (e) {
    return { success: false, count: 0, projects: [], error: e.message };
  }
});

// 2. Get command history - 宽松匹配（/命令+中文命令），含fullMessage
ipcMain.handle('get-commands', async (_e, projectName) => {
  const commands = [];
  if (!projectName) return commands;
  try {
    const projDir = path.join(PROJECTS_DIR, projectName);
    if (!fs.existsSync(projDir)) return commands;
    const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));

    // 中文命令关键词列表
    const cnKeywords = ['初始化', '配置', '帮助', '设置', '启动', '停止', '重启', '更新', '安装', '卸载',
      '编译', '构建', '部署', '测试', '调试', '运行', '清理', '检查', '修复', '优化',
      '创建', '删除', '修改', '查看', '搜索', '分析', '生成', '转换', '导入', '导出',
      '压缩', '解压', '同步', '备份', '恢复', '迁移', '监控', '日志', '状态', '版本'];

    for (const file of files) {
      const content = fs.readFileSync(path.join(projDir, file), 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if ((obj.type === 'user' || obj.type === 'human') && obj.message && obj.message.content) {
            const text = typeof obj.message.content === 'string'
              ? obj.message.content
              : Array.isArray(obj.message.content)
                ? obj.message.content.filter(c => c.type === 'text').map(c => c.text || '').join(' ')
                : '';
            const isSlashCmd = text.trim().startsWith('/');
            const hasCnKeyword = cnKeywords.some(kw => text.includes(kw));
            if (!isSlashCmd && !hasCnKeyword) continue;
            const cmd = isSlashCmd ? text.trim().split(/\s/)[0] : text.trim().substring(0, 60);
            commands.push({
              command: cmd,
              fullText: text.substring(0, 200),
              fullMessage: text.substring(0, 2000),
              timestamp: obj.timestamp,
              sessionId: obj.sessionId || file.replace('.jsonl', '')
            });
          }
        } catch {}
      }
    }
    commands.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return commands;
  } catch (e) { return []; }
});

// 3. Get all skills - 深度遍历插件commands/目录，扁平化返回所有skill
ipcMain.handle('get-skills', async () => {
  const allSkills = [];

  // 1) 读取用户技能：~/.claude/skills/
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const skillPath = path.join(skillsDir, d.name);
      let description = '';
      let skillContent = '';
      try {
        const mdFiles = fs.readdirSync(skillPath).filter(f => f.endsWith('.md'));
        if (mdFiles.length > 0) {
          skillContent = fs.readFileSync(path.join(skillPath, mdFiles[0]), 'utf8');
          const descMatch = skillContent.match(/description:\s*(.+)/);
          if (descMatch) description = descMatch[1].trim();
        }
      } catch {}
      allSkills.push({
        name: d.name,
        sourceType: 'user',
        source: '',
        description: description || `[${d.name}] - 用户自定义技能`,
        content: skillContent.substring(0, 500),
        locked: false,
        version: '',
        installPath: skillPath
      });
    }
  }

  // 2) 深度遍历插件缓存目录：~/.claude/plugins/cache/<source>/<name>/<version>/
  const cacheDir = path.join(CLAUDE_DIR, 'plugins', 'cache');
  if (fs.existsSync(cacheDir)) {
    const sources = fs.readdirSync(cacheDir, { withFileTypes: true });
    for (const src of sources) {
      if (!src.isDirectory()) continue;
      const srcPath = path.join(cacheDir, src.name);
      const plugins = fs.readdirSync(srcPath, { withFileTypes: true });
      for (const plg of plugins) {
        if (!plg.isDirectory()) continue;
        const plgPath = path.join(srcPath, plg.name);
        const versions = fs.readdirSync(plgPath, { withFileTypes: true });
        for (const ver of versions) {
          if (!ver.isDirectory()) continue;
          const verPath = path.join(plgPath, ver.name);
          const pluginJsonPath = path.join(verPath, '.claude-plugin', 'plugin.json');
          let pluginName = plg.name;
          let pluginVersion = ver.name;
          let locked = false;

          try {
            if (fs.existsSync(pluginJsonPath)) {
              const pj = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
              pluginName = pj.name || plg.name;
              pluginVersion = pj.version || ver.name;
              try {
                const ipFile = path.join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
                if (fs.existsSync(ipFile)) {
                  const ipData = JSON.parse(fs.readFileSync(ipFile, 'utf8'));
                  for (const [, entries] of Object.entries(ipData.plugins || {})) {
                    for (const entry of entries) {
                      if (entry.installPath && entry.installPath.includes(plg.name) && entry.locked) {
                        locked = true;
                      }
                    }
                  }
                }
              } catch {}
            }
          } catch {}

          // 遍历commands/子目录读取所有skill .md文件
          const commandsDir = path.join(verPath, 'commands');
          if (fs.existsSync(commandsDir)) {
            const cmdFiles = fs.readdirSync(commandsDir, { withFileTypes: true });
            for (const cf of cmdFiles) {
              if (!cf.isDirectory()) continue;
              const cmdDir = path.join(commandsDir, cf.name);
              const mdFiles = fs.readdirSync(cmdDir).filter(f => f.endsWith('.md'));
              if (mdFiles.length > 0) {
                let description = '';
                let skillContent = '';
                try {
                  skillContent = fs.readFileSync(path.join(cmdDir, mdFiles[0]), 'utf8');
                  const descMatch = skillContent.match(/description:\s*(.+)/);
                  if (descMatch) description = descMatch[1].trim();
                } catch {}
                allSkills.push({
                  name: cf.name,
                  sourceType: 'plugin',
                  source: pluginName,
                  description: description || `[${cf.name}] - 来自${pluginName}插件`,
                  content: skillContent.substring(0, 500),
                  locked: locked,
                  version: pluginVersion,
                  installPath: cmdDir
                });
              }
            }
          }

          // 同时检查skills/子目录
          const skillsSubDir = path.join(verPath, 'skills');
          if (fs.existsSync(skillsSubDir)) {
            const skillDirs = fs.readdirSync(skillsSubDir, { withFileTypes: true });
            for (const sd of skillDirs) {
              if (!sd.isDirectory()) continue;
              const sdPath = path.join(skillsSubDir, sd.name);
              const mdFiles = fs.readdirSync(sdPath).filter(f => f.endsWith('.md'));
              if (mdFiles.length > 0) {
                let description = '';
                let skillContent = '';
                try {
                  skillContent = fs.readFileSync(path.join(sdPath, mdFiles[0]), 'utf8');
                  const descMatch = skillContent.match(/description:\s*(.+)/);
                  if (descMatch) description = descMatch[1].trim();
                } catch {}
                allSkills.push({
                  name: sd.name,
                  sourceType: 'plugin',
                  source: pluginName,
                  description: description || `[${sd.name}] - 来自${pluginName}插件`,
                  content: skillContent.substring(0, 500),
                  locked: locked,
                  version: pluginVersion,
                  installPath: sdPath
                });
              }
            }
          }
        }
      }
    }
  }

  const descTranslations = {
    'brainstorming': '将想法转化为设计方案',
    'writing-plans': '编写详细的实施计划',
    'executing-plans': '逐步执行实施计划',
    'subagent-driven-development': '通过子代理驱动开发',
    'debugging': '系统性调试和问题定位',
    'frontend-design': '前端界面设计与实现',
    'mcp-builder': '构建 MCP 服务器',
    'using-git-worktrees': '使用 Git Worktree 进行隔离开发',
    'patterns': '代码模式与最佳实践',
    'using-superpowers': '使用 Superpowers 技能系统',
    'code-reviewer': '代码审查与质量检查',
    'testing': '测试策略与执行',
    'deploying': '部署与发布流程',
    'writing-clearly-and-concisely': '清晰简洁的文档写作',
    'elements-of-style': '代码风格与文档风格',
    'visual-companion': '浏览器可视化辅助工具',
    'maintenance': '项目维护与更新',
    'version-control': '版本控制与 Git 管理',
    'containerization': '容器化与 Docker 管理',
    'database-operations': '数据库操作与管理',
    'api-design': 'API 设计与实现',
    'performance-optimization': '性能优化与调优',
    'security-hardening': '安全加固与漏洞修复',
    'observability': '可观测性与监控',
    'ci-cd': 'CI/CD 流程配置',
    'environment-setup': '开发环境配置',
    'documentation': '文档编写与维护',
    'refactoring': '代码重构与优化',
    'troubleshooting': '故障排查与修复',
    'integration-testing': '集成测试',
  };

  allSkills.forEach(s => {
    const trans = descTranslations[s.name];
    if (trans) s.description = trans;
  });

  return { allSkills };
});

// 4. Get skill detail
ipcMain.handle('get-skill-detail', async (_e, skillPath) => {
  try {
    if (!fs.existsSync(skillPath)) return null;
    const mdFiles = fs.readdirSync(skillPath).filter(f => f.endsWith('.md'));
    if (mdFiles.length === 0) return null;
    return fs.readFileSync(path.join(skillPath, mdFiles[0]), 'utf8');
  } catch { return null; }
});

// 5. Get token/model info - 项目隔离版
ipcMain.handle('get-token-info', async (_e, projectName) => {
  try {
    const now = Date.now();
    const timeWindows = {
      last5h: now - 5 * 3600000,
      last1d: now - 24 * 3600000,
      last7d: now - 7 * 24 * 3600000
    };

    const toolDescMap = {
      'Bash': '执行Shell命令', 'Read': '读取文件内容', 'Write': '写入文件',
      'Edit': '编辑修改文件', 'Glob': '按模式搜索文件', 'Grep': '搜索文件内容',
      'Agent': '启动子代理执行任务', 'TaskCreate': '创建任务列表', 'TaskUpdate': '更新任务状态',
      'TaskList': '查看所有任务', 'AskUserQuestion': '向用户提问确认', 'WebFetch': '获取网页内容',
      'WebSearch': '搜索互联网', 'Skill': '调用技能', 'EnterPlanMode': '进入计划模式',
      'ExitPlanMode': '退出计划模式', 'NotebookEdit': '编辑笔记本', 'CronCreate': '创建定时任务',
      'CronDelete': '删除定时任务', 'ScheduleWakeup': '安排唤醒任务',
      'EnterWorktree': '进入工作树', 'ExitWorktree': '退出工作树'
    };

    let liveModel = '';
    let contextWindow = null;
    let contextReceivedAt = '';
    const statusFile = path.join(CLAUDE_DIR, 'tt-status.json');
    if (fs.existsSync(statusFile)) {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      liveModel = status.model?.display_name || status.model?.name || '';
      contextWindow = status.context_window || null;
      contextReceivedAt = status._received_at || '';
    }

    // 从当前项目最新JSONL文件提取最新的usage数据作为备用上下文窗口数据
    if (projectName && contextWindow) {
      try {
        const projDir = path.join(PROJECTS_DIR, projectName);
        const jsonlFiles = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
        let latestUsage = 0;
        let latestTs = 0;
        for (const file of jsonlFiles) {
          try {
            const content = fs.readFileSync(path.join(projDir, file), 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const obj = JSON.parse(lines[i]);
                if (obj.message?.usage?.input_tokens) {
                  const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
                  if (ts > latestTs) {
                    latestTs = ts;
                    latestUsage = obj.message.usage.input_tokens;
                  }
                  break;
                }
              } catch {}
            }
          } catch {}
        }
        // 如果JSONL中提取的值大于tt-status中的值，使用JSONL值
        const statusUsage = contextWindow.current_usage?.input_tokens || 0;
        if (latestUsage > statusUsage) {
          contextWindow.current_usage = { ...(contextWindow.current_usage || {}), input_tokens: latestUsage };
          contextReceivedAt = latestTs ? new Date(latestTs).toISOString() : contextReceivedAt;
        }
      } catch {}
    }

    let mcpServers = [];
    try {
      const settingsFile = path.join(CLAUDE_DIR, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        const mcpCfg = settings.mcpServers || {};
        for (const [name, cfg] of Object.entries(mcpCfg)) {
          mcpServers.push({ name, command: cfg.command || '', desc: `MCP服务: ${name}` });
        }
      }
    } catch {}

    let projectInput = 0, projectOutput = 0, projectCacheRead = 0, projectCacheCreate = 0;
    let projectMessages = 0, projectSessions = 0;
    let projTime5h = { input: 0, output: 0, cache: 0, total: 0 };
    let projTime1d = { input: 0, output: 0, cache: 0, total: 0 };
    let projTime7d = { input: 0, output: 0, cache: 0, total: 0 };
    let projectModels = {};
    let projectToolMap = {};

    let globalInput = 0, globalOutput = 0, globalCacheRead = 0, globalCacheCreate = 0;
    let globalMessages = 0, globalSessions = 0;
    let globalModels = {};

    const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const projDir = path.join(PROJECTS_DIR, d.name);
      const isCurrentProject = (d.name === projectName);
      const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));

      for (const file of files) {
        globalSessions++;
        let sessInput = 0, sessOutput = 0, sessCacheRead = 0, sessCacheCreate = 0;
        let sessMsgCount = 0;

        try {
          const content = fs.readFileSync(path.join(projDir, file), 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          sessMsgCount = lines.length;

          for (const line of lines) {
            try {
              const obj = JSON.parse(line);

              if (obj.message?.usage) {
                const u = obj.message.usage;
                const inp = u.input_tokens || 0;
                const out = u.output_tokens || 0;
                const cr = u.cache_read_input_tokens || 0;
                const cc = u.cache_creation_input_tokens || 0;
                sessInput += inp; sessOutput += out;
                sessCacheRead += cr; sessCacheCreate += cc;

                const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
                if (isCurrentProject && ts > 0) {
                  if (ts >= timeWindows.last5h) {
                    projTime5h.input += inp; projTime5h.output += out;
                    projTime5h.cache += cr + cc; projTime5h.total += inp + out + cr + cc;
                  }
                  if (ts >= timeWindows.last1d) {
                    projTime1d.input += inp; projTime1d.output += out;
                    projTime1d.cache += cr + cc; projTime1d.total += inp + out + cr + cc;
                  }
                  if (ts >= timeWindows.last7d) {
                    projTime7d.input += inp; projTime7d.output += out;
                    projTime7d.cache += cr + cc; projTime7d.total += inp + out + cr + cc;
                  }
                }
              }

              let m = obj.message?.model || '';
              if (!m && obj.message?.content && Array.isArray(obj.message.content)) {
                for (const c of obj.message.content) { if (c.model) { m = c.model; break; } }
              }
              if (m) {
                globalModels[m] = (globalModels[m] || 0) + 1;
                if (isCurrentProject) projectModels[m] = (projectModels[m] || 0) + 1;
              }

              if (isCurrentProject && obj.message?.content && Array.isArray(obj.message.content)) {
                for (const block of obj.message.content) {
                  if (block.type === 'tool_use' && block.name) {
                    const toolName = block.name;
                    if (!projectToolMap[toolName]) projectToolMap[toolName] = { count: 0, lastUsed: '' };
                    projectToolMap[toolName].count++;
                    const blockTs = obj.timestamp || '';
                    if (blockTs > projectToolMap[toolName].lastUsed) projectToolMap[toolName].lastUsed = blockTs;
                  }
                }
              }
            } catch {}
          }
        } catch {}

        globalInput += sessInput; globalOutput += sessOutput;
        globalCacheRead += sessCacheRead; globalCacheCreate += sessCacheCreate;
        globalMessages += sessMsgCount;

        if (isCurrentProject) {
          projectInput += sessInput; projectOutput += sessOutput;
          projectCacheRead += sessCacheRead; projectCacheCreate += sessCacheCreate;
          projectMessages += sessMsgCount; projectSessions++;
        }
      }
    }

    const projectTools = Object.entries(projectToolMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        category: name === 'Skill' ? 'skill' : name === 'Agent' ? 'agent' : 'cli',
        count: data.count,
        lastUsed: data.lastUsed,
        descChinese: toolDescMap[name] || `工具: ${name}`
      }));

    const skillNamesUsed = [];
    try {
      if (projectName) {
        const projDir = path.join(PROJECTS_DIR, projectName);
        const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(projDir, file), 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            for (const line of lines) {
              try {
                const obj = JSON.parse(line);
                if (obj.message?.content && Array.isArray(obj.message.content)) {
                  for (const block of obj.message.content) {
                    if (block.type === 'tool_use' && block.name === 'Skill' && block.input?.skill) {
                      if (!skillNamesUsed.includes(block.input.skill)) skillNamesUsed.push(block.input.skill);
                    }
                  }
                }
              } catch {}
            }
          } catch {}
        }
      }
    } catch {}

    return {
      projectToken: {
        inputTokens: projectInput, outputTokens: projectOutput,
        cacheRead: projectCacheRead, cacheCreate: projectCacheCreate,
        totalTokens: projectInput + projectOutput + projectCacheRead + projectCacheCreate,
        sessionCount: projectSessions, messageCount: projectMessages
      },
      contextWindow, liveModel, contextReceivedAt,
      timeDimension: { last5h: projTime5h, last1d: projTime1d, last7d: projTime7d },
      globalToken: {
        inputTokens: globalInput, outputTokens: globalOutput,
        cacheRead: globalCacheRead, cacheCreate: globalCacheCreate,
        totalTokens: globalInput + globalOutput + globalCacheRead + globalCacheCreate,
        totalSessions: globalSessions, totalMessages: globalMessages
      },
      projectTools, projectSkills: skillNamesUsed, projectMcp: mcpServers,
      projectModels, globalModels
    };
  } catch { return null; }
});

// 6. Get sessions
ipcMain.handle('get-sessions', async (_e, projectName) => {
  try {
    const projDir = path.join(PROJECTS_DIR, projectName);
    const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
    const sessions = [];
    for (const file of files) {
      const filePath = path.join(projDir, file);
      const stat = fs.statSync(filePath);
      const sessionId = file.replace('.jsonl', '');
      let messageCount = 0, model = '', firstTimestamp = null, lastTimestamp = null;
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        messageCount = lines.length;
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.timestamp) {
              if (!firstTimestamp) firstTimestamp = obj.timestamp;
              lastTimestamp = obj.timestamp;
            }
            if (obj.message?.model && !model) model = obj.message.model;
            if (obj.message?.content && Array.isArray(obj.message.content)) {
              for (const c of obj.message.content) {
                if (c.model && !model) model = c.model;
              }
            }
          } catch {}
        }
      } catch {}
      sessions.push({
        sessionId, messageCount, model: model || 'unknown',
        firstTimestamp, lastTimestamp, fileSize: stat.size
      });
    }
    sessions.sort((a, b) => new Date(b.lastTimestamp || 0) - new Date(a.lastTimestamp || 0));
    return sessions;
  } catch { return []; }
});

// 7. Get session messages
ipcMain.handle('get-session-messages', async (_e, projectName, sessionId) => {
  try {
    const filePath = path.join(PROJECTS_DIR, projectName, sessionId + '.jsonl');
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const messages = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'user' || obj.type === 'human' || obj.type === 'assistant') {
          let text = '';
          if (obj.message) {
            if (typeof obj.message.content === 'string') text = obj.message.content;
            else if (Array.isArray(obj.message.content)) {
              text = obj.message.content
                .filter(c => c.type === 'text')
                .map(c => c.text || '')
                .join('\n');
            }
          }
          if (text) {
            messages.push({
              type: obj.type, text: text.substring(0, 2000),
              timestamp: obj.timestamp, model: obj.message?.model || ''
            });
          }
        }
      } catch {}
    }
    return messages;
  } catch { return []; }
});

// 8. Launch Claude Code
ipcMain.handle('launch-claude', async (_e, cwd) => {
  return new Promise((resolve) => {
    const cmd = 'claude';
    const options = cwd ? { cwd, shell: true } : { shell: true };
    const child = exec(cmd, options, (err) => {
      resolve({ success: !err, error: err?.message });
    });
    child.unref();
    resolve({ success: true, error: null });
  });
});

// 9. Open folder in explorer
ipcMain.handle('open-folder', async (_e, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// 10. Get all slash commands
ipcMain.handle('get-all-commands', async () => {
  try {
    const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    const cmdMap = {};
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const projDir = path.join(PROJECTS_DIR, d.name);
      const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(projDir, file), 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if ((obj.type === 'user' || obj.type === 'human') && obj.message?.content) {
                const text = typeof obj.message.content === 'string'
                  ? obj.message.content
                  : Array.isArray(obj.message.content)
                    ? obj.message.content.filter(c => c.type === 'text').map(c => c.text || '').join(' ')
                    : '';
                if (text.startsWith('/')) {
                  const cmd = text.split(/\s/)[0];
                  if (!cmdMap[cmd]) cmdMap[cmd] = { command: cmd, count: 0, lastUsed: '' };
                  cmdMap[cmd].count++;
                  if (obj.timestamp > cmdMap[cmd].lastUsed) cmdMap[cmd].lastUsed = obj.timestamp;
                }
              }
            } catch {}
          }
        } catch {}
      }
    }
    return Object.values(cmdMap).sort((a, b) => b.count - a.count);
  } catch { return []; }
});

// 11. Get settings
ipcMain.handle('get-settings', async () => {
  try {
    const settingsFile = path.join(CLAUDE_DIR, 'settings.json');
    if (!fs.existsSync(settingsFile)) return null;
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch { return null; }
});

// 12. Open in terminal
ipcMain.handle('open-in-terminal', async (_e, cwd) => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `start cmd /k "cd /d "${cwd}" && claude"`
      : `osascript -e 'tell application "Terminal" to do script "cd ${cwd} && claude"'`;
    exec(cmd, (err) => {
      resolve({ success: !err, error: err?.message });
    });
  });
});

// 12b. 全权限启动Claude Code
ipcMain.handle('launch-claude-dangerous', async (_e, cwd) => {
  return new Promise((resolve) => {
    const cmd = 'claude --dangerously-skip-permissions';
    const options = cwd ? { cwd, shell: true } : { shell: true };
    const child = exec(cmd, options, (err) => {
      resolve({ success: !err, error: err?.message });
    });
    child.unref();
    resolve({ success: true, error: null });
  });
});

// 12c. 全权限启动：在终端中打开
ipcMain.handle('open-in-terminal-dangerous', async (_e, cwd) => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `start cmd /k "cd /d "${cwd}" && claude --dangerously-skip-permissions"`
      : `osascript -e 'tell application "Terminal" to do script "cd ${cwd} && claude --dangerously-skip-permissions"'`;
    exec(cmd, (err) => {
      resolve({ success: !err, error: err?.message });
    });
  });
});

// 13. Delete project files
ipcMain.handle('delete-project-files', async (_e, projectName) => {
  try {
    const projDir = path.join(PROJECTS_DIR, projectName);
    if (!fs.existsSync(projDir)) return { success: false, error: '项目目录不存在' };

    const normalized = path.normalize(projDir);
    if (!normalized.startsWith(path.normalize(PROJECTS_DIR))) {
      return { success: false, error: '安全限制：路径不在projects目录内' };
    }

    const files = fs.readdirSync(projDir);
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(projDir, file);
      if (file.endsWith('.jsonl')) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return { success: true, deletedCount, message: `已删除 ${deletedCount} 个Claude生成的会话文件` };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// 14. Delete entire project
ipcMain.handle('delete-project', async (_e, projectName) => {
  try {
    const projDir = path.join(PROJECTS_DIR, projectName);
    const normalized = path.normalize(projDir);
    if (!normalized.startsWith(path.normalize(PROJECTS_DIR))) {
      return { success: false, error: '安全限制：只能删除 ~/.claude/projects/ 内的项目' };
    }

    const rootCheck = /^[A-Z]:\\?$|^\/$/i;
    if (rootCheck.test(normalized) || normalized.length <= 3) {
      return { success: false, error: '安全限制：根目录无法删除' };
    }

    if (normalized === path.normalize(PROJECTS_DIR)) {
      return { success: false, error: '安全限制：projects目录无法删除' };
    }

    if (!fs.existsSync(projDir)) {
      return { success: false, error: '项目目录不存在' };
    }

    fs.rmSync(projDir, { recursive: true, force: true });
    return { success: true, message: '项目已完全删除（不可恢复）' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// 15. Get project memory
ipcMain.handle('get-project-memory', async (_e, projectName) => {
  try {
    const memDir = path.join(PROJECTS_DIR, projectName, 'memory');
    if (!fs.existsSync(memDir)) return { files: [], content: '' };

    const memFiles = [];
    const mdFiles = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    let allContent = '';

    for (const mdFile of mdFiles) {
      const content = fs.readFileSync(path.join(memDir, mdFile), 'utf8');
      memFiles.push({ name: mdFile, content });
      allContent += `=== ${mdFile} ===\n${content}\n\n`;
    }

    const claudeMd = path.join(PROJECTS_DIR, projectName, 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      const content = fs.readFileSync(claudeMd, 'utf8');
      memFiles.push({ name: 'CLAUDE.md', content });
      allContent += `=== CLAUDE.md ===\n${content}\n\n`;
    }

    return { files: memFiles, content: allContent };
  } catch (e) {
    return { files: [], content: '' };
  }
});

// 16. Write operation log
ipcMain.handle('write-op-log', async (_e, projectName, action, detail) => {
  try {
    const logDir = path.join(CLAUDE_DIR, 'manager-logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'operations.jsonl');
    const entry = { timestamp: new Date().toISOString(), project: projectName, action, detail };
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ========== 新增 IPC：项目别名 ==========
// 17. 获取项目别名
ipcMain.handle('get-aliases', async () => {
  return loadAliases();
});

// 18. 设置项目别名
ipcMain.handle('set-alias', async (_e, projectName, alias) => {
  const aliases = loadAliases();
  if (alias && alias.trim()) {
    aliases[projectName] = alias.trim();
  } else {
    delete aliases[projectName];
  }
  saveAliases(aliases);
  return { success: true, aliases };
});

// ========== 新增 IPC：应用设置 ==========
// 19. 获取应用设置（主题、功能开关、扫描模式）
ipcMain.handle('get-app-settings', async () => {
  return loadAppSettings();
});

// 20. 保存应用设置
ipcMain.handle('save-app-settings', async (_e, settings) => {
  saveAppSettings(settings);
  return { success: true };
});

// 21. 设置扫描模式
ipcMain.handle('set-scan-mode', async (_e, mode) => {
  const settings = loadAppSettings();
  settings.scanMode = mode;
  saveAppSettings(settings);
  return { success: true, settings };
});
import { VirtualUsers } from './core/virtual-users.js';
import { VirtualFileSystem } from './core/virtual-filesystem.js';
import { VirtualProcesses } from './core/virtual-processes.js';
import { VirtualNetwork } from './core/virtual-network.js';
import { StorageManager } from './core/storage-manager.js';
import { CommandRegistry } from './terminal/command-registry.js';
import { registerAllCommands } from './terminal/commands-catalog.js';
import { ShellInterpreter } from './terminal/shell-interpreter.js';
import { WindowManager } from './desktop/window-manager.js';
import { Dock } from './desktop/dock.js';
import { TopPanel } from './desktop/panel.js';
import { Launcher } from './desktop/launcher.js';
import { NotificationManager } from './desktop/notifications.js';
import { ContextMenu } from './desktop/context-menu.js';
import { sysEvents } from './core/event-bus.js';

// Applications
import { TerminalApp } from './apps/terminal-app.js';
import { FileManagerApp } from './apps/file-manager-app.js';
import { TextEditorApp } from './apps/text-editor-app.js';
import { CalculatorApp } from './apps/calculator-app.js';
import { SystemMonitorApp } from './apps/system-monitor-app.js';
import { SettingsApp } from './apps/settings-app.js';
import { CommandReferenceApp } from './apps/command-reference-app.js';
import { ImageViewerApp } from './apps/image-viewer-app.js';
import { AboutApp } from './apps/about-app.js';

const WALLPAPER_CLASSES = {
  mascot: 'wp-mascot',
  'cyber-dark': 'wp-cyber',
  'pastel-dawn': 'wp-pastel',
  'minimal-slate': 'wp-slate'
};

/**
 * CyberLinux Desktop Application Core Bootstrapper
 */
export class CyberLinux {
  constructor() {
    this.initCore();
    this.initDesktop();
    this.setupShortcuts();
    this.setupThemeAndWallpaper();
  }

  initCore() {
    // 1. Virtual Core Subsystems
    this.users = new VirtualUsers();
    this.vfs = new VirtualFileSystem(this.users);
    this.processes = new VirtualProcesses();
    this.network = new VirtualNetwork();

    // 2. Storage & Progress
    this.storage = new StorageManager(this.vfs);
    this.storage.loadVFS();
    this.vfs.ensureForensicImages();

    // 3. Command Registry & Catalog
    this.registry = new CommandRegistry();
    registerAllCommands(this.registry, this.vfs, this.users, this.processes, this.network);

    // 4. Shell Interpreter
    this.shell = new ShellInterpreter(this.registry, this.vfs, this.users, this.processes, this.network);

    // Auto-save VFS periodically
    setInterval(() => this.storage.saveVFS(), 10000);
  }

  initDesktop() {
    this.desktopEl = document.getElementById('desktop');
    this.panelEl = document.getElementById('top-panel');
    this.dockEl = document.getElementById('dock');
    this.launcherEl = document.getElementById('launcher-overlay');
    this.notificationsEl = document.getElementById('notifications-container');

    // Context Menu & Notifications
    this.contextMenu = new ContextMenu();
    this.notifications = new NotificationManager(this.notificationsEl);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window Manager
    this.wm = new WindowManager(this.desktopEl);

    // App registry for launcher
    this.appCatalog = [
      { id: 'terminal', name: 'Terminal', icon: '💻', category: 'System', description: 'Bash-compatible command line environment' },
      { id: 'file-manager', name: 'Files', icon: '📁', category: 'System', description: 'Explore files, folders, and permissions' },
      { id: 'command-reference', name: 'Command Reference', icon: '📖', category: 'Cybersecurity', description: 'Searchable master catalog of 150+ Linux commands' },
      { id: 'text-editor', name: 'Text Editor', icon: '📝', category: 'Utilities', description: 'Create and edit scripts, logs, and configs' },
      { id: 'system-monitor', name: 'System Monitor', icon: '📊', category: 'System', description: 'Inspect CPU, memory usage, and kill processes' },
      { id: 'calculator', name: 'Calculator', icon: '🔢', category: 'Utilities', description: 'Mathematical calculations with safe parsing' },
      { id: 'image-viewer', name: 'Image Viewer', icon: '🖼️', category: 'Utilities', description: 'View and inspect pictures and graphics' },
      { id: 'settings', name: 'Settings', icon: '⚙️', category: 'System', description: 'Themes, wallpapers, backup, and reset' },
      { id: 'about', name: 'About CyberLinux', icon: '🐼', category: 'System', description: 'System information and project specs' }
    ];

    // Dock & Top Panel & Launcher
    this.dock = new Dock(this.dockEl, (appId, opts) => this.launchApp(appId, opts), this.wm);
    this.panel = new TopPanel(this.panelEl, this.wm, (appId, opts) => this.launchApp(appId, opts));
    this.launcher = new Launcher(this.launcherEl, this.appCatalog, (appId, opts) => this.launchApp(appId, opts));

    // Render Desktop Icons
    this.renderDesktopIcons();

    // Desktop Context Menu
    this.desktopEl.addEventListener('contextmenu', (e) => {
      if (e.target === this.desktopEl || e.target.classList.contains('desktop-wallpaper')) {
        e.preventDefault();
        this.contextMenu.show([
          { icon: '💻', label: 'Open Terminal', action: () => this.launchApp('terminal') },
          { icon: '📁', label: 'New Folder', action: () => this.promptDesktopNewFolder() },
          { separator: true },
          { icon: '🖼️', label: 'Change Wallpaper', action: () => this.launchApp('settings') },
          { icon: '⚙️', label: 'Settings', action: () => this.launchApp('settings') }
        ], e.clientX, e.clientY);
      }
    });

    // Handle terminal direct execution events from Reference/Learning Center
    sysEvents.on('terminal:run', (cmdString) => {
      let termWin = this.wm.windows.get('terminal');
      if (!termWin) {
        termWin = this.launchApp('terminal');
      } else {
        if (termWin.minimized) this.wm.restoreWindow('terminal');
        this.wm.focusWindow('terminal');
      }
      if (termWin && termWin.appInstance) {
        termWin.appInstance.executeExternalCommand(cmdString);
      }
    });

    sysEvents.on('terminal:exit', () => {
      this.wm.closeWindow('terminal');
    });

    // Open the terminal on startup.
    setTimeout(() => {
      this.launchApp('terminal');
    }, 300);
  }

  renderDesktopIcons() {
    const desktopGrid = document.getElementById('desktop-icons');
    if (!desktopGrid) return;
    desktopGrid.innerHTML = '';

    const desktopItems = [
      { id: 'welcome', name: 'welcome.txt', icon: '📄', action: () => this.launchApp('text-editor', { path: '/home/student/Desktop/welcome.txt' }) },
      { id: 'term', name: 'Terminal', icon: '💻', action: () => this.launchApp('terminal') },
      { id: 'files', name: 'Files', icon: '📁', action: () => this.launchApp('file-manager') },
      { id: 'ref', name: 'Commands', icon: '📖', action: () => this.launchApp('command-reference') }
    ];

    for (const item of desktopItems) {
      const el = document.createElement('div');
      el.className = 'desktop-icon-item';
      el.tabIndex = 0;
      el.innerHTML = `
        <span class="desktop-icon-symbol">${item.icon}</span>
        <span class="desktop-icon-label">${item.name}</span>
      `;
      el.addEventListener('dblclick', item.action);
      desktopGrid.appendChild(el);
    }
  }

  promptDesktopNewFolder() {
    const name = prompt('Folder name on Desktop:');
    if (name) {
      this.vfs.createDirectory(`/home/student/Desktop/${name}`, '/', this.users.getCurrentUser());
      this.renderDesktopIcons();
    }
  }

  launchApp(appId, options = {}) {
    // If already open, focus it
    if (this.wm.windows.has(appId)) {
      const win = this.wm.windows.get(appId);
      if (win.minimized) this.wm.restoreWindow(appId);
      this.wm.focusWindow(appId);
      return win;
    }

    let title = 'Application';
    let icon = '💻';
    let width = 680;
    let height = 480;
    let appContent = null;
    let appInstance = null;

    switch (appId) {
      case 'terminal':
        title = 'Terminal';
        icon = '💻';
        width = 880;
        height = 560;
        appInstance = new TerminalApp(this.shell, this.storage);
        appContent = appInstance.createUI();
        break;

      case 'file-manager':
        title = 'Files';
        icon = '📁';
        width = 920;
        height = 580;
        appInstance = new FileManagerApp(this.vfs, this.users, this.contextMenu, (id, opt) => this.launchApp(id, opt));
        appContent = appInstance.createUI();
        break;

      case 'command-reference':
        title = 'Command Reference Master List';
        icon = '📖';
        width = 980;
        height = 640;
        appInstance = new CommandReferenceApp(this.registry, (id, opt) => this.launchApp(id, opt));
        appContent = appInstance.createUI();
        break;

      case 'text-editor':
        title = 'Text Editor';
        icon = '📝';
        width = 840;
        height = 540;
        appInstance = new TextEditorApp(this.vfs, this.users);
        appContent = appInstance.createUI(options.path || null);
        break;

      case 'calculator':
        title = 'Calculator';
        icon = '🔢';
        width = 380;
        height = 500;
        appInstance = new CalculatorApp();
        appContent = appInstance.createUI();
        break;

      case 'system-monitor':
        title = 'System Monitor';
        icon = '📊';
        width = 900;
        height = 580;
        appInstance = new SystemMonitorApp(this.processes, this.users);
        appContent = appInstance.createUI();
        break;

      case 'settings':
        title = 'Settings';
        icon = '⚙️';
        width = 880;
        height = 580;
        appInstance = new SettingsApp(this.storage, this.users);
        appContent = appInstance.createUI();
        break;

      case 'image-viewer':
        title = 'Image Viewer';
        icon = '🖼️';
        width = 720;
        height = 520;
        appInstance = new ImageViewerApp(this.vfs, this.users);
        appContent = appInstance.createUI(options.path || '/home/student/Pictures/mascot.svg');
        break;

      case 'about':
        title = 'About CyberLinux';
        icon = '🐼';
        width = 560;
        height = 460;
        appInstance = new AboutApp();
        appContent = appInstance.createUI();
        break;

      default:
        console.warn(`Unknown application ID: ${appId}`);
        return null;
    }

    const winData = this.wm.createWindow({
      id: appId,
      title,
      icon,
      width,
      height,
      content: appContent,
      onFocus: () => {
        if (appId === 'terminal' && appInstance) {
          appInstance.focus();
        }
      }
    });

    winData.appInstance = appInstance;
    return winData;
  }

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl + Alt + T: Open Terminal
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.launchApp('terminal');
      }
      // Ctrl + Shift + Esc: Open System Monitor
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        this.launchApp('system-monitor');
      }
      // Super / Windows key to toggle overview
      if (e.key === 'Meta') {
        sysEvents.emit('launcher:toggle');
      }
    });
  }

  setupThemeAndWallpaper() {
    const saved = this.storage.loadSettings() || {};
    const theme = saved.theme || 'light';
    const wallpaper = saved.wallpaper || 'mascot';

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    this.setWallpaper(wallpaper);

    sysEvents.on('theme:toggle', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      this.storage.saveSettings({ ...this.storage.loadSettings(), theme: isDark ? 'dark' : 'light' });
    });

    sysEvents.on('theme:set', (val) => {
      if (val === 'dark') document.body.classList.add('dark-theme');
      else document.body.classList.remove('dark-theme');
      this.storage.saveSettings({ ...this.storage.loadSettings(), theme: val });
    });

    sysEvents.on('wallpaper:set', (wpId) => {
      this.setWallpaper(wpId);
      this.storage.saveSettings({ ...this.storage.loadSettings(), wallpaper: wpId });
    });
  }

  setWallpaper(wpId) {
    const wpEl = document.getElementById('desktop-wallpaper');
    const wallpaperClass = WALLPAPER_CLASSES[wpId];
    if (!wpEl || !wallpaperClass) return;
    wpEl.classList.remove('wp-mascot', 'wp-cyber', 'wp-pastel', 'wp-slate');
    wpEl.classList.add(wallpaperClass);
  }
}

// Bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.cyberLinux = new CyberLinux();
});

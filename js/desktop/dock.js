import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * Dock (Dash)
 * Cute GNOME-inspired floating dock showing pinned favorite applications and running indicators.
 */
export class Dock {
  constructor(containerElement, appLauncherCallback, windowManager) {
    this.container = containerElement;
    this.appLauncherCallback = appLauncherCallback;
    this.wm = windowManager;
    this.items = new Map();

    this.defaultApps = [
      { id: 'command-quest', name: 'Command Quest', icon: '🚩' },
      { id: 'terminal', name: 'Terminal', icon: '💻' },
      { id: 'file-manager', name: 'Files', icon: '📁' },
      { id: 'command-reference', name: 'Reference', icon: '📖' },
      { id: 'text-editor', name: 'Editor', icon: '📝' },
      { id: 'system-monitor', name: 'Monitor', icon: '📊' },
      { id: 'calculator', name: 'Calculator', icon: '🔢' },
      { id: 'settings', name: 'Settings', icon: '⚙️' }
    ];

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    const dockInner = Sanitizer.createElement('div', { className: 'dock-inner' });

    // Applications Launcher Grid Button
    const launcherBtn = Sanitizer.createElement('button', {
      className: 'dock-item dock-launcher-btn',
      title: 'Show Applications (Super)',
      onClick: () => sysEvents.emit('launcher:toggle')
    }, [
      Sanitizer.createElement('span', { className: 'dock-icon' }, '⊞')
    ]);
    dockInner.appendChild(launcherBtn);

    const separator = Sanitizer.createElement('div', { className: 'dock-separator' });
    dockInner.appendChild(separator);

    // Default App Icons
    for (const app of this.defaultApps) {
      const itemEl = Sanitizer.createElement('button', {
        className: 'dock-item',
        title: app.name,
        dataset: { appId: app.id },
        onClick: () => this.handleItemClick(app.id)
      }, [
        Sanitizer.createElement('span', { className: 'dock-icon' }, app.icon),
        Sanitizer.createElement('span', { className: 'dock-indicator' })
      ]);

      dockInner.appendChild(itemEl);
      this.items.set(app.id, { app, element: itemEl });
    }

    this.container.appendChild(dockInner);
    this.setupEventListeners();
  }

  handleItemClick(appId) {
    const win = this.wm.windows.get(appId);
    if (!win) {
      this.appLauncherCallback(appId);
    } else if (win.minimized) {
      this.wm.restoreWindow(appId);
    } else if (this.wm.activeWindowId === appId) {
      this.wm.minimizeWindow(appId);
    } else {
      this.wm.focusWindow(appId);
    }
  }

  setupEventListeners() {
    sysEvents.on('window:opened', ({ id }) => this.updateRunningStatus(id, true));
    sysEvents.on('window:closed', ({ id }) => this.updateRunningStatus(id, false));
    sysEvents.on('window:focused', ({ id }) => this.updateFocusedStatus(id));
    sysEvents.on('window:minimized', () => this.updateFocusedStatus(null));
  }

  updateRunningStatus(appId, isRunning) {
    const item = this.items.get(appId);
    if (item) {
      if (isRunning) {
        item.element.classList.add('is-running');
      } else {
        item.element.classList.remove('is-running', 'is-active');
      }
    }
  }

  updateFocusedStatus(activeAppId) {
    for (const [id, item] of this.items.entries()) {
      if (id === activeAppId) {
        item.element.classList.add('is-active');
      } else {
        item.element.classList.remove('is-active');
      }
    }
  }
}

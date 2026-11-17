import { Sanitizer } from '../security/sanitizer.js';
import { PathValidator } from '../security/path-validator.js';
import { VirtualPermissions } from '../core/virtual-permissions.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * FileManagerApp (GNOME Files style)
 * Fully interactive graphical file manager synchronized with VirtualFileSystem.
 */
export class FileManagerApp {
  constructor(vfs, users, contextMenu, appLauncherCallback) {
    this.vfs = vfs;
    this.users = users;
    this.contextMenu = contextMenu;
    this.launchApp = appLauncherCallback;

    this.currentPath = '/home/student';
    this.history = ['/home/student'];
    this.historyIdx = 0;
    this.viewMode = 'grid'; // 'grid' | 'list'
    this.searchQuery = '';
    this.selectedFiles = new Set();
    this.clipboard = null;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'file-manager-container' });

    // Top Navigation & Actions Bar
    const topBar = Sanitizer.createElement('div', { className: 'fm-topbar' });
    
    // History Navigation
    const navControls = Sanitizer.createElement('div', { className: 'fm-nav-controls' });
    this.backBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'Back',
      onClick: () => this.goBack()
    }, '←');

    this.fwdBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'Forward',
      onClick: () => this.goForward()
    }, '→');

    this.upBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'Up Directory',
      onClick: () => this.goUp()
    }, '↑');

    navControls.appendChild(this.backBtn);
    navControls.appendChild(this.fwdBtn);
    navControls.appendChild(this.upBtn);

    // Breadcrumbs
    this.breadcrumbBar = Sanitizer.createElement('div', {
      className: 'fm-breadcrumbs',
      onContextMenu: (e) => {
        e.preventDefault();
        this.contextMenu.show([{
          icon: '📋',
          label: 'Copy Current Path',
          action: () => this.copyPathToClipboard(this.currentPath)
        }], e.clientX, e.clientY);
      }
    });

    this.copyPathBtn = Sanitizer.createElement('button', {
      className: 'fm-btn fm-copy-path',
      title: 'Copy current path',
      'aria-label': 'Copy current path',
      onClick: () => this.copyPathToClipboard(this.currentPath)
    }, '📋');

    // View Controls & Actions
    const actionControls = Sanitizer.createElement('div', { className: 'fm-action-controls' });
    
    this.searchInput = Sanitizer.createElement('input', {
      type: 'text',
      className: 'fm-search-input',
      placeholder: 'Search files...',
      onInput: (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDirectory();
      }
    });

    const newFolderBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'New Folder',
      onClick: () => this.promptCreateFolder()
    }, '📁+');

    const newFileBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'New File',
      onClick: () => this.promptCreateFile()
    }, '📄+');

    const viewToggleBtn = Sanitizer.createElement('button', {
      className: 'fm-btn',
      title: 'Toggle View (Grid / List)',
      onClick: () => {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        this.renderDirectory();
      }
    }, '⊞/≡');

    actionControls.appendChild(this.searchInput);
    actionControls.appendChild(newFolderBtn);
    actionControls.appendChild(newFileBtn);
    actionControls.appendChild(viewToggleBtn);

    topBar.appendChild(navControls);
    topBar.appendChild(this.breadcrumbBar);
    topBar.appendChild(this.copyPathBtn);
    topBar.appendChild(actionControls);

    // Main Body: Sidebar + File View Area
    const bodyArea = Sanitizer.createElement('div', { className: 'fm-body' });

    // Sidebar (GNOME Places)
    const sidebar = Sanitizer.createElement('div', { className: 'fm-sidebar' });
    const places = [
      { name: 'Home', path: '/home/student', icon: '🏠' },
      { name: 'Desktop', path: '/home/student/Desktop', icon: '🖥️' },
      { name: 'Documents', path: '/home/student/Documents', icon: '📄' },
      { name: 'Downloads', path: '/home/student/Downloads', icon: '📥' },
      { name: 'Pictures', path: '/home/student/Pictures', icon: '🖼️' },
      { name: 'Projects', path: '/home/student/Projects', icon: '💻' },
      { name: 'System Root', path: '/', icon: '💽' },
      { name: 'System Logs', path: '/var/log', icon: '📋' }
    ];

    for (const p of places) {
      const placeItem = Sanitizer.createElement('div', {
        className: 'fm-place-item',
        onClick: () => this.navigateTo(p.path)
      }, [
        Sanitizer.createElement('span', { className: 'fm-place-icon' }, p.icon),
        Sanitizer.createElement('span', { className: 'fm-place-name' }, p.name)
      ]);
      sidebar.appendChild(placeItem);
    }

    // File View Area
    this.viewArea = Sanitizer.createElement('div', {
      className: 'fm-view-area',
      onContextMenu: (e) => {
        e.preventDefault();
        this.showBackgroundContextMenu(e.clientX, e.clientY);
      }
    });

    bodyArea.appendChild(sidebar);
    bodyArea.appendChild(this.viewArea);

    this.container.appendChild(topBar);
    this.container.appendChild(bodyArea);

    this.renderDirectory();
    this.setupListeners();
    return this.container;
  }

  navigateTo(path, pushHistory = true) {
    const norm = PathValidator.normalize(path);
    const node = this.vfs.getNode(norm);
    if (!node || node.type !== 'dir') return;

    this.currentPath = norm;
    if (pushHistory) {
      this.history = this.history.slice(0, this.historyIdx + 1);
      this.history.push(norm);
      this.historyIdx = this.history.length - 1;
    }

    this.selectedFiles.clear();
    this.renderDirectory();
    sysEvents.emit('vfs:navigate', { path: norm });
  }

  goBack() {
    if (this.historyIdx > 0) {
      this.historyIdx--;
      this.navigateTo(this.history[this.historyIdx], false);
    }
  }

  goForward() {
    if (this.historyIdx < this.history.length - 1) {
      this.historyIdx++;
      this.navigateTo(this.history[this.historyIdx], false);
    }
  }

  goUp() {
    const { dirname } = PathValidator.split(this.currentPath);
    this.navigateTo(dirname);
  }

  renderBreadcrumbs() {
    this.breadcrumbBar.innerHTML = '';
    const parts = this.currentPath.split('/').filter(Boolean);
    
    // Root button
    const rootBtn = Sanitizer.createElement('button', {
      className: 'fm-crumb',
      onClick: () => this.navigateTo('/')
    }, 'CyberLinux /');
    this.breadcrumbBar.appendChild(rootBtn);

    let accum = '';
    for (const part of parts) {
      accum += '/' + part;
      const targetPath = accum;
      const crumb = Sanitizer.createElement('button', {
        className: 'fm-crumb',
        onClick: () => this.navigateTo(targetPath)
      }, `${part} /`);
      this.breadcrumbBar.appendChild(crumb);
    }
  }

  renderDirectory() {
    this.renderBreadcrumbs();
    this.viewArea.innerHTML = '';

    const res = this.vfs.listDirectory(this.currentPath, '/', this.users.getCurrentUser());
    if (!res.success) {
      this.viewArea.appendChild(Sanitizer.createElement('div', { className: 'fm-error' }, `Cannot open directory: ${res.error}`));
      return;
    }

    let entries = res.entries;
    if (this.searchQuery) {
      entries = entries.filter(e => e.name.toLowerCase().includes(this.searchQuery));
    }

    // Sort: directories first, then alphabetical
    entries.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    if (entries.length === 0) {
      this.viewArea.appendChild(Sanitizer.createElement('div', { className: 'fm-empty' }, 'Folder is empty'));
      return;
    }

    const gridOrList = Sanitizer.createElement('div', {
      className: this.viewMode === 'grid' ? 'fm-grid' : 'fm-list'
    });

    for (const entry of entries) {
      const icon = this.getFileIcon(entry);
      const isDir = entry.type === 'dir';

      const itemEl = Sanitizer.createElement('div', {
        className: `fm-item ${this.selectedFiles.has(entry.name) ? 'selected' : ''}`,
        dataset: { name: entry.name },
        tabIndex: 0,
        onClick: (e) => {
          if (!e.ctrlKey) this.selectedFiles.clear();
          this.selectedFiles.add(entry.name);
          this.viewArea.querySelectorAll('.fm-item').forEach(el => el.classList.remove('selected'));
          itemEl.classList.add('selected');
        },
        onDblClick: () => {
          if (isDir) {
            this.navigateTo(`${this.currentPath === '/' ? '' : this.currentPath}/${entry.name}`);
          } else {
            this.openFile(entry);
          }
        },
        onContextMenu: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!this.selectedFiles.has(entry.name)) {
            this.selectedFiles.clear();
            this.selectedFiles.add(entry.name);
          }
          this.viewArea.querySelectorAll('.fm-item').forEach(el => {
            el.classList.toggle('selected', this.selectedFiles.has(el.dataset.name));
          });
          this.showContextMenu(e.clientX, e.clientY, entry);
        }
      }, [
        Sanitizer.createElement('span', { className: 'fm-item-icon' }, icon),
        Sanitizer.createElement('span', { className: 'fm-item-name' }, entry.name),
        this.viewMode === 'list' ? Sanitizer.createElement('span', { className: 'fm-item-size' }, `${entry.size} B`) : null,
        this.viewMode === 'list' ? Sanitizer.createElement('span', { className: 'fm-item-perms' }, entry.permString) : null
      ]);

      gridOrList.appendChild(itemEl);
    }

    this.viewArea.appendChild(gridOrList);
  }

  getFileIcon(entry) {
    if (entry.type === 'dir') return '📁';
    const name = entry.name.toLowerCase();
    if (name.endsWith('.txt') || name.endsWith('.md')) return '📄';
    if (name.endsWith('.py') || name.endsWith('.sh') || name.endsWith('.js')) return '📜';
    if (name.endsWith('.svg') || name.endsWith('.png') || name.endsWith('.jpg')) return '🖼️';
    if (name.endsWith('.pcap')) return '🦈';
    if (name.endsWith('.conf') || name.endsWith('.log')) return '📋';
    if (entry.node && entry.node.suid) return '⚡';
    return '📦';
  }

  openFile(entry) {
    const fullPath = PathValidator.normalize(`${this.currentPath}/${entry.name}`);
    if (entry.name.endsWith('.svg') || entry.name.endsWith('.png') || entry.name.endsWith('.jpg')) {
      this.launchApp('image-viewer', { path: fullPath });
    } else {
      this.launchApp('text-editor', { path: fullPath });
    }
  }

  showContextMenu(x, y, entry) {
    const fullPath = PathValidator.normalize(`${this.currentPath}/${entry.name}`);
    const items = [
      {
        icon: '📂',
        label: 'Open',
        action: () => entry.type === 'dir' ? this.navigateTo(fullPath) : this.openFile(entry)
      },
      { icon: '📋', label: 'Copy Path', action: () => this.copyPathToClipboard(fullPath) },
      { separator: true },
      { icon: '📄', label: 'Copy', action: () => this.copySelectedItems('copy') },
      { icon: '✂️', label: 'Cut', action: () => this.copySelectedItems('cut') },
      ...(this.clipboard ? [{ icon: '📥', label: 'Paste', action: () => this.pasteItems() }] : []),
      ...(entry.type === 'file' ? [{
        icon: '📝',
        label: 'Edit in Text Editor',
        action: () => this.launchApp('text-editor', { path: fullPath })
      }] : []),
      { separator: true },
      {
        icon: '✏️',
        label: 'Rename',
        action: () => this.promptRename(entry)
      },
      {
        icon: '🔒',
        label: 'Permissions & Properties',
        action: () => this.showPropertiesModal(entry, fullPath)
      },
      { separator: true },
      {
        icon: '🗑️',
        label: 'Delete',
        action: () => {
          this.vfs.removeNode(fullPath, '/', this.users.getCurrentUser(), true);
          this.renderDirectory();
        }
      }
    ];

    this.contextMenu.show(items, x, y);
  }

  showBackgroundContextMenu(x, y) {
    const items = [{
      icon: '📋',
      label: 'Copy Current Path',
      action: () => this.copyPathToClipboard(this.currentPath)
    }];
    if (this.clipboard) {
      items.push({ icon: '📥', label: 'Paste', action: () => this.pasteItems() });
    }
    this.contextMenu.show(items, x, y);
  }

  copySelectedItems(operation) {
    if (this.selectedFiles.size === 0) {
      sysEvents.emit('notify', { title: 'Nothing Selected', message: 'Select one or more items first.', type: 'error' });
      return;
    }
    this.clipboard = {
      operation,
      paths: Array.from(this.selectedFiles, name =>
        PathValidator.normalize(`${this.currentPath}/${name}`)
      )
    };
    sysEvents.emit('notify', {
      title: operation === 'cut' ? 'Items Cut' : 'Items Copied',
      message: `${this.clipboard.paths.length} item(s) ready to ${operation === 'cut' ? 'move' : 'paste'}.`,
      type: 'info'
    });
  }

  pasteItems() {
    if (!this.clipboard || this.clipboard.paths.length === 0) {
      sysEvents.emit('notify', { title: 'Clipboard Empty', message: 'Copy or cut an item before pasting.', type: 'error' });
      return;
    }

    const clipboard = this.clipboard;
    const sourcePaths = [...clipboard.paths];
    const user = this.users.getCurrentUser();
    let pastedCount = 0;

    for (const sourcePath of sourcePaths) {
      const sourceNode = this.vfs.getNode(sourcePath);
      if (!sourceNode) {
        sysEvents.emit('notify', { title: 'Paste Failed', message: `${sourcePath} no longer exists.`, type: 'error' });
        return;
      }
      if (sourceNode.type === 'dir' && (this.currentPath === sourcePath || this.currentPath.startsWith(`${sourcePath}/`))) {
        sysEvents.emit('notify', { title: 'Paste Failed', message: 'A folder cannot be pasted into itself or one of its subfolders.', type: 'error' });
        return;
      }

      const sourceName = PathValidator.split(sourcePath).basename;
      const destinationPath = PathValidator.normalize(`${this.currentPath}/${sourceName}`);
      if (clipboard.operation === 'cut') {
        if (PathValidator.split(sourcePath).dirname === this.currentPath) {
          pastedCount++;
          continue;
        }
        if (this.vfs.getNode(destinationPath)) {
          sysEvents.emit('notify', { title: 'Paste Failed', message: `${sourceName} already exists in this folder.`, type: 'error' });
          return;
        }
        const result = this.vfs.moveNode(sourcePath, this.currentPath, '/', user);
        if (!result.success) {
          sysEvents.emit('notify', { title: 'Paste Failed', message: result.error, type: 'error' });
          return;
        }
        clipboard.paths = clipboard.paths.filter(path => path !== sourcePath);
      } else {
        const uniquePath = this.getUniqueCopyPath(destinationPath);
        const result = this.vfs.copyNode(sourcePath, uniquePath, '/', user, true);
        if (!result.success) {
          sysEvents.emit('notify', { title: 'Paste Failed', message: result.error, type: 'error' });
          return;
        }
      }
      pastedCount++;
    }

    if (clipboard.operation === 'cut') this.clipboard = null;
    this.selectedFiles.clear();
    this.renderDirectory();
    sysEvents.emit('notify', {
      title: 'Paste Complete',
      message: pastedCount ? `${pastedCount} item(s) pasted.` : 'No items were changed.',
      type: 'info'
    });
  }

  getUniqueCopyPath(path) {
    if (!this.vfs.getNode(path)) return path;
    const { dirname, basename } = PathValidator.split(path);
    const extensionIndex = basename.lastIndexOf('.');
    const hasExtension = extensionIndex > 0;
    const stem = hasExtension ? basename.slice(0, extensionIndex) : basename;
    const extension = hasExtension ? basename.slice(extensionIndex) : '';
    let copyNumber = 1;
    let candidate;
    do {
      const suffix = copyNumber === 1 ? ' (copy)' : ` (copy ${copyNumber})`;
      candidate = PathValidator.normalize(`${dirname}/${stem}${suffix}${extension}`);
      copyNumber++;
    } while (this.vfs.getNode(candidate));
    return candidate;
  }

  async copyPathToClipboard(path) {
    let clipboardError = null;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Browser clipboard access is unavailable.');
      await navigator.clipboard.writeText(path);
    } catch (error) {
      clipboardError = error;
      if (!this.copyTextFallback(path)) {
        sysEvents.emit('notify', {
          title: 'Copy Path Failed',
          message: clipboardError.message || 'Clipboard access was denied.',
          type: 'error'
        });
        return;
      }
    }
    sysEvents.emit('notify', { title: 'Path Copied', message: path, type: 'info' });
  }

  copyTextFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  promptCreateFolder() {
    const name = prompt('Enter new folder name:');
    if (name) {
      const res = this.vfs.createDirectory(`${this.currentPath}/${name}`, '/', this.users.getCurrentUser());
      if (!res.success) alert(res.error);
      this.renderDirectory();
    }
  }

  promptCreateFile() {
    const name = prompt('Enter new file name:');
    if (name) {
      const res = this.vfs.writeFile(`${this.currentPath}/${name}`, '', '/', this.users.getCurrentUser());
      if (!res.success) alert(res.error);
      this.renderDirectory();
    }
  }

  promptRename(entry) {
    const newName = prompt('Enter new name:', entry.name);
    if (newName && newName !== entry.name) {
      const src = `${this.currentPath}/${entry.name}`;
      const dest = `${this.currentPath}/${newName}`;
      const res = this.vfs.moveNode(src, dest, '/', this.users.getCurrentUser());
      if (!res.success) alert(res.error);
      this.renderDirectory();
    }
  }

  showPropertiesModal(entry, fullPath) {
    const modeOctal = (entry.permissions).toString(8);
    const newMode = prompt(`File: ${entry.name}\nOwner: ${entry.owner}\nPermissions: ${entry.permString} (${modeOctal})\n\nChange octal mode (e.g. 755, 644, 4755 for SUID):`, modeOctal);
    if (newMode) {
      const res = this.vfs.chmod(fullPath, newMode, '/', this.users.getCurrentUser());
      if (!res.success) alert(res.error);
      this.renderDirectory();
    }
  }

  setupListeners() {
    sysEvents.on('vfs:change', () => {
      this.renderDirectory();
    });

    this.container.addEventListener('keydown', (e) => {
      if (!e.ctrlKey || !['c', 'x', 'v'].includes(e.key.toLowerCase())) return;
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      if (e.key.toLowerCase() === 'v') this.pasteItems();
      else this.copySelectedItems(e.key.toLowerCase() === 'x' ? 'cut' : 'copy');
    });
  }
}

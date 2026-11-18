import { Sanitizer } from '../security/sanitizer.js';
import { SecurityLimits } from '../security/limits.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * SettingsApp (GNOME Settings style)
 * Personalization, themes, cute wallpapers, user management, backup/restore, and reset.
 */
export class SettingsApp {
  constructor(storageManager, users, dialogs, initialSection = 'appearance') {
    this.storage = storageManager;
    this.users = users;
    this.dialogs = dialogs;
    this.activeSection = initialSection; // 'appearance' | 'wallpapers' | 'user' | 'backup'
    this.sidebar = null;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'settings-container' });

    // Sidebar navigation
    this.sidebar = Sanitizer.createElement('div', { className: 'settings-sidebar' });
    const sections = [
      { id: 'appearance', label: 'Appearance & Theme', icon: '🎨' },
      { id: 'wallpapers', label: 'Wallpapers', icon: '🖼️' },
      { id: 'user', label: 'User Profile', icon: '👤' },
      { id: 'backup', label: 'Backup & Reset', icon: '💾' }
    ];

    for (const sec of sections) {
      const btn = Sanitizer.createElement('button', {
        className: `settings-nav-item ${this.activeSection === sec.id ? 'active' : ''}`,
        onClick: () => {
          this.navigateToSection(sec.id);
        }
      }, [
        Sanitizer.createElement('span', { className: 'settings-nav-icon' }, sec.icon),
        Sanitizer.createElement('span', {}, sec.label)
      ]);
      btn.dataset.section = sec.id;
      this.sidebar.appendChild(btn);
    }

    // Main Content
    this.mainArea = Sanitizer.createElement('div', { className: 'settings-main-area' });

    this.container.appendChild(this.sidebar);
    this.container.appendChild(this.mainArea);

    this.renderSection();
    return this.container;
  }

  navigateToSection(sectionId) {
    const valid = ['appearance', 'wallpapers', 'user', 'backup'];
    if (!valid.includes(sectionId)) return;
    this.activeSection = sectionId;
    if (this.sidebar) {
      this.sidebar.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.section === sectionId);
      });
    }
    this.renderSection();
  }

  renderSection() {
    this.mainArea.innerHTML = '';
    if (this.activeSection === 'appearance') {
      this.renderAppearance();
    } else if (this.activeSection === 'wallpapers') {
      this.renderWallpapers();
    } else if (this.activeSection === 'user') {
      this.renderUser();
    } else if (this.activeSection === 'backup') {
      this.renderBackup();
    }
  }

  renderAppearance() {
    const isDark = document.body.classList.contains('dark-theme');

    const title = Sanitizer.createElement('h3', {}, 'Appearance & Themes');
    const desc = Sanitizer.createElement('p', { className: 'settings-desc' },
      'Customize desktop color mode and accent styling.'
    );

    const themeToggleWrapper = Sanitizer.createElement('div', { className: 'settings-row' }, [
      Sanitizer.createElement('div', {}, [
        Sanitizer.createElement('strong', {}, 'Color Theme'),
        Sanitizer.createElement('div', { className: 'subtext' }, 'Choose between clean light mode and cybersecurity dark mode')
      ]),
      Sanitizer.createElement('div', { className: 'theme-choice-buttons' }, [
        Sanitizer.createElement('button', {
          className: `theme-btn-card ${!isDark ? 'selected' : ''}`,
          onClick: () => {
            sysEvents.emit('theme:set', 'light');
            this.renderSection();
          }
        }, '☀️ Light Mode'),
        Sanitizer.createElement('button', {
          className: `theme-btn-card ${isDark ? 'selected' : ''}`,
          onClick: () => {
            sysEvents.emit('theme:set', 'dark');
            this.renderSection();
          }
        }, '🌙 Dark Mode')
      ])
    ]);

    this.mainArea.appendChild(title);
    this.mainArea.appendChild(desc);
    this.mainArea.appendChild(themeToggleWrapper);
  }

  renderWallpapers() {
    const title = Sanitizer.createElement('h3', {}, 'Desktop Wallpapers');
    const desc = Sanitizer.createElement('p', { className: 'settings-desc' },
      'Choose a wallpaper for your desktop.'
    );

    const wallpapersGrid = Sanitizer.createElement('div', { className: 'wallpapers-grid' });
    const savedSettings = this.storage.loadSettings() || {};
    const currentWallpaper = savedSettings.wallpaper || 'mascot';
    const wallpapers = [
      { id: 'mascot', name: 'Panda Mascot & Laptop', previewCls: 'wp-mascot' },
      { id: 'cyber-dark', name: 'Cyber Neon Grid', previewCls: 'wp-cyber' },
      { id: 'pastel-dawn', name: 'Pastel Sunrise', previewCls: 'wp-pastel' },
      { id: 'minimal-slate', name: 'Minimal Slate', previewCls: 'wp-slate' },
      { id: 'astronaut-jellyfish', name: 'Astronaut & Jellyfish', previewCls: 'wp-astronaut' },
      { id: 'neon-city', name: 'Neon Night City', previewCls: 'wp-neon-city' },
      { id: 'samurai-sunset', name: 'Samurai Sunset', previewCls: 'wp-samurai' },
      { id: 'minimalist-river', name: 'Minimalist River', previewCls: 'wp-river' }
    ];

    for (const wp of wallpapers) {
      const card = Sanitizer.createElement('div', {
        className: `wallpaper-card ${currentWallpaper === wp.id ? 'selected' : ''}`,
        onClick: () => {
          sysEvents.emit('wallpaper:set', wp.id);
          sysEvents.emit('notify', { title: 'Wallpaper Updated', message: `Set wallpaper to ${wp.name}`, type: 'info' });
          this.renderSection();
        }
      }, [
        Sanitizer.createElement('div', { className: `wallpaper-preview ${wp.previewCls}` }),
        Sanitizer.createElement('div', { className: 'wallpaper-name' }, wp.name)
      ]);
      wallpapersGrid.appendChild(card);
    }

    this.mainArea.appendChild(title);
    this.mainArea.appendChild(desc);
    this.mainArea.appendChild(wallpapersGrid);
  }

  renderUser() {
    const user = this.users.getCurrentUser();
    const title = Sanitizer.createElement('h3', {}, 'User Account & Privileges');

    const card = Sanitizer.createElement('div', { className: 'user-profile-card' }, [
      Sanitizer.createElement('div', { className: 'user-avatar' }, '🐼'),
      Sanitizer.createElement('div', { className: 'user-details' }, [
        Sanitizer.createElement('h4', {}, user.realname || 'Panda OS User'),
        Sanitizer.createElement('div', {}, `Username: ${user.name}`),
        Sanitizer.createElement('div', {}, `UID: ${user.uid} | GID: ${user.gid}`),
        Sanitizer.createElement('div', {}, `Home Directory: ${user.home}`),
        Sanitizer.createElement('div', {}, `Default Shell: ${user.shell}`),
        Sanitizer.createElement('div', {}, `Groups: ${(user.groups || []).join(', ')}`)
      ])
    ]);

    this.mainArea.appendChild(title);
    this.mainArea.appendChild(card);
  }

  renderBackup() {
    const title = Sanitizer.createElement('h3', {}, 'Data Persistence, Backup & Reset');
    const desc = Sanitizer.createElement('p', { className: 'settings-desc' },
      'Export and restore your entire virtual filesystem, created scripts, and learning progress.'
    );

    // Export button
    const exportRow = Sanitizer.createElement('div', { className: 'settings-row' }, [
      Sanitizer.createElement('div', {}, [
        Sanitizer.createElement('strong', {}, 'Export Simulator Backup'),
        Sanitizer.createElement('div', { className: 'subtext' }, 'Download a JSON backup of your virtual Linux environment')
      ]),
      Sanitizer.createElement('button', {
        className: 'btn-action',
        onClick: () => this.handleExport()
      }, '📥 Export JSON')
    ]);

    // Import button
    const importRow = Sanitizer.createElement('div', { className: 'settings-row' }, [
      Sanitizer.createElement('div', {}, [
        Sanitizer.createElement('strong', {}, 'Restore Simulator Backup'),
        Sanitizer.createElement('div', { className: 'subtext' }, 'Upload a previously exported JSON backup file')
      ]),
      Sanitizer.createElement('label', { className: 'btn-action btn-upload' }, [
        '📤 Import JSON',
        Sanitizer.createElement('input', {
          type: 'file',
          accept: '.json,application/json',
          style: { display: 'none' },
          onChange: (e) => this.handleImport(e)
        })
      ])
    ]);

    // Reset row
    const resetRow = Sanitizer.createElement('div', { className: 'settings-row danger-row' }, [
      Sanitizer.createElement('div', {}, [
        Sanitizer.createElement('strong', {}, 'Factory Reset Simulator'),
        Sanitizer.createElement('div', { className: 'subtext' }, 'Reset filesystem, progress, and settings to original defaults')
      ]),
      Sanitizer.createElement('button', {
        className: 'btn-danger',
        onClick: () => this.handleReset()
      }, '⚠️ Reset to Factory State')
    ]);

    this.mainArea.appendChild(title);
    this.mainArea.appendChild(desc);
    this.mainArea.appendChild(exportRow);
    this.mainArea.appendChild(importRow);
    this.mainArea.appendChild(resetRow);
  }

  handleExport() {
    const data = this.storage.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panda-os-backup-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleImport(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    if (file.size > SecurityLimits.MAX_BACKUP_SIZE_BYTES) {
      evt.target.value = '';
      this.dialogs.alert({
        title: 'Backup Is Too Large',
        message: `Choose a backup smaller than ${Math.floor(SecurityLimits.MAX_BACKUP_SIZE_BYTES / (1024 * 1024))} MB.`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const res = this.storage.importFullBackup(content);
      if (res.success) {
        await this.dialogs.alert({
          title: 'Backup Restored',
          message: 'Simulator backup restored successfully. Panda OS will now reload.'
        });
        window.location.reload();
      } else {
        await this.dialogs.alert({ title: 'Could Not Restore Backup', message: res.error });
      }
    };
    reader.onerror = () => {
      this.dialogs.alert({ title: 'Could Not Read Backup', message: 'The selected backup file could not be read.' });
    };
    reader.readAsText(file);
  }

  async handleReset() {
    const confirmed = await this.dialogs.confirm({
      title: 'Reset Panda OS?',
      message: 'All custom files and progress will be restored to defaults.',
      confirmLabel: 'Reset',
      danger: true
    });
    if (!confirmed) return;

    this.storage.resetAll();
    await this.dialogs.alert({
      title: 'Panda OS Reset',
      message: 'Panda OS has been reset and will now reload.'
    });
    window.location.reload();
  }
}

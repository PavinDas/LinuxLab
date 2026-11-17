import { SecurityLimits } from '../security/limits.js';
import { Sanitizer } from '../security/sanitizer.js';

/**
 * StorageManager
 * Manages persistence in browser localStorage / IndexedDB with strict schema validation.
 */
export class StorageManager {
  constructor(vfs, settings, progress) {
    this.vfs = vfs;
    this.settings = settings;
    this.progress = progress;
    this.prefix = SecurityLimits.STORAGE_KEY_PREFIX;
  }

  saveVFS() {
    try {
      const serialized = this.vfs.exportToJSON();
      localStorage.setItem(`${this.prefix}vfs`, serialized);
      return true;
    } catch (e) {
      console.warn('Could not save VFS to localStorage:', e);
      return false;
    }
  }

  loadVFS() {
    try {
      const data = localStorage.getItem(`${this.prefix}vfs`);
      if (data) {
        return this.vfs.importFromJSON(data);
      }
    } catch (e) {
      console.warn('Could not load VFS from localStorage:', e);
    }
    return false;
  }

  saveSettings(settingsObj) {
    try {
      localStorage.setItem(`${this.prefix}settings`, JSON.stringify(settingsObj));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(`${this.prefix}settings`);
      if (raw) {
        return Sanitizer.safeJSONParse(raw);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return null;
  }

  saveProgress(progressObj) {
    try {
      localStorage.setItem(`${this.prefix}progress`, JSON.stringify(progressObj));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(`${this.prefix}progress`);
      if (raw) {
        return Sanitizer.safeJSONParse(raw);
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
    return null;
  }

  saveHistory(historyArr) {
    try {
      const trimmed = historyArr.slice(-SecurityLimits.MAX_COMMAND_HISTORY);
      localStorage.setItem(`${this.prefix}history`, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }

  loadHistory() {
    try {
      const raw = localStorage.getItem(`${this.prefix}history`);
      if (raw) {
        const parsed = Sanitizer.safeJSONParse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  }

  exportFullBackup() {
    return JSON.stringify({
      version: 1,
      timestamp: new Date().toISOString(),
      vfs: JSON.parse(this.vfs.exportToJSON()),
      settings: this.loadSettings() || {},
      progress: this.loadProgress() || {}
    }, null, 2);
  }

  importFullBackup(jsonString) {
    try {
      if (typeof jsonString !== 'string' || jsonString.length > SecurityLimits.MAX_BACKUP_SIZE_BYTES) {
        return { success: false, error: 'Backup file is invalid or exceeds the size limit' };
      }
      const data = Sanitizer.safeJSONParse(jsonString);
      if (!data || data.version !== 1 || !data.vfs) {
        return { success: false, error: 'Invalid or incompatible backup file format' };
      }

      const vfsRes = this.vfs.importFromJSON(JSON.stringify(data.vfs));
      if (!vfsRes.success) return vfsRes;

      if (data.settings) this.saveSettings(data.settings);
      if (data.progress) this.saveProgress(data.progress);
      this.saveVFS();

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetAll() {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(this.prefix)) {
          localStorage.removeItem(k);
        }
      }
      return true;
    } catch (e) {
      console.error('Reset failed:', e);
      return false;
    }
  }
}

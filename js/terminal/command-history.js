import { SecurityLimits } from '../security/limits.js';

/**
 * CommandHistory
 * Manages terminal command history with arrow navigation and persistence.
 */
export class CommandHistory {
  constructor(initialHistory = []) {
    this.history = Array.isArray(initialHistory) ? [...initialHistory] : [];
    this.cursor = this.history.length;
    this.tempInput = '';
  }

  add(commandStr) {
    const trimmed = (commandStr || '').trim();
    if (!trimmed) return;
    // Don't duplicate immediate previous command
    if (this.history.length > 0 && this.history[this.history.length - 1] === trimmed) {
      this.cursor = this.history.length;
      return;
    }
    this.history.push(trimmed);
    if (this.history.length > SecurityLimits.MAX_COMMAND_HISTORY) {
      this.history.shift();
    }
    this.cursor = this.history.length;
  }

  previous(currentDraft = '') {
    if (this.cursor === this.history.length) {
      this.tempInput = currentDraft;
    }
    if (this.cursor > 0) {
      this.cursor--;
      return this.history[this.cursor];
    }
    return this.history[0] || '';
  }

  next() {
    if (this.cursor < this.history.length - 1) {
      this.cursor++;
      return this.history[this.cursor];
    } else if (this.cursor === this.history.length - 1) {
      this.cursor = this.history.length;
      return this.tempInput;
    }
    return '';
  }

  resetCursor() {
    this.cursor = this.history.length;
    this.tempInput = '';
  }

  getAll() {
    return [...this.history];
  }

  clear() {
    this.history = [];
    this.cursor = 0;
    this.tempInput = '';
  }
}

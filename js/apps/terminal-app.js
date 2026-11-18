import { Sanitizer } from '../security/sanitizer.js';
import { SecurityLimits } from '../security/limits.js';
import { filterTextInput } from '../security/input-validation.js';
import { CommandHistory } from '../terminal/command-history.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * TerminalApp
 * Interactive Linux terminal window with history, tab completion, themes, and font scaling.
 */
export class TerminalApp {
  constructor(shellInterpreter, storageManager) {
    this.shell = shellInterpreter;
    this.storage = storageManager;
    this.history = new CommandHistory(this.storage ? this.storage.loadHistory() : []);
    const saved = this.storage ? this.storage.loadSettings() : null;
    this.theme = (saved && saved.terminalTheme) || 'cyber-green';
    this.fontSize = 15;
    this.container = null;
    this.selectedText = '';
    this.isMouseDownOnScreen = false;
  }

  /** Create the UI elements for the terminal */
  createUI() {
    this.container = Sanitizer.createElement('div', {
      className: `terminal-container theme-${this.theme}`,
      style: { fontSize: `${this.fontSize}px` }
    });

    // Toolbar
    const toolbar = Sanitizer.createElement('div', { className: 'terminal-toolbar' });
    toolbar.addEventListener('mousedown', e => e.stopPropagation());
    toolbar.addEventListener('click', e => e.stopPropagation());
    // Prevent toolbar mousedown from clearing any text selection made in the terminal screen
    toolbar.addEventListener('mousedown', e => {
      // Only prevent default if there's an active text selection (to preserve it)
      const sel = window.getSelection ? window.getSelection().toString() : '';
      if (sel) e.preventDefault();
    });

    // Theme selector
    const themeSelect = Sanitizer.createElement('select', {
      className: 'term-select',
      title: 'Terminal Theme',
      onChange: e => this.setTheme(e.target.value)
    }, [
      Sanitizer.createElement('option', { value: 'cyber-green' }, 'Cyber Green'),
      Sanitizer.createElement('option', { value: 'gnome-dark' }, 'GNOME Dark'),
      Sanitizer.createElement('option', { value: 'matrix' }, 'Matrix Neon'),
      Sanitizer.createElement('option', { value: 'hacker-amber' }, 'Retro Amber'),
      Sanitizer.createElement('option', { value: 'light-solarized' }, 'Solarized Light'),
      Sanitizer.createElement('option', { value: 'light-zen' }, 'Zen Light'),
      Sanitizer.createElement('option', { value: 'dark-dracula' }, 'Dracula')
    ]);
    themeSelect.value = this.theme;

    // Font size buttons
    const fontPlus = Sanitizer.createElement('button', {
      className: 'term-btn',
      title: 'Increase Font',
      onClick: () => {
        if (this.fontSize < 22) {
          this.fontSize += 2;
          this.container.style.fontSize = `${this.fontSize}px`;
        }
      }
    }, 'A+');

    const fontMinus = Sanitizer.createElement('button', {
      className: 'term-btn',
      title: 'Decrease Font',
      onClick: () => {
        if (this.fontSize > 10) {
          this.fontSize -= 2;
          this.container.style.fontSize = `${this.fontSize}px`;
        }
      }
    }, 'A-');

    const clearBtn = Sanitizer.createElement('button', {
      className: 'term-btn',
      title: 'Clear Screen (Ctrl+L)',
      onClick: () => this.clearScreen()
    }, '🧹 Clear');

    const copyBtn = Sanitizer.createElement('button', {
      className: 'term-btn',
      title: 'Copy Selected Text (Ctrl+Shift+C / Ctrl+C)',
      onClick: (e) => {
        e.stopPropagation();
        this.copySelection();
      }
    }, '📋 Copy');
    // Prevent mousedown from clearing the text selection before click fires
    copyBtn.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
    });

    const pasteBtn = Sanitizer.createElement('button', {
      className: 'term-btn',
      title: 'Paste Text from Clipboard (Ctrl+Shift+V / Ctrl+V)',
      onClick: () => this.pasteClipboard()
    }, '📥 Paste');

    // Assemble toolbar
    toolbar.appendChild(themeSelect);
    toolbar.appendChild(fontMinus);
    toolbar.appendChild(fontPlus);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(pasteBtn);

    // Terminal screen
    this.screen = Sanitizer.createElement('div', { className: 'terminal-screen' });
    const banner = `Panda OS - Interactive Shell\nType 'help' for command categories, or 'man <command>' for manual pages.\nTry: 'ls -lah', 'id', 'nmap -sV 192.168.1.10', or 'linpeas'\n----------------------------------------------------------------------\n`;
    this.appendOutput(banner, 'term-banner');

    // Input line
    this.inputLine = Sanitizer.createElement('div', { className: 'terminal-input-line' });
    this.promptSpan = Sanitizer.createElement('span', { className: 'terminal-prompt' });
    this.updatePrompt();
    this.input = Sanitizer.createElement('input', {
      type: 'text',
      className: 'terminal-input',
      maxlength: SecurityLimits.MAX_INPUT_LENGTH,
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      onInput: e => {
        e.target.value = filterTextInput(e.target.value).slice(0, SecurityLimits.MAX_INPUT_LENGTH);
      }
    });
    this.inputLine.appendChild(this.promptSpan);
    this.inputLine.appendChild(this.input);
    this.screen.appendChild(this.inputLine);

    // Add to container
    this.container.appendChild(toolbar);
    this.container.appendChild(this.screen);

    // Register listeners
    this.setupListeners();
    return this.container;
  }

  /** Update the prompt */
  updatePrompt() {
    this.promptSpan.textContent = this.shell.getPrompt();
  }

  /** Theme switch */
  setTheme(themeName) {
    const valid = ['cyber-green', 'gnome-dark', 'matrix', 'hacker-amber', 'light-solarized', 'light-zen', 'dark-dracula'];
    if (!valid.includes(themeName)) return;
    valid.forEach(t => this.container.classList.remove(`theme-${t}`));
    this.theme = themeName;
    this.container.classList.add(`theme-${this.theme}`);
    if (this.storage) {
      const cur = this.storage.loadSettings() || {};
      this.storage.saveSettings({ ...cur, terminalTheme: this.theme });
    }
  }

  /** Copy selection or last output line */
  async copySelection(preselected = '') {
    let text = preselected;
    if (!text) {
      const liveSel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
      text = liveSel || this.selectedText || '';
      if (!text) {
        const outs = this.screen.querySelectorAll('.term-stdout, .term-echo-line');
        if (outs.length) text = outs[outs.length - 1].textContent || '';
      }
    }
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      sysEvents.emit('notify', { title: 'Terminal', message: 'Copied to clipboard', type: 'info' });
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  }

  /** Paste from clipboard */
  async pasteClipboard() {
    try {
      let txt = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        txt = await navigator.clipboard.readText();
      } else if (typeof window !== 'undefined' && window.prompt) {
        txt = window.prompt('Paste text to terminal:');
      }
      if (typeof txt === 'string' && txt) this.insertTextAtCursor(txt);
    } catch (e) {
      const fb = typeof window !== 'undefined' && window.prompt ? window.prompt('Paste text to terminal:') : '';
      if (fb) this.insertTextAtCursor(fb);
    }
  }

  /** Insert text at cursor */
  insertTextAtCursor(text) {
    if (!this.input) return;
    const clean = filterTextInput(text);
    const start = this.input.selectionStart ?? this.input.value.length;
    const end = this.input.selectionEnd ?? start;
    const cur = this.input.value;
    this.input.value = cur.slice(0, start) + clean + cur.slice(end);
    const newPos = start + clean.length;
    this.input.setSelectionRange(newPos, newPos);
    this.input.focus();
  }

  /** Focus input, respecting toolbar focus and text selection */
  focus() {
    if (!this.input) return;
    if (this.isMouseDownOnScreen) return;
    setTimeout(() => {
      if (this.isMouseDownOnScreen) return;
      if (typeof document !== 'undefined') {
        const active = document.activeElement;
        if (active && (active.closest('.terminal-toolbar') || active.tagName === 'SELECT')) return;
        const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
        if (sel && sel.length > 0) return;
        this.input.focus();
      }
    }, 50);
  }

  /** Clear screen but keep banner */
  clearScreen() {
    const banner = this.screen.querySelector('.term-banner');
    this.screen.innerHTML = '';
    if (banner) this.screen.appendChild(banner);
    this.screen.appendChild(this.inputLine);
    this.updatePrompt();
    this.focus();
  }

  /** Append output */
  appendOutput(text, className = 'term-output') {
    if (!text) return;
    const el = Sanitizer.createElement('div', { className }, text);
    this.screen.insertBefore(el, this.inputLine);
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  /** Set up listeners */
  setupListeners() {
    // ── Text selection & focus management ──────────────────────────────────
    let mouseDownX = 0;
    let mouseDownY = 0;
    let isDragging = false;

    // Listen for selection changes inside terminal screen
    document.addEventListener('selectionchange', () => {
      if (typeof window === 'undefined') return;
      const sel = window.getSelection();
      if (!sel) return;
      const str = sel.toString();
      if (str && this.screen && sel.anchorNode && this.screen.contains(sel.anchorNode)) {
        this.selectedText = str;
      }
    });

    this.screen.addEventListener('mousedown', (e) => {
      if (e.target === this.input) return;
      this.isMouseDownOnScreen = true;
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
      isDragging = false;
    });

    this.screen.addEventListener('mousemove', (e) => {
      if (e.buttons !== 1) return;
      const dx = Math.abs(e.clientX - mouseDownX);
      const dy = Math.abs(e.clientY - mouseDownY);
      if (dx > 4 || dy > 4) {
        isDragging = true;
      }
    });

    // Window mouseup ensures drag release is caught even if cursor leaves screen
    window.addEventListener('mouseup', (e) => {
      if (!this.isMouseDownOnScreen) return;
      this.isMouseDownOnScreen = false;

      const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
      if (sel) {
        this.selectedText = sel;
        isDragging = false;
        return; // Selection made, leave text highlighted and do NOT focus input
      }

      if (isDragging) {
        isDragging = false;
        return;
      }

      // Simple click inside screen without drag selection -> focus input
      if (this.screen && this.screen.contains(e.target) && e.target !== this.input) {
        this.input.focus();
      }
    });

    // Prevent native context menu on toolbar only
    this.container.addEventListener('contextmenu', e => {
      if (e.target.closest('.terminal-toolbar')) e.preventDefault();
    });

    // Global blocker: suppress any native context menu inside the terminal UI
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Native copy/paste shortcuts
    this.container.addEventListener('copy', e => {
      const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
      if (sel && sel.length > 0) {
        e.preventDefault();
        this.copySelection();
      }
    });
    this.container.addEventListener('paste', async e => {
      if (document.activeElement === this.input) return; // let input handle native paste
      e.preventDefault();
      await this.pasteClipboard();
    });

    // Keyboard shortcuts
    this.input.addEventListener('keydown', async e => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); this.copySelection(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') { e.preventDefault(); await this.pasteClipboard(); return; }
      if (e.key === 'Enter') {
        const val = this.input.value;
        this.input.value = '';
        this.history.add(val);
        if (this.storage) this.storage.saveHistory(this.history.getAll());
        this.appendOutput(`${this.shell.getPrompt()}${val}`, 'term-echo-line');
        if (val.trim()) {
          const result = await this.shell.execute(val);
          if (result.clearScreen) this.clearScreen();
          else {
            if (result.stdout) this.appendOutput(result.stdout, 'term-stdout');
            if (result.stderr) this.appendOutput(result.stderr, 'term-stderr');
          }
          if (result.exitShell) { sysEvents.emit('terminal:exit'); return; }
        }
        this.updatePrompt();
        this.history.resetCursor();
        this.screen.scrollTop = this.screen.scrollHeight;
        return;
      }
      if (e.key === 'ArrowUp') { e.preventDefault(); this.input.value = this.history.previous(this.input.value); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); this.input.value = this.history.next(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const { completions } = this.shell.getCompletions(this.input.value);
        if (completions.length === 1) {
          const parts = this.input.value.split(/\s+/);
          parts[parts.length - 1] = completions[0];
          this.input.value = parts.join(' ');
        } else if (completions.length > 1) {
          this.appendOutput(`${this.shell.getPrompt()}${this.input.value}`, 'term-echo-line');
          this.appendOutput(completions.join('  '), 'term-suggestions');
          this.updatePrompt();
        }
        return;
      }
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const val = this.input.value;
        const start = this.input.selectionStart ?? val.length;
        const end = this.input.selectionEnd ?? start;
        let del = start;
        if (start === end) {
          while (del > 0 && /\s/.test(val[del - 1])) del--;
          while (del > 0 && !/\s/.test(val[del - 1])) del--;
        }
        this.input.setRangeText('', del, end, 'start');
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); this.clearScreen(); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
        if (sel && sel.length > 0) { this.copySelection(); return; }
        e.preventDefault();
        this.appendOutput(`${this.shell.getPrompt()}${this.input.value}^C`, 'term-echo-line');
        this.input.value = '';
        this.updatePrompt();
        return;
      }
    });

    // React to external file manager navigation
    sysEvents.on('vfs:navigate', ({ path }) => {
      if (path) { this.shell.cwd = path; this.updatePrompt(); }
    });
  }

  /** Execute external command */
  executeExternalCommand(cmdString) {
    if (!this.input) return;
    this.input.value = cmdString;
    this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }
}

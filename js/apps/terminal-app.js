import { Sanitizer } from '../security/sanitizer.js';
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
    this.history = new CommandHistory(this.storage.loadHistory());
    this.theme = 'cyber-green'; // 'cyber-green' | 'gnome-dark' | 'matrix' | 'hacker-amber'
    this.fontSize = 15;
    this.container = null;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', {
      className: `terminal-container theme-${this.theme}`,
      style: { fontSize: `${this.fontSize}px` }
    });

    // Terminal Toolbar
    const toolbar = Sanitizer.createElement('div', { className: 'terminal-toolbar' });
    const themeSelect = Sanitizer.createElement('select', {
      className: 'term-select',
      title: 'Terminal Theme',
      onChange: (e) => {
        this.container.classList.remove(`theme-${this.theme}`);
        this.theme = e.target.value;
        this.container.classList.add(`theme-${this.theme}`);
      }
    }, [
      Sanitizer.createElement('option', { value: 'cyber-green' }, 'Cyber Green'),
      Sanitizer.createElement('option', { value: 'gnome-dark' }, 'GNOME Dark'),
      Sanitizer.createElement('option', { value: 'matrix' }, 'Matrix Neon'),
      Sanitizer.createElement('option', { value: 'hacker-amber' }, 'Retro Amber')
    ]);

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

    toolbar.appendChild(themeSelect);
    toolbar.appendChild(fontMinus);
    toolbar.appendChild(fontPlus);
    toolbar.appendChild(clearBtn);

    // Terminal Screen (Output + Input Line)
    this.screen = Sanitizer.createElement('div', { className: 'terminal-screen' });

    // Initial Welcome Banner
    const banner = `CyberLinux 2.0 LTS (Panda Edition) - Interactive Cybersecurity Shell
Type 'help' for command categories, or 'man <command>' for manual pages.
Try: 'ls -lah', 'id', 'nmap -sV 192.168.1.10', or 'linpeas'
----------------------------------------------------------------------
`;
    this.appendOutput(banner, 'term-banner');

    // Input Prompt Line
    this.inputLine = Sanitizer.createElement('div', { className: 'terminal-input-line' });
    this.promptSpan = Sanitizer.createElement('span', { className: 'terminal-prompt' });
    this.updatePrompt();

    this.input = Sanitizer.createElement('input', {
      type: 'text',
      className: 'terminal-input',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false'
    });

    this.inputLine.appendChild(this.promptSpan);
    this.inputLine.appendChild(this.input);
    this.screen.appendChild(this.inputLine);

    this.container.appendChild(toolbar);
    this.container.appendChild(this.screen);

    this.setupListeners();
    return this.container;
  }

  updatePrompt() {
    this.promptSpan.textContent = this.shell.getPrompt();
  }

  focus() {
    if (this.input) {
      setTimeout(() => this.input.focus(), 50);
    }
  }

  clearScreen() {
    const bannerEl = this.screen.querySelector('.term-banner');
    this.screen.innerHTML = '';
    if (bannerEl) this.screen.appendChild(bannerEl);
    this.screen.appendChild(this.inputLine);
    this.updatePrompt();
    this.focus();
  }

  appendOutput(text, className = 'term-output') {
    if (!text) return;
    const outEl = Sanitizer.createElement('div', { className }, text);
    this.screen.insertBefore(outEl, this.inputLine);
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  setupListeners() {
    this.screen.addEventListener('click', () => {
      this.input.focus();
    });

    this.input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = this.input.value;
        this.input.value = '';
        this.history.add(val);
        this.storage.saveHistory(this.history.getAll());

        // Echo command to output
        this.appendOutput(`${this.shell.getPrompt()}${val}`, 'term-echo-line');

        if (val.trim()) {
          const result = await this.shell.execute(val);
          if (result.clearScreen) {
            this.clearScreen();
          } else {
            if (result.stdout) this.appendOutput(result.stdout, 'term-stdout');
            if (result.stderr) this.appendOutput(result.stderr, 'term-stderr');
          }
          if (result.exitShell) {
            sysEvents.emit('terminal:exit');
            return;
          }
        }

        this.updatePrompt();
        this.history.resetCursor();
        this.screen.scrollTop = this.screen.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.input.value = this.history.previous(this.input.value);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.input.value = this.history.next();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const { completions, prefix } = this.shell.getCompletions(this.input.value);
        if (completions.length === 1) {
          const fullMatch = completions[0];
          const words = this.input.value.split(/\s+/);
          words[words.length - 1] = fullMatch;
          this.input.value = words.join(' ');
        } else if (completions.length > 1) {
          this.appendOutput(`${this.shell.getPrompt()}${this.input.value}`, 'term-echo-line');
          this.appendOutput(completions.join('  '), 'term-suggestions');
          this.updatePrompt();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.clearScreen();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.appendOutput(`${this.shell.getPrompt()}${this.input.value}^C`, 'term-echo-line');
        this.input.value = '';
        this.updatePrompt();
      }
    });

    // Listen for directory changes from GUI File Manager
    sysEvents.on('vfs:navigate', ({ path }) => {
      if (path) {
        this.shell.cwd = path;
        this.updatePrompt();
      }
    });
  }

  executeExternalCommand(cmdString) {
    if (!this.input) return;
    this.input.value = cmdString;
    this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }
}

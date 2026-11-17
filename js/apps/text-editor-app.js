import { Sanitizer } from '../security/sanitizer.js';
import { SecurityLimits } from '../security/limits.js';
import { validateVirtualPathInput } from '../security/input-validation.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * TextEditorApp (Gedit style)
 * Lightweight virtual text editor with line numbers, file statistics, and VFS integration.
 */
export class TextEditorApp {
  constructor(vfs, users, dialogs) {
    this.vfs = vfs;
    this.users = users;
    this.dialogs = dialogs;
    this.currentFilePath = null;
    this.isDirty = false;
  }

  createUI(initialFilePath = null) {
    this.container = Sanitizer.createElement('div', { className: 'text-editor-container' });

    // Toolbar
    const toolbar = Sanitizer.createElement('div', { className: 'editor-toolbar' });
    
    const newBtn = Sanitizer.createElement('button', {
      className: 'ed-btn',
      title: 'New File',
      onClick: () => this.newFile()
    }, '📄 New');

    const openBtn = Sanitizer.createElement('button', {
      className: 'ed-btn',
      title: 'Open Virtual File',
      onClick: () => this.promptOpenFile()
    }, '📂 Open');

    const saveBtn = Sanitizer.createElement('button', {
      className: 'ed-btn ed-btn-save',
      title: 'Save (Ctrl+S)',
      onClick: () => this.saveFile()
    }, '💾 Save');

    this.filenameDisplay = Sanitizer.createElement('span', { className: 'ed-filename' }, 'Untitled');

    toolbar.appendChild(newBtn);
    toolbar.appendChild(openBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(this.filenameDisplay);

    // Main Edit Area with Line Numbers
    const editArea = Sanitizer.createElement('div', { className: 'editor-edit-area' });
    this.lineNumbers = Sanitizer.createElement('div', { className: 'editor-linenums' });
    
    this.textarea = Sanitizer.createElement('textarea', {
      className: 'editor-textarea',
      maxlength: SecurityLimits.MAX_FILE_SIZE_BYTES,
      spellcheck: 'false',
      onInput: () => {
        this.isDirty = true;
        this.updateStats();
        this.updateLineNumbers();
        this.updateTitle();
      },
      onKeyDown: (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.saveFile();
        }
      }
    });

    editArea.appendChild(this.lineNumbers);
    editArea.appendChild(this.textarea);

    // Status bar
    this.statusBar = Sanitizer.createElement('div', { className: 'editor-statusbar' });
    this.statsLabel = Sanitizer.createElement('span', { className: 'ed-stats' }, 'Lines: 1 | Words: 0 | Chars: 0');
    this.statusBar.appendChild(this.statsLabel);

    this.container.appendChild(toolbar);
    this.container.appendChild(editArea);
    this.container.appendChild(this.statusBar);

    if (initialFilePath) {
      this.loadFile(initialFilePath);
    } else {
      this.newFile();
    }

    return this.container;
  }

  loadFile(path) {
    const res = this.vfs.readFile(path, '/', this.users.getCurrentUser());
    if (!res.success) {
      this.dialogs.alert({ title: 'Could Not Open File', message: res.error });
      return;
    }
    this.currentFilePath = path;
    this.textarea.value = res.content;
    this.isDirty = false;
    this.updateStats();
    this.updateLineNumbers();
    this.updateTitle();
  }

  async saveFile() {
    let targetPath = this.currentFilePath;
    if (!this.currentFilePath) {
      const home = this.users.getCurrentUser().home;
      const path = await this.dialogs.prompt({
        title: 'Save File As',
        message: `Enter an absolute path, for example ${home}/notes.txt.`,
        value: `${home}/untitled.txt`,
        maxLength: SecurityLimits.MAX_PATH_LENGTH,
        validate: validateVirtualPathInput
      });
      if (path === null || !path) return;
      targetPath = path;
    }

    const res = this.vfs.writeFile(targetPath, this.textarea.value, '/', this.users.getCurrentUser());
    if (!res.success) {
      await this.dialogs.alert({ title: 'Could Not Save File', message: res.error });
    } else {
      this.currentFilePath = targetPath;
      this.isDirty = false;
      this.updateTitle();
      sysEvents.emit('notify', {
        title: 'File Saved',
        message: `Successfully saved ${this.currentFilePath}`,
        type: 'info'
      });
    }
  }

  async newFile() {
    if (this.isDirty && !await this.dialogs.confirm({
      title: 'Discard Unsaved Changes?',
      message: 'Your changes have not been saved. Create a new file and discard them?',
      confirmLabel: 'Discard',
      danger: true
    })) return;
    this.currentFilePath = null;
    this.textarea.value = '';
    this.isDirty = false;
    this.updateStats();
    this.updateLineNumbers();
    this.updateTitle();
  }

  async promptOpenFile() {
    const path = await this.dialogs.prompt({
      title: 'Open Virtual File',
      message: 'Enter the path to the virtual file you want to open.',
      value: `${this.users.getCurrentUser().home}/Desktop/welcome.txt`,
      maxLength: SecurityLimits.MAX_PATH_LENGTH,
      validate: validateVirtualPathInput
    });
    if (path) {
      this.loadFile(path);
    }
  }

  updateTitle() {
    const name = this.currentFilePath ? this.currentFilePath.split('/').pop() : 'Untitled';
    this.filenameDisplay.textContent = `${name}${this.isDirty ? ' *' : ''}`;
  }

  updateStats() {
    const text = this.textarea.value;
    const lines = text.split('\n').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    this.statsLabel.textContent = `Lines: ${lines} | Words: ${words} | Chars: ${chars}`;
  }

  updateLineNumbers() {
    const lines = this.textarea.value.split('\n').length;
    let numbersText = '';
    for (let i = 1; i <= lines; i++) {
      numbersText += `${i}\n`;
    }
    this.lineNumbers.textContent = numbersText;
  }
}

import { Sanitizer } from '../security/sanitizer.js';
import { filterTextInput } from '../security/input-validation.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * CommandReferenceApp
 * In-app searchable Linux & Cybersecurity Command Catalog from the syllabus.
 */
export class CommandReferenceApp {
  constructor(commandRegistry, appLauncherCallback) {
    this.registry = commandRegistry;
    this.launchApp = appLauncherCallback;
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.selectedCommand = null;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'cmdref-container' });

    // Top Filter Bar
    const topBar = Sanitizer.createElement('div', { className: 'cmdref-topbar' });
    
    this.searchInput = Sanitizer.createElement('input', {
      type: 'text',
      className: 'cmdref-search',
      placeholder: 'Search 150+ Linux & Cybersecurity commands...',
      maxlength: 256,
      onInput: (e) => {
        e.target.value = filterTextInput(e.target.value).slice(0, 256);
        this.searchQuery = e.target.value;
        this.renderList();
      }
    });

    const categorySelect = Sanitizer.createElement('select', {
      className: 'cmdref-cat-select',
      onChange: (e) => {
        this.activeCategory = e.target.value;
        this.renderList();
      }
    });

    categorySelect.appendChild(Sanitizer.createElement('option', { value: 'All' }, 'All Categories'));
    for (const cat of this.registry.getCategories()) {
      categorySelect.appendChild(Sanitizer.createElement('option', { value: cat }, cat));
    }

    topBar.appendChild(this.searchInput);
    topBar.appendChild(categorySelect);

    // Main 2-column layout: Command List + Detail Panel
    const mainLayout = Sanitizer.createElement('div', { className: 'cmdref-layout' });
    this.listCol = Sanitizer.createElement('div', { className: 'cmdref-list-col' });
    this.detailCol = Sanitizer.createElement('div', { className: 'cmdref-detail-col' });

    mainLayout.appendChild(this.listCol);
    mainLayout.appendChild(this.detailCol);

    this.container.appendChild(topBar);
    this.container.appendChild(mainLayout);

    this.renderList();
    return this.container;
  }

  renderList() {
    this.listCol.innerHTML = '';
    const commands = this.registry.search(this.searchQuery, this.activeCategory);

    if (commands.length === 0) {
      this.listCol.appendChild(Sanitizer.createElement('div', { className: 'cmdref-empty' }, 'No commands found matching query.'));
      return;
    }

    if (!this.selectedCommand && commands.length > 0) {
      this.selectedCommand = commands[0];
    }

    for (const cmd of commands) {
      const isSelected = (this.selectedCommand && this.selectedCommand.name === cmd.name);
      const item = Sanitizer.createElement('div', {
        className: `cmdref-item ${isSelected ? 'selected' : ''}`,
        onClick: () => {
          this.selectedCommand = cmd;
          this.listCol.querySelectorAll('.cmdref-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
          this.renderDetail();
        }
      }, [
        Sanitizer.createElement('div', { className: 'cmdref-item-name' }, cmd.name),
        Sanitizer.createElement('div', { className: 'cmdref-item-desc' }, cmd.description)
      ]);
      this.listCol.appendChild(item);
    }

    this.renderDetail();
  }

  renderDetail() {
    this.detailCol.innerHTML = '';
    const cmd = this.selectedCommand;
    if (!cmd) return;

    const header = Sanitizer.createElement('div', { className: 'cmdref-detail-header' }, [
      Sanitizer.createElement('h2', { className: 'cmd-name-title' }, cmd.name),
      Sanitizer.createElement('span', { className: 'cmd-cat-badge' }, cmd.category),
      Sanitizer.createElement('span', { className: 'cmd-sim-badge' }, cmd.isSimulation ? 'Controlled Lab Simulation' : 'Virtual Linux Engine')
    ]);

    const descBox = Sanitizer.createElement('div', { className: 'cmd-section' }, [
      Sanitizer.createElement('h4', {}, 'Description'),
      Sanitizer.createElement('p', {}, cmd.description)
    ]);

    const syntaxBox = Sanitizer.createElement('div', { className: 'cmd-section' }, [
      Sanitizer.createElement('h4', {}, 'Syntax'),
      Sanitizer.createElement('pre', { className: 'cmd-code-block' }, cmd.syntax)
    ]);

    const optionsBox = Sanitizer.createElement('div', { className: 'cmd-section' }, [
      Sanitizer.createElement('h4', {}, 'Options & Flags'),
      cmd.options.length > 0 ? Sanitizer.createElement('ul', {}, cmd.options.map(o => Sanitizer.createElement('li', {}, o))) : Sanitizer.createElement('p', {}, 'Standard command execution without mandatory flags.')
    ]);

    const practicalBox = Sanitizer.createElement('div', { className: 'cmd-section' }, [
      Sanitizer.createElement('h4', {}, 'Practical Cybersecurity Use'),
      Sanitizer.createElement('p', {}, cmd.practicalUse)
    ]);

    const exampleBox = Sanitizer.createElement('div', { className: 'cmd-section' }, [
      Sanitizer.createElement('h4', {}, 'Example & Expected Output'),
      Sanitizer.createElement('pre', { className: 'cmd-code-block' }, `$ ${cmd.example}\n${cmd.expectedOutput}`)
    ]);

    // Action button: Try in Terminal
    const tryBtn = Sanitizer.createElement('button', {
      className: 'btn-action btn-try-cmd',
      onClick: () => {
        this.launchApp('terminal');
        sysEvents.emit('terminal:run', cmd.example);
      }
    }, `💻 Run "${cmd.example}" in Terminal`);

    this.detailCol.appendChild(header);
    this.detailCol.appendChild(descBox);
    this.detailCol.appendChild(syntaxBox);
    this.detailCol.appendChild(optionsBox);
    this.detailCol.appendChild(practicalBox);
    this.detailCol.appendChild(exampleBox);
    this.detailCol.appendChild(tryBtn);
  }
}

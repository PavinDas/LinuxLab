import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * Application Launcher (GNOME App Overview)
 * Fullscreen categorized application grid with live search.
 */
export class Launcher {
  constructor(containerElement, allApps, launchCallback) {
    this.container = containerElement;
    this.apps = allApps;
    this.launchCallback = launchCallback;
    this.isOpen = false;
    this.activeCategory = 'All';
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'launcher-overlay hidden';

    // Click outside to close
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    const inner = Sanitizer.createElement('div', { className: 'launcher-inner' });

    // Search bar
    const searchWrapper = Sanitizer.createElement('div', { className: 'launcher-search-wrapper' });
    this.searchInput = Sanitizer.createElement('input', {
      type: 'text',
      className: 'launcher-search-input',
      placeholder: 'Type to search applications...',
      onInput: () => this.renderApps()
    });
    searchWrapper.appendChild(this.searchInput);

    // Categories
    const categoriesWrapper = Sanitizer.createElement('div', { className: 'launcher-categories' });
    const categories = ['All', 'Cybersecurity', 'System', 'Utilities'];

    for (const cat of categories) {
      const catBtn = Sanitizer.createElement('button', {
        className: `launcher-cat-btn ${cat === 'All' ? 'active' : ''}`,
        onClick: () => {
          this.activeCategory = cat;
          inner.querySelectorAll('.launcher-cat-btn').forEach(b => b.classList.remove('active'));
          catBtn.classList.add('active');
          this.renderApps();
        }
      }, cat);
      categoriesWrapper.appendChild(catBtn);
    }

    // App Grid
    this.grid = Sanitizer.createElement('div', { className: 'launcher-grid' });

    inner.appendChild(searchWrapper);
    inner.appendChild(categoriesWrapper);
    inner.appendChild(this.grid);
    this.container.appendChild(inner);

    this.renderApps();
    this.setupListeners();
  }

  setupListeners() {
    sysEvents.on('launcher:toggle', () => this.toggle());
    sysEvents.on('launcher:open', () => this.open());
    sysEvents.on('launcher:close', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
      // Super / Windows key to toggle launcher
      if (e.key === 'Meta') {
        this.toggle();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.searchInput.value = '';
    this.renderApps();
    setTimeout(() => this.searchInput.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  renderApps() {
    this.grid.innerHTML = '';
    const query = this.searchInput.value.toLowerCase().trim();

    const filtered = this.apps.filter(app => {
      const matchesCat = (this.activeCategory === 'All' || app.category === this.activeCategory);
      if (!matchesCat) return false;
      if (!query) return true;
      return (
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      const emptyEl = Sanitizer.createElement('div', { className: 'launcher-empty' }, 'No applications found.');
      this.grid.appendChild(emptyEl);
      return;
    }

    for (const app of filtered) {
      const card = Sanitizer.createElement('div', {
        className: 'launcher-card',
        onClick: () => {
          this.close();
          this.launchCallback(app.id);
        }
      }, [
        Sanitizer.createElement('div', { className: 'launcher-card-icon' }, app.icon),
        Sanitizer.createElement('div', { className: 'launcher-card-name' }, app.name),
        Sanitizer.createElement('div', { className: 'launcher-card-desc' }, app.description)
      ]);
      this.grid.appendChild(card);
    }
  }
}

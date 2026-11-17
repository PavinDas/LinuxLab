import { Sanitizer } from '../security/sanitizer.js';

/**
 * ContextMenu
 * Reusable custom context menu for desktop and file manager.
 */
export class ContextMenu {
  constructor() {
    this.menuEl = Sanitizer.createElement('div', { className: 'custom-context-menu hidden' });
    document.body.appendChild(this.menuEl);

    document.addEventListener('click', () => this.hide());
    window.addEventListener('resize', () => this.hide());
  }

  show(items, x, y) {
    this.menuEl.innerHTML = '';
    for (const item of items) {
      if (item.separator) {
        this.menuEl.appendChild(Sanitizer.createElement('div', { className: 'context-separator' }));
      } else {
        const itemEl = Sanitizer.createElement('div', {
          className: 'context-item',
          onClick: (e) => {
            e.stopPropagation();
            this.hide();
            if (typeof item.action === 'function') item.action();
          }
        }, [
          Sanitizer.createElement('span', { className: 'context-icon' }, item.icon || ''),
          Sanitizer.createElement('span', { className: 'context-label' }, item.label)
        ]);
        this.menuEl.appendChild(itemEl);
      }
    }

    this.menuEl.classList.remove('hidden');
    const bounds = this.menuEl.getBoundingClientRect();
    const posX = Math.max(10, Math.min(x, window.innerWidth - bounds.width - 10));
    const posY = Math.max(10, Math.min(y, window.innerHeight - bounds.height - 10));
    this.menuEl.style.left = `${posX}px`;
    this.menuEl.style.top = `${posY}px`;
  }

  hide() {
    this.menuEl.classList.add('hidden');
  }
}

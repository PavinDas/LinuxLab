import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * WindowManager
 * Manages desktop windows: creation, dragging, resizing, maximizing,
 * minimizing, stacking order (z-index), and viewport boundary constraints.
 */
export class WindowManager {
  constructor(desktopElement) {
    this.desktop = desktopElement;
    this.windows = new Map();
    this.activeWindowId = null;
    this.nextZIndex = 100;
    this.cascadeOffset = 0;
  }

  createWindow({ id, title, icon, width = 640, height = 440, minWidth = 360, minHeight = 240, content, appInstance, onFocus, onClose }) {
    // If window already exists, bring it to front
    if (this.windows.has(id)) {
      const existing = this.windows.get(id);
      if (existing.minimized) {
        this.restoreWindow(id);
      }
      this.focusWindow(id);
      return existing;
    }

    // Calculate initial position with cascade
    const desktopRect = this.desktop.getBoundingClientRect();
    width = Math.min(width, Math.max(1, desktopRect.width));
    height = Math.min(height, Math.max(1, desktopRect.height));
    const maxX = Math.max(0, desktopRect.width - width);
    const maxY = Math.max(0, desktopRect.height - height);

    const posX = Math.min(maxX, 60 + (this.cascadeOffset % 6) * 30);
    const posY = Math.min(maxY, 50 + (this.cascadeOffset % 6) * 30);
    this.cascadeOffset++;

    const winEl = Sanitizer.createElement('div', {
      className: 'desktop-window',
      id: `window-${id}`,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        left: `${posX}px`,
        top: `${posY}px`,
        zIndex: `${++this.nextZIndex}`
      }
    });

    // Window Title Bar
    const titleBar = Sanitizer.createElement('div', { className: 'window-titlebar' });
    
    // Left controls / icon
    const titleLeft = Sanitizer.createElement('div', { className: 'titlebar-left' }, [
      Sanitizer.createElement('span', { className: 'window-icon' }, icon || '💻'),
      Sanitizer.createElement('span', { className: 'window-title' }, title)
    ]);

    // Window Buttons (GNOME style)
    const titleControls = Sanitizer.createElement('div', { className: 'window-controls' });
    
    const minBtn = Sanitizer.createElement('button', {
      className: 'win-btn win-btn-minimize',
      title: 'Minimize',
      onClick: (e) => { e.stopPropagation(); this.minimizeWindow(id); }
    }, '−');

    const maxBtn = Sanitizer.createElement('button', {
      className: 'win-btn win-btn-maximize',
      title: 'Maximize',
      'aria-label': 'Maximize window',
      onClick: (e) => { e.stopPropagation(); this.toggleMaximize(id); }
    }, '□');

    const closeBtn = Sanitizer.createElement('button', {
      className: 'win-btn win-btn-close',
      title: 'Close',
      onClick: (e) => { e.stopPropagation(); this.closeWindow(id); }
    }, '✕');

    titleControls.appendChild(minBtn);
    titleControls.appendChild(maxBtn);
    titleControls.appendChild(closeBtn);

    titleBar.appendChild(titleLeft);
    titleBar.appendChild(titleControls);

    // Window Content Area
    const contentArea = Sanitizer.createElement('div', { className: 'window-content' });
    if (typeof content === 'string') {
      contentArea.textContent = content;
    } else if (content instanceof Node) {
      contentArea.appendChild(content);
    }

    // Resize Handles
    const resizeHandle = Sanitizer.createElement('div', { className: 'window-resize-handle' });

    winEl.appendChild(titleBar);
    winEl.appendChild(contentArea);
    winEl.appendChild(resizeHandle);

    this.desktop.appendChild(winEl);

    const winData = {
      id,
      title,
      icon,
      element: winEl,
      contentArea,
      maximized: false,
      minimized: false,
      prevBounds: { posX, posY, width, height },
      maximizeButton: maxBtn,
      minWidth,
      minHeight,
      appInstance,
      onFocus,
      onClose
    };

    this.windows.set(id, winData);
    this.setupWindowInteractions(winData, titleBar, resizeHandle);
    this.focusWindow(id);
    this.syncFullscreenState();

    sysEvents.emit('window:opened', { id, title, icon });
    return winData;
  }

  setupWindowInteractions(winData, titleBar, resizeHandle) {
    const el = winData.element;

    // Focus on mousedown
    el.addEventListener('mousedown', () => {
      this.focusWindow(winData.id);
    });

    // Dragging Titlebar
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    titleBar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      if (winData.maximized) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = el.offsetLeft;
      initialTop = el.offsetTop;
      el.classList.add('is-dragging');

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const deltaX = moveEvt.clientX - startX;
        const deltaY = moveEvt.clientY - startY;

        const desktopRect = this.desktop.getBoundingClientRect();
        // Constrain so window titlebar cannot leave viewport
        let newX = initialLeft + deltaX;
        let newY = initialTop + deltaY;

        newX = Math.max(0, Math.min(newX, desktopRect.width - 100));
        newY = Math.max(32, Math.min(newY, desktopRect.height - 50));

        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        el.classList.remove('is-dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Resizing
    let isResizing = false;
    let startW = 0, startH = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (winData.maximized) return;

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = el.offsetWidth;
      startH = el.offsetHeight;
      el.classList.add('is-resizing');

      const onMouseMove = (moveEvt) => {
        if (!isResizing) return;
        const newW = Math.max(winData.minWidth, startW + (moveEvt.clientX - startX));
        const newH = Math.max(winData.minHeight, startH + (moveEvt.clientY - startY));

        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
      };

      const onMouseUp = () => {
        isResizing = false;
        el.classList.remove('is-resizing');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  focusWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    const wasActive = (this.activeWindowId === id);
    this.activeWindowId = id;
    win.element.style.zIndex = `${++this.nextZIndex}`;

    // Remove active class from other windows
    for (const [wId, w] of this.windows.entries()) {
      if (wId === id) {
        w.element.classList.add('active');
      } else {
        w.element.classList.remove('active');
      }
    }

    if (!wasActive && typeof win.onFocus === 'function') {
      win.onFocus();
    }

    this.syncFullscreenState();
    sysEvents.emit('window:focused', { id, title: win.title });
  }

  syncFullscreenState() {
    const hasMaximizedWindow = Array.from(this.windows.values())
      .some((win) => win.maximized && !win.minimized);
    document.body.classList.toggle('app-fullscreen', hasMaximizedWindow);
  }

  resizeWindow(id, width, height) {
    const win = this.windows.get(id);
    if (!win || win.maximized) return false;

    const desktopRect = this.desktop.getBoundingClientRect();
    const availableWidth = Math.max(1, desktopRect.width);
    const availableHeight = Math.max(1, desktopRect.height);
    const nextWidth = Math.min(
      availableWidth,
      Math.max(Math.min(win.minWidth, availableWidth), Math.ceil(width))
    );
    const nextHeight = Math.min(
      availableHeight,
      Math.max(Math.min(win.minHeight, availableHeight), Math.ceil(height))
    );
    const left = Math.max(0, Math.min(win.element.offsetLeft, availableWidth - nextWidth));
    const top = Math.max(0, Math.min(win.element.offsetTop, availableHeight - nextHeight));

    win.element.style.width = `${nextWidth}px`;
    win.element.style.height = `${nextHeight}px`;
    win.element.style.left = `${left}px`;
    win.element.style.top = `${top}px`;
    win.prevBounds = { posX: left, posY: top, width: nextWidth, height: nextHeight };
    return true;
  }

  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.minimized = true;
    win.element.style.display = 'none';
    win.element.classList.remove('active');

    // Switch focus to another open window
    const openWindows = Array.from(this.windows.values()).filter(w => !w.minimized && w.id !== id);
    if (openWindows.length > 0) {
      this.focusWindow(openWindows[openWindows.length - 1].id);
    } else {
      this.activeWindowId = null;
    }

    this.syncFullscreenState();
    sysEvents.emit('window:minimized', { id });
  }

  restoreWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.minimized = false;
    win.element.style.display = 'flex';
    this.focusWindow(id);
    sysEvents.emit('window:restored', { id });
  }

  toggleMaximize(id) {
    const win = this.windows.get(id);
    if (!win) return;

    const el = win.element;
    if (win.maximized) {
      // Restore previous bounds
      el.classList.remove('maximized');
      el.style.left = `${win.prevBounds.posX}px`;
      el.style.top = `${win.prevBounds.posY}px`;
      el.style.width = `${win.prevBounds.width}px`;
      el.style.height = `${win.prevBounds.height}px`;
      win.maximized = false;
      this.resizeWindow(id, win.prevBounds.width, win.prevBounds.height);
      win.maximizeButton.title = 'Maximize';
      win.maximizeButton.setAttribute('aria-label', 'Maximize window');
    } else {
      // Save current bounds and maximize
      win.prevBounds = {
        posX: el.offsetLeft,
        posY: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight
      };
      el.classList.add('maximized');
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = '100%';
      el.style.height = '100%';
      win.maximized = true;
      win.maximizeButton.title = 'Restore';
      win.maximizeButton.setAttribute('aria-label', 'Restore window');
    }
    this.syncFullscreenState();
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (typeof win.onClose === 'function') {
      win.onClose();
    }

    win.element.remove();
    this.windows.delete(id);

    if (this.activeWindowId === id) {
      const remaining = Array.from(this.windows.values()).filter(w => !w.minimized);
      if (remaining.length > 0) {
        this.focusWindow(remaining[remaining.length - 1].id);
      } else {
        this.activeWindowId = null;
      }
    }

    this.syncFullscreenState();
    sysEvents.emit('window:closed', { id });
  }

  getOpenWindows() {
    return Array.from(this.windows.values());
  }
}

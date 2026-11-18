import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * Top System Panel (GNOME Bar)
 * Activities button, active window title, live clock & calendar, quick settings.
 */
export class TopPanel {
  constructor(containerElement, windowManager, launchCallback) {
    this.container = containerElement;
    this.wm = windowManager;
    this.launchCallback = launchCallback;
    this.isCalendarOpen = false;
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'top-panel';

    // Left Section
    const leftSec = Sanitizer.createElement('div', { className: 'panel-left' });
    const activitiesBtn = Sanitizer.createElement('button', {
      className: 'panel-btn activities-btn',
      onClick: () => sysEvents.emit('launcher:toggle')
    }, 'Activities');

    this.activeAppTitle = Sanitizer.createElement('span', { className: 'panel-active-app' }, 'Panda OS Desktop');

    leftSec.appendChild(activitiesBtn);
    leftSec.appendChild(this.activeAppTitle);

    // Center Section: Clock / Date
    const centerSec = Sanitizer.createElement('div', { className: 'panel-center' });
    this.clockBtn = Sanitizer.createElement('button', {
      className: 'panel-btn clock-btn',
      onClick: () => this.toggleCalendar()
    });
    centerSec.appendChild(this.clockBtn);

    // Right Section: Quick System Tray
    const rightSec = Sanitizer.createElement('div', { className: 'panel-right' });
    
    // Quick theme toggle
    const themeBtn = Sanitizer.createElement('button', {
      className: 'panel-btn panel-pill-btn',
      title: 'Toggle Theme (Light / Dark)',
      onClick: () => sysEvents.emit('theme:toggle')
    }, '🌓');

    this.fullscreenBtn = Sanitizer.createElement('button', {
      className: 'panel-btn panel-pill-btn fullscreen-btn',
      title: 'Enter Full Screen Desktop',
      'aria-label': 'Enter Full Screen Desktop',
      onClick: () => this.toggleFullscreen()
    }, '⛶');

    // Network / Audio / Battery Pill
    const statusPill = Sanitizer.createElement('div', {
      className: 'panel-pill-btn',
      title: 'System Status: Connected, Audio 100%, Battery 100%'
    }, [
      Sanitizer.createElement('span', { className: 'pill-icon' }, '📶'),
      Sanitizer.createElement('span', { className: 'pill-icon' }, '🔊'),
      Sanitizer.createElement('span', { className: 'pill-icon' }, '🔋')
    ]);

    // User profile pill
    const userBtn = Sanitizer.createElement('button', {
      className: 'panel-btn user-btn',
      title: 'Kiddy User Profile',
      onClick: () => this.launchCallback('settings', { section: 'user' })
    }, '👤 kiddy');

    rightSec.appendChild(themeBtn);
    rightSec.appendChild(this.fullscreenBtn);
    rightSec.appendChild(statusPill);
    rightSec.appendChild(userBtn);

    this.container.appendChild(leftSec);
    this.container.appendChild(centerSec);
    this.container.appendChild(rightSec);

    // Calendar Popup Dropdown
    this.calendarPopup = Sanitizer.createElement('div', { className: 'calendar-popup hidden' });
    this.renderCalendarPopup();
    this.container.appendChild(this.calendarPopup);

    this.startClock();
    this.setupListeners();
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      this.clockBtn.textContent = now.toLocaleDateString('en-US', options);
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  toggleCalendar() {
    this.isCalendarOpen = !this.isCalendarOpen;
    if (this.isCalendarOpen) {
      this.calendarPopup.classList.remove('hidden');
    } else {
      this.calendarPopup.classList.add('hidden');
    }
  }

  renderCalendarPopup() {
    this.calendarPopup.innerHTML = '';
    const now = new Date();
    const dateTitle = Sanitizer.createElement('div', { className: 'cal-title' },
      now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    );

    const calGrid = Sanitizer.createElement('div', { className: 'cal-grid' });
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (const d of days) {
      calGrid.appendChild(Sanitizer.createElement('div', { className: 'cal-day-header' }, d));
    }

    // November 2026 calendar days
    for (let i = 1; i <= 30; i++) {
      const isToday = (i === now.getDate());
      const dayEl = Sanitizer.createElement('div', {
        className: `cal-day ${isToday ? 'today' : ''}`
      }, String(i));
      calGrid.appendChild(dayEl);
    }

    this.calendarPopup.appendChild(dateTitle);
    this.calendarPopup.appendChild(calGrid);
  }

  setupListeners() {
    sysEvents.on('window:focused', ({ title }) => {
      this.activeAppTitle.textContent = title || 'Panda OS Desktop';
    });

    sysEvents.on('window:closed', () => {
      if (this.wm.windows.size === 0) {
        this.activeAppTitle.textContent = 'Panda OS Desktop';
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      this.fullscreenBtn.textContent = isFullscreen ? '×' : '⛶';
      this.fullscreenBtn.title = isFullscreen ? 'Exit Full Screen Desktop' : 'Enter Full Screen Desktop';
      this.fullscreenBtn.setAttribute('aria-label', this.fullscreenBtn.title);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.clock-btn') && !e.target.closest('.calendar-popup')) {
        this.isCalendarOpen = false;
        this.calendarPopup.classList.add('hidden');
      }
    });
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        throw new Error('Fullscreen mode is not supported by this browser.');
      }
    } catch (error) {
      console.error('Could not change desktop fullscreen mode:', error);
      sysEvents.emit('notify', {
        title: 'Fullscreen unavailable',
        message: error.message || 'The browser could not enter fullscreen mode.',
        type: 'error'
      });
    }
  }
}

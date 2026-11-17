import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * Notifications
 * Cute toast notifications for achievements, system alerts, and actions.
 */
export class NotificationManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.init();
  }

  init() {
    this.container.className = 'notifications-container';
    sysEvents.on('notify', (data) => this.show(data));
    sysEvents.on('badge:earned', ({ badge, reason }) => {
      this.show({
        title: '🏆 Achievement Unlocked!',
        message: `Badge: "${badge}" (${reason})`,
        type: 'badge'
      });
    });
  }

  show({ title, message, type = 'info', duration = 4000 }) {
    const toast = Sanitizer.createElement('div', {
      className: `notification-toast toast-${type}`
    }, [
      Sanitizer.createElement('div', { className: 'toast-header' }, [
        Sanitizer.createElement('span', { className: 'toast-title' }, title || 'System Notification'),
        Sanitizer.createElement('button', {
          className: 'toast-close',
          onClick: () => toast.remove()
        }, '✕')
      ]),
      Sanitizer.createElement('div', { className: 'toast-body' }, message)
    ]);

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}

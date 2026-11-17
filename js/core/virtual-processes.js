import { SecurityLimits } from '../security/limits.js';
import { sysEvents } from './event-bus.js';
import { SYSTEM_INFO } from './system-info.js';

/**
 * VirtualProcesses
 * Simulates standard Linux process tree, states, PID management, and resource statistics.
 */
export class VirtualProcesses {
  constructor() {
    this.processes = new Map();
    this.nextPid = 2000;
    this.initDefaultProcesses();
  }

  initDefaultProcesses() {
    this.processes.clear();
    const defaults = [
      { pid: 1, ppid: 0, user: 'root', cpu: 0.1, mem: 0.8, stat: 'Ss', command: '/sbin/init', startTime: '08:00' },
      { pid: 2, ppid: 0, user: 'root', cpu: 0.0, mem: 0.0, stat: 'S', command: '[kthreadd]', startTime: '08:00' },
      { pid: 380, ppid: 1, user: 'root', cpu: 0.0, mem: 0.4, stat: 'Ss', command: '/lib/systemd/systemd-journald', startTime: '08:00' },
      { pid: 412, ppid: 1, user: 'root', cpu: 0.0, mem: 0.3, stat: 'Ss', command: '/lib/systemd/systemd-udevd', startTime: '08:00' },
      { pid: 620, ppid: 1, user: 'root', cpu: 0.0, mem: 0.2, stat: 'Ss', command: '/usr/sbin/cron -f', startTime: '08:00' },
      { pid: 680, ppid: 1, user: 'root', cpu: 0.1, mem: 0.9, stat: 'Ssl', command: '/usr/sbin/NetworkManager', startTime: '08:00' },
      { pid: 710, ppid: 1, user: 'messagebus', cpu: 0.0, mem: 0.3, stat: 'Ss', command: '@dbus-daemon --system', startTime: '08:00' },
      { pid: 1240, ppid: 1, user: 'root', cpu: 0.0, mem: 0.5, stat: 'Ss', command: 'sshd: /usr/sbin/sshd -D', startTime: '08:12' },
      { pid: 1450, ppid: 1, user: SYSTEM_INFO.username, cpu: 0.2, mem: 2.1, stat: 'Ssl', command: '/usr/bin/gnome-shell', startTime: '08:15' },
      { pid: 1520, ppid: 1450, user: SYSTEM_INFO.username, cpu: 0.1, mem: 0.7, stat: 'Ss', command: '-bash', tty: 'pts/0', startTime: '08:15' }
    ];

    for (const p of defaults) {
      this.processes.set(p.pid, {
        pid: p.pid,
        ppid: p.ppid || 1,
        user: p.user || 'root',
        cpu: p.cpu,
        mem: p.mem,
        stat: p.stat || 'S',
        command: p.command,
        tty: p.tty || '?',
        startTime: p.startTime || '08:00',
        killable: p.pid > 100
      });
    }
  }

  list() {
    return Array.from(this.processes.values()).map(p => ({
      ...p,
      // Add slight dynamic jitter to cpu for realism in system monitor
      dynamicCpu: Math.max(0, (p.cpu + (Math.random() * 0.4 - 0.2)).toFixed(1))
    }));
  }

  get(pid) {
    return this.processes.get(Number(pid));
  }

  create(command, user = SYSTEM_INFO.username, options = {}) {
    if (this.processes.size >= SecurityLimits.MAX_PROCESSES) {
      return { success: false, error: 'Process limit reached' };
    }

    const pid = this.nextPid++;
    const proc = {
      pid,
      ppid: options.ppid || 1520,
      user,
      cpu: options.cpu || (Math.random() * 2 + 0.1).toFixed(1),
      mem: options.mem || (Math.random() * 1.5 + 0.5).toFixed(1),
      stat: options.stat || 'S+',
      command: String(command).substring(0, 128),
      tty: options.tty || 'pts/0',
      startTime: new Date().toTimeString().substring(0, 5),
      killable: true
    };

    this.processes.set(pid, proc);
    sysEvents.emit('process:created', proc);
    return { success: true, process: proc };
  }

  kill(pid, signal = 15, user = SYSTEM_INFO.username) {
    const p = this.processes.get(Number(pid));
    if (!p) {
      return { success: false, error: `No such process: ${pid}` };
    }
    if (user !== 'root' && p.user !== user) {
      return { success: false, error: 'Operation not permitted (must be process owner or root)' };
    }
    if (p.pid === 1) {
      return { success: false, error: 'Cannot kill init' };
    }

    this.processes.delete(Number(pid));
    sysEvents.emit('process:killed', { pid: Number(pid), signal });
    return { success: true, process: p };
  }

  killByName(name, user = SYSTEM_INFO.username) {
    let killed = 0;
    for (const [pid, p] of Array.from(this.processes.entries())) {
      if (p.command.includes(name)) {
        const res = this.kill(pid, 15, user);
        if (res.success) killed++;
      }
    }
    return killed;
  }

  getOverallStats() {
    let totalCpu = 4.2;
    let totalMem = 28.5; // percent
    for (const p of this.processes.values()) {
      totalCpu += parseFloat(p.cpu) || 0;
    }
    return {
      cpuUsage: Math.min(99, (totalCpu + (Math.random() * 4 - 2)).toFixed(1)),
      memUsage: Math.min(95, (totalMem + (Math.random() * 2 - 1)).toFixed(1)),
      totalMemMB: SYSTEM_INFO.memoryMB,
      usedMemMB: Math.round(SYSTEM_INFO.memoryMB * (totalMem / 100)),
      totalDiskGB: SYSTEM_INFO.storageGB,
      usedDiskGB: 8.4,
      diskUsagePercent: Number((8.4 / SYSTEM_INFO.storageGB * 100).toFixed(1))
    };
  }
}

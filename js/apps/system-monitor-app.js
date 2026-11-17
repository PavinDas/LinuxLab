import { Sanitizer } from '../security/sanitizer.js';
import { sysEvents } from '../core/event-bus.js';
import { SYSTEM_INFO } from '../core/system-info.js';

/**
 * SystemMonitorApp (GNOME System Monitor style)
 * Live simulated CPU, Memory, Disk meters and interactive process terminator.
 */
export class SystemMonitorApp {
  constructor(virtualProcesses, users) {
    this.processes = virtualProcesses;
    this.users = users;
    this.activeTab = 'resources'; // 'resources' | 'processes'
    this.selectedPid = null;
    this.timer = null;
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'sysmon-container' });

    // Top Tabs
    const tabsBar = Sanitizer.createElement('div', { className: 'sysmon-tabs' });
    this.resTabBtn = Sanitizer.createElement('button', {
      className: `sysmon-tab-btn ${this.activeTab === 'resources' ? 'active' : ''}`,
      onClick: () => this.switchTab('resources')
    }, '📊 Resources');

    this.procTabBtn = Sanitizer.createElement('button', {
      className: `sysmon-tab-btn ${this.activeTab === 'processes' ? 'active' : ''}`,
      onClick: () => this.switchTab('processes')
    }, '⚙️ Processes');

    tabsBar.appendChild(this.resTabBtn);
    tabsBar.appendChild(this.procTabBtn);

    // Tab Contents
    this.contentArea = Sanitizer.createElement('div', { className: 'sysmon-content' });

    this.container.appendChild(tabsBar);
    this.container.appendChild(this.contentArea);

    this.renderCurrentTab();
    this.startAutoRefresh();
    return this.container;
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.resTabBtn.classList.toggle('active', tab === 'resources');
    this.procTabBtn.classList.toggle('active', tab === 'processes');
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    this.contentArea.innerHTML = '';
    if (this.activeTab === 'resources') {
      this.renderResources();
    } else {
      this.renderProcesses();
    }
  }

  renderResources() {
    const stats = this.processes.getOverallStats();

    const resGrid = Sanitizer.createElement('div', { className: 'sysmon-res-grid' });

    // CPU Card
    const cpuCard = Sanitizer.createElement('div', { className: 'sysmon-card' }, [
      Sanitizer.createElement('div', { className: 'card-header' }, `CPU Usage (${SYSTEM_INFO.cpuCount} virtual CPUs)`),
      Sanitizer.createElement('div', { className: 'meter-bar-wrapper' }, [
        Sanitizer.createElement('div', {
          className: 'meter-bar-fill',
          style: { width: `${stats.cpuUsage}%` }
        })
      ]),
      Sanitizer.createElement('div', { className: 'card-value' }, `${stats.cpuUsage}% (${SYSTEM_INFO.cpuCount} Cores)`)
    ]);

    // Memory Card
    const memCard = Sanitizer.createElement('div', { className: 'sysmon-card' }, [
      Sanitizer.createElement('div', { className: 'card-header' }, 'Memory Usage (RAM)'),
      Sanitizer.createElement('div', { className: 'meter-bar-wrapper' }, [
        Sanitizer.createElement('div', {
          className: 'meter-bar-fill meter-mem',
          style: { width: `${stats.memUsage}%` }
        })
      ]),
      Sanitizer.createElement('div', { className: 'card-value' }, `${stats.usedMemMB} MB / ${stats.totalMemMB} MB (${stats.memUsage}%)`)
    ]);

    // Disk Storage Card
    const diskCard = Sanitizer.createElement('div', { className: 'sysmon-card' }, [
      Sanitizer.createElement('div', { className: 'card-header' }, 'Virtual Disk Storage (/)'),
      Sanitizer.createElement('div', { className: 'meter-bar-wrapper' }, [
        Sanitizer.createElement('div', {
          className: 'meter-bar-fill meter-disk',
          style: { width: `${stats.diskUsagePercent}%` }
        })
      ]),
      Sanitizer.createElement('div', { className: 'card-value' }, `${stats.usedDiskGB} GB / ${stats.totalDiskGB} GB (${stats.diskUsagePercent}%)`)
    ]);

    // Educational Note
    const notice = Sanitizer.createElement('div', { className: 'sysmon-notice' },
      'ℹ️ Note: These metrics represent the simulated Panda OS environment, completely isolated from your host operating system.'
    );

    resGrid.appendChild(cpuCard);
    resGrid.appendChild(memCard);
    resGrid.appendChild(diskCard);
    this.contentArea.appendChild(resGrid);
    this.contentArea.appendChild(notice);
  }

  renderProcesses() {
    const procs = this.processes.list();

    const tableWrapper = Sanitizer.createElement('div', { className: 'sysmon-table-wrapper' });
    const table = Sanitizer.createElement('table', { className: 'sysmon-table' });

    // Table Header
    const thead = Sanitizer.createElement('thead', {}, [
      Sanitizer.createElement('tr', {}, [
        Sanitizer.createElement('th', {}, 'PID'),
        Sanitizer.createElement('th', {}, 'Process Name'),
        Sanitizer.createElement('th', {}, 'User'),
        Sanitizer.createElement('th', {}, '%CPU'),
        Sanitizer.createElement('th', {}, '%MEM'),
        Sanitizer.createElement('th', {}, 'Status')
      ])
    ]);

    const tbody = Sanitizer.createElement('tbody');
    for (const p of procs) {
      const isSelected = (p.pid === this.selectedPid);
      const row = Sanitizer.createElement('tr', {
        className: `proc-row ${isSelected ? 'selected' : ''}`,
        onClick: () => {
          this.selectedPid = p.pid;
          tbody.querySelectorAll('.proc-row').forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
          this.endBtn.disabled = !p.killable;
        }
      }, [
        Sanitizer.createElement('td', {}, String(p.pid)),
        Sanitizer.createElement('td', { className: 'proc-name' }, p.command),
        Sanitizer.createElement('td', {}, p.user),
        Sanitizer.createElement('td', {}, `${p.dynamicCpu}%`),
        Sanitizer.createElement('td', {}, `${p.mem}%`),
        Sanitizer.createElement('td', {}, p.stat || 'S')
      ]);
      tbody.appendChild(row);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    // Actions Footer
    const footer = Sanitizer.createElement('div', { className: 'sysmon-footer' });
    this.endBtn = Sanitizer.createElement('button', {
      className: 'sysmon-btn-kill',
      disabled: true,
      onClick: () => {
        if (this.selectedPid) {
          const res = this.processes.kill(this.selectedPid, 15, this.users.getCurrentUsername());
          if (!res.success) {
            sysEvents.emit('notify', {
              title: 'Could Not End Process',
              message: res.error,
              type: 'error'
            });
          } else {
            this.selectedPid = null;
            this.renderProcesses();
            sysEvents.emit('notify', { title: 'Process Ended', message: `PID ${res.process.pid} was terminated.`, type: 'info' });
          }
        }
      }
    }, '🛑 End Process');

    footer.appendChild(this.endBtn);

    this.contentArea.appendChild(tableWrapper);
    this.contentArea.appendChild(footer);
  }

  startAutoRefresh() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      // Re-render only if container is currently attached to DOM
      if (this.container && this.container.isConnected) {
        if (this.activeTab === 'resources') {
          this.renderResources();
        }
      }
    }, 2500);
  }
}

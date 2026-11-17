import { SYSTEM_INFO } from './system-info.js';

/**
 * Virtual Users and Groups Manager
 * Simulates Linux user context, uid/gid, /etc/passwd and /etc/shadow information,
 * and sudo credentials.
 */
export class VirtualUsers {
  constructor() {
    this.users = new Map([
      ['root', { uid: 0, gid: 0, home: '/root', shell: '/bin/bash', groups: ['root'], realname: 'System Administrator' }],
      ['kiddy', { uid: 1000, gid: 1000, home: SYSTEM_INFO.home, shell: '/bin/bash', groups: ['kiddy', 'sudo', 'adm', 'netdev'], realname: 'Panda OS User' }],
      ['student', { uid: 1001, gid: 1001, home: '/home/student', shell: '/bin/bash', groups: ['student'], realname: 'Cybersecurity Student' }],
      ['daemon', { uid: 1, gid: 1, home: '/usr/sbin', shell: '/usr/sbin/nologin', groups: ['daemon'], realname: 'daemon' }],
      ['syslog', { uid: 104, gid: 110, home: '/home/syslog', shell: '/usr/sbin/nologin', groups: ['syslog', 'adm'], realname: 'syslog' }],
      ['nobody', { uid: 65534, gid: 65534, home: '/nonexistent', shell: '/usr/sbin/nologin', groups: ['nogroup'], realname: 'nobody' }]
    ]);

    this.groups = new Map([
      ['root', { gid: 0, members: ['root'] }],
      ['daemon', { gid: 1, members: ['daemon'] }],
      ['adm', { gid: 4, members: ['syslog', 'kiddy'] }],
      ['sudo', { gid: 27, members: ['kiddy'] }],
      ['netdev', { gid: 110, members: ['kiddy'] }],
      ['kiddy', { gid: 1000, members: ['kiddy'] }],
      ['student', { gid: 1001, members: ['student'] }],
      ['nogroup', { gid: 65534, members: ['nobody'] }]
    ]);

    this.currentUser = SYSTEM_INFO.username;
    this.hostname = SYSTEM_INFO.hostname;
  }

  getCurrentUser() {
    const data = this.users.get(this.currentUser) || this.users.get(SYSTEM_INFO.username);
    return { name: this.currentUser, ...data };
  }

  getCurrentUsername() {
    return this.currentUser;
  }

  setCurrentUser(username) {
    if (this.users.has(username)) {
      this.currentUser = username;
      return true;
    }
    return false;
  }

  isRoot() {
    return this.currentUser === 'root';
  }

  canSudo(username = this.currentUser) {
    const user = this.getUser(username);
    if (!user) return false;
    if (user.uid === 0) return true;
    return (user.groups || []).includes('sudo') || (user.groups || []).includes('wheel');
  }

  getUser(username) {
    const data = this.users.get(username);
    if (!data) return null;
    return { name: username, ...data };
  }

  getAllUsers() {
    return Array.from(this.users.entries()).map(([name, data]) => ({ name, ...data }));
  }

  getAllGroups() {
    return Array.from(this.groups.entries()).map(([name, data]) => ({ name, ...data }));
  }

  addUser(username, options = {}) {
    if (this.users.has(username)) {
      return { success: false, error: `User '${username}' already exists` };
    }
    const maxUid = Math.max(...Array.from(this.users.values()).map(u => u.uid).filter(u => u < 60000));
    const uid = options.uid || (maxUid >= 1000 ? maxUid + 1 : 1001);
    const gid = options.gid || uid;
    const home = options.home || `/home/${username}`;
    const shell = options.shell || '/bin/bash';
    const groups = options.groups || [username];

    this.users.set(username, { uid, gid, home, shell, groups, realname: options.realname || username });
    if (!this.groups.has(username)) {
      this.groups.set(username, { gid, members: [username] });
    }
    return { success: true, uid, gid };
  }

  deleteUser(username) {
    if (!this.users.has(username)) return { success: false, error: `User '${username}' does not exist` };
    if (username === 'root' || username === SYSTEM_INFO.username) return { success: false, error: 'Cannot delete system core user' };
    this.users.delete(username);
    return { success: true };
  }

  formatPasswd() {
    return Array.from(this.users.entries())
      .map(([name, u]) => `${name}:x:${u.uid}:${u.gid}:${u.realname}:${u.home}:${u.shell}`)
      .join('\n');
  }

  formatGroup() {
    return Array.from(this.groups.entries())
      .map(([name, g]) => `${name}:x:${g.gid}:${g.members.join(',')}`)
      .join('\n');
  }
}

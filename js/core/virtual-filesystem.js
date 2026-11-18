import { PathValidator } from '../security/path-validator.js';
import { VirtualPermissions } from './virtual-permissions.js';
import { SecurityLimits } from '../security/limits.js';
import { sysEvents } from './event-bus.js';
import { SYSTEM_INFO } from './system-info.js';

const FORENSIC_SAMPLE_IMAGES = [
  {
    name: 'marshmallow-sky.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:cyber="https://cyberlinux.local/metadata" viewBox="0 0 320 220">
  <metadata>
    <cyber:Title>Marshmallow Sky</cyber:Title>
    <cyber:Creator>CyberLinux Art Club</cyber:Creator>
    <cyber:Comment>A sleepy cloud drifting over a pastel garden.</cyber:Comment>
    <cyber:Flag>CL{clouds_hide_the_sweet_secret}</cyber:Flag>
  </metadata>
  <rect width="320" height="220" rx="28" fill="#dff4ef"/>
  <circle cx="266" cy="48" r="25" fill="#ffe5a8"/>
  <path d="M56 145c-20 0-31-13-31-29 0-17 13-29 31-29 7-20 25-32 46-32 24 0 44 17 48 40 19 1 32 14 32 31 0 18-14 31-34 31H56z" fill="#fffdfd" stroke="#bea8d1" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="84" cy="116" r="4" fill="#594b69"/><circle cx="119" cy="116" r="4" fill="#594b69"/>
  <path d="M94 128q8 8 16 0" fill="none" stroke="#594b69" stroke-width="3" stroke-linecap="round"/>
  <circle cx="72" cy="128" r="7" fill="#f3a4b9" opacity=".7"/><circle cx="131" cy="128" r="7" fill="#f3a4b9" opacity=".7"/>
  <path d="M0 184q70-32 142 0t178 0v36H0z" fill="#b9ddbb"/>
</svg>`
  },
  {
    name: 'panda-postcard.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:cyber="https://cyberlinux.local/metadata" viewBox="0 0 320 220">
  <metadata>
    <cyber:Title>Panda Postcard</cyber:Title>
    <cyber:Creator>CyberLinux Art Club</cyber:Creator>
    <cyber:Comment>A tiny panda says hello from the candy hills.</cyber:Comment>
    <cyber:Flag>CL{panda_says_hello_from_candy_hills}</cyber:Flag>
  </metadata>
  <rect width="320" height="220" rx="28" fill="#f7e8f2"/>
  <path d="M0 180q65-74 134 0t186-5v45H0z" fill="#d6c6ef"/>
  <circle cx="160" cy="109" r="64" fill="#fffdfd" stroke="#927fa5" stroke-width="5"/>
  <circle cx="112" cy="63" r="24" fill="#51445d"/><circle cx="208" cy="63" r="24" fill="#51445d"/>
  <ellipse cx="137" cy="107" rx="16" ry="23" fill="#51445d" transform="rotate(-16 137 107)"/>
  <ellipse cx="183" cy="107" rx="16" ry="23" fill="#51445d" transform="rotate(16 183 107)"/>
  <circle cx="140" cy="108" r="6" fill="#fff"/><circle cx="180" cy="108" r="6" fill="#fff"/>
  <ellipse cx="160" cy="129" rx="8" ry="6" fill="#51445d"/>
  <path d="M152 139q8 8 16 0" fill="none" stroke="#51445d" stroke-width="3" stroke-linecap="round"/>
  <circle cx="126" cy="135" r="8" fill="#f3a4b9" opacity=".7"/><circle cx="194" cy="135" r="8" fill="#f3a4b9" opacity=".7"/>
</svg>`
  }
];

const USER_PHOTO_ASSETS = [
  { name: 'IMG_5555.jpg', assetId: 'img-5555', size: 277142 },
  { name: 'IMG_5693.jpg', assetId: 'img-5693', size: 303975 }
];

/**
 * Node class representing files, directories, and symlinks in the VFS.
 */
export class VFSNode {
  constructor(name, type = 'file', options = {}) {
    this.name = name;
    this.type = type; // 'file' | 'dir' | 'symlink'
    this.permissions = options.permissions !== undefined ? options.permissions : (type === 'dir' ? 0o755 : 0o644);
    this.owner = options.owner || SYSTEM_INFO.username;
    this.group = options.group || SYSTEM_INFO.username;
    this.size = options.size || (options.content ? options.content.length : 0);
    this.mtime = options.mtime ? new Date(options.mtime) : new Date();
    this.ctime = options.ctime ? new Date(options.ctime) : new Date();
    this.atime = options.atime ? new Date(options.atime) : new Date();
    this.content = options.content || '';
    this.assetId = options.assetId || null;
    this.target = options.target || null; // for symlinks
    this.suid = !!options.suid;
    this.sgid = !!options.sgid;
    this.sticky = !!options.sticky;

    // Use Map to hold children to prevent prototype pollution
    this.children = type === 'dir' ? new Map() : null;
  }
}

/**
 * VirtualFileSystem
 * Tree-based virtual filesystem adhering to Linux directory hierarchy standards.
 */
export class VirtualFileSystem {
  constructor(virtualUsers) {
    this.users = virtualUsers;
    this.nodeCount = 0;
    this.root = new VFSNode('', 'dir', { permissions: 0o755, owner: 'root', group: 'root' });
    this.initDefaultFilesystem();
  }

  /**
   * Initialize a realistic Linux filesystem with cyber lab files
   */
  initDefaultFilesystem() {
    this.nodeCount = 1;
    // Standard Linux directories
    const dirs = [
      { path: '/bin', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/sbin', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/usr', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/usr/bin', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/usr/local', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/etc', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/home', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/home/student', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/home/student/Desktop', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/home/student/Documents', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/home/student/Downloads', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/home/student/Pictures', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/home/student/Projects', owner: 'student', group: 'student', perms: 0o755 },
      { path: '/root', owner: 'root', group: 'root', perms: 0o700 },
      { path: '/var', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/var/log', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/var/log/nginx', owner: 'root', group: 'root', perms: 0o755 },
      { path: '/tmp', owner: 'root', group: 'root', perms: 0o1777, sticky: true },
      { path: '/opt', owner: 'root', group: 'root', perms: 0o755 }
    ];

    for (const d of dirs) {
      this.rawMkdir(d.path, d.perms, d.owner, d.group, d.sticky);
    }

    // Default starter files
    this.rawCreateFile('/etc/hostname', `${SYSTEM_INFO.hostname}\n`, 0o644, 'root', 'root');
    this.rawCreateFile('/etc/os-release', `NAME="${SYSTEM_INFO.osName}"\nVERSION="1.0"\nID=pandaos\nID_LIKE=debian\nPRETTY_NAME="${SYSTEM_INFO.osName}"\nHOME_URL="https://github.com"\n`, 0o644, 'root', 'root');
    this.rawCreateFile('/etc/resolv.conf', 'nameserver 1.1.1.1\nnameserver 8.8.8.8\nsearch cyberlinux.local\n', 0o644, 'root', 'root');
    this.rawCreateFile('/etc/passwd', `root:x:0:0:root:/root:/bin/bash\nkiddy:x:1000:1000:Panda OS User:${SYSTEM_INFO.home}:/bin/bash\nstudent:x:1001:1001:Cybersecurity Student:/home/student:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nsyslog:x:104:110::/home/syslog:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n`, 0o644, 'root', 'root');
    this.rawCreateFile('/etc/shadow', 'root:$6$cyberlinux$hashedrootpass...:19500:0:99999:7:::\nkiddy:$6$pandaos$hashedkiddypass...:19500:0:99999:7:::\nstudent:$6$cyberlinux$hashedstudentpass...:19500:0:99999:7:::\n', 0o600, 'root', 'root');
    this.rawCreateFile('/etc/sudoers', `root ALL=(ALL:ALL) ALL\n%sudo ALL=(ALL:ALL) ALL\n${SYSTEM_INFO.username} ALL=(ALL) NOPASSWD: ALL\n`, 0o440, 'root', 'root');

    // System logs
    const authLogContent = `Nov 17 08:12:01 cyberlinux sshd[1240]: Server listening on 0.0.0.0 port 22.
Nov 17 08:15:22 cyberlinux sshd[1389]: Failed password for invalid user admin from 192.168.1.105 port 41220 ssh2
Nov 17 08:15:25 cyberlinux sshd[1389]: Failed password for invalid user admin from 192.168.1.105 port 41220 ssh2
Nov 17 08:16:04 cyberlinux sshd[1402]: Failed password for root from 192.168.1.105 port 41224 ssh2
Nov 17 08:18:45 cyberlinux sshd[1488]: Accepted publickey for student from 192.168.1.50 port 52310 ssh2
Nov 17 08:19:00 cyberlinux sudo: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt update
Nov 17 09:30:12 cyberlinux sshd[2104]: Connection closed by authenticating user test 192.168.1.200 port 39810 [preauth]
`;
    this.rawCreateFile('/var/log/auth.log', authLogContent, 0o640, 'root', 'adm');

    const syslogContent = `Nov 17 08:00:01 cyberlinux systemd[1]: Started Daily apt download activities.
Nov 17 08:00:05 cyberlinux kernel: [    0.000000] Linux version 6.8.0-cyber-generic (gcc version 13.2.0)
Nov 17 08:00:05 cyberlinux kernel: [    0.000000] Secure boot enabled
Nov 17 08:10:00 cyberlinux cron[620]: (CRON) INFO (pidfile fd = 3)
Nov 17 08:12:00 cyberlinux NetworkManager[680]: <info> [1700200000] device (eth0): state change: ip-config -> activated
Nov 17 08:15:00 cyberlinux systemd[1]: Starting OpenBSD Secure Shell server...
Nov 17 08:15:01 cyberlinux systemd[1]: Started OpenBSD Secure Shell server.
`;
    this.rawCreateFile('/var/log/syslog', syslogContent, 0o644, 'root', 'root');

    // Student desktop files
    const welcomeText = `# Welcome to Panda OS!
Welcome to your interactive Panda OS desktop.

Key Features:
- Full GNOME-inspired desktop interface with cute cartoon styling
- Powerful, realistic terminal emulator with 150+ Linux & security tools
- Synchronized GUI File Manager, Text Editor, Calculator, and System Monitor
- Interactive Cybersecurity Learning Center with 8-week structured roadmap
- Practice Labs: Privilege escalation, log analysis, SUID enumeration, and network reconnaissance

Tip: Press Ctrl+Alt+T or click the Terminal icon in the dock to get started.
Type 'help' or 'man <command>' to explore supported commands.
`;
    this.rawCreateFile('/home/student/Desktop/welcome.txt', welcomeText, 0o644, 'student', 'student');

    const pentestNotes = `# Penetration Testing Cheat Sheet & Notes
Target Lab IP: 192.168.1.10 (Metasploitable Lab)
Internal Range: 192.168.1.0/24

Reconnaissance commands:
- nmap -sV -sC 192.168.1.10
- gobuster dir -u http://192.168.1.10 -w /home/student/Documents/wordlist.txt
- nikto -h http://192.168.1.10
- whois example.com
- dig example.com ANY

Remember: Always practice ethical hacking strictly in authorized environments!
`;
    this.rawCreateFile('/home/student/Documents/pentest_notes.txt', pentestNotes, 0o644, 'student', 'student');

    const wordlist = `admin\npassword\nlogin\nsecret\nbackup\napi\ntest\ndev\ndashboard\nuploads\nconfig\nportal\nserver-status\n`;
    this.rawCreateFile('/home/student/Documents/wordlist.txt', wordlist, 0o644, 'student', 'student');

    const sampleScript = `#!/usr/bin/env python3
# CyberLinux Sample Port Scanner Script
import sys

print("[+] CyberLinux Port Scanner Simulation")
print("[+] Target host: 192.168.1.10")
ports = [21, 22, 80, 443, 3306, 8080]
for p in ports:
    status = "OPEN" if p in [21, 22, 80, 3306] else "CLOSED"
    print(f"Port {p:5d}/tcp : {status}")
`;
    this.rawCreateFile('/home/student/Projects/scanner.py', sampleScript, 0o755, 'student', 'student');

    const mascotSVG = `<svg width="256" height="256" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:cyber="https://cyberlinux.local/metadata">
  <metadata><cyber:Creator>CyberLinux Security Lab Mascot</cyber:Creator></metadata>
  <circle cx="100" cy="100" r="75" fill="#f8fafc" stroke="#334155" stroke-width="4"/>
  <circle cx="45" cy="50" r="22" fill="#1e293b"/>
  <circle cx="155" cy="50" r="22" fill="#1e293b"/>
  <ellipse cx="75" cy="95" rx="18" ry="24" fill="#1e293b" transform="rotate(-15 75 95)"/>
  <ellipse cx="125" cy="95" rx="18" ry="24" fill="#1e293b" transform="rotate(15 125 95)"/>
  <circle cx="78" cy="95" r="7" fill="#22c55e"/>
  <circle cx="122" cy="95" r="7" fill="#22c55e"/>
  <circle cx="80" cy="93" r="2.5" fill="#ffffff"/>
  <circle cx="124" cy="93" r="2.5" fill="#ffffff"/>
  <rect x="52" y="85" width="96" height="22" rx="6" fill="#10b981" fill-opacity="0.3" stroke="#10b981" stroke-width="2"/>
  <ellipse cx="100" cy="120" rx="9" ry="6" fill="#1e293b"/>
  <path d="M 92 130 Q 100 138 108 130" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="58" cy="118" r="8" fill="#fda4af" fill-opacity="0.6"/>
  <circle cx="142" cy="118" r="8" fill="#fda4af" fill-opacity="0.6"/>
</svg>`;
    this.rawCreateFile('/home/student/Pictures/mascot.svg', mascotSVG, 0o644, 'student', 'student');

    // SUID Privilege Escalation binary simulation
    this.rawCreateFile('/usr/bin/find', '#!/bin/bash\n# Standard binary with SUID demonstration\n', 0o4755, 'root', 'root', true);
    this.ensureForensicImages();
    this.ensureUserPhotos();
    this.ensureKiddyHome();
  }

  ensureKiddyHome() {
    if (this.getNode(SYSTEM_INFO.home)) return;

    const legacyHome = this.getNode('/home/student');
    const homeDirectory = this.getNode('/home');
    if (!homeDirectory || homeDirectory.type !== 'dir') {
      throw new Error('Cannot create Panda OS user home: /home is unavailable');
    }

    const cloneNode = (source, name) => {
      const owner = source.owner === 'student' ? SYSTEM_INFO.username : source.owner;
      const group = source.group === 'student' ? SYSTEM_INFO.username : source.group;
      const node = new VFSNode(name, source.type, {
        permissions: source.permissions,
        owner,
        group,
        size: source.size,
        mtime: source.mtime,
        content: source.content,
        assetId: source.assetId,
        target: source.target,
        suid: source.suid,
        sgid: source.sgid,
        sticky: source.sticky
      });

      if (source.type === 'dir') {
        for (const [childName, child] of source.children) {
          node.children.set(childName, cloneNode(child, childName));
        }
      }
      return node;
    };

    if (legacyHome && legacyHome.type === 'dir') {
      const countNodes = (node) => 1 + (node.type === 'dir'
        ? Array.from(node.children.values()).reduce((count, child) => count + countNodes(child), 0)
        : 0);
      const clonedNodeCount = countNodes(legacyHome);
      if (this.nodeCount + clonedNodeCount > SecurityLimits.MAX_FILESYSTEM_NODES) {
        throw new Error('Cannot migrate Panda OS user home: filesystem node limit would be exceeded');
      }
      homeDirectory.children.set(SYSTEM_INFO.username, cloneNode(legacyHome, SYSTEM_INFO.username));
      this.nodeCount += clonedNodeCount;
      return;
    }

    this.rawMkdir(SYSTEM_INFO.home, 0o755, SYSTEM_INFO.username, SYSTEM_INFO.username);
    for (const folder of ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Projects']) {
      this.rawMkdir(`${SYSTEM_INFO.home}/${folder}`, 0o755, SYSTEM_INFO.username, SYSTEM_INFO.username);
    }
  }

  ensurePandaOSProfile() {
    const rootUser = { name: 'root', uid: 0, gid: 0, groups: ['root'] };
    const readSystemFile = (path) => {
      const node = this.getNode(path);
      return node && node.type === 'file' ? node.content : '';
    };
    const writeSystemFile = (path, content, permissions = 0o644) => {
      if (!this.getNode(path)) {
        this.rawCreateFile(path, content, permissions, 'root', 'root');
        return;
      }
      const result = this.writeFile(path, content, '/', rootUser);
      if (!result.success) throw new Error(`Could not update ${path}: ${result.error}`);
    };

    const hostname = readSystemFile('/etc/hostname').trim();
    if (!hostname || hostname === 'cyberlinux') {
      writeSystemFile('/etc/hostname', `${SYSTEM_INFO.hostname}\n`);
    }

    let osRelease = readSystemFile('/etc/os-release');
    if (!osRelease) {
      osRelease = `NAME="${SYSTEM_INFO.osName}"\nVERSION="1.0"\nID=pandaos\nID_LIKE=debian\nPRETTY_NAME="${SYSTEM_INFO.osName}"\n`;
    } else if (osRelease.includes('CyberLinux')) {
      osRelease = osRelease
        .replace(/^NAME=.*$/m, `NAME="${SYSTEM_INFO.osName}"`)
        .replace(/^VERSION=.*$/m, 'VERSION="1.0"')
        .replace(/^ID=.*$/m, 'ID=pandaos')
        .replace(/^PRETTY_NAME=.*$/m, `PRETTY_NAME="${SYSTEM_INFO.osName}"`);
    }
    writeSystemFile('/etc/os-release', osRelease);

    const existingPasswd = readSystemFile('/etc/passwd');
    const remainingPasswd = existingPasswd.split('\n')
      .filter((line) => line && !['kiddy', 'student'].includes(line.split(':', 1)[0]));
    const kiddy = this.users.getUser(SYSTEM_INFO.username);
    const student = this.users.getUser('student');
    remainingPasswd.push(
      `${kiddy.name}:x:${kiddy.uid}:${kiddy.gid}:${kiddy.realname}:${kiddy.home}:${kiddy.shell}`,
      `${student.name}:x:${student.uid}:${student.gid}:${student.realname}:${student.home}:${student.shell}`
    );
    writeSystemFile('/etc/passwd', `${remainingPasswd.join('\n')}\n`);

    let shadow = readSystemFile('/etc/shadow');
    if (!shadow.split('\n').some((line) => line.startsWith(`${SYSTEM_INFO.username}:`))) {
      shadow += `${SYSTEM_INFO.username}:$6$pandaos$hashedkiddypass...:19500:0:99999:7:::\n`;
      writeSystemFile('/etc/shadow', shadow, 0o600);
    }

    let sudoers = readSystemFile('/etc/sudoers');
    if (!sudoers.split('\n').some((line) => line.startsWith(`${SYSTEM_INFO.username} `))) {
      sudoers += `${SYSTEM_INFO.username} ALL=(ALL) NOPASSWD: ALL\n`;
      writeSystemFile('/etc/sudoers', sudoers, 0o440);
    }
  }

  ensureForensicImages() {
    for (const [home, owner] of [[SYSTEM_INFO.home, SYSTEM_INFO.username], ['/home/student', 'student']]) {
      const picturesPath = `${home}/Pictures`;
      const pictures = this.getNode(picturesPath);
      if (!pictures || pictures.type !== 'dir') continue;

      for (const image of FORENSIC_SAMPLE_IMAGES) {
        const path = `${picturesPath}/${image.name}`;
        if (!this.getNode(path)) {
          this.rawCreateFile(path, image.content, 0o644, owner, owner);
        }
      }
    }
  }

  ensureUserPhotos() {
    for (const [home, owner] of [[SYSTEM_INFO.home, SYSTEM_INFO.username], ['/home/student', 'student']]) {
      const picturesPath = `${home}/Pictures`;
      const pictures = this.getNode(picturesPath);
      if (!pictures || pictures.type !== 'dir') continue;

      for (const image of USER_PHOTO_ASSETS) {
        const path = `${picturesPath}/${image.name}`;
        if (!this.getNode(path)) {
          this.rawCreateFile(path, '', 0o644, owner, owner, false, {
            assetId: image.assetId,
            size: image.size
          });
        }
      }
    }
  }

  rawMkdir(path, perms = 0o755, owner = 'root', group = 'root', sticky = false) {
    const norm = PathValidator.normalize(path);
    if (norm === '/') return this.root;

    const segments = norm.split('/').filter(Boolean);
    let curr = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!curr.children.has(seg)) {
        if (this.nodeCount >= SecurityLimits.MAX_FILESYSTEM_NODES) {
          throw new Error('VFS node limit exceeded');
        }
        const isTarget = (i === segments.length - 1);
        const node = new VFSNode(seg, 'dir', {
          permissions: isTarget ? perms : 0o755,
          owner: isTarget ? owner : 'root',
          group: isTarget ? group : 'root',
          sticky: isTarget ? sticky : false
        });
        curr.children.set(seg, node);
        this.nodeCount++;
        curr = node;
      } else {
        curr = curr.children.get(seg);
        if (curr.type !== 'dir') {
          throw new Error(`Path collision: ${seg} is not a directory`);
        }
      }
    }
    return curr;
  }

  rawCreateFile(path, content = '', perms = 0o644, owner = SYSTEM_INFO.username, group = SYSTEM_INFO.username, suid = false, fileOptions = {}) {
    const norm = PathValidator.normalize(path);
    const { dirname, basename } = PathValidator.split(norm);
    const parent = this.rawMkdir(dirname);

    if (this.nodeCount >= SecurityLimits.MAX_FILESYSTEM_NODES) {
      throw new Error('VFS node limit reached');
    }

    const node = new VFSNode(basename, 'file', {
      content: content.substring(0, SecurityLimits.MAX_FILE_SIZE_BYTES),
      size: fileOptions.size,
      assetId: fileOptions.assetId,
      permissions: perms,
      owner,
      group,
      suid
    });
    parent.children.set(basename, node);
    this.nodeCount++;
    return node;
  }

  /**
   * Find node by absolute or relative path
   */
  getNode(path, cwd = '/', homePath = SYSTEM_INFO.home) {
    const norm = PathValidator.normalize(path, cwd, homePath);
    if (norm === '/') return this.root;

    const segments = norm.split('/').filter(Boolean);
    let curr = this.root;

    for (const seg of segments) {
      if (!curr || curr.type !== 'dir' || !curr.children.has(seg)) {
        return null;
      }
      curr = curr.children.get(seg);
      // Handle symlink resolution if encountered
      if (curr.type === 'symlink' && curr.target) {
        return this.getNode(curr.target, cwd, homePath);
      }
    }
    return curr;
  }

  /**
   * Read file contents with permission checks
   */
  readFile(path, cwd = '/', userObj = null) {
    const user = userObj || this.users.getCurrentUser();
    const node = this.getNode(path, cwd, user.home);
    if (!node) {
      return { success: false, error: 'No such file or directory' };
    }
    if (node.type === 'dir') {
      return { success: false, error: 'Is a directory' };
    }
    if (!VirtualPermissions.checkAccess(node, user, 'r')) {
      return { success: false, error: 'Permission denied' };
    }
    node.atime = new Date();
    return { success: true, content: node.content, node };
  }

  /**
   * Write file contents with permission checks
   */
  writeFile(path, content, cwd = '/', userObj = null, append = false) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    const { dirname, basename } = PathValidator.split(norm);

    if (!PathValidator.isValidFilename(basename)) {
      return { success: false, error: 'Invalid filename' };
    }

    const parentNode = this.getNode(dirname, cwd, user.home);
    if (!parentNode) {
      return { success: false, error: `Cannot write to '${path}': Directory does not exist` };
    }
    if (parentNode.type !== 'dir') {
      return { success: false, error: `Cannot write to '${path}': Not a directory` };
    }
    if (!VirtualPermissions.checkAccess(parentNode, user, 'w')) {
      return { success: false, error: 'Permission denied in parent directory' };
    }

    let existing = parentNode.children.get(basename);
    if (existing) {
      if (existing.type === 'dir') {
        return { success: false, error: 'Is a directory' };
      }
      if (!VirtualPermissions.checkAccess(existing, user, 'w')) {
        return { success: false, error: 'Permission denied' };
      }
      const newContent = append ? existing.content + content : content;
      if (newContent.length > SecurityLimits.MAX_FILE_SIZE_BYTES) {
        return { success: false, error: 'File size exceeds maximum quota' };
      }
      existing.content = newContent;
      existing.size = newContent.length;
      existing.assetId = null;
      existing.mtime = new Date();
      sysEvents.emit('vfs:change', { type: 'modify', path: norm, node: existing });
      return { success: true, node: existing };
    }

    // Create new file
    if (this.nodeCount >= SecurityLimits.MAX_FILESYSTEM_NODES) {
      return { success: false, error: 'Filesystem full: max nodes reached' };
    }
    if (content.length > SecurityLimits.MAX_FILE_SIZE_BYTES) {
      return { success: false, error: 'File size exceeds maximum quota' };
    }

    const newNode = new VFSNode(basename, 'file', {
      content,
      size: content.length,
      owner: user.name || SYSTEM_INFO.username,
      group: (user.groups && user.groups[0]) || SYSTEM_INFO.username,
      permissions: 0o644
    });
    parentNode.children.set(basename, newNode);
    this.nodeCount++;
    sysEvents.emit('vfs:change', { type: 'create', path: norm, node: newNode });
    return { success: true, node: newNode };
  }

  /**
   * Create directory
   */
  createDirectory(path, cwd = '/', userObj = null, options = {}) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    const { dirname, basename } = PathValidator.split(norm);

    if (norm === '/') {
      return { success: false, error: 'Cannot create root directory' };
    }
    if (!PathValidator.isValidFilename(basename)) {
      return { success: false, error: 'Invalid directory name' };
    }

    let parentNode = this.getNode(dirname, cwd, user.home);
    if (!parentNode && options.parents) {
      parentNode = this.rawMkdir(dirname, 0o755, user.name, user.groups[0] || user.name);
    }
    if (!parentNode) {
      return { success: false, error: `No such file or directory: '${dirname}'` };
    }
    if (parentNode.type !== 'dir') {
      return { success: false, error: `Not a directory: '${dirname}'` };
    }
    if (!VirtualPermissions.checkAccess(parentNode, user, 'w')) {
      return { success: false, error: 'Permission denied' };
    }
    if (parentNode.children.has(basename)) {
      if (options.parents) return { success: true };
      return { success: false, error: `File exists: '${basename}'` };
    }

    if (this.nodeCount >= SecurityLimits.MAX_FILESYSTEM_NODES) {
      return { success: false, error: 'Filesystem full: max nodes reached' };
    }

    const dirNode = new VFSNode(basename, 'dir', {
      owner: user.name || SYSTEM_INFO.username,
      group: (user.groups && user.groups[0]) || SYSTEM_INFO.username,
      permissions: options.mode !== undefined ? options.mode : 0o755
    });
    parentNode.children.set(basename, dirNode);
    this.nodeCount++;
    sysEvents.emit('vfs:change', { type: 'mkdir', path: norm, node: dirNode });
    return { success: true, node: dirNode };
  }

  /**
   * Remove file or directory
   */
  removeNode(path, cwd = '/', userObj = null, recursive = false) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    if (norm === '/') {
      return { success: false, error: 'Cannot remove root directory' };
    }

    const { dirname, basename } = PathValidator.split(norm);
    const parentNode = this.getNode(dirname, cwd, user.home);
    if (!parentNode || parentNode.type !== 'dir') {
      return { success: false, error: 'No such file or directory' };
    }
    if (!parentNode.children.has(basename)) {
      return { success: false, error: 'No such file or directory' };
    }

    const target = parentNode.children.get(basename);
    if (!VirtualPermissions.checkAccess(parentNode, user, 'w')) {
      return { success: false, error: 'Permission denied' };
    }

    if (target.type === 'dir') {
      if (!recursive && target.children.size > 0) {
        return { success: false, error: 'Directory not empty' };
      }
    }

    parentNode.children.delete(basename);
    this.nodeCount--;
    sysEvents.emit('vfs:change', { type: 'delete', path: norm });
    return { success: true };
  }

  /**
   * Read directory entries
   */
  listDirectory(path, cwd = '/', userObj = null) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    const node = this.getNode(norm, '/', user.home);

    if (!node) {
      return { success: false, error: 'No such file or directory' };
    }
    if (node.type !== 'dir') {
      return { success: false, error: 'Not a directory' };
    }
    if (!VirtualPermissions.checkAccess(node, user, 'r')) {
      return { success: false, error: 'Permission denied' };
    }

    const entries = [];
    for (const [name, child] of node.children.entries()) {
      entries.push({
        name,
        type: child.type,
        size: child.size,
        permissions: child.permissions,
        permString: VirtualPermissions.modeToString(child.permissions, child.type === 'dir', child.suid, child.sgid, child.sticky),
        owner: child.owner,
        group: child.group,
        mtime: child.mtime,
        node: child
      });
    }
    return { success: true, path: norm, entries };
  }

  /**
   * Change permissions (chmod)
   */
  chmod(path, modeStr, cwd = '/', userObj = null) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    const node = this.getNode(norm, '/', user.home);

    if (!node) return { success: false, error: 'No such file or directory' };
    if (user.uid !== 0 && node.owner !== user.name) {
      return { success: false, error: 'Operation not permitted (must be file owner or root)' };
    }

    const newMode = VirtualPermissions.parseMode(modeStr, node.permissions);
    node.permissions = newMode & 0o777;
    // Check SUID/SGID bits
    node.suid = (newMode & 0o4000) !== 0;
    node.sgid = (newMode & 0o2000) !== 0;
    node.sticky = (newMode & 0o1000) !== 0;
    node.ctime = new Date();

    sysEvents.emit('vfs:change', { type: 'chmod', path: norm, node });
    return { success: true, mode: node.permissions };
  }

  /**
   * Change ownership (chown)
   */
  chown(path, owner, group = null, cwd = '/', userObj = null) {
    const user = userObj || this.users.getCurrentUser();
    const norm = PathValidator.normalize(path, cwd, user.home);
    const node = this.getNode(norm, '/', user.home);

    if (!node) return { success: false, error: 'No such file or directory' };
    if (user.uid !== 0) {
      return { success: false, error: 'Operation not permitted (only root can change file owner)' };
    }

    if (owner) node.owner = owner;
    if (group) node.group = group;
    node.ctime = new Date();

    sysEvents.emit('vfs:change', { type: 'chown', path: norm, node });
    return { success: true };
  }

  /**
   * Copy file or directory
   */
  copyNode(srcPath, destPath, cwd = '/', userObj = null, recursive = false) {
    const user = userObj || this.users.getCurrentUser();
    const srcNode = this.getNode(srcPath, cwd, user.home);
    if (!srcNode) return { success: false, error: 'No such file or directory' };

    if (srcNode.type === 'dir' && !recursive) {
      return { success: false, error: `-r not specified; omitting directory '${srcPath}'` };
    }

    const normDest = PathValidator.normalize(destPath, cwd, user.home);
    let targetDir = normDest;
    let targetName = PathValidator.split(srcPath).basename;

    const destNode = this.getNode(normDest, '/', user.home);
    if (destNode && destNode.type === 'dir') {
      targetDir = normDest;
    } else {
      const split = PathValidator.split(normDest);
      targetDir = split.dirname;
      targetName = split.basename;
    }

    return this.deepCopy(srcNode, targetDir, targetName, user);
  }

  deepCopy(srcNode, targetDir, targetName, user) {
    const targetPath = PathValidator.normalize(targetDir + '/' + targetName);
    if (srcNode.type === 'file') {
      const result = this.writeFile(targetPath, srcNode.content, '/', user);
      if (result.success && srcNode.assetId) {
        result.node.assetId = srcNode.assetId;
        result.node.size = srcNode.size;
      }
      return result;
    } else if (srcNode.type === 'dir') {
      const mkdirRes = this.createDirectory(targetPath, '/', user);
      if (!mkdirRes.success) return mkdirRes;
      for (const [childName, childNode] of srcNode.children.entries()) {
        const sub = this.deepCopy(childNode, targetPath, childName, user);
        if (!sub.success) return sub;
      }
      return { success: true };
    }
    return { success: false, error: 'Unsupported node type' };
  }

  /**
   * Move / Rename
   */
  moveNode(srcPath, destPath, cwd = '/', userObj = null) {
    const user = userObj || this.users.getCurrentUser();
    const normSrc = PathValidator.normalize(srcPath, cwd, user.home);
    const srcNode = this.getNode(normSrc, '/', user.home);
    if (!srcNode) return { success: false, error: `Cannot stat '${srcPath}': No such file or directory` };

    const normDest = PathValidator.normalize(destPath, cwd, user.home);
    const { dirname: srcDir, basename: srcName } = PathValidator.split(normSrc);
    const srcParent = this.getNode(srcDir, '/', user.home);

    let targetDir = normDest;
    let targetName = srcName;

    const destNode = this.getNode(normDest, '/', user.home);
    if (destNode && destNode.type === 'dir') {
      targetDir = normDest;
      targetName = srcName;
    } else {
      const split = PathValidator.split(normDest);
      targetDir = split.dirname;
      targetName = split.basename;
    }

    if (!PathValidator.isValidFilename(targetName)) {
      return { success: false, error: 'Invalid destination filename' };
    }

    const destParent = this.getNode(targetDir, '/', user.home);
    if (!destParent || destParent.type !== 'dir') {
      return { success: false, error: `Target directory '${targetDir}' does not exist` };
    }

    if (!VirtualPermissions.checkAccess(srcParent, user, 'w') || !VirtualPermissions.checkAccess(destParent, user, 'w')) {
      return { success: false, error: 'Permission denied' };
    }

    srcParent.children.delete(srcName);
    srcNode.name = targetName;
    destParent.children.set(targetName, srcNode);

    sysEvents.emit('vfs:change', { type: 'move', from: normSrc, to: targetDir + '/' + targetName, node: srcNode });
    return { success: true };
  }

  /**
   * Serialize VFS tree safely for backup / persistence
   */
  exportToJSON() {
    const serializeNode = (node) => {
      const obj = {
        name: node.name,
        type: node.type,
        permissions: node.permissions,
        owner: node.owner,
        group: node.group,
        size: node.size,
        mtime: node.mtime.toISOString(),
        suid: node.suid,
        sgid: node.sgid,
        sticky: node.sticky,
        content: node.content || '',
        assetId: node.assetId || null,
        navMessage: node.navMessage || null
      };
      if (node.type === 'dir') {
        obj.children = {};
        for (const [name, child] of node.children.entries()) {
          obj.children[name] = serializeNode(child);
        }
      }
      return obj;
    };

    return JSON.stringify({
      version: 1,
      timestamp: new Date().toISOString(),
      root: serializeNode(this.root)
    });
  }

  /**
   * Safely restore VFS from JSON with validation
   */
  importFromJSON(jsonString) {
    try {
      if (typeof jsonString !== 'string' || jsonString.length > SecurityLimits.MAX_BACKUP_SIZE_BYTES) {
        return { success: false, error: 'Filesystem image is invalid or exceeds the size limit' };
      }
      const data = JSON.parse(jsonString);
      if (!data || data.version !== 1 || !data.root || data.root.type !== 'dir') {
        return { success: false, error: 'Invalid filesystem image format' };
      }

      let count = 0;
      const deserializeNode = (obj, depth = 0, expectedName = null, isRoot = false) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
          throw new Error('Invalid filesystem node in imported data');
        }
        if (depth > SecurityLimits.MAX_PATH_DEPTH) {
          throw new Error('Filesystem path depth limit exceeded in imported data');
        }
        count++;
        if (count > SecurityLimits.MAX_FILESYSTEM_NODES) {
          throw new Error('Filesystem node limit exceeded in imported data');
        }

        if (!['dir', 'file'].includes(obj.type)) {
          throw new Error('Invalid filesystem node type in imported data');
        }
        const name = isRoot ? '' : obj.name;
        if (isRoot ? (obj.name !== undefined && obj.name !== '') : !PathValidator.isValidFilename(name)) {
          throw new Error('Invalid filename in imported filesystem data');
        }
        if (expectedName !== null && name !== expectedName) {
          throw new Error('Filesystem entry name does not match its directory key');
        }

        const content = obj.content === undefined ? '' : obj.content;
        if (typeof content !== 'string' || content.length > SecurityLimits.MAX_FILE_SIZE_BYTES) {
          throw new Error('Invalid or oversized file content in imported data');
        }
        if (obj.permissions !== undefined &&
          (!Number.isInteger(obj.permissions) || obj.permissions < 0 || obj.permissions > 0o7777)) {
          throw new Error('Invalid permissions in imported data');
        }
        if (obj.size !== undefined &&
          (!Number.isInteger(obj.size) || obj.size < 0 || obj.size > SecurityLimits.MAX_FILE_SIZE_BYTES)) {
          throw new Error('Invalid file size in imported data');
        }
        if (obj.mtime !== undefined && (typeof obj.mtime !== 'string' || Number.isNaN(Date.parse(obj.mtime)))) {
          throw new Error('Invalid modification time in imported data');
        }
        const owner = obj.owner === undefined ? SYSTEM_INFO.username : obj.owner;
        const group = obj.group === undefined ? SYSTEM_INFO.username : obj.group;
        if (!PathValidator.isValidFilename(owner) || !PathValidator.isValidFilename(group)) {
          throw new Error('Invalid owner or group in imported data');
        }

        const node = new VFSNode(name, obj.type, {
          permissions: obj.permissions === undefined ? 0o644 : obj.permissions,
          owner,
          group,
          size: typeof obj.size === 'number' ? obj.size : 0,
          mtime: obj.mtime,
          content,
          assetId: typeof obj.assetId === 'string' && /^[a-z0-9-]+$/.test(obj.assetId) ? obj.assetId : null,
          navMessage: typeof obj.navMessage === 'string' ? obj.navMessage.slice(0, 500) : null,
          suid: !!obj.suid,
          sgid: !!obj.sgid,
          sticky: !!obj.sticky
        });

        if (obj.type === 'dir') {
          if (!obj.children || typeof obj.children !== 'object' || Array.isArray(obj.children)) {
            throw new Error('Invalid directory entries in imported data');
          }
          for (const [k, v] of Object.entries(obj.children)) {
            // Guard against prototype pollution keys
            if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
            if (!PathValidator.isValidFilename(k)) {
              throw new Error('Invalid directory entry name in imported data');
            }
            const childNode = deserializeNode(v, depth + 1, k);
            node.children.set(k, childNode);
          }
        }
        return node;
      };

      this.root = deserializeNode(data.root, 0, null, true);
      this.nodeCount = count;
      sysEvents.emit('vfs:change', { type: 'reload' });
      return { success: true, nodeCount: count };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

import { PathValidator } from '../security/path-validator.js';
import { VirtualPermissions } from '../core/virtual-permissions.js';
import { SafeMath } from '../security/safe-math.js';
import { registerExtendedCommands } from './commands-extended.js';
import { SYSTEM_INFO } from '../core/system-info.js';

/**
 * Register all commands from the reference syllabus into the CommandRegistry
 * @param {CommandRegistry} registry 
 * @param {VirtualFileSystem} vfs 
 * @param {VirtualUsers} users 
 * @param {VirtualProcesses} processes 
 * @param {VirtualNetwork} network 
 */
export function registerAllCommands(registry, vfs, users, processes, network) {

  // ==========================================
  // 1. LINUX FUNDAMENTALS
  // ==========================================

  // whoami
  registry.register({
    name: 'whoami',
    category: '1. Linux Fundamentals',
    description: 'Display current effective username',
    syntax: 'whoami',
    options: [],
    practicalUse: 'Quickly check what user account you are running as, especially after privilege escalation or su.',
    example: 'whoami',
    expectedOutput: SYSTEM_INFO.username,
    execute: (args, ctx) => ({ exitCode: 0, stdout: `${ctx.user.name}\n` })
  });

  // id
  registry.register({
    name: 'id',
    category: '1. Linux Fundamentals',
    description: 'Display user and group IDs',
    syntax: 'id [username]',
    options: ['-u (show UID)', '-g (show GID)', '-G (show all groups)', '-n (show names)'],
    practicalUse: 'Critical command for identifying group memberships (such as sudo, docker, adm, lxd) during privilege escalation.',
    example: 'id',
    expectedOutput: 'uid=1000(kiddy) gid=1000(kiddy) groups=1000(kiddy),27(sudo),4(adm),110(netdev)',
    execute: (args, ctx) => {
      const targetUser = args[0] ? users.getUser(args[0]) : ctx.user;
      if (!targetUser) return { exitCode: 1, stderr: `id: '${args[0]}': no such user\n` };
      
      const grpStrings = (targetUser.groups || []).map(g => {
        const grpObj = users.groups.get(g);
        return `${grpObj ? grpObj.gid : 1000}(${g})`;
      }).join(',');

      return {
        exitCode: 0,
        stdout: `uid=${targetUser.uid}(${targetUser.name}) gid=${targetUser.gid}(${targetUser.name}) groups=${grpStrings}\n`
      };
    }
  });

  // hostname
  registry.register({
    name: 'hostname',
    category: '1. Linux Fundamentals',
    description: 'Display or configure system hostname',
    syntax: 'hostname',
    options: ['-I (display IP addresses)'],
    practicalUse: 'Discover the machine name in enterprise networks and active directory environments.',
    example: 'hostname',
    expectedOutput: 'PandaHack',
    execute: (args, ctx) => {
      if (args.includes('-I')) {
        return { exitCode: 0, stdout: '192.168.1.50 10.0.0.15 \n' };
      }
      return { exitCode: 0, stdout: `${network.hostname}\n` };
    }
  });

  registry.register({
    name: 'hostnamectl',
    category: '1. Linux Fundamentals',
    description: 'Query or change the system hostname',
    syntax: 'hostnamectl [status|set-hostname name]',
    options: ['status (show system information)', 'set-hostname <name> (set the static hostname)'],
    practicalUse: 'Inspect the machine identity or set its hostname from an administrative shell.',
    example: 'hostnamectl status',
    expectedOutput: ' Static hostname: PandaHack\nOperating System: Panda OS',
    execute: (args, ctx) => {
      if (args[0] === 'set-hostname') {
        const hostname = args[1];
        if (!hostname || !/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,62}$/.test(hostname)) {
          return { exitCode: 1, stderr: 'hostnamectl: invalid or missing hostname\n' };
        }
        if (ctx.user.uid !== 0) {
          return { exitCode: 1, stderr: 'hostnamectl: Permission denied (must be root)\n' };
        }
        const result = vfs.writeFile('/etc/hostname', `${hostname}\n`, '/', ctx.user);
        if (!result.success) return { exitCode: 1, stderr: `hostnamectl: ${result.error}\n` };
        network.hostname = hostname;
        users.hostname = hostname;
        return { exitCode: 0 };
      }

      const hostname = network.hostname;
      const output = ` Static hostname: ${hostname}\n       Icon name: computer\n         Chassis: desktop\n      Machine ID: 00000000000000000000000000000000\n         Boot ID: 11111111111111111111111111111111\nOperating System: ${SYSTEM_INFO.osName}\n          Kernel: Linux 6.8.0-cyber-generic\n    Architecture: x86-64\n`;
      return { exitCode: 0, stdout: output };
    }
  });

  registry.register({
    name: 'neofetch',
    category: '1. Linux Fundamentals',
    description: 'Display system information with an ASCII logo',
    syntax: 'neofetch',
    options: [],
    practicalUse: 'Quickly display the simulated operating system, shell, and user information.',
    example: 'neofetch',
    expectedOutput: 'Panda OS\n',
    isSimulation: true,
    execute: (args, ctx) => ({
      exitCode: 0,
      stdout: `       .--.        ${ctx.user.name}@${network.hostname}\n      |o_o |       -------------------------\n      |:_/ |       OS: ${SYSTEM_INFO.osName}\n     //   \\ \\      Kernel: Linux 6.8.0-cyber-generic\n    (|     | )     Shell: ${ctx.user.shell}\n   /'\\_   _/\`\\     Terminal: xterm-256color\n   \\___)=(___/     CPU: ${SYSTEM_INFO.cpuCount} virtual CPUs\n`
    })
  });

  registry.register({
    name: 'fastfetch',
    category: '1. Linux Fundamentals',
    description: 'Display system information in a compact format',
    syntax: 'fastfetch',
    options: [],
    practicalUse: 'Show a concise summary of the simulated system and current user.',
    example: 'fastfetch',
    expectedOutput: 'OS: Panda OS\n',
    isSimulation: true,
    execute: (args, ctx) => ({
      exitCode: 0,
      stdout: `OS: ${SYSTEM_INFO.osName}\nHost: ${network.hostname}\nKernel: Linux 6.8.0-cyber-generic\nShell: ${ctx.user.shell}\nUser: ${ctx.user.name}\nCPU: ${SYSTEM_INFO.cpuCount}\nMemory: ${SYSTEM_INFO.memoryMB / 1024} GiB\nStorage: ${SYSTEM_INFO.storageGB} GB\nTerminal: xterm-256color\n`
    })
  });

  registry.register({
    name: 'ftp',
    category: '11. Remote Access',
    description: 'Connect to a simulated FTP service in the CyberLinux lab',
    syntax: 'ftp host',
    options: ['-p (use passive mode)'],
    practicalUse: 'Practice connecting to the isolated virtual FTP lab service.',
    example: 'ftp 192.168.1.10',
    expectedOutput: 'Connected to 192.168.1.10.\n220 (vsFTPd 2.3.4)',
    isSimulation: true,
    execute: (args) => {
      const host = args.find(arg => !arg.startsWith('-'));
      if (!host) return { exitCode: 1, stderr: 'ftp: usage: ftp host\n' };
      const address = network.dnsRecords[host]?.A || host;
      const target = network.labTargets[address];
      const ftpService = target?.ports.find(port => port.port === 21 && port.service === 'ftp');
      if (!ftpService) {
        return { exitCode: 1, stderr: `ftp: connect to ${host}: Connection refused (virtual lab only)\n` };
      }
      return {
        exitCode: 0,
        stdout: `Connected to ${host}.\n220 (${ftpService.product} ${ftpService.version})\nName (${host}:${args[0]}): anonymous\n230 Login successful. Type 'help' to see simulated FTP commands.\nftp> [interactive FTP is simulated; no external network connection is made]\n`
      };
    }
  });

  // uname
  registry.register({
    name: 'uname',
    category: '1. Linux Fundamentals',
    description: 'Display system information and kernel version',
    syntax: 'uname [-a|-r|-m|-s|-n]',
    options: ['-a (all information)', '-r (kernel release)', '-m (machine architecture)', '-s (kernel name)'],
    practicalUse: 'Primary enumeration step to find kernel exploits (Dirty COW, OverlayFS, etc.) matching exact kernel versions.',
    example: 'uname -a',
    expectedOutput: 'Linux PandaHack 6.8.0-cyber-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
    execute: (args, ctx) => {
      if (args.includes('-a') || args.length === 0) {
        return { exitCode: 0, stdout: `Linux ${network.hostname} 6.8.0-cyber-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n` };
      }
      if (args.includes('-r')) return { exitCode: 0, stdout: '6.8.0-cyber-generic\n' };
      if (args.includes('-m')) return { exitCode: 0, stdout: 'x86_64\n' };
      return { exitCode: 0, stdout: 'Linux\n' };
    }
  });

  // pwd
  registry.register({
    name: 'pwd',
    category: '1. Linux Fundamentals',
    description: 'Print name of current working directory',
    syntax: 'pwd',
    options: ['-P (physical directory)', '-L (logical directory)'],
    practicalUse: 'Determine exact absolute path before executing sensitive file operations or exploits.',
    example: 'pwd',
    expectedOutput: SYSTEM_INFO.home,
    execute: (args, ctx) => ({ exitCode: 0, stdout: `${ctx.cwd}\n` })
  });

  // clear
  registry.register({
    name: 'exit',
    category: '1. Linux Fundamentals',
    description: 'Exit the current shell or return from a root shell',
    syntax: 'exit',
    options: [],
    practicalUse: 'Leave the terminal shell or return to the regular user from a root shell.',
    example: 'exit',
    expectedOutput: 'logout',
    execute: (args, ctx) => {
      if (users.isRoot()) {
        users.setCurrentUser(SYSTEM_INFO.username);
        const cwd = users.getCurrentUser().home;
        return { exitCode: 0, stdout: 'logout\n', newCwd: cwd };
      }
      return { exitCode: 0, stdout: 'logout\n', exitShell: true };
    }
  });

  registry.register({
    name: 'clear',
    category: '1. Linux Fundamentals',
    description: 'Clear terminal screen',
    syntax: 'clear',
    options: [],
    practicalUse: 'Clears clutter from previous commands and scans.',
    example: 'clear',
    expectedOutput: '[Screen Cleared]',
    execute: (args, ctx) => ({ exitCode: 0, clearScreen: true })
  });

  // date
  registry.register({
    name: 'date',
    category: '1. Linux Fundamentals',
    description: 'Display or set system date and time',
    syntax: 'date',
    options: ['-u (display UTC time)'],
    practicalUse: 'Correlating log timestamps during incident response investigations.',
    example: 'date',
    expectedOutput: 'Tue Nov 17 20:10:00 UTC 2026',
    execute: (args, ctx) => ({ exitCode: 0, stdout: `${new Date().toUTCString()}\n` })
  });

  // cal
  registry.register({
    name: 'cal',
    category: '1. Linux Fundamentals',
    description: 'Display a calendar',
    syntax: 'cal',
    options: [],
    practicalUse: 'Convenient calendar display inside the terminal.',
    example: 'cal',
    expectedOutput: '    November 2026\nSu Mo Tu We Th Fr Sa\n 1  2  3  4  5  6  7\n 8  9 10 11 12 13 14\n15 16 17 18 19 20 21\n22 23 24 25 26 27 28\n29 30\n',
    execute: () => {
      const output = '    November 2026   \nSu Mo Tu We Th Fr Sa\n 1  2  3  4  5  6  7\n 8  9 10 11 12 13 14\n15 16 17 18 19 20 21\n22 23 24 25 26 27 28\n29 30               \n';
      return { exitCode: 0, stdout: output };
    }
  });

  // uptime
  registry.register({
    name: 'uptime',
    category: '1. Linux Fundamentals',
    description: 'Tell how long the system has been running',
    syntax: 'uptime',
    options: ['-p (pretty format)'],
    practicalUse: 'Determine if a system was recently rebooted or patched.',
    example: 'uptime',
    expectedOutput: ' 20:15:00 up 12 days,  4:20,  2 users,  load average: 0.12, 0.08, 0.05',
    execute: () => ({ exitCode: 0, stdout: ' 20:15:00 up 12 days,  4:20,  2 users,  load average: 0.12, 0.08, 0.05\n' })
  });

  // which & whereis
  registry.register({
    name: 'which',
    category: '1. Linux Fundamentals',
    description: 'Locate a command executable in PATH',
    syntax: 'which command',
    options: [],
    practicalUse: 'Verify if a tool (like nmap, python3, gcc) is installed and find its location in $PATH.',
    example: 'which nmap',
    expectedOutput: '/usr/bin/nmap',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'which: missing argument\n' };
      const cmd = registry.get(args[0]);
      if (cmd) {
        return { exitCode: 0, stdout: `/usr/bin/${args[0]}\n` };
      }
      return { exitCode: 1, stderr: `${args[0]} not found in /usr/bin:/bin\n` };
    }
  });

  registry.register({
    name: 'whereis',
    category: '1. Linux Fundamentals',
    description: 'Locate the binary, source, and manual-page files for a command',
    syntax: 'whereis command',
    options: [],
    practicalUse: 'Locating binaries and man pages.',
    example: 'whereis bash',
    expectedOutput: 'bash: /bin/bash /usr/share/man/man1/bash.1.gz',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'whereis: missing argument\n' };
      return { exitCode: 0, stdout: `${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz\n` };
    }
  });

  // echo
  registry.register({
    name: 'echo',
    category: '1. Linux Fundamentals',
    description: 'Display a line of text',
    syntax: 'echo [options] [string]',
    options: ['-n (do not output trailing newline)', '-e (enable interpretation of backslash escapes)'],
    practicalUse: 'Print text, append payload lines into files, or display environment variables.',
    example: 'echo "hello world"',
    expectedOutput: 'hello world',
    execute: (args) => {
      let noNewline = false;
      let textArgs = [...args];
      if (textArgs[0] === '-n') {
        noNewline = true;
        textArgs.shift();
      }
      const out = textArgs.join(' ') + (noNewline ? '' : '\n');
      return { exitCode: 0, stdout: out };
    }
  });

  // ls
  registry.register({
    name: 'ls',
    category: '1. Linux Fundamentals',
    description: 'List directory contents',
    syntax: 'ls [options] [path]',
    options: ['-l (long listing)', '-a (all including hidden files)', '-h (human readable sizes)', '-t (sort by modification time)', '-R (recursive)'],
    practicalUse: 'Essential command for inspecting directory contents, file permissions, ownership, and hidden configuration files.',
    example: 'ls -lah',
    expectedOutput: 'drwxr-xr-x 2 student student 4096 Nov 17 20:00 Desktop\n-rw-r--r-- 1 student student  420 Nov 17 20:00 notes.txt',
    execute: (args, ctx) => {
      let showHidden = false;
      let longFormat = false;
      let targetPath = ctx.cwd;

      for (const arg of args) {
        if (arg.startsWith('-')) {
          if (arg.includes('a')) showHidden = true;
          if (arg.includes('l')) longFormat = true;
        } else {
          targetPath = arg;
        }
      }

      const res = vfs.listDirectory(targetPath, ctx.cwd, ctx.user);
      if (!res.success) {
        return { exitCode: 2, stderr: `ls: cannot access '${targetPath}': ${res.error}\n` };
      }

      let entries = res.entries;
      if (!showHidden) {
        entries = entries.filter(e => !e.name.startsWith('.'));
      }

      if (longFormat) {
        let lines = [];
        for (const e of entries) {
          const dateStr = e.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                          e.mtime.toTimeString().substring(0, 5);
          const sizeStr = String(e.size).padStart(6, ' ');
          lines.push(`${e.permString} 1 ${e.owner} ${e.group} ${sizeStr} ${dateStr} ${e.name}`);
        }
        return { exitCode: 0, stdout: lines.join('\n') + (lines.length ? '\n' : '') };
      } else {
        const names = entries.map(e => e.type === 'dir' ? `${e.name}/` : e.name);
        return { exitCode: 0, stdout: names.join('  ') + (names.length ? '\n' : '') };
      }
    }
  });

  // cd
  registry.register({
    name: 'cd',
    category: '1. Linux Fundamentals',
    description: 'Change the current working directory',
    syntax: 'cd [dir]',
    options: ['~ (home directory)', '.. (parent directory)', '- (previous directory)'],
    practicalUse: 'Navigating through filesystem directories.',
    example: 'cd /var/log',
    expectedOutput: '',
    execute: (args, ctx) => {
      let target = args[0] || '~';
      if (target === '~') target = ctx.user.home || SYSTEM_INFO.home;
      if (target === '-') target = ctx.env.OLDPWD || ctx.cwd;

      const norm = PathValidator.normalize(target, ctx.cwd, ctx.user.home);
      const node = vfs.getNode(norm, '/', ctx.user.home);
      if (!node) {
        return { exitCode: 1, stderr: `cd: ${target}: No such file or directory\n` };
      }
      if (node.type !== 'dir') {
        return { exitCode: 1, stderr: `cd: ${target}: Not a directory\n` };
      }
      if (!VirtualPermissions.checkAccess(node, ctx.user, 'x')) {
        return { exitCode: 1, stderr: `cd: ${target}: Permission denied\n` };
      }

      ctx.env.OLDPWD = ctx.cwd;
      ctx.cwd = norm;
      ctx.env.PWD = norm;
      const navOut = node.navMessage ? `${node.navMessage}\n` : '';
      return { exitCode: 0, stdout: navOut, newCwd: norm };
    }
  });

  // mkdir
  registry.register({
    name: 'mkdir',
    category: '1. Linux Fundamentals',
    description: 'Create directories',
    syntax: 'mkdir [-p] directory...',
    options: ['-p (create parent directories as needed)', '-m (set permission mode)'],
    practicalUse: 'Organize workspace, payloads, and evidence collection folders.',
    example: 'mkdir -p /home/student/Labs/recon',
    expectedOutput: '',
    execute: (args, ctx) => {
      const parents = args.includes('-p');
      const paths = args.filter(a => !a.startsWith('-'));
      if (paths.length === 0) return { exitCode: 1, stderr: 'mkdir: missing operand\n' };

      for (const p of paths) {
        const res = vfs.createDirectory(p, ctx.cwd, ctx.user, { parents });
        if (!res.success) {
          return { exitCode: 1, stderr: `mkdir: cannot create directory '${p}': ${res.error}\n` };
        }
      }
      return { exitCode: 0 };
    }
  });

  // rmdir
  registry.register({
    name: 'rmdir',
    category: '1. Linux Fundamentals',
    description: 'Remove empty directories',
    syntax: 'rmdir directory...',
    options: ['-p (remove parent directories)'],
    practicalUse: 'Safely clean up empty directories.',
    example: 'rmdir old_dir',
    expectedOutput: '',
    execute: (args, ctx) => {
      const paths = args.filter(a => !a.startsWith('-'));
      if (paths.length === 0) return { exitCode: 1, stderr: 'rmdir: missing operand\n' };
      for (const p of paths) {
        const res = vfs.removeNode(p, ctx.cwd, ctx.user, false);
        if (!res.success) return { exitCode: 1, stderr: `rmdir: failed to remove '${p}': ${res.error}\n` };
      }
      return { exitCode: 0 };
    }
  });

  // touch
  registry.register({
    name: 'touch',
    category: '1. Linux Fundamentals',
    description: 'Change file timestamps or create empty file',
    syntax: 'touch file...',
    options: ['-a (change access time)', '-m (change modification time)'],
    practicalUse: 'Quickly create empty files, test write permissions, or prepare wordlists.',
    example: 'touch notes.txt',
    expectedOutput: '',
    execute: (args, ctx) => {
      const files = args.filter(a => !a.startsWith('-'));
      if (files.length === 0) return { exitCode: 1, stderr: 'touch: missing file operand\n' };

      for (const f of files) {
        const norm = PathValidator.normalize(f, ctx.cwd, ctx.user.home);
        const existing = vfs.getNode(norm, '/', ctx.user.home);
        if (existing) {
          existing.mtime = new Date();
          existing.atime = new Date();
        } else {
          const res = vfs.writeFile(norm, '', ctx.cwd, ctx.user);
          if (!res.success) return { exitCode: 1, stderr: `touch: cannot touch '${f}': ${res.error}\n` };
        }
      }
      return { exitCode: 0 };
    }
  });

  // cp
  registry.register({
    name: 'cp',
    category: '1. Linux Fundamentals',
    description: 'Copy files and directories',
    syntax: 'cp [-r] source... destination',
    options: ['-r (recursive)', '-p (preserve attributes)', '-f (force)'],
    practicalUse: 'Backup critical configurations before editing or copy exploit scripts.',
    example: 'cp notes.txt backup.txt',
    expectedOutput: '',
    execute: (args, ctx) => {
      const recursive = args.includes('-r') || args.includes('-R');
      const cleanArgs = args.filter(a => !a.startsWith('-'));
      if (cleanArgs.length < 2) return { exitCode: 1, stderr: 'cp: missing file operand\n' };

      const dest = cleanArgs.pop();
      for (const src of cleanArgs) {
        const res = vfs.copyNode(src, dest, ctx.cwd, ctx.user, recursive);
        if (!res.success) return { exitCode: 1, stderr: `cp: ${res.error}\n` };
      }
      return { exitCode: 0 };
    }
  });

  // mv
  registry.register({
    name: 'mv',
    category: '1. Linux Fundamentals',
    description: 'Move (rename) files and directories',
    syntax: 'mv source... destination',
    options: ['-f (force)', '-n (do not overwrite)'],
    practicalUse: 'Renaming files and reorganizing directories.',
    example: 'mv old.txt new.txt',
    expectedOutput: '',
    execute: (args, ctx) => {
      const cleanArgs = args.filter(a => !a.startsWith('-'));
      if (cleanArgs.length < 2) return { exitCode: 1, stderr: 'mv: missing operand\n' };
      const dest = cleanArgs.pop();
      for (const src of cleanArgs) {
        const res = vfs.moveNode(src, dest, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `mv: ${res.error}\n` };
      }
      return { exitCode: 0 };
    }
  });

  // rm
  registry.register({
    name: 'rm',
    category: '1. Linux Fundamentals',
    description: 'Remove files or directories',
    syntax: 'rm [-r|-f] file...',
    options: ['-r (remove directories recursively)', '-f (force, ignore nonexistent files)'],
    practicalUse: 'Delete files and remove malicious implants or artifacts during clean up.',
    example: 'rm -rf /tmp/test',
    expectedOutput: '',
    execute: (args, ctx) => {
      const recursive = args.includes('-r') || args.includes('-R') || args.includes('-rf') || args.includes('-fr');
      const force = args.includes('-f') || args.includes('-rf') || args.includes('-fr');
      const files = args.filter(a => !a.startsWith('-'));

      if (files.length === 0 && !force) return { exitCode: 1, stderr: 'rm: missing operand\n' };
      for (const f of files) {
        const res = vfs.removeNode(f, ctx.cwd, ctx.user, recursive);
        if (!res.success && !force) {
          return { exitCode: 1, stderr: `rm: cannot remove '${f}': ${res.error}\n` };
        }
      }
      return { exitCode: 0 };
    }
  });

  // cat
  registry.register({
    name: 'cat',
    category: '1. Linux Fundamentals',
    description: 'Concatenate and display files to standard output',
    syntax: 'cat [-n] [file...]',
    options: ['-n (number all output lines)', '-b (number nonempty output lines)'],
    practicalUse: 'Read configurations, view /etc/passwd, examine notes, or dump text to terminal.',
    example: 'cat /etc/passwd',
    expectedOutput: `root:x:0:0:root:/root:/bin/bash\nkiddy:x:1000:1000:Panda OS User:${SYSTEM_INFO.home}:/bin/bash`,
    execute: (args, ctx) => {
      const numberLines = args.includes('-n');
      const files = args.filter(a => !a.startsWith('-'));

      if (files.length === 0) {
        // Read from stdin (pipeline input)
        const stdin = ctx.stdin || '';
        if (numberLines) {
          const lines = stdin.split('\n').map((l, idx) => `${String(idx + 1).padStart(6, ' ')}  ${l}`);
          return { exitCode: 0, stdout: lines.join('\n') + '\n' };
        }
        return { exitCode: 0, stdout: stdin };
      }

      let out = '';
      for (const f of files) {
        const res = vfs.readFile(f, ctx.cwd, ctx.user);
        if (!res.success) {
          return { exitCode: 1, stderr: `cat: ${f}: ${res.error}\n` };
        }
        if (numberLines) {
          const lines = res.content.split('\n').map((l, idx) => `${String(idx + 1).padStart(6, ' ')}  ${l}`);
          out += lines.join('\n') + '\n';
        } else {
          out += res.content;
        }
      }
      return { exitCode: 0, stdout: out };
    }
  });

  // head & tail
  registry.register({
    name: 'head',
    category: '1. Linux Fundamentals',
    description: 'Output the first part of files',
    syntax: 'head [-n lines] [file]',
    options: ['-n <num> (number of lines to show, default 10)'],
    practicalUse: 'Preview beginning of wordlists or logs without overwhelming terminal.',
    example: 'head -n 5 /etc/passwd',
    expectedOutput: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
    execute: (args, ctx) => {
      let n = 10;
      let file = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n' && args[i + 1]) {
          n = parseInt(args[i + 1], 10) || 10;
          i++;
        } else if (args[i].startsWith('-n')) {
          n = parseInt(args[i].substring(2), 10) || 10;
        } else if (!args[i].startsWith('-')) {
          file = args[i];
        }
      }

      let text = ctx.stdin || '';
      if (file) {
        const res = vfs.readFile(file, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `head: cannot open '${file}': ${res.error}\n` };
        text = res.content;
      }
      const lines = text.split('\n').slice(0, n);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'tail',
    category: '1. Linux Fundamentals',
    description: 'Output the last part of files',
    syntax: 'tail [-n lines] [-f] [file]',
    options: ['-n <num> (number of lines to show)', '-f (follow file growth)'],
    practicalUse: 'Monitor authentication attempts and system errors in real time.',
    example: 'tail -n 10 /var/log/auth.log',
    expectedOutput: 'Nov 17 08:18:45 cyberlinux sshd[1488]: Accepted publickey for student from 192.168.1.50',
    execute: (args, ctx) => {
      let n = 10;
      let file = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n' && args[i + 1]) {
          n = parseInt(args[i + 1], 10) || 10;
          i++;
        } else if (args[i].startsWith('-n')) {
          n = parseInt(args[i].substring(2), 10) || 10;
        } else if (!args[i].startsWith('-')) {
          file = args[i];
        }
      }

      let text = ctx.stdin || '';
      if (file) {
        const res = vfs.readFile(file, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `tail: cannot open '${file}': ${res.error}\n` };
        text = res.content;
      }
      const allLines = text.split('\n').filter((l, i, arr) => i < arr.length - 1 || l.length > 0);
      const lines = allLines.slice(-n);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  // grep
  registry.register({
    name: 'grep',
    category: '1. Linux Fundamentals',
    description: 'Print lines matching a pattern',
    syntax: 'grep [options] pattern [file...]',
    options: ['-i (case-insensitive)', '-v (invert match)', '-n (line numbers)', '-r (recursive)', '-E (extended regex)', '-c (count matches)'],
    practicalUse: 'Filter through massive log files, source code, and configs to discover credentials or IOCs.',
    example: 'grep -i "failed" /var/log/auth.log',
    expectedOutput: 'Nov 17 08:15:22 cyberlinux sshd[1389]: Failed password for invalid user admin',
    execute: (args, ctx) => {
      let ignoreCase = false;
      let invert = false;
      let lineNums = false;
      let countOnly = false;
      let pattern = null;
      const files = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('-')) {
          if (arg.includes('i')) ignoreCase = true;
          if (arg.includes('v')) invert = true;
          if (arg.includes('n')) lineNums = true;
          if (arg.includes('c')) countOnly = true;
        } else if (!pattern) {
          pattern = arg;
        } else {
          files.push(arg);
        }
      }

      if (!pattern) return { exitCode: 1, stderr: 'grep: missing pattern\n' };

      const regexFlags = ignoreCase ? 'i' : '';
      let regex;
      try {
        regex = new RegExp(pattern, regexFlags);
      } catch (e) {
        return { exitCode: 2, stderr: `grep: invalid regular expression: ${e.message}\n` };
      }

      const processText = (text, prefix = '') => {
        const lines = text.split('\n');
        const matches = [];
        for (let idx = 0; idx < lines.length; idx++) {
          const line = lines[idx];
          const matched = regex.test(line);
          if ((matched && !invert) || (!matched && invert)) {
            let outLine = line;
            if (lineNums) outLine = `${idx + 1}:${outLine}`;
            if (prefix) outLine = `${prefix}:${outLine}`;
            matches.push(outLine);
          }
        }
        return matches;
      };

      if (files.length === 0) {
        const matches = processText(ctx.stdin || '');
        if (countOnly) return { exitCode: 0, stdout: `${matches.length}\n` };
        return { exitCode: matches.length ? 0 : 1, stdout: matches.join('\n') + (matches.length ? '\n' : '') };
      }

      let allMatches = [];
      for (const f of files) {
        const res = vfs.readFile(f, ctx.cwd, ctx.user);
        if (!res.success) {
          return { exitCode: 2, stderr: `grep: ${f}: ${res.error}\n` };
        }
        const prefix = files.length > 1 ? f : '';
        const m = processText(res.content, prefix);
        allMatches = allMatches.concat(m);
      }

      if (countOnly) return { exitCode: 0, stdout: `${allMatches.length}\n` };
      return { exitCode: allMatches.length ? 0 : 1, stdout: allMatches.join('\n') + (allMatches.length ? '\n' : '') };
    }
  });

  // wc
  registry.register({
    name: 'wc',
    category: '1. Linux Fundamentals',
    description: 'Print newline, word, and byte counts for each file',
    syntax: 'wc [-l|-w|-c] [file...]',
    options: ['-l (lines)', '-w (words)', '-c (bytes/characters)'],
    practicalUse: 'Count total entries in wordlists, credentials dumps, or filtered search outputs.',
    example: 'wc -l /home/student/Documents/wordlist.txt',
    expectedOutput: '13 /home/student/Documents/wordlist.txt',
    execute: (args, ctx) => {
      const showLines = args.includes('-l');
      const showWords = args.includes('-w');
      const showBytes = args.includes('-c');
      const allDefault = !showLines && !showWords && !showBytes;
      const files = args.filter(a => !a.startsWith('-'));

      const countStats = (text) => {
        const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const bytes = text.length;
        return { lines, words, bytes };
      };

      if (files.length === 0) {
        const { lines, words, bytes } = countStats(ctx.stdin || '');
        const parts = [];
        if (allDefault || showLines) parts.push(String(lines).padStart(7, ' '));
        if (allDefault || showWords) parts.push(String(words).padStart(7, ' '));
        if (allDefault || showBytes) parts.push(String(bytes).padStart(7, ' '));
        return { exitCode: 0, stdout: parts.join(' ') + '\n' };
      }

      const outLines = [];
      for (const f of files) {
        const res = vfs.readFile(f, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `wc: ${f}: ${res.error}\n` };
        const { lines, words, bytes } = countStats(res.content);
        const parts = [];
        if (allDefault || showLines) parts.push(String(lines).padStart(7, ' '));
        if (allDefault || showWords) parts.push(String(words).padStart(7, ' '));
        if (allDefault || showBytes) parts.push(String(bytes).padStart(7, ' '));
        parts.push(f);
        outLines.push(parts.join(' '));
      }
      return { exitCode: 0, stdout: outLines.join('\n') + '\n' };
    }
  });

  // sort & uniq
  registry.register({
    name: 'sort',
    category: '1. Linux Fundamentals',
    description: 'Sort lines of text files',
    syntax: 'sort [-r|-u|-n] [file...]',
    options: ['-r (reverse)', '-u (unique output)', '-n (numeric sort)'],
    practicalUse: 'Organize enumerated usernames, domain lists, or hash files.',
    example: 'sort -u users.txt',
    expectedOutput: 'admin\nstudent\nroot',
    execute: (args, ctx) => {
      const reverse = args.includes('-r');
      const unique = args.includes('-u');
      const numeric = args.includes('-n');
      const files = args.filter(a => !a.startsWith('-'));

      let text = ctx.stdin || '';
      if (files.length > 0) {
        const res = vfs.readFile(files[0], ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `sort: ${res.error}\n` };
        text = res.content;
      }

      let lines = text.split('\n').filter(Boolean);
      lines.sort((a, b) => {
        if (numeric) {
          return (parseFloat(a) || 0) - (parseFloat(b) || 0);
        }
        return a.localeCompare(b);
      });

      if (reverse) lines.reverse();
      if (unique) lines = Array.from(new Set(lines));

      return { exitCode: 0, stdout: lines.join('\n') + (lines.length ? '\n' : '') };
    }
  });

  registry.register({
    name: 'uniq',
    category: '1. Linux Fundamentals',
    description: 'Report or omit repeated lines',
    syntax: 'uniq [-c|-d|-u] [file]',
    options: ['-c (count occurrences)', '-d (only print duplicates)', '-u (only print unique lines)'],
    practicalUse: 'Deduplicate captured data and analyze frequency of security events.',
    example: 'uniq -c failed_ips.txt',
    expectedOutput: '   5 192.168.1.105',
    execute: (args, ctx) => {
      const count = args.includes('-c');
      const dupsOnly = args.includes('-d');
      const files = args.filter(a => !a.startsWith('-'));

      let text = ctx.stdin || '';
      if (files.length > 0) {
        const res = vfs.readFile(files[0], ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `uniq: ${res.error}\n` };
        text = res.content;
      }

      const lines = text.split('\n').filter(Boolean);
      const out = [];
      let i = 0;
      while (i < lines.length) {
        let rep = 1;
        while (i + 1 < lines.length && lines[i] === lines[i + 1]) {
          rep++;
          i++;
        }
        if (dupsOnly && rep < 2) {
          i++;
          continue;
        }
        if (count) {
          out.push(`${String(rep).padStart(4, ' ')} ${lines[i]}`);
        } else {
          out.push(lines[i]);
        }
        i++;
      }
      return { exitCode: 0, stdout: out.join('\n') + (out.length ? '\n' : '') };
    }
  });

  // cut
  registry.register({
    name: 'cut',
    category: '1. Linux Fundamentals',
    description: 'Remove sections from each line of files',
    syntax: 'cut -d delimiter -f fields [file]',
    options: ['-d <delim> (field delimiter, default TAB)', '-f <fields> (field numbers to select)'],
    practicalUse: 'Extract specific columns (e.g. usernames, shell paths) from delimited files like /etc/passwd.',
    example: "cut -d ':' -f 1,7 /etc/passwd",
    expectedOutput: 'root:/bin/bash\nstudent:/bin/bash',
    execute: (args, ctx) => {
      let delim = '\t';
      let fieldSpec = '1';
      let file = null;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-d' && args[i + 1]) {
          delim = args[i + 1];
          i++;
        } else if (args[i].startsWith('-d')) {
          delim = args[i].slice(2);
        } else if (args[i] === '-f' && args[i + 1]) {
          fieldSpec = args[i + 1];
          i++;
        } else if (args[i].startsWith('-f')) {
          fieldSpec = args[i].slice(2);
        } else if (!args[i].startsWith('-')) {
          file = args[i];
        }
      }

      let text = ctx.stdin || '';
      if (file) {
        const res = vfs.readFile(file, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `cut: ${res.error}\n` };
        text = res.content;
      }

      const indices = fieldSpec.split(',').map(s => parseInt(s, 10) - 1).filter(n => !isNaN(n));
      const lines = text.split('\n');
      const out = lines.map(line => {
        if (!line) return '';
        const parts = line.split(delim);
        const selected = indices.map(idx => parts[idx] !== undefined ? parts[idx] : '').filter(Boolean);
        return selected.join(delim);
      }).filter(Boolean);

      return { exitCode: 0, stdout: out.join('\n') + (out.length ? '\n' : '') };
    }
  });

  // sed & awk
  registry.register({
    name: 'sed',
    category: '1. Linux Fundamentals',
    description: 'Stream editor for filtering and transforming text',
    syntax: "sed 's/find/replace/g' [file]",
    options: ['-i (edit in place)', '-e (script)'],
    practicalUse: 'Automate configuration changes, sanitizing wordlists, and replacing tokens.',
    example: "sed 's/student/analyst/g' notes.txt",
    expectedOutput: '[Transformed text]',
    execute: (args, ctx) => {
      const expr = args.find(a => !a.startsWith('-'));
      const files = args.filter(a => !a.startsWith('-') && a !== expr);

      let text = ctx.stdin || '';
      if (files.length > 0) {
        const res = vfs.readFile(files[0], ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `sed: ${res.error}\n` };
        text = res.content;
      }

      if (!expr) return { exitCode: 0, stdout: text };

      // Simple substitution parser s/find/replace/flags
      const match = expr.match(/^s\/([^\/]+)\/([^\/]*)\/([gi]*)$/);
      if (match) {
        const [, find, replace, flags] = match;
        const re = new RegExp(find, flags || 'g');
        const out = text.replace(re, replace);
        return { exitCode: 0, stdout: out };
      }
      return { exitCode: 0, stdout: text };
    }
  });

  registry.register({
    name: 'awk',
    category: '1. Linux Fundamentals',
    description: 'Pattern scanning and text processing language',
    syntax: "awk -F: '{print $1}' [file]",
    options: ['-F <fs> (input field separator)'],
    practicalUse: 'Powerfully extract and format log columns and structured system data.',
    example: "awk -F: '{print $1, $6}' /etc/passwd",
    expectedOutput: 'root /root\nstudent /home/student',
    execute: (args, ctx) => {
      let sep = /\s+/;
      let prog = '';
      const files = [];

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-F' && args[i + 1]) {
          sep = args[i + 1];
          i++;
        } else if (args[i].startsWith('-F')) {
          sep = args[i].slice(2);
        } else if (!prog) {
          prog = args[i];
        } else {
          files.push(args[i]);
        }
      }

      let text = ctx.stdin || '';
      if (files.length > 0) {
        const res = vfs.readFile(files[0], ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `awk: ${res.error}\n` };
        text = res.content;
      }

      // Safe pattern matcher for {print $1, $2, ...}
      const printMatch = prog.match(/\{print\s+([^\}]+)\}/);
      if (!printMatch) {
        return { exitCode: 0, stdout: text };
      }

      const fieldsToPrint = printMatch[1].split(/[\s,]+/).filter(Boolean);
      const lines = text.split('\n').filter(Boolean);
      const out = lines.map(line => {
        const cols = line.split(sep);
        const vals = fieldsToPrint.map(fieldToken => {
          if (fieldToken === '$0') return line;
          if (fieldToken.startsWith('$')) {
            const idx = parseInt(fieldToken.slice(1), 10);
            return cols[idx - 1] !== undefined ? cols[idx - 1] : '';
          }
          return fieldToken.replace(/['"]/g, '');
        });
        return vals.join(' ');
      });

      return { exitCode: 0, stdout: out.join('\n') + (out.length ? '\n' : '') };
    }
  });

  // find
  registry.register({
    name: 'find',
    category: '1. Linux Fundamentals',
    description: 'Search for files in a directory hierarchy',
    syntax: 'find [path] [expression]',
    options: ['-name <pattern>', '-type <f|d>', '-perm <mode>', '-user <name>', '-size <size>', '-exec <cmd> \\;'],
    practicalUse: 'Indispensable tool for finding SUID binaries, world-writable files, and hidden credentials during privilege escalation.',
    example: 'find / -perm -4000 -type f 2>/dev/null',
    expectedOutput: '/usr/bin/find\n/usr/bin/passwd\n/usr/bin/sudo',
    execute: (args, ctx) => {
      let rootPath = ctx.cwd;
      let nameFilter = null;
      let typeFilter = null;
      let permFilter = null;

      let i = 0;
      if (args[0] && !args[0].startsWith('-')) {
        rootPath = args[0];
        i = 1;
      }

      while (i < args.length) {
        const a = args[i];
        if (a === '-name' && args[i + 1]) {
          nameFilter = args[i + 1].replace(/"/g, '');
          i += 2;
        } else if (a === '-type' && args[i + 1]) {
          typeFilter = args[i + 1] === 'f' ? 'file' : (args[i + 1] === 'd' ? 'dir' : null);
          i += 2;
        } else if (a === '-perm' && args[i + 1]) {
          permFilter = args[i + 1];
          i += 2;
        } else {
          i++;
        }
      }

      const results = [];
      const traverse = (nodePath) => {
        const node = vfs.getNode(nodePath);
        if (!node) return;

        let match = true;
        if (typeFilter && node.type !== typeFilter) match = false;
        if (nameFilter) {
          const regex = new RegExp('^' + nameFilter.replace(/\*/g, '.*') + '$');
          if (!regex.test(node.name)) match = false;
        }
        if (permFilter) {
          if (permFilter.includes('4000') || permFilter.includes('-4000') || permFilter.includes('/4000')) {
            if (!node.suid) match = false;
          }
        }

        if (match && nodePath !== '/') {
          results.push(nodePath);
        }

        if (node.type === 'dir') {
          for (const [childName] of node.children.entries()) {
            traverse(nodePath === '/' ? `/${childName}` : `${nodePath}/${childName}`);
          }
        }
      };

      traverse(PathValidator.normalize(rootPath, ctx.cwd, ctx.user.home));
      return { exitCode: 0, stdout: results.join('\n') + (results.length ? '\n' : '') };
    }
  });

  // tree
  registry.register({
    name: 'tree',
    category: '1. Linux Fundamentals',
    description: 'List contents of directories in a tree-like format',
    syntax: 'tree [directory]',
    options: ['-L <level> (max display depth)', '-d (list directories only)'],
    practicalUse: 'Visualize project and directory hierarchies clearly.',
    example: 'tree /home/student',
    expectedOutput: '├── Desktop\n│   └── welcome.txt\n├── Documents\n│   └── wordlist.txt\n',
    execute: (args, ctx) => {
      const target = args.find(a => !a.startsWith('-')) || ctx.cwd;
      const startNode = vfs.getNode(target, ctx.cwd, ctx.user.home);
      if (!startNode) return { exitCode: 1, stderr: `tree: '${target}': No such file or directory\n` };

      const lines = [target];
      const printTree = (node, prefix = '') => {
        if (node.type !== 'dir') return;
        const entries = Array.from(node.children.entries());
        entries.forEach(([name, child], idx) => {
          const isLast = idx === entries.length - 1;
          const marker = isLast ? '└── ' : '├── ';
          lines.push(prefix + marker + name + (child.type === 'dir' ? '/' : ''));
          if (child.type === 'dir') {
            printTree(child, prefix + (isLast ? '    ' : '│   '));
          }
        });
      };

      printTree(startNode);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  // df & du
  registry.register({
    name: 'df',
    category: '1. Linux Fundamentals',
    description: 'Report file system disk space usage',
    syntax: 'df -h',
    options: ['-h (human-readable)', '-T (show filesystem type)'],
    practicalUse: 'Check available storage, partition structures, and mount points.',
    example: 'df -h',
    expectedOutput: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       512G  8.4G  504G   2% /',
    execute: () => {
      const stats = processes.getOverallStats();
      const available = (stats.totalDiskGB - stats.usedDiskGB).toFixed(0);
      const usage = stats.diskUsagePercent.toFixed(0);
      const out = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       ${stats.totalDiskGB}G  ${stats.usedDiskGB}G  ${available}G   ${usage}% /\nudev             8.0G     0  8.0G   0% /dev\ntmpfs            3.2G  1.4M  3.2G   1% /run\n`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'du',
    category: '1. Linux Fundamentals',
    description: 'Estimate file space usage',
    syntax: 'du -sh [path...]',
    options: ['-s (summary)', '-h (human readable)', '-a (all files)'],
    practicalUse: 'Locate massive log files or directories consuming disk space.',
    example: 'du -sh *',
    expectedOutput: '4.0K\tDesktop\n8.0K\tDocuments\n12K\tProjects',
    execute: (args, ctx) => {
      const res = vfs.listDirectory(ctx.cwd, ctx.cwd, ctx.user);
      if (!res.success) return { exitCode: 1, stderr: `du: ${res.error}\n` };
      const lines = res.entries.map(e => `${(Math.max(4, Math.round(e.size / 1024)) || 4)}K\t${e.name}`);
      return { exitCode: 0, stdout: lines.join('\n') + (lines.length ? '\n' : '') };
    }
  });

  // file & stat
  registry.register({
    name: 'file',
    category: '1. Linux Fundamentals',
    description: 'Determine file type',
    syntax: 'file [options] [file...]',
    options: ['-b (brief mode)', '-i (MIME type)'],
    practicalUse: 'Identify whether a mystery file is an ELF binary, shell script, PCAP trace, or text.',
    example: 'file /usr/bin/find',
    expectedOutput: '/usr/bin/find: ELF 64-bit LSB pie executable, x86-64',
    execute: (args, ctx) => {
      const target = args.find(a => !a.startsWith('-'));
      if (!target) return { exitCode: 1, stderr: 'file: missing argument\n' };
      const res = vfs.readFile(target, ctx.cwd, ctx.user);
      if (!res.success && res.error !== 'Is a directory') {
        return { exitCode: 1, stderr: `file: cannot open '${target}': ${res.error}\n` };
      }

      const node = vfs.getNode(target, ctx.cwd, ctx.user.home);
      let desc = 'ASCII text';
      if (node.type === 'dir') desc = 'directory';
      else if (target.endsWith('.pcap')) desc = 'tcpdump capture file (little-endian)';
      else if (target.endsWith('.py')) desc = 'Python script text executable';
      else if (target.endsWith('.sh')) desc = 'POSIX shell script text executable';
      else if (target.endsWith('.png') || target.endsWith('.jpg') || target.endsWith('.svg')) desc = 'image data';
      else if (node.suid || target.startsWith('/usr/bin') || target.startsWith('/bin')) desc = 'ELF 64-bit LSB pie executable, x86-64, dynamically linked';

      return { exitCode: 0, stdout: `${target}: ${desc}\n` };
    }
  });

  registry.register({
    name: 'stat',
    category: '1. Linux Fundamentals',
    description: 'Display file or file system status',
    syntax: 'stat file',
    options: ['-c (format output)'],
    practicalUse: 'Inspect exact timestamps, inode numbers, and numeric permission bits.',
    example: 'stat welcome.txt',
    expectedOutput: '  File: welcome.txt\n  Size: 420 \tBlocks: 8\nAccess: (0644/-rw-r--r--)  Uid: ( 1000/ student)   Gid: ( 1000/ student)',
    execute: (args, ctx) => {
      const file = args.find(a => !a.startsWith('-'));
      if (!file) return { exitCode: 1, stderr: 'stat: missing operand\n' };
      const node = vfs.getNode(file, ctx.cwd, ctx.user.home);
      if (!node) return { exitCode: 1, stderr: `stat: cannot stat '${file}': No such file or directory\n` };

      const modeOctal = (node.permissions).toString(8).padStart(4, '0');
      const permStr = VirtualPermissions.modeToString(node.permissions, node.type === 'dir', node.suid, node.sgid, node.sticky);
      const out = `  File: ${file}
  Size: ${node.size}        Blocks: 8          IO Block: 4096   ${node.type === 'dir' ? 'directory' : 'regular file'}
Access: (${modeOctal}/${permStr})  Uid: ( 1000/ ${node.owner})   Gid: ( 1000/ ${node.group})
Access: ${node.atime.toISOString()}
Modify: ${node.mtime.toISOString()}
Change: ${node.ctime.toISOString()}
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // jq
  registry.register({
    name: 'jq',
    category: '1. Linux Fundamentals',
    description: 'Command-line JSON processor',
    syntax: "cat data.json | jq '.'",
    options: ['-r (raw string output)', '-c (compact output)'],
    practicalUse: 'Parse and extract API payloads, cloud audit reports, and reconnaissance JSON outputs.',
    example: "echo '{\"status\":\"success\",\"count\":5}' | jq .",
    expectedOutput: '{\n  "status": "success",\n  "count": 5\n}',
    execute: (args, ctx) => {
      const text = ctx.stdin || '{}';
      try {
        const obj = JSON.parse(text);
        return { exitCode: 0, stdout: JSON.stringify(obj, null, 2) + '\n' };
      } catch (e) {
        return { exitCode: 1, stderr: `jq: parse error: ${e.message}\n` };
      }
    }
  });

  // help & man
  registry.register({
    name: 'help',
    category: '1. Linux Fundamentals',
    description: 'Display information about built-in and supported commands',
    syntax: 'help [category|command]',
    options: [],
    practicalUse: 'Learn supported options and commands inside CyberLinux.',
    example: 'help',
    expectedOutput: 'Panda OS Interactive Shell Help\nType "man <command>" for detailed manual.',
    execute: (args) => {
      if (args[0]) {
        const cmd = registry.get(args[0]);
        if (cmd) {
          const out = `COMMAND: ${cmd.name}
CATEGORY: ${cmd.category}
DESCRIPTION: ${cmd.description}
SYNTAX: ${cmd.syntax}
OPTIONS:
${cmd.options.map(o => '  ' + o).join('\n') || '  None'}
PRACTICAL USE: ${cmd.practicalUse}
EXAMPLE: ${cmd.example}
`;
          return { exitCode: 0, stdout: out };
        }
      }

      const cats = registry.getCategories();
      let out = `${SYSTEM_INFO.osName} Command Center
===================================
Total Supported Commands: ${registry.getAll().length}
Available Categories:
${cats.map(c => `  * ${c}`).join('\n')}

Tips:
- Use 'man <command>' for the complete reference page
- Use 'help <command>' for quick syntax
- Use the GUI "Command Reference" app for searchable documentation
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'man',
    category: '1. Linux Fundamentals',
    description: 'An interface to the system reference manuals',
    syntax: 'man <command>',
    options: ['-k (search manuals by keyword, like apropos)'],
    practicalUse: 'Study Linux command flags, parameters, and author documentation.',
    example: 'man nmap',
    expectedOutput: 'NMAP(1)                  Network Exploration & Security Scanner',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'What manual page do you want?\n' };
      const cmd = registry.get(args[0]);
      if (!cmd) return { exitCode: 1, stderr: `No manual entry for ${args[0]}\n` };

      const out = `${cmd.name.toUpperCase()}(1)               General Commands Manual               ${cmd.name.toUpperCase()}(1)

NAME
       ${cmd.name} - ${cmd.description}

SYNOPSIS
       ${cmd.syntax}

DESCRIPTION
       ${cmd.description}
       ${cmd.practicalUse}

OPTIONS
${cmd.options.map(o => '       ' + o).join('\n') || '       None'}

EXAMPLE
       ${cmd.example}

EXPECTED OUTPUT
       ${cmd.expectedOutput}

IMPLEMENTATION
       ${cmd.isSimulation ? 'Educational Controlled Simulation' : 'Direct Virtual Environment Engine'}

${SYSTEM_INFO.osName} 1.0                         November 2026                 ${cmd.name.toUpperCase()}(1)
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // 2. USERS, GROUPS AND PERMISSIONS
  // ==========================================

  // chmod
  registry.register({
    name: 'chmod',
    category: '2. Users and Permissions',
    description: 'Change file mode bits (permissions)',
    syntax: 'chmod [options] mode file...',
    options: ['-R (recursive)', '755, 644, 4755 (numeric)', '+x, u=rw (symbolic)'],
    practicalUse: 'Configure executable scripts, protect SSH private keys (chmod 600), or set SUID bits (chmod 4755).',
    example: 'chmod 755 script.sh',
    expectedOutput: '',
    execute: (args, ctx) => {
      const clean = args.filter(a => !a.startsWith('-'));
      if (clean.length < 2) return { exitCode: 1, stderr: 'chmod: missing operand\n' };
      const modeStr = clean[0];
      const files = clean.slice(1);

      for (const f of files) {
        const res = vfs.chmod(f, modeStr, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `chmod: cannot access '${f}': ${res.error}\n` };
      }
      return { exitCode: 0 };
    }
  });

  // chown
  registry.register({
    name: 'chown',
    category: '2. Users and Permissions',
    description: 'Change file owner and group',
    syntax: 'chown [options] [owner][:group] file...',
    options: ['-R (recursive)'],
    practicalUse: 'Assign file ownership to specific users and service accounts.',
    example: 'chown root:root /etc/shadow',
    expectedOutput: '',
    execute: (args, ctx) => {
      const clean = args.filter(a => !a.startsWith('-'));
      if (clean.length < 2) return { exitCode: 1, stderr: 'chown: missing operand\n' };
      const spec = clean[0];
      const files = clean.slice(1);

      let [owner, group] = spec.split(':');
      for (const f of files) {
        const res = vfs.chown(f, owner, group, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `chown: ${res.error}\n` };
      }
      return { exitCode: 0 };
    }
  });

  // sudo
  registry.register({
    name: 'sudo',
    category: '2. Users and Permissions',
    description: 'Execute a command with superuser privileges',
    syntax: 'sudo [-u user] command...',
    options: ['-l (list privileges)', '-u <user> (run as user)', '-i (interactive root shell)'],
    practicalUse: 'Run administrative operations, and check misconfigured sudo rights via "sudo -l" for privilege escalation.',
    example: 'sudo -l',
    expectedOutput: `User ${SYSTEM_INFO.username} may run the following commands on ${SYSTEM_INFO.hostname}:\n    (ALL : ALL) NOPASSWD: ALL`,
    execute: (args, ctx) => {
      if (!users.canSudo(ctx.user.name)) {
        return { exitCode: 1, stderr: `sudo: ${ctx.user.name} is not allowed to run sudo on ${network.hostname}\n` };
      }

      if (args.includes('-l')) {
        const out = `Matching Defaults entries for ${ctx.user.name} on ${network.hostname}:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin

User ${ctx.user.name} may run the following commands on ${network.hostname}:
    (ALL : ALL) NOPASSWD: ALL
`;
        return { exitCode: 0, stdout: out };
      }

      if (args.length === 0 || args[0] === '-s' || args[0] === '-i') {
        users.setCurrentUser('root');
        ctx.user = users.getUser('root');
        ctx.cwd = ctx.user.home;
        return { exitCode: 0, stdout: 'Switching to root shell...\n', newCwd: ctx.cwd };
      }

      // Execute command as root
      const rootUser = users.getUser('root');
      const cmdName = args[0];
      const cmdArgs = args.slice(1);
      const cmd = registry.get(cmdName);

      if (!cmd) return { exitCode: 1, stderr: `sudo: ${cmdName}: command not found\n` };

      const elevatedCtx = {
        ...ctx,
        user: rootUser
      };
      return cmd.execute(cmdArgs, elevatedCtx);
    }
  });

  // su
  registry.register({
    name: 'su',
    category: '2. Users and Permissions',
    description: 'Change user ID or become superuser',
    syntax: 'su [-] [username]',
    options: ['- (provide an environment similar to what the user would expect had the user logged in directly)'],
    practicalUse: 'Switch between accounts during multi-user assessments.',
    example: 'su student',
    expectedOutput: '',
    execute: (args, ctx) => {
      const targetName = args.find(a => !a.startsWith('-')) || 'root';
      const ok = users.setCurrentUser(targetName);
      if (!ok) return { exitCode: 1, stderr: `su: user ${targetName} does not exist\n` };
      ctx.user = users.getUser(targetName);
      ctx.cwd = ctx.user.home || SYSTEM_INFO.home;
      return { exitCode: 0, stdout: `Switched to user ${targetName}\n`, newCwd: ctx.cwd };
    }
  });

  // getent
  registry.register({
    name: 'getent',
    category: '2. Users and Permissions',
    description: 'Get entries from Name Service Switch libraries',
    syntax: 'getent [passwd|group|hosts] [key]',
    options: [],
    practicalUse: 'Query user accounts and groups even when networked directory services (LDAP/AD) are connected.',
    example: 'getent passwd student',
    expectedOutput: 'student:x:1001:1001:Cybersecurity Student:/home/student:/bin/bash',
    execute: (args) => {
      const db = args[0];
      if (db === 'passwd') {
        return { exitCode: 0, stdout: users.formatPasswd() + '\n' };
      }
      if (db === 'group') {
        return { exitCode: 0, stdout: users.formatGroup() + '\n' };
      }
      return { exitCode: 1, stderr: `getent: unknown database ${db}\n` };
    }
  });


  // ==========================================
  // 3. PROCESS AND SYSTEM MANAGEMENT
  // ==========================================

  // ps
  registry.register({
    name: 'ps',
    category: '3. Process Management',
    description: 'Report a snapshot of the current processes',
    syntax: 'ps [aux|-ef]',
    options: ['aux (show all processes with user and CPU/memory)', '-ef (standard full listing)', '-u <user> (filter by user)'],
    practicalUse: 'Investigate running services, detect unauthorized processes or miners, and identify unprivileged services to exploit.',
    example: 'ps aux',
    expectedOutput: 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.1  0.8 168240 12840 ?        Ss   08:00   0:02 /sbin/init',
    execute: (args) => {
      const procs = processes.list();
      const lines = [
        'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'
      ];

      for (const p of procs) {
        const u = p.user.padEnd(8, ' ');
        const pid = String(p.pid).padStart(5, ' ');
        const cpu = String(p.dynamicCpu).padStart(4, ' ');
        const mem = String(p.mem).padStart(4, ' ');
        const tty = (p.tty || '?').padEnd(8, ' ');
        const stat = (p.stat || 'S').padEnd(4, ' ');
        const start = (p.startTime || '08:00').padEnd(7, ' ');
        lines.push(`${u} ${pid} ${cpu} ${mem}  84210  4210 ${tty} ${stat} ${start}  0:01 ${p.command}`);
      }

      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  // top & htop
  registry.register({
    name: 'top',
    category: '3. Process Management',
    description: 'Display Linux processes and system resource usage',
    syntax: 'top',
    options: ['-b (batch mode)', '-n (number of iterations)'],
    practicalUse: 'Real-time performance monitoring and hunting rogue resource-intensive processes.',
    example: 'top',
    expectedOutput: 'Tasks: 10 total, 1 running, 9 sleeping, 0 stopped\n%Cpu(s): 3.2 us, 1.1 sy, 0.0 ni, 95.7 id',
    execute: () => {
      const stats = processes.getOverallStats();
      const out = `top - ${new Date().toTimeString().substring(0, 8)} up 12 days, 2 users, load average: 0.12, 0.08, 0.05
Tasks: 10 total,   1 running,   9 sleeping,   0 stopped,   0 zombie
%Cpu(s):  ${stats.cpuUsage} us,  1.2 sy,  0.0 ni, ${(100 - stats.cpuUsage).toFixed(1)} id,  0.1 wa
MiB Mem :   ${stats.totalMemMB}.0 total,   ${(stats.totalMemMB - stats.usedMemMB).toFixed(1)} free,    ${stats.usedMemMB} used,    512.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,        0.0 used.   3200.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1520 ${SYSTEM_INFO.username.padEnd(8)} 20   0   14210   3840   2100 S   0.2   0.7   0:00.12 bash
 1450 ${SYSTEM_INFO.username.padEnd(8)} 20   0  184200  42100  18400 S   0.2   2.1   0:05.40 gnome-shell
  680 root      20   0   32410   8400   4100 S   0.1   0.9   0:01.02 NetworkManager
 1240 root      20   0   15200   4100   2800 S   0.0   0.5   0:00.45 sshd
    1 root      20   0  168240  12840   8200 S   0.0   0.8   0:02.10 systemd
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'htop',
    category: '3. Process Management',
    description: 'Interactive process viewer (GUI/TUI)',
    syntax: 'htop',
    options: [],
    practicalUse: 'Rich interactive process inspector.',
    example: 'htop',
    expectedOutput: '[Opens System Monitor or TUI process list]',
    execute: () => {
      // Launch or point user to System Monitor app
      return {
        exitCode: 0,
        stdout: 'Opening Panda OS System Monitor GUI...\n[Tip: Use System Monitor from the dock or app launcher for interactive process management and resource charts]\n'
      };
    }
  });

  // kill & killall
  registry.register({
    name: 'kill',
    category: '3. Process Management',
    description: 'Send a signal to a process (terminate process)',
    syntax: 'kill [-9|-15] <pid>',
    options: ['-9 (SIGKILL: force kill)', '-15 (SIGTERM: graceful termination)'],
    practicalUse: 'Terminate unresponsive processes, stop reverse shells, or kill background daemons.',
    example: 'kill -9 1520',
    expectedOutput: '',
    execute: (args, ctx) => {
      const pidStr = args.find(a => !a.startsWith('-'));
      if (!pidStr) return { exitCode: 1, stderr: 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...\n' };
      const pid = parseInt(pidStr, 10);
      const res = processes.kill(pid, 15, ctx.user.name);
      if (!res.success) return { exitCode: 1, stderr: `kill: (${pid}) - ${res.error}\n` };
      return { exitCode: 0, stdout: `[Process ${pid} terminated]\n` };
    }
  });

  // free
  registry.register({
    name: 'free',
    category: '3. Process Management',
    description: 'Display amount of free and used memory in the system',
    syntax: 'free -h',
    options: ['-h (human readable)', '-m (display in megabytes)', '-g (display in gigabytes)'],
    practicalUse: 'Check memory exhaustion or swap activation.',
    example: 'free -h',
    expectedOutput: '               total        used        free      shared  buff/cache   available\nMem:          16.0Gi       4.6Gi      11.4Gi        24Mi       512Mi      11.9Gi',
    execute: () => {
      const stats = processes.getOverallStats();
      const totalGiB = stats.totalMemMB / 1024;
      const usedGiB = stats.usedMemMB / 1024;
      const freeGiB = totalGiB - usedGiB;
      const out = `               total        used        free      shared  buff/cache   available\nMem:          ${totalGiB.toFixed(1)}Gi       ${usedGiB.toFixed(1)}Gi      ${freeGiB.toFixed(1)}Gi        24Mi       512Mi      ${(freeGiB + 0.5).toFixed(1)}Gi\nSwap:          2.0Gi          0B       2.0Gi\n`;
      return { exitCode: 0, stdout: out };
    }
  });

  // lscpu
  registry.register({
    name: 'lscpu',
    category: '3. Process Management',
    description: 'Display information about the CPU architecture',
    syntax: 'lscpu',
    options: [],
    practicalUse: 'Enumerate CPU architecture, virtualization flags (VT-x/AMD-V), and hardware vulnerability mitigations (Spectre/Meltdown).',
    example: 'lscpu',
    expectedOutput: `Architecture:            x86_64\nCPU op-mode(s):        32-bit, 64-bit\nCPU(s):                ${SYSTEM_INFO.cpuCount}`,
    execute: () => {
      const out = `Architecture:            x86_64
  CPU op-mode(s):        32-bit, 64-bit
  Address sizes:         39 bits physical, 48 bits virtual
  Byte Order:            Little Endian
CPU(s):                  ${SYSTEM_INFO.cpuCount}
  On-line CPU(s) list:   0-${SYSTEM_INFO.cpuCount - 1}
Vendor ID:               GenuineIntel
  Model name:            Virtual Panda OS CPU
Virtualization features: 
  Hypervisor vendor:     KVM
  Virtualization type:   full
Vulnerabilities:         
  Meltdown:              Mitigation; PTI
  Spectre v1:            Mitigation; usercopy/swapgs barriers
  Spectre v2:            Mitigation; Retpolines
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // dmesg
  registry.register({
    name: 'dmesg',
    category: '3. Process Management',
    description: 'Print or control the kernel ring buffer',
    syntax: 'dmesg [-T]',
    options: ['-T (human-readable timestamps)', '-l (level filter)'],
    practicalUse: 'Analyze boot hardware initialization, USB device insertions, and kernel segmentation faults.',
    example: 'dmesg -T | head',
    expectedOutput: '[    0.000000] Linux version 6.8.0-cyber-generic\n[    0.000000] Secure boot enabled',
    execute: () => {
      const res = vfs.readFile('/var/log/syslog', '/', { name: 'root', uid: 0 });
      return { exitCode: 0, stdout: (res.success ? res.content : 'Kernel ring buffer empty\n') };
    }
  });


  // ==========================================
  // 4. NETWORKING AND DNS
  // ==========================================

  // ip
  registry.register({
    name: 'ip',
    category: '4. Networking and DNS',
    description: 'Show / manipulate routing, network devices, interfaces and tunnels',
    syntax: 'ip [a|addr|link|route|neigh]',
    options: ['a / addr (show IP addresses)', 'link (show network interfaces)', 'r / route (show routing table)', 'neigh (show ARP cache)'],
    practicalUse: 'Modern standard Linux networking utility for inspecting interfaces, gateway routes, and local subnet neighbors.',
    example: 'ip a',
    expectedOutput: '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n    inet 192.168.1.50/24 brd 192.168.1.255',
    execute: (args) => {
      const sub = args[0] || 'a';
      if (sub === 'a' || sub === 'addr') {
        const lines = [];
        network.interfaces.forEach((iface, idx) => {
          lines.push(`${idx + 1}: ${iface.name}: <${iface.flags.join(',')}> mtu ${iface.mtu} qdisc fq_codel state ${iface.state}`);
          lines.push(`    link/ether ${iface.mac} brd ff:ff:ff:ff:ff:ff`);
          lines.push(`    inet ${iface.ipv4} ${iface.broadcast ? 'brd ' + iface.broadcast : ''} scope global ${iface.name}`);
        });
        return { exitCode: 0, stdout: lines.join('\n') + '\n' };
      }
      if (sub === 'link') {
        const lines = network.interfaces.map((iface, idx) =>
          `${idx + 1}: ${iface.name}: <${iface.flags.join(',')}> mtu ${iface.mtu} state ${iface.state}\n    link/ether ${iface.mac}`
        );
        return { exitCode: 0, stdout: lines.join('\n') + '\n' };
      }
      if (sub === 'r' || sub === 'route') {
        const lines = network.routes.map(r =>
          `${r.destination} ${r.gateway !== '0.0.0.0' ? 'via ' + r.gateway : ''} dev ${r.iface} proto ${r.proto} metric ${r.metric}`
        );
        return { exitCode: 0, stdout: lines.join('\n') + '\n' };
      }
      if (sub === 'neigh') {
        const lines = network.arpTable.map(a =>
          `${a.ip} dev ${a.iface} lladdr ${a.mac} ${a.state}`
        );
        return { exitCode: 0, stdout: lines.join('\n') + '\n' };
      }
      return { exitCode: 0, stdout: 'Usage: ip [addr | link | route | neigh]\n' };
    }
  });

  // ifconfig (legacy)
  registry.register({
    name: 'ifconfig',
    category: '4. Networking and DNS',
    description: 'Configure and inspect network interface parameters (legacy)',
    syntax: 'ifconfig',
    options: ['-a (display all interfaces)'],
    practicalUse: 'Classic network interface viewer still ubiquitous in penetration testing walkthroughs.',
    example: 'ifconfig eth0',
    expectedOutput: 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255',
    execute: () => {
      const out = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255
        ether 08:00:27:fa:41:22  txqueuelen 1000  (Ethernet)
        RX packets 4210  bytes 5241088 (5.2 MB)
        TX packets 1840  bytes 1840212 (1.8 MB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // ping
  registry.register({
    name: 'ping',
    category: '4. Networking and DNS',
    description: 'Send ICMP ECHO_REQUEST to network hosts',
    syntax: 'ping [-c count] destination',
    options: ['-c <count> (stop after sending count packets)'],
    practicalUse: 'Test host reachability, packet loss, and latency.',
    example: 'ping -c 4 192.168.1.10',
    expectedOutput: '64 bytes from 192.168.1.10: icmp_seq=1 ttl=64 time=14.2 ms',
    execute: (args) => {
      let count = 4;
      let host = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-c' && args[i + 1]) {
          count = parseInt(args[i + 1], 10) || 4;
          i++;
        } else if (!args[i].startsWith('-')) {
          host = args[i];
        }
      }
      if (!host) return { exitCode: 1, stderr: 'ping: missing host operand\n' };
      const res = network.ping(host, count);
      if (!res.success) return { exitCode: 1, stderr: res.error + '\n' };
      return { exitCode: 0, stdout: res.output + '\n' };
    }
  });

  // ss & netstat
  registry.register({
    name: 'ss',
    category: '4. Networking and DNS',
    description: 'Another utility to investigate sockets',
    syntax: 'ss [-tulnp]',
    options: ['-t (TCP sockets)', '-u (UDP sockets)', '-l (listening sockets)', '-n (numeric ports)', '-p (show process)'],
    practicalUse: 'Identify internal listening services that are not exposed externally (great for local port forwarding).',
    example: 'ss -tulnp',
    expectedOutput: 'Netid State  Recv-Q Send-Q   Local Address:Port   Peer Address:Port  Process\ntcp   LISTEN 0      128            0.0.0.0:22          0.0.0.0:*      users:(("sshd",pid=1240,fd=3))',
    execute: () => {
      const table = network.getSocketTable();
      const lines = [
        'Netid State  Recv-Q Send-Q   Local Address:Port   Peer Address:Port  Process'
      ];
      for (const row of table) {
        lines.push(`${row.proto.padEnd(5, ' ')} ${row.state.padEnd(6, ' ')} ${String(row.recvQ).padStart(6, ' ')} ${String(row.sendQ).padStart(6, ' ')}   ${row.localAddr.padEnd(20, ' ')} ${row.peerAddr.padEnd(18, ' ')} users:(("${row.pid}"))`);
      }
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'netstat',
    category: '4. Networking and DNS',
    description: 'Print network connections, routing tables, and interface statistics (legacy)',
    syntax: 'netstat -tulnp',
    options: ['-t (TCP)', '-u (UDP)', '-l (listening)', '-n (numeric)'],
    practicalUse: 'Classic network connection auditor.',
    example: 'netstat -tulnp',
    expectedOutput: 'Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1240/sshd',
    execute: () => {
      return registry.get('ss').execute([], {});
    }
  });

  // dig & nslookup & host & whois
  registry.register({
    name: 'dig',
    category: '4. Networking and DNS',
    description: 'DNS lookup utility',
    syntax: 'dig [@server] domain [A|MX|NS|TXT|ANY]',
    options: ['+short (concise answer only)', 'ANY (query all records)'],
    practicalUse: 'Query DNS infrastructure, locate mail servers, zone transfer attempts, and SPF records.',
    example: 'dig example.com MX',
    expectedOutput: ';; ANSWER SECTION:\nexample.com.  300  IN  MX  10 mail.example.com.',
    execute: (args) => {
      const domain = args.find(a => !a.startsWith('-') && !a.startsWith('+') && !a.startsWith('@')) || 'example.com';
      const qtype = args.find(a => ['A', 'MX', 'NS', 'TXT', 'ANY'].includes(a.toUpperCase())) || 'A';

      const res = network.resolveDNS(domain, qtype);
      if (!res.success) return { exitCode: 1, stderr: res.error + '\n' };

      const out = `; <<>> DiG 9.18.1-1ubuntu1-CyberLinux <<>> ${domain} ${qtype}
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48210
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;${domain}.                     IN      ${qtype}

;; ANSWER SECTION:
${domain}.              300     IN      ${qtype}      ${res.value}

;; Query time: 14 msec
;; SERVER: 1.1.1.1#53(1.1.1.1)
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'whois',
    category: '4. Networking and DNS',
    description: 'Client for the whois directory service',
    syntax: 'whois domain',
    options: [],
    practicalUse: 'Reconnaissance tool to discover registrant details, contact emails, and name servers.',
    example: 'whois example.com',
    expectedOutput: 'Domain Name: EXAMPLE.COM\nRegistrar: RESERVED-Internet Assigned Numbers Authority',
    execute: (args) => {
      const domain = args[0] || 'example.com';
      const out = `Domain Name: ${domain.toUpperCase()}
Registry Domain ID: 2336799_DOMAIN_COM-VRSN
Registrar WHOIS Server: whois.iana.org
Updated Date: 2026-08-14T07:00:00Z
Creation Date: 1995-08-14T04:00:00Z
Registrar: Internet Assigned Numbers Authority
Registrant Organization: Internet Assigned Numbers Authority
Registrant State/Province: CA
Registrant Country: US
Name Server: A.IANA-SERVERS.NET
Name Server: B.IANA-SERVERS.NET
DNSSEC: signedDelegation
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // curl & wget
  registry.register({
    name: 'curl',
    category: '4. Networking and DNS',
    description: 'Transfer data from or to a server using supported protocols',
    syntax: 'curl [options] <url>',
    options: ['-I / --head (fetch HTTP headers only)', '-s (silent)', '-v (verbose)', '-X <method> (custom request)', '-d <data> (POST data)'],
    practicalUse: 'Interact with web APIs, examine server headers, test endpoints, and download payloads.',
    example: 'curl -I http://192.168.1.10',
    expectedOutput: 'HTTP/1.1 200 OK\nDate: Tue, 17 Nov 2026 20:20:00 GMT\nServer: Apache/2.2.8 (Ubuntu) DAV/2',
    execute: (args) => {
      const headersOnly = args.includes('-I') || args.includes('--head');
      const url = args.find(a => a.startsWith('http://') || a.startsWith('https://')) || 'http://192.168.1.10';

      if (url.includes('192.168.1.10')) {
        const headers = `HTTP/1.1 200 OK
Date: Tue, 17 Nov 2026 20:20:00 GMT
Server: Apache/2.2.8 (Ubuntu) DAV/2 mod_ssl/2.2.8 OpenSSL/0.9.8g
X-Powered-By: PHP/5.2.4-2ubuntu5.10
Content-Type: text/html; charset=UTF-8
Content-Length: 1420
`;
        if (headersOnly) return { exitCode: 0, stdout: headers };
        return { exitCode: 0, stdout: `<html>\n<head><title>Metasploitable2 - Linux Lab</title></head>\n<body>\n<h1>Welcome to Metasploitable2 Educational Lab</h1>\n<ul>\n<li><a href="/admin">Admin Portal</a></li>\n<li><a href="/phpmyadmin">phpMyAdmin</a></li>\n<li><a href="/uploads">Uploads Directory</a></li>\n</ul>\n</body>\n</html>\n` };
      }

      return {
        exitCode: 0,
        stdout: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<!doctype html><html><body><h1>Example Domain</h1></body></html>\n`
      };
    }
  });

  // nc (netcat)
  registry.register({
    name: 'nc',
    aliases: ['netcat', 'ncat'],
    category: '4. Networking and DNS',
    description: 'Arbitrary TCP and UDP connections and listens (Swiss Army knife)',
    syntax: 'nc [-zv|-lvp] [host] [port]',
    options: ['-z (zero-I/O mode for port scanning)', '-v (verbose)', '-l (listen mode)', '-p <port> (local port)'],
    practicalUse: 'Banner grabbing, port checking, file transfers, and establishing reverse shells.',
    example: 'nc -zv 192.168.1.10 21-25',
    expectedOutput: 'Connection to 192.168.1.10 21 port [tcp/ftp] succeeded!\nConnection to 192.168.1.10 22 port [tcp/ssh] succeeded!',
    execute: (args) => {
      const verbose = args.includes('-v') || args.includes('-zv') || args.includes('-vz');
      const target = args.find(a => !a.startsWith('-') && isNaN(a)) || '192.168.1.10';
      const portArg = args.find(a => !isNaN(a) || (typeof a === 'string' && a.includes('-')));

      const out = `(UNKNOWN) [${target}] 21 (ftp) open: 220 (vsFTPd 2.3.4)
(UNKNOWN) [${target}] 22 (ssh) open: SSH-2.0-OpenSSH_4.7p1 Debian-8ubuntu1
(UNKNOWN) [${target}] 80 (http) open: Apache/2.2.8 (Ubuntu)
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // 5. PACKAGE MANAGEMENT
  // ==========================================

  // apt
  registry.register({
    name: 'apt',
    aliases: ['apt-get'],
    category: '5. Package Management',
    description: 'Command-line package manager for Debian/Ubuntu based distributions',
    syntax: 'apt [update|upgrade|install|remove|search] [package]',
    options: ['update (resynchronize package index files)', 'install (install package)', 'search (search for package)'],
    practicalUse: 'Install and update penetration testing tools and system dependencies.',
    example: 'sudo apt install nmap',
    expectedOutput: 'Reading package lists... Done\nBuilding dependency tree... Done\nnmap is already the newest version (7.94-1).',
    execute: (args, ctx) => {
      const action = args[0] || 'help';
      const pkg = args[1];

      if (action === 'update') {
        const out = `Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]
Get:3 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]
Fetched 229 kB in 1s (210 kB/s)
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.
`;
        return { exitCode: 0, stdout: out };
      }

      if (action === 'install') {
        if (!pkg) return { exitCode: 1, stderr: 'apt install: missing package name\n' };
        return { exitCode: 0, stdout: `Reading package lists... Done\nBuilding dependency tree... Done\n${pkg} is already installed in CyberLinux simulated environment.\n` };
      }

      if (action === 'search') {
        return { exitCode: 0, stdout: `${pkg || 'security'} - CyberLinux verified educational tools repository\n` };
      }

      return { exitCode: 0, stdout: 'apt 2.4.12 (amd64)\nUsage: apt [update | install <pkg> | search <pkg>]\n' };
    }
  });


  // ==========================================
  // 6. SHELL SCRIPTING AND AUTOMATION
  // ==========================================

  // export & env
  registry.register({
    name: 'export',
    category: '6. Shell Scripting',
    description: 'Set export attribute for shell variables',
    syntax: 'export VAR=value',
    options: ['-p (display all exported variables)'],
    practicalUse: 'Set environment variables like PATH, TARGET IP, or API tokens.',
    example: 'export TARGET=192.168.1.10',
    expectedOutput: '',
    execute: (args, ctx) => {
      if (args.length === 0 || args[0] === '-p') {
        const lines = Object.entries(ctx.env).map(([k, v]) => `declare -x ${k}="${v}"`);
        return { exitCode: 0, stdout: lines.join('\n') + '\n' };
      }
      for (const a of args) {
        const eq = a.indexOf('=');
        if (eq !== -1) {
          const k = a.slice(0, eq);
          const v = a.slice(eq + 1);
          ctx.env[k] = v;
        }
      }
      return { exitCode: 0 };
    }
  });

  registry.register({
    name: 'env',
    aliases: ['printenv'],
    category: '6. Shell Scripting',
    description: 'Print environment variables or run a command in an altered environment',
    syntax: 'env',
    options: [],
    practicalUse: 'Inspect environment variables to spot hardcoded passwords, AWS tokens, or custom scripts in $PATH.',
    example: 'env',
    expectedOutput: `USER=${SYSTEM_INFO.username}\nHOME=${SYSTEM_INFO.home}\nPATH=/usr/local/bin:/usr/bin:/bin\nSHELL=/bin/bash`,
    execute: (args, ctx) => {
      const lines = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });


  // ==========================================
  // 7. CRYPTOGRAPHY AND HASHING
  // ==========================================

  // md5sum & sha256sum
  registry.register({
    name: 'md5sum',
    category: '7. Cryptography & Hashing',
    description: 'Compute and check MD5 message digest',
    syntax: 'md5sum [file...]',
    options: ['-c (read checksums from file and verify them)'],
    practicalUse: 'Verify download integrity and correlate known malware hashes (VirusTotal lookup).',
    example: 'md5sum welcome.txt',
    expectedOutput: 'e4d909c290d0fb1ca068ffaddf22cbd0  welcome.txt',
    execute: (args, ctx) => {
      const files = args.filter(a => !a.startsWith('-'));
      let text = ctx.stdin || '';
      let filename = '-';

      if (files.length > 0) {
        filename = files[0];
        const res = vfs.readFile(filename, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `md5sum: ${res.error}\n` };
        text = res.content;
      }

      // Safe deterministic hash simulation
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(32, '0');
      return { exitCode: 0, stdout: `${hex}  ${filename}\n` };
    }
  });

  registry.register({
    name: 'sha256sum',
    category: '7. Cryptography & Hashing',
    description: 'Compute and check SHA256 message digest',
    syntax: 'sha256sum [file...]',
    options: ['-c (verify hashes)'],
    practicalUse: 'Standard cryptographic hashing for digital forensics and file integrity verification.',
    example: 'sha256sum /etc/passwd',
    expectedOutput: 'a58f4c28b5849887cd87413f9c6d57f12e84128f73b885b5129938148b8120fa  /etc/passwd',
    execute: (args, ctx) => {
      const files = args.filter(a => !a.startsWith('-'));
      let text = ctx.stdin || '';
      let filename = '-';

      if (files.length > 0) {
        filename = files[0];
        const res = vfs.readFile(filename, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `sha256sum: ${res.error}\n` };
        text = res.content;
      }

      let hash = 5381;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).repeat(8).slice(0, 64);
      return { exitCode: 0, stdout: `${hex}  ${filename}\n` };
    }
  });

  // base64
  registry.register({
    name: 'base64',
    category: '7. Cryptography & Hashing',
    description: 'Base64 encode or decode data and print to standard output',
    syntax: 'base64 [-d] [file]',
    options: ['-d / --decode (decode data)'],
    practicalUse: 'Encoding payloads to bypass simple filters, and decoding obfuscated credentials and JWT tokens.',
    example: 'echo "cyberlinux" | base64',
    expectedOutput: 'Y3liZXJsaW51eAo=',
    execute: (args, ctx) => {
      const decode = args.includes('-d') || args.includes('--decode');
      const files = args.filter(a => !a.startsWith('-'));
      let text = ctx.stdin || '';

      if (files.length > 0) {
        const res = vfs.readFile(files[0], ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `base64: ${res.error}\n` };
        text = res.content;
      }

      try {
        if (decode) {
          const out = atob(text.trim());
          return { exitCode: 0, stdout: out + '\n' };
        } else {
          const out = btoa(text);
          return { exitCode: 0, stdout: out + '\n' };
        }
      } catch (e) {
        return { exitCode: 1, stderr: `base64: invalid input: ${e.message}\n` };
      }
    }
  });


  // ==========================================
  // 8. LINUX SECURITY AND HARDENING
  // ==========================================

  // ufw
  registry.register({
    name: 'ufw',
    category: '8. Security and Hardening',
    description: 'Program for managing a netfilter firewall (Uncomplicated Firewall)',
    syntax: 'sudo ufw [status|enable|disable|allow|deny] [port]',
    options: ['status verbose', 'allow 22/tcp', 'deny 80/tcp'],
    practicalUse: 'Linux host-based firewall management.',
    example: 'sudo ufw status verbose',
    expectedOutput: 'Status: active\nLogging: on (low)\nDefault: deny (incoming), allow (outgoing)',
    execute: (args) => {
      const out = `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
22/tcp (v6)                ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // lynis
  registry.register({
    name: 'lynis',
    category: '8. Security and Hardening',
    description: 'Security auditing tool for Unix-based systems',
    syntax: 'sudo lynis audit system',
    options: ['audit system (perform local security audit)'],
    practicalUse: 'System hardening compliance checks and discovering configuration weaknesses.',
    example: 'sudo lynis audit system',
    expectedOutput: '[+] Initializing audit\n[+] Hardening index: 78 [##############------]',
    execute: () => {
      const out = `[+] Initializing audit
------------------------------------
  - Program version:               3.0.8
      - Operating system:              ${SYSTEM_INFO.osName}
  - Kernel version:                6.8.0-cyber-generic

[+] System Tools
  - Scanning available binaries... [ OK ]

[+] Software: Firewalls
  - Checking iptables/nftables...  [ OK ]
  - Checking ufw status...         [ ACTIVE ]

[+] Security Scan Summary
------------------------------------
  Hardening index : 78 [##############------]
  Tests performed : 242
  Plugins enabled : 1

  Suggestions (3):
  * Set password for GRUB bootloader to prevent unauthorized console access
  * Configure auditd rules for watching /etc/sudoers
  * Enable fail2ban jail for SSH service
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // 9. PENETRATION TESTING & ETHICAL HACKING
  // ==========================================

  // nmap
  registry.register({
    name: 'nmap',
    category: '9. Penetration Testing',
    description: 'Network exploration tool and security / port scanner',
    syntax: 'nmap [Scan Type] [Options] {target specification}',
    options: [
      '-sV (Probe open ports to determine service/version info)',
      '-sC (Equivalent to --script=default)',
      '-p- (Scan all 65535 ports)',
      '-p <ports> (Scan specified ports)',
      '-O (Enable OS detection)',
      '-A (Enable OS detection, version detection, script scanning, and traceroute)'
    ],
    practicalUse: 'The foundational reconnaissance tool for network discovery, port auditing, and service fingerprinting.',
    example: 'nmap -sV -sC 192.168.1.10',
    expectedOutput: 'PORT     STATE SERVICE VERSION\n21/tcp   open  ftp     vsftpd 2.3.4\n22/tcp   open  ssh     OpenSSH 4.7p1 Debian\n80/tcp   open  http    Apache httpd 2.2.8 ((Ubuntu))',
    isSimulation: true,
    execute: (args) => {
      const target = args.find(a => !a.startsWith('-')) || '192.168.1.10';
      const scanData = network.scanTarget(target);

      const out = `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().substring(0, 19)} UTC
Nmap scan report for ${scanData.name || target} (${target})
Host is up (0.0014s latency).
Not shown: 991 closed tcp ports (reset)
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey: 
|   1024 60:0f:cf:e1:c0:5f:ec:72:30:06:cf:00:2b:bf:08:4f (DSA)
|_  2048 43:c0:aa:a5:a1:30:12:02:12:86:7b:78:5f:45:c2:de (RSA)
53/tcp   open  domain      ISC BIND 9.4.2
80/tcp   open  http        Apache httpd 2.2.8 ((Ubuntu) DAV/2)
|_http-title: Metasploitable2 - Linux Educational Lab
|_http-server-header: Apache/2.2.8 (Ubuntu) DAV/2
443/tcp  open  ssl/http    Apache httpd 2.2.8 SSL
3306/tcp open  mysql       MySQL 5.0.51a-3ubuntu5
5432/tcp open  postgresql  PostgreSQL DB 8.3.0
8080/tcp open  http-proxy  Apache Tomcat/Coyote JSP engine 1.1

MAC Address: 00:0C:29:84:11:BC (VMware)
Device type: general purpose
Running: Linux 2.6.X
OS CPE: cpe:/o:linux:linux_kernel:2.6

Nmap done: 1 IP address (1 host up) scanned in 2.14 seconds
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // gobuster
  registry.register({
    name: 'gobuster',
    category: '9. Penetration Testing',
    description: 'Directory/file & DNS busting tool written in Go',
    syntax: 'gobuster dir -u <url> -w <wordlist>',
    options: ['dir (directory brute-forcing)', 'dns (subdomain brute-forcing)', '-u <url> (target URL)', '-w <wordlist> (path to wordlist)'],
    practicalUse: 'Discover hidden admin panels, backup files, and API endpoints during web assessments.',
    example: 'gobuster dir -u http://192.168.1.10 -w /home/student/Documents/wordlist.txt',
    expectedOutput: '===============================================================\nGobuster v3.6\n===============================================================\n/admin                (Status: 200) [Size: 1420]\n/login                (Status: 200) [Size: 890]',
    isSimulation: true,
    execute: (args) => {
      const out = `===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://192.168.1.10
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                wordlist.txt
[+] Negative Status codes:   404
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/admin                (Status: 200) [Size: 1420]
/login                (Status: 200) [Size: 890]
/uploads              (Status: 301) [Size: 310] [--> http://192.168.1.10/uploads/]
/backup               (Status: 200) [Size: 4500]
/secret               (Status: 403) [Size: 280]
/api                  (Status: 200) [Size: 620]
/phpmyadmin           (Status: 200) [Size: 2840]
/robots.txt           (Status: 200) [Size: 120]
===============================================================
Finished
===============================================================
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // nikto
  registry.register({
    name: 'nikto',
    category: '9. Penetration Testing',
    description: 'Web server vulnerability scanner',
    syntax: 'nikto -h <host>',
    options: ['-h <host> (target host)', '-p <port> (port to scan)', '-ssl (force SSL)'],
    practicalUse: 'Quick web server security assessment scanning for dangerous files, outdated server versions, and misconfigurations.',
    example: 'nikto -h http://192.168.1.10',
    expectedOutput: '- Nikto v2.5.0\n+ Server: Apache/2.2.8 (Ubuntu)\n+ Retrieved x-powered-by header: PHP/5.2.4',
    isSimulation: true,
    execute: (args) => {
      const out = `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          192.168.1.10
+ Target Hostname:    192.168.1.10
+ Target Port:        80
+ Start Time:         ${new Date().toISOString()}
---------------------------------------------------------------------------
+ Server: Apache/2.2.8 (Ubuntu) DAV/2 mod_ssl/2.2.8 OpenSSL/0.9.8g
+ Retrieved x-powered-by header: PHP/5.2.4-2ubuntu5.10
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined.
+ The X-Content-Type-Options header is not set.
+ Apache/2.2.8 appears to be outdated (current is at least Apache/2.4.58).
+ /phpmyadmin/: phpMyAdmin directory found with default configuration.
+ /admin/: Directory indexing found.
+ /robots.txt: Contains 2 entries which should be manually reviewed.
+ 892 requests: 0 error(s) and 7 item(s) reported on remote host
---------------------------------------------------------------------------
+ End Time:           ${new Date().toISOString()} (12 seconds)
---------------------------------------------------------------------------
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // searchsploit
  registry.register({
    name: 'searchsploit',
    category: '9. Penetration Testing',
    description: 'Command-line search tool for Exploit-DB',
    syntax: 'searchsploit <term>',
    options: ['-m <edb-id> (mirror/copy exploit to current directory)', '-x <edb-id> (examine exploit)'],
    practicalUse: 'Look up known exploits matching discovered software versions (e.g. vsftpd 2.3.4, Apache 2.2.8).',
    example: 'searchsploit vsftpd 2.3.4',
    expectedOutput: 'vsftpd 2.3.4 - Backdoor Command Execution  | unix/remote/17491.rb',
    isSimulation: true,
    execute: (args) => {
      const query = args.join(' ').toLowerCase();
      if (query.includes('vsftpd')) {
        return {
          exitCode: 0,
          stdout: `---------------------------------------------------------------- ---------------------------------
 Exploit Title                                                  |  Path
---------------------------------------------------------------- ---------------------------------
vsftpd 2.3.4 - Backdoor Command Execution                       | unix/remote/17491.rb
vsftpd 2.3.4 - Backdoor Command Execution (Metasploit)          | unix/remote/49757.py
---------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
`
        };
      }
      return {
        exitCode: 0,
        stdout: `---------------------------------------------------------------- ---------------------------------
 Exploit Title                                                  |  Path
---------------------------------------------------------------- ---------------------------------
Apache 2.2.x - Options Memory Leak                              | multiple/remote/16982.c
Apache + PHP < 5.3.12 / < 5.4.2 - cgi-bin Remote Code Execution | php/remote/29290.c
---------------------------------------------------------------- ---------------------------------
`
      };
    }
  });

  // hydra
  registry.register({
    name: 'hydra',
    category: '9. Penetration Testing',
    description: 'Very fast network logon cracker which supports many different services',
    syntax: 'hydra -l user -P passlist.txt <target> <service>',
    options: ['-l <user> (single username)', '-L <userlist>', '-p <pass> (single password)', '-P <passlist>', '-t <tasks> (parallel tasks)'],
    practicalUse: 'Test authentication resiliency against brute force attacks across SSH, FTP, HTTP, and RDP.',
    example: 'hydra -l student -P wordlist.txt 192.168.1.10 ssh',
    expectedOutput: '[22][ssh] host: 192.168.1.10   login: student   password: cyber',
    isSimulation: true,
    execute: (args) => {
      const out = `Hydra v9.5 (c) 2023 by van Hauser / THC - Please do not use in military or secret service organizations!
[DATA] max 16 tasks per 1 server, target 192.168.1.10, service ssh
[STATUS] 10.00 tries/min, 10 tries in 00:01h, 0 to do
[22][ssh] host: 192.168.1.10   login: student   password: cyber
1 of 1 target completed, 1 valid password found
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // john & hashcat
  registry.register({
    name: 'john',
    category: '9. Penetration Testing',
    description: 'John the Ripper password cracker',
    syntax: 'john --wordlist=wordlist.txt hash.txt',
    options: ['--format=<format>', '--wordlist=<file>', '--show (show cracked passwords)'],
    practicalUse: 'Offline password audit and recovery for UNIX shadow hashes, NTLM, and archives.',
    example: 'john --wordlist=wordlist.txt hash.txt',
    expectedOutput: 'Loaded 1 password hash (sha512crypt)\ncyber            (student)\n1g 0:00:00:01 DONE (2026-11-17 20:25) 1.000g/s',
    isSimulation: true,
    execute: () => {
      const out = `Using default environment
Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 128/128 AVX 2x])
Cost 1 (iteration count) is 5000 for all loaded hashes
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
cyber            (student)     
1g 0:00:00:01 DONE (2026-11-17 20:25) 1.000g/s 4520p/s 4520c/s 4520C/s student..secret
Session completed.
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // 10. DIGITAL FORENSICS & INCIDENT RESPONSE
  // ==========================================

  // exiftool
  registry.register({
    name: 'exiftool',
    category: '10. Digital Forensics',
    description: 'Read and write meta information in files',
    syntax: 'exiftool <file>',
    options: [],
    practicalUse: 'Extract metadata from images and documents (camera model, GPS coordinates, author name, timestamps).',
    example: 'exiftool image.jpg',
    expectedOutput: 'File Name                       : mascot.svg\nFile Size                       : 4.2 kB\nFile Type                       : SVG\nMIME Type                       : image/svg+xml\nCreator                         : CyberLinux Art Team',
    isSimulation: true,
    execute: (args, ctx) => {
      const file = PathValidator.normalize(args[0] || `${ctx.user.home}/Pictures/mascot.svg`, ctx.cwd, ctx.user.home);
      const result = vfs.readFile(file, ctx.cwd, ctx.user);
      if (!result.success) return { exitCode: 1, stderr: `exiftool: ${file}: ${result.error}\n` };

      const { basename, dirname } = PathValidator.split(file);
      const extension = basename.split('.').pop().toLowerCase();
      const fileTypes = {
        svg: ['SVG', 'image/svg+xml'],
        png: ['PNG', 'image/png'],
        jpg: ['JPEG', 'image/jpeg'],
        jpeg: ['JPEG', 'image/jpeg']
      };
      const [fileType, mimeType] = fileTypes[extension] || ['File', 'application/octet-stream'];
      let output = `ExifTool Version Number         : 12.60
File Name                       : ${basename}
Directory                       : ${dirname}
File Size                       : ${result.content.length} bytes
File Modification Date/Time     : ${result.node.mtime.toISOString()}
File Type                       : ${fileType}
File Type Extension             : ${extension}
MIME Type                       : ${mimeType}
`;
      const metadata = result.content.matchAll(/<cyber:([A-Za-z][\w-]*)>([^<]*)<\/cyber:\1>/g);
      for (const [, tag, value] of metadata) {
        const label = tag.replace(/([a-z])([A-Z])/g, '$1 $2');
        output += `${label.padEnd(32)} : ${value.trim()}\n`;
      }
      return { exitCode: 0, stdout: output };
    }
  });

  // strings
  registry.register({
    name: 'strings',
    category: '10. Digital Forensics',
    description: 'Print the sequences of printable characters in files',
    syntax: 'strings [-n length] <file>',
    options: ['-n <number> (minimum string length, default 4)'],
    practicalUse: 'Extract hardcoded credentials, IP addresses, URLs, and flag tokens from compiled binaries.',
    example: 'strings /usr/bin/find | head -n 10',
    expectedOutput: '/lib64/ld-linux-x86-64.so.2\nlibc.so.6\n__cxa_finalize',
    execute: (args, ctx) => {
      const file = args.find(a => !a.startsWith('-')) || '/usr/bin/find';
      const res = vfs.readFile(file, ctx.cwd, ctx.user);
      if (!res.success) {
        return {
          exitCode: 0,
          stdout: `/lib64/ld-linux-x86-64.so.2\nlibc.so.6\n__cxa_finalize\n__printf_chk\nGLIBC_2.34\nUsage: find [path] [expression]\nCyberLinux Educational SUID Target\n`
        };
      }
      return { exitCode: 0, stdout: res.content.slice(0, 500) + '\n' };
    }
  });


  // ==========================================
  // 11. PRIVILEGE ESCALATION ENUMERATION
  // ==========================================

  // linpeas
  registry.register({
    name: 'linpeas',
    aliases: ['LinPEAS', 'linpeas.sh'],
    category: '11. Privilege Escalation',
    description: 'Linux Privilege Escalation Awesome Script (.sh)',
    syntax: 'linpeas',
    options: ['-s (silent mode)', '-q (quick mode)'],
    practicalUse: 'Automated enumeration tool that searches for possible paths to escalate privileges on Linux hosts.',
    example: 'linpeas',
    expectedOutput: '════════════════════════════════════╣ Check SUID Files ╠════════════════════════════════════\n-rwsr-xr-x 1 root root /usr/bin/find ---> Possible SUID Escalation via find -exec!',
    isSimulation: true,
    execute: (args, ctx) => {
      const sudoSummary = users.canSudo(ctx.user.name)
        ? `[!] User ${ctx.user.name} has NOPASSWD sudo access:\n    ${ctx.user.name} ALL=(ALL) NOPASSWD: ALL`
        : `[!] User ${ctx.user.name} is not allowed to run sudo`;
      const out = `
                            Linux Privilege Escalation Awesome Script (${SYSTEM_INFO.osName} Edition)
               
╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        SYSTEM INFORMATION                                      ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝
[+] Linux Kernel: 6.8.0-cyber-generic (x86_64)
[+] Distribution: ${SYSTEM_INFO.osName}
[+] Hostname: ${network.hostname}
[+] Current User: ${ctx.user.name} (uid=${ctx.user.uid})

╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        SUDO PRIVILEGES                                         ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝
${sudoSummary}

╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                 INTERESTING SUID BINARIES                                      ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝
[+] Inspecting SUID executables...
[!] VULNERABLE SUID BINARY FOUND:
    -rwsr-xr-x 1 root root /usr/bin/find
    --> GTFOBins exploit vector:
        /usr/bin/find . -exec /bin/sh -p \\; -quit
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // 12. CONTAINERS AND CLOUD
  // ==========================================

  // docker
  registry.register({
    name: 'docker',
    category: '12. Containers and Cloud',
    description: 'Docker image and container command line interface',
    syntax: 'docker [ps|run|images|exec]',
    options: ['ps (list containers)', 'images (list images)', 'exec (run in container)'],
    practicalUse: 'Audit container breakout privileges (e.g. docker group or mounted docker.sock socket).',
    example: 'docker ps',
    expectedOutput: 'CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS\n9b12a84ef210   vulnlab/web:latest    "docker-entrypoint.s…"   2 hours ago     Up 2 hours',
    isSimulation: true,
    execute: (args) => {
      const sub = args[0] || 'ps';
      if (sub === 'ps') {
        const out = `CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS                  NAMES
9b12a84ef210   vulnlab/web:latest    "docker-entrypoint.s…"   2 hours ago     Up 2 hours     0.0.0.0:80->80/tcp     web_frontend
a18420b9ca12   vulnlab/db:5.7        "docker-entrypoint.s…"   2 hours ago     Up 2 hours     3306/tcp               mysql_backend
`;
        return { exitCode: 0, stdout: out };
      }
      return { exitCode: 0, stdout: 'Docker version 24.0.7, build afdd53b (Simulated)\n' };
    }
  });

  // kubectl
  registry.register({
    name: 'kubectl',
    category: '12. Containers and Cloud',
    description: 'Kubernetes command-line tool',
    syntax: 'kubectl [get|describe|logs|exec]',
    options: ['get pods (list pods)', 'get secrets (audit secrets)'],
    practicalUse: 'Audit Kubernetes clusters, pods, service accounts, and RBAC policies.',
    example: 'kubectl get pods',
    expectedOutput: 'NAME                                READY   STATUS    RESTARTS   AGE\nnginx-deployment-7798b68b75-4b5m8   1/1     Running   0          42m',
    isSimulation: true,
    execute: () => {
      const out = `NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-7798b68b75-4b5m8   1/1     Running   0          42m
api-gateway-54f964c489-x8j21        1/1     Running   0          42m
`;
      return { exitCode: 0, stdout: out };
    }
  });

  // Register all additional extended commands from the syllabus
  registerExtendedCommands(registry, vfs, users, processes, network);

}

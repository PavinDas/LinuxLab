import { PathValidator } from '../security/path-validator.js';
import { VirtualPermissions } from '../core/virtual-permissions.js';
import { SYSTEM_INFO } from '../core/system-info.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * Extended Command Catalog
 * Completes the comprehensive syllabus reference covering all 16 categories
 * and 200+ Linux & Cybersecurity commands.
 *
 * @param {CommandRegistry} registry 
 * @param {VirtualFileSystem} vfs 
 * @param {VirtualUsers} users 
 * @param {VirtualProcesses} processes 
 * @param {VirtualNetwork} network 
 */
export function registerExtendedCommands(registry, vfs, users, processes, network) {

  // ==========================================
  // SECTION 1.1 & 1.2: ADDITIONAL FUNDAMENTALS
  // ==========================================

  registry.register({
    name: 'type',
    category: '1. Linux Fundamentals',
    description: 'Display information about command type (builtin, alias, or file)',
    syntax: 'type command',
    options: ['-a (display all locations)', '-t (output single word type)'],
    practicalUse: 'Determine if a command is a shell builtin or an external binary.',
    example: 'type cd',
    expectedOutput: 'cd is a shell builtin',
    execute: (args) => {
      const target = args.find(a => !a.startsWith('-')) || 'bash';
      const builtins = ['cd', 'echo', 'pwd', 'exit', 'export', 'alias', 'unalias', 'type', 'help', 'history', 'set', 'unset'];
      if (builtins.includes(target)) {
        return { exitCode: 0, stdout: `${target} is a shell builtin\n` };
      }
      const cmd = registry.get(target);
      if (cmd) {
        return { exitCode: 0, stdout: `${target} is /usr/bin/${target}\n` };
      }
      return { exitCode: 1, stderr: `type: ${target}: not found\n` };
    }
  });

  registry.register({
    name: 'whatis',
    category: '1. Linux Fundamentals',
    description: 'Display one-line manual page descriptions',
    syntax: 'whatis command',
    options: [],
    practicalUse: 'Quickly recall what an unfamiliar utility or security tool does.',
    example: 'whatis nmap',
    expectedOutput: 'nmap (1) - Network exploration tool and security / port scanner',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'whatis: missing command argument\n' };
      const cmd = registry.get(args[0]);
      if (cmd) return { exitCode: 0, stdout: `${cmd.name} (1) - ${cmd.description}\n` };
      return { exitCode: 1, stderr: `${args[0]}: nothing appropriate.\n` };
    }
  });

  registry.register({
    name: 'apropos',
    category: '1. Linux Fundamentals',
    description: 'Search the manual page names and descriptions for a keyword',
    syntax: 'apropos keyword',
    options: [],
    practicalUse: 'Find commands related to a topic when you do not remember the command name.',
    example: 'apropos "port scan"',
    expectedOutput: 'nmap (1) - Network exploration tool and security / port scanner\nmasscan (1) - Fast TCP port scanner',
    execute: (args) => {
      const q = (args[0] || '').toLowerCase();
      const matches = registry.getAll().filter(c => c.name.includes(q) || c.description.toLowerCase().includes(q));
      if (matches.length === 0) return { exitCode: 1, stderr: `${args[0]}: nothing appropriate.\n` };
      const lines = matches.slice(0, 8).map(m => `${m.name.padEnd(16, ' ')} (1) - ${m.description}`);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'printf',
    category: '1. Linux Fundamentals',
    description: 'Format and print data',
    syntax: 'printf format [arguments...]',
    options: [],
    practicalUse: 'Reliable string formatting in shell scripts and payload generation.',
    example: `printf "User: %s\\nUID: %d\\n" ${SYSTEM_INFO.username} 1000`,
    expectedOutput: `User: ${SYSTEM_INFO.username}\nUID: 1000`,
    execute: (args) => {
      if (args.length === 0) return { exitCode: 0, stdout: '' };
      let fmt = args[0].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      const valArgs = args.slice(1);
      let idx = 0;
      fmt = fmt.replace(/%s|%d/g, () => valArgs[idx++] !== undefined ? valArgs[idx - 1] : '');
      return { exitCode: 0, stdout: fmt };
    }
  });

  registry.register({
    name: 'sleep',
    category: '1. Linux Fundamentals',
    description: 'Delay for a specified amount of time',
    syntax: 'sleep seconds',
    options: [],
    practicalUse: 'Rate limiting in reconnaissance loops and timing-based vulnerability validation (blind SQLi).',
    example: 'sleep 2',
    expectedOutput: '',
    execute: async (args) => {
      const secs = Math.min(3, parseFloat(args[0]) || 1);
      await new Promise(r => setTimeout(r, secs * 1000));
      return { exitCode: 0, stdout: '' };
    }
  });

  registry.register({
    name: 'tty',
    category: '1. Linux Fundamentals',
    description: 'Print the file name of the terminal connected to standard input',
    syntax: 'tty',
    options: ['-s (silent, return an exit status only)'],
    practicalUse: 'Verify if you have a full interactive TTY or a dumb reverse shell.',
    example: 'tty',
    expectedOutput: '/dev/pts/0',
    execute: () => ({ exitCode: 0, stdout: '/dev/pts/0\n' })
  });

  registry.register({
    name: 'basename',
    category: '1. Linux Fundamentals',
    description: 'Strip directory and suffix from filenames',
    syntax: 'basename path [suffix]',
    options: [],
    practicalUse: 'Extract filename component in file processing scripts.',
    example: 'basename /var/log/auth.log',
    expectedOutput: 'auth.log',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'basename: missing operand\n' };
      const { basename } = PathValidator.split(args[0]);
      return { exitCode: 0, stdout: `${basename}\n` };
    }
  });

  registry.register({
    name: 'dirname',
    category: '1. Linux Fundamentals',
    description: 'Strip last component from file name',
    syntax: 'dirname path',
    options: [],
    practicalUse: 'Extract directory path in scripts.',
    example: 'dirname /var/log/auth.log',
    expectedOutput: '/var/log',
    execute: (args) => {
      if (!args[0]) return { exitCode: 1, stderr: 'dirname: missing operand\n' };
      const { dirname } = PathValidator.split(args[0]);
      return { exitCode: 0, stdout: `${dirname}\n` };
    }
  });

  registry.register({
    name: 'realpath',
    aliases: ['readlink'],
    category: '1. Linux Fundamentals',
    description: 'Print the resolved absolute path',
    syntax: 'realpath path',
    options: [],
    practicalUse: 'Resolve symbolic links and relative sequences into absolute paths.',
    example: 'realpath ~/Desktop/../Documents',
    expectedOutput: '/home/student/Documents',
    execute: (args, ctx) => {
      const target = args[0] || ctx.cwd;
      const norm = PathValidator.normalize(target, ctx.cwd, ctx.user.home);
      return { exitCode: 0, stdout: `${norm}\n` };
    }
  });

  registry.register({
    name: 'ln',
    category: '1. Linux Fundamentals',
    description: 'Make links between files',
    syntax: 'ln -s target link_name',
    options: ['-s (make symbolic links instead of hard links)', '-f (force)'],
    practicalUse: 'Create symbolic link shortcuts or link exploit binaries into $PATH.',
    example: 'ln -s /var/log/auth.log ~/auth_symlink',
    expectedOutput: '',
    execute: (args, ctx) => {
      const clean = args.filter(a => !a.startsWith('-'));
      if (clean.length < 2) return { exitCode: 1, stderr: 'ln: missing operand\n' };
      const [target, linkName] = clean;
      const res = vfs.writeFile(linkName, `[symlink -> ${target}]`, ctx.cwd, ctx.user);
      if (!res.success) return { exitCode: 1, stderr: `ln: ${res.error}\n` };
      return { exitCode: 0 };
    }
  });

  registry.register({
    name: 'locate',
    aliases: ['updatedb'],
    category: '1. Linux Fundamentals',
    description: 'Find files by name using indexed database',
    syntax: 'locate pattern',
    options: ['-i (ignore case)'],
    practicalUse: 'Instantly search the entire filesystem for binaries, configs, or wordlists.',
    example: 'locate rockyou.txt',
    expectedOutput: '/usr/share/wordlists/rockyou.txt',
    execute: (args) => {
      const query = (args[0] || '').toLowerCase();
      if (query.includes('rockyou') || query.includes('wordlist')) {
        return { exitCode: 0, stdout: '/usr/share/wordlists/rockyou.txt\n/home/student/Documents/wordlist.txt\n' };
      }
      return { exitCode: 0, stdout: `/etc/passwd\n/var/log/auth.log\n/usr/bin/nmap\n` };
    }
  });

  registry.register({
    name: 'tac',
    category: '1. Linux Fundamentals',
    description: 'Concatenate and print files in reverse line order',
    syntax: 'tac [file...]',
    options: [],
    practicalUse: 'Inspect log entries starting with the newest events at the bottom.',
    example: 'tac /var/log/auth.log | head -n 5',
    expectedOutput: '[Reversed lines of file]',
    execute: (args, ctx) => {
      const f = args.find(a => !a.startsWith('-'));
      let text = ctx.stdin || '';
      if (f) {
        const res = vfs.readFile(f, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `tac: ${f}: ${res.error}\n` };
        text = res.content;
      }
      const lines = text.split('\n').filter(Boolean).reverse();
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'less',
    aliases: ['more'],
    category: '1. Linux Fundamentals',
    description: 'Opposite of more: interactive file content pager',
    syntax: 'less file',
    options: ['-N (line numbers)'],
    practicalUse: 'Scroll through large logs and capture files without crashing the terminal buffer.',
    example: 'less /var/log/syslog',
    expectedOutput: '[Interactive scrollable view of file]',
    execute: (args, ctx) => {
      const f = args.find(a => !a.startsWith('-'));
      let text = ctx.stdin || '';
      if (f) {
        const res = vfs.readFile(f, ctx.cwd, ctx.user);
        if (!res.success) return { exitCode: 1, stderr: `less: ${f}: ${res.error}\n` };
        text = res.content;
      }
      return { exitCode: 0, stdout: text.slice(0, 2000) + (text.length > 2000 ? '\n\n--More-- (Press q to quit)' : '') + '\n' };
    }
  });

  const handleEditorLaunch = (args, ctx, editorName) => {
    const file = args.find(a => !a.startsWith('-'));
    const norm = file ? PathValidator.normalize(file, ctx.cwd, ctx.user.home) : undefined;
    sysEvents.emit('app:launch', { id: 'text-editor', options: { path: norm } });
    return {
      exitCode: 0,
      stdout: `[Opening ${norm || 'untitled'} in Text Editor (${editorName})...]\n`
    };
  };

  registry.register({
    name: 'nano',
    aliases: ['vim', 'vi', 'nvim'],
    category: '1. Linux Fundamentals',
    description: 'Text editor (GUI)',
    syntax: 'nano [file]',
    options: [],
    practicalUse: 'Edit scripts, modify configuration files, and craft text in the GUI Text Editor.',
    example: 'nano script.sh',
    expectedOutput: '[Opened file in Text Editor]',
    execute: (args, ctx) => handleEditorLaunch(args, ctx, 'nano')
  });

  registry.register({
    name: 'vim',
    aliases: ['vi'],
    category: '1. Linux Fundamentals',
    description: 'Vim text editor (GUI)',
    syntax: 'vim [file]',
    options: [],
    practicalUse: 'Edit documents and scripts in the GUI Text Editor.',
    example: 'vim script.py',
    expectedOutput: '[Opened file in Text Editor]',
    execute: (args, ctx) => handleEditorLaunch(args, ctx, 'vim')
  });

  registry.register({
    name: 'nvim',
    category: '1. Linux Fundamentals',
    description: 'Neovim text editor (GUI)',
    syntax: 'nvim [file]',
    options: [],
    practicalUse: 'Edit documents and scripts in the GUI Text Editor.',
    example: 'nvim main.rs',
    expectedOutput: '[Opened file in Text Editor]',
    execute: (args, ctx) => handleEditorLaunch(args, ctx, 'nvim')
  });

  registry.register({
    name: 'feh',
    aliases: ['eog', 'display', 'viewnior'],
    category: '1. Linux Fundamentals',
    description: 'Image viewer (GUI)',
    syntax: 'feh <image-path>',
    options: [],
    practicalUse: 'Display pictures and graphical assets in the GUI Image Viewer.',
    example: 'feh ~/Pictures/mascot.svg',
    expectedOutput: '[Opened image in Image Viewer]',
    execute: (args, ctx) => {
      const file = args.find(a => !a.startsWith('-'));
      if (!file) {
        return { exitCode: 1, stderr: 'feh: no image file specified\n' };
      }
      const norm = PathValidator.normalize(file, ctx.cwd, ctx.user.home);
      sysEvents.emit('app:launch', { id: 'image-viewer', options: { path: norm } });
      return {
        exitCode: 0,
        stdout: `[Opening ${norm} in Image Viewer...]\n`
      };
    }
  });

  registry.register({
    name: 'diff',
    aliases: ['cmp', 'comm'],
    category: '1. Linux Fundamentals',
    description: 'Compare files line by line',
    syntax: 'diff file1 file2',
    options: ['-u (unified format)', '-i (ignore case)'],
    practicalUse: 'Compare configurations before and after modification, or verify exploit patches.',
    example: 'diff file1.txt file2.txt',
    expectedOutput: '1c1\n< version=1.0\n---\n> version=2.0',
    execute: (args, ctx) => {
      const files = args.filter(a => !a.startsWith('-'));
      if (files.length < 2) return { exitCode: 1, stderr: 'diff: missing operand\n' };
      const res1 = vfs.readFile(files[0], ctx.cwd, ctx.user);
      const res2 = vfs.readFile(files[1], ctx.cwd, ctx.user);
      if (!res1.success) return { exitCode: 1, stderr: `diff: ${files[0]}: ${res1.error}\n` };
      if (!res2.success) return { exitCode: 1, stderr: `diff: ${files[1]}: ${res2.error}\n` };
      if (res1.content === res2.content) return { exitCode: 0, stdout: '' };
      return { exitCode: 1, stdout: `--- ${files[0]}\n+++ ${files[1]}\n@@ -1 +1 @@\n-${res1.content.slice(0, 40)}\n+${res2.content.slice(0, 40)}\n` };
    }
  });

  registry.register({
    name: 'tr',
    category: '1. Linux Fundamentals',
    description: 'Translate, squeeze, and/or delete characters from standard input',
    syntax: 'cat text | tr [options] set1 [set2]',
    options: ['-d (delete characters in set1)', '-s (squeeze repeats)'],
    practicalUse: 'Convert uppercase to lowercase, strip carriage returns (DOS to UNIX), or sanitize strings.',
    example: "echo 'HELLO' | tr 'A-Z' 'a-z'",
    expectedOutput: 'hello',
    execute: (args, ctx) => {
      const text = ctx.stdin || '';
      if (args[0] === "'A-Z'" || args[0] === 'A-Z') {
        return { exitCode: 0, stdout: text.toLowerCase() };
      }
      if (args[0] === "'a-z'" || args[0] === 'a-z') {
        return { exitCode: 0, stdout: text.toUpperCase() };
      }
      if (args[0] === '-d') {
        const char = args[1] || '';
        return { exitCode: 0, stdout: text.split(char).join('') };
      }
      return { exitCode: 0, stdout: text };
    }
  });

  registry.register({
    name: 'rev',
    category: '1. Linux Fundamentals',
    description: 'Reverse lines characterwise',
    syntax: 'rev [file]',
    options: [],
    practicalUse: 'Reverse strings or CTF reverse engineering challenges.',
    example: "echo 'cyber' | rev",
    expectedOutput: 'rebyc',
    execute: (args, ctx) => {
      const text = ctx.stdin || (args[0] ? args[0] : '');
      const revStr = text.split('').reverse().join('');
      return { exitCode: 0, stdout: revStr + (revStr.endsWith('\n') ? '' : '\n') };
    }
  });

  registry.register({
    name: 'tee',
    category: '1. Linux Fundamentals',
    description: 'Read from standard input and write to standard output and files',
    syntax: 'command | tee [-a] file',
    options: ['-a (append to the given file)'],
    practicalUse: 'Capture terminal output into a log file while simultaneously viewing it in the terminal.',
    example: 'echo "scan result" | tee scan.log',
    expectedOutput: 'scan result',
    execute: (args, ctx) => {
      const append = args.includes('-a');
      const files = args.filter(a => !a.startsWith('-'));
      const text = ctx.stdin || '';
      for (const f of files) {
        vfs.writeFile(f, text, ctx.cwd, ctx.user, append);
      }
      return { exitCode: 0, stdout: text };
    }
  });


  // ==========================================
  // SECTION 2: USERS, GROUPS AND PERMISSIONS
  // ==========================================

  registry.register({
    name: 'umask',
    category: '2. Users and Permissions',
    description: 'Get or set the file mode creation mask',
    syntax: 'umask [-S] [mode]',
    options: ['-S (symbolic mode output)'],
    practicalUse: 'Determine the default permissions applied to newly created files and directories.',
    example: 'umask',
    expectedOutput: '0022',
    execute: (args) => {
      if (args.includes('-S')) return { exitCode: 0, stdout: 'u=rwx,g=rx,o=rx\n' };
      return { exitCode: 0, stdout: '0022\n' };
    }
  });

  registry.register({
    name: 'getfacl',
    aliases: ['setfacl'],
    category: '2. Users and Permissions',
    description: 'Get or set file access control lists (ACLs)',
    syntax: 'getfacl file',
    options: [],
    practicalUse: 'Enumerate fine-grained ACL permissions that override standard POSIX permissions.',
    example: 'getfacl /etc/passwd',
    expectedOutput: '# file: /etc/passwd\n# owner: root\n# group: root\nuser::rw-\ngroup::r--\nother::r--',
    execute: (args, ctx) => {
      const f = args[0] || '/etc/passwd';
      const node = vfs.getNode(f, ctx.cwd, ctx.user.home);
      if (!node) return { exitCode: 1, stderr: `getfacl: ${f}: No such file or directory\n` };
      const out = `# file: ${f}\n# owner: ${node.owner}\n# group: ${node.group}\nuser::rw-\ngroup::r--\nother::r--\n`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'getcap',
    aliases: ['setcap'],
    category: '2. Users and Permissions',
    description: 'Examine or set file capabilities',
    syntax: 'getcap [-r] [path]',
    options: ['-r (recursive capability audit)'],
    practicalUse: 'Search for binaries endowed with Linux capabilities (like cap_setuid, cap_net_raw) for privilege escalation.',
    example: 'getcap -r / 2>/dev/null',
    expectedOutput: '/usr/bin/ping cap_net_raw+ep\n/usr/bin/python3 cap_setuid+ep',
    execute: (args) => {
      const out = `/usr/bin/ping cap_net_raw+ep\n/usr/bin/mtr-packet cap_net_raw+ep\n`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'useradd',
    aliases: ['adduser'],
    category: '2. Users and Permissions',
    description: 'Create a new user or update default new user information',
    syntax: 'sudo useradd [-m] [-s shell] username',
    options: ['-m (create home directory)', '-s (login shell)'],
    practicalUse: 'Create backdoor or administrative accounts during post-exploitation exercises.',
    example: 'sudo useradd -m -s /bin/bash hacker',
    expectedOutput: '',
    execute: (args, ctx) => {
      const name = args.find(a => !a.startsWith('-'));
      if (!name) return { exitCode: 1, stderr: 'useradd: missing username\n' };
      if (!users.isRoot() && ctx.user.uid !== 0) return { exitCode: 1, stderr: 'useradd: Permission denied (must be root)\n' };
      const res = users.addUser(name);
      if (!res.success) return { exitCode: 1, stderr: `useradd: ${res.error}\n` };
      vfs.createDirectory(`/home/${name}`, '/', ctx.user);
      return { exitCode: 0, stdout: `User '${name}' created successfully.\n` };
    }
  });

  registry.register({
    name: 'userdel',
    category: '2. Users and Permissions',
    description: 'Delete a user account and related files',
    syntax: 'sudo userdel [-r] username',
    options: ['-r (remove home directory)'],
    practicalUse: 'Remove user accounts during cleanup operations.',
    example: 'sudo userdel testuser',
    expectedOutput: '',
    execute: (args, ctx) => {
      const name = args.find(a => !a.startsWith('-'));
      if (!name) return { exitCode: 1, stderr: 'userdel: missing username\n' };
      if (!users.isRoot() && ctx.user.uid !== 0) return { exitCode: 1, stderr: 'userdel: Permission denied (must be root)\n' };
      const res = users.deleteUser(name);
      if (!res.success) return { exitCode: 1, stderr: `userdel: ${res.error}\n` };
      return { exitCode: 0, stdout: `User '${name}' deleted.\n` };
    }
  });

  registry.register({
    name: 'passwd',
    category: '2. Users and Permissions',
    description: 'Change user password',
    syntax: 'passwd [username]',
    options: [],
    practicalUse: 'Change passwords and simulate credential resetting.',
    example: 'passwd',
    expectedOutput: 'New password: \nRetype new password: \npasswd: password updated successfully',
    execute: () => ({ exitCode: 0, stdout: 'passwd: password updated successfully\n' })
  });

  registry.register({
    name: 'groups',
    category: '2. Users and Permissions',
    description: 'Print the groups a user is in',
    syntax: 'groups [username]',
    options: [],
    practicalUse: 'Inspect group memberships for privilege escalation vectors (e.g. docker, lxd, disk, adm).',
    example: 'groups student',
    expectedOutput: 'student : student adm sudo netdev',
    execute: (args, ctx) => {
      const target = args[0] ? users.getUser(args[0]) : ctx.user;
      if (!target) return { exitCode: 1, stderr: `groups: '${args[0]}': no such user\n` };
      return { exitCode: 0, stdout: `${target.name} : ${(target.groups || []).join(' ')}\n` };
    }
  });

  registry.register({
    name: 'who',
    aliases: ['w'],
    category: '2. Users and Permissions',
    description: 'Show who is logged on and what they are doing',
    syntax: 'who',
    options: [],
    practicalUse: 'Determine active sessions and users on multi-tenant servers.',
    example: 'who',
    expectedOutput: `${SYSTEM_INFO.username}  pts/0        2026-11-17 08:15 (192.168.1.50)`,
    execute: (args, ctx) => ({
      exitCode: 0,
      stdout: `${ctx.user.name}  pts/0        2026-11-17 08:15 (192.168.1.50)\n`
    })
  });

  registry.register({
    name: 'last',
    aliases: ['lastlog', 'lastb'],
    category: '2. Users and Permissions',
    description: 'Show a listing of last logged in users and failed logins',
    syntax: 'last [-n num]',
    options: ['-n <num> (number of lines to show)'],
    practicalUse: 'Incident response log investigation to trace compromised login sessions.',
    example: 'last -n 3',
    expectedOutput: 'student  pts/0        192.168.1.50     Tue Nov 17 08:15   still logged in\nreboot   system boot  6.8.0-cyber-gene Tue Nov 17 08:00   still running',
    execute: () => {
      const out = `student  pts/0        192.168.1.50     Tue Nov 17 08:15   still logged in
reboot   system boot  6.8.0-cyber-gene Tue Nov 17 08:00   still running

wtmp begins Tue Nov 17 08:00:00 2026
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 3: SYSTEM INFO & EXTENDED PROCESS
  // ==========================================

  registry.register({
    name: 'pgrep',
    aliases: ['pidof'],
    category: '3. Process Management',
    description: 'Look up processes based on name and other attributes',
    syntax: 'pgrep [-l] pattern',
    options: ['-l (list name as well as PID)', '-u (filter by user)'],
    practicalUse: 'Locate process IDs matching targets (e.g. sshd, apache2, python3).',
    example: 'pgrep -l sshd',
    expectedOutput: '1240 sshd',
    execute: (args) => {
      const target = args.find(a => !a.startsWith('-')) || 'sshd';
      const procs = processes.list().filter(p => p.command.includes(target));
      if (procs.length === 0) return { exitCode: 1, stdout: '' };
      const lines = procs.map(p => `${p.pid} ${p.command.split(' ')[0]}`);
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'pstree',
    category: '3. Process Management',
    description: 'Display a tree of processes',
    syntax: 'pstree [-p]',
    options: ['-p (show PIDs)'],
    practicalUse: 'Visualize process hierarchies to spot spawned shells or reverse shell chains.',
    example: 'pstree -p',
    expectedOutput: 'systemd(1)─┬─cron(620)\n           ├─sshd(1240)───sshd(1402)───bash(1520)',
    execute: () => {
      const out = `systemd(1)─┬─NetworkManager(680)
           ├─cron(620)
           ├─dbus-daemon(710)
           ├─gnome-shell(1450)
           ├─sshd(1240)───bash(1520)
           └─systemd-journal(380)
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'lsof',
    aliases: ['fuser'],
    category: '3. Process Management',
    description: 'List open files and network connections',
    syntax: 'lsof [-i]',
    options: ['-i (list IP sockets)', '-p <pid> (list files for process)'],
    practicalUse: 'Discover hidden listening ports, opened log files, and active network connections.',
    example: 'lsof -i',
    expectedOutput: 'COMMAND    PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nsshd      1240 root    3u  IPv4  42100      0t0  TCP *:22 (LISTEN)',
    execute: (args, ctx) => {
      const out = `COMMAND    PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
systemd      1 root  cwd    DIR    8,1     4096    2 /
sshd      1240 root    3u  IPv4  14210      0t0  TCP *:22 (LISTEN)
nginx     1100 root    6u  IPv4  18200      0t0  TCP *:80 (LISTEN)
bash      1520 ${ctx.user.name} 0u   CHR  136,0      0t0    3 /dev/pts/0
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'vmstat',
    aliases: ['iostat', 'mpstat', 'sar'],
    category: '3. Process Management',
    description: 'Report virtual memory, process, and CPU statistics',
    syntax: 'vmstat [delay [count]]',
    options: [],
    practicalUse: 'System health monitoring and baseline performance measurement.',
    example: 'vmstat 1 2',
    expectedOutput: 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0      0 2482100  42100 524100    0    0     1    12   42  110  2  1 97  0  0',
    execute: () => {
      const out = `procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 2482100  42100 524100    0    0     1    12   42  110  2  1 97  0  0
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'lsblk',
    category: '3. Process Management',
    description: 'List information about all available block devices',
    syntax: 'lsblk [-f]',
    options: ['-f (output filesystem information)'],
    practicalUse: 'Audit partition layouts, unmounted drives, and potential forensic targets.',
    example: 'lsblk',
    expectedOutput: `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0  ${SYSTEM_INFO.storageGB}G  0 disk`,
    execute: () => {
      const out = `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0  ${SYSTEM_INFO.storageGB}G  0 disk
├─sda1   8:1    0   64G  0 part /
└─sda2   8:2    0  ${SYSTEM_INFO.storageGB - 64}G  0 part /home
sr0     11:0    1 1024M  0 rom  
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'lspci',
    aliases: ['lsusb', 'lshw', 'dmidecode'],
    category: '3. Process Management',
    description: 'List all PCI / USB / hardware devices',
    syntax: 'lspci',
    options: ['-v (verbose)'],
    practicalUse: 'Hardware enumeration to detect virtualization environments and hypervisors.',
    example: 'lspci',
    expectedOutput: '00:00.0 Host bridge: Intel Corporation 440BX/ZX/DX - 82443BX/ZX/DX\n00:01.0 PCI bridge: Intel Corporation 440BX/ZX/DX',
    execute: () => {
      const out = `00:00.0 Host bridge: Intel Corporation 440BX/ZX/DX - 82443BX/ZX/DX
00:01.0 PCI bridge: Intel Corporation 440BX/ZX/DX
00:02.0 VGA compatible controller: VMware SVGA II Adapter
00:03.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller
00:04.0 System peripheral: InnoTek System VirtualBox Guest Service
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'sysctl',
    category: '3. Process Management',
    description: 'Configure kernel parameters at runtime',
    syntax: 'sysctl [-a] [variable]',
    options: ['-a (display all variables currently available)'],
    practicalUse: 'Audit kernel security settings: ASLR (kernel.randomize_va_space), IP forwarding, dmesg restrictions.',
    example: 'sysctl kernel.randomize_va_space',
    expectedOutput: 'kernel.randomize_va_space = 2',
    execute: (args) => {
      const target = args[0] || 'kernel.randomize_va_space';
      if (target === '-a') {
        return { exitCode: 0, stdout: `kernel.randomize_va_space = 2\nnet.ipv4.ip_forward = 1\nkernel.dmesg_restrict = 0\nfs.protected_symlinks = 1\n` };
      }
      return { exitCode: 0, stdout: `${target} = 2\n` };
    }
  });

  registry.register({
    name: 'watch',
    category: '3. Process Management',
    description: 'Execute a program periodically, showing output fullscreen',
    syntax: "watch -n seconds 'command'",
    options: ['-n <sec> (interval)'],
    practicalUse: 'Continuously observe changing directories, active connections, or processes.',
    example: "watch -n 2 'ps aux | grep nc'",
    expectedOutput: '[Simulated watch loop: Press Ctrl+C to exit]',
    execute: (args) => ({ exitCode: 0, stdout: `[Every 2.0s: ${args.join(' ') || 'ps aux'}]\nRunning watch simulation. Press Ctrl+C to stop.\n` })
  });


  // ==========================================
  // SECTION 4: NETWORKING & DNS (EXTENDED)
  // ==========================================

  registry.register({
    name: 'traceroute',
    aliases: ['tracepath', 'mtr'],
    category: '4. Networking and DNS',
    description: 'Print the route packets trace to network host',
    syntax: 'traceroute host',
    options: ['-n (do not resolve IP addresses to hostnames)'],
    practicalUse: 'Map network topology, gateways, and identify firewalls or transit hops.',
    example: 'traceroute 192.168.1.10',
    expectedOutput: 'traceroute to 192.168.1.10 (192.168.1.10), 30 hops max, 60 byte packets\n 1  gateway.local (192.168.1.1)  0.841 ms\n 2  lab.cyberlinux.local (192.168.1.10)  1.214 ms',
    execute: (args) => {
      const host = args.find(a => !a.startsWith('-')) || '192.168.1.10';
      const out = `traceroute to ${host} (${host}), 30 hops max, 60 byte packets
 1  gateway.local (192.168.1.1)  0.841 ms  0.712 ms  0.640 ms
 2  lab.cyberlinux.local (192.168.1.10)  1.214 ms  1.102 ms  1.088 ms
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'wget',
    category: '4. Networking and DNS',
    description: 'The non-interactive network downloader',
    syntax: 'wget [options] <url>',
    options: ['-O <file> (write documents to file)', '-q (quiet)'],
    practicalUse: 'Download exploit payloads, tools, and scripts directly onto the machine.',
    example: 'wget http://192.168.1.10/payload.sh',
    expectedOutput: '--2026-11-17 08:30:00--  http://192.168.1.10/payload.sh\nResolving 192.168.1.10... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 420 [text/x-sh]\nSaving to: ‘payload.sh’\n\npayload.sh          100%[===================>]     420  --.-KB/s    in 0s\n',
    execute: (args, ctx) => {
      const url = args.find(a => a.startsWith('http://') || a.startsWith('https://')) || 'http://192.168.1.10/payload.sh';
      const filename = url.split('/').pop() || 'download.txt';
      vfs.writeFile(filename, `#!/bin/bash\n# Downloaded from ${url}\necho "Sample downloaded utility"\n`, ctx.cwd, ctx.user);
      const out = `--2026-11-17 08:30:00--  ${url}
Connecting to 192.168.1.10:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 420 [text/plain]
Saving to: ‘${filename}’

${filename}          100%[===================>]     420  --.-KB/s    in 0s      

2026-11-17 08:30:01 (4.2 MB/s) - ‘${filename}’ saved [420/420]
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'tcpdump',
    aliases: ['tshark', 'dumpcap'],
    category: '4. Networking and DNS',
    description: 'Dump traffic on a network (packet analyzer)',
    syntax: 'sudo tcpdump [-i interface] [-n] [filter]',
    options: ['-i <iface> (interface)', '-n (don\'t convert addresses to names)', '-c <count> (packet count)', 'port 80 (filter)'],
    practicalUse: 'Capture cleartext credentials (FTP, HTTP, Telnet) and troubleshoot network issues.',
    example: 'sudo tcpdump -i eth0 -c 4',
    expectedOutput: '08:32:01.104210 IP 192.168.1.50.41220 > 192.168.1.10.80: Flags [S], seq 14210884, win 64240\n08:32:01.105120 IP 192.168.1.10.80 > 192.168.1.50.41220: Flags [S.], seq 8421088, ack 14210885',
    isSimulation: true,
    execute: () => {
      const out = `tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
08:32:01.104210 IP 192.168.1.50.41220 > 192.168.1.10.80: Flags [S], seq 14210884, win 64240, options [mss 1460], length 0
08:32:01.105120 IP 192.168.1.10.80 > 192.168.1.50.41220: Flags [S.], seq 8421088, ack 14210885, win 5792, length 0
08:32:01.105190 IP 192.168.1.50.41220 > 192.168.1.10.80: Flags [.], ack 1, win 64240, length 0
08:32:01.105410 IP 192.168.1.50.41220 > 192.168.1.10.80: Flags [P.], seq 1:85, ack 1: HTTP: GET / HTTP/1.1
4 packets captured
4 packets received by filter
0 packets dropped by kernel
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'dnsrecon',
    aliases: ['dnsenum', 'fierce', 'amass', 'subfinder'],
    category: '4. Networking and DNS',
    description: 'DNS reconnaissance and subdomain enumeration',
    syntax: 'subfinder -d domain.com',
    options: ['-d <domain> (target domain)'],
    practicalUse: 'Discover hidden subdomains and attack surfaces.',
    example: 'subfinder -d example.com',
    expectedOutput: 'mail.example.com\nadmin.example.com\ndev.example.com',
    isSimulation: true,
    execute: (args) => {
      const domain = args.find(a => !a.startsWith('-')) || 'example.com';
      const out = `[+] Subdomain Enumeration for ${domain}
mail.${domain}
admin.${domain}
dev.${domain}
vpn.${domain}
portal.${domain}
[+] Found 5 subdomains for ${domain}
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 7: CRYPTOGRAPHY & SECURITY
  // ==========================================

  registry.register({
    name: 'openssl',
    category: '7. Cryptography & Hashing',
    description: 'OpenSSL command line tool for cryptographic operations',
    syntax: 'openssl [rand|dgst|s_client|enc] [options]',
    options: ['rand -hex 16 (generate random bytes)', 'dgst -sha256 file (calculate hash)', 's_client -connect host:port (inspect TLS)'],
    practicalUse: 'TLS certificate inspection, encryption, decryption, and secure password generation.',
    example: 'openssl rand -hex 16',
    expectedOutput: 'a4b8c9d0e1f2435465768798091a2b3c',
    execute: (args) => {
      const sub = args[0] || 'version';
      if (sub === 'rand') {
        const bytes = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
        return { exitCode: 0, stdout: `${bytes.slice(0, 32)}\n` };
      }
      if (sub === 'version') {
        return { exitCode: 0, stdout: 'OpenSSL 3.0.2 15 Mar 2022 (Library: OpenSSL 3.0.2)\n' };
      }
      return { exitCode: 0, stdout: 'OpenSSL operational\n' };
    }
  });

  registry.register({
    name: 'ssh-keygen',
    category: '7. Cryptography & Hashing',
    description: 'Authentication key generation and management for SSH',
    syntax: 'ssh-keygen -t ed25519',
    options: ['-t <type> (dsa | ecdsa | ed25519 | rsa)', '-b <bits> (key length)'],
    practicalUse: 'Generate SSH private/public key pairs for passwordless remote access.',
    example: 'ssh-keygen -t ed25519',
    expectedOutput: `Generating public/private ed25519 key pair.\nYour identification has been saved in ${SYSTEM_INFO.home}/.ssh/id_ed25519`,
    execute: (args, ctx) => {
      const sshDirectory = `${ctx.user.home}/.ssh`;
      const privateKeyPath = `${sshDirectory}/id_ed25519`;
      const publicKeyPath = `${privateKeyPath}.pub`;
      vfs.createDirectory(sshDirectory, '/', ctx.user, { parents: true });
      vfs.writeFile(privateKeyPath, '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\n-----END OPENSSH PRIVATE KEY-----\n', '/', ctx.user);
      vfs.writeFile(publicKeyPath, `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleStudentKey ${ctx.user.name}@${network.hostname}\n`, '/', ctx.user);
      const out = `Generating public/private ed25519 key pair.
Your identification has been saved in ${privateKeyPath}
Your public key has been saved in ${publicKeyPath}
The key fingerprint is:
SHA256:7m14fGk9vY1pQ2rS4tU8wX0z ${ctx.user.name}@${network.hostname}
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'hashid',
    aliases: ['hash-identifier'],
    category: '7. Cryptography & Hashing',
    description: 'Identify the different types of hashes used to encrypt data',
    syntax: 'hashid hash_string',
    options: [],
    practicalUse: 'Determine hash algorithm (MD5, SHA256, NTLM, bcrypt) before launching password cracking.',
    example: 'hashid 5d41402abc4b2a76b9719d911017c592',
    expectedOutput: 'Analyzing 5d41402abc4b2a76b9719d911017c592\n[+] MD5\n[+] NTLM',
    execute: (args) => {
      const h = args[0] || '';
      let detected = 'MD5 / NTLM';
      if (h.length === 64) detected = 'SHA-256';
      else if (h.length === 40) detected = 'SHA-1';
      else if (h.startsWith('$6$')) detected = 'SHA-512 Crypt (Unix Shadow)';
      const out = `Analyzing '${h}'
[+] Possible Hash Types:
    - ${detected}
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 8: HARDENING & SECURITY AUDITING
  // ==========================================

  registry.register({
    name: 'iptables',
    aliases: ['nft', 'ip6tables'],
    category: '8. Security and Hardening',
    description: 'Administration tool for IPv4/IPv6 packet filtering and NAT',
    syntax: 'sudo iptables -L -n -v',
    options: ['-L (list rules)', '-n (numeric output)', '-F (flush rules)'],
    practicalUse: 'Audit raw packet filtering rules and NAT translation chains.',
    example: 'sudo iptables -L -n',
    expectedOutput: 'Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:22',
    execute: () => {
      const out = `Chain INPUT (policy ACCEPT 120 packets, 8420 bytes)
 pkts bytes target     prot opt in     out     source               destination         
   42  2410 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
   10   840 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80

Chain FORWARD (policy DROP 0 packets, 0 bytes)

Chain OUTPUT (policy ACCEPT 98 packets, 6210 bytes)
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'fail2ban-client',
    category: '8. Security and Hardening',
    description: 'Configure and monitor Fail2ban intrusion prevention system',
    syntax: 'sudo fail2ban-client status [jail]',
    options: ['status (view active jails)', 'status sshd (view banned IPs)'],
    practicalUse: 'Inspect automated IP blocking rules against brute-force attacks.',
    example: 'sudo fail2ban-client status sshd',
    expectedOutput: 'Status for the jail: sshd\n|- Filter: Currently failed: 2\n`- Actions: Currently banned: 1\n   `- Banned IP list:\t192.168.1.105',
    execute: () => {
      const out = `Status for the jail: sshd
|- Filter
|  |- Currently failed: 2
|  |- Total failed:     8
|  \`- File list:        /var/log/auth.log
\`- Actions
   |- Currently banned: 1
   |- Total banned:     1
   \`- Banned IP list:   192.168.1.105
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'aa-status',
    aliases: ['apparmor_status'],
    category: '8. Security and Hardening',
    description: 'Display the status of AppArmor profiles',
    syntax: 'sudo aa-status',
    options: ['--enabled (check if AppArmor is enabled)'],
    practicalUse: 'Check mandatory access control confinement for daemons like ping, tcpdump, or apache.',
    example: 'sudo aa-status',
    expectedOutput: 'apparmor module is loaded.\n14 profiles are loaded.\n14 profiles are in enforce mode.\n   /usr/bin/tcpdump\n   /usr/sbin/sshd',
    execute: () => {
      const out = `apparmor module is loaded.
14 profiles are loaded.
14 profiles are in enforce mode.
   /usr/bin/tcpdump
   /usr/sbin/sshd
   /usr/bin/ping
0 profiles are in complain mode.
0 processes are unconfined but have a profile defined.
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'chkrootkit',
    aliases: ['rkhunter', 'unhide'],
    category: '8. Security and Hardening',
    description: 'Locally checks for signs of a rootkit',
    syntax: 'sudo chkrootkit',
    options: ['-q (quiet, show only infected results)'],
    practicalUse: 'Scan system binaries and kernel tables for hidden processes, trojaned system files, and rootkits.',
    example: 'sudo chkrootkit',
    expectedOutput: 'ROOTDIR is `/\'\nChecking `ps\'... not infected\nChecking `ls\'... not infected',
    execute: () => {
      const out = `ROOTDIR is '/'
Checking 'amd'... not found
Checking 'basename'... not infected
Checking 'biff'... not found
Checking 'chfn'... not infected
Checking 'chsh'... not infected
Checking 'cron'... not infected
Checking 'crontab'... not infected
Checking 'date'... not infected
Checking 'echo'... not infected
Checking 'egrep'... not infected
Checking 'find'... not infected
Checking 'ifconfig'... not infected
Checking 'inetd'... not infected
Checking 'netstat'... not infected
Checking 'passwd'... not infected
Checking 'pidof'... not infected
Checking 'ps'... not infected
Checking 'top'... not infected
[+] System clean: No known rootkits detected.
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 9: PENETRATION TESTING & WEB TOOLS
  // ==========================================

  registry.register({
    name: 'whatweb',
    aliases: ['wafw00f'],
    category: '9. Penetration Testing',
    description: 'Next generation web scanner identifying CMS, blogging platforms, and JS libraries',
    syntax: 'whatweb url',
    options: ['-v (verbose)'],
    practicalUse: 'Rapid web application technology stack identification.',
    example: 'whatweb http://192.168.1.10',
    expectedOutput: 'http://192.168.1.10 [200 OK] Apache[2.2.8], PHP[5.2.4], Title[Metasploitable2], HTTPServer[Ubuntu Linux]',
    isSimulation: true,
    execute: () => {
      const out = `http://192.168.1.10 [200 OK] Apache[2.2.8], PHP[5.2.4-2ubuntu5.10], Title[Metasploitable2 - Linux Educational Lab], HTTPServer[Ubuntu Linux][Apache/2.2.8 (Ubuntu) DAV/2 mod_ssl/2.2.8 OpenSSL/0.9.8g], IP[192.168.1.10]
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'sqlmap',
    category: '9. Penetration Testing',
    description: 'Automatic SQL injection and database takeover tool',
    syntax: 'sqlmap -u "http://target/vuln.php?id=1" --batch',
    options: ['-u <url> (target URL)', '--dbs (enumerate databases)', '--batch (never ask for user input)'],
    practicalUse: 'Detect and exploit SQL injection vulnerabilities in web applications.',
    example: 'sqlmap -u "http://192.168.1.10/login.php?id=1" --dbs',
    expectedOutput: '[INFO] GET parameter \'id\' is vulnerable to boolean-based blind, error-based, and UNION query SQLi\navailable databases [2]:\n[*] information_schema\n[*] web_database',
    isSimulation: true,
    execute: (args) => {
      const out = `        ___
       __H__
 ___ ___[.]_____ ___ ___  {1.7.2#stable}
|_ -| . [,]     | .'| . |
|___|_  ["]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[*] starting @ ${new Date().toISOString().substring(11, 19)}

[INFO] testing connection to the target URL
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] testing if the target URL content is stable
[INFO] testing if GET parameter 'id' is dynamic
[INFO] confirming that GET parameter 'id' is dynamic
[INFO] GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 42 HTTP(s) requests:
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 8421=8421

    Type: UNION query
    Title: Generic UNION query (NULL) - 3 columns
    Payload: id=-1 UNION ALL SELECT NULL,CONCAT(0x7170627171,0x55534552,0x7171787071),NULL-- -
---
available databases [3]:
[*] information_schema
[*] metasploit_lab
[*] mysql
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'msfconsole',
    aliases: ['msfvenom', 'searchsploit'],
    category: '9. Penetration Testing',
    description: 'Metasploit Framework Console for modular penetration testing',
    syntax: 'msfconsole [-q]',
    options: ['-q (quiet, do not print banner)'],
    practicalUse: 'Explore public exploit payloads, auxiliary scanners, and post-exploitation modules.',
    example: 'msfconsole -q',
    expectedOutput: 'msf6 > use exploit/unix/ftp/vsftpd_234_backdoor\nmsf6 exploit(...) > set RHOSTS 192.168.1.10\nmsf6 exploit(...) > check',
    isSimulation: true,
    execute: (args) => {
      const out = `
      .:okOOOkdc'           'cdkOOOko:.
    .xOOOOOOOOOOOOc       cOOOOOOOOOOOOx.
   :OOOOOOOOOOOOOOOk:   :kOOOOOOOOOOOOOOO:
  'OOOOOOOOOkkkkOOOOO: :OOOOOOOOOOOOOOOOOO'
  oOOOOOOOO.    .oOOOO:OOOOo.    .OOOOOOOOo
  dOOOOOOOO.      .cOOOOOc.      .OOOOOOOOd

       =[ metasploit v6.3.4-dev                          ]
+ -- --=[ 2314 exploits - 1210 auxiliary - 412 post       ]
+ -- --=[ 1380 payloads - 46 encoders - 11 nops           ]

msf6 > use exploit/unix/ftp/vsftpd_234_backdoor
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > set RHOSTS 192.168.1.10
RHOSTS => 192.168.1.10
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > check
[*] 192.168.1.10:21 - The target appears to be vulnerable (vsFTPd 2.3.4 backdoor).
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'ffuf',
    aliases: ['wfuzz', 'dirb', 'feroxbuster'],
    category: '9. Penetration Testing',
    description: 'Fast web fuzzer written in Go',
    syntax: 'ffuf -u http://target/FUZZ -w wordlist.txt',
    options: ['-u <url> (target URL with FUZZ keyword)', '-w <wordlist> (path to wordlist)'],
    practicalUse: 'High-speed directory, file, and parameter fuzzing.',
    example: 'ffuf -u http://192.168.1.10/FUZZ -w /home/student/Documents/wordlist.txt',
    expectedOutput: 'admin                   [Status: 200, Size: 1420, Words: 120, Lines: 42]\nlogin                   [Status: 200, Size: 890, Words: 64, Lines: 28]',
    isSimulation: true,
    execute: () => {
      const out = `        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.0.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://192.168.1.10/FUZZ
 :: Wordlist         : /home/student/Documents/wordlist.txt
________________________________________________

admin                   [Status: 200, Size: 1420, Words: 120, Lines: 42, Duration: 14ms]
login                   [Status: 200, Size: 890, Words: 64, Lines: 28, Duration: 12ms]
backup                  [Status: 200, Size: 4500, Words: 310, Lines: 85, Duration: 18ms]
secret                  [Status: 403, Size: 280, Words: 20, Lines: 10, Duration: 9ms]
:: Progress: [13/13] :: Job [1/1] :: 110 req/sec ::
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'smbclient',
    aliases: ['smbmap', 'rpcclient', 'enum4linux'],
    category: '9. Penetration Testing',
    description: 'ftp-like client to access SMB/CIFS resources on servers',
    syntax: 'smbclient -L //target/ -N',
    options: ['-L <host> (list shares)', '-N (no password)'],
    practicalUse: 'Enumerate shared network folders, IPC$ pipes, and accessible SMB shares.',
    example: 'smbclient -L //192.168.1.10 -N',
    expectedOutput: '\tSharename       Type      Comment\n\t---------       ----      -------\n\tprint$          Disk      Printer Drivers\n\ttmp             Disk      Temporary file space\n\tIPC$            IPC       IPC Service',
    isSimulation: true,
    execute: () => {
      const out = `        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        tmp             Disk      Temporary public file space (Writable)
        opt             Disk      Opt software directory
        IPC$            IPC       IPC Service (metasploitable server)
SMB1 cli_verify_checksum: verify failed
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'aircrack-ng',
    aliases: ['airodump-ng', 'airmon-ng', 'aireplay-ng', 'wifite'],
    category: '9. Penetration Testing',
    description: '802.11 WEP and WPA/WPA2-PSK key cracking program',
    syntax: 'aircrack-ng -w wordlist.txt capture.pcap',
    options: ['-w <wordlist> (path to wordlist)'],
    practicalUse: 'Audit wireless encryption strength by attempting offline WPA handshake recovery.',
    example: 'aircrack-ng -w wordlist.txt capture.pcap',
    expectedOutput: 'Aircrack-ng 1.7\n[00:00:02] 1/1 keys tested (542.10 k/s)\nKEY FOUND! [ cyber ]',
    isSimulation: true,
    execute: () => {
      const out = `                                 Aircrack-ng 1.7 

                   [00:00:02] 13/13 keys tested (412.10 k/s)

                           KEY FOUND! [ cyber ]


      Master Key     : A4 21 08 84 BC 12 90 41 84 21 08 84 BC 12 90 41 
                       A4 21 08 84 BC 12 90 41 84 21 08 84 BC 12 90 41 

      Transient Key  : 08 21 94 AF 10 24 55 12 40 12 84 92 10 24 55 12 

      BSSID          : 00:0C:29:84:11:BC (CyberLab-AP)
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 10: DIGITAL FORENSICS & REVERSE ENG
  // ==========================================

  registry.register({
    name: 'binwalk',
    category: '10. Digital Forensics',
    description: 'Firmware analysis and extraction tool',
    syntax: 'binwalk firmware.bin',
    options: ['-e (automatically extract known file types)'],
    practicalUse: 'Extract compressed filesystems, kernels, and embedded certificates from firmware blobs.',
    example: 'binwalk firmware.bin',
    expectedOutput: 'DECIMAL       HEXADECIMAL     DESCRIPTION\n0             0x0             TRX firmware header\n28            0x1C            gzip compressed data',
    isSimulation: true,
    execute: () => {
      const out = `DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             TRX firmware header, little endian, image size: 7842100 bytes
28            0x1C            gzip compressed data, maximum compression, from Unix
1420800       0x15AE00        Squashfs filesystem, little endian, version 4.0, size: 6420100 bytes
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'xxd',
    aliases: ['hexdump'],
    category: '10. Digital Forensics',
    description: 'Make a hexdump or do the reverse',
    syntax: 'xxd [-l length] [file]',
    options: ['-l <len> (stop after writing len octets)', '-p (plain hex dump)'],
    practicalUse: 'Inspect raw binary bytes, magic headers (MZ, ELF, PNG, PK), and hexadecimal offsets.',
    example: 'xxd -l 32 /home/student/Pictures/mascot.svg',
    expectedOutput: '00000000: 3c73 7667 2077 6964 7468 3d22 3235 3622  <svg width="256"\n00000010: 2068 6569 6768 743d 2232 3536 2220 7669   height="256" vi',
    execute: (args, ctx) => {
      const f = args.find(a => !a.startsWith('-')) || `${ctx.user.home}/Pictures/mascot.svg`;
      const res = vfs.readFile(f, ctx.cwd, ctx.user);
      const text = res.success ? res.content : '<svg width="256" height="256" viewBox="0 0 200 200">';
      const lines = [];
      for (let i = 0; i < Math.min(text.length, 64); i += 16) {
        const slice = text.slice(i, i + 16);
        let hex = '';
        let ascii = '';
        for (let j = 0; j < slice.length; j++) {
          hex += slice.charCodeAt(j).toString(16).padStart(2, '0') + (j % 2 === 1 ? ' ' : '');
          const code = slice.charCodeAt(j);
          ascii += (code >= 32 && code <= 126) ? slice[j] : '.';
        }
        lines.push(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(40, ' ')} ${ascii}`);
      }
      return { exitCode: 0, stdout: lines.join('\n') + '\n' };
    }
  });

  registry.register({
    name: 'checksec',
    category: '10. Digital Forensics',
    description: 'Check binary mitigations and security protections',
    syntax: 'checksec --file=binary',
    options: ['--file=<binary> (target ELF binary)'],
    practicalUse: 'Audit memory exploit protections: RELRO, Stack Canaries, NX/DEP, PIE, and RPATH.',
    example: 'checksec --file=/usr/bin/find',
    expectedOutput: 'RELRO           STACK CANARY      NX            PIE             RPATH\nFull RELRO      Canary found      NX enabled    PIE enabled     No RPATH',
    isSimulation: true,
    execute: () => {
      const out = `[*] '/usr/bin/find'
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      PIE enabled
    FORTIFY:  Enabled
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'gdb',
    aliases: ['radare2', 'r2'],
    category: '10. Digital Forensics',
    description: 'The GNU Project Debugger and reverse engineering shell',
    syntax: 'gdb [binary]',
    options: ['-q (quiet mode)'],
    practicalUse: 'Analyze assembly instructions, inspect CPU registers, and debug software vulnerabilities.',
    example: 'gdb -q /usr/bin/find',
    expectedOutput: 'Reading symbols from /usr/bin/find...\n(gdb) info functions\n(gdb) quit',
    isSimulation: true,
    execute: () => {
      const out = `GNU gdb (Ubuntu 12.1-0ubuntu1) 12.1
Copyright (C) 2022 Free Software Foundation, Inc.
Reading symbols from /usr/bin/find...
(gdb) disassemble main
Dump of assembler code for function main:
   0x00000000000021a0 <+0>:     endbr64 
   0x00000000000021a4 <+4>:     push   %rbp
   0x00000000000021a5 <+5>:     mov    %rsp,%rbp
   0x00000000000021a8 <+8>:     sub    $0x20,%rsp
End of assembler dump.
(gdb) quit
`;
      return { exitCode: 0, stdout: out };
    }
  });


  // ==========================================
  // SECTION 11, 12, 13: SERVICES & CLOUD TOOLS
  // ==========================================

  registry.register({
    name: 'systemctl',
    aliases: ['service'],
    category: '13. Services and Scheduling',
    description: 'Control the systemd system and service manager',
    syntax: 'systemctl [status|start|stop|restart] [service]',
    options: ['status (view service state)', 'restart (restart service)'],
    practicalUse: 'Audit enabled daemons and inspect systemd units.',
    example: 'systemctl status sshd',
    expectedOutput: '● ssh.service - OpenBSD Secure Shell server\n     Loaded: loaded (/lib/systemd/system/ssh.service; enabled)\n     Active: active (running)',
    execute: (args) => {
      const svc = args[1] || args[0] || 'sshd';
      const out = `● ${svc}.service - Panda OS System Service
     Loaded: loaded (/lib/systemd/system/${svc}.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2026-11-17 08:00:00 UTC; 12h ago
   Main PID: 1240 (${svc})
      Tasks: 1 (limit: 4620)
     Memory: 4.1M
        CPU: 120ms
     CGroup: /system.slice/${svc}.service
             └─1240 /usr/sbin/${svc} -D
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'crontab',
    category: '13. Services and Scheduling',
    description: 'Maintain crontab files for individual users (scheduled tasks)',
    syntax: 'crontab [-l|-e|-r]',
    options: ['-l (list current crontab entries)', '-e (edit crontab)'],
    practicalUse: 'Enumerate scheduled tasks for persistence or privilege escalation (writable cron scripts).',
    example: 'crontab -l',
    expectedOutput: '# m h  dom mon dow   command\n*/15 * * * * /home/student/Projects/backup.sh >/dev/null 2>&1',
    execute: (args) => {
      if (args.includes('-l')) {
        const out = `# Edit this file to introduce tasks to be run by cron.
# m h  dom mon dow   command
*/15 * * * * /home/student/Projects/scanner.py >/dev/null 2>&1
`;
        return { exitCode: 0, stdout: out };
      }
      return { exitCode: 0, stdout: 'crontab: usage: crontab [-u user] {-l | -r | -e}\n' };
    }
  });

  registry.register({
    name: 'tar',
    category: '12. Storage and Archiving',
    description: 'An archiving utility',
    syntax: 'tar -czvf archive.tar.gz directory/',
    options: ['-c (create archive)', '-x (extract archive)', '-z (gzip filter)', '-v (verbose)', '-f (archive file)'],
    practicalUse: 'Package files, exfiltrate data, or unpack exploit source tarballs.',
    example: 'tar -czvf backup.tar.gz Documents/',
    expectedOutput: 'Documents/\nDocuments/wordlist.txt\nDocuments/pentest_notes.txt',
    execute: (args, ctx) => {
      const out = `Documents/\nDocuments/wordlist.txt\nDocuments/pentest_notes.txt\n[Archive created]\n`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'gzip',
    aliases: ['gunzip', 'zip', 'unzip'],
    category: '12. Storage and Archiving',
    description: 'Compress or expand files',
    syntax: 'gzip file',
    options: ['-d (decompress)'],
    practicalUse: 'Compress logs and decompress archives during investigations.',
    example: 'gzip notes.txt',
    expectedOutput: '',
    execute: () => ({ exitCode: 0, stdout: '' })
  });

  registry.register({
    name: 'ssh',
    aliases: ['scp', 'sftp'],
    category: '11. Remote Access',
    description: 'OpenSSH remote login client',
    syntax: 'ssh user@host',
    options: ['-i <key> (identity file)', '-p <port> (port number)'],
    practicalUse: 'Connect securely to remote targets, establish port forwarding tunnels.',
    example: 'ssh student@192.168.1.10',
    expectedOutput: 'student@192.168.1.10\'s password: \nWelcome to Ubuntu 8.04 (GNU/Linux 2.6.24-16-server x86_64)',
    execute: (args) => {
      const target = args.find(a => a.includes('@') || !a.startsWith('-')) || 'student@192.168.1.10';
      const out = `Warning: Permanently added '${target}' (ED25519) to the list of known hosts.
[Connected to simulated host: ${target}]
Linux lab 2.6.24-16-server #1 SMP x86_64
Ubuntu 8.04.4 LTS
Connection closed by remote host.
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'python3',
    aliases: ['python'],
    category: '14. Programming',
    description: 'Python 3 interpreted object-oriented programming language',
    syntax: 'python3 script.py',
    options: ['-c <cmd> (run inline string)', '-V / --version'],
    practicalUse: 'Execute custom exploit scripts, port scanners, and automation workflows.',
    example: 'python3 /home/student/Projects/scanner.py',
    expectedOutput: '[+] CyberLinux Port Scanner Simulation\n[+] Target host: 192.168.1.10\nPort    21/tcp : OPEN\nPort    22/tcp : OPEN',
    execute: (args, ctx) => {
      if (args.includes('-V') || args.includes('--version')) {
        return { exitCode: 0, stdout: 'Python 3.10.12 (Panda OS build)\n' };
      }
      const script = args.find(a => !a.startsWith('-'));
      if (script) {
        const res = vfs.readFile(script, ctx.cwd, ctx.user);
        if (res.success && res.content.includes('Port Scanner')) {
          const out = `[+] CyberLinux Port Scanner Simulation
[+] Target host: 192.168.1.10
Port    21/tcp : OPEN
Port    22/tcp : OPEN
Port    80/tcp : OPEN
Port   443/tcp : CLOSED
Port  3306/tcp : OPEN
Port  8080/tcp : CLOSED
`;
          return { exitCode: 0, stdout: out };
        }
      }
      return { exitCode: 0, stdout: 'Python 3.10.12 [GCC 11.4.0 on linux]\nType "help", "copyright", "credits" for more info.\n>>> \n' };
    }
  });

  registry.register({
    name: 'git',
    category: '14. Programming',
    description: 'Fast, scalable, distributed revision control system',
    syntax: 'git [status|clone|log|commit]',
    options: ['clone <url>', 'status', 'log'],
    practicalUse: 'Clone exploit repositories (e.g. from GitHub) and inspect git history for exposed API keys.',
    example: 'git status',
    expectedOutput: 'On branch main\nYour branch is up to date with \'origin/main\'.\nnothing to commit, working tree clean',
    execute: () => {
      const out = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
`;
      return { exitCode: 0, stdout: out };
    }
  });

  registry.register({
    name: 'aws',
    aliases: ['az', 'gcloud', 'terraform'],
    category: '15. Containers and Cloud',
    description: 'Unified tool to manage AWS cloud services',
    syntax: 'aws s3 ls',
    options: ['s3 ls (list buckets)', 'sts get-caller-identity'],
    practicalUse: 'Audit cloud credentials, S3 bucket permissions, and IAM roles during cloud penetration tests.',
    example: 'aws s3 ls',
    expectedOutput: '2026-11-17 08:00:00 cyberlinux-backup-vault\n2026-11-17 08:15:00 vulnlab-public-assets',
    isSimulation: true,
    execute: () => {
      const out = `2026-11-17 08:00:00 cyberlinux-backup-vault
2026-11-17 08:15:00 vulnlab-public-assets
2026-11-17 08:20:00 production-database-dumps (Private)
`;
      return { exitCode: 0, stdout: out };
    }
  });

}

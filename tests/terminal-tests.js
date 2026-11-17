import { describe, it, expect } from './test-framework.js';
import { CommandParser } from '../js/terminal/command-parser.js';
import { CommandRegistry } from '../js/terminal/command-registry.js';
import { ShellInterpreter } from '../js/terminal/shell-interpreter.js';
import { VirtualUsers } from '../js/core/virtual-users.js';
import { VirtualFileSystem } from '../js/core/virtual-filesystem.js';
import { VirtualProcesses } from '../js/core/virtual-processes.js';
import { VirtualNetwork } from '../js/core/virtual-network.js';
import { registerAllCommands } from '../js/terminal/commands-catalog.js';

describe('Terminal & Shell Interpreter Tests', () => {
  const users = new VirtualUsers();
  const vfs = new VirtualFileSystem(users);
  const procs = new VirtualProcesses();
  const net = new VirtualNetwork();
  const registry = new CommandRegistry();
  registerAllCommands(registry, vfs, users, procs, net);
  const shell = new ShellInterpreter(registry, vfs, users, procs, net);

  it('tokenizes commands with quotes and parameters correctly', () => {
    const { chains } = CommandParser.parse('echo "hello world" arg2');
    expect(chains.length).toBe(1);
    expect(chains[0].pipeline[0].name).toBe('echo');
    expect(chains[0].pipeline[0].args[0]).toBe('hello world');
    expect(chains[0].pipeline[0].args[1]).toBe('arg2');
  });

  it('executes basic commands (whoami, id, pwd)', async () => {
    const resWhoami = await shell.execute('whoami');
    expect(resWhoami.exitCode).toBe(0);
    expect(resWhoami.stdout.trim()).toBe('student');

    const resPwd = await shell.execute('pwd');
    expect(resPwd.exitCode).toBe(0);
    expect(resPwd.stdout.trim()).toBe('/home/student');
  });

  it('starts as student, enters root with sudo, and exits back to student', async () => {
    const testUsers = new VirtualUsers();
    const testVfs = new VirtualFileSystem(testUsers);
    const testNetwork = new VirtualNetwork();
    const testRegistry = new CommandRegistry();
    registerAllCommands(testRegistry, testVfs, testUsers, new VirtualProcesses(), testNetwork);
    const testShell = new ShellInterpreter(testRegistry, testVfs, testUsers, new VirtualProcesses(), testNetwork);

    expect(testShell.getPrompt()).toContain('student@');
    const rootResult = await testShell.execute('sudo -i');
    expect(rootResult.exitCode).toBe(0);
    expect(testShell.getPrompt()).toContain('root@');
    expect(testShell.cwd).toBe('/root');
    expect(testShell.env.USER).toBe('root');

    await testShell.execute('exit');
    expect(testShell.getPrompt()).toContain('student@');
    expect(testShell.cwd).toBe('/home/student');
    expect(testShell.env.USER).toBe('student');

    const exitResult = await testShell.execute('exit');
    expect(exitResult.exitShell).toBe(true);
  });

  it('provides simulated system-info, hostnamectl, FTP, and nano commands', async () => {
    for (const command of ['hostnamectl', 'neofetch', 'fastfetch', 'ftp', 'nano']) {
      expect(registry.has(command)).toBe(true);
    }

    const hostname = await shell.execute('hostnamectl status');
    expect(hostname.stdout).toContain('Static hostname: cyberlinux');
    const neofetch = await shell.execute('neofetch');
    expect(neofetch.stdout).toContain('OS: CyberLinux');
    const fastfetch = await shell.execute('fastfetch');
    expect(fastfetch.stdout).toContain('User: student');
    const ftp = await shell.execute('ftp 192.168.1.10');
    expect(ftp.stdout).toContain('220 (vsftpd 2.3.4)');
    const nano = await shell.execute('nano notes.txt');
    expect(nano.stdout).toContain('/home/student/notes.txt');
  });

  it('reads hidden flags from virtual image metadata with exiftool', async () => {
    const result = await shell.execute('exiftool /home/student/Pictures/marshmallow-sky.svg');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('CL{clouds_hide_the_sweet_secret}');
  });

  it('supports pipelines (cat /etc/passwd | grep student)', async () => {
    const res = await shell.execute('cat /etc/passwd | grep student');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('student:x:1000:1000');
  });

  it('supports file redirection (echo "secret" > /tmp/flag.txt)', async () => {
    const res = await shell.execute('echo "CTF_FLAG{cyber_panda}" > /tmp/flag.txt');
    expect(res.exitCode).toBe(0);

    const read = vfs.readFile('/tmp/flag.txt', '/', users.getUser('student'));
    expect(read.success).toBe(true);
    expect(read.content.trim()).toBe('CTF_FLAG{cyber_panda}');
  });

  it('simulates security tools (nmap, nikto, linpeas)', async () => {
    const nmapRes = await shell.execute('nmap -sV 192.168.1.10');
    expect(nmapRes.exitCode).toBe(0);
    expect(nmapRes.stdout).toContain('vsftpd 2.3.4');

    const linpeasRes = await shell.execute('linpeas');
    expect(linpeasRes.exitCode).toBe(0);
    expect(linpeasRes.stdout).toContain('SUID');
  });
});

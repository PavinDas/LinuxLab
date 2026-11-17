import { describe, it, expect } from './test-framework.js';
import { VirtualFileSystem } from '../js/core/virtual-filesystem.js';
import { VirtualUsers } from '../js/core/virtual-users.js';

describe('Virtual Filesystem (VFS) Tests', () => {
  const users = new VirtualUsers();
  const vfs = new VirtualFileSystem(users);

  it('initializes standard Linux hierarchy (/etc, /home, /var/log, /bin)', () => {
    expect(vfs.getNode('/')).toBeTruthy();
    expect(vfs.getNode('/etc')).toBeTruthy();
    expect(vfs.getNode('/home/student')).toBeTruthy();
    expect(vfs.getNode('/var/log/auth.log')).toBeTruthy();
  });

  it('creates and reads new virtual files', () => {
    const res = vfs.writeFile('/home/student/test.txt', 'Hello CyberLinux', '/', users.getUser('student'));
    expect(res.success).toBe(true);

    const readRes = vfs.readFile('/home/student/test.txt', '/', users.getUser('student'));
    expect(readRes.success).toBe(true);
    expect(readRes.content).toBe('Hello CyberLinux');
  });

  it('enforces directory creation and duplicate prevention', () => {
    const mkdirRes = vfs.createDirectory('/home/student/Projects/lab1', '/', users.getUser('student'));
    expect(mkdirRes.success).toBe(true);

    const dupRes = vfs.createDirectory('/home/student/Projects/lab1', '/', users.getUser('student'));
    expect(dupRes.success).toBe(false);
  });

  it('protects root-only files (/etc/shadow) from student read', () => {
    const studentUser = users.getUser('student');
    const readRes = vfs.readFile('/etc/shadow', '/', studentUser);
    expect(readRes.success).toBe(false);
    expect(readRes.error).toBe('Permission denied');

    // Root user can read it
    const rootUser = users.getUser('root');
    const rootRead = vfs.readFile('/etc/shadow', '/', rootUser);
    expect(rootRead.success).toBe(true);
  });

  it('supports file movement and renaming', () => {
    vfs.writeFile('/home/student/source.txt', 'sample content', '/', users.getUser('student'));
    const mvRes = vfs.moveNode('/home/student/source.txt', '/home/student/dest.txt', '/', users.getUser('student'));
    expect(mvRes.success).toBe(true);
    expect(vfs.getNode('/home/student/source.txt')).toBeFalsy();
    expect(vfs.getNode('/home/student/dest.txt')).toBeTruthy();
  });

  it('seeds extra SVG images with hidden forensic metadata', () => {
    const image = vfs.readFile('/home/student/Pictures/marshmallow-sky.svg', '/', users.getUser('student'));
    expect(image.success).toBe(true);
    expect(image.content).toContain('<cyber:Flag>');
    expect(vfs.getNode('/home/student/Pictures/panda-postcard.svg')).toBeTruthy();
  });
});

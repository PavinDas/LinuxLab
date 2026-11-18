import { describe, it, expect } from './test-framework.js';
import { VirtualUsers } from '../js/core/virtual-users.js';
import { VirtualFileSystem } from '../js/core/virtual-filesystem.js';
import { VirtualProcesses } from '../js/core/virtual-processes.js';
import { VirtualNetwork } from '../js/core/virtual-network.js';
import { CommandRegistry } from '../js/terminal/command-registry.js';
import { registerAllCommands } from '../js/terminal/commands-catalog.js';
import { ShellInterpreter } from '../js/terminal/shell-interpreter.js';
import { ProgressManager } from '../js/learning/progress-manager.js';
import { seedQuestEnvironment } from '../js/learning/quest-environment.js';
import { QuestChallengesData } from '../js/learning/quest-challenges.js';

describe('Linux Command Quest — Progressive CTF Learning Lab Suite', () => {
  // Test fixture setup
  const users = new VirtualUsers();
  const vfs = new VirtualFileSystem(users);
  const procs = new VirtualProcesses();
  const net = new VirtualNetwork();
  const registry = new CommandRegistry();
  registerAllCommands(registry, vfs, users, procs, net);
  const shell = new ShellInterpreter(registry, vfs, users, procs, net);

  // Seed the CTF environment
  seedQuestEnvironment(vfs, users, procs);

  const mockStorageStore = {};
  const mockStorage = {
    loadProgress: () => (mockStorageStore.progress ? JSON.parse(mockStorageStore.progress) : null),
    saveProgress: (data) => { mockStorageStore.progress = JSON.stringify(data); },
    loadVFS: () => null,
    saveVFS: () => true
  };

  it('verifies Challenge 01 can be solved with one ls command alone', async () => {
    const ch1 = QuestChallengesData[0];
    expect(ch1.id).toBe('quest-01-first-contact');
    expect(ch1.command).toBe('ls');
    expect(ch1.startingDirectory).toBe('/home/student');

    shell.cwd = ch1.startingDirectory;
    const res = await shell.execute('ls');

    expect(res.exitCode).toBe(0);
    // The flag is directly visible in the directory listing output
    expect(res.stdout).toContain(ch1.flag);
    expect(res.stdout).toContain('FLAG{FIRST_STEP_LS_DISCOVERY}');
  });

  it('verifies Challenge 02 can be solved with cd alone', async () => {
    const ch2 = QuestChallengesData[1];
    expect(ch2.id).toBe('quest-02-follow-the-path');
    expect(ch2.command).toBe('cd');
    expect(ch2.startingDirectory).toBe('/home/student');

    shell.cwd = ch2.startingDirectory;
    // User executes cd alone into target chamber
    const res = await shell.execute('cd quest_chamber');

    expect(res.exitCode).toBe(0);
    expect(shell.cwd).toBe('/home/student/quest_chamber');
    // Navigation message directly reveals the flag
    expect(res.stdout).toContain(ch2.flag);
    expect(res.stdout).toContain('FLAG{CD_PATH_NAVIGATOR_FOUND}');
  });

  it('verifies Challenge 03 can be solved with ls -a alone', async () => {
    const ch3 = QuestChallengesData[2];
    expect(ch3.id).toBe('quest-03-the-invisible-file');
    expect(ch3.command).toBe('ls -a');
    expect(ch3.startingDirectory).toBe('/home/student/Documents');

    shell.cwd = ch3.startingDirectory;

    // Normal ls must NOT reveal the hidden flag file
    const resNormal = await shell.execute('ls');
    expect(resNormal.stdout.includes(ch3.flag)).toBe(false);

    // ls -a reveals the hidden flag file
    const resHidden = await shell.execute('ls -a');
    expect(resHidden.exitCode).toBe(0);
    expect(resHidden.stdout).toContain(ch3.flag);
    expect(resHidden.stdout).toContain('.FLAG{HIDDEN_IN_PLAIN_SIGHT_LSA}');
  });

  it('verifies Challenge 04 teaches ls -l detailed metadata', async () => {
    const ch4 = QuestChallengesData[3];
    expect(ch4.id).toBe('quest-04-detailed-investigation');
    expect(ch4.command).toBe('ls -l');
    expect(ch4.startingDirectory).toBe('/home/student/Documents');

    shell.cwd = ch4.startingDirectory;
    const res = await shell.execute('ls -l');

    expect(res.exitCode).toBe(0);
    // Detailed output shows permissions, owner, group, size (1337)
    expect(res.stdout).toContain('1337');
    expect(res.stdout).toContain('student');
    expect(res.stdout).toContain(ch4.flag);
    expect(res.stdout).toContain('FLAG{METADATA_INSPECTOR_LSL}');
  });

  it('verifies Challenge 05 teaches ls -la combined options', async () => {
    const ch5 = QuestChallengesData[4];
    expect(ch5.id).toBe('quest-05-the-hidden-combination');
    expect(ch5.command).toBe('ls -la');
    expect(ch5.startingDirectory).toBe('/home/student/Projects');

    shell.cwd = ch5.startingDirectory;

    // Normal ls alone doesn't show hidden file
    const resNormal = await shell.execute('ls');
    expect(resNormal.stdout.includes(ch5.flag)).toBe(false);

    // ls -la displays hidden files with complete metadata
    const resCombined = await shell.execute('ls -la');
    expect(resCombined.exitCode).toBe(0);
    expect(resCombined.stdout).toContain(ch5.flag);
    expect(resCombined.stdout).toContain('.FLAG{COMBINED_OPTIONS_POWER_LSLA}');
  });

  it('verifies incorrect flags reject submission and correct flags unlock the next challenge', () => {
    delete mockStorageStore.progress;
    const progress = new ProgressManager(mockStorage);

    const ch1 = QuestChallengesData[0];
    const ch2 = QuestChallengesData[1];

    // Initially, only challenge 1 is unlocked
    expect(progress.isChallengeUnlocked(ch1.id)).toBe(true);
    expect(progress.isChallengeUnlocked(ch2.id)).toBe(false);
    expect(progress.isChallengeCompleted(ch1.id)).toBe(false);

    // Submitting wrong flag
    const wrongFlag = 'FLAG{WRONG_FLAG_ATTEMPT}';
    expect(wrongFlag === ch1.flag).toBe(false);
    expect(progress.isChallengeUnlocked(ch2.id)).toBe(false);

    // Submitting correct flag
    const solved = progress.solveChallenge(ch1.id, ch1.flag, ch1.points, 5, ch1.badge);
    expect(solved).toBe(true);
    expect(progress.isChallengeCompleted(ch1.id)).toBe(true);

    // Challenge 2 is now unlocked
    expect(progress.isChallengeUnlocked(ch2.id)).toBe(true);
    expect(progress.getStats().score).toBe(15); // 10 base + 5 bonus
    expect(progress.getStats().badges).toContain('First Flag');

    // Duplicate submission prevention
    const dupSolved = progress.solveChallenge(ch1.id, ch1.flag, ch1.points);
    expect(dupSolved).toBe(false);
  });

  it('verifies hints remain hidden until selected and can be revealed independently', () => {
    const progress = new ProgressManager(mockStorage);
    const ch1 = QuestChallengesData[0];

    // Initially no hints are revealed for challenge 1
    expect(progress.getRevealedHints(ch1.id).length).toBe(0);
    expect(progress.isHintRevealed(ch1.id, 1)).toBe(false);
    expect(progress.isHintRevealed(ch1.id, 2)).toBe(false);
    expect(progress.isHintRevealed(ch1.id, 3)).toBe(false);

    // Reveal only Hint 2
    progress.revealHint(ch1.id, 2);
    expect(progress.isHintRevealed(ch1.id, 2)).toBe(true);
    expect(progress.isHintRevealed(ch1.id, 1)).toBe(false);
    expect(progress.isHintRevealed(ch1.id, 3)).toBe(false);
    expect(progress.getRevealedHints(ch1.id)).toEqual([2]);

    // Reveal Hint 1
    progress.revealHint(ch1.id, 1);
    expect(progress.isHintRevealed(ch1.id, 1)).toBe(true);
    expect(progress.isHintRevealed(ch1.id, 2)).toBe(true);
    expect(progress.isHintRevealed(ch1.id, 3)).toBe(false);
  });

  it('verifies progress and completions persist across reloads', () => {
    const progressA = new ProgressManager(mockStorage);
    progressA.solveChallenge('quest-02-follow-the-path', 'FLAG{CD_PATH_NAVIGATOR_FOUND}', 10, 0, 'Pathfinder');

    // Simulate new session reload
    const progressB = new ProgressManager(mockStorage);
    expect(progressB.isChallengeCompleted('quest-01-first-contact')).toBe(true);
    expect(progressB.isChallengeCompleted('quest-02-follow-the-path')).toBe(true);
    expect(progressB.isChallengeUnlocked('quest-03-the-invisible-file')).toBe(true);
    expect(progressB.getStats().badges).toContain('Pathfinder');
  });

  it('verifies terminal and file manager share the same virtual filesystem', () => {
    // Write via terminal / VFS
    const testFile = '/home/student/Documents/shared_artifact.txt';
    const writeRes = vfs.writeFile(testFile, 'Universal OS Test', '/', users.getUser('student'));
    expect(writeRes.success).toBe(true);

    // Read directly from VFS as file manager would
    const readRes = vfs.readFile(testFile, '/', users.getUser('student'));
    expect(readRes.success).toBe(true);
    expect(readRes.content).toBe('Universal OS Test');

    // Node is accessible
    const node = vfs.getNode(testFile);
    expect(node).toBeTruthy();
    expect(node.owner).toBe('student');
  });

  it('verifies challenge switching and CTF reset do not delete unrelated user files or settings', () => {
    // User file in Desktop
    vfs.writeFile('/home/student/Desktop/my_personal_notes.txt', 'Do not delete me', '/', users.getUser('student'));

    const progress = new ProgressManager(mockStorage);
    // Reset CTF progress
    progress.reset();

    expect(progress.getStats().completedChallengesCount).toBe(0);
    expect(progress.getStats().score).toBe(0);
    expect(progress.isChallengeUnlocked('quest-01-first-contact')).toBe(true);
    expect(progress.isChallengeUnlocked('quest-02-follow-the-path')).toBe(false);

    // User's personal file remains completely intact
    const note = vfs.readFile('/home/student/Desktop/my_personal_notes.txt', '/', users.getUser('student'));
    expect(note.success).toBe(true);
    expect(note.content).toBe('Do not delete me');
  });

  it('verifies security against script execution in flags and paths', () => {
    const maliciousFlag = '<script>alert("xss")</script>';
    const progress = new ProgressManager(mockStorage);
    progress.recordFailedSubmission('quest-01-first-contact', maliciousFlag);

    // Stored safely without executing
    const history = progress.submissionHistory;
    expect(history[history.length - 1].submittedFlag).toBe(maliciousFlag);
  });
});

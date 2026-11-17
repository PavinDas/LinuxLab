import { describe, it, expect } from './test-framework.js';
import { VirtualProcesses } from '../js/core/virtual-processes.js';
import { ProgressManager } from '../js/learning/progress-manager.js';
import { ChallengesData } from '../js/learning/challenges-data.js';

describe('Applications & Learning System Tests', () => {

  it('manages simulated processes, PID assignment and termination', () => {
    const procs = new VirtualProcesses();
    const listBefore = procs.list();
    expect(listBefore.length).toBeGreaterThan(5);

    const createRes = procs.create('python3 scanner.py', 'student');
    expect(createRes.success).toBe(true);
    expect(createRes.process.pid).toBeGreaterThan(1500);

    // Terminate process
    const killRes = procs.kill(createRes.process.pid, 15, 'student');
    expect(killRes.success).toBe(true);

    // Ensure it is gone
    const procAfter = procs.get(createRes.process.pid);
    expect(procAfter).toBeFalsy();
  });

  it('tracks progress, calculates scores, and unlocks achievement badges', () => {
    // Mock storage manager
    const mockStorage = {
      loadProgress: () => null,
      saveProgress: () => {}
    };
    const progress = new ProgressManager(mockStorage);

    const ch = ChallengesData[0];
    const ok = progress.solveChallenge(ch.id, ch.points, ch.badge);
    expect(ok).toBe(true);

    const stats = progress.getStats();
    expect(stats.score).toBe(ch.points);
    expect(stats.badgesCount).toBe(1);
    expect(stats.badges[0]).toBe(ch.badge);
  });

});

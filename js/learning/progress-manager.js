import { sysEvents } from '../core/event-bus.js';
import { QuestChallengesData } from './quest-challenges.js';

/**
 * ProgressManager
 * Tracks participant learning journey, challenge completions, unlocked progression,
 * progressive hint reveals, scoring, and cybersecurity milestone badges.
 */
export class ProgressManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.unlockedChallenges = new Set(['quest-01-first-contact']);
    this.completedChallenges = new Set();
    this.currentChallengeId = 'quest-01-first-contact';
    this.hintsRevealed = {}; // { [challengeId]: [1, 2] }
    this.viewedSummaries = new Set();
    this.submissionHistory = [];
    this.completionTimes = {};
    this.badges = new Set();
    this.score = 0;

    this.load();
  }

  load() {
    if (!this.storage) return;
    try {
      const data = this.storage.loadProgress();
      if (data && typeof data === 'object') {
        // Load unlocked challenges
        if (Array.isArray(data.unlockedChallenges) && data.unlockedChallenges.length > 0) {
          this.unlockedChallenges = new Set(data.unlockedChallenges.filter(id => typeof id === 'string'));
        }
        // Always ensure the first challenge is unlocked
        this.unlockedChallenges.add('quest-01-first-contact');

        // Load completed challenges
        if (Array.isArray(data.completedChallenges)) {
          this.completedChallenges = new Set(data.completedChallenges.filter(id => typeof id === 'string'));
          // Completed challenges must always be unlocked
          for (const cid of this.completedChallenges) {
            this.unlockedChallenges.add(cid);
          }
        }

        // Current challenge
        if (typeof data.currentChallengeId === 'string' && data.currentChallengeId) {
          this.currentChallengeId = data.currentChallengeId;
        }

        // Hints revealed
        if (data.hintsRevealed && typeof data.hintsRevealed === 'object') {
          this.hintsRevealed = {};
          for (const [cid, hints] of Object.entries(data.hintsRevealed)) {
            if (Array.isArray(hints)) {
              this.hintsRevealed[cid] = hints.filter(h => typeof h === 'number');
            }
          }
        }

        // Viewed summaries
        if (Array.isArray(data.viewedSummaries)) {
          this.viewedSummaries = new Set(data.viewedSummaries.filter(id => typeof id === 'string'));
        }

        // Submission history
        if (Array.isArray(data.submissionHistory)) {
          this.submissionHistory = data.submissionHistory.slice(-50);
        }

        // Completion times
        if (data.completionTimes && typeof data.completionTimes === 'object') {
          this.completionTimes = { ...data.completionTimes };
        }

        // Badges
        if (Array.isArray(data.badges)) {
          this.badges = new Set(data.badges.filter(b => typeof b === 'string'));
        }

        // Score
        if (typeof data.score === 'number' && Number.isFinite(data.score)) {
          this.score = Math.max(0, data.score);
        }

        // Automatically unlock next challenge after highest completed challenge
        this.ensureProgressionIntegrity();
      }
    } catch (e) {
      console.warn('Failed to load progress data:', e);
      // Fallback to initial state
      this.unlockedChallenges = new Set(['quest-01-first-contact']);
      this.completedChallenges = new Set();
      this.currentChallengeId = 'quest-01-first-contact';
    }
  }

  save() {
    if (!this.storage) return;
    try {
      this.storage.saveProgress({
        version: 2,
        unlockedChallenges: Array.from(this.unlockedChallenges),
        completedChallenges: Array.from(this.completedChallenges),
        currentChallengeId: this.currentChallengeId,
        hintsRevealed: this.hintsRevealed,
        viewedSummaries: Array.from(this.viewedSummaries),
        submissionHistory: this.submissionHistory.slice(-50),
        completionTimes: this.completionTimes,
        badges: Array.from(this.badges),
        score: this.score,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to persist progress:', e);
    }
  }

  ensureProgressionIntegrity() {
    // If challenge N is completed, challenge N+1 must be unlocked
    for (let i = 0; i < QuestChallengesData.length; i++) {
      const ch = QuestChallengesData[i];
      if (this.completedChallenges.has(ch.id)) {
        if (i + 1 < QuestChallengesData.length) {
          this.unlockedChallenges.add(QuestChallengesData[i + 1].id);
        }
      }
    }
  }

  isChallengeUnlocked(challengeId) {
    return this.unlockedChallenges.has(challengeId);
  }

  isChallengeCompleted(challengeId) {
    return this.completedChallenges.has(challengeId);
  }

  getCurrentChallengeId() {
    return this.currentChallengeId;
  }

  setCurrentChallengeId(challengeId) {
    if (this.unlockedChallenges.has(challengeId) || this.completedChallenges.has(challengeId)) {
      this.currentChallengeId = challengeId;
      this.save();
      return true;
    }
    return false;
  }

  unlockChallenge(challengeId) {
    if (!this.unlockedChallenges.has(challengeId)) {
      this.unlockedChallenges.add(challengeId);
      this.save();
      sysEvents.emit('challenge:unlocked', { challengeId });
      return true;
    }
    return false;
  }

  solveChallenge(challengeId, submittedFlag = '', basePoints = 10, bonusPoints = 0, badgeName = null) {
    // Backwards compatibility if called as (challengeId, points, badgeName)
    if (typeof submittedFlag === 'number') {
      badgeName = typeof basePoints === 'string' ? basePoints : null;
      basePoints = submittedFlag;
      submittedFlag = '';
    }

    if (this.completedChallenges.has(challengeId)) {
      return false; // Prevent duplicate completion
    }

    this.completedChallenges.add(challengeId);
    this.unlockedChallenges.add(challengeId);

    const totalEarned = Math.max(0, basePoints + bonusPoints);
    this.score += totalEarned;
    this.completionTimes[challengeId] = new Date().toISOString();

    // Record submission history
    this.submissionHistory.push({
      challengeId,
      submittedFlag,
      success: true,
      timestamp: new Date().toISOString()
    });

    // Award badge if applicable
    if (badgeName && !this.badges.has(badgeName)) {
      this.badges.add(badgeName);
      sysEvents.emit('badge:earned', { badge: badgeName, challengeId });
    }

    // Check for Command Master milestone badge (all challenges solved)
    if (this.completedChallenges.size >= QuestChallengesData.length && !this.badges.has('Command Master')) {
      this.badges.add('Command Master');
      sysEvents.emit('badge:earned', { badge: 'Command Master', challengeId });
    }

    // Automatically unlock the subsequent challenge
    const currentIndex = QuestChallengesData.findIndex(c => c.id === challengeId);
    let nextChallengeId = null;
    if (currentIndex !== -1 && currentIndex + 1 < QuestChallengesData.length) {
      const nextCh = QuestChallengesData[currentIndex + 1];
      this.unlockedChallenges.add(nextCh.id);
      nextChallengeId = nextCh.id;
      sysEvents.emit('challenge:unlocked', { challengeId: nextCh.id });
    }

    this.save();
    sysEvents.emit('challenge:solved', {
      challengeId,
      points: totalEarned,
      nextChallengeId,
      stats: this.getStats()
    });
    sysEvents.emit('progress:updated', this.getStats());

    return true;
  }

  recordFailedSubmission(challengeId, submittedFlag) {
    this.submissionHistory.push({
      challengeId,
      submittedFlag,
      success: false,
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  revealHint(challengeId, hintId) {
    if (!this.hintsRevealed[challengeId]) {
      this.hintsRevealed[challengeId] = [];
    }
    if (!this.hintsRevealed[challengeId].includes(hintId)) {
      this.hintsRevealed[challengeId].push(hintId);
      this.save();
      sysEvents.emit('hint:revealed', { challengeId, hintId });
      return true;
    }
    return false;
  }

  getRevealedHints(challengeId) {
    return this.hintsRevealed[challengeId] || [];
  }

  isHintRevealed(challengeId, hintId) {
    return (this.hintsRevealed[challengeId] || []).includes(hintId);
  }

  markSummaryViewed(challengeId) {
    if (!this.viewedSummaries.has(challengeId)) {
      this.viewedSummaries.add(challengeId);
      this.save();
      return true;
    }
    return false;
  }

  isSummaryViewed(challengeId) {
    return this.viewedSummaries.has(challengeId);
  }

  getStats() {
    const totalCount = QuestChallengesData.length;
    const completedCount = this.completedChallenges.size;
    const unlockedCount = this.unlockedChallenges.size;
    const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedChallengesCount: completedCount,
      totalChallengesCount: totalCount,
      unlockedCount,
      badgesCount: this.badges.size,
      score: this.score,
      percentComplete,
      badges: Array.from(this.badges),
      isAllCompleted: completedCount >= totalCount && totalCount > 0
    };
  }

  reset() {
    this.unlockedChallenges = new Set(['quest-01-first-contact']);
    this.completedChallenges.clear();
    this.currentChallengeId = 'quest-01-first-contact';
    this.hintsRevealed = {};
    this.viewedSummaries.clear();
    this.submissionHistory = [];
    this.completionTimes = {};
    this.badges.clear();
    this.score = 0;

    this.save();
    sysEvents.emit('ctf:reset');
    sysEvents.emit('progress:updated', this.getStats());
  }
}

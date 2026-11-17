import { sysEvents } from '../core/event-bus.js';

/**
 * ProgressManager
 * Tracks user learning journey, lesson completions, solved lab challenges, and achievements.
 */
export class ProgressManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.completedLessons = new Set();
    this.completedChallenges = new Set();
    this.badges = new Set();
    this.score = 0;

    this.load();
  }

  load() {
    if (!this.storage) return;
    const data = this.storage.loadProgress();
    if (data) {
      if (Array.isArray(data.completedLessons)) {
        this.completedLessons = new Set(data.completedLessons);
      }
      if (Array.isArray(data.completedChallenges)) {
        this.completedChallenges = new Set(data.completedChallenges);
      }
      if (Array.isArray(data.badges)) {
        this.badges = new Set(data.badges);
      }
      if (typeof data.score === 'number') {
        this.score = data.score;
      }
    }
  }

  save() {
    if (!this.storage) return;
    this.storage.saveProgress({
      completedLessons: Array.from(this.completedLessons),
      completedChallenges: Array.from(this.completedChallenges),
      badges: Array.from(this.badges),
      score: this.score,
      updatedAt: new Date().toISOString()
    });
  }

  markLessonComplete(lessonId, badgeName) {
    if (!this.completedLessons.has(lessonId)) {
      this.completedLessons.add(lessonId);
      this.score += 50;
      if (badgeName && !this.badges.has(badgeName)) {
        this.badges.add(badgeName);
        sysEvents.emit('badge:earned', { badge: badgeName, reason: 'Lesson Completed' });
      }
      this.save();
      sysEvents.emit('progress:updated', this.getStats());
      return true;
    }
    return false;
  }

  isLessonComplete(lessonId) {
    return this.completedLessons.has(lessonId);
  }

  solveChallenge(challengeId, points = 100, badgeName = null) {
    if (!this.completedChallenges.has(challengeId)) {
      this.completedChallenges.add(challengeId);
      this.score += points;
      if (badgeName && !this.badges.has(badgeName)) {
        this.badges.add(badgeName);
        sysEvents.emit('badge:earned', { badge: badgeName, reason: 'Challenge Solved' });
      }
      this.save();
      sysEvents.emit('progress:updated', this.getStats());
      return true;
    }
    return false;
  }

  isChallengeComplete(challengeId) {
    return this.completedChallenges.has(challengeId);
  }

  getStats() {
    return {
      completedLessonsCount: this.completedLessons.size,
      completedChallengesCount: this.completedChallenges.size,
      badgesCount: this.badges.size,
      score: this.score,
      badges: Array.from(this.badges)
    };
  }

  reset() {
    this.completedLessons.clear();
    this.completedChallenges.clear();
    this.badges.clear();
    this.score = 0;
    this.save();
    sysEvents.emit('progress:updated', this.getStats());
  }
}

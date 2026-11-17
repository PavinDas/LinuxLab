import { Sanitizer } from '../security/sanitizer.js';
import { LessonsData } from '../learning/lessons-data.js';
import { ChallengesData } from '../learning/challenges-data.js';
import { filterTextInput } from '../security/input-validation.js';
import { sysEvents } from '../core/event-bus.js';

/**
 * LearningCenterApp
 * Interactive Cybersecurity Learning Center with 8-Week Roadmap,
 * Markdown-styled lessons, hands-on practice labs, and milestone badges.
 */
export class LearningCenterApp {
  constructor(progressManager, appLauncherCallback) {
    this.progress = progressManager;
    this.launchApp = appLauncherCallback;
    this.activeTab = 'roadmap'; // 'roadmap' | 'challenges' | 'badges'
    this.selectedLessonId = LessonsData[0].id;
    this.revealedHints = new Set();
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'learning-container' });

    // Top Navigation Tabs & Score Pill
    const header = Sanitizer.createElement('div', { className: 'learning-header' });
    
    const tabs = Sanitizer.createElement('div', { className: 'learning-tabs' });
    this.roadmapBtn = Sanitizer.createElement('button', {
      className: `learn-tab-btn ${this.activeTab === 'roadmap' ? 'active' : ''}`,
      onClick: () => this.switchTab('roadmap')
    }, '🗺️ 8-Week Roadmap & Lessons');

    this.challengesBtn = Sanitizer.createElement('button', {
      className: `learn-tab-btn ${this.activeTab === 'challenges' ? 'active' : ''}`,
      onClick: () => this.switchTab('challenges')
    }, '🎯 Practice Challenges');

    this.badgesBtn = Sanitizer.createElement('button', {
      className: `learn-tab-btn ${this.activeTab === 'badges' ? 'active' : ''}`,
      onClick: () => this.switchTab('badges')
    }, '🏆 Achievements');

    tabs.appendChild(this.roadmapBtn);
    tabs.appendChild(this.challengesBtn);
    tabs.appendChild(this.badgesBtn);

    const rightStats = Sanitizer.createElement('div', { className: 'learning-header-right' });
    this.scorePill = Sanitizer.createElement('div', { className: 'score-pill' });
    this.updateScorePill();
    rightStats.appendChild(this.scorePill);

    header.appendChild(tabs);
    header.appendChild(rightStats);

    // Main Content Area
    this.contentArea = Sanitizer.createElement('div', { className: 'learning-content-area' });

    this.container.appendChild(header);
    this.container.appendChild(this.contentArea);

    this.renderCurrentTab();
    this.setupListeners();
    return this.container;
  }

  updateScorePill() {
    const stats = this.progress.getStats();
    this.scorePill.textContent = `⭐ ${stats.score} Points`;
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.roadmapBtn.classList.toggle('active', tab === 'roadmap');
    this.challengesBtn.classList.toggle('active', tab === 'challenges');
    this.badgesBtn.classList.toggle('active', tab === 'badges');
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    if (this.activeTab === 'roadmap') {
      this.renderRoadmap();
    } else if (this.activeTab === 'challenges') {
      this.renderChallenges();
    } else if (this.activeTab === 'badges') {
      this.renderBadges();
    }
  }

  getWeekIcon(week) {
    const icons = {
      1: '💻',
      2: '🛡️',
      3: '🌐',
      4: '📜',
      5: '🔒',
      6: '🎯',
      7: '⚡',
      8: '☁️'
    };
    return icons[week] || '📖';
  }

  renderRoadmap() {
    this.contentArea.innerHTML = '';
    const layout = Sanitizer.createElement('div', { className: 'roadmap-layout' });

    // Progress Bar Header
    const completedCount = LessonsData.filter(l => this.progress.isLessonComplete(l.id)).length;
    const progressPercent = Math.round((completedCount / LessonsData.length) * 100);

    // Left List of Weeks/Lessons
    const listCol = Sanitizer.createElement('div', { className: 'lesson-list-col' });
    
    // Progress overview header in sidebar
    const progHeader = Sanitizer.createElement('div', { className: 'lesson-sidebar-header' }, [
      Sanitizer.createElement('div', { className: 'prog-text' }, `Roadmap Progress: ${completedCount}/${LessonsData.length} (${progressPercent}%)`),
      Sanitizer.createElement('div', { className: 'prog-bar-bg' }, [
        Sanitizer.createElement('div', { className: 'prog-bar-fill', style: { width: `${progressPercent}%` } })
      ])
    ]);
    listCol.appendChild(progHeader);

    for (const l of LessonsData) {
      const isComplete = this.progress.isLessonComplete(l.id);
      const isSelected = (l.id === this.selectedLessonId);
      const weekIcon = this.getWeekIcon(l.week);

      const item = Sanitizer.createElement('div', {
        className: `lesson-card-item ${isSelected ? 'selected' : ''} ${isComplete ? 'completed' : ''}`,
        onClick: () => {
          this.selectedLessonId = l.id;
          this.renderRoadmap();
        }
      }, [
        Sanitizer.createElement('div', { className: 'lesson-item-header' }, [
          Sanitizer.createElement('span', { className: 'lesson-week-tag' }, `${weekIcon} Week ${l.week}`),
          Sanitizer.createElement('span', { className: `lesson-status-tag ${isComplete ? 'done' : 'ready'}` }, isComplete ? '✔ Done' : 'Ready')
        ]),
        Sanitizer.createElement('div', { className: 'lesson-card-title' }, l.title.split(': ')[1] || l.title),
        Sanitizer.createElement('div', { className: 'lesson-card-category' }, l.category)
      ]);
      listCol.appendChild(item);
    }

    // Right Lesson Detail Viewer
    const detailCol = Sanitizer.createElement('div', { className: 'lesson-detail-col' });
    const currentLesson = LessonsData.find(l => l.id === this.selectedLessonId) || LessonsData[0];
    const isComplete = this.progress.isLessonComplete(currentLesson.id);

    // Header with Badge Info
    const detailHeader = Sanitizer.createElement('div', { className: 'detail-header' }, [
      Sanitizer.createElement('div', { className: 'detail-meta-row' }, [
        Sanitizer.createElement('span', { className: 'lesson-pill week-pill' }, `Week ${currentLesson.week}`),
        Sanitizer.createElement('span', { className: 'lesson-pill cat-pill' }, currentLesson.category),
        Sanitizer.createElement('span', { className: 'lesson-pill badge-pill' }, `🏆 ${currentLesson.badge}`)
      ]),
      Sanitizer.createElement('h2', { className: 'lesson-main-title' }, currentLesson.title),
      Sanitizer.createElement('div', { className: 'lesson-summary-box' }, currentLesson.summary)
    ]);

    // Enhanced formatted markdown rendering
    const contentBox = Sanitizer.createElement('div', { className: 'lesson-text-body' });
    this.renderMarkdown(currentLesson.content, contentBox);

    // Suggested Commands Section
    if (currentLesson.suggestedCommands && currentLesson.suggestedCommands.length > 0) {
      const suggestSection = Sanitizer.createElement('div', { className: 'lesson-suggested-section' }, [
        Sanitizer.createElement('h4', { className: 'suggested-title' }, '⚡ Suggested Terminal Commands to Try:'),
        Sanitizer.createElement('div', { className: 'suggested-chips' }, 
          currentLesson.suggestedCommands.map(cmd => {
            return Sanitizer.createElement('button', {
              className: 'cmd-chip',
              title: 'Run this command in the Terminal',
              onClick: () => {
                this.launchApp('terminal');
                sysEvents.emit('terminal:run', cmd);
              }
            }, [
              Sanitizer.createElement('span', { className: 'chip-icon' }, '▶'),
              Sanitizer.createElement('code', {}, cmd)
            ]);
          })
        )
      ]);
      contentBox.appendChild(suggestSection);
    }

    // Bottom Action Row
    const actionRow = Sanitizer.createElement('div', { className: 'lesson-action-row' });
    const markCompleteBtn = Sanitizer.createElement('button', {
      className: `btn-complete ${isComplete ? 'is-done' : ''}`,
      onClick: () => {
        this.progress.markLessonComplete(currentLesson.id, currentLesson.badge);
        this.renderRoadmap();
      }
    }, isComplete ? '✔ Lesson Completed (+50 pts)' : 'Mark as Complete (+50 pts & Badge)');

    const openTerminalBtn = Sanitizer.createElement('button', {
      className: 'btn-open-terminal',
      onClick: () => this.launchApp('terminal')
    }, '💻 Open Terminal Workspace');

    actionRow.appendChild(markCompleteBtn);
    actionRow.appendChild(openTerminalBtn);

    detailCol.appendChild(detailHeader);
    detailCol.appendChild(contentBox);
    detailCol.appendChild(actionRow);

    layout.appendChild(listCol);
    layout.appendChild(detailCol);
    this.contentArea.appendChild(layout);
  }

  renderMarkdown(text, container) {
    const rawParagraphs = text.trim().split(/\n\s*\n/);
    for (const rawP of rawParagraphs) {
      const trimmed = rawP.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('### ')) {
        container.appendChild(Sanitizer.createElement('h3', { className: 'md-h3' }, trimmed.replace('### ', '')));
      } else if (trimmed.startsWith('```')) {
        // Code Block
        const lines = trimmed.split('\n');
        const codeLines = lines.slice(1, -1).join('\n');
        const codeBlock = Sanitizer.createElement('div', { className: 'md-code-block-wrapper' }, [
          Sanitizer.createElement('pre', { className: 'md-code-block' }, codeLines),
          Sanitizer.createElement('button', {
            className: 'code-run-btn',
            title: 'Run snippet in terminal',
            onClick: () => {
              this.launchApp('terminal');
              const firstCmd = codeLines.split('\n')[0].trim();
              if (firstCmd) sysEvents.emit('terminal:run', firstCmd);
            }
          }, '▶ Run in Terminal')
        ]);
        container.appendChild(codeBlock);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) {
        // List
        const ul = Sanitizer.createElement('ul', { className: 'md-ul' });
        for (const line of trimmed.split('\n')) {
          const cleanLine = line.replace(/^-\s+/, '').replace(/^\d+\.\s+/, '').trim();
          if (cleanLine) {
            const li = Sanitizer.createElement('li');
            this.formatInlineText(cleanLine, li);
            ul.appendChild(li);
          }
        }
        container.appendChild(ul);
      } else {
        const p = Sanitizer.createElement('p', { className: 'md-p' });
        this.formatInlineText(trimmed, p);
        container.appendChild(p);
      }
    }
  }

  formatInlineText(text, container) {
    // Regex for bold `**text**` and code `` `code` ``
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    for (const part of parts) {
      if (part.startsWith('`') && part.endsWith('`')) {
        container.appendChild(Sanitizer.createElement('code', { className: 'md-inline-code' }, part.slice(1, -1)));
      } else if (part.startsWith('**') && part.endsWith('**')) {
        container.appendChild(Sanitizer.createElement('strong', { className: 'md-strong' }, part.slice(2, -2)));
      } else if (part) {
        container.appendChild(document.createTextNode(part));
      }
    }
  }

  renderChallenges() {
    this.contentArea.innerHTML = '';
    const wrapper = Sanitizer.createElement('div', { className: 'challenges-layout' });

    const headerBox = Sanitizer.createElement('div', { className: 'challenges-intro-header' }, [
      Sanitizer.createElement('h3', {}, '🎯 Hands-On Cybersecurity Practice Challenges'),
      Sanitizer.createElement('p', {}, 'Solve realistic security challenges in the simulated environment. Submit answers to earn points and badges!')
    ]);
    wrapper.appendChild(headerBox);

    const list = Sanitizer.createElement('div', { className: 'challenges-grid' });

    for (const c of ChallengesData) {
      const isSolved = this.progress.isChallengeComplete(c.id);
      const isHintVisible = this.revealedHints.has(c.id);

      const card = Sanitizer.createElement('div', {
        className: `challenge-card ${isSolved ? 'solved' : ''}`
      }, [
        Sanitizer.createElement('div', { className: 'challenge-header' }, [
          Sanitizer.createElement('span', { className: `ch-diff-badge diff-${c.difficulty.toLowerCase()}` }, c.difficulty),
          Sanitizer.createElement('span', { className: 'ch-points' }, `+${c.points} pts`),
          Sanitizer.createElement('span', { className: `ch-status ${isSolved ? 'status-solved' : 'status-pending'}` }, isSolved ? '✔ SOLVED' : '⏳ PENDING')
        ]),
        Sanitizer.createElement('h3', { className: 'ch-title' }, c.title),
        Sanitizer.createElement('p', { className: 'ch-desc' }, c.objective)
      ]);

      // Hint Toggle
      const hintWrapper = Sanitizer.createElement('div', { className: 'ch-hint-wrapper' });
      const hintToggleBtn = Sanitizer.createElement('button', {
        className: 'ch-hint-toggle',
        onClick: () => {
          if (this.revealedHints.has(c.id)) {
            this.revealedHints.delete(c.id);
          } else {
            this.revealedHints.add(c.id);
          }
          this.renderChallenges();
        }
      }, isHintVisible ? '🙈 Hide Hint' : '💡 Reveal Hint');

      hintWrapper.appendChild(hintToggleBtn);

      if (isHintVisible) {
        const hintBox = Sanitizer.createElement('div', { className: 'ch-hint-box' }, [
          Sanitizer.createElement('span', { className: 'hint-text' }, c.hint),
          Sanitizer.createElement('button', {
            className: 'hint-run-btn',
            title: 'Run hint in terminal',
            onClick: () => {
              this.launchApp('terminal');
              const cmdMatch = c.hint.match(/Run:\s*(.+)$/);
              if (cmdMatch) sysEvents.emit('terminal:run', cmdMatch[1].trim());
            }
          }, '▶ Try in Terminal')
        ]);
        hintWrapper.appendChild(hintBox);
      }
      card.appendChild(hintWrapper);

      if (!isSolved) {
        const inputRow = Sanitizer.createElement('div', { className: 'ch-input-row' });
        const answerInput = Sanitizer.createElement('input', {
          type: 'text',
          className: 'ch-input',
          placeholder: 'Enter flag, IP, or answer...',
          maxlength: 256,
          onInput: (e) => {
            e.target.value = filterTextInput(e.target.value).slice(0, 256);
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter') submitBtn.click();
          }
        });

        const submitBtn = Sanitizer.createElement('button', {
          className: 'ch-submit-btn',
          onClick: () => {
            const val = answerInput.value.trim();
            if (val.toLowerCase() === c.solution.toLowerCase()) {
              this.progress.solveChallenge(c.id, c.points, c.badge);
              this.updateScorePill();
              this.renderChallenges();
            } else {
              sysEvents.emit('notify', {
                title: 'Answer Not Quite Right',
                message: 'Check the hint or verify your findings in the terminal.',
                type: 'error'
              });
            }
          }
        }, 'Submit Answer');

        inputRow.appendChild(answerInput);
        inputRow.appendChild(submitBtn);
        card.appendChild(inputRow);
      } else {
        const solvedBadge = Sanitizer.createElement('div', { className: 'ch-solved-banner' }, [
          Sanitizer.createElement('span', {}, `✔ Answer verified: ${c.solution} (+${c.points} pts)`),
          Sanitizer.createElement('span', { className: 'earned-badge-tag' }, `Earned Badge: ${c.badge}`)
        ]);
        card.appendChild(solvedBadge);
      }

      list.appendChild(card);
    }

    wrapper.appendChild(list);
    this.contentArea.appendChild(wrapper);
  }

  renderBadges() {
    this.contentArea.innerHTML = '';
    const wrapper = Sanitizer.createElement('div', { className: 'badges-layout' });

    const headerBox = Sanitizer.createElement('div', { className: 'badges-intro-header' }, [
      Sanitizer.createElement('h3', {}, '🏆 Achievements & Mastery Badges'),
      Sanitizer.createElement('p', {}, 'Unlock milestone badges as you complete lessons and ethical hacking challenges.')
    ]);
    wrapper.appendChild(headerBox);

    const badgesGrid = Sanitizer.createElement('div', { className: 'badges-grid' });
    const allBadges = [
      { name: 'Terminal Novice', icon: '🐣', desc: 'Mastered Week 1: Linux fundamentals & filesystem navigation' },
      { name: 'Permission Master', icon: '🛡️', desc: 'Mastered Week 2: Linux POSIX permissions & SUID mechanics' },
      { name: 'Network Scout', icon: '📡', desc: 'Mastered Week 3: Network interfaces, routing, and DNS enumeration' },
      { name: 'Automation Wizard', icon: '📜', desc: 'Mastered Week 4: Shell pipes, regex, sed, and awk scripting' },
      { name: 'Log Sleuth', icon: '🔍', desc: 'Mastered Week 5: Investigated Linux authentication security logs' },
      { name: 'Vulnerability Hunter', icon: '🎯', desc: 'Mastered Week 6: Web discovery and vulnerability scanning' },
      { name: 'Privilege Escalator', icon: '⚡', desc: 'Mastered Week 7: SUID privilege escalation and forensics' },
      { name: 'Cloud Defender', icon: '☁️', desc: 'Mastered Week 8: Containers & modern cloud security auditing' },
      { name: 'Log Detective', icon: '🕵️', desc: 'Solved Challenge: Tracked down rogue attacker IP in auth.log' },
      { name: 'SUID Hunter', icon: '🏹', desc: 'Solved Challenge: Located vulnerable SUID find binary' },
      { name: 'Port Scanner', icon: '⚡', desc: 'Solved Challenge: Enumerated vulnerable FTP version on lab host' },
      { name: 'Hash Breaker', icon: '💥', desc: 'Solved Challenge: Cracked student shadow password hash' },
      { name: 'Content Discoverer', icon: '📁', desc: 'Solved Challenge: Discovered hidden backup directory with Gobuster' }
    ];

    for (const b of allBadges) {
      const hasEarned = this.progress.badges.has(b.name);
      const card = Sanitizer.createElement('div', {
        className: `badge-card ${hasEarned ? 'unlocked' : 'locked'}`
      }, [
        Sanitizer.createElement('div', { className: 'badge-icon-box' }, [
          Sanitizer.createElement('div', { className: 'badge-icon' }, b.icon)
        ]),
        Sanitizer.createElement('div', { className: 'badge-name' }, b.name),
        Sanitizer.createElement('div', { className: 'badge-desc' }, b.desc),
        Sanitizer.createElement('div', { className: `badge-status ${hasEarned ? 'unlocked-text' : 'locked-text'}` }, hasEarned ? '✔ Unlocked' : '🔒 Locked')
      ]);
      badgesGrid.appendChild(card);
    }

    wrapper.appendChild(badgesGrid);
    this.contentArea.appendChild(wrapper);
  }

  setupListeners() {
    sysEvents.on('progress:updated', (stats) => {
      this.updateScorePill();
    });
  }
}

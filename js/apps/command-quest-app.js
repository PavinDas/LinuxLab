import { Sanitizer } from '../security/sanitizer.js';
import { filterTextInput } from '../security/input-validation.js';
import { sysEvents } from '../core/event-bus.js';
import { QuestChallengesData, QUEST_BADGES } from '../learning/quest-challenges.js';

/**
 * CommandQuestApp
 *
 * Polished, interactive CTF learning laboratory embedded directly into Panda OS.
 * Features progressive command challenges, hidden tiered hints, flag submission,
 * real-time virtual filesystem integration, and comprehensive post-solve command summaries.
 */
export class CommandQuestApp {
  constructor(progressManager, vfs, users, appLauncherCallback, dialogManager) {
    this.progress = progressManager;
    this.vfs = vfs;
    this.users = users;
    this.launchApp = appLauncherCallback;
    this.dialogs = dialogManager;

    this.activeTab = 'challenges'; // 'challenges' | 'badges' | 'reference'
    this.selectedChallengeId = this.progress.getCurrentChallengeId() || QuestChallengesData[0].id;
    this.searchQuery = '';
    this.selectedDifficulty = 'All';
    this.selectedStatusFilter = 'All'; // 'All' | 'Available' | 'Completed' | 'Locked'
    this.feedbackState = null; // { type: 'success' | 'error', message: string }
  }

  createUI() {
    this.container = Sanitizer.createElement('div', { className: 'quest-container' });

    // 1. Top Application Header
    const header = Sanitizer.createElement('div', { className: 'quest-header' });

    const titleGroup = Sanitizer.createElement('div', { className: 'quest-title-group' }, [
      Sanitizer.createElement('div', { className: 'quest-logo-icon' }, '🚩'),
      Sanitizer.createElement('div', { className: 'quest-title-text' }, [
        Sanitizer.createElement('h2', { className: 'quest-main-title' }, 'Linux Command Quest'),
        Sanitizer.createElement('span', { className: 'quest-subtitle' }, 'Progressive CTF Learning Lab')
      ])
    ]);

    const tabsGroup = Sanitizer.createElement('div', { className: 'quest-nav-tabs' });
    this.tabChallengesBtn = Sanitizer.createElement('button', {
      className: `quest-tab-btn ${this.activeTab === 'challenges' ? 'active' : ''}`,
      onClick: () => this.switchTab('challenges')
    }, '🎯 Challenges');

    this.tabBadgesBtn = Sanitizer.createElement('button', {
      className: `quest-tab-btn ${this.activeTab === 'badges' ? 'active' : ''}`,
      onClick: () => this.switchTab('badges')
    }, '🏆 Achievements');

    this.tabRefBtn = Sanitizer.createElement('button', {
      className: `quest-tab-btn ${this.activeTab === 'reference' ? 'active' : ''}`,
      onClick: () => this.switchTab('reference')
    }, '📖 Command Syllabus');

    tabsGroup.appendChild(this.tabChallengesBtn);
    tabsGroup.appendChild(this.tabBadgesBtn);
    tabsGroup.appendChild(this.tabRefBtn);

    const statsGroup = Sanitizer.createElement('div', { className: 'quest-header-stats' });
    
    // Overall progress pill & bar
    this.progSummary = Sanitizer.createElement('div', { className: 'quest-prog-summary' });
    this.scorePill = Sanitizer.createElement('div', { className: 'quest-score-pill' });
    this.updateStatsUI();

    const resetBtn = Sanitizer.createElement('button', {
      className: 'quest-reset-btn',
      title: 'Reset CTF Progress (Does not affect user files or system preferences)',
      onClick: () => this.promptResetProgress()
    }, '🔄 Reset Quest');

    statsGroup.appendChild(this.progSummary);
    statsGroup.appendChild(this.scorePill);
    statsGroup.appendChild(resetBtn);

    header.appendChild(titleGroup);
    header.appendChild(tabsGroup);
    header.appendChild(statsGroup);

    // 2. Main Content Body Area
    this.contentBody = Sanitizer.createElement('div', { className: 'quest-content-body' });

    this.container.appendChild(header);
    this.container.appendChild(this.contentBody);

    this.renderCurrentTab();
    this.setupListeners();

    return this.container;
  }

  updateStatsUI() {
    const stats = this.progress.getStats();
    this.progSummary.innerHTML = '';
    const progLabel = Sanitizer.createElement('span', { className: 'quest-prog-label' }, 
      `${stats.completedChallengesCount} / ${stats.totalChallengesCount} Solved (${stats.percentComplete}%)`
    );
    const progTrack = Sanitizer.createElement('div', { className: 'quest-prog-track' });
    const progFill = Sanitizer.createElement('div', {
      className: 'quest-prog-fill',
      style: { width: `${stats.percentComplete}%` }
    });
    progTrack.appendChild(progFill);
    this.progSummary.appendChild(progLabel);
    this.progSummary.appendChild(progTrack);

    this.scorePill.textContent = `⭐ ${stats.score} Pts`;
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.tabChallengesBtn.classList.toggle('active', tab === 'challenges');
    this.tabBadgesBtn.classList.toggle('active', tab === 'badges');
    this.tabRefBtn.classList.toggle('active', tab === 'reference');
    this.feedbackState = null;
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    this.contentBody.innerHTML = '';
    if (this.activeTab === 'challenges') {
      this.renderChallengesView();
    } else if (this.activeTab === 'badges') {
      this.renderBadgesView();
    } else if (this.activeTab === 'reference') {
      this.renderReferenceView();
    }
  }

  // =========================================================================
  // CHALLENGES VIEW (2-column layout: Sidebar list + Detail investigation)
  // =========================================================================
  renderChallengesView() {
    const layout = Sanitizer.createElement('div', { className: 'quest-challenges-layout' });

    // Left Column: Challenge Listing & Filters
    const sidebar = Sanitizer.createElement('div', { className: 'quest-sidebar' });

    // Filter controls
    const filterCard = Sanitizer.createElement('div', { className: 'quest-filter-card' });
    const searchInput = Sanitizer.createElement('input', {
      type: 'text',
      className: 'quest-search-input',
      placeholder: 'Search challenges or commands...',
      value: this.searchQuery,
      maxlength: 64,
      onInput: (e) => {
        this.searchQuery = filterTextInput(e.target.value);
        this.renderChallengeList();
      }
    });

    const filterRow = Sanitizer.createElement('div', { className: 'quest-filter-row' });
    const diffSelect = Sanitizer.createElement('select', {
      className: 'quest-diff-select',
      onChange: (e) => {
        this.selectedDifficulty = e.target.value;
        this.renderChallengeList();
      }
    }, [
      Sanitizer.createElement('option', { value: 'All' }, 'All Difficulties'),
      Sanitizer.createElement('option', { value: 'Beginner' }, 'Beginner'),
      Sanitizer.createElement('option', { value: 'Easy' }, 'Easy'),
      Sanitizer.createElement('option', { value: 'Intermediate' }, 'Intermediate'),
      Sanitizer.createElement('option', { value: 'Advanced' }, 'Advanced'),
      Sanitizer.createElement('option', { value: 'Expert' }, 'Expert')
    ]);
    diffSelect.value = this.selectedDifficulty;

    const statusSelect = Sanitizer.createElement('select', {
      className: 'quest-status-select',
      onChange: (e) => {
        this.selectedStatusFilter = e.target.value;
        this.renderChallengeList();
      }
    }, [
      Sanitizer.createElement('option', { value: 'All' }, 'All Status'),
      Sanitizer.createElement('option', { value: 'Available' }, 'Available (Unlocked)'),
      Sanitizer.createElement('option', { value: 'Completed' }, 'Completed'),
      Sanitizer.createElement('option', { value: 'Locked' }, 'Locked')
    ]);
    statusSelect.value = this.selectedStatusFilter;

    filterRow.appendChild(diffSelect);
    filterRow.appendChild(statusSelect);

    filterCard.appendChild(searchInput);
    filterCard.appendChild(filterRow);
    sidebar.appendChild(filterCard);

    // Challenges Scroll List Container
    this.listContainer = Sanitizer.createElement('div', { className: 'quest-list-container' });
    sidebar.appendChild(this.listContainer);

    // Right Column: Challenge Investigation & Flag Submission
    this.detailContainer = Sanitizer.createElement('div', { className: 'quest-detail-container' });

    layout.appendChild(sidebar);
    layout.appendChild(this.detailContainer);
    this.contentBody.appendChild(layout);

    this.renderChallengeList();
    this.renderChallengeDetail();
  }

  renderChallengeList() {
    this.listContainer.innerHTML = '';

    const query = this.searchQuery.toLowerCase().trim();
    const filtered = QuestChallengesData.filter((ch) => {
      // Difficulty filter
      if (this.selectedDifficulty !== 'All' && ch.difficulty !== this.selectedDifficulty) {
        return false;
      }
      // Status filter
      const isCompleted = this.progress.isChallengeCompleted(ch.id);
      const isUnlocked = this.progress.isChallengeUnlocked(ch.id);
      if (this.selectedStatusFilter === 'Completed' && !isCompleted) return false;
      if (this.selectedStatusFilter === 'Available' && (!isUnlocked || isCompleted)) return false;
      if (this.selectedStatusFilter === 'Locked' && isUnlocked) return false;

      // Search query
      if (query) {
        const matchTitle = ch.title.toLowerCase().includes(query);
        const matchCmd = ch.command.toLowerCase().includes(query);
        const matchDesc = ch.mission.toLowerCase().includes(query);
        const matchTags = ch.tags.some(t => t.toLowerCase().includes(query));
        if (!matchTitle && !matchCmd && !matchDesc && !matchTags) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      this.listContainer.appendChild(
        Sanitizer.createElement('div', { className: 'quest-empty-search' }, 'No challenges match the active filters.')
      );
      return;
    }

    for (const ch of filtered) {
      const isCompleted = this.progress.isChallengeCompleted(ch.id);
      const isUnlocked = this.progress.isChallengeUnlocked(ch.id);
      const isSelected = ch.id === this.selectedChallengeId;

      let statusIcon = '🔒';
      let statusClass = 'locked';
      let statusText = 'Locked';

      if (isCompleted) {
        statusIcon = '✔';
        statusClass = 'completed';
        statusText = 'Completed';
      } else if (isUnlocked) {
        statusIcon = '🔓';
        statusClass = 'available';
        statusText = 'Available';
      }

      const card = Sanitizer.createElement('div', {
        className: `quest-card-item ${statusClass} ${isSelected ? 'selected' : ''}`,
        tabIndex: isUnlocked ? 0 : -1,
        role: 'button',
        ariaLabel: `${ch.title} - ${statusText}`,
        onClick: () => {
          if (isUnlocked || isCompleted) {
            this.selectedChallengeId = ch.id;
            this.progress.setCurrentChallengeId(ch.id);
            this.feedbackState = null;
            this.renderChallengeList();
            this.renderChallengeDetail();
          }
        }
      });

      const topRow = Sanitizer.createElement('div', { className: 'quest-card-top-row' }, [
        Sanitizer.createElement('span', { className: 'quest-num-tag' }, `#${ch.number.toString().padStart(2, '0')}`),
        Sanitizer.createElement('span', { className: `quest-diff-badge diff-${ch.difficulty.toLowerCase()}` }, ch.difficulty),
        Sanitizer.createElement('span', { className: 'quest-pts-tag' }, `+${ch.points} pts`),
        Sanitizer.createElement('span', { className: `quest-status-icon icon-${statusClass}` }, statusIcon)
      ]);

      const titleEl = Sanitizer.createElement('div', { className: 'quest-card-title' }, ch.title);
      const cmdTag = Sanitizer.createElement('div', { className: 'quest-card-cmd' }, [
        Sanitizer.createElement('span', { className: 'cmd-label' }, 'Learning: '),
        Sanitizer.createElement('code', { className: 'cmd-inline' }, ch.command)
      ]);

      card.appendChild(topRow);
      card.appendChild(titleEl);
      card.appendChild(cmdTag);

      this.listContainer.appendChild(card);
    }
  }

  // =========================================================================
  // CHALLENGE DETAIL & INVESTIGATION VIEW
  // =========================================================================
  renderChallengeDetail() {
    this.detailContainer.innerHTML = '';

    const ch = QuestChallengesData.find(c => c.id === this.selectedChallengeId);
    if (!ch) return;

    const isCompleted = this.progress.isChallengeCompleted(ch.id);
    const isUnlocked = this.progress.isChallengeUnlocked(ch.id);

    // Detail Header
    const detailHeader = Sanitizer.createElement('div', { className: 'quest-detail-header' });
    const metaRow = Sanitizer.createElement('div', { className: 'quest-detail-meta-row' }, [
      Sanitizer.createElement('span', { className: `quest-diff-badge diff-${ch.difficulty.toLowerCase()}` }, ch.difficulty),
      Sanitizer.createElement('span', { className: 'quest-pill cat-pill' }, `📁 ${ch.category}`),
      Sanitizer.createElement('span', { className: 'quest-pill pts-pill' }, `⭐ ${ch.points} Points`),
      Sanitizer.createElement('span', { className: 'quest-pill time-pill' }, `⏱️ ~${ch.estimatedMinutes} mins`)
    ]);

    const titleH1 = Sanitizer.createElement('h1', { className: 'quest-detail-title' }, ch.title);

    let statusPill;
    if (isCompleted) {
      statusPill = Sanitizer.createElement('span', { className: 'quest-status-badge status-completed' }, '✔ Challenge Solved');
    } else if (isUnlocked) {
      statusPill = Sanitizer.createElement('span', { className: 'quest-status-badge status-available' }, '🔓 In Progress');
    } else {
      statusPill = Sanitizer.createElement('span', { className: 'quest-status-badge status-locked' }, '🔒 Locked — Solve previous challenges to unlock');
    }

    detailHeader.appendChild(metaRow);
    detailHeader.appendChild(titleH1);
    detailHeader.appendChild(statusPill);
    this.detailContainer.appendChild(detailHeader);

    // If locked, show locked barrier
    if (!isUnlocked && !isCompleted) {
      const lockedCard = Sanitizer.createElement('div', { className: 'quest-locked-notice' }, [
        Sanitizer.createElement('div', { className: 'locked-icon' }, '🔒'),
        Sanitizer.createElement('h3', {}, 'Challenge Locked'),
        Sanitizer.createElement('p', {}, 'Complete the previous challenge in the curriculum to unlock this investigation.')
      ]);
      this.detailContainer.appendChild(lockedCard);
      return;
    }

    // Mission Briefing Box
    const missionBox = Sanitizer.createElement('div', { className: 'quest-box quest-mission-box' }, [
      Sanitizer.createElement('div', { className: 'quest-box-title' }, '📋 Mission Briefing'),
      Sanitizer.createElement('p', { className: 'quest-mission-text' }, ch.mission),
      Sanitizer.createElement('div', { className: 'quest-objective-row' }, [
        Sanitizer.createElement('strong', {}, 'Target Objective: '),
        Sanitizer.createElement('span', {}, ch.objective)
      ])
    ]);

    // Starting Directory & Environment Action
    const envBox = Sanitizer.createElement('div', { className: 'quest-box quest-env-box' }, [
      Sanitizer.createElement('div', { className: 'quest-env-info' }, [
        Sanitizer.createElement('span', { className: 'env-label' }, 'Starting Directory: '),
        Sanitizer.createElement('code', { className: 'env-path' }, ch.startingDirectory)
      ]),
      Sanitizer.createElement('button', {
        className: 'quest-jump-btn',
        title: 'Open Terminal in this directory',
        onClick: () => this.jumpToDirectory(ch.startingDirectory)
      }, '💻 Open in Terminal')
    ]);

    // Learning tags
    if (Array.isArray(ch.tags) && ch.tags.length > 0) {
      const tagsRow = Sanitizer.createElement('div', { className: 'quest-tags-row' }, [
        Sanitizer.createElement('span', { className: 'tags-title' }, 'Key Concepts: ')
      ]);
      for (const t of ch.tags) {
        tagsRow.appendChild(Sanitizer.createElement('span', { className: 'quest-tag-chip' }, `#${t}`));
      }
      missionBox.appendChild(tagsRow);
    }

    this.detailContainer.appendChild(missionBox);
    this.detailContainer.appendChild(envBox);

    // Progressive Hidden Hints Section
    this.renderHintsSection(ch);

    // Flag Submission Section
    this.renderSubmissionSection(ch, isCompleted);

    // Post-solve Command Learning Summary
    if (isCompleted && ch.learningSummary) {
      this.renderLearningSummary(ch);
    }

    // Navigation between challenges
    this.renderNavFooter(ch);
  }

  // =========================================================================
  // PROGRESSIVE HIDDEN HINTS SECTION
  // =========================================================================
  renderHintsSection(ch) {
    const revealed = this.progress.getRevealedHints(ch.id);
    const hintsBox = Sanitizer.createElement('div', { className: 'quest-box quest-hints-box' });

    const hintsHeader = Sanitizer.createElement('div', { className: 'quest-box-title hints-header' }, [
      Sanitizer.createElement('span', {}, '💡 Progressive Hints'),
      Sanitizer.createElement('span', { className: 'hints-counter' }, `Hints revealed: ${revealed.length} / ${ch.hints.length}`)
    ]);
    hintsBox.appendChild(hintsHeader);

    const hintsList = Sanitizer.createElement('div', { className: 'quest-hints-list' });

    ch.hints.forEach((hint) => {
      const isRevealed = revealed.includes(hint.id);
      const hintItem = Sanitizer.createElement('div', {
        className: `quest-hint-item ${isRevealed ? 'revealed' : 'hidden'}`
      });

      if (!isRevealed) {
        // Hidden button
        const revealBtn = Sanitizer.createElement('button', {
          className: 'quest-reveal-hint-btn',
          onClick: () => {
            this.progress.revealHint(ch.id, hint.id);
            this.renderChallengeDetail();
          }
        }, [
          Sanitizer.createElement('span', { className: 'btn-icon' }, '👁️'),
          Sanitizer.createElement('span', {}, `Reveal ${hint.title}`)
        ]);
        hintItem.appendChild(revealBtn);
      } else {
        // Revealed content
        const hintTitle = Sanitizer.createElement('div', { className: 'quest-hint-title' }, hint.title);
        const hintText = Sanitizer.createElement('p', { className: 'quest-hint-text' }, hint.text);
        hintItem.appendChild(hintTitle);
        hintItem.appendChild(hintText);
      }

      hintsList.appendChild(hintItem);
    });

    hintsBox.appendChild(hintsList);
    this.detailContainer.appendChild(hintsBox);
  }

  // =========================================================================
  // FLAG SUBMISSION SECTION
  // =========================================================================
  renderSubmissionSection(ch, isCompleted) {
    const submitBox = Sanitizer.createElement('div', { className: 'quest-box quest-submit-box' });
    const title = Sanitizer.createElement('div', { className: 'quest-box-title' }, '🚩 Flag Submission');
    submitBox.appendChild(title);

    if (isCompleted) {
      const solvedBanner = Sanitizer.createElement('div', { className: 'quest-solved-banner' }, [
        Sanitizer.createElement('div', { className: 'solved-icon' }, '🎉'),
        Sanitizer.createElement('div', { className: 'solved-info' }, [
          Sanitizer.createElement('div', { className: 'solved-title' }, 'Challenge Solved!'),
          Sanitizer.createElement('div', { className: 'solved-flag' }, [
            Sanitizer.createElement('span', {}, 'Verified Flag: '),
            Sanitizer.createElement('code', {}, ch.flag)
          ])
        ])
      ]);
      submitBox.appendChild(solvedBanner);
    } else {
      const form = Sanitizer.createElement('form', {
        className: 'quest-submit-form',
        onSubmit: (e) => {
          e.preventDefault();
          this.handleFlagSubmit(ch);
        }
      });

      this.flagInput = Sanitizer.createElement('input', {
        type: 'text',
        className: 'quest-flag-input',
        placeholder: 'Enter retrieved flag: FLAG{...}',
        maxlength: 128,
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        onInput: (e) => {
          e.target.value = filterTextInput(e.target.value).slice(0, 128);
        }
      });

      const submitBtn = Sanitizer.createElement('button', {
        type: 'submit',
        className: 'quest-submit-btn'
      }, 'Submit Flag');

      form.appendChild(this.flagInput);
      form.appendChild(submitBtn);
      submitBox.appendChild(form);

      // Feedback message container
      this.feedbackContainer = Sanitizer.createElement('div', { className: 'quest-feedback-container' });
      if (this.feedbackState) {
        const fbEl = Sanitizer.createElement('div', {
          className: `quest-feedback-msg ${this.feedbackState.type}`
        }, this.feedbackState.message);
        this.feedbackContainer.appendChild(fbEl);
      }
      submitBox.appendChild(this.feedbackContainer);
    }

    this.detailContainer.appendChild(submitBox);
  }

  handleFlagSubmit(ch) {
    if (!this.flagInput) return;
    const submitted = this.flagInput.value.trim();

    if (!submitted) {
      this.feedbackState = { type: 'error', message: 'Please enter a flag before submitting.' };
      this.renderChallengeDetail();
      return;
    }

    // Case-sensitive validation with whitespace trimming
    if (submitted === ch.flag) {
      // Calculate hint bonus: 5 bonus points if no hints were used!
      const hintsUsed = this.progress.getRevealedHints(ch.id).length;
      const bonusPoints = hintsUsed === 0 ? 5 : 0;

      const ok = this.progress.solveChallenge(ch.id, submitted, ch.points, bonusPoints, ch.badge);
      if (ok) {
        this.feedbackState = {
          type: 'success',
          message: `✔ Correct flag! +${ch.points + bonusPoints} points earned.${bonusPoints > 0 ? ' (Includes +5 bonus for zero hints!)' : ''}`
        };
        this.updateStatsUI();
        this.renderChallengeList();
        this.renderChallengeDetail();
      }
    } else {
      this.progress.recordFailedSubmission(ch.id, submitted);
      this.feedbackState = {
        type: 'error',
        message: '✘ Incorrect flag. Double check case sensitivity or investigate the virtual system more closely.'
      };
      this.renderChallengeDetail();
      if (this.flagInput) {
        this.flagInput.focus();
        this.flagInput.classList.add('shake');
        setTimeout(() => this.flagInput && this.flagInput.classList.remove('shake'), 400);
      }
    }
  }

  // =========================================================================
  // POST-SOLVE COMMAND LEARNING SUMMARY
  // =========================================================================
  renderLearningSummary(ch) {
    const s = ch.learningSummary;
    if (!s) return;

    this.progress.markSummaryViewed(ch.id);

    const summaryBox = Sanitizer.createElement('div', { className: 'quest-box quest-summary-box' });
    const title = Sanitizer.createElement('div', { className: 'quest-box-title summary-title' }, [
      Sanitizer.createElement('span', {}, `🎓 Command Learning Summary: ${s.commandName}`),
      Sanitizer.createElement('button', {
        className: 'quest-ref-link-btn',
        title: 'Open in Master Command Reference Catalog',
        onClick: () => this.launchApp('command-reference')
      }, '📖 Open Master Reference')
    ]);
    summaryBox.appendChild(title);

    const body = Sanitizer.createElement('div', { className: 'quest-summary-body' });

    // Purpose & Syntax
    const syntaxSection = Sanitizer.createElement('div', { className: 'summary-section' }, [
      Sanitizer.createElement('h4', {}, 'Purpose & Syntax'),
      Sanitizer.createElement('p', {}, s.purpose),
      Sanitizer.createElement('pre', { className: 'summary-code-block' }, s.syntax)
    ]);
    body.appendChild(syntaxSection);

    // Options introduced
    if (Array.isArray(s.optionsIntroduced) && s.optionsIntroduced.length > 0) {
      const optsSection = Sanitizer.createElement('div', { className: 'summary-section' }, [
        Sanitizer.createElement('h4', {}, 'Options & Modifiers Introduced')
      ]);
      const optsList = Sanitizer.createElement('ul', { className: 'summary-options-list' });
      for (const opt of s.optionsIntroduced) {
        const li = Sanitizer.createElement('li', {}, [
          Sanitizer.createElement('code', { className: 'opt-code' }, opt.option),
          Sanitizer.createElement('span', { className: 'opt-desc' }, ` — ${opt.explanation}`)
        ]);
        optsList.appendChild(li);
      }
      optsSection.appendChild(optsList);
      body.appendChild(optsSection);
    }

    // Example Usage & Output
    const exampleSection = Sanitizer.createElement('div', { className: 'summary-section' }, [
      Sanitizer.createElement('h4', {}, 'Example Usage & Output'),
      Sanitizer.createElement('div', { className: 'summary-terminal-preview' }, [
        Sanitizer.createElement('div', { className: 'term-line-cmd' }, `$ ${s.exampleUsage}`),
        Sanitizer.createElement('div', { className: 'term-line-out' }, s.exampleOutput)
      ])
    ]);
    body.appendChild(exampleSection);

    // Practical Application
    if (s.practicalApplication) {
      const appSection = Sanitizer.createElement('div', { className: 'summary-section' }, [
        Sanitizer.createElement('h4', {}, 'Real-World Practical Application'),
        Sanitizer.createElement('p', {}, s.practicalApplication)
      ]);
      body.appendChild(appSection);
    }

    // Common Mistakes
    if (Array.isArray(s.commonMistakes) && s.commonMistakes.length > 0) {
      const mistakesSection = Sanitizer.createElement('div', { className: 'summary-section mistakes-section' }, [
        Sanitizer.createElement('h4', {}, '⚠️ Common Mistakes to Avoid')
      ]);
      const ul = Sanitizer.createElement('ul', { className: 'summary-mistakes-list' });
      for (const m of s.commonMistakes) {
        ul.appendChild(Sanitizer.createElement('li', {}, m));
      }
      mistakesSection.appendChild(ul);
      body.appendChild(mistakesSection);
    }

    summaryBox.appendChild(body);
    this.detailContainer.appendChild(summaryBox);
  }

  // =========================================================================
  // NAVIGATION FOOTER (Previous / Next Challenge)
  // =========================================================================
  renderNavFooter(currentCh) {
    const currentIndex = QuestChallengesData.findIndex(c => c.id === currentCh.id);
    const navFooter = Sanitizer.createElement('div', { className: 'quest-nav-footer' });

    // Previous button
    if (currentIndex > 0) {
      const prevCh = QuestChallengesData[currentIndex - 1];
      const prevBtn = Sanitizer.createElement('button', {
        className: 'quest-nav-btn prev-btn',
        onClick: () => {
          this.selectedChallengeId = prevCh.id;
          this.feedbackState = null;
          this.renderChallengeList();
          this.renderChallengeDetail();
        }
      }, `← #${prevCh.number} ${prevCh.title}`);
      navFooter.appendChild(prevBtn);
    } else {
      navFooter.appendChild(Sanitizer.createElement('div'));
    }

    // Next button
    if (currentIndex + 1 < QuestChallengesData.length) {
      const nextCh = QuestChallengesData[currentIndex + 1];
      const isNextUnlocked = this.progress.isChallengeUnlocked(nextCh.id);
      const nextBtn = Sanitizer.createElement('button', {
        className: `quest-nav-btn next-btn ${!isNextUnlocked ? 'disabled' : ''}`,
        disabled: !isNextUnlocked,
        title: isNextUnlocked ? `Go to ${nextCh.title}` : 'Solve current challenge to unlock next',
        onClick: () => {
          if (isNextUnlocked) {
            this.selectedChallengeId = nextCh.id;
            this.progress.setCurrentChallengeId(nextCh.id);
            this.feedbackState = null;
            this.renderChallengeList();
            this.renderChallengeDetail();
          }
        }
      }, isNextUnlocked ? `Next: #${nextCh.number} ${nextCh.title} →` : `🔒 Next: #${nextCh.number} (Locked)`);
      navFooter.appendChild(nextBtn);
    }

    this.detailContainer.appendChild(navFooter);
  }

  // =========================================================================
  // DIRECTORY JUMP TO TERMINAL
  // =========================================================================
  jumpToDirectory(targetDir) {
    // 1. Emit chdir event
    sysEvents.emit('terminal:run', `cd "${targetDir}" && clear`);
  }

  // =========================================================================
  // ACHIEVEMENTS / BADGES TAB
  // =========================================================================
  renderBadgesView() {
    const container = Sanitizer.createElement('div', { className: 'quest-tab-view quest-badges-view' });

    const header = Sanitizer.createElement('div', { className: 'quest-view-header' }, [
      Sanitizer.createElement('h3', {}, '🏆 Cybersecurity Milestones & Badges'),
      Sanitizer.createElement('p', {}, 'Earn achievements as you solve progressive CTF challenges and master Linux system operations.')
    ]);
    container.appendChild(header);

    const grid = Sanitizer.createElement('div', { className: 'quest-badges-grid' });
    const earnedBadges = new Set(this.progress.getStats().badges);

    for (const b of QUEST_BADGES) {
      const isEarned = earnedBadges.has(b.id);
      const card = Sanitizer.createElement('div', {
        className: `quest-badge-card ${isEarned ? 'earned' : 'locked'}`
      }, [
        Sanitizer.createElement('div', { className: 'badge-icon-box' }, [
          Sanitizer.createElement('span', { className: 'badge-icon' }, b.icon)
        ]),
        Sanitizer.createElement('div', { className: 'badge-name' }, b.name),
        Sanitizer.createElement('div', { className: 'badge-desc' }, b.description),
        Sanitizer.createElement('div', { className: `badge-status-tag ${isEarned ? 'tag-earned' : 'tag-locked'}` },
          isEarned ? '✔ Unlocked' : `🔒 ${b.requirement}`
        )
      ]);
      grid.appendChild(card);
    }

    container.appendChild(grid);
    this.contentBody.appendChild(container);
  }

  // =========================================================================
  // COMMAND SYLLABUS REFERENCE TAB
  // =========================================================================
  renderReferenceView() {
    const container = Sanitizer.createElement('div', { className: 'quest-tab-view quest-ref-view' });

    const header = Sanitizer.createElement('div', { className: 'quest-view-header' }, [
      Sanitizer.createElement('h3', {}, '📖 Linux Command Quest Curriculum Syllabus'),
      Sanitizer.createElement('p', {}, 'Progressive command sequence taught across the 25 challenges, mapped from the Linux Command Master List.')
    ]);
    container.appendChild(header);

    const tableCard = Sanitizer.createElement('div', { className: 'quest-table-card' });
    const table = Sanitizer.createElement('table', { className: 'quest-syllabus-table' });

    const thead = Sanitizer.createElement('thead', {}, [
      Sanitizer.createElement('tr', {}, [
        Sanitizer.createElement('th', {}, '#'),
        Sanitizer.createElement('th', {}, 'Command'),
        Sanitizer.createElement('th', {}, 'Level'),
        Sanitizer.createElement('th', {}, 'Category'),
        Sanitizer.createElement('th', {}, 'Status'),
        Sanitizer.createElement('th', {}, 'Action')
      ])
    ]);

    const tbody = Sanitizer.createElement('tbody');

    for (const ch of QuestChallengesData) {
      const isCompleted = this.progress.isChallengeCompleted(ch.id);
      const isUnlocked = this.progress.isChallengeUnlocked(ch.id);

      const tr = Sanitizer.createElement('tr', {
        className: isCompleted ? 'row-completed' : (isUnlocked ? 'row-unlocked' : 'row-locked')
      }, [
        Sanitizer.createElement('td', {}, `#${ch.number}`),
        Sanitizer.createElement('td', {}, [
          Sanitizer.createElement('code', { className: 'cmd-badge' }, ch.command)
        ]),
        Sanitizer.createElement('td', {}, [
          Sanitizer.createElement('span', { className: `quest-diff-badge diff-${ch.difficulty.toLowerCase()}` }, ch.difficulty)
        ]),
        Sanitizer.createElement('td', {}, ch.category),
        Sanitizer.createElement('td', {}, isCompleted ? '✔ Completed' : (isUnlocked ? '🔓 Available' : '🔒 Locked')),
        Sanitizer.createElement('td', {}, [
          Sanitizer.createElement('button', {
            className: 'quest-table-jump-btn',
            disabled: !isUnlocked && !isCompleted,
            onClick: () => {
              this.selectedChallengeId = ch.id;
              this.switchTab('challenges');
            }
          }, 'Go to Lab')
        ])
      ]);

      tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableCard.appendChild(table);
    container.appendChild(tableCard);

    this.contentBody.appendChild(container);
  }

  // =========================================================================
  // RESET PROGRESS PROMPT
  // =========================================================================
  async promptResetProgress() {
    if (this.dialogs) {
      const confirmed = await this.dialogs.confirm({
        title: 'Reset CTF Progress?',
        message: 'Are you sure you want to reset your Linux Command Quest progress? This will reset your score, flags, and completed challenges back to Challenge 01.\n\nNote: Your user files, created scripts, wallpaper, and system preferences will NOT be affected.'
      });
      if (confirmed) {
        this.progress.reset();
        this.selectedChallengeId = QuestChallengesData[0].id;
        this.feedbackState = null;
        this.updateStatsUI();
        this.renderCurrentTab();
      }
    } else {
      if (window.confirm('Reset Linux Command Quest progress? This will not affect user files or system preferences.')) {
        this.progress.reset();
        this.selectedChallengeId = QuestChallengesData[0].id;
        this.feedbackState = null;
        this.updateStatsUI();
        this.renderCurrentTab();
      }
    }
  }

  setupListeners() {
    sysEvents.on('progress:updated', () => {
      this.updateStatsUI();
      if (this.activeTab === 'challenges') {
        this.renderChallengeList();
      }
    });

    sysEvents.on('ctf:reset', () => {
      this.updateStatsUI();
      this.renderCurrentTab();
    });
  }
}

/**
 * Expert for IELTS — Study Progress & Module Completion Tracker
 * 
 * Provides client-side progress tracking, completed lesson badges,
 * progress bar visualization, and auto-resume memory.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STORAGE & STATE MANAGEMENT
  // =========================================================================
  const STORAGE_PREFIX = 'neo_ielts_progress_';
  const LAST_LESSON_PREFIX = 'neo_ielts_last_lesson_';

  function getCurrentLevelKey() {
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/').toLowerCase();
    if (path.includes('expert 5') || path.includes('expert-5')) return 'expert-5';
    if (path.includes('expert 6') || path.includes('expert-6')) return 'expert-6';
    if (path.includes('expert 7.5') || path.includes('expert-75') || path.includes('expert 75')) return 'expert-75';
    return null;
  }

  function getCompletedSet(levelKey) {
    if (!levelKey) return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + levelKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn('StudyProgress: Could not read progress from localStorage', e);
      return new Set();
    }
  }

  function saveCompletedSet(levelKey, set) {
    if (!levelKey) return;
    try {
      const arr = Array.from(set);
      localStorage.setItem(STORAGE_PREFIX + levelKey, JSON.stringify(arr));
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(new CustomEvent('study-progress-updated', { detail: { levelKey, completedCount: arr.length } }));
    } catch (e) {
      console.warn('StudyProgress: Could not save progress to localStorage', e);
    }
  }

  function isModuleCompleted(levelKey, url) {
    if (!levelKey || !url) return false;
    const cleanUrl = url.split('/').pop().split('?')[0];
    const set = getCompletedSet(levelKey);
    return set.has(cleanUrl);
  }

  function toggleModuleCompleted(levelKey, url) {
    if (!levelKey || !url) return false;
    const cleanUrl = url.split('/').pop().split('?')[0];
    const set = getCompletedSet(levelKey);
    const wasCompleted = set.has(cleanUrl);

    if (wasCompleted) {
      set.delete(cleanUrl);
    } else {
      set.add(cleanUrl);
    }

    saveCompletedSet(levelKey, set);
    return !wasCompleted;
  }

  function recordLastVisited(levelKey, moduleInfo) {
    if (!levelKey || !moduleInfo || !moduleInfo.url) return;
    try {
      const cleanUrl = moduleInfo.url.split('/').pop().split('?')[0];
      const data = {
        url: cleanUrl,
        title: moduleInfo.title || document.title,
        skill: moduleInfo.skill || 'lesson',
        timestamp: Date.now()
      };
      localStorage.setItem(LAST_LESSON_PREFIX + levelKey, JSON.stringify(data));
    } catch (e) { }
  }

  function getLastVisited(levelKey) {
    if (!levelKey) return null;
    try {
      const raw = localStorage.getItem(LAST_LESSON_PREFIX + levelKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getLevelDataset(levelKey) {
    if (levelKey === 'expert-5') return window.EXPERT_5_MODULES || [];
    if (levelKey === 'expert-6') return window.EXPERT_6_MODULES || [];
    if (levelKey === 'expert-75') return window.EXPERT_75_MODULES || [];
    return window.MODULES_DATA || [];
  }

  function calculateProgress(levelKey) {
    const dataset = getLevelDataset(levelKey);
    const completedSet = getCompletedSet(levelKey);

    const total = dataset.length;
    let completed = 0;
    const bySkill = {
      grammar: { total: 0, completed: 0, percent: 0 },
      reading: { total: 0, completed: 0, percent: 0 },
      writing: { total: 0, completed: 0, percent: 0 },
      review: { total: 0, completed: 0, percent: 0 }
    };

    dataset.forEach(item => {
      const cleanUrl = (item.url || '').split('/').pop().split('?')[0];
      const isDone = completedSet.has(cleanUrl);
      if (isDone) completed++;

      const skill = (item.skill || 'grammar').toLowerCase();
      if (bySkill[skill]) {
        bySkill[skill].total++;
        if (isDone) bySkill[skill].completed++;
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    for (const s in bySkill) {
      const g = bySkill[s];
      g.percent = g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0;
    }

    return { total, completed, percent, bySkill };
  }

  // =========================================================================
  // 2. DASHBOARD UI WIDGET
  // =========================================================================
  function renderDashboardProgressWidget(levelKey) {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    let widget = document.getElementById('study-progress-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'study-progress-widget';
      widget.className = 'study-progress-widget';
      // Insert right after stats-row or hero text
      const statsRow = hero.querySelector('.stats-row');
      if (statsRow) {
        statsRow.parentNode.insertBefore(widget, statsRow.nextSibling);
      } else {
        hero.appendChild(widget);
      }
    }

    const stats = calculateProgress(levelKey);
    const lastVisited = getLastVisited(levelKey);

    let resumeHtml = '';
    if (lastVisited && lastVisited.url && lastVisited.url !== 'index.html') {
      const cleanTitle = (lastVisited.title || 'Continue Lesson').replace(/<[^>]*>/g, '');
      resumeHtml = `
        <div class="resume-learning-bar">
          <div class="resume-left">
            <span class="resume-icon">⚡</span>
            <div class="resume-text-group">
              <span class="resume-label">Resume where you left off:</span>
              <a href="${lastVisited.url}" class="resume-module-title">${cleanTitle}</a>
            </div>
          </div>
          <a href="${lastVisited.url}" class="resume-cta-btn">
            <span>Continue</span> &rarr;
          </a>
        </div>
      `;
    }

    const reviewPillHtml = (stats.bySkill.review && stats.bySkill.review.total > 0) ? `
          <div class="skill-progress-pill skill-pill-review">
            <span class="pill-dot"></span>
            <span>Review: <strong>${stats.bySkill.review.completed}/${stats.bySkill.review.total}</strong> (${stats.bySkill.review.percent}%)</span>
          </div>
    ` : '';

    widget.innerHTML = `
      <div class="progress-card-inner">
        <div class="progress-header">
          <div class="progress-title-group">
            <span class="progress-badge">🎯 Course Progress</span>
            <span class="progress-stats-text"><strong>${stats.completed}</strong> of <strong>${stats.total}</strong> modules completed</span>
          </div>
          <span class="progress-percent-badge">${stats.percent}%</span>
        </div>

        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${stats.percent}%;"></div>
        </div>

        <div class="progress-skill-pills">
          <div class="skill-progress-pill skill-pill-grammar">
            <span class="pill-dot"></span>
            <span>Grammar: <strong>${stats.bySkill.grammar.completed}/${stats.bySkill.grammar.total}</strong> (${stats.bySkill.grammar.percent}%)</span>
          </div>
          <div class="skill-progress-pill skill-pill-reading">
            <span class="pill-dot"></span>
            <span>Reading: <strong>${stats.bySkill.reading.completed}/${stats.bySkill.reading.total}</strong> (${stats.bySkill.reading.percent}%)</span>
          </div>
          <div class="skill-progress-pill skill-pill-writing">
            <span class="pill-dot"></span>
            <span>Writing: <strong>${stats.bySkill.writing.completed}/${stats.bySkill.writing.total}</strong> (${stats.bySkill.writing.percent}%)</span>
          </div>
          ${reviewPillHtml}
        </div>

        ${resumeHtml}
      </div>
    `;
  }

  // Update card elements inside materials grids with checkmarks
  function syncMaterialCardsProgress(levelKey) {
    const cards = document.querySelectorAll('.material-card');
    cards.forEach(card => {
      const url = card.getAttribute('href');
      if (!url) return;

      const isDone = isModuleCompleted(levelKey, url);
      card.classList.toggle('is-module-completed', isDone);
      card.classList.add('has-progress-btn');

      // Check if check button already exists
      let checkBtn = card.querySelector('.module-complete-toggle');
      if (!checkBtn) {
        checkBtn = document.createElement('button');
        checkBtn.className = 'module-complete-toggle';
        checkBtn.setAttribute('type', 'button');
        checkBtn.title = isDone ? 'Mark as incomplete' : 'Mark as complete';
        checkBtn.innerHTML = `<span class="check-icon">✓</span> <span class="check-label">${isDone ? 'Completed' : 'Mark Done'}</span>`;

        // Prevent navigating when clicking checkbox
        checkBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const nowDone = toggleModuleCompleted(levelKey, url);
          syncMaterialCardsProgress(levelKey);
          renderDashboardProgressWidget(levelKey);
        });

        // Insert into card header or footer
        const tagRow = card.querySelector('.material-tag-row');
        if (tagRow) {
          tagRow.appendChild(checkBtn);
        } else {
          card.appendChild(checkBtn);
        }
      } else {
        checkBtn.title = isDone ? 'Mark as incomplete' : 'Mark as complete';
        checkBtn.innerHTML = `<span class="check-icon">✓</span> <span class="check-label">${isDone ? 'Completed' : 'Mark Done'}</span>`;
      }
    });
  }

  // =========================================================================
  // 3. LESSON PAGE BACKGROUND TRACKER (No DOM injection)
  // =========================================================================
  function initLessonPageTracker(levelKey, filename) {
    // Quietly record current module in background for Resume CTA on dashboard
    try {
      const h1 = document.querySelector('h1');
      const titleText = h1 ? h1.textContent.trim() : document.title;
      recordLastVisited(levelKey, { url: filename, title: titleText });
    } catch (e) {}
  }

  // =========================================================================
  // 4. BOOTSTRAPPER
  // =========================================================================
  function init() {
    try {
      const levelKey = getCurrentLevelKey();
      if (!levelKey) return;

      const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/').toLowerCase();
      const filename = path.split('/').pop() || 'index.html';
      const isDashboard = filename === 'index.html' || filename === '';

      if (isDashboard) {
        renderDashboardProgressWidget(levelKey);
        syncMaterialCardsProgress(levelKey);

        // Re-sync when materials are dynamically populated or filtered
        window.addEventListener('study-progress-updated', () => {
          renderDashboardProgressWidget(levelKey);
          syncMaterialCardsProgress(levelKey);
        });
      } else {
        initLessonPageTracker(levelKey, filename);
      }
    } catch (err) {
      console.warn('StudyProgress initialization error:', err);
    }
  }

  // Expose API on window
  window.StudyProgress = {
    getCurrentLevelKey,
    getCompletedSet,
    isModuleCompleted,
    toggleModuleCompleted,
    calculateProgress,
    getLastVisited,
    refreshUI: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

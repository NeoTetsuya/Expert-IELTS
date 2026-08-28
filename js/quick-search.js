/**
 * Expert for IELTS — Global Quick Search & Command Palette (Ctrl+K)
 * 
 * Provides instantaneous fuzzy search across all 150+ modules in Expert 5, 6, and 7.5
 * from any page on the platform.
 */

(function () {
  'use strict';

  // Determine root relative prefix
  function getRootPrefix() {
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/').toLowerCase();
    if (path.includes('/expert 5/') || path.includes('/expert 6/') || path.includes('/expert 7.5/') ||
        path.includes('/expert-5/') || path.includes('/expert-6/') || path.includes('/expert-75/')) {
      return '../';
    }
    return './';
  }

  const ROOT_PREFIX = getRootPrefix();

  // Lazy-load datasets if not already in window
  let allModulesCache = null;

  function loadAllModules() {
    if (allModulesCache) return Promise.resolve(allModulesCache);

    const modules = [];

    // Helper to format level entry
    function addLevelModules(dataset, levelFolder, levelName, badgeClass) {
      if (Array.isArray(dataset)) {
        dataset.forEach(item => {
          modules.push({
            url: ROOT_PREFIX + levelFolder + '/' + item.url,
            rawUrl: item.url,
            title: (item.title || item.dataTitle || '').replace(/&amp;/g, '&'),
            dataTitle: (item.dataTitle || item.title || '').replace(/&amp;/g, '&'),
            skill: (item.skill || 'module').toLowerCase(),
            level: levelName,
            levelFolder: levelFolder,
            badge: item.badge || 'Module',
            badgeClass: badgeClass,
            status: item.status || 'Active'
          });
        });
      }
    }

    const promises = [];

    if (!window.EXPERT_5_MODULES) {
      promises.push(loadScript(ROOT_PREFIX + 'js/data/expert-5.js'));
    }
    if (!window.EXPERT_6_MODULES) {
      promises.push(loadScript(ROOT_PREFIX + 'js/data/expert-6.js'));
    }
    if (!window.EXPERT_75_MODULES) {
      promises.push(loadScript(ROOT_PREFIX + 'js/data/expert-75.js'));
    }

    return Promise.all(promises).then(() => {
      addLevelModules(window.EXPERT_5_MODULES, 'expert 5', 'Band 5.0', 'badge-band5');
      addLevelModules(window.EXPERT_6_MODULES, 'expert 6', 'Band 6.0', 'badge-band6');
      addLevelModules(window.EXPERT_75_MODULES, 'expert 7.5', 'Band 7.5', 'badge-band75');
      allModulesCache = modules;
      return modules;
    });
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => resolve(); // graceful fallback
      document.head.appendChild(script);
    });
  }

  // =========================================================================
  // DOM CREATION & EVENT LISTENERS
  // =========================================================================
  let modalEl = null;
  let inputEl = null;
  let resultsEl = null;
  let selectedIndex = 0;
  let currentResults = [];

  function createSearchModal() {
    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.id = 'quick-search-modal';
    modalEl.className = 'quick-search-modal modal-hidden';
    modalEl.innerHTML = `
      <div class="quick-search-backdrop"></div>
      <div class="quick-search-container">
        <div class="quick-search-header">
          <span class="search-input-icon">🔍</span>
          <input type="text" id="quick-search-input" placeholder="Search 150+ IELTS modules by topic, grammar, skill..." autocomplete="off" />
          <span class="quick-search-kbd">ESC</span>
        </div>
        <div class="quick-search-filters">
          <button class="quick-filter-btn active" data-filter="all">All</button>
          <button class="quick-filter-btn" data-filter="grammar">Grammar</button>
          <button class="quick-filter-btn" data-filter="reading">Reading</button>
          <button class="quick-filter-btn" data-filter="writing">Writing</button>
        </div>
        <div class="quick-search-results" id="quick-search-results">
          <div class="quick-search-placeholder">Type to search across Expert 5, 6 & 7.5...</div>
        </div>
        <div class="quick-search-footer">
          <div class="quick-nav-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span class="quick-brand">Expert for IELTS</span>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    inputEl = modalEl.querySelector('#quick-search-input');
    resultsEl = modalEl.querySelector('#quick-search-results');

    // Backdrop click
    modalEl.querySelector('.quick-search-backdrop').addEventListener('click', closeSearch);

    // Live search input
    let activeFilter = 'all';
    inputEl.addEventListener('input', () => {
      performSearch(inputEl.value, activeFilter);
    });

    // Skill filter buttons
    const filterBtns = modalEl.querySelectorAll('.quick-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        performSearch(inputEl.value, activeFilter);
      });
    });

    // Keyboard navigation inside modal
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateResults(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateResults(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openSelectedResult();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    });

    // Floating Search Trigger Button (optional handy shortcut)
    createFloatingTrigger();
  }

  function createFloatingTrigger() {
    if (document.getElementById('quick-search-trigger-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'quick-search-trigger-fab';
    fab.className = 'quick-search-trigger-fab';
    fab.title = 'Quick Search (Ctrl + K)';
    fab.innerHTML = `<span>🔍</span> <span class="fab-search-label">Search</span> <kbd class="fab-kbd">Ctrl+K</kbd>`;
    fab.addEventListener('click', openSearch);
    document.body.appendChild(fab);
  }

  function openSearch() {
    createSearchModal();
    loadAllModules().then(() => {
      modalEl.classList.remove('modal-hidden');
      document.body.classList.add('search-open');
      inputEl.value = '';
      selectedIndex = 0;
      performSearch('', 'all');
      setTimeout(() => inputEl.focus(), 50);
    });
  }

  function closeSearch() {
    if (!modalEl) return;
    modalEl.classList.add('modal-hidden');
    document.body.classList.remove('search-open');
  }

  function performSearch(query, filter) {
    if (!allModulesCache) return;

    const cleanQuery = query.trim().toLowerCase();
    const results = allModulesCache.filter(item => {
      const matchFilter = filter === 'all' || item.skill === filter;
      if (!matchFilter) return false;
      if (!cleanQuery) return true;

      const titleMatch = item.title.toLowerCase().includes(cleanQuery);
      const dataTitleMatch = item.dataTitle.toLowerCase().includes(cleanQuery);
      const badgeMatch = item.badge.toLowerCase().includes(cleanQuery);
      const levelMatch = item.level.toLowerCase().includes(cleanQuery);
      const skillMatch = item.skill.toLowerCase().includes(cleanQuery);

      return titleMatch || dataTitleMatch || badgeMatch || levelMatch || skillMatch;
    });

    currentResults = results.slice(0, 30); // Max 30 results for clean UI
    selectedIndex = 0;
    renderResults(currentResults, cleanQuery);
  }

  function getSkillIcon(skill) {
    if (skill === 'grammar') return '📝';
    if (skill === 'reading') return '📖';
    if (skill === 'writing') return '✍️';
    return '📚';
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function renderResults(results, query) {
    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="quick-search-empty">
          <span>😕</span>
          <p>No modules found matching "<strong>${query}</strong>"</p>
        </div>
      `;
      return;
    }

    let html = '';
    results.forEach((item, index) => {
      const isSelected = index === selectedIndex ? ' is-selected' : '';
      const skillTagClass = `tag-${item.skill}`;
      const highlightedTitle = highlightMatch(item.title, query);

      html += `
        <a href="${item.url}" class="quick-result-item${isSelected}" data-index="${index}">
          <div class="result-left">
            <span class="result-icon">${getSkillIcon(item.skill)}</span>
            <div class="result-text-group">
              <div class="result-title">${highlightedTitle}</div>
              <div class="result-meta">
                <span class="skill-tag ${skillTagClass}">${item.skill.toUpperCase()}</span>
                <span class="hero-badge ${item.badgeClass}">${item.level}</span>
                <span class="result-status">${item.status}</span>
              </div>
            </div>
          </div>
          <span class="result-arrow">&rarr;</span>
        </a>
      `;
    });

    resultsEl.innerHTML = html;

    // Click selection on result items
    resultsEl.querySelectorAll('.quick-result-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        setSelected(idx);
      });
    });
  }

  function setSelected(index) {
    if (index < 0 || index >= currentResults.length) return;
    selectedIndex = index;

    const items = resultsEl.querySelectorAll('.quick-result-item');
    items.forEach((item, idx) => {
      item.classList.toggle('is-selected', idx === selectedIndex);
    });

    const activeItem = items[selectedIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function navigateResults(direction) {
    if (currentResults.length === 0) return;
    let nextIndex = selectedIndex + direction;
    if (nextIndex < 0) nextIndex = currentResults.length - 1;
    if (nextIndex >= currentResults.length) nextIndex = 0;
    setSelected(nextIndex);
  }

  function openSelectedResult() {
    if (currentResults.length > 0 && currentResults[selectedIndex]) {
      window.location.href = currentResults[selectedIndex].url;
    }
  }

  // =========================================================================
  // GLOBAL SHORTCUT HANDLERS
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    // Ctrl + K or Cmd + K
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (modalEl && !modalEl.classList.contains('modal-hidden')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
  });

  // Export API
  window.QuickSearch = {
    open: openSearch,
    close: closeSearch
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSearchModal);
  } else {
    createSearchModal();
  }
})();

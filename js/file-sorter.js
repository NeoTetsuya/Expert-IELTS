/**
 * Expert IELTS - Automatic File Sorter & Material Filter Utility
 * Automatically orders files in alphabetical order for each folder.
 */

(function () {
  'use strict';

  /**
   * Sorts elements inside a container alphabetically.
   * @param {string|HTMLElement} container - Selector string or DOM element container
   * @param {'asc'|'desc'} direction - 'asc' for A-Z, 'desc' for Z-A
   */
  function sortFilesAlphabetically(container, direction = 'asc') {
    const grid = typeof container === 'string' ? document.querySelector(container) : container;
    if (!grid) return;

    const items = Array.from(grid.children).filter(child => child.nodeType === 1);
    
    items.sort((a, b) => {
      // Get title from data-title, heading text, or element text
      const titleA = (a.getAttribute('data-title') || a.querySelector('h3, h2, a')?.textContent || a.textContent).trim();
      const titleB = (b.getAttribute('data-title') || b.querySelector('h3, h2, a')?.textContent || b.textContent).trim();

      const comparison = titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? comparison : -comparison;
    });

    // Re-append sorted elements
    items.forEach(item => grid.appendChild(item));
  }

  /**
   * Filters items in a container by search query and optional skill filter.
   * @param {string|HTMLElement} container 
   * @param {string} query 
   * @param {string} skillFilter 
   */
  function filterFiles(container, query = '', skillFilter = 'all') {
    const grid = typeof container === 'string' ? document.querySelector(container) : container;
    if (!grid) return;

    const q = query.toLowerCase().trim();
    const filter = skillFilter.toLowerCase().trim();
    const items = Array.from(grid.children);
    let matchCount = 0;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const itemSkill = (item.getAttribute('data-skill') || '').toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesSkill = filter === 'all' || itemSkill === filter;

      if (matchesSearch && matchesSkill) {
        item.style.display = '';
        matchCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const emptyState = document.getElementById('no-materials-msg');
    if (emptyState) {
      emptyState.style.display = matchCount === 0 ? 'block' : 'none';
    }
  }

  /**
   * Displays a temporary toast notification.
   * @param {string} message 
   */
  function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>ℹ️</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Auto-initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('materials-grid');
    if (grid) {
      // Auto-sort alphabetically A-Z on page load
      sortFilesAlphabetically(grid, 'asc');

      // Check placeholder module clicks
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.material-card');
        if (!card) return;

        const href = card.getAttribute('href');
        const footerSpan = card.querySelector('.material-footer span');
        const isExerciseReady = footerSpan && footerSpan.textContent.includes('Active Exercise');

        if (!isExerciseReady && href) {
          // If exercise is not active yet, notify user when clicked
          // Optional check: allow standard link navigation if file exists
        }
      });

      // Bind search input if present
      const searchInput = document.getElementById('materials-search');
      const skillButtons = document.querySelectorAll('.skill-filter-btn');
      const sortBtn = document.getElementById('sort-toggle-btn');
      let currentDirection = 'asc';
      let currentSkill = 'all';

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          filterFiles(grid, e.target.value, currentSkill);
        });
      }

      if (skillButtons) {
        skillButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            skillButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSkill = btn.getAttribute('data-skill') || 'all';
            filterFiles(grid, searchInput ? searchInput.value : '', currentSkill);
          });
        });
      }

      if (sortBtn) {
        sortBtn.addEventListener('click', () => {
          currentDirection = currentDirection === 'asc' ? 'desc' : 'asc';
          sortFilesAlphabetically(grid, currentDirection);
          sortBtn.querySelector('.sort-label').textContent = currentDirection === 'asc' ? 'A → Z' : 'Z → A';
          sortBtn.setAttribute('title', `Currently sorted ${currentDirection === 'asc' ? 'A to Z' : 'Z to A'}`);
        });
      }
    }
  });

  // Export to global scope
  window.sortFilesAlphabetically = sortFilesAlphabetically;
  window.filterFiles = filterFiles;
  window.showToast = showToast;
})();

/**
 * Expert IELTS - Automatic File Sorter & Skill Folder Organizer Utility
 * Organizes files into collapsible skill folders with alphabetical sorting, real-time search, and skill filtering.
 */

(function () {
  'use strict';

  /**
   * Sorts elements inside a grid container alphabetically.
   * @param {HTMLElement} grid - DOM element container
   * @param {'asc'|'desc'} direction - 'asc' for A-Z, 'desc' for Z-A
   */
  function sortGridAlphabetically(grid, direction = 'asc') {
    if (!grid) return;

    const items = Array.from(grid.children).filter(child => child.nodeType === 1 && child.classList.contains('material-card'));
    
    items.sort((a, b) => {
      const titleA = (a.getAttribute('data-title') || a.querySelector('h3, h2, a')?.textContent || a.textContent).trim();
      const titleB = (b.getAttribute('data-title') || b.querySelector('h3, h2, a')?.textContent || b.textContent).trim();

      const comparison = titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? comparison : -comparison;
    });

    // Re-append sorted elements
    items.forEach(item => grid.appendChild(item));
  }

  /**
   * Sorts all grids on the page (inside folders or standalone).
   * @param {'asc'|'desc'} direction 
   */
  function sortAllGrids(direction = 'asc') {
    const grids = document.querySelectorAll('.materials-grid');
    grids.forEach(grid => sortGridAlphabetically(grid, direction));
  }

  /**
   * Updates folder item counts and search visibility.
   * @param {string} query 
   * @param {string} skillFilter 
   */
  function filterAndSearchMaterials(query = '', skillFilter = 'all') {
    const q = query.toLowerCase().trim();
    const filter = skillFilter.toLowerCase().trim();
    const folders = document.querySelectorAll('.skill-folder');
    let totalMatches = 0;

    if (folders.length > 0) {
      folders.forEach(folder => {
        const folderSkill = (folder.getAttribute('data-folder-skill') || '').toLowerCase();
        const skillMatches = filter === 'all' || folderSkill === filter;
        const cards = Array.from(folder.querySelectorAll('.material-card'));
        const totalCardsInFolder = cards.length;
        let folderMatches = 0;

        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          const matchesSearch = !q || text.includes(q);

          if (skillMatches && matchesSearch) {
            card.style.display = '';
            folderMatches++;
            totalMatches++;
          } else {
            card.style.display = 'none';
          }
        });

        // Update badge count
        const countBadge = folder.querySelector('.folder-count-badge');
        if (countBadge) {
          if (q) {
            countBadge.textContent = `${folderMatches} found`;
          } else {
            countBadge.textContent = `${totalCardsInFolder} ${totalCardsInFolder === 1 ? 'Module' : 'Modules'}`;
          }
        }

        // Show/hide folder based on matches
        if (skillMatches && folderMatches > 0) {
          folder.style.display = '';
          // Auto-expand folder if searching with query or selecting a specific skill filter
          if (q || filter !== 'all') {
            expandFolder(folder);
          }
        } else {
          folder.style.display = 'none';
        }
      });
    } else {
      // Fallback for flat grid without folders
      const flatCards = document.querySelectorAll('.materials-grid .material-card');
      flatCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const itemSkill = (card.getAttribute('data-skill') || '').toLowerCase();
        const matchesSearch = !q || text.includes(q);
        const matchesSkill = filter === 'all' || itemSkill === filter;

        if (matchesSearch && matchesSkill) {
          card.style.display = '';
          totalMatches++;
        } else {
          card.style.display = 'none';
        }
      });
    }

    const emptyState = document.getElementById('no-materials-msg');
    if (emptyState) {
      emptyState.style.display = totalMatches === 0 ? 'block' : 'none';
    }
  }

  /**
   * Expands a skill folder.
   * @param {HTMLElement} folder 
   */
  function expandFolder(folder) {
    folder.classList.remove('is-collapsed');
    folder.classList.add('is-open');
    const header = folder.querySelector('.folder-header');
    if (header) {
      header.setAttribute('aria-expanded', 'true');
      const toggleText = header.querySelector('.folder-toggle-text');
      if (toggleText) toggleText.textContent = 'Collapse';
    }
  }

  /**
   * Collapses a skill folder.
   * @param {HTMLElement} folder 
   */
  function collapseFolder(folder) {
    folder.classList.add('is-collapsed');
    folder.classList.remove('is-open');
    const header = folder.querySelector('.folder-header');
    if (header) {
      header.setAttribute('aria-expanded', 'false');
      const toggleText = header.querySelector('.folder-toggle-text');
      if (toggleText) toggleText.textContent = 'Expand';
    }
  }

  /**
   * Toggles a skill folder.
   * @param {HTMLElement} folder 
   */
  function toggleFolder(folder) {
    if (folder.classList.contains('is-collapsed')) {
      expandFolder(folder);
    } else {
      collapseFolder(folder);
    }
  }

  // Auto-initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Initial sort A-Z for all grids inside folders
    sortAllGrids('asc');

    // Setup folder headers click & keyboard interaction
    const folderHeaders = document.querySelectorAll('.folder-header');
    folderHeaders.forEach(header => {
      const folder = header.closest('.skill-folder');
      if (!folder) return;

      header.addEventListener('click', () => {
        toggleFolder(folder);
      });

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFolder(folder);
        }
      });
    });

    // Expand All / Collapse All button
    const toggleAllBtn = document.getElementById('toggle-all-folders-btn');
    let allExpanded = false;
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        const folders = document.querySelectorAll('.skill-folder');
        allExpanded = !allExpanded;
        folders.forEach(folder => {
          if (allExpanded) {
            expandFolder(folder);
          } else {
            collapseFolder(folder);
          }
        });
        const label = toggleAllBtn.querySelector('.toggle-all-label') || toggleAllBtn;
        label.textContent = allExpanded ? 'Collapse All' : 'Expand All';
      });
    }

    // Bind Search Input
    const searchInput = document.getElementById('materials-search');
    const skillButtons = document.querySelectorAll('.skill-filter-btn');
    const sortBtn = document.getElementById('sort-toggle-btn');
    let currentDirection = 'asc';
    let currentSkill = 'all';

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterAndSearchMaterials(e.target.value, currentSkill);
      });
    }

    // Bind Skill Filters
    if (skillButtons) {
      skillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          skillButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentSkill = btn.getAttribute('data-skill') || 'all';
          filterAndSearchMaterials(searchInput ? searchInput.value : '', currentSkill);
        });
      });
    }

    // Bind Sort Toggle
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        currentDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        sortAllGrids(currentDirection);
        const sortLabel = sortBtn.querySelector('.sort-label');
        if (sortLabel) {
          sortLabel.textContent = currentDirection === 'asc' ? 'A → Z' : 'Z → A';
        }
        sortBtn.setAttribute('title', `Currently sorted ${currentDirection === 'asc' ? 'A to Z' : 'Z to A'}`);
      });
    }
  });

  // Export to global scope
  window.sortAllGrids = sortAllGrids;
  window.filterAndSearchMaterials = filterAndSearchMaterials;
  window.expandFolder = expandFolder;
  window.collapseFolder = collapseFolder;
  window.toggleFolder = toggleFolder;
})();

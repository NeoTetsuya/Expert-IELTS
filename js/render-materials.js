/**
 * Expert IELTS - Dynamic Materials Renderer
 * Populates skill folder grids from level dataset before file-sorter initializes.
 */

(function () {
  'use strict';

  function getSkillIcon(skill) {
    switch ((skill || '').toLowerCase()) {
      case 'grammar':
        return '📝 Grammar';
      case 'reading':
        return '📖 Reading';
      case 'writing':
        return '✍️ Writing';
      case 'review':
        return '⭐ Review';
      default:
        return '📚 ' + (skill ? skill.charAt(0).toUpperCase() + skill.slice(1) : 'Module');
    }
  }

  function createCardElement(item) {
    const card = document.createElement('a');
    card.className = 'material-card';
    card.href = item.url;
    card.setAttribute('data-title', item.dataTitle || item.title);
    card.setAttribute('data-skill', item.skill);

    const badgeClass = item.badgeClass ? ` ${item.badgeClass}` : '';
    const skillTagClass = `tag-${(item.skill || '').toLowerCase()}`;
    const statusText = item.status || 'Active Lesson';

    card.innerHTML = `
      <div class="material-tag-row">
        <span class="skill-tag ${skillTagClass}">${getSkillIcon(item.skill)}</span>
        <span class="hero-badge${badgeClass}" style="padding:0.15rem 0.5rem; font-size:0.7rem; margin:0;">${item.badge || ''}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="material-footer">
        <span>${statusText}</span>
        <span class="action-arrow">Open &rarr;</span>
      </div>
    `;

    return card;
  }

  function renderMaterials() {
    // Find active dataset
    const dataset = window.EXPERT_5_MODULES || window.EXPERT_6_MODULES || window.EXPERT_75_MODULES || window.MODULES_DATA;
    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      return;
    }

    const folders = document.querySelectorAll('.skill-folder');
    const folderGrids = {};
    const folderCounts = {};

    folders.forEach(folder => {
      const skill = (folder.getAttribute('data-folder-skill') || '').toLowerCase();
      const grid = folder.querySelector('.materials-grid');
      if (skill && grid) {
        folderGrids[skill] = grid;
        folderCounts[skill] = 0;
        // Clear any existing placeholder content inside grid
        grid.innerHTML = '';
      }
    });

    const flatGrid = !folders.length ? document.querySelector('.materials-grid') : null;
    if (flatGrid) flatGrid.innerHTML = '';

    // Render items into appropriate folder grids
    dataset.forEach(item => {
      const card = createCardElement(item);
      const skill = (item.skill || '').toLowerCase();

      if (folderGrids[skill]) {
        folderGrids[skill].appendChild(card);
        folderCounts[skill]++;
      } else if (flatGrid) {
        flatGrid.appendChild(card);
      }
    });

    // Update folder count badges and toggle empty folder visibility
    folders.forEach(folder => {
      const skill = (folder.getAttribute('data-folder-skill') || '').toLowerCase();
      const count = folderCounts[skill] || 0;
      const countBadge = folder.querySelector('.folder-count-badge');
      if (countBadge) {
        countBadge.textContent = `${count} ${count === 1 ? 'Module' : 'Modules'}`;
      }

      const filterBtn = document.querySelector(`.skill-filter-btn[data-skill="${skill}"]`);
      if (count === 0) {
        folder.style.display = 'none';
        if (filterBtn) filterBtn.style.display = 'none';
      } else {
        folder.style.display = '';
        if (filterBtn) filterBtn.style.display = '';
      }
    });

    // Notify StudyProgress if available
    if (window.StudyProgress && typeof window.StudyProgress.refreshUI === 'function') {
      window.StudyProgress.refreshUI();
    }
  }

  // Execute immediately if DOM is already parsed, or on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMaterials, { once: true });
  } else {
    renderMaterials();
  }

  window.renderMaterials = renderMaterials;
})();

/**
 * Expert IELTS — Theme Manager & Toggle Engine
 * Handles Light/Dark mode state, localStorage persistence, and interactive toggle UI.
 */

(function () {
  'use strict';

  const THEME_KEY = 'expert_ielts_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.classList.toggle('light-theme', theme === 'light');
    }
    updateToggleButton(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const nextTheme = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  function updateToggleButton(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const isLight = theme === 'light';
    btn.setAttribute('aria-label', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    btn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');

    const iconSpan = btn.querySelector('.theme-toggle-icon');
    const textSpan = btn.querySelector('.theme-toggle-text');

    if (iconSpan) {
      iconSpan.textContent = isLight ? '🌙' : '☀️';
    }
    if (textSpan) {
      textSpan.textContent = isLight ? 'Dark' : 'Light';
    }
  }

  function createToggleButton() {
    if (document.getElementById('theme-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.className = 'theme-toggle-btn';
    btn.type = 'button';
    btn.innerHTML = `
      <span class="theme-toggle-icon">☀️</span>
      <span class="theme-toggle-text">Light</span>
    `;
    btn.addEventListener('click', toggleTheme);

    const topNav = document.querySelector('.top-nav');
    if (topNav) {
      topNav.style.display = 'flex';
      topNav.style.justifyContent = 'space-between';
      topNav.style.alignItems = 'center';
      topNav.appendChild(btn);
    } else {
      // For pages without top-nav (e.g. root landing portal), create a top bar or append to hero
      const container = document.querySelector('.container');
      if (container) {
        const nav = document.createElement('nav');
        nav.className = 'top-nav';
        nav.style.display = 'flex';
        nav.style.justifyContent = 'flex-end';
        nav.style.alignItems = 'center';
        nav.appendChild(btn);
        container.insertBefore(nav, container.firstChild);
      }
    }

    const activeTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    updateToggleButton(activeTheme);
  }

  // 1. Immediate Execution (Prevents Flash of Wrong Theme)
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // 2. DOM Ready Setup
  function init() {
    applyTheme(initialTheme);
    createToggleButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global helpers
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
})();

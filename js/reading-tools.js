/**
 * Expert for IELTS — Universal Reading & Lesson Tools
 * 
 * Provides universal font scaling (A+/A-), text highlighter,
 * audio pronunciation (TTS), and draggable splitter for reading/grammar lessons.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. UNIVERSAL FONT SCALER
  // =========================================================================
  const FONT_STORAGE_KEY = 'neo_ielts_font_size';
  const DEFAULT_FONT_SIZE = 16;
  const MIN_FONT_SIZE = 13;
  const MAX_FONT_SIZE = 22;

  function getSavedFontSize() {
    try {
      const saved = localStorage.getItem(FONT_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
    } catch (e) {
      return DEFAULT_FONT_SIZE;
    }
  }

  function setFontSize(size) {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    document.documentElement.style.setProperty('--app-font-size', `${clamped}px`);
    document.documentElement.style.setProperty('--reading-font-size', `${clamped}px`);

    // Apply to panes directly if needed
    document.querySelectorAll('.pane, .reading-passage, .passage-text, .writing-area').forEach(el => {
      el.style.fontSize = `${clamped}px`;
    });

    try {
      localStorage.setItem(FONT_STORAGE_KEY, clamped.toString());
    } catch (e) { }

    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) fontDisplay.textContent = `${clamped}px`;
  }

  function changeFontSize(delta) {
    const current = getSavedFontSize();
    setFontSize(current + delta);
  }

  // =========================================================================
  // 2. UNIVERSAL SPLITTER RESIZER
  // =========================================================================
  function initSplitter() {
    const splitter = document.getElementById('splitter') || document.querySelector('.splitter');
    const container = document.getElementById('content-panes') || document.querySelector('.content-panes');
    if (!splitter || !container) return;

    let isDragging = false;

    splitter.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      splitter.classList.add('is-dragging');
    });

    // Touch support for tablets/foldables
    splitter.addEventListener('touchstart', () => {
      isDragging = true;
      splitter.classList.add('is-dragging');
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || window.innerWidth <= 768) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth > 280 && newWidth < rect.width - 280) {
        const percent = (newWidth / rect.width) * 100;
        container.style.gridTemplateColumns = `${percent}% 5px 1fr`;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging || window.innerWidth <= 768 || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const newWidth = e.touches[0].clientX - rect.left;
      if (newWidth > 280 && newWidth < rect.width - 280) {
        const percent = (newWidth / rect.width) * 100;
        container.style.gridTemplateColumns = `${percent}% 5px 1fr`;
      }
    }, { passive: true });

    function stopDragging() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
        splitter.classList.remove('is-dragging');
      }
    }

    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
  }

  // =========================================================================
  // 3. UNIVERSAL TEXT-TO-SPEECH (TTS) PRONUNCIATION
  // =========================================================================
  function speakText(text, lang = 'en-GB') {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  // =========================================================================
  // 4. TEXT HIGHLIGHTER & SELECTION POPOVER
  // =========================================================================
  function initTextHighlighter() {
    const targetPanes = document.querySelectorAll('#left-pane, .reading-passage, .passage-content, .study-content');
    if (targetPanes.length === 0) return;

    let popover = document.getElementById('reading-selection-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'reading-selection-popover';
      popover.className = 'reading-selection-popover';
      popover.style.display = 'none';
      popover.innerHTML = `
        <button class="pop-btn pop-speak" title="Listen Pronunciation">🔊 Speak</button>
        <button class="pop-btn pop-hl-yellow" title="Highlight Yellow"><span class="hl-dot bg-yellow"></span></button>
        <button class="pop-btn pop-hl-green" title="Highlight Green"><span class="hl-dot bg-green"></span></button>
        <button class="pop-btn pop-hl-blue" title="Highlight Blue"><span class="hl-dot bg-blue"></span></button>
      `;
      document.body.appendChild(popover);
    }

    let currentSelectedText = '';
    let currentRange = null;

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
        if (popover && popover.style.display !== 'none' && !popover.matches(':hover')) {
          popover.style.display = 'none';
        }
        return;
      }

      currentSelectedText = selection.toString().trim();
      if (currentSelectedText.length > 0 && currentSelectedText.length < 150) {
        try {
          currentRange = selection.getRangeAt(0);
          const rect = currentRange.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            popover.style.top = `${window.scrollY + rect.top - 44}px`;
            popover.style.left = `${window.scrollX + rect.left + rect.width / 2}px`;
            popover.style.display = 'flex';
          }
        } catch (e) { }
      }
    });

    popover.querySelector('.pop-speak').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      speakText(currentSelectedText);
    });

    function applyHighlight(colorClass) {
      if (!currentRange) return;
      const span = document.createElement('mark');
      span.className = `user-highlight ${colorClass}`;
      try {
        currentRange.surroundContents(span);
        window.getSelection().removeAllRanges();
        popover.style.display = 'none';
      } catch (e) {
        // Fallback for complex selections spanning multiple elements
        document.execCommand('hiliteColor', false, colorClass === 'bg-green' ? '#86efac' : '#fef08a');
      }
    }

    popover.querySelector('.pop-hl-yellow').addEventListener('click', () => applyHighlight('bg-yellow'));
    popover.querySelector('.pop-hl-green').addEventListener('click', () => applyHighlight('bg-green'));
    popover.querySelector('.pop-hl-blue').addEventListener('click', () => applyHighlight('bg-blue'));

    // Clear highlights button binder
    const clearBtn = document.getElementById('clear-highlights-btn') || document.querySelector('.clear-highlights-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.querySelectorAll('mark.user-highlight, mark').forEach(mark => {
          const text = document.createTextNode(mark.textContent);
          mark.replaceWith(text);
        });
      });
    }
  }

  // =========================================================================
  // 5. INITIALIZE
  // =========================================================================
  function init() {
    setFontSize(getSavedFontSize());
    initSplitter();
    initTextHighlighter();

    // Hook existing font buttons if present
    const incBtn = document.getElementById('increase-font-btn');
    const decBtn = document.getElementById('decrease-font-btn');
    if (incBtn) incBtn.addEventListener('click', () => changeFontSize(1));
    if (decBtn) decBtn.addEventListener('click', () => changeFontSize(-1));
  }

  window.ReadingTools = {
    setFontSize,
    changeFontSize,
    speakText
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

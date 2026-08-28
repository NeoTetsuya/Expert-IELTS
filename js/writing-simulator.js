/**
 * Expert for IELTS — Universal Writing Simulator Engine
 * 
 * Provides automated draft autosave, live word counter with thresholds,
 * student name synchronization, draggable splitter, and Google Forms submission modal.
 */

(function () {
  'use strict';

  function initWritingSimulator() {
    const essayInput = document.getElementById('essay-input') || document.querySelector('.writing-area');
    if (!essayInput) return; // Only runs on writing simulator pages

    const config = window.TASK_CONFIG || {};
    const taskTitle = config.title || document.title || 'IELTS Writing Task';
    const minWords = config.minWords || (taskTitle.toLowerCase().includes('task 1') ? 150 : 250);
    const saveKey = 'ielts_essay_draft_' + taskTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // DOM Elements
    const studentNameInput = document.getElementById('student-name');
    const wordCountNum = document.getElementById('word-count-number');
    const wordCountBadge = document.getElementById('word-count-container');
    const submitBtn = document.getElementById('submit-btn');
    const promptInstructions = document.getElementById('prompt-instructions');
    const promptText = document.getElementById('prompt-text');
    const headerTitle = document.getElementById('header-title');

    // 1. Populate Config if present
    if (config.instructions && promptInstructions) promptInstructions.innerHTML = config.instructions;
    if (config.prompt && promptText) promptText.innerHTML = config.prompt;
    if (config.title && headerTitle) headerTitle.textContent = config.title;

    // 2. Load Saved Student Name & Essay Draft
    if (studentNameInput) {
      studentNameInput.value = localStorage.getItem('ielts_student_name') || '';
      studentNameInput.addEventListener('input', () => {
        localStorage.setItem('ielts_student_name', studentNameInput.value.trim());
      });
    }

    // Load draft
    const savedDraft = localStorage.getItem(saveKey) || localStorage.getItem('ielts_task2_essay_' + taskTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase());
    if (savedDraft && !essayInput.value) {
      essayInput.value = savedDraft;
    }

    // 3. Word Count & Live Autosave
    function updateWordCount() {
      const text = essayInput.value.trim();
      const count = text === '' ? 0 : text.split(/\s+/).length;

      if (wordCountNum) wordCountNum.textContent = count.toString();

      if (wordCountBadge) {
        if (count >= minWords) {
          wordCountBadge.classList.remove('word-count-insufficient');
          wordCountBadge.classList.add('word-count-sufficient');
        } else {
          wordCountBadge.classList.remove('word-count-sufficient');
          wordCountBadge.classList.add('word-count-insufficient');
        }
      }
    }

    essayInput.addEventListener('input', () => {
      updateWordCount();
      localStorage.setItem(saveKey, essayInput.value);
    });

    updateWordCount();

    // Unsaved warning
    window.addEventListener('beforeunload', (e) => {
      if (essayInput.value.trim().length > 10) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // 4. Modal Submission Logic
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const studentName = studentNameInput ? studentNameInput.value.trim() : '';
        const essayText = essayInput.value.trim();
        const words = essayText === '' ? 0 : essayText.split(/\s+/).length;

        if (studentNameInput && !studentName) {
          showModal('Missing Name', 'Please enter your full name in the top right corner before submitting.', 'error');
          studentNameInput.focus();
          return;
        }

        if (words < 50) {
          showModal('Draft Too Short', `Your essay has only ${words} words. Please write more before submitting.`, 'warning');
          return;
        }

        if (words < minWords) {
          showModal(
            'Below Recommended Length',
            `Your essay currently has <strong>${words} words</strong> (Recommended: ${minWords}+ words). Would you like to submit now anyway?`,
            'warning',
            true,
            () => processSubmission(studentName, essayText)
          );
          return;
        }

        processSubmission(studentName, essayText);
      });
    }

    function processSubmission(name, essay) {
      if (!config.googleFormUrl) {
        showModal('Ready to Export', 'Your essay has been saved. You can copy your text or export it below.', 'success');
        return;
      }

      const baseUrl = config.googleFormUrl;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const nameParam = config.formEntryNameId ? `${config.formEntryNameId}=${encodeURIComponent(name)}` : '';
      const essayParam = config.formEntryEssayId ? `${config.formEntryEssayId}=${encodeURIComponent(essay)}` : '';
      const params = [nameParam, essayParam].filter(Boolean).join('&');
      const finalUrl = baseUrl + (params ? separator + params : '');

      showModal(
        'Submission Ready',
        `If the form doesn't open automatically, click the link below to submit:<br><br>
        <a href="${finalUrl}" target="_blank" class="inline-block mt-2 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-md">👉 Open Google Form</a>`,
        'success'
      );

      try {
        const win = window.open(finalUrl, '_blank');
        if (win) {
          // Keep draft backup in case of network issues but clear primary key
        }
      } catch (e) { }
    }

    function showModal(title, message, type = 'info', showCancel = false, confirmCallback = null) {
      let modal = document.getElementById('custom-modal');
      let modalTitle = document.getElementById('modal-title');
      let modalMessage = document.getElementById('modal-message');
      let modalContent = document.getElementById('custom-modal-content');
      let modalCloseBtn = document.getElementById('modal-close-btn');
      let modalCancelBtn = document.getElementById('modal-cancel-btn');
      let modalIcon = document.getElementById('modal-icon');

      if (!modal) return;

      if (modalTitle) modalTitle.textContent = title;
      if (modalMessage) modalMessage.innerHTML = message;

      if (modalCancelBtn) {
        modalCancelBtn.classList.toggle('hidden', !showCancel);
        modalCancelBtn.onclick = () => {
          modal.classList.add('hidden');
        };
      }

      if (modalCloseBtn) {
        modalCloseBtn.onclick = () => {
          modal.classList.add('hidden');
          if (confirmCallback) confirmCallback();
        };
      }

      modal.classList.remove('hidden');
      modal.classList.remove('opacity-0');
      if (modalContent) {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
      }
    }
  }

  window.WritingSimulator = {
    init: initWritingSimulator
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWritingSimulator);
  } else {
    initWritingSimulator();
  }
})();

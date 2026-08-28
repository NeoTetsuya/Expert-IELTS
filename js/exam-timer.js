/**
 * Expert for IELTS — Universal Exam Practice Timer & Stopwatch
 * 
 * Provides dockable countdown timers with presets (20m, 40m, 60m),
 * stopwatch mode, visual urgency alerts, and audio finish chime.
 */

(function () {
  'use strict';

  let timerInterval = null;
  let remainingSeconds = 0;
  let totalDuration = 0;
  let isRunning = false;
  let isCountUp = false;
  let widgetEl = null;

  function createTimerWidget() {
    if (widgetEl || document.getElementById('ielts-exam-timer-widget')) return;

    widgetEl = document.createElement('div');
    widgetEl.id = 'ielts-exam-timer-widget';
    widgetEl.className = 'exam-timer-widget is-collapsed';

    widgetEl.innerHTML = `
      <div class="timer-collapsed-pill" id="timer-toggle-btn" title="Click to open Exam Timer">
        <span class="timer-icon">⏱️</span>
        <span class="timer-display-mini" id="timer-display-mini">Timer</span>
      </div>

      <div class="timer-expanded-panel" id="timer-panel">
        <div class="timer-panel-header">
          <div class="timer-panel-title">
            <span>⏱️</span> <strong>Exam Practice Timer</strong>
          </div>
          <button class="timer-close-btn" id="timer-minimize-btn" title="Minimize">&times;</button>
        </div>

        <div class="timer-presets">
          <button class="timer-preset-btn active" data-mins="20">20m (Task 1)</button>
          <button class="timer-preset-btn" data-mins="40">40m (Task 2)</button>
          <button class="timer-preset-btn" data-mins="60">60m (Reading)</button>
          <button class="timer-preset-btn" data-mins="0">Stopwatch</button>
        </div>

        <div class="timer-display-large" id="timer-display-large">20:00</div>

        <div class="timer-controls">
          <button class="timer-btn timer-btn-primary" id="timer-start-btn">Start</button>
          <button class="timer-btn timer-btn-secondary" id="timer-reset-btn">Reset</button>
        </div>
      </div>
    `;

    document.body.appendChild(widgetEl);

    // Setup interactive handlers
    const toggleBtn = widgetEl.querySelector('#timer-toggle-btn');
    const minimizeBtn = widgetEl.querySelector('#timer-minimize-btn');
    const startBtn = widgetEl.querySelector('#timer-start-btn');
    const resetBtn = widgetEl.querySelector('#timer-reset-btn');
    const presetBtns = widgetEl.querySelectorAll('.timer-preset-btn');

    toggleBtn.addEventListener('click', () => {
      widgetEl.classList.toggle('is-collapsed');
    });

    minimizeBtn.addEventListener('click', () => {
      widgetEl.classList.add('is-collapsed');
    });

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mins = parseInt(btn.getAttribute('data-mins'), 10);
        setPreset(mins);
      });
    });

    startBtn.addEventListener('click', () => {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    resetBtn.addEventListener('click', () => {
      resetTimer();
    });

    // Default to 20 mins or task 2 if page contains task 2
    const isTask2 = document.title.toLowerCase().includes('task 2');
    const isReading = document.title.toLowerCase().includes('reading');
    if (isReading) {
      setPreset(60);
      activatePresetBtn(60);
    } else if (isTask2) {
      setPreset(40);
      activatePresetBtn(40);
    } else {
      setPreset(20);
    }
  }

  function activatePresetBtn(mins) {
    if (!widgetEl) return;
    const btns = widgetEl.querySelectorAll('.timer-preset-btn');
    btns.forEach(b => {
      const bMins = parseInt(b.getAttribute('data-mins'), 10);
      b.classList.toggle('active', bMins === mins);
    });
  }

  function setPreset(mins) {
    pauseTimer();
    if (mins === 0) {
      isCountUp = true;
      remainingSeconds = 0;
      totalDuration = 0;
    } else {
      isCountUp = false;
      remainingSeconds = mins * 60;
      totalDuration = mins * 60;
    }
    updateDisplay();
  }

  function formatTime(seconds) {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    if (!widgetEl) return;
    const formatted = formatTime(remainingSeconds);
    const largeEl = widgetEl.querySelector('#timer-display-large');
    const miniEl = widgetEl.querySelector('#timer-display-mini');

    if (largeEl) largeEl.textContent = formatted;
    if (miniEl) miniEl.textContent = isRunning ? formatted : 'Timer';

    // Urgency indicators
    if (!isCountUp && isRunning) {
      if (remainingSeconds <= 60) {
        widgetEl.classList.add('timer-urgency-critical');
        widgetEl.classList.remove('timer-urgency-warning');
      } else if (remainingSeconds <= 300) {
        widgetEl.classList.add('timer-urgency-warning');
        widgetEl.classList.remove('timer-urgency-critical');
      } else {
        widgetEl.classList.remove('timer-urgency-warning', 'timer-urgency-critical');
      }
    } else {
      widgetEl.classList.remove('timer-urgency-warning', 'timer-urgency-critical');
    }
  }

  function playAlertChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) { }
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;

    const startBtn = widgetEl.querySelector('#timer-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Pause';
      startBtn.classList.remove('timer-btn-primary');
      startBtn.classList.add('timer-btn-pause');
    }

    timerInterval = setInterval(() => {
      if (isCountUp) {
        remainingSeconds++;
      } else {
        remainingSeconds--;
        if (remainingSeconds === 0) {
          playAlertChime();
        }
      }
      updateDisplay();
    }, 1000);

    updateDisplay();
  }

  function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;

    const startBtn = widgetEl.querySelector('#timer-start-btn');
    if (startBtn) {
      startBtn.textContent = 'Start';
      startBtn.classList.remove('timer-btn-pause');
      startBtn.classList.add('timer-btn-primary');
    }
    updateDisplay();
  }

  function resetTimer() {
    pauseTimer();
    const activeBtn = widgetEl.querySelector('.timer-preset-btn.active');
    const mins = activeBtn ? parseInt(activeBtn.getAttribute('data-mins'), 10) : 20;
    setPreset(mins);
  }

  window.ExamTimer = {
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    setPreset: setPreset
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTimerWidget);
  } else {
    createTimerWidget();
  }
})();

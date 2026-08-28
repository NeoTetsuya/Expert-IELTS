/**
 * Expert for IELTS — Content Password Protection Engine
 * 
 * Provides client-side access control for Reading Explanations & Writing Model Answers.
 * Individual passwords per module + Master Teacher override password.
 */

(function () {
  'use strict';

  // Ensure FontAwesome icons are available
  if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(faLink);
  }

  // =========================================================================
  // 1. PASSWORD REGISTRY (Editable by teacher / Auto-synced by scripts)
  // =========================================================================
  window.EXPERT_READING_PASSWORDS = window.EXPERT_READING_PASSWORDS || {
    // Master password that unlocks ANY protected module
    masterPassword: "neo-teacher-access",

    // Passwords organized by course folder
    levels: {
      "expert 5": {
        "module-4a-reading-explanations.html": "exp5-r4a",
        "module-4b-reading-explanations.html": "exp5-r4b",
        "module-5a-reading-explanations.html": "exp5-r5a",
        "module-5b-reading-explanations.html": "exp5-r5b",
        "module-6a-reading-explanations.html": "exp5-r6a",
        "module-6b-reading-explanations.html": "exp5-r6b",
        "module-1-writing-sample.html": "exp5-w1",
        "module-2-writing-sample.html": "exp5-w2",
        "module-3-writing-sample.html": "exp5-w3",
        "module-4-writing-sample.html": "exp5-w4",
        "module-5-writing-sample.html": "exp5-w5",
        "module-6-writing-sample.html": "exp5-w6",
        "module-7-writing-sample.html": "exp5-w7",
        "module-8-writing-sample.html": "exp5-w8",
        "module-9-writing-sample.html": "exp5-w9",
        "module-10-writing-sample.html": "exp5-w10"
      },
      "expert 6": {
        "module-1a-reading-explanations.html": "exp6-r1a",
        "module-1b-reading-explanations.html": "exp6-r1b",
        "module-2a-reading-explanations.html": "exp6-r2a",
        "module-2b-reading-explanations.html": "exp6-r2b"
      },
      "expert 7.5": {
      }
    }
  };

  // =========================================================================
  // 2. HELPER FUNCTIONS: PATH RESOLUTION & PASSWORD LOOKUP
  // =========================================================================
  function getCurrentPageInfo() {
    const fullPath = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    const segments = fullPath.split('/').filter(Boolean);
    const filename = segments.length > 0 ? segments[segments.length - 1] : '';

    let levelFolder = 'expert 6'; // default fallback
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i].toLowerCase();
      if (seg === 'expert 5' || seg === 'expert-5') levelFolder = 'expert 5';
      else if (seg === 'expert 6' || seg === 'expert-6') levelFolder = 'expert 6';
      else if (seg === 'expert 7.5' || seg === 'expert-75' || seg === 'expert 75') levelFolder = 'expert 7.5';
    }

    const isWriting = filename.toLowerCase().includes('writing') || filename.toLowerCase().includes('sample');
    return { levelFolder, filename, isWriting };
  }

  function getRequiredPassword(levelFolder, filename) {
    const registry = window.EXPERT_READING_PASSWORDS;
    if (!registry) return null;

    if (registry.levels && registry.levels[levelFolder] && registry.levels[levelFolder][filename]) {
      return registry.levels[levelFolder][filename];
    }

    // Direct filename search fallback across all levels
    if (registry.levels) {
      for (const lvl in registry.levels) {
        if (registry.levels[lvl][filename]) {
          return registry.levels[lvl][filename];
        }
      }
    }

    // Default fallback generated from filename
    const match = filename.match(/module-?([0-9]+[a-z]?)/i);
    if (match) {
      const lvlPrefix = levelFolder.replace(/[^0-9]/g, '');
      const isWriting = filename.toLowerCase().includes('writing') || filename.toLowerCase().includes('sample');
      const prefixLetter = isWriting ? 'w' : 'r';
      return `exp${lvlPrefix}-${prefixLetter}${match[1].toLowerCase()}`;
    }

    return "neo-reading-access";
  }

  function getSessionStorageKey(levelFolder, filename) {
    return `neo_reading_unlocked_${levelFolder}_${filename}`;
  }

  function isAlreadyUnlocked(levelFolder, filename) {
    try {
      return sessionStorage.getItem(getSessionStorageKey(levelFolder, filename)) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setUnlockedState(levelFolder, filename, unlocked) {
    try {
      if (unlocked) {
        sessionStorage.setItem(getSessionStorageKey(levelFolder, filename), 'true');
      } else {
        sessionStorage.removeItem(getSessionStorageKey(levelFolder, filename));
      }
    } catch (e) { }
  }

  // =========================================================================
  // 3. INJECT ANTI-SNEAK-PEEK CSS STYLES IMMEDIATELY
  // =========================================================================
  const { levelFolder, filename } = getCurrentPageInfo();
  const alreadyUnlocked = isAlreadyUnlocked(levelFolder, filename);

  const styleEl = document.createElement('style');
  styleEl.id = 'reading-protection-styles';
  styleEl.textContent = `
    body.reading-locked {
      overflow: hidden !important;
      height: 100vh !important;
    }
    body.reading-locked > *:not(#reading-lock-modal):not(#reading-protection-styles) {
      filter: blur(18px) grayscale(40%) !important;
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      transition: filter 0.4s ease !important;
    }
    #reading-lock-modal {
      position: fixed;
      inset: 0;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 1.25rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      opacity: 1;
      transition: opacity 0.35s ease, visibility 0.35s ease;
    }
    #reading-lock-modal.modal-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .lock-card-glow {
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #0284c7, #38bdf8, #6366f1, #0284c7);
      border-radius: 1.5rem;
      z-index: -1;
      opacity: 0.75;
      filter: blur(12px);
      animation: lockGlowRotate 6s linear infinite;
    }
    @keyframes lockGlowRotate {
      0% { filter: blur(12px) hue-rotate(0deg); }
      50% { filter: blur(16px) hue-rotate(90deg); }
      100% { filter: blur(12px) hue-rotate(0deg); }
    }
    @keyframes lockShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
    .shake-animation {
      animation: lockShake 0.45s ease-in-out;
    }
    #reading-relock-fab {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 999999;
      background: #0f172a;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #reading-relock-fab:hover {
      background: #1e293b;
      color: #38bdf8;
      border-color: #38bdf8;
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(styleEl);

  if (!alreadyUnlocked) {
    document.documentElement.classList.add('reading-locked');
    if (document.body) document.body.classList.add('reading-locked');
  }

  // =========================================================================
  // 4. UI INITIALIZATION & INTERACTION
  // =========================================================================
  function initLockSystem() {
    const { levelFolder, filename, isWriting } = getCurrentPageInfo();
    const pageTitle = document.title ? document.title.split('—')[0].trim() : (isWriting ? 'Writing Model Answer' : 'Reading Explanations');
    const isUnlocked = isAlreadyUnlocked(levelFolder, filename);

    const lockBadgeLabel = isWriting ? `${levelFolder.toUpperCase()} WRITING MODEL LOCK` : `${levelFolder.toUpperCase()} ACCESS LOCK`;
    const lockDesc = isWriting 
      ? 'Tài liệu bài mẫu (Model Answer) & chú thích chi tiết được bảo mật để phục vụ buổi học trên lớp. Vui lòng nhập mật mã từ giáo viên.'
      : 'Tài liệu phân tích & giải thích chi tiết được bảo mật để phục vụ buổi học trên lớp. Vui lòng nhập mật mã từ giáo viên.';

    // Build Floating Relock Button
    const relockFab = document.createElement('button');
    relockFab.id = 'reading-relock-fab';
    relockFab.title = isWriting ? 'Khóa lại bài viết mẫu' : 'Khóa lại tài liệu giải thích';
    relockFab.innerHTML = `<i class="fa-solid fa-lock text-sky-400"></i> <span>${isWriting ? 'Khóa bài mẫu' : 'Khóa tài liệu'}</span>`;
    relockFab.style.display = isUnlocked ? 'flex' : 'none';
    relockFab.onclick = () => {
      setUnlockedState(levelFolder, filename, false);
      showLockModal();
    };
    document.body.appendChild(relockFab);

    // Build Modal Overlay HTML
    const modal = document.createElement('div');
    modal.id = 'reading-lock-modal';
    if (isUnlocked) {
      modal.classList.add('modal-hidden');
    } else {
      document.body.classList.add('reading-locked');
    }

    modal.innerHTML = `
      <div class="relative w-full max-w-md bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div class="lock-card-glow"></div>
        
        <!-- Header Icon & Badge -->
        <div class="flex flex-col items-center text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4 ring-4 ring-sky-500/20">
            <i id="lock-icon" class="fa-solid fa-lock text-2xl text-white transition-transform duration-300"></i>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-shield-halved text-[10px]"></i> ${lockBadgeLabel}
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${pageTitle}</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            ${lockDesc}
          </p>
        </div>

        <!-- Form Input -->
        <form id="reading-lock-form" class="space-y-4" onsubmit="return false;">
          <div class="space-y-1.5">
            <label for="reading-password-input" class="block text-xs font-bold text-slate-300 uppercase tracking-wide">
              Mật mã truy cập (Password)
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 text-slate-400 text-sm pointer-events-none">
                <i class="fa-solid fa-key"></i>
              </span>
              <input
                type="password"
                id="reading-password-input"
                class="w-full bg-slate-800/90 text-white placeholder-slate-500 text-sm font-medium rounded-xl pl-10 pr-11 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                placeholder="Nhập mật mã bài học..."
                autocomplete="off"
                autofocus
              />
              <button
                type="button"
                id="toggle-pwd-visibility"
                class="absolute right-3 text-slate-400 hover:text-slate-200 text-sm p-1 transition-colors"
                title="Hiện / Ẩn mật mã"
              >
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
            <div id="lock-error-msg" class="hidden text-xs text-rose-400 font-semibold pt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>Mật mã không chính xác. Vui lòng thử lại!</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            id="unlock-submit-btn"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-unlock-keyhole"></i>
            <span>Mở khóa tài liệu (Unlock)</span>
          </button>
        </form>

        <!-- Navigation Footnote -->
        <div class="mt-6 pt-4 border-t border-slate-800 text-center">
          <a
            href="index.html"
            class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 font-semibold transition-colors"
          >
            <i class="fa-solid fa-arrow-left"></i> Quay lại Dashboard
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup interactive handlers
    const form = modal.querySelector('#reading-lock-form');
    const pwdInput = modal.querySelector('#reading-password-input');
    const toggleBtn = modal.querySelector('#toggle-pwd-visibility');
    const errorMsg = modal.querySelector('#lock-error-msg');
    const submitBtn = modal.querySelector('#unlock-submit-btn');
    const lockIcon = modal.querySelector('#lock-icon');

    // Toggle eye
    toggleBtn.onclick = () => {
      const isPwd = pwdInput.type === 'password';
      pwdInput.type = isPwd ? 'text' : 'password';
      toggleBtn.innerHTML = isPwd ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    };

    function attemptUnlock() {
      const entered = (pwdInput.value || '').trim();
      const requiredPassword = getRequiredPassword(levelFolder, filename);
      const masterPassword = (window.EXPERT_READING_PASSWORDS && window.EXPERT_READING_PASSWORDS.masterPassword) || 'neo-teacher-access';

      const isMatch = (entered === requiredPassword) ||
        (entered.toLowerCase() === (requiredPassword ? requiredPassword.toLowerCase() : '')) ||
        (entered === masterPassword);

      if (isMatch) {
        // Success
        errorMsg.classList.add('hidden');
        pwdInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500');

        lockIcon.className = 'fa-solid fa-lock-open text-2xl text-emerald-400';
        submitBtn.className = 'w-full py-3.5 px-4 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-default';
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Mở khóa thành công!</span>';

        setUnlockedState(levelFolder, filename, true);

        setTimeout(() => {
          modal.classList.add('modal-hidden');
          document.body.classList.remove('reading-locked');
          document.documentElement.classList.remove('reading-locked');
          relockFab.style.display = 'flex';
          submitBtn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> <span>Mở khóa tài liệu (Unlock)</span>';
          submitBtn.className = 'w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer';
          pwdInput.value = '';
        }, 400);
      } else {
        // Fail
        errorMsg.classList.remove('hidden');
        pwdInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500');
        modal.querySelector('.relative.w-full.max-w-md').classList.add('shake-animation');

        setTimeout(() => {
          modal.querySelector('.relative.w-full.max-w-md').classList.remove('shake-animation');
        }, 500);
        pwdInput.focus();
      }
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      attemptUnlock();
    };

    function showLockModal() {
      modal.classList.remove('modal-hidden');
      document.body.classList.add('reading-locked');
      document.documentElement.classList.add('reading-locked');
      relockFab.style.display = 'none';
      lockIcon.className = 'fa-solid fa-lock text-2xl text-white';
      pwdInput.value = '';
      errorMsg.classList.add('hidden');
      pwdInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500');
      setTimeout(() => pwdInput.focus(), 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLockSystem);
  } else {
    initLockSystem();
  }
})();

/**
 * Expert IELTS — Centralized Mobile UI & Interaction Engine
 * Handles responsive mobile detection, reading pane switching, 
 * viewport height fixes, and mobile-friendly touch optimizations.
 */

(function () {
  'use strict';

  // Responsive Breakpoint (768px tablet/phone boundary)
  const MOBILE_BREAKPOINT = 768;
  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

  /**
   * 1. Viewport Height Fix (Solves mobile address bar 100vh jumping)
   */
  function setMobileVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * 2. Self-contained Mobile Styles Injection
   */
  function injectMobileStyles() {
    if (document.getElementById('expert-mobile-styles')) return;

    const style = document.createElement('style');
    style.id = 'expert-mobile-styles';
    style.textContent = `
      /* Mobile Viewport helper */
      :root {
        --mobile-primary: #3b82f6;
        --mobile-primary-dark: #1d4ed8;
        --mobile-bg: #f8fafc;
        --mobile-border: #e2e8f0;
      }

      /* Body marker for mobile-specific custom overrides */
      body.is-mobile-view {
        -webkit-tap-highlight-color: transparent;
      }

      /* Mobile Split Pane Switcher */
      .mobile-pane-switcher {
        display: none;
        position: sticky;
        top: 0;
        z-index: 40;
        background: #ffffff;
        border-bottom: 1px solid var(--mobile-border);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        padding: 0.5rem 1rem;
        gap: 0.5rem;
      }

      body.is-mobile-view .mobile-pane-switcher {
        display: flex;
      }

      .mobile-pane-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.55rem 0.75rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        border: 1px solid var(--mobile-border);
        background: #f1f5f9;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .mobile-pane-tab.active {
        background: var(--mobile-primary);
        color: #ffffff;
        border-color: var(--mobile-primary-dark);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.25);
      }

      /* Mobile Layout adjustments for Split Panes */
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .content-panes {
          display: flex !important;
          flex-direction: column !important;
          height: auto !important;
          min-height: calc(100vh - 120px) !important;
        }

        .splitter {
          display: none !important;
        }

        .content-panes > .pane {
          width: 100% !important;
          padding: 1.25rem 1rem !important;
        }

        .content-panes > .pane.mobile-pane-hidden {
          display: none !important;
        }

        .content-panes > .pane.mobile-pane-visible {
          display: block !important;
        }
      }

      /* Mobile Floating Quick-Nav / Back to Top Button */
      #mobile-back-to-top {
        position: fixed;
        bottom: 1.25rem;
        right: 1.25rem;
        z-index: 99;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #0f172a;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px);
        transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
      }

      #mobile-back-to-top.visible {
        opacity: 0.95;
        visibility: visible;
        transform: translateY(0);
      }

      #mobile-back-to-top:hover, #mobile-back-to-top:active {
        opacity: 1;
        transform: scale(1.05);
        background: var(--mobile-primary);
      }

      /* ==========================================================
         Module Lessons & Interactive Exercise Mobile Optimizations
         ========================================================== */
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        /* 1. Header Flex Rows: Stack vertically on mobile so right side text never gets squeezed */
        .flex.items-center.gap-4,
        .flex.items-start.gap-4,
        .flex.gap-4 {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 0.75rem !important;
        }

        /* 2. Scale down huge headings on mobile screens */
        .text-3xl {
          font-size: 1.3rem !important;
          line-height: 1.3 !important;
        }
        .text-4xl {
          font-size: 1.55rem !important;
          line-height: 1.25 !important;
        }
        .text-5xl {
          font-size: 1.8rem !important;
          line-height: 1.2 !important;
        }
        .text-2xl {
          font-size: 1.2rem !important;
          line-height: 1.35 !important;
        }
        .text-xl {
          font-size: 1.05rem !important;
          line-height: 1.35 !important;
        }

        /* 3. Badge headers inside module lessons */
        div[class*="rounded-2xl"][class*="p-4"] {
          padding: 0.6rem 1rem !important;
          display: inline-flex !important;
          width: auto !important;
          max-width: 100% !important;
        }

        /* 4. Tab Navigation on interactive modules: smooth horizontal swipe */
        .overflow-x-auto,
        div[role="tablist"] {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          padding-bottom: 0.35rem !important;
        }
        div[role="tablist"]::-webkit-scrollbar {
          display: none !important;
        }

        .tab-btn {
          white-space: nowrap !important;
          padding: 0.75rem 1rem !important;
          font-size: 0.85rem !important;
          flex-shrink: 0 !important;
        }

        /* 5. Padding adjustments on cards & main containers */
        .p-4.sm\\:p-10,
        .sm\\:p-10,
        .p-10 {
          padding: 1rem !important;
        }
        .p-6 {
          padding: 1rem !important;
        }
        .p-8 {
          padding: 1.15rem !important;
        }

        /* 6. Fix interactive switcher buttons and option pills */
        .switcher-btn,
        .filter-pill {
          white-space: normal !important;
          text-align: left !important;
          line-height: 1.3 !important;
        }

        /* 7. Grid columns: 1 column on mobile */
        .grid-cols-1.md\\:grid-cols-2,
        .grid-cols-1.sm\\:grid-cols-3,
        .grid.grid-cols-2,
        .grid.grid-cols-3 {
          grid-template-columns: 1fr !important;
          gap: 1rem !important;
        }

        /* 8. Container & horizontal overflow prevention */
        body, html, .container, main, .tab-content {
          max-width: 100vw !important;
          box-sizing: border-box !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 3. Mobile Two-Pane Switcher (Passage vs. Questions)
   */
  function setupSplitPaneMobileSwitcher(isMobile) {
    const leftPane = document.getElementById('left-pane');
    const rightPane = document.getElementById('right-pane');
    const contentPanes = document.querySelector('.content-panes');

    if (!leftPane || !rightPane || !contentPanes) return;

    let switcher = document.getElementById('mobile-pane-switcher');

    if (isMobile) {
      if (!switcher) {
        switcher = document.createElement('div');
        switcher.id = 'mobile-pane-switcher';
        switcher.className = 'mobile-pane-switcher';

        // Detect labels based on content
        const leftIsPassage = leftPane.querySelector('.reading-passage') || leftPane.innerText.toLowerCase().includes('reading passage');
        const leftLabel = leftIsPassage ? '📖 Passage' : '📄 Left Section';
        const rightLabel = '✍️ Questions & Practice';

        switcher.innerHTML = `
          <button type="button" class="mobile-pane-tab active" data-target="left">${leftLabel}</button>
          <button type="button" class="mobile-pane-tab" data-target="right">${rightLabel}</button>
        `;

        contentPanes.parentNode.insertBefore(switcher, contentPanes);

        // Tab click handling
        switcher.querySelectorAll('.mobile-pane-tab').forEach((tab) => {
          tab.addEventListener('click', function () {
            switcher.querySelectorAll('.mobile-pane-tab').forEach((t) => t.classList.remove('active'));
            this.classList.add('active');

            const target = this.getAttribute('data-target');
            if (target === 'left') {
              leftPane.classList.remove('mobile-pane-hidden');
              leftPane.classList.add('mobile-pane-visible');
              rightPane.classList.add('mobile-pane-hidden');
              rightPane.classList.remove('mobile-pane-visible');
              leftPane.scrollTop = 0;
            } else {
              rightPane.classList.remove('mobile-pane-hidden');
              rightPane.classList.add('mobile-pane-visible');
              leftPane.classList.add('mobile-pane-hidden');
              leftPane.classList.remove('mobile-pane-visible');
              rightPane.scrollTop = 0;
            }
          });
        });
      }

      // Initial pane visibility on mobile: Left pane visible by default
      const activeTab = switcher.querySelector('.mobile-pane-tab.active');
      const target = activeTab ? activeTab.getAttribute('data-target') : 'left';
      if (target === 'left') {
        leftPane.classList.remove('mobile-pane-hidden');
        leftPane.classList.add('mobile-pane-visible');
        rightPane.classList.add('mobile-pane-hidden');
        rightPane.classList.remove('mobile-pane-visible');
      } else {
        rightPane.classList.remove('mobile-pane-hidden');
        rightPane.classList.add('mobile-pane-visible');
        leftPane.classList.add('mobile-pane-hidden');
        leftPane.classList.remove('mobile-pane-visible');
      }
    } else {
      // Desktop: Reset pane classes so both are visible side-by-side
      leftPane.classList.remove('mobile-pane-hidden', 'mobile-pane-visible');
      rightPane.classList.remove('mobile-pane-hidden', 'mobile-pane-visible');
    }
  }

  /**
   * 4. Floating Back to Top Button
   */
  function setupFloatingBackToTop() {
    let btn = document.getElementById('mobile-back-to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'mobile-back-to-top';
      btn.title = 'Scroll to top';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.innerHTML = '▲';
      document.body.appendChild(btn);

      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const leftPane = document.getElementById('left-pane');
        const rightPane = document.getElementById('right-pane');
        if (leftPane) leftPane.scrollTo({ top: 0, behavior: 'smooth' });
        if (rightPane) rightPane.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const scrollThreshold = 300;
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const leftPane = document.getElementById('left-pane');
      const rightPane = document.getElementById('right-pane');
      const paneScroll = Math.max(leftPane ? leftPane.scrollTop : 0, rightPane ? rightPane.scrollTop : 0);

      if (scrollY > scrollThreshold || paneScroll > scrollThreshold) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const leftPane = document.getElementById('left-pane');
    const rightPane = document.getElementById('right-pane');
    if (leftPane) leftPane.addEventListener('scroll', handleScroll, { passive: true });
    if (rightPane) rightPane.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * 5. Initialize & Handle Viewport Changes
   */
  function handleViewportChange(e) {
    const isMobile = e ? e.matches : mobileQuery.matches;

    if (isMobile) {
      document.body.classList.add('is-mobile-view');
    } else {
      document.body.classList.remove('is-mobile-view');
    }

    setMobileVh();
    setupSplitPaneMobileSwitcher(isMobile);
  }

  function init() {
    injectMobileStyles();
    setMobileVh();
    setupFloatingBackToTop();
    handleViewportChange();

    // Event Listeners
    mobileQuery.addEventListener('change', handleViewportChange);
    window.addEventListener('resize', setMobileVh, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(setMobileVh, 150);
      setTimeout(handleViewportChange, 150);
    });

    console.log(`📱 [Expert IELTS] Mobile engine initialized. Mobile view: ${mobileQuery.matches}`);
  }

  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

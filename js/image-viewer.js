/**
 * Expert IELTS — Interactive Visual Reference & Pan/Zoom Lightbox Engine
 * Provides full mouse drag, touch pan, pinch-to-zoom, wheel zoom, and keyboard controls.
 */

(function () {
  'use strict';

  let currentZoom = 1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4.0;
  const ZOOM_STEP = 0.25;

  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Touch tracking for pinch-to-zoom
  let initialPinchDistance = null;
  let initialPinchZoom = 1;

  function getModalElements() {
    return {
      modal: document.getElementById('imageZoomModal'),
      viewport: document.getElementById('modalViewport'),
      img: document.getElementById('modalZoomImg'),
      zoomText: document.getElementById('zoomLevelText'),
      originalImg: document.getElementById('grammar-reference-img') || document.querySelector('.visual-reference-img')
    };
  }

  function updateTransform(withAnimation = false) {
    const { img, zoomText, viewport } = getModalElements();
    if (!img) return;

    img.style.transition = withAnimation ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' : 'none';
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;

    if (zoomText) {
      zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    if (viewport) {
      if (isDragging) {
        viewport.style.cursor = 'grabbing';
        if (img) img.style.cursor = 'grabbing';
      } else if (currentZoom > 1) {
        viewport.style.cursor = 'grab';
        if (img) img.style.cursor = 'grab';
      } else {
        viewport.style.cursor = 'zoom-in';
        if (img) img.style.cursor = 'zoom-in';
      }
    }
  }

  function openImageModal(imgSrc) {
    const { modal, img, originalImg } = getModalElements();
    if (!modal || !img) return;

    const source = imgSrc || (originalImg ? originalImg.src : null);
    if (!source || source.trim() === '' || (originalImg && originalImg.classList.contains('hidden'))) {
      return;
    }

    img.src = source;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    resetZoom();
  }

  function closeImageModal() {
    const { modal } = getModalElements();
    if (!modal) return;

    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    resetZoom();
  }

  function setZoom(newZoom, centerX = null, centerY = null, withAnimation = true) {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newZoom * 100) / 100));
    if (clampedZoom === currentZoom) return;

    const { viewport } = getModalElements();

    if (centerX !== null && centerY !== null && viewport) {
      const rect = viewport.getBoundingClientRect();
      const originX = centerX - rect.left - rect.width / 2;
      const originY = centerY - rect.top - rect.height / 2;

      const scaleChange = clampedZoom / currentZoom;
      translateX = originX - (originX - translateX) * scaleChange;
      translateY = originY - (originY - translateY) * scaleChange;
    }

    currentZoom = clampedZoom;
    if (currentZoom <= 1 && clampedZoom <= 1) {
      // Settle gently back to center when at normal zoom
      translateX = 0;
      translateY = 0;
    }

    updateTransform(withAnimation);
  }

  function zoomIn() {
    setZoom(currentZoom + ZOOM_STEP);
  }

  function zoomOut() {
    setZoom(currentZoom - ZOOM_STEP);
  }

  function resetZoom() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateTransform(true);
  }

  function toggleZoom(e) {
    if (e) e.stopPropagation();
    if (currentZoom <= 1.1) {
      const clientX = e ? e.clientX : null;
      const clientY = e ? e.clientY : null;
      setZoom(2.0, clientX, clientY, true);
    } else {
      resetZoom();
    }
  }

  function handleWheelZoom(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(currentZoom + delta, e.clientX, e.clientY, false);
  }

  function handleModalBackdropClick(e) {
    if (e.target.id === 'imageZoomModal') {
      closeImageModal();
    }
  }

  /**
   * Mouse Drag & Pan Handler
   */
  function setupMouseDrag() {
    const { viewport, img } = getModalElements();
    if (!viewport) return;

    function onMouseDown(e) {
      // Left mouse button only
      if (e.button !== 0) return;
      e.preventDefault();

      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;

      updateTransform(false);

      function onMouseMove(moveEvent) {
        if (!isDragging) return;
        moveEvent.preventDefault();
        translateX = moveEvent.clientX - startX;
        translateY = moveEvent.clientY - startY;
        updateTransform(false);
      }

      function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        updateTransform(true);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
    }

    viewport.addEventListener('mousedown', onMouseDown);
    if (img) img.addEventListener('mousedown', onMouseDown);
  }

  /**
   * Touch Pan & Pinch-to-Zoom Handler
   */
  function setupTouchDrag() {
    const { viewport } = getModalElements();
    if (!viewport) return;

    function getTouchDistance(touch1, touch2) {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.hypot(dx, dy);
    }

    viewport.addEventListener(
      'touchstart',
      function (e) {
        if (e.touches.length === 1) {
          isDragging = true;
          const touch = e.touches[0];
          startX = touch.clientX - translateX;
          startY = touch.clientY - translateY;
          initialPinchDistance = null;
        } else if (e.touches.length === 2) {
          isDragging = false;
          initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
          initialPinchZoom = currentZoom;
        }
      },
      { passive: true }
    );

    viewport.addEventListener(
      'touchmove',
      function (e) {
        if (isDragging && e.touches.length === 1) {
          e.preventDefault();
          const touch = e.touches[0];
          translateX = touch.clientX - startX;
          translateY = touch.clientY - startY;
          updateTransform(false);
        } else if (e.touches.length === 2 && initialPinchDistance) {
          e.preventDefault();
          const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
          const scaleMultiplier = currentDistance / initialPinchDistance;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          setZoom(initialPinchZoom * scaleMultiplier, midX, midY, false);
        }
      },
      { passive: false }
    );

    viewport.addEventListener('touchend', function (e) {
      if (e.touches.length === 0) {
        isDragging = false;
        initialPinchDistance = null;
        updateTransform(true);
      } else if (e.touches.length === 1) {
        // Switch back to 1-finger pan smoothly
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - translateX;
        startY = touch.clientY - translateY;
        initialPinchDistance = null;
      }
    });
  }

  /**
   * Keyboard Shortcuts (Esc to close, +/- to zoom, Arrow keys to pan)
   */
  function setupKeyboardControls() {
    document.addEventListener('keydown', function (e) {
      const { modal } = getModalElements();
      if (!modal || modal.classList.contains('hidden') || modal.style.display === 'none') {
        return;
      }

      switch (e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'ArrowLeft':
          translateX += 40;
          updateTransform(true);
          break;
        case 'ArrowRight':
          translateX -= 40;
          updateTransform(true);
          break;
        case 'ArrowUp':
          translateY += 40;
          updateTransform(true);
          break;
        case 'ArrowDown':
          translateY -= 40;
          updateTransform(true);
          break;
      }
    });
  }

  /**
   * Initialize Global Event Bindings
   */
  function init() {
    const { viewport, originalImg, img } = getModalElements();

    if (viewport) {
      setupMouseDrag();
      setupTouchDrag();
      viewport.addEventListener('wheel', handleWheelZoom, { passive: false });
      viewport.addEventListener('dblclick', toggleZoom);
    }

    if (img) {
      img.style.pointerEvents = 'auto';
      img.style.userSelect = 'none';
      img.style.webkitUserDrag = 'none';
    }

    if (originalImg) {
      const container = originalImg.closest('.cursor-pointer') || originalImg;
      container.addEventListener('click', () => openImageModal());
    }

    setupKeyboardControls();
    console.log('🖼️ [Expert IELTS] Image Viewer & Pan/Zoom engine initialized.');
  }

  // Expose global methods for backward compatibility with existing inline onclick handlers
  window.openImageModal = openImageModal;
  window.closeImageModal = closeImageModal;
  window.zoomIn = zoomIn;
  window.zoomOut = zoomOut;
  window.resetZoom = resetZoom;
  window.toggleZoom = toggleZoom;
  window.handleWheelZoom = handleWheelZoom;
  window.handleModalBackdropClick = handleModalBackdropClick;
  window.startPan = function () {}; // Handled directly via event listeners

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

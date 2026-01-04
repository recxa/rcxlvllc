/**
 * Window Manager - Floating popup windows for embedded content
 *
 * DRAG FIX STRATEGIES (can test each):
 * 1. Pointer Capture - tells browser to send ALL pointer events to capturing element
 * 2. Overlay - creates invisible full-screen div during drag to block iframe events
 * 3. Both combined (current default)
 */

(function() {
  const windows = new Map();
  let zIndexCounter = 1000;
  let windowIdCounter = 0;

  // Default window size
  const DEFAULT_WIDTH = 640;
  const DEFAULT_HEIGHT = 400;

  // Cascade offset for new windows
  let cascadeX = 60;
  let cascadeY = 60;

  // ============ DRAG FIX: OVERLAY APPROACH ============
  // Creates a full-screen invisible div that captures all mouse events
  let dragOverlay = null;

  function createOverlay() {
    if (dragOverlay) return;
    dragOverlay = document.createElement('div');
    dragOverlay.id = 'window-drag-overlay';
    dragOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      cursor: grabbing;
      background: transparent;
    `;
    document.body.appendChild(dragOverlay);
  }

  function removeOverlay() {
    if (dragOverlay) {
      dragOverlay.remove();
      dragOverlay = null;
    }
  }

  // ============ ACTIVE STATE ============
  let activeDrag = null;
  let activeResize = null;
  let capturedPointerId = null;
  let captureElement = null;

  // ============ DRAG HANDLING ============
  function startDrag(win, e, offsetX, offsetY) {
    activeDrag = { win, offsetX, offsetY };
    win.classList.add('dragging');

    // Strategy 1: Pointer capture (primary)
    if (e.pointerId !== undefined) {
      try {
        e.target.setPointerCapture(e.pointerId);
        capturedPointerId = e.pointerId;
        captureElement = e.target;
      } catch (err) {
        console.warn('Pointer capture failed:', err);
      }
    }

    // Strategy 2: Overlay (backup)
    createOverlay();
  }

  function updateDrag(clientX, clientY) {
    if (!activeDrag) return;

    const { win, offsetX, offsetY } = activeDrag;
    let newX = clientX - offsetX;
    let newY = clientY - offsetY;

    // Keep title bar visible
    newX = Math.max(-win.offsetWidth + 100, Math.min(newX, window.innerWidth - 100));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 32));

    win.style.left = newX + 'px';
    win.style.top = newY + 'px';
  }

  function endDrag() {
    if (!activeDrag) return;

    activeDrag.win.classList.remove('dragging');
    activeDrag = null;

    // Release pointer capture
    if (capturedPointerId !== null && captureElement) {
      try {
        captureElement.releasePointerCapture(capturedPointerId);
      } catch (err) {}
      capturedPointerId = null;
      captureElement = null;
    }

    // Remove overlay
    removeOverlay();
  }

  // ============ RESIZE HANDLING ============
  function startResize(win, edge, e) {
    activeResize = {
      win,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: win.offsetWidth,
      startH: win.offsetHeight,
      startLeft: win.offsetLeft,
      startTop: win.offsetTop,
    };
    win.classList.add('resizing');
    document.body.style.cursor = getResizeCursor(edge);

    // Strategy 1: Pointer capture
    if (e.pointerId !== undefined) {
      try {
        e.target.setPointerCapture(e.pointerId);
        capturedPointerId = e.pointerId;
        captureElement = e.target;
      } catch (err) {}
    }

    // Strategy 2: Overlay
    createOverlay();
    if (dragOverlay) {
      dragOverlay.style.cursor = getResizeCursor(edge);
    }
  }

  function getResizeCursor(edge) {
    const cursors = {
      's': 'ns-resize',
      'e': 'ew-resize',
      'w': 'ew-resize',
      'se': 'nwse-resize',
      'sw': 'nesw-resize',
    };
    return cursors[edge] || 'default';
  }

  function updateResize(clientX, clientY) {
    if (!activeResize) return;

    const { win, edge, startX, startY, startW, startH, startLeft, startTop } = activeResize;
    const dx = clientX - startX;
    const dy = clientY - startY;

    let newW = startW;
    let newH = startH;
    let newLeft = startLeft;

    if (edge.includes('e')) {
      newW = Math.max(320, startW + dx);
    }
    if (edge.includes('w')) {
      const possibleW = startW - dx;
      if (possibleW >= 320) {
        newW = possibleW;
        newLeft = startLeft + dx;
      }
    }
    if (edge.includes('s')) {
      newH = Math.max(200, startH + dy);
    }

    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
    win.style.left = newLeft + 'px';
  }

  function endResize() {
    if (!activeResize) return;

    activeResize.win.classList.remove('resizing');
    activeResize = null;
    document.body.style.cursor = '';

    // Release pointer capture
    if (capturedPointerId !== null && captureElement) {
      try {
        captureElement.releasePointerCapture(capturedPointerId);
      } catch (err) {}
      capturedPointerId = null;
      captureElement = null;
    }

    // Remove overlay
    removeOverlay();
  }

  // ============ GLOBAL EVENT HANDLERS ============
  // These handle events on the document AND the overlay

  function handlePointerMove(e) {
    // Check if button is still held
    if (e.buttons === 0) {
      endDrag();
      endResize();
      return;
    }

    if (activeDrag) {
      updateDrag(e.clientX, e.clientY);
      e.preventDefault();
    }
    if (activeResize) {
      updateResize(e.clientX, e.clientY);
      e.preventDefault();
    }
  }

  function handlePointerUp(e) {
    endDrag();
    endResize();
  }

  // Attach to document
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);

  // Fallbacks for edge cases
  window.addEventListener('blur', () => { endDrag(); endResize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { endDrag(); endResize(); }
  });

  // ============ WINDOW CREATION ============
  function createWindow(options = {}) {
    const {
      title = 'Window',
      content = null,
      url = null,
      videoId = null,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      x = null,
      y = null,
    } = options;

    const id = `win-${++windowIdCounter}`;

    // Calculate position
    let posX = x ?? cascadeX;
    let posY = y ?? cascadeY;

    // Cascade next window
    cascadeX += 30;
    cascadeY += 30;
    if (cascadeX > window.innerWidth - 300) cascadeX = 60;
    if (cascadeY > window.innerHeight - 200) cascadeY = 60;

    // Create window element
    const win = document.createElement('div');
    win.className = 'floating-window';
    win.id = id;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.left = posX + 'px';
    win.style.top = posY + 'px';
    win.style.zIndex = ++zIndexCounter;

    // Resize edges (only s, e, w, se, sw - no north edges)
    const edges = ['s', 'e', 'w', 'se', 'sw'];
    edges.forEach(edge => {
      const handle = document.createElement('div');
      handle.className = `window-edge window-edge-${edge}`;
      handle.dataset.edge = edge;
      win.appendChild(handle);

      // Use pointerdown instead of mousedown
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startResize(win, edge, e);
        bringToFront(id);
      });
    });

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar';

    const titleText = document.createElement('span');
    titleText.className = 'window-title';
    titleText.textContent = title;

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    const btnMinimize = document.createElement('button');
    btnMinimize.className = 'window-btn window-btn-minimize';
    btnMinimize.innerHTML = '−';
    btnMinimize.title = 'Minimize';

    const btnFullscreen = document.createElement('button');
    btnFullscreen.className = 'window-btn window-btn-fullscreen';
    btnFullscreen.innerHTML = '⛶';
    btnFullscreen.title = 'Fullscreen';

    const btnClose = document.createElement('button');
    btnClose.className = 'window-btn window-btn-close';
    btnClose.innerHTML = '×';
    btnClose.title = 'Close';

    controls.appendChild(btnMinimize);
    controls.appendChild(btnFullscreen);
    controls.appendChild(btnClose);
    titleBar.appendChild(titleText);
    titleBar.appendChild(controls);

    // Content area
    const contentArea = document.createElement('div');
    contentArea.className = 'window-content';

    // Populate content
    if (videoId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      contentArea.appendChild(iframe);
    } else if (url) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      contentArea.appendChild(iframe);
    } else if (content) {
      contentArea.innerHTML = content;
    }

    win.appendChild(titleBar);
    win.appendChild(contentArea);
    document.body.appendChild(win);

    // State
    const state = {
      id,
      element: win,
      minimized: false,
      maximized: false,
      restoreRect: null,
    };
    windows.set(id, state);

    // Event handlers
    btnClose.addEventListener('click', () => closeWindow(id));
    btnMinimize.addEventListener('click', () => toggleMinimize(id));
    btnFullscreen.addEventListener('click', () => toggleMaximize(id));

    // Bring to front on click
    win.addEventListener('mousedown', () => bringToFront(id));

    // Dragging via title bar - use pointerdown
    titleBar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.window-controls')) return;
      if (state.maximized) return;

      const offsetX = e.clientX - win.offsetLeft;
      const offsetY = e.clientY - win.offsetTop;

      startDrag(win, e, offsetX, offsetY);
      bringToFront(id);
      e.preventDefault();
    });

    // Animate in
    requestAnimationFrame(() => {
      win.classList.add('visible');
    });

    return id;
  }

  function closeWindow(id) {
    const state = windows.get(id);
    if (!state) return;

    state.element.classList.remove('visible');
    state.element.classList.add('closing');

    setTimeout(() => {
      state.element.remove();
      windows.delete(id);
    }, 200);
  }

  function toggleMinimize(id) {
    const state = windows.get(id);
    if (!state) return;

    state.minimized = !state.minimized;
    state.element.classList.toggle('minimized', state.minimized);
  }

  function toggleMaximize(id) {
    const state = windows.get(id);
    if (!state) return;

    if (state.maximized) {
      // Restore
      state.element.style.left = state.restoreRect.left + 'px';
      state.element.style.top = state.restoreRect.top + 'px';
      state.element.style.width = state.restoreRect.width + 'px';
      state.element.style.height = state.restoreRect.height + 'px';
      state.element.classList.remove('maximized');
      state.maximized = false;
    } else {
      // Save current rect
      state.restoreRect = {
        left: state.element.offsetLeft,
        top: state.element.offsetTop,
        width: state.element.offsetWidth,
        height: state.element.offsetHeight,
      };
      // Maximize
      state.element.style.left = '0';
      state.element.style.top = '0';
      state.element.style.width = '100vw';
      state.element.style.height = '100vh';
      state.element.classList.add('maximized');
      state.maximized = true;
    }
  }

  function bringToFront(id) {
    const state = windows.get(id);
    if (!state) return;
    state.element.style.zIndex = ++zIndexCounter;
  }

  function closeAll() {
    windows.forEach((_, id) => closeWindow(id));
  }

  // Extract YouTube video ID from URL
  function extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
      /youtube\.com\/v\/([^&?\s]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Open YouTube video in window
  function openYouTube(url, title = 'Video') {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      console.warn('Could not extract YouTube video ID from:', url);
      window.open(url, '_blank');
      return null;
    }
    return createWindow({
      title,
      videoId,
      width: 720,
      height: 450,
    });
  }

  // Expose API
  window.WindowManager = {
    create: createWindow,
    close: closeWindow,
    closeAll,
    bringToFront,
    openYouTube,
    extractYouTubeId,
  };
})();

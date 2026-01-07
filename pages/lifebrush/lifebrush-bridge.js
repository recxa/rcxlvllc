(function () {
  try { parent.postMessage({ type: 'ready', pageId: 'lifebrush' }, '*'); } catch {}

  function focusCanvas() {
    const c = document.querySelector('#lifebrush-container canvas');
    if (c) {
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
      try { c.focus(); } catch {}
    }
  }

  function resizeToContainer() {
    const c = document.getElementById('lifebrush-container');
    if (window.resizeCanvas && c) {
      const r = c.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) {
        try { window.resizeCanvas(r.width, r.height); } catch {}
      }
    }
  }

  window.addEventListener('message', (ev) => {
    const msg = ev.data || {};
    if (msg && msg.type === 'visibility') {
      if (typeof window.noLoop === 'function' && typeof window.loop === 'function') {
        if (msg.visible) window.loop(); else window.noLoop();
      }
      if (msg.visible) {
        // Resize canvas when becoming visible (iframe may have been display:none)
        setTimeout(resizeToContainer, 50);
        if (msg.focus) focusCanvas();
      }
    }
  });

  // Also focus once after initial sketch setup, if canvas appears later
  document.addEventListener('DOMContentLoaded', () => {
    // small delay lets p5 create the canvas
    setTimeout(focusCanvas, 0);
  });

  window.addEventListener('resize', resizeToContainer);
})();

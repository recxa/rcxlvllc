// /core/bus.js

(() => {
  // tiny stub so scripts don’t 404 or parse HTML
  const listeners = new Map();

  function on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(handler);
  }

  function off(type, handler) {
    const arr = listeners.get(type) || [];
    const i = arr.indexOf(handler);
    if (i >= 0) arr.splice(i, 1);
  }

  function emit(type, payload) {
    (listeners.get(type) || []).forEach(fn => {
      try { fn(payload); } catch (e) { console.error(e); }
    });
  }

  window.bus = { on, off, emit };
})();

// /core/router.js
import { externalUrls } from './externals.js';

(() => {
  const treeRoot = document.getElementById('tree');

  // Wait for sidebar to be ready before attaching click handlers
  // This prevents race condition where router runs before sidebar builds the tree
  if (document.readyState === 'loading') {
    window.addEventListener('sidebarReady', init);
  } else {
    // If DOM already loaded, sidebar might already be ready or will be soon
    window.addEventListener('sidebarReady', init);
    // Also try immediately in case event already fired
    setTimeout(init, 0);
  }

  let initialized = false;

  async function init() {
    if (initialized) return;

    // Check if sidebar elements exist
    const items = treeRoot.querySelectorAll('li[data-type]');
    if (items.length === 0) return; // Sidebar not ready yet

    initialized = true;
    boot().catch(err => console.error(err));
  }

  async function boot() {
    const res = await fetch('/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest fetch ${res.status}`);
    const manifest = await res.json();
    const nodeMap = indexNodes(manifest.tree || []);

    // attach click handlers to all <li> leaves
    treeRoot.querySelectorAll('li[data-type]').forEach(li => {
      const id = li.dataset.nodeId;
      const type = li.dataset.type;

      li.addEventListener('click', ev => {
        // don't interfere with folder/section toggles higher up the tree
        // but prevent the event from bubbling past this LI
        ev.stopPropagation();

        if (type === 'page') {
          navigateTo(id);
        } else if (type === 'link') {
          // prefer manifest.url if present, else fall back to externals map
          const node = nodeMap[id] || {};
          const url = node.url || externalUrls[id];

          if (url) {
            // Check if it's a YouTube link and use WindowManager if available
            if (window.WindowManager && window.WindowManager.extractYouTubeId(url)) {
              const title = li.textContent || id;
              window.WindowManager.openYouTube(url, title);
            } else {
              // open in a new tab with no opener for safety
              const w = window.open(url, '_blank', 'noopener,noreferrer');
              if (w) w.opener = null;
            }
          } else {
            console.warn('link missing url:', id);
          }
        }
      });
    });

    // NOTE: Initial page load is handled by viewer.js (single source of truth)
    // Router only handles navigation clicks and back/forward

    // back/forward
    window.addEventListener('popstate', () => {
      // Use viewer's path mapping to get correct ID
      const id = window.viewer.getPageFromPath
        ? window.viewer.getPageFromPath(location.pathname)
        : cleanPath(location.pathname) || 'home';
      if (window.viewer) window.viewer.show(id);
    });
  }

  function navigateTo(id) {
    // Use path-based URL if available
    const urlPath = window.viewer.getPathForId ? window.viewer.getPathForId(id) : id;
    history.pushState({}, '', '/' + urlPath);
    window.viewer.show(id);
  }

  function cleanPath(path) {
    const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
    return clean.length ? clean : null;
  }

  function indexNodes(nodes) {
    const map = {};
    const walk = arr => {
      arr.forEach(n => {
        if (n.id) map[n.id] = n;
        if (n.children) walk(n.children);
      });
    };
    walk(nodes);
    return map;
  }
})();

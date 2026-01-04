// /core/router.js
import { externalUrls } from './externals.js';

(() => {
    
  const treeRoot = document.getElementById('tree');

  boot().catch(err => console.error(err));

  async function boot() {
    const res = await fetch('./manifest.json', { cache: 'no-store' });
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

    // initial load (skip refresh routing complexities for now)
    const startId = pathToId(location.pathname) || 'home';
    if (nodeMap[startId] && nodeMap[startId].type === 'page') {
      window.viewer.show(startId);
    } else {
      window.viewer.show('home');
    }

    // back/forward
    window.addEventListener('popstate', () => {
      const id = pathToId(location.pathname) || 'home';
      window.viewer.show(id);
    });
  }

  function navigateTo(id) {
    history.pushState({}, '', '/' + id);
    window.viewer.show(id);
  }

  function pathToId(path) {
    const clean = path.replace(/^\/+/, '');
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

// /core/viewer.js
(() => {
  const viewerEl = document.getElementById('viewer');
  const iframes = new Map();  // id -> iframe element
  let currentId = null;
  let homeFrame = null;

  // Path <-> ID mapping
  const pathToId = new Map();
  const idToPath = new Map();

  boot().catch(err => {
    console.error(err);
    viewerEl.textContent = 'Failed to init viewer.';
  });

  async function boot() {
    const res = await fetch('/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest fetch ${res.status}`);
    const manifest = await res.json();

    // Build path mappings from tree structure
    buildPathMappings(manifest.tree || []);

    const nodes = flatten(manifest.tree || []);
    nodes.forEach(node => {
      if (node.type === 'page' && node.iframeSrc) {
        const url = new URL(node.iframeSrc, document.baseURI);
        url.searchParams.set('_v', Date.now().toString());

        const iframe = document.createElement('iframe');
        iframe.tabIndex = -1;
        iframe.className = 'iframe-page';
        iframe.dataset.pageId = node.id;
        iframe.src = url.toString();
        iframe.setAttribute('title', node.title);
        iframe.loading = 'eager';

        iframe.addEventListener('load', () => {
          console.log(`[viewer] loaded ${node.id} →`, iframe.src);
        });
        iframe.addEventListener('error', (e) => {
          console.error(`[viewer] FAILED to load ${node.id} →`, iframe.src, e);
        });

        console.log(`[viewer] create ${node.id} src=`, iframe.src);
        viewerEl.appendChild(iframe);
        iframes.set(node.id, iframe);

        if (node.id === 'home') {
          homeFrame = iframe;
        }
      }
    });

    // Listen for messages from iframes (especially home/planet view)
    window.addEventListener('message', handleIframeMessage);

    // Connect home frame to bridge
    if (homeFrame && window.ManifestBridge) {
      window.ManifestBridge.setPlanetFrame(homeFrame);
    }

    // Determine initial page from URL path (let viewer be the single source of truth)
    const initialPage = getPageFromPath(location.pathname);
    if (iframes.has(initialPage)) {
      show(initialPage);
    } else if (iframes.has('home')) {
      show('home');
    } else {
      viewerEl.textContent = 'No home page found.';
    }
  }

  function getPageFromPath(path) {
    const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!clean.length) return 'home';

    // Check path mapping first
    if (pathToId.has(clean)) {
      return pathToId.get(clean);
    }

    // Fall back to direct ID (for backwards compatibility)
    return clean;
  }

  // Convert title to URL-safe path segment
  function titleToSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '_')       // Spaces to underscores
      .replace(/-+/g, '_')        // Hyphens to underscores
      .replace(/_+/g, '_')        // Collapse multiple underscores
      .replace(/^_|_$/g, '');     // Trim underscores
  }

  // Build path mappings from manifest tree
  function buildPathMappings(tree, parentPath = '') {
    tree.forEach(node => {
      const slug = titleToSlug(node.title || node.id);
      let nodePath;

      // Special handling for top-level items
      if (!parentPath) {
        if (node.id === 'home') {
          nodePath = '';  // home maps to root
        } else {
          nodePath = slug;
        }
      } else {
        nodePath = parentPath + '/' + slug;
      }

      // Store mapping for pages and links
      if (node.id) {
        pathToId.set(nodePath, node.id);
        idToPath.set(node.id, nodePath);

        // Also map by ID directly for backwards compatibility
        if (nodePath !== node.id) {
          pathToId.set(node.id, node.id);
        }
      }

      // Recurse into children
      if (node.children) {
        buildPathMappings(node.children, nodePath);
      }
    });
  }

  // Get URL path for a page ID
  function getPathForId(id) {
    return idToPath.get(id) || id;
  }

  function handleIframeMessage(event) {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'planet:hover':
      case 'planet:unhover':
      case 'planet:click':
      case 'planet:focus':
        // Forward to bridge
        if (window.ManifestBridge) {
          // Bridge handles these via its own listener
        }
        break;

      case 'navigate':
        // Navigate to a page
        if (msg.target) {
          show(msg.target);
          const urlPath = getPathForId(msg.target);
          history.pushState({}, '', '/' + urlPath);
        }
        break;

      case 'openLink':
        // Open external link
        if (msg.target && window.externalUrls) {
          const url = window.externalUrls[msg.target];
          if (url) {
            openExternalLink(url, msg.target, msg.title);
          }
        } else if (window.sidebarAPI) {
          // Trigger a click on the sidebar item
          const el = window.sidebarAPI.getElement(msg.target);
          if (el) el.click();
        }
        break;

      case 'expand':
        // Expand a sidebar section
        if (msg.target && window.sidebarAPI) {
          window.sidebarAPI.expand(msg.target);
        }
        break;

      case 'collapse':
        // Collapse a sidebar section (from planet navigation)
        if (msg.target && window.sidebarAPI) {
          window.sidebarAPI.collapseIfPlanetOpened(msg.target);
        }
        break;
    }
  }

  function openExternalLink(url, id, title) {
    // Check if it's a YouTube link
    if (window.WindowManager && window.WindowManager.extractYouTubeId(url)) {
      window.WindowManager.openYouTube(url, title || id || 'Video');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function show(id) {
    if (currentId === id) return;

    if (currentId && iframes.has(currentId)) {
      const oldFrame = iframes.get(currentId);
      oldFrame.classList.remove('active');
      try { oldFrame.contentWindow.postMessage({ type: 'visibility', visible: false }, '*'); } catch {}
    }

    if (iframes.has(id)) {
      const newFrame = iframes.get(id);
      newFrame.classList.add('active');

      setTimeout(() => {
        try { newFrame.contentWindow.focus(); } catch {}
        try {
          const doc = newFrame.contentDocument || newFrame.contentWindow.document;
          const canvas = doc && doc.querySelector('#lifebrush-container canvas');
          if (canvas) {
            if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '0');
            canvas.focus();
          }
        } catch {}
      }, 0);

      try {
        newFrame.contentWindow.postMessage({ type: 'visibility', visible: true, focus: true }, '*');
      } catch {}

      currentId = id;
    } else {
      console.warn('no iframe for', id);
    }
  }

  function getHomeFrame() {
    return homeFrame;
  }

  function flatten(nodes) {
    const out = [];
    (nodes || []).forEach(n => {
      out.push(n);
      if (n.children) out.push(...flatten(n.children));
    });
    return out;
  }

  window.viewer = { show, getHomeFrame, getPathForId, getPageFromPath };
})();

// /core/sidebar.js
(() => {
  const treeRoot = document.getElementById('tree');
  const nodeElements = new Map(); // nodeId -> li element
  let highlightedEl = null;

  // Track folders opened by planet vs user interaction
  // Key insight: once user interacts with sidebar while on a planet, protect that planet's folders
  // When folder is manually collapsed, it resets to default (can be auto-closed again)
  const planetOpenedNodes = new Set();  // Nodes opened via planet focus
  const protectedNodes = new Set();     // Nodes protected by user interaction (won't auto-close)

  boot().catch(err => {
    console.error(err);
    treeRoot.innerHTML = '<li>Failed to load manifest.</li>';
  });

  async function boot() {
    const res = await fetch('./manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`manifest fetch ${res.status}`);
    const manifest = await res.json();

    // build UL structure
    // Only the top-level 'rcx' folder is open by default, everything else closed
    treeRoot.innerHTML = '';
    (manifest.tree || []).forEach(node => {
      const isRcxFolder = node.type === 'folder' && node.id === 'rcx';
      treeRoot.appendChild(renderNode(node, /*openByDefault*/ isRcxFolder, /*depth*/ 0));
    });

    // Expose sidebar API for bridge
    window.sidebarAPI = {
      highlight,
      clearHighlight,
      expand,
      expandViaPlanet,
      collapse,
      collapseIfPlanetOpened,
      toggle,
      isVisible,
      isExpanded,
      scrollTo,
      markUserInteracted,
      resetProtection,
      getElement: (id) => nodeElements.get(id)
    };

    // Notify bridge that sidebar is ready
    if (window.ManifestBridge) {
      window.ManifestBridge.setSidebarAPI(window.sidebarAPI);
    }
  }

  // ============ API FUNCTIONS ============

  function highlight(nodeId) {
    clearHighlight();
    const el = nodeElements.get(nodeId);
    if (el) {
      el.classList.add('highlighted');
      highlightedEl = el;
    }
  }

  function clearHighlight() {
    if (highlightedEl) {
      highlightedEl.classList.remove('highlighted');
      highlightedEl = null;
    }
  }

  function expand(nodeId) {
    const el = nodeElements.get(nodeId);
    if (!el) return;

    // Find the associated UL (next sibling for sections/folders)
    const ul = el.nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      ul.style.display = 'block';
      el.classList.add('open');
    }
  }

  // Expand via planet focus (trackable for auto-close)
  function expandViaPlanet(nodeId) {
    if (!isExpanded(nodeId)) {
      expand(nodeId);
      planetOpenedNodes.add(nodeId);
    }
  }

  function collapse(nodeId) {
    const el = nodeElements.get(nodeId);
    if (!el) return;

    const ul = el.nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      ul.style.display = 'none';
      el.classList.remove('open');
    }
    // When manually collapsed, reset ALL tracking for this node
    // This means it can be auto-closed again next time
    planetOpenedNodes.delete(nodeId);
    protectedNodes.delete(nodeId);
  }

  // Collapse only if it was opened via planet and not protected by user interaction
  function collapseIfPlanetOpened(nodeId) {
    if (planetOpenedNodes.has(nodeId) && !protectedNodes.has(nodeId)) {
      collapse(nodeId);
    }
  }

  // Mark a node and its ancestors as protected (won't auto-close)
  function markUserInteracted(nodeId) {
    protectedNodes.add(nodeId);
    // Also protect parent section/folder
    const el = nodeElements.get(nodeId);
    if (el) {
      let parent = el.parentElement;
      while (parent && parent !== treeRoot) {
        if (parent.previousElementSibling && parent.previousElementSibling.dataset.nodeId) {
          protectedNodes.add(parent.previousElementSibling.dataset.nodeId);
        }
        parent = parent.parentElement;
      }
    }
  }

  // Reset protection status (called when needed)
  function resetProtection() {
    protectedNodes.clear();
  }

  function toggle(nodeId) {
    if (isExpanded(nodeId)) {
      collapse(nodeId);
    } else {
      expand(nodeId);
    }
  }

  function isExpanded(nodeId) {
    const el = nodeElements.get(nodeId);
    if (!el) return false;
    const ul = el.nextElementSibling;
    return ul && ul.style.display === 'block';
  }

  function isVisible(nodeId) {
    const el = nodeElements.get(nodeId);
    if (!el) return false;

    // Check if element and all ancestors are visible
    let current = el;
    while (current && current !== treeRoot) {
      if (current.tagName === 'UL' && current.style.display === 'none') {
        return false;
      }
      current = current.parentElement;
    }
    return true;
  }

  function scrollTo(nodeId) {
    const el = nodeElements.get(nodeId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ============ RENDERERS ============

  function renderNode(node, openByDefault) {
    switch (node.type) {
      case 'folder':
        return renderFolder(node, openByDefault);
      case 'section':
        return renderSection(node, openByDefault);
      case 'page':
      case 'link':
        return renderLeaf(node);
      default:
        return document.createTextNode('');
    }
  }

  // emoji folder: no caret, label click toggles .nested
  function renderFolder(node, open) {
    const li = el('li', 'folder', node.title);
    li.dataset.type = 'folder';
    li.dataset.nodeId = node.id || '';
    if (node.id) nodeElements.set(node.id, li);

    const ul = el('ul', 'nested');
    if (open) ul.style.display = 'block';

    li.addEventListener('click', (e) => {
      e.stopPropagation();
      ul.style.display = ul.style.display === 'block' ? 'none' : 'block';
      // Mark as user-interacted so it won't be auto-closed by planet navigation
      if (node.id) markUserInteracted(node.id);
    });

    // Hover events for bridge
    li.addEventListener('mouseenter', () => {
      if (window.ManifestBridge && node.id) {
        window.ManifestBridge.onSidebarHover(node.id);
      }
    });
    li.addEventListener('mouseleave', () => {
      if (window.ManifestBridge) {
        window.ManifestBridge.onSidebarUnhover();
      }
    });

    // Children of folders are closed by default (sections, nested folders)
    (node.children || []).forEach(child => ul.appendChild(renderNode(child, /*openByDefault*/ false)));
    const wrap = document.createDocumentFragment();
    wrap.append(li, ul);
    return wrap;
  }

  // numbered section: caret via .expandable::before, toggles .open class
  function renderSection(node, open) {
    const li = el('li', 'expandable', node.title);
    li.dataset.type = 'section';
    li.dataset.nodeId = node.id || '';
    li.classList.add('root');
    if (open) li.classList.add('open');
    if (node.id) nodeElements.set(node.id, li);

    const ul = el('ul', 'nested');
    ul.style.display = open ? 'block' : 'none';

    const toggleFn = (e) => {
      e.stopPropagation();
      const isOpen = ul.style.display === 'block';
      ul.style.display = isOpen ? 'none' : 'block';
      li.classList.toggle('open', !isOpen);
      // Mark as user-interacted so it won't be auto-closed by planet navigation
      if (node.id) markUserInteracted(node.id);
    };

    li.addEventListener('click', toggleFn);

    // Hover events for bridge
    li.addEventListener('mouseenter', () => {
      if (window.ManifestBridge && node.id) {
        window.ManifestBridge.onSidebarHover(node.id);
      }
    });
    li.addEventListener('mouseleave', () => {
      if (window.ManifestBridge) {
        window.ManifestBridge.onSidebarUnhover();
      }
    });

    // Children of sections are closed by default
    (node.children || []).forEach(child => ul.appendChild(renderNode(child, /*openByDefault*/ false)));

    const wrap = document.createDocumentFragment();
    wrap.append(li, ul);
    return wrap;
  }

  function renderLeaf(node) {
    const li = el('li', node.type === 'link' ? 'link' : '', node.title);
    li.dataset.type = node.type; // 'page' or 'link'
    li.dataset.nodeId = node.id || '';
    if (node.id) nodeElements.set(node.id, li);

    // Hover events for bridge
    li.addEventListener('mouseenter', () => {
      if (window.ManifestBridge && node.id) {
        window.ManifestBridge.onSidebarHover(node.id);
      }
    });
    li.addEventListener('mouseleave', () => {
      if (window.ManifestBridge) {
        window.ManifestBridge.onSidebarUnhover();
      }
    });

    return li;
  }

  // helpers
  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }
})();

// manifest-bridge.js
// Bidirectional mapping between manifest nodes and planet system bodies
// Handles communication between sidebar and planet view iframe

const ManifestBridge = (() => {
  let manifest = null;
  let nodeMap = {};      // nodeId -> node
  let bodyToNode = {};   // bodyId -> nodeId
  let nodeToBody = {};   // nodeId -> bodyId
  let sidebarAPI = null;
  let planetFrame = null;

  // Project metadata for info panels
  const projectMeta = {
    'central': {
      title: 'rcx',
      subtitle: 'creative systems lab',
      description: 'experimental projects in audio, visual, and interactive systems'
    },
    'sec-01': {
      title: 'rcx01',
      subtitle: 'explorative loop sampler',
      description: 'keyboard-driven audio performance system with real-time loop manipulation and playtest studies',
      bodyId: 'rcx01'
    },
    'sec-02': {
      title: 'rcx02',
      subtitle: 'algorithmic installation',
      description: 'generative audiovisual installation exploring emergent patterns and procedural aesthetics',
      bodyId: 'rcx02'
    },
    'sec-03': {
      title: 'rcx03',
      subtitle: 'cellular audio engine',
      description: 'Game of Life-based audio plugin built in Max/MSP and Processing',
      bodyId: 'rcx03'
    },
    'sec-04': {
      title: 'rcx04',
      subtitle: 'lifebrush',
      description: 'interactive drawing system combining cellular automata with generative layering',
      bodyId: 'rcx04'
    },
    'sec-05': {
      title: 'rcx05',
      subtitle: 'hybrid visualizer',
      description: 'Processing and TouchDesigner hybrid for real-time audio-reactive visuals',
      bodyId: 'rcx05'
    },
    // Moons - demos folders
    'sec-01-demos': { title: 'demos', subtitle: 'video documentation', bodyId: 'rcx01_demos' },
    'sec-02-demos': { title: 'demos', subtitle: 'video documentation', bodyId: 'rcx02_demos' },
    'sec-03-demos': { title: 'demos', subtitle: 'video documentation', bodyId: 'rcx03_demos' },
    // Moons - code links
    'git-01': { title: 'code', subtitle: 'source repository', bodyId: 'rcx01_code' },
    'git-02': { title: 'code', subtitle: 'source repository', bodyId: 'rcx02_code' },
    'git-03': { title: 'code', subtitle: 'source repository', bodyId: 'rcx03_code' },
    'git-05': { title: 'code', subtitle: 'source repository', bodyId: 'rcx05_code' },
    // Moons - readme pages
    'readme-01': { title: 'readme', subtitle: 'project documentation', bodyId: 'rcx01_readme' },
    'readme-02': { title: 'readme', subtitle: 'project documentation', bodyId: 'rcx02_readme' },
    'readme-03': { title: 'readme', subtitle: 'project documentation', bodyId: 'rcx03_readme' },
    'readme-04': { title: 'readme', subtitle: 'project documentation', bodyId: 'rcx04_readme' },
    'readme-05': { title: 'readme', subtitle: 'project documentation', bodyId: 'rcx05_readme' },
    // Moons - special items
    'lifebrush': { title: 'lifebrush', subtitle: 'interactive demo', bodyId: 'rcx04_lifebrush' },
    'stream-02': { title: 'stream', subtitle: 'live channel', bodyId: 'rcx02_stream' },
    // Sub-moons - individual demos
    'video-01-231204': { title: '12/04/23', subtitle: 'prototype demo', bodyId: 'rcx01_demo1' },
    'video-01-231213': { title: '12/13/23', subtitle: 'prototype demo', bodyId: 'rcx01_demo2' },
    'video-01-240816': { title: '08/16/24', subtitle: 'demo', bodyId: 'rcx01_demo3' },
    'video-01-study': { title: 'playtest', subtitle: 'user study', bodyId: 'rcx01_demo4' },
    'video-02-may4a': { title: 'may4a', subtitle: 'demo', bodyId: 'rcx02_demo1' },
    'video-02-may4b': { title: 'may4b', subtitle: 'demo', bodyId: 'rcx02_demo2' },
    'video-02-may5a': { title: 'may5a', subtitle: 'demo', bodyId: 'rcx02_demo3' },
    'video-02-may5b': { title: 'may5b', subtitle: 'demo', bodyId: 'rcx02_demo4' },
    'video-03-a': { title: 'demo A', subtitle: 'demo', bodyId: 'rcx03_demo1' },
    'video-03-b': { title: 'demo B', subtitle: 'demo', bodyId: 'rcx03_demo2' },
    'video-05-demo': { title: 'demo', subtitle: 'demo', bodyId: 'rcx05_demo1' }
  };

  async function init() {
    const res = await fetch('./manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load manifest');
    manifest = await res.json();

    // Build index
    indexNodes(manifest.tree || []);
    buildMappings();

    // Listen for messages from planet iframe
    window.addEventListener('message', handleMessage);

    return { manifest, nodeMap, projectMeta };
  }

  function indexNodes(nodes, parent = null) {
    nodes.forEach(node => {
      node._parent = parent;
      if (node.id) nodeMap[node.id] = node;
      if (node.children) indexNodes(node.children, node);
    });
  }

  function buildMappings() {
    // Build bidirectional mappings from projectMeta
    Object.entries(projectMeta).forEach(([nodeId, meta]) => {
      if (meta.bodyId) {
        nodeToBody[nodeId] = meta.bodyId;
        bodyToNode[meta.bodyId] = nodeId;
      }
    });
  }

  function handleMessage(event) {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'planet:hover':
        onPlanetHover(msg.bodyId);
        break;
      case 'planet:unhover':
        onPlanetUnhover();
        break;
      case 'planet:click':
        onPlanetClick(msg.bodyId);
        break;
      case 'planet:focus':
        onPlanetFocus(msg.bodyId);
        break;
    }
  }

  function onPlanetHover(bodyId) {
    const nodeId = bodyToNode[bodyId];
    if (!nodeId || !sidebarAPI) return;

    // Find deepest visible node
    const visibleNodeId = findDeepestVisibleNode(nodeId);
    if (visibleNodeId) {
      sidebarAPI.highlight(visibleNodeId);
    }
  }

  function onPlanetUnhover() {
    if (sidebarAPI) {
      sidebarAPI.clearHighlight();
    }
  }

  function onPlanetClick(bodyId) {
    const nodeId = bodyToNode[bodyId];
    if (!nodeId || !sidebarAPI) return;

    // Find the section (planet level) and expand it via planet (trackable for auto-close)
    const sectionId = findParentSection(nodeId);
    if (sectionId && sidebarAPI.expandViaPlanet) {
      sidebarAPI.expandViaPlanet(sectionId);
    }
  }

  function onPlanetFocus(bodyId) {
    // Called when camera finishes focusing on a body
    const nodeId = bodyToNode[bodyId];
    if (!nodeId || !sidebarAPI) return;

    const sectionId = findParentSection(nodeId);
    if (sectionId) {
      // Use expandViaPlanet so it can be auto-closed when navigating away
      if (sidebarAPI.expandViaPlanet) {
        sidebarAPI.expandViaPlanet(sectionId);
      } else {
        sidebarAPI.expand(sectionId);
      }
      sidebarAPI.scrollTo(nodeId);
    }
  }

  function findDeepestVisibleNode(nodeId) {
    if (!sidebarAPI) return nodeId;

    let current = nodeId;
    while (current) {
      if (sidebarAPI.isVisible(current)) {
        return current;
      }
      const node = nodeMap[current];
      if (node && node._parent && node._parent.id) {
        current = node._parent.id;
      } else {
        break;
      }
    }
    return current;
  }

  function findParentSection(nodeId) {
    let current = nodeMap[nodeId];
    while (current) {
      if (current.type === 'section') {
        return current.id;
      }
      current = current._parent;
    }
    return null;
  }

  function setSidebarAPI(api) {
    sidebarAPI = api;
  }

  function setPlanetFrame(frame) {
    planetFrame = frame;
  }

  function sendToPlanet(message) {
    if (planetFrame && planetFrame.contentWindow) {
      planetFrame.contentWindow.postMessage(message, '*');
    }
  }

  // Called by sidebar when hovering items
  function onSidebarHover(nodeId) {
    const bodyId = nodeToBody[nodeId];
    if (bodyId) {
      sendToPlanet({ type: 'sidebar:hover', bodyId });
    }
  }

  function onSidebarUnhover() {
    sendToPlanet({ type: 'sidebar:unhover' });
  }

  function onSidebarClick(nodeId) {
    const bodyId = nodeToBody[nodeId];
    if (bodyId) {
      sendToPlanet({ type: 'sidebar:click', bodyId });
    }
  }

  function getMeta(nodeId) {
    return projectMeta[nodeId] || null;
  }

  function getBodyMeta(bodyId) {
    const nodeId = bodyToNode[bodyId];
    return nodeId ? projectMeta[nodeId] : null;
  }

  function getNodeForBody(bodyId) {
    const nodeId = bodyToNode[bodyId];
    return nodeId ? nodeMap[nodeId] : null;
  }

  return {
    init,
    setSidebarAPI,
    setPlanetFrame,
    sendToPlanet,
    onSidebarHover,
    onSidebarUnhover,
    onSidebarClick,
    getMeta,
    getBodyMeta,
    getNodeForBody,
    get nodeMap() { return nodeMap; },
    get projectMeta() { return projectMeta; }
  };
})();

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = ManifestBridge;
}

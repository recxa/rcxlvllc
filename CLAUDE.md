# RCXLVLLC Portfolio - Complete Project Context

> **For collaborators joining via Claude Code**: This document contains everything you need to pick up this project. Read it fully before making changes.

---

## Project Vision & Current State

### What This Is
A creative portfolio website for "rcx" - a creative systems lab showcasing 5 experimental projects (rcx01-rcx05) in audio, visual, and interactive systems. The centerpiece is an **interactive 3D solar system** where:
- The central star represents "rcx" (the lab)
- Each planet represents a project (rcx01-rcx05)
- Moons around planets represent project assets (demos, code links, READMEs)
- Sub-moons represent individual demo videos

### The "Rut" / Where We're Stuck
The owner is trying to reach an MVP that feels acceptable to deploy. The technical implementation is largely working, but there may be:
- Visual polish needed
- UX refinements
- Integration quirks between the 3D view and sidebar
- Content that needs to be filled in (README pages, links, etc.)
- Possible deployment considerations

### What's Working Well
- 3D planet system renders and animates
- Camera focus/zoom/orbit controls
- Visual engine with multiple shading modes (toon, fresnel, standard, unlit)
- Post-processing effects (pixelate, scanlines, CRT, bloom, etc.)
- Settings panel (`\`` key) for tweaking all visual parameters
- Sidebar navigation syncs with 3D view
- Info panel shows on hover/focus
- Floating windows for embedded content (YouTube, iframes)

---

## How to Run Locally

1. **You need a local web server** (the site uses ES modules and fetches)
2. Options:
   - VS Code "Live Server" extension (recommended)
   - `python -m http.server 8000`
   - `npx serve .`
3. Open `index.html` in browser
4. The 3D view loads in the "home" page automatically

### Keyboard Shortcuts
- **`** (backtick): Toggle settings panel
- **E**: Toggle sidebar effects panel
- **R**: Reset camera to central view
- **Click**: Focus on body
- **Scroll**: Zoom in/out
- **Drag**: Orbit camera

---

## File Structure

```
rcxlvllc/
├── index.html              # Main shell (sidebar + content area)
├── manifest.json           # Site structure definition (pages, links, folders)
├── CLAUDE.md               # This file
│
├── core/                   # Shell infrastructure
│   ├── style.css           # Global styles + floating window styles
│   ├── sidebar.js          # Sidebar tree rendering from manifest
│   ├── sidebar-effects.js  # Sidebar visual effects panel (E key)
│   ├── viewer.js           # Content viewer (loads pages into iframes)
│   ├── router.js           # URL routing
│   ├── bus.js              # Event bus for cross-component messaging
│   ├── windows.js          # Floating popup window system
│   ├── manifest-bridge.js  # Connects manifest to sidebar/viewer
│   └── externals.js        # External link handling
│
├── pages/
│   ├── home/               # THE MAIN 3D VISUALIZATION
│   │   ├── index.html      # Babylon.js scene, planet system, camera controls
│   │   ├── visual-engine.js # All visual effects (shading, post-processing, etc.)
│   │   ├── settings-panel.js # Settings UI (backtick key)
│   │   └── settings.json   # Saved settings (optional)
│   │
│   ├── tour/index.html     # Tour page (may need content)
│   ├── contact/index.html  # Contact page (may need content)
│   ├── readme-01/ to readme-05/ # README pages for each project
│   └── lifebrush/          # Interactive p5.js sketch (rcx04)
│       ├── index.html
│       ├── sketch.js
│       └── lifebrush-bridge.js
│
└── assets/                 # Static assets
```

---

## Architecture Deep Dive

### The Shell (index.html + core/)
- **Sidebar**: Renders tree from `manifest.json`, handles expand/collapse
- **Viewer**: Loads page content into iframes in `#viewer`
- **Messaging**: Uses `postMessage` for iframe ↔ parent communication

### The 3D Scene (pages/home/)

#### index.html (850+ lines)
The main Babylon.js scene containing:

1. **Scene Setup** (lines 291-318)
   - Creates Babylon engine, scene, camera (ArcRotateCamera)
   - Highlight layers for hover effects
   - Hemispheric + point lights

2. **Project Metadata** (lines 146-266)
   - `projectMeta` object maps body IDs to titles, descriptions, actions
   - Actions can be: `page` (navigate), `link` (external), `expand` (folder)

3. **CelestialBody Class** (lines 352-440)
   - Handles orbit animation, parent-child relationships
   - Creates mesh + orbit ring + pivot nodes for proper rotation

4. **Planet/Moon Configs** (lines 447-502)
   - `planetConfigs`: 5 planets with colors, orbit radii, speeds
   - `moonConfigs`: Moons for each planet (demos, code, readme)
   - `subMoonConfigs`: Sub-moons for demo folders

5. **Camera Focus System** (lines 793-858)
   - `focusOn(mesh)`: Animates camera to focus on body
   - `resetView()`: Returns to central star
   - Smooth transitions with configurable easing

6. **Info Panel** (lines 545-711)
   - Fixed panel (bottom-right) or floating mode
   - Shows on hover, "resting" state shows focused body
   - Central star has no resting panel (only shows on hover)

7. **Messaging** (lines 713-765)
   - Receives: `sidebar:hover`, `sidebar:unhover`, `sidebar:click`
   - Sends: `planet:hover`, `planet:focus`, `navigate`, `expand`, etc.

#### visual-engine.js (~1150 lines)
All visual effects in one module:

**Shading Modes:**
- `standard`: Default Babylon material with specular
- `flat`: Flat shading (faceted look)
- `toon`: Custom shader with bands + rim light
- `fresnel`: Custom shader with fresnel rim
- `unlit`: Pure emissive, no lighting

**Post-Processing Effects:**
- Pixelation, scanlines, CRT curvature
- Chromatic aberration, bloom
- Film grain, vignette
- Glitch effect
- Dithering (ordered, bayer, random)
- Color adjustments (hue shift, saturation, brightness, contrast)

**Other Visual Features:**
- Geometry types: sphere, icosphere, lowpoly, cube, octahedron
- Vertex noise displacement (static and animated)
- Outline/edge rendering
- Star glow (using GlowLayer) + corona rays
- Background stars + grid
- Orbit ring styling
- Color palettes: gameboy, cga, nes, c64, pico8

**Key Functions:**
- `init(scene, engine, camera, settings)`: Initialize engine
- `applyToBody(mesh, hexColor, bodyId)`: Apply visual settings to a mesh
- `updateSettings(newSettings)`: Update all visuals when settings change
- `update(deltaTime)`: Animation loop (pulse, wobble, jitter, vertex noise)

#### settings-panel.js (~1600 lines)
Settings UI with tabs:
- **Camera**: Zoom mode, scroll speed, rotation sync, easing
- **Visual**: Geometry, shading, lighting, color, pattern, outline, animation
- **Post FX**: All post-processing effects with FX order drag-and-drop
- **Planets**: Per-planet override system

---

## Manifest Structure

`manifest.json` defines the sidebar tree:

```json
{
  "tree": [
    { "type": "page", "id": "home", "title": "🏠 home", "iframeSrc": "/pages/home/index.html" },
    { "type": "page", "id": "tour", "title": "🗺️ tour", "iframeSrc": "/pages/tour/index.html" },
    { "type": "folder", "id": "rcx", "title": "📁 rcx", "children": [
      { "type": "section", "id": "sec-01", "title": "01", "children": [...] },
      // ... sections 02-05
    ]}
  ]
}
```

Types:
- `page`: Loads iframe content
- `folder`: Expandable container
- `section`: Expandable section (used for rcx01-05)
- `link`: External link (opens via `externals.js`)

---

## Recent Work (What Just Got Implemented)

### Visual Engine Fixes
1. **Fixed empty scene bug**: PostProcess shader wasn't registered correctly. Fixed by using `BABYLON.Effect.ShadersStore["visualFXFragmentShader"]`

2. **Fixed shader compatibility**: Simplified dither functions to avoid GLSL array indexing issues

3. **Fixed background stars**: Changed from PointsCloudSystem to simple sphere meshes for reliability

### New Features Added
1. **Geometry rebuilding**: Settings changes to geometry type/segments automatically rebuild meshes

2. **Vertex noise**: Procedural vertex displacement with animation support (`vertexNoiseSpeed`)

3. **Star effects**: GlowLayer-based glow + corona rays

4. **Background grid**: LineSystem-based grid at Y=-100

5. **Outline rendering**: Using Babylon's edgesRenderer

6. **Full animation system**: Pulse, wobble, rotate, jitter - all working

---

## Things That May Need Attention

### Content
- README pages (readme-01 through readme-05) may need actual content
- Tour page may need content
- Contact page may need content
- External links in manifest may need real URLs

### Visual Polish
- Default visual settings may need tuning for "out of box" appeal
- Some shading modes may look better than others

### UX
- Info panel behavior (fixed vs floating mode)
- Sidebar ↔ 3D sync edge cases
- Mobile responsiveness (not tested)

### Deployment
- All paths use relative URLs, should work on any host
- No build step needed - vanilla JS
- CDN dependency: babylon.js loaded from CDN

---

## Code Patterns & Conventions

### Module Pattern
Most JS uses IIFE module pattern:
```javascript
const ModuleName = (() => {
  // private state
  let privateVar = null;

  function privateFunction() {}

  return {
    publicMethod: () => {},
    init: () => {}
  };
})();
```

### Messaging Pattern
Parent ↔ iframe communication:
```javascript
// Send to parent
parent.postMessage({ type: 'navigate', target: 'readme-01' }, '*');

// Receive from parent
window.addEventListener('message', (e) => {
  if (e.data.type === 'sidebar:hover') { ... }
});
```

### Settings Flow
1. `SettingsPanel.init(callback)` loads settings
2. User changes setting → `onChangeCallback(settings)` fires
3. Main scene calls `visualEngine.updateSettings(settings)`
4. Visual engine updates materials, post-processing, etc.

---

## Debugging Tips

### Settings Panel
Press **`** (backtick) to open. If nothing happens:
- Check console for errors
- Verify settings-panel.js loaded

### Visual Engine Not Working
Add to index.html (around line 320):
```javascript
const DISABLE_VISUAL_ENGINE = true;  // Bypasses visual engine
```

### Camera/Focus Issues
- `R` key resets to central view
- Check `focusTarget` in console
- Transitions have configurable duration in settings

### Messaging Issues
- Add `console.log` in message handlers
- Check both parent frame and iframe consoles

---

## Quick Reference: Body IDs

```
central         - The central star
rcx01-rcx05     - The 5 planets
rcx01_demos     - rcx01's demos moon
rcx01_code      - rcx01's code moon
rcx01_readme    - rcx01's readme moon
rcx01_demo1-4   - Individual demo sub-moons
... (similar pattern for rcx02-05)
```

---

## Getting Unstuck: Suggested Next Steps

1. **Run locally** and explore the current state
2. **Check the README pages** - do they have content?
3. **Verify external links** - are they pointing to real URLs?
4. **Test visual settings** - find a good default look
5. **Test navigation flow** - sidebar click → camera focus → info panel
6. **Consider mobile** - does it work on touch devices?

Feel free to ask me (Claude) anything about the codebase - I have full context from the previous session!

---

*Last updated: Session handoff to collaborator*

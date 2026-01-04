# rcxlvllc Development Log

**Created:** 2024-12-30
**Last Updated:** 2024-12-30

---

## Project Overview

Personal portfolio website with iframe-based SPA architecture. Features a file-tree sidebar navigation, manifest-driven structure, and interactive page content including 3D planet visualization (Babylon.js) and Game of Life drawing tool (p5.js).

**Domain:** www.rcxlv.llc
**Deployment:** GitHub Pages

---

## Current State Analysis (Dec 30, 2024)

### Architecture Summary
- **Shell Pattern:** Main `index.html` loads sidebar + viewer + router scripts
- **Content Delivery:** Each "page" is an iframe loaded into `#viewer`
- **Navigation:** Manifest.json defines the entire site tree structure
- **Routing:** Client-side routing with history API (`/home`, `/lifebrush`, etc.)

### What's Working Well
1. Core iframe-based page switching
2. Manifest-driven tree rendering in sidebar
3. Folder/section expand/collapse
4. External link mapping and opening
5. Babylon.js planet visualization (home page)
6. Lifebrush Game of Life basic functionality
7. Lifebrush state persistence across page switches
8. Visibility postMessage communication (pause/resume)

---

## Issues & Bugs

### CRITICAL
- [ ] **CV page points to wrong iframe** - `cv` page has `iframeSrc: "/pages/home/index.html"` (same as home) - should be its own page or placeholder
- [ ] **Missing iframeSrc for most pages** - `readme-01` through `readme-05` have no `iframeSrc` in manifest, only `readme-01` has an actual page file

### HIGH PRIORITY
- [ ] **Dead code in externals.js** - `code-05` maps to `git-01` URL (probably placeholder)
- [ ] **Placeholder URL** - `video-03-c` has literal `'your-video-id-10'`
- [ ] **Missing pages directory** - No pages exist for: readme-02, readme-03, readme-04, readme-05
- [ ] **Bus.js is unused** - Event bus is loaded but never utilized anywhere

### MEDIUM PRIORITY
- [ ] **Legacy code duplication** - `assets/script.js` is an older version of the routing logic, appears completely unused
- [ ] **Duplicate p5.js** - `pages/lifebrush/p5.js` is bundled locally but index.html loads from CDN
- [ ] **Empty style.css** - `pages/lifebrush/style.css` exists but appears empty
- [ ] **Double postMessage calls** - `viewer.js` sends visibility message twice in `show()` function
- [ ] **Duplicate CSS rules** - `#lifebrush-container canvas` selector appears twice in `core/style.css`

### LOW PRIORITY / INCONVENIENCES
- [ ] **No active page highlight** - Sidebar doesn't show which page is currently selected
- [ ] **No loading states** - No visual feedback when switching pages
- [ ] **No error boundary** - If iframe fails to load, no user-facing error
- [ ] **Hardcoded sidebar width** - Fixed 227px width may cause issues on narrow screens
- [ ] **Cache-busting in dev** - `_v` timestamp param will cause caching issues in production

---

## Missing/Planned Features (Elephant in Room)

### Obvious Gaps
1. **CV Page Content** - Referenced but not implemented
2. **README Pages (02-05)** - All referenced in manifest but no pages exist
3. **Mobile responsiveness** - Sidebar doesn't collapse on mobile
4. **Favicon** - No favicon defined
5. **Meta tags** - No OpenGraph/Twitter cards for link previews
6. **404 handling** - Direct URL access to non-existent routes has no fallback

### Potential Enhancements
1. **Page transitions/animations** - Currently instant switches
2. **Keyboard navigation** - No tree traversal via arrow keys
3. **Search** - No way to search/filter the tree
4. **Breadcrumbs** - No indication of current location in tree
5. **Deep linking to sections** - Can't link directly to an expanded folder state

---

## Conceptual Understanding

### The "rcx" Projects (01-05)
Appears to be a series of creative/research projects:
- **01:** Game dev prototype with multiple demo videos (Dec 2023 - Aug 2024)
- **02:** Streaming-focused project (Twitch + YouTube demos)
- **03:** Two demo videos (A, B)
- **04:** Lifebrush interactive tool (Conway's Game of Life + drawing)
- **05:** Single demo + code link (points to rcx01 repo - possibly intentional?)

### Lifebrush Concept
A creative interpretation of Conway's Game of Life:
- Draw cells by dragging mouse/touch
- After 20 cells painted, Game of Life rules apply
- Left click = save current state as layer + reset with new resolution
- Right click = randomize color + reset
- Layers accumulate, creating visual history
- UP arrow advances all layers one generation
- DELETE = full reset

### Planet Visualization Concept
An interactive 3D orrery:
- Central "sun" with 6 orbiting planets
- Planets have moons with their own orbits
- Click focuses camera on body with smooth zoom
- Relative zoom (maintains visual size ratio)
- Decorative orbit rings that toggle visibility

---

## Session Tasks

### Completed
- [x] Full codebase exploration
- [x] Architecture documentation
- [x] Bug identification
- [x] Feature gap analysis
- [x] Created dev log

### In Progress
- [ ] (None currently)

### Pending
- [ ] (User to decide next steps)

---

## Questions for Clarification

1. Is `code-05` intentionally linking to `rcx01` repo, or should it be `rcx05`?
2. What content should the CV page contain?
3. What content should each README page (01-05) contain?
4. Should the old `assets/script.js` be deleted?
5. Is the local `pages/lifebrush/p5.js` file needed or can it be removed (since CDN is used)?
6. What's the intended behavior for mobile users?
7. Should the planet visualization on home page be customized further or is it mainly decorative?

---

## File Structure Reference

```
rcxlvllc/
├── index.html              # Main shell
├── manifest.json           # Site structure definition
├── CNAME                   # www.rcxlv.llc
├── .github/workflows/      # GitHub Pages deploy
├── core/
│   ├── style.css          # Main styles
│   ├── sidebar.js         # Tree renderer
│   ├── viewer.js          # Iframe manager
│   ├── router.js          # Navigation/history
│   ├── bus.js             # Event bus (unused)
│   └── externals.js       # External URL map
├── pages/
│   ├── home/index.html    # Babylon.js planets
│   ├── readme-01/index.html # Placeholder
│   └── lifebrush/
│       ├── index.html
│       ├── sketch.js
│       ├── lifebrush-bridge.js
│       ├── style.css      # Empty
│       └── p5.js          # Unused local copy
└── assets/
    └── script.js          # Legacy (unused)
```

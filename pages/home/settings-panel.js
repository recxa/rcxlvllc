// settings-panel.js
// Debug settings panel for camera/navigation tuning + visual styling
// Toggle with ` (backtick) key

const SettingsPanel = (() => {
  let panel = null;
  let visible = false;
  let settings = null;
  let onChangeCallback = null;

  const defaultSettings = {
    zoom: {
      mode: "logarithmic",
      scrollSpeed: 0.12,
      minDistanceMultiplier: 2.0,
      maxDistance: 80,
      transitionDuration: 0.5,
      focusDistanceMultiplier: 4.0
    },
    rotation: {
      syncMode: "hybrid",
      level0Sync: "none",
      level1Sync: "none",
      level2Sync: "parent",
      level3Sync: "parent",
      smoothing: 0.1
    },
    animation: {
      scrollBehavior: "additive",
      easing: "cubicInOut"
    },
    clipping: {
      mode: "hardLimit",
      fadeStartDistance: 1.5,
      fadeEndDistance: 1.1
    },
    orbit: {
      timeScale: 0.02
    },
    // ============ VISUAL STYLE ============
    visual: {
      // GEOMETRY
      geometry: {
        type: "sphere",           // sphere, icosphere, lowpoly, cube, octahedron
        segments: 32,             // sphere detail (4-64)
        subdivisions: 2,          // for icosphere (1-5)
        vertexNoise: 0,           // vertex displacement amount (0-1)
        vertexNoiseScale: 3,      // noise frequency
        vertexNoiseSpeed: 0,      // animated noise
      },
      // SHADING
      shading: {
        mode: "standard",         // standard, flat, toon, unlit, fresnel
        toonBands: 4,             // for toon shading (2-8)
        toonEdgeSoftness: 0.05,   // edge transition (0-0.2)
        flatShading: false,       // force flat shading
        wireframe: false,         // show wireframe
        wireframeOver: false,     // wireframe over solid
        wireframeColor: "#ffffff",
        wireframeAlpha: 0.3,
      },
      // LIGHTING
      lighting: {
        ambient: 0.3,             // ambient light intensity (0-1)
        diffuse: 0.7,             // main light intensity (0-1)
        specular: 0.5,            // specular highlight (0-1)
        specularPower: 32,        // specular sharpness (4-256)
        rimLight: 0,              // fresnel rim light (0-1)
        rimColor: "#88aaff",
        rimPower: 2,              // rim falloff (1-5)
      },
      // COLOR
      color: {
        mode: "original",         // original, monochrome, duotone, palette, hueShift
        monochrome: "#88ff88",    // color for monochrome mode
        duotone1: "#000033",      // shadow color
        duotone2: "#ffff88",      // highlight color
        palette: "gameboy",       // gameboy, cga, nes, c64, custom
        customPalette: "#000000,#555555,#aaaaaa,#ffffff",
        hueShift: 0,              // -180 to 180
        saturation: 1,            // 0-2
        brightness: 1,            // 0-2
        contrast: 1,              // 0.5-2
        quantize: 0,              // color quantization (0=off, 2-32)
      },
      // TEXTURE/PATTERN
      pattern: {
        type: "none",             // none, noise, cellular, grid, dots, stripes, checker
        scale: 1,                 // pattern scale (0.1-10)
        intensity: 0.5,           // blend amount (0-1)
        speed: 0,                 // animation speed
        octaves: 3,               // noise octaves (1-6)
        cellType: "voronoi",      // voronoi, worley, metaball
      },
      // DITHERING
      dither: {
        mode: "none",             // none, ordered2x2, ordered4x4, ordered8x8, bayer, blueNoise, random
        intensity: 1,             // dither strength (0-1)
        colorDepth: 4,            // bits per channel (1-8)
        scale: 1,                 // dither pattern scale
      },
      // OUTLINE
      outline: {
        enabled: false,
        mode: "silhouette",       // silhouette, crease, all
        width: 2,                 // outline width in pixels (1-10)
        color: "#000000",
        depthBias: 0.001,         // z-fighting prevention
      },
      // POST-PROCESSING
      post: {
        // FX order - effects applied in this order (drag to reorder in UI)
        fxOrder: ['pixelate', 'dither', 'colorAdjust', 'scanlines', 'crt', 'bloom', 'chromaticAberration', 'grain', 'vignette', 'glitch'],
        pixelate: 2,              // pixelation level (0=off, 2-16) - default 2px
        scanlines: 0,             // scanline intensity (0-1)
        scanlineScale: 2,         // scanline size
        crt: false,               // CRT curvature
        crtIntensity: 0.5,
        chromaticAberration: 0,   // RGB split (0-0.05)
        bloom: 0,                 // bloom intensity (0-2)
        bloomThreshold: 0.8,
        grain: 0,                 // film grain (0-1)
        grainSpeed: 1,
        vignette: 0,              // vignette intensity (0-1)
      },
      // GLITCH
      glitch: {
        enabled: false,
        frequency: 0.1,           // how often (0-1)
        intensity: 0.5,           // how strong (0-1)
        blockSize: 0.1,           // glitch block size
        rgbShift: true,
        scanlineJitter: true,
        colorShift: true,
      },
      // ANIMATION
      anim: {
        wobble: 0,                // mesh wobble amount (0-0.5)
        wobbleSpeed: 1,
        pulse: 0,                 // scale pulse (0-0.3)
        pulseSpeed: 1,
        rotate: 0,                // self rotation speed
        jitter: 0,                // position jitter (0-0.1)
        jitterSpeed: 10,
      },
      // ORBIT RINGS
      orbitRings: {
        style: "solid",           // solid, dashed, dotted, glow, none
        dashSize: 0.5,
        gapSize: 0.3,
        glow: 0,                  // glow intensity (0-1)
        glowColor: "#4488ff",
        thickness: 0.02,
        alpha: 0.3,
        hierarchical: false,      // only show rings for focused body's children
        showEmptyMoons: false,    // show parent ring for moons with no submoons
      },
      // STAR/CENTRAL
      star: {
        glow: 0,
        glowColor: "#335577",
        glowSize: 2,
        corona: false,
        coronaRays: 8,
        coronaLength: 0.5,
        pulse: 0.02,
        pulseSpeed: 0.2,
      },
      // BACKGROUND
      background: {
        color: "#050508",
        stars: true,
        starCount: 200,
        starSize: 1,
        starTwinkle: 0.5,
        nebula: false,
        nebulaColor: "#221133",
        nebulaIntensity: 0.3,
        grid: false,
        gridColor: "#222233",
        gridSpacing: 5,
      },
      // PER-PLANET OVERRIDES
      // Keys are body IDs, values are partial settings that override globals
      overrides: {
        'central': { geometry: { type: 'octahedron' } },
      },
    }
  };

  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.innerHTML = `
      <style>
        #settings-panel {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 300px;
          max-height: calc(100vh - 20px);
          background: rgba(10, 12, 15, 0.97);
          border: 1px solid #333;
          border-radius: 4px;
          font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #aab;
          overflow-y: auto;
          z-index: 9999;
          display: none;
        }
        #settings-panel.visible { display: block; }
        #settings-panel::-webkit-scrollbar { width: 6px; }
        #settings-panel::-webkit-scrollbar-track { background: #1a1c20; }
        #settings-panel::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        #settings-panel h3 {
          margin: 0;
          padding: 10px 12px;
          background: linear-gradient(to bottom, #1a1c20, #151618);
          border-bottom: 1px solid #333;
          font-size: 12px;
          font-weight: normal;
          color: #99a;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        #settings-panel .tab-bar {
          display: flex;
          background: #151618;
          border-bottom: 1px solid #333;
          position: sticky;
          top: 40px;
          z-index: 10;
        }
        #settings-panel .tab {
          flex: 1;
          padding: 8px 4px;
          text-align: center;
          cursor: pointer;
          color: #667;
          border-bottom: 2px solid transparent;
          font-size: 10px;
          text-transform: uppercase;
        }
        #settings-panel .tab:hover { color: #99a; background: #1a1c20; }
        #settings-panel .tab.active {
          color: #aab;
          border-bottom-color: #668;
          background: #1a1c20;
        }
        #settings-panel .tab-content { display: none; }
        #settings-panel .tab-content.active { display: block; }
        #settings-panel .section {
          border-bottom: 1px solid #222;
        }
        #settings-panel .section-header {
          padding: 8px 12px;
          background: #131518;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }
        #settings-panel .section-header:hover { background: #181b1f; }
        #settings-panel .section-title {
          color: #778;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        #settings-panel .section-toggle {
          color: #556;
          font-size: 10px;
        }
        #settings-panel .section-body {
          padding: 8px 12px;
          display: none;
        }
        #settings-panel .section.open .section-body { display: block; }
        #settings-panel .section.open .section-toggle::before { content: '▼'; }
        #settings-panel .section-toggle::before { content: '▶'; }
        #settings-panel .row {
          display: flex;
          align-items: center;
          margin: 5px 0;
          gap: 8px;
        }
        #settings-panel .row-wrap {
          flex-wrap: wrap;
        }
        #settings-panel label {
          flex: 1;
          color: #778;
          min-width: 80px;
        }
        #settings-panel input[type="range"] {
          width: 80px;
          height: 4px;
          -webkit-appearance: none;
          background: #333;
          border-radius: 2px;
        }
        #settings-panel input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #668;
          border-radius: 50%;
          cursor: pointer;
        }
        #settings-panel input[type="range"]::-webkit-slider-thumb:hover {
          background: #88a;
        }
        #settings-panel input[type="number"],
        #settings-panel input[type="text"] {
          width: 60px;
          background: #1a1c20;
          border: 1px solid #333;
          color: #aab;
          padding: 3px 5px;
          font: inherit;
          border-radius: 2px;
        }
        #settings-panel input[type="color"] {
          width: 30px;
          height: 20px;
          border: 1px solid #333;
          border-radius: 2px;
          background: #1a1c20;
          cursor: pointer;
          padding: 0;
        }
        #settings-panel input[type="checkbox"] {
          width: 14px;
          height: 14px;
          cursor: pointer;
        }
        #settings-panel select {
          background: #1a1c20;
          border: 1px solid #333;
          color: #aab;
          padding: 3px 5px;
          font: inherit;
          border-radius: 2px;
          max-width: 100px;
        }
        #settings-panel .value {
          width: 38px;
          text-align: right;
          color: #99a;
          font-size: 10px;
        }
        #settings-panel .buttons {
          padding: 10px 12px;
          display: flex;
          gap: 8px;
          background: #131518;
          position: sticky;
          bottom: 0;
          border-top: 1px solid #333;
        }
        #settings-panel button {
          flex: 1;
          padding: 6px 10px;
          background: #252830;
          border: 1px solid #333;
          color: #aab;
          font: inherit;
          border-radius: 3px;
          cursor: pointer;
        }
        #settings-panel button:hover {
          background: #303540;
          border-color: #444;
        }
        #settings-panel button.primary {
          background: #2a3a4a;
          border-color: #3a5a7a;
        }
        #settings-panel .preset-row {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        #settings-panel .preset-btn {
          padding: 3px 8px;
          background: #1a1d22;
          border: 1px solid #333;
          color: #889;
          font-size: 10px;
          cursor: pointer;
          border-radius: 2px;
        }
        #settings-panel .preset-btn:hover {
          background: #252830;
          border-color: #444;
        }
        /* FX Order List */
        .fx-order-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fx-order-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: #1a1d22;
          border: 1px solid #333;
          border-radius: 3px;
          cursor: grab;
          font-size: 11px;
          color: #99a;
        }
        .fx-order-item:hover {
          background: #222530;
          border-color: #444;
        }
        .fx-order-item.dragging {
          opacity: 0.5;
          background: #2a3040;
        }
        .fx-order-item .fx-handle {
          color: #556;
          font-size: 10px;
        }
        .fx-order-item .fx-name {
          flex: 1;
        }
        .fx-order-item .fx-active {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #333;
        }
        .fx-order-item .fx-active.on {
          background: #4a8;
        }
      </style>
      <h3>⚙ Settings <span style="float:right;opacity:0.5">(\` to toggle)</span></h3>

      <div class="tab-bar">
        <div class="tab active" data-tab="camera">Camera</div>
        <div class="tab" data-tab="visual">Visual</div>
        <div class="tab" data-tab="post">Post FX</div>
        <div class="tab" data-tab="planets">Planets</div>
      </div>

      <!-- ============ CAMERA TAB ============ -->
      <div class="tab-content active" data-tab="camera">
        <div class="section open">
          <div class="section-header"><span class="section-title">Zoom</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Mode</label>
              <select data-path="zoom.mode">
                <option value="linear">Linear</option>
                <option value="logarithmic">Logarithmic</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div class="row">
              <label>Scroll Speed</label>
              <input type="range" data-path="zoom.scrollSpeed" min="0.02" max="0.3" step="0.01">
              <span class="value" data-display="zoom.scrollSpeed"></span>
            </div>
            <div class="row">
              <label>Min Distance</label>
              <input type="range" data-path="zoom.minDistanceMultiplier" min="1.1" max="5" step="0.1">
              <span class="value" data-display="zoom.minDistanceMultiplier"></span>
            </div>
            <div class="row">
              <label>Max Distance</label>
              <input type="range" data-path="zoom.maxDistance" min="20" max="200" step="5">
              <span class="value" data-display="zoom.maxDistance"></span>
            </div>
            <div class="row">
              <label>Transition (s)</label>
              <input type="range" data-path="zoom.transitionDuration" min="0.1" max="2" step="0.1">
              <span class="value" data-display="zoom.transitionDuration"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Rotation</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Sync Mode</label>
              <select data-path="rotation.syncMode">
                <option value="none">None</option>
                <option value="full">Full</option>
                <option value="hybrid">Per-Level</option>
              </select>
            </div>
            <div class="row">
              <label>Smoothing</label>
              <input type="range" data-path="rotation.smoothing" min="0.01" max="0.5" step="0.01">
              <span class="value" data-display="rotation.smoothing"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Animation</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Scroll Behavior</label>
              <select data-path="animation.scrollBehavior">
                <option value="interrupt">Interrupt</option>
                <option value="additive">Additive</option>
                <option value="queue">Queue</option>
              </select>
            </div>
            <div class="row">
              <label>Easing</label>
              <select data-path="animation.easing">
                <option value="linear">Linear</option>
                <option value="cubicInOut">Cubic</option>
                <option value="expoOut">Expo</option>
              </select>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Orbits</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Time Scale</label>
              <input type="range" data-path="orbit.timeScale" min="0" max="0.5" step="0.01">
              <span class="value" data-display="orbit.timeScale"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ VISUAL TAB ============ -->
      <div class="tab-content" data-tab="visual">
        <div class="section open">
          <div class="section-header"><span class="section-title">Geometry</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Type</label>
              <select data-path="visual.geometry.type">
                <option value="sphere">Sphere</option>
                <option value="icosphere">Icosphere</option>
                <option value="lowpoly">Low Poly</option>
                <option value="cube">Cube</option>
                <option value="octahedron">Octahedron</option>
              </select>
            </div>
            <div class="row">
              <label>Segments</label>
              <input type="range" data-path="visual.geometry.segments" min="4" max="64" step="2">
              <span class="value" data-display="visual.geometry.segments"></span>
            </div>
            <div class="row">
              <label>Vertex Noise</label>
              <input type="range" data-path="visual.geometry.vertexNoise" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.geometry.vertexNoise"></span>
            </div>
            <div class="row">
              <label>Noise Scale</label>
              <input type="range" data-path="visual.geometry.vertexNoiseScale" min="0.5" max="10" step="0.5">
              <span class="value" data-display="visual.geometry.vertexNoiseScale"></span>
            </div>
            <div class="row">
              <label>Noise Anim</label>
              <input type="range" data-path="visual.geometry.vertexNoiseSpeed" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.geometry.vertexNoiseSpeed"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Shading</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Mode</label>
              <select data-path="visual.shading.mode">
                <option value="standard">Standard</option>
                <option value="flat">Flat</option>
                <option value="toon">Toon/Cel</option>
                <option value="unlit">Unlit</option>
                <option value="fresnel">Fresnel</option>
              </select>
            </div>
            <div class="row">
              <label>Toon Bands</label>
              <input type="range" data-path="visual.shading.toonBands" min="2" max="8" step="1">
              <span class="value" data-display="visual.shading.toonBands"></span>
            </div>
            <div class="row">
              <label>Edge Softness</label>
              <input type="range" data-path="visual.shading.toonEdgeSoftness" min="0" max="0.2" step="0.01">
              <span class="value" data-display="visual.shading.toonEdgeSoftness"></span>
            </div>
            <div class="row">
              <label>Flat Shading</label>
              <input type="checkbox" data-path="visual.shading.flatShading">
            </div>
            <div class="row">
              <label>Wireframe</label>
              <input type="checkbox" data-path="visual.shading.wireframe">
            </div>
            <div class="row">
              <label>Wire Over Solid</label>
              <input type="checkbox" data-path="visual.shading.wireframeOver">
            </div>
            <div class="row">
              <label>Wire Color</label>
              <input type="color" data-path="visual.shading.wireframeColor">
              <input type="range" data-path="visual.shading.wireframeAlpha" min="0.1" max="1" step="0.1">
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Lighting</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Ambient</label>
              <input type="range" data-path="visual.lighting.ambient" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.lighting.ambient"></span>
            </div>
            <div class="row">
              <label>Diffuse</label>
              <input type="range" data-path="visual.lighting.diffuse" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.lighting.diffuse"></span>
            </div>
            <div class="row">
              <label>Specular</label>
              <input type="range" data-path="visual.lighting.specular" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.lighting.specular"></span>
            </div>
            <div class="row">
              <label>Spec Power</label>
              <input type="range" data-path="visual.lighting.specularPower" min="4" max="256" step="4">
              <span class="value" data-display="visual.lighting.specularPower"></span>
            </div>
            <div class="row">
              <label>Rim Light</label>
              <input type="range" data-path="visual.lighting.rimLight" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.lighting.rimLight"></span>
            </div>
            <div class="row">
              <label>Rim Color</label>
              <input type="color" data-path="visual.lighting.rimColor">
            </div>
            <div class="row">
              <label>Rim Power</label>
              <input type="range" data-path="visual.lighting.rimPower" min="1" max="5" step="0.5">
              <span class="value" data-display="visual.lighting.rimPower"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Color</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Mode</label>
              <select data-path="visual.color.mode">
                <option value="original">Original</option>
                <option value="monochrome">Monochrome</option>
                <option value="duotone">Duotone</option>
                <option value="palette">Palette</option>
                <option value="hueShift">Hue Shift</option>
              </select>
            </div>
            <div class="row">
              <label>Mono Color</label>
              <input type="color" data-path="visual.color.monochrome">
            </div>
            <div class="row">
              <label>Duo Dark</label>
              <input type="color" data-path="visual.color.duotone1">
              <label style="flex:0">Light</label>
              <input type="color" data-path="visual.color.duotone2">
            </div>
            <div class="row">
              <label>Palette</label>
              <select data-path="visual.color.palette">
                <option value="gameboy">Game Boy</option>
                <option value="cga">CGA</option>
                <option value="nes">NES</option>
                <option value="c64">C64</option>
                <option value="pico8">PICO-8</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="row">
              <label>Hue Shift</label>
              <input type="range" data-path="visual.color.hueShift" min="-180" max="180" step="5">
              <span class="value" data-display="visual.color.hueShift"></span>
            </div>
            <div class="row">
              <label>Saturation</label>
              <input type="range" data-path="visual.color.saturation" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.color.saturation"></span>
            </div>
            <div class="row">
              <label>Brightness</label>
              <input type="range" data-path="visual.color.brightness" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.color.brightness"></span>
            </div>
            <div class="row">
              <label>Contrast</label>
              <input type="range" data-path="visual.color.contrast" min="0.5" max="2" step="0.1">
              <span class="value" data-display="visual.color.contrast"></span>
            </div>
            <div class="row">
              <label>Quantize</label>
              <input type="range" data-path="visual.color.quantize" min="0" max="32" step="1">
              <span class="value" data-display="visual.color.quantize"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Pattern</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Type</label>
              <select data-path="visual.pattern.type">
                <option value="none">None</option>
                <option value="noise">Noise</option>
                <option value="cellular">Cellular</option>
                <option value="grid">Grid</option>
                <option value="dots">Dots</option>
                <option value="stripes">Stripes</option>
                <option value="checker">Checker</option>
              </select>
            </div>
            <div class="row">
              <label>Scale</label>
              <input type="range" data-path="visual.pattern.scale" min="0.1" max="10" step="0.1">
              <span class="value" data-display="visual.pattern.scale"></span>
            </div>
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.pattern.intensity" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.pattern.intensity"></span>
            </div>
            <div class="row">
              <label>Speed</label>
              <input type="range" data-path="visual.pattern.speed" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.pattern.speed"></span>
            </div>
            <div class="row">
              <label>Octaves</label>
              <input type="range" data-path="visual.pattern.octaves" min="1" max="6" step="1">
              <span class="value" data-display="visual.pattern.octaves"></span>
            </div>
            <div class="row">
              <label>Cell Type</label>
              <select data-path="visual.pattern.cellType">
                <option value="voronoi">Voronoi</option>
                <option value="worley">Worley</option>
                <option value="metaball">Metaball</option>
              </select>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Dither</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Mode</label>
              <select data-path="visual.dither.mode">
                <option value="none">None</option>
                <option value="ordered2x2">Ordered 2x2</option>
                <option value="ordered4x4">Ordered 4x4</option>
                <option value="ordered8x8">Ordered 8x8</option>
                <option value="bayer">Bayer</option>
                <option value="blueNoise">Blue Noise</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.dither.intensity" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.dither.intensity"></span>
            </div>
            <div class="row">
              <label>Color Depth</label>
              <input type="range" data-path="visual.dither.colorDepth" min="1" max="8" step="1">
              <span class="value" data-display="visual.dither.colorDepth"></span>
            </div>
            <div class="row">
              <label>Scale</label>
              <input type="range" data-path="visual.dither.scale" min="0.5" max="4" step="0.5">
              <span class="value" data-display="visual.dither.scale"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Outline</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Enabled</label>
              <input type="checkbox" data-path="visual.outline.enabled">
            </div>
            <div class="row">
              <label>Mode</label>
              <select data-path="visual.outline.mode">
                <option value="silhouette">Silhouette</option>
                <option value="crease">Crease</option>
                <option value="all">All Edges</option>
              </select>
            </div>
            <div class="row">
              <label>Width</label>
              <input type="range" data-path="visual.outline.width" min="1" max="10" step="1">
              <span class="value" data-display="visual.outline.width"></span>
            </div>
            <div class="row">
              <label>Color</label>
              <input type="color" data-path="visual.outline.color">
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Animation</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Wobble</label>
              <input type="range" data-path="visual.anim.wobble" min="0" max="0.5" step="0.02">
              <span class="value" data-display="visual.anim.wobble"></span>
            </div>
            <div class="row">
              <label>Wobble Speed</label>
              <input type="range" data-path="visual.anim.wobbleSpeed" min="0.1" max="5" step="0.1">
              <span class="value" data-display="visual.anim.wobbleSpeed"></span>
            </div>
            <div class="row">
              <label>Pulse</label>
              <input type="range" data-path="visual.anim.pulse" min="0" max="0.3" step="0.02">
              <span class="value" data-display="visual.anim.pulse"></span>
            </div>
            <div class="row">
              <label>Pulse Speed</label>
              <input type="range" data-path="visual.anim.pulseSpeed" min="0.1" max="5" step="0.1">
              <span class="value" data-display="visual.anim.pulseSpeed"></span>
            </div>
            <div class="row">
              <label>Rotate</label>
              <input type="range" data-path="visual.anim.rotate" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.anim.rotate"></span>
            </div>
            <div class="row">
              <label>Jitter</label>
              <input type="range" data-path="visual.anim.jitter" min="0" max="0.1" step="0.005">
              <span class="value" data-display="visual.anim.jitter"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Orbit Rings</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Style</label>
              <select data-path="visual.orbitRings.style">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="glow">Glow</option>
                <option value="none">None</option>
              </select>
            </div>
            <div class="row">
              <label>Thickness</label>
              <input type="range" data-path="visual.orbitRings.thickness" min="0.005" max="0.1" step="0.005">
              <span class="value" data-display="visual.orbitRings.thickness"></span>
            </div>
            <div class="row">
              <label>Alpha</label>
              <input type="range" data-path="visual.orbitRings.alpha" min="0.1" max="1" step="0.1">
              <span class="value" data-display="visual.orbitRings.alpha"></span>
            </div>
            <div class="row">
              <label>Glow</label>
              <input type="range" data-path="visual.orbitRings.glow" min="0" max="1" step="0.1">
              <span class="value" data-display="visual.orbitRings.glow"></span>
            </div>
            <div class="row">
              <label>Glow Color</label>
              <input type="color" data-path="visual.orbitRings.glowColor">
            </div>
            <div class="row">
              <label>Hierarchical</label>
              <input type="checkbox" data-path="visual.orbitRings.hierarchical">
              <span style="font-size:10px;color:#556;margin-left:8px;">Only show focused body's children</span>
            </div>
            <div class="row">
              <label>Empty Moons</label>
              <input type="checkbox" data-path="visual.orbitRings.showEmptyMoons">
              <span style="font-size:10px;color:#556;margin-left:8px;">Show ring for childless moons</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Star</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Glow</label>
              <input type="range" data-path="visual.star.glow" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.star.glow"></span>
            </div>
            <div class="row">
              <label>Glow Color</label>
              <input type="color" data-path="visual.star.glowColor">
            </div>
            <div class="row">
              <label>Glow Size</label>
              <input type="range" data-path="visual.star.glowSize" min="1" max="5" step="0.5">
              <span class="value" data-display="visual.star.glowSize"></span>
            </div>
            <div class="row">
              <label>Corona</label>
              <input type="checkbox" data-path="visual.star.corona">
            </div>
            <div class="row">
              <label>Corona Rays</label>
              <input type="range" data-path="visual.star.coronaRays" min="4" max="16" step="1">
              <span class="value" data-display="visual.star.coronaRays"></span>
            </div>
            <div class="row">
              <label>Pulse</label>
              <input type="range" data-path="visual.star.pulse" min="0" max="0.5" step="0.02">
              <span class="value" data-display="visual.star.pulse"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Background</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Color</label>
              <input type="color" data-path="visual.background.color">
            </div>
            <div class="row">
              <label>Stars</label>
              <input type="checkbox" data-path="visual.background.stars">
            </div>
            <div class="row">
              <label>Star Count</label>
              <input type="range" data-path="visual.background.starCount" min="0" max="500" step="25">
              <span class="value" data-display="visual.background.starCount"></span>
            </div>
            <div class="row">
              <label>Star Size</label>
              <input type="range" data-path="visual.background.starSize" min="0.5" max="3" step="0.25">
              <span class="value" data-display="visual.background.starSize"></span>
            </div>
            <div class="row">
              <label>Twinkle</label>
              <input type="range" data-path="visual.background.starTwinkle" min="0" max="1" step="0.1">
              <span class="value" data-display="visual.background.starTwinkle"></span>
            </div>
            <div class="row">
              <label>Grid</label>
              <input type="checkbox" data-path="visual.background.grid">
            </div>
            <div class="row">
              <label>Grid Color</label>
              <input type="color" data-path="visual.background.gridColor">
            </div>
          </div>
        </div>
      </div>

      <!-- ============ POST FX TAB ============ -->
      <div class="tab-content" data-tab="post">
        <div class="section open">
          <div class="section-header"><span class="section-title">FX Order (drag to reorder)</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div id="fx-order-list" class="fx-order-list"></div>
            <div class="row" style="margin-top:8px;font-size:10px;color:#556;">
              Effects are applied top to bottom. Drag items to reorder.
            </div>
          </div>
        </div>

        <div class="section open">
          <div class="section-header"><span class="section-title">Pixelation</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Amount</label>
              <input type="range" data-path="visual.post.pixelate" min="0" max="16" step="1">
              <span class="value" data-display="visual.post.pixelate"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Scanlines</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.post.scanlines" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.post.scanlines"></span>
            </div>
            <div class="row">
              <label>Scale</label>
              <input type="range" data-path="visual.post.scanlineScale" min="1" max="6" step="1">
              <span class="value" data-display="visual.post.scanlineScale"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">CRT</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Enabled</label>
              <input type="checkbox" data-path="visual.post.crt">
            </div>
            <div class="row">
              <label>Curvature</label>
              <input type="range" data-path="visual.post.crtIntensity" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.post.crtIntensity"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Chromatic Aberration</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Amount</label>
              <input type="range" data-path="visual.post.chromaticAberration" min="0" max="0.05" step="0.002">
              <span class="value" data-display="visual.post.chromaticAberration"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Bloom</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.post.bloom" min="0" max="2" step="0.1">
              <span class="value" data-display="visual.post.bloom"></span>
            </div>
            <div class="row">
              <label>Threshold</label>
              <input type="range" data-path="visual.post.bloomThreshold" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.post.bloomThreshold"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Film Grain</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Amount</label>
              <input type="range" data-path="visual.post.grain" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.post.grain"></span>
            </div>
            <div class="row">
              <label>Speed</label>
              <input type="range" data-path="visual.post.grainSpeed" min="0.1" max="5" step="0.1">
              <span class="value" data-display="visual.post.grainSpeed"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Vignette</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.post.vignette" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.post.vignette"></span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><span class="section-title">Glitch</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Enabled</label>
              <input type="checkbox" data-path="visual.glitch.enabled">
            </div>
            <div class="row">
              <label>Frequency</label>
              <input type="range" data-path="visual.glitch.frequency" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.glitch.frequency"></span>
            </div>
            <div class="row">
              <label>Intensity</label>
              <input type="range" data-path="visual.glitch.intensity" min="0" max="1" step="0.05">
              <span class="value" data-display="visual.glitch.intensity"></span>
            </div>
            <div class="row">
              <label>Block Size</label>
              <input type="range" data-path="visual.glitch.blockSize" min="0.02" max="0.3" step="0.02">
              <span class="value" data-display="visual.glitch.blockSize"></span>
            </div>
            <div class="row">
              <label>RGB Shift</label>
              <input type="checkbox" data-path="visual.glitch.rgbShift">
            </div>
            <div class="row">
              <label>Scanline Jitter</label>
              <input type="checkbox" data-path="visual.glitch.scanlineJitter">
            </div>
          </div>
        </div>
      </div>

      <!-- ============ PLANETS TAB ============ -->
      <div class="tab-content" data-tab="planets">
        <div class="section open">
          <div class="section-header"><span class="section-title">Per-Planet Overrides</span><span class="section-toggle"></span></div>
          <div class="section-body">
            <div class="row">
              <label>Select Body</label>
              <select id="planet-select">
                <option value="">— Global (no override) —</option>
                <option value="central">Central Star</option>
                <option value="rcx01">rcx01 (planet)</option>
                <option value="rcx02">rcx02 (planet)</option>
                <option value="rcx03">rcx03 (planet)</option>
                <option value="rcx04">rcx04 (planet)</option>
                <option value="rcx05">rcx05 (planet)</option>
                <option value="rcx01_demos">rcx01 demos (moon)</option>
                <option value="rcx02_demos">rcx02 demos (moon)</option>
                <option value="rcx03_demos">rcx03 demos (moon)</option>
              </select>
            </div>
            <div id="planet-override-notice" style="font-size:10px;color:#667;margin:8px 0;">
              Select a body to add/edit its override settings.
            </div>
          </div>
        </div>

        <div id="planet-override-settings" style="display:none;">
          <div class="section">
            <div class="section-header"><span class="section-title">Geometry Override</span><span class="section-toggle"></span></div>
            <div class="section-body">
              <div class="row">
                <label>Type</label>
                <select data-override="geometry.type">
                  <option value="">— Use Global —</option>
                  <option value="sphere">Sphere</option>
                  <option value="icosphere">Icosphere</option>
                  <option value="lowpoly">Low Poly</option>
                  <option value="cube">Cube</option>
                  <option value="octahedron">Octahedron</option>
                </select>
              </div>
              <div class="row">
                <label>Segments</label>
                <input type="number" data-override="geometry.segments" placeholder="global" min="4" max="64">
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header"><span class="section-title">Shading Override</span><span class="section-toggle"></span></div>
            <div class="section-body">
              <div class="row">
                <label>Mode</label>
                <select data-override="shading.mode">
                  <option value="">— Use Global —</option>
                  <option value="standard">Standard</option>
                  <option value="flat">Flat</option>
                  <option value="toon">Toon/Cel</option>
                  <option value="unlit">Unlit</option>
                  <option value="fresnel">Fresnel</option>
                </select>
              </div>
              <div class="row">
                <label>Toon Bands</label>
                <input type="number" data-override="shading.toonBands" placeholder="global" min="2" max="8">
              </div>
              <div class="row">
                <label>Wireframe</label>
                <select data-override="shading.wireframe">
                  <option value="">— Use Global —</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header"><span class="section-title">Color Override</span><span class="section-toggle"></span></div>
            <div class="section-body">
              <div class="row">
                <label>Hue Shift</label>
                <input type="number" data-override="color.hueShift" placeholder="global" min="-180" max="180">
              </div>
              <div class="row">
                <label>Saturation</label>
                <input type="number" data-override="color.saturation" placeholder="global" min="0" max="2" step="0.1">
              </div>
              <div class="row">
                <label>Brightness</label>
                <input type="number" data-override="color.brightness" placeholder="global" min="0" max="2" step="0.1">
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header"><span class="section-title">Post FX Override</span><span class="section-toggle"></span></div>
            <div class="section-body">
              <div class="row">
                <label>Pixelate</label>
                <input type="number" data-override="post.pixelate" placeholder="global" min="0" max="32">
              </div>
              <div class="row">
                <label>Scanlines</label>
                <input type="number" data-override="post.scanlines" placeholder="global" min="0" max="1" step="0.1">
              </div>
              <div class="row">
                <label>Bloom</label>
                <input type="number" data-override="post.bloom" placeholder="global" min="0" max="2" step="0.1">
              </div>
            </div>
          </div>

          <div class="row" style="padding:8px 12px;">
            <button id="clear-planet-override" style="flex:1;">Clear Override</button>
          </div>
        </div>
      </div>

      <div class="buttons">
        <button id="settings-reset">Reset</button>
        <button id="settings-export">Export</button>
        <button id="settings-save" class="primary">Apply</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Tab switching
    panel.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        panel.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    // Section toggling
    panel.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('open');
      });
    });

    // Bind input events
    panel.querySelectorAll('[data-path]').forEach(el => {
      const handler = () => {
        let value;
        if (el.type === 'checkbox') {
          value = el.checked;
        } else if (el.type === 'range' || el.type === 'number') {
          value = parseFloat(el.value);
        } else {
          value = el.value;
        }
        setByPath(settings, el.dataset.path, value);
        updateDisplays();
        if (onChangeCallback) onChangeCallback(settings);
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    document.getElementById('settings-save').addEventListener('click', () => {
      if (onChangeCallback) onChangeCallback(settings);
      flashButton('settings-save', 'Applied!', '#2a4a3a');
    });
    document.getElementById('settings-export').addEventListener('click', exportSettings);
    document.getElementById('settings-reset').addEventListener('click', resetSettings);

    // Toggle with backtick
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggle();
      }
    });

    // Initialize FX Order list
    initFxOrderList();

    // Initialize Planet Overrides
    initPlanetOverrides();
  }

  // ============ FX ORDER ============
  const fxNames = {
    pixelate: 'Pixelate',
    dither: 'Dither',
    colorAdjust: 'Color Adjust',
    scanlines: 'Scanlines',
    crt: 'CRT',
    bloom: 'Bloom',
    chromaticAberration: 'Chromatic Aberration',
    grain: 'Film Grain',
    vignette: 'Vignette',
    glitch: 'Glitch'
  };

  function initFxOrderList() {
    const container = document.getElementById('fx-order-list');
    if (!container) return;

    renderFxOrderList();

    // Make list sortable via drag
    container.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('fx-order-item')) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.fx);
      }
    });

    container.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('fx-order-item')) {
        e.target.classList.remove('dragging');
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = container.querySelector('.dragging');
      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement) {
        container.insertBefore(dragging, afterElement);
      } else {
        container.appendChild(dragging);
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      // Update settings with new order
      const items = container.querySelectorAll('.fx-order-item');
      const newOrder = Array.from(items).map(item => item.dataset.fx);
      settings.visual.post.fxOrder = newOrder;
      if (onChangeCallback) onChangeCallback(settings);
    });
  }

  function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.fx-order-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function renderFxOrderList() {
    const container = document.getElementById('fx-order-list');
    if (!container) return;

    const order = settings.visual.post.fxOrder || Object.keys(fxNames);

    container.innerHTML = order.map(fx => {
      const isActive = isFxActive(fx);
      return `
        <div class="fx-order-item" draggable="true" data-fx="${fx}">
          <span class="fx-handle">☰</span>
          <span class="fx-name">${fxNames[fx] || fx}</span>
          <span class="fx-active ${isActive ? 'on' : ''}" title="${isActive ? 'Active' : 'Inactive'}"></span>
        </div>
      `;
    }).join('');
  }

  function isFxActive(fx) {
    const post = settings.visual.post;
    const glitch = settings.visual.glitch;
    const dither = settings.visual.dither;
    const color = settings.visual.color;

    switch (fx) {
      case 'pixelate': return post.pixelate > 0;
      case 'scanlines': return post.scanlines > 0;
      case 'crt': return post.crt;
      case 'bloom': return post.bloom > 0;
      case 'chromaticAberration': return post.chromaticAberration > 0;
      case 'grain': return post.grain > 0;
      case 'vignette': return post.vignette > 0;
      case 'glitch': return glitch.enabled;
      case 'dither': return dither.mode !== 'none';
      case 'colorAdjust': return color.hueShift !== 0 || color.saturation !== 1 || color.brightness !== 1 || color.contrast !== 1;
      default: return false;
    }
  }

  // ============ PLANET OVERRIDES ============
  let selectedPlanet = null;

  function initPlanetOverrides() {
    const select = document.getElementById('planet-select');
    const overridePanel = document.getElementById('planet-override-settings');
    const notice = document.getElementById('planet-override-notice');
    const clearBtn = document.getElementById('clear-planet-override');

    if (!select) return;

    select.addEventListener('change', () => {
      selectedPlanet = select.value || null;

      if (selectedPlanet) {
        overridePanel.style.display = 'block';
        notice.style.display = 'none';
        loadPlanetOverrides(selectedPlanet);
      } else {
        overridePanel.style.display = 'none';
        notice.style.display = 'block';
      }
    });

    // Bind override inputs
    panel.querySelectorAll('[data-override]').forEach(el => {
      el.addEventListener('change', () => {
        if (!selectedPlanet) return;
        savePlanetOverride(selectedPlanet, el.dataset.override, el.value);
      });
    });

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (selectedPlanet && settings.visual.overrides) {
          delete settings.visual.overrides[selectedPlanet];
          loadPlanetOverrides(selectedPlanet);
          if (onChangeCallback) onChangeCallback(settings);
        }
      });
    }
  }

  function loadPlanetOverrides(planetId) {
    const overrides = settings.visual.overrides?.[planetId] || {};

    panel.querySelectorAll('[data-override]').forEach(el => {
      const path = el.dataset.override;
      const value = getByPath(overrides, path);

      if (el.tagName === 'SELECT') {
        el.value = value !== undefined ? String(value) : '';
      } else if (el.type === 'number') {
        el.value = value !== undefined ? value : '';
        el.placeholder = 'global';
      }
    });
  }

  function savePlanetOverride(planetId, path, value) {
    if (!settings.visual.overrides) {
      settings.visual.overrides = {};
    }
    if (!settings.visual.overrides[planetId]) {
      settings.visual.overrides[planetId] = {};
    }

    // Parse value
    let parsedValue = value;
    if (value === '' || value === null) {
      // Remove override - delete from path
      deleteByPath(settings.visual.overrides[planetId], path);
      // Clean up empty objects
      if (Object.keys(settings.visual.overrides[planetId]).length === 0) {
        delete settings.visual.overrides[planetId];
      }
    } else {
      // Boolean handling
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (!isNaN(parseFloat(value))) parsedValue = parseFloat(value);

      setByPath(settings.visual.overrides[planetId], path, parsedValue);
    }

    if (onChangeCallback) onChangeCallback(settings);
  }

  function deleteByPath(obj, path) {
    const keys = path.split('.');
    const last = keys.pop();
    let target = obj;
    for (const key of keys) {
      if (!target[key]) return;
      target = target[key];
    }
    delete target[last];
  }

  function flashButton(id, text, color) {
    const btn = document.getElementById(id);
    const orig = btn.textContent;
    btn.textContent = text;
    btn.style.background = color;
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 1000);
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => {
      if (!o[k]) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  function updateUI() {
    panel.querySelectorAll('[data-path]').forEach(el => {
      const val = getByPath(settings, el.dataset.path);
      if (val === undefined) return;

      if (el.type === 'checkbox') {
        el.checked = val;
      } else if (el.type === 'range' || el.type === 'number') {
        el.value = val;
      } else {
        el.value = val;
      }
    });
    updateDisplays();
  }

  function updateDisplays() {
    panel.querySelectorAll('[data-display]').forEach(el => {
      const val = getByPath(settings, el.dataset.display);
      if (typeof val === 'number') {
        el.textContent = Number.isInteger(val) ? val : val.toFixed(2);
      } else if (val !== undefined) {
        el.textContent = val;
      }
    });
  }

  async function loadSettings() {
    try {
      const res = await fetch('./settings.json', { cache: 'no-store' });
      if (res.ok) {
        const loaded = await res.json();
        settings = deepMerge(structuredClone(defaultSettings), loaded);
      } else {
        settings = structuredClone(defaultSettings);
      }
    } catch (e) {
      console.warn('Failed to load settings, using defaults', e);
      settings = structuredClone(defaultSettings);
    }
    return settings;
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rcx-visual-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    flashButton('settings-export', 'Exported!', '#3a4a2a');
  }

  function resetSettings() {
    settings = structuredClone(defaultSettings);
    updateUI();
    if (onChangeCallback) onChangeCallback(settings);
    flashButton('settings-reset', 'Reset!', '#4a3a3a');
  }

  function toggle() {
    visible = !visible;
    panel.classList.toggle('visible', visible);
  }

  function show() { visible = true; panel.classList.add('visible'); }
  function hide() { visible = false; panel.classList.remove('visible'); }

  return {
    async init(onChange) {
      onChangeCallback = onChange;
      await loadSettings();
      createPanel();
      updateUI();
      return settings;
    },
    getSettings() { return settings; },
    toggle,
    show,
    hide
  };
})();

/**
 * Visual Engine - Handles all visual effects rendering for the planet system
 * Supports: geometry types, shading modes, post-processing with ordering, per-planet overrides
 */

const VisualEngine = (() => {
  let scene = null;
  let engine = null;
  let camera = null;
  let settings = null;
  let prevGeometrySettings = null; // Track for rebuild detection
  let postProcess = null;
  let backgroundStars = null;
  let time = 0;

  // Store references to all managed meshes
  const managedBodies = new Map(); // bodyId -> { mesh, originalColor, material, vertexData }

  // Post-processing pipeline
  let postPipeline = null;
  let fxPasses = {};

  // ============ SHADERS ============

  // Toon/Cel shader
  const toonVertexShader = `
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    uniform mat4 worldViewProjection;
    uniform mat4 world;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUV;
    void main() {
      gl_Position = worldViewProjection * vec4(position, 1.0);
      vNormal = normalize((world * vec4(normal, 0.0)).xyz);
      vWorldPos = (world * vec4(position, 1.0)).xyz;
      vUV = uv;
    }
  `;

  const toonFragmentShader = `
    precision highp float;
    uniform vec3 lightPos;
    uniform vec3 baseColor;
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float rimIntensity;
    uniform float bands;
    uniform float edgeSoftness;
    uniform vec3 cameraPos;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUV;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(lightPos - vWorldPos);
      vec3 V = normalize(cameraPos - vWorldPos);

      // Toon shading with bands
      float NdotL = dot(N, L);
      float intensity = (NdotL + 1.0) * 0.5; // remap to 0-1
      float stepped = floor(intensity * bands + edgeSoftness) / bands;
      stepped = clamp(stepped, 0.2, 1.0);

      vec3 color = baseColor * stepped;

      // Rim lighting
      float rim = 1.0 - max(dot(V, N), 0.0);
      rim = pow(rim, rimPower) * rimIntensity;
      color += rimColor * rim;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Fresnel shader
  const fresnelFragmentShader = `
    precision highp float;
    uniform vec3 lightPos;
    uniform vec3 baseColor;
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float rimIntensity;
    uniform vec3 cameraPos;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(lightPos - vWorldPos);
      vec3 V = normalize(cameraPos - vWorldPos);

      float NdotL = max(dot(N, L), 0.0);
      vec3 diffuse = baseColor * (0.3 + 0.7 * NdotL);

      float rim = 1.0 - max(dot(V, N), 0.0);
      rim = pow(rim, rimPower) * rimIntensity;

      vec3 color = diffuse + rimColor * rim;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Post-process: Combined effects shader (simplified for compatibility)
  const postProcessFragment = `
    precision highp float;
    varying vec2 vUV;
    uniform sampler2D textureSampler;
    uniform vec2 screenSize;
    uniform float time;

    // Effect parameters
    uniform float pixelate;
    uniform float scanlines;
    uniform float scanlineScale;
    uniform float crt;
    uniform float crtIntensity;
    uniform float chromaticAberration;
    uniform float bloom;
    uniform float bloomThreshold;
    uniform float grain;
    uniform float grainSpeed;
    uniform float vignette;
    uniform float glitchEnabled;
    uniform float glitchIntensity;
    uniform float glitchBlockSize;

    // Color adjustments
    uniform float hueShift;
    uniform float saturation;
    uniform float brightness;
    uniform float contrast;
    uniform float quantize;

    // Dithering
    uniform float ditherMode;
    uniform float ditherIntensity;
    uniform float ditherColorDepth;
    uniform float ditherScale;

    // Random function
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Simplified dither using modulo pattern
    float simpleDither(vec2 pos) {
      float x = mod(pos.x, 4.0);
      float y = mod(pos.y, 4.0);
      return mod(x + y * 2.0, 4.0) / 4.0;
    }

    // RGB to HSV
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // HSV to RGB
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec2 uv = vUV;

      // CRT curvature
      if (crt > 0.5) {
        vec2 center = uv - 0.5;
        float dist = length(center);
        float curve = 1.0 + dist * dist * crtIntensity * 0.5;
        uv = center * curve + 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
      }

      // Pixelation
      vec2 texCoord = uv;
      if (pixelate > 0.0) {
        vec2 pixelSize = screenSize / pixelate;
        texCoord = floor(uv * pixelSize) / pixelSize;
      }

      // Sample color with optional chromatic aberration
      vec3 color;
      if (chromaticAberration > 0.0) {
        float offset = chromaticAberration;
        color.r = texture2D(textureSampler, texCoord + vec2(offset, 0.0)).r;
        color.g = texture2D(textureSampler, texCoord).g;
        color.b = texture2D(textureSampler, texCoord - vec2(offset, 0.0)).b;
      } else {
        color = texture2D(textureSampler, texCoord).rgb;
      }

      // Glitch effect
      if (glitchEnabled > 0.5 && glitchIntensity > 0.0) {
        float glitchRand = rand(vec2(floor(time * 10.0), floor(uv.y / glitchBlockSize)));
        if (glitchRand < glitchIntensity * 0.3) {
          float glitchOffset = (rand(vec2(time, uv.y)) - 0.5) * glitchIntensity * 0.1;
          color.r = texture2D(textureSampler, texCoord + vec2(glitchOffset + 0.02, 0.0)).r;
          color.b = texture2D(textureSampler, texCoord + vec2(glitchOffset - 0.02, 0.0)).b;
        }
      }

      // Color adjustments
      if (hueShift != 0.0 || saturation != 1.0 || brightness != 1.0 || contrast != 1.0) {
        vec3 hsv = rgb2hsv(color);
        hsv.x = mod(hsv.x + hueShift / 360.0, 1.0);
        hsv.y *= saturation;
        color = hsv2rgb(hsv);
        color *= brightness;
        color = (color - 0.5) * contrast + 0.5;
      }

      // Color quantization
      if (quantize > 0.0) {
        color = floor(color * quantize) / quantize;
      }

      // Dithering (simplified)
      if (ditherMode > 0.0 && ditherIntensity > 0.0) {
        vec2 ditherPos = gl_FragCoord.xy / ditherScale;
        float threshold = (ditherMode > 2.5) ? rand(ditherPos + time) : simpleDither(ditherPos);
        float levels = pow(2.0, ditherColorDepth);
        color = floor(color * levels + threshold * ditherIntensity) / levels;
      }

      // Scanlines
      if (scanlines > 0.0) {
        float scanline = sin(gl_FragCoord.y / scanlineScale * 3.14159) * 0.5 + 0.5;
        color *= 1.0 - scanlines * (1.0 - scanline) * 0.3;
      }

      // Bloom (fake)
      if (bloom > 0.0) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        if (luma > bloomThreshold) {
          color += (color - bloomThreshold) * bloom * 0.5;
        }
      }

      // Film grain
      if (grain > 0.0) {
        float noise = rand(uv + time * grainSpeed) * 2.0 - 1.0;
        color += noise * grain * 0.1;
      }

      // Vignette
      if (vignette > 0.0) {
        vec2 center = uv - 0.5;
        float dist = length(center) * 1.5;
        float vig = 1.0 - dist * dist * vignette;
        color *= clamp(vig, 0.0, 1.0);
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  // ============ INITIALIZATION ============

  function init(babylonScene, babylonEngine, arcCamera, visualSettings) {
    try {
      scene = babylonScene;
      engine = babylonEngine;
      camera = arcCamera;
      settings = visualSettings;

      // Update lighting based on settings
      updateLighting();

      // Post-processing effects
      setupPostProcessing();

      // Background stars
      updateBackground();
    } catch (err) {
      console.warn('Visual engine init failed:', err);
    }

    return {
      update,
      applyToBody,
      getSettingsForBody,
      updateSettings,
      rebuildGeometry,
      rebuildAllGeometry,
      updateOrbitRings,
      setupStarEffects,
    };
  }

  function updateSettings(newSettings) {
    const oldSettings = settings;
    settings = newSettings;

    // Check if geometry settings changed (requires mesh rebuild)
    const geometryChanged = hasGeometryChanged(oldSettings?.visual?.geometry, newSettings?.visual?.geometry);
    const flatShadingChanged = oldSettings?.visual?.shading?.flatShading !== newSettings?.visual?.shading?.flatShading;

    updateLighting();
    updateBackground();
    updateStarEffects();
    updatePostProcessing();

    // If geometry or flat shading changed, rebuild all meshes
    if (geometryChanged || flatShadingChanged) {
      rebuildAllGeometry();
    } else {
      // Just update materials
      updateAllMaterials();
    }

    updateOutlines();
  }

  function hasGeometryChanged(oldGeo, newGeo) {
    if (!oldGeo || !newGeo) return true;
    return oldGeo.type !== newGeo.type ||
           oldGeo.segments !== newGeo.segments ||
           oldGeo.subdivisions !== newGeo.subdivisions ||
           oldGeo.vertexNoise !== newGeo.vertexNoise ||
           oldGeo.vertexNoiseScale !== newGeo.vertexNoiseScale;
  }

  // ============ LIGHTING ============

  function updateLighting() {
    if (!scene || !settings?.visual?.lighting) return;

    const lighting = settings.visual.lighting;

    // Find and update hemispheric light
    const hemi = scene.getLightByName('hemi');
    if (hemi) {
      hemi.intensity = lighting.ambient || 0.3;
    }

    // Find and update point light
    const point = scene.getLightByName('point');
    if (point) {
      point.intensity = lighting.diffuse || 0.7;
    }
  }

  // ============ STAR/CENTRAL EFFECTS ============

  let centralMesh = null;
  let starGlowLayer = null;
  let coronaRays = [];

  function setupStarEffects(mesh) {
    centralMesh = mesh;
    updateStarEffects();
  }

  function updateStarEffects() {
    if (!centralMesh || !scene || !settings?.visual?.star) return;

    const star = settings.visual.star;

    // Create or update glow layer
    if (star.glow > 0) {
      if (!starGlowLayer) {
        starGlowLayer = new BABYLON.GlowLayer('starGlow', scene, {
          blurKernelSize: 64
        });
        starGlowLayer.intensity = star.glow;
      }

      starGlowLayer.intensity = star.glow * 2;

      // Add central mesh to glow
      const glowColor = BABYLON.Color3.FromHexString(star.glowColor || '#335577');
      starGlowLayer.addIncludedOnlyMesh(centralMesh);
      starGlowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
        if (mesh === centralMesh) {
          result.set(glowColor.r, glowColor.g, glowColor.b, 1);
        }
      };
    } else if (starGlowLayer) {
      starGlowLayer.dispose();
      starGlowLayer = null;
    }

    // Corona rays
    disposeCoronaRays();

    if (star.corona) {
      createCoronaRays(star);
    }
  }

  function disposeCoronaRays() {
    coronaRays.forEach(ray => {
      if (ray && ray.dispose) ray.dispose();
    });
    coronaRays = [];
  }

  function createCoronaRays(star) {
    try {
      if (!centralMesh) return;

      const rayCount = star.coronaRays || 8;
      const rayLength = (star.coronaLength || 0.5) * 5;
      const glowColor = BABYLON.Color3.FromHexString(star.glowColor || '#335577');
      const starRadius = centralMesh.getBoundingInfo().boundingSphere.radius * 1.2;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;

        // Create ray as a thin plane/ribbon
        const rayMesh = BABYLON.MeshBuilder.CreatePlane(`coronaRay_${i}`, {
          width: 0.15,
          height: rayLength
        }, scene);

        // Position at edge of star, pointing outward
        rayMesh.position = centralMesh.position.clone();
        rayMesh.position.x += Math.cos(angle) * starRadius;
        rayMesh.position.z += Math.sin(angle) * starRadius;

        // Rotate to face outward
        rayMesh.rotation.y = -angle;
        rayMesh.rotation.x = Math.PI / 2;

        // Pivot at base
        rayMesh.setPivotPoint(new BABYLON.Vector3(0, -rayLength / 2, 0));

        // Create glowing material
        const rayMat = new BABYLON.StandardMaterial(`coronaRayMat_${i}`, scene);
        rayMat.emissiveColor = glowColor;
        rayMat.disableLighting = true;
        rayMat.alpha = 0.4;
        rayMat.backFaceCulling = false;
        rayMesh.material = rayMat;

        rayMesh.isPickable = false;
        coronaRays.push(rayMesh);

        // Add to glow layer
        if (starGlowLayer) {
          starGlowLayer.addIncludedOnlyMesh(rayMesh);
        }
      }
    } catch (err) {
      console.warn('Corona rays creation failed:', err);
    }
  }

  // ============ OUTLINE RENDERING ============

  function updateOutlines() {
    if (!settings?.visual?.outline) return;

    const outline = settings.visual.outline;

    managedBodies.forEach((info, bodyId) => {
      const mesh = info.mesh;
      if (!mesh) return;

      if (outline.enabled) {
        // Enable edge rendering
        mesh.edgesWidth = outline.width || 2;
        mesh.edgesColor = BABYLON.Color4.FromHexString(outline.color + 'FF' || '#000000FF');
        mesh.enableEdgesRendering();
      } else {
        // Disable edge rendering
        mesh.disableEdgesRendering();
      }
    });
  }

  // ============ ORBIT RINGS ============

  let orbitRingMeshes = [];

  function updateOrbitRings(rings) {
    // Store references to orbit rings for styling
    orbitRingMeshes = rings || [];
    applyOrbitRingStyle();
  }

  function applyOrbitRingStyle() {
    if (!settings?.visual?.orbitRings) return;

    const style = settings.visual.orbitRings;

    orbitRingMeshes.forEach(ring => {
      if (!ring || !ring.material) return;

      // Update alpha
      ring.material.alpha = style.alpha || 0.3;

      // Update emissive for glow effect
      if (style.glow > 0) {
        const glowColor = BABYLON.Color3.FromHexString(style.glowColor || '#4488ff');
        ring.material.emissiveColor = glowColor.scale(style.glow);
      } else {
        ring.material.emissiveColor = new BABYLON.Color3(0.12, 0.15, 0.2);
      }

      // Hide if style is 'none'
      ring.isVisible = style.style !== 'none';
    });
  }

  // ============ GEOMETRY ============

  function createBodyGeometry(size, bodySettings) {
    const geo = bodySettings.geometry || settings.visual.geometry;
    const segments = geo.segments || 32;

    let mesh;
    switch (geo.type) {
      case 'icosphere':
        mesh = BABYLON.MeshBuilder.CreateIcoSphere('body', {
          radius: size / 2,
          subdivisions: Math.min(geo.subdivisions || 2, 5),
          flat: bodySettings.shading?.flatShading || settings.visual.shading.flatShading,
          updatable: geo.vertexNoise > 0 // Make updatable if using vertex noise
        }, scene);
        break;

      case 'lowpoly':
        mesh = BABYLON.MeshBuilder.CreateSphere('body', {
          diameter: size,
          segments: Math.max(4, Math.min(segments, 8)),
          updatable: geo.vertexNoise > 0
        }, scene);
        break;

      case 'cube':
        mesh = BABYLON.MeshBuilder.CreateBox('body', {
          size: size * 0.8,
          updatable: geo.vertexNoise > 0
        }, scene);
        break;

      case 'octahedron':
        mesh = BABYLON.MeshBuilder.CreatePolyhedron('body', {
          type: 1, // octahedron
          size: size / 2,
          updatable: geo.vertexNoise > 0
        }, scene);
        break;

      default: // sphere
        mesh = BABYLON.MeshBuilder.CreateSphere('body', {
          diameter: size,
          segments: segments,
          updatable: geo.vertexNoise > 0
        }, scene);
    }

    // Apply vertex noise displacement
    if (geo.vertexNoise > 0) {
      applyVertexNoise(mesh, geo.vertexNoise, geo.vertexNoiseScale || 3, size);
    }

    return mesh;
  }

  // Simple 3D noise function using sine combinations
  function noise3D(x, y, z, scale) {
    const s = scale;
    return (
      Math.sin(x * s + y * 2.3) * 0.5 +
      Math.sin(y * s * 1.3 + z * 1.7) * 0.3 +
      Math.sin(z * s * 0.9 + x * 2.1) * 0.2 +
      Math.sin((x + y + z) * s * 0.7) * 0.1
    ) / 1.1; // Normalize to roughly -1 to 1
  }

  function applyVertexNoise(mesh, noiseAmount, noiseScale, baseSize, timeOffset = 0) {
    try {
      // Get original positions (stored on mesh for animation)
      const origPositions = mesh._originalPositions || mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const origNormals = mesh._originalNormals || mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
      if (!origPositions || !origNormals) return;

      // Store originals for animated noise
      if (!mesh._originalPositions) {
        mesh._originalPositions = new Float32Array(origPositions);
        mesh._originalNormals = new Float32Array(origNormals);
      }

      const newPositions = new Float32Array(origPositions.length);
      const displacement = noiseAmount * baseSize * 0.5;

      for (let i = 0; i < origPositions.length; i += 3) {
        const x = origPositions[i];
        const y = origPositions[i + 1];
        const z = origPositions[i + 2];

        // Calculate noise value based on position and time offset
        const n = noise3D(x + timeOffset * 0.5, y + timeOffset * 0.3, z + timeOffset * 0.7, noiseScale);

        // Displace along original normal
        const nx = origNormals[i];
        const ny = origNormals[i + 1];
        const nz = origNormals[i + 2];

        newPositions[i] = x + nx * n * displacement;
        newPositions[i + 1] = y + ny * n * displacement;
        newPositions[i + 2] = z + nz * n * displacement;
      }

      mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, newPositions);

      // Recompute normals for proper lighting
      const indices = mesh.getIndices();
      const newNormals = [];
      BABYLON.VertexData.ComputeNormals(newPositions, indices, newNormals);
      mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, newNormals);
    } catch (err) {
      console.warn('Vertex noise application failed:', err);
    }
  }

  function rebuildGeometry(bodyId, size) {
    const info = managedBodies.get(bodyId);
    if (!info) return null;

    const bodySettings = getSettingsForBody(bodyId);
    const oldMesh = info.mesh;

    // Create new geometry
    const newMesh = createBodyGeometry(size || oldMesh.getBoundingInfo().boundingSphere.radius * 2, bodySettings);

    // Copy transform
    newMesh.position = oldMesh.position.clone();
    newMesh.rotation = oldMesh.rotation.clone();
    newMesh.scaling = oldMesh.scaling.clone();
    newMesh.parent = oldMesh.parent;

    // Apply material
    applyMaterial(newMesh, info.originalColor, bodySettings);

    // Copy metadata
    newMesh._bodyId = oldMesh._bodyId;
    newMesh._bodyLevel = oldMesh._bodyLevel;
    newMesh._bodyParent = oldMesh._bodyParent;
    newMesh._bodyRef = oldMesh._bodyRef;
    newMesh.name = oldMesh.name;

    // Update CelestialBody reference if exists
    if (oldMesh._bodyRef) {
      oldMesh._bodyRef.mesh = newMesh;
    }

    // Dispose old mesh
    oldMesh.dispose();

    // Update stored reference
    info.mesh = newMesh;
    info.material = newMesh.material;

    // Clear original transform data so animations reset
    meshOriginals.delete(bodyId);

    return newMesh;
  }

  // Rebuild all managed bodies with current geometry settings
  function rebuildAllGeometry() {
    managedBodies.forEach((info, bodyId) => {
      try {
        rebuildGeometry(bodyId);
      } catch (err) {
        console.warn('Failed to rebuild geometry for', bodyId, err);
      }
    });
    // Re-apply outlines after rebuild
    updateOutlines();
  }

  // ============ MATERIALS ============

  function applyToBody(mesh, hexColor, bodyId) {
    const color = BABYLON.Color3.FromHexString(hexColor);

    // Always store in managedBodies first
    managedBodies.set(bodyId, {
      mesh,
      originalColor: color,
      material: null
    });

    try {
      const bodySettings = getSettingsForBody(bodyId);
      applyMaterial(mesh, color, bodySettings);
      // Update stored material reference
      managedBodies.get(bodyId).material = mesh.material;
    } catch (err) {
      console.warn('applyToBody failed for', bodyId, err);
      // Apply fallback material
      mesh.material = createFallbackMaterial(color);
      managedBodies.get(bodyId).material = mesh.material;
    }
  }

  // Color palettes
  const colorPalettes = {
    gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    cga: ['#000000', '#00aaaa', '#aa00aa', '#aaaaaa'],
    nes: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc'],
    c64: ['#000000', '#ffffff', '#68372b', '#70a4b2'],
    pico8: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8']
  };

  function applyMaterial(mesh, color, bodySettings) {
    try {
      const shading = bodySettings.shading || settings.visual.shading;
      const lighting = bodySettings.lighting || settings.visual.lighting;
      const colorSettings = bodySettings.color || settings.visual.color;
      const meshName = mesh.name || 'mesh';

      // Apply color mode
      let finalColor = color.clone();

      // Apply saturation and brightness first (affects all modes except monochrome)
      if (colorSettings.mode !== 'monochrome') {
        const hsv = rgbToHsv(finalColor.r, finalColor.g, finalColor.b);
        hsv.s *= colorSettings.saturation || 1;
        hsv.v *= colorSettings.brightness || 1;
        if (colorSettings.hueShift && colorSettings.hueShift !== 0) {
          hsv.h = (hsv.h + colorSettings.hueShift / 360) % 1;
          if (hsv.h < 0) hsv.h += 1;
        }
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        finalColor = new BABYLON.Color3(rgb.r, rgb.g, rgb.b);
      }

      // Apply specific color modes
      if (colorSettings.mode === 'monochrome') {
        finalColor = BABYLON.Color3.FromHexString(colorSettings.monochrome || '#88ff88');
      } else if (colorSettings.mode === 'duotone') {
        // Map color luminance to duotone gradient
        const luma = finalColor.r * 0.299 + finalColor.g * 0.587 + finalColor.b * 0.114;
        const dark = BABYLON.Color3.FromHexString(colorSettings.duotone1 || '#000033');
        const light = BABYLON.Color3.FromHexString(colorSettings.duotone2 || '#ffff88');
        finalColor = BABYLON.Color3.Lerp(dark, light, luma);
      } else if (colorSettings.mode === 'palette') {
        // Quantize to nearest palette color
        const palette = colorPalettes[colorSettings.palette] || colorPalettes.gameboy;
        finalColor = findNearestPaletteColor(finalColor, palette);
      }

      // Apply contrast
      if (colorSettings.contrast && colorSettings.contrast !== 1) {
        const c = colorSettings.contrast;
        finalColor.r = Math.max(0, Math.min(1, (finalColor.r - 0.5) * c + 0.5));
        finalColor.g = Math.max(0, Math.min(1, (finalColor.g - 0.5) * c + 0.5));
        finalColor.b = Math.max(0, Math.min(1, (finalColor.b - 0.5) * c + 0.5));
      }

      // Create material based on shading mode
      let material;

      if (shading.mode === 'toon') {
        material = createToonMaterial(mesh, finalColor, bodySettings);
      } else if (shading.mode === 'fresnel') {
        material = createFresnelMaterial(mesh, finalColor, bodySettings);
      } else if (shading.mode === 'unlit') {
        material = new BABYLON.StandardMaterial(`${meshName}_unlit`, scene);
        material.emissiveColor = finalColor;
        material.disableLighting = true;
      } else {
        // Standard or flat
        material = new BABYLON.StandardMaterial(`${meshName}_mat`, scene);
        material.diffuseColor = finalColor;
        material.emissiveColor = finalColor.scale(0.35);
        material.specularColor = new BABYLON.Color3(lighting.specular, lighting.specular, lighting.specular);
        material.specularPower = lighting.specularPower;

        if (shading.flatShading) {
          mesh.convertToFlatShadedMesh();
        }
      }

      // Wireframe
      if (shading.wireframe && !shading.wireframeOver) {
        material.wireframe = true;
      }

      mesh.material = material;

      // Wireframe overlay
      if (shading.wireframe && shading.wireframeOver) {
        const wireMat = new BABYLON.StandardMaterial(`${meshName}_wire`, scene);
        wireMat.emissiveColor = BABYLON.Color3.FromHexString(shading.wireframeColor);
        wireMat.wireframe = true;
        wireMat.alpha = shading.wireframeAlpha;
        wireMat.disableLighting = true;

        const wireClone = mesh.clone(`${meshName}_wireframe`);
        wireClone.material = wireMat;
        wireClone.parent = mesh;
        wireClone.position = BABYLON.Vector3.Zero();
        wireClone.scaling = new BABYLON.Vector3(1.01, 1.01, 1.01);
        wireClone.isPickable = false;
      }
    } catch (err) {
      console.warn('applyMaterial failed:', err);
      // Apply simple fallback
      mesh.material = createFallbackMaterial(color);
    }
  }

  function createToonMaterial(mesh, color, bodySettings) {
    try {
      const shading = bodySettings.shading || settings.visual.shading;
      const lighting = bodySettings.lighting || settings.visual.lighting;

      // Register shaders in store
      BABYLON.Effect.ShadersStore["toonVertexShader"] = toonVertexShader;
      BABYLON.Effect.ShadersStore["toonFragmentShader"] = toonFragmentShader;

      const material = new BABYLON.ShaderMaterial('toon', scene, {
        vertex: 'toon',
        fragment: 'toon',
      }, {
        attributes: ['position', 'normal', 'uv'],
        uniforms: ['worldViewProjection', 'world', 'lightPos', 'baseColor', 'rimColor',
                   'rimPower', 'rimIntensity', 'bands', 'edgeSoftness', 'cameraPos']
      });

      material.setVector3('lightPos', new BABYLON.Vector3(0, 10, 10));
      material.setColor3('baseColor', color);
      material.setColor3('rimColor', BABYLON.Color3.FromHexString(lighting.rimColor));
      material.setFloat('rimPower', lighting.rimPower);
      material.setFloat('rimIntensity', lighting.rimLight);
      material.setFloat('bands', shading.toonBands);
      material.setFloat('edgeSoftness', shading.toonEdgeSoftness);

      // Update camera position each frame
      scene.registerBeforeRender(() => {
        if (material && camera) {
          material.setVector3('cameraPos', camera.position);
        }
      });

      return material;
    } catch (err) {
      console.warn('Toon shader failed, using standard material:', err);
      return createFallbackMaterial(color);
    }
  }

  function createFresnelMaterial(mesh, color, bodySettings) {
    try {
      const lighting = bodySettings.lighting || settings.visual.lighting;

      // Register shaders in store
      BABYLON.Effect.ShadersStore["fresnelCustomVertexShader"] = toonVertexShader;
      BABYLON.Effect.ShadersStore["fresnelCustomFragmentShader"] = fresnelFragmentShader;

      const material = new BABYLON.ShaderMaterial('fresnel', scene, {
        vertex: 'fresnelCustom',
        fragment: 'fresnelCustom',
      }, {
        attributes: ['position', 'normal', 'uv'],
        uniforms: ['worldViewProjection', 'world', 'lightPos', 'baseColor', 'rimColor',
                   'rimPower', 'rimIntensity', 'cameraPos']
      });

      material.setVector3('lightPos', new BABYLON.Vector3(0, 10, 10));
      material.setColor3('baseColor', color);
      material.setColor3('rimColor', BABYLON.Color3.FromHexString(lighting.rimColor));
      material.setFloat('rimPower', lighting.rimPower);
      material.setFloat('rimIntensity', Math.max(0.3, lighting.rimLight));

      scene.registerBeforeRender(() => {
        if (material && camera) {
          material.setVector3('cameraPos', camera.position);
        }
      });

      return material;
    } catch (err) {
      console.warn('Fresnel shader failed, using standard material:', err);
      return createFallbackMaterial(color);
    }
  }

  function createFallbackMaterial(color) {
    const material = new BABYLON.StandardMaterial('fallback', scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.35);
    material.specularPower = 64;
    return material;
  }

  function updateAllMaterials() {
    managedBodies.forEach((info, bodyId) => {
      const bodySettings = getSettingsForBody(bodyId);
      applyMaterial(info.mesh, info.originalColor, bodySettings);
    });
  }

  // ============ POST-PROCESSING ============

  function setupPostProcessing() {
    try {
      // Register custom shader in Babylon's shader store
      BABYLON.Effect.ShadersStore["visualFXFragmentShader"] = postProcessFragment;

      postProcess = new BABYLON.PostProcess(
        'visualFX',
        'visualFX', // References visualFXFragmentShader in store
        ['screenSize', 'time', 'pixelate', 'scanlines', 'scanlineScale',
         'crt', 'crtIntensity', 'chromaticAberration', 'bloom', 'bloomThreshold',
         'grain', 'grainSpeed', 'vignette', 'glitchEnabled', 'glitchIntensity', 'glitchBlockSize',
         'hueShift', 'saturation', 'brightness', 'contrast', 'quantize',
         'ditherMode', 'ditherIntensity', 'ditherColorDepth', 'ditherScale'],
        ['textureSampler'],
        1.0,
        camera,
        BABYLON.Texture.BILINEAR_SAMPLINGMODE,
        engine,
        false
      );
    } catch (err) {
      console.warn('Post-processing setup failed:', err);
      postProcess = null;
      return;
    }

    postProcess.onApply = (effect) => {
      const post = settings.visual.post;
      const color = settings.visual.color;
      const dither = settings.visual.dither;
      const glitch = settings.visual.glitch;

      effect.setFloat2('screenSize', engine.getRenderWidth(), engine.getRenderHeight());
      effect.setFloat('time', time);

      effect.setFloat('pixelate', post.pixelate);
      effect.setFloat('scanlines', post.scanlines);
      effect.setFloat('scanlineScale', post.scanlineScale);
      effect.setFloat('crt', post.crt ? 1.0 : 0.0);
      effect.setFloat('crtIntensity', post.crtIntensity);
      effect.setFloat('chromaticAberration', post.chromaticAberration);
      effect.setFloat('bloom', post.bloom);
      effect.setFloat('bloomThreshold', post.bloomThreshold);
      effect.setFloat('grain', post.grain);
      effect.setFloat('grainSpeed', post.grainSpeed);
      effect.setFloat('vignette', post.vignette);

      effect.setFloat('glitchEnabled', glitch.enabled ? 1.0 : 0.0);
      effect.setFloat('glitchIntensity', glitch.intensity);
      effect.setFloat('glitchBlockSize', glitch.blockSize);

      effect.setFloat('hueShift', color.hueShift);
      effect.setFloat('saturation', color.saturation);
      effect.setFloat('brightness', color.brightness);
      effect.setFloat('contrast', color.contrast);
      effect.setFloat('quantize', color.quantize);

      // Dither mode: 0=none, 1=2x2, 2=4x4, 3=8x8, 4=bayer, 5=blueNoise, 6=random
      let ditherModeNum = 0;
      if (dither.mode === 'ordered2x2') ditherModeNum = 1;
      else if (dither.mode === 'ordered4x4') ditherModeNum = 2;
      else if (dither.mode === 'ordered8x8') ditherModeNum = 2; // simplified
      else if (dither.mode === 'bayer') ditherModeNum = 2;
      else if (dither.mode === 'random') ditherModeNum = 3;

      effect.setFloat('ditherMode', ditherModeNum);
      effect.setFloat('ditherIntensity', dither.intensity);
      effect.setFloat('ditherColorDepth', dither.colorDepth);
      effect.setFloat('ditherScale', dither.scale);
    };
  }

  function updatePostProcessing() {
    // Post-process uniforms are updated in onApply callback
    // This function can be used for pipeline restructuring if needed
  }

  // ============ BACKGROUND ============

  let backgroundGrid = null;

  function updateBackground() {
    try {
      const bg = settings?.visual?.background;
      if (!bg || !scene) return;

      // Update scene clear color
      const bgColor = BABYLON.Color3.FromHexString(bg.color || '#050508');
      scene.clearColor = new BABYLON.Color4(bgColor.r, bgColor.g, bgColor.b, 1.0);

      // Background stars - dispose array of meshes
      if (backgroundStars && Array.isArray(backgroundStars)) {
        backgroundStars.forEach(star => {
          if (star && star.dispose) star.dispose();
        });
        backgroundStars = null;
      }

      if (bg.stars && bg.starCount > 0) {
        createBackgroundStars(bg);
      }

      // Background grid
      if (backgroundGrid) {
        backgroundGrid.dispose();
        backgroundGrid = null;
      }

      if (bg.grid) {
        createBackgroundGrid(bg);
      }
    } catch (err) {
      console.warn('updateBackground failed:', err);
    }
  }

  function createBackgroundGrid(bg) {
    try {
      const spacing = bg.gridSpacing || 5;
      const gridSize = 100;
      const gridColor = BABYLON.Color3.FromHexString(bg.gridColor || '#222233');

      // Create grid lines using LineSystem
      const lines = [];

      // Vertical lines (along Z)
      for (let x = -gridSize; x <= gridSize; x += spacing) {
        lines.push([
          new BABYLON.Vector3(x, -100, -gridSize),
          new BABYLON.Vector3(x, -100, gridSize)
        ]);
      }

      // Horizontal lines (along X)
      for (let z = -gridSize; z <= gridSize; z += spacing) {
        lines.push([
          new BABYLON.Vector3(-gridSize, -100, z),
          new BABYLON.Vector3(gridSize, -100, z)
        ]);
      }

      backgroundGrid = BABYLON.MeshBuilder.CreateLineSystem('backgroundGrid', {
        lines: lines
      }, scene);

      const gridMat = new BABYLON.StandardMaterial('gridMat', scene);
      gridMat.emissiveColor = gridColor;
      gridMat.disableLighting = true;
      backgroundGrid.material = gridMat;
      backgroundGrid.alpha = 0.3;
      backgroundGrid.isPickable = false;
    } catch (err) {
      console.warn('createBackgroundGrid failed:', err);
    }
  }

  function createBackgroundStars(bg) {
    try {
      // Use simple sphere particles instead of PointsCloudSystem for reliability
      const starCount = Math.min(bg.starCount || 200, 300);
      backgroundStars = [];

      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 400 + Math.random() * 200;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        const brightness = 0.3 + Math.random() * 0.7;
        const size = (bg.starSize || 1) * (0.3 + Math.random() * 0.7);

        const star = BABYLON.MeshBuilder.CreateSphere(`star_${i}`, { diameter: size, segments: 4 }, scene);
        star.position = new BABYLON.Vector3(x, y, z);
        star.isPickable = false;

        const mat = new BABYLON.StandardMaterial(`starMat_${i}`, scene);
        mat.emissiveColor = new BABYLON.Color3(brightness, brightness, brightness);
        mat.disableLighting = true;
        star.material = mat;

        backgroundStars.push(star);
      }
    } catch (err) {
      console.warn('createBackgroundStars failed:', err);
    }
  }

  // ============ UPDATE LOOP ============

  // Store original mesh data for animations
  const meshOriginals = new Map();

  function update(deltaTime) {
    try {
      time += deltaTime;

      // Animate bodies based on settings
      const anim = settings?.visual?.anim;
      if (!anim) return;

      managedBodies.forEach((info, bodyId) => {
        const mesh = info.mesh;
        if (!mesh) return;

        // Store original scale if not stored
        if (!meshOriginals.has(bodyId)) {
          meshOriginals.set(bodyId, {
            scale: mesh.scaling.clone(),
            position: mesh.position.clone()
          });
        }
        const orig = meshOriginals.get(bodyId);

        // Reset to base
        let scaleX = orig.scale.x;
        let scaleY = orig.scale.y;
        let scaleZ = orig.scale.z;

        // Pulse (uniform scaling)
        if (anim.pulse > 0) {
          const pulse = 1 + Math.sin(time * (anim.pulseSpeed || 1) * 2) * anim.pulse;
          scaleX *= pulse;
          scaleY *= pulse;
          scaleZ *= pulse;
        }

        // Wobble (non-uniform scaling)
        if (anim.wobble > 0) {
          const wobbleSpeed = anim.wobbleSpeed || 1;
          scaleX *= 1 + Math.sin(time * wobbleSpeed * 3) * anim.wobble;
          scaleY *= 1 + Math.sin(time * wobbleSpeed * 3 + 2.1) * anim.wobble;
          scaleZ *= 1 + Math.sin(time * wobbleSpeed * 3 + 4.2) * anim.wobble;
        }

        mesh.scaling.set(scaleX, scaleY, scaleZ);

        // Self rotation
        if (anim.rotate > 0) {
          mesh.rotation.y += deltaTime * anim.rotate;
        }

        // Jitter (position offset)
        if (anim.jitter > 0) {
          const jitterSpeed = anim.jitterSpeed || 10;
          const jx = (Math.sin(time * jitterSpeed + bodyId.length) * 2 - 1) * anim.jitter;
          const jy = (Math.sin(time * jitterSpeed * 1.3 + bodyId.length * 2) * 2 - 1) * anim.jitter;
          const jz = (Math.sin(time * jitterSpeed * 0.7 + bodyId.length * 3) * 2 - 1) * anim.jitter;
          mesh.position.set(orig.position.x + jx, orig.position.y + jy, orig.position.z + jz);
        }

        // Animated vertex noise
        const geo = settings?.visual?.geometry;
        if (geo && geo.vertexNoise > 0 && geo.vertexNoiseSpeed > 0 && mesh._originalPositions) {
          const baseSize = mesh.getBoundingInfo().boundingSphere.radius * 2;
          applyVertexNoise(mesh, geo.vertexNoise, geo.vertexNoiseScale || 3, baseSize, time * geo.vertexNoiseSpeed);
        }
      });

      // Twinkle background stars
      if (Array.isArray(backgroundStars) && settings?.visual?.background?.starTwinkle > 0) {
        const twinkle = settings.visual.background.starTwinkle;
        backgroundStars.forEach((star, i) => {
          if (star && star.material) {
            const brightness = 0.5 + Math.sin(time * 2 + i * 0.5) * 0.5 * twinkle;
            star.material.emissiveColor.set(brightness, brightness, brightness);
          }
        });
      }

      // Update orbit ring styling
      applyOrbitRingStyle();

      // Star/central pulse animation
      if (centralMesh && settings?.visual?.star?.pulse > 0) {
        const starPulse = settings.visual.star;
        const pulse = 1 + Math.sin(time * (starPulse.pulseSpeed || 0.5) * 2) * starPulse.pulse;
        centralMesh.scaling.setAll(pulse);

        // Also pulse the glow intensity
        if (starGlowLayer) {
          starGlowLayer.intensity = (starPulse.glow || 0.5) * (1 + Math.sin(time * (starPulse.pulseSpeed || 0.5) * 2) * 0.3) * 2;
        }
      }
    } catch (err) {
      // Silently ignore update errors
    }
  }

  // Helper: find nearest color in palette
  function findNearestPaletteColor(color, palette) {
    let nearest = palette[0];
    let minDist = Infinity;

    palette.forEach(hex => {
      const pc = BABYLON.Color3.FromHexString(hex);
      const dist = Math.pow(color.r - pc.r, 2) + Math.pow(color.g - pc.g, 2) + Math.pow(color.b - pc.b, 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = hex;
      }
    });

    return BABYLON.Color3.FromHexString(nearest);
  }

  // ============ UTILITIES ============

  function getSettingsForBody(bodyId) {
    // Start with global settings
    const globalVisual = settings.visual;
    const overrides = globalVisual.overrides || {};
    const bodyOverride = overrides[bodyId] || {};

    // Deep merge override onto global
    return deepMerge(structuredClone(globalVisual), bodyOverride);
  }

  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Color utilities
  function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, v };
  }

  function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return { r, g, b };
  }

  return { init };
})();

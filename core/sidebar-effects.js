/**
 * Sidebar Highlight Effects - Configurable visual effects for sidebar items
 * when hovering over corresponding planets
 */

(function() {
  // Default settings
  const defaultSettings = {
    effects: ['underline'], // Active effect types
    underline: {
      style: 'solid',      // solid, dashed, dotted, double, wavy
      color: '#888',
      thickness: '1px',
      offset: '2px'
    },
    color: {
      text: '#fff',
      background: 'transparent'
    },
    bold: {
      weight: 'bold'       // bold, 600, 700, 800, 900
    },
    italic: {
      enabled: true
    },
    font: {
      family: 'inherit',   // inherit, serif, sans-serif, cursive, fantasy, or specific font
      size: 'inherit'      // inherit, 90%, 100%, 110%, 120%, etc
    },
    emoji: {
      prefix: '',          // emoji to add before text
      suffix: '👈'         // emoji to add after text
    },
    animation: {
      type: 'none',        // none, pulse, glow, shake, bounce
      duration: '0.3s'
    }
  };

  let settings = JSON.parse(JSON.stringify(defaultSettings));
  let settingsPanel = null;

  // Load settings from localStorage
  function loadSettings() {
    try {
      const saved = localStorage.getItem('rcx-sidebar-effects');
      if (saved) {
        const parsed = JSON.parse(saved);
        settings = { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load sidebar effect settings', e);
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem('rcx-sidebar-effects', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save sidebar effect settings', e);
    }
    updateStylesheet();
  }

  // Generate CSS for current settings
  function generateCSS() {
    const effects = settings.effects || [];
    let css = '.sidebar li.highlighted {\n';

    if (effects.includes('underline')) {
      const u = settings.underline;
      css += `  text-decoration: underline ${u.style} ${u.color};\n`;
      css += `  text-decoration-thickness: ${u.thickness};\n`;
      css += `  text-underline-offset: ${u.offset};\n`;
    } else {
      css += '  text-decoration: none;\n';
    }

    if (effects.includes('color')) {
      const c = settings.color;
      css += `  color: ${c.text} !important;\n`;
      if (c.background !== 'transparent') {
        css += `  background: ${c.background};\n`;
      }
    }

    if (effects.includes('bold')) {
      css += `  font-weight: ${settings.bold.weight};\n`;
    }

    if (effects.includes('italic')) {
      css += '  font-style: italic;\n';
    }

    if (effects.includes('font')) {
      const f = settings.font;
      if (f.family !== 'inherit') {
        css += `  font-family: ${f.family};\n`;
      }
      if (f.size !== 'inherit') {
        css += `  font-size: ${f.size};\n`;
      }
    }

    if (effects.includes('animation')) {
      const a = settings.animation;
      if (a.type !== 'none') {
        css += `  animation: sidebar-${a.type} ${a.duration} ease-in-out;\n`;
      }
    }

    css += '}\n\n';

    // Emoji pseudo-elements
    if (effects.includes('emoji')) {
      const e = settings.emoji;
      if (e.prefix) {
        css += `.sidebar li.highlighted::before {\n`;
        css += `  content: '${e.prefix} ';\n`;
        css += '}\n';
      }
      if (e.suffix) {
        css += `.sidebar li.highlighted::after {\n`;
        css += `  content: ' ${e.suffix}';\n`;
        css += '}\n';
      }
    }

    // Animation keyframes
    css += `
@keyframes sidebar-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes sidebar-glow {
  0%, 100% { text-shadow: 0 0 0 transparent; }
  50% { text-shadow: 0 0 8px rgba(255,255,255,0.5); }
}
@keyframes sidebar-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
@keyframes sidebar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
`;

    return css;
  }

  // Update the stylesheet
  let styleEl = null;
  function updateStylesheet() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sidebar-effects-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateCSS();
  }

  // Create settings panel UI
  function createSettingsPanel() {
    if (settingsPanel) {
      settingsPanel.remove();
    }

    settingsPanel = document.createElement('div');
    settingsPanel.id = 'sidebar-effects-panel';
    settingsPanel.innerHTML = `
      <div class="sep-header">
        <span>Sidebar Highlight Effects</span>
        <button class="sep-close">×</button>
      </div>
      <div class="sep-body">
        <div class="sep-section">
          <div class="sep-label">Active Effects</div>
          <div class="sep-effects-list" id="sep-active-effects"></div>
          <div class="sep-add-effect">
            <select id="sep-add-select">
              <option value="">+ Add effect...</option>
              <option value="underline">Underline</option>
              <option value="color">Color</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="font">Font</option>
              <option value="emoji">Emoji</option>
              <option value="animation">Animation</option>
            </select>
          </div>
        </div>
        <div id="sep-effect-settings"></div>
      </div>
    `;

    document.body.appendChild(settingsPanel);

    // Event handlers
    settingsPanel.querySelector('.sep-close').addEventListener('click', hidePanel);
    settingsPanel.querySelector('#sep-add-select').addEventListener('change', (e) => {
      if (e.target.value && !settings.effects.includes(e.target.value)) {
        settings.effects.push(e.target.value);
        saveSettings();
        renderActiveEffects();
        renderEffectSettings();
      }
      e.target.value = '';
    });

    renderActiveEffects();
    renderEffectSettings();
  }

  function renderActiveEffects() {
    const container = document.getElementById('sep-active-effects');
    if (!container) return;

    container.innerHTML = settings.effects.map(effect => `
      <div class="sep-effect-tag">
        <span>${effect}</span>
        <button data-effect="${effect}">×</button>
      </div>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const effect = btn.dataset.effect;
        settings.effects = settings.effects.filter(e => e !== effect);
        saveSettings();
        renderActiveEffects();
        renderEffectSettings();
      });
    });
  }

  function renderEffectSettings() {
    const container = document.getElementById('sep-effect-settings');
    if (!container) return;

    let html = '';

    if (settings.effects.includes('underline')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Underline</div>
          <div class="sep-row">
            <label>Style</label>
            <select data-setting="underline.style">
              <option value="solid" ${settings.underline.style === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${settings.underline.style === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${settings.underline.style === 'dotted' ? 'selected' : ''}>Dotted</option>
              <option value="double" ${settings.underline.style === 'double' ? 'selected' : ''}>Double</option>
              <option value="wavy" ${settings.underline.style === 'wavy' ? 'selected' : ''}>Wavy</option>
            </select>
          </div>
          <div class="sep-row">
            <label>Color</label>
            <input type="color" data-setting="underline.color" value="${settings.underline.color}">
          </div>
          <div class="sep-row">
            <label>Thickness</label>
            <select data-setting="underline.thickness">
              <option value="1px" ${settings.underline.thickness === '1px' ? 'selected' : ''}>1px</option>
              <option value="2px" ${settings.underline.thickness === '2px' ? 'selected' : ''}>2px</option>
              <option value="3px" ${settings.underline.thickness === '3px' ? 'selected' : ''}>3px</option>
            </select>
          </div>
        </div>
      `;
    }

    if (settings.effects.includes('color')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Color</div>
          <div class="sep-row">
            <label>Text</label>
            <input type="color" data-setting="color.text" value="${settings.color.text}">
          </div>
          <div class="sep-row">
            <label>Background</label>
            <input type="color" data-setting="color.background" value="${settings.color.background === 'transparent' ? '#000000' : settings.color.background}">
            <label><input type="checkbox" data-setting="color.bgEnabled" ${settings.color.background !== 'transparent' ? 'checked' : ''}> Enable</label>
          </div>
        </div>
      `;
    }

    if (settings.effects.includes('bold')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Bold</div>
          <div class="sep-row">
            <label>Weight</label>
            <select data-setting="bold.weight">
              <option value="bold" ${settings.bold.weight === 'bold' ? 'selected' : ''}>Bold</option>
              <option value="600" ${settings.bold.weight === '600' ? 'selected' : ''}>600</option>
              <option value="700" ${settings.bold.weight === '700' ? 'selected' : ''}>700</option>
              <option value="800" ${settings.bold.weight === '800' ? 'selected' : ''}>800</option>
              <option value="900" ${settings.bold.weight === '900' ? 'selected' : ''}>900</option>
            </select>
          </div>
        </div>
      `;
    }

    if (settings.effects.includes('font')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Font</div>
          <div class="sep-row">
            <label>Family</label>
            <select data-setting="font.family">
              <option value="inherit" ${settings.font.family === 'inherit' ? 'selected' : ''}>Inherit</option>
              <option value="serif" ${settings.font.family === 'serif' ? 'selected' : ''}>Serif</option>
              <option value="sans-serif" ${settings.font.family === 'sans-serif' ? 'selected' : ''}>Sans-serif</option>
              <option value="Georgia, serif" ${settings.font.family === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="'Courier New', monospace" ${settings.font.family === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
              <option value="cursive" ${settings.font.family === 'cursive' ? 'selected' : ''}>Cursive</option>
              <option value="fantasy" ${settings.font.family === 'fantasy' ? 'selected' : ''}>Fantasy</option>
            </select>
          </div>
          <div class="sep-row">
            <label>Size</label>
            <select data-setting="font.size">
              <option value="inherit" ${settings.font.size === 'inherit' ? 'selected' : ''}>Inherit</option>
              <option value="90%" ${settings.font.size === '90%' ? 'selected' : ''}>90%</option>
              <option value="100%" ${settings.font.size === '100%' ? 'selected' : ''}>100%</option>
              <option value="110%" ${settings.font.size === '110%' ? 'selected' : ''}>110%</option>
              <option value="120%" ${settings.font.size === '120%' ? 'selected' : ''}>120%</option>
              <option value="130%" ${settings.font.size === '130%' ? 'selected' : ''}>130%</option>
            </select>
          </div>
        </div>
      `;
    }

    if (settings.effects.includes('emoji')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Emoji</div>
          <div class="sep-row">
            <label>Prefix</label>
            <input type="text" data-setting="emoji.prefix" value="${settings.emoji.prefix}" placeholder="e.g. 👉">
          </div>
          <div class="sep-row">
            <label>Suffix</label>
            <input type="text" data-setting="emoji.suffix" value="${settings.emoji.suffix}" placeholder="e.g. 👈">
          </div>
        </div>
      `;
    }

    if (settings.effects.includes('animation')) {
      html += `
        <div class="sep-section">
          <div class="sep-label">Animation</div>
          <div class="sep-row">
            <label>Type</label>
            <select data-setting="animation.type">
              <option value="none" ${settings.animation.type === 'none' ? 'selected' : ''}>None</option>
              <option value="pulse" ${settings.animation.type === 'pulse' ? 'selected' : ''}>Pulse</option>
              <option value="glow" ${settings.animation.type === 'glow' ? 'selected' : ''}>Glow</option>
              <option value="shake" ${settings.animation.type === 'shake' ? 'selected' : ''}>Shake</option>
              <option value="bounce" ${settings.animation.type === 'bounce' ? 'selected' : ''}>Bounce</option>
            </select>
          </div>
          <div class="sep-row">
            <label>Duration</label>
            <select data-setting="animation.duration">
              <option value="0.2s" ${settings.animation.duration === '0.2s' ? 'selected' : ''}>Fast (0.2s)</option>
              <option value="0.3s" ${settings.animation.duration === '0.3s' ? 'selected' : ''}>Normal (0.3s)</option>
              <option value="0.5s" ${settings.animation.duration === '0.5s' ? 'selected' : ''}>Slow (0.5s)</option>
              <option value="1s" ${settings.animation.duration === '1s' ? 'selected' : ''}>Very Slow (1s)</option>
            </select>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach change handlers
    container.querySelectorAll('[data-setting]').forEach(el => {
      el.addEventListener('change', (e) => {
        const path = e.target.dataset.setting.split('.');
        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

        // Special handling for background enable checkbox
        if (path.join('.') === 'color.bgEnabled') {
          settings.color.background = value ? '#333333' : 'transparent';
        } else {
          // Set nested property
          let obj = settings;
          for (let i = 0; i < path.length - 1; i++) {
            obj = obj[path[i]];
          }
          obj[path[path.length - 1]] = value;
        }

        saveSettings();
        if (path[0] === 'color' && path[1] === 'bgEnabled') {
          renderEffectSettings(); // Re-render to update color picker state
        }
      });

      el.addEventListener('input', (e) => {
        if (e.target.type === 'color' || e.target.type === 'text') {
          const path = e.target.dataset.setting.split('.');
          let obj = settings;
          for (let i = 0; i < path.length - 1; i++) {
            obj = obj[path[i]];
          }
          obj[path[path.length - 1]] = e.target.value;
          saveSettings();
        }
      });
    });
  }

  function showPanel() {
    if (!settingsPanel) {
      createSettingsPanel();
    }
    settingsPanel.classList.add('visible');
  }

  function hidePanel() {
    if (settingsPanel) {
      settingsPanel.classList.remove('visible');
    }
  }

  function togglePanel() {
    if (settingsPanel && settingsPanel.classList.contains('visible')) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  // Initialize
  loadSettings();
  updateStylesheet();

  // Expose API
  window.SidebarEffects = {
    show: showPanel,
    hide: hidePanel,
    toggle: togglePanel,
    getSettings: () => settings,
    setSettings: (s) => { settings = { ...settings, ...s }; saveSettings(); }
  };
})();

// sketch.js - Lifebrush Lite for tour embedding
// Controls:
//   hover: paint cells
//   left click: save layer + new color
//   middle click: evolve all layers
//   right click: reset + new color + new size

let cols, rows;
let resolution;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let layers = [];
let brushColor;
let canvas;
let isInitialized = false;
let isPlaying = false;
let playInterval = null;

// Track mouse position via native events AND postMessage from parent
let trackedMouseX = -1;
let trackedMouseY = -1;
let isMouseOver = false;

// Listen for mouse coordinates from parent page (solves iframe focus issue)
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'mousePosition') {
    trackedMouseX = e.data.x;
    trackedMouseY = e.data.y;
    isMouseOver = e.data.over;
  }
});

class LifeLayer {
  constructor(grid, resolution, color) {
    this.grid = grid.map(arr => arr.slice());
    this.resolution = resolution;
    this.color = color;
  }

  draw() {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        if (this.grid[i][j] == 1) {
          let x = i * this.resolution;
          let y = j * this.resolution;
          fill(this.color);
          noStroke();
          rect(x, y, this.resolution, this.resolution);
        }
      }
    }
  }

  stepForward() {
    let nextGrid = make2DArray(this.grid.length, this.grid[0].length);
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        let state = this.grid[i][j];
        let neighbors = countNeighbors(this.grid, i, j);
        if (state == 0 && neighbors == 3) {
          nextGrid[i][j] = 1;
        } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
          nextGrid[i][j] = 0;
        } else {
          nextGrid[i][j] = state;
        }
      }
    }
    this.grid = nextGrid;
  }
}

function setup() {
  isInitialized = false;
  brushColor = color(random(255), random(255), random(255));
}

function draw() {
  const container = document.getElementById('lifebrush-container');
  if (!isInitialized) {
    const rect = container.getBoundingClientRect();
    canvas = createCanvas(rect.width, rect.height);
    canvas.parent('lifebrush-container');
    canvas.elt.setAttribute('tabindex', '0');

    // Native mouse tracking (works without focus)
    canvas.elt.addEventListener('mousemove', (e) => {
      const rect = canvas.elt.getBoundingClientRect();
      trackedMouseX = e.clientX - rect.left;
      trackedMouseY = e.clientY - rect.top;
      isMouseOver = true;
    });

    canvas.elt.addEventListener('mouseenter', () => {
      isMouseOver = true;
    });

    canvas.elt.addEventListener('mouseleave', () => {
      isMouseOver = false;
      trackedMouseX = -1;
      trackedMouseY = -1;
    });

    canvas.elt.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Prevent middle click scroll
    canvas.elt.addEventListener('mousedown', (e) => {
      if (e.button === 1) e.preventDefault();
    });

    initializeSimulation(randomResolution());
    isInitialized = true;
  }

  background(0);

  // Draw saved layers
  for (let layer of layers) {
    layer.draw();
  }

  // Draw current grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * resolution;
      let y = j * resolution;
      if (grid[i][j] == 1) {
        fill(brushColor);
        stroke(0);
        rect(x, y, resolution, resolution);
      }
    }
  }

  // Hover-draw: paint using tracked mouse position (works without focus)
  if (isMouseOver && trackedMouseX >= 0 && trackedMouseY >= 0) {
    let touchCol = floor(trackedMouseX / resolution);
    let touchRow = floor(trackedMouseY / resolution);
    if (touchCol >= 0 && touchCol < cols && touchRow >= 0 && touchRow < rows) {
      if (grid[touchCol][touchRow] == 0) {
        grid[touchCol][touchRow] = 1;
        activatedCount++;
      }
    }
  }

  // Auto-evolve after threshold
  if (activatedCount >= activationThreshold) {
    applyGameOfLifeRules();
    activatedCount = 0;
  }
}

function mousePressed() {
  if (mouseButton === CENTER) {
    // Middle click: progress all layers one generation
    progressLayers();
    return false;
  } else if (mouseButton === LEFT) {
    // Left click: save layer + new layer
    saveStateToLayers();
    randomizeBrushColor();
    initializeSimulation(randomResolution());
  } else if (mouseButton === RIGHT) {
    // Right click: reset + new color + new size (like full version)
    randomizeBrushColor();
    initializeSimulation(randomResolution());
    return false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    saveCanvas('lifebrush', 'png');
  } else if (keyCode === UP_ARROW) {
    progressLayers();
  }
}

// ========== BUTTON CONTROL FUNCTIONS ==========
// Called from HTML buttons

function doForward() {
  progressLayers();
}

function doPlay() {
  if (isPlaying) {
    // Stop
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    isPlaying = false;
    updatePlayButton(false);
  } else {
    // Start auto-evolving
    isPlaying = true;
    updatePlayButton(true);
    playInterval = setInterval(() => {
      progressLayers();
    }, 300);
  }
}

function doReset() {
  // Stop playing if active
  if (isPlaying) {
    doPlay();
  }
  // Clear everything
  layers = [];
  randomizeBrushColor();
  initializeSimulation(randomResolution());
}

function doSave() {
  saveCanvas('lifebrush', 'png');
}

function updatePlayButton(playing) {
  const btn = document.getElementById('btn-play');
  if (btn) {
    btn.textContent = playing ? 'stop' : 'play';
  }
}

// Expose functions globally for HTML buttons
window.doForward = doForward;
window.doPlay = doPlay;
window.doReset = doReset;
window.doSave = doSave;

function windowResized() {
  const container = document.getElementById('lifebrush-container');
  if (isInitialized) {
    const rect = container.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
  }
}

function saveStateToLayers() {
  if (hasContent()) {
    let newLayer = new LifeLayer(grid, resolution, brushColor);
    layers.push(newLayer);
  }
}

function hasContent() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) return true;
    }
  }
  return false;
}

function randomizeBrushColor() {
  brushColor = color(random(255), random(255), random(255));
}

function progressLayers() {
  for (let layer of layers) {
    layer.stepForward();
  }
}

function randomResolution() {
  return floor(random(8, 33));
}

function initializeSimulation(res) {
  resolution = res;
  cols = floor(width / resolution);
  rows = floor(height / resolution);

  grid = make2DArray(cols, rows);
  next = make2DArray(cols, rows);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }
}

function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

function countNeighbors(grid, x, y) {
  let sum = 0;
  let cols = grid.length;
  let rows = grid[0].length;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      let col = (x + i + cols) % cols;
      let row = (y + j + rows) % rows;
      sum += grid[col][row];
    }
  }
  sum -= grid[x][y];
  return sum;
}

function applyGameOfLifeRules() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      let neighbors = countNeighbors(grid, i, j);

      if (state == 0 && neighbors == 3) {
        next[i][j] = 1;
      } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
        next[i][j] = 0;
      } else {
        next[i][j] = state;
      }
    }
  }

  let temp = grid;
  grid = next;
  next = temp;
}

// sketch.js - Lifebrush with immediate hover-draw
// Using p5.js built-in mouseX/mouseY (no custom tracking needed)

let cols, rows;
let resolution;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let layers = [];
let brushColor;
let isMobile;
let bottomBarHeight = 80;
let canvas;
let isInitialized = false;

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
  // Create canvas immediately in setup() - critical for p5.js global mode
  isMobile = /Mobi|Android/i.test(navigator.userAgent);

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('lifebrush-container');

  // Prevent touch scrolling on mobile
  canvas.elt.style.touchAction = 'none';

  // Prevent context menu on right-click
  canvas.elt.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent middle-click default behavior
  canvas.elt.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault();
  });

  if (isMobile) {
    canvas.elt.addEventListener('touchstart', preventDefaultTouch, {passive: false});
    canvas.elt.addEventListener('touchmove', preventDefaultTouch, {passive: false});
    canvas.elt.addEventListener('touchend', preventDefaultTouch, {passive: false});
  }

  brushColor = color(random(255), random(255), random(255));
  initializeSimulation(randomResolution());
  isInitialized = true;
}

function draw() {
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

  // Mobile bottom bar
  if (isMobile) {
    fill(brushColor);
    noStroke();
    rect(0, height - bottomBarHeight, width, bottomBarHeight);
  }

  // Hover-draw: check if mouse is over canvas using p5's built-in mouseX/mouseY
  let overCanvas = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

  if (overCanvas) {
    if (!isMobile || mouseY < height - bottomBarHeight) {
      let touchCol = floor(mouseX / resolution);
      let touchRow = floor(mouseY / resolution);
      if (touchCol >= 0 && touchCol < cols && touchRow >= 0 && touchRow < rows) {
        if (grid[touchCol][touchRow] == 0) {
          grid[touchCol][touchRow] = 1;
          activatedCount++;
        }
      }
    }
  }

  // Touch fallback for mobile
  if (isMobile && touches.length > 0) {
    let touchPos = getTouchPos();
    if (touchPos.y < height - bottomBarHeight) {
      let touchCol = floor(touchPos.x / resolution);
      let touchRow = floor(touchPos.y / resolution);
      if (touchCol >= 0 && touchCol < cols && touchRow >= 0 && touchRow < rows) {
        if (grid[touchCol][touchRow] == 0) {
          grid[touchCol][touchRow] = 1;
          activatedCount++;
        }
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
  if (!isMobile || mouseY < height - bottomBarHeight) {
    if (mouseButton === CENTER) {
      // Middle click: progress layers
      progressLayers();
      return false;
    } else if (mouseButton === LEFT) {
      // Left click: save layer + new size (same color)
      saveStateToLayers();
      initializeSimulation(randomResolution());
    } else if (mouseButton === RIGHT) {
      // Right click: full reset (new color + new size)
      randomizeBrushColor();
      initializeSimulation(randomResolution());
      return false;
    }
  } else {
    randomizeBrushColor();
    initializeSimulation(randomResolution());
  }
}

function touchStarted() {
  if (touches.length > 0) {
    if (!isMobile || touches[0].y < height - bottomBarHeight) {
      let touchCount = touches.length;
      if (touchCount === 1) {
        saveStateToLayers();
        initializeSimulation(randomResolution());
      } else if (touchCount === 2) {
        randomizeBrushColor();
        initializeSimulation(randomResolution());
      }
    } else {
      randomizeBrushColor();
      initializeSimulation(randomResolution());
    }
    return false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    saveCanvas('canvas', 'png');
  } else if (keyCode === DELETE || keyCode === BACKSPACE) {
    fullReset();
  } else if (keyCode === 32) {
    randomizeBrushColor();
    initializeSimulation(randomResolution());
  } else if (keyCode === UP_ARROW) {
    progressLayers();
  }
}

function windowResized() {
  if (isInitialized) {
    resizeCanvas(windowWidth, windowHeight);
    // Reinitialize grid with new dimensions (preserve layers but reset current grid)
    initializeSimulation(resolution);
  }
}

function preventDefaultTouch(event) {
  event.preventDefault();
}

function getTouchPos() {
  if (touches.length > 0) {
    return { x: touches[0].x, y: touches[0].y };
  }
  return { x: mouseX, y: mouseY };
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

function fullReset() {
  layers = [];
  randomizeBrushColor();
  initializeSimulation(randomResolution());
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

// sketch.js
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
  isInitialized = false;
  isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (!window.savedBrushColor) {
    window.savedBrushColor = color(random(255), random(255), random(255));
  }
  brushColor = window.savedBrushColor;
}

function draw() {
  const container = document.getElementById('lifebrush-container');
  if (container.style.display !== 'none' && !isInitialized) {
    const rect = container.getBoundingClientRect();
    if (!window.persistentCanvas) {
      canvas = createCanvas(rect.width, rect.height);
      window.persistentCanvas = canvas;
      canvas.parent('lifebrush-container');
      
      canvas.elt.setAttribute('tabindex', '0');
      
      canvas.elt.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      if (isMobile) {
        canvas.elt.addEventListener('touchstart', preventDefaultTouch, {passive: false});
        canvas.elt.addEventListener('touchmove', preventDefaultTouch, {passive: false});
        canvas.elt.addEventListener('touchend', preventDefaultTouch, {passive: false});
      }

      if (!window.persistentGrid) {
        initializeSimulation(randomResolution());
      } else {
        grid = window.persistentGrid;
        next = make2DArray(grid.length, grid[0].length);
        resolution = window.savedResolution;
        cols = grid.length;
        rows = grid[0].length;
        layers = window.savedLayers || [];
      }
    } else {
      canvas = window.persistentCanvas;
      grid = window.persistentGrid;
      layers = window.savedLayers || [];
      resolution = window.savedResolution;
      brushColor = window.savedBrushColor;
      resizeCanvas(rect.width, rect.height);
    }
    
    isInitialized = true;
    window.isLifebrushInitialized = true;
    canvas.elt.focus();
  }

  if (!isInitialized) return;

  background(0);

  for (let layer of layers) {
    layer.draw();
  }

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

  if (isMobile) {
    fill(brushColor);
    noStroke();
    rect(0, height - bottomBarHeight, width, bottomBarHeight);
  }
  
  if (!isMobile || mouseY < height - bottomBarHeight) {
    let touchPos = getTouchPos();
    let touchCol = floor(touchPos.x / resolution);
    let touchRow = floor(touchPos.y / resolution);
    if (touchCol >= 0 && touchCol < cols && touchRow >= 0 && touchRow < rows) {
      if (grid[touchCol][touchRow] == 0) {
        grid[touchCol][touchRow] = 1;
        activatedCount++;
      }
    }
  }
  
  if (activatedCount >= activationThreshold) {
    applyGameOfLifeRules();
    activatedCount = 0;
  }
}

function mousePressed() {
  if (!isMobile || mouseY < height - bottomBarHeight) {
    if (mouseButton === LEFT) {
      saveStateToLayers();
      initializeSimulation(randomResolution());
      canvas.elt.focus();
    } else if (mouseButton === RIGHT) {
      randomizeBrushColor();
      initializeSimulation(randomResolution());
      canvas.elt.focus();
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
  const container = document.getElementById('lifebrush-container');
  if (container.style.display !== 'none' && isInitialized) {
    const rect = container.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
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
  let newLayer = new LifeLayer(grid, resolution, brushColor);
  layers.push(newLayer);
  window.persistentGrid = grid.map(arr => arr.slice());
  window.savedResolution = resolution;
  window.savedLayers = layers;
  window.savedBrushColor = brushColor;
}

function randomizeBrushColor() {
  brushColor = color(random(255), random(255), random(255));
  window.savedBrushColor = brushColor;
}

function fullReset() {
  window.persistentCanvas = null;
  window.persistentGrid = null;
  window.savedResolution = null;
  window.savedLayers = null;
  window.savedBrushColor = null;
  window.isLifebrushInitialized = false;
  layers = [];
  background(0);
  setup();
  initializeSimulation(randomResolution());
}

function resetCanvas() {
  layers = window.savedLayers || [];
  window.persistentGrid = null;
  window.savedResolution = null;
  window.savedLayers = [];
  background(0);
}

function progressLayers() {
  for (let layer of layers) {
    layer.stepForward();
  }
  window.savedLayers = layers;
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

  window.savedResolution = resolution;
  window.persistentGrid = grid;
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
  window.persistentGrid = grid;
}

window.resetCanvas = resetCanvas;
window.isLifebrushInitialized = false;
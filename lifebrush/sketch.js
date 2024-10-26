let cols, rows;
let resolution;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let layers = []; // List of LifeLayer objects
let brushColor;
let isMobile;
let bottomBarHeight = 80;

class LifeLayer {
  constructor(grid, resolution, color) {
    this.grid = grid.map(arr => arr.slice()); // Deep copy the grid
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
  const container = document.getElementById('lifebrush-container');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('lifebrush-container');

  isMobile = /Mobi|Android/i.test(navigator.userAgent);
  initializeSimulation(randomResolution());
  brushColor = color(random(255), random(255), random(255));
  
  // Prevent default behaviors
  canvas.elt.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.elt.addEventListener('wheel', (e) => e.preventDefault());
  
  // Prevent keyboard events from affecting the page
  window.addEventListener('keydown', (e) => {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1 && 
        document.getElementById('lifebrush-container').style.display === 'block') {
      e.preventDefault();
    }
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (document.getElementById('lifebrush-container').style.display === 'block') {
      resizeCanvas(container.offsetWidth, container.offsetHeight);
      initializeSimulation(resolution); // Keep same resolution but update grid size
    }
  });

  // Prevent default touch behavior for mobile
  if (isMobile) {
    canvas.addEventListener('touchstart', preventDefaultTouch, {passive: false});
    canvas.addEventListener('touchmove', preventDefaultTouch, {passive: false});
    canvas.addEventListener('touchend', preventDefaultTouch, {passive: false});
  }
}

function draw() {
  background(0);

  // Draw all background layers
  for (let layer of layers) {
    layer.draw();
  }

  // Draw the grid
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

  // Draw the bottom bar for mobile
  if (isMobile) {
    fill(brushColor);
    noStroke();
    rect(0, height - bottomBarHeight, width, bottomBarHeight);
  }
  
  // Turn on squares under the mouse or touch
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
  
  // Progress the simulation based on activation threshold
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
    } else if (mouseButton === RIGHT) {
      randomizeBrushColor();
      initializeSimulation(randomResolution());
      return false; // Prevent default context menu
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
    return false; // Prevent default touch behavior
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    saveCanvas('canvas', 'png');
  } else if (keyCode === DELETE || keyCode === BACKSPACE) {
    resetCanvas();
  } else if (keyCode === 32) { // Spacebar
    randomizeBrushColor();
    initializeSimulation(randomResolution());
  } else if (keyCode === UP_ARROW) {
    progressLayers();
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
  layers.push(newLayer); // Add the new layer to the list
}

function randomizeBrushColor() {
  brushColor = color(random(255), random(255), random(255));
}

function resetCanvas() {
  layers = []; // Clear all background layers
  background(0);
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

  // Initialize grid with all cells dead
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }
}

function applyGameOfLifeRules() {
  // Apply Game of Life rules
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
  
  // Swap grids
  let temp = grid;
  grid = next;
  next = temp;
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

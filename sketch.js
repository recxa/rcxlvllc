let cols, rows;
let resolution;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let backgroundLayer;
let brushColor;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeSimulation(randomResolution());
  backgroundLayer = createGraphics(windowWidth, windowHeight);
  backgroundLayer.background(0);
  brushColor = color(random(255), random(255), random(255));
  
  // Prevent the context menu from appearing
  canvas.oncontextmenu = () => false;
}

function draw() {
  background(0);
  image(backgroundLayer, 0, 0);

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
  
  // Turn on squares under the mouse
  let mouseCol = floor(mouseX / resolution);
  let mouseRow = floor(mouseY / resolution);
  if (mouseCol >= 0 && mouseCol < cols && mouseRow >= 0 && mouseRow < rows) {
    if (grid[mouseCol][mouseRow] == 0) {
      grid[mouseCol][mouseRow] = 1;
      activatedCount++;
    }
  }
  
  // Progress the simulation based on activation threshold
  if (activatedCount >= activationThreshold) {
    applyGameOfLifeRules();
    activatedCount = 0;
  }
}

function mousePressed() {
  if (mouseButton === LEFT) {
    // Save current simulation state to background layer
    backgroundLayer.noStroke();
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (grid[i][j] == 1) {
          let x = i * resolution;
          let y = j * resolution;
          backgroundLayer.fill(brushColor);
          backgroundLayer.rect(x, y, resolution, resolution);
        }
      }
    }

    // Reset simulation with a new randomized resolution
    initializeSimulation(randomResolution());
  } else if (mouseButton === RIGHT) {
    // Randomize the brush color and reset the foreground
    brushColor = color(random(255), random(255), random(255));
    initializeSimulation(randomResolution());
    return false; // Prevent default context menu
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

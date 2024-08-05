let cols, rows;
let resolution = 10;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let layers = [];
let brushColor;
let isMobile;
let bottomBarHeight = 80;
let socket;
let myBrushColor;
let viewport = { x: 0, y: 0, cols: 0, rows: 0 };

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
          let x = (i + viewport.x) * this.resolution;
          let y = (j + viewport.y) * this.resolution;
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
        let neighbors = countNeighbors(this.grid, i, j, this.resolution);
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
  createCanvas(windowWidth, windowHeight);
  isMobile = /Mobi|Android/i.test(navigator.userAgent);
  initializeSimulation(randomResolution());

  viewport.cols = floor(width / resolution);
  viewport.rows = floor(height / resolution);

  socket = new WebSocket('ws://localhost:8080');
  socket.onopen = () => {
    console.log('Connected to WebSocket server');
    socket.send(JSON.stringify({ type: 'init', viewport: viewport }));
  };
  socket.onmessage = (event) => handleMessage(event);
  socket.onclose = () => console.log('WebSocket connection closed');

  brushColor = color(255);
  myBrushColor = brushColor;

  canvas.oncontextmenu = () => false;

  if (isMobile) {
    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchend', preventDefaultTouch, { passive: false });
  }
}

function draw() {
  background(0);

  if (!grid || !grid.length) return;

  for (let layer of layers) {
    layer.draw();
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i] && grid[i][j] !== undefined) {
        let x = i * resolution;
        let y = j * resolution;
        if (grid[i][j] == 1) {
          fill(brushColor);
          stroke(0);
          rect(x, y, resolution, resolution);
        }
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
        sendGridUpdate();
      }
    }
  }

  if (activatedCount >= activationThreshold) {
    applyGameOfLifeRules();
    activatedCount = 0;
    sendGridUpdate();
  }
}

function mousePressed() {
  if (!isMobile || mouseY < height - bottomBarHeight) {
    if (mouseButton === LEFT) {
      saveStateToLayers();
      initializeSimulation(randomResolution());
      sendGridUpdate();
    } else if (mouseButton === RIGHT) {
      randomizeBrush();
      initializeSimulation(randomResolution());
      sendGridUpdate();
      return false;
    }
  } else {
    randomizeBrush();
    initializeSimulation(randomResolution());
    sendGridUpdate();
  }
}

function touchStarted() {
  if (touches.length > 0) {
    if (!isMobile || touches[0].y < height - bottomBarHeight) {
      let touchCount = touches.length;
      if (touchCount === 1) {
        saveStateToLayers();
        initializeSimulation(randomResolution());
        sendGridUpdate();
      } else if (touchCount === 2) {
        randomizeBrush();
        initializeSimulation(randomResolution());
        sendGridUpdate();
      }
    } else {
      randomizeBrush();
      initializeSimulation(randomResolution());
      sendGridUpdate();
    }
    return false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    saveCanvas('canvas', 'png');
  } else if (keyCode === DELETE || keyCode === BACKSPACE) {
    resetCanvas();
    sendGridUpdate();
  } else if (keyCode === 32) {
    randomizeBrush();
    initializeSimulation(randomResolution());
    sendGridUpdate();
  } else if (keyCode === UP_ARROW) {
    progressLayers();
    sendGridUpdate();
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
}

function randomizeBrush() {
  resolution = randomResolution();
  brushColor = color(random(255), random(255), random(255));
  myBrushColor = brushColor;
  sendBrushUpdate();
}

function resetCanvas() {
  layers = [];
  background(0);
  grid = make2DArray(cols, rows);
}

function progressLayers() {
  for (let layer of layers) {
    layer.stepForward();
  }
}

function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows).fill(0); // Ensure the arrays are filled with 0s
  }
  return arr;
}

function initializeSimulation(res) {
  resolution = res;
  cols = floor(width / resolution);
  rows = floor(height / resolution);

  grid = make2DArray(cols, rows);
  next = make2DArray(cols, rows);
}

function randomResolution() {
  return floor(random(8, 33));
}

function applyGameOfLifeRules() {
  let nextGrid = make2DArray(cols, rows);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i] && grid[i][j] !== undefined) {
        let state = grid[i][j];
        let neighbors = countNeighbors(grid, i, j);

        if (state == 0 && neighbors == 3) {
          nextGrid[i][j] = 1;
        } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
          nextGrid[i][j] = 0;
        } else {
          nextGrid[i][j] = state;
        }
      }
    }
  }

  grid = nextGrid;
}

function countNeighbors(grid, x, y) {
  let sum = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let col = (x + i + cols) % cols;
      let row = (y + j + rows) % rows;
      if (grid[col] && grid[col][row] !== undefined) {
        sum += grid[col][row];
      }
    }
  }
  sum -= grid[x][y];
  return sum;
}

function handleMessage(event) {
  let data = JSON.parse(event.data);

  if (data.type === 'state') {
    grid = data.grid || make2DArray(viewport.cols, viewport.rows);
    layers = data.layers.map(layer => new LifeLayer(layer.grid, layer.resolution, color(layer.color.r, layer.color.g, layer.color.b)));
    brushColor = color(data.brushColor.r, data.brushColor.g, data.brushColor.b);
    viewport = data.viewport;
    cols = viewport.cols;
    rows = viewport.rows;
  }
}

function sendGridUpdate() {
  let data = {
    type: 'update',
    grid: grid,
    layers: layers.map(layer => ({
      grid: layer.grid,
      resolution: layer.resolution,
      color: { r: red(layer.color), g: green(layer.color), b: blue(layer.color) }
    })),
    brushColor: { r: red(brushColor), g: green(brushColor), b: blue(brushColor) },
    viewport: viewport
  };
  socket.send(JSON.stringify(data));
}

function sendBrushUpdate() {
  let data = {
    type: 'color',
    brushColor: { r: red(myBrushColor), g: green(myBrushColor), b: blue(myBrushColor) }
  };
  socket.send(JSON.stringify(data));
}

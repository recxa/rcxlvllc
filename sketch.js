let cols, rows;
let resolution;
let grid;
let next;
let activatedCount = 0;
let activationThreshold = 20;
let backgroundLayer;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-background');
    initializeSimulation(randomResolution());
    backgroundLayer = createGraphics(windowWidth, windowHeight);
    backgroundLayer.background(0);
}

function draw() {
    background(0);
    image(backgroundLayer, 0, 0);
    
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * resolution;
            let y = j * resolution;
            if (grid[i][j] == 1) {
                fill(255);
                stroke(0);
                rect(x, y, resolution, resolution);
            }
        }
    }
    
    let mouseCol = floor(mouseX / resolution);
    let mouseRow = floor(mouseY / resolution);
    if (mouseCol >= 0 && mouseCol < cols && mouseRow >= 0 && mouseRow < rows) {
        if (grid[mouseCol][mouseRow] == 0) {
            grid[mouseCol][mouseRow] = 1;
            activatedCount++;
        }
    }
    
    if (activatedCount >= activationThreshold) {
        applyGameOfLifeRules();
        activatedCount = 0;
    }
}

function mousePressed() {
    backgroundLayer.noStroke();
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] == 1) {
                let x = i * resolution;
                let y = j * resolution;
                backgroundLayer.fill(255);
                backgroundLayer.rect(x, y, resolution, resolution);
            }
        }
    }
    initializeSimulation(randomResolution());
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

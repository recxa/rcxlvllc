let isDragging = false;
let isResizing = false;
let offsetX, offsetY;

const windowElement = document.getElementById('window1');
const headerElement = windowElement.querySelector('.header');
const resizeHandle = windowElement.querySelector('.resize-handle');

headerElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - windowElement.offsetLeft;
    offsetY = e.clientY - windowElement.offsetTop;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        windowElement.style.left = \`\${e.clientX - offsetX}px\`;
        windowElement.style.top = \`\${e.clientY - offsetY}px\`;
    } else if (isResizing) {
        windowElement.style.width = \`\${e.clientX - windowElement.offsetLeft}px\`;
        windowElement.style.height = \`\${e.clientY - windowElement.offsetTop}px\`;
    }
});

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
});

function setup() {
    createCanvas(windowWidth, windowHeight);
}

function draw() {
    background(220);
    // Add any custom drawing logic here
}

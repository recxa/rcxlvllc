let isDragging = false;
let isResizing = false;
let offsetX, offsetY;

const windowElement = document.getElementById('window1');
const headerElement = windowElement.querySelector('.header');
const resizeHandle = windowElement.querySelector('.resize-handle');

// Function to handle dragging
headerElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - windowElement.offsetLeft;
    offsetY = e.clientY - windowElement.offsetTop;
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
});

function handleDrag(e) {
    if (isDragging) {
        windowElement.style.left = `${e.clientX - offsetX}px`;
        windowElement.style.top = `${e.clientY - offsetY}px`;
    }
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Function to handle resizing
resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    offsetX = e.clientX;
    offsetY = e.clientY;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
});

function handleResize(e) {
    if (isResizing) {
        const width = windowElement.offsetWidth + (e.clientX - offsetX);
        const height = windowElement.offsetHeight + (e.clientY - offsetY);
        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;
        offsetX = e.clientX;
        offsetY = e.clientY;
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
}

function draw() {
    background(220);
    // Add any custom drawing logic here
}

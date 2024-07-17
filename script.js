let isDragging = false;
let isResizing = false;
let resizeDirection = null;
let offsetX, offsetY;

const windowElement = document.getElementById('window1');
const headerElement = windowElement.querySelector('.header');
const resizeHandles = {
    nw: document.createElement('div'),
    ne: document.createElement('div'),
    sw: document.createElement('div'),
    se: document.createElement('div')
};

// Initialize resize handles
for (const [direction, handle] of Object.entries(resizeHandles)) {
    handle.className = `resize-handle resize-${direction}`;
    windowElement.appendChild(handle);
}

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
for (const [direction, handle] of Object.entries(resizeHandles)) {
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeDirection = direction;
        offsetX = e.clientX;
        offsetY = e.clientY;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });
}

function handleResize(e) {
    if (isResizing) {
        const dx = e.clientX - offsetX;
        const dy = e.clientY - offsetY;

        switch (resizeDirection) {
            case 'nw':
                windowElement.style.width = `${windowElement.offsetWidth - dx}px`;
                windowElement.style.height = `${windowElement.offsetHeight - dy}px`;
                windowElement.style.left = `${windowElement.offsetLeft + dx}px`;
                windowElement.style.top = `${windowElement.offsetTop + dy}px`;
                break;
            case 'ne':
                windowElement.style.width = `${windowElement.offsetWidth + dx}px`;
                windowElement.style.height = `${windowElement.offsetHeight - dy}px`;
                windowElement.style.top = `${windowElement.offsetTop + dy}px`;
                break;
            case 'sw':
                windowElement.style.width = `${windowElement.offsetWidth - dx}px`;
                windowElement.style.height = `${windowElement.offsetHeight + dy}px`;
                windowElement.style.left = `${windowElement.offsetLeft + dx}px`;
                break;
            case 'se':
                windowElement.style.width = `${windowElement.offsetWidth + dx}px`;
                windowElement.style.height = `${windowElement.offsetHeight + dy}px`;
                break;
        }

        offsetX = e.clientX;
        offsetY = e.clientY;
    }
}

function stopResize() {
    isResizing = false;
    resizeDirection = null;
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

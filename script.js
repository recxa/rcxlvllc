class Window {
    constructor(id, x, y, width, height, title, minWidth = 100, minHeight = 100, maxWidth = Infinity, maxHeight = Infinity) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.title = title;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        this.initialMouseX = 0;
        this.initialMouseY = 0;
        this.initialWidth = 0;
        this.initialHeight = 0;
        this.initialLeft = 0;
        this.initialTop = 0;

        this.createElements();
        this.addEventListeners();
    }

    createElements() {
        this.element = document.createElement('div');
        this.element.className = 'window';
        this.element.id = this.id;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;

        this.header = document.createElement('div');
        this.header.className = 'header';
        this.element.appendChild(this.header);

        this.bubbleButtons = document.createElement('div');
        this.bubbleButtons.className = 'bubble-buttons';
        this.header.appendChild(this.bubbleButtons);

        this.closeButton = document.createElement('div');
        this.closeButton.className = 'bubble-button close';
        this.bubbleButtons.appendChild(this.closeButton);

        this.minimizeButton = document.createElement('div');
        this.minimizeButton.className = 'bubble-button minimize';
        this.bubbleButtons.appendChild(this.minimizeButton);

        this.maximizeButton = document.createElement('div');
        this.maximizeButton.className = 'bubble-button maximize';
        this.bubbleButtons.appendChild(this.maximizeButton);

        this.titleElement = document.createElement('div');
        this.titleElement.className = 'title';
        this.titleElement.innerText = this.title;
        this.header.appendChild(this.titleElement);

        this.content = document.createElement('div');
        this.content.className = 'content';
        this.element.appendChild(this.content);

        this.resizeHandles = {
            nw: document.createElement('div'),
            ne: document.createElement('div'),
            sw: document.createElement('div'),
            se: document.createElement('div')
        };

        for (const [direction, handle] of Object.entries(this.resizeHandles)) {
            handle.className = `resize-handle resize-${direction}`;
            this.element.appendChild(handle);
        }

        document.body.appendChild(this.element);
    }

    addEventListeners() {
        this.header.addEventListener('mousedown', (e) => this.startDrag(e));
        
        for (const handle of Object.values(this.resizeHandles)) {
            handle.addEventListener('mousedown', (e) => this.startResize(e));
        }

        document.addEventListener('mouseup', () => this.stopActions());
    }

    startDrag(e) {
        e.preventDefault(); // Prevent text selection
        this.isDragging = true;
        this.initialMouseX = e.clientX;
        this.initialMouseY = e.clientY;
        this.initialLeft = this.element.offsetLeft;
        this.initialTop = this.element.offsetTop;
        document.addEventListener('mousemove', this.handleDrag.bind(this));
    }

    handleDrag(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.initialMouseX;
            const dy = e.clientY - this.initialMouseY;
            this.element.style.left = `${this.initialLeft + dx}px`;
            this.element.style.top = `${this.initialTop + dy}px`;
        }
    }

    startResize(e) {
        e.preventDefault(); // Prevent text selection
        this.isResizing = true;
        this.resizeDirection = e.target.className.split(' ')[1].split('-')[1];
        this.initialMouseX = e.clientX;
        this.initialMouseY = e.clientY;
        this.initialWidth = this.element.offsetWidth;
        this.initialHeight = this.element.offsetHeight;
        this.initialLeft = this.element.offsetLeft;
        this.initialTop = this.element.offsetTop;
        document.addEventListener('mousemove', this.handleResize.bind(this));
    }

    handleResize(e) {
        if (this.isResizing) {
            const dx = e.clientX - this.initialMouseX;
            const dy = e.clientY - this.initialMouseY;

            let newWidth, newHeight, newLeft, newTop;

            switch (this.resizeDirection) {
                case 'nw':
                    newWidth = this.initialWidth - dx;
                    newHeight = this.initialHeight - dy;
                    newLeft = this.initialLeft + dx;
                    newTop = this.initialTop + dy;
                    break;
                case 'ne':
                    newWidth = this.initialWidth + dx;
                    newHeight = this.initialHeight - dy;
                    newTop = this.initialTop + dy;
                    break;
                case 'sw':
                    newWidth = this.initialWidth - dx;
                    newHeight = this.initialHeight + dy;
                    newLeft = this.initialLeft + dx;
                    break;
                case 'se':
                    newWidth = this.initialWidth + dx;
                    newHeight = this.initialHeight + dy;
                    break;
            }

            // Apply minimum and maximum constraints
            newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
            newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, newHeight));
            newLeft = newLeft !== undefined ? Math.min(this.initialLeft + this.initialWidth - this.minWidth, newLeft) : undefined;
            newTop = newTop !== undefined ? Math.min(this.initialTop + this.initialHeight - this.minHeight, newTop) : undefined;

            if (newWidth !== undefined) this.element.style.width = `${newWidth}px`;
            if (newHeight !== undefined) this.element.style.height = `${newHeight}px`;
            if (newLeft !== undefined) this.element.style.left = `${newLeft}px`;
            if (newTop !== undefined) this.element.style.top = `${newTop}px`;
        }
    }

    stopActions() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mousemove', this.handleResize.bind(this));
    }

    setContent(htmlContent) {
        this.content.innerHTML = htmlContent;
    }
}

// Create instances of the Window class
const window1 = new Window('window1', 50, 50, 300, 200, 'Window 1');
window1.setContent('<p>This is the content of window 1.</p>');

const window2 = new Window('window2', 400, 100, 350, 250, 'Window 2', 200, 150, 500, 400);
window2.setContent('<p>This is the content of window 2.</p>');

// You can create more windows as needed

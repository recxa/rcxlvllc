class Window {
    constructor(id, x, y, width, height, title) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.title = title;
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
        this.header.innerText = this.title;
        this.element.appendChild(this.header);

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

            switch (this.resizeDirection) {
                case 'nw':
                    this.element.style.width = `${this.initialWidth - dx}px`;
                    this.element.style.height = `${this.initialHeight - dy}px`;
                    this.element.style.left = `${this.initialLeft + dx}px`;
                    this.element.style.top = `${this.initialTop + dy}px`;
                    break;
                case 'ne':
                    this.element.style.width = `${this.initialWidth + dx}px`;
                    this.element.style.height = `${this.initialHeight - dy}px`;
                    this.element.style.top = `${this.initialTop + dy}px`;
                    break;
                case 'sw':
                    this.element.style.width = `${this.initialWidth - dx}px`;
                    this.element.style.height = `${this.initialHeight + dy}px`;
                    this.element.style.left = `${this.initialLeft + dx}px`;
                    break;
                case 'se':
                    this.element.style.width = `${this.initialWidth + dx}px`;
                    this.element.style.height = `${this.initialHeight + dy}px`;
                    break;
            }
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

const window2 = new Window('window2', 400, 100, 350, 250, 'Window 2');
window2.setContent('<p>This is the content of window 2.</p>');

// You can create more windows as needed

/**
 * UI.js - Version 5.0 "Enterprise"
 * Full-featured Property Panel, Dark Mode, and Canvas Presets
 */

export class UI {
    constructor(engine) {
        this.engine = engine;
        this.isDarkMode = false;
        this.init();
    }

    init() {
        this.setupAssetLibrary();
        this.setupPropertyPanel();
        this.setupCanvasEvents();
        this.setupToolbar();
        this.setupPresets();
    }

    setupAssetLibrary() {
        const shapeContainer = document.getElementById('shape-container');
        const shapes = [
            { id: 'rect', label: 'Rectangle', icon: '⬜' },
            { id: 'circle', label: 'Circle', icon: '◯' },
            { id: 'triangle', label: 'Triangle', icon: '△' },
            { id: 'star', label: 'Star', icon: '⭐' },
            { id: 'text', label: 'Text', icon: 'T' },
        ];
        shapes.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'flex items-center p-3 hover:bg-gray-100 rounded-lg transition-all w-full text-left gap-3 text-gray-700';
            btn.innerHTML = `<span>${s.icon}</span> <span class="text-sm font-medium">${s.label}</span>`;
            btn.onclick = () => this.engine.addObject({ type: s.id, text: s.id === 'text' ? 'New Text' : '' });
            shapeContainer.appendChild(btn);
        });

        document.getElementById('upload-image').onclick = () => document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgObj = this.engine.addObject({ type: 'image', imageSource: event.target.result, width: 200, height: 200 });
                    const img = new Image(); img.src = event.target.result;
                    img.onload = () => { imgObj._imgElement = img; };
                };
                reader.readAsDataURL(file);
            }
        };

        const templateContainer = document.getElementById('template-container');
        const templates = ['socialPost', 'businessCard', 'modernSlide', 'marketingFlyer'];
        templates.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded mb-2 w-full transition-all text-gray-600 font-medium';
            btn.innerText = t.replace(/([A-Z])/g, ' $1').trim();
            btn.onclick = () => window.loadTemplate(t);
            templateContainer.appendChild(btn);
        });
    }

    setupPropertyPanel() {
        this.updatePropertyPanel();
    }

    updatePropertyPanel() {
        const selectedId = Array.from(this.engine.selectedIds)[0];
        const obj = this.engine.sceneGraph.find(o => o.id === selectedId);
        
        const controls = {
            x: document.getElementById('prop-x'),
            y: document.getElementById('prop-y'),
            w: document.getElementById('prop-w'),
            h: document.getElementById('prop-h'),
            color: document.getElementById('prop-color'),
            opacity: document.getElementById('prop-opacity'),
            text: document.getElementById('prop-text-input'),
            fontSize: document.getElementById('prop-font-size'),
            fontFamily: document.getElementById('prop-font-family'),
            textAlign: document.getElementById('prop-text-align'),
            grad: document.getElementById('prop-gradient')
        };

        const general = document.getElementById('general-controls');
        const text = document.getElementById('text-controls');

        if (obj) {
            general.classList.remove('hidden');
            controls.x.value = Math.round(obj.x);
            controls.y.value = Math.round(obj.y);
            controls.w.value = Math.round(obj.width);
            controls.h.value = Math.round(obj.height);
            controls.color.value = obj.color;
            controls.opacity.value = obj.opacity;
            controls.grad.value = obj.gradient ? 'linear' : 'none';
            
            if (obj.type === 'text') {
                text.classList.remove('hidden');
                controls.text.value = obj.text;
                controls.fontSize.value = obj.fontSize;
                controls.fontFamily.value = obj.fontFamily;
                controls.textAlign.value = obj.textAlign;
            } else {
                text.classList.add('hidden');
            }
        } else {
            general.classList.add('hidden');
            text.classList.add('hidden');
        }
    }

    bindPropertyEvents() {
        const controls = {
            x: document.getElementById('prop-x'), y: document.getElementById('prop-y'),
            w: document.getElementById('prop-w'), h: document.getElementById('prop-h'),
            color: document.getElementById('prop-color'), opacity: document.getElementById('prop-opacity'),
            text: document.getElementById('prop-text-input'), fontSize: document.getElementById('prop-font-size'),
            fontFamily: document.getElementById('prop-font-family'), textAlign: document.getElementById('prop-text-align'),
            grad: document.getElementById('prop-gradient')
        };

        const update = (prop, val) => {
            this.engine.selectedIds.forEach(id => this.engine.updateObject(id, { [prop]: val }));
            this.engine.saveState();
        };

        controls.x.oninput = (e) => update('x', parseInt(e.target.value));
        controls.y.oninput = (e) => update('y', parseInt(e.target.value));
        controls.w.oninput = (e) => update('width', parseInt(e.target.value));
        controls.h.oninput = (e) => update('height', parseInt(e.target.value));
        controls.color.oninput = (e) => update('color', e.target.value);
        controls.opacity.oninput = (e) => update('opacity', parseFloat(e.target.value));
        controls.text.oninput = (e) => update('text', e.target.value);
        controls.fontSize.oninput = (e) => update('fontSize', parseInt(e.target.value));
        controls.fontFamily.onchange = (e) => update('fontFamily', e.target.value);
        controls.textAlign.onchange = (e) => update('textAlign', e.target.value);
        controls.grad.onchange = (e) => {
            const val = e.target.value === 'linear' ? { type: 'linear', colors: ['#3b82f6', '#93c5fd'] } : null;
            update('gradient', val);
        };
    }

    setupCanvasEvents() {
        const canvas = this.engine.canvas;
        canvas.onmousedown = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.engine.handleMouseDown(e.clientX - rect.left, e.clientY - rect.top, e.shiftKey);
        };
        window.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            this.engine.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
        };
        window.onmouseup = () => this.engine.handleMouseUp();
        canvas.onwheel = (e) => {
            e.preventDefault();
            this.engine.zoom *= (e.deltaY > 0 ? 0.9 : 1.1);
            this.engine.zoom = Math.max(0.1, Math.min(5, this.engine.zoom));
        };
    }

    setupToolbar() {
        document.getElementById('export-btn').onclick = () => this.engine.exportToPNG();
        document.getElementById('undo-btn').onclick = () => this.engine.undo();
        document.getElementById('redo-btn').onclick = () => this.engine.redo();
        document.getElementById('group-btn').onclick = () => this.engine.groupSelected();
        document.getElementById('ungroup-btn').onclick = () => this.engine.ungroupSelected();
        document.getElementById('save-btn').onclick = () => this.engine.exportJSON();
        document.getElementById('load-btn').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (ev) => this.engine.importJSON(ev.target.result);
                reader.readAsText(file);
            };
            input.click();
        };
        document.getElementById('dark-mode').onclick = () => {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('dark-theme');
        };
        document.getElementById('snap-grid').onclick = (e) => {
            this.engine.snapToGrid = e.target.checked;
        };
    }

    setupPresets() {
        const presets = {
            'Instagram': [1080, 1080],
            'YouTube': [1920, 1080],
            'A4': [595, 842],
            'BusinessCard': [1050, 600]
        };
        const container = document.getElementById('preset-container');
        Object.entries(presets).forEach(([name, size]) => {
            const btn = document.createElement('button');
            btn.className = 'p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded mb-1 w-full text-left px-3 text-gray-600';
            btn.innerText = `${name} (${size[0]}x${size[1]})`;
            btn.onclick = () => {
                this.engine.virtualWidth = size[0];
                this.engine.virtualHeight = size[1];
            };
            container.appendChild(btn);
        });
    }
}

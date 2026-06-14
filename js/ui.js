/**
 * UI.js - Version 2.0
 * Enhanced UI with alignment tools, history controls, and multi-selection
 */

export class UI {
    constructor(engine) {
        this.engine = engine;
        this.init();
    }

    init() {
        this.setupAssetLibrary();
        this.setupPropertyBar();
        this.setupLayersPanel();
        this.setupCanvasEvents();
        this.setupToolbar();
        this.setupAlignmentTools();
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
            btn.onclick = () => {
                this.engine.addObject({ type: s.id, text: s.id === 'text' ? 'New Text' : '' });
            };
            shapeContainer.appendChild(btn);
        });

        document.getElementById('upload-image').onclick = () => document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgObj = this.engine.addObject({
                        type: 'image',
                        imageSource: event.target.result,
                        width: 200,
                        height: 200
                    });
                    const img = new Image();
                    img.src = event.target.result;
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

    setupPropertyBar() {
        this.updatePropertyBar();
    }

    updatePropertyBar() {
        const selectedId = Array.from(this.engine.selectedIds)[0];
        const obj = this.engine.sceneGraph.find(o => o.id === selectedId);
        
        const controls = {
            color: document.getElementById('prop-color'),
            fontSize: document.getElementById('prop-font-size'),
            fontFamily: document.getElementById('prop-font-family'),
            textAlign: document.getElementById('prop-text-align'),
            textInput: document.getElementById('prop-text-input'),
            opacity: document.getElementById('prop-opacity')
        };

        const textControls = document.getElementById('text-controls');
        const generalControls = document.getElementById('general-controls');

        if (obj) {
            generalControls.classList.remove('hidden');
            controls.color.value = obj.color;
            controls.opacity.value = obj.opacity || 1;
            
            if (obj.type === 'text') {
                textControls.classList.remove('hidden');
                controls.fontSize.value = obj.fontSize;
                controls.fontFamily.value = obj.fontFamily;
                controls.textAlign.value = obj.textAlign;
                controls.textInput.value = obj.text;
            } else {
                textControls.classList.add('hidden');
            }
        } else {
            generalControls.classList.add('hidden');
            textControls.classList.add('hidden');
        }
    }

    bindPropertyEvents() {
        const controls = {
            color: document.getElementById('prop-color'),
            fontSize: document.getElementById('prop-font-size'),
            fontFamily: document.getElementById('prop-font-family'),
            textAlign: document.getElementById('prop-text-align'),
            textInput: document.getElementById('prop-text-input'),
            opacity: document.getElementById('prop-opacity')
        };

        controls.color.oninput = (e) => this.updateSelected('color', e.target.value);
        controls.fontSize.oninput = (e) => this.updateSelected('fontSize', parseInt(e.target.value));
        controls.fontFamily.onchange = (e) => this.updateSelected('fontFamily', e.target.value);
        controls.textAlign.onchange = (e) => this.updateSelected('textAlign', e.target.value);
        controls.textInput.oninput = (e) => this.updateSelected('text', e.target.value);
        controls.opacity.oninput = (e) => this.updateSelected('opacity', parseFloat(e.target.value));
    }

    updateSelected(prop, value) {
        this.engine.selectedIds.forEach(id => {
            this.engine.updateObject(id, { [prop]: value });
        });
        this.engine.saveState();
    }

    setupLayersPanel() {
        this.layersPanel = document.getElementById('layers-list');
    }

    updateLayersPanel() {
        this.layersPanel.innerHTML = '';
        const sorted = [...this.engine.sceneGraph].sort((a, b) => b.zIndex - a.zIndex);
        sorted.forEach(obj => {
            const item = document.createElement('div');
            const isSelected = this.engine.selectedIds.has(obj.id);
            item.className = `flex items-center justify-between p-2 mb-1 rounded cursor-pointer transition-all ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`;
            item.innerHTML = `
                <div class="flex items-center gap-2 text-xs font-medium truncate">
                    <span>${this.getIcon(obj.type)}</span>
                    <span class="truncate">${obj.type} ${obj.text ? ': ' + obj.text.substring(0, 10) : ''}</span>
                </div>
                <div class="flex gap-1">
                    <button class="p-1 hover:bg-gray-200 rounded" onclick="event.stopPropagation(); window.moveLayer('${obj.id}', 'front')">↑</button>
                    <button class="p-1 hover:bg-gray-200 rounded" onclick="event.stopPropagation(); window.moveLayer('${obj.id}', 'back')">↓</button>
                    <button class="p-1 hover:bg-red-100 text-red-500 rounded" onclick="event.stopPropagation(); window.deleteLayer('${obj.id}')">✕</button>
                </div>
            `;
            item.onclick = () => {
                if (!window.event.shiftKey) this.engine.selectedIds.clear();
                this.engine.selectedIds.add(obj.id);
            };
            this.layersPanel.appendChild(item);
        });
    }

    getIcon(type) {
        const icons = { rect: '⬜', circle: '◯', triangle: '△', star: '⭐', text: 'T', image: '🖼️' };
        return icons[type] || '📦';
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
        
        // Zooming
        canvas.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.engine.zoom *= delta;
            this.engine.zoom = Math.max(0.1, Math.min(5, this.engine.zoom));
        };
    }

    setupToolbar() {
        document.getElementById('export-btn').onclick = () => this.engine.exportToPNG();
        document.getElementById('clear-btn').onclick = () => {
            if (confirm('Clear all objects?')) {
                this.engine.sceneGraph = [];
                this.engine.selectedIds.clear();
                this.engine.saveState();
            }
        };
        document.getElementById('undo-btn').onclick = () => this.engine.undo();
        document.getElementById('redo-btn').onclick = () => this.engine.redo();
    }

    setupAlignmentTools() {
        const alignBtns = {
            'align-left': 'left',
            'align-center': 'center',
            'align-right': 'right',
            'align-top': 'top',
            'align-middle': 'middle',
            'align-bottom': 'bottom'
        };
        Object.entries(alignBtns).forEach(([id, type]) => {
            document.getElementById(id).onclick = () => this.engine.alignSelected(type);
        });
    }
}

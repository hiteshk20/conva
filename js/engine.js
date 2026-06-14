/**
 * Engine.js - Version 5.0 "Enterprise"
 * The ultimate rendering engine with Grouping, Gradients, Grid-Snapping, and Virtual Canvas
 */

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sceneGraph = [];
        this.selectedIds = new Set();
        
        // Interaction State
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Viewport & Grid
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        this.gridSize = 20;
        this.snapToGrid = true;
        
        // Canvas Dimensions (Virtual)
        this.virtualWidth = 1200;
        this.virtualHeight = 800;
        
        // History
        this.history = [];
        this.historyIndex = -1;

        this.setupCanvas();
        this.startRenderLoop();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    saveState() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(JSON.stringify(this.sceneGraph));
        if (this.history.length > 100) this.history.shift();
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.sceneGraph = JSON.parse(this.history[this.historyIndex]);
            this.selectedIds.clear();
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.sceneGraph = JSON.parse(this.history[this.historyIndex]);
            this.selectedIds.clear();
            return true;
        }
        return false;
    }

    startRenderLoop() {
        const render = () => {
            this.draw();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    // --- Object Management ---

    addObject(obj) {
        const id = 'obj_' + Date.now() + Math.random().toString(36).substr(2, 9);
        const newObj = {
            id,
            type: 'rect',
            x: 100, y: 100, width: 100, height: 100,
            rotation: 0, color: '#3b82f6', 
            gradient: null, // {type: 'linear', colors: ['#start', '#end']}
            opacity: 1, zIndex: this.sceneGraph.length,
            visible: true, locked: false,
            text: 'New Text', fontSize: 24, fontFamily: 'Arial', textAlign: 'center',
            imageSource: null,
            ...obj
        };
        this.sceneGraph.push(newObj);
        this.saveState();
        return newObj;
    }

    groupSelected() {
        if (this.selectedIds.size < 2) return;
        
        const selected = this.sceneGraph.filter(o => this.selectedIds.has(o.id));
        const minX = Math.min(...selected.map(o => o.x));
        const minY = Math.min(...selected.map(o => o.y));
        const maxX = Math.max(...selected.map(o => o.x + o.width));
        const maxY = Math.max(...selected.map(o => o.y + o.height));
        
        const group = this.addObject({
            type: 'group',
            x: minX, y: minY,
            width: maxX - minX, height: maxY - minY,
            children: selected.map(o => ({...o, x: o.x - minX, y: o.y - minY}))
        });
        
        this.sceneGraph = this.sceneGraph.filter(o => !this.selectedIds.has(o.id));
        this.selectedIds.clear();
        this.selectedIds.add(group.id);
        this.saveState();
    }

    ungroupSelected() {
        const selected = this.sceneGraph.filter(o => this.selectedIds.has(o.id));
        selected.forEach(group => {
            if (group.type === 'group') {
                group.children.forEach(child => {
                    const worldObj = {...child, x: child.x + group.x, y: child.y + group.y};
                    this.sceneGraph.push(worldObj);
                });
                this.sceneGraph = this.sceneGraph.filter(o => o.id !== group.id);
            }
        });
        this.selectedIds.clear();
        this.saveState();
    }

    updateObject(id, props) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) Object.assign(obj, props);
    }

    // --- Rendering ---

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw Virtual Canvas Background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.virtualWidth, this.virtualHeight);

        const sorted = [...this.sceneGraph].sort((a, b) => a.zIndex - b.zIndex);
        sorted.forEach(obj => {
            if (obj.visible) this.drawRecursive(obj);
        });

        this.selectedIds.forEach(id => {
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) this.drawSelectionUI(obj);
        });

        this.ctx.restore();
    }

    drawRecursive(obj) {
        this.ctx.save();
        this.ctx.globalAlpha = obj.opacity;
        
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((obj.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);

        if (obj.type === 'group') {
            obj.children.forEach(child => {
                this.ctx.save();
                this.ctx.translate(obj.x, obj.y); // Simple nested translate
                this.drawRecursive({...child, x: child.x, y: child.y});
                this.ctx.restore();
            });
        } else {
            this.renderPrimitive(obj, centerX, centerY);
        }
        this.ctx.restore();
    }

    renderPrimitive(obj, cx, cy) {
        this.ctx.fillStyle = obj.color;
        
        // Gradient Logic
        if (obj.gradient && obj.gradient.colors) {
            const grad = this.ctx.createLinearGradient(obj.x, obj.y, obj.x, obj.y + obj.height);
            obj.gradient.colors.forEach((c, i) => grad.addColorStop(i / (obj.gradient.colors.length - 1), c));
            this.ctx.fillStyle = grad;
        }

        if (obj.type === 'rect') {
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, Math.abs(obj.width / 2), 0, Math.PI * 2);
            this.ctx.fill();
        } else if (obj.type === 'triangle') {
            this.ctx.beginPath();
            this.ctx.moveTo(cx, obj.y);
            this.ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
            this.ctx.lineTo(obj.x, obj.y + obj.height);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (obj.type === 'star') {
            this.drawStar(cx, cy, 5, obj.width/2, obj.width/4);
        } else if (obj.type === 'text') {
            this.ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
            this.ctx.textAlign = obj.textAlign;
            this.ctx.textBaseline = 'top';
            const tx = obj.textAlign === 'center' ? cx : (obj.textAlign === 'right' ? obj.x + obj.width : obj.x);
            this.ctx.fillText(obj.text, tx, obj.y);
            const m = this.ctx.measureText(obj.text);
            obj.width = m.width; obj.height = obj.fontSize;
        } else if (obj.type === 'image' && obj._imgElement) {
            this.ctx.drawImage(obj._imgElement, obj.x, obj.y, obj.width, obj.height);
        }
    }

    drawStar(cx, cy, spikes, outer, inner) {
        let rot = Math.PI / 2 * 3;
        let x = cx, y = cy, step = Math.PI / spikes;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outer);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outer; y = cy + Math.sin(rot) * outer;
            this.ctx.lineTo(x, y); rot += step;
            x = cx + Math.cos(rot) * inner; y = cy + Math.sin(rot) * inner;
            this.ctx.lineTo(x, y); rot += step;
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawSelectionUI(obj) {
        this.ctx.save();
        const cx = obj.x + obj.width / 2, cy = obj.y + obj.height / 2;
        this.ctx.translate(cx, cy);
        this.ctx.rotate((obj.rotation * Math.PI) / 180);
        this.ctx.translate(-cx, -cy);

        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        const hs = 8;
        const handles = this.getHandlePositions(obj);
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;
        handles.forEach(h => {
            this.ctx.fillRect(h.x - hs/2, h.y - hs/2, hs, hs);
            this.ctx.strokeRect(h.x - hs/2, h.y - hs/2, hs, hs);
        });

        this.ctx.beginPath();
        this.ctx.moveTo(cx, obj.y);
        this.ctx.lineTo(cx, obj.y - 20);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(cx, obj.y - 20, hs/2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    getHandlePositions(obj) {
        return [
            { id: 'tl', x: obj.x, y: obj.y }, { id: 'tm', x: obj.x + obj.width/2, y: obj.y }, { id: 'tr', x: obj.x + obj.width, y: obj.y },
            { id: 'ml', x: obj.x, y: obj.y + obj.height/2 }, { id: 'mr', x: obj.x + obj.width, y: obj.y + obj.height/2 },
            { id: 'bl', x: obj.x, y: obj.y + obj.height }, { id: 'bm', x: obj.x + obj.width/2, y: obj.y + obj.height }, { id: 'br', x: obj.x + obj.width, y: obj.y + obj.height },
        ];
    }

    localPoint(px, py) {
        return { x: (px - this.pan.x) / this.zoom, y: (py - this.pan.y) / this.zoom };
    }

    objectLocalPoint(px, py, obj) {
        const cx = obj.x + obj.width / 2, cy = obj.y + obj.height / 2;
        const angle = -(obj.rotation * Math.PI) / 180;
        const dx = px - cx, dy = py - cy;
        return { x: dx * Math.cos(angle) - dy * Math.sin(angle) + cx, y: dx * Math.sin(angle) + dy * Math.cos(angle) + cy };
    }

    hitTest(px, py) {
        const sorted = [...this.sceneGraph].sort((a, b) => b.zIndex - a.zIndex);
        for (const obj of sorted) {
            if (!obj.visible) continue;
            const lp = this.objectLocalPoint(px, py, obj);
            if (lp.x >= obj.x && lp.x <= obj.x + obj.width && lp.y >= obj.y && lp.y <= obj.y + obj.height) return obj;
        }
        return null;
    }

    handleMouseDown(px, py, isShift) {
        const wp = this.localPoint(px, py);
        if (this.selectedIds.size > 0) {
            for (const id of this.selectedIds) {
                const obj = this.sceneGraph.find(o => o.id === id);
                if (!obj) continue;
                const lp = this.objectLocalPoint(wp.x, wp.y, obj);
                const handles = this.getHandlePositions(obj);
                for (const h of handles) {
                    if (Math.abs(lp.x - h.x) < 10 && Math.abs(lp.y - h.y) < 10) {
                        this.isResizing = true; this.activeHandle = h.id;
                        this.selectedIds.clear(); this.selectedIds.add(id);
                        return;
                    }
                }
                if (Math.abs(lp.x - (obj.x + obj.width/2)) < 10 && Math.abs(lp.y - (obj.y - 20)) < 10) {
                    this.isRotating = true; this.selectedIds.clear(); this.selectedIds.add(id);
                    return;
                }
            }
        }

        const hit = this.hitTest(wp.x, wp.y);
        if (hit) {
            if (!isShift) this.selectedIds.clear();
            this.selectedIds.add(hit.id);
            this.isDragging = true;
            this.dragOffset = { x: wp.x - hit.x, y: wp.y - hit.y };
        } else if (!isShift) {
            this.selectedIds.clear();
        }
    }

    handleMouseMove(px, py) {
        const wp = this.localPoint(px, py);
        if (this.selectedIds.size === 0) return;

        if (this.isDragging) {
            this.selectedIds.forEach(id => {
                const obj = this.sceneGraph.find(o => o.id === id);
                if (obj) {
                    let nx = wp.x - this.dragOffset.x;
                    let ny = wp.y - this.dragOffset.y;
                    if (this.snapToGrid) {
                        nx = Math.round(nx / this.gridSize) * this.gridSize;
                        ny = Math.round(ny / this.gridSize) * this.gridSize;
                    }
                    obj.x = nx; obj.y = ny;
                }
            });
        } else if (this.isResizing) {
            const id = Array.from(this.selectedIds)[0];
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) {
                const lp = this.objectLocalPoint(wp.x, wp.y, obj);
                this.applyResize(lp);
            }
        } else if (this.isRotating) {
            const id = Array.from(this.selectedIds)[0];
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) {
                const cx = obj.x + obj.width/2, cy = obj.y + obj.height/2;
                obj.rotation = (Math.atan2(wp.y - cy, wp.x - cx) * 180 / Math.PI) + 90;
            }
        }
    }

    applyResize(lp) {
        const id = Array.from(this.selectedIds)[0], obj = this.sceneGraph.find(o => o.id === id);
        const { x, y, width: w, height: h } = obj;
        switch(this.activeHandle) {
            case 'br': obj.width = lp.x - x; obj.height = lp.y - y; break;
            case 'bl': obj.width = x + w - lp.x; obj.x = lp.x; obj.height = lp.y - y; break;
            case 'tr': obj.width = lp.x - x; obj.height = y + h - lp.y; obj.y = lp.y; break;
            case 'tl': obj.width = x + w - lp.x; obj.x = lp.x; obj.height = y + h - lp.y; obj.y = lp.y; break;
            case 'tm': obj.height = y + h - lp.y; obj.y = lp.y; break;
            case 'bm': obj.height = lp.y - y; break;
            case 'ml': obj.width = x + w - lp.x; obj.x = lp.x; break;
            case 'mr': obj.width = lp.x - x; break;
        }
        if (obj.width < 10) obj.width = 10; if (obj.height < 10) obj.height = 10;
    }

    handleMouseUp() {
        if (this.isDragging || this.isResizing || this.isRotating) this.saveState();
        this.isDragging = this.isResizing = this.isRotating = false;
        this.activeHandle = null;
    }

    exportToPNG() {
        const prevSelected = new Set(this.selectedIds);
        this.selectedIds.clear();
        this.draw();
        const link = document.createElement('a');
        link.download = 'enterprise-design.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.selectedIds = prevSelected;
    }

    importJSON(json) {
        try {
            const data = JSON.parse(json);
            this.sceneGraph = data;
            this.saveState();
        } catch(e) { alert('Invalid JSON file'); }
    }

    exportJSON() {
        const data = JSON.stringify(this.sceneGraph);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'project.json';
        link.href = url;
        link.click();
    }
}

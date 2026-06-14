/**
 * Engine.js - Version 2.0
 * Enhanced rendering, history management, and advanced transformations
 */

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sceneGraph = [];
        this.selectedIds = new Set(); // Support for multi-select
        
        // State for interaction
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Viewport state
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        
        // History for Undo/Redo
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
        const snapshot = JSON.stringify(this.sceneGraph);
        this.history.push(snapshot);
        if (this.history.length > 50) this.history.shift();
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

    addObject(obj) {
        const id = 'obj_' + Date.now() + Math.random().toString(36).substr(2, 9);
        const newObj = {
            id,
            type: 'rect',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 0,
            color: '#3b82f6',
            text: 'New Text',
            fontSize: 24,
            fontFamily: 'Arial',
            textAlign: 'center',
            imageSource: null,
            zIndex: this.sceneGraph.length,
            visible: true,
            opacity: 1,
            ...obj
        };
        this.sceneGraph.push(newObj);
        this.saveState();
        return newObj;
    }

    removeObjects() {
        if (this.selectedIds.size === 0) return;
        this.sceneGraph = this.sceneGraph.filter(obj => !this.selectedIds.has(obj.id));
        this.selectedIds.clear();
        this.saveState();
    }

    updateObject(id, props) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            Object.assign(obj, props);
        }
    }

    alignSelected(type) {
        if (this.selectedIds.size < 2) return;
        const selected = this.sceneGraph.filter(o => this.selectedIds.has(o.id));
        if (type === 'left') {
            const minX = Math.min(...selected.map(o => o.x));
            selected.forEach(o => o.x = minX);
        } else if (type === 'center') {
            const centerX = selected.reduce((sum, o) => sum + (o.x + o.width/2), 0) / selected.length;
            selected.forEach(o => o.x = centerX - o.width/2);
        } else if (type === 'right') {
            const maxX = Math.max(...selected.map(o => o.x + o.width));
            selected.forEach(o => o.x = maxX - o.width);
        } else if (type === 'top') {
            const minY = Math.min(...selected.map(o => o.y));
            selected.forEach(o => o.y = minY);
        } else if (type === 'middle') {
            const centerY = selected.reduce((sum, o) => sum + (o.y + o.height/2), 0) / selected.length;
            selected.forEach(o => o.y = centerY - o.height/2);
        } else if (type === 'bottom') {
            const maxY = Math.max(...selected.map(o => o.y + o.height));
            selected.forEach(o => o.y = maxY - o.height);
        }
        this.saveState();
    }

    bringToFront(id) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            const maxZ = Math.max(...this.sceneGraph.map(o => o.zIndex), 0);
            obj.zIndex = maxZ + 1;
            this.saveState();
        }
    }

    sendToBack(id) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            const minZ = Math.min(...this.sceneGraph.map(o => o.zIndex), 0);
            obj.zIndex = minZ - 1;
            this.saveState();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.zoom, this.zoom);
        const sortedGraph = [...this.sceneGraph].sort((a, b) => a.zIndex - b.zIndex);
        sortedGraph.forEach(obj => {
            if (!obj.visible) return;
            this.drawObject(obj);
        });
        this.selectedIds.forEach(id => {
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) this.drawSelectionUI(obj);
        });
        this.ctx.restore();
    }

    drawObject(obj) {
        this.ctx.save();
        this.ctx.globalAlpha = obj.opacity || 1;
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((obj.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);
        this.ctx.fillStyle = obj.color;
        this.ctx.strokeStyle = obj.color;
        if (obj.type === 'rect') {
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, Math.abs(obj.width / 2), 0, Math.PI * 2);
            this.ctx.fill();
        } else if (obj.type === 'triangle') {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, obj.y);
            this.ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
            this.ctx.lineTo(obj.x, obj.y + obj.height);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (obj.type === 'star') {
            this.drawStar(centerX, centerY, 5, obj.width/2, obj.width/4);
        } else if (obj.type === 'text') {
            this.ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
            this.ctx.textAlign = obj.textAlign;
            this.ctx.textBaseline = 'top';
            const textX = obj.textAlign === 'center' ? centerX : (obj.textAlign === 'right' ? obj.x + obj.width : obj.x);
            this.ctx.fillText(obj.text, textX, obj.y);
            const metrics = this.ctx.measureText(obj.text);
            obj.width = metrics.width;
            obj.height = obj.fontSize;
        } else if (obj.type === 'image' && obj.imageSource) {
            if (obj._imgElement) {
                this.ctx.drawImage(obj._imgElement, obj.x, obj.y, obj.width, obj.height);
            }
        }
        this.ctx.restore();
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawSelectionUI(obj) {
        this.ctx.save();
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((obj.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        const hs = 8;
        const handles = this.getHandlePositions(obj);
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;
        for (const h of handles) {
            this.ctx.fillRect(h.x - hs/2, h.y - hs/2, hs, hs);
            this.ctx.strokeRect(h.x - hs/2, h.y - hs/2, hs, hs);
        }
        const rotX = centerX;
        const rotY = obj.y - 20;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, obj.y);
        this.ctx.lineTo(rotX, rotY);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(rotX, rotY, hs/2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    getHandlePositions(obj) {
        return [
            { id: 'tl', x: obj.x, y: obj.y },
            { id: 'tm', x: obj.x + obj.width / 2, y: obj.y },
            { id: 'tr', x: obj.x + obj.width, y: obj.y },
            { id: 'ml', x: obj.x, y: obj.y + obj.height / 2 },
            { id: 'mr', x: obj.x + obj.width, y: obj.y + obj.height / 2 },
            { id: 'bl', x: obj.x, y: obj.y + obj.height },
            { id: 'bm', x: obj.x + obj.width / 2, y: obj.y + obj.height },
            { id: 'br', x: obj.x + obj.width, y: obj.y + obj.height },
        ];
    }

    localPoint(px, py) {
        return {
            x: (px - this.pan.x) / this.zoom,
            y: (py - this.pan.y) / this.zoom
        };
    }

    objectLocalPoint(px, py, obj) {
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        const angle = -(obj.rotation * Math.PI) / 180;
        const dx = px - centerX;
        const dy = py - centerY;
        return {
            x: dx * Math.cos(angle) - dy * Math.sin(angle) + centerX,
            y: dx * Math.sin(angle) + dy * Math.cos(angle) + centerY
        };
    }

    hitTest(px, py) {
        const sorted = [...this.sceneGraph].sort((a, b) => b.zIndex - a.zIndex);
        for (const obj of sorted) {
            if (!obj.visible) continue;
            const lp = this.objectLocalPoint(px, py, obj);
            if (lp.x >= obj.x && lp.x <= obj.x + obj.width &&
                lp.y >= obj.y && lp.y <= obj.y + obj.height) {
                return obj;
            }
        }
        return null;
    }

    handleMouseDown(px, py, isShift) {
        const worldPt = this.localPoint(px, py);
        if (this.selectedIds.size > 0) {
            for (const id of this.selectedIds) {
                const obj = this.sceneGraph.find(o => o.id === id);
                if (!obj) continue;
                const lp = this.objectLocalPoint(worldPt.x, worldPt.y, obj);
                const handles = this.getHandlePositions(obj);
                for (const h of handles) {
                    if (Math.abs(lp.x - h.x) < 10 && Math.abs(lp.y - h.y) < 10) {
                        this.isResizing = true;
                        this.activeHandle = h.id;
                        this.selectedIds.clear();
                        this.selectedIds.add(id);
                        return;
                    }
                }
                const rotX = obj.x + obj.width / 2;
                const rotY = obj.y - 20;
                if (Math.abs(lp.x - rotX) < 10 && Math.abs(lp.y - rotY) < 10) {
                    this.isRotating = true;
                    this.selectedIds.clear();
                    this.selectedIds.add(id);
                    return;
                }
            }
        }
        const hit = this.hitTest(worldPt.x, worldPt.y);
        if (hit) {
            if (!isShift) this.selectedIds.clear();
            this.selectedIds.add(hit.id);
            this.isDragging = true;
            this.dragOffset = {
                x: worldPt.x - hit.x,
                y: worldPt.y - hit.y
            };
        } else {
            if (!isShift) this.selectedIds.clear();
        }
    }

    handleMouseMove(px, py) {
        const worldPt = this.localPoint(px, py);
        if (this.selectedIds.size === 0) return;
        if (this.isDragging) {
            this.selectedIds.forEach(id => {
                const obj = this.sceneGraph.find(o => o.id === id);
                if (obj) {
                    obj.x = worldPt.x - this.dragOffset.x;
                    obj.y = worldPt.y - this.dragOffset.y;
                }
            });
        } else if (this.isResizing) {
            const id = Array.from(this.selectedIds)[0];
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) {
                const lp = this.objectLocalPoint(worldPt.x, worldPt.y, obj);
                this.applyResize(lp);
            }
        } else if (this.isRotating) {
            const id = Array.from(this.selectedIds)[0];
            const obj = this.sceneGraph.find(o => o.id === id);
            if (obj) {
                const centerX = obj.x + obj.width / 2;
                const centerY = obj.y + obj.height / 2;
                const angle = Math.atan2(worldPt.y - centerY, worldPt.x - centerX);
                obj.rotation = (angle * 180 / Math.PI) + 90;
            }
        }
    }

    applyResize(lp) {
        const id = Array.from(this.selectedIds)[0];
        const obj = this.sceneGraph.find(o => o.id === id);
        const oldX = obj.x;
        const oldY = obj.y;
        const oldW = obj.width;
        const oldH = obj.height;
        switch(this.activeHandle) {
            case 'br': obj.width = lp.x - oldX; obj.height = lp.y - oldY; break;
            case 'bl': obj.width = oldX + oldW - lp.x; obj.x = lp.x; obj.height = lp.y - oldY; break;
            case 'tr': obj.width = lp.x - oldX; obj.height = oldY + oldH - lp.y; obj.y = lp.y; break;
            case 'tl': obj.width = oldX + oldW - lp.x; obj.x = lp.x; obj.height = oldY + oldH - lp.y; obj.y = lp.y; break;
            case 'tm': obj.height = oldY + oldH - lp.y; obj.y = lp.y; break;
            case 'bm': obj.height = lp.y - oldY; break;
            case 'ml': obj.width = oldX + oldW - lp.x; obj.x = lp.x; break;
            case 'mr': obj.width = lp.x - oldX; break;
        }
        if (obj.width < 10) { obj.width = 10; obj.x = oldX + (this.activeHandle.includes('l') ? 0 : 10); }
        if (obj.height < 10) { obj.height = 10; obj.y = oldY + (this.activeHandle.includes('t') ? 0 : 10); }
    }

    handleMouseUp() {
        if (this.isDragging || this.isResizing || this.isRotating) {
            this.saveState();
        }
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
    }

    exportToPNG() {
        const prevSelected = new Set(this.selectedIds);
        this.selectedIds.clear();
        this.draw();
        const dataUrl = this.canvas.toDataURL('image/png');
        this.selectedIds = prevSelected;
        const link = document.createElement('a');
        link.download = 'design-pro-export.png';
        link.href = dataUrl;
        link.click();
    }
}

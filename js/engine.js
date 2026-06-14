/**
 * Engine.js - The core rendering and mathematics engine
 * Handles Scene Graph, Rendering, and Hit-Testing
 */

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sceneGraph = [];
        this.selectedId = null;
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };

        this.setupCanvas();
        this.startRenderLoop();
    }

    setupCanvas() {
        // Internal resolution for high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
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
            ...obj
        };
        this.sceneGraph.push(newObj);
        return newObj;
    }

    removeObject(id) {
        this.sceneGraph = this.sceneGraph.filter(obj => obj.id !== id);
        if (this.selectedId === id) this.selectedId = null;
    }

    updateObject(id, props) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            Object.assign(obj, props);
        }
    }

    bringToFront(id) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            const maxZ = Math.max(...this.sceneGraph.map(o => o.zIndex), 0);
            obj.zIndex = maxZ + 1;
            this.sortScene();
        }
    }

    sendToBack(id) {
        const obj = this.sceneGraph.find(o => o.id === id);
        if (obj) {
            const minZ = Math.min(...this.sceneGraph.map(o => o.zIndex), 0);
            obj.zIndex = minZ - 1;
            this.sortScene();
        }
    }

    sortScene() {
        this.sceneGraph.sort((a, b) => a.zIndex - b.zIndex);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Sort by zIndex before drawing
        const sortedGraph = [...this.sceneGraph].sort((a, b) => a.zIndex - b.zIndex);

        sortedGraph.forEach(obj => {
            if (!obj.visible) return;
            this.drawObject(obj);
        });

        if (this.selectedId) {
            const obj = this.sceneGraph.find(o => o.id === this.selectedId);
            if (obj) this.drawSelectionUI(obj);
        }
    }

    drawObject(obj) {
        this.ctx.save();
        
        // Move to center of object for rotation
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
        } else if (obj.type === 'text') {
            this.ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
            this.ctx.textAlign = obj.textAlign;
            this.ctx.textBaseline = 'top';
            
            const textX = obj.textAlign === 'center' ? centerX : (obj.textAlign === 'right' ? obj.x + obj.width : obj.x);
            this.ctx.fillText(obj.text, textX, obj.y);
            
            // Update width/height based on text metrics for the bounding box
            const metrics = this.ctx.measureText(obj.text);
            obj.width = metrics.width;
            obj.height = obj.fontSize;
        } else if (obj.type === 'image' && obj.imageSource) {
            const img = new Image();
            img.src = obj.imageSource;
            // Note: In a real high-perf engine, we'd cache the image object.
            // For this clone, we'll handle image loading separately or store the Image object.
            if (obj._imgElement) {
                this.ctx.drawImage(obj._imgElement, obj.x, obj.y, obj.width, obj.height);
            }
        }

        this.ctx.restore();
    }

    drawSelectionUI(obj) {
        this.ctx.save();
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((obj.rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);

        // Bounding Box
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // Handles
        const hs = 6; // handle size
        const handles = this.getHandlePositions(obj);
        
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;

        for (const h of handles) {
            this.ctx.fillRect(h.x - hs/2, h.y - hs/2, hs, hs);
            this.ctx.strokeRect(h.x - hs/2, h.y - hs/2, hs, hs);
        }

        // Rotation handle
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

    // Transformation of a point from Canvas Space to Object Local Space
    localPoint(px, py, obj) {
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
        // Iterate in reverse z-order to pick the top-most object
        const sorted = [...this.sceneGraph].sort((a, b) => b.zIndex - a.zIndex);
        
        for (const obj of sorted) {
            if (!obj.visible) continue;
            const lp = this.localPoint(px, py, obj);
            if (lp.x >= obj.x && lp.x <= obj.x + obj.width &&
                lp.y >= obj.y && lp.y <= obj.y + obj.height) {
                return obj;
            }
        }
        return null;
    }

    handleMouseDown(px, py) {
        this.lastMousePos = { x: px, y: py };

        if (this.selectedId) {
            const obj = this.sceneGraph.find(o => o.id === this.selectedId);
            if (obj) {
                const lp = this.localPoint(px, py, obj);
                
                // Check handles
                const handles = this.getHandlePositions(obj);
                for (const h of handles) {
                    if (Math.abs(lp.x - h.x) < 10 && Math.abs(lp.y - h.y) < 10) {
                        this.isResizing = true;
                        this.activeHandle = h.id;
                        return;
                    }
                }

                // Check rotation handle
                const rotX = obj.x + obj.width / 2;
                const rotY = obj.y - 20;
                if (Math.abs(lp.x - rotX) < 10 && Math.abs(lp.y - rotY) < 10) {
                    this.isRotating = true;
                    return;
                }
            }
        }

        const hit = this.hitTest(px, py);
        if (hit) {
            this.selectedId = hit.id;
            this.isDragging = true;
            this.dragOffset = {
                x: px - hit.x,
                y: py - hit.y
            };
        } else {
            this.selectedId = null;
        }
    }

    handleMouseMove(px, py) {
        if (!this.selectedId) return;
        const obj = this.sceneGraph.find(o => o.id === this.selectedId);
        if (!obj) return;

        if (this.isDragging) {
            obj.x = px - this.dragOffset.x;
            obj.y = py - this.dragOffset.y;
        } else if (this.isResizing) {
            const lp = this.localPoint(px, py, obj);
            const hs = 10;
            
            if (this.activeHandle === 'br') {
                obj.width = lp.x - obj.x;
                obj.height = lp.y - obj.y;
            } else if (this.activeHandle === 'bl') {
                const deltaX = obj.x - lp.x;
                obj.x = lp.x;
                obj.width += deltaX;
                obj.height = lp.y - obj.y; // WRONG: this should be relative. 
                // Fixed logic below
            }
            // Better resizing logic:
            this.applyResize(lp);
        } else if (this.isRotating) {
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const angle = Math.atan2(py - centerY, px - centerX);
            obj.rotation = (angle * 180 / Math.PI) + 90;
        }
        
        this.lastMousePos = { x: px, y: py };
    }

    applyResize(lp) {
        const obj = this.sceneGraph.find(o => o.id === this.selectedId);
        const oldX = obj.x;
        const oldY = obj.y;
        const oldW = obj.width;
        const oldH = obj.height;

        switch(this.activeHandle) {
            case 'br':
                obj.width = lp.x - oldX;
                obj.height = lp.y - oldY;
                break;
            case 'bl':
                obj.width = oldX + oldW - lp.x;
                obj.x = lp.x;
                obj.height = lp.y - oldY;
                break;
            case 'tr':
                obj.width = lp.x - oldX;
                obj.x = oldX; // keep
                obj.height = oldY + oldH - lp.y;
                obj.y = lp.y;
                break;
            case 'tl':
                obj.width = oldX + oldW - lp.x;
                obj.x = lp.x;
                obj.height = oldY + oldH - lp.y;
                obj.y = lp.y;
                break;
            case 'tm':
                obj.height = oldY + oldH - lp.y;
                obj.y = lp.y;
                break;
            case 'bm':
                obj.height = lp.y - oldY;
                break;
            case 'ml':
                obj.width = oldX + oldW - lp.x;
                obj.x = lp.x;
                break;
            case 'mr':
                obj.width = lp.x - oldX;
                break;
        }
        // Prevent negative size
        if (obj.width < 10) { obj.width = 10; obj.x = oldX + (this.activeHandle.includes('l') ? 0 : 10); }
        if (obj.height < 10) { obj.height = 10; obj.y = oldY + (this.activeHandle.includes('t') ? 0 : 10); }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
    }

    exportToPNG() {
        // To export high res, we temporarily remove selection UI
        const prevSelected = this.selectedId;
        this.selectedId = null;
        this.draw();
        
        const dataUrl = this.canvas.toDataURL('image/png');
        this.selectedId = prevSelected;
        
        const link = document.createElement('a');
        link.download = 'design-export.png';
        link.href = dataUrl;
        link.click();
    }
}

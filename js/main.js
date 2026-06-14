/**
 * Main.js - Version 2.0
 * Orchestrates the DesignStudio v2 application
 */

import Templates from './templates.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine('main-canvas');
    const ui = new UI(engine);
    
    ui.bindPropertyEvents();

    // Global helpers
    window.loadTemplate = (templateKey) => {
        const template = Templates[templateKey];
        if (template) {
            engine.sceneGraph = [];
            template.forEach(obj => engine.addObject(obj));
            engine.saveState();
        }
    };

    window.moveLayer = (id, direction) => {
        if (direction === 'front') engine.bringToFront(id);
        else engine.sendToBack(id);
    };

    window.deleteLayer = (id) => {
        engine.selectedIds.clear();
        engine.selectedIds.add(id);
        engine.removeObjects();
    };

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            engine.removeObjects();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            engine.undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            engine.redo();
        } else if (e.key === 'ArrowLeft') {
            engine.selectedIds.forEach(id => {
                const obj = engine.sceneGraph.find(o => o.id === id);
                if (obj) obj.x -= 1;
            });
        } else if (e.key === 'ArrowRight') {
            engine.selectedIds.forEach(id => {
                const obj = engine.sceneGraph.find(o => o.id === id);
                if (obj) obj.x += 1;
            });
        } else if (e.key === 'ArrowUp') {
            engine.selectedIds.forEach(id => {
                const obj = engine.sceneGraph.find(o => o.id === id);
                if (obj) obj.y -= 1;
            });
        } else if (e.key === 'ArrowDown') {
            engine.selectedIds.forEach(id => {
                const obj = engine.sceneGraph.find(o => o.id === id);
                if (obj) obj.y += 1;
            });
        }
    });

    // Sync UI loop
    const syncLoop = () => {
        ui.updatePropertyBar();
        ui.updateLayersPanel();
        requestAnimationFrame(syncLoop);
    };
    syncLoop();
    
    // Initial State
    engine.saveState();
});

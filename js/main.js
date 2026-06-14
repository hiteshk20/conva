/**
 * Main.js - Version 5.0 "Enterprise"
 * Orchestrates the full-featured DesignStudio v5
 */

import Templates from './templates.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine('main-canvas');
    const ui = new UI(engine);
    
    ui.bindPropertyEvents();

    window.loadTemplate = (key) => {
        const template = Templates[key];
        if (template) {
            engine.sceneGraph = [];
            template.forEach(obj => engine.addObject(obj));
            engine.saveState();
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            engine.sceneGraph = engine.sceneGraph.filter(o => !engine.selectedIds.has(o.id));
            engine.selectedIds.clear();
            engine.saveState();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault(); engine.undo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault(); engine.redo();
        }
    });

    const sync = () => {
        ui.updatePropertyPanel();
        requestAnimationFrame(sync);
    };
    sync();
    engine.saveState();
});

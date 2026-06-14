/**
 * Main.js - Application Bootstrapper
 */

import Templates from './templates.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine('main-canvas');
    const ui = new UI(engine);
    
    ui.bindPropertyEvents();

    // Global helpers for the UI (because they are called from inline HTML strings in UI.js)
    window.loadTemplate = (templateKey) => {
        const template = Templates[templateKey];
        if (template) {
            // Clear current scene
            engine.sceneGraph = [];
            // Add template objects
            template.forEach(obj => {
                engine.addObject(obj);
            });
        }
    };

    window.moveLayer = (id, direction) => {
        if (direction === 'front') engine.bringToFront(id);
        else engine.sendToBack(id);
    };

    window.deleteLayer = (id) => {
        engine.removeObject(id);
    };

    // Sync UI loop
    const syncLoop = () => {
        ui.updatePropertyBar();
        ui.updateLayersPanel();
        requestAnimationFrame(syncLoop);
    };
    syncLoop();
    
    // Persistence
    window.onbeforeunload = () => {
        localStorage.setItem('canva_clone_scene', JSON.stringify(engine.sceneGraph));
    };
    
    const saved = localStorage.getItem('canva_clone_scene');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            engine.sceneGraph = data;
            // Re-link image elements if any
            engine.sceneGraph.forEach(obj => {
                if (obj.type === 'image' && obj.imageSource) {
                    const img = new Image();
                    img.src = obj.imageSource;
                    img.onload = () => { obj._imgElement = img; };
                }
            });
        } catch(e) {
            console.error('Failed to load saved scene', e);
        }
    }
});

/**
 * templates.js - Predefined design layouts
 */

const Templates = {
    socialPost: [
        { type: 'rect', x: 0, y: 0, width: 1080, height: 1080, color: '#f3f4f6', zIndex: 0 },
        { type: 'rect', x: 100, y: 100, width: 880, height: 200, color: '#3b82f6', zIndex: 1 },
        { type: 'text', x: 540, y: 150, text: 'SUMMER SALE', fontSize: 80, color: 'white', textAlign: 'center', zIndex: 2 },
        { type: 'circle', x: 440, y: 400, width: 200, height: 200, color: '#ef4444', zIndex: 1 },
        { type: 'text', x: 540, y: 650, text: 'Up to 50% Off All Items', fontSize: 40, color: '#1f2937', textAlign: 'center', zIndex: 2 },
    ],
    businessCard: [
        { type: 'rect', x: 0, y: 0, width: 1050, height: 600, color: 'white', zIndex: 0 },
        { type: 'rect', x: 0, y: 0, width: 200, height: 600, color: '#1e3a8a', zIndex: 1 },
        { type: 'text', x: 250, y: 150, text: 'Jonathan Doe', fontSize: 60, color: '#1e3a8a', textAlign: 'left', zIndex: 2 },
        { type: 'text', x: 250, y: 220, text: 'Principal Software Engineer', fontSize: 30, color: '#6b7280', textAlign: 'left', zIndex: 2 },
        { type: 'rect', x: 250, y: 300, width: 400, height: 2, color: '#e5e7eb', zIndex: 1 },
        { type: 'text', x: 250, y: 320, text: 'Email: jon@example.com', fontSize: 20, color: '#374151', textAlign: 'left', zIndex: 2 },
    ],
    modernSlide: [
        { type: 'rect', x: 0, y: 0, width: 1920, height: 1080, color: '#ffffff', zIndex: 0 },
        { type: 'rect', x: 0, y: 0, width: 1920, height: 200, color: '#111827', zIndex: 1 },
        { type: 'text', x: 100, y: 60, text: 'Quarterly Report', fontSize: 60, color: 'white', textAlign: 'left', zIndex: 2 },
        { type: 'rect', x: 200, y: 300, width: 600, height: 400, color: '#dbeafe', zIndex: 1 },
        { type: 'rect', x: 900, y: 300, width: 600, height: 400, color: '#fef3c7', zIndex: 1 },
        { type: 'text', x: 500, y: 500, text: 'Metric A', fontSize: 40, color: '#1e40af', textAlign: 'center', zIndex: 2 },
        { type: 'text', x: 1200, y: 500, text: 'Metric B', fontSize: 40, color: '#92400e', textAlign: 'center', zIndex: 2 },
    ]
};

export default Templates;

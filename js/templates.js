/**
 * templates.js - Version 2.0
 * Expanded professional template library
 */

const Templates = {
    socialPost: [
        { type: 'rect', x: 0, y: 0, width: 1080, height: 1080, color: '#f8fafc', zIndex: 0 },
        { type: 'rect', x: 100, y: 100, width: 880, height: 200, color: '#2563eb', zIndex: 1 },
        { type: 'text', x: 540, y: 150, text: 'SUMMER SALE', fontSize: 80, color: 'white', textAlign: 'center', zIndex: 2 },
        { type: 'circle', x: 440, y: 400, width: 200, height: 200, color: '#ef4444', zIndex: 1 },
        { type: 'text', x: 540, y: 650, text: 'Up to 50% Off All Items', fontSize: 40, color: '#1e293b', textAlign: 'center', zIndex: 2 },
    ],
    businessCard: [
        { type: 'rect', x: 0, y: 0, width: 1050, height: 600, color: 'white', zIndex: 0 },
        { type: 'rect', x: 0, y: 0, width: 200, height: 600, color: '#1e3a8a', zIndex: 1 },
        { type: 'text', x: 250, y: 150, text: 'Jonathan Doe', fontSize: 60, color: '#1e3a8a', textAlign: 'left', zIndex: 2 },
        { type: 'text', x: 250, y: 220, text: 'Principal Software Engineer', fontSize: 30, color: '#64748b', textAlign: 'left', zIndex: 2 },
        { type: 'rect', x: 250, y: 300, width: 400, height: 2, color: '#e2e8f0', zIndex: 1 },
        { type: 'text', x: 250, y: 320, text: 'Email: jon@example.com', fontSize: 20, color: '#334155', textAlign: 'left', zIndex: 2 },
    ],
    modernSlide: [
        { type: 'rect', x: 0, y: 0, width: 1920, height: 1080, color: '#ffffff', zIndex: 0 },
        { type: 'rect', x: 0, y: 0, width: 1920, height: 200, color: '#0f172a', zIndex: 1 },
        { type: 'text', x: 100, y: 60, text: 'Quarterly Performance', fontSize: 60, color: 'white', textAlign: 'left', zIndex: 2 },
        { type: 'rect', x: 200, y: 300, width: 600, height: 400, color: '#dbeafe', zIndex: 1 },
        { type: 'rect', x: 900, y: 300, width: 600, height: 400, color: '#fef3c7', zIndex: 1 },
        { type: 'text', x: 500, y: 500, text: 'Growth: +24%', fontSize: 40, color: '#1d4ed8', textAlign: 'center', zIndex: 2 },
        { type: 'text', x: 1200, y: 500, text: 'Churn: -2%', fontSize: 40, color: '#b45309', textAlign: 'center', zIndex: 2 },
    ],
    marketingFlyer: [
        { type: 'rect', x: 0, y: 0, width: 800, height: 1200, color: '#ffffff', zIndex: 0 },
        { type: 'rect', x: 0, y: 0, width: 800, height: 400, color: '#4f46e5', zIndex: 1 },
        { type: 'text', x: 400, y: 100, text: 'GRAND OPENING', fontSize: 70, color: 'white', textAlign: 'center', zIndex: 2 },
        { type: 'star', x: 300, y: 500, width: 200, height: 200, color: '#facc15', zIndex: 1 },
        { type: 'text', x: 400, y: 750, text: 'Join us for a day of celebration!', fontSize: 30, color: '#334155', textAlign: 'center', zIndex: 2 },
        { type: 'rect', x: 200, y: 900, width: 400, height: 60, color: '#4f46e5', zIndex: 1 },
        { type: 'text', x: 400, y: 915, text: 'BOOK NOW', fontSize: 25, color: 'white', textAlign: 'center', zIndex: 2 },
    ]
};

export default Templates;

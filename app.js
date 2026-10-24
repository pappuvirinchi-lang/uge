/**
 * Ultimate Game Engine (UGE) - QuantumPulse
 * Interactive Visual Node Graph Sandbox & Background Canvas Physics
 */

document.addEventListener('DOMContentLoaded', () => {
    initBackgroundCanvas();
    initInteractiveNodeGraph();
});

/* ===================================================================
   1. Dynamic Background Grid & Quantum Particle Waves
   =================================================================== */
function initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, radius: 180 };

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Particle nodes for digital lattice effect
    const particles = [];
    const count = Math.min(Math.floor((width * height) / 24000), 65);

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.5 + 1,
            baseColor: i % 3 === 0 ? 'rgba(0, 240, 255,' : 'rgba(147, 51, 234,'
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Bounce on boundary
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Slight reaction to mouse cursor
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const angle = Math.atan2(dy, dx);
                const force = (mouse.radius - dist) / mouse.radius;
                p.x -= Math.cos(angle) * force * 1.2;
                p.y -= Math.sin(angle) * force * 1.2;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.baseColor + ' 0.8)';
            ctx.fill();

            // Connect nearby particles with subtle lines
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const pdx = p.x - p2.x;
                const pdy = p.y - p2.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

                if (pdist < 140) {
                    const alpha = (1 - pdist / 140) * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

/* ===================================================================
   2. Interactive Drag & Drop Node Graph Canvas
   =================================================================== */
function initInteractiveNodeGraph() {
    const canvasArea = document.getElementById('graph-canvas-area');
    const svg = document.getElementById('connections-svg');
    const resetBtn = document.getElementById('reset-nodes-btn');
    if (!canvasArea || !svg) return;

    // Defined Pin Connections: sourcePin -> targetPin, type
    const connections = [
        { from: 'tick-exec', to: 'rot-exec-in', type: 'wire-exec' },
        { from: 'tick-delta', to: 'mult-in-a', type: 'wire-data' },
        { from: 'mult-out', to: 'rot-degrees-y', type: 'wire-data' }
    ];

    const nodes = document.querySelectorAll('.graph-node');

    // Default initial positions for reset
    const defaultPositions = {
        'node-tick': { x: 60, y: 120 },
        'node-math': { x: 320, y: 160 },
        'node-rotate': { x: 580, y: 100 }
    };

    let activeNode = null;
    let dragOffset = { x: 0, y: 0 };

    // Function to calculate exact pin center coordinate relative to canvasArea
    function getPinCenter(pinElement) {
        const areaRect = canvasArea.getBoundingClientRect();
        const pinRect = pinElement.getBoundingClientRect();
        return {
            x: pinRect.left + pinRect.width / 2 - areaRect.left,
            y: pinRect.top + pinRect.height / 2 - areaRect.top
        };
    }

    // Render cubic bezier curves connecting pins
    function renderWires() {
        svg.innerHTML = '';

        connections.forEach(conn => {
            const fromPin = document.querySelector(`[data-pin-id="${conn.from}"]`);
            const toPin = document.querySelector(`[data-pin-id="${conn.to}"]`);

            if (!fromPin || !toPin) return;

            const p1 = getPinCenter(fromPin);
            const p2 = getPinCenter(toPin);

            // Compute control points for smooth bezier curve
            const dx = Math.abs(p2.x - p1.x) * 0.55;
            const curvature = Math.max(dx, 50);

            const cp1x = p1.x + curvature;
            const cp1y = p1.y;
            const cp2x = p2.x - curvature;
            const cp2y = p2.y;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            path.setAttribute('d', d);
            path.setAttribute('class', `connection-wire ${conn.type}`);
            svg.appendChild(path);
        });
    }

    // Setup drag logic on each node
    nodes.forEach(node => {
        node.addEventListener('mousedown', (e) => {
            // Don't drag if clicking directly on a pin
            if (e.target.classList.contains('pin')) return;

            activeNode = node;
            const rect = node.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            // Bring dragged node to front
            nodes.forEach(n => n.style.zIndex = '10');
            node.style.zIndex = '25';
        });
    });

    window.addEventListener('mousemove', (e) => {
        if (!activeNode) return;

        const areaRect = canvasArea.getBoundingClientRect();
        let newX = e.clientX - areaRect.left - dragOffset.x;
        let newY = e.clientY - areaRect.top - dragOffset.y;

        // Boundaries within canvas area
        const maxX = canvasArea.clientWidth - activeNode.offsetWidth - 10;
        const maxY = canvasArea.clientHeight - activeNode.offsetHeight - 10;

        newX = Math.max(10, Math.min(newX, maxX));
        newY = Math.max(10, Math.min(newY, maxY));

        activeNode.style.left = `${newX}px`;
        activeNode.style.top = `${newY}px`;

        renderWires();
    });

    window.addEventListener('mouseup', () => {
        if (activeNode) {
            activeNode = null;
            renderWires();
        }
    });

    // Reset Layout Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Object.keys(defaultPositions).forEach(nodeId => {
                const el = document.getElementById(nodeId);
                if (el) {
                    el.style.left = `${defaultPositions[nodeId].x}px`;
                    el.style.top = `${defaultPositions[nodeId].y}px`;
                }
            });
            renderWires();
        });
    }

    // Initial render
    setTimeout(renderWires, 100);
    window.addEventListener('resize', renderWires);
}

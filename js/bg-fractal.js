// /js/bg-fractal.js
// Canvas-based triangular "fractal-ish" background.
// - Triangles fade in/out using sine functions
// - Density increases towards left/right edges (x-axis only)
// - Adapts to light/dark mode (reads header/main .dark class)
// - Resizes and regenerates on window resize (debounced)

const canvasId = 'bg-canvas';

class TriangleField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.triangles = [];
        this.running = false;
        this.dpr = Math.max(1, window.devicePixelRatio || 1);
        this.lastTime = 0;
        this.theme = this.getTheme(); // 'dark' or 'light'
        this.resizeTimeout = null;

        this._onResize = this._onResize.bind(this);
        this._animate = this._animate.bind(this);
        this._onThemeMutation = this._onThemeMutation.bind(this);

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(this._onResize, 150);
        });

        // Observe header/main for .dark toggling so triangles switch colors
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const target = header || main || document.body;
        const mo = new MutationObserver(this._onThemeMutation);
        mo.observe(target, { attributes: true, attributeFilter: ['class'] });

        this.init();
    }

    getTheme() {
        // check header or main for .dark class
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        if (header && header.classList.contains('dark')) return 'dark';
        if (main && main.classList.contains('dark')) return 'dark';
        return 'light';
    }

    _onThemeMutation() {
        const newTheme = this.getTheme();
        if (newTheme !== this.theme) {
            this.theme = newTheme;
            // regenerate triangles with new color base
            this.generateTriangles();
        }
    }

    init() {
        this.resizeCanvas();
        this.generateTriangles();
        this.running = true;
        requestAnimationFrame(this._animate);
    }

    _onResize() {
        this.resizeCanvas();
        this.generateTriangles();
    }

    resizeCanvas() {
        const w = Math.max(1, window.innerWidth);
        const h = Math.max(1, window.innerHeight);

        this.dpr = Math.max(1, window.devicePixelRatio || 1);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.canvas.width = Math.round(w * this.dpr);
        this.canvas.height = Math.round(h * this.dpr);

        // scale drawing coordinates to CSS pixels
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    generateTriangles() {
        // create triangles across multiple scales
        this.triangles = [];
        const w = window.innerWidth;
        const h = window.innerHeight;
        const centerX = w / 2;

        // scales with approximate relative density multipliers
        const scales = [
            { size: 10, densityFactor: 1.4 }, // many small triangles
            { size: 20, densityFactor: 0.9 },
            { size: 40, densityFactor: 0.5 },
            { size: 80, densityFactor: 0.25 }, // few large triangles
        ];

        // cap total triangles to avoid perf issues on very wide screens
        const maxTotal = Math.max(120, Math.round(w / 6));

        let total = 0;
        for (const s of scales) {
            const approx = Math.round((w / s.size) * s.densityFactor);
            const target = Math.min(approx, Math.round(maxTotal * (s.densityFactor / 2)));
            let placed = 0;
            let attempts = 0;
            const attemptsLimit = target * 8 + 100;
            while (placed < target && attempts < attemptsLimit) {
                attempts++;
                const x = Math.random() * w;
                const y = Math.random() * h;

                // acceptance probability increases away from center on x-axis
                const edgeWeight = Math.abs((x - centerX) / centerX); // 0 center, 1 edges
                // exponent to sharpen the effect (more concentrated to edges)
                const acceptance = Math.pow(edgeWeight, 1.6);

                if (Math.random() < acceptance) {
                    const jitterSize = s.size * (0.7 + Math.random() * 0.8);
                    const rotation = Math.random() * Math.PI * 2;
                    const speed = 0.4 + Math.random() * 1.6; // speed of fade
                    const phase = Math.random() * Math.PI * 2;
                    const alphaBase = 0.06 + Math.random() * 0.22; // base alpha multiplier
                    const stroke = 0; // optional outline thickness

                    // color: white-ish on dark theme, black-ish on light theme
                    const col = (this.theme === 'dark') ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };

                    this.triangles.push({
                        x, y, size: jitterSize, rotation, speed, phase, alphaBase, stroke, col
                    });
                    placed++;
                    total++;
                    if (total >= maxTotal) break;
                }
            }
            if (total >= maxTotal) break;
        }

        // small post adjustments: sort triangles by size so rendering is nicer
        this.triangles.sort((a, b) => a.size - b.size);
    }

    _animate(t) {
        if (!this.running) return;
        const ctx = this.ctx;
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;

        // clear but keep full alpha clear (transparent so body background shows through)
        ctx.clearRect(0, 0, w, h);

        const time = t * 0.001;

        for (let i = 0; i < this.triangles.length; i++) {
            const tri = this.triangles[i];
            // alpha oscillation between ~0 and alphaBase*1.8
            const alpha = tri.alphaBase * (0.6 + 0.4 * Math.sin(time * tri.speed + tri.phase) + 0.5 * Math.random() * 0.1);
            // clamp
            const opa = Math.max(0, Math.min(1.0, alpha));

            ctx.save();
            ctx.translate(tri.x, tri.y);
            ctx.rotate(tri.rotation);
            ctx.beginPath();

            // equilateral-ish triangle path centered at 0,0
            const s = tri.size;
            const hTri = s * Math.sqrt(3) / 2;
            ctx.moveTo(0, -hTri * 0.66);
            ctx.lineTo(-s / 2, hTri * 0.66);
            ctx.lineTo(s / 2, hTri * 0.66);
            ctx.closePath();

            ctx.fillStyle = `rgba(${tri.col.r},${tri.col.g},${tri.col.b},${opa})`;
            ctx.fill();

            if (tri.stroke && tri.stroke > 0) {
                ctx.lineWidth = tri.stroke;
                ctx.strokeStyle = `rgba(${tri.col.r},${tri.col.g},${tri.col.b},${opa * 0.9})`;
                ctx.stroke();
            }

            ctx.restore();
        }

        this.lastTime = t;
        requestAnimationFrame(this._animate);
    }

    stop() {
        this.running = false;
    }
}

function initBgFractal() {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn('[bg-fractal] canvas not found:', canvasId);
        return;
    }

    // create and store instance on window for debugging if needed
    window.__bgTriangleField = new TriangleField(canvas);
}

// wait until DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initBgFractal();
} else {
    window.addEventListener('DOMContentLoaded', initBgFractal);
}

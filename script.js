// Mark JS as available (content stays visible if JS fails)
document.documentElement.classList.add('js');

// Theme toggle (dark / light), saved in the browser
const themeBtn = document.getElementById('theme');
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });
}

// Mobile navigation
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('links');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    navLinks.querySelectorAll('a').forEach((link) =>
        link.addEventListener('click', () => navLinks.classList.remove('active'))
    );
}

// Scroll reveal
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealElements.forEach((el) => observer.observe(el));
} else {
    revealElements.forEach((el) => el.classList.add('show'));
}

// Click colors: every click on a card / box / chip picks the next color
const palette = ['#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
let colorIndex = 0;
document.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    const target = e.target.closest('.chips span') || e.target.closest('.card, .box');
    if (!target) return;
    if (target.classList.contains('picked')) {
        target.classList.remove('picked');
        return;
    }
    target.style.setProperty('--c', palette[colorIndex % palette.length]);
    colorIndex++;
    target.classList.add('picked');
});

// Highlight the current section's link in the navbar
const spyLinks = document.querySelectorAll('.links a[href^="#"]:not(.btn)');
if ('IntersectionObserver' in window && spyLinks.length) {
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                spyLinks.forEach((a) =>
                    a.classList.toggle('on', a.getAttribute('href') === '#' + entry.target.id)
                );
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('section[id]').forEach((s) => spy.observe(s));
}

// Interactive background: floating network that reacts to the mouse
(function () {
    const c = document.getElementById('bg');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, pts = [], c1, c2;
    const mouse = { x: -9999, y: -9999 };

    function colors() {
        const s = getComputedStyle(document.documentElement);
        c1 = s.getPropertyValue('--accent').trim() || '#6c8cff';
        c2 = s.getPropertyValue('--accent2').trim() || '#22d3ee';
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth; h = window.innerHeight;
        c.width = w * dpr; c.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(110, Math.floor((w * h) / 15000));
        pts = Array.from({ length: n }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.6 + 1
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const p of pts) {
            if (!reduce) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
                if (d < 140 && d > 0) {            // mouse pushes dots away
                    const f = ((140 - d) / 140) * 1.2;
                    p.x += (dx / d) * f; p.y += (dy / d) * f;
                }
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = c1;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
                if (d < 130) {
                    ctx.globalAlpha = (1 - d / 130) * 0.35;
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
                }
            }
        }
        ctx.strokeStyle = c2;                     // lines from the mouse to nearby dots
        for (const p of pts) {
            const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
            if (d < 180) {
                ctx.globalAlpha = (1 - d / 180) * 0.7;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
        }
        ctx.fillStyle = c1; ctx.globalAlpha = 0.8;
        for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
        if (mouse.x > -999) {                     // soft glow under the cursor
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
            g.addColorStop(0, c2); g.addColorStop(1, 'transparent');
            ctx.globalAlpha = 0.18; ctx.fillStyle = g;
            ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
        }
        ctx.globalAlpha = 1;
        if (!reduce) requestAnimationFrame(draw);
    }

    colors(); resize(); draw();
    window.addEventListener('resize', () => { resize(); if (reduce) draw(); });
    window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { mouse.x = mouse.y = -9999; } });
    document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
    new MutationObserver(() => { colors(); if (reduce) draw(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

// Mark JS as available
document.documentElement.classList.add('js');

// Theme toggle
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

// Click colors
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

// Navbar active section
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

// Interactive background
(function () {
    const c = document.getElementById('bg');
    if (!c || !c.getContext) return;

    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0;
    let c1 = '#6c8cff', c2 = '#22d3ee';
    let mxs = 0, mys = 0, tx = 0, ty = 0;

    const mouse = { x: -9999, y: -9999 };

    function rng(seed) {
        return () => {
            seed |= 0;
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const OUT = [
        [.50,.04],[.66,.07],[.80,.17],[.88,.32],[.90,.48],
        [.86,.62],[.80,.70],[.78,.80],[.80,.96],[.50,.96],
        [.48,.84],[.40,.78],[.30,.76],[.26,.70],[.28,.64],
        [.25,.58],[.19,.55],[.25,.48],[.27,.38],[.28,.28],
        [.34,.14],[.42,.07]
    ];

    const TRACES = [
        [[.89,.40],[.97,.40],[.97,.30],[1.08,.30]],
        [[.88,.55],[1.0,.55],[1.0,.66],[1.12,.66]],
        [[.80,.22],[.86,.12],[1.02,.12]]
    ];

    const R = rng(7), BR = [], EDGES = [];

    while (BR.length < 30) {
        const x = .58 + (R() * 2 - 1) * .27;
        const y = .33 + (R() * 2 - 1) * .21;

        if (((x - .58) / .27) ** 2 + ((y - .33) / .21) ** 2 <= 1) {
            BR.push([x, y]);
        }
    }

    for (let i = 0; i < BR.length; i++) {
        for (let j = i + 1; j < BR.length; j++) {
            if (Math.hypot(BR[i][0] - BR[j][0], BR[i][1] - BR[j][1]) < .115) {
                EDGES.push([i, j]);
            }
        }
    }

    const R2 = rng(21);

    const SCAT = Array.from({ length: 26 }, (_, i) => {
        const x = i / 25;
        return [x, .75 - x * .5 + (R2() - .5) * .38];
    });

    const TAGS = [
        'R² 0.95', 'MAE 9.45', 'PM2.5', 'XGBoost',
        'n = 420k', 'PCA', 'EDA', 'Python', 'AI', 'ML'
    ].map((t) => ({
        t,
        x: R2(),
        y: R2(),
        p: R2() * 6.28,
        d: 6 + R2() * 14
    }));

    function colors() {
        const s = getComputedStyle(document.documentElement);
        c1 = s.getPropertyValue('--accent').trim() || c1;
        c2 = s.getPropertyValue('--accent2').trim() || c2;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;

        c.width = W * dpr;
        c.height = H * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function head(t, a) {
        const mobile = W < 820;
        const S = mobile
            ? Math.min(W * 1.05, H * 0.6)
            : Math.min(H * 0.92, W * 0.52);

        const cx = (mobile ? W * 0.5 : W * 0.72) + mxs * 14;
        const cy = (mobile ? H * 0.46 : H * 0.52)
            + Math.sin(t * 0.0008) * 6 + mys * 10;

        const P = (x, y, d) => [
            cx + (x - .55) * S + mxs * (d || 0),
            cy + (y - .5) * S + mys * (d || 0) * .7
        ];

        const path = () => {
            ctx.beginPath();
            OUT.forEach(([x, y], i) => {
                const [px, py] = P(x, y);
                i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            });
            ctx.closePath();
        };

        path();
        ctx.globalAlpha = .05 * a;
        ctx.fillStyle = c1;
        ctx.fill();

        ctx.globalAlpha = .55 * a;
        ctx.strokeStyle = c1;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.fillStyle = c1;
        ctx.globalAlpha = .8 * a;

        OUT.forEach(([x, y]) => {
            const [px, py] = P(x, y);
            ctx.beginPath();
            ctx.arc(px, py, 2.4, 0, 6.3);
            ctx.fill();
        });

        ctx.strokeStyle = c1;
        ctx.lineWidth = 1;

        EDGES.forEach(([i, j], k) => {
            const A = P(BR[i][0], BR[i][1], 16);
            const B = P(BR[j][0], BR[j][1], 16);

            ctx.globalAlpha = (.1 + .22 * (Math.sin(t * .002 + k * .7) + 1) / 2) * a;

            ctx.beginPath();
            ctx.moveTo(A[0], A[1]);
            ctx.lineTo(B[0], B[1]);
            ctx.stroke();

            if (k % 4 === 0) {
                const u = (t * .0006 + k * .137) % 1;
                ctx.globalAlpha = .9 * a;
                ctx.fillStyle = c2;

                ctx.beginPath();
                ctx.arc(
                    A[0] + (B[0] - A[0]) * u,
                    A[1] + (B[1] - A[1]) * u,
                    1.8, 0, 6.3
                );
                ctx.fill();
            }
        });

        BR.forEach(([x, y], i) => {
            const [px, py] = P(x, y, 16);
            const near = Math.hypot(px - mouse.x, py - mouse.y) < 110;
            const pu = (Math.sin(t * .003 + i) + 1) / 2;

            ctx.globalAlpha = (near ? 1 : .6) * a;
            ctx.fillStyle = near ? '#fff' : c2;

            ctx.beginPath();
            ctx.arc(px, py, 2 + 1.5 * pu + (near ? 2 : 0), 0, 6.3);
            ctx.fill();
        });

        const [ex, ey] = P(.33, .42, 8);
        const ep = (Math.sin(t * .004) + 1) / 2;

        ctx.strokeStyle = c2;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = (.5 + .4 * ep) * a;

        ctx.beginPath();
        ctx.arc(ex, ey, 7 + ep * 2, 0, 6.3);
        ctx.stroke();

        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, 6.3);
        ctx.fill();

        ctx.save();
        path();
        ctx.clip();

        const sy = cy - S * .46 + ((t * .0004) % 1) * S * .92;
        const g = ctx.createLinearGradient(0, sy - 30, 0, sy + 2);

        g.addColorStop(0, 'transparent');
        g.addColorStop(1, c2);

        ctx.globalAlpha = .22 * a;
        ctx.fillStyle = g;
        ctx.fillRect(cx - S, sy - 30, S * 2, 32);

        ctx.restore();

        ctx.strokeStyle = c2;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -t * .03;

        TRACES.forEach((tr) => {
            ctx.globalAlpha = .4 * a;
            ctx.beginPath();

            tr.forEach(([x, y], i) => {
                const [px, py] = P(x, y, 4);
                i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            });

            ctx.stroke();
        });

        ctx.setLineDash([]);
    }

     function data(t) {
        const mobile = W < 820, k = mobile ? .75 : 1;

        // Donut chart
        let [x, y] = [W * .1 + mxs * 8, H * .24 + mys * 6];
        const r = 38 * k;
        ctx.lineWidth = 9 * k;
        let ang = t * .0004;

        [[.45, c1, .4], [.3, c2, .5], [.25, c1, .22]].forEach(([v, col, al]) => {
            ctx.strokeStyle = col;
            ctx.globalAlpha = al;
            ctx.beginPath();
            ctx.arc(x, y, r, ang, ang + v * 6.28 - .08);
            ctx.stroke();
            ang += v * 6.28;
        });

        // Bars
        const bx = W * .05 + mxs * 12;
        const by = H * .86 + mys * 8;

        for (let i = 0; i < 8; i++) {
            const h = (22 + 50 * Math.abs(Math.sin(t * .0009 + i * .9))) * k;

            ctx.globalAlpha = .3;
            ctx.fillStyle = c1;
            ctx.fillRect(bx + i * 22 * k, by - h, 14 * k, h);

            ctx.globalAlpha = .6;
            ctx.fillStyle = c2;
            ctx.fillRect(bx + i * 22 * k, by - h, 14 * k, 2);
        }

        ctx.globalAlpha = .3;
        ctx.strokeStyle = c1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by + 3);
        ctx.lineTo(bx + 8 * 22 * k, by + 3);
        ctx.stroke();

        if (mobile) return;

        // Line chart
        const lx = W * .27 + mxs * 6;
        const ly = H * .13 + mys * 5;

        ctx.globalAlpha = .18;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + 76);
        ctx.lineTo(lx + 190, ly + 76);
        ctx.stroke();

        ctx.strokeStyle = c2;
        ctx.lineWidth = 2;
        ctx.globalAlpha = .5;
        ctx.beginPath();

        const pts = Array.from({ length: 12 }, (_, i) => [
            lx + i * 17,
            ly + 38 - 26 * Math.sin(i * .8 + t * .0012) - 8 * Math.sin(i * 2 + t * .002)
        ]);

        pts.forEach(([px, py], i) => {
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        });

        ctx.stroke();

        ctx.fillStyle = c2;
        pts.forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(px, py, 2.6, 0, 6.3);
            ctx.fill();
        });

        // Scatter plot
        const sx = W * .38 + mxs * 10;
        const sy = H * .78 + mys * 7;

        ctx.fillStyle = c1;
        ctx.globalAlpha = .5;

        SCAT.forEach(([u, v], i) => {
            ctx.beginPath();
            ctx.arc(sx + u * 170, sy + (v + Math.sin(t * .001 + i) * .03) * 80, 2.4, 0, 6.3);
            ctx.fill();
        });

        ctx.strokeStyle = c2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = .45;
        ctx.beginPath();
        ctx.moveTo(sx, sy + .75 * 80);
        ctx.lineTo(sx + 170, sy + .25 * 80);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function frame(t) {
        ctx.clearRect(0, 0, W, H);

        mxs += (tx - mxs) * .06;
        mys += (ty - mys) * .06;

        TAGS.forEach((g) => {
            ctx.font = '12px monospace';
            ctx.globalAlpha = .2;
            ctx.fillStyle = c2;

            ctx.fillText(
                g.t,
                g.x * W + Math.sin(t * .0003 + g.p) * g.d + mxs * 18,
                g.y * H + Math.cos(t * .00025 + g.p) * g.d + mys * 12
            );
        });

        data(t);
        head(t, W < 820 ? .5 : .85);

        if (mouse.x > -999) {
            const g = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 160
            );

            g.addColorStop(0, c2);
            g.addColorStop(1, 'transparent');

            ctx.globalAlpha = .12;
            ctx.fillStyle = g;
            ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
        }

        ctx.globalAlpha = 1;

        if (!reduce) requestAnimationFrame(frame);
    }

    colors();
    resize();
    requestAnimationFrame(frame);

    window.addEventListener('resize', () => {
        resize();
        if (reduce) frame(0);
    });

    window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        tx = (e.clientX / W - .5) * 2;
        ty = (e.clientY / H - .5) * 2;
    }, { passive: true });

    window.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'mouse') {
            mouse.x = mouse.y = -9999;
            tx = ty = 0;
        }
    });

    document.addEventListener('mouseleave', () => {
        mouse.x = mouse.y = -9999;
        tx = ty = 0;
    });

    new MutationObserver(() => {
        colors();
        if (reduce) frame(0);
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

})();

// Language switch
(function () {
    const AR = {
        "About": "نبذة",
        "Technical": "المهارات التقنية",
        "Soft Skills": "المهارات الشخصية",
        "Tools": "الأدوات",
        "Languages": "اللغات",
        "Leave a Review": "اترك تقييماً",
        "EMAIL": "البريد الإلكتروني",
        "PHONE": "الهاتف",
        "WHATSAPP": "واتساب",
        "LINKEDIN": "لينكدإن",
        "GITHUB": "جيت هب",
        "Education": "التعليم",
        "Skills": "المهارات",
        "Projects": "المشاريع",
        "Services": "الخدمات",
        "Let's Talk": "تواصل معي",
        "Welcome to my portfolio": "مرحباً بك في معرض أعمالي",
        "Hi, I'm": "أهلاً، أنا",
        "Ayman Zaki": "أيمن زكي",
        "AI & Machine Learning Engineer": "مهندس ذكاء اصطناعي وتعلّم الآلة",
        "View My Projects": "شاهد مشاريعي",
        "⬇ Download CV": "⬇ تحميل السيرة الذاتية",
        "Get to know me": "تعرّف عليّ",
        "About Me": "عنّي",
        "Let's Work Together": "لنعمل معاً"
    };

    function apply(lang) {
        const ar = lang === 'ar';

        document.documentElement.lang = ar ? 'ar' : 'en';
        document.documentElement.dir = ar ? 'rtl' : 'ltr';

        document.querySelectorAll('[data-en]').forEach((el) => {
            const value = ar ? el.dataset.ar : el.dataset.en;
            if (value) el.textContent = value;
        });

        document.querySelectorAll('[data-ph-en]').forEach((el) => {
            el.placeholder = ar ? el.dataset.phAr : el.dataset.phEn;
        });

        document.querySelectorAll('[data-lang]').forEach((el) => {
            const key = el.dataset.lang;
            if (ar && AR[key]) el.textContent = AR[key];
        });

        document.querySelectorAll('h2, h3, p, span, a, button').forEach((el) => {
            const original = el.dataset.originalText || el.textContent.trim();

            if (!el.dataset.originalText) {
                el.dataset.originalText = original;
            }

            if (ar && AR[original]) {
                el.textContent = AR[original];
            } else if (!ar) {
                el.textContent = original;
            }
        });

        const btn = document.getElementById('lang');
        if (btn) btn.textContent = ar ? 'English' : 'عربي';

        try {
            localStorage.setItem('lang', lang);
        } catch (e) {}
    }

    const btn = document.getElementById('lang');

    if (btn) {
        let saved = 'en';

        try {
            saved = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
        } catch (e) {}

        if (saved === 'ar') apply('ar');

        btn.addEventListener('click', () => {
            apply(document.documentElement.lang === 'ar' ? 'en' : 'ar');
        });
    }
})();


// Testimonials: form that sends reviews to Ayman by email / WhatsApp
(function () {
    const form = document.getElementById('t-form');
    if (!form) return;

    const T = (en, ar) => document.documentElement.lang === 'ar' ? ar : en;
    const wall = document.getElementById('t-wall');
    const status = document.getElementById('t-status');
    const starsBox = document.getElementById('t-stars');
    let rating = 0;

    const stars = [1, 2, 3, 4, 5].map((n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = '★';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', n + ' / 5');
        b.setAttribute('aria-checked', 'false');

        b.addEventListener('click', () => {
            rating = n;
            paint();
        });

        starsBox.appendChild(b);
        return b;
    });

    function paint() {
        stars.forEach((b, i) => {
            b.classList.toggle('on', i < rating);
            b.setAttribute('aria-checked', String(i + 1 === rating));
        });
    }

    function compose() {
        const name = document.getElementById('t-name').value.trim();
        const role = document.getElementById('t-role').value.trim();
        const msg = document.getElementById('t-msg').value.trim();

        return 'Testimonial for Ayman Zaki\n\nName: ' + name +
            (role ? '\nRole / Company: ' + role : '') +
            '\nRating: ' + '★'.repeat(rating) + ' (' + rating + '/5)\n\n' + msg;
    }

    function valid() {
        if (!form.reportValidity()) return false;

        if (!rating) {
            status.textContent = T(
                'Please choose a star rating first.',
                'من فضلك اختر التقييم بالنجوم اولا.'
            );
            return false;
        }

        return true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!valid()) return;

        window.location.href =
            'mailto:aymanzaki0155@gmail.com?subject=' +
            encodeURIComponent('Testimonial for Ayman Zaki') +
            '&body=' + encodeURIComponent(compose());

        status.textContent = T(
            'Thank you! Your email app should open.',
            'شكرا لك! سيفتح تطبيق البريد.'
        );
    });

    document.getElementById('t-wa').addEventListener('click', () => {
        if (!valid()) return;

        window.open(
            'https://wa.me/201551637474?text=' + encodeURIComponent(compose()),
            '_blank',
            'noopener'
        );

        status.textContent = T(
            'Thank you! WhatsApp should open.',
            'شكرا لك! سيفتح واتساب.'
        );
    });
})();


// Skills category tabs
(function () {
    const tabs = document.querySelectorAll('.skill-tab');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((item) => {
                const active = item === tab;
                item.classList.toggle('active', active);
                item.setAttribute('aria-selected', String(active));
            });

            document.querySelectorAll('.skill-panel').forEach((panel) => {
                panel.classList.toggle(
                    'active',
                    panel.id === 'skill-' + tab.dataset.skill
                );
            });
        });
    });
})();


// Testimonials modal
(function () {
    const modal = document.getElementById('testimonial-modal');
    const open = document.getElementById('open-testimonial');
    const close = document.getElementById('close-testimonial');

    if (!modal || !open || !close) return;

    const show = () => {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const hide = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    open.addEventListener('click', show);
    close.addEventListener('click', hide);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) hide();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hide();
    });
})();


// Copy contact details
document.querySelectorAll('.copy-contact').forEach((button) => {
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(button.dataset.copy);

            const old = button.textContent;
            button.textContent = '✓';

            setTimeout(() => {
                button.textContent = old;
            }, 1400);

        } catch (e) {
            window.prompt('Copy this email:', button.dataset.copy);
        }
    });
});

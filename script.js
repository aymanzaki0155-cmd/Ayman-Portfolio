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

// Interactive background: AI head (neural network) + data-analysis visuals, reacting to the mouse
(function () {
    const c = document.getElementById('bg');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, c1 = '#6c8cff', c2 = '#22d3ee', mxs = 0, mys = 0, tx = 0, ty = 0;
    const mouse = { x: -9999, y: -9999 };

    function rng(seed) {
        return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    // Head profile (facing left), normalized coordinates
    const OUT = [[.50,.04],[.66,.07],[.80,.17],[.88,.32],[.90,.48],[.86,.62],[.80,.70],[.78,.80],[.80,.96],[.50,.96],[.48,.84],[.40,.78],[.30,.76],[.26,.70],[.28,.64],[.25,.58],[.19,.55],[.25,.48],[.27,.38],[.28,.28],[.34,.14],[.42,.07]];
    const TRACES = [[[.89,.40],[.97,.40],[.97,.30],[1.08,.30]], [[.88,.55],[1.0,.55],[1.0,.66],[1.12,.66]], [[.80,.22],[.86,.12],[1.02,.12]]];
    const R = rng(7), BR = [], EDGES = [];
    while (BR.length < 30) {
        const x = .58 + (R() * 2 - 1) * .27, y = .33 + (R() * 2 - 1) * .21;
        if (((x - .58) / .27) ** 2 + ((y - .33) / .21) ** 2 <= 1) BR.push([x, y]);
    }
    for (let i = 0; i < BR.length; i++) for (let j = i + 1; j < BR.length; j++)
        if (Math.hypot(BR[i][0] - BR[j][0], BR[i][1] - BR[j][1]) < .115) EDGES.push([i, j]);
    const R2 = rng(21);
    const SCAT = Array.from({ length: 26 }, (_, i) => { const x = i / 25; return [x, .75 - x * .5 + (R2() - .5) * .38]; });
    const TAGS = ['R² 0.95', 'MAE 9.45', 'PM2.5', 'XGBoost', 'n = 420k', 'PCA', 'EDA', 'Python', 'AI', 'ML'].map((t, i) =>
        ({ t, x: R2(), y: R2(), p: R2() * 6.28, d: 6 + R2() * 14 }));

    function colors() {
        const s = getComputedStyle(document.documentElement);
        c1 = s.getPropertyValue('--accent').trim() || c1;
        c2 = s.getPropertyValue('--accent2').trim() || c2;
    }
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function head(t, a) {
        const mobile = W < 820;
        const S = mobile ? Math.min(W * 1.05, H * 0.6) : Math.min(H * 0.92, W * 0.52);
        const cx = (mobile ? W * 0.5 : W * 0.72) + mxs * 14, cy = (mobile ? H * 0.46 : H * 0.52) + Math.sin(t * 0.0008) * 6 + mys * 10;
        const P = (x, y, d) => [cx + (x - .55) * S + mxs * (d || 0), cy + (y - .5) * S + mys * (d || 0) * .7];
        const path = () => { ctx.beginPath(); OUT.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); };
        path(); ctx.globalAlpha = .05 * a; ctx.fillStyle = c1; ctx.fill();
        ctx.globalAlpha = .55 * a; ctx.strokeStyle = c1; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = c1; ctx.globalAlpha = .8 * a;
        OUT.forEach(([x, y]) => { const [px, py] = P(x, y); ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.3); ctx.fill(); });
        ctx.strokeStyle = c1; ctx.lineWidth = 1;
        EDGES.forEach(([i, j], k) => {
            const A = P(BR[i][0], BR[i][1], 16), B = P(BR[j][0], BR[j][1], 16);
            ctx.globalAlpha = (.1 + .22 * (Math.sin(t * .002 + k * .7) + 1) / 2) * a;
            ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
            if (k % 4 === 0) {
                const u = (t * .0006 + k * .137) % 1;
                ctx.globalAlpha = .9 * a; ctx.fillStyle = c2;
                ctx.beginPath(); ctx.arc(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, 1.8, 0, 6.3); ctx.fill();
            }
        });
        BR.forEach(([x, y], i) => {
            const [px, py] = P(x, y, 16), near = Math.hypot(px - mouse.x, py - mouse.y) < 110;
            const pu = (Math.sin(t * .003 + i) + 1) / 2;
            ctx.globalAlpha = (near ? 1 : .6) * a; ctx.fillStyle = near ? '#fff' : c2;
            ctx.beginPath(); ctx.arc(px, py, 2 + 1.5 * pu + (near ? 2 : 0), 0, 6.3); ctx.fill();
        });
        const [ex, ey] = P(.33, .42, 8), ep = (Math.sin(t * .004) + 1) / 2;            // glowing eye
        ctx.strokeStyle = c2; ctx.lineWidth = 1.5; ctx.globalAlpha = (.5 + .4 * ep) * a;
        ctx.beginPath(); ctx.arc(ex, ey, 7 + ep * 2, 0, 6.3); ctx.stroke();
        ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, 6.3); ctx.fill();
        ctx.save(); path(); ctx.clip();                                                 // scan line
        const sy = cy - S * .46 + ((t * .0004) % 1) * S * .92, g = ctx.createLinearGradient(0, sy - 30, 0, sy + 2);
        g.addColorStop(0, 'transparent'); g.addColorStop(1, c2);
        ctx.globalAlpha = .22 * a; ctx.fillStyle = g; ctx.fillRect(cx - S, sy - 30, S * 2, 32);
        ctx.restore();
        ctx.strokeStyle = c2; ctx.lineWidth = 1.4; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * .03;   // data traces
        TRACES.forEach((tr) => {
            ctx.globalAlpha = .4 * a; ctx.beginPath();
            tr.forEach(([x, y], i) => { const [px, py] = P(x, y, 4); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    function data(t) {
        const mobile = W < 820, k = mobile ? .75 : 1;
        // donut
        let [x, y] = [W * .1 + mxs * 8, H * .24 + mys * 6]; const r = 38 * k;
        ctx.lineWidth = 9 * k; let ang = t * .0004;
        [[.45, c1, .4], [.3, c2, .5], [.25, c1, .22]].forEach(([v, col, al]) => {
            ctx.strokeStyle = col; ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(x, y, r, ang, ang + v * 6.28 - .08); ctx.stroke(); ang += v * 6.28;
        });
        // bars
        const bx = W * .05 + mxs * 12, by = H * .86 + mys * 8;
        for (let i = 0; i < 8; i++) {
            const h = (22 + 50 * Math.abs(Math.sin(t * .0009 + i * .9))) * k;
            ctx.globalAlpha = .3; ctx.fillStyle = c1; ctx.fillRect(bx + i * 22 * k, by - h, 14 * k, h);
            ctx.globalAlpha = .6; ctx.fillStyle = c2; ctx.fillRect(bx + i * 22 * k, by - h, 14 * k, 2);
        }
        ctx.globalAlpha = .3; ctx.strokeStyle = c1; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 6, by + 3); ctx.lineTo(bx + 8 * 22 * k, by + 3); ctx.stroke();
        if (mobile) return;
        // line chart
        const lx = W * .27 + mxs * 6, ly = H * .13 + mys * 5;
        ctx.globalAlpha = .18; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 76); ctx.lineTo(lx + 190, ly + 76); ctx.stroke();
        ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.globalAlpha = .5; ctx.beginPath();
        const pts = Array.from({ length: 12 }, (_, i) => [lx + i * 17, ly + 38 - 26 * Math.sin(i * .8 + t * .0012) - 8 * Math.sin(i * 2 + t * .002)]);
        pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
        ctx.fillStyle = c2; pts.forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 6.3); ctx.fill(); });
        // scatter + trend line
        const sx = W * .38 + mxs * 10, sy = H * .78 + mys * 7;
        ctx.fillStyle = c1; ctx.globalAlpha = .5;
        SCAT.forEach(([u, v], i) => { ctx.beginPath(); ctx.arc(sx + u * 170, sy + (v + Math.sin(t * .001 + i) * .03) * 80, 2.4, 0, 6.3); ctx.fill(); });
        ctx.strokeStyle = c2; ctx.setLineDash([5, 5]); ctx.globalAlpha = .45; ctx.beginPath();
        ctx.moveTo(sx, sy + .75 * 80); ctx.lineTo(sx + 170, sy + .25 * 80); ctx.stroke(); ctx.setLineDash([]);
    }

    function frame(t) {
        ctx.clearRect(0, 0, W, H);
        mxs += (tx - mxs) * .06; mys += (ty - mys) * .06;
        TAGS.forEach((g) => {
            ctx.font = '12px monospace'; ctx.globalAlpha = .2; ctx.fillStyle = c2;
            ctx.fillText(g.t, g.x * W + Math.sin(t * .0003 + g.p) * g.d + mxs * 18, g.y * H + Math.cos(t * .00025 + g.p) * g.d + mys * 12);
        });
        data(t);
        head(t, W < 820 ? .5 : .85);
        if (mouse.x > -999) {                                    // soft glow under the cursor
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
            g.addColorStop(0, c2); g.addColorStop(1, 'transparent');
            ctx.globalAlpha = .12; ctx.fillStyle = g; ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
        }
        ctx.globalAlpha = 1;
        if (!reduce) requestAnimationFrame(frame);
    }

    colors(); resize(); requestAnimationFrame(frame);
    window.addEventListener('resize', () => { resize(); if (reduce) frame(0); });
    window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        tx = (e.clientX / W - .5) * 2; ty = (e.clientY / H - .5) * 2;
    }, { passive: true });
    window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { mouse.x = mouse.y = -9999; tx = ty = 0; } });
    document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; tx = ty = 0; });
    new MutationObserver(() => { colors(); if (reduce) frame(0); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

// Language switch (English / Arabic with RTL)
(function () {
    const AR = {
 "About": "نبذة",
 "Education": "التعليم",
 "Skills": "المهارات",
 "Projects": "المشاريع",
 "Services": "الخدمات",
 "Let's Talk": "تواصل معي",
 "Welcome to my portfolio": "مرحباً بك في معرض أعمالي",
 "Hi, I'm": "أهلاً، أنا",
 "Ayman Zaki": "أيمن زكي",
 "AI & Machine Learning Engineer": "مهندس ذكاء اصطناعي وتعلّم الآلة",
 "I build intelligent machine learning solutions and transform data into meaningful insights that help businesses make better decisions.": "أبني حلولاً ذكية باستخدام تعلّم الآلة وأحوّل البيانات إلى رؤى مفيدة تساعد الشركات على اتخاذ قرارات أفضل.",
 "View My Projects": "شاهد مشاريعي",
 "⬇ Download CV": "⬇ تحميل السيرة الذاتية",
 "Get to know me": "تعرّف عليّ",
 "About Me": "عنّي",
 "I'm an aspiring AI & Machine Learning Engineer and Data Analyst passionate about building intelligent solutions and extracting valuable insights from data. I work with Python, machine learning and data analysis tools to solve real-world problems, and I keep growing through practical, hands-on projects.": "أنا مهندس ذكاء اصطناعي وتعلّم آلة طموح ومحلل بيانات، شغوف ببناء حلول ذكية واستخراج رؤى قيّمة من البيانات. أعمل بلغة Python وأدوات تعلّم الآلة وتحليل البيانات لحل مشكلات حقيقية، وأواصل التطور من خلال المشاريع العملية.",
 "Let's Work Together": "لنعمل معاً",
 "AI & ML": "ذكاء اصطناعي وتعلّم آلة",
 "Building machine learning models": "بناء نماذج تعلّم الآلة",
 "Data Analysis": "تحليل البيانات",
 "Turning data into insights": "تحويل البيانات إلى رؤى",
 "Data processing & programming": "معالجة البيانات والبرمجة",
 "Problem Solving": "حل المشكلات",
 "Analytical thinking & solutions": "تفكير تحليلي وحلول",
 "My education": "تعليمي",
 "Academic foundation in computer science and informatics.": "الأساس الأكاديمي في علوم الحاسب والمعلومات.",
 "Faculty of Computers and Informatics": "كلية الحاسبات والمعلومات",
 "Zagazig University": "جامعة الزقازيق",
 "Bachelor's Degree · 2025 – 2029 (Expected)": "بكالوريوس · 2025 – 2029 (متوقع)",
 "Technical expertise": "الخبرات التقنية",
 "Technologies and tools I use to build solutions.": "التقنيات والأدوات التي أستخدمها لبناء الحلول.",
 "Programming": "البرمجة",
 "Data Cleaning": "تنظيف البيانات",
 "Visualization": "تصوير البيانات",
 "Charts": "الرسوم البيانية",
 "Interactive Dashboards": "لوحات تفاعلية",
 "Machine Learning": "تعلّم الآلة",
 "Regression": "الانحدار",
 "Classification": "التصنيف",
 "Feature Engineering": "هندسة الخصائص",
 "Tools": "الأدوات",
 "Recent work": "أحدث أعمالي",
 "Selected practical projects and applications.": "مشاريع وتطبيقات عملية مختارة.",
 "Air Quality Prediction": "التنبؤ بجودة الهواء",
 "Predicts PM2.5 air pollution from a dataset of 420,000+ records. Includes data cleaning, EDA, lag and rolling-average features, model comparison with a time-based 80/20 split, and a Streamlit app for prediction and exploration.": "يتنبأ بمستويات تلوث الهواء PM2.5 من بيانات تضم أكثر من 420,000 سجل. يشمل تنظيف البيانات وتحليلها استكشافياً (EDA)، وخصائص التأخر والمتوسط المتحرك، ومقارنة النماذج بتقسيم زمني 80/20، وتطبيق Streamlit للتنبؤ والاستكشاف.",
 "View on GitHub →": "عرض على GitHub ←",
 "Excel Interactive Dashboard": "لوحة Excel تفاعلية",
 "An interactive dashboard that analyzes business data, tracks KPIs and surfaces insights through dynamic charts and slicers.": "لوحة تفاعلية تحلل بيانات الأعمال وتتابع مؤشرات الأداء وتستخرج الرؤى عبر رسوم ديناميكية وSlicers.",
 "Customer Churn Classification": "تصنيف تسرّب العملاء",
 "Classification project covering preprocessing, missing-value handling, categorical encoding, feature scaling and model evaluation.": "مشروع تصنيف يشمل المعالجة المسبقة، والتعامل مع القيم المفقودة، وترميز المتغيرات الفئوية، وتحجيم الخصائص، وتقييم النماذج.",
 "What I can do": "ماذا أقدّم",
 "Solutions that help businesses make smarter decisions.": "حلول تساعد الشركات على اتخاذ قرارات أذكى.",
 "Machine Learning Solutions": "حلول تعلّم الآلة",
 "Developing models to solve real-world problems with data preprocessing, feature engineering and rigorous evaluation.": "تطوير نماذج لحل مشكلات حقيقية مع معالجة البيانات وهندسة الخصائص وتقييم دقيق.",
 "Cleaning datasets, identifying patterns and extracting insights that support better business decisions.": "تنظيف مجموعات البيانات واكتشاف الأنماط واستخراج رؤى تدعم قرارات أعمال أفضل.",
 "Analytics": "التحليلات",
 "Building Excel and Power BI dashboards that visualize performance and track the KPIs that matter.": "بناء لوحات Excel وPower BI تعرض الأداء وتتابع مؤشرات الأداء المهمة.",
 "Business Intelligence": "ذكاء الأعمال",
 "Get in touch": "تواصل معي",
 "Have a project in mind? I'm always open to discussing new opportunities.": "هل لديك مشروع في بالك؟ يسعدني دائماً مناقشة الفرص الجديدة.",
 "Email": "البريد الإلكتروني",
 "Let's discuss your project.": "لنناقش مشروعك.",
 "Send Email ↗": "أرسل بريداً إلكترونياً",
 "Connect with me professionally.": "تواصل معي مهنياً.",
 "Visit LinkedIn ↗": "زيارة LinkedIn",
 "Explore my projects and code.": "استعرض مشاريعي وأكوادي.",
 "Visit GitHub ↗": "زيارة GitHub",
 "Contact me directly.": "تواصل معي مباشرة.",
 "Chat on WhatsApp ↗": "راسلني على واتساب",
 "© 2026 Ayman Zaki. All rights reserved. · AI & Machine Learning Engineer | Data Analyst": "© 2026 أيمن زكي. جميع الحقوق محفوظة. · مهندس ذكاء اصطناعي وتعلّم الآلة | محلل بيانات",
 "Data Visualization & Reports": "تصوير البيانات والتقارير",
 "Clear charts and visual reports that turn raw numbers into a story your team can act on.": "رسوم وتقارير مرئية واضحة تحوّل الأرقام الخام إلى قصة يمكن لفريقك البناء عليها.",
 "ML Web Apps": "تطبيقات ويب للتعلّم الآلي",
 "Interactive apps that let people try a model, explore data and see predictions, built with Streamlit.": "تطبيقات تفاعلية تتيح تجربة النموذج واستكشاف البيانات ورؤية التنبؤات، مبنية بـ Streamlit.",
 "💬 Price: shared when you contact me": "💬 السعر: يُحدد عند التواصل",
 "Get a quote →": "اطلب عرض سعر ←",
 "Every project is different, so prices are shared when you get in touch.": "كل مشروع مختلف، لذلك تُحدد الأسعار عند التواصل معي.",
 "Request a Quote": "اطلب عرض سعر",
 "Accuracy": "الدقة",
 "Home": "الرئيسية",
 "Language": "لغة برمجة",
 "Systems Language": "لغة نظم",
 "Paradigm": "نمط برمجة",
 "Database": "قاعدة بيانات",
 "Data Science": "علم البيانات",
 "Data Prep": "تجهيز البيانات",
 "Analysis": "تحليل",
 "BI Dashboards": "لوحات BI",
 "Web Apps": "تطبيقات ويب",
 "Version Control": "إدارة الإصدارات",
 "Notebooks": "دفاتر تفاعلية",
 "Data Cleaning & EDA": "تنظيف البيانات وEDA",
 "Kind words": "كلمات طيبة",
 "Testimonials": "آراء العملاء",
 "Worked with me? Share your experience, and it may appear here.": "تعاملت معي؟ شاركنا تجربتك وقد تظهر هنا.",
 "No testimonials yet. Be the first to share your experience!": "لا توجد آراء بعد. كن أول من يشارك تجربته!",
 "Leave a Testimonial": "اترك رأيك",
 "Your name": "اسمك",
 "Role / Company (optional)": "الوظيفة / الشركة (اختياري)",
 "Rating": "التقييم",
 "Your testimonial": "رأيك",
 "Send by Email": "إرسال بالبريد",
 "Send via WhatsApp": "إرسال عبر واتساب",
 "Hire me": "اعمل معي",
 "Find Me on Freelance Platforms": "ستجدني على منصات العمل الحر",
 "Prefer to work through a platform? Visit my profile and place an order.": "تفضل العمل عبر منصة؟ زر ملفي الشخصي وأنشئ طلبك.",
 "Mostaql": "مستقل",
 "Khamsat": "خمسات",
 "Nafezly": "نفذلي",
 "Kafiil": "كفيل",
 "View profile ↗": "افتح ملفي الشخصي",
 "Pipelines": "خطوط المعالجة",
 "Dashboards": "لوحات البيانات"
};
    const btn = document.getElementById('lang');
    if (!btn) return;
    const original = new WeakMap();
    const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'TITLE', 'CANVAS', 'BUTTON']);
    const titles = { en: document.title, ar: 'Ayman Zaki | مهندس ذكاء اصطناعي وتعلّم الآلة' };

    function textNodes() {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walker.nextNode())) {
            if (!n.nodeValue.trim()) continue;
            const p = n.parentElement;
            if (!p || SKIP.has(p.tagName.toUpperCase()) || p.closest('svg') || p.closest('#chat') || p.closest('.role') || p.id === 'lang') continue;
            out.push(n);
        }
        return out;
    }

    function apply(lang) {
        textNodes().forEach((n) => {
            if (!original.has(n)) original.set(n, n.nodeValue);
            const orig = original.get(n), t = orig.trim();
            n.nodeValue = lang === 'ar' && AR[t] ? orig.replace(t, AR[t]) : orig;
        });
        const root = document.documentElement;
        root.lang = lang;
        root.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.title = titles[lang];
        btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
        document.querySelectorAll('[data-ph-ar]').forEach((el) => { el.placeholder = lang === 'ar' ? el.dataset.phAr : el.dataset.phEn; });
        try { localStorage.setItem('lang', lang); } catch (e) {}
    }

    // The menu button (☰) is a BUTTON, so it is left untouched by apply()
    let saved = 'en';
    try { saved = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en'; } catch (e) {}
    if (saved === 'ar') apply('ar');
    btn.addEventListener('click', () => apply(document.documentElement.lang === 'ar' ? 'en' : 'ar'));
})();

// Floating chat assistant (rule-based, no server needed) + animated AI / data background
(function () {
    const fab = document.getElementById('chat-fab'), panel = document.getElementById('chat');
    if (!fab || !panel) return;
    const body = document.getElementById('chat-body'), quick = document.getElementById('chat-quick');
    const form = document.getElementById('chat-form'), input = document.getElementById('chat-input');
    const closeBtn = document.getElementById('chat-close'), cv = document.getElementById('chat-bg');
    const isAr = () => document.documentElement.lang === 'ar';
    const val = (e) => { const v = isAr() ? e.ar : e.en; return typeof v === 'function' ? v() : v; };
    const platHtml = () => (isAr() ? 'يمكنك العثور على أيمن على منصات العمل الحر التالية:<br>' : 'You can find Ayman on these freelance platforms:<br>') + Array.from(document.querySelectorAll('.pcard')).map((a) => '🔗 <a href="' + a.href + '" target="_blank" rel="noopener">' + (isAr() ? a.dataset.ar : a.dataset.en) + '</a>').join('<br>');

    const KB = [
        { id: 'price', k: ['price', 'pricing', 'cost', 'quote', 'how much', 'charge', 'budget', 'سعر', 'اسعار', 'أسعار', 'بكام', 'تكلفة', 'تكاليف', 'ميزانية'],
          en: 'Prices are shared when you get in touch, since every project is different. Send a short description of what you need on <a href="https://wa.me/201551637474" target="_blank" rel="noopener">WhatsApp</a> or by <a href="mailto:aymanzaki0155@gmail.com">email</a>, or use the <a href="#contact">contact section</a>.',
          ar: 'الأسعار تُحدد عند التواصل لأن كل مشروع مختلف. أرسل وصفاً مختصراً لما تحتاجه على <a href="https://wa.me/201551637474" target="_blank" rel="noopener">واتساب</a> أو عبر <a href="mailto:aymanzaki0155@gmail.com">البريد</a>، أو من <a href="#contact">قسم التواصل</a>.' },
        { id: 'services', k: ['service', 'offer', 'what can you do', 'what do you do', 'help me', 'خدمات', 'خدمة', 'تقدم', 'بتعمل', 'تعمل ايه', 'تعمل إيه'],
          en: 'Ayman offers:<br>🤖 Machine Learning Solutions<br>📊 Data Analysis and cleaning<br>📈 Interactive Dashboards (Excel / Power BI)<br>🎨 Data Visualization and Reports<br>🌐 ML Web Apps (Streamlit)<br>Prices are shared when you get in touch. <a href="#services">See the services</a>',
          ar: 'يقدّم أيمن:<br>🤖 حلول تعلّم الآلة<br>📊 تحليل البيانات وتنظيفها<br>📈 لوحات تفاعلية (Excel / Power BI)<br>🎨 تصوير البيانات والتقارير<br>🌐 تطبيقات ويب للتعلّم الآلي (Streamlit)<br>الأسعار تُحدد عند التواصل. <a href="#services">شاهد الخدمات</a>' },
        { id: 'platforms', k: ['mostaql', 'khamsat', 'nafezly', 'kafiil', 'freelance', 'platform', 'مستقل', 'خمسات', 'نفذلي', 'كفيل', 'منصات', 'منصة', 'فريلانس'],
          en: () => platHtml(), ar: () => platHtml() },
        { id: 'testimonial', k: ['testimonial', 'review', 'feedback', 'رأي', 'رايك', 'تقييم', 'شهادة'],
          en: 'Worked with Ayman? You can <a href="#testimonials">leave a testimonial</a> and share your experience.',
          ar: 'تعاملت مع أيمن؟ يمكنك <a href="#testimonials">ترك رأيك</a> ومشاركة تجربتك.' },
        { id: 'cv', k: ['cv', 'resume', 'download', 'سيرة', 'سيره', 'تحميل', 'حمل'],
          en: 'Here you go: <a href="cv/Ayman_Zaki_CV.pdf" download>Download CV</a>',
          ar: 'تفضل: <a href="cv/Ayman_Zaki_CV.pdf" download>تحميل السيرة الذاتية</a>' },
        { id: 'job', k: ['intern', 'job', 'hire', 'hiring', 'available', 'opportun', 'تدريب', 'وظيف', 'فرصة', 'فرص', 'متاح'],
          en: 'Ayman is looking for internship opportunities in AI, machine learning and data analysis. Send him a message through the <a href="#contact">contact section</a>.',
          ar: 'أيمن يبحث عن فرص تدريب في الذكاء الاصطناعي وتعلّم الآلة وتحليل البيانات. راسله من <a href="#contact">قسم التواصل</a>.' },
        { id: 'contact', k: ['contact', 'email', 'mail', 'phone', 'whatsapp', 'linkedin', 'github', 'reach', 'talk', 'تواصل', 'ايميل', 'إيميل', 'بريد', 'واتس', 'رقم', 'لينكد', 'جيت'],
          en: '📧 <a href="mailto:aymanzaki0155@gmail.com">aymanzaki0155@gmail.com</a><br>💼 <a href="https://www.linkedin.com/in/aymanelmahmoudy/" target="_blank" rel="noopener">LinkedIn</a><br>💻 <a href="https://github.com/aymanzaki0155-cmd" target="_blank" rel="noopener">GitHub</a><br>📱 <a href="https://wa.me/201551637474" target="_blank" rel="noopener">WhatsApp</a>',
          ar: '📧 <a href="mailto:aymanzaki0155@gmail.com">aymanzaki0155@gmail.com</a><br>💼 <a href="https://www.linkedin.com/in/aymanelmahmoudy/" target="_blank" rel="noopener">LinkedIn</a><br>💻 <a href="https://github.com/aymanzaki0155-cmd" target="_blank" rel="noopener">GitHub</a><br>📱 <a href="https://wa.me/201551637474" target="_blank" rel="noopener">واتساب</a>' },
        { id: 'projects', k: ['project', 'work', 'portfolio', 'air', 'dashboard', 'churn', 'مشروع', 'مشاريع', 'اعمال', 'أعمال', 'جودة', 'داشبورد'],
          en: '<b>Air Quality Prediction</b>: PM2.5 forecasting on 420K+ records (XGBoost R² 0.9547).<br><b>Excel Interactive Dashboard</b>: KPIs, Power Query and slicers.<br><b>Customer Churn Classification</b>: preprocessing, encoding, scaling and evaluation (accuracy 93%, F1 score 91.232%).<br><a href="#projects">See the projects</a>',
          ar: '<b>التنبؤ بجودة الهواء</b>: توقع PM2.5 على أكثر من 420 ألف سجل (XGBoost R² 0.9547).<br><b>لوحة Excel تفاعلية</b>: مؤشرات أداء وPower Query وSlicers.<br><b>تصنيف تسرّب العملاء</b>: معالجة وترميز وتحجيم وتقييم (الدقة 93% وF1 = 91.232%).<br><a href="#projects">شاهد المشاريع</a>' },
        { id: 'skills', k: ['skill', 'tech', 'tools', 'python', 'sql', 'stack', 'مهارات', 'مهارة', 'تقنيات', 'ادوات', 'أدوات', 'بايثون'],
          en: '<b>Programming:</b> Python, C++, OOP<br><b>Data:</b> Pandas, NumPy, Excel, Power Query, SQL<br><b>Visualization:</b> Matplotlib, Seaborn, Power BI<br><b>ML:</b> Regression, Classification, Random Forest, XGBoost, SVM, PCA<br><b>Tools:</b> Scikit-learn, Jupyter, Colab, Git',
          ar: '<b>البرمجة:</b> Python, C++, OOP<br><b>البيانات:</b> Pandas, NumPy, Excel, Power Query, SQL<br><b>التصوير:</b> Matplotlib, Seaborn, Power BI<br><b>تعلّم الآلة:</b> Regression, Classification, Random Forest, XGBoost, SVM, PCA<br><b>الأدوات:</b> Scikit-learn, Jupyter, Colab, Git' },
        { id: 'edu', k: ['education', 'study', 'university', 'college', 'degree', 'zagazig', 'faculty', 'تعليم', 'دراس', 'جامعة', 'كلية', 'الزقازيق'],
          en: "Faculty of Computers and Informatics, Zagazig University. Bachelor's degree (2025 to 2029, expected), currently in the second year.",
          ar: 'كلية الحاسبات والمعلومات، جامعة الزقازيق. بكالوريوس (2025 إلى 2029 متوقع)، وحالياً في الفرقة الثانية.' },
        { id: 'about', k: ['who', 'about', 'ayman', 'introduce', 'نبذة', 'مين', 'من هو', 'من انت', 'من أنت', 'ايمن', 'أيمن'],
          en: 'Ayman Zaki is a second-year Computer Science student at Zagazig University, passionate about AI, machine learning and data analysis. He builds ML models and interactive dashboards.',
          ar: 'أيمن زكي طالب بالفرقة الثانية في كلية الحاسبات والمعلومات بجامعة الزقازيق، شغوف بالذكاء الاصطناعي وتعلّم الآلة وتحليل البيانات، ويبني نماذج تعلّم آلة ولوحات تفاعلية.' },
        { id: 'hi', k: ['hi', 'hello', 'hey', 'مرحبا', 'اهلا', 'أهلا', 'السلام', 'هاي'],
          en: 'Hello! 👋 What would you like to know about Ayman?', ar: 'أهلاً بك! 👋 ماذا تحب أن تعرف عن أيمن؟' }
    ];
    const FALLBACK = {
        en: 'I am not sure about that, but you can ask about skills, projects, services, pricing or contact, or message Ayman on <a href="https://wa.me/201551637474" target="_blank" rel="noopener">WhatsApp</a>.',
        ar: 'لست متأكداً من ذلك، لكن يمكنك السؤال عن المهارات أو المشاريع أو الخدمات أو الأسعار أو التواصل، أو مراسلة أيمن على <a href="https://wa.me/201551637474" target="_blank" rel="noopener">واتساب</a>.' };
    const GREET = {
        en: "Hi! I'm Ayman's assistant 👋 Ask me about his skills, projects, services, pricing or how to contact him.",
        ar: 'أهلاً! أنا مساعد أيمن 👋 اسألني عن مهاراته أو مشاريعه أو خدماته أو الأسعار أو طريقة التواصل معه.' };
    const QUICK = [['skills', 'Skills', 'المهارات'], ['projects', 'Projects', 'المشاريع'], ['services', 'Services', 'الخدمات'], ['price', 'Pricing', 'الأسعار'], ['platforms', 'Platforms', 'المنصات'], ['edu', 'Education', 'التعليم'], ['contact', 'Contact', 'التواصل'], ['cv', 'Download CV', 'تحميل السيرة']];

    function add(content, who, html) {
        const d = document.createElement('div');
        d.className = 'msg ' + who;
        if (html) d.innerHTML = content; else d.textContent = content;
        body.appendChild(d); body.scrollTop = body.scrollHeight;
        return d;
    }
    function botReply(html) {
        const t = document.createElement('div');
        t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>';
        body.appendChild(t); body.scrollTop = body.scrollHeight;
        setTimeout(() => { t.remove(); add(html, 'bot', true); }, 550);
    }
    function answer(q) {
        const s = q.toLowerCase();
        const hit = KB.find((e) => e.k.some((w) => s.includes(w)));
        botReply(hit ? val(hit) : (isAr() ? FALLBACK.ar : FALLBACK.en));
    }
    function renderUI() {
        document.getElementById('chat-title').textContent = isAr() ? 'مساعد أيمن' : "Ayman's Assistant";
        document.getElementById('chat-status').textContent = isAr() ? 'متصل' : 'Online';
        input.placeholder = isAr() ? 'اسألني أي شيء...' : 'Ask me anything...';
        fab.setAttribute('aria-label', isAr() ? 'فتح الدردشة' : 'Open chat');
        quick.innerHTML = '';
        QUICK.forEach(([id, en, ar]) => {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = isAr() ? ar : en;
            b.addEventListener('click', () => {
                add(b.textContent, 'user');
                const e = KB.find((x) => x.id === id);
                botReply(val(e));
            });
            quick.appendChild(b);
        });
    }
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const v = input.value.trim();
        if (!v) return;
        add(v, 'user'); input.value = ''; answer(v);
    });
    body.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (a) toggle(false);
    });

    // ---- animated background (binary rain, bar chart, line chart, neural net) ----
    const ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, raf = 0, cols = [], c1 = '#6c8cff', c2 = '#22d3ee';
    function sizeBg() {
        const r = panel.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Array.from({ length: Math.floor(W / 22) }, (_, i) => ({ x: i * 22 + 6, y: Math.random() * H, v: 0.4 + Math.random() * 0.9 }));
    }
    function frame(t) {
        ctx.clearRect(0, 0, W, H);
        ctx.font = '13px monospace'; ctx.fillStyle = c2;
        cols.forEach((c) => {
            for (let k = 0; k < 6; k++) {
                ctx.globalAlpha = 0.22 - k * 0.035;
                ctx.fillText(((c.x * 7 + Math.floor(c.y / 16) + k) % 2) ? '1' : '0', c.x, c.y - k * 16);
            }
            if (!reduce) { c.y += c.v; if (c.y - 100 > H) { c.y = -10; c.v = 0.4 + Math.random() * 0.9; } }
        });
        const n = 9, bw = W / (n * 1.6);                       // animated bar chart
        ctx.fillStyle = c1;
        for (let i = 0; i < n; i++) {
            const bh = 20 + 60 * Math.abs(Math.sin(t * 0.0011 + i * 0.8));
            ctx.globalAlpha = 0.22;
            ctx.fillRect(14 + i * bw * 1.6, H - 12 - bh, bw, bh);
        }
        ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.globalAlpha = 0.35; ctx.beginPath();   // line chart
        const ly = (x) => H * 0.7 + Math.sin(x * 0.03 + t * 0.002) * 10 + Math.sin(x * 0.011 - t * 0.0013) * 14;
        for (let x = 0; x <= W; x += 6) x ? ctx.lineTo(x, ly(x)) : ctx.moveTo(x, ly(x));
        ctx.stroke(); ctx.fillStyle = c2; ctx.globalAlpha = 0.55;
        for (let x = 20; x < W; x += 52) { ctx.beginPath(); ctx.arc(x, ly(x), 2.6, 0, 6.3); ctx.fill(); }
        const L = [[W * 0.58, [0.38, 0.5, 0.62]], [W * 0.74, [0.33, 0.45, 0.57, 0.69]], [W * 0.9, [0.42, 0.58]]];  // neural net
        ctx.strokeStyle = c1; ctx.lineWidth = 1;
        for (let a = 0; a < L.length - 1; a++) L[a][1].forEach((ya) => L[a + 1][1].forEach((yb) => {
            ctx.globalAlpha = 0.06 + 0.2 * (Math.sin(t * 0.003 - a * 1.3 + ya * 6) + 1) / 2;
            ctx.beginPath(); ctx.moveTo(L[a][0], ya * H); ctx.lineTo(L[a + 1][0], yb * H); ctx.stroke();
        }));
        ctx.fillStyle = c1; ctx.globalAlpha = 0.5;
        L.forEach(([x, ys]) => ys.forEach((y) => { ctx.beginPath(); ctx.arc(x, y * H, 4, 0, 6.3); ctx.fill(); }));
        ctx.globalAlpha = 1;
        if (!reduce && panel.classList.contains('open')) raf = requestAnimationFrame(frame);
    }
    function startBg() {
        const s = getComputedStyle(document.documentElement);
        c1 = s.getPropertyValue('--accent').trim() || c1; c2 = s.getPropertyValue('--accent2').trim() || c2;
        sizeBg(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    }

    let greeted = false;
    function toggle(open) {
        panel.classList.toggle('open', open); fab.classList.toggle('open', open);
        fab.setAttribute('aria-expanded', String(open)); panel.setAttribute('aria-hidden', String(!open));
        if (open) {
            if (!greeted) { greeted = true; add(isAr() ? GREET.ar : GREET.en, 'bot'); }
            startBg(); setTimeout(() => input.focus(), 250);
        } else { cancelAnimationFrame(raf); }
    }
    fab.addEventListener('click', () => toggle(!panel.classList.contains('open')));
    closeBtn.addEventListener('click', () => { toggle(false); fab.focus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) toggle(false); });
    window.addEventListener('resize', () => { if (panel.classList.contains('open')) { sizeBg(); if (reduce) frame(0); } });
    new MutationObserver(renderUI).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    renderUI();
})();

// Typing effect for the hero role: alternates between the two titles, forever
(function () {
    const el = document.getElementById('typed');
    if (!el) return;
    const ROLES = {
        en: ['AI & Machine Learning Engineer', 'Data Analyst'],
        ar: ['مهندس ذكاء اصطناعي وتعلّم الآلة', 'محلل بيانات']
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = 0, run = 0;

    function start() {
        clearTimeout(timer);
        const id = ++run;
        const list = ROLES[document.documentElement.lang === 'ar' ? 'ar' : 'en'];
        if (reduce) { el.textContent = list.join(' | '); return; }
        let i = 0, n = Array.from(list[0]).length, deleting = true;
        el.textContent = list[0];
        (function tick() {
            if (id !== run) return;
            const chars = Array.from(list[i]);
            if (!deleting) {
                n++; el.textContent = chars.slice(0, n).join('');
                if (n >= chars.length) { deleting = true; timer = setTimeout(tick, 1700); return; }
                timer = setTimeout(tick, 70);
            } else {
                n--; el.textContent = chars.slice(0, Math.max(n, 0)).join('');
                if (n <= 0) { deleting = false; i = (i + 1) % list.length; timer = setTimeout(tick, 350); return; }
                timer = setTimeout(tick, 35);
            }
        })();
    }
    // first pass: show the full title for a moment, then start the loop
    timer = 0; start();
    new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();

// Testimonials: wall (add approved ones below) + form that sends to Ayman by email / WhatsApp
(function () {
    const form = document.getElementById('t-form');
    if (!form) return;
    const T = (en, ar) => (document.documentElement.lang === 'ar' ? ar : en);
    // Add approved testimonials here, e.g. { name: 'Sara Ahmed', role: 'Data Team Lead', rating: 5, text: '...' }
    const TESTIMONIALS = [];
    const wall = document.getElementById('t-wall'), status = document.getElementById('t-status');
    const starsBox = document.getElementById('t-stars');
    let rating = 0;

    const stars = [1, 2, 3, 4, 5].map((n) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = '★'; b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', n + ' / 5'); b.setAttribute('aria-checked', 'false');
        b.addEventListener('click', () => { rating = n; paint(); });
        starsBox.appendChild(b); return b;
    });
    function paint() {
        stars.forEach((b, i) => { b.classList.toggle('on', i < rating); b.setAttribute('aria-checked', String(i + 1 === rating)); });
    }

    if (TESTIMONIALS.length) {
        wall.innerHTML = '';
        TESTIMONIALS.forEach((t) => {
            const c = document.createElement('div'); c.className = 'fcard tq';
            const r = document.createElement('div'); r.className = 'rate'; r.textContent = '★'.repeat(t.rating || 5);
            const q = document.createElement('p'); q.textContent = '“' + t.text + '”';
            const n = document.createElement('b'); n.textContent = t.name;
            const s = document.createElement('small'); s.textContent = t.role || '';
            c.append(r, q, n, s); wall.appendChild(c);
        });
    }

    function compose() {
        const name = document.getElementById('t-name').value.trim();
        const role = document.getElementById('t-role').value.trim();
        const msg = document.getElementById('t-msg').value.trim();
        return 'Testimonial for Ayman Zaki\n\nName: ' + name + (role ? '\nRole / Company: ' + role : '') +
            '\nRating: ' + '★'.repeat(rating) + ' (' + rating + '/5)\n\n' + msg;
    }
    function valid() {
        if (!form.reportValidity()) return false;
        if (!rating) { status.textContent = T('Please choose a star rating first.', 'من فضلك اختر التقييم بالنجوم أولاً.'); return false; }
        return true;
    }
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!valid()) return;
        window.location.href = 'mailto:aymanzaki0155@gmail.com?subject=' + encodeURIComponent('Testimonial for Ayman Zaki') + '&body=' + encodeURIComponent(compose());
        status.textContent = T('Thank you! Your email app should open. If it does not, use WhatsApp.', 'شكراً لك! سيفتح تطبيق البريد. إن لم يفتح استخدم واتساب.');
    });
    document.getElementById('t-wa').addEventListener('click', () => {
        if (!valid()) return;
        window.open('https://wa.me/201551637474?text=' + encodeURIComponent(compose()), '_blank', 'noopener');
        status.textContent = T('Thank you! WhatsApp should open with your message ready to send.', 'شكراً لك! سيفتح واتساب برسالتك جاهزة للإرسال.');
    });
})();

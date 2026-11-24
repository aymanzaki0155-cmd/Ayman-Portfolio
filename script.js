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
 "© 2026 Ayman Zaki. All rights reserved. · AI & Machine Learning Engineer | Data Analyst": "© 2026 أيمن زكي. جميع الحقوق محفوظة. · مهندس ذكاء اصطناعي وتعلّم الآلة | محلل بيانات"
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
            if (!p || SKIP.has(p.tagName.toUpperCase()) || p.closest('svg') || p.id === 'lang') continue;
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
        try { localStorage.setItem('lang', lang); } catch (e) {}
    }

    // The menu button (☰) is a BUTTON, so it is left untouched by apply()
    let saved = 'en';
    try { saved = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en'; } catch (e) {}
    if (saved === 'ar') apply('ar');
    btn.addEventListener('click', () => apply(document.documentElement.lang === 'ar' ? 'en' : 'ar'));
})();

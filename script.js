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
            if (!p || SKIP.has(p.tagName.toUpperCase()) || p.closest('svg') || p.closest('#chat') || p.id === 'lang') continue;
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

// Floating chat assistant (rule-based, no server needed) + animated AI / data background
(function () {
    const fab = document.getElementById('chat-fab'), panel = document.getElementById('chat');
    if (!fab || !panel) return;
    const body = document.getElementById('chat-body'), quick = document.getElementById('chat-quick');
    const form = document.getElementById('chat-form'), input = document.getElementById('chat-input');
    const closeBtn = document.getElementById('chat-close'), cv = document.getElementById('chat-bg');
    const isAr = () => document.documentElement.lang === 'ar';

    const KB = [
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
          en: '<b>Air Quality Prediction</b>: PM2.5 forecasting on 420K+ records (XGBoost R² 0.9547).<br><b>Excel Interactive Dashboard</b>: KPIs, Power Query and slicers.<br><b>Customer Churn Classification</b>: preprocessing, encoding, scaling and evaluation.<br><a href="#projects">See the projects</a>',
          ar: '<b>التنبؤ بجودة الهواء</b>: توقع PM2.5 على أكثر من 420 ألف سجل (XGBoost R² 0.9547).<br><b>لوحة Excel تفاعلية</b>: مؤشرات أداء وPower Query وSlicers.<br><b>تصنيف تسرّب العملاء</b>: معالجة وترميز وتحجيم وتقييم.<br><a href="#projects">شاهد المشاريع</a>' },
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
        en: 'I am not sure about that, but you can ask about skills, projects, education or contact, or message Ayman on <a href="https://wa.me/201551637474" target="_blank" rel="noopener">WhatsApp</a>.',
        ar: 'لست متأكداً من ذلك، لكن يمكنك السؤال عن المهارات أو المشاريع أو التعليم أو التواصل، أو مراسلة أيمن على <a href="https://wa.me/201551637474" target="_blank" rel="noopener">واتساب</a>.' };
    const GREET = {
        en: "Hi! I'm Ayman's assistant 👋 Ask me about his skills, projects, education, or how to contact him.",
        ar: 'أهلاً! أنا مساعد أيمن 👋 اسألني عن مهاراته أو مشاريعه أو دراسته أو طريقة التواصل معه.' };
    const QUICK = [['skills', 'Skills', 'المهارات'], ['projects', 'Projects', 'المشاريع'], ['edu', 'Education', 'التعليم'], ['contact', 'Contact', 'التواصل'], ['cv', 'Download CV', 'تحميل السيرة']];

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
        botReply(hit ? (isAr() ? hit.ar : hit.en) : (isAr() ? FALLBACK.ar : FALLBACK.en));
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
                botReply(isAr() ? e.ar : e.en);
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

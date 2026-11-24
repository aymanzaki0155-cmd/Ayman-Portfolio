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

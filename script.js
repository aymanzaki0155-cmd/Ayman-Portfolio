// Select all sections and cards
const revealElements = document.querySelectorAll(
    '.about, .skills, .projects, .services, .certificates, .contact, .about-card, .skill-card, .project-card, .service-card, .certificate-card, .contact-card'
);

// Add reveal class
revealElements.forEach((element) => {
    element.classList.add('reveal');
});

// Create observer
const observer = new IntersectionObserver((entries) => {

    entries.forEach((entry) => {

        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }

    });

}, {
    threshold: 0.15
});

// Observe elements
revealElements.forEach((element) => {
    '.education'
    observer.observe(element);
});


// Mobile Navigation

const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.navbar ul');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});


// Close mobile menu after clicking a link

const navItems = document.querySelectorAll('.navbar ul a');

navItems.forEach((link) => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});
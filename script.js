/**
 * ORÍKÌ AI — STAGE 1 — PREMIUM LANDING PAGE JS
 * Highly optimized, performance-minded vanilla JS enhancement script.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initAmbientLightFollow();
    initWatermarkParallax();
    initSmoothScroll();
    initCtaScroll();
});

/**
 * Mobile Navigation Drawer Toggle Action
 */
function initMobileNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = navLinks.classList.contains('active');

        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Close menu when clicking on any link
    const links = navLinks.querySelectorAll('.nav-link, .nav-button');
    links.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });

    function openMobileMenu() {
        navLinks.classList.add('active');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeMobileMenu() {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Unlock background scroll
    }
}

/**
 * Subtle Ambient Backlight Glow Tracking mouse movement
 */
function initAmbientLightFollow() {
    const ambientGlow = document.getElementById('ambientGlow');
    if (!ambientGlow) return;

    // Respect user movement preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        ambientGlow.style.display = 'none';
        return;
    }

    let isThrottled = false;

    document.addEventListener('mousemove', (e) => {
        if (isThrottled) return;
        isThrottled = true;

        requestAnimationFrame(() => {
            // Smoothly move the glow to center at the cursor position
            ambientGlow.style.left = `${e.clientX}px`;
            ambientGlow.style.top = `${e.clientY}px`;
            isThrottled = false;
        });
    });
}

/**
 * Extremely subtle cinematic parallax on the giant background watermark on scroll
 */
function initWatermarkParallax() {
    const watermarkImg = document.querySelector('.watermark-img');
    if (!watermarkImg) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let isThrottled = false;

    window.addEventListener('scroll', () => {
        if (isThrottled) return;
        isThrottled = true;

        requestAnimationFrame(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            // Extremely slow translation: 1px movement for every 15px scrolled
            const translateY = scrollTop / 15;
            // Extremely slow scale-up: 0.01 multiplier for every 1000px scrolled
            const scale = 1 + (scrollTop / 10000);

            watermarkImg.style.transform = `translateY(${translateY}px) scale(${scale})`;
            isThrottled = false;
        });
    });
}

/**
 * Smooth internal page scroll with focus management for navigation links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;

            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                e.preventDefault();
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Set focus for keyboard accessibility
                targetSection.setAttribute('tabindex', '-1');
                targetSection.focus({ preventScroll: true });
            }
        });
    });
}

/**
 * Stage 1 Button Interaction for "ENTER ORÍKÌ" and "EXPLORE THE INTELLIGENCE"
 * Scrolls down smoothly to relevant locations or showcases beautiful animation feedback
 */
function initCtaScroll() {
    const enterBtn = document.getElementById('ctaEnterBtn');
    if (!enterBtn) return;

    enterBtn.addEventListener('click', () => {
        // Stage 1 Action: provide polished visual feedback and smooth scroll back to hero or top
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Subtle temporary accent glow feedback on title
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.style.textShadow = '0 0 25px rgba(212, 175, 55, 0.5)';
                setTimeout(() => {
                    heroTitle.style.textShadow = '';
                }, 2000);
            }
        }
    });
}
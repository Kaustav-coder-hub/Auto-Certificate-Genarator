/**
 * Modern UI Interactions
 * Custom Cursor, Dark Mode, Smooth Animations
 */

// ============================================
// CUSTOM CURSOR
// ============================================
class CustomCursor {
    constructor() {
        this.dot = document.createElement('div');
        this.outline = document.createElement('div');
        
        this.dot.className = 'cursor-dot';
        this.outline.className = 'cursor-outline';
        
        document.body.appendChild(this.dot);
        document.body.appendChild(this.outline);
        
        this.dotPos = { x: 0, y: 0 };
        this.outlinePos = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.dotPos.x = e.clientX;
            this.dotPos.y = e.clientY;
            
            this.dot.style.left = this.dotPos.x + 'px';
            this.dot.style.top = this.dotPos.y + 'px';
        });
        
        // Smooth follow for outline
        const animateOutline = () => {
            this.outlinePos.x += (this.dotPos.x - this.outlinePos.x) * 0.15;
            this.outlinePos.y += (this.dotPos.y - this.outlinePos.y) * 0.15;
            
            this.outline.style.left = (this.outlinePos.x - 20) + 'px';
            this.outline.style.top = (this.outlinePos.y - 20) + 'px';
            
            requestAnimationFrame(animateOutline);
        };
        animateOutline();
        
        // Expand on hoverable elements
        const hoverables = document.querySelectorAll('a, button, input, .card-3d, .btn-modern');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.outline.classList.add('expand');
                this.dot.style.transform = 'scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                this.outline.classList.remove('expand');
                this.dot.style.transform = 'scale(1)';
            });
        });
    }
}

// ============================================
// DARK MODE TOGGLE
// ============================================
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.toggle = null;
        this.init();
    }
    
    init() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Create toggle button if doesn't exist
        this.createToggle();
        
        // Listen for toggle clicks
        this.toggle.addEventListener('click', () => this.switch());
    }
    
    createToggle() {
        let existing = document.querySelector('.theme-toggle');
        if (existing) {
            this.toggle = existing;
            // Apply current theme state to existing toggle
            if (this.theme === 'dark') {
                this.toggle.classList.add('dark');
            } else {
                this.toggle.classList.remove('dark');
            }
            return;
        }
        
        this.toggle = document.createElement('div');
        this.toggle.className = 'theme-toggle';
        if (this.theme === 'dark') {
            this.toggle.classList.add('dark');
        }
        
        const slider = document.createElement('div');
        slider.className = 'theme-toggle-slider';
        
        this.toggle.appendChild(slider);
        this.toggle.setAttribute('data-tooltip', 'Toggle theme');
        this.toggle.classList.add('tooltip');
        document.body.appendChild(this.toggle);
    }
    
    switch() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        if (this.theme === 'dark') {
            this.toggle.classList.add('dark');
        } else {
            this.toggle.classList.remove('dark');
        }
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: this.theme } }));
    }
}

// ============================================
// ANIMATED BACKGROUND
// ============================================
function createAnimatedBackground() {
    let bg = document.querySelector('.animated-bg');
    if (!bg) {
        bg = document.createElement('div');
        bg.className = 'animated-bg';
        document.body.prepend(bg);
    }
    
    // Create floating blobs
    for (let i = 1; i <= 3; i++) {
        if (!document.querySelector(`.blob-${i}`)) {
            const blob = document.createElement('div');
            blob.className = `blob blob-${i}`;
            bg.appendChild(blob);
        }
    }
}

// ============================================
// SMOOTH SCROLL TO ANCHORS
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// PARALLAX EFFECT ON SCROLL
// ============================================
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const speed = el.getAttribute('data-parallax') || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// ============================================
// FORM INPUT ANIMATIONS
// ============================================
function initFormAnimations() {
    const inputs = document.querySelectorAll('.input-modern');
    
    inputs.forEach(input => {
        // Add floating label effect
        const wrapper = input.parentElement;
        
        input.addEventListener('focus', () => {
            wrapper.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                wrapper.classList.remove('focused');
            }
        });
        
        // Check if pre-filled
        if (input.value) {
            wrapper.classList.add('focused');
        }
    });
}

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
    ripple.classList.add('ripple');
    
    const existingRipple = button.getElementsByClassName('ripple')[0];
    if (existingRipple) {
        existingRipple.remove();
    }
    
    button.appendChild(ripple);
}

// Add ripple CSS dynamically
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn-modern {
        position: relative;
        overflow: hidden;
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ============================================
// NUMBER COUNTER ANIMATION
// ============================================
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ============================================
// CARD TILT EFFECT (3D)
// ============================================
function init3DCardTilt() {
    const cards = document.querySelectorAll('.card-3d');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-10px)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

// ============================================
// PROGRESS BAR ANIMATION
// ============================================
function animateProgressBar(element, targetPercentage, duration = 1000) {
    let current = 0;
    const increment = targetPercentage / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetPercentage) {
            element.style.width = targetPercentage + '%';
            clearInterval(timer);
        } else {
            element.style.width = current + '%';
        }
    }, 16);
}

// ============================================
// INITIALIZE ALL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom cursor (desktop only)
    if (window.innerWidth > 768) {
        new CustomCursor();
    }
    
    // Initialize theme manager
    new ThemeManager();
    
    // Create animated background
    createAnimatedBackground();
    
    // Initialize smooth scroll
    initSmoothScroll();
    
    // Initialize parallax
    initParallax();
    
    // Initialize form animations
    initFormAnimations();
    
    // Initialize 3D card tilt
    init3DCardTilt();
    
    // Add ripple effect to all modern buttons
    document.querySelectorAll('.btn-modern').forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Animate counters if any exist
    document.querySelectorAll('[data-counter]').forEach(el => {
        const target = parseInt(el.getAttribute('data-counter'));
        animateCounter(el, target);
    });
    
    // Animate progress bars if any exist
    document.querySelectorAll('.progress-bar-fill[data-progress]').forEach(el => {
        const target = parseInt(el.getAttribute('data-progress'));
        animateProgressBar(el, target);
    });
    
    console.log('✨ Modern UI initialized successfully!');
});

// ============================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================
window.ModernUI = {
    CustomCursor,
    ThemeManager,
    animateCounter,
    animateProgressBar,
    createRipple
};

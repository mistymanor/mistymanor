(function() {
    // ========================================================
    // ELEMENT SELECTION CONFIGURATION
    // ========================================================
    
    // Content elements - these will have fade-in and variable opacity effects
    // Text, images, buttons, and other focal content
    const contentElements = [
        '.main-content h1',
        '.main-content h2',
        '.main-content h3',
        '.main-content p',
        '.main-content li',
        '.main-content img',
        '.hero-text',
        '.contact-info',
        '.buttons a',
        '.btn',
        '.card-content',
        '.feature-text',
        '.testimonial-text',
        '.gallery-item img',
        '.service-description',
        'article p',
        'article h1',
        'article h2',
        'article h3',
        'article img',
        '.feature-box p',
        '.feature-box h3',
        '.feature-box img'
    ];
    
    // Background elements - these will be visible immediately and stay fully visible
    // Structural containers, backgrounds, and layout elements
    const backgroundElements = [
        'header',
        'footer',
        '.hero',
        '.container',
        '.wrapper',
        '.section-wrapper',
        '.background',
        'section',
        'article',
        '.feature-box',
        '.about-section',
        '.services-section',
        '.testimonials',
        '.gallery-item'
    ];
    
    // Elements to completely exclude from any animations
    const excludedElements = [
        '.hamburger-menu',
        '.mobile-nav',
        '.mobile-menu',
        '.mobile-nav-container',
        '.mobile-nav-header',
        '.close-btn',
        '*[data-no-fade="true"]',  // Any element with data-no-fade="true" will be excluded
        'footer',
        'footer *'
    ];

    // Configuration for the focus effect (only applies to content elements)
    const focusConfig = {
        minOpacity: 0.6,      // Minimum opacity for elements at the edge of the viewport
        maxOpacity: 1.0,      // Maximum opacity for elements at the center of the viewport
        transitionSpeed: 0.2, // Speed of opacity transitions in seconds
        enabled: true         // Toggle to enable/disable the focus effect
    };
    
    // ========================================================
    // HELPER FUNCTIONS
    // ========================================================
    
    // Helper function to determine if an element should be completely excluded
    function shouldExcludeElement(element) {
        // Check if the element or any of its ancestors have data-no-fade="true"
        if (element.closest('[data-no-fade="true"]')) {
            return true;
        }
        
        // Check if element matches any excluded selectors
        return excludedElements.some(excludedSelector => 
            element.matches(excludedSelector) || element.querySelector(excludedSelector)
        );
    }
    
    // Helper function to determine if an element is a background element
    function isBackgroundElement(element) {
        return backgroundElements.some(bgSelector => 
            element.matches(bgSelector)
        );
    }
    
    // ========================================================
    // INITIALIZE ELEMENTS
    // ========================================================
    
    // Arrays to store elements for animation
    const elementsToAnimate = []; // Content elements with fade-in and variable opacity
    const immediateElements = []; // Background elements that become visible immediately
    
    // Initialize background elements (visible immediately, always full opacity)
    backgroundElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Skip elements that match the excluded selectors
            if (!shouldExcludeElement(el)) {
                // Add to immediate elements array
                immediateElements.push(el);
                
                // Make background elements visible immediately with full opacity
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Initialize content elements (fade in with variable opacity)
    contentElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Skip elements that match excluded selectors or are descendants of background elements
            if (!shouldExcludeElement(el) && !isBackgroundElement(el)) {
                el.classList.add('animated-element');
                // Add transition for smooth opacity changes
                el.style.transition = `opacity 0.6s ease-out, transform 0.6s ease-out, opacity ${focusConfig.transitionSpeed}s ease-out`;
                elementsToAnimate.push(el);
            }
        });
    });
    
    // ========================================================
    // INTERSECTION OBSERVER SETUP
    // ========================================================
    
    // Create intersection observer to detect when elements enter/exit the viewport
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px', // No margin around the root
        threshold: 0.15 // Trigger when 15% of the element is visible
    };
    
    // Define the intersection observer callback function
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            // Add the fade-in class when the element enters the viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                // Mark this element as visible for the focus effect
                entry.target.dataset.visible = 'true';
            } else {
                // Remove the fade-in class when the element exits the viewport
                // This allows the animation to occur again when scrolled back into view
                entry.target.classList.remove('fade-in');
                // Mark as not visible and reset opacity
                entry.target.dataset.visible = 'false';
                entry.target.style.opacity = '';
            }
        });
    };
    
    // Create the observer instance
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Calculate how centered an element is in the viewport
    // Returns a value between 0 (edge of viewport) and 1 (center of viewport)
    function calculateViewportCenterFactor(element) {
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + (rect.height / 2);
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        
        // Calculate distance from center (normalized to 0-1)
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        const maxDistance = viewportHeight / 2;
        
        // Convert to a factor where 1 is center and 0 is edge
        return 1 - Math.min(distanceFromCenter / maxDistance, 1);
    }
    
    // Update opacity based on element position in viewport
    function updateElementOpacity(element) {
        if (element.dataset.visible !== 'true') return;
        
        const centerFactor = calculateViewportCenterFactor(element);
        
        // Calculate opacity based on center factor
        const opacity = focusConfig.minOpacity + 
            ((focusConfig.maxOpacity - focusConfig.minOpacity) * centerFactor);
        
        // Apply opacity
        element.style.opacity = opacity;
    }
    
    // Update all visible elements' opacities
    function updateAllElementOpacities() {
        if (!focusConfig.enabled) return;
        
        elementsToAnimate.forEach(element => {
            if (element.dataset.visible === 'true') {
                updateElementOpacity(element);
            }
        });
    }
    
    // Use requestAnimationFrame for smooth animations during scroll
    let ticking = false;
    
    // Add scroll listener to update opacities
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateAllElementOpacities();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // ========================================================
    // INITIAL VISIBILITY HANDLING
    // ========================================================
    
    // Special case - handle initial above-the-fold content differently
    // Elements already visible when the page loads should animate immediately
    const handleInitialVisibility = () => {
        // Get viewport height
        const viewportHeight = window.innerHeight;
        
        // Background elements are made visible immediately
        immediateElements.forEach(element => {
            // No animation, just ensure it's visible
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
        
        // Content elements that are initially visible animate with a short delay
        elementsToAnimate.forEach(element => {
            const rect = element.getBoundingClientRect();
            // If element is in the initial viewport, animate immediately
            if (rect.top < viewportHeight) {
                // Add a small delay for a nicer initial loading effect
                setTimeout(() => {
                    element.classList.add('fade-in');
                    element.dataset.visible = 'true';
                    updateElementOpacity(element);
                }, 100);
            }
            
            // Observe the element for future scroll interactions
            observer.observe(element);
        });
        
        // Initial update of opacities
        updateAllElementOpacities();
    };
    
    // Handle elements already in view on page load
    if (document.readyState === 'complete') {
        handleInitialVisibility();
    } else {
        window.addEventListener('load', handleInitialVisibility);
    }
    
    // Update opacities on window resize
    window.addEventListener('resize', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateAllElementOpacities();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Performance optimization: Disconnect observer when all animations have played once
    let allAnimated = false;
    
    // Optional: Add a scroll listener to check if we've scrolled to the bottom
    // This can help optimize by disconnecting the observer when no more animations are likely
    window.addEventListener('scroll', () => {
        if (allAnimated) return;
        
        // Check if we've scrolled to near the bottom of the page
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= pageHeight - 200) {
            // We've reached the bottom, check if all elements have been animated
            const notAnimated = elementsToAnimate.filter(el => 
                !el.classList.contains('fade-in')
            );
            
            if (notAnimated.length === 0) {
                // All elements have been animated at least once
                allAnimated = true;
                // We could disconnect the observer here, but since we want 
                // elements to re-animate when scrolling back up and to 
                // continue updating opacity based on viewport position,
                // we'll keep everything connected
            }
        }
    }, { passive: true }); // Use passive listener for performance
})();
